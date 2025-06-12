import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/infrastructure/database/client';

interface Project {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

interface ProjectContextType {
  project: Project | null;
  loading: boolean;
  error: Error | null;
  refreshProject: (projectId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ 
  children, 
  projectId 
}: { 
  children: ReactNode, 
  projectId?: string 
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProject = async (id: string) => {
    if (!id) {
      setProject(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        throw error;
      }
      
      setProject(data as Project);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    } else {
      setProject(null);
      setLoading(false);
    }
  }, [projectId]);

  const refreshProject = async (id: string) => {
    await fetchProject(id);
  };

  return (
    <ProjectContext.Provider value={{ project, loading, error, refreshProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextType {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
} 