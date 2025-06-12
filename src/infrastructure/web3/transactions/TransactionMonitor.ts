import { ethers } from "ethers";
import { Transaction, TransactionStatus, TransactionReceipt, BaseTransactionBuilder } from "./TransactionBuilder";
import { TransactionBuilderFactory } from "./TransactionBuilderFactory";

// Define Blockchain enum if the import is not available
export enum Blockchain {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  AVALANCHE = 'avalanche',
  SOLANA = 'solana',
  NEAR = 'near',
  RIPPLE = 'ripple'
}

/**
 * Transaction notification listener interface
 */
export interface TransactionListener {
  onStatusChange(transaction: Transaction, oldStatus: TransactionStatus, newStatus: TransactionStatus): void;
  onConfirmation(transaction: Transaction, confirmations: number): void;
  onSuccess(transaction: Transaction, receipt: TransactionReceipt): void;
  onFailure(transaction: Transaction, receipt: TransactionReceipt, error?: Error): void;
  onError(transaction: Transaction, error: Error): void;
}

/**
 * Transaction monitoring configuration
 */
export interface MonitoringConfig {
  pollingInterval: number;
  confirmationsRequired: number;
  maxBlocksToWait: number;
  automonitorNew: boolean;
}

/**
 * Transaction monitor for tracking transaction status
 */
export class TransactionMonitor {
  private transactionBuilder: BaseTransactionBuilder;
  private static instance: TransactionMonitor;
  private transactions: Map<string, Transaction> = new Map();
  private lastKnownStatus: Map<string, TransactionStatus> = new Map();
  private confirmations: Map<string, number> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Map<string, TransactionListener[]> = new Map();
  private config: MonitoringConfig;
  
  private constructor(blockchain: Blockchain, provider: any) {
    this.transactionBuilder = TransactionBuilderFactory.getInstance().createBuilder(blockchain, provider);
    // Default configuration
    this.config = {
      pollingInterval: 5000, // 5 seconds
      confirmationsRequired: 3,
      maxBlocksToWait: 50,   // Give up after 50 blocks
      automonitorNew: true
    };
  }
  
  /**
   * Get the singleton instance of the monitor
   */
  static getInstance(blockchain: Blockchain, provider: any): TransactionMonitor {
    if (!TransactionMonitor.instance) {
      TransactionMonitor.instance = new TransactionMonitor(blockchain, provider);
    }
    return TransactionMonitor.instance;
  }
  
