/**
 * DFNS Fiat Integration Types
 * 
 * Type definitions for fiat on/off-ramp operations with providers
 * like Ramp Network and Mt Pelerin through DFNS infrastructure.
 */

import type { 
  RampVariant, 
  RampPaymentMethod as CoreRampPaymentMethod 
} from '../ramp/core';

// ===== Core Fiat Types =====

export type FiatProvider = 'ramp_network' | 'mt_pelerin';

export type FiatTransactionType = 'onramp' | 'offramp';

export type FiatTransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'waiting_for_payment'
  | 'payment_received'
  | 'completed' 
  | 'failed' 
  | 'cancelled'
  | 'expired';

export type PaymentMethodType = 'instant' | 'standard' | 'delayed';

// ===== Configuration Types =====

export interface FiatConfiguration {
  defaultProvider: FiatProvider;
  enabledProviders: FiatProvider[];
  supportedCurrencies: string[];
  defaultCurrency: string;
  minimumAmounts: {
    onramp: Record<string, number>;
    offramp: Record<string, number>;
  };
  maximumAmounts: {
    onramp: Record<string, number>;
    offramp: Record<string, number>;
  };
  rampNetwork: RampNetworkEnhancedConfig;
  mtPelerin: MtPelerinConfig;
}

export interface RampNetworkConfig {
  apiKey: string;
  hostAppName: string;
  hostLogoUrl: string;
  enabledFlows: ('ONRAMP' | 'OFFRAMP')[];
  webhookSecret?: string;
  environment?: 'staging' | 'production';
}

// Enhanced RAMP Network types for full API integration
export interface RampNetworkEnhancedConfig extends RampNetworkConfig {
  // SDK Configuration
  defaultVariant?: RampVariant;
  customCss?: string;
  containerElementId?: string;
  
  // Advanced Features
  enableNativeFlow?: boolean;
  enableQuotes?: boolean;
  enableWebhooks?: boolean;
  enableEventTracking?: boolean;
  
  // Payment Method Preferences
  preferredPaymentMethods?: RampPaymentMethod[];
  excludePaymentMethods?: RampPaymentMethod[];
  
  // Asset Configuration
  supportedAssets?: string[];
  excludeAssets?: string[];
  
  // Regional Settings
  supportedCountries?: string[];
  excludeCountries?: string[];
  
  // Custom Branding
  primaryColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export type RampPaymentMethod = CoreRampPaymentMethod;

export interface RampAssetInfo {
  symbol: string;
  chain: string;
  name: string;
  decimals: number;
  type: 'NATIVE' | 'ERC20' | 'BEP20' | 'SPL';
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
  };
}

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

export interface RampQuote {
  asset: RampAssetInfo;
  quotes: Record<string, {
    appliedFee: number;
    baseRampFee: number;
    cryptoAmount: string;
    fiatCurrency: string;
    fiatValue: number;
  }>;
}

export interface RampEventPayload {
  type: 'WIDGET_CLOSE' | 'WIDGET_CONFIG_DONE' | 'WIDGET_CONFIG_FAILED' | 'PURCHASE_CREATED' | 'OFFRAMP_SALE_CREATED' | 'SEND_CRYPTO_REQUEST';
  payload: any;
  widgetInstanceId?: string;
}

export interface RampSendCryptoRequest {
  cryptoAmount: string;
  cryptoAddress: string;
  assetInfo: RampAssetInfo;
}

// Enhanced webhook types
export interface RampWebhookEvent {
  id: string;
  type: 'CREATED' | 'RELEASED' | 'EXPIRED' | 'CANCELLED';
  mode: 'ONRAMP' | 'OFFRAMP';
  payload: RampPurchase | RampSale;
  timestamp: string;
}

export interface RampWebhookSignature {
  algorithm: 'ECDSA';
  signature: string;
  publicKey: string;
}

export interface MtPelerinConfig {
  apiKey: string;
  environment: 'staging' | 'production';
  webhookSecret?: string;
}

// ===== Currency and Payment Method Types =====

export interface SupportedCurrency {
  code: string;
  name: string;
  decimals: number;
  symbol?: string;
  minimumAmount?: number;
  maximumAmount?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  processingTime?: string;
  fees?: {
    fixed?: number;
    percentage?: number;
    currency?: string;
  };
  limits?: {
    min?: number;
    max?: number;
    daily?: number;
    monthly?: number;
  };
}

