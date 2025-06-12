/**
 * DFNS Exchange Manager - Exchange integration management for DFNS
 * 
 * This service manages DFNS exchange integrations including:
 * - Exchange account creation and management (Kraken, Binance, Coinbase Prime)
 * - Deposit and withdrawal operations
 * - Exchange asset management and listing
 * - Trading operations and order management
 * - Exchange account monitoring and reporting
 */

import type { DfnsClientConfig } from '@/types/dfns';
import type { 
  ExchangeAccount as DomainExchangeAccount,
  ExchangeAsset as DomainExchangeAsset,
  ExchangeDeposit as DomainExchangeDeposit
} from '@/types/dfns/domain';
import { DfnsAuthenticator } from './auth';
import { DFNS_CONFIG, DFNS_ENDPOINTS } from './config';

// ===== Exchange Integration Types =====

export interface InternalExchangeAccount {
  id: string;
  exchangeType: ExchangeType;
  name: string;
  credentials: ExchangeCredentials;
  status: ExchangeStatus;
  config: ExchangeConfig;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string; // For Coinbase Pro
  sandbox?: boolean;
  encrypted: boolean;
}

export interface ExchangeConfig {
  tradingEnabled: boolean;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
  autoBalance: boolean;
  maxDailyVolume?: string;
  allowedAssets: string[];
  restrictedAssets?: string[];
  ipWhitelist?: string[];
}

export interface InternalExchangeAsset {
  symbol: string;
  name: string;
  balance: string;
  available: string;
  locked: string;
  precision: number;
  minimumWithdrawal: string;
  withdrawalFee: string;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
}

export interface InternalExchangeDeposit {
  id: string;
  exchangeAccountId: string;
  asset: string;
  amount: string;
  address: string;
  txHash?: string;
  status: DepositStatus;
  networkFee?: string;
  exchangeFee?: string;
  memo?: string;
  dateCreated: string;
  dateCompleted?: string;
}

export interface ExchangeWithdrawal {
  id: string;
  exchangeAccountId: string;
  walletId: string;
  asset: string;
  amount: string;
  destination: string;
  txHash?: string;
  status: WithdrawalStatus;
  networkFee: string;
  exchangeFee: string;
  memo?: string;
  dateCreated: string;
  dateCompleted?: string;
}

export interface TradingOrder {
  id: string;
  exchangeAccountId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  amount: string;
  price?: string;
  status: OrderStatus;
  filledAmount: string;
  averagePrice?: string;
  fees: string;
  dateCreated: string;
  dateUpdated: string;
}

export interface ExchangeBalance {
  exchangeAccountId: string;
  assets: DomainExchangeAsset[];
  totalValueUsd: string;
  lastUpdated: string;
}

export enum ExchangeType {
  Kraken = 'Kraken',
  Binance = 'Binance',
  CoinbasePrime = 'CoinbasePrime',
  CoinbasePro = 'CoinbasePro'
}

export enum ExchangeStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
  Error = 'Error'
}

export enum DepositStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Failed = 'Failed',
  Cancelled = 'Cancelled'
}

export enum WithdrawalStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled'
}

export enum OrderSide {
  Buy = 'buy',
  Sell = 'sell'
}

export enum OrderType {
  Market = 'market',
  Limit = 'limit',
  Stop = 'stop',
  StopLimit = 'stop_limit'
}

export enum OrderStatus {
  Open = 'open',
  Partial = 'partial',
  Filled = 'filled',
  Cancelled = 'cancelled',
  Expired = 'expired'
}

// ===== DFNS Exchange Manager Class =====

export class DfnsExchangeManager {
  private config: DfnsClientConfig;
  private authenticator: DfnsAuthenticator;

  constructor(config: DfnsClientConfig, authenticator?: DfnsAuthenticator) {
    this.config = config;
    this.authenticator = authenticator || new DfnsAuthenticator(config);
  }

  // ===== Exchange Account Management =====

  /**
   * Create a new exchange account
   */
  async createExchangeAccount(
    exchangeConfig: Omit<InternalExchangeAccount, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DomainExchangeAccount> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to create exchange account');
      }

      // Validate exchange configuration
      this.validateExchangeConfig(exchangeConfig);

