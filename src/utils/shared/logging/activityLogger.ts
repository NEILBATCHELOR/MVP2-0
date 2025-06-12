/**
 * activityLogger.ts
 * Centralized, standardized activity logging utility
 */

import { supabase } from "@/infrastructure/database/client";
import {
  ActivitySource,
  ActivityCategory,
  ActivitySeverity,
  ActivityStatus,
  UserActionType,
  SystemActionType,
  ActivityLogData,
  getCategoryForAction,
  getSeverityForAction
} from "@/types/domain/activity/ActivityTypes";
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUserId } from "@/infrastructure/auth/auth";

/**
 * Logs a user-initiated activity with full context
 */
export const logUserActivity = async (
  action: string,
  options: {
    entityType?: string;
    entityId?: string;
    details?: string | Record<string, any>;
    status?: ActivityStatus;
    projectId?: string;
    metadata?: Record<string, any>;
    category?: ActivityCategory;
    severity?: ActivitySeverity;
    correlationId?: string;
    parentId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      console.error("No authenticated user found when trying to log activity");
      return false;
    }
    
    const category = options.category || getCategoryForAction(action);
    const status = options.status || ActivityStatus.SUCCESS;
    const severity = options.severity || getSeverityForAction(action, status);
    const timestamp = new Date().toISOString();
    
    // Get client info if available
    const clientInfo = getClientInfo();
    
    const processedDetails = typeof options.details === 'string' 
      ? options.details 
      : JSON.stringify(options.details);
    
    const { error } = await supabase.from("audit_logs").insert({
      action,
      action_type: ActivitySource.USER,
      category,
      entity_type: options.entityType,
      entity_id: options.entityId,
      details: processedDetails,
      status,
      project_id: options.projectId,
      user_id: userId,
      username: userId,
      timestamp,
      source: ActivitySource.USER,
      severity,
      is_automated: false,
      parent_id: options.parentId,
      correlation_id: options.correlationId || generateCorrelationId(),
      session_id: options.sessionId || clientInfo.sessionId,
      ip_address: options.ipAddress || clientInfo.ipAddress,
      user_agent: options.userAgent || clientInfo.userAgent,
      metadata: { 
        ...options.metadata,
        timestamp
      }
    });
    
    if (error) {
      console.error("Error logging user activity:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to log user activity:", error);
    return false;
  }
};

/**
 * Logs a system-initiated activity with full context
 */
export const logSystemActivity = async (
  action: string,
  options: {
    entityType?: string;
    entityId?: string;
    details?: string | Record<string, any>;
    status?: ActivityStatus;
    projectId?: string;
    metadata?: Record<string, any>;
    category?: ActivityCategory;
    severity?: ActivitySeverity;
    systemProcessId?: string;
    batchOperationId?: string;
    parentId?: string;
    correlationId?: string;
    initiatedBy?: string;
    duration?: number;
  }
): Promise<string | null> => {
  try {
    const activityId = uuidv4();
    const category = options.category || getCategoryForAction(action);
    const status = options.status || ActivityStatus.SUCCESS;
    const severity = options.severity || getSeverityForAction(action, status);
    const timestamp = new Date().toISOString();
    
    const processedDetails = typeof options.details === 'string' 
      ? options.details 
      : JSON.stringify(options.details);
    
    const { error } = await supabase.from("audit_logs").insert({
      id: activityId,
      action,
      action_type: ActivitySource.SYSTEM,
      category,
      entity_type: options.entityType,
      entity_id: options.entityId,
      details: processedDetails,
      status,
      project_id: options.projectId,
      timestamp,
      source: ActivitySource.SYSTEM,
      severity,
      is_automated: true,
      system_process_id: options.systemProcessId,
      batch_operation_id: options.batchOperationId,
      parent_id: options.parentId,
      correlation_id: options.correlationId || generateCorrelationId(),
      duration: options.duration,
      username: options.initiatedBy || 'system',
      metadata: { 
        ...options.metadata,
        timestamp
      }
    });
    
    if (error) {
      console.error("Error logging system activity:", error);
      return null;
    }
    
    return activityId;
  } catch (error) {
    console.error("Failed to log system activity:", error);
    return null;
  }
};

/**
 * Logs an integration-initiated activity with full context
 */
