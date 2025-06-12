/**
 * Provider Manager
 * 
 * High-level provider management that builds on top of RPCConnectionManager
 * to provide easy-to-use provider access for different blockchain networks.
 */

import type { Provider } from 'ethers';
import { JsonRpcProvider, BrowserProvider } from 'ethers';
import { rpcManager, type RPCProvider } from './rpc/RPCConnectionManager';
import type { SupportedChain, NetworkType } from './adapters/IBlockchainAdapter';
import { getEthereumProvider } from '@/types/domain/blockchain/ethereum';

export enum NetworkEnvironment {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
  REGTEST = 'regtest'
}

export interface ProviderOptions {
  timeout?: number;
  retries?: number;
  caching?: boolean;
}

export class ProviderManager {
  private providerCache = new Map<string, JsonRpcProvider>();
  private defaultOptions: ProviderOptions;

  constructor(options?: ProviderOptions) {
    this.defaultOptions = {
      timeout: 10000,
      retries: 3,
      caching: true,
      ...options
    };
  }

  /**
   * Get provider for a specific blockchain and environment
   */
  getProviderForEnvironment(
    chain: SupportedChain,
    environment: NetworkEnvironment
  ): JsonRpcProvider {
    const cacheKey = `${chain}-${environment}`;
    
    if (this.defaultOptions.caching && this.providerCache.has(cacheKey)) {
      return this.providerCache.get(cacheKey)!;
    }

    // Map environment to network type
    const networkType: NetworkType = this.mapEnvironmentToNetworkType(environment);
    
    // Get RPC configuration from RPCConnectionManager
    const rpcConfig = rpcManager.getProviderConfig(chain, networkType);
    
    if (!rpcConfig) {
      throw new Error(`No RPC configuration found for ${chain} ${environment}`);
    }

    // Create provider from RPC configuration
    const provider = new JsonRpcProvider(rpcConfig.url);
    
    if (this.defaultOptions.caching) {
      this.providerCache.set(cacheKey, provider);
    }

    return provider;
  }

  /**
   * Get provider for a blockchain (defaults to mainnet)
   */
  getProvider(chain: SupportedChain): JsonRpcProvider {
    return this.getProviderForEnvironment(chain, NetworkEnvironment.MAINNET);
  }

  /**
   * Get browser provider (MetaMask, etc.)
   */
  getBrowserProvider(): BrowserProvider | null {
    const ethereum = getEthereumProvider();
    if (ethereum) {
      return new BrowserProvider(ethereum);
    }
    return null;
  }

  /**
   * Get provider by RPC URL
   */
  getProviderByUrl(url: string): JsonRpcProvider {
    const cacheKey = `url-${url}`;
    
    if (this.defaultOptions.caching && this.providerCache.has(cacheKey)) {
      return this.providerCache.get(cacheKey)!;
    }

    const provider = new JsonRpcProvider(url);
    
    if (this.defaultOptions.caching) {
      this.providerCache.set(cacheKey, provider);
    }

    return provider;
  }

