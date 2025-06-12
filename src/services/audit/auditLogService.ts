import { supabase } from '@/infrastructure/database/client';
import { generateUUID } from '@/utils/shared/formatting/uuidUtils';
import { Json } from '@/types/core/supabase';

/**
 * Types of audit events
 */
export enum AuditEventType {
  POLICY_CREATED = 'POLICY_CREATED',
  POLICY_UPDATED = 'POLICY_UPDATED',
  POLICY_DELETED = 'POLICY_DELETED',
  POLICY_ACTIVATED = 'POLICY_ACTIVATED',
  POLICY_DEACTIVATED = 'POLICY_DEACTIVATED',
  RULE_CREATED = 'RULE_CREATED',
  RULE_UPDATED = 'RULE_UPDATED',
  RULE_DELETED = 'RULE_DELETED',
  VERSION_CREATED = 'VERSION_CREATED',
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  APPROVAL_GRANTED = 'APPROVAL_GRANTED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  action_type?: string;
  user_id?: string;
  username?: string;
  user_email?: string;
  entity_type?: string;
  entity_id?: string;
  details?: string;
  metadata?: Json;
  old_data?: Json;
  new_data?: Json;
  changes?: Json;
  status?: string;
  project_id?: string;
  occurred_at?: string;
  verified?: boolean;
}

/**
 * Service for managing audit logs
 */
export class AuditLogService {
  /**
   * Create a new audit log entry
   * 
   * @param eventType - Type of audit event
   * @param userId - User who performed the action
   * @param resourceId - ID of the affected resource
   * @param resourceType - Type of the affected resource
   * @param details - Additional details about the event
   * @returns The created audit log or null if creation failed
   */
  async createLog(
    eventType: AuditEventType,
    userId: string,
    resourceId: string,
    resourceType: 'policy' | 'rule' | 'version' | 'approval',
    details?: Record<string, any>
  ): Promise<AuditLogEntry | null> {
    try {
      const logEntry: AuditLogEntry = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        action: eventType,
        action_type: resourceType,
        user_id: userId,
        entity_id: resourceId,
        entity_type: resourceType,
        metadata: details as Json,
        occurred_at: new Date().toISOString(),
        verified: true
      };

      const { data, error } = await supabase
        .from('audit_logs')
        .insert(logEntry)
        .select()
        .single();

      if (error) {
        console.error('Error creating audit log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      return null;
    }
  }

  /**
   * Get audit logs for a specific resource
   * 
   * @param resourceId - ID of the resource
   * @param resourceType - Type of the resource
   * @returns Array of audit logs
   */
  async getLogsForResource(
    resourceId: string,
    resourceType?: 'policy' | 'rule' | 'version' | 'approval'
  ): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_id', resourceId)
        .order('timestamp', { ascending: false });
      
      if (resourceType) {
        query = query.eq('entity_type', resourceType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a specific user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of logs to return
   * @returns Array of audit logs
   */
  async getLogsForUser(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user audit logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch user audit logs:', error);
      return [];
    }
  }

  /**
   * Get recent audit logs
   * 
   * @param limit - Maximum number of logs to return
   * @returns Array of audit logs
   */
  async getRecentLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent audit logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch recent audit logs:', error);
      return [];
    }
  }
}