/**
 * Audit Queries - Database queries for audit and activity logging
 */

import { supabase } from '@/infrastructure/database/client'
import type { ActivityLog } from '@/types/core/centralModels'

/**
 * Get audit log by ID
 */
export async function getActivityLogById(id: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get audit logs with pagination and filters
 */
export async function getActivityLogs(options: {
  limit?: number
  offset?: number
  userId?: string
  action?: string
  entityType?: string
  entityId?: string
  projectId?: string
  status?: string
  startDate?: string
  endDate?: string
} = {}) {
  let query = supabase.from('audit_logs').select('*')
  
  if (options.userId) {
    query = query.eq('user_id', options.userId)
  }
  
  if (options.action) {
    query = query.eq('action', options.action)
  }
  
  if (options.entityType) {
    query = query.eq('entity_type', options.entityType)
  }
  
  if (options.entityId) {
    query = query.eq('entity_id', options.entityId)
  }
  
  if (options.projectId) {
    query = query.eq('project_id', options.projectId)
  }
  
  if (options.status) {
    query = query.eq('status', options.status)
  }
  
  if (options.startDate) {
    query = query.gte('timestamp', options.startDate)
  }
  
  if (options.endDate) {
    query = query.lte('timestamp', options.endDate)
  }
  
  if (options.limit) {
    const start = options.offset || 0
    const end = start + options.limit - 1
    query = query.range(start, end)
  }
  
  query = query.order('timestamp', { ascending: false })
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

/**
 * Create audit log entry
 */
export async function createActivityLog(logData: {
  userId?: string
  action: string
  entityType?: string
  entityId?: string
  projectId?: string
  details?: any
  status?: 'success' | 'error' | 'pending'
  ipAddress?: string
  userAgent?: string
}) {
  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: logData.userId,
      action: logData.action,
      entity_type: logData.entityType,
      entity_id: logData.entityId,
      project_id: logData.projectId,
      details: logData.details,
      status: logData.status || 'success',
      ip_address: logData.ipAddress,
      user_agent: logData.userAgent,
      timestamp: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get audit logs for a specific user
 */
export async function getUserActivityLogs(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityActivityLogs(entityType: string, entityId: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('timestamp', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Get audit logs for a specific project
 */
export async function getProjectActivityLogs(projectId: string, limit = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get recent audit logs
 */
export async function getRecentActivityLogs(limit = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get activity statistics
 */
export async function getActivityStatistics(timeframe: 'today' | 'week' | 'month' = 'today') {
  let startDate: Date
  const now = new Date()
  
  switch (timeframe) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
  }
  
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action, status, timestamp')
    .gte('timestamp', startDate.toISOString())
  
  if (error) throw error
  
  const actionCounts = data.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const statusCounts = data.reduce((acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const hourlyActivity = data.reduce((acc, log) => {
    const hour = new Date(log.timestamp).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  return {
    totalActivities: data.length,
    actionCounts,
    statusCounts,
    hourlyActivity,
    timeframe
  }
}

/**
 * Get failed activities
 */
export async function getFailedActivities(limit = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('status', 'error')
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get security audit trail
 */
export async function getSecurityAuditTrail(userId?: string, limit = 100) {
  const securityActions = [
    'login',
    'logout',
    'password_changed',
    'mfa_enabled',
    'mfa_disabled',
    'permission_granted',
    'permission_revoked',
    'role_changed',
    'account_locked',
    'account_unlocked'
  ]
  
  let query = supabase
    .from('audit_logs')
    .select('*')
    .in('action', securityActions)
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

/**
 * Get audit logs by IP address
 */
export async function getActivityLogsByIP(ipAddress: string, limit = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('ip_address', ipAddress)
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Clean up old audit logs
 */
export async function cleanupOldActivityLogs(daysToKeep = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
  
  const { error } = await supabase
    .from('audit_logs')
    .delete()
    .lt('timestamp', cutoffDate.toISOString())
  
  if (error) throw error
}

/**
 * Search audit logs
 */
export async function searchActivityLogs(searchQuery: string, limit = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .or(`action.ilike.%${searchQuery}%,details.ilike.%${searchQuery}%`)
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}
