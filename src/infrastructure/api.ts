import { supabase, executeWithRetry } from "@/infrastructure/database/client";
import { DocumentMetadata } from "@/services/document/documentStorage";
import type { Json, Database } from "@/types/core/supabase";

// Types for API responses
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Document verification API functions
export async function verifyDocument(
  documentId: string,
): Promise<ApiResponse<DocumentMetadata>> {
  try {
    const { data, error } = await executeWithRetry(() => 
      supabase
        .from("documents")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", documentId)
        .select()
        .single()
    );

    if (error) throw error;

    // Audit logging disabled

    // Transform the data to match our DocumentMetadata interface
    const transformedData: DocumentMetadata = {
      id: data.id,
      name: data.name,
      status: data.status,
      dateUpdated: data.updated_at,
      entity_id: data.entity_id,
      entity_type: data.entity_type,
      type: data.type,
      fileUrl: data.file_url,
      filePath: data.file_path,
      file_url: data.file_url,
      file_path: data.file_path,
      category: data.category,
      project_id: data.project_id,
      uploaded_by: data.uploaded_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      description:
        data.metadata && typeof data.metadata === "object"
          ? typeof data.metadata === "object" && data.metadata !== null
            ? (data.metadata as any).description
            : undefined
          : undefined,
      metadata: data.metadata,
    };

    return { data: transformedData, status: 200 };
  } catch (error: any) {
    console.error("Error verifying document:", error);
    return { error: "Failed to verify document", status: 500 };
  }
}

export async function rejectDocument(
  documentId: string,
  reason: string,
): Promise<ApiResponse<DocumentMetadata>> {
  try {
    const { data, error } = await executeWithRetry(() => 
      supabase
        .from("documents")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
          metadata: { rejectionReason: reason },
        })
        .eq("id", documentId)
        .select()
        .single()
    );

    if (error) throw error;

    // Audit logging disabled

    // Transform the data to match our DocumentMetadata interface
    const transformedData: DocumentMetadata = {
      id: data.id,
      name: data.name,
      status: data.status,
      dateUpdated: data.updated_at,
      entity_id: data.entity_id,
      entity_type: data.entity_type,
      type: data.type,
      fileUrl: data.file_url,
      filePath: data.file_path,
      file_url: data.file_url,
      file_path: data.file_path,
      category: data.category,
      project_id: data.project_id,
      uploaded_by: data.uploaded_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      rejectionReason: reason,
      metadata: data.metadata,
    };

    return { data: transformedData, status: 200 };
  } catch (error: any) {
    console.error("Error rejecting document:", error);
    return { error: "Failed to reject document", status: 500 };
  }
}

// KYC/AML status API functions
export async function updateKycStatus(
  userId: string,
  status: "pending" | "completed" | "failed",
  notes?: string,
): Promise<ApiResponse<Database['public']['Tables']['compliance_settings']['Row']>> {
  try {
    const { data, error } = await executeWithRetry(() => {
      let query = supabase
        .from("compliance_settings")
        .update({
          kyc_status: status,
          kyc_notes: notes,
          updated_at: new Date().toISOString(),
        });
      
      query = (query as any).eq("user_id", userId).select().single();
      return query;
    });

    if (error) throw error;

    // Audit logging disabled

    return { data, status: 200 };
  } catch (error: any) {
    console.error("Error updating KYC status:", error);
    return { error: "Failed to update KYC status", status: 500 };
  }
}

// Wallet activation API functions
export async function activateWallet(
  walletAddress: string,
): Promise<ApiResponse<Database['public']['Tables']['multi_sig_wallets']['Row']>> {
  try {
    // Create a custom field for status in the database
    const { data, error } = await executeWithRetry(() => 
      supabase
        .from("multi_sig_wallets")
        .update({
          // Use a separate update object that doesn't include blockchain_specific_data
          updated_at: new Date().toISOString(),
        })
        .eq("address", walletAddress)
        .select()
        .single()
    );

    if (error) throw error;

    return { data, status: 200 };
  } catch (error: any) {
    console.error("Error activating wallet:", error);
    return { error: "Failed to activate wallet", status: 500 };
  }
}

export async function blockWallet(
  walletAddress: string,
  reason: string,
): Promise<ApiResponse<Database['public']['Tables']['multi_sig_wallets']['Row']>> {
  try {
    const { data, error } = await executeWithRetry(() => 
      supabase
        .from("multi_sig_wallets")
        .update({
          // Use a separate update object that doesn't include blockchain_specific_data
          updated_at: new Date().toISOString(),
        })
        .eq("address", walletAddress)
        .select()
        .single()
    );

    if (error) throw error;

    return { data, status: 200 };
  } catch (error: any) {
    console.error("Error blocking wallet:", error);
    return { error: "Failed to block wallet", status: 500 };
  }
}

