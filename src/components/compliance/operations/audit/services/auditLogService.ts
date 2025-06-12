import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/core/database';
import { AuditLog, ApprovalEntityType } from '@/types/domain/compliance/compliance';

export class AuditLogService {
  private static instance: AuditLogService;
  private supabase;

  private constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  // Log a compliance action
  async logAction(
    entityType: ApprovalEntityType,
    entityId: string,
    action: string,
    details: Record<string, any>,
    performedBy: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      changes?: {
        field: string;
        oldValue: any;
        newValue: any;
      }[];
    }
  ): Promise<AuditLog> {
    try {
      const auditLog: Omit<AuditLog, 'id' | 'timestamp'> = {
        entity_type: entityType,
        entity_id: entityId,
        action,
        details: JSON.stringify(details),
        user_id: performedBy,
        user_email: '',
        ip_address: options?.ipAddress,
        project_id: '',
        metadata: {
          userAgent: options?.userAgent,
          changes: options?.changes
        }
      };
      
      // Insert the audit log into the database
      const { data, error } = await this.supabase
        .from('compliance_audit_logs')
        .insert({
          entity_type: auditLog.entity_type,
          entity_id: auditLog.entity_id,
          action: auditLog.action,
          details: auditLog.details,
          performed_by: auditLog.user_id,
          ip_address: auditLog.ip_address,
          user_agent: options?.userAgent,
          changes: options?.changes
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Format the response
      return {
        id: data.id,
        project_id: data.project_id || '',
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        action: data.action,
        details: data.details,
        user_id: data.performed_by,
        user_email: data.user_email || '',
        timestamp: data.timestamp,
        ip_address: data.ip_address,
        metadata: {
          userAgent: data.user_agent,
          changes: data.changes
        }
      };
    } catch (error) {
      console.error('Error logging action:', error);
      throw error;
    }
  }

  // Get audit logs for an entity
  async getAuditLogsForEntity(
    entityType: ApprovalEntityType,
    entityId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      actions?: string[];
    }
  ): Promise<AuditLog[]> {
    try {
      let query = this.supabase
        .from('compliance_audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);
      
      if (options?.startDate) {
        query = query.gte('timestamp', options.startDate.toISOString());
      }
      
      if (options?.endDate) {
        query = query.lte('timestamp', options.endDate.toISOString());
      }
      
      if (options?.actions && options.actions.length > 0) {
        query = query.in('action', options.actions);
      }
      
      query = query.order('timestamp', { ascending: false });
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        project_id: item.project_id || '',
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        action: item.action,
        details: item.details,
        user_id: item.performed_by,
        user_email: item.user_email || '',
        timestamp: item.timestamp,
        ip_address: item.ip_address,
        metadata: {
          userAgent: item.user_agent,
          changes: item.changes
        }
      }));
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  // Get audit logs by user
  async getAuditLogsByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      entityType?: ApprovalEntityType;
      actions?: string[];
    }
  ): Promise<AuditLog[]> {
    try {
      let query = this.supabase
        .from('compliance_audit_logs')
        .select('*')
        .eq('performed_by', userId);
      
      if (options?.entityType) {
        query = query.eq('entity_type', options.entityType);
      }
      
      if (options?.startDate) {
        query = query.gte('timestamp', options.startDate.toISOString());
      }
      
      if (options?.endDate) {
        query = query.lte('timestamp', options.endDate.toISOString());
      }
      
      if (options?.actions && options.actions.length > 0) {
        query = query.in('action', options.actions);
      }
      
      query = query.order('timestamp', { ascending: false });
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        project_id: item.project_id || '',
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        action: item.action,
        details: item.details,
        user_id: item.performed_by,
        user_email: item.user_email || '',
        timestamp: item.timestamp,
        ip_address: item.ip_address,
        metadata: {
          userAgent: item.user_agent,
          changes: item.changes
        }
      }));
    } catch (error) {
      console.error('Error getting audit logs by user:', error);
      throw error;
    }
  }

  // Generate audit report
  async generateAuditReport(
    options: {
      startDate: Date;
      endDate: Date;
      entityType?: ApprovalEntityType;
      entityId?: string;
      actions?: string[];
      format?: 'json' | 'csv' | 'pdf';
    }
  ): Promise<{ url: string } | AuditLog[]> {
    try {
      // Get the audit logs based on the criteria
      let query = this.supabase
        .from('compliance_audit_logs')
        .select('*')
        .gte('timestamp', options.startDate.toISOString())
        .lte('timestamp', options.endDate.toISOString());
      
      if (options.entityType) {
        query = query.eq('entity_type', options.entityType);
      }
      
      if (options.entityId) {
        query = query.eq('entity_id', options.entityId);
      }
      
      if (options.actions && options.actions.length > 0) {
        query = query.in('action', options.actions);
      }
      
      query = query.order('timestamp', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const auditLogs = (data || []).map(item => ({
        id: item.id,
        project_id: item.project_id || '',
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        action: item.action,
        details: item.details,
        user_id: item.performed_by,
        user_email: item.user_email || '',
        timestamp: item.timestamp,
        ip_address: item.ip_address,
        metadata: {
          userAgent: item.user_agent,
          changes: item.changes
        }
      }));
      
      // If format is not specified or is json, return the data directly
      if (!options.format || options.format === 'json') {
        return auditLogs;
      }
      
      // For other formats, we would normally generate the report and return a URL
      // For this example, we'll just return a mock URL
      return {
        url: `https://example.com/reports/audit-${new Date().getTime()}.${options.format}`
      };
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw error;
    }
  }

  // Create a middleware to automatically log API actions
  createAuditMiddleware(defaultPerformedBy: string) {
    return async (req: any, res: any, next: () => void) => {
      const originalSend = res.send;
      
      res.send = function(body: any) {
        const performedBy = req.user?.id || defaultPerformedBy;
        const entityType = req.body.entityType || req.query.entityType;
        const entityId = req.body.entityId || req.query.entityId;
        
        if (entityType && entityId) {
          const action = `${req.method.toLowerCase()}_${req.path.replace(/\//g, '_')}`;
          
          AuditLogService.getInstance().logAction(
            entityType as ApprovalEntityType,
            entityId,
            action,
            {
              requestBody: req.body,
              requestQuery: req.query,
              responseStatus: res.statusCode,
              responseBody: typeof body === 'string' ? JSON.parse(body) : body
            },
            performedBy,
            {
              ipAddress: req.ip,
              userAgent: req.get('User-Agent')
            }
          ).catch(err => {
            console.error('Error in audit middleware:', err);
          });
        }
        
        originalSend.apply(res, arguments);
      };
      
      next();
    };
  }
}