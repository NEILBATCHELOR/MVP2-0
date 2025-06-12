// Export all wallet services for easy importing
export { TransferService, transferService } from './TransferService';
export { SwapService, swapService } from './SwapService';
export { RipplePaymentsService, ripplePaymentsService } from './RipplePaymentsService';
export { MoonpayService, moonpayService } from './MoonpayService';

// Export existing services
export { default as MultiSigWalletService } from './MultiSigWalletService';
export { default as TransactionMonitorService } from './TransactionMonitorService';
export * from './walletService';

// Export types
export type {
  TransferParams,
  TransferResult,
  TransferEstimate,
  TransferHistory
} from './TransferService';

export type {
  RipplePaymentParams,
  RipplePaymentResult,
  RippleQuote,
  RippleAccountInfo,
  RipplePaymentHistory
} from './RipplePaymentsService';

export type {
  MoonpayTransaction,
  MoonpayCurrency,
  MoonpayQuote,
  MoonpayLimits,
  MoonpayCustomer,
  MoonpayPaymentMethod
} from './MoonpayService';
