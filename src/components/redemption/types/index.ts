// Main types export for redemption module
// Centralizes all redemption-related type definitions

// Core redemption types
export type {
  RedemptionRequest,
  Distribution,
  EnrichedDistribution,
  DistributionRedemption,
  RedemptionApprover,
  RedemptionRule,
  EligibilityResult,
  RedemptionWindowInfo,
  ValidationResult,
  SettlementResult,
  SettlementDetails,
  IntervalFundConfig,
  StandardRedemptionConfig,
  MultiSigApproval,
  BulkRedemptionData,
  BulkInvestorData,
  CreateRedemptionRequestInput,
  RedemptionRequestResponse,
  RedemptionListResponse,
  EnrichedDistributionResponse
} from './redemption';

// Export service-specific types
export type { GlobalCreateRedemptionRequestInput } from '../services/globalRedemptionService';

// Approval workflow types
export type {
  ApprovalRequest,
  ApprovalRecord,
  ApprovalWorkflowConfig,
  AutoApprovalRule,
  ApprovalCondition,
  EscalationRule,
  TimeoutRule,
  MultiSigConfig,
  MultiSigSigner,
  ApprovalChain,
  ApprovalStep,
  ApprovalDelegation,
  DelegationScope,
  ProxyApproval,
  ApprovalQueueItem,
  ApproverDashboardMetrics,
  ApprovalAction,
  ApprovalAuditLog,
  ComplianceCheck,
  SubmitApprovalInput,
  ApprovalResponse,
  ApprovalQueueResponse,
  ApprovalInfo
} from './approvals';

// Settlement process types
export type {
  SettlementRequest,
  SettlementPriority,
  TokenBurnOperation,
  FundTransferOperation,
  TransferMethod,
  SettlementConfirmation,
  SettlementQueue,
  SettlementBatch,
  BatchStatus,
  SettlementMetrics,
  SettlementHealthCheck,
  HealthIssue,
  GasOptimization,
  FeeStructure,
  SettlementError,
  ErrorType,
  RecoveryAction,
  RecoveryActionType,
  SettlementAuditLog,
  CapTableUpdate,
  InitiateSettlementInput,
  SettlementResponse,
  SettlementStatusResponse,
  SettlementListResponse,
  SettlementUpdate,
  SettlementUpdateType,
  SettlementConfig,
  SettlementInfo
} from './settlement';

// Type aliases imported for type guards - using import type as they're only used for interface shapes

// Export status enums as string literal unions (not as types to avoid conflicts)
export const RedemptionStatus = {
  DRAFT: 'draft' as const,
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  PROCESSING: 'processing' as const,
  SETTLED: 'settled' as const,
  REJECTED: 'rejected' as const,
  CANCELLED: 'cancelled' as const
} as const;

export const ApprovalStatus = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
  EXPIRED: 'expired' as const
} as const;

export const SettlementStatus = {
  PENDING: 'pending' as const,
  SCHEDULED: 'scheduled' as const,
  INITIATED: 'initiated' as const,
  TOKEN_BURNING: 'token_burning' as const,
  FUND_TRANSFER: 'fund_transfer' as const,
  CONFIRMING: 'confirming' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  CANCELLED: 'cancelled' as const,
  REQUIRES_INTERVENTION: 'requires_intervention' as const,
  RETRYING: 'retrying' as const
} as const;

export const BurnStatus = {
  PENDING: 'pending' as const,
  INITIATED: 'initiated' as const,
  CONFIRMING: 'confirming' as const,
  CONFIRMED: 'confirmed' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  EXPIRED: 'expired' as const
} as const;

export const TransferStatus = {
  PENDING: 'pending' as const,
  INITIATED: 'initiated' as const,
  CONFIRMING: 'confirming' as const,
  CONFIRMED: 'confirmed' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  EXPIRED: 'expired' as const
} as const;

export const ApprovalDecision = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const
} as const;

