/**
 * Compliance Queries - Database queries for compliance management
 */

import { supabase } from '@/infrastructure/database/client'
import type { KycStatus, AccreditationStatus, InvestorStatus } from '@/types/core/centralModels'

/**
 * Get compliance check by ID
 */
export async function getComplianceCheckById(id: string) {
  const { data, error } = await supabase
    .from('compliance_checks')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get compliance checks for investor
 */
export async function getComplianceChecksByInvestor(investorId: string) {
  const { data, error } = await supabase
    .from('compliance_checks')
    .select('*')
    .eq('investor_id', investorId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Get all compliance checks with pagination
 */
export async function getComplianceChecks(options: {
  limit?: number
  offset?: number
  status?: string
  investorId?: string
  projectId?: string
} = {}) {
  let query = supabase.from('compliance_checks').select('*')
  
  if (options.status) {
    query = query.eq('status', options.status)
  }
  
  if (options.investorId) {
    query = query.eq('investor_id', options.investorId)
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
 * Create compliance check
 */
export async function createComplianceCheck(checkData: {
  investorId: string
  projectId: string
  riskLevel: string
  riskReason: string
  status: string
  reviewedBy?: string
}) {
  const { data, error } = await supabase
    .from('compliance_checks')
    .insert({
      investor_id: checkData.investorId,
      project_id: checkData.projectId,
      risk_level: checkData.riskLevel,
      risk_reason: checkData.riskReason,
      status: checkData.status,
      reviewed_by: checkData.reviewedBy,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Update compliance check
 */
export async function updateComplianceCheck(id: string, updates: {
  status?: string
  details?: any
  completedAt?: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from('compliance_checks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get KYC status for investor
 */
export async function getInvestorKycStatus(investorId: string) {
  const { data, error } = await (supabase as any)
    .from('investors')
    .select('kyc_status, kyc_verified_at, kyc_expiry_date')
    .eq('investor_id', investorId)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Update investor KYC status
 */
export async function updateInvestorKycStatus(
  investorId: string, 
  status: KycStatus, 
  verifiedAt?: string,
  expiryDate?: string
) {
  const updates: any = {
    kyc_status: status,
    updated_at: new Date().toISOString()
  }
  
  if (verifiedAt) {
    updates.kyc_verified_at = verifiedAt
  }
  
  if (expiryDate) {
    updates.kyc_expiry_date = expiryDate
  }
  
  const { data, error } = await (supabase as any)
    .from('investors')
    .update(updates)
    .eq('investor_id', investorId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get accreditation status for investor
 */
export async function getInvestorAccreditationStatus(investorId: string) {
  const { data, error } = await (supabase as any)
    .from('investors')
    .select('accreditation_status, accreditation_verified_at, accreditation_expires_at, accreditation_type')
    .eq('investor_id', investorId)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Update investor accreditation status
 */
export async function updateInvestorAccreditationStatus(
  investorId: string,
  status: AccreditationStatus,
  verificationType?: string,
  verifiedAt?: string,
  expiresAt?: string
) {
  const updates: any = {
    accreditation_status: status,
    updated_at: new Date().toISOString()
  }
  
  if (verificationType) {
    updates.accreditation_type = verificationType
  }
  
  if (verifiedAt) {
    updates.accreditation_verified_at = verifiedAt
  }
  
  if (expiresAt) {
    updates.accreditation_expires_at = expiresAt
  }
  
  const { data, error } = await (supabase as any)
    .from('investors')
    .update(updates)
    .eq('investor_id', investorId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get pending compliance checks
 */
export async function getPendingComplianceChecks() {
  const { data, error } = await supabase
    .from('compliance_checks')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}

/**
 * Get compliance statistics
 */
export async function getComplianceStatistics() {
  const { data: investors, error: investorsError } = await (supabase as any)
    .from('investors')
    .select('kyc_status, accreditation_status, investor_status')
  
  if (investorsError) throw investorsError
  
  const { data: checks, error: checksError } = await (supabase as any)
    .from('compliance_checks')
    .select('status, risk_level')
  
  if (checksError) throw checksError
  
  const kycStats = investors.reduce((acc: any, inv: any) => {
    acc[inv.kyc_status] = (acc[inv.kyc_status] || 0) + 1
    return acc
  }, {} as Record<KycStatus, number>)
  
  const accreditationStats = investors.reduce((acc: any, inv: any) => {
    acc[inv.accreditation_status] = (acc[inv.accreditation_status] || 0) + 1
    return acc
  }, {} as Record<AccreditationStatus, number>)
  
  const checkStats = checks.reduce((acc: any, check: any) => {
    acc[check.status] = (acc[check.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return {
    kycStats,
    accreditationStats,
    checkStats,
    totalInvestors: investors.length,
    totalChecks: checks.length,
    pendingChecks: checkStats.pending || 0
  }
}

/**
 * Get investors needing compliance review
 */
export async function getInvestorsNeedingReview() {
  const { data, error } = await (supabase as any)
    .from('investors')
    .select('*')
    .or('kyc_status.eq.pending,accreditation_status.eq.pending,investor_status.eq.pending')
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}

/**
 * Get expiring KYC documents
 */
export async function getExpiringKycDocuments(daysAhead = 30) {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + daysAhead)
  
  const { data, error } = await (supabase as any)
    .from('investors')
    .select('*')
    .eq('kyc_status', 'approved')
    .lte('kyc_expiry_date', expiryDate.toISOString())
    .order('kyc_expiry_date', { ascending: true })
  
  if (error) throw error
  return data
}

/**
 * Get compliance audit trail
 */
export async function getComplianceAuditTrail(investorId: string) {
  const complianceActions = ['kyc_updated', 'accreditation_updated', 'compliance_check_created', 'compliance_check_updated'];
  
  // Use simpler query to avoid deep type instantiation
  const { data, error } = await (supabase as any)
    .from('audit_logs')
    .select('*')
    .eq('entity_id', investorId)
    .in('action', complianceActions as any)
    .order('timestamp', { ascending: false });
  
  if (error) throw error
  return data
}