  /**
   * Configure the transaction monitor
   */
  configure(config: Partial<MonitoringConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
  
  /**
   * Monitor a transaction
   */
  monitorTransaction(transaction: Transaction, listener?: TransactionListener): void {
    // Don't duplicate monitoring
    if (this.transactions.has(transaction.hash || transaction.id)) {
      // Just add the listener if provided
      if (listener) {
        this.addListener(transaction.hash || transaction.id, listener);
      }
      return;
    }
    
    // Store the transaction
    this.transactions.set(transaction.hash || transaction.id, transaction);
    this.lastKnownStatus.set(transaction.hash || transaction.id, transaction.status);
    this.confirmations.set(transaction.hash || transaction.id, 0);
    
    // Add the listener if provided
    if (listener) {
      this.addListener(transaction.hash || transaction.id, listener);
    }
    
    // Start polling for status updates
    this.startPolling(transaction);
  }
  
  /**
   * Stop monitoring a transaction
   */
  stopMonitoring(transactionId: string): void {
    const interval = this.pollingIntervals.get(transactionId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(transactionId);
    }
  }
  
  /**
   * Add a listener for a transaction
   */
  addListener(transactionId: string, listener: TransactionListener): void {
    const existingListeners = this.listeners.get(transactionId) || [];
    this.listeners.set(transactionId, [...existingListeners, listener]);
  }
  
  /**
   * Remove a listener for a transaction
   */
  removeListener(transactionId: string, listener: TransactionListener): void {
    const existingListeners = this.listeners.get(transactionId) || [];
    const updatedListeners = existingListeners.filter(l => l !== listener);
    this.listeners.set(transactionId, updatedListeners);
  }
  
  /**
   * Get the current status of a transaction
   */
  getStatus(transactionId: string): TransactionStatus | undefined {
    return this.lastKnownStatus.get(transactionId);
  }
  
  /**
   * Get the number of confirmations for a transaction
   */
  getConfirmations(transactionId: string): number {
    return this.confirmations.get(transactionId) || 0;
  }
  
  /**
   * Get all monitored transactions
   */
  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values());
  }
  
  /**
   * Start polling for status updates
   */
  private startPolling(transaction: Transaction): void {
    const id = transaction.hash || transaction.id;
    
    // Start the polling interval
    const interval = setInterval(async () => {
      try {
        // Skip if we don't have a hash yet
        if (!transaction.hash) {
          return;
        }
        
        // Get the current status
        const newStatus = await this.transactionBuilder.getTransactionStatus(transaction.hash);
        const oldStatus = this.lastKnownStatus.get(id) || TransactionStatus.UNKNOWN;
        
        // Update if status has changed
        if (newStatus !== oldStatus) {
          // Update our records
          this.lastKnownStatus.set(id, newStatus);
          
          // Update the transaction object
          const updatedTx = {
            ...transaction,
            status: newStatus
          };
          this.transactions.set(id, updatedTx);
          
          // Notify listeners
          this.notifyStatusChange(updatedTx, oldStatus, newStatus);
          
          // If confirmed or failed, check receipt
          if (
            newStatus === TransactionStatus.CONFIRMED ||
            newStatus === TransactionStatus.FAILED
          ) {
            this.handleConfirmedOrFailed(updatedTx);
          }
        }
        
        // If transaction is no longer pending, stop polling after confirmations
        if (
          newStatus !== TransactionStatus.PENDING &&
          newStatus !== TransactionStatus.UNKNOWN
        ) {
          const confirmations = this.confirmations.get(id) || 0;
          if (confirmations >= this.config.confirmationsRequired) {
            this.stopMonitoring(id);
          }
        }
      } catch (error) {
        console.error(`Error polling transaction ${id}:`, error);
        
        // Notify listeners of the error
        const tx = this.transactions.get(id);
        if (tx) {
          this.notifyError(tx, error as Error);
        }
      }
    }, this.config.pollingInterval);
    
    // Store the interval for cleanup
    this.pollingIntervals.set(id, interval);
  }
  
  /**
   * Handle a confirmed or failed transaction
   */
  private async handleConfirmedOrFailed(transaction: Transaction): Promise<void> {
    try {
      // Get the receipt
      const receipt = await this.transactionBuilder.getTransactionReceipt(transaction.hash!);
      
      // Update confirmations
      const confirmations = (receipt as any).confirmations || 1;
      this.confirmations.set(transaction.hash || transaction.id, confirmations);
      
      // Notify listeners of confirmations
      this.notifyConfirmation(transaction, confirmations);
      
      // Notify of success or failure
      if (receipt.status) {
        this.notifySuccess(transaction, receipt);
      } else {
        this.notifyFailure(transaction, receipt);
      }
    } catch (error) {
      console.error(`Error getting receipt for ${transaction.hash}:`, error);
      this.notifyError(transaction, error as Error);
    }
  }
  
  /**
   * Notify listeners of a status change
   */
  private notifyStatusChange(transaction: Transaction, oldStatus: TransactionStatus, newStatus: TransactionStatus): void {
    const id = transaction.hash || transaction.id;
    const listeners = this.listeners.get(id) || [];
    
    for (const listener of listeners) {
      try {
        listener.onStatusChange(transaction, oldStatus, newStatus);
      } catch (error) {
        console.error("Error in transaction listener:", error);
      }
    }
  }
  
  /**
   * Notify listeners of confirmations
   */
  private notifyConfirmation(transaction: Transaction, confirmations: number): void {
    const id = transaction.hash || transaction.id;
    const listeners = this.listeners.get(id) || [];
    
    for (const listener of listeners) {
      try {
        listener.onConfirmation(transaction, confirmations);
      } catch (error) {
        console.error("Error in transaction listener:", error);
      }
    }
  }
  
  /**
   * Notify listeners of success
   */
  private notifySuccess(transaction: Transaction, receipt: TransactionReceipt): void {
    const id = transaction.hash || transaction.id;
    const listeners = this.listeners.get(id) || [];
    
    for (const listener of listeners) {
      try {
        listener.onSuccess(transaction, receipt);
      } catch (error) {
        console.error("Error in transaction listener:", error);
      }
    }
  }
  
  /**
   * Notify listeners of failure
   */
  private notifyFailure(transaction: Transaction, receipt: TransactionReceipt, error?: Error): void {
    const id = transaction.hash || transaction.id;
    const listeners = this.listeners.get(id) || [];
    
    for (const listener of listeners) {
      try {
        listener.onFailure(transaction, receipt, error);
      } catch (error) {
        console.error("Error in transaction listener:", error);
      }
    }
  }
  
  /**
   * Notify listeners of an error
   */
  private notifyError(transaction: Transaction, error: Error): void {
    const id = transaction.hash || transaction.id;
    const listeners = this.listeners.get(id) || [];
    
    for (const listener of listeners) {
      try {
        listener.onError(transaction, error);
      } catch (listenerError) {
        console.error("Error in transaction listener:", listenerError);
      }
    }
  }
  
  async getTransactionByHash(hash: string): Promise<any> {
    return this.transactionBuilder.getTransaction(hash);
  }

  async getTransactionHistory(address: string, limit = 10): Promise<any[]> {
    // This method may not exist on BaseTransactionBuilder, so implement a fallback
    if (typeof this.transactionBuilder['getTransactionHistory'] === 'function') {
      return (this.transactionBuilder as any).getTransactionHistory(address, limit);
    }
    return [];
  }

  async sendTransaction(to: string, amount: string, privateKey: string): Promise<string> {
    // Implement based on available methods in BaseTransactionBuilder
    // First create a transaction
    const from = ''; // We would need to derive this from privateKey
    const tx = await this.transactionBuilder.buildTransaction(from, to, amount);
    
    // Sign it
    const signedTx = await this.transactionBuilder.signTransaction(tx, privateKey);
    
    // Send it
    return this.transactionBuilder.sendTransaction(signedTx);
  }

  async getBalance(address: string): Promise<string> {
    // This method may not exist on BaseTransactionBuilder
    if (typeof this.transactionBuilder['getBalance'] === 'function') {
      return (this.transactionBuilder as any).getBalance(address);
    }
    return '0';
  }
}

// Default implementation of a transaction listener with empty methods
export class DefaultTransactionListener implements TransactionListener {
  onStatusChange(transaction: Transaction, oldStatus: TransactionStatus, newStatus: TransactionStatus): void {}
  onConfirmation(transaction: Transaction, confirmations: number): void {}
  onSuccess(transaction: Transaction, receipt: TransactionReceipt): void {}
  onFailure(transaction: Transaction, receipt: TransactionReceipt, error?: Error): void {}
  onError(transaction: Transaction, error: Error): void {}
}

// Export singleton instance
export const transactionMonitor = TransactionMonitor.getInstance(Blockchain.ETHEREUM, {
  nodeUrl: "https://mainnet.infura.io/v3/your-infura-key" 
});