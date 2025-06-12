/**
 * Helper utilities for working with activity logs
 * These functions help normalize and convert between different
 * naming conventions in the schema
 */
import { ActivityLog } from "@/types/core/centralModels";

/**
 * Returns the action type regardless of whether it's using 'action' or 'action_type' field
 * This handles schema differences between older and newer versions
 */
export function getActionType(log: any): string {
  // Handle both naming conventions
  return log.action_type || log.action || "";
}

/**
 * Format an action type for display by converting snake_case to Title Case
 */
export function formatActionType(actionType: string): string {
  if (!actionType) return "";
  
  return actionType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Create an activity log entry that works with both schema versions
 */
export function createActivityLogEntry(params: {
  action: string;
  userId?: string;
  userEmail?: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  status?: string;
  projectId?: string;
}) {
  // Create an entry that works with both field names
  return {
    action: params.action,
    action_type: params.action, // Include both for compatibility
    user_id: params.userId,
    user_email: params.userEmail,
    entity_type: params.entityType,
    entity_id: params.entityId,
    details: typeof params.details === 'object' ? JSON.stringify(params.details) : params.details,
    status: params.status || "success",
    project_id: params.projectId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Normalize an activity log from the database to the application model
 */
export function normalizeActivityLog(dbLog: any): ActivityLog {
  const timestamp = new Date(dbLog.timestamp || dbLog.created_at);
  
  // Store userEmail in details if it exists
  let details = dbLog.details;
  if (dbLog.user_email) {
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch (e) {
        details = {};
      }
    } else if (!details) {
      details = {};
    }
    details = {
      ...details,
      userEmail: dbLog.user_email
    };
  }
  
  const stringifiedDetails = typeof details === 'string' 
    ? details 
    : JSON.stringify(details || {});
  
  return {
    id: dbLog.id,
    createdAt: timestamp.toISOString(),
    action: dbLog.action_type || dbLog.action,
    userId: dbLog.user_id,
    entityType: dbLog.entity_type,
    entityId: dbLog.entity_id,
    details: stringifiedDetails,
    status: dbLog.status || "success",
    projectId: dbLog.project_id,
  };
} 