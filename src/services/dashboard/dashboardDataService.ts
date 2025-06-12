import { supabase } from "@/infrastructure/database/client";
import type { Tables } from "@/types/core/database";

// Types for dashboard data
export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  status: "completed" | "in_progress" | "pending" | "error";
  completionPercentage?: number;
}

export interface StatusItem {
  id: string;
  name: string;
  status: "completed" | "in_progress" | "pending" | "attention";
  percentage?: number;
}

export interface WalletAddress {
  id: string;
  address: string;
  label: string;
}

export interface WhitelistSettings {
  enabled: boolean;
  addresses: string[];
}

export interface NotificationProps {
  id: string;
  type: "approval" | "request" | "milestone";
  title: string;
  description: string;
  date: string;
  read: boolean;
  actionRequired?: boolean;
}

export interface ComplianceData {
  kycStatus: "pending" | "completed" | "failed";
  accreditationSettings: {
    requireAccreditation: boolean;
    minimumInvestment: number;
  };
  jurisdictions: string[];
  investorCount: number;
}

// Default workflow stages when no data exists yet
const defaultWorkflowStages: WorkflowStage[] = [
  {
    id: "registration",
    name: "Registration",
    description: "Complete registration forms and initial setup",
    status: "pending",
    completionPercentage: 0,
  },
  {
    id: "document_collection",
    name: "Document Collection",
    description: "Upload required legal and compliance documents",
    status: "pending",
    completionPercentage: 0,
  },
  {
    id: "compliance",
    name: "Compliance",
    description: "Address KYC/AML and investor qualification requirements",
    status: "pending",
    completionPercentage: 0,
  },
  {
    id: "wallet_setup",
    name: "Wallet Setup",
    description: "Configure source and issuance wallets",
    status: "pending",
    completionPercentage: 0,
  },
  {
    id: "secondary_market",
    name: "Secondary Market",
    description: "Configure secondary market settings and trading rules",
    status: "pending",
    completionPercentage: 0,
  },
];

// Default empty data structures
const emptyWallets: WalletAddress[] = [];

const defaultWhitelistSettings: WhitelistSettings = {
  enabled: false,
  addresses: [],
};

const emptyNotifications: NotificationProps[] = [];

const defaultComplianceData: ComplianceData = {
  kycStatus: "pending", // Changed from not_started to pending to match the type definition
  accreditationSettings: {
    requireAccreditation: false,
    minimumInvestment: 0,
  },
  jurisdictions: [],
  investorCount: 0,
};

// Fetch workflow stages from Supabase
export const getWorkflowStages = async (
  organizationId: string = "default-org",
): Promise<WorkflowStage[]> => {
  try {
    // Try to fetch from Supabase
    const { data, error } = await supabase
      .from("workflow_stages")
      .select("*")
      .eq("organization_id", organizationId)
      .order("order", { ascending: true });

    if (!error && data && data.length > 0) {
      // Transform data to match our interface
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.status,
        completionPercentage: item.completion_percentage,
      }));
    }

    // Fall back to default stages
    return defaultWorkflowStages;
  } catch (error) {
    console.warn("Error fetching workflow stages", error);
    return defaultWorkflowStages;
  }
};

