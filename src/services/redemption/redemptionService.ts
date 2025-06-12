import { supabase } from "@/infrastructure/database/client";
import { v4 as uuidv4 } from "uuid";
import type { RedemptionRequest } from "@/infrastructure/api/approvalApi";
import { mapDbRedemptionToRedemptionRequest } from "@/utils/shared/formatting/typeMappers";
import type { Tables } from "@/types/core/database";

// Types
export interface RedemptionApprover {
  id: string;
  redemption_id: string;
  approver_id: string; // Add required field from database schema
  name: string;
  role: string;
  approved: boolean;
  approved_at?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

// Create a new redemption request
export async function createRedemptionRequest(
  requestData: Omit<RedemptionRequest, "id" | "requestDate">,
): Promise<RedemptionRequest | null> {
  // Transform the application model to database model
  const now = new Date().toISOString();
  const dbRedemptionRequest = {
    id: crypto.randomUUID(),
    request_date: now,
    token_amount: requestData.tokenAmount,
    token_type: requestData.tokenType,
    redemption_type: requestData.redemptionType,
    status: requestData.status,
    source_wallet_address: requestData.sourceWalletAddress,
    destination_wallet_address: requestData.destinationWalletAddress,
    conversion_rate: requestData.conversionRate,
    investor_name: requestData.investorName,
    investor_id: requestData.investorId,
    is_bulk_redemption: requestData.isBulkRedemption,
    investor_count: requestData.investorCount,
    approvers: requestData.approvers,
    required_approvals: requestData.requiredApprovals,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("redemption_requests")
    .insert(dbRedemptionRequest)
    .select()
    .single();

  if (error) {
    console.error("Error creating redemption request:", error);
    return null;
  }

  // Map DB data to application model
  return data ? mapDbRedemptionToRedemptionRequest(data) as RedemptionRequest : null;
}

// Get redemption requests
export async function getRedemptionRequests(): Promise<RedemptionRequest[]> {
  const { data, error } = await supabase
    .from("redemption_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching redemption requests:", error);
    throw error;
  }

  // Map each DB redemption to application model
  return data ? data.map(item => mapDbRedemptionToRedemptionRequest(item) as RedemptionRequest) : [];
}

// Get a specific redemption request
export async function getRedemptionRequest(
  id: string,
): Promise<RedemptionRequest | null> {
  const { data, error } = await supabase
    .from("redemption_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching redemption request ${id}:`, error);
    return null;
  }

  // Map DB data to application model
  return data ? mapDbRedemptionToRedemptionRequest(data) as RedemptionRequest : null;
}

// Update a redemption request
export const updateRedemptionRequest = async (
  id: string,
  updateData: Partial<
    Omit<RedemptionRequest, "id" | "created_at" | "updated_at">
  >,
): Promise<RedemptionRequest> => {
  try {
    const now = new Date().toISOString();

    // Transform updateData from camelCase (application model) to snake_case (DB model)
    const dbUpdateData: Record<string, any> = {};
    if (updateData.tokenAmount !== undefined) dbUpdateData.token_amount = updateData.tokenAmount;
    if (updateData.tokenType !== undefined) dbUpdateData.token_type = updateData.tokenType;
    if (updateData.redemptionType !== undefined) dbUpdateData.redemption_type = updateData.redemptionType;
    if (updateData.status !== undefined) dbUpdateData.status = updateData.status;
    if (updateData.sourceWalletAddress !== undefined) dbUpdateData.source_wallet_address = updateData.sourceWalletAddress;
    if (updateData.destinationWalletAddress !== undefined) dbUpdateData.destination_wallet_address = updateData.destinationWalletAddress;
    if (updateData.conversionRate !== undefined) dbUpdateData.conversion_rate = updateData.conversionRate;
    if (updateData.investorName !== undefined) dbUpdateData.investor_name = updateData.investorName;
    if (updateData.investorId !== undefined) dbUpdateData.investor_id = updateData.investorId;
    if (updateData.isBulkRedemption !== undefined) dbUpdateData.is_bulk_redemption = updateData.isBulkRedemption;
    if (updateData.investorCount !== undefined) dbUpdateData.investor_count = updateData.investorCount;
    if (updateData.approvers !== undefined) dbUpdateData.approvers = updateData.approvers;
    if (updateData.requiredApprovals !== undefined) dbUpdateData.required_approvals = updateData.requiredApprovals;

    const { data, error } = await supabase
      .from("redemption_requests")
      .update({
        ...dbUpdateData,
        updated_at: now,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating redemption request with ID ${id}:`, error);
      throw error;
    }

    // Map the database response to the application model
    return mapDbRedemptionToRedemptionRequest(data) as RedemptionRequest;
  } catch (error) {
    console.error(`Error in updateRedemptionRequest for ID ${id}:`, error);
    throw error;
  }
};

// Delete a redemption request
export const deleteRedemptionRequest = async (id: string): Promise<void> => {
  try {
    // First delete any approvers for this redemption
    const { error: approversError } = await supabase
      .from("redemption_approvers")
      .delete()
      .eq("redemption_id", id);

    if (approversError) {
      console.error(
        `Error deleting approvers for redemption ${id}:`,
        approversError,
      );
      throw approversError;
    }

    // Then delete the redemption request
    const { error } = await supabase
      .from("redemption_requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting redemption request with ID ${id}:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`Error in deleteRedemptionRequest for ID ${id}:`, error);
    throw error;
  }
};

// Add an approver to a redemption request
export const addRedemptionApprover = async (
  approverData: Omit<
    RedemptionApprover,
    "id" | "created_at" | "approved" | "approved_at"
  > & {
    approver_id: string; // Add required approver_id field
    approved?: boolean;
    approved_at?: string | null;
  },
): Promise<RedemptionApprover> => {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();

    const newApprover = {
      id,
      ...approverData,
      approved: approverData.approved || false,
      approved_at: approverData.approved_at || null,
      created_at: now,
    };

    const { data, error } = await supabase
      .from("redemption_approvers")
      .insert(newApprover)
      .select()
      .single();

    if (error) {
      console.error("Error adding redemption approver:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in addRedemptionApprover:", error);
    throw error;
  }
};

// Update an approver's status
export const updateApproverStatus = async (
  id: string,
  approved: boolean,
): Promise<RedemptionApprover> => {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("redemption_approvers")
      .update({
        approved,
        approved_at: approved ? now : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating approver with ID ${id}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error in updateApproverStatus for ID ${id}:`, error);
    throw error;
  }
};

// Get all approvers for a redemption request
export const getRedemptionApprovers = async (
  redemptionId: string,
): Promise<RedemptionApprover[]> => {
  try {
    const { data, error } = await supabase
      .from("redemption_approvers")
      .select("*")
      .eq("redemption_id", redemptionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        `Error fetching approvers for redemption ${redemptionId}:`,
        error,
      );
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(
      `Error in getRedemptionApprovers for redemption ${redemptionId}:`,
      error,
    );
    throw error;
  }
};

// Check if all required approvals have been received
export const checkRedemptionApprovalStatus = async (
  redemptionId: string,
): Promise<{
  approved: boolean;
  approvalCount: number;
  requiredCount: number;
}> => {
  try {
    // Get the redemption request to check required approvals
    const { data: redemption, error: redemptionError } = await supabase
      .from("redemption_requests")
      .select("required_approvals")
      .eq("id", redemptionId)
      .single();

    if (redemptionError) {
      console.error(
        `Error fetching redemption ${redemptionId}:`,
        redemptionError,
      );
      throw redemptionError;
    }

    // Get all approvers for this redemption
    const { data: approvers, error: approversError } = await supabase
      .from("redemption_approvers")
      .select("approved")
      .eq("redemption_id", redemptionId);

    if (approversError) {
      console.error(
        `Error fetching approvers for redemption ${redemptionId}:`,
        approversError,
      );
      throw approversError;
    }

    const requiredCount = redemption?.required_approvals || 0;
    const approvalCount = approvers?.filter((a) => a.approved).length || 0;

    return {
      approved: approvalCount >= requiredCount,
      approvalCount,
      requiredCount,
    };
  } catch (error) {
    console.error(
      `Error in checkRedemptionApprovalStatus for redemption ${redemptionId}:`,
      error,
    );
    throw error;
  }
};

// Process a redemption (mark as completed after approvals)
export const processRedemption = async (
  redemptionId: string,
): Promise<RedemptionRequest> => {
  try {
    // Check if all approvals have been received
    const { approved } = await checkRedemptionApprovalStatus(redemptionId);

    if (!approved) {
      throw new Error("Not all required approvals have been received");
    }

    // Update the redemption status to completed
    const { data, error } = await supabase
      .from("redemption_requests")
      .update({
        status: "Completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", redemptionId)
      .select()
      .single();

    if (error) {
      console.error(`Error processing redemption ${redemptionId}:`, error);
      throw error;
    }

    // Map the database response to the application model
    return mapDbRedemptionToRedemptionRequest(data) as RedemptionRequest;
  } catch (error) {
    console.error(`Error in processRedemption for ID ${redemptionId}:`, error);
    throw error;
  }
};

// Reject a redemption request
export const rejectRedemption = async (
  redemptionId: string,
  rejectedBy: string,
  rejectionReason: string,
): Promise<RedemptionRequest> => {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("redemption_requests")
      .update({
        status: "Rejected",
        rejected_by: rejectedBy,
        rejection_reason: rejectionReason,
        rejection_timestamp: now,
        updated_at: now,
      })
      .eq("id", redemptionId)
      .select()
      .single();

    if (error) {
      console.error(`Error rejecting redemption ${redemptionId}:`, error);
      throw error;
    }

    // Map the database response to the application model
    return mapDbRedemptionToRedemptionRequest(data) as RedemptionRequest;
  } catch (error) {
    console.error(`Error in rejectRedemption for ID ${redemptionId}:`, error);
    throw error;
  }
};

// Export utilities remain the same, just ensure they use the correctly typed data
export const redemptionRequestToCsv = (request: RedemptionRequest): string => {
  // Process a single request to CSV
  const headers = [
    "ID",
    "Date",
    "Token Amount",
    "Token Type",
    "Status",
    "Investor",
    "Source Wallet",
    "Destination Wallet",
  ];

  const row = [
    request.id,
    typeof request.requestDate === "object"
      ? request.requestDate ? (request.requestDate as Date).toISOString() : new Date().toISOString()
      : request.requestDate,
    String(request.tokenAmount),
    request.tokenType,
    request.status,
    request.investorName,
    request.sourceWalletAddress,
    request.destinationWalletAddress,
  ];

  return `${headers.join(",")}\n${row.join(",")}`;
};

export const redemptionRequestsToCsv = (
  requests: RedemptionRequest[],
): string => {
  if (requests.length === 0) return "";

  const headers = [
    "ID",
    "Date",
    "Token Amount",
    "Token Type",
    "Status",
    "Investor",
    "Source Wallet",
    "Destination Wallet",
  ];

  const rows = requests.map((request) =>
    [
      request.id,
      typeof request.requestDate === "object"
        ? request.requestDate ? (request.requestDate as Date).toISOString() : new Date().toISOString()
        : request.requestDate,
      String(request.tokenAmount),
      request.tokenType,
      request.status,
      request.investorName,
      request.sourceWalletAddress,
      request.destinationWalletAddress,
    ].join(","),
  );

  return [headers.join(","), ...rows].join("\n");
};
