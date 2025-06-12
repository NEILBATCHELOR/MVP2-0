import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/infrastructure/auth/AuthProvider';
import type { PolicyRule } from '@/types/domain/policy/rules';
import { 
  getAllRules,
  getAllRuleTemplates,
  createRule,
  updateRule,
  deleteRule,
  getRuleById,
  batchSaveRules,
  createRuleTemplate
} from '@/services/rule/enhancedRuleService';
import { detectRuleConflicts, RuleConflict } from '@/services/rule/ruleConflictService';
import { createEmptyRule } from '@/services/rule/ruleFactory';
import { useToast } from '@/components/ui/use-toast';

// Type for search query to implement missing searchRules functionality
interface RuleSearchQuery {
  name?: string;
  type?: string[];
  status?: 'active' | 'inactive';
  priority?: 'high' | 'medium' | 'low';
  policyId?: string;
  isTemplate?: boolean;
}

/**
 * Enhanced hook for managing rules with improved type safety and conflict detection
 */
export function useEnhancedRules(options?: {
  detectConflicts?: boolean;
  autoLoadTemplates?: boolean;
}) {
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [templates, setTemplates] = useState<PolicyRule[]>([]);
  const [conflicts, setConflicts] = useState<RuleConflict[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id || 'admin-bypass';
  
  // Default options
  const detectConflicts = options?.detectConflicts ?? true;
  const autoLoadTemplates = options?.autoLoadTemplates ?? true;

  /**
   * Load all rules and check for conflicts
   */
  const loadRules = useCallback(async (filterOptions?: {
    status?: string;
    policyId?: string;
    type?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load rules from database - include templates based on status filter
      const includeTemplates = false; // Default to not including templates
      const loadedRules = await getAllRules(includeTemplates);
      
      // Convert to expected PolicyRule type from rules.ts
      const typedRules = loadedRules as unknown as PolicyRule[];
      setRules(typedRules);
      
      // Detect conflicts if enabled
      if (detectConflicts) {
        const detectedConflicts = detectRuleConflicts(typedRules);
        setConflicts(detectedConflicts);
        
        // Notify if conflicts found
        if (detectedConflicts.length > 0) {
          toast({
            title: `${detectedConflicts.length} rule conflicts detected`,
            description: "Check the rules for potential issues",
            variant: "destructive", // Changed from "warning" to "destructive" which is supported
          });
        }
      }
      
      return typedRules;
    } catch (err) {
      console.error('Error loading rules:', err);
      setError(err instanceof Error ? err : new Error('Failed to load rules'));
      toast({
        title: "Error loading rules",
        description: "Could not load rules from database",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [detectConflicts, toast]);

  /**
   * Load rule templates
   */
  const loadTemplates = useCallback(async (ruleType?: string) => {
    try {
      setTemplatesLoading(true);
      
      // Load templates from database
      const loadedTemplates = await getAllRuleTemplates();
      
      // Filter by type if specified
      const filteredTemplates = ruleType 
        ? loadedTemplates.filter(t => t.type === ruleType)
        : loadedTemplates;
        
      // Convert to expected PolicyRule type from rules.ts
      const typedTemplates = filteredTemplates as unknown as PolicyRule[];
      setTemplates(typedTemplates);
      
      return typedTemplates;
    } catch (err) {
      console.error('Error loading rule templates:', err);
      toast({
        title: "Error loading templates",
        description: "Could not load rule templates from database",
        variant: "destructive",
      });
      return [];
    } finally {
      setTemplatesLoading(false);
    }
  }, [toast]);

  /**
   * Get a single rule by ID
   */
  const getRule = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const rule = await getRuleById(id);
      // Convert to expected PolicyRule type
      return rule as unknown as PolicyRule;
    } catch (err) {
      console.error(`Error getting rule ${id}:`, err);
      toast({
        title: "Error fetching rule",
        description: `Could not get rule with ID ${id}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Create a new rule
   */
  const addRule = useCallback(async (rule: PolicyRule) => {
    try {
      setLoading(true);
      
      // Create rule in database
      // Convert to enhancedRuleService's PolicyRule type
      const serviceRule = rule as any;
      const savedRule = await createRule(serviceRule, userId);
      
      // Update local state - convert back to expected PolicyRule type
      const typedRule = savedRule as unknown as PolicyRule;
      setRules(prevRules => [...prevRules, typedRule]);
      
      // Detect conflicts
      if (detectConflicts) {
        const updatedRules = [...rules, typedRule];
        const detectedConflicts = detectRuleConflicts(updatedRules);
        setConflicts(detectedConflicts);
      }
      
      toast({
        title: "Rule created",
        description: "The rule has been saved to the database",
      });
      
      return typedRule;
    } catch (err) {
      console.error('Error creating rule:', err);
      toast({
        title: "Error creating rule",
        description: "The rule could not be saved to the database",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, rules, detectConflicts, toast]);

  /**
   * Update an existing rule
   */
  const updateExistingRule = useCallback(async (id: string, updates: Partial<PolicyRule>) => {
    try {
      setLoading(true);
      
      // Update rule in database
      const updatedRule = await updateRule(id, updates as any, userId);
      
      // Update local state
      const typedRule = updatedRule as unknown as PolicyRule;
      setRules(prevRules => 
        prevRules.map(rule => rule.id === id ? typedRule : rule)
      );
      
      // Detect conflicts
      if (detectConflicts) {
        const updatedRules = rules.map(rule => rule.id === id ? typedRule : rule);
        const detectedConflicts = detectRuleConflicts(updatedRules);
        setConflicts(detectedConflicts);
      }
      
      toast({
        title: "Rule updated",
        description: "The rule has been updated in the database",
      });
      
      return typedRule;
    } catch (err) {
      console.error(`Error updating rule ${id}:`, err);
      toast({
        title: "Error updating rule",
        description: "The rule could not be updated in the database",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [rules, detectConflicts, toast, userId]);

  /**
   * Delete a rule
   */
  const removeRule = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      // Delete rule from database
      await deleteRule(id);
      
      // Update local state
      setRules(prevRules => prevRules.filter(rule => rule.id !== id));
      
      // Detect conflicts
      if (detectConflicts) {
        const updatedRules = rules.filter(rule => rule.id !== id);
        const detectedConflicts = detectRuleConflicts(updatedRules);
        setConflicts(detectedConflicts);
      }
      
      toast({
        title: "Rule deleted",
        description: "The rule has been removed from the database",
      });
      
      return true;
    } catch (err) {
      console.error(`Error deleting rule ${id}:`, err);
      toast({
        title: "Error deleting rule",
        description: "The rule could not be deleted from the database",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [rules, detectConflicts, toast]);

  /**
   * Save a rule as a template
   */
  const saveRuleAsTemplate = useCallback(async (rule: PolicyRule, templateName: string) => {
    try {
      setLoading(true);
      
      // Save rule as template
      const templateRule = {
        ...rule,
        name: templateName,
        isTemplate: true,
      };
      
      // Convert to service type
      const serviceRule = templateRule as any;
      const savedTemplate = await createRuleTemplate(serviceRule, userId);
      
      // Update templates list - convert back to expected PolicyRule type
      const typedTemplate = savedTemplate as unknown as PolicyRule;
      setTemplates(prevTemplates => [...prevTemplates, typedTemplate]);
      
      toast({
        title: "Template saved",
        description: "The rule template has been saved to the database",
      });
      
      return typedTemplate;
    } catch (err) {
      console.error('Error saving rule template:', err);
      toast({
        title: "Error saving template",
        description: "The rule template could not be saved to the database",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  /**
   * Create a new empty rule of specified type
   */
  const createEmptyRuleOfType = useCallback((type: string): PolicyRule => {
    return createEmptyRule(type) as PolicyRule;
  }, []);

  /**
   * Batch save multiple rules (for policies)
   */
  const saveBatchRules = useCallback(async (rulesToSave: PolicyRule[], policyId?: string) => {
    try {
      setLoading(true);
      
      // Convert to service type
      const serviceRules = rulesToSave as any[];
      
      // Save rules in batch
      const savedRules = await batchSaveRules(serviceRules, userId, policyId);
      
      // Update local state if rules are loaded
      if (rules.length > 0) {
        // Update existing rules and add new ones
        const existingIds = rules.map(r => r.id);
        const updatedRules = [...rules];
        
        // Convert saved rules back to expected PolicyRule type
        const typedSavedRules = savedRules as unknown as PolicyRule[];
        
        typedSavedRules.forEach(savedRule => {
          const index = updatedRules.findIndex(r => r.id === savedRule.id);
          if (index !== -1) {
            updatedRules[index] = savedRule;
          } else {
            updatedRules.push(savedRule);
          }
        });
        
        setRules(updatedRules);
        
        // Detect conflicts
        if (detectConflicts) {
          const detectedConflicts = detectRuleConflicts(updatedRules);
          setConflicts(detectedConflicts);
        }
      }
      
      // Convert to expected PolicyRule type
      return savedRules as unknown as PolicyRule[];
    } catch (err) {
      console.error('Error batch saving rules:', err);
      toast({
        title: "Error saving rules",
        description: "The rules could not be saved to the database",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, rules, detectConflicts, toast]);

  /**
   * Search for rules based on criteria
   */
  const searchForRules = useCallback(async (query: {
    name?: string;
    type?: string[];
    status?: 'active' | 'inactive';
    priority?: 'high' | 'medium' | 'low';
    policyId?: string;
  }) => {
    try {
      setLoading(true);
      
      // Implementation for searchRules since it's missing
      // This is a simplified version that filters already loaded rules
      // In a real implementation this would call a backend API
      
      // Get all rules first as a base
      const allRules = await getAllRules(false);
      const typedAllRules = allRules as unknown as PolicyRule[];
      
      // Filter based on query parameters
      const filteredRules = typedAllRules.filter(rule => {
        // Name filter - case insensitive partial match
        if (query.name && !rule.name?.toLowerCase().includes(query.name.toLowerCase())) {
          return false;
        }
        
        // Type filter - match any in array
        if (query.type?.length && !query.type.includes(rule.type || '')) {
          return false;
        }
        
        // Status filter
        if (query.status === 'active' && rule.enabled === false) {
          return false;
        }
        if (query.status === 'inactive' && rule.enabled !== false) {
          return false;
        }
        
        // Priority filter
        if (query.priority && rule.priority !== query.priority) {
          return false;
        }
        
        // Policy ID filter
        if (query.policyId && rule.policyId !== query.policyId) {
          return false;
        }
        
        return true;
      });
      
      // Update local state
      setRules(filteredRules);
      
      // Detect conflicts if needed
      if (detectConflicts) {
        const detectedConflicts = detectRuleConflicts(filteredRules);
        setConflicts(detectedConflicts);
      }
      
      return filteredRules;
    } catch (err) {
      console.error('Error searching rules:', err);
      toast({
        title: "Error searching rules",
        description: "Could not search for rules in the database",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [detectConflicts, toast]);

  // Load rules and templates on initial mount
  useEffect(() => {
    loadRules();
    
    if (autoLoadTemplates) {
      loadTemplates();
    }
  }, [loadRules, loadTemplates, autoLoadTemplates]);

  return {
    rules,
    templates,
    conflicts,
    loading,
    templatesLoading,
    error,
    loadRules,
    loadTemplates,
    getRule,
    addRule,
    updateRule: updateExistingRule,
    deleteRule: removeRule,
    saveAsTemplate: saveRuleAsTemplate,
    createEmptyRule: createEmptyRuleOfType,
    batchSaveRules: saveBatchRules,
    searchRules: searchForRules,
  };
}