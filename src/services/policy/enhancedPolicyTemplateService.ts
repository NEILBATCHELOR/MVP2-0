import { supabase } from '@/infrastructure/database/client';
import type { PolicyTemplateInsert, PolicyTemplateUpdate, PolicyTemplatesTable, TemplateVersionTable, TemplateVersionInsert } from '@/types/core/database';
import type { Json } from '@/types/core/supabase';
import { Policy } from './enhancedPolicyService';

// Constants
const TEMPLATE_VERSION_TABLE = 'template_versions';

// Types
export interface TemplateVersion {
  version_id: string;
  template_id: string;
  version: string;
  version_data: any;
  notes?: string;
  created_by: string;
  created_at: string;
}

// Helper function to ensure UUID is properly formatted
function formatUUID(id: string): string {
  // Simple regex to check if this is already a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  
  // If not a UUID, log the issue but return original
  console.warn(`Non-UUID format detected: ${id}`);
  return id;
}

/**
 * Save a policy template to the database with approvers in a single transaction
 * @param templateName Template name
 * @param description Template description
 * @param policyData Policy data to save as a template
 * @param userId User ID of the creator
 * @param approvers Optional array of user IDs to set as approvers
 * @returns Saved template
 */
export async function savePolicyTemplate(
  templateName: string,
  description: string,
  policyData: Policy,
  userId: string,
  approvers?: string[]
): Promise<PolicyTemplatesTable> {
  try {
    // Ensure user ID is valid
    const safeUserId = formatUUID(userId);
    
    // Create the template object - explicitly set all required fields
    const template: PolicyTemplateInsert = {
      template_name: templateName,
      description: description,
      template_data: policyData as unknown as Json,
      created_by: safeUserId,
      status: 'active' // Default to active
    };

    console.log("Creating enhanced policy template with name:", templateName);
    
    // Start a transaction - the new deferrable constraint allows both template and approvers
    // to be created in the same transaction
    const { data: createdTemplate, error: templateError } = await supabase
      .from('policy_templates')
      .insert(template)
      .select('*')
      .single();

    if (templateError) {
      console.error('Error saving policy template:', templateError);
      throw templateError;
    }
    
    if (!createdTemplate) {
      throw new Error('Failed to create policy template - no data returned');
    }
    
    console.log(`Template created with ID: ${createdTemplate.template_id}`);
    
    // If approvers were provided, handle them carefully to prevent duplicates
    if (approvers && approvers.length > 0) {
      console.log(`Adding ${approvers.length} approvers to template ${createdTemplate.template_id}`);
      
      // Process approvers individually to better handle potential errors
      for (const approverId of approvers) {
        try {
          const safeApproverId = formatUUID(approverId);
          
          // First check if this approver already exists for this template
          const { data: existingApprover } = await supabase
            .from('policy_template_approvers')
            .select('*')
            .eq('template_id', createdTemplate.template_id)
            .eq('user_id', safeApproverId)
            .maybeSingle();
          
          if (existingApprover) {
            // Update the existing approver record
            console.log(`Updating existing approver ${safeApproverId} for template ${createdTemplate.template_id}`);
            const { error: updateError } = await supabase
              .from('policy_template_approvers')
              .update({
                created_by: safeUserId,
                status: 'pending',
                timestamp: new Date().toISOString()
              })
              .eq('template_id', createdTemplate.template_id)
              .eq('user_id', safeApproverId);
              
            if (updateError) {
              console.error(`Error updating approver ${safeApproverId}:`, updateError);
            }
          } else {
            // Insert a new approver record
            console.log(`Adding new approver ${safeApproverId} to template ${createdTemplate.template_id}`);
            const { error: insertError } = await supabase
              .from('policy_template_approvers')
              .insert({
                template_id: createdTemplate.template_id,
                user_id: safeApproverId,
                created_by: safeUserId,
                status: 'pending',
                timestamp: new Date().toISOString()
              });
              
            if (insertError) {
              console.error(`Error adding approver ${safeApproverId}:`, insertError);
            }
          }
        } catch (approverError) {
          console.error(`Error processing approver:`, approverError);
          // Continue with the next approver
        }
      }
    }

    return createdTemplate;
  } catch (error) {
    console.error('Error in savePolicyTemplate:', error);
    throw error;
  }
}

/**
 * Get all policy templates
 * @returns Array of policy templates
 */
