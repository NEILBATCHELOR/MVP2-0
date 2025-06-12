/**
 * Multi-Chain Wallet Manager
 * 
 * Enhanced wallet management system supporting all major blockchain networks
 * Provides unified interface for wallet operations across different chains
 */

import type { IBlockchainAdapter, SupportedChain, NetworkType, TransactionParams, TransactionResult } from '../adapters/IBlockchainAdapter';
import { BlockchainFactory } from '../factories/BlockchainFactory';
import { rpcManager } from '../rpc/RPCConnectionManager';
// BigNumber replaced with native bigint in ethers v6

// Enhanced wallet types
export interface MultiChainWallet {
  id: string;
  name: string;
  type: 'individual' | 'multisig' | 'custodial' | 'eoa' | 'smart' | 'guardian';
  supportedChains: SupportedChain[];
  primaryChain: SupportedChain;
  addresses: Record<SupportedChain, string>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletConnection {
  walletId: string;
  chain: SupportedChain;
  networkType: NetworkType;
  address: string;
  isConnected: boolean;
  adapter: IBlockchainAdapter;
}

export interface CrossChainBalance {
  chain: SupportedChain;
  address: string;
  nativeBalance: {
    amount: bigint;
    symbol: string;
    decimals: number;
    valueUSD?: string;
  };
  tokenBalances: Array<{
    contractAddress: string;
    symbol: string;
    decimals: number;
    balance: bigint;
    valueUSD?: string;
  }>;
  totalValueUSD?: string;
}

export interface WalletPortfolio {
  walletId: string;
  totalValueUSD: string;
  balancesByChain: Record<SupportedChain, CrossChainBalance>;
  lastUpdated: string;
}

/**
 * Multi-Chain Wallet Manager
 */
export class MultiChainWalletManager {
  private connections = new Map<string, WalletConnection>();
  private portfolios = new Map<string, WalletPortfolio>();

