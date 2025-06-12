/**
 * MoonPay On-Ramp Service
 * Handles fiat-to-crypto purchases via MoonPay's buy flow
 */

import { supabase } from '@/infrastructure/database/client';
import { v4 as uuidv4 } from 'uuid';

export interface OnRampTransaction {
  id: string;
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

export interface OnRampCurrency {
  id: string;
  code: string;
  name: string;
  type: 'crypto' | 'fiat';
  precision: number;
  minBuyAmount?: number;
  maxBuyAmount?: number;
  isSuspended: boolean;
  isSupportedInUS: boolean;
  notAllowedUSStates: string[];
  notAllowedCountries: string[];
  metadata?: {
    chainId?: string;
    networkCode?: string;
    contractAddress?: string;
  };
}

export interface OnRampQuote {
  baseCurrency: string;
  quoteCurrency: string;
  baseAmount: number;
  quoteAmount: number;
  fees: {
    moonpay: number;
    network: number;
    total: number;
  };
  totalAmount: number;
  recommendedGasLimit?: number;
}

export interface OnRampLimits {
  daily: { min: number; max: number };
  weekly: { min: number; max: number };
  monthly: { min: number; max: number };
}

export interface PaymentMethod {
  id: string;
  type: 'credit_debit_card' | 'sepa_bank_transfer' | 'gbp_bank_transfer' | 'apple_pay' | 'google_pay';
  name: string;
  isActive: boolean;
  limits: OnRampLimits;
}

/**
 * OnRamp Service for MoonPay fiat-to-crypto purchases
 */
export class OnRampService {
  private apiBaseUrl: string;
  private apiKey: string;
  private secretKey: string;
  private testMode: boolean;

  constructor(apiKey: string, secretKey: string, testMode: boolean = true) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.testMode = testMode;
    this.apiBaseUrl = "https://api.moonpay.com";
  }

  /**
   * Get supported currencies for buy operations
   */
  async getSupportedCurrencies(): Promise<OnRampCurrency[]> {
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
      throw new Error(`Failed to get supported currencies: ${error.message}`);
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
  ): Promise<OnRampQuote> {
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
   * Create a buy transaction
   */
  async createBuyTransaction(
    quoteCurrency: string,
    baseCurrency: string,
    baseAmount: number,
    walletAddress: string,
    returnUrl?: string,
    externalCustomerId?: string
  ): Promise<OnRampTransaction> {
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
      await this.storeTransaction(transaction);
      
      return this.mapToOnRampTransaction(transaction);
    } catch (error) {
      console.error('Error creating buy transaction:', error);
      throw new Error(`Failed to create buy transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<OnRampTransaction> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get transaction API error: ${response.status}`);
      }

      const transaction = await response.json();
      return this.mapToOnRampTransaction(transaction);
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  /**
   * Get payment methods for the user's country
   */
  async getPaymentMethods(fiatCurrency: string, cryptoCurrency: string): Promise<PaymentMethod[]> {
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
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }
  }

  /**
   * Get customer limits for a specific currency pair
   */
  async getCustomerLimits(
    baseCurrency: string,
    quoteCurrency: string,
    paymentMethod?: string
  ): Promise<OnRampLimits> {
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
      throw new Error(`Failed to get customer limits: ${error.message}`);
    }
  }

  /**
   * Generate MoonPay widget URL for embedded experience
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

  /**
   * Get transaction history for the user
   */
  async getTransactionHistory(limit: number = 50): Promise<OnRampTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('moonpay_transactions')
        .select('*')
        .eq('type', 'buy')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(tx => ({
        id: tx.id,
        status: tx.status as OnRampTransaction['status'],
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

  // Private helper methods

  private async storeTransaction(transaction: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('moonpay_transactions')
        .insert({
          id: uuidv4(),
          external_transaction_id: transaction.id,
          type: 'buy',
          status: transaction.status,
          crypto_currency: transaction.quoteCurrency,
          fiat_currency: transaction.baseCurrency,
          crypto_amount: transaction.quoteAmount,
          fiat_amount: transaction.baseAmount,
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

  private mapToOnRampTransaction(transaction: any): OnRampTransaction {
    return {
      id: transaction.id,
      status: transaction.status,
      cryptoCurrency: transaction.quoteCurrency,
      fiatCurrency: transaction.baseCurrency,
      cryptoAmount: transaction.quoteAmount,
      fiatAmount: transaction.baseAmount,
      walletAddress: transaction.walletAddress,
      externalTransactionId: transaction.externalTransactionId,
      createdAt: transaction.createdAt || new Date().toISOString(),
      updatedAt: transaction.updatedAt || new Date().toISOString(),
      redirectUrl: transaction.redirectUrl,
      widgetRedirectUrl: transaction.widgetRedirectUrl
    };
  }
}

export const onRampService = new OnRampService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
