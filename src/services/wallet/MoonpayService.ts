import { supabase } from '@/infrastructure/database/client';
import { v4 as uuidv4 } from 'uuid';

export interface MoonpayTransaction {
  id: string;
  type: 'buy' | 'sell';
  status: 'pending' | 'completed' | 'failed' | 'waitingPayment' | 'waitingAuthorization';
  cryptoCurrency: string;
  fiatCurrency: string;
  cryptoAmount?: number;
  fiatAmount: number;
  walletAddress?: string;
  externalTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  redirectUrl?: string;
  widgetRedirectUrl?: string;
}

export interface MoonpayCurrency {
  id: string;
  code: string;
  name: string;
  type: 'crypto' | 'fiat';
  precision: number;
  minAmount?: number;
  maxAmount?: number;
  minBuyAmount?: number;
  maxBuyAmount?: number;
  minSellAmount?: number;
  maxSellAmount?: number;
  isSellSupported: boolean;
  addressRegex?: string;
  testnetAddressRegex?: string;
  supportsAddressTag: boolean;
  addressTagRegex?: string;
  supportsTestMode: boolean;
  supportsLiveMode: boolean;
  isSuspended: boolean;
  isSupportedInUS: boolean;
  notAllowedUSStates: string[];
  notAllowedCountries: string[];
  metadata?: {
    chainId?: string;
    networkCode?: string;
    contractAddress?: string;
    coinType?: string;
  };
}

export interface MoonpayQuote {
  baseCurrency: string;
  quoteCurrency: string;
  baseAmount: number;
  quoteAmount: number;
  fees: {
    moonpay: number;
    network: number;
    thirdParty: number;
  };
  extraFees: any[];
  networkFee: number;
  feeBreakdown: any[];
  totalAmount: number;
  recommendedGasLimit?: number;
}

export interface MoonpayLimits {
  daily: {
    min: number;
    max: number;
  };
  weekly: {
    min: number;
    max: number;
  };
  monthly: {
    min: number;
    max: number;
  };
}

export interface MoonpayCustomer {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    subStreet?: string;
    town: string;
    postCode: string;
    state?: string;
    country: string;
  };
  identityVerificationStatus?: 'pending' | 'completed' | 'failed';
  kycVerificationStatus?: 'pending' | 'completed' | 'failed';
}

export interface MoonpayPaymentMethod {
  id: string;
  type: 'credit_debit_card' | 'sepa_bank_transfer' | 'gbp_bank_transfer' | 'apple_pay' | 'google_pay';
  name: string;
  isActive: boolean;
  limits: MoonpayLimits;
}

// NFT and Pass Management Interfaces
export interface MoonpayPass {
  id: string;
  projectId: string;
  contractAddress: string;
  tokenId: string;
  metadataUrl?: string;
  name: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  owner?: string;
  status: 'pending' | 'minted' | 'transferred' | 'burned';
  createdAt: string;
  updatedAt: string;
}

export interface MoonpayAssetInfo {
  contractAddress: string;
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  collection?: {
    name: string;
    description?: string;
    image?: string;
    external_link?: string;
  };
}

export interface MoonpayProject {
  id: string;
  name: string;
  description?: string;
  contractAddress?: string;
  network: string;
  totalSupply?: number;
  maxSupply?: number;
  createdAt: string;
  updatedAt: string;
}

// Swap Interfaces
export interface MoonpaySwapPair {
  baseCurrency: string;
  quoteCurrency: string;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  networkFee: number;
}

export interface MoonpaySwapQuote {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseAmount: number;
  quoteAmount: number;
  rate: number;
  fees: {
    moonpay: number;
    network: number;
    total: number;
  };
  expiresAt: string;
  estimatedProcessingTime: number;
}

export interface MoonpaySwapTransaction {
  id: string;
  quoteId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  baseCurrency: string;
  quoteCurrency: string;
  baseAmount: number;
  quoteAmount: number;
  fromAddress: string;
  toAddress: string;
  txHash?: string;
  createdAt: string;
  completedAt?: string;
}

// Customer Management Interfaces
export interface MoonpayCustomerProfile extends MoonpayCustomer {
  externalCustomerId?: string;
  kycLevel: 'none' | 'basic' | 'enhanced' | 'premium';
  verificationDocuments?: Array<{
    type: 'passport' | 'drivers_license' | 'national_id' | 'proof_of_address';
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
  }>;
  transactionLimits: MoonpayLimits;
  preferredPaymentMethods: string[];
}

