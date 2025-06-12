import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/infrastructure/auth/AuthProvider';
import { Policy } from '@/services/policy/enhancedPolicyService';
import { 
  savePolicyTemplate, 
  getAllPolicyTemplates, 
  getPolicyTemplateById, 
  updatePolicyTemplate, 
  deletePolicyTemplate,
  templateToPolicy,
  TemplateVersion as ImportedTemplateVersion
} from '@/services/policy/enhancedPolicyTemplateService';
import type { PolicyTemplatesTable } from '@/types/core/database';
import type { PolicyTemplateWithData, PolicyTemplateData } from '@/types/domain/policy/policyTemplates';
import { supabase } from '@/infrastructure/database/client';

/**
 * Interface for template version
 */
export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  data: any;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
}

/**
 * Hook for managing policy templates
 */
export function usePolicyTemplates() {
  const [templates, setTemplates] = useState<PolicyTemplateWithData[]>([]);
  const [templateVersions, setTemplateVersions] = useState<Record<string, TemplateVersion[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [versionsLoading, setVersionsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const { user } = useAuth();
  const userId = user?.id || 'admin-bypass';

  const isValidUUID = (id: string): boolean => {
    return !!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  };

  const filterValidTemplates = (templates: PolicyTemplateWithData[]): PolicyTemplateWithData[] => {
    const filtered = templates.filter(template => {
      // Template must have a valid UUID
      const hasValidId = template.template_id && 
                        typeof template.template_id === 'string' &&
                        isValidUUID(template.template_id);
      
      // Must have template_data with rules
      const hasValidData = template.template_data && 
                          typeof template.template_data === 'object' &&
                          template.template_data.rules;
      
      // Must have metadata
      const hasMetadata = template.template_name && template.created_by;
      
      return hasValidId && hasValidData && hasMetadata;
    });

    if (filtered.length !== templates.length) {
      console.warn(`Filtered out ${templates.length - filtered.length} invalid templates`);
    }
    
    return filtered;
  };

  const loadTemplates = useCallback(async (forceRefresh = false): Promise<PolicyTemplateWithData[]> => {
    // Skip loading if we already have templates and aren't forcing refresh
    if (hasLoaded && templates.length > 0 && !forceRefresh) {
      console.log(`Using ${templates.length} cached templates`);
      return templates;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('policy_templates')
        .select('*');

      if (error) {
        throw new Error(`Error fetching templates: ${error.message}`);
      }

      // Convert the data to the expected format
      const policyTemplates = data.map(template => {
        // Use a safer type casting approach
        const templateData = template.template_data as unknown as PolicyTemplateData;
        
        return {
          template_id: template.template_id,
          template_name: template.template_name,
          description: template.description,
          template_data: templateData,
          created_by: template.created_by,
          created_at: template.created_at,
          updated_at: template.updated_at
        };
      }) as PolicyTemplateWithData[];

      console.log(`Loaded ${policyTemplates.length} templates from database`);
      
      // Filter out any invalid templates
      const validTemplates = filterValidTemplates(policyTemplates);
      
      // Update state
      setTemplates(validTemplates);
      setHasLoaded(true);
      setError(null);
      
      return validTemplates;
    } catch (err) {
      console.error('Error loading policy templates:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, [hasLoaded, templates.length]);

  // Get a template by ID
  const getTemplateById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const template = await getPolicyTemplateById(id);
      return template as unknown as PolicyTemplateWithData;
    } catch (err) {
      console.error(`Error getting template ${id}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to get template ${id}`));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a template
  const createTemplate = useCallback(async (
    name: string, 
    description: string, 
    policy: Policy, 
    approvers?: string[]
  ) => {
    try {
      setLoading(true);
      setError(null);
      const savedTemplate = await savePolicyTemplate(name, description, policy, userId, approvers);
      
      // Update local state - cast to proper type
      const typedTemplate = savedTemplate as unknown as PolicyTemplateWithData;
      setTemplates(prevTemplates => [typedTemplate, ...prevTemplates]);
      
      return typedTemplate;
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err instanceof Error ? err : new Error('Failed to create template'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update a template
  const updateTemplate = useCallback(async (id: string, updates: Partial<PolicyTemplatesTable>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedTemplate = await updatePolicyTemplate(id, updates);
      
      // Update local state - cast to proper type
      const typedTemplate = updatedTemplate as unknown as PolicyTemplateWithData;
      setTemplates(prevTemplates => 
        prevTemplates.map(template => 
          template.template_id === id ? typedTemplate : template
        )
      );
      
      return typedTemplate;
    } catch (err) {
      console.error(`Error updating template ${id}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to update template ${id}`));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a template
  const removeTemplate = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deletePolicyTemplate(id);
      
      // Update local state
      setTemplates(prevTemplates => 
        prevTemplates.filter(template => template.template_id !== id)
      );
      
      return true;
    } catch (err) {
      console.error(`Error deleting template ${id}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to delete template ${id}`));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Convert a template to a policy
  const convertTemplateToPolicy = useCallback((template: PolicyTemplateWithData): Policy => {
    return templateToPolicy(template as unknown as PolicyTemplatesTable);
  }, []);

  // Load template versions for a specific template
  const loadTemplateVersions = useCallback(async (templateId: string): Promise<TemplateVersion[]> => {
    try {
      setVersionsLoading(true);
      
      // Check if we already have the template versions cached
      if (templateVersions[templateId]?.length > 0) {
        return templateVersions[templateId];
      }
      
      // In a real implementation, this would fetch from the database
      // For now, we're returning mock data
      const mockVersions: TemplateVersion[] = [
        {
          id: `version-1-${templateId}`,
          templateId,
          version: '1.0.0',
          data: { version: '1.0.0', rules: [] },
          createdAt: new Date().toISOString(),
          createdBy: userId
        },
        {
          id: `version-2-${templateId}`,
          templateId,
          version: '1.1.0',
          data: { version: '1.1.0', rules: [] },
          notes: 'Added support for multiple criteria',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          createdBy: userId
        }
      ];
      
      // Update cached versions
      setTemplateVersions(prev => ({
        ...prev,
        [templateId]: mockVersions
      }));
      
      return mockVersions;
    } catch (error) {
      console.error(`Error loading template versions for ${templateId}:`, error);
      throw error;
    } finally {
      setVersionsLoading(false);
    }
  }, [templateVersions, userId]);

  // Create a new template version
  const createTemplateVersion = useCallback(async (
    templateId: string, 
    versionNumber: string, 
    data: any, 
    notes?: string
  ): Promise<TemplateVersion> => {
    try {
      setVersionsLoading(true);
      
      // In a real implementation, this would save to the database
      // For now, we're creating a mock version
      const newVersion: TemplateVersion = {
        id: `version-${Date.now()}-${templateId}`,
        templateId,
        version: versionNumber,
        data,
        notes,
        createdAt: new Date().toISOString(),
        createdBy: userId
      };
      
      // Update cached versions
      setTemplateVersions(prev => {
        const existingVersions = prev[templateId] || [];
        return {
          ...prev,
          [templateId]: [newVersion, ...existingVersions]
        };
      });
      
      return newVersion;
    } catch (error) {
      console.error(`Error creating template version for ${templateId}:`, error);
      throw error;
    } finally {
      setVersionsLoading(false);
    }
  }, [userId]);

  // Delete a template version
  const removeTemplateVersion = useCallback(async (templateId: string, versionId: string): Promise<boolean> => {
    try {
      setVersionsLoading(true);
      
      // In a real implementation, this would delete from the database
      // For now, we're just updating our local state
      setTemplateVersions(prev => {
        const existingVersions = prev[templateId] || [];
        return {
          ...prev,
          [templateId]: existingVersions.filter(v => v.id !== versionId)
        };
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting template version ${versionId}:`, error);
      throw error;
    } finally {
      setVersionsLoading(false);
    }
  }, []);

  // Load templates on initial mount - only once
  useEffect(() => {
    console.log('usePolicyTemplates useEffect running, hasLoaded:', hasLoaded);
    if (!hasLoaded) {
      console.log('Initial template load');
      loadTemplates();
    }
  }, [loadTemplates, hasLoaded]);

  return {
    templates,
    loading,
    error,
    versionsLoading,
    loadTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    removeTemplate,
    convertTemplateToPolicy,
    loadTemplateVersions,
    createTemplateVersion,
    removeTemplateVersion,
    templateVersions,
    hasLoaded
  };
}