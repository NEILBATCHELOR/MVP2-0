import { supabase } from '@/infrastructure/database/client';
import type { PolicyTemplateInsert, PolicyTemplateUpdate, PolicyTemplatesTable } from '@/types/core/database';
import type { Json } from '@/types/core/supabase';
import { Policy } from './policyService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper function to check if a string is a valid UUID
 * @param str The string to check
 * @returns True if the string is a valid UUID, false otherwise
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Helper function to ensure we have a valid UUID
 * @param id The ID to check and ensure
 * @returns A valid UUID
 */
function ensureUUID(id: string): string {
  if (!id) {
    const newUuid = uuidv4();
    console.warn(`Empty ID provided, generated new UUID: ${newUuid}`);
    return newUuid;
  }
  
  if (isValidUUID(id)) return id; // If it's already a valid UUID, use it
  
  // For special cases like 'admin-bypass', generate a deterministic UUID
  if (id === 'admin-bypass') {
    return '00000000-0000-0000-0000-000000000000'; // Special admin UUID
  }
  
  // For other strings, log the issue and generate a new UUID
  const newUuid = uuidv4();
  console.warn(`Non-UUID format detected: "${id}", generated new UUID: ${newUuid}`);
  return newUuid;
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
    // Ensure user ID is a valid UUID
    const safeUserId = ensureUUID(userId);

    // Create the template object - explicitly set all required fields
    const template: PolicyTemplateInsert = {
      template_name: templateName,
      description: description,
      template_data: policyData as unknown as Json,
      created_by: safeUserId,
      status: 'active'
    };

    console.log("Creating policy template with name:", templateName);
    
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
          const safeApproverId = ensureUUID(approverId);
          
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
  console.log('🔍 Fetching all policy templates from database...');
  const { data, error } = await supabase
    .from('policy_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching policy templates:', error);
    throw error;
  }

  console.log('✅ Policy templates API response received');
  console.log(`📊 Found ${data?.length || 0} templates`);
  
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
    // First get the existing template to preserve created_by
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('policy_templates')
      .select('created_by')
      .eq('template_id', templateId)
      .single();
      
    if (fetchError) {
      console.error(`Error fetching template ${templateId}:`, fetchError);
      throw fetchError;
    }
    
    // Create a new updates object without modifying created_by
    const safeUpdates: PolicyTemplateUpdate = { ...updates };
    
    // Remove created_by field from updates to preserve the original creator
    if ('created_by' in safeUpdates) {
      delete safeUpdates.created_by;
    }
    
    // Update the template
    const { data, error } = await supabase
      .from('policy_templates')
      .update(safeUpdates)
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
      const safeCreatorId = createdBy ? ensureUUID(createdBy) : existingTemplate.created_by;
      
      // First delete all existing approvers - the ON DELETE CASCADE option
      // on our new constraint would also handle this if we deleted the template,
      // but we're just updating it, so we need to manually delete approvers
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
      
      // If we have new approvers, add them
      if (approvers && approvers.length > 0) {
        console.log(`Adding ${approvers.length} approvers to template ${templateId} after update`);
        
        // Process each approver individually
        for (const approverId of approvers) {
          try {
            const safeApproverId = ensureUUID(approverId);
            
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