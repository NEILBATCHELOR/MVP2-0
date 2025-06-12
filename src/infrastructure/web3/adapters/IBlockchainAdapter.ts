/**
 * Core Blockchain Adapter Interface
 * 
 * Provides a unified interface for interacting with different blockchain networks
 * Supports Bitcoin, EVM chains, Solana, NEAR, Ripple, Stellar, Sui, and Aptos
 */

// Core blockchain types
export type SupportedChain = 
  | 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'avalanche'
  | 'bitcoin' | 'solana' | 'near' | 'ripple' | 'stellar' | 'sui' | 'aptos';

export type NetworkType = 'mainnet' | 'testnet' | 'devnet' | 'regtest';

// Transaction types
export interface TransactionParams {
  to: string;
  amount: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  tokenAddress?: string;
}

export interface TransactionResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  fee?: string;
}

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockNumber?: number;
  timestamp?: number;
}

// Account management
export interface AccountInfo {
  address: string;
  balance: bigint;
  nonce?: number;
  publicKey?: string;
}

// Token operations
export interface TokenBalance {
  address: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  value?: string; // USD value
}

// Connection management
export interface ConnectionConfig {
  rpcUrl: string;
  networkId: string;
  apiKey?: string;
  timeout?: number;
}

export interface HealthStatus {
  isHealthy: boolean;
  latency: number;
  blockHeight?: number;
  lastChecked: number;
}

/**
 * Core blockchain adapter interface that all blockchain implementations must follow
 */
export interface IBlockchainAdapter {
  // Network information
  readonly chainId: string;
  readonly chainName: string;
  readonly networkType: NetworkType;
  readonly nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };

  // Connection management
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getHealth(): Promise<HealthStatus>;

  // Account operations
  generateAccount(): Promise<AccountInfo>;
  importAccount(privateKey: string): Promise<AccountInfo>;
  getAccount(address: string): Promise<AccountInfo>;
  getBalance(address: string): Promise<bigint>;
  
  // Transaction operations
  estimateGas(params: TransactionParams): Promise<string>;
  sendTransaction(params: TransactionParams): Promise<TransactionResult>;
  getTransaction(txHash: string): Promise<TransactionStatus>;
  signMessage(message: string, privateKey: string): Promise<string>;

  // Token operations (for chains that support tokens)
  getTokenBalance?(address: string, tokenAddress: string): Promise<TokenBalance>;
  getTokenInfo?(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
  }>;

  // Block operations
  getCurrentBlockNumber(): Promise<number>;
  getBlock(blockNumber: number): Promise<{
    number: number;
    timestamp: number;
    hash: string;
    transactions: string[];
  }>;

  // Utility methods
  isValidAddress(address: string): boolean;
  formatAddress(address: string): string;
  getExplorerUrl(txHash: string): string;
}

/**
 * Base abstract class providing common functionality
 */
export abstract class BaseBlockchainAdapter implements IBlockchainAdapter {
  protected config?: ConnectionConfig;
  protected _isConnected = false;

  abstract readonly chainId: string;
  abstract readonly chainName: string;
  abstract readonly networkType: NetworkType;
  abstract readonly nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };

  // Connection management
  abstract connect(config: ConnectionConfig): Promise<void>;
  abstract disconnect(): Promise<void>;
  
  isConnected(): boolean {
    return this._isConnected;
  }

  abstract getHealth(): Promise<HealthStatus>;

  // Account operations
  abstract generateAccount(): Promise<AccountInfo>;
  abstract importAccount(privateKey: string): Promise<AccountInfo>;
  abstract getAccount(address: string): Promise<AccountInfo>;
  abstract getBalance(address: string): Promise<bigint>;

  // Transaction operations
  abstract estimateGas(params: TransactionParams): Promise<string>;
  abstract sendTransaction(params: TransactionParams): Promise<TransactionResult>;
  abstract getTransaction(txHash: string): Promise<TransactionStatus>;
  abstract signMessage(message: string, privateKey: string): Promise<string>;

  // Block operations
  abstract getCurrentBlockNumber(): Promise<number>;
  abstract getBlock(blockNumber: number): Promise<{
    number: number;
    timestamp: number;
    hash: string;
    transactions: string[];
  }>;

  // Utility methods
  abstract isValidAddress(address: string): boolean;
  abstract formatAddress(address: string): string;
  abstract getExplorerUrl(txHash: string): string;

  // Common utility method
  protected validateConnection(): void {
    if (!this._isConnected) {
      throw new Error(`${this.chainName} adapter is not connected`);
    }
  }
}
