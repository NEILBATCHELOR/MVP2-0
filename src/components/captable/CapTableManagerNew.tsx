import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import CapTableNavigation from "./CapTableNavigation";
import CapTableDashboard from "./CapTableDashboard";
import InvestorsList from "../investors/InvestorsList";
import SubscriptionManager from "./SubscriptionManager";
import TokenAllocationManager from "./TokenAllocationManager";
import TokenMintingManager from "./TokenMintingManager";
import TokenDistributionManager from "./TokenDistributionManager";
import CompliancePanel from "./CompliancePanel";
import ProjectSelector from "./ProjectSelector";
import { supabase, checkSupabaseConnection, debugQuery } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/types/core/database";
import { getPrimaryOrFirstProject } from "@/services/project/primaryProjectService";

// Define project type based on database structure
type Project = Tables<"projects">;

interface CapTableManagerProps {
  projectId?: string;
  section?: string;
}

function CapTableManagerNew({ projectId, section }: CapTableManagerProps) {
  console.log("CapTableManagerNew rendering with:", { projectId, section });
  const params = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [dataLoadingStatus, setDataLoadingStatus] = useState<{
    connection: boolean;
    project: boolean;
    subscriptions: boolean;
    investors: boolean;
    allocations: boolean;
  }>({
    connection: false,
    project: false,
    subscriptions: false,
    investors: false,
    allocations: false,
  });
  const { toast } = useToast();

  // Use projectId from props or from URL params
  const currentProjectId = projectId || params.projectId;
  const currentSection = section || params.section || "overview";

  console.log("Resolved params:", {
    currentProjectId,
    currentSection,
    rawParams: params,
  });

  // Additional logging to trace projectId flow
  console.log("[CapTableManagerNew] Route path:", window.location.pathname);
  console.log("[CapTableManagerNew] projectId from props:", projectId);
  console.log("[CapTableManagerNew] projectId from params:", params.projectId);
  console.log("[CapTableManagerNew] Final currentProjectId:", currentProjectId);

  // If no projectId is provided, fetch the primary project
  useEffect(() => {
    if (!currentProjectId) {
      fetchPrimaryProject();
    } else if (currentProjectId !== "undefined" && currentProjectId !== undefined) {
      console.log("Fetching project details for ID:", currentProjectId);
      fetchProjectDetails();
    } else {
      console.log("Invalid project ID, fetching primary project instead");
      fetchPrimaryProject();
    }
  }, [currentProjectId]);

  // Function to fetch the primary project
  const fetchPrimaryProject = async () => {
    try {
      setIsLoading(true);
      console.log("No project ID provided, fetching primary project...");
      
      // Use the primary project service
      const project = await getPrimaryOrFirstProject();
      
      if (project) {
        console.log("Found project:", project);
        // Navigate to the found project
        navigate(`/projects/${project.id}/captable/${currentSection === 'overview' ? '' : currentSection}`);
      } else {
        console.log("No projects found");
        setIsLoading(false);
        // Handle no projects case - could show a message or redirect to project creation
      }
    } catch (err) {
      console.error("Error in fetchPrimaryProject:", err);
      setIsLoading(false);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      setIsLoading(true);
      
      // Validate project ID before making the request
      if (!currentProjectId || currentProjectId === "undefined") {
        console.log("Invalid project ID detected in fetchProjectDetails:", currentProjectId);
        toast({
          title: "Error",
          description: "Invalid project ID. Redirecting to primary project.",
          variant: "destructive",
        });
        fetchPrimaryProject();
        return;
      }
      
      console.log("Fetching project with ID:", currentProjectId);

      // Check Supabase connection first
      const connectionCheck = await checkSupabaseConnection();
      setDataLoadingStatus((prev) => ({
        ...prev,
        connection: connectionCheck.success,
      }));

      if (!connectionCheck.success) {
        console.error("Supabase connection failed:", connectionCheck.error);
        toast({
          title: "Connection Error",
          description:
            "Failed to connect to the database. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      // Debug query
      console.log("About to query projects table for ID:", currentProjectId);

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", currentProjectId)
        .single();

      if (error) {
        console.error("Supabase error fetching project:", error);
        setDataLoadingStatus((prev) => ({ ...prev, project: false }));

        // Check if the error is due to the table not existing
        if (error.code === "PGRST116") {
          console.log(
            "Projects table might not exist, checking available tables...",
          );
          // This would require additional code to list available tables
          // For now, we'll just show a more specific error message
          toast({
            title: "Database Error",
            description:
              "The projects table does not exist or is not accessible.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      console.log("Project data fetched:", data);
      setProject(data);
      setDataLoadingStatus((prev) => ({ ...prev, project: true }));

      // Debug other tables
      console.log("Checking related data for project ID:", currentProjectId);

      // Check subscriptions with enhanced debugging
      // First, try to get the table structure to see available columns
      try {
        const { data: sampleSubscription } = await supabase
          .from("subscriptions")
          .select("*")
          .limit(1);

        if (sampleSubscription && sampleSubscription.length > 0) {
          console.log(
            "Available columns in subscriptions:",
            Object.keys(sampleSubscription[0]),
          );

          // Now use the debugQuery with knowledge of the table structure
          const subscriptionsResult = await debugQuery(
            "subscriptions",
            currentProjectId,
            { detailed: true },
          );
          setDataLoadingStatus((prev) => ({
            ...prev,
            subscriptions: subscriptionsResult.success,
          }));
          console.log("Subscriptions query result:", subscriptionsResult);
        } else {
          console.log("No sample subscription data found");
          setDataLoadingStatus((prev) => ({
            ...prev,
            subscriptions: false,
          }));
        }
      } catch (subErr) {
        console.error("Error checking subscriptions table structure:", subErr);
        setDataLoadingStatus((prev) => ({
          ...prev,
          subscriptions: false,
        }));
      }

      // Check investors table - note: investors table doesn't have project_id column
      const investorsResult = await debugQuery("investors", null, {
        detailed: true,
      });

      // If investors query fails, try cap_table_investors as a fallback
      if (!investorsResult.success) {
        console.log("Trying alternative cap_table_investors table...");
        const capTableInvestorsResult = await debugQuery(
          "cap_table_investors",
          null,
          {
            detailed: true,
          },
        );
        if (capTableInvestorsResult.success) {
          console.log("Successfully queried cap_table_investors table");
          // Update the status to true since we found an alternative table
          setDataLoadingStatus((prev) => ({
            ...prev,
            investors: true,
          }));
        }
      } else {
        setDataLoadingStatus((prev) => ({
          ...prev,
          investors: investorsResult.success,
        }));
      }
      console.log("Investors query result:", investorsResult);

      // Try both token_allocations and allocations tables
      let allocationsResult = await debugQuery(
        "token_allocations",
        currentProjectId,
        { detailed: true },
      );

      // If token_allocations fails, try the allocations table
      if (!allocationsResult.success) {
        console.log("Trying alternative allocations table...");
        allocationsResult = await debugQuery("allocations", currentProjectId, {
          detailed: true,
        });
      }
      setDataLoadingStatus((prev) => ({
        ...prev,
        allocations: allocationsResult.success,
      }));
      console.log("Allocations query result:", allocationsResult);

      // Log overall data loading status
      console.log("Data loading status:", dataLoadingStatus);
    } catch (err) {
      console.error("Error fetching project details:", err);
      toast({
        title: "Error",
        description:
          "Failed to load project details: " +
          (err instanceof Error ? err.message : String(err)),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleProjectChange = (newProjectId: string) => {
    console.log("Project changed to:", newProjectId);
    if (currentSection === "overview") {
      navigate(`/projects/${newProjectId}/captable`);
    } else {
      navigate(`/projects/${newProjectId}/captable/${currentSection}`);
    }
    // Force a refresh of the project details
    fetchProjectDetails();
  };

  const handleRefresh = () => {
    console.log("Manually refreshing data...");
    fetchProjectDetails();
  };

  // Debug placeholder to show data loading status
  const renderSimplePlaceholder = () => {
    return (
      <div className="p-6 bg-white rounded-lg shadow m-6">
        <h2 className="text-xl font-bold mb-4">Cap Table Manager</h2>
        <p className="mb-2">Current Project ID: {currentProjectId || "None"}</p>
        <p className="mb-2">Current Section: {currentSection}</p>
        <p className="mb-2">Project Name: {project?.name || "Unknown"}</p>
        <p>Status: {isLoading ? "Loading..." : "Ready"}</p>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Data Loading Status:</h3>
          <ul className="space-y-1">
            <li>
              Database Connection: {dataLoadingStatus.connection ? "✅" : "❌"}
            </li>
            <li>Project Data: {dataLoadingStatus.project ? "✅" : "❌"}</li>
            <li>
              Subscriptions: {dataLoadingStatus.subscriptions ? "✅" : "❌"}
            </li>
            <li>Investors: {dataLoadingStatus.investors ? "✅" : "❌"}</li>
            <li>Allocations: {dataLoadingStatus.allocations ? "✅" : "❌"}</li>
          </ul>
        </div>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
        </Button>
      </div>
    );
  };

  const renderSection = () => {
    console.log(
      "[CapTableManagerNew] Rendering section:",
      currentSection,
      "with projectId:",
      currentProjectId,
    );

    // Use the debug placeholder to diagnose data loading issues
    // return renderSimplePlaceholder();

    if (!currentProjectId) {
      return (
        <div className="p-6 bg-white rounded-lg shadow m-6">
          <h2 className="text-xl font-bold mb-4">No Project Selected</h2>
          <p>Please select a project to view its cap table data.</p>
        </div>
      );
    }

    switch (currentSection) {
      case "overview":
        return <CapTableDashboard projectId={currentProjectId} />;
      case "investors":
        return (
          <InvestorsList projectId={currentProjectId} key={currentProjectId} />
        );
      case "subscriptions":
        console.log(
          "[CapTableManagerNew] Rendering SubscriptionManager with projectId:",
          currentProjectId,
        );
        return <SubscriptionManager projectId={currentProjectId} />;
      case "allocations":
        console.log(
          "[CapTableManagerNew] Rendering TokenAllocationManager with projectId:",
          currentProjectId,
        );
        return (
          <TokenAllocationManager
            projectId={currentProjectId}
            projectName={project?.name}
          />
        );
      case "minting":
        console.log(
          "[CapTableManagerNew] Rendering TokenMintingManager with projectId:",
          currentProjectId,
        );
        return (
          <TokenMintingManager
            projectId={currentProjectId}
            projectName={project?.name}
          />
        );
      case "distributions":
        console.log(
          "[CapTableManagerNew] Rendering TokenDistributionManager with projectId:",
          currentProjectId,
        );
        return (
          <TokenDistributionManager
            projectId={currentProjectId}
            projectName={project?.name}
          />
        );
      case "compliance":
        return <CompliancePanel projectId={currentProjectId} />;
      case "reports":
        return (
          <div className="p-6 bg-white rounded-lg shadow m-6">
            Reports Module (Coming Soon)
          </div>
        );
      case "documents":
        return (
          <div className="p-6 bg-white rounded-lg shadow m-6">
            Documents Module (Coming Soon)
          </div>
        );
      default:
        return <CapTableDashboard projectId={currentProjectId} />;
    }
  };

  return (
    <div className="w-full h-full bg-gray-50">
      {currentProjectId && <CapTableNavigation projectId={currentProjectId} />}

      {currentSection !== "overview" && (
        <div className="p-6 pb-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {project?.name || "Project"} -{" "}
                  {currentSection.charAt(0).toUpperCase() +
                    currentSection.slice(1)}
                </h1>
                <p className="text-muted-foreground">
                  Manage {currentSection} for this project
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              {currentProjectId && (
                <ProjectSelector
                  currentProjectId={currentProjectId}
                  onProjectChange={handleProjectChange}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {renderSection()}
    </div>
  );
}

export default CapTableManagerNew;