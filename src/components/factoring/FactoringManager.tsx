import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import FactoringNavigation from "./FactoringNavigation";
import InvoiceIngestionManager from "./InvoiceIngestionManager";
import PoolManager from "./PoolManager";
import TokenizationManager from "./TokenizationManager";
import TokenDistributionManager from "./TokenDistributionManager";
import FactoringDashboard from "./FactoringDashboard";
import { supabase, checkSupabaseConnection } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/types/core/database";
import ProjectSelector from "../captable/ProjectSelector";

interface FactoringManagerProps {
  projectId?: string;
  section?: string;
}

function FactoringManager({ projectId, section }: FactoringManagerProps) {
  const params = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<Tables<"projects"> | null>(null);
  const { toast } = useToast();

  // Use projectId from props or from URL params
  const currentProjectId = projectId || params.projectId;
  
  // Handle both explicit "dashboard" and empty/root section as the dashboard section
  const currentSection = section || params.section || "dashboard";
  const isDefaultSection = !section && !params.section || currentSection === "dashboard";

  // If no projectId is provided, fetch the primary project
  useEffect(() => {
    if (!currentProjectId) {
      fetchPrimaryProject();
    } else if (currentProjectId !== "undefined" && currentProjectId !== undefined) {
      fetchProjectDetails();
    } else {
      fetchPrimaryProject();
    }
  }, [currentProjectId]);

  // Function to fetch the primary project
  const fetchPrimaryProject = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("is_primary", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching primary project:", error);
        
        // If no primary project found, fetch any project
        if (error.code === 'PGRST116') {
          const { data: anyProject, error: anyError } = await supabase
            .from("projects")
            .select("id, name")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          if (anyError) {
            console.error("Error fetching any project:", anyError);
            return;
          }
          
          if (anyProject) {
            // Navigate to the first available project
            navigate(`/projects/${anyProject.id}/factoring/${currentSection}`);
          }
        }
        return;
      }

      if (data) {
        // Navigate to the primary project
        navigate(`/projects/${data.id}/factoring/${currentSection}`);
      }
    } catch (err) {
      console.error("Error in fetchPrimaryProject:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      setIsLoading(true);
      
      // Validate project ID before making the request
      if (!currentProjectId || currentProjectId === "undefined") {
        toast({
          title: "Error",
          description: "Invalid project ID. Redirecting to primary project.",
          variant: "destructive",
        });
        fetchPrimaryProject();
        return;
      }

      // Check Supabase connection first
      const connectionCheck = await checkSupabaseConnection();

      if (!connectionCheck.success) {
        toast({
          title: "Connection Error",
          description: "Failed to connect to the database. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", currentProjectId)
        .single();

      if (error) {
        console.error("Supabase error fetching project:", error);
        throw error;
      }

      setProject(data);
    } catch (err) {
      console.error("Error fetching project details:", err);
      toast({
        title: "Error",
        description: "Failed to load project details: " + (err instanceof Error ? err.message : String(err)),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    fetchProjectDetails();
  };

  const handleProjectChange = (newProjectId: string) => {
    if (newProjectId !== currentProjectId) {
      navigate(`/projects/${newProjectId}/factoring/${currentSection}`);
    }
  };

  const renderSection = () => {
    if (!currentProjectId) {
      return (
        <div className="p-6 bg-white rounded-lg shadow m-6">
          <h2 className="text-xl font-bold mb-4">No Project Selected</h2>
          <p>Please select a project to view factoring data.</p>
        </div>
      );
    }

    switch (currentSection) {
      case "dashboard":
        return <FactoringDashboard projectId={currentProjectId} />;
      case "invoices":
        return <InvoiceIngestionManager projectId={currentProjectId} />;
      case "pools":
        return <PoolManager projectId={currentProjectId} />;
      case "tokenization":
        return <TokenizationManager projectId={currentProjectId} projectName={project?.name} />;
      case "distribution":
        return <TokenDistributionManager projectId={currentProjectId} projectName={project?.name} />;
      default:
        return <FactoringDashboard projectId={currentProjectId} />;
    }
  };

  return (
    <div className="w-full h-full bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-center p-6 pb-3 bg-white border-b">
        <div className="flex items-center space-x-2 w-full justify-between">
          <div className="flex items-center gap-4">
            {!isDefaultSection && (
              <Button variant="outline" size="icon" onClick={handleBack} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {project?.name || "Project"} {!isDefaultSection && "- " + 
                  currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}
              </h1>
              <p className="text-muted-foreground">
                {isDefaultSection 
                  ? "Manage factoring operations for this project" 
                  : `Manage ${currentSection} for this project`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ProjectSelector 
              currentProjectId={currentProjectId} 
              onProjectChange={handleProjectChange} 
            />
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
          </div>
        </div>
      </div>

      {currentProjectId && <FactoringNavigation projectId={currentProjectId} />}

      {renderSection()}
    </div>
  );
}

export default FactoringManager;