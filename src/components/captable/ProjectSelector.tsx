import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { getPrimaryProject } from "@/services/project/primaryProjectService";

interface ProjectSelectorProps {
  currentProjectId?: string;
  onProjectChange?: (projectId: string) => void;
}

const ProjectSelector = ({
  currentProjectId,
  onProjectChange,
}: ProjectSelectorProps) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(currentProjectId);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Create a cache key for storing projects in sessionStorage
    const cacheKey = 'project_selector_cache';
    
    const fetchProjectsWithCache = async () => {
      // First check if we have a cached version and show it immediately
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { projects: cachedProjects, timestamp } = JSON.parse(cachedData);
          const cacheAge = Date.now() - timestamp;
          
          // Use cache if it's less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000 && cachedProjects && cachedProjects.length > 0) {
            console.log('Using cached projects data');
            setProjects(cachedProjects);
            setIsLoading(false);
            
            // Handle project selection logic with cached data
            await handleInitialProjectSelection(cachedProjects);
            
            // Refresh in background anyway to keep cache fresh
            fetchProjects(true).then(freshData => {
              if (freshData && freshData.length > 0) {
                // Update cache with fresh data
                sessionStorage.setItem(cacheKey, JSON.stringify({
                  projects: freshData,
                  timestamp: Date.now()
                }));
              }
            });
            return;
          }
        } catch (e) {
          console.warn('Error parsing cached projects:', e);
          // Cache error, continue to fetch fresh data
        }
      }
      
      // No valid cache, fetch fresh data
      try {
        const freshData = await fetchProjects(false);
        if (freshData && freshData.length > 0) {
          // Cache the fresh data
          sessionStorage.setItem(cacheKey, JSON.stringify({
            projects: freshData,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        // Already handled in fetchProjects
      }
    };
    
    fetchProjectsWithCache();
  }, []);

  useEffect(() => {
    // Only update if the currentProjectId is valid
    if (currentProjectId && currentProjectId !== "undefined") {
      setSelectedProjectId(currentProjectId);
    }
  }, [currentProjectId]);

  // Handle initial project selection based on fetched projects
  const handleInitialProjectSelection = async (projectsData: any[]) => {
    // If no valid project is selected, prioritize primary project
    const isValidProjectId = selectedProjectId && selectedProjectId !== "undefined";
    if ((!isValidProjectId) && projectsData && projectsData.length > 0) {
      try {
        // Use the primaryProjectService to get the primary project
        const primaryProject = await getPrimaryProject();
        
        if (primaryProject) {
          // If primary project exists, select it
          console.log(`Found primary project: ${primaryProject.name} (${primaryProject.id})`);
          setSelectedProjectId(primaryProject.id);
          // If there's an onProjectChange callback, trigger it with the primary project
          if (onProjectChange) {
            onProjectChange(primaryProject.id);
          }
        } else if (projectsData.length > 0) {
          // No primary project, select first available
          console.log(`No primary project found, selecting first project: ${projectsData[0].name} (${projectsData[0].id})`);
          setSelectedProjectId(projectsData[0].id);
          // If there's an onProjectChange callback, trigger it with the first project
          if (onProjectChange) {
            onProjectChange(projectsData[0].id);
          }
        }
      } catch (error) {
        console.error("Error getting primary project:", error);
        // Fallback to using the first project in the list
        if (projectsData.length > 0) {
          setSelectedProjectId(projectsData[0].id);
          if (onProjectChange) {
            onProjectChange(projectsData[0].id);
          }
        }
      }
    }
  };

  const fetchProjects = async (isBackgroundFetch = false) => {
    if (!isBackgroundFetch) {
      setIsLoading(true);
    }
    
    try {
      // Use a more timeout-resilient query
      // Only fetch essential fields for project selector
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, is_primary")
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!isBackgroundFetch) {
        setProjects(data || []);
        // Handle project selection with fresh data
        await handleInitialProjectSelection(data || []);
      }
      
      return data || [];
    } catch (err) {
      console.error("Error fetching projects:", err);
      if (!isBackgroundFetch) {
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        });
      }
      return null;
    } finally {
      if (!isBackgroundFetch) {
        setIsLoading(false);
      }
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (onProjectChange) {
      onProjectChange(projectId);
    }
  };

  const handleGoToProject = () => {
    if (selectedProjectId) {
      navigate(`/projects/${selectedProjectId}/captable`);
    }
  };

  const handleRefreshProjects = () => {
    fetchProjects();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">No projects available</span>
        <Button size="sm" onClick={() => navigate("/projects")}>
          Create Project
        </Button>
        <Button size="sm" variant="outline" onClick={handleRefreshProjects}>
          <Loader2 className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedProjectId} onValueChange={handleProjectChange}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name} {project.is_primary && "(Primary)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!currentProjectId && selectedProjectId && (
        <Button onClick={handleGoToProject}>View Project</Button>
      )}
    </div>
  );
};

export default ProjectSelector;
