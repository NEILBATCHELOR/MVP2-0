import { supabase } from '@/infrastructure/database/client';
import type { RuleTable } from '@/types/core/database';
import type { Json } from '@/types/core/supabase';
import type { BasePolicy } from '@/types/domain/policy/policy';
import { batchSaveRules, PolicyRule, saveRuleApprovers } from '@/services/rule/enhancedRuleService';
import { ensureUUID, generateUUID } from '@/utils/shared/formatting/uuidUtils';

/**
 * Policy status type
 */
export type PolicyStatus = 'active' | 'inactive' | 'draft' | 'archived' | 'pending_approval';

/**
 * Convert string to valid policy status
 */
function toPolicyStatus(status: string): PolicyStatus {
  switch (status.toLowerCase()) {
    case 'active':
      return 'active';
    case 'inactive':
      return 'inactive';
    case 'draft':
      return 'draft';
    case 'archived':
      return 'archived';
    case 'pending_approval':
      return 'pending_approval';
    default:
      return 'draft';
  }
}

/**
 * Policy interface - exported for use in other modules
 */
export interface Policy extends BasePolicy {
  rules: any[];
  approvers?: any[];
  isActive?: boolean;
  isTemplate?: boolean;
  version?: number;
}

/**
 * Validate a policy object
 * @param policy Policy to validate
 * @returns Validated policy with cleaned data
 */
export function validatePolicy(policy: Policy): Policy {
  // Make sure we have a valid policy object
  if (!policy.name) {
    throw new Error('Policy name is required');
  }
  
  if (!policy.type) {
    throw new Error('Policy type is required');
  }
  
  if (!policy.rules || !Array.isArray(policy.rules)) {
    throw new Error('Policy must have rules array');
  }
  
  // Ensure proper data types
  return {
    ...policy,
    name: String(policy.name),
    description: String(policy.description || ''),
    type: String(policy.type),
    jurisdiction: String(policy.jurisdiction || 'global'),
    effectiveDate: String(policy.effectiveDate || new Date().toISOString().split('T')[0]),
    rules: Array.isArray(policy.rules) ? policy.rules : [],
    approvers: Array.isArray(policy.approvers) ? policy.approvers : [],
    isTemplate: !!policy.isTemplate,
  };
}

/**
 * Save a policy and all its rules to the database
 * @param policy Policy data to save
 * @param userId User ID of the creator
 * @returns Saved policy with updated rules
 */
export async function savePolicy(policy: Policy, userId: string): Promise<Policy> {
  try {
    // Validate inputs
    const validUserId = ensureUUID(userId);
    const policyId = policy.id ? ensureUUID(policy.id) : generateUUID();
    let existingCreatedBy = validUserId;

    // If updating an existing policy, get the original creator
    if (policy.id) {
      const { data: existingPolicy } = await supabase
        .from('rules')
        .select('created_by')
        .eq('rule_id', policyId)
        .single();
        
      if (existingPolicy?.created_by) {
        existingCreatedBy = ensureUUID(existingPolicy.created_by);
      }
    }

    // First, save all rules to get their IDs
    const rulesWithPolicy = policy.rules.map(rule => ({
      ...rule,
      policyId: policyId,
      policyName: policy.name,
      policyType: policy.type,
      isTemplate: policy.isTemplate,
    }));
    
    const updatedRules = await batchSaveRules(rulesWithPolicy as PolicyRule[], validUserId, policyId);
    
    if (!updatedRules || updatedRules.length === 0) {
      throw new Error('Failed to save rules');
    }

    // Now create the policy metadata record
    const policyMetadata = {
      rule_id: policyId,
      rule_name: policy.name,
      rule_type: policy.isTemplate ? 'template_metadata' : 'policy_metadata',
      rule_details: {
        ...policy,
        id: policyId,
        policyId: policyId,
        policyName: policy.name,
        policyDescription: policy.description,
        policyType: policy.type,
        policyJurisdiction: policy.jurisdiction,
        policyEffectiveDate: policy.effectiveDate,
        policyExpirationDate: policy.expirationDate,
        policyTags: policy.tags,
        policyApprovers: policy.approvers,
        policyReviewFrequency: policy.reviewFrequency,
        policyStatus: policy.isActive ? 'active' : 'inactive',
        status: policy.isActive ? 'active' : 'inactive',
        rules: updatedRules, // Include the saved rules in metadata
      } as unknown as Json,
      created_by: policy.id ? existingCreatedBy : validUserId,
      status: policy.isActive ? 'active' : 'inactive',
      is_template: policy.isTemplate
    };

    // Save the policy metadata
    const { data: savedMetadata, error: metadataError } = await supabase
      .from('rules')
      .upsert(policyMetadata)
      .select();

    if (metadataError) {
      throw metadataError;
    }

    // Now that both rules and policy are saved, save approvers for each rule
    if (policy.approvers && policy.approvers.length > 0) {
      const approverIds = policy.approvers.map(approver => ensureUUID(approver.id));
      
      // Save approvers for each rule
      for (const rule of updatedRules) {
        if (rule.id) {
          try {
            console.log(`Saving approvers for rule ${rule.id}...`);
            
            // First delete any existing approvers for this rule
            const { error: deleteError } = await supabase
              .from('policy_rule_approvers')
              .delete()
              .eq('policy_rule_id', rule.id);

            if (deleteError) {
              console.error(`Error deleting existing approvers for rule ${rule.id}:`, deleteError);
              // Continue with insertion even if deletion fails
            }

            // Then insert new approvers
            const approverInserts = approverIds.map(approverId => ({
              policy_rule_id: rule.id,
              user_id: approverId,
              created_by: validUserId,
              status: 'pending'
            }));

            console.log(`Inserting ${approverInserts.length} approvers for rule ${rule.id}`);
            
            // Insert approvers with explicit transaction waiting
            const { error: approverError } = await supabase
              .from('policy_rule_approvers')
              .insert(approverInserts);

            if (approverError) {
              console.error(`Error inserting approvers for rule ${rule.id}:`, approverError);
              console.error('Approver data:', JSON.stringify(approverInserts));
              throw approverError;
            }
          } catch (error) {
            console.error(`Error saving approvers for rule ${rule.id}:`, error);
            throw error;
          }
        }
      }
    }

    // Create an audit entry
    await createPolicyAuditEntry(policyId, validUserId, policy.id ? 'updated' : 'created', {
      policyName: policy.name,
      policyType: policy.type,
      version: policy.version || 1,
      isTemplate: policy.isTemplate,
    });

    // Return the updated policy with saved rules
    return {
      ...policy,
      id: policyId,
      rules: updatedRules,
    };
  } catch (error) {
    console.error('Error in savePolicy:', error);
    throw error;
  }
}

