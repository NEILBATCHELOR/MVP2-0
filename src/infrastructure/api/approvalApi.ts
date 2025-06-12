import { v4 as uuidv4 } from "uuid";
import { BaseRedemptionRequest, Approver } from "@/types/core/centralModels";
import type { 
  RedemptionRequestsTable, 
  RedemptionApproversTable,
  RedemptionRequestInsert,
  RedemptionApproverInsert 
} from "@/types/core/database";
import { supabase } from "@/infrastructure/database/client";

// Align with BaseRedemptionRequest from centralModels
export type RedemptionRequest = Omit<BaseRedemptionRequest, 'createdAt' | 'updatedAt'> & {
  id: string;
  requestDate: string;
};

// Empty array for redemption requests - all data will come from Supabase
let redemptionRequests: RedemptionRequest[] = [];

// API functions

// Get all redemption requests
export const getAllRedemptionRequests = async (): Promise<RedemptionRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('redemption_requests')
      .select(`
        *,
        redemption_approvers (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data as (RedemptionRequestsTable & { redemption_approvers: RedemptionApproversTable[] })[]).map(request => ({
      id: request.id,
      requestDate: request.created_at,
      tokenAmount: request.token_amount,
      tokenType: request.token_type,
      redemptionType: request.redemption_type,
      status: request.status as RedemptionRequest['status'],
      sourceWalletAddress: request.source_wallet_address,
      destinationWalletAddress: request.destination_wallet_address,
      conversionRate: request.conversion_rate,
      investorName: request.investor_name || undefined,
      investorId: request.investor_id || undefined,
      approvers: request.redemption_approvers.map((approver): Approver => ({
        id: approver.id,
        name: approver.name,
        role: approver.role,
        avatarUrl: approver.avatar_url || 
          `https://api.dicebear.com/7.x/initials/svg?seed=${approver.name.toLowerCase().replace(/\s+/g, "")}`,
        approved: approver.approved,
        timestamp: approver.approved_at || undefined
      })),
      requiredApprovals: request.required_approvals,
      isBulkRedemption: request.is_bulk_redemption || false,
      investorCount: request.investor_count || 1,
      createdAt: request.created_at,
      updatedAt: request.updated_at
    }));
  } catch (error) {
    console.error("Error fetching redemption requests:", error);
    return [];
  }
};

// Get a specific redemption request by ID
export const getRedemptionRequestById = async (id: string): Promise<RedemptionRequest | null> => {
  try {
    const { data, error } = await supabase
      .from('redemption_requests')
      .select(`
        *,
        redemption_approvers (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const request = data as RedemptionRequestsTable & { redemption_approvers: RedemptionApproversTable[] };

    return {
      id: request.id,
      requestDate: request.created_at,
      tokenAmount: request.token_amount,
      tokenType: request.token_type,
      redemptionType: request.redemption_type,
      status: request.status as RedemptionRequest['status'],
      sourceWalletAddress: request.source_wallet_address,
      destinationWalletAddress: request.destination_wallet_address,
      conversionRate: request.conversion_rate,
      investorName: request.investor_name || '',
      investorId: request.investor_id || '',
      approvers: request.redemption_approvers.map((approver): Approver => ({
        id: approver.id,
        name: approver.name,
        role: approver.role,
        avatarUrl: approver.avatar_url || 
          `https://api.dicebear.com/7.x/initials/svg?seed=${approver.name.toLowerCase().replace(/\s+/g, "")}`,
        approved: approver.approved,
        timestamp: approver.approved_at || undefined
      })),
      requiredApprovals: request.required_approvals,
      isBulkRedemption: request.is_bulk_redemption || false,
      investorCount: request.investor_count || 1
    };
  } catch (error) {
    console.error(`Error fetching redemption request with ID ${id}:`, error);
    return null;
  }
};

