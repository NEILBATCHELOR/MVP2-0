import { supabase, executeWithRetry } from '@/infrastructure/database/client';
import type { RuleInsert, RuleUpdate, RuleTable } from '@/types/core/database';

/**
 * Get all rules
 * @returns Array of rules
 */
export async function getAllRules(): Promise<RuleTable[]> {
  const { data, error } = await executeWithRetry(() => 
    supabase
      .from('rules')
      .select('*')
      .order('created_at', { ascending: false })
  );
  
  if (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Fetch rule templates from the database
 * @returns Array of rule templates
 */
export async function getRuleTemplates(): Promise<RuleTable[]> {
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
  
  return data || [];
}

/**
 * Create a new rule template
 * @param template The template to create
 * @returns The created template
 */
export async function createRuleTemplate(template: RuleInsert): Promise<RuleTable> {
  // Mark as template
  const templateData = {
    ...template,
    is_template: true,
  };
  
  const { data, error } = await executeWithRetry(() => 
    supabase
      .from('rules')
      .insert(templateData)
      .select()
      .single()
  );
  
  if (error) {
    console.error('Error creating rule template:', error);
    throw error;
  }
  
  return data;
}

/**
 * Fetch a single rule by ID
 * @param ruleId The ID of the rule to fetch
 * @returns The rule object or null if not found
 */
export async function getRuleById(ruleId: string): Promise<RuleTable | null> {
  const { data, error } = await executeWithRetry(() => 
    supabase
      .from('rules')
      .select('*')
      .eq('rule_id', ruleId)
      .single()
  );
  
  if (error) {
    console.error(`Error fetching rule ${ruleId}:`, error);
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw error;
  }
  
  return data;
}

/**
 * Create a new rule
 * @param rule The rule to create
 * @returns The created rule
 */
export async function createRule(rule: RuleInsert): Promise<RuleTable> {
  try {
    // Ensure this is not marked as a template by default
    const ruleData = {
      ...rule,
      is_template: rule.is_template !== undefined ? rule.is_template : false,
    };
    
    console.log('Creating new rule:', ruleData.rule_name);
    
    const { data, error } = await executeWithRetry(() => 
      supabase
        .from('rules')
        .insert(ruleData)
        .select()
        .single()
    );
    
    if (error) {
      console.error('Error creating rule:', error);
      console.error('Rule data:', JSON.stringify(ruleData));
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create rule - no data returned');
    }
    
    console.log(`Rule created successfully with ID: ${data.rule_id}`);
    return data;
  } catch (error) {
    console.error('Error in createRule:', error);
    throw error;
  }
}

/**
 * Update an existing rule
 * @param ruleId The ID of the rule to update
 * @param updates The fields to update
 * @returns The updated rule
 */
export async function updateRule(ruleId: string, updates: RuleUpdate): Promise<RuleTable> {
  const { data, error } = await executeWithRetry(() => 
    supabase
      .from('rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('rule_id', ruleId)
      .select()
      .single()
  );
  
  if (error) {
    console.error(`Error updating rule ${ruleId}:`, error);
    throw error;
  }
  
  return data;
}

/**
 * Delete a rule
 * @param ruleId The ID of the rule to delete
 * @returns True if successful
 */
export async function deleteRule(ruleId: string): Promise<boolean> {
  const { error } = await executeWithRetry(() => 
    supabase
      .from('rules')
      .delete()
      .eq('rule_id', ruleId)
  );
  
  if (error) {
    console.error(`Error deleting rule ${ruleId}:`, error);
    throw error;
  }
  
  return true;
}

/**
 * Deactivate a rule (soft delete)
 * @param ruleId The ID of the rule to deactivate
 * @returns The updated rule
 */
export async function deactivateRule(ruleId: string): Promise<RuleTable> {
  return updateRule(ruleId, { status: 'inactive' });
}

/**
 * Convert from UI rule format to database format
 * @param uiRule Rule in UI format
 * @param createdBy User who created the rule
 * @returns Rule in database format
 */
export function convertToDatabaseRule(uiRule: any, createdBy: string): RuleInsert {
  return {
    rule_name: uiRule.name,
    rule_type: uiRule.type,
    rule_details: uiRule,
    created_by: createdBy,
    status: uiRule.enabled ? 'active' : 'inactive',
    is_template: uiRule.isTemplate || false,
  };
}

/**
 * Convert from database rule format to UI format
 * @param dbRule Rule from database
 * @returns Rule in UI format
 */
export function convertToUIRule(dbRule: RuleTable): any {
  // Initialize an empty UI rule object
  const uiRule: any = {};
  
  // Copy rule_details properties if available
  if (dbRule.rule_details && typeof dbRule.rule_details === 'object') {
    Object.assign(uiRule, dbRule.rule_details);
  }
  
  // Add database metadata
  uiRule.id = dbRule.rule_id;
  uiRule.enabled = dbRule.status === 'active';
  uiRule.isTemplate = dbRule.is_template;
  uiRule.name = dbRule.rule_name || uiRule.name || '';
  uiRule.type = dbRule.rule_type || uiRule.type || 'transaction';
  
  return uiRule;
}