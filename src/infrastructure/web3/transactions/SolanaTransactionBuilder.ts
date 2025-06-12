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
import * as web3 from '@/infrastructure/web3/solanaShim';
import { Keypair, PublicKey, Transaction as SolanaTransaction } from '@/infrastructure/web3/solanaShim';

/**
 * Implementation of TransactionBuilder for Solana blockchain
 */
export class SolanaTransactionBuilder extends BaseTransactionBuilder {
  private connection: web3.Connection;

  constructor(provider: web3.Connection, blockchain: string) {
    super(provider as any, blockchain);
    this.connection = provider;
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
      const fromPubkey = new PublicKey(from);
      const toPubkey = new PublicKey(to);
      
      // Convert value from SOL to lamports (1 SOL = 1,000,000,000 lamports)
      const lamports = Math.floor(parseFloat(value) * web3.LAMPORTS_PER_SOL);
      
      // Create a transfer instruction
      const transferInstruction = web3.SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      });
      
      // Create a transaction
      const solanaTransaction = new SolanaTransaction().add(transferInstruction);
      
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      solanaTransaction.recentBlockhash = blockhash;
      solanaTransaction.feePayer = fromPubkey;
      
      // Simulate to get fee
      const simulationResult = await this.connection.simulateTransaction(solanaTransaction);
      
      // Generate a unique ID for this transaction
      const txId = `solana_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Create and return transaction object
      return {
        id: txId,
        from,
        to,
        value,
        data: data || '',
        status: TransactionStatus.PENDING,
        timestamp: Math.floor(Date.now() / 1000),
        blockchain: this.blockchain,
        chainId: 0, // Solana doesn't use chain IDs
        type: 'solana_transfer',
        // Store Solana-specific data needed for signing later
        simulationResult: {
          success: simulationResult.value.err === null,
          gasUsed: simulationResult.value.unitsConsumed?.toString() || '0',
          logs: simulationResult.value.logs || [],
          returnValue: JSON.stringify({
            serializedMessage: Buffer.from(solanaTransaction.serializeMessage()).toString('base64'),
            blockhash,
            lastValidBlockHeight
          })
        }
      };
    } catch (error) {
      throw new Error(`Failed to build Solana transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Simulate a transaction to check for potential failures
   */
  async simulateTransaction(transaction: Transaction): Promise<TransactionSimulationResult> {
    try {
      if (!transaction.simulationResult?.returnValue) {
        throw new Error('Transaction missing required Solana transaction data');
      }
      
      const txData = JSON.parse(transaction.simulationResult.returnValue);
      const message = SolanaTransaction.from(Buffer.from(txData.serializedMessage, 'base64'));
      
      // Simulate the transaction
      const simulation = await this.connection.simulateTransaction(message);
      
      return {
        success: simulation.value.err === null,
        gasUsed: simulation.value.unitsConsumed?.toString() || '0',
        logs: simulation.value.logs || [],
        error: simulation.value.err ? JSON.stringify(simulation.value.err) : undefined,
        returnValue: transaction.simulationResult.returnValue
      };
    } catch (error) {
      return {
        success: false,
        gasUsed: '0',
        error: `Failed to simulate Solana transaction: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Estimate the fee for a transaction based on current network conditions
   */
  async estimateFee(transaction: Transaction): Promise<TransactionFeeEstimate> {
    try {
      // Solana fees are different from Ethereum - they're fixed per signature
      // but also depend on compute units used
      
      // Get the current fee schedule
      const feeSchedule = await this.connection.getRecentPrioritizationFees();
      
      if (!feeSchedule || feeSchedule.length === 0) {
        throw new Error('Failed to get fee schedule');
      }
      
      // Sort by prioritization fee
      feeSchedule.sort((a, b) => a.prioritizationFee - b.prioritizationFee);
      
      // Get recent fees in ascending order
      const lowFee = feeSchedule[0]?.prioritizationFee || 0;
      const mediumFee = feeSchedule[Math.floor(feeSchedule.length / 2)]?.prioritizationFee || lowFee * 1.2;
      const highFee = feeSchedule[feeSchedule.length - 1]?.prioritizationFee || lowFee * 1.5;
      
      // Base fee is 5000 lamports per signature
      const baseFee = 5000;
      const signature = 1; // Assuming 1 signature
      
      return {
        low: {
          fee: ((baseFee + lowFee) * signature / web3.LAMPORTS_PER_SOL).toString(),
          time: 15 // seconds
        },
        medium: {
          fee: ((baseFee + mediumFee) * signature / web3.LAMPORTS_PER_SOL).toString(),
          time: 10
        },
        high: {
          fee: ((baseFee + highFee) * signature / web3.LAMPORTS_PER_SOL).toString(),
          time: 5
        },
        gasPrice: (baseFee / web3.LAMPORTS_PER_SOL).toString(),
        gasLimit: '1',
      };
    } catch (error) {
      // Return a default fee estimate if we fail to get network data
      return {
        low: {
          fee: '0.000005',
          time: 15
        },
        medium: {
          fee: '0.000008',
          time: 10
        },
        high: {
          fee: '0.00001',
          time: 5
        },
        gasPrice: '0.000005',
        gasLimit: '1',
      };
    }
  }

  /**
   * Sign a transaction with a private key
   */
  async signTransaction(transaction: Transaction, privateKey: string): Promise<SignedTransaction> {
    try {
      if (!transaction.simulationResult?.returnValue) {
        throw new Error('Transaction missing required Solana transaction data');
      }
      
      // Parse the transaction data
      const txData = JSON.parse(transaction.simulationResult.returnValue);
      
      // Convert the messageBytes back to a Message object
      const messageBytes = Buffer.from(txData.serializedMessage, 'base64');
      
      // Create a new transaction with this message
      const tx = SolanaTransaction.populate(web3.Message.from(messageBytes));
      
      // Create keypair from private key
      // Private key should be base58 encoded or a Uint8Array
      let keypair: Keypair;
      
      if (privateKey.startsWith('0x')) {
        // Convert hex to Uint8Array
        keypair = Keypair.fromSecretKey(
          Buffer.from(privateKey.substring(2), 'hex')
        );
      } else {
        // Assume base58 encoded or direct bytes
        try {
          const secretKey = new Uint8Array(Buffer.from(privateKey, 'base64'));
          keypair = Keypair.fromSecretKey(secretKey);
        } catch {
          // Try as raw bytes
          const secretKey = new Uint8Array(64);
          Buffer.from(privateKey, 'hex').copy(secretKey);
          keypair = Keypair.fromSecretKey(secretKey);
        }
      }
      
      // Sign the transaction
      tx.sign(keypair);
      
      // Create a signature object
      const signature: TransactionSignature = {
        r: '0x', // Solana doesn't use r, s, v
        s: '0x',
        v: 0,
        signature: tx.serialize().toString('base64'),
        signer: transaction.from
      };
      
      // Return the signed transaction
      return {
        ...transaction,
        signatures: [signature]
      };
    } catch (error) {
      throw new Error(`Failed to sign Solana transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send a signed transaction to the network
   */
  async sendTransaction(transaction: SignedTransaction): Promise<string> {
    try {
      if (!transaction.signatures || transaction.signatures.length === 0) {
        throw new Error('Transaction is not signed');
      }
      
      // Get the signed transaction
      const signedTx = Buffer.from(transaction.signatures[0].signature, 'base64');
      
      // Send the transaction
      const signature = await this.connection.sendRawTransaction(signedTx);
      
      // Return the transaction signature (hash)
      return signature;
    } catch (error) {
      throw new Error(`Failed to send Solana transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a transaction by its hash (signature)
   */
  async getTransaction(hash: string): Promise<Transaction> {
    try {
      // Get the transaction details
      const tx = await this.connection.getTransaction(hash, {
        maxSupportedTransactionVersion: 0
      });
      
      if (!tx) {
        throw new Error(`Transaction ${hash} not found`);
      }
      
      // Extract transaction details
      const from = tx.transaction.message.getAccountKeys().get(0)?.toBase58() || '';
      const to = tx.meta?.postTokenBalances?.[0]?.owner || 
                 tx.transaction.message.getAccountKeys().get(1)?.toBase58() || '';
      
      // Calculate value in SOL
      const value = tx.meta?.preBalances[0] && tx.meta?.postBalances[0]
        ? ((tx.meta.preBalances[0] - tx.meta.postBalances[0]) / web3.LAMPORTS_PER_SOL).toString()
        : '0';
      
      // Create transaction object
      return {
        id: hash,
        hash,
        from,
        to,
        value,
        data: '',
        status: tx.meta?.err ? TransactionStatus.FAILED : TransactionStatus.CONFIRMED,
        timestamp: tx.blockTime || Math.floor(Date.now() / 1000),
        blockNumber: tx.slot,
        blockHash: '',
        networkFee: (tx.meta?.fee / web3.LAMPORTS_PER_SOL).toString(),
        blockchain: this.blockchain,
        chainId: 0,
      };
    } catch (error) {
      throw new Error(`Failed to get Solana transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a transaction receipt by its hash (signature)
   */
  async getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    try {
      // Get the transaction details
      const tx = await this.connection.getTransaction(hash, {
        maxSupportedTransactionVersion: 0
      });
      
      if (!tx) {
        throw new Error(`Transaction ${hash} not found`);
      }
      
      // Create receipt object
      return {
        hash,
        blockNumber: tx.slot,
        blockHash: tx.transaction.message.recentBlockhash || '',
        status: tx.meta?.err === null,
        gasUsed: tx.meta?.fee.toString() || '0',
        logs: tx.meta?.logMessages || [],
        from: tx.transaction.message.getAccountKeys().get(0)?.toBase58() || '',
        to: tx.meta?.postTokenBalances?.[0]?.owner || 
            tx.transaction.message.getAccountKeys().get(1)?.toBase58() || '',
      };
    } catch (error) {
      throw new Error(`Failed to get Solana transaction receipt: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the current status of a transaction
   */
  async getTransactionStatus(hash: string): Promise<TransactionStatus> {
    try {
      // Get the transaction
      const signature = await this.connection.getSignatureStatus(hash);
      
      if (!signature || !signature.value) {
        return TransactionStatus.PENDING; // Transaction not found or pending
      }
      
      if (signature.value.err) {
        return TransactionStatus.FAILED;
      }
      
      if (signature.value.confirmationStatus === 'finalized') {
        return TransactionStatus.CONFIRMED;
      }
      
      if (signature.value.confirmationStatus === 'confirmed') {
        return TransactionStatus.CONFIRMED;
      }
      
      return TransactionStatus.PENDING;
    } catch (error) {
      return TransactionStatus.UNKNOWN;
    }
  }

  /**
   * Wait for a transaction to be confirmed
   */
  async waitForTransaction(hash: string, confirmations: number = 1): Promise<TransactionReceipt> {
    try {
      // Wait for the transaction to be confirmed
      // For Solana, we'll consider it confirmed when it reaches 'confirmed' or 'finalized' status
      
      // Default to wait for 'confirmed' status
      const commitment: web3.Finality = confirmations > 1 ? 'finalized' : 'confirmed';
      
      // Wait for the transaction to be confirmed
      await this.connection.confirmTransaction({
        signature: hash,
        blockhash: '',
        lastValidBlockHeight: 0,
      }, commitment);
      
      // Get the transaction receipt
      return this.getTransactionReceipt(hash);
    } catch (error) {
      throw new Error(`Failed to wait for Solana transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}