// Policy Management Interfaces
export interface MoonpayPolicy {
  id: string;
  name: string;
  type: 'kyc' | 'transaction' | 'compliance' | 'risk';
  rules: Array<{
    condition: string;
    action: 'allow' | 'deny' | 'review';
    parameters: Record<string, any>;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for Moonpay cryptocurrency buy/sell integration
 * Provides fiat on-ramp and off-ramp functionality
 */
export class MoonpayService {
  private apiBaseUrl: string;
  private apiKey: string;
  private secretKey: string;
  private testMode: boolean;

  constructor(testMode: boolean = true) {
    this.testMode = testMode;
    this.apiBaseUrl = testMode 
      ? "https://api.moonpay.com" 
      : "https://api.moonpay.com";
    this.apiKey = import.meta.env.VITE_MOONPAY_API_KEY || "";
    this.secretKey = import.meta.env.VITE_MOONPAY_SECRET_KEY || "";
  }

  /**
   * Get supported currencies for buy/sell operations
   */
  async getSupportedCurrencies(): Promise<MoonpayCurrency[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/currencies`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Currencies API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting supported currencies:', error);
      // Return mock data if API fails
      return [
        {
          id: 'btc',
          code: 'btc',
          name: 'Bitcoin',
          type: 'crypto',
          precision: 8,
          minBuyAmount: 30,
          maxBuyAmount: 20000,
          isSellSupported: true,
          supportsAddressTag: false,
          supportsTestMode: true,
          supportsLiveMode: true,
          isSuspended: false,
          isSupportedInUS: true,
          notAllowedUSStates: ['NY'],
          notAllowedCountries: [],
          metadata: {
            chainId: 'bitcoin',
            networkCode: 'bitcoin'
          }
        },
        {
          id: 'eth',
          code: 'eth',
          name: 'Ethereum',
          type: 'crypto',
          precision: 18,
          minBuyAmount: 30,
          maxBuyAmount: 20000,
          isSellSupported: true,
          supportsAddressTag: false,
          supportsTestMode: true,
          supportsLiveMode: true,
          isSuspended: false,
          isSupportedInUS: true,
          notAllowedUSStates: [],
          notAllowedCountries: [],
          metadata: {
            chainId: '1',
            networkCode: 'ethereum'
          }
        },
        {
          id: 'usd',
          code: 'usd',
          name: 'US Dollar',
          type: 'fiat',
          precision: 2,
          isSellSupported: false,
          supportsAddressTag: false,
          supportsTestMode: true,
          supportsLiveMode: true,
          isSuspended: false,
          isSupportedInUS: true,
          notAllowedUSStates: [],
          notAllowedCountries: []
        }
      ];
    }
  }

  /**
   * Get a quote for buying cryptocurrency
   */
  async getBuyQuote(
    baseCurrency: string,
    quoteCurrency: string,
    baseAmount?: number,
    quoteAmount?: number
  ): Promise<MoonpayQuote> {
    try {
      const params = new URLSearchParams({
        baseCurrency,
        quoteCurrency,
        ...(baseAmount && { baseAmount: baseAmount.toString() }),
        ...(quoteAmount && { quoteAmount: quoteAmount.toString() })
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/currencies/${quoteCurrency}/buy_quote?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Buy quote API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting buy quote:', error);
      throw new Error(`Failed to get buy quote: ${error.message}`);
    }
  }

  /**
   * Get a quote for selling cryptocurrency
   */
  async getSellQuote(
    baseCurrency: string,
    quoteCurrency: string,
    baseAmount?: number,
    quoteAmount?: number
  ): Promise<MoonpayQuote> {
    try {
      const params = new URLSearchParams({
        baseCurrency,
        quoteCurrency,
        ...(baseAmount && { baseAmount: baseAmount.toString() }),
        ...(quoteAmount && { quoteAmount: quoteAmount.toString() })
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/currencies/${baseCurrency}/sell_quote?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Sell quote API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting sell quote:', error);
      throw new Error(`Failed to get sell quote: ${error.message}`);
    }
  }

  /**
   * Create a buy transaction
   */
  async createBuyTransaction(
    quoteCurrency: string,
    baseCurrency: string,
    baseAmount: number,
    walletAddress: string,
    returnUrl?: string,
    externalCustomerId?: string
  ): Promise<MoonpayTransaction> {
    try {
      const body = {
        quoteCurrency,
        baseCurrency,
        baseAmount,
        walletAddress,
        returnUrl,
        externalCustomerId
      };

      const response = await fetch(`${this.apiBaseUrl}/v1/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create transaction API error: ${errorData.message || response.status}`);
      }

      const transaction = await response.json();
      
      // Store transaction in local database
      await this.storeTransaction(transaction, 'buy');
      
      return this.mapToMoonpayTransaction(transaction, 'buy');
    } catch (error) {
      console.error('Error creating buy transaction:', error);
      throw new Error(`Failed to create buy transaction: ${error.message}`);
    }
  }

  /**
   * Create a sell transaction
   */
  async createSellTransaction(
    quoteCurrency: string,
    baseCurrency: string,
    baseAmount: number,
    walletAddress: string,
    returnUrl?: string,
    externalCustomerId?: string
  ): Promise<MoonpayTransaction> {
    try {
      const body = {
        quoteCurrency,
        baseCurrency,
        baseAmount,
        walletAddress,
        returnUrl,
        externalCustomerId
      };

      const response = await fetch(`${this.apiBaseUrl}/v3/sell/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create sell transaction API error: ${errorData.message || response.status}`);
      }

      const transaction = await response.json();
      
      // Store transaction in local database
      await this.storeTransaction(transaction, 'sell');
      
      return this.mapToMoonpayTransaction(transaction, 'sell');
    } catch (error) {
      console.error('Error creating sell transaction:', error);
      throw new Error(`Failed to create sell transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string, type: 'buy' | 'sell'): Promise<MoonpayTransaction> {
    try {
      const endpoint = type === 'buy' 
        ? `${this.apiBaseUrl}/v1/transactions/${transactionId}`
        : `${this.apiBaseUrl}/v3/sell/transactions/${transactionId}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get transaction API error: ${response.status}`);
      }

      const transaction = await response.json();
      return this.mapToMoonpayTransaction(transaction, type);
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  /**
   * Get payment methods for the user's country
   */
  async getPaymentMethods(fiatCurrency: string, cryptoCurrency: string): Promise<MoonpayPaymentMethod[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/payment_methods`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Payment methods API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting payment methods:', error);
      // Return mock payment methods
      return [
        {
          id: 'credit_debit_card',
          type: 'credit_debit_card',
          name: 'Credit/Debit Card',
          isActive: true,
          limits: {
            daily: { min: 30, max: 2000 },
            weekly: { min: 30, max: 10000 },
            monthly: { min: 30, max: 50000 }
          }
        },
        {
          id: 'sepa_bank_transfer',
          type: 'sepa_bank_transfer',
          name: 'SEPA Bank Transfer',
          isActive: true,
          limits: {
            daily: { min: 100, max: 50000 },
            weekly: { min: 100, max: 100000 },
            monthly: { min: 100, max: 500000 }
          }
        }
      ];
    }
  }

  /**
   * Get customer limits for a specific currency pair
   */
  async getCustomerLimits(
    baseCurrency: string,
    quoteCurrency: string,
    paymentMethod?: string
  ): Promise<MoonpayLimits> {
    try {
      const params = new URLSearchParams({
        baseCurrency,
        quoteCurrency,
        ...(paymentMethod && { paymentMethod })
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/limits?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Limits API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting customer limits:', error);
      // Return default limits
      return {
        daily: { min: 30, max: 2000 },
        weekly: { min: 30, max: 10000 },
        monthly: { min: 30, max: 50000 }
      };
    }
  }

  /**
   * Get transaction history for the user
   */
  async getTransactionHistory(limit: number = 50): Promise<MoonpayTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('moonpay_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(tx => ({
        id: tx.id,
        type: tx.type as 'buy' | 'sell',
        status: tx.status as 'pending' | 'completed' | 'failed' | 'waitingPayment' | 'waitingAuthorization',
        cryptoCurrency: tx.crypto_currency,
        fiatCurrency: tx.fiat_currency,
        cryptoAmount: tx.crypto_amount,
        fiatAmount: tx.fiat_amount,
        walletAddress: tx.wallet_address,
        externalTransactionId: tx.external_transaction_id,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        redirectUrl: tx.redirect_url,
        widgetRedirectUrl: tx.widget_redirect_url
      }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  /**
   * Generate Moonpay widget URL for embedded experience
   */
  generateWidgetUrl(
    currencyCode: string,
    walletAddress: string,
    baseCurrencyAmount?: number,
    baseCurrencyCode?: string,
    colorCode?: string,
    language?: string,
    redirectURL?: string
  ): string {
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      currencyCode,
      walletAddress,
      ...(baseCurrencyAmount && { baseCurrencyAmount: baseCurrencyAmount.toString() }),
      ...(baseCurrencyCode && { baseCurrencyCode }),
      ...(colorCode && { colorCode }),
      ...(language && { language }),
      ...(redirectURL && { redirectURL })
    });

    const baseUrl = this.testMode 
      ? "https://buy-sandbox.moonpay.com"
      : "https://buy.moonpay.com";

    return `${baseUrl}?${params.toString()}`;
  }

  // ===== NFT AND PASS MANAGEMENT =====

  /**
   * Get all passes for a project
   */
  async getPasses(projectId?: string): Promise<MoonpayPass[]> {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);

      const response = await fetch(`${this.apiBaseUrl}/v0/passes?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get passes API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting passes:', error);
      throw new Error(`Failed to get passes: ${error.message}`);
    }
  }

  /**
   * Get specific pass by ID
   */
  async getPassById(passId: string): Promise<MoonpayPass> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/passes/${passId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get pass API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting pass:', error);
      throw new Error(`Failed to get pass: ${error.message}`);
    }
  }