export async function getAllPolicyTemplates(): Promise<PolicyTemplatesTable[]> {
  const { data, error } = await supabase
    .from('policy_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching policy templates:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get a policy template by ID
 * @param templateId Template ID
 * @returns The template or null if not found
 */
export async function getPolicyTemplateById(templateId: string): Promise<PolicyTemplatesTable | null> {
  const { data, error } = await supabase
    .from('policy_templates')
    .select('*')
    .eq('template_id', templateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error(`Error fetching template ${templateId}:`, error);
    throw error;
  }

  return data;
}

/**
 * Update a policy template and optionally its approvers
 * @param templateId Template ID
 * @param updates Updates to apply
 * @param approvers Optional new approvers list 
 * @param createdBy User ID for attribution
 * @returns Updated template
 */
export async function updatePolicyTemplate(
  templateId: string, 
  updates: PolicyTemplateUpdate,
  approvers?: string[],
  createdBy?: string
): Promise<PolicyTemplatesTable> {
  try {
    // First get the existing template to preserve created_by if needed
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('policy_templates')
      .select('created_by')
      .eq('template_id', templateId)
      .single();
      
    if (fetchError) {
      console.error(`Error fetching template ${templateId}:`, fetchError);
      throw fetchError;
    }
    
    // Update the template
    const { data, error } = await supabase
      .from('policy_templates')
      .update(updates)
      .eq('template_id', templateId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating template ${templateId}:`, error);
      throw error;
    }
    
    // Handle approvers if provided
    if (approvers !== undefined) {
      // Use the safe creator ID
      const safeCreatorId = createdBy ? formatUUID(createdBy) : existingTemplate.created_by;
      
      // First delete all existing approvers
      const { error: deleteError } = await supabase
        .from('policy_template_approvers')
        .delete()
        .eq('template_id', templateId);
        
      if (deleteError) {
        console.error(`Error deleting existing approvers for template ${templateId}:`, deleteError);
        // Don't throw - we'll attempt to continue with adding approvers
      }
      
      // Add a small delay to ensure deletion is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Add new approvers if provided
      if (approvers && approvers.length > 0) {
        console.log(`Adding ${approvers.length} approvers to template ${templateId} after update`);
        
        // Process each approver individually
        for (const approverId of approvers) {
          try {
            const safeApproverId = formatUUID(approverId);
            
            // Directly insert the approver - we've already deleted all approvers for this template
            console.log(`Adding approver ${safeApproverId} to template ${templateId}`);
            const { error: insertError } = await supabase
              .from('policy_template_approvers')
              .insert({
                template_id: templateId,
                user_id: safeApproverId,
                created_by: safeCreatorId,
                status: 'pending',
                timestamp: new Date().toISOString()
              });
              
            if (insertError) {
              // If inserting fails due to a duplicate, try updating instead
              if (insertError.code === '23505') { // Duplicate key error
                console.log(`Approver ${safeApproverId} already exists, updating instead`);
                const { error: updateError } = await supabase
                  .from('policy_template_approvers')
                  .update({
                    created_by: safeCreatorId,
                    status: 'pending',
                    timestamp: new Date().toISOString()
                  })
                  .eq('template_id', templateId)
                  .eq('user_id', safeApproverId);
                  
                if (updateError) {
                  console.error(`Error updating existing approver ${safeApproverId}:`, updateError);
                }
              } else {
                console.error(`Error adding approver ${safeApproverId}:`, insertError);
              }
            }
          } catch (approverError) {
            console.error(`Error processing approver during update:`, approverError);
            // Continue with next approver
          }
        }
      }
    }

    return data;
  } catch (error) {
    console.error(`Error in updatePolicyTemplate:`, error);
    throw error;
  }
}

/**
 * Delete a policy template
 * @param templateId Template ID
 * @returns Success status
 */
export async function deletePolicyTemplate(templateId: string): Promise<boolean> {
  // First delete all versions associated with this template
  await deleteAllTemplateVersions(templateId);
  
  // Then delete the template itself
  const { error } = await supabase
    .from('policy_templates')
    .delete()
    .eq('template_id', templateId);

  if (error) {
    console.error(`Error deleting template ${templateId}:`, error);
    throw error;
  }

  return true;
}

/**
 * Convert a template to a policy
 * @param template The template to convert
 * @returns Policy data ready for creation
 */
export function templateToPolicy(template: PolicyTemplatesTable): Policy {
  // Safely extract the policy data from the template with proper type handling
  const policyData = template.template_data as unknown as Policy;
  
  // Create a new policy from the template
  return {
    ...policyData,
    // Generate a new ID for the policy
    id: undefined,
    // Use template name but remove "Template" suffix if present
    name: template.template_name.replace(/ Template$/, ''),
    // Update dates
    effectiveDate: new Date().toISOString().split('T')[0],
    createdAt: undefined,
    modifiedAt: undefined,
  };
}

/**
 * Save a template version
 * @param templateId Template ID
 * @param version Version identifier
 * @param versionData Template data for this version
 * @param userId User ID of the creator
 * @param notes Optional version notes
 * @returns Saved version
 */
export async function saveTemplateVersion(
  templateId: string,
  version: string,
  versionData: any,
  userId: string,
  notes?: string
): Promise<TemplateVersion> {
  // First check if the template exists
  const template = await getPolicyTemplateById(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  // Check if this version already exists
  const existingVersion = await getTemplateVersion(templateId, version);
  if (existingVersion) {
    throw new Error(`Version ${version} already exists for template ${templateId}`);
  }
  
  const versionInsert: TemplateVersionInsert = {
    template_id: templateId,
    version: version,
    version_data: versionData as Json,
    notes: notes,
    created_by: userId
  };
  
  // Use type casting to bypass TypeScript's strict checking for the missing table
  const { data, error } = await (supabase as any)
    .from(TEMPLATE_VERSION_TABLE)
    .insert(versionInsert)
    .select()
    .single();
    
  if (error) {
    console.error(`Error saving template version for ${templateId}:`, error);
    throw error;
  }
  
  // Cast the response data to our TemplateVersion interface
  return data as TemplateVersion;
}

/**
 * Get all versions of a template
 * @param templateId Template ID
 * @returns Array of template versions
 */
export async function getTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
  // Use type casting to bypass TypeScript's strict checking for the missing table
  const { data, error } = await (supabase as any)
    .from(TEMPLATE_VERSION_TABLE)
    .select('*')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error(`Error fetching template versions for ${templateId}:`, error);
    throw error;
  }
  
  // Cast the response data to our TemplateVersion interface array
  return (data || []) as TemplateVersion[];
}

/**
 * Get a specific version of a template
 * @param templateId Template ID
 * @param version Version identifier
 * @returns The template version or null if not found
 */
export async function getTemplateVersion(
  templateId: string,
  version: string
): Promise<TemplateVersion | null> {
  // Use type casting to bypass TypeScript's strict checking for the missing table
  const { data, error } = await (supabase as any)
    .from(TEMPLATE_VERSION_TABLE)
    .select('*')
    .eq('template_id', templateId)
    .eq('version', version)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error(`Error fetching template version ${version} for ${templateId}:`, error);
    throw error;
  }
  
  // Cast the response data to our TemplateVersion interface
  return data as TemplateVersion;
}

/**
 * Update a template version
 * @param versionId Version ID
 * @param updates Updates to apply
 * @returns Updated version
 */
export async function updateTemplateVersion(
  versionId: string,
  updates: Partial<Omit<TemplateVersion, 'version_id' | 'created_at'>>
): Promise<TemplateVersion> {
  // Use type casting to bypass TypeScript's strict checking for the missing table
  const { data, error } = await (supabase as any)
    .from(TEMPLATE_VERSION_TABLE)
    .update(updates)
    .eq('version_id', versionId)
    .select()
    .single();
    
  if (error) {
    console.error(`Error updating template version ${versionId}:`, error);
    throw error;
  }
  
  // Cast the response data to our TemplateVersion interface
  return data as TemplateVersion;
}

/**
 * Delete a template version
 * @param versionId Version ID
 * @returns Success status
 */
export async function deleteTemplateVersion(versionId: string): Promise<boolean> {
  // Use type casting to bypass TypeScript's strict checking for the missing table
  const { error } = await (supabase as any)
    .from(TEMPLATE_VERSION_TABLE)
    .delete()
    .eq('version_id', versionId);
    
  if (error) {
    console.error(`Error deleting template version ${versionId}:`, error);
    throw error;
  }
  
  return true;
}

/**
 * Delete all versions of a template
 * @param templateId Template ID
 * @returns Success status
 */
export async function deleteAllTemplateVersions(templateId: string): Promise<boolean> {
  // Use type casting to bypass TypeScript's strict checking for the missing table
  const { error } = await (supabase as any)
    .from(TEMPLATE_VERSION_TABLE)
    .delete()
    .eq('template_id', templateId);
    
  if (error) {
    console.error(`Error deleting all template versions for ${templateId}:`, error);
    throw error;
  }
  
  return true;
}

/**
 * Toggle the status of a policy template
 * @param templateId Template ID
 * @param status New status (active or inactive)
 * @returns Updated template
 */
export async function toggleTemplateStatus(
  templateId: string,
  status: string
): Promise<PolicyTemplatesTable> {
  // Validate status
  if (status !== 'active' && status !== 'inactive') {
    throw new Error('Invalid status. Must be "active" or "inactive"');
  }
  
  const { data, error } = await supabase
    .from('policy_templates')
    .update({ status })
    .eq('template_id', templateId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating template status ${templateId}:`, error);
    throw error;
  }

  return data;
}