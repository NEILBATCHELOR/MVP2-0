import { ethers, JsonRpcProvider } from 'ethers';
import { Transaction as TransactionModel } from '@/types/core/centralModels';
import { NetworkEnvironment } from '@/infrastructure/web3/ProviderManager';

/**
 * Interface for transaction notifications
 */
export interface TransactionNotification {
  transactionId: string;
  walletAddress: string;
  userId?: string;
  transactionHash: string;
  notificationType: 'CONFIRMED' | 'FAILED' | 'PENDING' | 'REPLACED' | 'SPEED_UP' | 'CANCELED';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

/**
 * Interface for transaction events
 */
export interface TransactionEvent {
  id: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'replaced' | 'speed_up' | 'canceled';
  confirmationCount?: number;
  blockNumber?: number;
  error?: string;
  timestamp: string;
  blockchain: string;
  gasUsed?: string;
  gasPrice?: string;
  effectiveGasPrice?: string;
  replacedBy?: string;
}

/**
 * Type for transaction event handlers
 */
export type TransactionEventHandler = (event: TransactionEvent) => void;

/**
 * Type for transaction update callbacks
 */
export type TransactionUpdateCallback = (transaction: TransactionModel) => void;

/**
 * Interface for transaction subscriptions
 */
export interface TransactionSubscription {
  txHash: string;
  walletId: string;
  blockchain: string;
  callbacks: {
    onConfirmed?: TransactionUpdateCallback;
    onFailed?: TransactionUpdateCallback;
    onReplaced?: (newTxHash: string, transaction: TransactionModel) => void;
    onSpeedUp?: (newTxHash: string, transaction: TransactionModel) => void;
    onCanceled?: TransactionUpdateCallback;
    onProgress?: (confirmationCount: number, transaction: TransactionModel) => void;
  };
}

/**
 * Interface for transaction status result
 */
export interface TransactionStatusResult {
  status: 'pending' | 'confirmed' | 'failed' | 'unknown';
  confirmations?: number;
  blockNumber?: number;
  timestamp?: string;
}

/**
 * Interface for TransactionMonitor instance
 */
export interface ITransactionMonitor {
  initialize(
    providers: Record<string, JsonRpcProvider>,
    userId?: string,
    apiToken?: string
  ): Promise<boolean>;
  
  addProvider(blockchain: string, provider: JsonRpcProvider): void;
  
  getSupportedBlockchains(): string[];
  
  subscribeToTransaction(
    txHash: string,
    walletAddress: string,
    blockchain: string,
    callbacks: TransactionSubscription['callbacks']
  ): void;
  
  unsubscribeFromTransaction(txHash: string): void;
  
  addEventListener(handler: TransactionEventHandler): void;
  
  removeEventListener(handler: TransactionEventHandler): void;
  
  getTransactionHistory(
    walletAddress: string, 
    limit?: number
  ): Promise<TransactionModel[]>;
  
  getTransactionByHash(txHash: string): Promise<TransactionModel | null>;
  
  getPendingTransactions(walletAddress: string): Promise<TransactionModel[]>;
  
  updateTransactionStatus(
    txHash: string,
    status: 'pending' | 'confirmed' | 'failed',
    blockchain: string,
    blockNumber?: number,
    error?: string
  ): Promise<void>;
  
  speedUpTransaction(
    txHash: string,
    blockchain: string,
    privateKey: string,
    gasPriceMultiplier?: number
  ): Promise<string>;
  
  cancelTransaction(
    txHash: string,
    blockchain: string,
    privateKey: string,
    gasPriceMultiplier?: number
  ): Promise<string>;
  
  getOptimalFeeData(
    blockchain: string,
    priority?: any
  ): Promise<any>;
  
  addTransaction(
    blockchain: string, 
    txHash: string, 
    metadata?: any
  ): void;
  
  getTransactionStatus(
    blockchain: string, 
    txHash: string
  ): Promise<TransactionStatusResult>;
  
  stop(): void;
}
