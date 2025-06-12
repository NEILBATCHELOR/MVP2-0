import { ethers, parseUnits, formatEther } from "ethers";

/**
 * Transaction status enum
 */
export enum TransactionStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  FAILED = "failed",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  UNKNOWN = "unknown"
}

/**
 * Transaction priority/fee level
 */
export enum TransactionPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

/**
 * Base transaction interface
 */
export interface Transaction {
  id: string;
  hash?: string;
  from: string;
  to: string;
  value: string;
  data?: string;
  status: TransactionStatus;
  timestamp: number;
  blockNumber?: number;
  blockHash?: string;
  networkFee?: string;
  gasUsed?: string;
  gasPrice?: string;
  nonce?: number;
  blockchain: string;
  chainId: number;
  type?: string;
  simulationResult?: TransactionSimulationResult;
}

/**
 * Transaction simulation result
 */
export interface TransactionSimulationResult {
  success: boolean;
  gasUsed: string;
  error?: string;
  logs?: any[];
  events?: any[];
  returnValue?: string;
}

/**
 * Transaction signature
 */
export interface TransactionSignature {
  r: string;
  s: string;
  v: number;
  signature: string;
  signer: string;
}

/**
 * Transaction with collected signatures
 */
export interface SignedTransaction extends Transaction {
  signatures: TransactionSignature[];
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
  hash: string;
  blockNumber: number;
  blockHash: string;
  status: boolean;
  gasUsed: string;
  logs: any[];
  events?: any[];
  from: string;
  to: string;
  contractAddress?: string;
}

/**
 * Transaction fee estimate
 */
export interface TransactionFeeEstimate {
  low: {
    fee: string;
    time: number; // estimated confirmation time in seconds
  };
  medium: {
    fee: string;
    time: number;
  };
  high: {
    fee: string;
    time: number;
  };
  baseFee?: string;
  priorityFee?: string;
  maxFee?: string;
  gasPrice?: string;
  gasLimit: string;
}

/**
 * Transaction builder interface for creating, signing, and executing transactions
 */
export interface TransactionBuilder {
  /**
   * Build a transaction object
   */
  buildTransaction(
    from: string,
    to: string,
    value: string,
    data?: string,
    options?: any
  ): Promise<Transaction>;
  
  /**
   * Simulate a transaction to check if it will succeed
   */
  simulateTransaction(transaction: Transaction): Promise<TransactionSimulationResult>;
  
  /**
   * Estimate the gas/fee for a transaction
   */
  estimateFee(transaction: Transaction): Promise<TransactionFeeEstimate>;
  
  /**
   * Sign a transaction with a private key
   */
  signTransaction(transaction: Transaction, privateKey: string): Promise<SignedTransaction>;
  
  /**
   * Send a signed transaction to the network
   */
  sendTransaction(transaction: SignedTransaction): Promise<string>;
  
  /**
   * Get a transaction by its hash
   */
  getTransaction(hash: string): Promise<Transaction>;
  
  /**
   * Get a transaction receipt by its hash
   */
  getTransactionReceipt(hash: string): Promise<TransactionReceipt>;
  
  /**
   * Get the current status of a transaction
   */
  getTransactionStatus(hash: string): Promise<TransactionStatus>;
  
  /**
   * Track a transaction until it is confirmed or fails
   */
  waitForTransaction(hash: string, confirmations?: number): Promise<TransactionReceipt>;
  
  /**
   * Cancel a pending transaction (if supported by the blockchain)
   */
  cancelTransaction?(hash: string, privateKey: string): Promise<string>;
  
  /**
   * Speed up a pending transaction (if supported by the blockchain)
   */
  speedUpTransaction?(hash: string, privateKey: string, priorityLevel: TransactionPriority): Promise<string>;
}

/**
 * Abstract base class for transaction builders
 */
export abstract class BaseTransactionBuilder implements TransactionBuilder {
  protected provider:  any;
  protected blockchain: string;
  
  constructor(provider:  any, blockchain: string) {
    this.provider = provider;
    this.blockchain = blockchain;
  }
  
  abstract buildTransaction(
    from: string,
    to: string,
    value: string,
    data?: string,
    options?: any
  ): Promise<Transaction>;
  
  abstract simulateTransaction(transaction: Transaction): Promise<TransactionSimulationResult>;
  
  abstract estimateFee(transaction: Transaction): Promise<TransactionFeeEstimate>;
  
  abstract signTransaction(transaction: Transaction, privateKey: string): Promise<SignedTransaction>;
  
  abstract sendTransaction(transaction: SignedTransaction): Promise<string>;
  
  abstract getTransaction(hash: string): Promise<Transaction>;
  
  abstract getTransactionReceipt(hash: string): Promise<TransactionReceipt>;
  
  abstract getTransactionStatus(hash: string): Promise<TransactionStatus>;
  
