// Guardian Medex API Integration
// Core services for wallet management and policy engine integration

export { GuardianAuth } from './GuardianAuth';
export { GuardianApiClient } from './GuardianApiClient';
export { GuardianConfigService } from './GuardianConfig';
export { GuardianWalletService } from '@/services/guardian/GuardianWalletService';
export { GuardianKeyManager } from './GuardianKeyManager';
export { GuardianPollingService } from './GuardianPollingService';

// Re-export types for convenience
export type {
  GuardianConfig,
  GuardianWalletRequest,
  GuardianWalletResponse,
  GuardianTransactionRequest,
  GuardianTransactionResponse,
  GuardianPolicyRequest,
  GuardianApiError,
  GuardianWebhookPayload,
  GuardianWalletExtension,
  GuardianAuthHeaders,
  GuardianSignaturePayload,
} from '@/types/guardian/guardian';
