/**
 * Audit Service
 * Provides comprehensive change tracking and audit trail functionality
 */

import { supabase } from '@/infrastructure/supabaseClient';
import { ServiceResult, ServiceErrorHandler } from './BaseTokenService';

export interface AuditEntry {
  id: string;
  entity_type?: string;
  entity_id?: string;
  action: string;
  user_id?: string;
  changes?: Record<string, { old?: any; new?: any }>;
  old?: any;
  new?: any;
  metadata?: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditFilter {
  entityType?: string;
  entityId?: string;
  operation?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditOptions {
  trackChanges?: boolean;
  includeMetadata?: boolean;
  includeUserInfo?: boolean;
  sensitiveFields?: string[];
}

/**
 * Audit Service for tracking changes and maintaining audit trails
 */
export class AuditService {
  
  /**
   * Create an audit entry
   */
  static async createAuditEntry(
    entityType: string,
    entityId: string,
    action: string,
    changes: Record<string, { old?: any; new?: any }>,
    options: {
      userId?: string;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<ServiceResult<AuditEntry>> {
    try {
      const auditEntry = {
        action,
        entity_type: entityType,
        entity_id: entityId,
        user_id: options.userId,
        changes: this.sanitizeChanges(changes),
        metadata: options.metadata,
        timestamp: new Date().toISOString(),
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
      };

      const { data, error } = await supabase
        .from('audit_logs')
        .insert(auditEntry)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }

      return {
        success: true,
        data: data as AuditEntry,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create audit entry',
      };
    }
  }

  /**
   * Get audit trail for an entity
   */
  static async getAuditTrail(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<ServiceResult<AuditEntry[]>> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }

      return {
        success: true,
        data: data as AuditEntry[],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get audit trail',
      };
    }
  }

  /**
   * Search audit logs with filters
   */
  static async searchAuditLogs(
    filters: AuditFilter,
    pagination: { page?: number; limit?: number } = {}
  ): Promise<ServiceResult<{ entries: AuditEntry[]; total: number }>> {
    try {
      const { page = 1, limit = 50 } = pagination;
      const offset = (page - 1) * limit;

      let query = supabase.from('audit_logs').select('*', { count: 'exact' });

      // Apply filters
      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters.entityId) {
        query = query.eq('entity_id', filters.entityId);
      }
      if (filters.operation) {
        query = query.eq('action', filters.operation);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('timestamp', filters.dateTo);
      }

      // Apply pagination
      query = query.order('timestamp', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }

      return {
        success: true,
        data: {
          entries: data as AuditEntry[],
          total: count || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search audit logs',
      };
    }
  }

  /**
   * Track changes between old and new data
   */
  static trackChanges(
    oldData: any,
    newData: any,
    options: AuditOptions = {}
  ): Record<string, { old?: any; new?: any }> {
    const changes: Record<string, { old?: any; new?: any }> = {};
    const sensitiveFields = options.sensitiveFields || [];

    if (!oldData || !newData) {
      return { _complete: { old: oldData, new: newData } };
    }

    // Handle arrays
    if (Array.isArray(oldData) && Array.isArray(newData)) {
      return { _array: { old: oldData, new: newData } };
    }

    // Handle objects
    if (typeof oldData === 'object' && typeof newData === 'object') {
      const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));

      for (const key of allKeys) {
        // Skip sensitive fields
        if (sensitiveFields.includes(key)) continue;

        const oldValue = oldData[key];
        const newValue = newData[key];

        if (!this.deepEqual(oldValue, newValue)) {
          changes[key] = {
            old: this.sanitizeValue(oldValue),
            new: this.sanitizeValue(newValue),
          };
        }
      }
    } else if (oldData !== newData) {
      changes._value = {
        old: this.sanitizeValue(oldData),
        new: this.sanitizeValue(newData),
      };
    }

