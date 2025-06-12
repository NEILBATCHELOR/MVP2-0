import { supabase } from "@/infrastructure/database/client";

export enum FactoringActionType {
  INVOICE_UPLOAD = "INVOICE_UPLOAD",
  INVOICE_UPDATE = "INVOICE_UPDATE",
  INVOICE_DELETE = "INVOICE_DELETE",
  POOL_CREATE = "POOL_CREATE",
  POOL_UPDATE = "POOL_UPDATE",
  POOL_DELETE = "POOL_DELETE",
  TOKEN_CREATE = "TOKEN_CREATE",
  TOKEN_UPDATE = "TOKEN_UPDATE",
  TOKEN_DELETE = "TOKEN_DELETE",
  TOKEN_ALLOCATION = "TOKEN_ALLOCATION",
  TOKEN_DISTRIBUTION = "TOKEN_DISTRIBUTION"
}

export interface AuditLogEntry {
  action: string;
  entity_type: string;
  entity_id?: string;
  details: string;
  old_data?: any;
  new_data?: any;
  project_id?: string;
  action_type: FactoringActionType;
  metadata?: Record<string, any>;
}

/**
 * Logs an action to the audit_logs table
 * 
 * @param entry The audit log entry to create
 * @returns The result of the insert operation
 */
export const logFactoringAction = async (entry: AuditLogEntry) => {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("No authenticated user found when logging action");
    }
    
    // Format the audit log entry
    const logEntry = {
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      details: entry.details,
      old_data: entry.old_data,
      new_data: entry.new_data,
      user_id: user?.id,
      user_email: user?.email,
      project_id: entry.project_id,
      action_type: entry.action_type,
      category: "FACTORING",
      severity: "INFO",
      metadata: entry.metadata,
      source: "FACTORING_MODULE",
      timestamp: new Date().toISOString()
    };
    
    // Insert the log entry into the audit_logs table
    const { data, error } = await supabase
      .from("audit_logs")
      .insert(logEntry);
      
    if (error) {
      console.error("Error logging factoring action:", error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Exception when logging factoring action:", error);
    return { success: false, error };
  }
};

/**
 * Logs a bulk operation to the audit_logs table
 * 
 * @param actionType The type of action
 * @param entityType The type of entity
 * @param entities Array of entity IDs affected
 * @param details Description of the operation
 * @param projectId Optional project ID
 * @param metadata Optional additional metadata
 * @returns The result of the insert operation
 */
export const logBulkFactoringAction = async (
  actionType: FactoringActionType,
  entityType: string,
  entities: string[],
  details: string,
  projectId?: string,
  metadata?: Record<string, any>
) => {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("No authenticated user found when logging bulk action");
    }
    
    // Generate a batch operation ID for correlating related entries
    const batchOperationId = crypto.randomUUID();
    
    // Format the audit log entry
    const logEntry = {
      action: `BULK_${actionType}`,
      entity_type: entityType,
      details: details,
      user_id: user?.id,
      user_email: user?.email,
      project_id: projectId,
      action_type: actionType,
      category: "FACTORING",
      severity: "INFO",
      metadata: {
        ...metadata,
        entity_count: entities.length,
        entities: entities
      },
      source: "FACTORING_MODULE",
      batch_operation_id: batchOperationId,
      timestamp: new Date().toISOString()
    };
    
    // Insert the log entry into the audit_logs table
    const { data, error } = await supabase
      .from("audit_logs")
      .insert(logEntry);
      
    if (error) {
      console.error("Error logging bulk factoring action:", error);
      return { success: false, error };
    }
    
    return { success: true, data, batchOperationId };
  } catch (error) {
    console.error("Exception when logging bulk factoring action:", error);
    return { success: false, error };
  }
};

/**
 * Fetch audit logs for a specific entity
 * 
 * @param entityType The type of entity
 * @param entityId The ID of the entity
 * @param limit The maximum number of logs to return
 * @returns The audit logs for the entity
 */
export const getEntityAuditLogs = async (
  entityType: string,
  entityId: string,
  limit: number = 20
) => {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("timestamp", { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error fetching entity audit logs:", error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Exception when fetching entity audit logs:", error);
    return { success: false, error };
  }
};

/**
 * Fetch recent factoring audit logs
 * 
 * @param projectId Optional project ID to filter by
 * @param actionType Optional action type to filter by
 * @param limit The maximum number of logs to return
 * @returns The recent audit logs
 */
export const getRecentFactoringLogs = async (
  projectId?: string,
  actionType?: FactoringActionType,
  limit: number = 20
) => {
  try {
    let query = supabase
      .from("audit_logs")
      .select("*")
      .eq("category", "FACTORING")
      .order("timestamp", { ascending: false })
      .limit(limit);
      
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    
    if (actionType) {
      query = query.eq("action_type", actionType);
    }
    
    const { data, error } = await query;
      
    if (error) {
      console.error("Error fetching recent factoring logs:", error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Exception when fetching recent factoring logs:", error);
    return { success: false, error };
  }
};

export default {
  logFactoringAction,
  logBulkFactoringAction,
  getEntityAuditLogs,
  getRecentFactoringLogs,
  FactoringActionType
};