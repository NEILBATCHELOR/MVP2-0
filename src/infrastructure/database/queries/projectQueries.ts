/**
 * Project Queries - Database queries for project management
 */

import { supabase } from '@/infrastructure/database/client'
import type { Project, ProjectStatus, ProjectType } from '@/types/core/centralModels'

/**
 * Get project by ID
 */
export async function getProjectById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get all projects with pagination
 */
export async function getProjects(options: {
  limit?: number
  offset?: number
  status?: ProjectStatus
  projectType?: ProjectType
  organizationId?: string
  ownerId?: string
} = {}) {
  let query = (supabase as any).from('projects').select('*')
  
  if (options.status) {
    query = query.eq('status', options.status)
  }
  
  if (options.projectType) {
    query = query.eq('project_type', options.projectType)
  }
  
  if (options.organizationId) {
    query = query.eq('organization_id', options.organizationId)
  }
  
  if (options.ownerId) {
    query = query.eq('owner_id', options.ownerId)
  }
  
  if (options.limit) {
    const start = options.offset || 0
    const end = start + options.limit - 1
    query = query.range(start, end)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

/**
 * Get projects by owner
 */
export async function getProjectsByOwner(ownerId: string) {
  const { data, error } = await (supabase as any)
    .from('projects')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Get projects by organization
 */
export async function getProjectsByOrganization(organizationId: string) {
  const { data, error } = await (supabase as any)
    .from('projects')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Create a new project
 */
export async function createProject(projectData: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData as any)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Update project
 */
export async function updateProject(id: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Delete project
 */
export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

/**
 * Search projects by name
 */
export async function searchProjects(query: string, limit = 20) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get project count by status
 */
export async function getProjectCountByStatus() {
  const { data, error } = await supabase
    .from('projects')
    .select('status')
  
  if (error) throw error
  
  const counts = data.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1
    return acc
  }, {} as Record<ProjectStatus, number>)
  
  return counts
}

/**
 * Get active projects
 */
export async function getActiveProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Get project statistics
 */
export async function getProjectStatistics() {
  const { data, error } = await supabase
    .from('projects')
    .select('status, project_type, target_raise, total_notional')
  
  if (error) throw error
  
  const totalProjects = data.length
  const totalTargetRaise = data.reduce((sum, p) => sum + (p.target_raise || 0), 0)
  const totalNotional = data.reduce((sum, p) => sum + (p.total_notional || 0), 0)
  
  return {
    totalProjects,
    totalTargetRaise,
    totalNotional,
    utilizationRate: totalTargetRaise > 0 ? (totalNotional / totalTargetRaise) * 100 : 0
  }
}
