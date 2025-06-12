import { supabase } from "@/infrastructure/database/client";
import { v4 as uuidv4 } from "uuid";
import type { ProjectUI, ProjectStatus, ProjectType } from "@/types/core/centralModels";
import { mapDbProjectToProject } from "@/utils/shared/formatting/typeMappers";
import type { Tables } from "@/types/core/database";

// Types
export interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  projectType: string;
  tokenSymbol: string;
  targetRaise: string;
  authorizedShares: string;
  sharePrice: string;
  fundingRound?: string;
  legalEntity?: string;
  jurisdiction?: string;
  taxId?: string;
  isPrimary?: boolean;
  investmentStatus?: string;
  minimumInvestment?: string;
  currency?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  transactionStartDate?: string;
  maturityDate?: string;
}

// Fetch all projects
export async function getProjects(): Promise<ProjectUI[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  // Map each project to the ProjectUI type
  return data ? data.map(mapDbProjectToProject) : [];
}

// Fetch a specific project
export async function getProject(id: string): Promise<ProjectUI | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching project ${id}:`, error);
    return null;
  }

  // Map the database project to the ProjectUI type
  return data ? mapDbProjectToProject(data) : null;
}

// Get a project by ID
export const getProjectById = async (id: string): Promise<ProjectUI | null> => {
  return getProject(id);
};

// Create a new project
export async function createProject(
  projectData: ProjectFormData,
): Promise<ProjectUI | null> {
  // Transform project data to match database schema
  const now = new Date().toISOString();
  const newProject = {
    id: crypto.randomUUID(),
    name: projectData.name,
    description: projectData.description || null,
    status: projectData.status,
    // Use the correct column name from the database schema
    project_type: projectData.projectType,
    token_symbol: projectData.tokenSymbol,
    // Convert form data values to appropriate types
    target_raise: parseFloat(projectData.targetRaise) || 0,
    authorized_shares: parseInt(projectData.authorizedShares) || 0,
    share_price: parseFloat(projectData.sharePrice) || 0,
    minimum_investment: parseFloat(projectData.minimumInvestment || "0") || null,
    company_valuation: null,
    funding_round: projectData.fundingRound || null,
    legal_entity: projectData.legalEntity || null,
    jurisdiction: projectData.jurisdiction || null,
    tax_id: projectData.taxId || null,
    investment_status: projectData.investmentStatus || 'Open',
    created_at: now,
    updated_at: now,
    is_primary: projectData.isPrimary || false,
    currency: projectData.currency || 'USD',
    subscription_start_date: projectData.subscriptionStartDate || null,
    subscription_end_date: projectData.subscriptionEndDate || null,
    transaction_start_date: projectData.transactionStartDate || null,
    maturity_date: projectData.maturityDate || null,
  };

  // If this project is set as primary, first unset any existing primary projects
  if (newProject.is_primary) {
    await supabase
      .from("projects")
      .update({ is_primary: false })
      .eq("is_primary", true);
  }

  const { data, error } = await supabase
    .from("projects")
    .insert(newProject)
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    throw error;
  }

  // Map the database project to the ProjectUI type
  return data ? mapDbProjectToProject(data) : null;
}

// Update an existing project
export const updateProject = async (
  id: string,
  projectData: ProjectFormData,
): Promise<ProjectUI> => {
  const now = new Date().toISOString();

  // Transform form data to database format
  const dbProject = {
    name: projectData.name,
    description: projectData.description,
    status: projectData.status,
    // Use the correct column name from the database schema
    project_type: projectData.projectType,
    token_symbol: projectData.tokenSymbol,
    target_raise: parseFloat(projectData.targetRaise) || 0,
    authorized_shares: parseInt(projectData.authorizedShares) || 0,
    share_price: parseFloat(projectData.sharePrice) || 0,
    minimum_investment: parseFloat(projectData.minimumInvestment || "0") || null,
    funding_round: projectData.fundingRound,
    legal_entity: projectData.legalEntity,
    jurisdiction: projectData.jurisdiction,
    tax_id: projectData.taxId,
    investment_status: projectData.investmentStatus || 'Open',
    updated_at: now,
    is_primary: projectData.isPrimary || false,
    currency: projectData.currency || 'USD',
    subscription_start_date: projectData.subscriptionStartDate || null,
    subscription_end_date: projectData.subscriptionEndDate || null,
    transaction_start_date: projectData.transactionStartDate || null,
    maturity_date: projectData.maturityDate || null,
  };

  // If this project is set as primary, first unset any existing primary projects
  if (dbProject.is_primary) {
    await supabase
      .from("projects")
      .update({ is_primary: false })
      .not("id", "eq", id) // Don't update the current project
      .eq("is_primary", true);
  }

  const { data, error } = await supabase
    .from("projects")
    .update(dbProject)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating project with ID ${id}:`, error);
    throw error;
  }

  // Map the database response to ProjectUI
  return mapDbProjectToProject(data);
};

