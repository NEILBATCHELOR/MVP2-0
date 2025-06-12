import { supabase } from "@/infrastructure/database/client";
import crypto from "crypto";

// Stub for missing imports
interface Investor {
  id: string;
  name: string;
  email: string;
  type: string;
  walletAddress: string | null;
  kycStatus: "approved" | "pending" | "failed" | "not_started" | "expired";
  lastUpdated: string;
}

interface InvestorGroup {
  id: string;
  name: string;
  investorIds: string[];
}

// Sample data for fallback
const sampleInvestors: Investor[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    type: "individual",
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    kycStatus: "approved",
    lastUpdated: "2023-06-15",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    type: "entity",
    walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    kycStatus: "pending",
    lastUpdated: "2023-07-01",
  },
];

const sampleGroups: { name: string; investorIds: string[] }[] = [
  {
    name: "VIP Investors",
    investorIds: ["1"],
  },
  {
    name: "Institutional",
    investorIds: ["2"],
  },
];

// Investor CRUD operations
export const fetchInvestors = async (): Promise<Investor[]> => {
  try {
    const { data, error } = await supabase
      .from("investors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching investors:", error);
      // Fall back to sample data if there's an error
      return sampleInvestors;
    }

    if (!data || data.length === 0) {
      // If no data in the database, seed with sample data
      await seedSampleData();
      return sampleInvestors;
    }

    return data.map((investor) => ({
      id: investor.investor_id, // Use investor_id as the id field
      name: investor.name,
      email: investor.email,
      type: investor.type,
      walletAddress: investor.wallet_address,
      kycStatus: investor.kyc_status as Investor["kycStatus"],
      lastUpdated: investor.lastUpdated, // Changed from last_updated to match the column name in the database
    }));
  } catch (error) {
    console.error("Error in fetchInvestors:", error);
    // Return sample data as fallback
    return sampleInvestors;
  }
};

export const createInvestor = async (
  investor: Omit<Investor, "id">,
): Promise<Investor> => {
  try {
    const { data, error } = await supabase
      .from("investors")
      .insert({
        name: investor.name,
        email: investor.email,
        type: investor.type,
        wallet_address: investor.walletAddress,
        kyc_status: investor.kycStatus,
        lastUpdated: investor.lastUpdated, // Changed from last_updated to match the column name in the database
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating investor:", error);
      throw error;
    }

    return {
      id: data.investor_id, // Use investor_id instead of id
      name: data.name,
      email: data.email,
      type: data.type,
      walletAddress: data.wallet_address,
      kycStatus: data.kyc_status as Investor["kycStatus"],
      lastUpdated: data.lastUpdated,
    };
  } catch (error) {
    console.error("Error in createInvestor:", error);
    throw error;
  }
};

export const updateInvestor = async (
  id: string,
  updates: Partial<Investor>,
): Promise<void> => {
  // Create an update object with only the fields that are provided
  const updateObj: any = {};
  if (updates.name !== undefined) updateObj.name = updates.name;
  if (updates.email !== undefined) updateObj.email = updates.email;
  if (updates.type !== undefined) updateObj.type = updates.type;
  if (updates.walletAddress !== undefined)
    updateObj.wallet_address = updates.walletAddress;
  if (updates.kycStatus !== undefined) updateObj.kyc_status = updates.kycStatus;
  if (updates.lastUpdated !== undefined)
    updateObj.lastUpdated = updates.lastUpdated;
  else updateObj.lastUpdated = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("investors")
    .update(updateObj)
    .eq("investor_id", id);

  if (error) {
    console.error("Error updating investor:", error);
    throw error;
  }
};

export const deleteInvestor = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("investors")
    .delete()
    .eq("investor_id", id);

  if (error) {
    console.error("Error deleting investor:", error);
    throw error;
  }
};

