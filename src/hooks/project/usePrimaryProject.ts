import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { 
  getPrimaryProject, 
  getPrimaryOrFirstProject,
  setPrimaryProject,
  isProjectPrimary 
} from '@/services/project/primaryProjectService';
import type { ProjectUI } from '@/types/core/centralModels';

/**
 * Custom hook for working with the primary project
 * 
 * @param options Configuration options
 * @returns Functions and state for working with the primary project
 */
export function usePrimaryProject(options: {
  redirectOnNotFound?: boolean;
  redirectPath?: string;
  loadOnMount?: boolean;
} = {}) {
  const [primaryProject, setPrimaryProjectState] = useState<ProjectUI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    redirectOnNotFound = false,
    redirectPath = '/projects',
    loadOnMount = true,
  } = options;

  /**
   * Load the primary project
   */
  const loadPrimaryProject = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const project = await getPrimaryProject();
      setPrimaryProjectState(project);
      
      if (!project && redirectOnNotFound) {
        navigate(redirectPath);
      }
      
      return project;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err?.message || 'An error occurred'));
      console.error('Error loading primary project:', err);
      
      if (redirectOnNotFound) {
        toast({
          title: 'Error',
          description: 'Failed to load primary project',
          variant: 'destructive',
        });
        navigate(redirectPath);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, redirectOnNotFound, redirectPath, toast]);

  /**
   * Load the primary project or first available project
   */
  const loadPrimaryOrFirstProject = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const project = await getPrimaryOrFirstProject();
      setPrimaryProjectState(project);
      
      if (!project && redirectOnNotFound) {
        navigate(redirectPath);
      }
      
      return project;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err?.message || 'An error occurred'));
      console.error('Error loading project:', err);
      
      if (redirectOnNotFound) {
        toast({
          title: 'Error',
          description: 'Failed to load project',
          variant: 'destructive',
        });
        navigate(redirectPath);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, redirectOnNotFound, redirectPath, toast]);

  /**
   * Set a project as the primary project
   */
  const makePrimary = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const project = await setPrimaryProject(projectId);
      
      if (project) {
        setPrimaryProjectState(project);
        toast({
          title: 'Success',
          description: `${project.name} set as primary project`,
        });
      }
      
      return project;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err?.message || 'An error occurred'));
      console.error('Error setting primary project:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to set primary project',
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Check if a project is the primary project
   */
  const checkIsPrimary = useCallback(async (projectId: string) => {
    try {
      return await isProjectPrimary(projectId);
    } catch (err) {
      console.error('Error checking if project is primary:', err);
      return false;
    }
  }, []);

  /**
   * Navigate to the primary project
   */
  const navigateToPrimaryProject = useCallback(async (
    path: string = '/tokens', // Default path to navigate to
    fallbackPath: string = '/projects' // Fallback path if no primary project
  ) => {
    try {
      setIsLoading(true);
      
      const project = await getPrimaryOrFirstProject();
      
      if (project) {
        // Navigate to the primary project with the specified path
        navigate(`/projects/${project.id}${path}`);
        return true;
      } else {
        // No project found, navigate to fallback
        navigate(fallbackPath);
        return false;
      }
    } catch (err) {
      console.error('Error navigating to primary project:', err);
      navigate(fallbackPath);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Load primary project on mount if option is enabled
  useEffect(() => {
    if (loadOnMount) {
      loadPrimaryProject();
    }
  }, [loadOnMount, loadPrimaryProject]);

  return {
    primaryProject,
    isLoading,
    error,
    loadPrimaryProject,
    loadPrimaryOrFirstProject,
    makePrimary,
    checkIsPrimary,
    navigateToPrimaryProject,
  };
}

export default usePrimaryProject; 