  /**
   * Connect wallet to a specific blockchain
   */
  async connectWallet(
    walletId: string,
    chain: SupportedChain,
    networkType: NetworkType = 'mainnet',
    address?: string
  ): Promise<WalletConnection> {
    const connectionKey = `${walletId}-${chain}-${networkType}`;

    // Check if already connected
    if (this.connections.has(connectionKey)) {
      return this.connections.get(connectionKey)!;
    }

    try {
      // Get blockchain adapter
      const adapter = await BlockchainFactory.createAdapter(chain, networkType);
      
      // Validate address if provided
      if (address && !adapter.isValidAddress(address)) {
        throw new Error(`Invalid address format for ${chain}: ${address}`);
      }

      // Create connection
      const connection: WalletConnection = {
        walletId,
        chain,
        networkType,
        address: address || '', // Will be set during account import/generation
        isConnected: true,
        adapter
      };

      this.connections.set(connectionKey, connection);
      return connection;

    } catch (error) {
      throw new Error(`Failed to connect wallet to ${chain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect wallet from a specific blockchain
   */
  async disconnectWallet(walletId: string, chain?: SupportedChain): Promise<void> {
    if (chain) {
      // Disconnect from specific chain
      const keys = Array.from(this.connections.keys()).filter(key => 
        key.startsWith(`${walletId}-${chain}-`)
      );
      
      for (const key of keys) {
        const connection = this.connections.get(key);
        if (connection) {
          await connection.adapter.disconnect();
          this.connections.delete(key);
        }
      }
    } else {
      // Disconnect from all chains
      const keys = Array.from(this.connections.keys()).filter(key => 
        key.startsWith(`${walletId}-`)
      );
      
      for (const key of keys) {
        const connection = this.connections.get(key);
        if (connection) {
          await connection.adapter.disconnect();
          this.connections.delete(key);
        }
      }
    }
  }

  /**
   * Switch wallet to a different chain
   */
  async switchChain(walletId: string, targetChain: SupportedChain, networkType: NetworkType = 'mainnet'): Promise<WalletConnection> {
    // Get current primary connection
    const currentConnections = this.getWalletConnections(walletId);
    
    if (currentConnections.length === 0) {
      throw new Error('Wallet is not connected to any chains');
    }

    // Connect to target chain if not already connected
    const targetConnection = await this.connectWallet(walletId, targetChain, networkType);
    
    return targetConnection;
  }

  /**
   * Get all connections for a wallet
   */
  getWalletConnections(walletId: string): WalletConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.walletId === walletId);
  }

  /**
   * Get connection for specific wallet and chain
   */
  getConnection(walletId: string, chain: SupportedChain, networkType: NetworkType = 'mainnet'): WalletConnection | null {
    const connectionKey = `${walletId}-${chain}-${networkType}`;
    return this.connections.get(connectionKey) || null;
  }

  /**
   * Get wallet addresses across all chains
   */
  async getWalletAddresses(walletId: string): Promise<Record<SupportedChain, string>> {
    const connections = this.getWalletConnections(walletId);
    const addresses: Record<string, string> = {};

    for (const connection of connections) {
      if (connection.address) {
        addresses[connection.chain] = connection.address;
      }
    }

    return addresses as Record<SupportedChain, string>;
  }

  /**
   * Generate new account for a specific chain
   */
  async generateAccount(walletId: string, chain: SupportedChain, networkType: NetworkType = 'mainnet'): Promise<string> {
    const connection = await this.connectWallet(walletId, chain, networkType);
    
    const accountInfo = await connection.adapter.generateAccount();
    connection.address = accountInfo.address;
    
    return accountInfo.address;
  }

  /**
   * Import account from private key
   */
  async importAccount(
    walletId: string, 
    chain: SupportedChain, 
    privateKey: string, 
    networkType: NetworkType = 'mainnet'
  ): Promise<string> {
    const connection = await this.connectWallet(walletId, chain, networkType);
    
    const accountInfo = await connection.adapter.importAccount(privateKey);
    connection.address = accountInfo.address;
    
    return accountInfo.address;
  }

  /**
   * Get balance for a specific chain
   */
  async getBalance(walletId: string, chain: SupportedChain, networkType: NetworkType = 'mainnet'): Promise<CrossChainBalance | null> {
    const connection = this.getConnection(walletId, chain, networkType);
    if (!connection || !connection.address) {
      return null;
    }

    try {
      const nativeBalance = await connection.adapter.getBalance(connection.address);
      const { name, symbol, decimals } = connection.adapter.nativeCurrency;

      const balance: CrossChainBalance = {
        chain,
        address: connection.address,
        nativeBalance: {
          amount: nativeBalance,
          symbol,
          decimals
        },
        tokenBalances: [] // Will be populated by token-specific methods
      };

      // Get token balances if supported
      if (connection.adapter.getTokenBalance) {
        // Token balance retrieval would be implemented here
        // This would require token discovery and balance checking
      }

      return balance;
    } catch (error) {
      console.error(`Failed to get balance for ${chain}:`, error);
      return null;
    }
  }

  /**
   * Get full portfolio across all connected chains
   */
  async getPortfolio(walletId: string, forceRefresh = false): Promise<WalletPortfolio | null> {
    const cacheKey = walletId;
    
    // Return cached portfolio if available and not forcing refresh
    if (!forceRefresh && this.portfolios.has(cacheKey)) {
      const portfolio = this.portfolios.get(cacheKey)!;
      // Check if cache is still fresh (less than 5 minutes old)
      const cacheAge = Date.now() - new Date(portfolio.lastUpdated).getTime();
      if (cacheAge < 5 * 60 * 1000) {
        return portfolio;
      }
    }

    const connections = this.getWalletConnections(walletId);
    if (connections.length === 0) {
      return null;
    }

    const balancesByChain: Record<string, CrossChainBalance> = {};
    let totalValueUSD = '0';

    // Get balances for each connected chain
    for (const connection of connections) {
      const balance = await this.getBalance(walletId, connection.chain, connection.networkType);
      if (balance) {
        balancesByChain[connection.chain] = balance;
        
        // Add to total value if available
        if (balance.totalValueUSD) {
          totalValueUSD = (parseFloat(totalValueUSD) + parseFloat(balance.totalValueUSD)).toString();
        }
      }
    }

    const portfolio: WalletPortfolio = {
      walletId,
      totalValueUSD,
      balancesByChain: balancesByChain as Record<SupportedChain, CrossChainBalance>,
      lastUpdated: new Date().toISOString()
    };

    // Cache the portfolio
    this.portfolios.set(cacheKey, portfolio);
    
    return portfolio;
  }

  /**
   * Send transaction on a specific chain
   */
  async sendTransaction(
    walletId: string,
    chain: SupportedChain,
    params: TransactionParams,
    networkType: NetworkType = 'mainnet'
  ): Promise<TransactionResult> {
    const connection = this.getConnection(walletId, chain, networkType);
    if (!connection) {
      throw new Error(`Wallet ${walletId} is not connected to ${chain}`);
    }

    if (!connection.address) {
      throw new Error(`No address available for wallet ${walletId} on ${chain}`);
    }

    try {
      const result = await connection.adapter.sendTransaction(params);
      return result;
    } catch (error) {
      throw new Error(`Transaction failed on ${chain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign message on a specific chain
   */
  async signMessage(
    walletId: string,
    chain: SupportedChain,
    message: string,
    privateKey: string,
    networkType: NetworkType = 'mainnet'
  ): Promise<string> {
    const connection = this.getConnection(walletId, chain, networkType);
    if (!connection) {
      throw new Error(`Wallet ${walletId} is not connected to ${chain}`);
    }

    try {
      const signature = await connection.adapter.signMessage(message, privateKey);
      return signature;
    } catch (error) {
      throw new Error(`Message signing failed on ${chain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    walletId: string,
    chain: SupportedChain,
    txHash: string,
    networkType: NetworkType = 'mainnet'
  ): Promise<any> {
    const connection = this.getConnection(walletId, chain, networkType);
    if (!connection) {
      throw new Error(`Wallet ${walletId} is not connected to ${chain}`);
    }

    try {
      const status = await connection.adapter.getTransaction(txHash);
      return status;
    } catch (error) {
      throw new Error(`Failed to get transaction status on ${chain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): SupportedChain[] {
    return BlockchainFactory.getSupportedChains();
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chain: string): chain is SupportedChain {
    return this.getSupportedChains().includes(chain as SupportedChain);
  }

  /**
   * Clean up all connections and resources
   */
  async dispose(): Promise<void> {
    // Disconnect all wallets
    const walletIds = new Set(Array.from(this.connections.values()).map(conn => conn.walletId));
    
    for (const walletId of walletIds) {
      await this.disconnectWallet(walletId);
    }

    // Clear caches
    this.portfolios.clear();
    
    // Clean up factory resources
    await BlockchainFactory.disconnectAll();
  }
}

// Global instance
export const multiChainWalletManager = new MultiChainWalletManager();
