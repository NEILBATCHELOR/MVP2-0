/**
 * MoonPay Off-Ramp Service
 * Handles crypto-to-fiat sales via MoonPay's sell flow
 */

import { supabase } from '@/infrastructure/database/client';
import { v4 as uuidv4 } from 'uuid';

export interface OffRampTransaction {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'waitingPayment' | 'waitingAuthorization';
  baseCurrency: string; // crypto being sold
  quoteCurrency: string; // fiat received
  baseAmount: number; // crypto amount
  quoteAmount: number; // fiat amount
  walletAddress?: string;
  externalTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  redirectUrl?: string;
}

export interface OffRampQuote {
  baseCurrency: string;
  quoteCurrency: string;
  baseAmount: number;
  quoteAmount: number;
  fees: {
    moonpay: number;
    network: number;
    total: number;
  };
  estimatedProcessingTime: number; // in seconds
  expiresAt: string;
}

export interface PayoutMethod {
  id: string;
  type: 'bank_transfer' | 'card' | 'sepa' | 'gbp_bank_transfer';
  name: string;
  isActive: boolean;
  processingTime: string;
  fee: number;
}

/**
 * OffRamp Service for MoonPay crypto-to-fiat sales
 */
export class OffRampService {
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
   * Get supported currencies for sell operations
   */
  async getSupportedSellCurrencies(): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/currencies?filter=sell`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Sell currencies API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting supported sell currencies:', error);
      throw new Error(`Failed to get supported sell currencies: ${error.message}`);
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
  ): Promise<OffRampQuote> {
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
   * Create a sell transaction
   */
  async createSellTransaction(
    baseCurrency: string,
    quoteCurrency: string,
    baseAmount: number,
    walletAddress: string,
    returnUrl?: string,
    externalCustomerId?: string
  ): Promise<OffRampTransaction> {
    try {
      const body = {
        baseCurrency,
        quoteCurrency,
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
      await this.storeTransaction(transaction);
      
      return this.mapToOffRampTransaction(transaction);
    } catch (error) {
      console.error('Error creating sell transaction:', error);
      throw new Error(`Failed to create sell transaction: ${error.message}`);
    }
  }

  /**
   * Get sell transaction status
   */
  async getSellTransactionStatus(transactionId: string): Promise<OffRampTransaction> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/sell/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get sell transaction API error: ${response.status}`);
      }

      const transaction = await response.json();
      return this.mapToOffRampTransaction(transaction);
    } catch (error) {
      console.error('Error getting sell transaction status:', error);
      throw new Error(`Failed to get sell transaction status: ${error.message}`);
    }
  }

  /**
   * Get available payout methods
   */
  async getPayoutMethods(baseCurrency: string, quoteCurrency: string): Promise<PayoutMethod[]> {
    try {
      const params = new URLSearchParams({
        baseCurrency,
        quoteCurrency
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/sell/payout_methods?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Payout methods API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting payout methods:', error);
      // Return default payout methods
      return [
        {
          id: 'bank_transfer',
          type: 'bank_transfer',
          name: 'Bank Transfer',
          isActive: true,
          processingTime: '1-3 business days',
          fee: 0.01
        },
        {
          id: 'sepa_bank_transfer',
          type: 'sepa',
          name: 'SEPA Bank Transfer',
          isActive: true,
          processingTime: '1-2 business days',
          fee: 0.005
        }
      ];
    }
  }

  /**
   * Generate MoonPay sell widget URL
   */
  generateSellWidgetUrl(
    currencyCode: string,
    walletAddress: string,
    baseCurrencyAmount?: number,
    quoteCurrencyCode?: string,
    redirectURL?: string
  ): string {
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      baseCurrencyCode: currencyCode,
      walletAddress,
      ...(baseCurrencyAmount && { baseCurrencyAmount: baseCurrencyAmount.toString() }),
      ...(quoteCurrencyCode && { quoteCurrencyCode }),
      ...(redirectURL && { redirectURL })
    });

    const baseUrl = this.testMode 
      ? "https://sell-sandbox.moonpay.com"
      : "https://sell.moonpay.com";

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Get sell transaction history
   */
  async getSellTransactionHistory(limit: number = 50): Promise<OffRampTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('moonpay_transactions')
        .select('*')
        .eq('type', 'sell')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(tx => ({
        id: tx.id,
        status: tx.status as OffRampTransaction['status'],
        baseCurrency: tx.crypto_currency,
        quoteCurrency: tx.fiat_currency,
        baseAmount: tx.crypto_amount,
        quoteAmount: tx.fiat_amount,
        walletAddress: tx.wallet_address,
        externalTransactionId: tx.external_transaction_id,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        redirectUrl: tx.redirect_url
      }));
    } catch (error) {
      console.error('Error getting sell transaction history:', error);
      throw new Error(`Failed to get sell transaction history: ${error.message}`);
    }
  }

  /**
   * Validate sell amount against limits
   */
  async validateSellAmount(
    baseCurrency: string,
    quoteCurrency: string,
    amount: number
  ): Promise<{ isValid: boolean; reason?: string }> {
    try {
      const limits = await this.getSellLimits(baseCurrency, quoteCurrency);
      
      if (amount < limits.daily.min) {
        return { isValid: false, reason: `Amount below minimum limit of ${limits.daily.min}` };
      }
      
      if (amount > limits.daily.max) {
        return { isValid: false, reason: `Amount exceeds maximum limit of ${limits.daily.max}` };
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('Error validating sell amount:', error);
      return { isValid: false, reason: 'Failed to validate amount' };
    }
  }

  /**
   * Get sell limits for currency pair
   */
  async getSellLimits(baseCurrency: string, quoteCurrency: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        baseCurrency,
        quoteCurrency
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/sell/limits?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Sell limits API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting sell limits:', error);
      // Return default limits
      return {
        daily: { min: 50, max: 10000 },
        weekly: { min: 50, max: 50000 },
        monthly: { min: 50, max: 200000 }
      };
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
          type: 'sell',
          status: transaction.status,
          crypto_currency: transaction.baseCurrency,
          fiat_currency: transaction.quoteCurrency,
          crypto_amount: transaction.baseAmount,
          fiat_amount: transaction.quoteAmount,
          wallet_address: transaction.walletAddress,
          redirect_url: transaction.redirectUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing sell transaction:', error);
      }
    } catch (error) {
      console.error('Error storing sell transaction:', error);
    }
  }

  private mapToOffRampTransaction(transaction: any): OffRampTransaction {
    return {
      id: transaction.id,
      status: transaction.status,
      baseCurrency: transaction.baseCurrency,
      quoteCurrency: transaction.quoteCurrency,
      baseAmount: transaction.baseAmount,
      quoteAmount: transaction.quoteAmount,
      walletAddress: transaction.walletAddress,
      externalTransactionId: transaction.externalTransactionId,
      createdAt: transaction.createdAt || new Date().toISOString(),
      updatedAt: transaction.updatedAt || new Date().toISOString(),
      redirectUrl: transaction.redirectUrl
    };
  }
}

export const offRampService = new OffRampService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