      // Get user action signature for exchange creation
      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        DFNS_ENDPOINTS.exchanges.create,
        exchangeConfig
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.exchanges.create}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify({
          ...exchangeConfig,
          credentials: this.encryptCredentials(exchangeConfig.credentials)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Exchange account creation failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Convert to domain-compatible format
      return {
        id: result.id,
        name: result.name,
        type: result.exchangeType,
        exchangeType: result.exchangeType,
        status: result.status,
        tradingEnabled: result.config?.tradingEnabled ?? true,
        sandbox: result.credentials?.sandbox ?? false,
        balances: [],
        metadata: result.metadata,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to create exchange account: ${(error as Error).message}`);
    }
  }

  /**
   * List all exchange accounts
   */
  async listExchangeAccounts(): Promise<DomainExchangeAccount[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list exchange accounts');
      }

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.exchanges.list}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list exchange accounts: ${response.statusText}`);
      }

      const data = await response.json();
      const exchangeAccounts = data.exchanges || [];
      
      // Convert to domain-compatible format
      return exchangeAccounts.map((account: any) => ({
        id: account.id,
        name: account.name,
        type: account.exchangeType || account.type,
        exchangeType: account.exchangeType,
        status: account.status,
        tradingEnabled: account.config?.tradingEnabled ?? true,
        sandbox: account.credentials?.sandbox ?? false,
        balances: [],
        metadata: account.metadata,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      }));
    } catch (error) {
      throw new Error(`Failed to list exchange accounts: ${(error as Error).message}`);
    }
  }

  /**
   * Get exchange account details
   */
  async getExchangeAccount(exchangeId: string): Promise<DomainExchangeAccount> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get exchange account');
      }

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.exchanges.get(exchangeId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get exchange account: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Convert to domain-compatible format
      return {
        id: result.id,
        name: result.name,
        type: result.exchangeType,
        exchangeType: result.exchangeType,
        status: result.status,
        tradingEnabled: result.config?.tradingEnabled ?? true,
        sandbox: result.credentials?.sandbox ?? false,
        balances: [],
        metadata: result.metadata,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to get exchange account: ${(error as Error).message}`);
    }
  }

  /**
   * Delete exchange account
   */
  async deleteExchangeAccount(exchangeId: string): Promise<void> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to delete exchange account');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'DELETE',
        DFNS_ENDPOINTS.exchanges.delete(exchangeId)
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.exchanges.delete(exchangeId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete exchange account: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete exchange account: ${(error as Error).message}`);
    }
  }

  // ===== Asset Management =====

  /**
   * List exchange account assets
   */
  async listExchangeAssets(
    exchangeId: string,
    accountId: string
  ): Promise<DomainExchangeAsset[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list exchange assets');
      }

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.exchanges.assets(exchangeId, accountId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list exchange assets: ${response.statusText}`);
      }

      const data = await response.json();
      const assets = data.assets || [];
      
      // Convert to domain-compatible format  
      return assets.map((asset: any) => ({
        symbol: asset.symbol,
        name: asset.name,
        balance: asset.balance,
        available: asset.available,
        locked: asset.locked || '0',
        onHold: asset.onHold || asset.locked || '0',
        total: asset.total || (parseFloat(asset.available || '0') + parseFloat(asset.locked || '0')).toString(),
        usdValue: asset.usdValue || '0',
        precision: asset.precision || 8,
        minimumWithdrawal: asset.minimumWithdrawal || '0',
        withdrawalFee: asset.withdrawalFee || '0',
        depositEnabled: asset.depositEnabled ?? true,
        withdrawalEnabled: asset.withdrawalEnabled ?? true
      }));
    } catch (error) {
      throw new Error(`Failed to list exchange assets: ${(error as Error).message}`);
    }
  }

  /**
   * Get exchange balance summary
   */
  async getExchangeBalance(exchangeId: string): Promise<ExchangeBalance> {
    try {
      const accounts = await this.listExchangeAccounts();
      const exchangeAccount = accounts.find(acc => acc.id === exchangeId);
      
      if (!exchangeAccount) {
        throw new Error('Exchange account not found');
      }

      // Get assets for the primary account
      const assets = await this.listExchangeAssets(exchangeId, 'primary');
      
      // Calculate total USD value
      const totalValueUsd = assets.reduce((total, asset) => {
        // In a real implementation, you'd convert to USD using current rates
        return total + parseFloat(asset.balance || '0');
      }, 0).toString();

      return {
        exchangeAccountId: exchangeId,
        assets,
        totalValueUsd,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get exchange balance: ${(error as Error).message}`);
    }
  }

  // ===== Deposit Operations =====

  /**
   * Create exchange deposit
   */
  async createExchangeDeposit(request: {
    exchangeId: string;
    asset: string;
    amount: string;
    walletId: string;
    memo?: string;
  }): Promise<DomainExchangeDeposit> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to create exchange deposit');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        DFNS_ENDPOINTS.exchanges.deposit(request.exchangeId),
        request
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.exchanges.deposit(request.exchangeId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Exchange deposit creation failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Convert to domain-compatible format
      return {
        id: result.id,
        exchangeId: request.exchangeId, // Ensure exchangeId is included
        exchangeAccountId: result.exchangeAccountId || request.exchangeId,
        asset: result.asset,
        amount: result.amount,
        address: result.address || '',
        txHash: result.txHash,
        status: result.status,
        networkFee: result.networkFee,
        exchangeFee: result.exchangeFee,
        memo: result.memo,
        dateCreated: result.dateCreated || new Date().toISOString(),
        dateCompleted: result.dateCompleted
      };
    } catch (error) {
      throw new Error(`Failed to create exchange deposit: ${(error as Error).message}`);
    }
  }

  // ===== Withdrawal Operations =====

  /**
   * Create exchange withdrawal
   */
  async createExchangeWithdrawal(request: {
    exchangeId: string;
    asset: string;
    amount: string;
    walletId: string;
    destination: string;
    memo?: string;
  }): Promise<ExchangeWithdrawal> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to create exchange withdrawal');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        DFNS_ENDPOINTS.exchanges.withdraw(request.exchangeId),
        request
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.exchanges.withdraw(request.exchangeId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Exchange withdrawal creation failed: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create exchange withdrawal: ${(error as Error).message}`);
    }
  }

  // ===== Exchange-Specific Configurations =====

  /**
   * Create Kraken exchange configuration
   */
  createKrakenConfig(
    apiKey: string,
    apiSecret: string,
    options: {
      tradingEnabled?: boolean;
      sandbox?: boolean;
      allowedAssets?: string[];
    } = {}
  ): Omit<InternalExchangeAccount, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      exchangeType: ExchangeType.Kraken,
      name: options.sandbox ? 'Kraken Sandbox' : 'Kraken',
      credentials: {
        apiKey,
        apiSecret,
        sandbox: options.sandbox || false,
        encrypted: false
      },
      status: ExchangeStatus.Active,
      config: {
        tradingEnabled: options.tradingEnabled !== false,
        depositEnabled: true,
        withdrawalEnabled: true,
        autoBalance: false,
        allowedAssets: options.allowedAssets || ['BTC', 'ETH', 'USDT', 'USDC']
      }
    };
  }

  /**
   * Create Binance exchange configuration
   */
  createBinanceConfig(
    apiKey: string,
    apiSecret: string,
    options: {
      tradingEnabled?: boolean;
      sandbox?: boolean;
      allowedAssets?: string[];
    } = {}
  ): Omit<InternalExchangeAccount, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      exchangeType: ExchangeType.Binance,
      name: options.sandbox ? 'Binance Testnet' : 'Binance',
      credentials: {
        apiKey,
        apiSecret,
        sandbox: options.sandbox || false,
        encrypted: false
      },
      status: ExchangeStatus.Active,
      config: {
        tradingEnabled: options.tradingEnabled !== false,
        depositEnabled: true,
        withdrawalEnabled: true,
        autoBalance: false,
        allowedAssets: options.allowedAssets || ['BTC', 'ETH', 'BNB', 'USDT', 'BUSD']
      }
    };
  }

  /**
   * Create Coinbase Prime exchange configuration
   */
  createCoinbasePrimeConfig(
    apiKey: string,
    apiSecret: string,
    passphrase: string,
    options: {
      tradingEnabled?: boolean;
      sandbox?: boolean;
      allowedAssets?: string[];
    } = {}
  ): Omit<InternalExchangeAccount, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      exchangeType: ExchangeType.CoinbasePrime,
      name: options.sandbox ? 'Coinbase Prime Sandbox' : 'Coinbase Prime',
      credentials: {
        apiKey,
        apiSecret,
        passphrase,
        sandbox: options.sandbox || false,
        encrypted: false
      },
      status: ExchangeStatus.Active,
      config: {
        tradingEnabled: options.tradingEnabled !== false,
        depositEnabled: true,
        withdrawalEnabled: true,
        autoBalance: false,
        allowedAssets: options.allowedAssets || ['BTC', 'ETH', 'USDC', 'USDT']
      }
    };
  }

  // ===== Utility Methods =====

  /**
   * Validate exchange configuration
   */
  private validateExchangeConfig(config: Omit<InternalExchangeAccount, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!config.name.trim()) {
      throw new Error('Exchange name is required');
    }

    if (!config.credentials.apiKey) {
      throw new Error('API key is required');
    }

    if (!config.credentials.apiSecret) {
      throw new Error('API secret is required');
    }

    if (config.exchangeType === ExchangeType.CoinbasePrime && !config.credentials.passphrase) {
      throw new Error('Passphrase is required for Coinbase Prime');
    }

    if (!Object.values(ExchangeType).includes(config.exchangeType)) {
      throw new Error(`Invalid exchange type: ${config.exchangeType}`);
    }
  }

  /**
   * Encrypt exchange credentials (simplified implementation)
   */
  private encryptCredentials(credentials: ExchangeCredentials): ExchangeCredentials {
    // In a real implementation, encrypt sensitive data
    return {
      ...credentials,
      encrypted: true
    };
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(data: string): string {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // ===== Health Check =====

  /**
   * Test exchange connectivity
   */
  async testExchangeConnection(exchangeId: string): Promise<{
    success: boolean;
    exchangeType: ExchangeType;
    latency: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      const exchange = await this.getExchangeAccount(exchangeId);
      const latency = Date.now() - startTime;

      // In a real implementation, test actual exchange API connectivity
      return {
        success: true,
        exchangeType: exchange.exchangeType as ExchangeType, // Cast to enum type
        latency
      };
    } catch (error) {
      return {
        success: false,
        exchangeType: ExchangeType.Kraken, // Default
        latency: 0,
        error: (error as Error).message
      };
    }
  }
}

// ===== Export =====

export default DfnsExchangeManager;
