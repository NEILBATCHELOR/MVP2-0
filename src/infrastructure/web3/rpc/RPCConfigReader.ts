/**
 * RPC Configuration Reader
 * 
 * Reads RPC configurations from environment variables and provides
 * standardized configuration objects for the RPCConnectionManager
 */

import type { SupportedChain, NetworkType } from '../adapters/IBlockchainAdapter';
import type { RPCConfig } from './RPCConnectionManager';

/**
 * Environment variable mapping for RPC URLs
 */
interface EnvironmentRPCMapping {
  mainnet?: string;
  testnet?: string;
  devnet?: string;
}

/**
 * RPC environment variable configuration
 */
const RPC_ENV_MAPPING: Record<SupportedChain, EnvironmentRPCMapping> = {
  ethereum: {
    mainnet: import.meta.env.VITE_MAINNET_RPC_URL,
    testnet: import.meta.env.VITE_SEPOLIA_RPC_URL
  },
  polygon: {
    mainnet: import.meta.env.VITE_POLYGON_RPC_URL,
    testnet: import.meta.env.VITE_AMOY_RPC_URL
  },
  arbitrum: {
    mainnet: import.meta.env.VITE_ARBITRUM_RPC_URL,
    testnet: import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL
  },
  optimism: {
    mainnet: import.meta.env.VITE_OPTIMISM_RPC_URL,
    testnet: import.meta.env.VITE_OPTIMISM_SEPOLIA_RPC_URL
  },
  base: {
    mainnet: import.meta.env.VITE_BASE_RPC_URL,
    testnet: import.meta.env.VITE_BASE_SEPOLIA_RPC_URL
  },
  avalanche: {
    mainnet: import.meta.env.VITE_AVALANCHE_RPC_URL,
    testnet: import.meta.env.VITE_AVALANCHE_TESTNET_RPC_URL
  },
  bitcoin: {
    mainnet: import.meta.env.VITE_BITCOIN_RPC_URL,
    testnet: import.meta.env.VITE_BITCOIN_TESTNET_RPC_URL
  },
  solana: {
    mainnet: import.meta.env.VITE_SOLANA_RPC_URL,
    devnet: import.meta.env.VITE_SOLANA_DEVNET_RPC_URL
  },
  near: {
    mainnet: import.meta.env.VITE_NEAR_RPC_URL,
    testnet: import.meta.env.VITE_NEAR_TESTNET_RPC_URL
  },
  ripple: {
    // Will be configured in Phase 3
    mainnet: undefined,
    testnet: undefined
  },
  stellar: {
    // Will be configured in Phase 4
    mainnet: undefined,
    testnet: undefined
  },
  sui: {
    mainnet: import.meta.env.VITE_SUI_RPC_URL,
    testnet: undefined
  },
  aptos: {
    mainnet: import.meta.env.VITE_APTOS_RPC_URL,
    testnet: import.meta.env.VITE_APTOS_TESTNET_RPC_URL
  }
};

/**
 * Extract API key from RPC URL if present
 */
function extractApiKey(rpcUrl?: string): { cleanUrl: string; apiKey?: string } {
  if (!rpcUrl) {
    return { cleanUrl: '' };
  }

  // Handle Alchemy URLs (extract API key from path)
  const alchemyMatch = rpcUrl.match(/https:\/\/[^\/]+\.g\.alchemy\.com\/v2\/([^\/\?]+)/);
  if (alchemyMatch) {
    const apiKey = alchemyMatch[1];
    const cleanUrl = rpcUrl.replace(apiKey, ''); // Remove API key for base URL
    return { cleanUrl, apiKey };
  }

  // Handle QuickNode URLs (extract from subdomain)
  const quicknodeMatch = rpcUrl.match(/https:\/\/([^\.]+)\.[^\/]+\.quiknode\.pro/);
  if (quicknodeMatch) {
    const apiKey = quicknodeMatch[1];
    return { cleanUrl: rpcUrl, apiKey };
  }

  // Return as-is for other providers
  return { cleanUrl: rpcUrl };
}

/**
 * Generate RPC configurations from environment variables
 */
