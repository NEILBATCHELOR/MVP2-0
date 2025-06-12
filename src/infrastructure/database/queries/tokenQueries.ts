/**
 * Token Queries - Database queries for token management
 */

import { supabase } from '@/infrastructure/database/client'
import type { Token, TokenStatus, TokenStandard } from '@/types/core/centralModels'

/**
 * Get token by ID
 */
export async function getTokenById(id: string) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get all tokens with pagination
 */
export async function getTokens(options: {
  limit?: number
  offset?: number
  status?: TokenStatus
  standard?: TokenStandard
  projectId?: string
} = {}) {
  let query = supabase.from('tokens').select('*')
  
  if (options.status) {
    query = query.eq('status', options.status)
  }
  
  if (options.standard) {
    query = query.eq('standard', options.standard)
  }
  
  if (options.projectId) {
    query = query.eq('project_id', options.projectId)
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
 * Get tokens by project
 */
export async function getTokensByProject(projectId: string) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Get tokens by standard
 */
export async function getTokensByStandard(standard: TokenStandard) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('standard', standard)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Create a new token
 */
export async function createToken(tokenData: Partial<Token>) {
  const { data, error } = await supabase
    .from('tokens')
    .insert(tokenData as any)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Update token
 */
export async function updateToken(id: string, updates: Partial<Token>) {
  const { data, error } = await supabase
    .from('tokens')
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Delete token
 */
export async function deleteToken(id: string) {
  const { error } = await supabase
    .from('tokens')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

/**
 * Search tokens by name or symbol
 */
export async function searchTokens(query: string, limit = 20) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .or(`name.ilike.%${query}%,symbol.ilike.%${query}%`)
    .limit(limit)
  
  if (error) throw error
  return data
}

/**
 * Get token count by status
 */
export async function getTokenCountByStatus() {
  const { data, error } = await supabase
    .from('tokens')
    .select('status')
  
  if (error) throw error
  
  const counts = data.reduce((acc, token) => {
    acc[token.status] = (acc[token.status] || 0) + 1
    return acc
  }, {} as Record<TokenStatus, number>)
  
  return counts
}

/**
 * Get token count by standard
 */
export async function getTokenCountByStandard() {
  const { data, error } = await supabase
    .from('tokens')
    .select('standard')
  
  if (error) throw error
  
  const counts = data.reduce((acc, token) => {
    acc[token.standard] = (acc[token.standard] || 0) + 1
    return acc
  }, {} as Record<TokenStandard, number>)
  
  return counts
}

/**
 * Get deployed tokens
 */
export async function getDeployedTokens() {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('status', 'DEPLOYED')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Get token deployments
 */
export async function getTokenDeployments(tokenId: string) {
  const { data, error } = await supabase
    .from('token_deployments')
    .select('*')
    .eq('token_id', tokenId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Get token operations
 */
export async function getTokenOperations(tokenId: string) {
  const { data, error } = await supabase
    .from('token_operations')
    .select('*')
    .eq('token_id', tokenId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Get token allocations
 */
export async function getTokenAllocations(tokenId: string) {
  const { data, error } = await supabase
    .from('token_allocations')
    .select('*')
    .eq('token_id', tokenId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Get token statistics
 */
export async function getTokenStatistics() {
  const { data, error } = await supabase
    .from('tokens')
    .select('status, standard, total_supply')
  
  if (error) throw error
  
  const totalTokens = data.length
  const deployedTokens = data.filter(t => t.status === 'DEPLOYED').length
  const totalSupply = data.reduce((sum, t) => sum + (parseInt(t.total_supply || '0') || 0), 0)
  
  return {
    totalTokens,
    deployedTokens,
    deploymentRate: totalTokens > 0 ? (deployedTokens / totalTokens) * 100 : 0,
    totalSupply
  }
}