export const bulkCreateInvestors = async (
  investors: Omit<Investor, "id">[],
): Promise<void> => {
  try {
    // Ensure all required fields are present and properly formatted
    const formattedInvestors = investors.map((investor) => ({
      name: investor.name,
      email: investor.email,
      type: investor.type,
      wallet_address: investor.walletAddress || null, // Make sure null is used for empty values
      kyc_status: investor.kycStatus || "not_started", // Default to not_started if not provided
      lastUpdated:
        investor.lastUpdated || new Date().toISOString().split("T")[0],
    }));

    const { error } = await supabase
      .from("investors")
      .insert(formattedInvestors);

    if (error) {
      console.error("Error bulk creating investors:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in bulkCreateInvestors:", error);
    throw error;
  }
};

// Function to seed sample data into the database
const seedSampleData = async (): Promise<void> => {
  try {
    // Insert sample investors
    const { error: investorsError } = await supabase.from("investors").insert(
      sampleInvestors.map((investor) => ({
        id: crypto.randomUUID(), // Add required ID field
        name: investor.name,
        email: investor.email,
        type: investor.type,
        wallet_address: investor.walletAddress,
        kyc_status: investor.kycStatus,
        lastUpdated: investor.lastUpdated,
        created_at: new Date().toISOString(), // Add timestamp
        updated_at: new Date().toISOString(), // Add timestamp
      })),
    );

    if (investorsError) {
      console.error("Error seeding investors:", investorsError);
      return;
    }

    // Insert sample groups
    const groupInserts = await Promise.all(
      sampleGroups.map(async (group, index) => {
        const { data: groupData, error: groupError } = await supabase
          .from("investor_groups")
          .insert({ 
            id: crypto.randomUUID(),
            name: group.name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (groupError) {
          console.error(`Error creating group ${group.name}:`, groupError);
          return null;
        }

        return { groupId: groupData.id, investorIds: group.investorIds };
      }),
    );

    // Insert group-investor relationships
    const validGroupInserts = groupInserts.filter(Boolean);
    for (const insert of validGroupInserts) {
      if (!insert) continue;

      const { error: relError } = await supabase
        .from("investor_groups_investors")
        .insert(
          insert.investorIds.map((investorId) => ({
            id: crypto.randomUUID(), // Add required ID field
            group_id: insert.groupId,
            investor_id: investorId,
            created_at: new Date().toISOString(), // Add timestamp
            updated_at: new Date().toISOString(), // Add timestamp
          })),
        );

      if (relError) {
        console.error(`Error creating relationships for group:`, relError);
      }
    }

    console.log("Sample data seeded successfully");
  } catch (error) {
    console.error("Error seeding sample data:", error);
  }
};

export const bulkUpdateInvestors = async (
  ids: string[],
  updates: Partial<Investor>,
): Promise<void> => {
  try {
    // Create an update object with only the fields that are provided
    const updateObj: any = {};
    if (updates.name !== undefined) updateObj.name = updates.name;
    if (updates.email !== undefined) updateObj.email = updates.email;
    if (updates.type !== undefined) updateObj.type = updates.type;
    if (updates.walletAddress !== undefined)
      updateObj.wallet_address = updates.walletAddress;
    if (updates.kycStatus !== undefined) {
      // Ensure kycStatus is one of the allowed enum values
      const validStatuses = [
        "approved",
        "pending",
        "failed",
        "not_started",
        "expired",
      ];
      if (!validStatuses.includes(updates.kycStatus)) {
        throw new Error(
          `Invalid KYC status: ${updates.kycStatus}. Must be one of: ${validStatuses.join(", ")}`,
        );
      }
      updateObj.kyc_status = updates.kycStatus;
    }
    if (updates.lastUpdated !== undefined)
      updateObj.lastUpdated = updates.lastUpdated;
    else updateObj.lastUpdated = new Date().toISOString().split("T")[0];

    // Use Supabase's direct update with a filter
    const { error } = await supabase
      .from("investors")
      .update(updateObj)
      .in("investor_id", ids);

    if (error) throw error;
  } catch (error) {
    console.error("Error in bulkUpdateInvestors:", error);
    throw error;
  }
};

export const bulkDeleteInvestors = async (ids: string[]): Promise<void> => {
  const { error } = await supabase
    .from("investors")
    .delete()
    .in("investor_id", ids);

  if (error) {
    console.error("Error bulk deleting investors:", error);
    throw error;
  }
};

// Group CRUD operations
export const fetchGroups = async (): Promise<InvestorGroup[]> => {
  try {
    // First get all groups
    const { data: groups, error: groupsError } = await supabase
      .from("investor_groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (groupsError) {
      console.error("Error fetching groups:", groupsError);
      // Return sample groups if there's an error
      return sampleGroups.map((group, index) => ({
        id: (index + 1).toString(),
        name: group.name,
        investorIds: group.investorIds,
      }));
    }

    if (!groups || groups.length === 0) {
      // If no groups in the database, return sample groups
      return sampleGroups.map((group, index) => ({
        id: (index + 1).toString(),
        name: group.name,
        investorIds: group.investorIds,
      }));
    }

    // Then get all group-investor relationships
    const { data: relationships, error: relError } = await supabase
      .from("investor_groups_investors")
      .select("*");

    if (relError) {
      console.error("Error fetching group relationships:", relError);
      throw relError;
    }

    // Map the relationships to the groups
    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      investorIds: relationships
        ? relationships
            .filter((rel) => rel.group_id === group.id)
            .map((rel) => rel.investor_id)
        : [],
    }));
  } catch (error) {
    console.error("Error in fetchGroups:", error);
    // Return sample groups as fallback
    return sampleGroups.map((group, index) => ({
      id: (index + 1).toString(),
      name: group.name,
      investorIds: group.investorIds,
    }));
  }
};

