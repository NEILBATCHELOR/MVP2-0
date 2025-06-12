import type { IBlockchainAdapter, TokenBalance } from './IBlockchainAdapter';
import * as nearAPI from 'near-api-js';
import { 
  connect, 
  keyStores, 
  utils, 
  transactions, 
  providers, 
  Account,
  WalletConnection
} from 'near-api-js';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers/provider';
import BN from 'bn.js';

/**
 * Adapter for NEAR Protocol blockchain
 */
export class NEARAdapter implements IBlockchainAdapter {
  private nearConnection: nearAPI.Near;
  private network: string;
  private keyStore: keyStores.InMemoryKeyStore;
  private _isConnected = false;

  // Required interface properties
  readonly chainId = 'near-1';
  readonly chainName = 'NEAR';
  readonly networkType: 'mainnet' | 'testnet' | 'devnet' | 'regtest' = 'mainnet';
  readonly nativeCurrency = {
    name: 'NEAR',
    symbol: 'NEAR',
    decimals: 24
  };

  constructor(nearConnection: nearAPI.Near, network: string) {
    this.nearConnection = nearConnection;
    this.network = network;
    this.keyStore = new keyStores.InMemoryKeyStore();
    this._isConnected = true; // Assume connected if instantiated
  }

  // Connection management
  async connect(config: any): Promise<void> {
    this._isConnected = true;
  }