// Type aliases for the enum values
export type RedemptionStatusType = typeof RedemptionStatus[keyof typeof RedemptionStatus];
export type ApprovalStatusType = typeof ApprovalStatus[keyof typeof ApprovalStatus];
export type SettlementStatusType = typeof SettlementStatus[keyof typeof SettlementStatus];
export type BurnStatusType = typeof BurnStatus[keyof typeof BurnStatus];
export type TransferStatusType = typeof TransferStatus[keyof typeof TransferStatus];
export type ApprovalDecisionType = typeof ApprovalDecision[keyof typeof ApprovalDecision];

// Utility type guards for runtime type checking
export const isRedemptionStatus = (status: string): status is RedemptionStatusType => {
  return Object.values(RedemptionStatus).includes(status as RedemptionStatusType);
};

export const isApprovalStatus = (status: string): status is ApprovalStatusType => {
  return Object.values(ApprovalStatus).includes(status as ApprovalStatusType);
};

export const isSettlementStatus = (status: string): status is SettlementStatusType => {
  return Object.values(SettlementStatus).includes(status as SettlementStatusType);
};

export const isBurnStatus = (status: string): status is BurnStatusType => {
  return Object.values(BurnStatus).includes(status as BurnStatusType);
};

export const isTransferStatus = (status: string): status is TransferStatusType => {
  return Object.values(TransferStatus).includes(status as TransferStatusType);
};

export const isApprovalDecision = (decision: string): decision is ApprovalDecisionType => {
  return Object.values(ApprovalDecision).includes(decision as ApprovalDecisionType);
};

export const isRedemptionType = (type: string): type is 'standard' | 'interval' => {
  return ['standard', 'interval'].includes(type);
};

// Type predicate functions for better type safety
export const isRedemptionRequest = (obj: any): obj is RedemptionRequestType => {
  return obj && typeof obj === 'object' && 
         typeof obj.id === 'string' &&
         typeof obj.tokenAmount === 'number' &&
         typeof obj.tokenType === 'string' &&
         isRedemptionStatus(obj.status) &&
         isRedemptionType(obj.redemptionType);
};

export const isApprovalRequest = (obj: any): obj is ApprovalRequestType => {
  return obj && typeof obj === 'object' &&
         typeof obj.id === 'string' &&
         typeof obj.redemptionRequestId === 'string' &&
         typeof obj.requiredApprovals === 'number' &&
         isApprovalStatus(obj.status);
};

export const isSettlementRequest = (obj: any): obj is SettlementRequestType => {
  return obj && typeof obj === 'object' &&
         typeof obj.id === 'string' &&
         typeof obj.redemptionRequestId === 'string' &&
         typeof obj.tokenAmount === 'number' &&
         isSettlementStatus(obj.status);
};

// Type aliases for type guards to avoid circular dependency issues
export type RedemptionRequestType = {
  id: string;
  tokenAmount: number;
  tokenType: string;
  redemptionType: 'standard' | 'interval';
  status: RedemptionStatusType;
  sourceWallet: string;
  destinationWallet: string;
  conversionRate: number;
  usdcAmount: number;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ApprovalRequestType = {
  id: string;
  redemptionRequestId: string;
  requiredApprovals: number;
  currentApprovals: number;
  status: ApprovalStatusType;
  createdAt: Date;
  updatedAt: Date;
};

export type SettlementRequestType = {
  id: string;
  redemptionRequestId: string;
  tokenAmount: number;
  usdcAmount: number;
  conversionRate: number;
  sourceWallet: string;
  destinationWallet: string;
  status: SettlementStatusType;
  blockchain: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
};

// Constants for better IntelliSense support
export const REDEMPTION_TYPES = {
  STANDARD: 'standard' as const,
  INTERVAL: 'interval' as const
} as const;

export const SETTLEMENT_PRIORITIES = {
  LOW: 'low' as const,
  NORMAL: 'normal' as const,
  HIGH: 'high' as const,
  URGENT: 'urgent' as const
} as const;

export const TRANSFER_METHODS = {
  BLOCKCHAIN: 'blockchain' as const,
  STABLECOIN: 'stablecoin' as const,
  BANK_TRANSFER: 'bank_transfer' as const,
  WIRE_TRANSFER: 'wire_transfer' as const,
  ACH: 'ach' as const,
  INSTANT: 'instant' as const
} as const;
