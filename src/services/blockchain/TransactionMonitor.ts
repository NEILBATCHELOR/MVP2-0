/**
 * Transaction monitoring service with fee estimation capabilities
 */

import { feeEstimator, type FeeData, type FeePriority } from './FeeEstimator';

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockNumber?: number;
  timestamp?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

export interface TransactionEvent {
  type: 'status' | 'confirmation' | 'error';
  txHash: string;
  data: any;
}

type EventCallback = (event: TransactionEvent) => void;

export class TransactionMonitor {
  private static instance: TransactionMonitor;
  private callbacks: Map<string, EventCallback[]> = new Map();
  private eventEmitter: EventTarget = new EventTarget();
  
  public static getInstance(): TransactionMonitor {
    if (!TransactionMonitor.instance) {
      TransactionMonitor.instance = new TransactionMonitor();
    }
    return TransactionMonitor.instance;
  }

  private constructor() {}

  /**
   * Get optimal fee data for a transaction
   */
  async getOptimalFeeData(blockchain: string, priority: FeePriority): Promise<FeeData> {
    return feeEstimator.getOptimalFeeData(blockchain, priority);
  }

  /**
   * Monitor a transaction for status updates
   */
  async monitorTransaction(
    blockchain: string,
    txHash: string,
    callback?: EventCallback
  ): Promise<void> {
    if (callback) {
      this.registerCallback(txHash, callback);
    }

    // Start monitoring (mock implementation)
    this.startMonitoring(blockchain, txHash);
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(blockchain: string, txHash: string): Promise<TransactionStatus | null> {
    // Mock implementation - in production would query blockchain
    return {
      status: 'pending',
      confirmations: 0,
      blockNumber: undefined,
      timestamp: Date.now()
    };
  }

  /**
   * Register callback for transaction events
   */
  registerCallback(txHash: string, callback: EventCallback): void {
    if (!this.callbacks.has(txHash)) {
      this.callbacks.set(txHash, []);
    }
    this.callbacks.get(txHash)!.push(callback);
  }

  /**
   * Unregister callback
   */
  unregisterCallback(txHash: string, callback: EventCallback): void {
    const callbacks = this.callbacks.get(txHash);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.callbacks.delete(txHash);
      }
    }
  }

  /**
   * Event emitter methods
   */
  on(eventType: string, callback: (data: any) => void): void {
    this.eventEmitter.addEventListener(eventType, (event: any) => {
      callback(event.detail);
    });
  }

  off(eventType: string, callback: (data: any) => void): void {
    this.eventEmitter.removeEventListener(eventType, callback);
  }

  emit(eventType: string, data: any): void {
    this.eventEmitter.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  }

  /**
   * Start monitoring a transaction (mock implementation)
   */
  private startMonitoring(blockchain: string, txHash: string): void {
    // Mock monitoring - would implement real blockchain monitoring
    setTimeout(() => {
      this.emit('deployment:progress', {
        txHash,
        confirmationCount: 1,
        progress: 10
      });
    }, 1000);

    setTimeout(() => {
      this.emit('deployment:progress', {
        txHash,
        confirmationCount: 5,
        progress: 50
      });
    }, 5000);

    setTimeout(() => {
      this.emit('success', {
        txHash,
        result: {
          tokenAddress: '0x' + Math.random().toString(16).substr(2, 40),
          transactionHash: txHash,
          blockNumber: Math.floor(Math.random() * 1000000),
          timestamp: Date.now(),
          gasUsed: '21000'
        }
      });
    }, 10000);
  }

  /**
   * Get deployment status for a token
   */
  async getDeploymentStatus(tokenId: string): Promise<string | null> {
    // Mock implementation
    return 'pending';
  }
}

// Export singleton instance
export const transactionMonitor = TransactionMonitor.getInstance();

// Default export
export default TransactionMonitor;
