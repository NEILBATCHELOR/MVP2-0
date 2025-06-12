import { supabase, executeWithRetry } from '@/infrastructure/database/client';
import type { RuleTable, TemplateVersionTable, TemplateVersionInsert } from '@/types/core/database';
import { Json } from '@/types/core/supabase';
import { convertToDatabaseRule } from './ruleService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for rule template
 */
export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  conditions: string;
  actions: string;
  priority: string;
  configFields?: any[];
  version?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Interface for template version
 */
export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  data: any;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

/**
 * Get all rule templates
 * @returns Array of rule templates
 */
export async function getAllRuleTemplates(): Promise<RuleTemplate[]> {
  // Get all templates from the rules table
  const { data, error } = await executeWithRetry(() => 
    supabase
      .from('rules')
      .select('*')
      .eq('is_template', true)
      .order('created_at', { ascending: false })
  );
  
  if (error) {
    console.error('Error fetching rule templates:', error);
    throw error;
  }
  
  // Convert database records to template interface
  const templates: RuleTemplate[] = (data || []).map(record => {
    const details = record.rule_details as Record<string, any> || {};
    
    return {
      id: record.rule_id,
      name: record.rule_name,
      description: (details.description as string) || '',
      category: (details.category as string) || 'general',
      type: record.rule_type,
      conditions: JSON.stringify(details.conditions || []),
      actions: JSON.stringify(details.actions || []),
      priority: (details.priority as string) || 'medium',
      configFields: details.configFields as any[] | undefined,
      version: details.version as string | undefined,
      createdBy: record.created_by,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  });
  
  return templates;
}

/**
 * Get rule template by ID
 * @param templateId Template ID
 * @returns The template or null if not found
 */
export async function getRuleTemplateById(templateId: string): Promise<RuleTemplate | null> {
  const { data, error } = await executeWithRetry(() => 
    supabase
      .from('rules')
      .select('*')
      .eq('rule_id', templateId)
      .eq('is_template', true)
      .single()
  );
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error(`Error fetching template ${templateId}:`, error);
    throw error;
  }
  
  return convertToRuleTemplate(data);
}

/**
 * Create a new rule template
 * @param template Template data
 * @param userId User ID of creator
 * @returns The created template
 */