// Workflow stage API functions
export async function updateWorkflowStage(
  stageId: string,
  status: "completed" | "in_progress" | "pending" | "error",
  completionPercentage?: number,
): Promise<ApiResponse<Database['public']['Tables']['workflow_stages']['Row']>> {
  try {
    const { data, error } = await executeWithRetry(() => 
      supabase
        .from("workflow_stages")
        .update({
          status,
          completion_percentage: completionPercentage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stageId)
        .select()
        .single()
    );

    if (error) throw error;

    return { data, status: 200 };
  } catch (error: any) {
    console.error("Error updating workflow stage:", error);
    return { error: "Failed to update workflow stage", status: 500 };
  }
}

// Investor approval API functions
export async function approveInvestor(
  investorId: string,
): Promise<ApiResponse<Database['public']['Tables']['investors']['Row']>> {
  try {
    const { data, error } = await executeWithRetry(() => 
      supabase
        .from("investors")
        .update({
          kyc_status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("investor_id", investorId)
        .select()
        .single()
    );

    if (error) throw error;

    // Audit logging disabled

    return { data, status: 200 };
  } catch (error: any) {
    console.error("Error approving investor:", error);
    return { error: "Failed to approve investor", status: 500 };
  }
}

export async function rejectInvestor(
  investorId: string,
  reason: string,
): Promise<ApiResponse<Database['public']['Tables']['investors']['Row']>> {
  try {
    const { data, error } = await executeWithRetry(() => 
      supabase
        .from("investors")
        .update({
          kyc_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("investor_id", investorId)
        .select()
        .single()
    );

    if (error) throw error;

    // Audit logging disabled

    return { data, status: 200 };
  } catch (error: any) {
    console.error("Error rejecting investor:", error);
    return { error: "Failed to reject investor", status: 500 };
  }
}

// Whitelist management API functions
export async function addToWhitelist(
  organizationId: string,
  address: string,
  label?: string,
): Promise<ApiResponse<Database['public']['Tables']['whitelist_settings']['Row']>> {
  try {
    // First get the current whitelist
    const { data: currentData, error: fetchError } = await supabase
      .from("whitelist_settings")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    if (fetchError) throw fetchError;

    // Define a type that includes the metadata field for whitelist settings
    type WhitelistSettingsWithMetadata = Database['public']['Tables']['whitelist_settings']['Row'] & {
      metadata?: Record<string, any>;
    };

    // Cast to the extended type
    const whitelistData = currentData as WhitelistSettingsWithMetadata;

    // Create a metadata object with addresses array
    const metadataObj: Record<string, any> = { 
      ...whitelistData?.metadata || {},
      addresses: [...(whitelistData?.metadata?.addresses || [])]
    };
    const currentAddresses = metadataObj.addresses;

    if (!currentAddresses.includes(address)) {
      const newAddresses = [...currentAddresses, address];
      metadataObj.addresses = newAddresses;

      const { data, error } = await supabase
        .from("whitelist_settings")
        .update({
          metadata: metadataObj,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) throw error;

      return { data, status: 200 };
    }

    return { data: currentData, status: 200 };
  } catch (error: any) {
    console.error("Error adding to whitelist:", error);
    return { error: "Failed to add address to whitelist", status: 500 };
  }
}

export async function removeFromWhitelist(
  organizationId: string,
  address: string,
): Promise<ApiResponse<Database['public']['Tables']['whitelist_settings']['Row']>> {
  try {
    // First get the current whitelist
    const { data: currentData, error: fetchError } = await supabase
      .from("whitelist_settings")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    if (fetchError) throw fetchError;

    // Define a type that includes the metadata field for whitelist settings
    type WhitelistSettingsWithMetadata = Database['public']['Tables']['whitelist_settings']['Row'] & {
      metadata?: Record<string, any>;
    };

    // Cast to the extended type
    const whitelistData = currentData as WhitelistSettingsWithMetadata;

    // Create a metadata object with addresses array
    const metadataObj: Record<string, any> = { 
      ...whitelistData?.metadata || {},
      addresses: [...(whitelistData?.metadata?.addresses || [])]
    };
    const currentAddresses = metadataObj.addresses;
    const newAddresses = currentAddresses.filter((addr) => addr !== address);
    metadataObj.addresses = newAddresses;

    const { data, error } = await supabase
      .from("whitelist_settings")
      .update({
        metadata: metadataObj,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) throw error;

    return { data, status: 200 };
  } catch (error: any) {
    console.error("Error removing from whitelist:", error);
    return { error: "Failed to remove address from whitelist", status: 500 };
  }
}

// Notification API functions
export async function createNotification(
  userId: string,
  type: "approval" | "request" | "milestone",
  title: string,
  description: string,
  actionRequired: boolean = false,
): Promise<ApiResponse<Database['public']['Tables']['notifications']['Row']>> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        description,
        date: new Date().toISOString(),
        read: false,
        action_required: actionRequired,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, status: 200 };
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return { error: "Failed to create notification", status: 500 };
  }
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<ApiResponse<Database['public']['Tables']['notifications']['Row']>> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) throw error;

    return { data, status: 200 };
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return { error: "Failed to mark notification as read", status: 500 };
  }
}
