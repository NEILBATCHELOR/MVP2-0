// Settlement process types for redemption module
// Handles token burning, fund transfers, and settlement completion

export interface SettlementRequest {
  id: string;
  settlementId?: string;
  cancellationId?: string;
  redemptionRequestId: string;
  tokenAmount: number;
  usdcAmount: number;
  conversionRate: number;
  sourceWallet: string;
  destinationWallet: string;
  status: SettlementStatus;
  blockchain: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  estimatedGasFee?: number;
  actualGasFee?: number;
  priority: SettlementPriority;
  retryCount: number;
  maxRetries: number;
  scheduledAt?: Date;
  initiatedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type SettlementStatus =
  | 'pending'
  | 'scheduled'
  | 'initiated'
  | 'token_burning'
  | 'fund_transfer'
  | 'confirming'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'requires_intervention'
  | 'retrying';

export type SettlementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TokenBurnOperation {
  id: string;
  settlementRequestId: string;
  tokenAmount: number;
  tokenAddress: string;
  burnTxHash?: string;
  transactionHash?: string;
  burnBlockNumber?: number;
  gasUsed?: number;
  burnGasUsed?: number;
  burnGasPrice?: number;
  gasFee?: number;
  status: BurnStatus;
  initiatedAt?: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  timestamp?: Date;
  tokensBurned?: number;
  confirmations?: number;
  errorMessage?: string;
  retryCount: number;
}

export type BurnStatus =
  | 'pending'
  | 'initiated'
  | 'confirming'
  | 'confirmed'
  | 'completed'
  | 'failed'
  | 'expired';

export interface FundTransferOperation {
  id: string;
  settlementRequestId: string;
  amount: number;
  currency: string;
  fromAddress: string;
  toAddress: string;
  transferTxHash?: string;
  transferBlockNumber?: number;
  transferGasUsed?: number;
  transferGasPrice?: number;
  networkFee?: number;
  status: TransferStatus;
  method?: string;
  transferMethod: TransferMethod;
  initiatedAt?: Date;
  confirmedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  transferId?: string;
  estimatedCompletion?: Date;
  reference?: string;
  timestamp?: Date;
}

export type TransferStatus =
  | 'pending'
  | 'initiated'
  | 'confirming'
  | 'confirmed'
  | 'completed'
  | 'failed'
  | 'expired';

export type TransferMethod =
  | 'blockchain'
  | 'stablecoin'
  | 'bank_transfer'
  | 'wire_transfer'
  | 'ach'
  | 'instant';

export interface SettlementConfirmation {
  id: string;
  settlementRequestId: string;
  confirmationId?: string;
  status?: string;
  tokenBurnConfirmed: boolean;
  fundTransferConfirmed: boolean;
  finalBalance: number;
  capTableUpdated: boolean;
  distributionUpdated: boolean;
  confirmationTxHash?: string;
  confirmationBlockNumber?: number;
  confirmedAt: Date;
  auditor?: string;
  auditNotes?: string;
  timestamp?: Date;
  finalStatus?: string;
  complianceChecked?: boolean;
}

// Settlement queue and batch processing
export interface SettlementQueue {
  id: string;
  name: string;
  description?: string;
  priority: SettlementPriority;
  batchSize: number;
  processingIntervalMs: number;
  isActive: boolean;
  lastProcessedAt?: Date;
  totalProcessed: number;
  totalFailed: number;
  currentBatchId?: string;
}

export interface SettlementBatch {
  id: string;
  queueId: string;
  settlements: string[]; // settlement request IDs
  batchSize: number;
  totalAmount: number;
  totalGasFee: number;
  status: BatchStatus;
  initiatedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  successCount: number;
  failureCount: number;
  retryCount: number;
}

export type BatchStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'partially_failed'
  | 'failed'
  | 'cancelled';

// Settlement monitoring and metrics
export interface SettlementMetrics {
  totalSettlements: number;
  pendingSettlements: number;
  completedSettlements: number;
  failedSettlements: number;
  avgSettlementTime: number; // in minutes
  avgGasFee: number;
  totalVolumeSettled: number;
  successRate: number; // percentage
  currentQueueDepth: number;
  estimatedProcessingTime: number; // in minutes
  averageProcessingTime: number;
  pending: any;
  inProgress: any;
  completed: any;
  failed: any;
  totalValueProcessed?: number;
  gasFeesPaid?: number;
  byStatus?: Record<string, number>;
  byPriority?: Record<string, number>;
  byBlockchain?: Record<string, number>;
  timeMetrics?: {
    averageBurnTime: number;
    averageTransferTime: number;
    averageConfirmationTime: number;
  };
  dailyStats?: any[];
}

export interface SettlementHealthCheck {
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'critical';
  issues: HealthIssue[];
  metrics: SettlementMetrics;
  lastSuccessfulSettlement?: Date;
  queueBacklog: number;
  failureRate: number;
  avgResponseTime: number;
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'connectivity' | 'gas' | 'queue' | 'funds';
  message: string;
  details?: any;
  suggestedAction?: string;
}

// Gas optimization and fee management
export interface GasOptimization {
  id: string;
  blockchain: string;
  currentGasPrice: number;
  recommendedGasPrice: number;
  estimatedSavings: number;
  networkCongestion: 'low' | 'medium' | 'high';
  optimalBatchSize: number;
  recommendedDelay?: number; // in minutes
  updatedAt: Date;
}

export interface FeeStructure {
  id: string;
  tokenType: string;
  redemptionType: 'standard' | 'interval';
  baseFee: number;
  percentageFee: number;
  minimumFee: number;
  maximumFee?: number;
  gasCoverage: boolean;
  feeToken: 'native' | 'USDC' | 'deducted';
  effectiveFrom: Date;
  effectiveTo?: Date;
}

// Settlement error handling and recovery
export interface SettlementError {
  id: string;
  settlementRequestId: string;
  errorType: ErrorType;
  errorCode: string;
  errorMessage: string;
  errorDetails?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRecoverable: boolean;
  suggestedAction?: string;
  occurredAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export type ErrorType =
  | 'validation'
  | 'insufficient_funds'
  | 'gas_estimation'
  | 'network_error'
  | 'contract_error'
  | 'timeout'
  | 'authorization'
  | 'rate_limit'
  | 'unknown';

export interface RecoveryAction {
  id: string;
  settlementErrorId: string;
  actionType: RecoveryActionType;
  parameters?: Record<string, any>;
  scheduledAt?: Date;
  executedAt?: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  errorMessage?: string;
}

export type RecoveryActionType =
  | 'retry'
  | 'retry_with_higher_gas'
  | 'manual_intervention'
  | 'cancel'
  | 'refund'
  | 'escalate';

// Settlement audit and compliance
export interface SettlementAuditLog {
  id: string;
  settlementRequestId: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  previousState?: any;
  newState?: any;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface CapTableUpdate {
  id: string;
  settlementRequestId: string;
  tokenId: string;
  investorId: string;
  previousBalance: number;
  newBalance: number;
  amountRedeemed: number;
  updateTxHash?: string;
  updatedAt: Date;
  confirmedAt?: Date;
  rollbackId?: string;
}

// API types for settlement operations
export interface InitiateSettlementInput {
  redemptionRequestId: string;
  tokenAddress: string;
  tokenAmount: number;
  investorId: string;
  priority?: SettlementPriority;
  scheduledAt?: Date;
  gasPrice?: number;
  confirmationBlocks?: number;
}

export interface SettlementResponse {
  success: boolean;
  data?: SettlementRequest;
  error?: string;
  estimatedCompletionTime?: Date;
  retryId?: string;
  originalSettlementId?: string;
  cancellationId?: string;
  settlementId?: string;
  status?: string;
  timestamp?: Date;
  reason?: string;
  refundIssued?: boolean;
  tokensRestored?: boolean;
  estimatedCompletion?: Date;
}

export interface SettlementStatusResponse {
  success: boolean;
  data?: {
    settlement: SettlementRequest;
    tokenBurn?: TokenBurnOperation;
    fundTransfer?: FundTransferOperation;
    confirmation?: SettlementConfirmation;
    currentStep: string;
    progress: number; // percentage
    estimatedTimeRemaining?: number; // in minutes
  };
  error?: string;
}

export interface SettlementListResponse {
  success: boolean;
  data?: {
    settlements: SettlementRequest[];
    pagination: {
      page: number;
      currentPage?: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
    };
    metrics: SettlementMetrics;
  };
  error?: string;
}

// Real-time settlement updates
export interface SettlementUpdate {
  settlementRequestId: string;
  type: SettlementUpdateType;
  status: SettlementStatus;
  message?: string;
  data?: any;
  timestamp: Date;
  settlementId?: string;
  progress?: number;
  details?: any;
}

export type SettlementUpdateType =
  | 'status_change'
  | 'status_update'
  | 'progress_update'
  | 'error_occurred'
  | 'retry_initiated'
  | 'completion'
  | 'intervention_required';

// Settlement configuration
export interface SettlementConfig {
  id: string;
  tokenType: string;
  blockchain: string;
  autoSettlement: boolean;
  batchSettlement: boolean;
  maxBatchSize: number;
  gasOptimization: boolean;
  confirmationBlocks: number;
  retryAttempts: number;
  retryDelayMs: number;
  timeoutMs: number;
  priorityGasMultiplier: number;
  feeStructureId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Additional info types for components
export interface SettlementInfo {
  id: string;
  status: SettlementStatus;
  transactionHash?: string;
  gasUsed?: number;
  timestamp: Date;
}