export async function createRuleTemplate(template: Omit<RuleTemplate, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<RuleTemplate> {
  // Convert to database format
  const dbTemplate = convertToDatabaseRule({
    name: template.name,
    type: template.type,
    description: template.description,
    category: template.category,
    conditions: template.conditions,
    actions: template.actions,
    priority: template.priority,
    configFields: template.configFields,
    version: template.version,
    isTemplate: true
  }, userId);
  
  const { data, error } = await executeWithRetry(() => 
    supabase
      .from('rules')
      .insert(dbTemplate)
      .select()
      .single()
  );
  
  if (error) {
    console.error('Error creating rule template:', error);
    throw error;
  }
  
  return convertToRuleTemplate(data);
}

/**
 * Update a rule template
 * @param templateId Template ID
 * @param updates Template updates
 * @returns The updated template
 */
export async function updateRuleTemplate(templateId: string, updates: Partial<RuleTemplate>): Promise<RuleTemplate> {
  // Check if template exists and is a template
  const existingTemplate = await getRuleTemplateById(templateId);
  
  if (!existingTemplate) {
    throw new Error(`Template ${templateId} not found or is not a template`);
  }
  
  // Prepare updates
  const dbUpdates: any = {};
  
  if (updates.name) dbUpdates.rule_name = updates.name;
  if (updates.description) dbUpdates.rule_details = {
    ...existingTemplate,
    description: updates.description
  };
  
  // Add more fields as needed
  
  const { data, error } = await executeWithRetry(() => 
    supabase
      .from('rules')
      .update({
        ...dbUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('rule_id', templateId)
      .select()
      .single()
  );
  
  if (error) {
    console.error(`Error updating template ${templateId}:`, error);
    throw error;
  }
  
  return convertToRuleTemplate(data);
}

/**
 * Delete a rule template
 * @param templateId Template ID
 * @returns True if successful
 */
export async function deleteRuleTemplate(templateId: string): Promise<boolean> {
  // Check if template exists and is a template
  const existingTemplate = await getRuleTemplateById(templateId);
  
  if (!existingTemplate) {
    throw new Error(`Template ${templateId} not found or is not a template`);
  }
  
  const { error } = await executeWithRetry(() => 
    supabase
      .from('rules')
      .delete()
      .eq('rule_id', templateId)
  );
  
  if (error) {
    console.error(`Error deleting template ${templateId}:`, error);
    throw error;
  }
  
  return true;
}

/**
 * Create a new version of a template
 * @param templateId Template ID
 * @param version Version number
 * @param data Template data
 * @param userId User ID of creator
 * @param notes Optional version notes
 * @returns The created version
 */
export async function createTemplateVersion(
  templateId: string,
  version: string,
  data: any,
  userId: string,
  notes?: string
): Promise<TemplateVersion> {
  // Check if the template exists
  const template = await getRuleTemplateById(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  // Check if version already exists
  const existingVersions = await getTemplateVersions(templateId);
  const versionExists = existingVersions.some(v => v.version === version);
  
  if (versionExists) {
    throw new Error(`Version ${version} already exists for template ${templateId}`);
  }
  
  // Define the insert payload with proper types
  const versionInsert: TemplateVersionInsert = {
    template_id: templateId,
    version: version,
    version_data: data as Json,
    notes: notes,
    created_by: userId,
  };
  
  // Manually cast to any to bypass TypeScript's type checking for the mismatched table name
  // In production, the Supabase schema should be updated to include this table
  const { data: versionData, error } = await executeWithRetry(() => 
    (supabase as any)
      .from('template_versions')
      .insert(versionInsert)
      .select()
      .single()
  );
  
  if (error) {
    console.error(`Error creating template version for ${templateId}:`, error);
    throw error;
  }
  
  // Map the database record to our interface
  return {
    id: versionData.version_id,
    templateId: versionData.template_id,
    version: versionData.version,
    data: versionData.version_data,
    notes: versionData.notes,
    createdAt: versionData.created_at,
    createdBy: versionData.created_by
  };
}

/**
 * Get all versions of a template
 * @param templateId Template ID
 * @returns Array of template versions
 */
export async function getTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
  // First check if the template exists
  const template = await getRuleTemplateById(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  // Get all versions for this template
  // Manually cast to any to bypass TypeScript's type checking for the mismatched table name
  const { data, error } = await executeWithRetry(() => 
    (supabase as any)
      .from('template_versions')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false })
  );
  
  if (error) {
    console.error(`Error fetching template versions for ${templateId}:`, error);
    throw error;
  }
  
  // Convert to our interface format
  return (data || []).map((version: TemplateVersionTable) => ({
    id: version.version_id,
    templateId: version.template_id,
    version: version.version,
    data: version.version_data,
    notes: version.notes,
    createdAt: version.created_at,
    createdBy: version.created_by
  }));
}

/**
 * Delete a template version
 * @param versionId Version ID
 * @returns True if successful
 */
export async function deleteTemplateVersion(versionId: string): Promise<boolean> {
  // Manually cast to any to bypass TypeScript's type checking for the mismatched table name
  const { error } = await executeWithRetry(() => 
    (supabase as any)
      .from('template_versions')
      .delete()
      .eq('version_id', versionId)
  );
  
  if (error) {
    console.error(`Error deleting template version ${versionId}:`, error);
    throw error;
  }
  
  return true;
}

/**
 * Convert from database rule to template format
 * @param dbRule Database rule
 * @returns Rule template
 */
function convertToRuleTemplate(dbRule: RuleTable): RuleTemplate {
  // Ensure rule_details is an object before accessing properties
  const details = typeof dbRule.rule_details === 'object' && dbRule.rule_details !== null
    ? dbRule.rule_details
    : {};
  
  return {
    id: dbRule.rule_id,
    name: dbRule.rule_name,
    description: typeof details === 'object' && 'description' in details ? String(details.description) : '',
    category: typeof details === 'object' && 'category' in details ? String(details.category) : 'Transaction',
    type: dbRule.rule_type,
    conditions: typeof details === 'object' && 'conditions' in details ? String(details.conditions) : '',
    actions: typeof details === 'object' && 'actions' in details ? String(details.actions) : '',
    priority: typeof details === 'object' && 'priority' in details ? String(details.priority) : 'medium',
    configFields: typeof details === 'object' && 'configFields' in details ? details.configFields as any[] : [],
    version: typeof details === 'object' && 'version' in details ? String(details.version) : '1.0.0',
    createdBy: dbRule.created_by,
    createdAt: dbRule.created_at,
    updatedAt: dbRule.updated_at
  };
}