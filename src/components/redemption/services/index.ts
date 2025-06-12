// Services export for redemption module
// Centralizes all redemption-related service exports

// Core redemption service
export { RedemptionService, redemptionService } from './redemptionService';

// Eligibility validation service
export { EligibilityService, eligibilityService } from './eligibilityService';
export type { EligibilityCheckParams } from './eligibilityService';

// Approval workflow service
export { ApprovalService, approvalService } from './approvalService';

// Settlement processing service
export { SettlementService, settlementService } from './settlementService';

// Re-export types for convenience
export type {
  RedemptionRequest,
  RedemptionStatus,
  CreateRedemptionRequestInput,
  RedemptionRequestResponse,
  RedemptionListResponse,
  EligibilityResult,
  ApprovalRequest,
  ApprovalDecision,
  ApprovalResponse,
  SettlementRequest,
  SettlementResponse,
  SettlementStatusResponse
} from '../types';
