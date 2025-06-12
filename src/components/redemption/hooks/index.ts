// Hooks export for redemption module
// Centralizes all redemption-related hook exports

export { useRedemptions } from './useRedemptions';
export type { UseRedemptionsParams, UseRedemptionsReturn } from './useRedemptions';

export { useRedemptionStatus } from './useRedemptionStatus';
export type { UseRedemptionStatusParams, UseRedemptionStatusReturn } from './useRedemptionStatus';

export { useRedemptionApprovals } from './useRedemptionApprovals';
export type { UseRedemptionApprovalsParams, UseRedemptionApprovalsReturn } from './useRedemptionApprovals';

export { useGlobalRedemptions } from './useGlobalRedemptions';
export type { UseGlobalRedemptionsParams, UseGlobalRedemptionsReturn } from './useGlobalRedemptions';

// Re-export types for convenience
export type {
  RedemptionRequest,
  RedemptionStatus,
  ApprovalRequest,
  ApprovalStatus,
  SettlementStatus,
  CreateRedemptionRequestInput,
  BulkRedemptionData
} from '../types';