// Create a new redemption request
export const createRedemptionRequest = async (
  request: Omit<RedemptionRequest, "id">
): Promise<RedemptionRequest> => {
  try {
    const dbRequest: RedemptionRequestInsert = {
      token_amount: request.tokenAmount,
      token_type: request.tokenType,
      redemption_type: request.redemptionType,
      status: request.status,
      source_wallet_address: request.sourceWalletAddress,
      destination_wallet_address: request.destinationWalletAddress,
      conversion_rate: request.conversionRate,
      investor_name: request.investorName,
      investor_id: request.investorId,
      required_approvals: request.requiredApprovals,
      is_bulk_redemption: request.isBulkRedemption || false,
      investor_count: request.investorCount || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('redemption_requests')
      .insert(dbRequest)
      .select()
      .single();

    if (error) throw error;

    if (request.approvers && request.approvers.length > 0) {
      const approversData: RedemptionApproverInsert[] = request.approvers.map(approver => ({
        redemption_id: data.id,
        approver_id: approver.id, // Add required approver_id field
        name: approver.name,
        role: approver.role,
        avatar_url: approver.avatarUrl,
        approved: approver.approved || false,
        approved_at: approver.timestamp || null,
        created_at: new Date().toISOString()
      }));

      const { error: approversError } = await supabase
        .from('redemption_approvers')
        .insert(approversData);

      if (approversError) throw approversError;
    }

    return await getRedemptionRequestById(data.id);
  } catch (error) {
    console.error("Error creating redemption request:", error);
    throw error;
  }
};

// Update a redemption request status
export const updateRedemptionStatus = async (
  id: string,
  status: RedemptionRequest["status"],
): Promise<RedemptionRequest | null> => {
  try {
    const { data, error } = await supabase
      .from("redemption_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Return the updated request with the format expected by the frontend
    return await getRedemptionRequestById(id);
  } catch (error) {
    console.error(`Error updating status for redemption request ${id}:`, error);
    return null;
  }
};

// Approve a redemption request
export const approveRedemptionRequest = async (
  requestId: string,
  approverId: string,
): Promise<RedemptionRequest | null> => {
  try {
    const now = new Date().toISOString();

    // Update the approver
    const { data: approver, error: approverError } = await supabase
      .from("redemption_approvers")
      .update({
        approved: true,
        approved_at: now,
      })
      .eq("id", approverId)
      .eq("redemption_id", requestId)
      .select()
      .single();

    if (approverError) throw approverError;

    // Get the request to check if we've reached required approvals
    const { data: request, error: requestError } = await supabase
      .from("redemption_requests")
      .select(
        `
        *,
        approvers:redemption_approvers(id, approved)
      `,
      )
      .eq("id", requestId)
      .single();

    if (requestError) throw requestError;

    // Check if we've reached the required approvals
    const approvedCount = request.approvers.filter(
      (app) => app.approved,
    ).length;

    // Update status if needed
    if (
      approvedCount >= request.required_approvals &&
      request.status === "Pending"
    ) {
      const { error: updateError } = await supabase
        .from("redemption_requests")
        .update({
          status: "Approved",
          updated_at: now,
        })
        .eq("id", requestId);

      if (updateError) throw updateError;
    }

    // Return the updated request
    return await getRedemptionRequestById(requestId);
  } catch (error) {
    console.error(`Error approving redemption request ${requestId}:`, error);
    return null;
  }
};

// Reject a redemption request
export const rejectRedemptionRequest = async (
  requestId: string,
  approverId: string,
  reason: string,
): Promise<RedemptionRequest | null> => {
  try {
    const now = new Date().toISOString();

    // Update the request status to rejected
    const { data, error } = await supabase
      .from("redemption_requests")
      .update({
        status: "Rejected",
        rejection_reason: reason,
        rejected_by: approverId,
        rejection_timestamp: now,
        updated_at: now,
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) throw error;

    // Return the updated request
    return await getRedemptionRequestById(requestId);
  } catch (error) {
    console.error(`Error rejecting redemption request ${requestId}:`, error);
    return null;
  }
};

// Get all approvers
export const getAllApprovers = async (): Promise<Approver[]> => {
  try {
    const { data, error } = await supabase
      .from("redemption_approvers")
      .select("*")
      .order("name");

    if (error) throw error;

    // Transform data to match our interface
    return (
      data?.map((approver) => ({
        id: approver.id,
        name: approver.name,
        role: approver.role,
        avatarUrl:
          approver.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${approver.name.toLowerCase().replace(/\s+/g, "")}`,
        approved: false, // Reset approval status for the list view
        timestamp: undefined,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching approvers:", error);
    return [];
  }
};

// Get pending approvals for an approver
export const getPendingApprovalsForApprover = async (
  approverId: string,
): Promise<RedemptionRequest[]> => {
  try {
    // First get all redemption IDs where this approver is assigned but hasn't approved yet
    const { data: pendingApprovals, error: approvalError } = await supabase
      .from("redemption_approvers")
      .select("redemption_id")
      .eq("id", approverId)
      .eq("approved", false);

    if (approvalError) throw approvalError;
    if (!pendingApprovals || pendingApprovals.length === 0) return [];

    // Get the redemption requests that are still pending
    const redemptionIds = pendingApprovals.map((a) => a.redemption_id);
    const { data, error } = await supabase
      .from("redemption_requests")
      .select(
        `
        *,
        approvers:redemption_approvers(*)
      `,
      )
      .in("id", redemptionIds)
      .eq("status", "Pending");

    if (error) throw error;

    // Transform data to match our interface
    return (
      data?.map((item) => ({
        id: item.id,
        requestDate: item.created_at,
        tokenAmount: item.token_amount,
        tokenType: item.token_type,
        redemptionType: item.redemption_type,
        status: item.status as
          | "Pending"
          | "Approved"
          | "Processing"
          | "Completed"
          | "Rejected",
        sourceWalletAddress: item.source_wallet_address,
        destinationWalletAddress: item.destination_wallet_address,
        conversionRate: item.conversion_rate,
        investorName: item.investor_name,
        investorId: item.investor_id,
        approvers:
          item.approvers?.map((approver) => ({
            id: approver.id,
            name: approver.name,
            role: approver.role,
            avatarUrl:
              approver.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${approver.name.toLowerCase().replace(/\s+/g, "")}`,
            approved: approver.approved,
            timestamp: approver.approved_at,
          })) || [],
        requiredApprovals: item.required_approvals,
        isBulkRedemption: item.is_bulk_redemption,
        investorCount: item.investor_count,
      })) || []
    );
  } catch (error) {
    console.error(
      `Error fetching pending approvals for approver ${approverId}:`,
      error,
    );
    return [];
  }
};

