/**
 * MoonPay Data Mapping Utilities
 * Provides functions to transform data between different formats
 */

/**
 * Map MoonPay transaction to internal format
 */
export function mapMoonPayTransactionToInternal(transaction: any, type: 'buy' | 'sell'): {
  id: string;
  type: 'buy' | 'sell';
  status: string;
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
} {
  return {
    id: transaction.id,
    type,
    status: transaction.status,
    cryptoCurrency: transaction.quoteCurrency || transaction.baseCurrency,
    fiatCurrency: transaction.baseCurrency || transaction.quoteCurrency,
    cryptoAmount: transaction.quoteAmount || transaction.baseAmount,
    fiatAmount: transaction.baseAmount || transaction.quoteAmount,
    walletAddress: transaction.walletAddress,
    externalTransactionId: transaction.externalTransactionId || transaction.id,
    createdAt: transaction.createdAt || new Date().toISOString(),
    updatedAt: transaction.updatedAt || new Date().toISOString(),
    redirectUrl: transaction.redirectUrl,
    widgetRedirectUrl: transaction.widgetRedirectUrl
  };
}

/**
 * Map internal transaction to database format
 */
export function mapTransactionToDatabase(transaction: any, type: 'buy' | 'sell') {
  return {
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
  };
}

/**
 * Map database transaction to internal format
 */
export function mapDatabaseTransactionToInternal(dbTransaction: any) {
  return {
    id: dbTransaction.id,
    type: dbTransaction.type,
    status: dbTransaction.status,
    cryptoCurrency: dbTransaction.crypto_currency,
    fiatCurrency: dbTransaction.fiat_currency,
    cryptoAmount: dbTransaction.crypto_amount,
    fiatAmount: dbTransaction.fiat_amount,
    walletAddress: dbTransaction.wallet_address,
    externalTransactionId: dbTransaction.external_transaction_id,
    createdAt: dbTransaction.created_at,
    updatedAt: dbTransaction.updated_at,
    redirectUrl: dbTransaction.redirect_url,
    widgetRedirectUrl: dbTransaction.widget_redirect_url
  };
}

/**
 * Map MoonPay currency to internal format
 */
export function mapMoonPayCurrencyToInternal(currency: any) {
  return {
    id: currency.id,
    code: currency.code,
    name: currency.name,
    type: currency.type,
    precision: currency.precision,
    minAmount: currency.minAmount,
    maxAmount: currency.maxAmount,
    minBuyAmount: currency.minBuyAmount,
    maxBuyAmount: currency.maxBuyAmount,
    minSellAmount: currency.minSellAmount,
    maxSellAmount: currency.maxSellAmount,
    isSellSupported: currency.isSellSupported,
    addressRegex: currency.addressRegex,
    testnetAddressRegex: currency.testnetAddressRegex,
    supportsAddressTag: currency.supportsAddressTag,
    addressTagRegex: currency.addressTagRegex,
    supportsTestMode: currency.supportsTestMode,
    supportsLiveMode: currency.supportsLiveMode,
    isSuspended: currency.isSuspended,
    isSupportedInUS: currency.isSupportedInUS,
    notAllowedUSStates: currency.notAllowedUSStates || [],
    notAllowedCountries: currency.notAllowedCountries || [],
    metadata: currency.metadata || {}
  };
}

/**
 * Map MoonPay quote to internal format
 */
export function mapMoonPayQuoteToInternal(quote: any) {
  return {
    baseCurrency: quote.baseCurrency,
    quoteCurrency: quote.quoteCurrency,
    baseAmount: quote.baseAmount,
    quoteAmount: quote.quoteAmount,
    fees: {
      moonpay: quote.feeAmount || 0,
      network: quote.networkFeeAmount || quote.networkFee || 0,
      thirdParty: quote.extraFeeAmount || 0
    },
    extraFees: quote.extraFees || [],
    networkFee: quote.networkFee || quote.networkFeeAmount || 0,
    feeBreakdown: quote.feeBreakdown || [],
    totalAmount: quote.totalAmount,
    recommendedGasLimit: quote.recommendedGasLimit
  };
}

/**
 * Map MoonPay payment method to internal format
 */
export function mapMoonPayPaymentMethodToInternal(paymentMethod: any) {
  return {
    id: paymentMethod.id,
    type: paymentMethod.type,
    name: paymentMethod.name,
    isActive: paymentMethod.isActive,
    limits: {
      daily: {
        min: paymentMethod.limits?.daily?.min || 0,
        max: paymentMethod.limits?.daily?.max || 0
      },
      weekly: {
        min: paymentMethod.limits?.weekly?.min || 0,
        max: paymentMethod.limits?.weekly?.max || 0
      },
      monthly: {
        min: paymentMethod.limits?.monthly?.min || 0,
        max: paymentMethod.limits?.monthly?.max || 0
      }
    }
  };
}

