import type { Json } from '@/types/core/supabase';

/**
 * Policy status type
 */
export type PolicyStatus = 'active' | 'inactive' | 'draft' | 'archived' | 'pending_approval';

/**
 * Base policy interface
 */
export interface BasePolicy {
  id?: string;
  name: string;
  description?: string;
  type: string;
  jurisdiction?: string;
  effectiveDate?: string;
  expirationDate?: string;
  tags?: string[];
  reviewFrequency?: string;
  createdBy?: string;
  createdAt?: string;
  modifiedAt?: string;
  status?: PolicyStatus;
}

/**
 * Policy interface with rules and approvers
 */
export interface Policy extends BasePolicy {
  rules: any[];
  approvers?: any[];
  isActive?: boolean;
  isTemplate?: boolean;
  version?: number;
}

/**
 * Policy template interface
 */
export interface PolicyTemplate extends BasePolicy {
  templateId?: string;
  templateName: string;
  templateData: Json;
  isActive?: boolean;
  version?: number;
}

/**
 * Policy version interface
 */
export interface PolicyVersion {
  versionId: string;
  policyId: string;
  version: number;
  versionData: Json;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Policy approver interface
 */
export interface PolicyApprover {
  approverId: string;
  policyId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Rule interface
 */
export interface Rule {
  id: string;
  name: string;
  description: string;
  type: string;
  priority: string;
  enabled: boolean;
  [key: string]: any; // Additional properties based on rule type
}

/**
 * Policy creation data
 */
export interface PolicyData {
  name: string;
  description?: string;
  type?: string;
  status?: PolicyStatus;
  rules: Rule[];
}

/**
 * Template interface
 */
export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category?: string;
  conditions?: string;
  actions?: string;
  priority?: string;
  version?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  template_data: {
    name: string;
    description: string;
    rules: Rule[];
  };
  configFields?: {
    name: string;
    label: string;
    type: string;
    defaultValue?: any;
    options?: { label: string; value: string }[];
  }[];
} 