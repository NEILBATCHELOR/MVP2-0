import React, { useState, useEffect } from "react";
import { getProjects } from "@/services/project/projectService";
import { getInvestors } from "@/services/investor/investors";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  PieChart,
  LineChart,
  Download,
  FileText,
  Users,
  DollarSign,
  Calendar,
} from "lucide-react";

const ReportsDashboard = () => {
  const [reportData, setReportData] = useState({
    projectsByStatus: {
      active: 0,
      draft: 0,
      completed: 0,
      archived: 0,
    },
    investorMetrics: {
      totalInvestors: 0,
      averageInvestment: 0,
      kycCompletion: 0,
    },
    complianceMetrics: {
      approved: 0,
      pending: 0,
      failed: 0,
      approvedPercent: 0,
      pendingPercent: 0,
      failedPercent: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setIsLoading(true);

        // Fetch projects from Supabase
        const projects = await getProjects();

        // Fetch investors from Supabase
        const investors = await getInvestors();

        // Calculate project status distribution
        const active = projects.filter((p) => p.status === "active").length;
        const draft = projects.filter((p) => p.status === "draft").length;
        const completed = projects.filter(
          (p) => p.status === "completed",
        ).length;
        const archived = projects.filter((p) => p.status === "archived").length;

        // Calculate investor metrics
        const totalInvestors = investors.length;

        // Calculate total allocation from projects
        const totalAllocation = projects.reduce(
          (sum, project) => sum + (project.fundingGoal || 0),
          0,
        );

        // Calculate average investment
        const averageInvestment =
          totalInvestors > 0 ? totalAllocation / totalInvestors : 0;

        // Calculate KYC metrics
        const approved = investors.filter(
          (i) => i.kycStatus === "approved",
        ).length;
        const pending = investors.filter(
          (i) => i.kycStatus === "pending",
        ).length;
        const failed = investors.filter(
          (i) => i.kycStatus === "rejected" || !i.kycStatus,
        ).length;

        // Calculate percentages
        const approvedPercent =
          totalInvestors > 0
            ? Math.round((approved / totalInvestors) * 100)
            : 0;
        const pendingPercent =
          totalInvestors > 0 ? Math.round((pending / totalInvestors) * 100) : 0;
        const failedPercent =
          totalInvestors > 0 ? Math.round((failed / totalInvestors) * 100) : 0;

        setReportData({
          projectsByStatus: {
            active,
            draft,
            completed,
            archived,
          },
          investorMetrics: {
            totalInvestors,
            averageInvestment,
            kycCompletion: approvedPercent,
          },
          complianceMetrics: {
            approved,
            pending,
            failed,
            approvedPercent,
            pendingPercent,
            failedPercent,
          },
        });

        setError(null);
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError("Failed to load report data. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load report data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [toast]);
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Generate and view reports for your projects
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>Export Reports</span>
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
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="investors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Investors</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Financial</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Compliance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of projects by status
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <PieChart className="h-32 w-32 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Project status distribution chart
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Investment Trends</CardTitle>
                  <CardDescription>
                    Monthly investment amounts over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <LineChart className="h-32 w-32 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Investment trend line chart
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>
                  Your recently generated reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">
                            Q{i} Investment Summary
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Generated: {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investor Analytics</CardTitle>
                <CardDescription>
                  Detailed investor metrics and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Total Investors
                    </h3>
                    <p className="text-2xl font-bold">
                      {reportData.investorMetrics.totalInvestors}
                    </p>
                  </div>
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Avg. Investment
                    </h3>
                    <p className="text-2xl font-bold">
                      $
                      {reportData.investorMetrics.averageInvestment.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      KYC Completion
                    </h3>
                    <p className="text-2xl font-bold">
                      {reportData.investorMetrics.kycCompletion}%
                    </p>
                  </div>
                </div>

                <div className="h-[300px] flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <BarChart className="h-32 w-32 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Investor distribution by type
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>
                  Financial metrics and performance data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="h-[250px] flex items-center justify-center border rounded-lg">
                    <div className="flex flex-col items-center">
                      <LineChart className="h-24 w-24 text-muted-foreground mb-4" />
                      <p className="text-sm font-medium">
                        Monthly Investment Flow
                      </p>
                    </div>
                  </div>
                  <div className="h-[250px] flex items-center justify-center border rounded-lg">
                    <div className="flex flex-col items-center">
                      <PieChart className="h-24 w-24 text-muted-foreground mb-4" />
                      <p className="text-sm font-medium">
                        Allocation by Security Type
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Select Date Range</span>
                  </Button>
                  <Button className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span>Export Financial Data</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Reports</CardTitle>
                <CardDescription>
                  KYC/AML status and regulatory compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <h3 className="text-sm font-medium text-green-800 mb-1">
                      Approved
                    </h3>
                    <p className="text-2xl font-bold text-green-700">
                      {reportData.complianceMetrics.approved}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {reportData.complianceMetrics.approvedPercent}% of
                      investors
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <h3 className="text-sm font-medium text-yellow-800 mb-1">
                      Pending
                    </h3>
                    <p className="text-2xl font-bold text-yellow-700">
                      {reportData.complianceMetrics.pending}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      {reportData.complianceMetrics.pendingPercent}% of
                      investors
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <h3 className="text-sm font-medium text-red-800 mb-1">
                      Failed/Not Started
                    </h3>
                    <p className="text-2xl font-bold text-red-700">
                      {reportData.complianceMetrics.failed}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {reportData.complianceMetrics.failedPercent}% of investors
                    </p>
                  </div>
                </div>

                <div className="rounded-md border p-4 mb-6">
                  <h3 className="font-medium mb-2">Compliance Alerts</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center text-yellow-600">
                      <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                      <span>
                        5 investors have KYC verification expiring in the next
                        30 days
                      </span>
                    </li>
                    <li className="flex items-center text-red-600">
                      <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                      <span>3 investors have failed address verification</span>
                    </li>
                    <li className="flex items-center text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                      <span>All accreditation checks are up to date</span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Generate Compliance Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ReportsDashboard;
