/**
 * Web3 Infrastructure Index
 * 
 * Central exports for the multi-blockchain infrastructure system
 */

// Core adapter interfaces
export type {
  IBlockchainAdapter,
  SupportedChain,
  NetworkType,
  TransactionParams,
  TransactionResult,
  TransactionStatus,
  AccountInfo,
  TokenBalance,
  ConnectionConfig,
  HealthStatus
} from './adapters/IBlockchainAdapter';

export { BaseBlockchainAdapter } from './adapters/IBlockchainAdapter';

// Factory system
export {
  BlockchainFactory
} from './factories/BlockchainFactory';

export type {
  ChainConfig
} from './factories/BlockchainFactory';

// RPC management
export {
  RPCConnectionManager,
  rpcManager
} from './rpc/RPCConnectionManager';

export {
  generateRPCConfigs,
  validateRPCConfig,
  getConfiguredEndpoints,
  isChainConfigured
} from './rpc/RPCConfigReader';

export type {
  RPCConfig,
  RPCProvider,
  LoadBalancingStrategy
} from './rpc/RPCConnectionManager';

// Wallet management
export {
  MultiChainWalletManager,
  multiChainWalletManager
} from './managers/MultiChainWalletManager';

export type {
  MultiChainWallet,
  WalletConnection,
  CrossChainBalance,
  WalletPortfolio
} from './managers/MultiChainWalletManager';

// Token management
export {
  EnhancedTokenManager,
  enhancedTokenManager
} from './tokens/EnhancedTokenManager';

export type {
  TokenStandard,
  TokenType,
  BaseToken,
  ERC20Token,
  ERC721Token,
  ERC1155Token,
  ERC1400Token,
  ERC3525Token,
  ERC4626Token,
  SPLToken,
  NEARToken,
  StellarAsset,
  TokenDeploymentParams,
  TokenTransferParams,
  TokenOperationResult
} from './tokens/EnhancedTokenManager';

// Import types for utility functions
import type { SupportedChain as SupportedChainType, NetworkType as NetworkTypeType } from './adapters/IBlockchainAdapter';

// Utility functions
export const WEB3_UTILS = {
  /**
   * Check if a chain is EVM compatible
   */
  isEVMChain: (chain: SupportedChainType): boolean => {
    return ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche'].includes(chain);
  },

  /**
   * Get chain display name
   */
  getChainDisplayName: (chain: SupportedChainType): string => {
    const names: Record<SupportedChainType, string> = {
      ethereum: 'Ethereum',
      polygon: 'Polygon',
      arbitrum: 'Arbitrum',
      optimism: 'Optimism',
      base: 'Base',
      avalanche: 'Avalanche',
      bitcoin: 'Bitcoin',
      solana: 'Solana',
      near: 'NEAR Protocol',
      ripple: 'XRP Ledger',
      stellar: 'Stellar',
      sui: 'Sui',
      aptos: 'Aptos'
    };
    return names[chain] || chain;
  },

  /**
   * Get network display name
   */
  getNetworkDisplayName: (networkType: NetworkTypeType): string => {
    const names: Record<NetworkTypeType, string> = {
      mainnet: 'Mainnet',
      testnet: 'Testnet',
      devnet: 'Devnet',
      regtest: 'Regtest'
    };
    return names[networkType] || networkType;
  },

  /**
   * Format chain and network for display
   */
  formatChainNetwork: (chain: SupportedChainType, networkType: NetworkTypeType): string => {
    const chainName = WEB3_UTILS.getChainDisplayName(chain);
    const networkName = WEB3_UTILS.getNetworkDisplayName(networkType);
    
    if (networkType === 'mainnet') {
      return chainName;
    }
    
    return `${chainName} (${networkName})`;
  }
};