  /**
   * Test provider connectivity
   */
  async testProvider(provider: JsonRpcProvider): Promise<{
    isConnected: boolean;
    latency: number;
    blockNumber?: number;
    chainId?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const [blockNumber, network] = await Promise.all([
        provider.getBlockNumber(),
        provider.getNetwork()
      ]);
      
      const latency = Date.now() - startTime;
      
      return {
        isConnected: true,
        latency,
        blockNumber,
        chainId: Number(network.chainId)
      };
    } catch (error) {
      return {
        isConnected: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): Array<{
    chain: SupportedChain;
    environment: NetworkEnvironment;
    isHealthy: boolean;
  }> {
    const providers: Array<{
      chain: SupportedChain;
      environment: NetworkEnvironment;
      isHealthy: boolean;
    }> = [];

    // Get health metrics from RPCConnectionManager
    const healthMetrics = rpcManager.getHealthMetrics();
    
    // Convert RPC provider status to our format
    Object.entries(healthMetrics.providerStatus).forEach(([id, status]) => {
      // Parse provider ID to extract chain and network info
      // This is a simplified parsing - real implementation would be more robust
      const parts = id.split('-');
      if (parts.length >= 2) {
        const chain = parts[0] as SupportedChain;
        const networkType = parts[1] as NetworkType;
        const environment = this.mapNetworkTypeToEnvironment(networkType);
        
        providers.push({
          chain,
          environment,
          isHealthy: status.isHealthy
        });
      }
    });

    return providers;
  }

  /**
   * Switch provider for a chain/environment
   */
  async switchProvider(
    chain: SupportedChain,
    environment: NetworkEnvironment,
    newUrl?: string
  ): Promise<void> {
    const cacheKey = `${chain}-${environment}`;
    
    // Remove from cache
    this.providerCache.delete(cacheKey);
    
    if (newUrl) {
      // Add new RPC configuration if URL provided
      const networkType = this.mapEnvironmentToNetworkType(environment);
      
      rpcManager.addProvider({
        id: `custom-${chain}-${networkType}-${Date.now()}`,
        chain,
        networkType,
        url: newUrl,
        priority: 1,
        maxConnections: 10,
        timeoutMs: this.defaultOptions.timeout || 10000,
        isActive: true
      });
    }
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(
    chain: SupportedChain,
    environment: NetworkEnvironment
  ): Promise<{
    isHealthy: boolean;
    latency: number;
    lastChecked: number;
  }> {
    try {
      const provider = this.getProviderForEnvironment(chain, environment);
      const health = await this.testProvider(provider);
      
      return {
        isHealthy: health.isConnected,
        latency: health.latency,
        lastChecked: Date.now()
      };
    } catch (error) {
      return {
        isHealthy: false,
        latency: -1,
        lastChecked: Date.now()
      };
    }
  }

  /**
   * Clear provider cache
   */
  clearCache(): void {
    this.providerCache.clear();
  }

  /**
   * Convert network environment to network config
   */
  getNetworkConfig(chain: string, environment: NetworkEnvironment): any {
    if (environment === NetworkEnvironment.MAINNET) {
      // Return mainnet configuration
      return {
        chainId: this.getChainId(chain, 'mainnet'),
        name: `${chain}-mainnet`
      };
    } else if (environment === NetworkEnvironment.TESTNET) {
      // Return testnet configuration
      return {
        chainId: this.getChainId(chain, 'testnet'),
        name: `${chain}-testnet`
      };
    } else if (environment === NetworkEnvironment.DEVNET) {
      // Return devnet configuration
      return {
        chainId: this.getChainId(chain, 'devnet'),
        name: `${chain}-devnet`
      };
    } else if (environment === NetworkEnvironment.REGTEST) {
      // Return regtest configuration
      return {
        chainId: this.getChainId(chain, 'regtest'),
        name: `${chain}-regtest`
      };
    } else {
      // Default to mainnet
      return {
        chainId: this.getChainId(chain, 'mainnet'),
        name: `${chain}-mainnet`
      };
    }
  }

  /**
   * Get chain ID for a specific chain and network type
   */
  getChainId(chain: string, network: string): number {
    // Standard EVM chain IDs
    const chainIdMap: Record<string, Record<string, number>> = {
      ethereum: {
        mainnet: 1,
        testnet: 11155111, // Sepolia
        devnet: 1337,
        regtest: 1337
      },
      polygon: {
        mainnet: 137,
        testnet: 80001, // Mumbai
        devnet: 80001,
        regtest: 80001
      },
      arbitrum: {
        mainnet: 42161,
        testnet: 421613, // Arbitrum Goerli
        devnet: 421613,
        regtest: 421613
      },
      optimism: {
        mainnet: 10,
        testnet: 420, // Optimism Goerli
        devnet: 420,
        regtest: 420
      },
      base: {
        mainnet: 8453,
        testnet: 84531, // Base Goerli
        devnet: 84531,
        regtest: 84531
      },
      avalanche: {
        mainnet: 43114,
        testnet: 43113, // Fuji
        devnet: 43113,
        regtest: 43113
      }
    };

    // Return chain ID or default value
    return chainIdMap[chain]?.[network] || 1;
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): SupportedChain[] {
    // Return the chains supported by the system
    return [
      'ethereum',
      'polygon',
      'arbitrum',
      'optimism',
      'base',
      'avalanche',
      'bitcoin',
      'solana',
      'near',
      'ripple',
      'stellar',
      'sui',
      'aptos'
    ];
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chain: string): chain is SupportedChain {
    return this.getSupportedChains().includes(chain as SupportedChain);
  }
  
  /**
   * Map environment to network type
   */
  private mapEnvironmentToNetworkType(environment: NetworkEnvironment): NetworkType {
    switch (environment) {
      case NetworkEnvironment.MAINNET:
        return 'mainnet';
      case NetworkEnvironment.TESTNET:
        return 'testnet';
      case NetworkEnvironment.DEVNET:
        return 'devnet';
      case NetworkEnvironment.REGTEST:
        return 'regtest';
      default:
        return 'mainnet';
    }
  }

  /**
   * Map network type to environment
   */
  private mapNetworkTypeToEnvironment(networkType: NetworkType): NetworkEnvironment {
    switch (networkType) {
      case 'mainnet':
        return NetworkEnvironment.MAINNET;
      case 'testnet':
        return NetworkEnvironment.TESTNET;
      case 'devnet':
        return NetworkEnvironment.DEVNET;
      case 'regtest':
        return NetworkEnvironment.REGTEST;
      default:
        return NetworkEnvironment.MAINNET;
    }
  }
}

// Export singleton instance
export const providerManager = new ProviderManager();
export default providerManager;