// Fetch wallet data from Supabase
export const getWalletData = async (
  organizationId: string = "default-org",
): Promise<{
  sourceWallets: WalletAddress[];
  issuanceWallets: WalletAddress[];
  whitelistSettings: WhitelistSettings;
}> => {
  try {
    // Try to fetch source wallets
    let sourceQuery = supabase
      .from("multi_sig_wallets")
      .select("*");
    
    sourceQuery = (sourceQuery as any).eq("organization_id", organizationId).eq("wallet_type", "source");
    
    const { data: sourceData, error: sourceError } = await sourceQuery;

    // Try to fetch issuance wallets
    let issuanceQuery = supabase
      .from("multi_sig_wallets")
      .select("*");
    
    issuanceQuery = (issuanceQuery as any).eq("organization_id", organizationId).eq("wallet_type", "issuance");
    
    const { data: issuanceData, error: issuanceError } = await issuanceQuery;

    // Try to fetch whitelist settings
    let whitelistQuery = supabase
      .from("whitelist_settings")
      .select("*");
    
    whitelistQuery = (whitelistQuery as any).eq("organization_id", organizationId).single();
    
    const { data: whitelistData, error: whitelistError } = await whitelistQuery;

    // Transform data if available
    const sourceWallets =
      !sourceError && sourceData
        ? sourceData.map((item: any) => ({
            id: item.id,
            address: item.address,
            label: item.label,
          }))
        : emptyWallets;

    const issuanceWallets =
      !issuanceError && issuanceData
        ? issuanceData.map((item: any) => ({
            id: item.id,
            address: item.address,
            label: item.label,
          }))
        : emptyWallets;

    // Create custom whitelist settings from the actual data structure
    // Since the DB schema doesn't match our interface, we need to adapt
    const whitelistSettings =
      !whitelistError && whitelistData
        ? {
            enabled: Boolean((whitelistData as any).required_approvals > 0), // Use required_approvals to determine if enabled
            addresses: [], // Whitelist addresses would need to be fetched separately
          }
        : defaultWhitelistSettings;

    // If needed, fetch whitelist addresses
    if (whitelistSettings.enabled && whitelistData) {
      try {
        const { data: addressData } = await supabase
          .from("whitelist_signatories")
          .select("user_id")
          .eq("whitelist_id", (whitelistData as any).id);
          
        if (addressData && addressData.length > 0) {
          whitelistSettings.addresses = addressData.map(item => item.user_id).filter(Boolean);
        }
      } catch (e) {
        console.warn("Error fetching whitelist addresses", e);
      }
    }

    return {
      sourceWallets,
      issuanceWallets,
      whitelistSettings,
    };
  } catch (error) {
    console.warn("Error fetching wallet data", error);
    return {
      sourceWallets: emptyWallets,
      issuanceWallets: emptyWallets,
      whitelistSettings: defaultWhitelistSettings,
    };
  }
};

// Fetch notifications from Supabase
export const getNotifications = async (
  userId: string = "default-user",
): Promise<NotificationProps[]> => {
  try {
    // Try to fetch from Supabase
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (!error && data && data.length > 0) {
      // Transform data to match our interface
      return data.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        date: item.date,
        read: item.read,
        actionRequired: item.action_required,
      }));
    }

    // Return empty notifications array
    return emptyNotifications;
  } catch (error) {
    console.warn("Error fetching notifications", error);
    return emptyNotifications;
  }
};

// Fetch compliance data from Supabase
export const getComplianceData = async (
  organizationId: string = "default-org",
): Promise<ComplianceData> => {
  try {
    // Try to fetch from Supabase
    const { data, error } = await supabase
      .from("compliance_settings")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    if (!error && data) {
      // Map database kyc_status to our ComplianceData.kycStatus type
      // Convert any value to one of our allowed values: "pending" | "completed" | "failed"
      let mappedKycStatus: "pending" | "completed" | "failed" = "pending";
      if (data.kyc_status) {
        const status = data.kyc_status.toLowerCase();
        if (status.includes("complete") || status === "approved") {
          mappedKycStatus = "completed";
        } else if (status.includes("fail") || status === "rejected") {
          mappedKycStatus = "failed";
        }
      }

      return {
        kycStatus: mappedKycStatus,
        accreditationSettings: {
          requireAccreditation: data.require_accreditation,
          minimumInvestment: data.minimum_investment,
        },
        jurisdictions: data.jurisdictions || [],
        investorCount: data.investor_count || 0,
      };
    }

    // Return default compliance data
    return defaultComplianceData;
  } catch (error) {
    console.warn("Error fetching compliance data", error);
    return defaultComplianceData;
  }
};
