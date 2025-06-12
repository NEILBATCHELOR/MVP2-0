/**
 * DFNS Components - Complete DFNS integration UI components
 * 
 * This file provides a single entry point for importing all DFNS React components
 * throughout the application, including core wallet functionality and advanced services.
 */

// ===== Core Component Exports =====
export { DfnsActivityLog } from './DfnsActivityLog';
export { default as DfnsPolicyManagement } from './DfnsPolicyManagement';
export { default as DfnsTransferDialog } from './DfnsTransferDialog';
export { default as DfnsWalletCreation } from './DfnsWalletCreation';
export { default as DfnsWalletDashboard } from './DfnsWalletDashboard';
export { default as DfnsWalletList } from './DfnsWalletList';

// ===== Enhanced Component Exports =====
export { DfnsAuthentication } from './DfnsAuthentication';
export { default as DfnsDelegatedAuthentication } from './DfnsDelegatedAuthentication';
export { default as DfnsWebhookManagement } from './DfnsWebhookManagement';

// ===== Advanced Service Component Exports =====
export { default as DfnsExchangeManagement } from './DfnsExchangeManagement';
export { default as DfnsStakingManagement } from './DfnsStakingManagement';
export { default as DfnsAmlKytCompliance } from './DfnsAmlKytCompliance';
export { default as DfnsFiatIntegration } from './DfnsFiatIntegration';

// ===== Type-only Re-exports =====
export type { DfnsActivityLogProps } from './DfnsActivityLog';
export type { DfnsPolicyManagementProps } from './DfnsPolicyManagement';
export type { DfnsTransferDialogProps } from './DfnsTransferDialog';
export type { DfnsWalletCreationProps } from './DfnsWalletCreation';
export type { DfnsWalletDashboardProps } from './DfnsWalletDashboard';
export type { DfnsWalletListProps } from './DfnsWalletList';

// ===== Enhanced Component Types =====
export type { 
  DfnsAuthenticationProps
} from './DfnsAuthentication';
export type {
  DfnsDelegatedAuthProps
} from './DfnsDelegatedAuthentication';

// ===== Advanced Service Component Types =====
export type {
  DfnsFiatIntegrationProps
} from './DfnsFiatIntegration';

// ===== Enhanced RAMP Network Types =====
export type {
  FiatProvider,
  FiatTransactionResponse,
  FiatOnRampRequest,
  FiatOffRampRequest,
  SupportedCurrency,
  PaymentMethod,
  BankAccountInfo,
  FiatQuoteRequest,
  FiatQuoteResponse,
  RampAssetInfo,
  RampPurchase,
  RampSale,
  RampQuote,
  RampPaymentMethod,
  RampNetworkEnhancedConfig,
  RampNetworkEnhancedConfig as RampInstantSDKConfig,
  RampEventPayload,
  RampSendCryptoRequest
} from '@/types/dfns/fiat';

// Note: Component props are defined inline in their respective files
// but can be accessed as the default export's props type
// Enhanced RAMP Network integration provides full API v3 support with SDK, webhooks, and native flow
