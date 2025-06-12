/**
 * RPC Connection Manager
 * 
 * Centralized management of RPC connections across all blockchain networks
 * Provides connection pooling, health monitoring, load balancing, and failover
 */

import type { SupportedChain, NetworkType, HealthStatus } from '../adapters/IBlockchainAdapter';
import { generateRPCConfigs, validateRPCConfig } from './RPCConfigReader';

export interface RPCConfig {
  id: string;
  chain: SupportedChain;
  networkType: NetworkType;
  url: string;
  websocketUrl?: string;
  apiKey?: string;
  priority: number; // 1 = highest priority
  maxConnections: number;
  timeoutMs: number;
  isActive: boolean;
  healthCheckUrl?: string;
}

export interface RPCProvider {
  config: RPCConfig;
  connectionCount: number;
  lastHealthCheck: number;
  healthStatus: HealthStatus;
  consecutiveFailures: number;
}

export interface LoadBalancingStrategy {
  type: 'round-robin' | 'priority' | 'health-based' | 'latency-based';
  failoverEnabled: boolean;
  maxRetries: number;
}

/**
 * Generate RPC configurations from environment variables
 * This replaces hardcoded configurations with environment-driven setup
 */
function getEnvironmentRPCConfigs(): RPCConfig[] {
  const configs = generateRPCConfigs();
  const isDevelopment = import.meta.env.DEV || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  
  // Validate all configurations
  const validConfigs = configs.filter(config => {
    const isValid = validateRPCConfig(config);
    if (!isValid && !isDevelopment) {
      console.warn(`Invalid RPC configuration for ${config.chain}-${config.networkType}:`, config);
    }
    return isValid;
  });

  if (validConfigs.length === 0) {
    console.warn('No valid RPC configurations found in environment variables');
  }

  return validConfigs;
}

/**
 * RPC Connection Manager class
 */
