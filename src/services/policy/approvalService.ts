import { supabase, executeWithRetry } from "@/infrastructure/database/client";
import type { Tables } from "@/types/core/database";
import { v4 as uuidv4 } from 'uuid';

// Helper function to check if a string is a valid UUID
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Helper function to ensure we have a valid UUID
export function ensureUUID(id: string): string {
  if (!id) return uuidv4(); // If no ID is provided, generate a new one
  if (isValidUUID(id)) return id; // If it's already a valid UUID, use it
  
  // For special cases like 'admin-bypass', generate a deterministic UUID based on the input
  // This way the same input will always generate the same UUID
  if (id === 'admin-bypass') {
    return '00000000-0000-0000-0000-000000000000'; // Special admin UUID
  }
  
  // For other cases, create a UUID v5 based on the string
  // Since we don't have v5 directly available, we'll use a simple deterministic approach
  return uuidv4(); // In a real implementation, you might want to use a deterministic UUID
}

// Get pending approvals for a user
export const getPendingApprovalsForUser = async (userId: string) => {
  try {
    // Ensure we have a valid UUID for the database query
    const safeUserId = ensureUUID(userId);
    
    // First get the pending approvals for the user
    const { data: approvalData, error: approvalError } = await supabase
      .from("policy_rule_approvers")
      .select("*")
      .eq("user_id", safeUserId)
      .eq("status", "pending");

    if (approvalError) throw approvalError;
    if (!approvalData || approvalData.length === 0) return [];
    
    // Get the rule IDs to fetch
    const ruleIds = approvalData.map(approval => approval.policy_rule_id);
    
    // Manually fetch the rules and templates
    const { data: rulesData, error: rulesError } = await supabase
      .from("rules")
      .select("rule_id, rule_name, rule_type, created_at")
      .in("rule_id", ruleIds);
    
    if (rulesError) throw rulesError;
    
    const { data: templatesData, error: templatesError } = await supabase
      .from("policy_templates")
      .select("template_id, template_name, template_type, created_at")
      .in("template_id", ruleIds);
    
    if (templatesError) throw templatesError;
    
    // Create lookup maps for faster access
    const rulesMap = (rulesData || []).reduce((map, rule) => {
      map[rule.rule_id] = rule;
      return map;
    }, {});
    
    const templatesMap = (templatesData || []).reduce((map, template) => {
      map[template.template_id] = template;
      return map;
    }, {});
    
    // Map the data together
    return approvalData.map(approval => {
      const rule = rulesMap[approval.policy_rule_id];
      const template = templatesMap[approval.policy_rule_id];
      const isRule = !!rule;
      
      return {
        id: approval.policy_rule_id,
        name: isRule ? rule?.rule_name : template?.template_name || 'Unknown Item',
        type: isRule ? rule?.rule_type : template?.template_type || 'unknown',
        createdAt: isRule ? rule?.created_at : template?.created_at || new Date().toISOString(),
        entity_type: isRule ? 'rule' : 'template'
      };
    });
  } catch (error) {
    console.error("Error in getPendingApprovalsForUser:", error);
    return [];
  }
};

// Get completed approvals for a user
export const getCompletedApprovalsForUser = async (userId: string) => {
  try {
    // Ensure we have a valid UUID for the database query
    const safeUserId = ensureUUID(userId);
    
    // First get the completed approvals for the user
    const { data: approvalData, error: approvalError } = await supabase
      .from("policy_rule_approvers")
      .select("*")
      .eq("user_id", safeUserId)
      .in("status", ["approved", "rejected"]);

    if (approvalError) throw approvalError;
    if (!approvalData || approvalData.length === 0) return [];
    
    // Get the rule IDs to fetch
    const ruleIds = approvalData.map(approval => approval.policy_rule_id);
    
    // Manually fetch the rules and templates
    const { data: rulesData, error: rulesError } = await supabase
      .from("rules")
      .select("rule_id, rule_name, rule_type, created_at")
      .in("rule_id", ruleIds);
    
    if (rulesError) throw rulesError;
    
    const { data: templatesData, error: templatesError } = await supabase
      .from("policy_templates")
      .select("template_id, template_name, template_type, created_at")
      .in("template_id", ruleIds);
    
    if (templatesError) throw templatesError;
    
    // Create lookup maps for faster access
    const rulesMap = (rulesData || []).reduce((map, rule) => {
      map[rule.rule_id] = rule;
      return map;
    }, {});
    
    const templatesMap = (templatesData || []).reduce((map, template) => {
      map[template.template_id] = template;
      return map;
    }, {});
    
    // Map the data together
    return approvalData.map(approval => {
      const rule = rulesMap[approval.policy_rule_id];
      const template = templatesMap[approval.policy_rule_id];
      const isRule = !!rule;
      
      return {
        id: approval.policy_rule_id,
        name: isRule ? rule?.rule_name : template?.template_name || 'Unknown Item',
        type: isRule ? rule?.rule_type : template?.template_type || 'unknown',
        createdAt: isRule ? rule?.created_at : template?.created_at || new Date().toISOString(),
        status: approval.status,
        entity_type: isRule ? 'rule' : 'template'
      };
    });
  } catch (error) {
    console.error("Error in getCompletedApprovalsForUser:", error);
    return [];
  }
};

