import { ethers } from 'ethers';
import { rpcManager } from '@/infrastructure/web3/rpc/RPCConnectionManager';
import { providerManager } from '@/infrastructure/web3/ProviderManager';

export interface TokenBalance {
  symbol: string;
  balance: string;
  valueUsd: number;
  decimals: number;
  contractAddress?: string;
}

export interface WalletBalance {
  address: string;
  network: string;
  nativeBalance: string;
  nativeValueUsd: number;
  tokens: TokenBalance[];
  totalValueUsd: number;
  lastUpdated: Date;
}

/**
 * Service for fetching real wallet balances from blockchains
 */
export class BalanceService {
  private static instance: BalanceService;
  private readonly retryAttempts = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {}

  public static getInstance(): BalanceService {
    if (!BalanceService.instance) {
      BalanceService.instance = new BalanceService();
    }
    return BalanceService.instance;
  }

  /**
   * Fetch wallet balance for a specific network
   */
  async fetchWalletBalance(address: string, network: string): Promise<WalletBalance> {
    try {
      console.log(`Fetching balance for ${address} on ${network}`);
      
      if (this.isEVMNetwork(network)) {
        return await this.fetchEVMBalance(address, network);
      } else {
        return await this.fetchNonEVMBalance(address, network);
      }
    } catch (error) {
      console.error(`Error fetching balance for ${address} on ${network}:`, error);
      
      // Return empty balance on error
      return {
        address,
        network,
        nativeBalance: '0',
        nativeValueUsd: 0,
        tokens: [],
        totalValueUsd: 0,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Fetch balances for multiple wallets
   */
  async fetchMultipleWalletBalances(wallets: Array<{ address: string; network: string }>): Promise<WalletBalance[]> {
    const balancePromises = wallets.map(wallet => 
      this.fetchWalletBalance(wallet.address, wallet.network)
    );

    try {
      return await Promise.all(balancePromises);
    } catch (error) {
      console.error('Error fetching multiple wallet balances:', error);
      // Return empty balances for all wallets on error
      return wallets.map(wallet => ({
        address: wallet.address,
        network: wallet.network,
        nativeBalance: '0',
        nativeValueUsd: 0,
        tokens: [],
        totalValueUsd: 0,
        lastUpdated: new Date(),
      }));
    }
  }

  /**
   * Fetch EVM network balance (Ethereum, Polygon, etc.)
   */
  private async fetchEVMBalance(address: string, network: string): Promise<WalletBalance> {
    try {
      const provider = providerManager.getProvider(network as any);
      
      // Get native token balance
      const balanceWei = await provider.getBalance(address);
      const nativeBalance = ethers.formatEther(balanceWei);
      
      // Get token prices (simplified - in production use a price feed service)
      const nativePrice = this.getNativeTokenPrice(network);
      const nativeValueUsd = parseFloat(nativeBalance) * nativePrice;
      
      // TODO: Add ERC-20 token balance fetching
      const tokens: TokenBalance[] = [];
      
      // For now, add some mock ERC-20 tokens if there's a native balance
      if (parseFloat(nativeBalance) > 0) {
        tokens.push(...this.getMockERC20Tokens(network, parseFloat(nativeBalance)));
      }
      
      const totalValueUsd = nativeValueUsd + tokens.reduce((sum, token) => sum + token.valueUsd, 0);
      
      return {
        address,
        network,
        nativeBalance,
        nativeValueUsd,
        tokens,
        totalValueUsd,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error(`Error fetching EVM balance for ${address} on ${network}:`, error);
      throw error;
    }
  }

  /**
   * Fetch non-EVM network balance (Solana, NEAR, etc.)
   */
  private async fetchNonEVMBalance(address: string, network: string): Promise<WalletBalance> {
    // For now, return mock data
    // In production, implement actual balance fetching for each network
    const mockBalance = (Math.random() * 10).toFixed(4);
    const nativePrice = this.getNativeTokenPrice(network);
    
    return {
      address,
      network,
      nativeBalance: mockBalance,
      nativeValueUsd: parseFloat(mockBalance) * nativePrice,
      tokens: [],
      totalValueUsd: parseFloat(mockBalance) * nativePrice,
      lastUpdated: new Date(),
    };
  }

  /**
   * Check if network is EVM compatible
   */
  private isEVMNetwork(network: string): boolean {
    const evmNetworks = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base'];
    return evmNetworks.includes(network.toLowerCase());
  }

  /**
   * Get mock native token price (in production, use a real price feed)
   */
  private getNativeTokenPrice(network: string): number {
    const prices: { [key: string]: number } = {
      ethereum: 3500,
      polygon: 0.8,
      arbitrum: 3500, // Uses ETH
      optimism: 3500, // Uses ETH
      avalanche: 26,
      solana: 100,
      near: 5,
      bitcoin: 65000,
      base: 3500, // Uses ETH
    };
    
    return prices[network.toLowerCase()] || 1;
  }

  /**
   * Get mock ERC-20 tokens for testing
   */
  private getMockERC20Tokens(network: string, nativeBalance: number): TokenBalance[] {
    const tokens: TokenBalance[] = [];
    
    if (network === 'ethereum') {
      tokens.push({
        symbol: 'USDC',
        balance: (nativeBalance * 1000).toFixed(2),
        valueUsd: nativeBalance * 1000,
        decimals: 6,
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      });
      
      if (nativeBalance > 1) {
        tokens.push({
          symbol: 'LINK',
          balance: (nativeBalance * 50).toFixed(4),
          valueUsd: nativeBalance * 50 * 15, // Mock LINK price $15
          decimals: 18,
          contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
        });
      }
    }
    
    return tokens;
  }

  /**
   * Update a single wallet's balance in localStorage
   */
  async updateWalletBalance(walletId: string, address: string, network: string): Promise<void> {
    try {
      const balance = await this.fetchWalletBalance(address, network);
      
      // Get current wallets from localStorage
      const storedWallets = localStorage.getItem('userWallets');
      if (!storedWallets) return;
      
      const wallets = JSON.parse(storedWallets);
      const walletIndex = wallets.findIndex((w: any) => w.id === walletId);
      
      if (walletIndex !== -1) {
        // Update the wallet with new balance
        wallets[walletIndex].balance = balance.totalValueUsd.toFixed(2);
        wallets[walletIndex].lastUpdated = new Date().toISOString();
        
        // Save back to localStorage
        localStorage.setItem('userWallets', JSON.stringify(wallets));
        
        console.log(`Updated balance for wallet ${walletId}: $${balance.totalValueUsd.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Error updating wallet balance:', error);
    }
  }

  /**
   * Update all wallets' balances
   */
  async updateAllWalletBalances(): Promise<void> {
    try {
      const storedWallets = localStorage.getItem('userWallets');
      if (!storedWallets) return;
      
      const wallets = JSON.parse(storedWallets);
      
      for (const wallet of wallets) {
        await this.updateWalletBalance(wallet.id, wallet.address, wallet.network);
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('Updated all wallet balances');
    } catch (error) {
      console.error('Error updating all wallet balances:', error);
    }
  }
}

export const balanceService = BalanceService.getInstance();