/**
 * Map MoonPay customer to internal format
 */
export function mapMoonPayCustomerToInternal(customer: any) {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    dateOfBirth: customer.dateOfBirth,
    address: customer.address ? {
      street: customer.address.street,
      subStreet: customer.address.subStreet,
      town: customer.address.town,
      postCode: customer.address.postCode,
      state: customer.address.state,
      country: customer.address.country
    } : undefined,
    identityVerificationStatus: customer.identityVerificationStatus,
    kycVerificationStatus: customer.kycVerificationStatus,
    externalCustomerId: customer.externalCustomerId,
    kycLevel: customer.kycLevel || 'none',
    verificationDocuments: customer.verificationDocuments || [],
    transactionLimits: customer.transactionLimits || {
      daily: { min: 0, max: 0 },
      weekly: { min: 0, max: 0 },
      monthly: { min: 0, max: 0 }
    },
    preferredPaymentMethods: customer.preferredPaymentMethods || []
  };
}

/**
 * Map MoonPay swap transaction to internal format
 */
export function mapMoonPaySwapToInternal(swap: any) {
  return {
    id: swap.id,
    quoteId: swap.quoteId,
    status: swap.status,
    baseCurrency: swap.baseCurrency,
    quoteCurrency: swap.quoteCurrency,
    baseAmount: swap.baseAmount,
    quoteAmount: swap.quoteAmount,
    fromAddress: swap.fromAddress,
    toAddress: swap.toAddress,
    txHash: swap.txHash,
    createdAt: swap.createdAt || new Date().toISOString(),
    completedAt: swap.completedAt
  };
}

/**
 * Map internal swap to database format
 */
