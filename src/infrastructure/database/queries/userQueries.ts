/**
 * User Queries - Database queries for user management
 */

import { supabase } from '@/infrastructure/database/client'
import type { User, UserStatus } from '@/types/core/centralModels'

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get all users with pagination
 */
export async function getUsers(options: {
  limit?: number
  offset?: number
  status?: UserStatus
} = {}) {
  let query = supabase.from('users').select('*')
  
  if (options.status) {
    query = query.eq('status', options.status)
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
 * Create a new user
 */
export async function createUser(userData: Partial<User>) {
  const { data, error } = await supabase
    .from('users')
    .insert(userData as any)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Update user
 */
export async function updateUser(id: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Delete user
 */
export async function deleteUser(id: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

/**
 * Search users by name or email
 */
export async function searchUsers(query: string, limit = 20) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get user count by status (role column doesn't exist in current schema)
 */
export async function getUserCountByStatus() {
  const { data, error } = await supabase
    .from('users')
    .select('status')
  
  if (error) throw error
  
  const counts = data.reduce((acc, user) => {
    acc[user.status] = (acc[user.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return counts
}

/**
 * Update user last login (using updated_at since last_sign_in_at doesn't exist)
 */
export async function updateUserLastLogin(id: string) {
  const { error } = await supabase
    .from('users')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)
  
  if (error) throw error
}
