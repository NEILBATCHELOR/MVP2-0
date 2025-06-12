import { Json } from '@/types/core/supabase';
import { PolicyTemplatesTable } from '@/types/core/database';
import { PolicyRule as RuleDefinition } from './rules';

/**
 * Rule template structure
 */
export interface RuleTemplate {
  id?: string;
  name: string;
  type: string;
  description?: string;
  condition?: {
    field: string;
    operator: string;
    value: string;
  };
  action?: {
    type: string;
    params: Record<string, string>;
  };
  priority: 'high' | 'medium' | 'low';
  isTemplate?: boolean;
}

/**
 * Generic PolicyRule for use in templates and the RuleBuilder component
 * Makes the rule structure compatible with both the Zod schema-based rules
 * and the simpler condition/action based rules used in templates
 */
export interface PolicyRule {
  id?: string;
  name: string;
  type: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  enabled?: boolean;
  policyId?: string;
  createdAt?: string;
  modifiedAt?: string;
  isTemplate?: boolean;
  validationSchema?: (...args: any[]) => any;
  // RuleBuilder condition properties
  condition?: {
    field: string;
    operator: string;
    value: string;
  };
  // RuleBuilder action properties
  action?: {
    type: string;
    params: Record<string, string>;
  };
  // Extended properties from the zod schema types
  transferAmount?: number;
  currency?: string;
  // Add other specific properties from the typed rules as needed
}

/**
 * Policy template data structure
 */
export interface PolicyTemplateData {
  name: string;
  description: string;
  type: string;
  jurisdiction: string;
  effectiveDate: string;
  expirationDate?: string;
  tags: string[];
  rules: PolicyRule[];
  approvers: any[];
  reviewFrequency?: string;
  isActive?: boolean;
  status?: string;
}

/**
 * Policy template with data
 * Extends the database PolicyTemplatesTable but overrides the template_data type
 */
export interface PolicyTemplateWithData extends Omit<PolicyTemplatesTable, 'template_data'> {
  template_data: PolicyTemplateData;
  // UI-specific properties
  templateForEdit?: any; // Used by the PolicyTemplateDashboard for editing
}