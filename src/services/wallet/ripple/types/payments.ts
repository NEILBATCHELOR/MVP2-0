/**
 * Payment types for Ripple Payments Direct API v4
 * Covers quotes, payments, ODL, and cross-border transfers
 */

// Core Payment Types
export interface RipplePaymentV4 {
  id: string;
  status: PaymentStatus;
  sourceAmount: MoneyAmount;
  destinationAmount: MoneyAmount;
  exchangeRate?: string;
  fee?: MoneyAmount;
  quoteId?: string;
  originatorIdentityId?: string;
  beneficiaryIdentityId?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  paymentType: PaymentType;
}

export type PaymentStatus = 
  | 'created'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

export type PaymentType = 
  | 'direct'
  | 'odl'
  | 'cross_border'
  | 'stablecoin'
  | 'domestic';

export interface MoneyAmount {
  value: string;
  currency: string;
  precision?: number;
}

// Quote Types
export interface RippleQuoteV4 {
  id: string;
  sourceAmount: MoneyAmount;
  destinationAmount: MoneyAmount;
  exchangeRate: string;
  fee: MoneyAmount;
  expiresAt: string;
  paymentPath?: string[];
  slippage?: string;
  estimatedSettlementTime?: string;
  createdAt: string;
}

export interface QuoteRequest {
  sourceAmount: MoneyAmount;
  destinationCurrency: string;
  sourceCountry?: string;
  destinationCountry?: string;
  paymentMethod?: PaymentMethod;
  originatorIdentityId?: string;
  beneficiaryIdentityId?: string;
}

export interface QuoteCollection {
  quotes: RippleQuoteV4[];
  requestId: string;
  createdAt: string;
  expiresAt: string;
}

// Payment Creation Types
export interface CreatePaymentRequest {
  quoteId: string;
  originatorIdentityId: string;
  beneficiaryIdentityId: string;
  sourceAmount: MoneyAmount;
  destinationAmount: MoneyAmount;
  memo?: string;
  clientReference?: string;
  executionCondition?: string;
  paymentMethod?: PaymentMethod;
}

export interface CreateOrchestrationPaymentRequest {
  sourceAmount: MoneyAmount;
  destinationCurrency: string;
  originatorIdentity: IdentityDetails;
  beneficiaryIdentity: IdentityDetails;
  memo?: string;
  clientReference?: string;
  sourceCountry?: string;
  destinationCountry?: string;
  paymentMethod?: PaymentMethod;
}

// Identity Types for Payments
export interface IdentityDetails {
  id?: string;
  type: 'individual' | 'business';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  address: Address;
  dateOfBirth?: string;
  nationalId?: string;
  email?: string;
  phone?: string;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// Payment Method Types
export type PaymentMethod = 
  | 'bank_transfer'
  | 'card'
  | 'wallet'
  | 'crypto'
  | 'xrp_ledger'
  | 'swift';

// ODL (On-Demand Liquidity) Types
export interface ODLPayment extends RipplePaymentV4 {
  liquidityProvider: string;
  bridgeAsset: string;
  sourceExchangeRate: string;
  destinationExchangeRate: string;
  totalFee: MoneyAmount;
  liquidityFee: MoneyAmount;
  bridgeFee: MoneyAmount;
}

export interface ODLQuote extends RippleQuoteV4 {
  liquidityProvider: string;
  bridgeAsset: string;
  liquidityDepth: string;
  priceImpact: string;
}

// Cross-Border Payment Types
export interface CrossBorderPayment extends RipplePaymentV4 {
  corridor: PaymentCorridor;
  complianceChecks: ComplianceCheck[];
  settlementNetwork: string;
  correspondentBank?: string;
}

export interface PaymentCorridor {
  sourceCountry: string;
  destinationCountry: string;
  sourceCurrency: string;
  destinationCurrency: string;
  minAmount: MoneyAmount;
  maxAmount: MoneyAmount;
  averageSettlementTime: string;
  isActive: boolean;
}

export interface ComplianceCheck {
  type: 'kyc' | 'aml' | 'sanctions' | 'pep';
  status: 'passed' | 'failed' | 'pending' | 'manual_review';
  checkedAt: string;
  details?: string;
}

// Payment Notifications and Webhooks
export interface PaymentNotification {
  id: string;
  paymentId: string;
  status: PaymentStatus;
  eventType: PaymentEventType;
  timestamp: string;
  data: Record<string, any>;
}

export type PaymentEventType = 
  | 'payment_created'
  | 'payment_updated'
  | 'payment_completed'
  | 'payment_failed'
  | 'payment_cancelled'
  | 'quote_expired'
  | 'compliance_check_completed';

// Error Types
export interface PaymentError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

// API Response Types
export interface PaymentListResponse {
  payments: RipplePaymentV4[];
  totalCount: number;
  page: number;
  size: number;
  hasMore: boolean;
}

export interface PaymentResponse {
  payment: RipplePaymentV4;
  status: 'success' | 'error';
  error?: PaymentError;
}

// Search and Filter Types
export interface PaymentFilters {
  status?: PaymentStatus[];
  paymentType?: PaymentType[];
  currency?: string[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
  originatorId?: string;
  beneficiaryId?: string;
}

export interface PaymentSearchParams extends PaymentFilters {
  page?: number;
  size?: number;
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}
