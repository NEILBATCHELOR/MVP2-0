import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Star,
  Users,
  DollarSign,
  Calendar,
  Building,
  Globe,
  FileText,
  Info,
} from "lucide-react";
import { getProject, getProjectStatistics, deleteProject } from "@/services/project/projectService";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ProjectDialog from "./ProjectDialog";
import DocumentUploadManager from "../documents/DocumentUploadManager";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [project, setProject] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>({
    investorCount: 0,
    totalAllocation: 0,
  });
  const [documentCount, setDocumentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditing2, setIsEditing2] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  // Handle URL parameters for directly opening specific tabs
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['overview', 'documents', 'investors', 'financial'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  const fetchProjectDetails = async () => {
    setIsLoading(true);
    
    // Fetch project
    try {
      const projectData = await getProject(projectId!);
      if (!projectData) {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive",
        });
        navigate("/projects");
        setIsLoading(false);
        return;
      }
      
      setProject(projectData);

      // Fetch statistics - with better error handling
      try {
        const stats = await getProjectStatistics(projectId!);
        console.log("Project statistics loaded:", stats);
        setStatistics(stats);
      } catch (statError) {
        console.error("Error fetching project statistics:", statError);
        // Use default statistics on error
        setStatistics({ investorCount: 0, totalAllocation: 0 });
      }

      // Fetch document count
      try {
        const { count, error } = await supabase
          .from("issuer_detail_documents")
          .select("id", { count: "exact" })
          .eq("project_id", projectId);
        
        if (!error) {
          setDocumentCount(count || 0);
        } else {
          console.error("Error fetching document count:", error);
          setDocumentCount(0);
        }
      } catch (docError) {
        console.error("Error fetching document count:", docError);
        setDocumentCount(0);
      }

      // Successfully loaded all data
      setIsLoading(false);
    } catch (error) {
      console.error("Error in fetchProjectDetails:", error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleEditProject = async (formData: any) => {
    setIsEditing2(true);
    try {
      // Convert string values to appropriate types
      const processedData = {
        ...formData,
        targetRaise: formData.target_raise || "0",
        totalNotional: formData.total_notional || "0",
        projectType: formData.project_type,
        isPrimary: formData.is_primary,
      };

      // Call your updateProject API
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) throw new Error("Failed to update project");

      // Refresh project data
      await fetchProjectDetails();

      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
      setIsEditing2(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(projectId!);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      navigate("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "Not specified";
    const currencySymbol = getCurrencySymbol(project.currency || "USD");
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading project details...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg mb-4">Project not found</p>
        <Button onClick={() => navigate("/projects")}>Back to Projects</Button>
      </div>
    );
  }

  const renderStat = (icon: React.ReactNode, label: string, value: string | number | undefined) => (
    <div className="flex items-center gap-2 py-3 border-b">
      {icon}
      <span className="font-medium">{label}:</span>
      <span className="ml-auto">{value || "Not specified"}</span>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/projects")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.isPrimary && <Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={project.status === "active" ? "default" : "secondary"}>
                {project.status}
              </Badge>
              <Badge variant="outline">{project.projectType}</Badge>
              {project.isPrimary && <Badge variant="outline" className="bg-amber-50">Primary Project</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this project? This action cannot be undone
                  and will remove all associated data including documents and investor records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Project"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <p className="text-muted-foreground mb-6">{project.description}</p>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Basic information about this project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {renderStat(
                  <Info className="h-4 w-4 text-primary" />,
                  "Status",
                  project.status
                )}
                {renderStat(
                  <Info className="h-4 w-4 text-primary" />,
                  "Project Type",
                  project.projectType
                )}
                {project.tokenSymbol && renderStat(
                  <Info className="h-4 w-4 text-primary" />,
                  "Token Symbol",
                  project.tokenSymbol
                )}
                {renderStat(
                  <Calendar className="h-4 w-4 text-primary" />,
                  "Created",
                  formatDate(project.createdAt)
                )}
                {renderStat(
                  <Info className="h-4 w-4 text-primary" />,
                  "Primary Project",
                  project.isPrimary ? "Yes" : "No"
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metrics</CardTitle>
                <CardDescription>Key statistics for this project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {renderStat(
                  <Users className="h-4 w-4 text-primary" />,
                  "Total Investors",
                  statistics.investorCount
                )}
                {renderStat(
                  <DollarSign className="h-4 w-4 text-primary" />,
                  "Total Notional",
                  formatCurrency(project.totalNotional)
                )}
                {renderStat(
                  <DollarSign className="h-4 w-4 text-primary" />,
                  "Company Valuation",
                  formatCurrency(project.companyValuation)
                )}
                {renderStat(
                  <DollarSign className="h-4 w-4 text-primary" />,
                  "Target Raise",
                  formatCurrency(project.fundingGoal || project.targetRaise)
                )}
                {project.sharePrice && renderStat(
                  <DollarSign className="h-4 w-4 text-primary" />,
                  "Share Price",
                  formatCurrency(project.sharePrice)
                )}
                {renderStat(
                  <FileText className="h-4 w-4 text-primary" />,
                  "Documents",
                  documentCount
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Legal Details</CardTitle>
              <CardDescription>Legal information about this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderStat(
                <Building className="h-4 w-4 text-primary" />,
                "Legal Entity",
                project.legalEntity
              )}
              {renderStat(
                <Globe className="h-4 w-4 text-primary" />,
                "Jurisdiction",
                project.jurisdiction
              )}
              {renderStat(
                <Info className="h-4 w-4 text-primary" />,
                "Tax ID",
                project.taxId
              )}
              {renderStat(
                <Info className="h-4 w-4 text-primary" />,
                "Funding Round",
                project.fundingRound
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <DocumentUploadManager projectId={projectId!} />
        </TabsContent>

        <TabsContent value="investors">
          <Card>
            <CardHeader>
              <CardTitle>Investors</CardTitle>
              <CardDescription>Manage investors for this project</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This section is under development. Please check back later.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" disabled>Manage Investors</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Financial details for this project</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="basic">
                    <AccordionTrigger>Basic Financial Information</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 mt-2">
                        {renderStat(
                          <Info className="h-4 w-4 text-primary" />,
                          "Currency",
                          project.currency || "USD"
                        )}
                        {renderStat(
                          <DollarSign className="h-4 w-4 text-primary" />,
                          "Target Raise",
                          formatCurrency(project.fundingGoal || project.targetRaise)
                        )}
                        {renderStat(
                          <DollarSign className="h-4 w-4 text-primary" />,
                          "Raised Amount",
                          formatCurrency(project.raisedAmount)
                        )}
                        {renderStat(
                          <DollarSign className="h-4 w-4 text-primary" />,
                          "Minimum Investment",
                          formatCurrency(project.minimumInvestment)
                        )}
                        {renderStat(
                          <DollarSign className="h-4 w-4 text-primary" />,
                          "Share Price",
                          formatCurrency(project.sharePrice)
                        )}
                        {renderStat(
                          <Info className="h-4 w-4 text-primary" />,
                          "Authorized Shares",
                          project.authorizedShares?.toLocaleString()
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="valuation">
                    <AccordionTrigger>Valuation Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 mt-2">
                        {renderStat(
                          <DollarSign className="h-4 w-4 text-primary" />,
                          "Company Valuation",
                          formatCurrency(project.companyValuation)
                        )}
                        {renderStat(
                          <Info className="h-4 w-4 text-primary" />,
                          "Funding Round",
                          project.fundingRound
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="dates">
                    <AccordionTrigger>Key Dates</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 mt-2">
                        {renderStat(
                          <Calendar className="h-4 w-4 text-primary" />,
                          "Subscription Start",
                          formatDate(project.subscriptionStartDate)
                        )}
                        {renderStat(
                          <Calendar className="h-4 w-4 text-primary" />,
                          "Subscription End",
                          formatDate(project.subscriptionEndDate)
                        )}
                        {renderStat(
                          <Calendar className="h-4 w-4 text-primary" />,
                          "Transaction Start",
                          formatDate(project.transactionStartDate)
                        )}
                        {renderStat(
                          <Calendar className="h-4 w-4 text-primary" />,
                          "Maturity Date",
                          formatDate(project.maturityDate)
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit project dialog */}
      <ProjectDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        title="Edit Project"
        description="Update this project's details"
        defaultValues={{
          name: project.name,
          description: project.description,
          status: project.status,
          project_type: project.projectType,
          token_symbol: project.tokenSymbol,
          target_raise: project.fundingGoal || project.targetRaise,
          authorized_shares: project.authorizedShares,
          share_price: project.sharePrice,
          company_valuation: project.companyValuation,
          funding_round: project.fundingRound,
          legal_entity: project.legalEntity,
          jurisdiction: project.jurisdiction,
          tax_id: project.taxId,
          is_primary: project.isPrimary,
        }}
        onSubmit={handleEditProject}
        isProcessing={isEditing2}
      />
    </div>
  );
};

export default ProjectDetail;