    return changes;
  }

  /**
   * Create audit entry for token operations
   */
  static async auditTokenOperation(
    action: string,
    tokenId: string,
    oldData: any,
    newData: any,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<ServiceResult<AuditEntry>> {
    try {
      const changes = this.trackChanges(oldData, newData);
      
      return await this.createAuditEntry('token', tokenId, action, changes, {
        userId,
        metadata,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to audit token operation',
      };
    }
  }

  /**
   * Create audit entry for property operations
   */
  static async auditPropertyOperation(
    action: string,
    propertyType: string,
    propertyId: string,
    tokenId: string,
    oldData: any,
    newData: any,
    userId?: string
  ): Promise<ServiceResult<AuditEntry>> {
    try {
      const changes = this.trackChanges(oldData, newData);
      
      return await this.createAuditEntry(
        `token_${propertyType}`,
        propertyId,
        action,
        changes,
        {
          userId,
          metadata: { tokenId },
        }
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to audit property operation',
      };
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(
    entityType?: string,
    dateRange?: { from: string; to: string }
  ): Promise<ServiceResult<{
    totalEntries: number;
    operationCounts: Record<string, number>;
    entityTypeCounts: Record<string, number>;
    dailyActivity: Array<{ date: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  }>> {
    try {
      // Base query
      let query = supabase.from('audit_logs').select('*');
      
      // Apply filters
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      if (dateRange) {
        if (dateRange.from) {
          query = query.gte('timestamp', dateRange.from);
        }
        if (dateRange.to) {
          query = query.lte('timestamp', dateRange.to);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }
      
      const entries = data as AuditEntry[];
      
      // Calculate statistics
      const totalEntries = entries.length;
      
      // Operation counts
      const operationCounts: Record<string, number> = {};
      entries.forEach(entry => {
        operationCounts[entry.action] = (operationCounts[entry.action] || 0) + 1;
      });
      
      // Entity type counts
      const entityTypeCounts: Record<string, number> = {};
      entries.forEach(entry => {
        if (entry.entity_type) {
          entityTypeCounts[entry.entity_type] = (entityTypeCounts[entry.entity_type] || 0) + 1;
        }
      });
      
      // Daily activity
      const dailyActivity: Array<{ date: string; count: number }> = [];
      const dailyMap: Record<string, number> = {};
      
      entries.forEach(entry => {
        const date = entry.timestamp.split('T')[0];
        dailyMap[date] = (dailyMap[date] || 0) + 1;
      });
      
      Object.entries(dailyMap).forEach(([date, count]) => {
        dailyActivity.push({ date, count });
      });
      
      dailyActivity.sort((a, b) => a.date.localeCompare(b.date));
      
      // Top users
      const userCounts: Record<string, number> = {};
      entries.forEach(entry => {
        if (entry.user_id) {
          userCounts[entry.user_id] = (userCounts[entry.user_id] || 0) + 1;
        }
      });
      
      const topUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      return {
        success: true,
        data: {
          totalEntries,
          operationCounts,
          entityTypeCounts,
          dailyActivity,
          topUsers,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get audit statistics',
      };
    }
  }

  /**
   * Export audit logs
   */
  static async exportAuditLogs(
    filters: AuditFilter,
    format: 'json' | 'csv' = 'json'
  ): Promise<ServiceResult<string>> {
    try {
      const result = await this.searchAuditLogs(filters, { limit: 1000 });
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }
      
      const entries = result.data.entries;
      
      if (format === 'csv') {
        return {
          success: true,
          data: this.convertToCSV(entries),
        };
      }
      
      return {
        success: true,
        data: JSON.stringify(entries, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export audit logs',
      };
    }
  }

  /**
   * Cleanup old audit logs
   */
  static async cleanupOldLogs(
    retentionDays: number = 365
  ): Promise<ServiceResult<{ deletedCount: number }>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const { data, error, count } = await supabase
        .from('audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select();
      
      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }
      
      return {
        success: true,
        data: {
          deletedCount: count || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup old logs',
      };
    }
  }

  // Utility methods
  static sanitizeChanges(
    changes: Record<string, { old?: any; new?: any }>
  ): Record<string, { old?: any; new?: any }> {
    const sanitized: Record<string, { old?: any; new?: any }> = {};
    
    for (const [key, value] of Object.entries(changes)) {
      sanitized[key] = {
        old: this.sanitizeValue(value.old),
        new: this.sanitizeValue(value.new),
      };
    }
    
    return sanitized;
  }

  static sanitizeValue(value: any): any {
    if (value === undefined || value === null) {
      return value;
    }
    
    if (typeof value === 'function') {
      return '[Function]';
    }
    
    if (typeof value === 'object') {
      return this.limitObjectDepth(value, 3);
    }
    
    return value;
  }

  static limitObjectDepth(obj: any, maxDepth: number): any {
    if (maxDepth <= 0) {
      return typeof obj === 'object' ? '[Object]' : obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.slice(0, 10).map(item => this.limitObjectDepth(item, maxDepth - 1));
    }
    
    if (obj && typeof obj === 'object') {
      const limited: any = {};
      let count = 0;
      
      for (const [key, value] of Object.entries(obj)) {
        if (count >= 20) {
          limited['...'] = '[Additional properties truncated]';
          break;
        }
        limited[key] = this.limitObjectDepth(value, maxDepth - 1);
        count++;
      }
      
      return limited;
    }
    
    return obj;
  }

  static deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual(a[key], b[key])) return false;
      }
      
      return true;
    }

    return false;
  }

  static convertToCSV(entries: AuditEntry[]): string {
    if (entries.length === 0) return '';

    const headers = [
      'ID',
      'Entity Type',
      'Entity ID',
      'Operation',
      'User ID',
      'Timestamp',
      'Changes',
      'Metadata',
    ];

    const rows = entries.map(entry => [
      entry.id,
      entry.entity_type,
      entry.entity_id,
      entry.action,
      entry.user_id || '',
      entry.timestamp,
      JSON.stringify(entry.changes),
      JSON.stringify(entry.metadata || {}),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

/**
 * Audit decorator for automatic audit trail creation
 * Updated for modern TypeScript decorator syntax
 */
export function auditOperation(entityType: string, operationType: string, options?: any) {
  return function <T extends (...args: any[]) => any>(
    originalMethod: T,
    context: ClassMethodDecoratorContext<any, T>
  ): T {
    const methodName = String(context.name);

    return (async function (this: any, ...args: any[]): Promise<any> {
      const startTime = Date.now();
      
      try {
        // Execute the original method
        const result = await originalMethod.apply(this, args);
        
        // Create audit entry if successful
        if (result?.success && result?.data) {
          const auditData = {
            entityId: result.data.id || args[0],
            action: operationType,
            entityType,
            executionTime: Date.now() - startTime,
            method: methodName,
          };

          // Create audit entry (fire and forget)
          AuditService.createAuditEntry(
            entityType,
            auditData.entityId,
            operationType,
            { operation: { new: auditData } }
          ).catch(error => {
            console.warn('Failed to create audit entry:', error);
          });
        }

        return result;
      } catch (error) {
        // Create audit entry for errors too
        const auditData = {
          entityId: args[0] || 'unknown',
          action: operationType,
          entityType,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: Date.now() - startTime,
          method: methodName,
        };

        AuditService.createAuditEntry(
          entityType,
          auditData.entityId,
          operationType,
          { error: { new: auditData } }
        ).catch(auditError => {
          console.warn('Failed to create error audit entry:', auditError);
        });

        throw error;
      }
    }) as T;
  };
}