export function generateRPCConfigs(): RPCConfig[] {
  const configs: RPCConfig[] = [];

  Object.entries(RPC_ENV_MAPPING).forEach(([chain, networks]) => {
    Object.entries(networks).forEach(([networkType, rpcUrl]) => {
      if (rpcUrl) {
        const { cleanUrl, apiKey } = extractApiKey(rpcUrl);
        
        // Primary provider configuration
        const config: RPCConfig = {
          id: `${chain}-${networkType}-primary`,
          chain: chain as SupportedChain,
          networkType: networkType as NetworkType,
          url: cleanUrl,
          apiKey,
          priority: 1,
          maxConnections: getMaxConnections(chain as SupportedChain),
          timeoutMs: getTimeout(chain as SupportedChain),
          isActive: true,
          healthCheckUrl: getHealthCheckUrl(chain as SupportedChain, cleanUrl)
        };

        // Add WebSocket URL for supported chains
        const wsUrl = getWebSocketUrl(chain as SupportedChain, cleanUrl, apiKey);
        if (wsUrl) {
          config.websocketUrl = wsUrl;
        }

        configs.push(config);
      }
    });
  });

  return configs;
}

/**
 * Get maximum connections based on chain type
 */
function getMaxConnections(chain: SupportedChain): number {
  switch (chain) {
    case 'bitcoin':
      return 5; // Bitcoin APIs are typically rate-limited
    case 'solana':
    case 'near':
    case 'aptos':
    case 'sui':
      return 8; // Modern chains with good RPC performance
    default:
      return 10; // EVM chains
  }
}

/**
 * Get timeout based on chain characteristics
 */
function getTimeout(chain: SupportedChain): number {
  switch (chain) {
    case 'bitcoin':
      return 60000; // Bitcoin can be slower
    case 'ethereum':
      return 30000; // Ethereum can have congestion
    default:
      return 20000; // Faster for modern chains
  }
}

/**
 * Get WebSocket URL for real-time connections
 */
function getWebSocketUrl(chain: SupportedChain, httpUrl: string, apiKey?: string): string | undefined {
  // Alchemy WebSocket conversion
  if (httpUrl.includes('alchemy.com')) {
    const wsUrl = httpUrl.replace('https://', 'wss://').replace('/v2/', '/v2/');
    return apiKey ? `${wsUrl}${apiKey}` : wsUrl;
  }

  // Solana WebSocket support
  if (chain === 'solana' && httpUrl.includes('solana.com')) {
    return httpUrl.replace('https://', 'wss://');
  }

  // Other chains - add as needed in future phases
  return undefined;
}

/**
 * Get health check URL for monitoring
 */
function getHealthCheckUrl(chain: SupportedChain, rpcUrl: string): string | undefined {
  switch (chain) {
    case 'bitcoin':
      return rpcUrl.includes('blockstream.info') 
        ? `${rpcUrl}/blocks/tip/height`
        : undefined;
    
    case 'stellar':
      return rpcUrl.includes('horizon')
        ? `${rpcUrl}/ledgers?limit=1&order=desc`
        : undefined;
    
    default:
      return rpcUrl; // Use main RPC URL for health checks
  }
}

/**
 * Validate RPC configuration
 */
export function validateRPCConfig(config: RPCConfig): boolean {
  if (!config.url || !config.chain || !config.networkType) {
    return false;
  }

  // Validate URL format
  try {
    new URL(config.url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all configured RPC endpoints for debugging
 */
export function getConfiguredEndpoints(): Record<string, string | undefined> {
  const endpoints: Record<string, string | undefined> = {};
  
  Object.entries(RPC_ENV_MAPPING).forEach(([chain, networks]) => {
    Object.entries(networks).forEach(([networkType, rpcUrl]) => {
      endpoints[`${chain}_${networkType}`] = rpcUrl;
    });
  });

  return endpoints;
}

/**
 * Check if RPC configuration is complete for a chain
 */
export function isChainConfigured(chain: SupportedChain, networkType: NetworkType): boolean {
  const chainConfig = RPC_ENV_MAPPING[chain];
  return !!(chainConfig && chainConfig[networkType]);
}
