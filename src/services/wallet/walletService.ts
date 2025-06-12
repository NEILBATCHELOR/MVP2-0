import { supabase } from "@/infrastructure/database/client";
import { ApiResponse } from "@/infrastructure/api";

// Types for wallet data
export interface WalletStatus {
  address: string;
  status: "pending" | "active" | "blocked";
  activatedAt?: string;
  blockedAt?: string;
  blockReason?: string;
}

export interface SignatoryInfo {
  id: string;
  walletAddress: string;
  name: string;
  email: string;
  role: string;
  status: "pending" | "active";
}

export interface WhitelistEntry {
  address: string;
  label?: string;
  addedAt: string;
  addedBy?: string;
}

// Wallet activation functions
export async function getWalletStatus(
  walletAddress: string,
): Promise<ApiResponse<WalletStatus>> {
  try {
    const { data, error } = await supabase
      .from("multi_sig_wallets")
      .select("address, status, created_at, updated_at, blocked_at, block_reason")
      .eq("address", walletAddress)
      .single();

    if (error) throw error;

    const status = data.status as "pending" | "active" | "blocked";
    const walletStatus: WalletStatus = {
      address: data.address,
      status: (status === "pending" || status === "active" || status === "blocked") ? status : "active",
      activatedAt: data.created_at,
      blockedAt: data.blocked_at,
      blockReason: data.block_reason,
    };

    return { data: walletStatus, status: 200 };
  } catch (error) {
    console.error("Error getting wallet status:", error);
    return { error: "Failed to get wallet status", status: 500 };
  }
}

export async function activateWallet(
  walletAddress: string,
): Promise<ApiResponse<WalletStatus>> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("multi_sig_wallets")
      .update({
        status: "active",
        updated_at: now,
      })
      .eq("address", walletAddress)
      .select()
      .single();

    if (error) throw error;

    const walletStatus: WalletStatus = {
      address: data.address,
      status: "active",
      activatedAt: now,
    };

    return { data: walletStatus, status: 200 };
  } catch (error) {
    console.error("Error activating wallet:", error);
    return { error: "Failed to activate wallet", status: 500 };
  }
}

export async function blockWallet(
  walletAddress: string,
  reason: string,
): Promise<ApiResponse<WalletStatus>> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("multi_sig_wallets")
      .update({
        status: "blocked",
        blocked_at: now,
        block_reason: reason,
        updated_at: now,
      })
      .eq("address", walletAddress)
      .select()
      .single();

    if (error) throw error;

    const walletStatus: WalletStatus = {
      address: data.address,
      status: "blocked",
      blockedAt: now,
      blockReason: reason,
    };

    return { data: walletStatus, status: 200 };
  } catch (error) {
    console.error("Error blocking wallet:", error);
    return { error: "Failed to block wallet", status: 500 };
  }
}

// Multi-signature wallet functions
export async function addSignatory(
  walletAddress: string,
  name: string,
  email: string,
  role: string,
): Promise<ApiResponse<SignatoryInfo>> {
  try {
    const { data, error } = await supabase
      .from("wallet_signatories")
      .insert({
        wallet_address: walletAddress,
        name,
        email,
        role,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const signatoryInfo: SignatoryInfo = {
      id: data.id,
      walletAddress: data.wallet_address,
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status as "pending" | "active",
    };

    return { data: signatoryInfo, status: 200 };
  } catch (error) {
    console.error("Error adding signatory:", error);
    return { error: "Failed to add signatory", status: 500 };
  }
}

export async function removeSignatory(
  signatoryId: string,
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const { error } = await supabase
      .from("wallet_signatories")
      .delete()
      .eq("id", signatoryId);

    if (error) throw error;
    
    return { data: { success: true }, status: 200 };
  } catch (error) {
    console.error("Error removing signatory:", error);
    return { error: "Failed to remove signatory", status: 500 };
  }
}

export async function getSignatories(
  walletAddress: string,
): Promise<ApiResponse<SignatoryInfo[]>> {
  try {
    const { data, error } = await supabase
      .from("wallet_signatories")
      .select("*")
      .eq("wallet_address", walletAddress);

    if (error) throw error;

    const signatories: SignatoryInfo[] = (data || []).map(item => {
      const status = item.status as "pending" | "active";
      return {
        id: item.id,
        walletAddress: item.wallet_address,
        name: item.name,
        email: item.email,
        role: item.role,
        status: (status === "pending" || status === "active") ? status : "pending",
      };
    });

    return { data: signatories, status: 200 };
  } catch (error) {
    console.error("Error getting signatories:", error);
    return { error: "Failed to get signatories", status: 500 };
  }
}

// Whitelist management functions
export async function addToWhitelist(
  organizationId: string,
  address: string,
  label?: string,
  addedBy?: string,
): Promise<ApiResponse<WhitelistEntry>> {
  try {
    const now = new Date().toISOString();

    // First ensure whitelist settings exist
    const { data: settings, error: settingsError } = await supabase
      .from("whitelist_settings")
      .select("id")
      .eq("organization_id", organizationId)
      .single();

    if (settingsError && settingsError.code === 'PGRST116') {
      // Create new whitelist settings
      const { error: createError } = await supabase
        .from("whitelist_settings")
        .insert({
          organization_id: organizationId,
          name: "Default Whitelist",
          description: "Automatically created whitelist",
          required_approvals: 1,
          total_approvers: 1,
          created_at: now,
          updated_at: now,
          created_by: addedBy,
        });

      if (createError) throw createError;
    }

    // Add to whitelist entries
    const { data, error } = await supabase
      .from("whitelist_entries")
      .insert({
        organization_id: organizationId,
        address,
        label,
        added_by: addedBy,
        created_at: now,
      })
      .select()
      .single();

    if (error) throw error;

    const whitelistEntry: WhitelistEntry = {
      address: data.address,
      label: data.label,
      addedAt: data.created_at,
      addedBy: data.added_by,
    };

    return { data: whitelistEntry, status: 200 };
  } catch (error) {
    console.error("Error adding to whitelist:", error);
    return { error: "Failed to add address to whitelist", status: 500 };
  }
}

export async function removeFromWhitelist(
  organizationId: string,
  address: string,
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const { error } = await supabase
      .from("whitelist_entries")
      .delete()
      .eq("organization_id", organizationId)
      .eq("address", address);

    if (error) throw error;
    
    return { data: { success: true }, status: 200 };
  } catch (error) {
    console.error("Error removing from whitelist:", error);
    return { error: "Failed to remove address from whitelist", status: 500 };
  }
}

export async function getWhitelist(
  organizationId: string,
): Promise<ApiResponse<WhitelistEntry[]>> {
  try {
    const { data, error } = await supabase
      .from("whitelist_entries")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const whitelist: WhitelistEntry[] = (data || []).map(item => ({
      address: item.address,
      label: item.label,
      addedAt: item.created_at,
      addedBy: item.added_by,
    }));

    return { data: whitelist, status: 200 };
  } catch (error) {
    console.error("Error getting whitelist:", error);
    return { error: "Failed to get whitelist", status: 500 };
  }
}