// Delete a project
export const deleteProject = async (id: string): Promise<void> => {
  // First check if there are any cap tables associated with this project
  const { data: capTables, error: capTablesError } = await supabase
    .from("cap_tables")
    .select("id")
    .eq("project_id", id);

  if (capTablesError) {
    console.error(
      `Error checking cap tables for project ${id}:`,
      capTablesError,
    );
    throw capTablesError;
  }

  // If there are cap tables, delete them first
  if (capTables && capTables.length > 0) {
    const capTableIds = capTables.map((ct) => ct.id);

    // Delete cap table investors
    const { error: investorsError } = await supabase
      .from("cap_table_investors")
      .delete()
      .in("cap_table_id", capTableIds);

    if (investorsError) {
      console.error(
        `Error deleting cap table investors for project ${id}:`,
        investorsError,
      );
      throw investorsError;
    }

    // Delete cap tables
    const { error: deleteCapTablesError } = await supabase
      .from("cap_tables")
      .delete()
      .eq("project_id", id);

    if (deleteCapTablesError) {
      console.error(
        `Error deleting cap tables for project ${id}:`,
        deleteCapTablesError,
      );
      throw deleteCapTablesError;
    }
  }

  // Check for subscriptions
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("project_id", id);

  if (subscriptionsError) {
    console.error(
      `Error checking subscriptions for project ${id}:`,
      subscriptionsError,
    );
    throw subscriptionsError;
  }

  // If there are subscriptions, delete them
  if (subscriptions && subscriptions.length > 0) {
    // Delete subscriptions - no related tables
    const { error: deleteSubscriptionsError } = await supabase
      .from("subscriptions")
      .delete()
      .eq("project_id", id);

    if (deleteSubscriptionsError) {
      console.error(
        `Error deleting subscriptions for project ${id}:`,
        deleteSubscriptionsError,
      );
      throw deleteSubscriptionsError;
    }
  }

  // Finally, delete the project
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting project with ID ${id}:`, error);
    throw error;
  }
};

// Get project statistics
export const getProjectStatistics = async (id: string) => {
  // Default values to return if there's an error
  let investorCount = 0;
  let totalAllocation = 0;

  try {
    // Get investor count from subscriptions - this is the primary source of truth
    const { count: subCount, error: subCountError } = await supabase
      .from("subscriptions")
      .select("investor_id", { count: "exact", head: true })
      .eq("project_id", id);
      
    if (!subCountError && subCount !== null) {
      investorCount = subCount;
      console.log(`Found ${investorCount} investors in subscriptions for project ${id}`);
    } else if (subCountError) {
      console.error("Error counting investors from subscriptions:", subCountError);
    }
    
    // Get total allocation/raised amount
    try {
      const { data: subscriptions, error: subError } = await supabase
        .from("subscriptions")
        .select("fiat_amount")
        .eq("project_id", id);
        
      if (!subError && subscriptions && subscriptions.length > 0) {
        totalAllocation = subscriptions.reduce((sum, sub) => sum + (sub.fiat_amount || 0), 0);
        console.log(`Total allocation for project ${id}: ${totalAllocation}`);
      } else if (subError) {
        console.error("Error getting subscription amounts:", subError);
      }
    } catch (error) {
      console.error(`Error calculating total allocation: ${error}`);
    }
    
    // Fall back to cap table data if no subscriptions found and investorCount is 0
    if (investorCount === 0) {
      console.log(`No investors found in subscriptions for project ${id}, checking cap tables`);
      
      // Get cap table data
      const { data: capTables, error: capTableError } = await supabase
        .from("cap_tables")
        .select("id")
        .eq("project_id", id);

      if (!capTableError && capTables && capTables.length > 0) {
        // Get the cap table IDs
        const capTableIds = capTables.map(table => table.id);
        console.log(`Found ${capTableIds.length} cap tables for project ${id}`);

        // Get investor count across all cap tables
        const { count: invCount, error: countError } = await supabase
          .from("cap_table_investors")
          .select("id", { count: "exact" })
          .in("cap_table_id", capTableIds);

        if (!countError && invCount !== null) {
          investorCount = invCount;
          console.log(`Found ${investorCount} investors across all cap tables`);
        } else if (countError) {
          console.error("Error counting investors from cap tables:", countError);
        }
      }
    }
  } catch (error) {
    console.error(`Error in getProjectStatistics for project ${id}:`, error);
  }

  console.log(`Returning statistics for project ${id}:`, { investorCount, totalAllocation });
  
  // Return the statistics (default values if there were errors)
  return {
    investorCount,
    totalAllocation,
  };
};
