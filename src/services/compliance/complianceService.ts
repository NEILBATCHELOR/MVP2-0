import { supabase } from "@/infrastructure/database/client";
import type { AuditLog, ComplianceCheck } from '@/types/domain/compliance/compliance';

// Create an audit log entry - DISABLED
export const createAuditLog = async (logData: {
  project_id: string;
  action: string;
  user_id: string;
  user_email: string;
  details: string;
  entity_id?: string;
  entity_type?: string;
  metadata?: any;
}): Promise<AuditLog> => {
  // Return a dummy audit log without actually creating one
  return {
    id: crypto.randomUUID(),
    project_id: logData.project_id,
    timestamp: new Date().toISOString(),
    action: logData.action,
    user_id: logData.user_id,
    user_email: logData.user_email,
    details: logData.details,
    entity_id: logData.entity_id,
    entity_type: logData.entity_type,
    ip_address: "127.0.0.1",
    metadata: logData.metadata,
  };
};

// Get audit logs for a project - DISABLED
export const getAuditLogs = async (
  projectId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<AuditLog[]> => {
  // Return empty array since audit logging is disabled
  return [];
};

// Create a compliance check for an investor
export const createComplianceCheck = async (checkData: {
  investor_id: string;
  project_id: string;
  risk_level: "low" | "medium" | "high";
  risk_reason: string;
}): Promise<ComplianceCheck> => {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("compliance_checks")
      .insert({
        investor_id: checkData.investor_id,
        project_id: checkData.project_id,
        risk_level: checkData.risk_level,
        risk_reason: checkData.risk_reason,
        status:
          checkData.risk_level === "high" ? "pending_approval" : "approved",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Transform the database response to match ComplianceCheck type
    return {
      id: data.id,
      type: 'RISK',
      status: data.status === 'pending_approval' ? 'PENDING' : 'COMPLETED',
      result: data.risk_level === 'high' ? 'REVIEW_REQUIRED' : 'PASS',
      details: {
        investorId: data.investor_id,
        projectId: data.project_id,
        riskLevel: data.risk_level,
        riskReason: data.risk_reason
      },
      createdAt: new Date(data.created_at),
      completedAt: data.status === 'approved' ? new Date(data.updated_at) : undefined
    };
  } catch (error) {
    console.error("Error creating compliance check:", error);
    throw error;
  }
};

// Get high-risk investors for a project
export const getHighRiskInvestors = async (
  projectId: string,
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("compliance_checks")
      .select(
        `
        id,
        investor_id,
        risk_level,
        risk_reason,
        status,
        reviewed_by,
        reviewed_at,
        investors!inner(name, email),
        subscriptions(id, fiat_amount)
      `,
      )
      .eq("project_id", projectId)
      .eq("risk_level", "high");

    if (error) throw error;

    // Transform data for the UI
    const transformedData =
      data?.map((check) => {
        // Properly cast subscriptions with unknown to avoid type errors
        const subscriptions = (check.subscriptions as unknown) as Array<{ id: string, fiat_amount: number }> | undefined;
        
        return {
          id: check.id,
          investor_id: check.investor_id,
          name: check.investors?.name,
          email: check.investors?.email,
          risk_level: check.risk_level,
          risk_reason: check.risk_reason,
          status: check.status,
          reviewed_by: check.reviewed_by,
          reviewed_at: check.reviewed_at,
          subscription_id: subscriptions && subscriptions[0] ? subscriptions[0].id : undefined,
          amount: subscriptions && subscriptions[0] ? subscriptions[0].fiat_amount || 0 : 0,
        };
      }) || [];

    return transformedData;
  } catch (error) {
    console.error("Error fetching high-risk investors:", error);
    throw error;
  }
};

// Update compliance check status
export const updateComplianceCheckStatus = async (
  checkId: string,
  status: "approved" | "rejected",
  userId: string,
): Promise<ComplianceCheck> => {
  try {
    const { data, error } = await supabase
      .from("compliance_checks")
      .update({
        status,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkId)
      .select()
      .single();

    if (error) throw error;
    
    // Transform the database response to match ComplianceCheck type
    return {
      id: data.id,
      type: 'RISK',
      status: data.status === 'approved' ? 'COMPLETED' : 'FAILED',
      result: data.status === 'approved' ? 'PASS' : 'FAIL',
      details: {
        investorId: data.investor_id,
        projectId: data.project_id,
        riskLevel: data.risk_level,
        riskReason: data.risk_reason,
        reviewedBy: data.reviewed_by,
        reviewedAt: data.reviewed_at
      },
      createdAt: new Date(data.created_at),
      completedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error("Error updating compliance check status:", error);
    throw error;
  }
};

// Check if a user has compliance officer role
export const isComplianceOfficer = async (userId: string): Promise<boolean> => {
  try {
    let query = supabase
      .from("user_roles")
      .select("*");
    
    query = (query as any).eq("user_id", userId).eq("role", "compliance_officer").single();
    
    const { data, error } = await query;

    if (error && error.code !== "PGRST116") throw error; // PGRST116 is "no rows returned"
    return !!data;
  } catch (error) {
    console.error("Error checking compliance officer role:", error);
    return false;
  }
};

// Stub functions for compliance checks used by useCompliance hook
export const verifyKyc = async (userId: string): Promise<{ data: any; error: any }> => {
  // TODO: implement real KYC verification logic
  return { data: null, error: null };
};

export const checkAccreditationStatus = async (userId: string): Promise<{ data: any; error: any }> => {
  // TODO: implement real accreditation status check
  return { data: null, error: null };
};

export const getJurisdictionRules = async (jurisdiction: string): Promise<{ data: any; error: any }> => {
  // TODO: implement real jurisdiction rules fetching logic
  return { data: null, error: null };
};

export const validateJurisdictionCompliance = async (
  jurisdiction: string,
  investorCount: number,
  minimumInvestment: number,
): Promise<{ data: any; error: any }> => {
  // TODO: implement real compliance validation logic
  return { data: null, error: null };
};

export const calculateRiskScore = async (
  userId: string,
  jurisdiction: string,
  investmentAmount: number,
): Promise<{ data: any; error: any }> => {
  // TODO: implement real risk score calculation logic
  return { data: null, error: null };
};
