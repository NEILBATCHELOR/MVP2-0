import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getProject, getProjectStatistics } from "@/services/project/projectService";
import DocumentUploadManager from "@/components/documents/DocumentUploadManager";
import { useToast } from "@/components/ui/use-toast";
import { ProjectUI } from "@/types/core/centralModels";

const ProjectDetailsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [project, setProject] = useState<ProjectUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<{ investorCount: number, totalAllocation: number }>({ 
    investorCount: 0, 
    totalAllocation: 0 
  });

  // Parse tab from URL on component mount and when location changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['overview', 'documents', 'investors', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL without full page reload
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', value);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) {
        setLoadingError("Project ID is missing");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setLoadingError(null);
      
      try {
        console.log(`Fetching project details for ID: ${projectId}`);
        
        // Fetch project data first
        const projectData = await getProject(projectId);
        
        if (!projectData) {
          setLoadingError("Project not found");
          setLoading(false);
          toast({
            title: "Error",
            description: "Project not found",
            variant: "destructive"
          });
          return;
        }
        
        // Set project data immediately so UI can start rendering
        setProject(projectData);
        
        // Then fetch statistics separately with its own error handling
        try {
          console.log(`Fetching project statistics for ID: ${projectId}`);
          const stats = await getProjectStatistics(projectId);
          console.log("Statistics loaded:", stats);
          
          // Update stats state
          setStats(stats);
          
          // Update project with statistics
          setProject(prevProject => {
            if (!prevProject) return projectData;
            return {
              ...prevProject,
              totalInvestors: stats.investorCount || 0,
              totalAllocation: stats.totalAllocation || 0
            };
          });
        } catch (statsError) {
          console.error("Error fetching project statistics:", statsError);
          // Continue with project data even if statistics fail
        }
      } catch (error: any) {
        console.error("Error fetching project details:", error);
        setLoadingError("Failed to load project details");
        toast({
          title: "Error",
          description: "Failed to load project details",
          variant: "destructive"
        });
      } finally {
        // Always mark loading as complete
        setLoading(false);
      }
    };
    
    fetchProjectDetails();
  }, [projectId, navigate, toast]);

  const handleBackToProjects = () => {
    navigate("/projects");
  };

  // Display loading state
  if (loading) {
    return (
      <div className="container h-full flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading project details...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Display error state
  if (loadingError) {
    return (
      <div className="container h-full flex items-center justify-center py-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-destructive mb-4">{loadingError}</h2>
          <Button onClick={handleBackToProjects}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  // Display not found state
  if (!project) {
    return (
      <div className="container h-full flex items-center justify-center py-8">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Project not found</h2>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <Button onClick={handleBackToProjects}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2" 
            onClick={handleBackToProjects}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={project.status === "active" ? "default" : "secondary"}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
            <Badge variant="outline">{project.projectType}</Badge>
            {(project as any).isPrimary && <Badge variant="outline" className="bg-amber-100">Primary Project</Badge>}
          </div>
          <p className="text-muted-foreground mt-2">{project.description}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Issuer Documents</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.totalInvestors ?? stats?.investorCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Investors in this project
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Funding Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${project.fundingGoal?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Target raise amount
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Amount Raised</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${project.raisedAmount?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(((project.raisedAmount || 0) / (project.fundingGoal || 1)) * 100)}% of goal
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Key information about this project</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Project Type</dt>
                    <dd className="mt-1">{project.projectType || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="mt-1 capitalize">{project.status || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Estimated Yield</dt>
                    <dd className="mt-1">{project.estimatedYieldPercentage ? `${project.estimatedYieldPercentage}%` : "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Duration</dt>
                    <dd className="mt-1">{project.duration ? project.duration.replace(/_/g, ' ') : "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Start Date</dt>
                    <dd className="mt-1">{project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Token Symbol</dt>
                    <dd className="mt-1">{project.tokenSymbol || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Subscription Start</dt>
                    <dd className="mt-1">
                      {project.subscriptionStartDate ? new Date(project.subscriptionStartDate).toLocaleDateString() : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Subscription End</dt>
                    <dd className="mt-1">
                      {project.subscriptionEndDate ? new Date(project.subscriptionEndDate).toLocaleDateString() : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Transaction Start</dt>
                    <dd className="mt-1">
                      {project.transactionStartDate ? new Date(project.transactionStartDate).toLocaleDateString() : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Maturity Date</dt>
                    <dd className="mt-1">
                      {project.maturityDate ? new Date(project.maturityDate).toLocaleDateString() : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Currency</dt>
                    <dd className="mt-1">{project.currency || "USD"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Share Price</dt>
                    <dd className="mt-1">
                      {project.sharePrice 
                        ? `${getCurrencySymbol(project.currency || "USD")}${project.sharePrice}` 
                        : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Minimum Investment</dt>
                    <dd className="mt-1">
                      {project.minimumInvestment 
                        ? `${getCurrencySymbol(project.currency || "USD")}${project.minimumInvestment.toLocaleString()}` 
                        : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Authorized Shares</dt>
                    <dd className="mt-1">{project.authorizedShares?.toLocaleString() || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Legal Entity</dt>
                    <dd className="mt-1">{project.legalEntity || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Jurisdiction</dt>
                    <dd className="mt-1">{(project as any).jurisdiction || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Created Date</dt>
                    <dd className="mt-1">{new Date(project.createdAt || "").toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Total Notional</dt>
                    <dd className="mt-1">{project.totalNotional 
                      ? `${getCurrencySymbol(project.currency || "USD")}${project.totalNotional.toLocaleString()}` 
                      : "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Company Valuation</dt>
                    <dd className="mt-1">${project.companyValuation?.toLocaleString() || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Funding Goal</dt>
                    <dd className="mt-1">${project.fundingGoal?.toLocaleString() || 0}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Valuation & Metrics</CardTitle>
                <CardDescription>Financial overview of this project</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Company Valuation</dt>
                    <dd className="mt-1 text-xl font-bold">${project.companyValuation?.toLocaleString() || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Average Investment</dt>
                    <dd className="mt-1 text-xl font-bold">
                      $
                      {project.totalInvestors && project.raisedAmount 
                        ? Math.round(project.raisedAmount / project.totalInvestors).toLocaleString() 
                        : "N/A"}
                    </dd>
                  </div>
                  {project.projectType === "token" && (
                    <>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Token Price</dt>
                        <dd className="mt-1 text-xl font-bold">${project.tokenPrice || "N/A"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Total Token Supply</dt>
                        <dd className="mt-1 text-xl font-bold">{project.totalTokenSupply?.toLocaleString() || "N/A"}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          {project && projectId ? (
            <DocumentUploadManager projectId={projectId} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p>Unable to load documents. Project data is missing.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="investors">
          <Card>
            <CardHeader>
              <CardTitle>Investor Management</CardTitle>
              <CardDescription>View and manage investors for this project</CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <p className="text-muted-foreground text-center mb-4">
                The investors management feature is coming soon.
              </p>
              <div className="flex justify-center">
                <Button variant="outline" disabled>View Investors</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>Configure project settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <p className="text-muted-foreground text-center mb-4">
                The project settings feature is coming soon.
              </p>
              <div className="flex justify-center">
                <Button variant="outline" disabled>Edit Project</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Add the helper function somewhere in the component
const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$",
    CHF: "Fr",
    CNY: "¥",
    INR: "₹",
    // Add more as needed
  };
  return symbols[currencyCode] || currencyCode;
};

export default ProjectDetailsPage;