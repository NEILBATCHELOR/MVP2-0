import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/infrastructure/auth/AuthProvider';
import {
  getAllRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  convertToUIRule,
  convertToDatabaseRule
} from '@/services/rule/ruleService';
import {
  getAllRuleTemplates,
  getRuleTemplateById,
  createRuleTemplate,
  updateRuleTemplate,
  deleteRuleTemplate,
  createTemplateVersion,
  getTemplateVersions,
  deleteTemplateVersion,
  RuleTemplate,
  TemplateVersion
} from '@/services/rule/ruleTemplateService';
import type { RuleTable } from '@/types/core/database';

/**
 * Interface for logical rule groups
 */
export interface LogicalRuleGroup {
  operator: 'AND' | 'OR';
  ruleIds: string[];
}

/**
 * Hook for managing rules and rule templates
 */
export function useRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [templateVersions, setTemplateVersions] = useState<Record<string, TemplateVersion[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(false);
  const [versionsLoading, setVersionsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const userId = user?.id || 'admin-bypass';
  
  // Add refs to track loading status
  const initialRulesLoadCompleted = useRef(false);
  const initialTemplatesLoadCompleted = useRef(false);
  const isLoadingRules = useRef(false);
  const isLoadingTemplates = useRef(false);
  const loadingTimerRef = useRef<number | null>(null);
  const templatesTimerRef = useRef<number | null>(null);

  // Load all rules with debounce protection
  const loadRules = useCallback(async (status?: string): Promise<any[]> => {
    // Prevent duplicate concurrent requests
    if (isLoadingRules.current) {
      console.log('[useRules] Skipping rules load - already loading');
      return rules;
    }
    
    try {
      isLoadingRules.current = true;
      setLoading(true);
      setError(null);
      console.log('[useRules] Loading rules...');
      
      // Call getAllRules with boolean parameter for includeTemplates (false)
      const dbRules = await getAllRules();
      const uiRules = dbRules.map(convertToUIRule);
      
      console.log(`[useRules] Loaded ${uiRules.length} rules`);
      setRules(uiRules);
      initialRulesLoadCompleted.current = true;
      return uiRules;
    } catch (err) {
      console.error('[useRules] Error loading rules:', err);
      setError(err instanceof Error ? err : new Error('Failed to load rules'));
      return [];
    } finally {
      isLoadingRules.current = false;
      setLoading(false);
    }
  }, []);  // Removed dependencies to prevent re-creation

  // Initialize rules on mount
  useEffect(() => {
    // Skip if already loaded
    if (initialRulesLoadCompleted.current) {
      console.log('[useRules] Skipping rules load - already loaded');
      return;
    }
    
    // Clear any existing timer
    if (loadingTimerRef.current) {
      window.clearTimeout(loadingTimerRef.current);
    }
    
    // Set a debounce timer
    loadingTimerRef.current = window.setTimeout(() => {
      console.log('[useRules] Initial rules load');
      loadRules();
    }, 300);
    
    return () => {
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
      }
    };
  }, []); // Only run once on mount

  // Create a new rule
  const createNewRule = useCallback(async (rule: any): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const dbRule = convertToDatabaseRule(rule, userId);
      const createdRule = await createRule(dbRule);
      const uiRule = convertToUIRule(createdRule);
      
      // Update rules state
      setRules(prevRules => [uiRule, ...prevRules]);
      
      return uiRule;
    } catch (err) {
      console.error('[useRules] Error creating rule:', err);
      setError(err instanceof Error ? err : new Error('Failed to create rule'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load all rule templates with debounce protection
  const loadTemplates = useCallback(async (forceRefresh = false): Promise<RuleTemplate[]> => {
    // If templates are already loaded and no refresh is requested, return cached data
    if (templates.length > 0 && !forceRefresh && initialTemplatesLoadCompleted.current) {
      console.log('[useRules] Using cached templates');
      return templates;
    }
    
    // Prevent duplicate concurrent requests
    if (isLoadingTemplates.current && !forceRefresh) {
      console.log('[useRules] Skipping templates load - already loading');
      return templates;
    }
    
    try {
      isLoadingTemplates.current = true;
      setTemplatesLoading(true);
      setError(null);
      console.log('[useRules] Loading templates...');
      
      const loadedTemplates = await getAllRuleTemplates();
      
      console.log(`[useRules] Loaded ${loadedTemplates.length} templates`);
      setTemplates(loadedTemplates);
      initialTemplatesLoadCompleted.current = true;
      return loadedTemplates;
    } catch (err) {
      console.error('[useRules] Error loading rule templates:', err);
      setError(err instanceof Error ? err : new Error('Failed to load rule templates'));
      return [];
    } finally {
      isLoadingTemplates.current = false;
      setTemplatesLoading(false);
    }
  }, []); // Removed dependencies to prevent re-creation

  // Initialize templates on mount
  useEffect(() => {
    // Skip if already loaded
    if (initialTemplatesLoadCompleted.current) {
      console.log('[useRules] Skipping templates load - already loaded');
      return;
    }
    
    // Clear any existing timer
    if (templatesTimerRef.current) {
      window.clearTimeout(templatesTimerRef.current);
    }
    
    // Set a debounce timer with a small delay after rules load
    templatesTimerRef.current = window.setTimeout(() => {
      console.log('[useRules] Initial templates load');
      loadTemplates();
    }, 500);
    
    return () => {
      if (templatesTimerRef.current) {
        window.clearTimeout(templatesTimerRef.current);
      }
    };
  }, []); // Only run once on mount

  // Load template versions
  const loadTemplateVersions = useCallback(async (templateId: string): Promise<TemplateVersion[]> => {
    try {
      setVersionsLoading(true);
      setError(null);
      
      // Check if versions are already loaded
      if (templateVersions[templateId]?.length > 0) {
        return templateVersions[templateId];
      }
      
      const versions = await getTemplateVersions(templateId);
      
      // Update state
      setTemplateVersions(prev => ({
        ...prev,
        [templateId]: versions
      }));
      
      return versions;
    } catch (err) {
      console.error(`Error loading template versions for ${templateId}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to load template versions for ${templateId}`));
      return [];
    } finally {
      setVersionsLoading(false);
    }
  }, [templateVersions]);

  // Get a rule by ID
  const getRuleByIdWithConversion = useCallback(async (ruleId: string): Promise<any | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const dbRule = await getRuleById(ruleId);
      
      if (!dbRule) return null;
      
      return convertToUIRule(dbRule);
    } catch (err) {
      console.error(`Error getting rule ${ruleId}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to get rule ${ruleId}`));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create rule with logical operators
  const createRuleWithLogicalOperatorsFunc = useCallback(async (
    rule: any, 
    logicalGroups: LogicalRuleGroup[]
  ): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const dbRule = convertToDatabaseRule(rule, userId);
      
      // Create the main rule first
      const createdRule = await createRule(dbRule);
      
      // For now, we're just creating the rule without actual logical groups
      // In a real implementation, we would save the logical groups to a separate table
      
      const uiRule = convertToUIRule(createdRule);
      
      // Update rules state
      setRules(prevRules => [uiRule, ...prevRules]);
      
      return uiRule;
    } catch (err) {
      console.error('Error creating rule with logical operators:', err);
      setError(err instanceof Error ? err : new Error('Failed to create rule with logical operators'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update a rule
  const updateExistingRule = useCallback(async (ruleId: string, updates: any): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get existing rule
      const existingRule = await getRuleById(ruleId);
      
      if (!existingRule) {
        throw new Error(`Rule ${ruleId} not found`);
      }
      
      // Merge existing rule details with updates
      const existingDetails = existingRule.rule_details || {};
      
      // Handle existing details either as an object or as something else
      const detailsObj = typeof existingDetails === 'object' && existingDetails !== null
        ? existingDetails
        : {};
        
      const updatesObj = typeof updates === 'object' && updates !== null
        ? updates
        : {};
      
      const updatedDetails = { ...detailsObj, ...updatesObj };
      
      // Update in database
      const updatedRule = await updateRule(ruleId, {
        rule_name: updates.name || existingRule.rule_name,
        rule_type: updates.type || existingRule.rule_type,
        rule_details: updatedDetails,
        status: updates.enabled === false ? 'inactive' : 'active'
      });
      
      const uiRule = convertToUIRule(updatedRule);
      
      // Update rules state
      setRules(prevRules => 
        prevRules.map(rule => rule.id === ruleId ? uiRule : rule)
      );
      
      return uiRule;
    } catch (err) {
      console.error(`Error updating rule ${ruleId}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to update rule ${ruleId}`));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a rule
  const deleteExistingRule = useCallback(async (ruleId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteRule(ruleId);
      
      // Update rules state
      setRules(prevRules => prevRules.filter(rule => rule.id !== ruleId));
      
      return true;
    } catch (err) {
      console.error(`Error deleting rule ${ruleId}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to delete rule ${ruleId}`));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Duplicate a rule
  const duplicateExistingRule = useCallback(async (ruleId: string, newName?: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the existing rule
      const existingRule = await getRuleById(ruleId);
      
      if (!existingRule) {
        throw new Error(`Rule ${ruleId} not found`);
      }
      
      // Create a duplicate with a new name
      const ruleName = newName || `${existingRule.rule_name} (Copy)`;
      const duplicatedRule = await createRule({
        rule_name: ruleName,
        rule_type: existingRule.rule_type,
        rule_details: existingRule.rule_details,
        created_by: userId,
        status: existingRule.status,
        is_template: existingRule.is_template
      });
      
      const uiRule = convertToUIRule(duplicatedRule);
      
      // Update rules state
      setRules(prevRules => [uiRule, ...prevRules]);
      
      return uiRule;
    } catch (err) {
      console.error(`Error duplicating rule ${ruleId}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to duplicate rule ${ruleId}`));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getRuleById, userId]);

  // Create a new template with automatic refresh
  const createNewTemplate = useCallback(async (template: Omit<RuleTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<RuleTemplate> => {
    try {
      setTemplatesLoading(true);
      setError(null);
      
      const newTemplate = await createRuleTemplate(template, userId);
      
      // Update templates state
      setTemplates(prevTemplates => [newTemplate, ...prevTemplates]);
      
      return newTemplate;
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err instanceof Error ? err : new Error('Failed to create template'));
      throw err;
    } finally {
      setTemplatesLoading(false);
    }
  }, [userId]);

  // Create a new template version
  const createNewTemplateVersion = useCallback(async (
    templateId: string,
    version: string,
    data: any,
    notes?: string
  ): Promise<TemplateVersion> => {
    try {
      setVersionsLoading(true);
      setError(null);
      
      const createdVersion = await createTemplateVersion(templateId, version, data, userId, notes);
      
      // Update template versions state
      setTemplateVersions(prev => {
        const existingVersions = prev[templateId] || [];
        return {
          ...prev,
          [templateId]: [createdVersion, ...existingVersions]
        };
      });
      
      return createdVersion;
    } catch (err) {
      console.error(`Error creating template version for ${templateId}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to create template version for ${templateId}`));
      throw err;
    } finally {
      setVersionsLoading(false);
    }
  }, [userId]);

  // Convert rule to template
  const convertRuleToTemplate = useCallback(async (rule: any): Promise<RuleTemplate> => {
    try {
      setTemplatesLoading(true);
      setError(null);
      
      // Prepare template data
      const templateData: Omit<RuleTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        name: `${rule.name} Template`,
        description: `Template based on "${rule.name}" rule`,
        category: rule.category || 'Transaction',
        type: rule.type,
        conditions: rule.conditions || '',
        actions: rule.actions || '',
        priority: rule.priority || 'medium',
        configFields: rule.configFields || [],
        version: '1.0.0',
        createdBy: userId
      };
      
      return createNewTemplate(templateData);
    } catch (err) {
      console.error('Error converting rule to template:', err);
      setError(err instanceof Error ? err : new Error('Failed to convert rule to template'));
      throw err;
    } finally {
      setTemplatesLoading(false);
    }
  }, [createNewTemplate, userId]);

  // Check if rules exist and create sample if needed
  const ensureRulesExist = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Get current rules
      const existingRules = await getAllRules();
      
      // If no rules exist, create a sample
      if (existingRules.length === 0) {
        const sampleRule = {
          name: "Maximum Transfer Limit",
          type: "transfer_limit",
          description: "Limit transfers to a maximum of $10,000 per day",
          config: { limit: 10000, period: "daily" },
          enabled: true,
          priority: "high",
          category: "Transaction"
        };
        
        await createNewRule(sampleRule);
        return true;
      }
      
      return existingRules.length > 0;
    } catch (err) {
      console.error('Error checking rules:', err);
      setError(err instanceof Error ? err : new Error('Failed to check rules'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [createNewRule]);

  return {
    // Rules
    rules,
    loading,
    error,
    loadRules,
    getRuleById: getRuleByIdWithConversion,
    createRule: createNewRule,
    createRuleWithLogicalOperators: createRuleWithLogicalOperatorsFunc,
    updateRule: updateExistingRule,
    deleteRule: deleteExistingRule,
    duplicateRule: duplicateExistingRule,
    
    // Templates
    templates,
    templatesLoading,
    loadTemplates,
    createTemplate: createNewTemplate,
    convertRuleToTemplate,
    
    // Template versions
    templateVersions,
    versionsLoading,
    loadTemplateVersions,
    createTemplateVersion: createNewTemplateVersion
  };
}