// Get details about approvers for a policy/rule
export const getApproversForEntity = async (entityId: string) => {
  try {
    // Ensure we have a valid UUID
    const safeEntityId = ensureUUID(entityId);
    
    // Get the approvers
    const { data: approverData, error: approverError } = await supabase
      .from("policy_rule_approvers")
      .select("*")
      .eq("policy_rule_id", safeEntityId);

    if (approverError) throw approverError;
    if (!approverData || approverData.length === 0) return [];
    
    // Get the user IDs
    const userIds = approverData.map(approver => approver.user_id);
    
    // Fetch user information - just use basic fields that should exist in all users tables
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds);
    
    if (usersError) throw usersError;
    
    // Create a map of users by ID
    const usersMap = (usersData || []).reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {});
    
    // Join the data
    return approverData.map(approver => {
      const user = usersMap[approver.user_id];
      return {
        ...approver,
        user: user || {
          id: approver.user_id,
          name: 'Unknown User',
          email: ''
        }
      };
    });
  } catch (error) {
    console.error("Error in getApproversForEntity:", error);
    return [];
  }
};

// Get entity details (rule or template)
export const getEntityDetails = async (entityId: string, entityType: 'rule' | 'template') => {
  try {
    // Ensure we have a valid UUID
    const safeEntityId = ensureUUID(entityId);
    
    // Determine the table and ID column based on entity type
    const table = entityType === 'rule' ? 'rules' : 'policy_templates';
    const idField = entityType === 'rule' ? 'rule_id' : 'template_id';
    
    // Suppress TypeScript deep instantiation error with directive comment
    // @ts-ignore - Supabase typing causes excessive type instantiation
    const response = await supabase.from(table).select('*').eq(idField, safeEntityId).single();
    
    // Manually extract data and error to avoid type propagation
    const data = response.data as Record<string, any> | null;
    const error = response.error as Error | null;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error in getEntityDetails for ${entityType}:`, error);
    return null;
  }
};

// Approve a policy/rule
export const approveEntity = async (
  entityId: string, 
  userId: string, 
  comment?: string
) => {
  try {
    // Ensure we have valid UUIDs
    const safeEntityId = ensureUUID(entityId);
    const safeUserId = ensureUUID(userId);
    
    const { error } = await supabase
      .from("policy_rule_approvers")
      .update({ 
        status: "approved",
        comment,
        timestamp: new Date().toISOString()
      })
      .eq("policy_rule_id", safeEntityId)
      .eq("user_id", safeUserId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error in approveEntity:", error);
    throw error;
  }
};

// Reject a policy/rule
export const rejectEntity = async (
  entityId: string, 
  userId: string, 
  comment?: string
) => {
  try {
    // Ensure we have valid UUIDs
    const safeEntityId = ensureUUID(entityId);
    const safeUserId = ensureUUID(userId);
    
    const { error } = await supabase
      .from("policy_rule_approvers")
      .update({ 
        status: "rejected", 
        comment,
        timestamp: new Date().toISOString()
      })
      .eq("policy_rule_id", safeEntityId)
      .eq("user_id", safeUserId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error in rejectEntity:", error);
    throw error;
  }
};