/**
 * Unified MoonPay Types
 * Provides common interfaces for both OnRamp and OffRamp operations
 */

import type { OnRampQuote, OnRampTransaction } from '../core/OnRampService';
import type { OffRampQuote, OffRampTransaction } from '../core/OffRampService';

// Union types for quotes and transactions
export type MoonpayQuote = OnRampQuote | OffRampQuote;
export type MoonpayTransaction = OnRampTransaction | OffRampTransaction;

// Common base interfaces for consistent display
export interface BaseQuote {
  baseCurrency: string;
  quoteCurrency: string;
  baseAmount: number;
  quoteAmount: number;
  fees: {
    moonpay: number;
    network: number;
    total: number;
  };
  totalAmount?: number; // Optional for OffRamp
}

export interface BaseTransaction {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'waitingPayment' | 'waitingAuthorization';
  createdAt: string;
  updatedAt: string;
  walletAddress?: string;
  externalTransactionId?: string;
  redirectUrl?: string;
}

// Type guards to distinguish between OnRamp and OffRamp
export function isOnRampQuote(quote: MoonpayQuote): quote is OnRampQuote {
  return 'totalAmount' in quote;
}

export function isOffRampQuote(quote: MoonpayQuote): quote is OffRampQuote {
  return 'estimatedProcessingTime' in quote && 'expiresAt' in quote;
}

export function isOnRampTransaction(transaction: MoonpayTransaction): transaction is OnRampTransaction {
  return 'cryptoCurrency' in transaction && 'fiatCurrency' in transaction;
}

export function isOffRampTransaction(transaction: MoonpayTransaction): transaction is OffRampTransaction {
  return 'baseCurrency' in transaction && 'quoteCurrency' in transaction && !('cryptoCurrency' in transaction);
}

// Utility functions to normalize the different interfaces
export function normalizeQuote(quote: MoonpayQuote): BaseQuote {
  if (isOnRampQuote(quote)) {
    return {
      baseCurrency: quote.baseCurrency,
      quoteCurrency: quote.quoteCurrency,
      baseAmount: quote.baseAmount,
      quoteAmount: quote.quoteAmount,
      fees: quote.fees,
      totalAmount: quote.totalAmount
    };
  } else {
    return {
      baseCurrency: quote.baseCurrency,
      quoteCurrency: quote.quoteCurrency,
      baseAmount: quote.baseAmount,
      quoteAmount: quote.quoteAmount,
      fees: quote.fees,
      totalAmount: undefined // OffRamp doesn't have totalAmount
    };
  }
}

export function normalizeTransaction(transaction: MoonpayTransaction): BaseTransaction & {
  cryptoCurrency?: string;
  fiatCurrency?: string;
  cryptoAmount?: number;
  fiatAmount?: number;
} {
  const base: BaseTransaction = {
    id: transaction.id,
    status: transaction.status,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    walletAddress: transaction.walletAddress,
    externalTransactionId: transaction.externalTransactionId,
    redirectUrl: transaction.redirectUrl
  };

  if (isOnRampTransaction(transaction)) {
    return {
      ...base,
      cryptoCurrency: transaction.cryptoCurrency,
      fiatCurrency: transaction.fiatCurrency,
      cryptoAmount: transaction.cryptoAmount,
      fiatAmount: transaction.fiatAmount
    };
  } else {
    // Map OffRamp properties to common format
    return {
      ...base,
      cryptoCurrency: transaction.baseCurrency, // In OffRamp, baseCurrency is crypto
      fiatCurrency: transaction.quoteCurrency, // In OffRamp, quoteCurrency is fiat
      cryptoAmount: transaction.baseAmount,
      fiatAmount: transaction.quoteAmount
    };
  }
}

// Display utility functions
export function getQuoteDisplayAmount(quote: MoonpayQuote, type: 'buy' | 'sell'): {
  youPay: { amount: number; currency: string };
  youReceive: { amount: number; currency: string };
  total: { amount: number | undefined; currency: string };
} {
  const normalized = normalizeQuote(quote);
  
  if (type === 'buy') {
    return {
      youPay: { 
        amount: normalized.baseAmount, 
        currency: normalized.baseCurrency 
      },
      youReceive: { 
        amount: normalized.quoteAmount, 
        currency: normalized.quoteCurrency 
      },
      total: { 
        amount: normalized.totalAmount, 
        currency: normalized.baseCurrency 
      }
    };
  } else {
    return {
      youPay: { 
        amount: normalized.baseAmount, 
        currency: normalized.baseCurrency 
      },
      youReceive: { 
        amount: normalized.quoteAmount, 
        currency: normalized.quoteCurrency 
      },
      total: { 
        amount: normalized.quoteAmount, // For sell, total is the fiat amount received
        currency: normalized.quoteCurrency 
      }
    };
  }
}

export function getTransactionDisplayInfo(transaction: MoonpayTransaction, type: 'buy' | 'sell'): {
  cryptoCurrency: string;
  fiatCurrency: string;
  cryptoAmount: number | undefined;
  fiatAmount: number | undefined;
} {
  const normalized = normalizeTransaction(transaction);
  
  return {
    cryptoCurrency: normalized.cryptoCurrency || '',
    fiatCurrency: normalized.fiatCurrency || '',
    cryptoAmount: normalized.cryptoAmount,
    fiatAmount: normalized.fiatAmount
  };
}