export class RPCConnectionManager {
  private providers = new Map<string, RPCProvider>();
  private strategy: LoadBalancingStrategy = {
    type: 'health-based',
    failoverEnabled: true,
    maxRetries: 3
  };
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeDefaultProviders();
    this.startHealthMonitoring();
  }

  /**
   * Initialize RPC providers from environment variables
   */
  private initializeDefaultProviders(): void {
    const configs = getEnvironmentRPCConfigs();
    
    if (configs.length === 0) {
      console.warn('No RPC configurations loaded from environment. Please check your .env file.');
      return;
    }

    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      console.debug(`RPCConnectionManager: Loading ${configs.length} RPC configurations from environment`);
    } else {
      console.log(`Loading ${configs.length} RPC configurations from environment`);
    }
    
    for (const config of configs) {
      this.addProvider(config);
    }
  }

  /**
   * Add a new RPC provider
   */
  addProvider(config: RPCConfig): void {
    const provider: RPCProvider = {
      config,
      connectionCount: 0,
      lastHealthCheck: 0,
      healthStatus: {
        isHealthy: true,
        latency: 0,
        lastChecked: Date.now()
      },
      consecutiveFailures: 0
    };

    this.providers.set(config.id, provider);
  }

  /**
   * Remove an RPC provider
   */
  removeProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  /**
   * Update provider configuration
   */
  updateProvider(id: string, updates: Partial<RPCConfig>): boolean {
    const provider = this.providers.get(id);
    if (!provider) return false;

    provider.config = { ...provider.config, ...updates };
    return true;
  }

  /**
   * Get optimal provider for a chain/network combination
   */
  getOptimalProvider(chain: SupportedChain, networkType: NetworkType = 'mainnet'): RPCProvider | null {
    const availableProviders = this.getAvailableProviders(chain, networkType);
    
    if (availableProviders.length === 0) {
      return null;
    }

    switch (this.strategy.type) {
      case 'priority':
        return this.selectByPriority(availableProviders);
      
      case 'health-based':
        return this.selectByHealth(availableProviders);
      
      case 'latency-based':
        return this.selectByLatency(availableProviders);
      
      case 'round-robin':
      default:
        return this.selectRoundRobin(availableProviders);
    }
  }

  /**
   * Get all available providers for a chain/network
   */
  private getAvailableProviders(chain: SupportedChain, networkType: NetworkType): RPCProvider[] {
    return Array.from(this.providers.values()).filter(provider => 
      provider.config.chain === chain && 
      provider.config.networkType === networkType &&
      provider.config.isActive &&
      provider.healthStatus.isHealthy &&
      provider.connectionCount < provider.config.maxConnections
    );
  }

  /**
   * Selection strategies
   */
  private selectByPriority(providers: RPCProvider[]): RPCProvider {
    return providers.sort((a, b) => a.config.priority - b.config.priority)[0];
  }

  private selectByHealth(providers: RPCProvider[]): RPCProvider {
    const healthyProviders = providers.filter(p => p.consecutiveFailures === 0);
    if (healthyProviders.length > 0) {
      return this.selectByLatency(healthyProviders);
    }
    return this.selectByPriority(providers);
  }

  private selectByLatency(providers: RPCProvider[]): RPCProvider {
    return providers.sort((a, b) => a.healthStatus.latency - b.healthStatus.latency)[0];
  }

  private selectRoundRobin(providers: RPCProvider[]): RPCProvider {
    return providers.sort((a, b) => a.connectionCount - b.connectionCount)[0];
  }

  /**
   * Handle connection acquisition
   */
  async acquireConnection(chain: SupportedChain, networkType: NetworkType = 'mainnet'): Promise<RPCProvider | null> {
    const provider = this.getOptimalProvider(chain, networkType);
    if (!provider) {
      return null;
    }

    provider.connectionCount++;
    return provider;
  }

  /**
   * Handle connection release
   */
  releaseConnection(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (provider && provider.connectionCount > 0) {
      provider.connectionCount--;
    }
  }

  /**
   * Report connection failure
   */
  reportFailure(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.consecutiveFailures++;
      
      // Mark as unhealthy after 3 consecutive failures
      if (provider.consecutiveFailures >= 3) {
        provider.healthStatus.isHealthy = false;
      }
    }
  }

  /**
   * Report successful connection
   */
  reportSuccess(providerId: string, latency: number): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.consecutiveFailures = 0;
      provider.healthStatus.isHealthy = true;
      provider.healthStatus.latency = latency;
      provider.healthStatus.lastChecked = Date.now();
    }
  }

  /**
   * Perform health check on a provider
   * Modified to be more browser-friendly and less aggressive in development
   */
  async checkProviderHealth(provider: RPCProvider): Promise<HealthStatus> {
    const startTime = Date.now();
    
    // Skip health checks in development to avoid CORS issues
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    if (isDevelopment) {
      return {
        isHealthy: true, // Assume healthy in development
        latency: 0,
        lastChecked: Date.now()
      };
    }
    
    try {
      let healthCheckUrl = provider.config.healthCheckUrl || provider.config.url;
      
      // For WebSocket URLs, convert to HTTP for health check
      if (healthCheckUrl.startsWith('wss://')) {
        healthCheckUrl = healthCheckUrl.replace('wss://', 'https://');
      } else if (healthCheckUrl.startsWith('ws://')) {
        healthCheckUrl = healthCheckUrl.replace('ws://', 'http://');
      }

      // Skip health checks for known problematic endpoints
      if (this.shouldSkipHealthCheck(healthCheckUrl)) {
        return {
          isHealthy: true, // Assume healthy for skipped endpoints
          latency: 0,
          lastChecked: Date.now()
        };
      }

      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(Math.min(provider.config.timeoutMs, 5000)) // Cap timeout at 5s
      });

      const latency = Date.now() - startTime;
      const isHealthy = response.ok;

      return {
        isHealthy,
        latency,
        lastChecked: Date.now()
      };
    } catch (error) {
      // Silently handle errors in development to prevent console spam
      if (isDevelopment) {
        // Only log significant errors, not CORS or network issues
        if (!(error instanceof TypeError && error.message.includes('fetch'))) {
          console.debug(`RPC health check failed for ${provider.config.id}:`, error.message);
        }
      }

      return {
        isHealthy: false,
        latency: Date.now() - startTime,
        lastChecked: Date.now()
      };
    }
  }

  /**
   * Check if health check should be skipped for problematic endpoints
   */
  private shouldSkipHealthCheck(url: string): boolean {
    const problematicDomains = [
      'alchemy.com',     // CORS issues in browser
      'quiknode.pro',    // Authentication issues
      'infura.io',       // CORS issues
      'blockstream.info' // Rate limiting
    ];

    return problematicDomains.some(domain => url.includes(domain));
  }

  /**
   * Start automated health monitoring
   * Modified to be less aggressive in development environment
   */
  private startHealthMonitoring(): void {
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    
    // Skip health monitoring in development to prevent console spam
    if (isDevelopment) {
      console.debug('RPCConnectionManager: Skipping health monitoring in development mode');
      return;
    }

    // Use longer intervals in production to reduce load
    const healthCheckInterval = isDevelopment ? 300000 : 60000; // 5 min dev, 1 min prod
    
    this.healthCheckInterval = setInterval(async () => {
      for (const provider of this.providers.values()) {
        if (provider.config.isActive) {
          try {
            const healthStatus = await this.checkProviderHealth(provider);
            provider.healthStatus = healthStatus;
            provider.lastHealthCheck = Date.now();
            
            if (!healthStatus.isHealthy) {
              provider.consecutiveFailures++;
            } else {
              provider.consecutiveFailures = 0;
            }
          } catch (error) {
            // Silently handle errors to prevent console spam
            provider.consecutiveFailures++;
            provider.healthStatus = {
              isHealthy: false,
              latency: 0,
              lastChecked: Date.now()
            };
          }
        }
      }
    }, healthCheckInterval);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Get health metrics for all providers
   */
  getHealthMetrics(): {
    totalProviders: number;
    healthyProviders: number;
    averageLatency: number;
    providerStatus: Record<string, HealthStatus>;
  } {
    const providers = Array.from(this.providers.values());
    const healthyProviders = providers.filter(p => p.healthStatus.isHealthy);
    const averageLatency = healthyProviders.reduce((sum, p) => sum + p.healthStatus.latency, 0) / healthyProviders.length || 0;
    
    const providerStatus: Record<string, HealthStatus> = {};
    for (const [id, provider] of this.providers.entries()) {
      providerStatus[id] = provider.healthStatus;
    }

    return {
      totalProviders: providers.length,
      healthyProviders: healthyProviders.length,
      averageLatency,
      providerStatus
    };
  }

  /**
   * Set load balancing strategy
   */
  setStrategy(strategy: LoadBalancingStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get backup providers for failover
   */
  getBackupProviders(chain: SupportedChain, networkType: NetworkType, excludeIds: string[] = []): RPCProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => 
        provider.config.chain === chain &&
        provider.config.networkType === networkType &&
        provider.config.isActive &&
        !excludeIds.includes(provider.config.id)
      )
      .sort((a, b) => a.config.priority - b.config.priority);
  }

  /**
   * Get RPC URL for a specific chain and network
   */
  getRPCUrl(chain: SupportedChain, networkType: NetworkType = 'mainnet'): string | null {
    const provider = this.getOptimalProvider(chain, networkType);
    if (!provider) {
      return null;
    }

    // Append API key if present
    const { url, apiKey } = provider.config;
    return apiKey ? `${url}${apiKey}` : url;
  }

  /**
   * Get provider configuration for a specific chain and network
   */
  getProviderConfig(chain: SupportedChain, networkType: NetworkType = 'mainnet'): RPCConfig | null {
    const provider = this.getOptimalProvider(chain, networkType);
    return provider?.config || null;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopHealthMonitoring();
    this.providers.clear();
  }
}

// Global instance
export const rpcManager = new RPCConnectionManager();
