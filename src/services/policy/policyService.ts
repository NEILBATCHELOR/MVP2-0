import { supabase, executeWithRetry } from '@/infrastructure/database/client';
import type { RuleTable, RuleInsert, RuleUpdate } from '@/types/core/database';
import { createRule, updateRule } from '@/services/rule/ruleService';

// Valid policy status values
type PolicyStatus = "active" | "inactive" | "draft" | "pending";

// Policy types
export interface Policy {
  id?: string;
  name: string;
  description: string;
  type: string;
  jurisdiction: string;
  effectiveDate: string;
  expirationDate?: string;
  tags: string[];
  rules: any[];
  approvers: any[];
  approvalHistory?: any[];
  reviewFrequency?: string;
  isActive?: boolean;
  createdAt?: string;
  modifiedAt?: string;
  status?: PolicyStatus;
  createdBy?: string;
}

// Helper type
type JsonObject = Record<string, any>;

/**
 * Safely converts a string to a valid policy status
 * @param status The status string to convert
 * @returns A valid policy status
 */
function toValidPolicyStatus(status: string): PolicyStatus {
  // Only allow valid status values
  if (status === 'active' || status === 'inactive' || status === 'draft' || status === 'pending') {
    return status;
  }
  // Default to draft for invalid values
  return 'draft';
}

/**
 * Helper to extract policy fields from JSON data
 * @param data JSON data to extract from
 * @param defaultValues Default values to use if fields are missing
 * @returns Policy object with all required fields
 */
function extractPolicyFields(data: JsonObject, defaultValues: Partial<Policy> = {}): Policy {
  // Create a policy with default values for all required fields
  return {
    name: data.name || defaultValues.name || 'Untitled Policy',
    description: data.description || defaultValues.description || '',
    type: data.type || defaultValues.type || 'custom',
    jurisdiction: data.jurisdiction || defaultValues.jurisdiction || 'global',
    effectiveDate: data.effectiveDate || defaultValues.effectiveDate || new Date().toISOString().split('T')[0],
    tags: Array.isArray(data.tags) ? data.tags : defaultValues.tags || [],
    rules: Array.isArray(data.rules) ? data.rules : defaultValues.rules || [],
    approvers: Array.isArray(data.approvers) ? data.approvers : defaultValues.approvers || [],
    id: data.id || defaultValues.id,
    expirationDate: data.expirationDate || defaultValues.expirationDate,
    reviewFrequency: data.reviewFrequency || defaultValues.reviewFrequency,
    isActive: data.isActive ?? defaultValues.isActive,
    createdAt: data.createdAt || defaultValues.createdAt,
    modifiedAt: data.modifiedAt || defaultValues.modifiedAt,
    status: toValidPolicyStatus(data.status || (defaultValues.status || 'draft')),
    createdBy: data.createdBy || defaultValues.createdBy
  };
}

/**
 * Save a policy and its rules to the database
 * @param policy Policy data to save
 * @param userId User ID of the creator
 * @returns Saved policy with updated rules
 */
export async function savePolicy(policy: Policy, userId: string): Promise<Policy> {
  try {
    // Generate a UUID for the policy if not provided
    const policyId = policy.id || crypto.randomUUID();
    
    console.log(`Saving policy: ${policy.name} (ID: ${policyId})`);
    
    // Create a metadata record for the policy in the rules table
    const policyMetadata = {
      rule_id: policyId,
      rule_name: policy.name,
      rule_type: 'policy_metadata',
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
      },
      created_by: userId,
      status: policy.isActive ? 'active' : 'inactive'
    };

    // Insert or update the policy metadata
    console.log('Saving policy metadata...');
    const { data: savedMetadata, error: metadataError } = await supabase
      .from('rules')
      .upsert(policyMetadata)
      .select();

    if (metadataError) {
      console.error('Error saving policy metadata:', metadataError);
      throw metadataError;
    }

    // Now save all the rules associated with this policy
    console.log(`Saving ${policy.rules.length} rules for policy ${policyId}...`);
    const updatedRules = await Promise.all(
      policy.rules.map(async (rule) => {
        // Add policy information to each rule
        const ruleWithPolicy = {
          ...rule,
          policyId: policyId,
          policyName: policy.name,
          policyType: policy.type,
          policyDescription: policy.description,
          policyJurisdiction: policy.jurisdiction,
          policyEffectiveDate: policy.effectiveDate,
          policyExpirationDate: policy.expirationDate,
          policyTags: policy.tags,
          policyStatus: policy.isActive ? 'active' : 'inactive'
        };

        try {
          // If the rule already has an ID that looks like a UUID, update it
          if (rule.id && typeof rule.id === 'string' && rule.id.includes('-')) {
            console.log(`Updating existing rule ${rule.id}`);
            return await updateRule(rule.id, {
              rule_details: ruleWithPolicy,
              rule_name: rule.name,
              status: rule.enabled ? 'active' : 'inactive'
            });
          } else {
            // Otherwise create a new rule
            console.log(`Creating new rule: ${rule.name}`);
            const ruleInsert: RuleInsert = {
              rule_name: rule.name,
              rule_type: rule.type,
              rule_details: ruleWithPolicy,
              created_by: userId,
              status: rule.enabled ? 'active' : 'inactive',
              is_template: false
            };
            
            return await createRule(ruleInsert);
          }
        } catch (ruleError) {
          console.error(`Error saving rule ${rule.name}:`, ruleError);
          throw ruleError;
        }
      })
    );

    console.log(`Successfully saved ${updatedRules.length} rules for policy ${policyId}`);
    
    // Process approvers if present
    if (policy.approvers && policy.approvers.length > 0) {
      console.log(`Processing ${policy.approvers.length} approvers for policy ${policyId}...`);
      
      // Handle approvers for each rule if needed
      // This would be a good place to add approver handling code
    }

    // Return the updated policy with saved rules
    return {
      ...policy,
      id: policyId,
      rules: updatedRules.map(rule => {
        const ruleDetails = rule.rule_details as JsonObject || {};
        return {
          ...ruleDetails,
          id: rule.rule_id,
          enabled: rule.status === 'active'
        };
      })
    };
  } catch (error) {
    console.error('Error in savePolicy:', error);
    throw error;
  }
}

