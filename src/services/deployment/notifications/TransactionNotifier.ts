import { ethers } from "ethers";
import { EventEmitter } from "events";
import { type Provider } from 'ethers';

/**
 * Transaction status values
 */
export enum TransactionStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  FAILED = "failed",
}

/**
 * Transaction notification events
 */
export enum TransactionEvent {
  STATUS_CHANGE = "statusChange",
  CONFIRMATION = "confirmation",
  RECEIPT = "receipt",
  ERROR = "error",
}

/**
 * Transaction details
 */
export interface TransactionDetails {
  hash: string;
  blockchain: string;
  from: string;
  to: string;
  value: string;
  status: TransactionStatus;
  receipt?: any;
  confirmations?: number;
  requiredConfirmations?: number;
  error?: string;
  timestamp: number;
}

/**
 * Transaction notification service that tracks transaction status
 * and emits events when status changes
 */
export class TransactionNotifier extends EventEmitter {
  private provider:  Provider;
  private transactions: Map<string, TransactionDetails> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private blockchain: string;
  private requiredConfirmations: number;
  private pollingInterval: number;

  constructor(
    provider:  Provider,
    blockchain: string,
    requiredConfirmations: number = 12,
    pollingInterval: number = 5000 // 5 seconds
  ) {
    super();
    this.provider = provider;
    this.blockchain = blockchain;
    this.requiredConfirmations = requiredConfirmations;
    this.pollingInterval = pollingInterval;
  }

  /**
   * Start tracking a transaction
   * @param hash Transaction hash
   * @param from From address
   * @param to To address
   * @param value Transaction value
   */
  trackTransaction(
    hash: string,
    from: string,
    to: string,
    value: string
  ): void {
    if (this.transactions.has(hash)) {
      return; // Already tracking this transaction
    }

    const transaction: TransactionDetails = {
      hash,
      blockchain: this.blockchain,
      from,
      to,
      value,
      status: TransactionStatus.PENDING,
      confirmations: 0,
      requiredConfirmations: this.requiredConfirmations,
      timestamp: Date.now(),
    };

    this.transactions.set(hash, transaction);
    this.emit(TransactionEvent.STATUS_CHANGE, { ...transaction });

    // Start polling for this transaction
    this.startPolling(hash);
  }

  /**
   * Stop tracking a transaction
   * @param hash Transaction hash
   */
  stopTracking(hash: string): void {
    this.stopPolling(hash);
    this.transactions.delete(hash);
  }

  /**
   * Get tracked transaction details
   * @param hash Transaction hash
   * @returns Transaction details or undefined if not tracking
   */
  getTransaction(hash: string): TransactionDetails | undefined {
    return this.transactions.get(hash);
  }

  /**
   * Get all tracked transactions
   * @returns Array of transaction details
   */
  getAllTransactions(): TransactionDetails[] {
    return Array.from(this.transactions.values());
  }

  /**
   * Start polling for transaction status
   * @param hash Transaction hash
   */
  private startPolling(hash: string): void {
    if (this.pollingIntervals.has(hash)) {
      return; // Already polling for this transaction
    }

    const interval = setInterval(() => {
      this.checkTransactionStatus(hash);
    }, this.pollingInterval);

    this.pollingIntervals.set(hash, interval);
  }