// Get approval history for an approver
export const getApprovalHistoryForApprover = async (
  approverId: string,
): Promise<RedemptionRequest[]> => {
  try {
    // First get all redemption IDs where this approver has approved
    const { data: approvedItems, error: approvalError } = await supabase
      .from("redemption_approvers")
      .select("redemption_id")
      .eq("id", approverId)
      .eq("approved", true);

    if (approvalError) throw approvalError;
    if (!approvedItems || approvedItems.length === 0) return [];

    // Get the redemption requests
    const redemptionIds = approvedItems.map((a) => a.redemption_id);
    const { data, error } = await supabase
      .from("redemption_requests")
      .select(
        `
        *,
        approvers:redemption_approvers(*)
      `,
      )
      .in("id", redemptionIds);

    if (error) throw error;

    // Transform data to match our interface
    return (
      data?.map((item) => ({
        id: item.id,
        requestDate: item.created_at,
        tokenAmount: item.token_amount,
        tokenType: item.token_type,
        redemptionType: item.redemption_type,
        status: item.status as
          | "Pending"
          | "Approved"
          | "Processing"
          | "Completed"
          | "Rejected",
        sourceWalletAddress: item.source_wallet_address,
        destinationWalletAddress: item.destination_wallet_address,
        conversionRate: item.conversion_rate,
        investorName: item.investor_name,
        investorId: item.investor_id,
        approvers:
          item.approvers?.map((approver) => ({
            id: approver.id,
            name: approver.name,
            role: approver.role,
            avatarUrl:
              approver.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${approver.name.toLowerCase().replace(/\s+/g, "")}`,
            approved: approver.approved,
            timestamp: approver.approved_at,
          })) || [],
        requiredApprovals: item.required_approvals,
        isBulkRedemption: item.is_bulk_redemption,
        investorCount: item.investor_count,
      })) || []
    );
  } catch (error) {
    console.error(
      `Error fetching approval history for approver ${approverId}:`,
      error,
    );
    return [];
  }
};
