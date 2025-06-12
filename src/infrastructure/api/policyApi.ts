// Policy API for third-party integrations
import { supabase } from '@/infrastructure/database/client';
import { ApiResponse, handleApiError } from './external';
import { 
  getPolicy, 
  getAllPolicies, 
  savePolicy as savePolicyService,
  type Policy
} from '@/services/policy/enhancedPolicyService';
import { 
  getPolicyTemplateById as getTemplateById, 
  getAllPolicyTemplates, 
  savePolicyTemplate as saveTemplateService
} from '@/services/policy/enhancedPolicyTemplateService';

import type { PolicyTemplatesTable } from '@/types/core/database';

/**
 * Get all policies
 * @param includeInactive Whether to include inactive policies
 * @returns API response with array of policies
 */
export async function getPolicies(includeInactive: boolean = false): Promise<ApiResponse<Policy[]>> {
  try {
    const policies = await getAllPolicies();
    
    // Filter out inactive policies if requested
    const filteredPolicies = includeInactive 
      ? policies 
      : policies.filter(policy => policy.status === 'active');
    
    return { 
      data: filteredPolicies, 
      status: 200 
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get a policy by ID
 * @param policyId Policy ID
 * @returns API response with the policy
 */
export async function getPolicyById(policyId: string): Promise<ApiResponse<Policy | null>> {
  try {
    const policy = await getPolicy(policyId);
    
    if (!policy) {
      return { 
        error: 'Policy not found', 
        status: 404 
      };
    }
    
    return { 
      data: policy, 
      status: 200 
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Create or update a policy
 * @param policy Policy data
 * @param userId User ID of the creator/updater
 * @returns API response with the saved policy
 */
export async function createOrUpdatePolicy(
  policy: Policy, 
  userId: string
): Promise<ApiResponse<Policy>> {
  try {
    // Validate permissions (would typically be done by middleware)
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);
      
    if (rolesError) throw rolesError;
    
    const isAuthorized = userRoles.some(userRole => 
      ['admin', 'compliance_officer'].includes(userRole.role_id)
    );
    
    if (!isAuthorized) {
      return {
        error: 'Unauthorized: You do not have permission to create/update policies',
        status: 403
      };
    }

    // Save the policy
    const savedPolicy = await savePolicyService(policy, userId);
    
    return { 
      data: savedPolicy, 
      status: policy.id ? 200 : 201 
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get all policy templates
 * @returns API response with array of policy templates
 */
export async function getPolicyTemplates(): Promise<ApiResponse<PolicyTemplatesTable[]>> {
  try {
    const templates = await getAllPolicyTemplates();
    
    return { 
      data: templates, 
      status: 200 
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get a policy template by ID
 * @param templateId Template ID
 * @returns API response with the template
 */
export async function getPolicyTemplateByIdApi(
  templateId: string
): Promise<ApiResponse<PolicyTemplatesTable | null>> {
  try {
    const template = await getTemplateById(templateId);
    
    if (!template) {
      return { 
        error: 'Template not found', 
        status: 404 
      };
    }
    
    return { 
      data: template, 
      status: 200 
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Create a policy template
 * @param templateName Template name
 * @param description Template description
 * @param policyData Policy data
 * @param userId User ID of the creator
 * @returns API response with the saved template
 */
export async function createPolicyTemplate(
  templateName: string,
  description: string,
  policyData: Policy,
  userId: string
): Promise<ApiResponse<PolicyTemplatesTable>> {
  try {
    // Validate permissions (would typically be done by middleware)
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);
      
    if (rolesError) throw rolesError;
    
    const isAuthorized = userRoles.some(userRole => 
      ['admin', 'compliance_officer'].includes(userRole.role_id)
    );
    
    if (!isAuthorized) {
      return {
        error: 'Unauthorized: You do not have permission to create policy templates',
        status: 403
      };
    }

    // Save the template
    const savedTemplate = await saveTemplateService(
      templateName,
      description,
      policyData,
      userId
    );
    
    return { 
      data: savedTemplate, 
      status: 201 
    };
  } catch (error) {
    return handleApiError(error);
  }
} 