  /**
   * Stop polling for transaction status
   * @param hash Transaction hash
   */
  private stopPolling(hash: string): void {
    const interval = this.pollingIntervals.get(hash);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(hash);
    }
  }

  /**
   * Check transaction status
   * @param hash Transaction hash
   */
  private async checkTransactionStatus(hash: string): Promise<void> {
    const transaction = this.transactions.get(hash);
    if (!transaction) {
      this.stopPolling(hash);
      return;
    }

    try {
      // Get the transaction from the provider
      const tx = await this.provider.getTransaction(hash);
      
      if (!tx) {
        // Transaction not found, it might be pending
        return;
      }

      // If transaction has a block number, it's been mined
      if (tx.blockNumber) {
        const receipt = await this.provider.getTransactionReceipt(hash);
        
        // Update transaction confirmations
        const currentBlock = await this.provider.getBlockNumber();
        let confirmations: number = 0;
        const receiptAny = receipt as any;
        if (typeof receiptAny.confirmations === 'number') {
          confirmations = receiptAny.confirmations;
        } else if (typeof receiptAny.blockNumber === 'number') {
          confirmations = currentBlock - receiptAny.blockNumber + 1;
        }
        
        // Determine the transaction status
        let status: TransactionStatus;
        
        if (receipt.status === 1) {
          status = TransactionStatus.CONFIRMED;
        } else {
          status = TransactionStatus.FAILED;
        }
        
        // Update transaction details
        const updatedTransaction: TransactionDetails = {
          ...transaction,
          status,
          receipt,
          confirmations,
        };
        this.transactions.set(hash, updatedTransaction);
        
        // Emit appropriate events
        if (status !== transaction.status) {
          this.emit(TransactionEvent.STATUS_CHANGE, { ...updatedTransaction });
        }
        
        if (receipt && !transaction.receipt) {
          this.emit(TransactionEvent.RECEIPT, { ...updatedTransaction });
        }
        
        if (confirmations !== transaction.confirmations) {
          this.emit(TransactionEvent.CONFIRMATION, { ...updatedTransaction });
        }
        
        // If we've reached the required confirmations, stop polling
        if (confirmations >= this.requiredConfirmations) {
          this.stopPolling(hash);
        }
      }
    } catch (error) {
      // Update transaction with error
      const updatedTransaction: TransactionDetails = {
        ...transaction,
        error: error instanceof Error ? error.message : String(error),
      };
      this.transactions.set(hash, updatedTransaction);
      
      // Emit error event
      this.emit(TransactionEvent.ERROR, { ...updatedTransaction });
    }
  }
}

/**
 * Factory for creating transaction notifiers for different blockchains
 */
export class TransactionNotifierFactory {
  private static notifiers: Map<string, TransactionNotifier> = new Map();

  /**
   * Get a transaction notifier for a specific blockchain
   * @param blockchain The blockchain to get a notifier for
   * @param provider The provider to use
   * @param requiredConfirmations Number of confirmations required
   * @param pollingInterval Polling interval in milliseconds
   * @returns A transaction notifier
   */
  static getNotifier(
    blockchain: string,
    provider:  Provider,
    requiredConfirmations?: number,
    pollingInterval?: number
  ): TransactionNotifier {
    // Create a unique key for the provider without relying on connection.url
    // which doesn't exist on the Provider interface
    const providerKey = provider.getNetwork ? 
      Date.now().toString() : // Use a timestamp as a fallback
      'default';
    
    const key = `${blockchain}-${providerKey}`;
    
    if (!this.notifiers.has(key)) {
      const requiredConfs = this.getDefaultConfirmations(blockchain, requiredConfirmations);
      const notifier = new TransactionNotifier(
        provider,
        blockchain,
        requiredConfs,
        pollingInterval
      );
      this.notifiers.set(key, notifier);
    }
    
    return this.notifiers.get(key)!;
  }

  /**
   * Get the default number of confirmations for a blockchain
   * @param blockchain The blockchain
   * @param userSpecified User-specified number of confirmations
   * @returns Number of confirmations
   */
  private static getDefaultConfirmations(
    blockchain: string,
    userSpecified?: number
  ): number {
    if (userSpecified !== undefined) {
      return userSpecified;
    }
    
    // Default confirmations for common blockchains
    switch (blockchain.toLowerCase()) {
      case "bitcoin":
        return 6;
      case "ethereum":
        return 12;
      case "polygon":
        return 64;
      case "avalanche":
        return 3;
      case "optimism":
      case "arbitrum":
      case "base":
      case "zksync":
        return 1;
      case "solana":
        return 32;
      default:
        return 12; // Default for unknown blockchains
    }
  }
}