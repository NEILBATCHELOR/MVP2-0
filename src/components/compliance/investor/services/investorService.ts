/**
 * Investor Service
 * 
 * Provides CRUD functionality for investor management
 */
import { supabase } from '@/infrastructure/database/client';
import type { 
  Investor, 
  InvestorApproval, 
  ApprovalType,
  KycStatus,
  AccreditationStatus
} from '@/types/core/centralModels';
import { InvestorStatus } from '@/types/core/centralModels';
import type { 
  InvestorInsert, 
  InvestorUpdate, 
  InvestorApprovalInsert, 
  InvestorApprovalUpdate 
} from '@/types/core/database';
import { mapInvestorFromDatabase, mapInvestorToDatabase, mapInvestorApprovalFromDatabase, mapInvestorApprovalToDatabase } from '@/utils/shared/formatting/typeMappers';

/**
 * Create a new investor
 * @param investor - The investor data to create
 * @returns The created investor or null if creation failed
 */
export const createInvestor = async (investor: Omit<Investor, 'id' | 'createdAt'>): Promise<Investor | null> => {
  try {
    const investorData = mapInvestorToDatabase(investor) as InvestorInsert;
    
    const { data, error } = await supabase
      .from('investors')
      .insert(investorData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating investor:', error);
      return null;
    }
    
    return mapInvestorFromDatabase(data);
  } catch (error) {
    console.error('Unexpected error creating investor:', error);
    return null;
  }
};

/**
 * Get an investor by ID
 * @param id - The investor ID
 * @returns The investor or null if not found
 */
export const getInvestorById = async (id: string): Promise<Investor | null> => {
  try {
    const { data, error } = await supabase
      .from('investors')
      .select('*')
      .eq('investor_id', id)
      .single();
    
    if (error) {
      console.error('Error fetching investor:', error);
      return null;
    }
    
    return mapInvestorFromDatabase(data);
  } catch (error) {
    console.error('Unexpected error fetching investor:', error);
    return null;
  }
};

/**
 * Get an investor by email
 * @param email - The investor's email address
 * @returns The investor or null if not found
 */
export const getInvestorByEmail = async (email: string): Promise<Investor | null> => {
  try {
    const { data, error } = await supabase
      .from('investors')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error fetching investor by email:', error);
      return null;
    }
    
    return mapInvestorFromDatabase(data);
  } catch (error) {
    console.error('Unexpected error fetching investor by email:', error);
    return null;
  }
};

/**
 * List all investors with optional filtering
 * @param filters - Optional filters to apply
 * @returns Array of investors matching the filters
 */
export const listInvestors = async (filters?: Partial<Investor>): Promise<Investor[]> => {
  try {
    let query = supabase.from('investors').select('*');
    
    // Apply filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          query = (query as any).eq(dbKey, value);
        }
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error listing investors:', error);
      return [];
    }
    
    return data.map(mapInvestorFromDatabase);
  } catch (error) {
    console.error('Unexpected error listing investors:', error);
    return [];
  }
};

/**
 * Update an existing investor
 * @param id - The investor ID
 * @param updates - The fields to update
 * @returns The updated investor or null if update failed
 */
export const updateInvestor = async (id: string, updates: Partial<Investor>): Promise<Investor | null> => {
  try {
    const investorData = mapInvestorToDatabase(updates as Investor);
    
    const { data, error } = await supabase
      .from('investors')
      .update(investorData)
      .eq('investor_id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating investor:', error);
      return null;
    }
    
    return mapInvestorFromDatabase(data);
  } catch (error) {
    console.error('Unexpected error updating investor:', error);
    return null;
  }
};

/**
 * Delete an investor
 * @param id - The investor ID
 * @returns True if deletion was successful, false otherwise
 */
export const deleteInvestor = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('investors')
      .delete()
      .eq('investor_id', id);
    
    if (error) {
      console.error('Error deleting investor:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error deleting investor:', error);
    return false;
  }
};

