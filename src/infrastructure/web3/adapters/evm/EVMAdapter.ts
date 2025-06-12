/**
 * EVM Adapter Implementation
 * 
 * Unified adapter for all EVM-compatible chains (Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche)
 * Uses ethers.js for blockchain interactions
 */

import { ethers, BigNumberish, JsonRpcProvider, Wallet, Contract } from 'ethers';
import type {
  IBlockchainAdapter,
  SupportedChain,
  NetworkType,
  TransactionParams,
  TransactionResult,
  TransactionStatus,
  AccountInfo,
  TokenBalance,
  ConnectionConfig,
  HealthStatus
} from '../IBlockchainAdapter';
import { BaseBlockchainAdapter } from '../IBlockchainAdapter';

// ERC-20 ABI for token operations
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)'
];

export class EVMAdapter extends BaseBlockchainAdapter {
  private provider?: JsonRpcProvider;
  private explorerUrl?: string;
  
  readonly chainId: string;
  readonly chainName: string;
  readonly networkType: NetworkType;
  readonly nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };

  constructor(
    chain: SupportedChain,
    networkType: NetworkType,
    chainId: string,
    nativeCurrency: { name: string; symbol: string; decimals: number },
    explorerUrl: string
  ) {
    super();
    this.chainId = chainId;
    this.chainName = chain;
    this.networkType = networkType;
    this.nativeCurrency = nativeCurrency;
    this.explorerUrl = explorerUrl;
  }

  // Connection management
  async connect(config: ConnectionConfig): Promise<void> {
    try {
      this.config = config;
      
      // Create provider with API key if provided
      const rpcUrl = config.apiKey 
        ? `${config.rpcUrl}${config.apiKey}`
        : config.rpcUrl;

      this.provider = new JsonRpcProvider(rpcUrl);

      // Test connection
      await this.provider.getNetwork();
      
      this._isConnected = true;
      console.log(`Connected to ${this.chainName} (${this.networkType})`);
    } catch (error) {
      this._isConnected = false;
      throw new Error(`Failed to connect to ${this.chainName}: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      // Clean up provider connection
      this.provider = undefined;
    }
    this._isConnected = false;
    console.log(`Disconnected from ${this.chainName}`);
  }

  async getHealth(): Promise<HealthStatus> {
    if (!this.provider) {
      return {
        isHealthy: false,
        latency: -1,
        lastChecked: Date.now()
      };
    }

    const startTime = Date.now();
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const latency = Date.now() - startTime;
      
      return {
        isHealthy: true,
        latency,
        blockHeight: blockNumber,
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
  async generateAccount(): Promise<AccountInfo> {
    this.validateConnection();
    
    const wallet = Wallet.createRandom();
    const balance = await this.getBalance(wallet.address);
    
    return {
      address: wallet.address,
      balance,
      publicKey: wallet.signingKey.publicKey
    };
  }

  async importAccount(privateKey: string): Promise<AccountInfo> {
    this.validateConnection();
    
    try {
      const wallet = new Wallet(privateKey);
      const balance = await this.getBalance(wallet.address);
      
      return {
        address: wallet.address,
        balance,
        publicKey: wallet.signingKey.publicKey
      };
    } catch (error) {
      throw new Error(`Invalid private key: ${error}`);
    }
  }

  async getAccount(address: string): Promise<AccountInfo> {
    this.validateConnection();
    
    if (!this.isValidAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    const balance = await this.getBalance(address);
    const nonce = await this.provider!.getTransactionCount(address);
    
    return {
      address,
      balance,
      nonce
    };
  }

  async getBalance(address: string): Promise<bigint> {
    this.validateConnection();
    
    if (!this.isValidAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    return await this.provider!.getBalance(address);
  }

  // Transaction operations
  async estimateGas(params: TransactionParams): Promise<string> {
    this.validateConnection();
    
    const txRequest: any = {
      to: params.to,
      value: params.amount,
      data: params.data || '0x'
    };

    if (params.gasPrice) {
      txRequest.gasPrice = params.gasPrice;
    }

    try {
      const estimate = await this.provider!.estimateGas(txRequest);
      return estimate.toString();
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error}`);
    }
  }

  async sendTransaction(params: TransactionParams): Promise<TransactionResult> {
    this.validateConnection();
    
    // Note: This is a simplified implementation
    // In production, you'd need proper wallet/signer management
    throw new Error('Transaction sending requires wallet integration - implement with WalletManager');
  }

  async getTransaction(txHash: string): Promise<TransactionStatus> {
    this.validateConnection();
    
    try {
      const tx = await this.provider!.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }

      const receipt = await this.provider!.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return {
          status: 'pending',
          confirmations: 0
        };
      }

      const currentBlock = await this.provider!.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber + 1;
      
      return {
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        confirmations,
        blockNumber: receipt.blockNumber,
        timestamp: (await this.provider!.getBlock(receipt.blockNumber)).timestamp
      };
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error}`);
    }
  }

  async signMessage(message: string, privateKey: string): Promise<string> {
    try {
      const wallet = new Wallet(privateKey);
      return await wallet.signMessage(message);
    } catch (error) {
      throw new Error(`Message signing failed: ${error}`);
    }
  }

  // Token operations
  async getTokenBalance(address: string, tokenAddress: string): Promise<TokenBalance> {
    this.validateConnection();
    
    if (!this.isValidAddress(address) || !this.isValidAddress(tokenAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      const contract = new Contract(tokenAddress, ERC20_ABI, this.provider!);
      
      const [balance, symbol, decimals] = await Promise.all([
        contract.balanceOf(address),
        contract.symbol(),
        contract.decimals()
      ]);

      return {
        address: tokenAddress,
        symbol,
        decimals,
        balance
      };
    } catch (error) {
      throw new Error(`Failed to get token balance: ${error}`);
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
      const contract = new Contract(tokenAddress, ERC20_ABI, this.provider!);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);

      return {
        name,
        symbol,
        decimals,
        totalSupply
      };
    } catch (error) {
      throw new Error(`Failed to get token info: ${error}`);
    }
  }

  // Block operations
  async getCurrentBlockNumber(): Promise<number> {
    this.validateConnection();
    return await this.provider!.getBlockNumber();
  }

  async getBlock(blockNumber: number): Promise<{
    number: number;
    timestamp: number;
    hash: string;
    transactions: string[];
  }> {
    this.validateConnection();
    
    try {
      const block = await this.provider!.getBlock(blockNumber);
      if (!block) {
        throw new Error('Block not found');
      }

      return {
        number: block.number,
        timestamp: block.timestamp,
        hash: block.hash,
        transactions: [...block.transactions] // Convert readonly array to mutable array
      };
    } catch (error) {
      throw new Error(`Failed to get block: ${error}`);
    }
  }

  // Utility methods
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  formatAddress(address: string): string {
    if (!this.isValidAddress(address)) {
      return address;
    }
    return ethers.getAddress(address); // Returns checksummed address
  }

  getExplorerUrl(txHash: string): string {
    if (!this.explorerUrl) {
      return txHash;
    }
    return `${this.explorerUrl}/tx/${txHash}`;
  }

  // EVM-specific methods
  async getGasPrice(): Promise<bigint> {
    this.validateConnection();
    const feeData = await this.provider!.getFeeData();
    return feeData.gasPrice || BigInt(0);
  }

  async getFeeData(): Promise<{
    gasPrice: bigint | null;
    maxFeePerGas: bigint | null;
    maxPriorityFeePerGas: bigint | null;
  }> {
    this.validateConnection();
    return await this.provider!.getFeeData();
  }

  async waitForTransaction(txHash: string, confirmations = 1): Promise<any> {
    this.validateConnection();
    return await this.provider!.waitForTransaction(txHash, confirmations);
  }
}
