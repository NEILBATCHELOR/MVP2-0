import {
  BaseTransactionBuilder,
  Transaction,
  TransactionFeeEstimate,
  TransactionPriority,
  TransactionReceipt,
  TransactionSignature,
  TransactionSimulationResult,
  SignedTransaction,
  TransactionStatus,
} from './TransactionBuilder';
import { ethers, JsonRpcProvider, Wallet, parseEther, formatEther, parseUnits, formatUnits } from 'ethers';

/**
 * Implementation of TransactionBuilder for Ethereum-compatible blockchains
 */
export class EthereumTransactionBuilder extends BaseTransactionBuilder {
  constructor(provider: JsonRpcProvider, blockchain: string) {
    super(provider, blockchain);
  }
  
  protected get ethProvider(): JsonRpcProvider {
    return this.provider as JsonRpcProvider;
  }

  /**
   * Builds a transaction object from the provided parameters
   */
  async buildTransaction(
    from: string,
    to: string,
    value: string,
    data?: string,
    options?: any
  ): Promise<Transaction> {
    try {
      const network = await this.ethProvider.getNetwork();
      const nonce = await this.ethProvider.getTransactionCount(from, 'pending');
      
      // Get current fee data
      const feeData = await this.ethProvider.getFeeData();
      
      // Estimate gas limit
      const gasLimit = await this.ethProvider.estimateGas({
        from,
        to,
        value: parseEther(value),
        data: data || '0x'
      });
      
      const transaction: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from,
        to,
        value,
        data: data || '0x',
        status: TransactionStatus.PENDING,
        timestamp: Math.floor(Date.now() / 1000),
        blockchain: this.blockchain,
        chainId: Number(network.chainId),
        nonce,
        gasUsed: gasLimit.toString(),
        gasPrice: feeData.gasPrice ? formatUnits(feeData.gasPrice, 'gwei') : undefined,
        type: options?.type || 'transfer'
      };
      
      return transaction;
    } catch (error) {
      throw new Error(`Failed to build transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Simulates a transaction to check for potential failures
   */
  async simulateTransaction(transaction: Transaction): Promise<TransactionSimulationResult> {
    try {
      // Use eth_call to simulate the transaction
      const result = await this.ethProvider.call({
        from: transaction.from,
        to: transaction.to,
        value: parseEther(transaction.value),
        data: transaction.data,
        gasLimit: transaction.gasUsed ? BigInt(transaction.gasUsed) : undefined
      });
      
      // Estimate gas for the transaction
      const gasEstimate = await this.ethProvider.estimateGas({
        from: transaction.from,
        to: transaction.to,
        value: parseEther(transaction.value),
        data: transaction.data
      });
      
      return {
        success: true,
        gasUsed: gasEstimate.toString(),
        returnValue: result,
        logs: [], // Would need trace to get logs
        events: []
      };
    } catch (error) {
      return {
        success: false,
        gasUsed: '0',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Estimates the fee for a transaction based on current network conditions
   */
  async estimateFee(transaction: Transaction): Promise<TransactionFeeEstimate> {
    try {
      // Get current fee data
      const feeData = await this.ethProvider.getFeeData();
      
      // Estimate gas limit
      const gasLimit = await this.ethProvider.estimateGas({
        from: transaction.from,
        to: transaction.to,
        value: parseEther(transaction.value),
        data: transaction.data
      });
      
      const gasLimitStr = gasLimit.toString();
      const baseFee = feeData.gasPrice || BigInt(0);
      
      // Calculate fees for different priority levels
      const lowFee = baseFee * BigInt(90) / BigInt(100); // 10% below current
      const mediumFee = baseFee; // Current fee
      const highFee = baseFee * BigInt(150) / BigInt(100); // 50% above current
      
      const estimate: TransactionFeeEstimate = {
        low: {
          fee: formatEther(lowFee * gasLimit),
          time: 300 // 5 minutes
        },
        medium: {
          fee: formatEther(mediumFee * gasLimit),
          time: 180 // 3 minutes
        },
        high: {
          fee: formatEther(highFee * gasLimit),
          time: 60 // 1 minute
        },
        gasLimit: gasLimitStr,
        gasPrice: formatUnits(baseFee, 'gwei'),
        baseFee: feeData.maxFeePerGas ? formatUnits(feeData.maxFeePerGas, 'gwei') : undefined,
        priorityFee: feeData.maxPriorityFeePerGas ? formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : undefined
      };
      
      return estimate;
    } catch (error) {
      throw new Error(`Failed to estimate fee: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Signs a transaction with the user's wallet
   */
  async signTransaction(transaction: Transaction, privateKey: string): Promise<SignedTransaction> {
    try {
      const wallet = new Wallet(privateKey, this.provider);
      
      // Prepare transaction for signing
      const txRequest = {
        to: transaction.to,
        value: parseEther(transaction.value),
        data: transaction.data,
        gasLimit: transaction.gasUsed ? BigInt(transaction.gasUsed) : undefined,
        gasPrice: transaction.gasPrice ? parseUnits(transaction.gasPrice, 'gwei') : undefined,
        nonce: transaction.nonce
      };
      
      // Sign the transaction
      const signedTx = await wallet.signTransaction(txRequest);
      
      // Parse the signature
      const parsedTx = ethers.Transaction.from(signedTx);
      
      const signature: TransactionSignature = {
        r: parsedTx.signature?.r || '',
        s: parsedTx.signature?.s || '',
        v: parsedTx.signature?.v || 0,
        signature: signedTx,
        signer: wallet.address
      };
      
      const signedTransaction: SignedTransaction = {
        ...transaction,
        signatures: [signature]
      };
      
      return signedTransaction;
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Sends a signed transaction to the network
   */
  async sendTransaction(signedTransaction: SignedTransaction): Promise<string> {
    try {
      if (!signedTransaction.signatures || signedTransaction.signatures.length === 0) {
        throw new Error('Transaction must be signed before sending');
      }
      
      const signature = signedTransaction.signatures[0];
      const response = await this.ethProvider.broadcastTransaction(signature.signature);
      
      return response.hash;
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets a transaction by its hash
   */
  async getTransaction(transactionHash: string): Promise<Transaction> {
    try {
      const tx = await this.ethProvider.getTransaction(transactionHash);
      
      if (!tx) {
        throw new Error('Transaction not found');
      }
      
      const network = await this.ethProvider.getNetwork();
      
      const transaction: Transaction = {
        id: `tx_${transactionHash}`,
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: formatEther(tx.value),
        data: tx.data,
        status: tx.blockNumber ? TransactionStatus.CONFIRMED : TransactionStatus.PENDING,
        timestamp: Math.floor(Date.now() / 1000), // Would need block timestamp
        blockNumber: tx.blockNumber || undefined,
        blockHash: tx.blockHash || undefined,
        gasUsed: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice ? formatUnits(tx.gasPrice, 'gwei') : undefined,
        nonce: tx.nonce,
        blockchain: this.blockchain,
        chainId: Number(network.chainId)
      };
      
      return transaction;
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets the current status of a transaction
   */
  async getTransactionStatus(transactionHash: string): Promise<TransactionStatus> {
    try {
      const tx = await this.ethProvider.getTransaction(transactionHash);
      
      if (!tx) {
        return TransactionStatus.UNKNOWN;
      }
      
      if (tx.blockNumber) {
        // Check if transaction succeeded
        const receipt = await this.ethProvider.getTransactionReceipt(transactionHash);
        if (receipt) {
          return receipt.status === 1 ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED;
        }
        return TransactionStatus.CONFIRMED;
      }
      
      return TransactionStatus.PENDING;
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return TransactionStatus.UNKNOWN;
    }
  }

  /**
   * Gets the receipt of a confirmed transaction
   */
  async getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt> {
    try {
      const receipt = await this.ethProvider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }
      
      const transactionReceipt: TransactionReceipt = {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        status: receipt.status === 1,
        gasUsed: receipt.gasUsed.toString(),
        logs: [...receipt.logs],
        from: receipt.from,
        to: receipt.to || '',
        contractAddress: receipt.contractAddress || undefined
      };
      
      return transactionReceipt;
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Wait for a transaction to be confirmed
   */
  async waitForTransaction(transactionHash: string, confirmations: number = 1): Promise<TransactionReceipt> {
    try {
      const receipt = await this.ethProvider.waitForTransaction(transactionHash, confirmations);
      
      if (!receipt) {
        throw new Error('Transaction failed or was not found');
      }
      
      return {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        status: receipt.status === 1,
        gasUsed: receipt.gasUsed.toString(),
        logs: [...receipt.logs],
        from: receipt.from,
        to: receipt.to || '',
        contractAddress: receipt.contractAddress || undefined
      };
    } catch (error) {
      throw new Error(`Failed to wait for transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Attempts to cancel a pending transaction by submitting a zero-value transaction
   * with the same nonce and higher gas price
   */
  async cancelTransaction(transactionHash: string, privateKey: string): Promise<string> {
    try {
      const originalTx = await this.getTransaction(transactionHash);
      
      if (originalTx.status !== TransactionStatus.PENDING) {
        throw new Error('Can only cancel pending transactions');
      }
      
      // Create cancellation transaction
      const cancelTx = await this.buildTransaction(
        originalTx.from,
        originalTx.from, // Send to self
        '0', // Zero value
        '0x', // Empty data
        {
          nonce: originalTx.nonce,
          gasPrice: this.increaseFeeForCancel(originalTx)
        }
      );
      
      const signedTx = await this.signTransaction(cancelTx, privateKey);
      return await this.sendTransaction(signedTx);
    } catch (error) {
      throw new Error(`Failed to cancel transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Attempts to speed up a pending transaction by resubmitting it with a higher gas price
   */
  async speedUpTransaction(
    transactionHash: string,
    privateKey: string,
    priority: TransactionPriority
  ): Promise<string> {
    try {
      const originalTx = await this.getTransaction(transactionHash);
      
      if (originalTx.status !== TransactionStatus.PENDING) {
        throw new Error('Can only speed up pending transactions');
      }
      
      // Create speed-up transaction with same parameters but higher gas price
      const speedUpTx = await this.buildTransaction(
        originalTx.from,
        originalTx.to,
        originalTx.value,
        originalTx.data,
        {
          nonce: originalTx.nonce,
          gasPrice: this.increaseFeeForSpeedup(originalTx, priority)
        }
      );
      
      const signedTx = await this.signTransaction(speedUpTx, privateKey);
      return await this.sendTransaction(signedTx);
    } catch (error) {
      throw new Error(`Failed to speed up transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}