export const logIntegrationActivity = async (
  action: string,
  options: {
    entityType?: string;
    entityId?: string;
    details?: string | Record<string, any>;
    status?: ActivityStatus;
    projectId?: string;
    metadata?: Record<string, any>;
    category?: ActivityCategory;
    severity?: ActivitySeverity;
    integrationName: string;
    externalReference?: string;
    parentId?: string;
    correlationId?: string;
    duration?: number;
  }
): Promise<boolean> => {
  try {
    const category = options.category || getCategoryForAction(action);
    const status = options.status || ActivityStatus.SUCCESS;
    const severity = options.severity || getSeverityForAction(action, status);
    
    const timestamp = new Date().toISOString();
    
    const processedDetails = typeof options.details === 'string' 
      ? options.details 
      : JSON.stringify(options.details);
    
    const { error } = await supabase.from("audit_logs").insert({
      action: action,
      action_type: ActivitySource.INTEGRATION,
      category: category,
      entity_type: options.entityType,
      entity_id: options.entityId,
      details: processedDetails,
      status: status,
      project_id: options.projectId,
      parent_id: options.parentId,
      correlation_id: options.correlationId || generateCorrelationId(),
      duration: options.duration,
      source: ActivitySource.INTEGRATION,
      severity: severity,
      is_automated: true,
      metadata: { 
        integration_name: options.integrationName,
        external_reference: options.externalReference,
        ...options.metadata,
        timestamp
      },
      timestamp: timestamp
    });
    
    if (error) {
      console.error("Error logging integration activity:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to log integration activity:", error);
    return false;
  }
};

/**
 * Logs a database-initiated activity (e.g., from triggers) with full context
 */
export const logDatabaseActivity = async (
  action: string,
  options: {
    entityType?: string;
    entityId?: string;
    details?: string | Record<string, any>;
    status?: ActivityStatus;
    projectId?: string;
    metadata?: Record<string, any>;
    category?: ActivityCategory;
    severity?: ActivitySeverity;
    parentId?: string;
    correlationId?: string;
    duration?: number;
    oldData?: Record<string, any>;
    newData?: Record<string, any>;
  }
): Promise<boolean> => {
  try {
    const category = options.category || getCategoryForAction(action);
    const status = options.status || ActivityStatus.SUCCESS;
    const severity = options.severity || getSeverityForAction(action, status);
    
    const timestamp = new Date().toISOString();
    
    const processedDetails = typeof options.details === 'string' 
      ? options.details 
      : JSON.stringify(options.details);
    
    const { error } = await supabase.from("audit_logs").insert({
      action: action,
      action_type: ActivitySource.DATABASE,
      category: category,
      entity_type: options.entityType,
      entity_id: options.entityId,
      details: processedDetails,
      status: status,
      project_id: options.projectId,
      old_data: options.oldData || null,
      new_data: options.newData || null,
      parent_id: options.parentId,
      correlation_id: options.correlationId || generateCorrelationId(),
      duration: options.duration,
      source: ActivitySource.DATABASE,
      severity: severity,
      is_automated: true,
      metadata: { 
        ...options.metadata,
        timestamp
      },
      timestamp: timestamp
    });
    
    if (error) {
      console.error("Error logging database activity:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to log database activity:", error);
    return false;
  }
};

/**
 * Logs a scheduled activity (e.g., from cron jobs) with full context
 */
export const logScheduledActivity = async (
  action: string,
  options: {
    entityType?: string;
    entityId?: string;
    details?: string | Record<string, any>;
    status?: ActivityStatus;
    projectId?: string;
    metadata?: Record<string, any>;
    category?: ActivityCategory;
    severity?: ActivitySeverity;
    scheduleName: string;
    parentId?: string;
    correlationId?: string;
    duration?: number;
    systemProcessId?: string;
  }
): Promise<boolean> => {
  try {
    const category = options.category || getCategoryForAction(action);
    const status = options.status || ActivityStatus.SUCCESS;
    const severity = options.severity || getSeverityForAction(action, status);
    
    const timestamp = new Date().toISOString();
    
    const processedDetails = typeof options.details === 'string' 
      ? options.details 
      : JSON.stringify(options.details);
    
    const { error } = await supabase.from("audit_logs").insert({
      action: action,
      action_type: ActivitySource.SCHEDULED,
      category: category,
      entity_type: options.entityType,
      entity_id: options.entityId,
      details: processedDetails,
      status: status,
      project_id: options.projectId,
      parent_id: options.parentId,
      correlation_id: options.correlationId || generateCorrelationId(),
      duration: options.duration,
      system_process_id: options.systemProcessId,
      source: ActivitySource.SCHEDULED,
      severity: severity,
      is_automated: true,
      metadata: { 
        schedule_name: options.scheduleName,
        ...options.metadata,
        timestamp
      },
      timestamp: timestamp
    });
    
    if (error) {
      console.error("Error logging scheduled activity:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to log scheduled activity:", error);
    return false;
  }
};

/**
 * Logs any type of activity with custom data
 * Note: This function expects all data to be correctly formatted for the database
 */
export const logActivity = async (data: ActivityLogData): Promise<boolean> => {
  try {
    // Ensure required fields are present
    if (!data.action) {
      console.error("Activity logging failed: 'action' is required");
      return false;
    }
    
    // Create a properly formatted data object for the database insert
    const timestamp = data.timestamp || new Date().toISOString();
    const correlationId = data.correlation_id || generateCorrelationId();
    
    // Process details to ensure it's a string if present
    const details = data.details 
      ? (typeof data.details === 'string' ? data.details : JSON.stringify(data.details)) 
      : undefined;
    
    // Create a new object with the properly formatted values
    const insertData = {
      ...data,
      timestamp,
      correlation_id: correlationId,
      details
    };
    
    const { error } = await supabase.from("audit_logs").insert(insertData);
    
    if (error) {
      console.error("Error logging activity:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to log activity:", error);
    return false;
  }
};

/**
 * Updates the status of an existing activity
 */
export const updateActivityStatus = async (
  activityId: string,
  status: ActivityStatus,
  metadata?: Record<string, any>,
  duration?: number
): Promise<boolean> => {
  try {
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (metadata) {
      updateData.metadata = metadata;
    }

    if (duration !== undefined) {
      updateData.duration = duration;
    }

    const { error } = await supabase
      .from("audit_logs")
      .update(updateData)
      .eq("id", activityId);
    
    if (error) {
      console.error("Error updating activity status:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to update activity status:", error);
    return false;
  }
};

/**
 * Create related activity with parent reference
 */
export const createChildActivity = async (
  parentId: string,
  action: string,
  options: {
    entityType?: string;
    entityId?: string;
    details?: string | Record<string, any>;
    status?: ActivityStatus;
    source?: ActivitySource;
    category?: ActivityCategory;
    severity?: ActivitySeverity;
    metadata?: Record<string, any>;
  }
): Promise<string | null> => {
  try {
    const { data: parentData } = await supabase
      .from("audit_logs")
      .select("correlation_id")
      .eq("id", parentId)
      .single();
    
    const activityId = uuidv4();
    const category = options.category || getCategoryForAction(action);
    const status = options.status || ActivityStatus.SUCCESS;
    const severity = options.severity || getSeverityForAction(action, status);
    const source = options.source || ActivitySource.SYSTEM;
    
    const processedDetails = typeof options.details === 'string' 
      ? options.details 
      : JSON.stringify(options.details);
    
    const { error } = await supabase.from("audit_logs").insert({
      id: activityId,
      action,
      action_type: source,
      category,
      entity_type: options.entityType,
      entity_id: options.entityId,
      details: processedDetails,
      status,
      parent_id: parentId,
      correlation_id: parentData?.correlation_id || generateCorrelationId(),
      timestamp: new Date().toISOString(),
      source,
      severity,
      is_automated: source !== ActivitySource.USER,
      metadata: options.metadata || {}
    });
    
    if (error) {
      console.error("Error creating child activity:", error);
      return null;
    }
    
    return activityId;
  } catch (error) {
    console.error("Failed to create child activity:", error);
    return null;
  }
};

/**
 * Helper function to get client information
 */
const getClientInfo = () => {
  let sessionId = '';
  try {
    sessionId = localStorage.getItem('activity_session_id') || '';
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('activity_session_id', sessionId);
    }
  } catch (e) {
    sessionId = uuidv4();
  }
  
  let userAgent = '';
  let ipAddress = '';
  
  try {
    userAgent = navigator.userAgent || '';
  } catch (e) {
    // Ignore - might be running in a non-browser context
  }
  
  return {
    sessionId,
    ipAddress,
    userAgent
  };
};

/**
 * Generate a correlation ID for tracing related activities
 */
const generateCorrelationId = (): string => {
  return uuidv4();
};

/**
 * Get related activities for a given activity
 */
export const getRelatedActivities = async (activityId: string): Promise<any[]> => {
  try {
    const { data: activity } = await supabase
      .from("audit_logs")
      .select("correlation_id")
      .eq("id", activityId)
      .single();
    
    if (!activity || !activity.correlation_id) {
      return [];
    }
    
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("correlation_id", activity.correlation_id)
      .order("timestamp", { ascending: true });
    
    if (error) {
      console.error("Error fetching related activities:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Failed to get related activities:", error);
    return [];
  }
};

/**
 * Get activities for a system process
 */
export const getProcessActivities = async (processId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("system_process_id", processId)
      .order("timestamp", { ascending: true });
    
    if (error) {
      console.error("Error fetching process activities:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Failed to get process activities:", error);
    return [];
  }
};

/**
 * Get activities for a batch operation
 */
export const getBatchOperationActivities = async (batchId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("batch_operation_id", batchId)
      .order("timestamp", { ascending: true });
    
    if (error) {
      console.error("Error fetching batch operation activities:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Failed to get batch operation activities:", error);
    return [];
  }
}; 