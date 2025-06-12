// Approval workflow types for redemption module
// Supports multi-signature approval process

export interface ApprovalRequest {
  id: string;
  redemptionRequestId: string;
  requiredApprovals: number;
  currentApprovals: number;
  status: ApprovalStatus;
  approvers: ApprovalRecord[];
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ApprovalStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'expired';

export interface ApprovalRecord {
  id: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  approverEmail?: string;
  avatarUrl?: string;
  decision: ApprovalDecision;
  status: ApprovalStatus;
  timestamp?: Date;
  comments?: string;
  ipAddress?: string;
  signature?: string;
  approvedBy?: string;
  requiredApprovals?: number;
}

export type ApprovalDecision = 
  | 'pending' 
  | 'approved' 
  | 'rejected';

// Type alias for backward compatibility
export type ApprovalDecisionType = ApprovalDecision;

export interface ApprovalWorkflowConfig {
  requiredApprovals: number;
  totalApprovers: number;
  approvalType: 'sequential' | 'parallel' | 'any';
  autoApprovalRules?: AutoApprovalRule[];
  escalationRules?: EscalationRule[];
  timeoutRules?: TimeoutRule[];
}

export interface AutoApprovalRule {
  id: string;
  name: string;
  conditions: ApprovalCondition[];
  enabled: boolean;
}

export interface ApprovalCondition {
  field: string;
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'ne' | 'in' | 'nin';
  value: any;
}

export interface EscalationRule {
  id: string;
  name: string;
  triggerAfterHours: number;
  escalateTo: string[];
  notificationMethod: 'email' | 'sms' | 'push' | 'all';
}

export interface TimeoutRule {
  id: string;
  name: string;
  timeoutHours: number;
  action: 'auto_approve' | 'auto_reject' | 'escalate';
  escalateToRole?: string;
}

// Multi-signature specific types
export interface MultiSigConfig {
  threshold: number; // e.g., 2 for 2-of-3
  totalSigners: number; // e.g., 3 for 2-of-3
  signers: MultiSigSigner[];
  contractAddress?: string;
  chainId?: number;
}

export interface MultiSigSigner {
  id: string;
  address: string;
  name: string;
  role: string;
  publicKey?: string;
  isActive: boolean;
}

export interface ApprovalChain {
  id: string;
  name: string;
  description?: string;
  steps: ApprovalStep[];
  isSequential: boolean;
  allowParallelExecution: boolean;
}

export interface ApprovalStep {
  id: string;
  order: number;
  name: string;
  description?: string;
  requiredRole?: string;
  requiredApprovers: number;
  eligibleApprovers: string[];
  conditions?: ApprovalCondition[];
  isOptional: boolean;
  timeoutHours?: number;
}

// Delegation and proxy approval types
export interface ApprovalDelegation {
  id: string;
  delegatorId: string;
  delegateId: string;
  scope: DelegationScope;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  conditions?: ApprovalCondition[];
}

export type DelegationScope = 'all' | 'amount_limit' | 'token_type' | 'specific_conditions';

export interface ProxyApproval {
  id: string;
  originalApproverId: string;
  proxyApproverId: string;
  delegationId: string;
  timestamp: Date;
  reason?: string;
}

// Approval queue and dashboard types
export interface ApprovalQueueItem {
  id: string;
  redemptionRequestId: string;
  requestorName: string;
  investorName?: string; // Added for ApproverDashboard compatibility
  investorId?: string; // Added for ApproverDashboard compatibility
  tokenAmount: number;
  tokenType: string;
  redemptionType: 'standard' | 'interval'; // Added for ApproverDashboard compatibility
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: Date;
  deadline?: Date;
  estimatedValue: number;
  usdcAmount: number; // Added for ApproverDashboard compatibility (alias for estimatedValue)
  riskScore?: number;
  tags?: string[];
  approvalId?: string;
  status?: ApprovalStatus;
  assignedApprovers?: string[];
}

export interface ApproverDashboardMetrics {
  pendingApprovals: number;
  approvedToday: number;
  rejectedToday: number;
  avgApprovalTime: number; // in hours
  overdueApprovals: number;
  delegatedApprovals: number;
}

export interface ApprovalAction {
  type: 'approve' | 'reject' | 'request_info' | 'delegate';
  comments?: string;
  conditions?: ApprovalCondition[];
  delegateToId?: string;
  delegationDuration?: number; // in hours
}

// Audit and compliance types for approvals
export interface ApprovalAuditLog {
  id: string;
  approvalRequestId: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  previousState?: any;
  newState?: any;
}

export interface ComplianceCheck {
  id: string;
  checkType: string;
  status: 'pass' | 'fail' | 'warning';
  message?: string;
  performedAt: Date;
  details?: any;
}

// API types for approval operations
export interface SubmitApprovalInput {
  approvalRequestId: string;
  decision: ApprovalDecision;
  comments?: string;
  signature?: string;
}

export interface ApprovalResponse {
  success: boolean;
  data?: {
    approvalRecord: ApprovalRecord;
    updatedRequest: ApprovalRequest;
    isComplete: boolean;
  };
  error?: string;
}

export interface ApprovalQueueResponse {
  success: boolean;
  data?: {
    items: ApprovalQueueItem[];
    queue: ApprovalQueueItem[]; // Alias for items for backward compatibility
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    metrics: ApproverDashboardMetrics;
    avgApprovalTime?: number;
  };
  error?: string;
}

// Additional info types for components
export interface ApprovalInfo {
  id: string;
  status: ApprovalStatus;
  approvers: ApprovalRecord[];
  currentApprovals: number;
  requiredApprovals: number;
}
