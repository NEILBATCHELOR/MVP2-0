import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { getPrimaryOrFirstProject } from '@/services/project/primaryProjectService';
import { supabase } from '@/infrastructure/database/client';
import type { Tables } from '@/types/core/database';

type Project = Tables<'projects'>;

interface UseTokenProjectContextOptions {
  redirectOnNotFound?: boolean;
  loadOnMount?: boolean;
}

/**
 * Custom hook for token pages to handle project context
 * Automatically handles primary project fallback when no projectId is provided
 */
export function useTokenProjectContext(options: UseTokenProjectContextOptions = {}) {
  const { projectId: routeProjectId, tokenId } = useParams<{ projectId?: string; tokenId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projectId, setProjectId] = useState<string | undefined>(
    routeProjectId && routeProjectId !== 'undefined' ? routeProjectId : undefined
  );
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const {
    redirectOnNotFound = true,
    loadOnMount = true,
  } = options;

  /**
   * Find and use the primary project when no project ID is provided
   */
  const findPrimaryProject = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const primaryProject = await getPrimaryOrFirstProject();
      
      if (primaryProject) {
        setProjectId(primaryProject.id);
        
        // If we have a token ID, navigate to the correct URL with the primary project
        if (tokenId) {
          navigate(`/projects/${primaryProject.id}/tokens/${tokenId}`, { replace: true });
        } else {
          navigate(`/projects/${primaryProject.id}/tokens`, { replace: true });
        }
        
        return primaryProject.id;
      } else if (redirectOnNotFound) {
        // No projects found, redirect to projects page
        toast({
          title: 'No Projects Found',
          description: 'Create a project to start working with tokens.',
          variant: 'default',
        });
        navigate('/projects');
      }
      
      return null;
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find primary project';
      setError(new Error(errorMessage));
      console.error('Error finding primary project:', err);
      
      if (redirectOnNotFound) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        navigate('/projects');
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, tokenId, redirectOnNotFound, toast]);

  /**
   * Fetch project details from Supabase
   */
  const fetchProjectDetails = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
        
      if (error) {
        throw new Error(error.message);
      }
      
      if (data) {
        setProject(data as Project);
        return data as Project;
      } else if (redirectOnNotFound) {
        // Project not found, try to find primary project instead
        toast({
          title: 'Project Not Found',
          description: 'Redirecting to available project',
          variant: 'default',
        });
        await findPrimaryProject();
      }
      
      return null;
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project details';
      setError(new Error(errorMessage));
      console.error('Error fetching project details:', err);
      
      if (redirectOnNotFound) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [findPrimaryProject, redirectOnNotFound, toast]);

  /**
   * Initialize the project context
   */
  const initializeProjectContext = useCallback(async () => {
    if (projectId) {
      await fetchProjectDetails(projectId);
    } else {
      await findPrimaryProject();
    }
  }, [projectId, fetchProjectDetails, findPrimaryProject]);

  /**
   * Change the current project
   */
  const changeProject = useCallback((newProjectId: string) => {
    if (tokenId) {
      navigate(`/projects/${newProjectId}/tokens/${tokenId}`, { replace: true });
    } else {
      navigate(`/projects/${newProjectId}/tokens`, { replace: true });
    }
  }, [navigate, tokenId]);

  // Initialize project context on mount or when dependencies change
  useEffect(() => {
    if (loadOnMount) {
      initializeProjectContext();
    }
  }, [loadOnMount, initializeProjectContext]);

  // Update project ID when route changes
  useEffect(() => {
    if (routeProjectId && routeProjectId !== 'undefined' && routeProjectId !== projectId) {
      setProjectId(routeProjectId);
      fetchProjectDetails(routeProjectId);
    }
  }, [routeProjectId, projectId, fetchProjectDetails]);

  return {
    projectId,
    project,
    isLoading,
    error,
    findPrimaryProject,
    fetchProjectDetails,
    changeProject,
  };
}

export default useTokenProjectContext; 