/**
 * DFNS Types Index - Centralized exports for all DFNS types
 * 
 * This file provides a single entry point for importing DFNS types
 * throughout the application.
 */

// Core DFNS API types
export * from './core';

// Domain types (camelCase for UI)
export * from './domain';

// Database types (snake_case for database)
export * from './database';

// Type mappers for conversion between formats
export * from './mappers';

// Fiat integration types
export * from './fiat';

// Re-export commonly used types with aliases for convenience
export type {
  // Core API response types
  DfnsResponse,
  DfnsError,
  DfnsPaginatedResponse,
  
  // Network and blockchain types
  DfnsNetwork,
  DfnsCurve,
  DfnsScheme,
  
  // Configuration
  DfnsClientConfig
} from './core';

// Re-export enums as values (not types) so they can be used for enum access
export {
  // Status enums - these need to be values for .Active, .Pending etc access
  DfnsWalletStatus,
  DfnsTransferStatus,
  DfnsSignatureStatus,
  DfnsPolicyStatus,
  DfnsActivityKind,
  DfnsPolicyApprovalStatus,
  DfnsTransactionStatus
} from './core';

// Import these types for use in type guards and helper functions
import type {
  DfnsError as DfnsErrorType,
  DfnsNetwork as DfnsNetworkType,
  DfnsCurve as DfnsCurveType,
  DfnsScheme as DfnsSchemeType
} from './core';

export type {
  // Primary domain models
  Wallet,
  SigningKey,
  TransferRequest,
  TransferResponse,
  Policy,
  Permission,
  Webhook,
  
  // UI helper types
  WalletCreationRequest,
  KeyCreationRequest,
  DfnsDashboardMetrics,
  WalletDetails
} from './domain';

export type {
  // Primary database tables
  DfnsWalletsTable,
  DfnsSigningKeysTable,
  DfnsTransfersTable,
  DfnsPoliciesTable,
  DfnsPermissionsTable,
  
  // Insert/Update types
  DfnsWalletInsert,
  DfnsWalletUpdate,
  DfnsTransferInsert,
  DfnsTransferUpdate
} from './database';

// Import types for type guards
import type { Wallet, TransferResponse } from './domain';

// Type guard functions for runtime type checking
export function isDfnsWallet(obj: any): obj is Wallet {
  return obj && typeof obj === 'object' && 
         typeof obj.walletId === 'string' &&
         typeof obj.address === 'string' &&
         typeof obj.network === 'string';
}

export function isDfnsTransfer(obj: any): obj is TransferResponse {
  return obj && typeof obj === 'object' &&
         typeof obj.id === 'string' &&
         typeof obj.status === 'string';
}

export function isDfnsError(obj: any): obj is DfnsErrorType {
  return obj && typeof obj === 'object' &&
         typeof obj.code === 'string' &&
         typeof obj.message === 'string';
}

// Helper functions for working with DFNS types
export function isTestNetwork(network: DfnsNetworkType): boolean {
  const testNetworks = [
    'EthereumGoerli',
    'EthereumSepolia',
    'PolygonMumbai',
    'BinanceSmartChainTestnet',
    'ArbitrumGoerli',
    'ArbitrumSepolia',
    'OptimismGoerli',
    'OptimismSepolia',
    'AvalancheFuji',
    'BitcoinTestnet3',
    'SolanaDevnet',
    'StellarTestnet',
    'AlgorandTestnet',
    'TezosTestnet',
    'CardanoTestnet',
    'XrpLedgerTestnet',
    'TronTestnet',
    'NearTestnet',
    'AptosTestnet'
  ];
  return testNetworks.includes(network as string);
}

export function getNetworkDisplayName(network: DfnsNetworkType): string {
  const networkNames: Record<string, string> = {
    // Ethereum
    'Ethereum': 'Ethereum Mainnet',
    'EthereumGoerli': 'Ethereum Goerli',
    'EthereumSepolia': 'Ethereum Sepolia',
    
    // Polygon
    'Polygon': 'Polygon Mainnet',
    'PolygonMumbai': 'Polygon Mumbai',
    
    // Binance Smart Chain
    'BinanceSmartChain': 'BSC Mainnet',
    'BinanceSmartChainTestnet': 'BSC Testnet',
    
    // Arbitrum
    'Arbitrum': 'Arbitrum One',
    'ArbitrumGoerli': 'Arbitrum Goerli',
    'ArbitrumSepolia': 'Arbitrum Sepolia',
    
    // Optimism
    'Optimism': 'Optimism Mainnet',
    'OptimismGoerli': 'Optimism Goerli',
    'OptimismSepolia': 'Optimism Sepolia',
    
    // Avalanche
    'Avalanche': 'Avalanche C-Chain',
    'AvalancheFuji': 'Avalanche Fuji',
    
    // Bitcoin
    'Bitcoin': 'Bitcoin Mainnet',
    'BitcoinTestnet3': 'Bitcoin Testnet',
    
    // Solana
    'Solana': 'Solana Mainnet',
    'SolanaDevnet': 'Solana Devnet',
    
    // Other networks
    'Stellar': 'Stellar Mainnet',
    'StellarTestnet': 'Stellar Testnet',
    'Algorand': 'Algorand Mainnet',
    'AlgorandTestnet': 'Algorand Testnet',
    'Tezos': 'Tezos Mainnet',
    'TezosTestnet': 'Tezos Testnet',
    'Cardano': 'Cardano Mainnet',
    'CardanoTestnet': 'Cardano Testnet',
    'XrpLedger': 'XRP Ledger',
    'XrpLedgerTestnet': 'XRP Ledger Testnet',
    'Tron': 'TRON Mainnet',
    'TronTestnet': 'TRON Testnet',
    'Near': 'NEAR Mainnet',
    'NearTestnet': 'NEAR Testnet',
    'Aptos': 'Aptos Mainnet',
    'AptosTestnet': 'Aptos Testnet'
  };
  
  return networkNames[network] || network;
}

export function getCurveForNetwork(network: DfnsNetworkType): DfnsCurveType {
  // EVM networks use secp256k1
  const evmNetworks = [
    'Ethereum', 'EthereumGoerli', 'EthereumSepolia',
    'Polygon', 'PolygonMumbai',
    'BinanceSmartChain', 'BinanceSmartChainTestnet',
    'Arbitrum', 'ArbitrumGoerli', 'ArbitrumSepolia',
    'Optimism', 'OptimismGoerli', 'OptimismSepolia',
    'Avalanche', 'AvalancheFuji'
  ];
  
  // Ed25519 networks
  const ed25519Networks = [
    'Solana', 'SolanaDevnet',
    'Near', 'NearTestnet',
    'Aptos', 'AptosTestnet'
  ];
  
  if (evmNetworks.includes(network)) {
    return 'secp256k1' as DfnsCurveType;
  } else if (ed25519Networks.includes(network)) {
    return 'ed25519' as DfnsCurveType;
  } else if (network.includes('Bitcoin')) {
    return 'secp256k1' as DfnsCurveType;
  } else {
    // Default fallback
    return 'secp256k1' as DfnsCurveType;
  }
}

export function getSchemeForCurve(curve: DfnsCurveType): DfnsSchemeType {
  return curve === 'ed25519' ? 'EdDSA' as DfnsSchemeType : 'ECDSA' as DfnsSchemeType;
}
