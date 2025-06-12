import React, { useState, useEffect } from "react";
import { getProjects, getProjectById } from "@/services/project/projectService";
import { getInvestors } from "@/services/investor/investors";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/infrastructure/database/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Users, BarChart, TrendingUp, Plus } from "lucide-react";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalProjects: 0,
    activeProjects: 0,
    draftProjects: 0,
    completedProjects: 0,
    totalInvestors: 0,
    newInvestorsThisMonth: 0,
    totalAllocation: 0,
    allocationThisQuarter: 0,
    averageInvestment: 0,
    percentChangeInAverage: 0,
    recentProjects: [],
    allocations: 0,
    distributions: 0,
    subscriptions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const { toast } = useToast();
  const location = useLocation();
  const params = useParams();

  // Extract projectId from location state or URL params
  const projectId =
    location.state?.projectId || params.projectId || "test-project-1";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching dashboard data for project ID:", projectId);

        if (projectId) {
          // Fetch project details
          const project = await getProjectById(projectId);
          setSelectedProject(project);
          console.log("Project details:", project);

          // SIMPLE DIRECT QUERIES FOR METRICS
          // 1. Get investor count (from cap_table_investors)
          let investorCount = 0;
          const { data: capTableData } = await supabase
            .from("cap_tables")
            .select("id")
            .eq("project_id", projectId)
            .single();

          if (capTableData?.id) {
            const { data: investorData, error: investorError } = await supabase
              .from("cap_table_investors")
              .select("investor_id")
              .eq("cap_table_id", capTableData.id);

            if (!investorError) {
              investorCount = investorData?.length || 0;
              console.log(
                `Found ${investorCount} investors for project ${projectId}`,
              );
            } else {
              console.error("Error fetching investors:", investorError);
            }
          }

          // 2. Get subscription count
          const { data: subscriptionData, error: subscriptionError } =
            await supabase
              .from("subscriptions")
              .select("id")
              .eq("project_id", projectId);

          const subscriptionCount = subscriptionData?.length || 0;
          console.log(
            `Found ${subscriptionCount} subscriptions for project ${projectId}`,
          );

          if (subscriptionError) {
            console.error("Error fetching subscriptions:", subscriptionError);
          }

          // Get subscription IDs for token allocation queries
          const subscriptionIds = subscriptionData?.map((sub) => sub.id) || [];

          // 3. Get allocations count (token_allocations where distributed = false)
          let allocationsCount = 0;
          if (subscriptionIds.length > 0) {
            const { data: allocData, error: allocError } = await supabase
              .from("token_allocations")
              .select("id")
              .in("subscription_id", subscriptionIds)
              .eq("distributed", false);

            allocationsCount = allocData?.length || 0;
            console.log(
              `Found ${allocationsCount} allocations (not distributed) for project ${projectId}`,
            );

            if (allocError) {
              console.error("Error fetching allocations:", allocError);
            }
          }

          // 4. Get distributions count (token_allocations where distributed = true)
          let distributionsCount = 0;
          if (subscriptionIds.length > 0) {
            const { data: distData, error: distError } = await supabase
              .from("token_allocations")
              .select("id")
              .in("subscription_id", subscriptionIds)
              .eq("distributed", true);

            distributionsCount = distData?.length || 0;
            console.log(
              `Found ${distributionsCount} distributions (distributed = true) for project ${projectId}`,
            );

            if (distError) {
              console.error("Error fetching distributions:", distError);
            }
          }

          // Calculate total allocation and other metrics
          let totalAllocation = 0;
          if (subscriptionData) {
            totalAllocation = subscriptionData.reduce((sum, sub: any) => {
              return sum + (sub.amount || 0);
            }, 0);
          }

          // Set dashboard data
          setDashboardData({
            totalProjects: 1,
            activeProjects: project?.status === "active" ? 1 : 0,
            draftProjects: project?.status === "draft" ? 1 : 0,
            completedProjects: project?.status === "completed" ? 1 : 0,
            totalInvestors: investorCount,
            newInvestorsThisMonth: Math.floor(investorCount * 0.3), // Placeholder
            totalAllocation: project?.fundingGoal || 0,
            allocationThisQuarter: Math.floor(
              (project?.fundingGoal || 0) * 0.25,
            ), // Placeholder
            averageInvestment:
              investorCount > 0
                ? (project?.fundingGoal || 0) / investorCount
                : 0,
            percentChangeInAverage: 5, // Placeholder
            allocations: allocationsCount,
            distributions: distributionsCount,
            subscriptions: subscriptionCount,
            recentProjects: [
              {
                id: project?.id || "",
                name: project?.name || "Unknown Project",
                updatedAt: project?.createdAt
                  ? new Date(project.createdAt).toLocaleDateString()
                  : "Unknown",
              },
            ],
          });
        } else {
          // Fetch all projects and investors for the main dashboard
          const projects = await getProjects();
          const investors = await getInvestors();

          // Calculate dashboard metrics
          const activeProjects = projects.filter(
            (p) => p.status === "active",
          ).length;
          const draftProjects = projects.filter(
            (p) => p.status === "draft",
          ).length;
          const completedProjects = projects.filter(
            (p) => p.status === "completed",
          ).length;

          // Calculate total allocation from all projects
          const totalAllocation = projects.reduce(
            (sum, project) => sum + (project.fundingGoal || 0),
            0,
          );

          // Calculate new investors in the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const newInvestors = investors.filter(
            (investor) => new Date(investor.createdAt) >= thirtyDaysAgo,
          ).length;

          // Get recent projects (sorted by updated_at)
          const recentProjects = [...projects]
            .sort(
              (a, b) =>
                new Date(b.createdAt || "").getTime() -
                new Date(a.createdAt || "").getTime(),
            )
            .slice(0, 3)
            .map((project) => ({
              id: project.id,
              name: project.name,
              updatedAt: new Date(project.createdAt || "").toLocaleDateString(),
            }));

          setDashboardData({
            totalProjects: projects.length,
            activeProjects,
            draftProjects,
            completedProjects,
            totalInvestors: investors.length,
            newInvestorsThisMonth: newInvestors,
            totalAllocation,
            allocationThisQuarter: Math.round(totalAllocation * 0.25),
            averageInvestment:
              investors.length > 0 ? totalAllocation / investors.length : 0,
            percentChangeInAverage: 12, // Placeholder
            allocations: 0,
            distributions: 0,
            subscriptions: 0,
            recentProjects,
          });
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast, projectId]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {selectedProject ? selectedProject.name : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {selectedProject
              ? `Project overview and metrics`
              : "Welcome to Chain Capital platform"}
          </p>
        </div>
        <Button asChild>
          <Link to="/projects" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>{selectedProject ? "Edit Project" : "New Project"}</span>
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {!selectedProject ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.totalProjects}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.activeProjects} active,{" "}
                  {dashboardData.draftProjects} draft,{" "}
                  {dashboardData.completedProjects} completed
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.subscriptions}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.subscriptions > 0 &&
                  dashboardData.totalInvestors > 0
                    ? Math.round(
                        (dashboardData.subscriptions /
                          dashboardData.totalInvestors) *
                          100,
                      )
                    : 0}
                  % of investors
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Investors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {dashboardData.totalInvestors}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData.newInvestorsThisMonth} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {dashboardData.allocations}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Token allocations not yet distributed
              </p>
            </CardContent>
          </Card>

          {!selectedProject ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Investment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${(dashboardData.averageInvestment / 1000).toFixed(0)}K
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +{dashboardData.percentChangeInAverage}% from last quarter
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Distributions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.distributions}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Token allocations that have been distributed
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedProject ? "Project Details" : "Recent Projects"}
            </CardTitle>
            <CardDescription>
              {selectedProject
                ? "Key metrics and information"
                : "Your most recently updated projects"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedProject ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Project Type
                    </h3>
                    <p className="font-medium mt-1 capitalize">
                      {selectedProject.project_type}
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Status
                    </h3>
                    <p className="font-medium mt-1 capitalize">
                      {selectedProject.status}
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Target Raise
                    </h3>
                    <p className="font-medium mt-1">
                      ${(selectedProject.fundingGoal / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Token Symbol
                    </h3>
                    <p className="font-medium mt-1">
                      {selectedProject.token_symbol}
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Allocations
                    </h3>
                    <p className="font-medium mt-1">
                      {dashboardData.allocations}
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Created
                    </h3>
                    <p className="font-medium mt-1">
                      {new Date(
                        selectedProject.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to="/investors"
                      state={{ projectId: selectedProject.id }}
                    >
                      Manage Investors
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to="/subscriptions"
                      state={{ projectId: selectedProject.id }}
                    >
                      View Subscriptions
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.recentProjects.length > 0 ? (
                  dashboardData.recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last updated: {project.updatedAt}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          to={`/projects`}
                          state={{ projectId: project.id }}
                        >
                          View
                        </Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No projects found
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/projects">View All Projects</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard Metrics</CardTitle>
            <CardDescription>Metric definitions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="border-b pb-2">
                <h3 className="font-medium">Investors</h3>
                <p className="text-muted-foreground">
                  Total investor record count
                </p>
              </div>
              <div className="border-b pb-2">
                <h3 className="font-medium">Subscriptions</h3>
                <p className="text-muted-foreground">
                  Total subscriptions for project
                </p>
              </div>
              <div className="border-b pb-2">
                <h3 className="font-medium">Allocations</h3>
                <p className="text-muted-foreground">
                  Token allocations where distributed = FALSE
                </p>
              </div>
              <div className="border-b pb-2">
                <h3 className="font-medium">Distributions</h3>
                <p className="text-muted-foreground">
                  Token allocations where distributed = TRUE
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
