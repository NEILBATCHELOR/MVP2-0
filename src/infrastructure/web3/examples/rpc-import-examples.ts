/**
 * RPC Import Examples
 * 
 * Correct import patterns for the new RPC architecture
 */

// ===== BASIC IMPORTS =====

// Extended RPC functionality (consolidated import)
import { 
  rpcManager, 
  type NetworkType, 
  type SupportedChain, 
  type RPCConfig, 
  type RPCProvider 
} from '@/infrastructure/web3';

// Configuration utilities
import { 
  getConfiguredEndpoints, 
  isChainConfigured,
  generateRPCConfigs
} from '@/infrastructure/web3';

// ===== USAGE EXAMPLES =====

// Get RPC URL for a chain (replaces old providerManager.getUrl())
const rpcUrl = rpcManager.getRPCUrl('ethereum', 'mainnet');

// Get provider configuration (replaces old providerManager.getConfig())
const config = rpcManager.getProviderConfig('ethereum', 'mainnet');

// Check health status (new functionality)
const healthMetrics = rpcManager.getHealthMetrics();

// Get optimal provider (new functionality)
const provider = rpcManager.getOptimalProvider('ethereum', 'mainnet');

// Check if chain is configured (new utility)
const isConfigured = isChainConfigured('ethereum', 'mainnet');

// Get all configured endpoints (debugging)
const endpoints = getConfiguredEndpoints();

// ===== TYPE USAGE =====

// Network types
const network: NetworkType = 'mainnet'; // instead of NetworkEnvironment

// Chain types
const chain: SupportedChain = 'ethereum';

// RPC configuration
const rpcConfig: RPCConfig = {
  id: 'eth-mainnet',
  chain: 'ethereum',
  networkType: 'mainnet',
  url: 'https://eth-mainnet.g.alchemy.com/v2/',
  priority: 1,
  maxConnections: 10,
  timeoutMs: 30000,
  isActive: true
};

export {
  // Export the patterns for reference
  rpcManager,
  type NetworkType,
  type SupportedChain,
  type RPCConfig,
  getConfiguredEndpoints,
  isChainConfigured
};
