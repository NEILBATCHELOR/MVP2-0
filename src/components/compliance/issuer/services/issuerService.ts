/**
 * Issuer Service
 * 
 * Provides CRUD functionality for issuer (organization) management
 */
import { supabase } from '@/infrastructure/database/client';
import { 
  Organization, 
  OrganizationStatus, 
  ComplianceStatusType 
} from '@/types/core/centralModels';
import type { 
  OrganizationInsert, 
  OrganizationUpdate 
} from '@/types/core/database';
import { mapOrganizationFromDatabase, mapOrganizationToDatabase } from '@/utils/shared/formatting/typeMappers';

/**
 * Create a new issuer/organization
 * @param org - The organization data to create
 * @returns The created organization or null if creation failed
 */
export const createIssuer = async (org: Omit<Organization, 'id' | 'createdAt'>): Promise<Organization | null> => {
  try {
    const orgData = mapOrganizationToDatabase(org) as OrganizationInsert;
    
    const { data, error } = await supabase
      .from('organizations')
      .insert(orgData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating issuer organization:', error);
      return null;
    }
    
    return mapOrganizationFromDatabase(data);
  } catch (error) {
    console.error('Unexpected error creating issuer organization:', error);
    return null;
  }
};

/**
 * Get an issuer/organization by ID
 * @param id - The organization ID
 * @returns The organization or null if not found
 */
export const getIssuerById = async (id: string): Promise<Organization | null> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching issuer organization:', error);
      return null;
    }
    
    return mapOrganizationFromDatabase(data);
  } catch (error) {
    console.error('Unexpected error fetching issuer organization:', error);
    return null;
  }
};

/**
 * Get an issuer/organization by name
 * @param name - The organization name
 * @returns The organization or null if not found
 */
export const getIssuerByName = async (name: string): Promise<Organization | null> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error) {
      console.error('Error fetching issuer organization by name:', error);
      return null;
    }
    
    return mapOrganizationFromDatabase(data);
  } catch (error) {
    console.error('Unexpected error fetching issuer organization by name:', error);
    return null;
  }
};

/**
 * List all issuers/organizations with optional filtering
 * @param filters - Optional filters to apply
 * @returns Array of organizations matching the filters
 */
export const listIssuers = async (filters?: Partial<Organization>): Promise<Organization[]> => {
  try {
    let query = supabase.from('organizations').select('*');
    
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
      console.error('Error listing issuer organizations:', error);
      return [];
    }
    
    return data.map(mapOrganizationFromDatabase);
  } catch (error) {
    console.error('Unexpected error listing issuer organizations:', error);
    return [];
  }
};

/**
 * Update an existing issuer/organization
 * @param id - The organization ID
 * @param updates - The fields to update
 * @returns The updated organization or null if update failed
 */
export const updateIssuer = async (id: string, updates: Partial<Organization>): Promise<Organization | null> => {
  try {
    const orgData = mapOrganizationToDatabase(updates as Organization);
    
    const { data, error } = await supabase
      .from('organizations')
      .update(orgData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating issuer organization:', error);
      return null;
    }
    
    return mapOrganizationFromDatabase(data);
  } catch (error) {
    console.error('Unexpected error updating issuer organization:', error);
    return null;
  }
};

/**
 * Delete an issuer/organization
 * @param id - The organization ID
 * @returns True if deletion was successful, false otherwise
 */
export const deleteIssuer = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting issuer organization:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error deleting issuer organization:', error);
    return false;
  }
};

/**
 * Update issuer/organization status
 * @param id - The organization ID
 * @param status - The new status
 * @returns The updated organization or null if update failed
 */
export const updateIssuerStatus = async (id: string, status: OrganizationStatus): Promise<Organization | null> => {
  return updateIssuer(id, { status });
};

/**
 * Update issuer/organization compliance status
 * @param id - The organization ID
 * @param status - The new compliance status
 * @returns The updated organization or null if update failed
 */
export const updateIssuerComplianceStatus = async (id: string, status: ComplianceStatusType): Promise<Organization | null> => {
  return updateIssuer(id, { complianceStatus: status });
};

/**
 * Complete issuer/organization onboarding process
 * @param id - The organization ID
 * @returns The updated organization or null if update failed
 */
export const completeIssuerOnboarding = async (id: string): Promise<Organization | null> => {
  return updateIssuer(id, { 
    onboardingCompleted: true,
    status: OrganizationStatus.ACTIVE
  });
};

/**
 * Get documents associated with an issuer/organization
 * @param issuerId - The organization ID
 * @returns Array of document records for the organization
 */
export const getIssuerDocuments = async (issuerId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_id', issuerId)
      .eq('entity_type', 'organization');
    
    if (error) {
      console.error('Error fetching issuer documents:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching issuer documents:', error);
    return [];
  }
};