  /**
   * Create a new pass
   */
  async createPass(passData: Partial<MoonpayPass>): Promise<MoonpayPass> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/passes`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create pass API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating pass:', error);
      throw new Error(`Failed to create pass: ${error.message}`);
    }
  }

  /**
   * Update an existing pass
   */
  async updatePass(passId: string, updateData: Partial<MoonpayPass>): Promise<MoonpayPass> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/passes/${passId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Update pass API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating pass:', error);
      throw new Error(`Failed to update pass: ${error.message}`);
    }
  }

  /**
   * Delete a pass
   */
  async deletePass(passId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/passes/${passId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Delete pass API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting pass:', error);
      throw new Error(`Failed to delete pass: ${error.message}`);
    }
  }

  /**
   * Get asset information for NFT
   */
  async getAssetInfo(contractAddress: string, tokenId: string): Promise<MoonpayAssetInfo> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/asset-info/${contractAddress}/${tokenId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get asset info API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting asset info:', error);
      throw new Error(`Failed to get asset info: ${error.message}`);
    }
  }

  /**
   * Deliver NFT to wallet address
   */
  async deliverNFT(contractAddress: string, tokenId: string, toAddress: string): Promise<{ txHash: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/lite-deliver-nft/${contractAddress}/${tokenId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ toAddress })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Deliver NFT API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error delivering NFT:', error);
      throw new Error(`Failed to deliver NFT: ${error.message}`);
    }
  }

  /**
   * Validate wallet address for a specific cryptocurrency
   */
  async validateWalletAddress(address: string, currencyCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/currencies/${currencyCode}/validate_address`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.isValid;
    } catch (error) {
      console.error('Error validating wallet address:', error);
      return false;
    }
  }

  // ===== SWAP FUNCTIONALITY =====

  /**
   * Get available swap pairs
   */
  async getSwapPairs(): Promise<MoonpaySwapPair[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/swap/pairs`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get swap pairs API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap pairs:', error);
      throw new Error(`Failed to get swap pairs: ${error.message}`);
    }
  }

  /**
   * Get swap quote
   */
  async getSwapQuote(
    baseCurrency: string,
    quoteCurrency: string,
    baseAmount: number,
    fromAddress: string,
    toAddress: string
  ): Promise<MoonpaySwapQuote> {
    try {
      const params = new URLSearchParams({
        baseCurrency,
        quoteCurrency,
        baseAmount: baseAmount.toString(),
        fromAddress,
        toAddress
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/swap/quote?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get swap quote API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw new Error(`Failed to get swap quote: ${error.message}`);
    }
  }

  /**
   * Execute swap transaction
   */
  async executeSwapQuote(quoteId: string): Promise<MoonpaySwapTransaction> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/swap/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quoteId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Execute swap API error: ${errorData.message || response.status}`);
      }

      const swapTransaction = await response.json();
      
      // Store swap transaction in local database
      await this.storeSwapTransaction(swapTransaction);
      
      return swapTransaction;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw new Error(`Failed to execute swap: ${error.message}`);
    }
  }

  /**
   * Get swap transaction status
   */
  async getSwapTransaction(transactionId: string): Promise<MoonpaySwapTransaction> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/swap/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get swap transaction API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap transaction:', error);
      throw new Error(`Failed to get swap transaction: ${error.message}`);
    }
  }

  /**
   * Reject a swap quote
   */
  async rejectSwapQuote(quoteId: string, reason?: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/swap/quotes/${quoteId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error(`Reject swap quote API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error rejecting swap quote:', error);
      throw new Error(`Failed to reject swap quote: ${error.message}`);
    }
  }

  // Private helper methods

  private async storeTransaction(transaction: any, type: 'buy' | 'sell'): Promise<void> {
    try {
      const { error } = await supabase
        .from('moonpay_transactions')
        .insert({
          id: uuidv4(),
          external_transaction_id: transaction.id,
          type,
          status: transaction.status,
          crypto_currency: transaction.quoteCurrency || transaction.baseCurrency,
          fiat_currency: transaction.baseCurrency || transaction.quoteCurrency,
          crypto_amount: transaction.quoteAmount || transaction.baseAmount,
          fiat_amount: transaction.baseAmount || transaction.quoteAmount,
          wallet_address: transaction.walletAddress,
          redirect_url: transaction.redirectUrl,
          widget_redirect_url: transaction.widgetRedirectUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing transaction:', error);
      }
    } catch (error) {
      console.error('Error storing transaction:', error);
    }
  }

  private async storeSwapTransaction(swapTransaction: MoonpaySwapTransaction): Promise<void> {
    try {
      const { error } = await supabase
        .from('moonpay_swap_transactions')
        .insert({
          id: uuidv4(),
          external_transaction_id: swapTransaction.id,
          quote_id: swapTransaction.quoteId,
          status: swapTransaction.status,
          base_currency: swapTransaction.baseCurrency,
          quote_currency: swapTransaction.quoteCurrency,
          base_amount: swapTransaction.baseAmount,
          quote_amount: swapTransaction.quoteAmount,
          from_address: swapTransaction.fromAddress,
          to_address: swapTransaction.toAddress,
          tx_hash: swapTransaction.txHash,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing swap transaction:', error);
      }
    } catch (error) {
      console.error('Error storing swap transaction:', error);
    }
  }

  private mapToMoonpayTransaction(transaction: any, type: 'buy' | 'sell'): MoonpayTransaction {
    return {
      id: transaction.id,
      type,
      status: transaction.status,
      cryptoCurrency: transaction.quoteCurrency || transaction.baseCurrency,
      fiatCurrency: transaction.baseCurrency || transaction.quoteCurrency,
      cryptoAmount: transaction.quoteAmount || transaction.baseAmount,
      fiatAmount: transaction.baseAmount || transaction.quoteAmount,
      walletAddress: transaction.walletAddress,
      externalTransactionId: transaction.externalTransactionId,
      createdAt: transaction.createdAt || new Date().toISOString(),
      updatedAt: transaction.updatedAt || new Date().toISOString(),
      redirectUrl: transaction.redirectUrl,
      widgetRedirectUrl: transaction.widgetRedirectUrl
    };
  }

  // ===== CUSTOMER MANAGEMENT =====

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<MoonpayCustomerProfile> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/customers/${customerId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get customer API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting customer:', error);
      throw new Error(`Failed to get customer: ${error.message}`);
    }
  }

  /**
   * Get customer by external ID
   */
  async getCustomerByExternalId(externalCustomerId: string): Promise<MoonpayCustomerProfile> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/customers/ext/${externalCustomerId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get customer by external ID API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting customer by external ID:', error);
      throw new Error(`Failed to get customer by external ID: ${error.message}`);
    }
  }

  /**
   * Initiate identity verification for customer
   */
  async initiateIdentityCheck(customerId: string, verificationType: 'basic' | 'enhanced' = 'basic'): Promise<{ verificationUrl: string; sessionId: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/identity-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          customerId,
          verificationType,
          returnUrl: `${window.location.origin}/wallet?tab=moonpay&verification=complete`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Identity check API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error initiating identity check:', error);
      throw new Error(`Failed to initiate identity check: ${error.message}`);
    }
  }
}

export const moonpayService = new MoonpayService();