/**
 * Get a policy by ID
 * @param policyId Policy ID
 * @returns The policy or null if not found
 */
export async function getPolicy(policyId: string): Promise<Policy | null> {
  try {
    // Get the policy metadata
    const { data: policyMetadata, error: metadataError } = await supabase
      .from('rules')
      .select('*')
      .eq('rule_id', policyId)
      .or('rule_type.eq.policy_metadata,rule_type.eq.template_metadata')
      .single();
    
    if (metadataError) {
      if (metadataError.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error(`Error fetching policy ${policyId}:`, metadataError);
      throw metadataError;
    }
    
    // Get all rules for this policy
    const { data: rules, error: rulesError } = await supabase
      .from('rules')
      .select('*')
      .eq('is_template', policyMetadata.is_template)
      .neq('rule_type', 'policy_metadata')
      .neq('rule_type', 'template_metadata');
    
    if (rulesError) {
      console.error(`Error fetching rules for policy ${policyId}:`, rulesError);
      throw rulesError;
    }
    
    // Filter rules by policyId
    const policyRules = (rules || []).filter((rule: RuleTable) => {
      const details = rule.rule_details as any;
      return details?.policyId === policyId;
    });
    
    // Convert the metadata to a policy object
    const policy = policyMetadata.rule_details as unknown as Policy;
    
    // Add the rules to the policy
    return {
      ...policy,
      id: policyId,
      rules: policyRules.map((rule: RuleTable) => rule.rule_details),
      isTemplate: policyMetadata.is_template,
    };
  } catch (error) {
    console.error(`Error getting policy ${policyId}:`, error);
    throw error;
  }
}

/**
 * Get all policies
 * @param includeTemplates Whether to include templates
 * @returns Array of policies
 */
export async function getAllPolicies(includeTemplates: boolean = false): Promise<Policy[]> {
  try {
    let query = supabase
      .from('rules')
      .select('*');
    
    if (!includeTemplates) {
      query = query.eq('is_template', false);
    }
    
    const { data: policies, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching policies:', error);
      throw error;
    }
    
    // Map database records to policy objects with proper status conversion
    return (policies || []).map((policy: RuleTable) => ({
      ...(policy.rule_details as unknown as Policy),
      id: policy.rule_id,
      name: policy.rule_name,
      isTemplate: policy.is_template,
      status: toPolicyStatus(policy.status),
      createdAt: policy.created_at,
      createdBy: policy.created_by,
    }));
  } catch (error) {
    console.error('Error in getAllPolicies:', error);
    throw error;
  }
}

/**
 * Delete a policy and all its rules
 * @param policyId Policy ID
 * @returns Success status
 */
export async function deletePolicy(policyId: string): Promise<boolean> {
  try {
    // Get all rules for this policy first
    const policy = await getPolicy(policyId);
    if (!policy) {
      return false;
    }
    
    // Delete approvers
    await supabase
      .from('policy_rule_approvers')
      .delete()
      .eq('policy_rule_id', policyId);
    
    // Delete the policy metadata and all rules with this policy ID
    const { error } = await supabase
      .from('rules')
      .delete()
      .eq('rule_id', policyId);
    
    if (error) {
      console.error(`Error deleting policy ${policyId}:`, error);
      throw error;
    }
    
    // Now delete all associated rules
    const ruleIds = policy.rules.map((rule: any) => rule.id).filter(Boolean);
    
    if (ruleIds.length > 0) {
      const { error: ruleError } = await supabase
        .from('rules')
        .delete()
        .in('rule_id', ruleIds);
      
      if (ruleError) {
        console.error(`Error deleting rules for policy ${policyId}:`, ruleError);
        // Don't throw here since the policy is already deleted
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting policy ${policyId}:`, error);
    throw error;
  }
}

/**
 * Create a policy audit entry
 * @param policyId Policy ID
 * @param userId User ID
 * @param action Action performed
 * @param details Additional details
 * @returns Audit entry ID
 */
export async function createPolicyAuditEntry(
  policyId: string, 
  userId: string, 
  action: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected',
  details: any
): Promise<string> {
  // Ensure the user ID is a valid UUID
  const safeUserId = ensureUUID(userId);
  
  const auditEntry = {
    entity_id: policyId,
    entity_type: 'policy',
    action,
    user_id: safeUserId,
    details: typeof details === 'object' ? JSON.stringify(details) : String(details),
  };
  
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(auditEntry)
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating audit entry for policy ${policyId}:`, error);
      return 'error'; // Return a placeholder instead of throwing
    }
    
    return data.id || 'success'; // Return id or a placeholder
  } catch (error) {
    console.error(`Error in createPolicyAuditEntry:`, error);
    return 'error'; // Return a placeholder instead of throwing
  }
}