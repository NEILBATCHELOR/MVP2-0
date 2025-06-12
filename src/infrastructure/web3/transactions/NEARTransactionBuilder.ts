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
import * as nearAPI from 'near-api-js';
import { connect, keyStores, utils, transactions, providers } from 'near-api-js';
import { PublicKey } from 'near-api-js/lib/utils/key_pair';
import { KeyPair } from 'near-api-js/lib/utils/key_pair';
import BN from 'bn.js';

/**
 * Implementation of TransactionBuilder for NEAR Protocol blockchain
 */
export class NEARTransactionBuilder extends BaseTransactionBuilder {
  private near: nearAPI.Near | null = null;
  private networkId: string;
  private nodeUrl: string;
  private keyStore: keyStores.InMemoryKeyStore;

  constructor(provider: any, blockchain: string) {
    super(provider, blockchain);
    this.nodeUrl = provider.nodeUrl || "https://rpc.testnet.near.org";
    this.networkId = provider.networkId || "testnet";
    this.keyStore = new keyStores.InMemoryKeyStore();
  }

  private async getNearConnection(): Promise<nearAPI.Near> {
    if (!this.near) {
      this.near = await connect({
        networkId: this.networkId,
        nodeUrl: this.nodeUrl,
        keyStore: this.keyStore,
        headers: {}
      });
    }
    return this.near;
  }

