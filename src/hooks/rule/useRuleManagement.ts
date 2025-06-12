import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/infrastructure/auth/AuthProvider';
import { 
  getAllRules, 
  getRuleById, 
  createRule, 
  updateRule, 
  deleteRule,
  createRuleTemplate,
  getAllRuleTemplates,
  PolicyRule,
  saveRuleApprovers,
  getRuleApprovers
} from '@/services/rule/enhancedRuleService';
import { ensureUUID } from '@/services/policy/approvalService';

// Extend PolicyRule type to include approvers
interface ExtendedPolicyRule extends PolicyRule {
  approvers?: Array<{ id: string }>;
}

export function useRuleManagement() {
  const { user } = useAuth();
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [templates, setTemplates] = useState<PolicyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all rules and templates
  const loadRules = useCallback(async (includeTemplates: boolean = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const rulesData = await getAllRules(includeTemplates);
      setRules(rulesData.filter(rule => !rule.isTemplate));
      
      if (includeTemplates) {
        const templatesData = await getAllRuleTemplates();
        setTemplates(templatesData);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading rules');
      console.error('Error loading rules:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadRules(true);
    }
  }, [user, loadRules]);

  // Save a rule
  const saveRule = useCallback(async (rule: ExtendedPolicyRule) => {
    if (!user) return null;
    
    try {
      setError(null);
      
      // Get safe UUID for user ID
      const safeUserId = ensureUUID(user.id);
      
      let savedRule;
      if (rule.id) {
        // Update existing rule
        savedRule = await updateRule(rule.id, rule, safeUserId);
      } else {
        // Create new rule
        savedRule = await createRule(rule, safeUserId);
      }
      
      // If approvers are included, save them
      if (rule.approvers && Array.isArray(rule.approvers)) {
        const approverIds = rule.approvers.map((approver: any) => approver.id);
        await saveRuleApprovers(savedRule.id as string, approverIds, safeUserId);
      }
      
      // Refresh the rules list
      await loadRules(true);
      
      return savedRule;
    } catch (err: any) {
      setError(err.message || 'Error saving rule');
      console.error('Error saving rule:', err);
      return null;
    }
  }, [user, loadRules]);

  // Save a rule template
  const saveRuleTemplate = useCallback(async (rule: ExtendedPolicyRule) => {
    if (!user) return null;
    
    try {
      setError(null);
      
      // Get safe UUID for user ID
      const safeUserId = ensureUUID(user.id);
      
      // Mark as template
      const template = { ...rule, isTemplate: true } as ExtendedPolicyRule;
      
      const savedTemplate = await createRuleTemplate(template, safeUserId);
      
      // If approvers are included, save them
      if (template.approvers && Array.isArray(template.approvers)) {
        const approverIds = template.approvers.map((approver: any) => approver.id);
        await saveRuleApprovers(savedTemplate.id as string, approverIds, safeUserId);
      }
      
      // Refresh the templates list
      await loadRules(true);
      
      return savedTemplate;
    } catch (err: any) {
      setError(err.message || 'Error saving rule template');
      console.error('Error saving rule template:', err);
      return null;
    }
  }, [user, loadRules]);

  // Delete a rule
  const removeRule = useCallback(async (ruleId: string) => {
    if (!user) return false;
    
    try {
      setError(null);
      
      await deleteRule(ruleId);
      
      // Refresh the rules list
      await loadRules(true);
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Error deleting rule');
      console.error('Error deleting rule:', err);
      return false;
    }
  }, [user, loadRules]);

  // Get a rule by ID
  const getRule = useCallback(async (ruleId: string) => {
    if (!user) return null;
    
    try {
      setError(null);
      
      const rule = await getRuleById(ruleId) as ExtendedPolicyRule;
      
      // If approvers are included, get them
      if (rule && rule.id) {
        const approverIds = await getRuleApprovers(rule.id);
        
        // If we have approver IDs, add them to the rule
        if (approverIds.length > 0) {
          rule.approvers = approverIds.map(id => ({ id }));
        }
      }
      
      return rule;
    } catch (err: any) {
      setError(err.message || 'Error getting rule');
      console.error('Error getting rule:', err);
      return null;
    }
  }, [user]);

  return {
    rules,
    templates,
    loading,
    error,
    loadRules,
    saveRule,
    saveRuleTemplate,
    removeRule,
    getRule
  };
}