/**
 * Update investor KYC status
 * @param id - The investor ID
 * @param status - The new KYC status
 * @returns The updated investor or null if update failed
 */
export const updateInvestorKycStatus = async (id: string, status: KycStatus): Promise<Investor | null> => {
  return updateInvestor(id, { kycStatus: status });
};

/**
 * Update investor accreditation status
 * @param id - The investor ID
 * @param status - The new accreditation status
 * @returns The updated investor or null if update failed
 */
export const updateInvestorAccreditationStatus = async (id: string, status: AccreditationStatus): Promise<Investor | null> => {
  return updateInvestor(id, { accreditationStatus: status });
};

/**
 * Create a new investor approval request
 * @param approval - The approval data
 * @returns The created approval or null if creation failed
 */
export const createInvestorApproval = async (approval: Omit<InvestorApproval, 'id' | 'createdAt'>): Promise<InvestorApproval | null> => {
  try {
    const approvalData = mapInvestorApprovalToDatabase(approval) as InvestorApprovalInsert;
    
    const { data, error } = await supabase
      .from('investor_approvals')
      .insert(approvalData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating investor approval:', error);
      return null;
    }
    
    return mapInvestorApprovalFromDatabase(data);
  } catch (error) {
    console.error('Unexpected error creating investor approval:', error);
    return null;
  }
};

/**
 * Get investor approvals by investor ID
 * @param investorId - The investor ID
 * @param approvalType - Optional filter by approval type
 * @returns Array of approvals for the investor
 */
export const getInvestorApprovals = async (
  investorId: string, 
  approvalType?: ApprovalType
): Promise<InvestorApproval[]> => {
  try {
    let query = supabase
      .from('investor_approvals')
      .select('*')
      .eq('investor_id', investorId);
    
    if (approvalType) {
      query = query.eq('approval_type', approvalType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching investor approvals:', error);
      return [];
    }
    
    return data.map(mapInvestorApprovalFromDatabase);
  } catch (error) {
    console.error('Unexpected error fetching investor approvals:', error);
    return [];
  }
};

/**
 * Get a specific investor approval by ID
 * @param id - The approval ID
 * @returns The approval or null if not found
 */
export const getInvestorApprovalById = async (id: string): Promise<InvestorApproval | null> => {
  try {
    const { data, error } = await supabase
      .from('investor_approvals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching investor approval:', error);
      return null;
    }
    
    return mapInvestorApprovalFromDatabase(data);
  } catch (error) {
    console.error('Unexpected error fetching investor approval:', error);
    return null;
  }
};

/**
 * Update an investor approval
 * @param id - The approval ID
 * @param updates - The fields to update
 * @returns The updated approval or null if update failed
 */
export const updateInvestorApproval = async (
  id: string, 
  updates: Partial<InvestorApproval>
): Promise<InvestorApproval | null> => {
  try {
    const approvalData = mapInvestorApprovalToDatabase(updates as InvestorApproval);
    
    const { data, error } = await supabase
      .from('investor_approvals')
      .update(approvalData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating investor approval:', error);
      return null;
    }
    
    return mapInvestorApprovalFromDatabase(data);
  } catch (error) {
    console.error('Unexpected error updating investor approval:', error);
    return null;
  }
};

/**
 * Delete an investor approval
 * @param id - The approval ID
 * @returns True if deletion was successful, false otherwise
 */
export const deleteInvestorApproval = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('investor_approvals')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting investor approval:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error deleting investor approval:', error);
    return false;
  }
};

/**
 * Complete investor onboarding process
 * @param id - The investor ID
 * @returns The updated investor or null if update failed
 */
export const completeInvestorOnboarding = async (id: string): Promise<Investor | null> => {
  return updateInvestor(id, { 
    onboardingCompleted: true,
    investorStatus: InvestorStatus.ACTIVE
  });
};