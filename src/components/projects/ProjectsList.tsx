import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Loader2, RefreshCw } from "lucide-react";
import ProjectCard from "./ProjectCard";
import ProjectDialog from "./ProjectDialog";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/infrastructure/database/client";

interface ProjectsListProps {
  onViewProject: (projectId: string) => void;
  onManageSubscription: (projectId: string) => void;
  hideHeader?: boolean;
}

const ProjectsList = ({
  onViewProject,
  onManageSubscription,
  hideHeader = false,
}: ProjectsListProps) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [projectStats, setProjectStats] = useState<Record<string, any>>({});
  const { toast } = useToast();

  // Fetch projects from Supabase
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProjects(data || []);

      // Optimize stats fetching - use a single batch query instead of multiple queries
      if (data && data.length > 0) {
        // Extract all project IDs
        const projectIds = data.map(project => project.id);
        const statsMap: Record<string, any> = {};
        
        // Initialize statsMap with default values
        projectIds.forEach(id => {
          statsMap[id] = {
            totalInvestors: 0,
            totalRaised: 0,
            documentCount: 0
          };
        });

        // Get all subscriptions in a single query
        const { data: subscriptionsData, error: subError } = await supabase
          .from("subscriptions")
          .select('id, project_id, fiat_amount, investor_id')
          .in('project_id', projectIds);

        if (subError) {
          console.error("Error fetching subscriptions:", subError);
        } else if (subscriptionsData) {
          // Process subscription data to calculate stats
          const projectSubscriptions: Record<string, any[]> = {};
          
          // Group subscriptions by project_id
          subscriptionsData.forEach(sub => {
            if (!projectSubscriptions[sub.project_id]) {
              projectSubscriptions[sub.project_id] = [];
            }
            projectSubscriptions[sub.project_id].push(sub);
          });
          
          // Calculate stats for each project
          Object.keys(projectSubscriptions).forEach(projectId => {
            const subs = projectSubscriptions[projectId];
            const uniqueInvestors = new Set(subs.map(sub => sub.investor_id));
            const totalRaised = subs.reduce((sum, sub) => sum + (sub.fiat_amount || 0), 0);
            
            statsMap[projectId] = {
              ...statsMap[projectId],
              totalInvestors: uniqueInvestors.size,
              totalRaised,
            };
          });
        }

        // Get document counts from issuer_detail_documents
        for (const projectId of projectIds) {
          const { count, error: docError } = await supabase
            .from("issuer_detail_documents")
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId);

          if (docError) {
            console.error(`Error fetching document count for project ${projectId}:`, docError);
          } else if (count !== null) {
            if (statsMap[projectId]) {
              statsMap[projectId].documentCount = count;
            }
          }
        }

        setProjectStats(statsMap);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter projects based on search query and filters
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter ? project.status === statusFilter : true;
    const matchesType = typeFilter ? project.project_type === typeFilter : true;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle adding a new project
  const handleAddProject = async (projectData: any) => {
    try {
      setIsProcessing(true);

      const now = new Date().toISOString();
      
      // Process fields - convert empty strings to null to avoid type errors
      const processedData = {
        ...projectData,
        project_type: projectData.project_type || projectData.projectType,
        // Numeric fields
        target_raise: projectData.target_raise === "" ? null : projectData.target_raise,
        total_notional: projectData.total_notional === "" ? null : projectData.total_notional,
        authorized_shares: projectData.authorized_shares === "" ? null : projectData.authorized_shares,
        share_price: projectData.share_price === "" ? null : projectData.share_price,
        company_valuation: projectData.company_valuation === "" ? null : projectData.company_valuation,
        minimum_investment: projectData.minimum_investment === "" ? null : projectData.minimum_investment,
        estimated_yield_percentage: projectData.estimated_yield_percentage === "" ? null : projectData.estimated_yield_percentage,
        // Enum fields
        duration: projectData.duration === "" ? null : projectData.duration,
        // Timestamp fields
        subscription_start_date: projectData.subscription_start_date === "" ? null : projectData.subscription_start_date,
        subscription_end_date: projectData.subscription_end_date === "" ? null : projectData.subscription_end_date,
        transaction_start_date: projectData.transaction_start_date === "" ? null : projectData.transaction_start_date,
        maturity_date: projectData.maturity_date === "" ? null : projectData.maturity_date,
        // Other fields
        created_at: now,
        updated_at: now,
      };

      // Try to use the RPC function for creating a project with cap table in one transaction
      try {
        const { data, error: rpcError } = await (supabase as any)
          .rpc('create_project_with_cap_table', {
            project_data: processedData,
            cap_table_name: `Cap Table - ${projectData.name}`
          });

        if (rpcError) throw rpcError;
        
        // Use the data returned from the RPC function
        setProjects((prev) => [(data as any), ...prev]);
        
        // Initialize stats for the new project
        setProjectStats((prev) => ({
          ...prev,
          [(data as any).id]: { totalInvestors: 0, totalRaised: 0, documentCount: 0 },
        }));
        
        toast({
          title: "Success",
          description: "Project created successfully",
        });
        setIsAddDialogOpen(false);
        return;
      } catch (rpcError: any) {
        console.warn("Fallback to manual project creation:", rpcError);
        
        // Handle specific error types with user-friendly messages
        if (rpcError.message) {
          if (rpcError.message.includes('project_duration')) {
            toast({
              title: "Invalid Duration",
              description: "Please select a valid duration or leave it empty",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          } else if (rpcError.message.includes('timestamp')) {
            toast({
              title: "Invalid Date Format",
              description: "One or more dates are in an invalid format. Please check date fields.",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }
        }
      }
        
      // Create the project first
      try {
        const { data: projectRecord, error: projectError } = await supabase
          .from("projects")
          .insert(processedData)
          .select()
          .single();

        if (projectError) throw projectError;

        // Then create a cap table for this project
        const { error: capTableError } = await supabase
          .from("cap_tables")
          .insert({
            project_id: projectRecord.id,
            name: `Cap Table - ${projectData.name}`,
            created_at: now,
            updated_at: now,
            description: null,
          });

        if (capTableError) throw capTableError;

        // Use the data from the manual creation
        setProjects((prev) => [projectRecord, ...prev]);
        
        // Initialize stats for the new project
        setProjectStats((prev) => ({
          ...prev,
          [projectRecord.id]: { totalInvestors: 0, totalRaised: 0, documentCount: 0 },
        }));

        toast({
          title: "Success",
          description: "Project created successfully",
        });
        setIsAddDialogOpen(false);
      } catch (error: any) {
        // Handle specific errors with user-friendly messages
        if (error.message) {
          if (error.message.includes('project_duration')) {
            toast({
              title: "Invalid Duration",
              description: "Please select a valid duration or leave it empty",
              variant: "destructive",
            });
          } else if (error.message.includes('timestamp')) {
            toast({
              title: "Invalid Date Format",
              description: "One or more dates are in an invalid format. Please check date fields.",
              variant: "destructive",
            });
          } else {
            console.error("Error adding project:", error);
            toast({
              title: "Error",
              description: "Failed to create project. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          console.error("Error adding project:", error);
          toast({
            title: "Error",
            description: "Failed to create project. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error("Error adding project:", err);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle editing a project
  const handleEditProject = async (projectData: any) => {
    if (!currentProject) return;

    try {
      setIsProcessing(true);

      // Process fields - convert empty strings to null to avoid type errors
      const processedData = {
        ...projectData,
        // Numeric fields
        target_raise: projectData.target_raise === "" ? null : projectData.target_raise,
        total_notional: projectData.total_notional === "" ? null : projectData.total_notional,
        authorized_shares: projectData.authorized_shares === "" ? null : projectData.authorized_shares,
        share_price: projectData.share_price === "" ? null : projectData.share_price,
        company_valuation: projectData.company_valuation === "" ? null : projectData.company_valuation,
        minimum_investment: projectData.minimum_investment === "" ? null : projectData.minimum_investment,
        estimated_yield_percentage: projectData.estimated_yield_percentage === "" ? null : projectData.estimated_yield_percentage,
        // Enum fields
        duration: projectData.duration === "" ? null : projectData.duration,
        // Timestamp fields
        subscription_start_date: projectData.subscription_start_date === "" ? null : projectData.subscription_start_date,
        subscription_end_date: projectData.subscription_end_date === "" ? null : projectData.subscription_end_date,
        transaction_start_date: projectData.transaction_start_date === "" ? null : projectData.transaction_start_date,
        maturity_date: projectData.maturity_date === "" ? null : projectData.maturity_date,
        // Default values 
        currency: projectData.currency || "USD",
        updated_at: new Date().toISOString(),
      };

      // Only update fields that have changed to reduce database load
      const fieldsToUpdate = Object.keys(processedData).reduce((acc, key) => {
        if (processedData[key] !== currentProject[key]) {
          acc[key] = processedData[key];
        }
        return acc;
      }, {} as Record<string, any>);

      // If no fields have changed, skip the update
      if (Object.keys(fieldsToUpdate).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were made to the project",
        });
        setIsEditDialogOpen(false);
        setCurrentProject(null);
        setIsProcessing(false);
        return;
      }

      // Always include updated_at
      if (!fieldsToUpdate.updated_at) {
        fieldsToUpdate.updated_at = processedData.updated_at;
      }

      // Update project without using select() to reduce query complexity
      const { error } = await supabase
        .from("projects")
        .update(fieldsToUpdate)
        .eq("id", currentProject.id);

      if (error) throw error;

      // Update the local state directly with processed data
      setProjects((prev) =>
        prev.map((project) =>
          project.id === currentProject.id ? { ...project, ...processedData } : project,
        ),
      );

      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      setIsEditDialogOpen(false);
      setCurrentProject(null);
    } catch (err: any) {
      console.error("Error updating project:", err);
      
      // Handle specific error types with user-friendly messages
      if (err.message) {
        if (err.message.includes('project_duration')) {
          toast({
            title: "Invalid Duration",
            description: "Please select a valid duration or leave it empty",
            variant: "destructive",
          });
        } else if (err.message.includes('timestamp')) {
          toast({
            title: "Invalid Date Format",
            description: "One or more dates are in an invalid format. Please check date fields.",
            variant: "destructive",
          });
        } else if (err.message.includes('numeric')) {
          toast({
            title: "Invalid Number Format",
            description: "One or more numeric fields have invalid values. Please check numeric fields.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update project. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to update project. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle deleting a project
  const handleDeleteProject = async () => {
    if (!currentProject) return;

    try {
      setIsProcessing(true);

      // Use a transaction to perform all delete operations to ensure data consistency
      // and reduce the number of database calls
      const { error } = await (supabase as any).rpc('delete_project_cascade', {
        project_id: currentProject.id
      });

      // If the RPC function doesn't exist or fails, fall back to the manual deletion
      if (error) {
        console.warn("Fallback to manual deletion:", error);
        
        // Get the cap table for this project
        const { data: capTable, error: capTableError } = await supabase
          .from("cap_tables")
          .select("id")
          .eq("project_id", currentProject.id)
          .maybeSingle();

        if (capTableError) throw capTableError;

        if (capTable) {
          // Delete cap table investors
          const { error: investorsError } = await supabase
            .from("cap_table_investors")
            .delete()
            .eq("cap_table_id", capTable.id);

          if (investorsError) throw investorsError;

          // Delete cap table
          const { error: deleteCapTableError } = await supabase
            .from("cap_tables")
            .delete()
            .eq("id", capTable.id);

          if (deleteCapTableError) throw deleteCapTableError;
        }

        // Get subscriptions for this project
        const { data: subscriptions, error: subscriptionsError } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("project_id", currentProject.id);

        if (subscriptionsError) throw subscriptionsError;

        if (subscriptions && subscriptions.length > 0) {
          const subscriptionIds = subscriptions.map((sub) => sub.id);

          // Delete token allocations
          const { error: allocationsError } = await supabase
            .from("token_allocations")
            .delete()
            .in("subscription_id", subscriptionIds);

          if (allocationsError) throw allocationsError;

          // Delete subscriptions
          const { error: deleteSubscriptionsError } = await supabase
            .from("subscriptions")
            .delete()
            .eq("project_id", currentProject.id);

          if (deleteSubscriptionsError) throw deleteSubscriptionsError;
        }

        // Delete the project
        const { error: deleteProjectError } = await supabase
          .from("projects")
          .delete()
          .eq("id", currentProject.id);

        if (deleteProjectError) throw deleteProjectError;
      }

      // Update local state
      setProjects((prev) =>
        prev.filter((project) => project.id !== currentProject.id),
      );

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setCurrentProject(null);
    } catch (err) {
      console.error("Error deleting project:", err);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter(null);
    setTypeFilter(null);
    setSearchQuery("");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        {!hideHeader && (
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage your token issuance projects
            </p>
          </div>
        )}
        <div className={`flex gap-2 ${hideHeader ? 'ml-auto' : ''}`}>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchProjects}
            disabled={isLoading}
            title="Refresh projects"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setCurrentProject(null);
              setIsAddDialogOpen(true);
            }}
            disabled={isProcessing}
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={statusFilter || ""}
            onValueChange={(value) => setStatusFilter(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter || ""}
            onValueChange={(value) => setTypeFilter(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="token">Token</SelectItem>
              <SelectItem value="debt">Debt</SelectItem>
              <SelectItem value="convertible">Convertible</SelectItem>
            </SelectContent>
          </Select>

          {(statusFilter || typeFilter || searchQuery) && (
            <Button variant="ghost" onClick={resetFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchProjects}>
            Retry
          </Button>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              stats={
                projectStats[project.id] || {
                  totalInvestors: 0,
                  totalRaised: 0,
                }
              }
              onEdit={() => {
                setCurrentProject(project);
                setIsEditDialogOpen(true);
              }}
              onDelete={() => {
                setCurrentProject(project);
                setIsDeleteDialogOpen(true);
              }}
              onViewProject={onViewProject}
              onManageSubscription={onManageSubscription}
            />
          ))}
        </div>
      ) : (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Plus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">
              {searchQuery || statusFilter || typeFilter
                ? "No matching projects found"
                : "No projects yet"}
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {searchQuery || statusFilter || typeFilter
                ? "Try adjusting your search or filters"
                : "Create your first project to start managing token issuances"}
            </p>
            {!(searchQuery || statusFilter || typeFilter) && (
              <Button
                onClick={() => {
                  setCurrentProject(null);
                  setIsAddDialogOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Project</span>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Project Dialog */}
      <ProjectDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddProject}
        isProcessing={isProcessing}
        title="Create New Project"
        description="Set up a new token issuance project"
      />

      {/* Edit Project Dialog */}
      {currentProject && (
        <ProjectDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleEditProject}
          isProcessing={isProcessing}
          title="Edit Project"
          description="Update project details"
          defaultValues={currentProject}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {currentProject && (
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteProject}
          isProcessing={isProcessing}
          itemName={currentProject.name}
          itemType="project"
        />
      )}
    </div>
  );
};

export default ProjectsList;