export function mapSwapToDatabase(swap: any) {
  return {
    external_transaction_id: swap.id,
    quote_id: swap.quoteId,
    status: swap.status,
    base_currency: swap.baseCurrency,
    quote_currency: swap.quoteCurrency,
    base_amount: swap.baseAmount,
    quote_amount: swap.quoteAmount,
    from_address: swap.fromAddress,
    to_address: swap.toAddress,
    tx_hash: swap.txHash,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Map MoonPay NFT pass to internal format
 */
export function mapMoonPayPassToInternal(pass: any) {
  return {
    id: pass.id,
    projectId: pass.projectId,
    contractAddress: pass.contractAddress,
    tokenId: pass.tokenId,
    metadataUrl: pass.metadataUrl,
    name: pass.name,
    description: pass.description,
    image: pass.image,
    attributes: pass.attributes || [],
    owner: pass.owner,
    status: pass.status,
    createdAt: pass.createdAt || new Date().toISOString(),
    updatedAt: pass.updatedAt || new Date().toISOString()
  };
}

/**
 * Map MoonPay asset info to internal format
 */
export function mapMoonPayAssetToInternal(asset: any) {
  return {
    contractAddress: asset.contractAddress,
    tokenId: asset.tokenId,
    name: asset.name,
    description: asset.description,
    image: asset.image,
    animationUrl: asset.animationUrl,
    externalUrl: asset.externalUrl,
    attributes: asset.attributes || [],
    collection: asset.collection ? {
      name: asset.collection.name,
      description: asset.collection.description,
      image: asset.collection.image,
      external_link: asset.collection.external_link
    } : undefined
  };
}

/**
 * Map MoonPay webhook event to internal format
 */
export function mapMoonPayWebhookToInternal(webhook: any) {
  return {
    id: webhook.id,
    eventType: webhook.type,
    data: webhook.data,
    createdAt: webhook.created_at || new Date().toISOString(),
    apiVersion: webhook.api_version,
    livemode: webhook.livemode
  };
}

/**
 * Map fee structure to display format
 */
export function mapFeesToDisplay(fees: any, baseCurrency: string, quoteCurrency: string) {
  return {
    moonpayFee: {
      amount: fees.moonpay || 0,
      currency: baseCurrency,
      formatted: formatCurrency(fees.moonpay || 0, baseCurrency)
    },
    networkFee: {
      amount: fees.network || 0,
      currency: quoteCurrency,
      formatted: formatCurrency(fees.network || 0, quoteCurrency)
    },
    thirdPartyFee: {
      amount: fees.thirdParty || 0,
      currency: baseCurrency,
      formatted: formatCurrency(fees.thirdParty || 0, baseCurrency)
    },
    totalFees: {
      amount: (fees.moonpay || 0) + (fees.network || 0) + (fees.thirdParty || 0),
      currency: baseCurrency,
      formatted: formatCurrency((fees.moonpay || 0) + (fees.network || 0) + (fees.thirdParty || 0), baseCurrency)
    }
  };
}

/**
 * Map transaction status to display format
 */
export function mapStatusToDisplay(status: string) {
  const statusMap: Record<string, { label: string; color: string; description: string }> = {
    pending: {
      label: 'Pending',
      color: 'orange',
      description: 'Transaction is being processed'
    },
    waitingPayment: {
      label: 'Waiting for Payment',
      color: 'blue',
      description: 'Waiting for payment confirmation'
    },
    waitingAuthorization: {
      label: 'Waiting for Authorization',
      color: 'blue',
      description: 'Waiting for transaction authorization'
    },
    waitingCapture: {
      label: 'Waiting for Capture',
      color: 'blue',
      description: 'Payment authorized, waiting for capture'
    },
    processing: {
      label: 'Processing',
      color: 'blue',
      description: 'Transaction is being processed'
    },
    completed: {
      label: 'Completed',
      color: 'green',
      description: 'Transaction completed successfully'
    },
    failed: {
      label: 'Failed',
      color: 'red',
      description: 'Transaction failed'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'gray',
      description: 'Transaction was cancelled'
    },
    expired: {
      label: 'Expired',
      color: 'gray',
      description: 'Transaction expired'
    }
  };

  return statusMap[status] || {
    label: status,
    color: 'gray',
    description: 'Unknown status'
  };
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0';

  // Crypto currencies - use appropriate decimal places
  const cryptoDecimals: Record<string, number> = {
    btc: 8,
    eth: 6,
    ltc: 8,
    bch: 8,
    xrp: 6,
    ada: 6,
    sol: 6,
    matic: 6,
    bnb: 6,
    avax: 6,
    doge: 8,
    xlm: 7,
    trx: 6
  };

  const currencyLower = currency.toLowerCase();
  
  // Check if it's a crypto currency
  if (cryptoDecimals[currencyLower] !== undefined) {
    return `${amount.toFixed(cryptoDecimals[currencyLower])} ${currency.toUpperCase()}`;
  }

  // Treat as fiat currency
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    // Fallback for unknown currencies
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format: 'full' | 'short' | 'time' = 'full'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  let options: Intl.DateTimeFormatOptions;
  
  switch (format) {
    case 'full':
      options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      break;
    case 'short':
      options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      break;
    case 'time':
      options = {
        hour: '2-digit',
        minute: '2-digit'
      };
      break;
    default:
      options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
  }

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Parse URL parameters into object
 */
export function parseUrlParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    
    for (const [key, value] of urlObj.searchParams.entries()) {
      params[key] = value;
    }
    
    return params;
  } catch {
    return {};
  }
}

/**
 * Build URL with parameters
 */
export function buildUrlWithParams(baseUrl: string, params: Record<string, any>): string {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Normalize currency code
 */
export function normalizeCurrencyCode(code: string): string {
  return code?.toLowerCase()?.trim() || '';
}

/**
 * Calculate rate between currencies
 */
export function calculateRate(fromAmount: number, toAmount: number): number {
  if (fromAmount === 0) return 0;
  return toAmount / fromAmount;
}

/**
 * Calculate fee percentage
 */
export function calculateFeePercentage(amount: number, fee: number): number {
  if (amount === 0) return 0;
  return (fee / amount) * 100;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target } as Record<string, any>;
  
  Object.keys(source).forEach(key => {
    const sourceValue = source[key as keyof T];
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
        result[key] = deepMerge(result[key], sourceValue);
      } else {
        result[key] = sourceValue;
      }
    } else {
      result[key] = sourceValue;
    }
  });
  
  return result as T;
}

/**
 * Clean undefined values from object
 */
export function cleanUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
}

/**
 * Convert snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert object keys from snake_case to camelCase
 */
export function objectKeysToCamel(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(objectKeysToCamel);
  }

  const converted: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    const camelKey = snakeToCamel(key);
    converted[camelKey] = objectKeysToCamel(obj[key]);
  });

  return converted;
}

/**
 * Convert object keys from camelCase to snake_case
 */
export function objectKeysToSnake(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(objectKeysToSnake);
  }

  const converted: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    const snakeKey = camelToSnake(key);
    converted[snakeKey] = objectKeysToSnake(obj[key]);
  });

  return converted;
}
