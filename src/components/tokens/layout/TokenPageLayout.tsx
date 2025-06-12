import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import TokenNavigation from "../components/TokenNavigation";
import ProjectSelector from "../../captable/ProjectSelector";
import TokenSelector from "../components/TokenSelector";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/types/core/database";
import { getPrimaryOrFirstProject } from "@/services/project/primaryProjectService";

// Define project type based on database structure
type Project = Tables<"projects">;

interface TokenPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showBackButton?: boolean;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  actionButton?: React.ReactNode;
}

const TokenPageLayout: React.FC<TokenPageLayoutProps> = ({
  children,
  title,
  description,
  showBackButton = true,
  showRefreshButton = true,
  onRefresh,
  actionButton,
}) => {
  const params = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const { toast } = useToast();

  // Use projectId and tokenId from URL params, ensure they're valid
  const projectId = params.projectId && params.projectId !== "undefined" ? params.projectId : null;
  const tokenId = params.tokenId && params.tokenId !== "undefined" ? params.tokenId : null;
  const section = params.section || (tokenId ? "details" : "overview");

  // Redirect to projects page if no projectId is provided, or fetch the primary project
  useEffect(() => {
    if (!projectId) {
      // Instead of immediately redirecting, try to find a primary project
      findPrimaryProject();
    } else {
      fetchProjectDetails();
    }
  }, [projectId, navigate]);

  // Function to find and navigate to the primary project
  const findPrimaryProject = async () => {
    try {
      setIsLoading(true);
      
      // Use the primaryProjectService to get the primary or first project
      const project = await getPrimaryOrFirstProject();
      
      if (project) {
        // If a project is found, navigate to it
        console.log(`Found project: ${project.name} (${project.id}), redirecting...`);
        navigate(`/projects/${project.id}/tokens`, { replace: true });
      } else {
        // No projects at all, redirect to projects page
        console.warn("No projects found, redirecting to projects page");
        navigate('/projects');
      }
    } catch (error: any) {
      console.error("Error finding primary project:", error);
      toast({
        title: "Error",
        description: "Failed to find a default project. Redirecting to projects page.",
        variant: "destructive",
      });
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectDetails = async () => {
    if (!projectId) {
      console.warn("Attempted to fetch project details with invalid projectId");
      return;
    }

    try {
      setIsLoading(true);
      // Use maybeSingle instead of single to avoid errors when no rows are found
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setProject(data as Project);
      } else {
        // Handle case where project doesn't exist
        console.warn(`Project with ID ${projectId} not found`);
        toast({
          title: "Project Not Found",
          description: `The project with ID ${projectId} could not be found.`,
          variant: "destructive",
        });
        // Redirect to projects page when project not found
        navigate('/projects');
      }
    } catch (error: any) {
      console.error("Error fetching project details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (projectId) {
      navigate(`/projects/${projectId}/tokens`);
    } else {
      navigate('/projects');
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    
    // Refresh project details
    fetchProjectDetails();
    
    // Refresh token selector if it exists in the DOM
    const tokenSelectorRefreshButton = document.querySelector('[data-token-selector-refresh="true"]');
    if (tokenSelectorRefreshButton && tokenSelectorRefreshButton instanceof HTMLButtonElement) {
      tokenSelectorRefreshButton.click();
    }
    
    if (onRefresh) {
      onRefresh();
    }
    
    // Set loading to false after a short delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleProjectChange = (newProjectId: string) => {
    if (newProjectId && newProjectId !== projectId) {
      navigate(`/projects/${newProjectId}/tokens`);
    }
  };

  const handleTokenChange = (newTokenId: string) => {
    if (newTokenId && projectId && newTokenId !== tokenId) {
      navigate(`/projects/${projectId}/tokens/${newTokenId}`);
    }
  };

  const pageTitle = title || (section.charAt(0).toUpperCase() + section.slice(1));
  const pageDescription = description || `Manage ${section} for this project`;

  // If no valid projectId and still loading, show a loading state
  if (!projectId && isLoading) {
    return (
      <div className="w-full h-full bg-gray-50 p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading project...</span>
        </div>
      </div>
    );
  }

  // If no valid projectId and not loading, we're in the process of finding one
  if (!projectId && !isLoading) {
    return (
      <div className="w-full h-full bg-gray-50 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Finding Default Project</h1>
          <Button onClick={() => navigate('/projects')}>
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50">
      <TokenNavigation projectId={projectId} />

      <div className="p-6 pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button variant="outline" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {project?.name || "Project"} - {pageTitle}
              </h1>
              <p className="text-muted-foreground">{pageDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actionButton}
            <div className="flex flex-col gap-3 w-full md:items-end">
              <div className="flex items-center gap-2">
                {showRefreshButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                    />
                    {isLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                )}
                <ProjectSelector
                  currentProjectId={projectId}
                  onProjectChange={handleProjectChange}
                />
              </div>
              {tokenId && (
                <div className="w-full md:w-[500px]">
                  <TokenSelector
                    projectId={projectId}
                    currentTokenId={tokenId}
                    onTokenChange={handleTokenChange}
                    className="w-full"
                    hideRefreshButton={true}
                    refreshButtonDataAttr="token-selector-refresh"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default TokenPageLayout;