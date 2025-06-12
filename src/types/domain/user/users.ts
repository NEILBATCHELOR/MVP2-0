export interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
  roles?: string[];
  auth_confirmed?: boolean;
  auth_metadata?: any;
  auth_last_sign_in?: string;
  auth_created_at?: string;
  mfa_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  role: string;
  publicKey: string;
  encryptedPrivateKey: string;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  priority: number;
  permissions?: string[];
  canManage?: string[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

export interface UserPermission {
  id: string;
  roleId: string;
  permissionId: string;
  effect: 'allow' | 'deny' | 'approval';
  conditions?: any[];
}

export interface ApprovalConfig {
  id: string;
  permissionId: string;
  requiredApprovals: number;
  eligibleRoles: string[];
  autoApprovalConditions?: ApprovalCondition[];
}

export interface ApprovalCondition {
  field: string;
  operator: 'eq' | 'lt' | 'gt' | 'contains';
  value: any;
}

export interface ApprovalWorkflowRequest {
  id?: string;
  action: string;
  resource: string;
  resourceId: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  approvers: string[];
  approvedBy: string[];
  rejectedBy: string[];
  requiredApprovals: number;
  metadata: Record<string, any>;
  created_at?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user_id: string;
  user_email?: string;
  username?: string;
  details?: string;
  entity_id?: string;
  entity_type?: string;
  project_id?: string;
  status?: string;
  metadata?: Record<string, any>;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  signature?: string;
  verified?: boolean;
}