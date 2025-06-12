/**
 * MoonPay Validation Utilities
 * Provides validation functions for MoonPay data and configurations
 */

/**
 * Validate wallet address for specific cryptocurrency
 */
export function validateWalletAddress(address: string, currencyCode: string): boolean {
  if (!address || !currencyCode) return false;

  const addressPatterns: Record<string, RegExp> = {
    // Bitcoin
    btc: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1([02-9ac-hj-np-z]){7,87}$/,
    
    // Ethereum and ERC-20 tokens
    eth: /^0x[a-fA-F0-9]{40}$/,
    usdc: /^0x[a-fA-F0-9]{40}$/,
    usdt: /^0x[a-fA-F0-9]{40}$/,
    dai: /^0x[a-fA-F0-9]{40}$/,
    
    // Litecoin
    ltc: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1([02-9ac-hj-np-z]){7,87}$/,
    
    // Bitcoin Cash
    bch: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bitcoincash:[a-z0-9]{42}$/,
    
    // Ripple
    xrp: /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/,
    
    // Cardano
    ada: /^addr1[a-z0-9]{58}$|^DdzFF[a-zA-Z0-9]{95}$/,
    
    // Solana
    sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    
    // Polygon (same as Ethereum)
    matic: /^0x[a-fA-F0-9]{40}$/,
    
    // Binance Smart Chain (same as Ethereum)
    bnb: /^0x[a-fA-F0-9]{40}$/,
    
    // Avalanche (same as Ethereum)
    avax: /^0x[a-fA-F0-9]{40}$/,
    
    // Dogecoin
    doge: /^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/,
    
    // Stellar
    xlm: /^G[A-Z2-7]{55}$/,
    
    // Tron
    trx: /^T[A-Za-z1-9]{33}$/
  };

  const pattern = addressPatterns[currencyCode.toLowerCase()];
  return pattern ? pattern.test(address) : false;
}

/**
 * Validate currency code format
 */
export function validateCurrencyCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  
  // Currency codes should be 2-6 characters, alphanumeric
  return /^[a-zA-Z0-9]{2,6}$/.test(code);
}

/**
 * Validate amount values
 */
export function validateAmount(amount: number, min?: number, max?: number): {
  isValid: boolean;
  error?: string;
} {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return { isValid: false, error: 'Amount must be a positive number' };
  }

  if (min !== undefined && amount < min) {
    return { isValid: false, error: `Amount must be at least ${min}` };
  }

  if (max !== undefined && amount > max) {
    return { isValid: false, error: `Amount must not exceed ${max}` };
  }

  return { isValid: true };
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false;
  
  // MoonPay API keys are typically UUIDs or long alphanumeric strings
  return /^[a-zA-Z0-9-_]{20,}$/.test(apiKey);
}

/**
 * Validate webhook signature format
 */
export function validateWebhookSignature(signature: string): boolean {
  if (!signature || typeof signature !== 'string') return false;
  
  // Webhook signatures are typically SHA256 hashes
  return /^[a-fA-F0-9]{64}$/.test(signature);
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (international)
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // International phone number format
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate date format (ISO 8601)
 */
export function validateDate(date: string): boolean {
  if (!date || typeof date !== 'string') return false;
  
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime()) && date === parsedDate.toISOString();
}

/**
 * Validate country code (ISO 3166-1 alpha-2)
 */
export function validateCountryCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  
  const validCodes = [
    'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
    'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
    'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY',
    'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
    'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
    'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK',
    'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL',
    'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
    'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
    'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
    'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
    'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
    'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
    'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP',
    'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM',
    'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
    'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM',
    'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF',
    'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
    'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
    'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
  ];
  
  return validCodes.includes(code.toUpperCase());
}

/**
 * Validate payment method type
 */
export function validatePaymentMethod(method: string): boolean {
  const validMethods = [
    'credit_debit_card',
    'sepa_bank_transfer',
    'gbp_bank_transfer',
    'apple_pay',
    'google_pay',
    'bank_transfer',
    'swift_transfer'
  ];
  
  return validMethods.includes(method);
}

/**
 * Validate transaction status
 */
export function validateTransactionStatus(status: string): boolean {
  const validStatuses = [
    'pending',
    'waitingPayment',
    'waitingAuthorization',
    'waitingCapture',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'expired'
  ];
  
  return validStatuses.includes(status);
}

/**
 * Validate webhook event type
 */
export function validateWebhookEventType(eventType: string): boolean {
  const validEvents = [
    'transaction.completed',
    'transaction.failed',
    'transaction.pending',
    'transaction.waitingPayment',
    'transaction.waitingAuthorization',
    'customer.created',
    'customer.updated',
    'customer.kyc_completed',
    'customer.kyc_failed',
    'customer.identity_verified',
    'swap.completed',
    'swap.failed',
    'nft.minted',
    'nft.transferred',
    'policy.violated',
    'compliance.alert'
  ];
  
  return validEvents.includes(eventType);
}

/**
 * Validate configuration object
 */
export function validateMoonPayConfig(config: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config) {
    return { isValid: false, errors: ['Configuration is required'] };
  }

  // Validate API key
  if (!config.apiKey || !validateApiKey(config.apiKey)) {
    errors.push('Valid API key is required');
  }

  // Validate secret key
  if (!config.secretKey || typeof config.secretKey !== 'string' || config.secretKey.length < 10) {
    errors.push('Valid secret key is required');
  }

  // Validate test mode
  if (config.testMode !== undefined && typeof config.testMode !== 'boolean') {
    errors.push('Test mode must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize input string
 */
export function sanitizeInput(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .substring(0, maxLength);
}

/**
 * Validate quote parameters
 */
export function validateQuoteParams(params: {
  baseCurrency: string;
  quoteCurrency: string;
  baseAmount?: number;
  quoteAmount?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validateCurrencyCode(params.baseCurrency)) {
    errors.push('Invalid base currency code');
  }

  if (!validateCurrencyCode(params.quoteCurrency)) {
    errors.push('Invalid quote currency code');
  }

  if (params.baseAmount !== undefined) {
    const amountValidation = validateAmount(params.baseAmount);
    if (!amountValidation.isValid) {
      errors.push(`Base amount: ${amountValidation.error}`);
    }
  }

  if (params.quoteAmount !== undefined) {
    const amountValidation = validateAmount(params.quoteAmount);
    if (!amountValidation.isValid) {
      errors.push(`Quote amount: ${amountValidation.error}`);
    }
  }

  if (!params.baseAmount && !params.quoteAmount) {
    errors.push('Either base amount or quote amount is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate transaction creation parameters
 */
export function validateTransactionParams(params: {
  baseCurrency: string;
  quoteCurrency: string;
  baseAmount: number;
  walletAddress: string;
  returnUrl?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate currencies
  if (!validateCurrencyCode(params.baseCurrency)) {
    errors.push('Invalid base currency code');
  }

  if (!validateCurrencyCode(params.quoteCurrency)) {
    errors.push('Invalid quote currency code');
  }

  // Validate amount
  const amountValidation = validateAmount(params.baseAmount);
  if (!amountValidation.isValid) {
    errors.push(`Amount: ${amountValidation.error}`);
  }

  // Validate wallet address
  if (!validateWalletAddress(params.walletAddress, params.quoteCurrency)) {
    errors.push('Invalid wallet address for the specified cryptocurrency');
  }

  // Validate return URL if provided
  if (params.returnUrl) {
    try {
      new URL(params.returnUrl);
    } catch {
      errors.push('Invalid return URL format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