// ===== Request Types =====

export interface FiatOnRampRequest {
  amount: string;
  currency: string;
  cryptoAsset: string;
  walletAddress: string;
  paymentMethod?: string;
  provider?: FiatProvider;
  userEmail?: string;
  userPhone?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
}

export interface FiatOffRampRequest {
  amount: string;
  currency: string;
  cryptoAsset: string;
  walletAddress: string;
  bankAccount: BankAccountInfo;
  paymentMethod?: string;
  provider?: FiatProvider;
  userEmail?: string;
  userPhone?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
}

export interface BankAccountInfo {
  accountNumber: string;
  routingNumber?: string;
  iban?: string;
  bic?: string;
  accountHolderName: string;
  bankName: string;
  bankAddress?: string;
  country: string;
  currency: string;
}

// ===== Response Types =====

export interface FiatTransactionResponse {
  id: string;
  provider: FiatProvider;
  type: FiatTransactionType;
  status: FiatTransactionStatus;
  amount: string;
  currency: string;
  cryptoAsset: string;
  walletAddress: string;
  paymentMethod?: string;
  bankAccount?: BankAccountInfo;
  providerTransactionId: string;
  paymentUrl?: string;
  withdrawalAddress?: string;
  txHash?: string;
  exchangeRate?: {
    rate: number;
    timestamp: string;
    provider: string;
  };
  fees?: {
    providerFee: number;
    networkFee?: number;
    totalFee: number;
    currency: string;
  };
  estimatedCompletionTime?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface FiatQuoteRequest {
  amount: string;
  fromCurrency: string;
  toCurrency: string;
  type: FiatTransactionType;
  paymentMethod?: string;
  provider?: FiatProvider;
}

export interface FiatQuoteResponse {
  id: string;
  provider: FiatProvider;
  type: FiatTransactionType;
  fromAmount: string;
  fromCurrency: string;
  toAmount: string;
  toCurrency: string;
  exchangeRate: number;
  fees: {
    providerFee: number;
    networkFee?: number;
    totalFee: number;
    currency: string;
  };
  paymentMethod: string;
  estimatedProcessingTime: string;
  expiresAt: string;
  createdAt: string;
}

// ===== Provider-Specific Types =====

export interface RampNetworkTransaction extends RampPurchase {
  // Extends RampPurchase with additional fields for backward compatibility
  type?: 'ONRAMP' | 'OFFRAMP';
  cryptoAssetSymbol?: string;
  userAddress?: string;
  escrowDetailsHash?: string;
}

export interface MtPelerinTransaction {
  id: string;
  type: 'buy' | 'sell';
  status: string;
  currency: string;
  amount: number;
  asset: string;
  quantity?: string;
  address: string;
  fees: {
    our: number;
    partner: number;
    network: number;
  };
  createdAt: string;
  updatedAt: string;
  txid?: string;
}

// ===== Webhook Types =====

export interface FiatWebhookEvent {
  id: string;
  type: string;
  provider: FiatProvider;
  transactionId: string;
  status: FiatTransactionStatus;
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}

export interface RampNetworkWebhook extends RampWebhookEvent {
  // Extends RampWebhookEvent for backward compatibility
  purchase?: RampPurchase;
  sale?: RampSale;
}

export interface MtPelerinWebhook {
  event: 'transaction.created' | 'transaction.completed' | 'transaction.failed';
  data: MtPelerinTransaction;
}

// ===== Database Types =====

export interface FiatTransactionInsert {
  id?: string;
  provider: FiatProvider;
  provider_transaction_id: string;
  type: FiatTransactionType;
  status: FiatTransactionStatus;
  amount: string;
  currency: string;
  crypto_asset: string;
  wallet_address: string;
  wallet_id?: string;
  payment_method?: string;
  bank_account?: Record<string, any>;
  payment_url?: string;
  withdrawal_address?: string;
  tx_hash?: string;
  exchange_rate?: Record<string, any>;
  fees?: Record<string, any>;
  estimated_completion_time?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  user_id?: string;
  project_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FiatTransactionTable extends Required<FiatTransactionInsert> {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface FiatQuoteInsert {
  id?: string;
  provider: FiatProvider;
  type: FiatTransactionType;
  from_amount: string;
  from_currency: string;
  to_amount: string;
  to_currency: string;
  exchange_rate: number;
  fees: Record<string, any>;
  payment_method: string;
  estimated_processing_time: string;
  expires_at: string;
  created_at?: string;
}

export interface FiatQuoteTable extends Required<FiatQuoteInsert> {
  id: string;
  created_at: string;
}

export interface FiatProviderConfigInsert {
  provider: FiatProvider;
  configuration: Record<string, any>;
  is_enabled: boolean;
  supported_currencies: string[];
  supported_payment_methods: string[];
  created_at?: string;
  updated_at?: string;
}

export interface FiatProviderConfigTable extends Required<FiatProviderConfigInsert> {
  id: string;
  created_at: string;
  updated_at: string;
}

// ===== Service Result Types =====

export interface FiatServiceResult<T> {
  data: T | null;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface FiatTransactionListResult {
  transactions: FiatTransactionResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FiatProviderCapabilities {
  provider: FiatProvider;
  name: string;
  type: 'onramp' | 'offramp' | 'both';
  supportedCurrencies: SupportedCurrency[];
  supportedPaymentMethods: PaymentMethod[];
  supportedCryptoAssets: string[];
  limits: {
    onramp?: {
      min: Record<string, number>;
      max: Record<string, number>;
    };
    offramp?: {
      min: Record<string, number>;
      max: Record<string, number>;
    };
  };
  fees: {
    onramp?: Record<string, number>;
    offramp?: Record<string, number>;
  };
  processingTimes: {
    onramp?: string;
    offramp?: string;
  };
  kyc: {
    required: boolean;
    levels: string[];
  };
  coverage: {
    countries: string[];
    regions: string[];
  };
}

// ===== Filter and Query Types =====

export interface FiatTransactionFilters {
  provider?: FiatProvider;
  type?: FiatTransactionType;
  status?: FiatTransactionStatus;
  currency?: string;
  cryptoAsset?: string;
  walletId?: string;
  userId?: string;
  projectId?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface FiatTransactionQuery extends FiatTransactionFilters {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

// ===== Error Types =====

export interface FiatError {
  code: string;
  message: string;
  provider?: FiatProvider;
  details?: Record<string, any>;
}

export type FiatErrorCode = 
  | 'INVALID_REQUEST'
  | 'PROVIDER_ERROR'
  | 'INSUFFICIENT_FUNDS'
  | 'PAYMENT_FAILED'
  | 'KYC_REQUIRED'
  | 'UNSUPPORTED_CURRENCY'
  | 'UNSUPPORTED_PAYMENT_METHOD'
  | 'AMOUNT_TOO_LOW'
  | 'AMOUNT_TOO_HIGH'
  | 'TRANSACTION_EXPIRED'
  | 'WALLET_ADDRESS_INVALID'
  | 'BANK_ACCOUNT_INVALID'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVICE_UNAVAILABLE'
  | 'CONFIGURATION_ERROR';

// ===== Utility Types =====

export interface FiatExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
  provider: string;
  ttl: number;
}

export interface FiatLimits {
  currency: string;
  daily: {
    min: number;
    max: number;
  };
  monthly: {
    min: number;
    max: number;
  };
  transaction: {
    min: number;
    max: number;
  };
}

export interface FiatFeeTier {
  name: string;
  volume: {
    min: number;
    max?: number;
  };
  fees: {
    onramp: number;
    offramp: number;
  };
  currency: string;
}

// ===== Analytics Types =====

export interface FiatAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  transactions: {
    total: number;
    onramp: number;
    offramp: number;
  };
  volume: {
    total: number;
    onramp: number;
    offramp: number;
    currency: string;
  };
  averageTransaction: {
    amount: number;
    currency: string;
  };
  topCurrencies: Array<{
    currency: string;
    volume: number;
    transactions: number;
  }>;
  topProviders: Array<{
    provider: FiatProvider;
    volume: number;
    transactions: number;
  }>;
  conversionRates: {
    onramp: number;
    offramp: number;
  };
  fees: {
    total: number;
    currency: string;
  };
}