export const createGroup = async (
  name: string,
  investorIds: string[] = [],
): Promise<InvestorGroup> => {
  // First create the group
  const now = new Date().toISOString();
  const { data: group, error: groupError } = await supabase
    .from("investor_groups")
    .insert({ 
      id: crypto.randomUUID(),
      name,
      created_at: now,
      updated_at: now
    })
    .select()
    .single();

  if (groupError) {
    console.error("Error creating group:", groupError);
    throw groupError;
  }

  // If there are investor IDs, create the relationships
  if (investorIds.length > 0) {
    const { error: relError } = await supabase
      .from("investor_groups_investors")
      .insert(
        investorIds.map((investorId) => ({
          group_id: group.id,
          investor_id: investorId,
        })),
      );

    if (relError) {
      console.error("Error creating group relationships:", relError);
      throw relError;
    }
  }

  return {
    id: group.id,
    name: group.name,
    investorIds,
  };
};

export const updateGroup = async (id: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from("investor_groups")
    .update({ name })
    .eq("id", id);

  if (error) {
    console.error("Error updating group:", error);
    throw error;
  }
};

export const deleteGroup = async (id: string): Promise<void> => {
  // First delete all relationships
  const { error: relError } = await supabase
    .from("investor_groups_investors")
    .delete()
    .eq("group_id", id);

  if (relError) {
    console.error("Error deleting group relationships:", relError);
    throw relError;
  }

  // Then delete the group
  const { error } = await supabase
    .from("investor_groups")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting group:", error);
    throw error;
  }
};

export const addInvestorsToGroup = async (
  groupId: string,
  investorIds: string[],
): Promise<void> => {
  // First get existing relationships to avoid duplicates
  const { data: existingRels, error: fetchError } = await supabase
    .from("investor_groups_investors")
    .select("investor_id")
    .eq("group_id", groupId);

  if (fetchError) {
    console.error("Error fetching existing relationships:", fetchError);
    throw fetchError;
  }

  // Filter out investors that are already in the group
  const existingInvestorIds = existingRels.map((rel) => rel.investor_id);
  const newInvestorIds = investorIds.filter(
    (id) => !existingInvestorIds.includes(id),
  );

  if (newInvestorIds.length === 0) return;

  // Add the new relationships
  const { error } = await supabase.from("investor_groups_investors").insert(
    newInvestorIds.map((investorId) => ({
      id: crypto.randomUUID(), // Add required ID field
      group_id: groupId,
      investor_id: investorId,
      created_at: new Date().toISOString(), // Add timestamp
      updated_at: new Date().toISOString(), // Add timestamp
    })),
  );

  if (error) {
    console.error("Error adding investors to group:", error);
    throw error;
  }
};

export const removeInvestorsFromGroup = async (
  groupId: string,
  investorIds: string[],
): Promise<void> => {
  const { error } = await supabase
    .from("investor_groups_investors")
    .delete()
    .eq("group_id", groupId)
    .in("investor_id", investorIds);

  if (error) {
    console.error("Error removing investors from group:", error);
    throw error;
  }
};
