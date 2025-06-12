import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import CapTableReportExport from "./CapTableReportExport";
import { supabase } from "@/infrastructure/database/client";
import {
  BarChart,
  PieChart,
  Users,
  Calendar,
  TrendingUp,
  Download,
  FileText,
  Layers,
  Filter,
} from "lucide-react";

interface Investor {
  id: string;
  name: string;
  securityType: string;
  subscriptionAmount: number;
  tokenAllocation: number;
  status: string;
  dateAdded: string;
}

interface CapTableReportsProps {
  projectId: string;
  projectName?: string;
  projectType?: string;
  authorizedShares?: number;
  sharePrice?: number;
  companyValuation?: number;
  investors?: Investor[];
}

const CapTableReports = ({
  projectId,
  projectName = "Project Name",
  projectType = "equity",
  authorizedShares = 10000000,
  sharePrice = 0.5,
  companyValuation = 5000000,
  investors = [],
}: CapTableReportsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportReportType, setExportReportType] = useState("ownership");
  const [projectData, setProjectData] = useState(null);
  const [isLoadingProjectData, setIsLoadingProjectData] = useState(false);
  const { toast } = useToast();

  // Fetch project data when needed for reports
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!isExportDialogOpen) return;

      try {
        setIsLoadingProjectData(true);

        // In a real implementation, this would fetch the project data from Supabase
        // For now, we'll use mock data
        const mockProjectData = {
          id: "project-123",
          name: "Token Issuance Project",
          description: "A sample token issuance project",
          status: "active",
          projectType: projectType,
          authorizedShares: authorizedShares,
          sharePrice: sharePrice,
          companyValuation: companyValuation,
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-06-01T00:00:00Z",
        };

        setProjectData(mockProjectData);
      } catch (error) {
        console.error("Error fetching project data:", error);
        toast({
          title: "Error",
          description: "Failed to load project data for report.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProjectData(false);
      }
    };

    fetchProjectData();
  }, [
    isExportDialogOpen,
    projectType,
    authorizedShares,
    sharePrice,
    companyValuation,
    toast,
  ]);

  // Handle export dialog
  const handleExportClick = (reportType: string) => {
    setExportReportType(reportType);
    setIsExportDialogOpen(true);
  };

  // Calculate statistics for reports
  const totalInvestment = investors.reduce(
    (sum, investor) => sum + investor.subscriptionAmount,
    0,
  );

  const totalAllocation = investors.reduce(
    (sum, investor) => sum + investor.tokenAllocation,
    0,
  );

  const securityTypes = investors.reduce(
    (acc, investor) => {
      acc[investor.securityType] = (acc[investor.securityType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const investmentByMonth = investors.reduce(
    (acc, investor) => {
      if (investor.dateAdded) {
        const month = investor.dateAdded.substring(0, 7); // YYYY-MM format
        acc[month] = (acc[month] || 0) + investor.subscriptionAmount;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="w-full h-full bg-gray-50 p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{projectName} Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate and view reports for your cap table
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleExportClick("ownership")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              <span>Ownership Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View ownership percentages across all investors
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleExportClick("investors")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Investor Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analyze investor demographics and investment patterns
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleExportClick("securities")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span>Securities Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View distribution of different security types
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleExportClick("timeline")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Investment Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track investments over time with historical analysis
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="investors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Investors</span>
          </TabsTrigger>
          <TabsTrigger value="securities" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Securities</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Timeline</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Cap Table Overview</CardTitle>
                  <CardDescription>
                    Summary of key metrics and statistics
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => handleExportClick("analytics")}
                >
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Investment Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Investors
                      </span>
                      <span className="font-medium">{investors.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Investment
                      </span>
                      <span className="font-medium">
                        ${totalInvestment.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Average Investment
                      </span>
                      <span className="font-medium">
                        $
                        {investors.length > 0
                          ? (totalInvestment / investors.length).toLocaleString(
                              undefined,
                              {
                                maximumFractionDigits: 2,
                              },
                            )
                          : "0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Company Valuation
                      </span>
                      <span className="font-medium">
                        ${companyValuation.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Security Types</h3>
                  <div className="space-y-2">
                    {Object.entries(securityTypes).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {type.replace("_", " ")}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Status Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confirmed</span>
                      <span className="font-medium">
                        {
                          investors.filter((i) => i.status === "confirmed")
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-medium">
                        {investors.filter((i) => i.status === "pending").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rejected</span>
                      <span className="font-medium">
                        {
                          investors.filter((i) => i.status === "rejected")
                            .length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">
                  Investment Timeline
                </h3>
                <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-md">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      In a complete implementation, this would display a chart
                      showing investment trends over time.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investors" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Investor Analysis</CardTitle>
                  <CardDescription>
                    Detailed analysis of investor data
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => handleExportClick("investors")}
                >
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-md">
                <div className="text-center">
                  <PieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Investor Distribution</h3>
                  <p className="text-sm text-muted-foreground max-w-md mt-2">
                    In a complete implementation, this would display charts and
                    tables showing investor distribution by type, size, and
                    other metrics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="securities" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Securities Breakdown</CardTitle>
                  <CardDescription>
                    Analysis of different security types
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => handleExportClick("securities")}
                >
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-md">
                <div className="text-center">
                  <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    Securities Distribution
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mt-2">
                    In a complete implementation, this would display charts and
                    tables showing the distribution of different security types
                    and their terms.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Investment Timeline</CardTitle>
                  <CardDescription>
                    Historical analysis of investments over time
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => handleExportClick("timeline")}
                >
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-md">
                <div className="text-center">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Investment Timeline</h3>
                  <p className="text-sm text-muted-foreground max-w-md mt-2">
                    In a complete implementation, this would display charts and
                    tables showing investment trends over time, including
                    monthly and quarterly breakdowns.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <CapTableReportExport
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        reportType={exportReportType}
        projectId={projectId}
        investors={investors}
        projectData={projectData}
      />
    </div>
  );
};

export default CapTableReports;