  abstract waitForTransaction(hash: string, confirmations?: number): Promise<TransactionReceipt>;
  
  /**
   * Cancel a transaction with a 0 value transaction to the same address with the same nonce
   * but higher gas price
   */
  async cancelTransaction(hash: string, privateKey: string): Promise<string> {
    // Default implementation for EVM-compatible chains
    if (!this.isEVMCompatible()) {
      throw new Error("Cancelling transactions is not supported for this blockchain");
    }
    
    const transaction = await this.getTransaction(hash);
    
    if (!transaction.nonce) {
      throw new Error("Cannot cancel transaction: nonce is unknown");
    }
    
    // Create a 0 value transaction to the same from address
    const cancelTx: Transaction = {
      ...transaction,
      id: `${transaction.id}_cancel`,
      to: transaction.from, // Send to self
      value: "0",
      data: "0x",
      status: TransactionStatus.PENDING,
      timestamp: Math.floor(Date.now() / 1000),
      gasPrice: this.increaseFeeForCancel(transaction)
    };
    
    // Sign and send the transaction
    const signedTransaction = await this.signTransaction(cancelTx, privateKey);
    return this.sendTransaction(signedTransaction);
  }
  
  /**
   * Speed up a transaction by sending a new one with the same parameters but higher gas price
   */
  async speedUpTransaction(hash: string, privateKey: string, priorityLevel: TransactionPriority): Promise<string> {
    // Default implementation for EVM-compatible chains
    if (!this.isEVMCompatible()) {
      throw new Error("Speeding up transactions is not supported for this blockchain");
    }
    
    const transaction = await this.getTransaction(hash);
    
    if (!transaction.nonce) {
      throw new Error("Cannot speed up transaction: nonce is unknown");
    }
    
    // Create same transaction with higher gas price
    const speedUpTx: Transaction = {
      ...transaction,
      id: `${transaction.id}_speedup`,
      status: TransactionStatus.PENDING,
      timestamp: Math.floor(Date.now() / 1000),
      gasPrice: this.increaseFeeForSpeedup(transaction, priorityLevel)
    };
    
    // Sign and send the transaction
    const signedTransaction = await this.signTransaction(speedUpTx, privateKey);
    return this.sendTransaction(signedTransaction);
  }
  
  /**
   * Calculate increased gas price for cancellation (default 50% increase)
   */
  protected increaseFeeForCancel(transaction: Transaction): string {
    if (!transaction.gasPrice) {
      throw new Error("Cannot calculate increased fee: gas price is unknown");
    }
    
    const currentGasPrice = BigInt(transaction.gasPrice);
    const increasedGasPrice = currentGasPrice * 150n / 100n; // 50% increase
    
    return increasedGasPrice.toString();
  }
  
  /**
   * Calculate increased gas price for speeding up (varies by priority level)
   */
  protected increaseFeeForSpeedup(transaction: Transaction, priorityLevel: TransactionPriority): string {
    if (!transaction.gasPrice) {
      throw new Error("Cannot calculate increased fee: gas price is unknown");
    }
    
    const currentGasPrice = BigInt(transaction.gasPrice);
    
    // Increase based on priority level
    let increasedGasPrice: bigint;
    
    switch (priorityLevel) {
      case TransactionPriority.LOW:
        increasedGasPrice = currentGasPrice * 120n / 100n; // 20% increase
        break;
      case TransactionPriority.MEDIUM:
        increasedGasPrice = currentGasPrice * 150n / 100n; // 50% increase
        break;
      case TransactionPriority.HIGH:
        increasedGasPrice = currentGasPrice * 200n / 100n; // 100% increase
        break;
      case TransactionPriority.URGENT:
        increasedGasPrice = currentGasPrice * 300n / 100n; // 200% increase
        break;
      default:
        increasedGasPrice = currentGasPrice * 150n / 100n; // 50% default
    }
    
    return increasedGasPrice.toString();
  }
  
  /**
   * Check if the blockchain is EVM-compatible
   */
  protected isEVMCompatible(): boolean {
    const evmChains = [
      "ethereum", "polygon", "avalanche", "optimism", "arbitrum",
      "base", "mantle", "zksync", "hedera"
    ];
    
    return evmChains.includes(this.blockchain.toLowerCase());
  }
}

/**
 * Factory for creating blockchain-specific transaction builders
 */
export interface TransactionBuilderFactory {
  /**
   * Create a transaction builder for a specific blockchain
   */
  createBuilder(blockchain: string, provider: any): TransactionBuilder;
  
  /**
   * Register a new transaction builder for a blockchain
   */
  registerBuilder(blockchain: string, builderClass: new (provider: any, blockchain: string) => TransactionBuilder): void;
  
  /**
   * Get a list of supported blockchains
   */
  getSupportedBlockchains(): string[];
}