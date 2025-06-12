// Core redemption types for the redemption module
// Following the existing database schema and domain-specific architecture

export interface RedemptionRequest {
  id: string;
  tokenAmount: number;
  tokenType: string;
  redemptionType: 'standard' | 'interval';
  status: RedemptionStatus;
  sourceWallet: string;
  destinationWallet: string;
  sourceWalletAddress: string; // Keep for backward compatibility
  destinationWalletAddress: string; // Keep for backward compatibility
  conversionRate: number;
  usdcAmount: number;
  investorName?: string;
  investorId?: string;
  requiredApprovals: number;
  isBulkRedemption?: boolean;
  investorCount?: number;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectionTimestamp?: Date;
  notes?: string;
  submittedAt: Date;
  validatedAt?: Date;
  approvedAt?: Date;
  executedAt?: Date;
  settledAt?: Date; // Add settledAt property - calculated from status
  createdAt: Date;
  updatedAt: Date;
}

export type RedemptionStatus = 
  | 'draft' 
  | 'pending' 
  | 'approved' 
  | 'processing' 
  | 'settled' 
  | 'rejected' 
  | 'cancelled';

export interface Distribution {
  id: string;
  tokenAllocationId: string;
  investorId: string;
  subscriptionId: string;
  projectId?: string;
  tokenType: string;
  tokenAmount: number;
  distributionDate: Date;
  distributionTxHash: string;
  walletId?: string;
  blockchain: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  toAddress: string;
  status: string;
  notes?: string;
  remainingAmount: number;
  fullyRedeemed: boolean;
  standard?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Enriched distribution with related investor, subscription, and token allocation data
export interface EnrichedDistribution extends Distribution {
  investor?: {
    investor_id: string;
    name: string;
    email: string;
    type: string;
    company?: string;
    wallet_address?: string;
    kyc_status: string;
    investor_status: string;
    investor_type: string;
    onboarding_completed: boolean;
    accreditation_status: string;
  };
  subscription?: {
    id: string;
    subscription_id: string;
    fiat_amount: number; // Changed from string to number to match database schema
    currency: string;
    confirmed: boolean;
    allocated: boolean;
    distributed: boolean;
    notes?: string;
    subscription_date: string;
  };
  tokenAllocation?: {
    id: string;
    token_type: string;
    token_amount: string;
    distributed: boolean;
    distribution_date?: string;
    distribution_tx_hash?: string;
    minted: boolean;
    minting_date?: string;
    minting_tx_hash?: string;
    standard?: string;
    symbol?: string;
    token_id?: string;
    notes?: string;
  };
}

export interface DistributionRedemption {
  id: string;
  distributionId: string;
  redemptionRequestId: string;
  amountRedeemed: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RedemptionApprover {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  // Database fields for persisted approvers
  redemptionId?: string;
  approverId?: string; // Maps to id for database operations
  approved?: boolean;
  approvedAt?: Date;
  status?: string;
  comments?: string;
  decisionDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RedemptionRule {
  id: string;
  ruleId?: string;
  tokenType?: string;
  redemptionType: 'standard' | 'interval';
  allowRedemption?: boolean;
  requireMultiSigApproval?: boolean;
  requiredApprovers?: number;
  totalApprovers?: number;
  notifyInvestors?: boolean;
  settlementMethod?: string;
  immediateExecution?: boolean;
  useLatestNav?: boolean;
  allowAnyTimeRedemption?: boolean;
  repurchaseFrequency?: string;
  lockUpPeriod?: number;
  submissionWindowDays?: number;
  lockTokensOnRequest?: boolean;
  useWindowNav?: boolean;
  enableProRataDistribution?: boolean;
  queueUnprocessedRequests?: boolean;
  enableAdminOverride?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Utility types for type safety
export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  lockupExpiry?: Date;
  windowInfo?: RedemptionWindowInfo;
  restrictions?: string[];
}

export interface RedemptionWindowInfo {
  isOpen: boolean;
  openDate?: Date;
  closeDate?: Date;
  nextWindow?: Date;
  currentWindow?: Date;
  reason?: string;
}

export interface ValidationResult {
  approved: boolean;
  reason?: string;
  queuePosition?: number;
}

export interface SettlementResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  settlement?: SettlementDetails;
}

export interface SettlementDetails {
  tokensBurned: number;
  usdcAmount: number;
  feeAmount?: number;
  settlementDate: Date;
  blockchain: string;
}

// Enhanced types for interval fund redemptions
export interface IntervalFundConfig {
  repurchaseFrequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
  lockUpPeriod: number;
  submissionWindowDays: number;
  lockTokensOnRequest: boolean;
  useWindowNav: boolean;
  enableProRataDistribution: boolean;
  queueUnprocessedRequests: boolean;
  enableAdminOverride: boolean;
}

// Enhanced types for standard redemptions
export interface StandardRedemptionConfig {
  immediateExecution: boolean;
  useLatestNav: boolean;
  allowAnyTimeRedemption: boolean;
}

// Multi-signature approval types
export interface MultiSigApproval {
  requiredApprovals: number;
  totalApprovers: number;
  approvers: RedemptionApprover[];
  currentApprovals: number;
  isComplete: boolean;
}

// Bulk redemption types
export interface BulkRedemptionData {
  investors: BulkInvestorData[];
  totalAmount: number;
  tokenType: string;
  redemptionType: 'standard' | 'interval';
  conversionRate: number;
}

export interface BulkInvestorData {
  investorId: string;
  investorName: string;
  tokenAmount: number;
  walletAddress: string;
  distributionId?: string;
  sourceWallet?: string;
  destinationWallet?: string;
  usdcAmount?: number;
}

// API request/response types
export interface CreateRedemptionRequestInput {
  distributionId?: string; // Distribution ID to auto-populate investor details
  tokenAmount: number;
  tokenType: string;
  redemptionType: 'standard' | 'interval';
  sourceWallet: string;
  destinationWallet: string;
  sourceWalletAddress: string; // Keep for backward compatibility
  destinationWalletAddress: string; // Keep for backward compatibility
  conversionRate: number;
  usdcAmount: number;
  investorName?: string; // Auto-populated from distribution if not provided
  investorId?: string; // Auto-populated from distribution if not provided
  notes?: string;
}

export interface RedemptionRequestResponse {
  success: boolean;
  data?: RedemptionRequest;
  error?: string;
}

export interface RedemptionListResponse {
  success: boolean;
  data?: RedemptionRequest[];
  redemptions?: RedemptionRequest[]; // Alias for data for backward compatibility
  totalCount?: number;
  hasMore?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// Response type for enriched distributions
export interface EnrichedDistributionResponse {
  success: boolean;
  data?: EnrichedDistribution[];
  error?: string;
}
