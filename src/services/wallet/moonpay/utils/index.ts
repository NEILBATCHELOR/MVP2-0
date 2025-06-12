/**
 * MoonPay Utilities Index
 * Exports all utility functions, constants, and validators
 */

// Validation utilities
export * from './validators';
export type {
  // Re-export commonly used validation types if needed
} from './validators';

// Mapping utilities
export * from './mappers';
export type {
  // Re-export commonly used mapper types if needed
} from './mappers';

// Constants
export * from './constants';
export type {
  TransactionStatus,
  PaymentMethod,
  KYCLevel,
  WebhookEvent,
  CurrencyType,
  TransactionType,
  NetworkType,
  RiskLevel,
  ServiceName
} from './constants';

// Common utility functions
export const MoonPayUtils = {
  // Validation
  validateWalletAddress: (address: string, currencyCode: string) => 
    import('./validators').then(m => m.validateWalletAddress(address, currencyCode)),
  
  validateCurrencyCode: (code: string) => 
    import('./validators').then(m => m.validateCurrencyCode(code)),
  
  validateAmount: (amount: number, min?: number, max?: number) => 
    import('./validators').then(m => m.validateAmount(amount, min, max)),
  
  // Mapping
  formatCurrency: (amount: number, currency: string) => 
    import('./mappers').then(m => m.formatCurrency(amount, currency)),
  
  formatDate: (date: string | Date, format?: 'full' | 'short' | 'time') => 
    import('./mappers').then(m => m.formatDate(date, format)),
  
  formatPercentage: (value: number, decimals?: number) => 
    import('./mappers').then(m => m.formatPercentage(value, decimals)),
  
  // Constants access
  getTransactionStatuses: () => import('./constants').then(m => m.TRANSACTION_STATUS),
  getPaymentMethods: () => import('./constants').then(m => m.PAYMENT_METHODS),
  getSupportedCurrencies: () => import('./constants').then(m => ({ 
    crypto: m.SUPPORTED_CRYPTO_CURRENCIES, 
    fiat: m.SUPPORTED_FIAT_CURRENCIES 
  })),
  
  // URL building
  buildApiUrl: (endpoint: string, version: string = 'v3', testMode: boolean = true) => 
    import('./constants').then(m => {
      const baseUrl = testMode ? m.MOONPAY_SANDBOX_API_BASE_URL : m.MOONPAY_API_BASE_URL;
      return `${baseUrl}/${version}/${endpoint}`;
    }),
  
  buildWidgetUrl: (params: Record<string, any>, testMode: boolean = true) => 
    import('./constants').then(m => 
      import('./mappers').then(mappers => {
        const baseUrl = testMode ? m.MOONPAY_SANDBOX_WIDGET_BASE_URL : m.MOONPAY_WIDGET_BASE_URL;
        return mappers.buildUrlWithParams(baseUrl, params);
      })
    )
};

// Sync versions of commonly used utilities
export const MoonPayUtilsSync = {
  // Import statements for sync access (these will be tree-shaken if not used)
  constants: import('./constants'),
  validators: import('./validators'),
  mappers: import('./mappers')
};

// Default export
export default MoonPayUtils;