  async disconnect(): Promise<void> {
    this._isConnected = false;
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  async getHealth(): Promise<any> {
    try {
      const provider = new providers.JsonRpcProvider({ url: this.nearConnection.config.nodeUrl });
      const status = await provider.status();
      return {
        isHealthy: true,
        latency: 0,
        blockHeight: status.sync_info.latest_block_height,
        lastChecked: Date.now()
      };
    } catch {
      return {
        isHealthy: false,
        latency: 0,
        lastChecked: Date.now()
      };
    }
  }

  // Account operations
  async generateAccount(): Promise<any> {
    const keyPair = utils.KeyPair.fromRandom('ed25519');
    const publicKey = keyPair.getPublicKey().toString();
    const accountId = `${Date.now()}.${this.network}`;
    return {
      address: accountId,
      balance: BigInt(0),
      publicKey
    };
  }

  async importAccount(privateKey: string): Promise<any> {
    const keyPair = utils.KeyPair.fromString(privateKey as any);
    const publicKey = keyPair.getPublicKey().toString();
    const accountId = `imported-${Date.now()}.${this.network}`;
    return {
      address: accountId,
      balance: BigInt(0),
      publicKey
    };
  }

  async getAccount(address: string): Promise<any> {
    const balance = await this.getBalance(address);
    return {
      address,
      balance
    };
  }

  // Transaction operations
  async estimateGas(params: any): Promise<string> {
    return '30000000000000'; // 30 TGas default
  }

  async sendTransaction(params: any): Promise<any> {
    // Implementation for sending transactions
    return {
      txHash: `0x${Date.now()}`,
      status: 'pending' as const
    };
  }

  async getTransaction(txHash: string): Promise<any> {
    return {
      status: 'confirmed' as const,
      confirmations: 1
    };
  }

  async signMessage(message: string, privateKey: string): Promise<string> {
    const keyPair = utils.KeyPair.fromString(privateKey as any);
    const msgBytes = new TextEncoder().encode(message);
    const signature = keyPair.sign(msgBytes);
    return Buffer.from(signature.signature).toString('hex');
  }

  // Block operations
  async getCurrentBlockNumber(): Promise<number> {
    try {
      const provider = new providers.JsonRpcProvider({ url: this.nearConnection.config.nodeUrl });
      const status = await provider.status();
      return status.sync_info.latest_block_height;
    } catch {
      return 0;
    }
  }

  async getBlock(blockNumber: number): Promise<any> {
    try {
      const provider = new providers.JsonRpcProvider({ url: this.nearConnection.config.nodeUrl });
      const block = await provider.block({ blockId: blockNumber });
      return {
        number: block.header.height,
        timestamp: block.header.timestamp,
        hash: block.header.hash,
        transactions: [] // Chunks don't contain transactions directly in NEAR
      };
    } catch {
      return {
        number: blockNumber,
        timestamp: Date.now(),
        hash: `0x${blockNumber}`,
        transactions: []
      };
    }
  }

  // Utility methods
  formatAddress(address: string): string {
    return address; // NEAR addresses are already human-readable
  }

  getExplorerUrl(txHash: string): string {
    return `https://explorer.near.org/transactions/${txHash}`;
  }

  private async getConnection(): Promise<nearAPI.Near> {
    return this.nearConnection;
  }

  getChainName(): string {
    return "near";
  }

  getChainId(): number {
    return 0; // NEAR doesn't use chain IDs in the same way as EVM chains
  }

  async generateAddress(publicKey: string): Promise<string> {
    try {
      // Convert from hex if needed
      let pubKeyValue = publicKey;
      if (publicKey.startsWith('0x')) {
        pubKeyValue = publicKey.substring(2);
      }
      
      // Create a PublicKey from the provided key
      const pubKey = utils.PublicKey.fromString(pubKeyValue);
      
      // Generate an implicit account ID (more like an address)
      const accountId = Buffer.from(pubKey.data).toString('hex');
      
      return accountId;
    } catch (error) {
      throw new Error(`Failed to generate NEAR address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createMultiSigWallet(
    owners: string[],
    threshold: number,
  ): Promise<string> {
    try {
      const near = await this.getConnection();
      const accountId = `multisig-${Date.now()}.${this.network}`;
      
      // In a real implementation, we would deploy a multisig contract
      // and initialize it with the owners and threshold
      
      // Generate a new key pair for the multisig account
      const keyPair = utils.KeyPair.fromRandom('ed25519');
      await this.keyStore.setKey(this.network, accountId, keyPair);
      
      // Create a transaction to create the account and deploy the contract
      // For brevity, we're not including the full contract deployment code
      
      return accountId;
    } catch (error) {
      throw new Error(`Failed to create NEAR multisig wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getBalance(address: string): Promise<bigint> {
    try {
      const near = await this.getConnection();
      const account = await near.account(address);
      const balance = await account.getAccountBalance();
      
      // Return balance in yoctoNEAR as bigint
      return BigInt(balance.available);
    } catch (error) {
      throw new Error(`Failed to get NEAR balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTokenBalance(
    address: string,
    tokenAddress: string,
  ): Promise<TokenBalance> {
    try {
      const near = await this.getConnection();
      const account = await near.account(address);
      
      // Call the ft_balance_of method on the token contract
      const balance = await account.viewFunction({
        contractId: tokenAddress,
        methodName: 'ft_balance_of',
        args: { account_id: address }
      });
      
      // Get token metadata
      const metadata = await account.viewFunction({
        contractId: tokenAddress,
        methodName: 'ft_metadata',
        args: {}
      }).catch(() => ({ symbol: 'TOKEN', decimals: 18 }));
      
      return {
        address: tokenAddress,
        symbol: metadata.symbol || 'TOKEN',
        decimals: metadata.decimals || 18,
        balance: BigInt(balance)
      };
    } catch (error) {
      throw new Error(`Failed to get NEAR token balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async proposeTransaction(
    walletAddress: string,
    to: string,
    value: string,
    data: string = "",
  ): Promise<string> {
    try {
      const near = await this.getConnection();
      const account = await near.account(walletAddress);
      
      // Convert NEAR to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
      const amount = utils.format.parseNearAmount(value);
      
      if (!amount) {
        throw new Error('Invalid amount');
      }
      
      // Create a transfer transaction
      const actions = [transactions.transfer(BigInt(amount))];
      
      // Get latest block hash for the transaction
      const nearConn = await this.getConnection();
      const provider = new providers.JsonRpcProvider({ url: nearConn.config.nodeUrl });
      const blockInfo = await provider.block({ finality: 'final' });
      const blockHash = utils.serialize.base_decode(blockInfo.header.hash);
      
      // Get access key information for the account
      const accessKeys = await account.getAccessKeys();
      if (!accessKeys || accessKeys.length === 0) {
        throw new Error('No access keys found for this account');
      }
      
      const accessKey = accessKeys[0]; // Use the first access key
      const nonce = Number(accessKey.access_key.nonce) + 1;
      
      // Create a transaction
      const transaction = transactions.createTransaction(
        walletAddress,
        utils.PublicKey.fromString(accessKey.public_key),
        to,
        nonce,
        actions,
        blockHash
      );
      
      // Serialize the transaction
      const serializedTx = utils.serialize.serialize(
        transactions.SCHEMA.Transaction,
        transaction
      );
      
      return Buffer.from(serializedTx).toString('base64');
    } catch (error) {
      throw new Error(`Failed to propose NEAR transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async proposeTokenTransaction(
    walletAddress: string,
    to: string,
    tokenAddress: string,
    amount: string,
    data: string = "",
  ): Promise<string> {
    try {
      const near = await this.getConnection();
      const account = await near.account(walletAddress);
      
      // Get token metadata for decimals
      const metadata = await account.viewFunction({
        contractId: tokenAddress,
        methodName: 'ft_metadata',
        args: {}
      }).catch(() => ({ decimals: 18 }));
      
      // Convert token amount to smallest denomination
      const decimalAmount = new BN(parseFloat(amount) * 10 ** (metadata.decimals || 18)).toString();
      
      // Create ft_transfer action
      const actions = [
        transactions.functionCall(
          'ft_transfer',
          {
            receiver_id: to,
            amount: decimalAmount,
            memo: data || undefined
          },
          BigInt('30000000000000'), // 30 TGas
          BigInt('1') // 1 yoctoNEAR for the ft_transfer attachment requirement
        )
      ];
      
      // Get latest block hash for the transaction
      const nearConn = await this.getConnection();
      const provider = new providers.JsonRpcProvider({ url: nearConn.config.nodeUrl });
      const blockInfo = await provider.block({ finality: 'final' });
      const blockHash = utils.serialize.base_decode(blockInfo.header.hash);
      
      // Get access key information for the account
      const accessKeys = await account.getAccessKeys();
      if (!accessKeys || accessKeys.length === 0) {
        throw new Error('No access keys found for this account');
      }
      
      const accessKey = accessKeys[0]; // Use the first access key
      const nonce = Number(accessKey.access_key.nonce) + 1;
      
      // Create a transaction
      const transaction = transactions.createTransaction(
        walletAddress,
        utils.PublicKey.fromString(accessKey.public_key),
        tokenAddress,
        nonce,
        actions,
        blockHash
      );
      
      // Serialize the transaction
      const serializedTx = utils.serialize.serialize(
        transactions.SCHEMA.Transaction,
        transaction
      );
      
      return Buffer.from(serializedTx).toString('base64');
    } catch (error) {
      throw new Error(`Failed to propose NEAR token transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async signTransaction(
    serializedTx: string,
    privateKey: string,
  ): Promise<string> {
    try {
      // Create a key pair from the private key
      const keyPair = utils.KeyPair.fromString(privateKey as any);
      
      // Deserialize the transaction
      const transactionData = Buffer.from(serializedTx, 'base64');
      const transaction = utils.serialize.deserialize(
        transactions.SCHEMA.Transaction,
        transactionData
      ) as transactions.Transaction;
      
      // Sign the transaction
      const transactionHash = utils.serialize.serialize(
        transactions.SCHEMA.Transaction,
        transaction
      );
      const signature = keyPair.sign(transactionHash);
      
      // Create a signed transaction
      const signedTx = {
        transaction,
        signature: {
          signature: signature.signature,
          publicKey: signature.publicKey
        }
      };
      
      // Serialize the signed transaction
      const serializedSignedTx = utils.serialize.serialize(
        transactions.SCHEMA.SignedTransaction,
        signedTx
      );
      
      return Buffer.from(serializedSignedTx).toString('base64');
    } catch (error) {
      throw new Error(`Failed to sign NEAR transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async executeTransaction(
    walletAddress: string,
    signedSerializedTx: string,
    signatures: string[],
  ): Promise<string> {
    try {
      const near = await this.getConnection();
      
      // Create a provider instance
      const nearConn = await this.getConnection();
      const provider = new providers.JsonRpcProvider({ url: nearConn.config.nodeUrl });
      
      // Deserialize the signed transaction
      const signedTxData = Buffer.from(signedSerializedTx, 'base64');
      const signedTx = utils.serialize.deserialize(
        transactions.SCHEMA.SignedTransaction,
        signedTxData
      ) as transactions.SignedTransaction;
      
      // Send the transaction to the network
      const result = await provider.sendTransaction(signedTx);
      
      // Return the transaction hash
      return result.transaction.hash;
    } catch (error) {
      throw new Error(`Failed to execute NEAR transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  isValidAddress(address: string): boolean {
    // NEAR account IDs can have various formats
    // This is a simplified validation
    try {
      // Check if it's a valid account ID according to NEAR rules
      // Account IDs must be between 2-64 characters
      // Account IDs can only use lowercase alphanumeric characters, '_' and '.'
      // Account IDs cannot start or end with '_' or '.'
      // Account IDs cannot contain two consecutive '_' or '.'
      
      if (address.length < 2 || address.length > 64) {
        return false;
      }
      
      // Check for valid characters
      if (!/^[a-z0-9_\.]+$/.test(address)) {
        return false;
      }
      
      // Check for invalid starts/ends
      if (address.startsWith('_') || address.startsWith('.') || 
          address.endsWith('_') || address.endsWith('.')) {
        return false;
      }
      
      // Check for consecutive special characters
      if (address.includes('__') || address.includes('..') || 
          address.includes('_.') || address.includes('._')) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}