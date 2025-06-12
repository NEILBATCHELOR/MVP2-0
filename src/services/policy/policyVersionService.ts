import { supabase } from '@/infrastructure/database/client';
import { PolicyVersionTable } from '@/types/core/database';
import { PolicyTemplateData } from '@/types/domain/policy/policyTemplates';
import { Json } from '@/types/core/supabase';

/**
 * Service for handling policy versioning
 */
export class PolicyVersionService {
  /**
   * Create a new policy version
   * 
   * @param templateId - The policy template ID
   * @param policyData - The policy data
   * @param createdBy - User who created the version
   * @returns The created policy version
   */
  async createVersion(
    templateId: string,
    policyData: PolicyTemplateData,
    createdBy: string
  ): Promise<PolicyVersionTable | null> {
    try {
      // Get the latest version number
      const { data: versions, error: versionError } = await (supabase as any)
        .from('policy_versions')
        .select('version_number')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false })
        .limit(1);

      if (versionError) {
        console.error('Error fetching latest version:', versionError);
        throw versionError;
      }

      const versionNumber = versions && versions.length > 0 
        ? (versions as any[])[0].version_number + 1 
        : 1;

      // Insert new version
      const { data, error } = await (supabase as any)
        .from('policy_versions')
        .insert({
          template_id: templateId,
          version_number: versionNumber,
          policy_data: policyData as unknown as Json,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating policy version:', error);
        throw error;
      }

      return data as PolicyVersionTable;
    } catch (error) {
      console.error('Failed to create policy version:', error);
      return null;
    }
  }

  /**
   * Get all versions of a policy template
   * 
   * @param templateId - The policy template ID
   * @returns Array of policy versions
   */
  async getVersions(templateId: string): Promise<PolicyVersionTable[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('policy_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('Error fetching policy versions:', error);
        throw error;
      }

      return (data || []) as PolicyVersionTable[];
    } catch (error) {
      console.error('Failed to fetch policy versions:', error);
      return [];
    }
  }

  /**
   * Get a specific version of a policy
   * 
   * @param templateId - The policy template ID
   * @param versionNumber - The version number to retrieve
   * @returns The policy version or null if not found
   */
  async getVersion(
    templateId: string, 
    versionNumber: number
  ): Promise<PolicyVersionTable | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('policy_versions')
        .select('*')
        .eq('template_id', templateId)
        .eq('version_number', versionNumber)
        .single();

      if (error) {
        console.error('Error fetching policy version:', error);
        throw error;
      }

      return data as PolicyVersionTable;
    } catch (error) {
      console.error('Failed to fetch policy version:', error);
      return null;
    }
  }

  /**
   * Get the active version of a policy
   * 
   * @param templateId - The policy template ID
   * @returns The active policy version or null if not found
   */
  async getActiveVersion(templateId: string): Promise<PolicyVersionTable | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('policy_versions')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching active policy version:', error);
        throw error;
      }

      return data as PolicyVersionTable;
    } catch (error) {
      console.error('Failed to fetch active policy version:', error);
      return null;
    }
  }
}