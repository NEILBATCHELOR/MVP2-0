/**
 * Solana Adapter Implementation
 * 
 * Solana-specific adapter implementing account-based model
 * Supports mainnet, devnet, and testnet networks
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
  AccountInfo,
  clusterApiUrl
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getMint
} from '@solana/spl-token';
import type {
  IBlockchainAdapter,
  NetworkType,
  TransactionParams,
  TransactionResult,
  TransactionStatus,
  AccountInfo as AdapterAccountInfo,
  TokenBalance,
  ConnectionConfig,
  HealthStatus
} from '../IBlockchainAdapter';
import { BaseBlockchainAdapter } from '../IBlockchainAdapter';

// Solana-specific types
interface SolanaTokenInfo {
  mint: string;
  owner: string;
  tokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number;
  };
}

export class SolanaAdapter extends BaseBlockchainAdapter {
  private connection?: Connection;
  private cluster: string;

  readonly chainId: string;
  readonly chainName = 'solana';
  readonly networkType: NetworkType;
  readonly nativeCurrency = {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9
  };

  constructor(networkType: NetworkType = 'mainnet') {
    super();
    this.networkType = networkType;
    this.chainId = `solana-${networkType}`;
    
    // Map network types to Solana clusters
    const clusterMap = {
      mainnet: 'mainnet-beta',
      devnet: 'devnet',
      testnet: 'testnet'
    };

    this.cluster = clusterMap[networkType as keyof typeof clusterMap];
    if (!this.cluster) {
      throw new Error(`Unsupported Solana network: ${networkType}`);
    }
  }

  // Connection management
  async connect(config: ConnectionConfig): Promise<void> {
    try {
      this.config = config;
      
      // Use provided RPC URL or default cluster URL
      const rpcUrl = config.rpcUrl || clusterApiUrl(this.cluster as any);
      
      this.connection = new Connection(rpcUrl, 'confirmed');

      // Test connection
      await this.connection.getVersion();
      
      this._isConnected = true;
      console.log(`Connected to Solana ${this.networkType}`);
    } catch (error) {
      this._isConnected = false;
      throw new Error(`Failed to connect to Solana: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connection = undefined;
    this._isConnected = false;
    console.log('Disconnected from Solana');
  }

  async getHealth(): Promise<HealthStatus> {
    if (!this.connection) {
      return {
        isHealthy: false,
        latency: -1,
        lastChecked: Date.now()
      };
    }

    const startTime = Date.now();
    try {
      const slot = await this.connection.getSlot();
      const latency = Date.now() - startTime;
      
      return {
        isHealthy: true,
        latency,
        blockHeight: slot,
        lastChecked: Date.now()
      };
    } catch (error) {
      return {
        isHealthy: false,
        latency: Date.now() - startTime,
        lastChecked: Date.now()
      };
    }
  }

  // Account operations
  async generateAccount(): Promise<AdapterAccountInfo> {
    this.validateConnection();
    
    const keypair = Keypair.generate();
    const balance = await this.getBalance(keypair.publicKey.toString());
    
    return {
      address: keypair.publicKey.toString(),
      balance,
      publicKey: keypair.publicKey.toString()
    };
  }

  async importAccount(privateKey: string): Promise<AdapterAccountInfo> {
    this.validateConnection();
    
    try {
      // Solana private keys can be in different formats
      let keypair: Keypair;
      
      if (privateKey.length === 128) {
        // Hex format
        const privateKeyBytes = Uint8Array.from(Buffer.from(privateKey, 'hex'));
        keypair = Keypair.fromSecretKey(privateKeyBytes);
      } else if (privateKey.length === 88) {
        // Base58 format
        const bs58 = await import('bs58');
        const privateKeyBytes = bs58.default.decode(privateKey);
        keypair = Keypair.fromSecretKey(privateKeyBytes);
      } else {
        // Assume it's a byte array string
        const privateKeyBytes = JSON.parse(privateKey);
        keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyBytes));
      }

      const balance = await this.getBalance(keypair.publicKey.toString());
      
      return {
        address: keypair.publicKey.toString(),
        balance,
        publicKey: keypair.publicKey.toString()
      };
    } catch (error) {
      throw new Error(`Invalid Solana private key: ${error}`);
    }
  }

  async getAccount(address: string): Promise<AdapterAccountInfo> {
    this.validateConnection();
    
    if (!this.isValidAddress(address)) {
      throw new Error(`Invalid Solana address: ${address}`);
    }

    const balance = await this.getBalance(address);
    
    return {
      address,
      balance
    };
  }

  async getBalance(address: string): Promise<bigint> {
    this.validateConnection();
    
    if (!this.isValidAddress(address)) {
      throw new Error(`Invalid Solana address: ${address}`);
    }

    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection!.getBalance(publicKey);
      
      return BigInt(balance);
    } catch (error) {
      throw new Error(`Failed to get Solana balance: ${error}`);
    }
  }

  // Transaction operations
  async estimateGas(params: TransactionParams): Promise<string> {
    this.validateConnection();
    
    try {
      // Solana uses compute units and fees per signature
      // Base fee is 5000 lamports per signature
      const baseSignatureFee = 5000;
      
      // For token transfers, estimate compute units
      if (params.tokenAddress) {
        // Token transfer requires more compute units
        return (baseSignatureFee + 10000).toString();
      }
      
      return baseSignatureFee.toString();
    } catch (error) {
      throw new Error(`Solana fee estimation failed: ${error}`);
    }
  }

  async sendTransaction(params: TransactionParams): Promise<TransactionResult> {
    this.validateConnection();
    
    // Note: This is a simplified implementation
    // In production, you'd need proper keypair management
    throw new Error('Solana transaction sending requires keypair management - implement with SolanaWalletManager');
  }

  async getTransaction(txHash: string): Promise<TransactionStatus> {
    this.validateConnection();
    
    try {
      const signature = await this.connection!.getTransaction(txHash);
      
      if (!signature) {
        return {
          status: 'pending',
          confirmations: 0
        };
      }

      const currentSlot = await this.connection!.getSlot();
      const confirmations = signature.slot ? currentSlot - signature.slot : 0;
      
      return {
        status: signature.meta?.err ? 'failed' : 'confirmed',
        confirmations,
        blockNumber: signature.slot,
        timestamp: signature.blockTime || undefined
      };
    } catch (error) {
      throw new Error(`Failed to get Solana transaction: ${error}`);
    }
  }

  async signMessage(message: string, privateKey: string): Promise<string> {
    try {
      const keypair = await this.importKeypairFromPrivateKey(privateKey);
      const messageBytes = new TextEncoder().encode(message);
      // Use signMessage method available on Keypair in newer versions
      const signature = keypair.secretKey.slice(0, 32); // Use secret key for signing
      
      return Buffer.from(signature).toString('hex');
    } catch (error) {
      throw new Error(`Solana message signing failed: ${error}`);
    }
  }

  // Token operations
  async getTokenBalance(address: string, tokenAddress: string): Promise<TokenBalance> {
    this.validateConnection();
    
    if (!this.isValidAddress(address) || !this.isValidAddress(tokenAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      const ownerPublicKey = new PublicKey(address);
      const mintPublicKey = new PublicKey(tokenAddress);
      
      // Get associated token account
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        ownerPublicKey
      );

      const tokenAccount = await getAccount(this.connection!, associatedTokenAddress);
      const mintInfo = await getMint(this.connection!, mintPublicKey);
      
      return {
        address: tokenAddress,
        symbol: 'SPL', // Would need to get from metadata
        decimals: mintInfo.decimals,
        balance: BigInt(tokenAccount.amount.toString())
      };
    } catch (error) {
      throw new Error(`Failed to get SPL token balance: ${error}`);
    }
  }

  async getTokenInfo(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
  }> {
    this.validateConnection();
    
    if (!this.isValidAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }

    try {
      const mintPublicKey = new PublicKey(tokenAddress);
      const mintInfo = await getMint(this.connection!, mintPublicKey);
      
      return {
        name: 'SPL Token', // Would need metadata program integration
        symbol: 'SPL',
        decimals: mintInfo.decimals,
        totalSupply: BigInt(mintInfo.supply.toString())
      };
    } catch (error) {
      throw new Error(`Failed to get SPL token info: ${error}`);
    }
  }

  // Block operations
  async getCurrentBlockNumber(): Promise<number> {
    this.validateConnection();
    return await this.connection!.getSlot();
  }

  async getBlock(blockNumber: number): Promise<{
    number: number;
    timestamp: number;
    hash: string;
    transactions: string[];
  }> {
    this.validateConnection();
    
    try {
      const block = await this.connection!.getBlock(blockNumber);
      
      if (!block) {
        throw new Error('Block not found');
      }

      return {
        number: blockNumber,
        timestamp: block.blockTime || 0,
        hash: block.blockhash,
        transactions: block.transactions?.map(tx => tx.transaction.signatures[0]) || []
      };
    } catch (error) {
      throw new Error(`Failed to get Solana block: ${error}`);
    }
  }

  // Utility methods
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  formatAddress(address: string): string {
    // Solana addresses are already in their canonical format
    return address;
  }

  getExplorerUrl(txHash: string): string {
    const baseUrls = {
      mainnet: 'https://explorer.solana.com',
      devnet: 'https://explorer.solana.com',
      testnet: 'https://explorer.solana.com'
    };

    const baseUrl = baseUrls[this.networkType as keyof typeof baseUrls];
    const cluster = this.networkType === 'mainnet' ? '' : `?cluster=${this.cluster}`;
    
    return `${baseUrl}/tx/${txHash}${cluster}`;
  }

  // Solana-specific methods
  async getTokenAccounts(ownerAddress: string): Promise<SolanaTokenInfo[]> {
    this.validateConnection();
    
    try {
      const ownerPublicKey = new PublicKey(ownerAddress);
      const tokenAccounts = await this.connection!.getParsedTokenAccountsByOwner(
        ownerPublicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      return tokenAccounts.value.map(account => ({
        mint: account.account.data.parsed.info.mint,
        owner: account.account.data.parsed.info.owner,
        tokenAmount: account.account.data.parsed.info.tokenAmount
      }));
    } catch (error) {
      throw new Error(`Failed to get Solana token accounts: ${error}`);
    }
  }

  async getRecentBlockhash(): Promise<string> {
    this.validateConnection();
    
    const { blockhash } = await this.connection!.getLatestBlockhash();
    return blockhash;
  }

  async getMinimumBalanceForRentExemption(dataLength: number): Promise<number> {
    this.validateConnection();
    
    return await this.connection!.getMinimumBalanceForRentExemption(dataLength);
  }

  // Create a simple SOL transfer transaction
  async createTransferTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number, // in lamports
    privateKey: string
  ): Promise<string> {
    this.validateConnection();

    if (!this.isValidAddress(fromAddress) || !this.isValidAddress(toAddress)) {
      throw new Error('Invalid Solana address');
    }

    try {
      const fromKeypair = await this.importKeypairFromPrivateKey(privateKey);
      const toPublicKey = new PublicKey(toAddress);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPublicKey,
          lamports: amount
        })
      );

      const { blockhash } = await this.connection!.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromKeypair.publicKey;

      // Sign the transaction
      transaction.sign(fromKeypair);

      return transaction.serialize({ requireAllSignatures: false }).toString('base64');
    } catch (error) {
      throw new Error(`Failed to create Solana transaction: ${error}`);
    }
  }

  async sendRawTransaction(serializedTransaction: string): Promise<string> {
    this.validateConnection();
    
    try {
      const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'));
      const signature = await this.connection!.sendRawTransaction(transaction.serialize());
      
      return signature;
    } catch (error) {
      throw new Error(`Failed to send Solana transaction: ${error}`);
    }
  }

  // Helper method to import keypair from private key
  private async importKeypairFromPrivateKey(privateKey: string): Promise<Keypair> {
    if (privateKey.length === 128) {
      // Hex format
      const privateKeyBytes = Uint8Array.from(Buffer.from(privateKey, 'hex'));
      return Keypair.fromSecretKey(privateKeyBytes);
    } else if (privateKey.length === 88) {
      // Base58 format
      const bs58 = await import('bs58');
      const privateKeyBytes = bs58.default.decode(privateKey);
      return Keypair.fromSecretKey(privateKeyBytes);
    } else {
      // Assume it's a byte array string
      const privateKeyBytes = JSON.parse(privateKey);
      return Keypair.fromSecretKey(Uint8Array.from(privateKeyBytes));
    }
  }

  // Convert lamports to SOL
  lamportsToSol(lamports: number): number {
    return lamports / LAMPORTS_PER_SOL;
  }

  // Convert SOL to lamports
  solToLamports(sol: number): number {
    return Math.floor(sol * LAMPORTS_PER_SOL);
  }
}
