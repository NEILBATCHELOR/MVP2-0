/**
 * RAMP Network Core Types
 * 
 * Core type definitions for RAMP Network integration
 */

// ===== Core RAMP Network Types =====

export type RampNetworkFlow = 'ONRAMP' | 'OFFRAMP';

export type RampIntegrationMode = 'overlay' | 'hosted' | 'embedded';

export type RampVariant = 
  | 'auto' 
  | 'hosted-auto' 
  | 'desktop' 
  | 'mobile' 
  | 'hosted-desktop' 
  | 'hosted-mobile' 
  | 'embedded-desktop' 
  | 'embedded-mobile';

export type RampPaymentMethod = 
  | 'MANUAL_BANK_TRANSFER'
  | 'AUTO_BANK_TRANSFER' 
  | 'CARD_PAYMENT'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY'
  | 'PIX'
  | 'OPEN_BANKING';

export type RampEnvironment = 'staging' | 'production';

// ===== Asset Information =====

export interface RampAssetInfo {
  symbol: string;
  chain: string;
  name: string;
  decimals: number;
  type: 'NATIVE' | 'ERC20' | 'BEP20' | 'SPL' | 'TRC20';
  address: string | null;
  logoUrl: string;
  enabled: boolean;
  hidden: boolean;
  price: Record<string, number>;
  currencyCode: string;
  minPurchaseAmount: number;
  maxPurchaseAmount: number;
  minPurchaseCryptoAmount: string;
  networkFee?: number;
}

export interface RampHostAssetsConfig {
  assets: RampAssetInfo[];
  enabledFeatures?: string[];
  currencyCode: string;
  minPurchaseAmount: number;
  maxPurchaseAmount: number;
  minFeeAmount?: number;
  minFeePercent?: number;
  maxFeePercent?: number;
}

// ===== Transaction Types =====

export interface RampPurchase {
  id: string;
  endTime: string;
  asset: RampAssetInfo;
  receiverAddress: string;
  cryptoAmount: string;
  fiatCurrency: string;
  fiatValue: number;
  paymentMethodType: RampPaymentMethod;
  status: RampPurchaseStatus;
  createdAt: string;
  updatedAt: string;
  finalTxHash?: string;
  escrowAddress?: string;
  appliedFee: number;
  purchaseViewToken?: string;
  baseRampFee?: number;
  networkFee?: number;
}

export interface RampSale {
  id: string;
  saleViewToken: string;
  status: RampSaleStatus;
  createdAt: string;
  updatedAt: string;
  fees: {
    amount: string;
    currencySymbol: string;
  };
  exchangeRate: string | null;
  crypto: {
    amount: string;
    status: RampCryptoStatus | null;
    assetInfo: RampAssetInfo;
  };
  fiat: {
    amount: string;
    currencySymbol: string;
    status: RampPayoutStatus | null;
    payoutMethod?: string;
  };
  transactionHash?: string;
  cryptoToEurRate?: string;
}

// ===== Status Types =====

export type RampPurchaseStatus = 
  | 'INITIALIZED'
  | 'PAYMENT_STARTED'
  | 'PAYMENT_IN_PROGRESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_EXECUTED'
  | 'FIAT_SENT'
  | 'FIAT_RECEIVED'
  | 'RELEASING'
  | 'RELEASED'
  | 'EXPIRED'
  | 'CANCELLED';

export type RampSaleStatus =
  | 'INITIALIZED'
  | 'PAYMENT_STARTED'
  | 'PAYMENT_IN_PROGRESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_EXECUTED'
  | 'CRYPTO_EXCHANGE_IN_PROGRESS'
  | 'FIAT_SENT'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export type RampCryptoStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'FAILED';

export type RampPayoutStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'SENT'
  | 'FAILED';

// ===== Quote Types =====

export interface RampQuote {
  appliedFee: number;
  baseRampFee: number;
  cryptoAmount: string;
  fiatCurrency: string;
  fiatValue: number;
  asset: RampAssetInfo;
  paymentMethodType?: RampPaymentMethod;
  assetExchangeRate?: number;
  assetExchangeRateEur?: number;
  fiatExchangeRateEur?: number;
  networkFee?: number;
}

export interface RampQuoteRequest {
  cryptoAssetSymbol: string;
  fiatCurrency: string;
  cryptoAmount?: string;
  fiatValue?: number;
  paymentMethodType?: RampPaymentMethod;
}

// ===== Error Types =====

export interface RampError {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, any>;
}

export type RampErrorCode =
  | 'INVALID_CONFIGURATION'
  | 'SDK_INITIALIZATION_FAILED'
  | 'WIDGET_CREATION_FAILED'
  | 'INVALID_ASSET'
  | 'INVALID_PAYMENT_METHOD'
  | 'INSUFFICIENT_AMOUNT'
  | 'AMOUNT_TOO_HIGH'
  | 'UNSUPPORTED_CURRENCY'
  | 'UNSUPPORTED_REGION'
  | 'KYC_REQUIRED'
  | 'PAYMENT_FAILED'
  | 'TRANSACTION_EXPIRED'
  | 'WEBHOOK_VERIFICATION_FAILED'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT_EXCEEDED';

// ===== Webhook Types =====

export type RampWebhookType =
  | 'PURCHASE_CREATED'
  | 'PURCHASE_UPDATED'
  | 'PURCHASE_COMPLETED'
  | 'PURCHASE_FAILED'
  | 'PURCHASE_EXPIRED'
  | 'SALE_CREATED'
  | 'SALE_UPDATED'
  | 'SALE_COMPLETED'
  | 'SALE_FAILED'
  | 'SALE_EXPIRED'
  | 'PAYMENT_STARTED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CRYPTO_SENT'
  | 'CRYPTO_RECEIVED'
  | 'FIAT_SENT'
  | 'FIAT_RECEIVED';

// ===== Response Types =====

export interface RampApiResponse<T = any> {
  data?: T;
  error?: RampError;
  success: boolean;
}

export interface RampServiceResult<T = any> {
  data: T | null;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}