/**
 * Get a policy by ID
 * @param policyId Policy ID
 * @returns Policy data
 */
export async function getPolicy(policyId: string): Promise<Policy | null> {
  // Get the policy metadata
  const { data: policyData, error: policyError } = await supabase
    .from('rules')
    .select('*')
    .eq('rule_id', policyId)
    .eq('rule_type', 'policy_metadata')
    .single();

  if (policyError) {
    if (policyError.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error(`Error fetching policy ${policyId}:`, policyError);
    throw policyError;
  }

  if (!policyData) {
    return null;
  }

  // Get all rules with this policy ID
  // @ts-ignore - Supabase typing causes excessive type instantiation
  const rulesResponse = await supabase
    .from('rules')
    .select('*')
    .eq('rule_details->policyId', policyId)
    .neq('rule_type', 'policy_metadata');

  // Manually handle response to avoid type recursion issues
  const rulesData = rulesResponse.data as Array<Record<string, any>> | null;
  const rulesError = rulesResponse.error as Error | null;

  if (rulesError) {
    console.error(`Error fetching rules for policy ${policyId}:`, rulesError);
    throw rulesError;
  }

  // Convert to Policy format
  const policyDetails = policyData.rule_details as JsonObject || {};
  
  // Create a base policy object with minimal defaults
  const basePolicy: Partial<Policy> = {
    id: policyData.rule_id,
    name: policyDetails.name || policyData.rule_name,
    status: toValidPolicyStatus(policyData.status),
    createdAt: policyData.created_at,
    modifiedAt: policyData.updated_at,
    createdBy: policyData.created_by,
  };
  
  // Extract full policy with all required fields
  const policy = extractPolicyFields(policyDetails, basePolicy);
  
  // Add rules to the policy
  policy.rules = rulesData ? rulesData.map(rule => {
    const ruleDetails = rule.rule_details as JsonObject || {};
    return {
      ...ruleDetails,
      id: rule.rule_id,
      enabled: rule.status === 'active'
    };
  }) : [];

  return policy;
}

/**
 * Get all policies
 * @returns Array of policies
 */
export async function getAllPolicies(): Promise<Policy[]> {
  // Get all policy metadata
  const { data: policiesData, error: policiesError } = await supabase
    .from('rules')
    .select('*')
    .eq('rule_type', 'policy_metadata')
    .order('created_at', { ascending: false });

  if (policiesError) {
    console.error('Error fetching policies:', policiesError);
    throw policiesError;
  }

  if (!policiesData || policiesData.length === 0) {
    return [];
  }

  // Convert to Policy format
  const policies: Policy[] = policiesData.map(policyData => {
    const policyDetails = policyData.rule_details as JsonObject || {};
    
    // Create a base policy object with minimal defaults
    const basePolicy: Partial<Policy> = {
      id: policyData.rule_id,
      name: policyDetails.name || policyData.rule_name,
      status: toValidPolicyStatus(policyData.status),
      createdAt: policyData.created_at,
      modifiedAt: policyData.updated_at,
      createdBy: policyData.created_by,
      rules: [] // Rules will be loaded separately
    };
    
    // Extract full policy with all required fields
    return extractPolicyFields(policyDetails, basePolicy);
  });

  // For each policy, load its rules
  for (const policy of policies) {
    if (policy.id) {
      const { data: rulesData } = await supabase
        .from('rules')
        .select('*')
        .eq('rule_details->policyId', policy.id)
        .neq('rule_type', 'policy_metadata');

      if (rulesData) {
        policy.rules = rulesData.map(rule => {
          const ruleDetails = rule.rule_details as JsonObject || {};
          return {
            ...ruleDetails,
            id: rule.rule_id,
            enabled: rule.status === 'active'
          };
        });
      }
    }
  }

  return policies;
}

/**
 * Delete a policy and all its rules
 * @param policyId Policy ID
 * @returns Success status
 */
export async function deletePolicy(policyId: string): Promise<boolean> {
  // Delete the policy metadata
  const { error: metadataError } = await supabase
    .from('rules')
    .delete()
    .eq('rule_id', policyId);

  if (metadataError) {
    console.error(`Error deleting policy ${policyId}:`, metadataError);
    throw metadataError;
  }

  // Delete all rules with this policy ID
  const { error: rulesError } = await supabase
    .from('rules')
    .delete()
    .eq('rule_details->policyId', policyId);

  if (rulesError) {
    console.error(`Error deleting rules for policy ${policyId}:`, rulesError);
    throw rulesError;
  }

  return true;
}