import { RedemptionRequest, Approver } from "@/types/core/centralModels";

export const mapDbRedemptionRequestToRedemptionRequest = (dbRedemption: any): RedemptionRequest => {
  return {
    id: dbRedemption.id || "",
    requestDate: dbRedemption.request_date || null,
    tokenAmount: dbRedemption.token_amount || 0,
    tokenType: dbRedemption.token_type || "",
    redemptionType: dbRedemption.redemption_type || "",
    status: dbRedemption.status || "Pending",
    sourceWalletAddress: dbRedemption.source_wallet_address || "",
    destinationWalletAddress: dbRedemption.destination_wallet_address || "",
    conversionRate: dbRedemption.conversion_rate || 0,
    investorName: dbRedemption.investor_name || "",
    investorId: dbRedemption.investor_id || "",
    isBulkRedemption: dbRedemption.is_bulk_redemption || false,
    investorCount: dbRedemption.investor_count || 0,
    approvers: (dbRedemption.approvers || []).map(mapDbApproverToApprover),
    requiredApprovals: dbRedemption.required_approvals || 0,
    windowId: dbRedemption.window_id || "",
    processedAmount: dbRedemption.processed_amount || 0,
    processedDate: dbRedemption.processed_date || "",
    notes: dbRedemption.notes || "",
    createdAt: dbRedemption.created_at || "",
    rejected_by: dbRedemption.rejected_by || [],
    rejection_reason: dbRedemption.rejection_reason || "",
    rejection_timestamp: dbRedemption.rejection_timestamp || null,
    required_approvals: dbRedemption.required_approvals || 0,
    updated_at: dbRedemption.updated_at || ""
  };
};

export const mapDbApproverToApprover = (dbApprover: any): Approver => {
  return {
    id: dbApprover.id || "",
    name: dbApprover.name || "",
    role: dbApprover.role || "",
    avatarUrl: dbApprover.avatar_url || "",
    approved: dbApprover.approved || false,
    timestamp: dbApprover.timestamp || "",
  };
};
