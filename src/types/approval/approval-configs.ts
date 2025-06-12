/**
 * Enhanced Approval Configs Types
 * 
 * TypeScript types for the enhanced approval_configs schema that supports
 * both role-based and user-specific approver configurations.
 */

import type { Json } from '@/types/core/database';

// ========================================
// CORE APPROVAL CONFIG TYPES
// ========================================

/**
 * Enhanced Approval Configs Table with new fields
 */
export interface ApprovalConfigsTable {
  id: string;
  permission_id: string;
  config_name?: string;
  config_description?: string;
  approval_mode: 'role_based' | 'user_specific' | 'mixed';
  required_approvals: number;
  requires_all_approvers: boolean;
  consensus_type: string;
  eligible_roles: string[];
  auto_approval_conditions: Json;
  auto_approve_threshold: number;
  escalation_config?: Json;
  notification_config?: Json;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_modified_by?: string;
}

/**
 * Approval Config Approvers Junction Table
 */
export interface ApprovalConfigApproversTable {
  id: string;
  approval_config_id: string;
  approver_type: 'user' | 'role';
  approver_user_id?: string;
  approver_role_id?: string;
  is_required: boolean;
  order_priority: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * Approval Config History Table
 */
export interface ApprovalConfigHistoryTable {
  id: string;
  approval_config_id: string;
  change_type: 'created' | 'updated' | 'deleted' | 'approver_added' | 'approver_removed';
  old_data?: Json;
  new_data?: Json;
  changed_by?: string;
  change_reason?: string;
  created_at: string;
}

/**
 * Redemption Approver Assignments Table
 */
export interface RedemptionApproverAssignmentsTable {
  id: string;
  redemption_request_id: string;
  approval_config_id: string;
  approver_user_id: string;
  assigned_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'recused';
  approval_timestamp?: string;
  rejection_reason?: string;
  comments?: string;
  approval_signature?: string;
  ip_address?: string;
  user_agent?: string;
}

// ========================================
// VIEW TYPES
// ========================================

/**
 * Enhanced Approval Config with Configured Approvers (from view)
 */
export interface ApprovalConfigWithApproversView {
  id: string;
  permission_id: string;
  config_name?: string;
  config_description?: string;
  approval_mode: 'role_based' | 'user_specific' | 'mixed';
  required_approvals: number;
  requires_all_approvers: boolean;
  consensus_type: string;
  eligible_roles: string[];
  auto_approval_conditions: Json;
  auto_approve_threshold: number;
  escalation_config?: Json;
  notification_config?: Json;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_modified_by?: string;
  configured_approvers: Array<{
    type: 'user' | 'role';
    id: string;
    name: string;
    email?: string;
    description?: string;
    is_required: boolean;
    order_priority: number;
  }>;
  approver_count: number;
}

/**
 * Redemption Approval Status Summary (from view)
 */
export interface RedemptionApprovalStatusView {
  redemption_request_id: string;
  approval_config_id: string;
  config_name?: string;
  required_approvals: number;
  consensus_type: string;
  total_assigned_approvers: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  overall_status: 'pending' | 'approved' | 'rejected';
  approver_details: Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    status: 'pending' | 'approved' | 'rejected' | 'recused';
    approval_timestamp?: string;
    comments?: string;
    assigned_at: string;
  }>;
}

// ========================================
// INSERT/UPDATE TYPES
// ========================================

export type ApprovalConfigsInsert = Omit<ApprovalConfigsTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type ApprovalConfigsUpdate = Partial<Omit<ApprovalConfigsTable, 'id' | 'created_at' | 'updated_at'>>;

export type ApprovalConfigApproversInsert = Omit<ApprovalConfigApproversTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type ApprovalConfigApproversUpdate = Partial<Omit<ApprovalConfigApproversTable, 'id' | 'created_at' | 'updated_at'>>;

export type RedemptionApproverAssignmentsInsert = Omit<RedemptionApproverAssignmentsTable, 'id' | 'assigned_at'> & {
  id?: string;
};

export type RedemptionApproverAssignmentsUpdate = Partial<Omit<RedemptionApproverAssignmentsTable, 'id' | 'assigned_at'>>;

// ========================================
// FUNCTION RESULT TYPES
// ========================================

/**
 * Type for getting users by role function result
 */
export interface UsersByRoleResult {
  user_id: string;
  user_name: string;
  user_email: string;
  role_name: string;
  role_id: string;
}

// ========================================
// DOMAIN TYPES
// ========================================

/**
 * Enhanced RedemptionApprover interface for UI components
 */
export interface EnhancedRedemptionApprover {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  approver_id: string;
  type?: 'user' | 'role';
  is_required?: boolean;
  order_priority?: number;
}

/**
 * Domain types for approval configuration management
 */
export interface ApprovalConfigDomain {
  id: string;
  permissionId: string;
  configName?: string;
  configDescription?: string;
  approvalMode: 'role_based' | 'user_specific' | 'mixed';
  requiredApprovals: number;
  requiresAllApprovers: boolean;
  consensusType: string;
  eligibleRoles: string[];
  autoApprovalConditions: Record<string, any>;
  autoApproveThreshold: number;
  escalationConfig?: Record<string, any>;
  notificationConfig?: Record<string, any>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
  configuredApprovers?: Array<{
    type: 'user' | 'role';
    id: string;
    name: string;
    email?: string;
    description?: string;
    isRequired: boolean;
    orderPriority: number;
  }>;
  approverCount?: number;
}

/**
 * Domain type for redemption approval status
 */
export interface RedemptionApprovalDomain {
  redemptionRequestId: string;
  approvalConfigId: string;
  configName?: string;
  requiredApprovals: number;
  consensusType: string;
  totalAssignedApprovers: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  overallStatus: 'pending' | 'approved' | 'rejected';
  approverDetails: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    status: 'pending' | 'approved' | 'rejected' | 'recused';
    approvalTimestamp?: string;
    comments?: string;
    assignedAt: string;
  }>;
}

// ========================================
// HOOK RETURN TYPES
// ========================================

/**
 * Type for approval config with populated approvers
 */
export interface ApprovalConfigWithApprovers extends ApprovalConfigsTable {
  configuredApprovers: EnhancedRedemptionApprover[];
  approverCount: number;
}

/**
 * Service function return types
 */
export interface ApprovalConfigServiceResult {
  success: boolean;
  data?: ApprovalConfigWithApprovers;
  error?: string;
}

export interface AssignApproversResult {
  success: boolean;
  assignedCount: number;
  error?: string;
}

// ========================================
// MAPPER TYPES
// ========================================

/**
 * Mappers between database and domain types
 */
export interface ApprovalConfigMappers {
  toDomain: (dbConfig: ApprovalConfigWithApproversView) => ApprovalConfigDomain;
  toDatabase: (domainConfig: Partial<ApprovalConfigDomain>) => ApprovalConfigsInsert;
  approverToDomain: (dbApprover: ApprovalConfigApproversTable, userInfo: { name: string; email: string; role?: string }) => EnhancedRedemptionApprover;
}
