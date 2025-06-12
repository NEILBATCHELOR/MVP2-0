/**
 * Interface for transactions - defines common transaction properties
 * across different blockchains
 */
export interface Transaction {
  from: string;
  to: string;
  value: string;
  data?: string;
  nonce?: number;
  chainId?: number;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  fee?: string; // For non-EVM chains
  memo?: string; // For chains like Stellar, XRP
  [key: string]: any; // Allow for additional blockchain-specific properties
}

/**
 * Interface for transaction status
 */
export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed';
  hash: string;
  blockNumber?: number;
  confirmations?: number;
  error?: string;
  receipt?: any;
}

/**
 * Interface for transaction result
 */
export interface TransactionResult {
  hash: string;
  wait: () => Promise<TransactionStatus>;
}

/**
 * Interface for transaction handlers
 * Each blockchain will have its own implementation
 */
export interface TransactionHandler {
  /**
   * Get the blockchain name
   */
  getBlockchainName(): string;

  /**
   * Build a transaction for sending native currency
   */
  buildTransferTransaction(
    from: string,
    to: string,
    amount: string,
    options?: any
  ): Promise<Transaction>;

  /**
   * Build a transaction for sending tokens
   */
  buildTokenTransferTransaction(
    from: string,
    to: string,
    tokenAddress: string,
    amount: string,
    options?: any
  ): Promise<Transaction>;

  /**
   * Sign a transaction with a private key
   */
  signTransaction(
    transaction: Transaction,
    privateKey: string
  ): Promise<string>;

  /**
   * Send a signed transaction to the network
   */
  sendSignedTransaction(
    signedTransaction: string
  ): Promise<TransactionResult>;

  /**
   * Get the status of a transaction
   */
  getTransactionStatus(
    transactionHash: string
  ): Promise<TransactionStatus>;

  /**
   * Estimate the fee for a transaction
   */
  estimateFee(
    transaction: Transaction
  ): Promise<string>;
}

/**
 * Factory for creating transaction handlers
 */
export class TransactionHandlerFactory {
  private static handlers: Record<string, TransactionHandler> = {};

  /**
   * Get a transaction handler for a blockchain
   */
  static getHandler(blockchain: string): TransactionHandler {
    const normalizedName = blockchain.toLowerCase();
    
    if (!this.handlers[normalizedName]) {
      this.handlers[normalizedName] = this.createHandler(normalizedName);
    }
    
    return this.handlers[normalizedName];
  }

  /**
   * Create a new transaction handler for a blockchain
   */
  private static createHandler(blockchain: string): TransactionHandler {
    // Implementation will be added for each blockchain
    const normalizedName = blockchain.toLowerCase();
    
    // This will be implemented by importing the specific handlers
    // for each blockchain
    throw new Error(`Transaction handler for ${normalizedName} not implemented`);
  }
}