  /**
   * Build a transaction object from the provided parameters
   */
  async buildTransaction(
    from: string,
    to: string,
    value: string,
    data?: string,
    options?: any
  ): Promise<Transaction> {
    try {
      const near = await this.getNearConnection();
      const account = await near.account(from);
      
      // Convert NEAR amount to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
      const yoctoNEARAmount = utils.format.parseNearAmount(value);
      
      if (!yoctoNEARAmount) {
        throw new Error('Invalid NEAR amount');
      }
      
      // Get the current access key and nonce
      const accessKey = await account.findAccessKey(to, []);
      if (!accessKey) {
        throw new Error(`No access key found for ${from}`);
      }
      
      // Get the account's public key
      const publicKey = accessKey.publicKey;
      
      // Get the latest block hash
      const provider = new providers.JsonRpcProvider({ url: this.nodeUrl });
      const blockInfo = await provider.block({ finality: 'final' });
      const blockHash = utils.serialize.base_decode(blockInfo.header.hash);
      
      // Create a transfer action
      const actions = [transactions.transfer(BigInt(yoctoNEARAmount))];
      
      // Create a transaction with a properly converted nonce
      const nonce = Number(accessKey.accessKey.nonce) + 1;
      
      const transaction = transactions.createTransaction(
        from,
        publicKey,
        to,
        nonce,
        actions,
        blockHash
      );
      
      // Serialize the transaction for later use (using any to bypass type issues)
      const serializedTx = utils.serialize.serialize(
        transactions.SCHEMA as any,
        transaction
      );

      // Generate a transaction ID
      const txId = `near_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Create a transaction object with proper nonce conversion
      return {
        id: txId,
        from,
        to,
        value,
        data: data || '',
        status: TransactionStatus.PENDING,
        timestamp: Math.floor(Date.now() / 1000),
        blockchain: this.blockchain,
        chainId: 0, // NEAR doesn't use chain IDs
        nonce: nonce,
        // Store NEAR-specific data
        type: 'near_transfer',
        // Store data needed for signing
        simulationResult: {
          success: true,
          gasUsed: '0',
          logs: [],
          returnValue: Buffer.from(serializedTx).toString('base64')
        }
      };
    } catch (error) {
      throw new Error(`Failed to build NEAR transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Simulate a transaction to check for potential failures
   */
  async simulateTransaction(transaction: Transaction): Promise<TransactionSimulationResult> {
    try {
      // NEAR doesn't have a direct simulation feature like Ethereum
      // But we can perform basic validation
      
      if (!transaction.simulationResult?.returnValue) {
        throw new Error('Transaction missing required NEAR transaction data');
      }
      
      // Just return a success result as we can't really simulate
      return {
        success: true,
        gasUsed: '0',
        logs: [],
        returnValue: transaction.simulationResult.returnValue
      };
    } catch (error) {
      return {
        success: false,
        gasUsed: '0',
        error: `Failed to simulate NEAR transaction: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Estimate the fee for a transaction based on current network conditions
   */
  async estimateFee(transaction: Transaction): Promise<TransactionFeeEstimate> {
    try {
      // NEAR fees are quite low and consistent
      // Return a default fee estimate based on typical values
      
      return {
        low: {
          fee: '0.001', // 0.001 NEAR is typical for a transfer
          time: 1 // NEAR is fast, typically 1-2 seconds
        },
        medium: {
          fee: '0.001',
          time: 1
        },
        high: {
          fee: '0.001',
          time: 1
        },
        gasPrice: '0', // NEAR doesn't use gas price
        gasLimit: '300000000000000', // 300 TGas is the default
      };
    } catch (error) {
      // Return a default fee estimate
      return {
        low: {
          fee: '0.001',
          time: 1
        },
        medium: {
          fee: '0.001',
          time: 1
        },
        high: {
          fee: '0.001',
          time: 1
        },
        gasPrice: '0',
        gasLimit: '300000000000000',
      };
    }
  }

  /**
   * Sign a transaction with a private key
   */
  async signTransaction(transaction: Transaction, privateKey: string): Promise<SignedTransaction> {
    try {
      if (!transaction.simulationResult?.returnValue) {
        throw new Error('Transaction missing required NEAR transaction data');
      }
      
      // Deserialize the transaction (using any to bypass type issues)
      const serializedTx = Buffer.from(transaction.simulationResult.returnValue, 'base64');
      const tx = utils.serialize.deserialize(
        transactions.SCHEMA as any,
        transactions.Transaction as any,
        serializedTx as any
      );
      
      // Create a key pair from the private key (using any to bypass KeyPairString type)
      const keyPair = KeyPair.fromString(privateKey as any);
      
      // Sign the transaction
      const signature = keyPair.sign(serializedTx);
      
      // Create a signed transaction (using any to bypass type issues)
      const signedTx = new transactions.SignedTransaction({
        transaction: tx,
        signature: signature
      } as any);
      
      // Serialize the signed transaction (using any to bypass type issues)
      const serializedSignedTx = utils.serialize.serialize(
        transactions.SCHEMA as any,
        signedTx
      );
      
      // Create a signature object
      const signatureObj: TransactionSignature = {
        r: '0x', // NEAR doesn't use r, s, v
        s: '0x',
        v: 0,
        signature: Buffer.from(serializedSignedTx).toString('base64'),
        signer: transaction.from
      };
      
      // Return the signed transaction
      return {
        ...transaction,
        signatures: [signatureObj]
      };
    } catch (error) {
      throw new Error(`Failed to sign NEAR transaction: ${error instanceof Error ? error.message : String(error)}`);
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
      
      // Create a direct provider to avoid connection issues
      const provider = new providers.JsonRpcProvider({ url: this.nodeUrl });
      
      // Get the signed transaction blob
      const signedTxBase64 = transaction.signatures[0].signature;
      const signedTxBytes = Buffer.from(signedTxBase64, 'base64');
      
      // Deserialize the signed transaction (using any to bypass type issues)
      const signedTx = utils.serialize.deserialize(
        transactions.SCHEMA as any,
        transactions.SignedTransaction as any,
        signedTxBytes as any
      );
      
      // Send the transaction to the network (using any to bypass type issues)
      const result = await provider.sendTransaction(signedTx as any);
      
      // Return the transaction hash
      return result.transaction.hash;
    } catch (error) {
      throw new Error(`Failed to send NEAR transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a transaction by its hash
   */
  async getTransaction(hash: string): Promise<Transaction> {
    try {
      // Create a provider instance with specific config
      const provider = new providers.JsonRpcProvider({ url: this.nodeUrl });
      
      // Use the provider directly to call JSON-RPC to avoid type issues
      const encodedHash = utils.serialize.base_encode(Buffer.from(hash, 'hex'));
      
      // Make the request directly with type casting
      const txResult = await provider.sendJsonRpc('tx', [encodedHash, 'sender_account_id']) as any;
      
      // Extract required information from the response
      return {
        id: hash,
        hash,
        from: txResult.transaction?.signer_id || '',
        to: txResult.transaction?.receiver_id || '',
        value: this.extractAmount(txResult),
        data: '',
        status: this.extractTransactionStatus(txResult),
        timestamp: Math.floor(Date.now() / 1000),
        blockNumber: this.extractBlockNumber(txResult),
        blockchain: this.blockchain,
        chainId: 0,
        type: 'near_transfer',
      };
    } catch (error) {
      throw new Error(`Failed to get NEAR transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a transaction receipt
   */
  async getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    try {
      // Create a provider instance
      const provider = new providers.JsonRpcProvider({ url: this.nodeUrl });
      
      // Use the provider directly to call JSON-RPC to avoid type issues
      const encodedHash = utils.serialize.base_encode(Buffer.from(hash, 'hex'));
      
      // Make the request directly with type casting
      const txResult = await provider.sendJsonRpc('tx', [encodedHash, 'sender_account_id']) as any;
      
      // Extract logs from all receipts
      const logs: string[] = [];
      if (txResult.receipts_outcome) {
        txResult.receipts_outcome.forEach((receipt: any) => {
          if (receipt.outcome?.logs && receipt.outcome.logs.length > 0) {
            logs.push(...receipt.outcome.logs);
          }
        });
      }
      
      // Create a receipt object
      return {
        hash,
        blockNumber: this.extractBlockNumber(txResult),
        blockHash: txResult.transaction_outcome?.block_hash || '',
        status: !this.hasFailureStatus(txResult),
        gasUsed: txResult.transaction_outcome?.outcome?.gas_burnt?.toString() || '0',
        logs,
        from: txResult.transaction?.signer_id || '',
        to: txResult.transaction?.receiver_id || '',
      };
    } catch (error) {
      throw new Error(`Failed to get NEAR transaction receipt: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the current status of a transaction
   */
  async getTransactionStatus(hash: string): Promise<TransactionStatus> {
    try {
      // Create a provider instance
      const provider = new providers.JsonRpcProvider({ url: this.nodeUrl });
      
      // Use the provider directly to call JSON-RPC to avoid type issues
      const encodedHash = utils.serialize.base_encode(Buffer.from(hash, 'hex'));
      
      // Make the request directly with type casting
      const txResult = await provider.sendJsonRpc('tx', [encodedHash, 'sender_account_id']) as any;
      
      return this.extractTransactionStatus(txResult);
    } catch (error) {
      return TransactionStatus.UNKNOWN;
    }
  }

  /**
   * Wait for a transaction to be confirmed
   */
  async waitForTransaction(hash: string, confirmations: number = 1): Promise<TransactionReceipt> {
    try {
      // NEAR transactions are typically confirmed within 1-2 seconds
      // but we'll still implement a polling mechanism
      
      let attempts = 0;
      const maxAttempts = 10;
      const delay = 1000; // 1 second
      
      while (attempts < maxAttempts) {
        try {
          const status = await this.getTransactionStatus(hash);
          
          if (status === TransactionStatus.CONFIRMED) {
            return this.getTransactionReceipt(hash);
          } else if (status === TransactionStatus.FAILED || status === TransactionStatus.REJECTED) {
            throw new Error(`Transaction failed with status: ${status}`);
          }
        } catch (err) {
          // Ignore errors and continue polling
        }
        
        // Wait before the next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;
      }
      
      throw new Error('Transaction confirmation timed out');
    } catch (error) {
      throw new Error(`Failed to wait for NEAR transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper method to extract transaction status from a NEAR transaction result
   */
  private extractTransactionStatus(txResult: any): TransactionStatus {
    if (!txResult || !txResult.status) {
      return TransactionStatus.UNKNOWN;
    }
    
    const status = txResult.status;
    
    if (typeof status === 'object') {
      if ('SuccessValue' in status || 'SuccessReceiptId' in status) {
        return TransactionStatus.CONFIRMED;
      } else if ('Failure' in status) {
        return TransactionStatus.FAILED;
      }
    } else if (typeof status === 'string') {
      if (status === 'pending' || status === 'Pending') {
        return TransactionStatus.PENDING;
      }
    }
    
    return TransactionStatus.UNKNOWN;
  }
  
  /**
   * Helper method to check if a transaction has failed
   */
  private hasFailureStatus(txResult: any): boolean {
    const status = txResult?.status;
    return status && typeof status === 'object' && 'Failure' in status;
  }
  
  /**
   * Helper method to extract block number from a NEAR transaction result
   */
  private extractBlockNumber(txResult: any): number {
    const blockHash = txResult?.transaction_outcome?.block_hash;
    return blockHash ? parseInt(blockHash.substring(0, 8), 16) : 0;
  }

  /**
   * Extract the amount from a NEAR transaction result
   */
  private extractAmount(result: any): string {
    try {
      // Look for transfer actions
      const actions = result.transaction.actions;
      for (const action of actions) {
        if (action.Transfer) {
          // Convert from yoctoNEAR to NEAR
          return utils.format.formatNearAmount(action.Transfer.deposit);
        }
      }
      return '0';
    } catch (error) {
      return '0';
    }
  }
} 