import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  getCapTableInvestors,
  updateInvestorSubscription,
  removeInvestorFromCapTable,
  bulkUpdateInvestors,
  getCapTable,
  addInvestorToCapTable,
} from "@/services/captable/capTableService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Download,
  FileText,
  Users,
  PieChart,
  TrendingUp,
  BarChart,
} from "lucide-react";
import InvestorsTable from "./InvestorTable";
import CapTableSummary from "./CapTableSummary";
import BulkOperationsMenu from "./BulkOperationsMenu";
import InvestorDialog from "./InvestorDialog";
import { InvestorEntityType, KycStatus } from "@/types/core/centralModels";

interface Investor {
  id: string;
  name: string;
  email: string;
  company?: string;
  subscriptionAmount: number;
  tokenAllocation: number;
  status: "pending" | "confirmed" | "rejected";
  dateAdded: string;
  securityType: "equity" | "convertible_note" | "safe" | "token";
  investmentDate: string;
  conversionCap?: number;
  conversionDiscount?: number;
  interestRate?: number;
  maturityDate?: string;
  proRataRights?: boolean;
  votingRights?: boolean;
  kycStatus?: "approved" | "pending" | "failed" | "not_started";
  paymentStatus?: "paid" | "pending" | "failed";
  notes?: string;
  subscriptionId: string;
}

interface CapTableViewProps {
  projectId?: string;
  projectName?: string;
  projectSymbol?: string;
  projectType?: "equity" | "token" | "hybrid";
  authorizedShares?: number;
  sharePrice?: number;
  companyValuation?: number;
  fundingRound?: string;
  onBack?: () => void;
  investors?: Investor[];
}

const CapTableView = ({
  projectId = "1",
  projectName = "Token Issuance Project",
  projectSymbol = "TKN",
  projectType = "hybrid",
  authorizedShares = 10000000,
  sharePrice = 1.0,
  companyValuation = 10000000,
  fundingRound = "Seed",
  onBack = () => {},
  investors = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@example.com",
      company: "Acme Ventures",
      subscriptionAmount: 50000,
      tokenAllocation: 5000,
      status: "confirmed",
      dateAdded: "2023-05-15",
      securityType: "equity",
      investmentDate: "2023-05-15",
      votingRights: true,
      proRataRights: true,
      kycStatus: "approved",
      paymentStatus: "paid",
      notes: "Lead investor in seed round",
      subscriptionId: "",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      company: "SJ Capital",
      subscriptionAmount: 25000,
      tokenAllocation: 2500,
      status: "pending",
      dateAdded: "2023-05-18",
      securityType: "safe",
      investmentDate: "2023-05-18",
      conversionCap: 5000000,
      conversionDiscount: 20,
      kycStatus: "pending",
      paymentStatus: "pending",
      notes: "",
      subscriptionId: "",
    },
    {
      id: "3",
      name: "Michael Brown",
      email: "michael.b@example.com",
      company: "Brown Investments LLC",
      subscriptionAmount: 100000,
      tokenAllocation: 10000,
      status: "confirmed",
      dateAdded: "2023-05-10",
      securityType: "convertible_note",
      investmentDate: "2023-05-10",
      conversionCap: 8000000,
      conversionDiscount: 15,
      interestRate: 5,
      maturityDate: "2025-05-10",
      kycStatus: "approved",
      paymentStatus: "paid",
      notes: "Strategic investor with industry connections",
      subscriptionId: "",
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily.d@example.com",
      company: "Davis Family Office",
      subscriptionAmount: 75000,
      tokenAllocation: 7500,
      status: "rejected",
      dateAdded: "2023-05-12",
      securityType: "equity",
      investmentDate: "2023-05-12",
      votingRights: false,
      proRataRights: false,
      kycStatus: "failed",
      paymentStatus: "failed",
      notes: "KYC verification failed",
      subscriptionId: "",
    },
    {
      id: "5",
      name: "Robert Wilson",
      email: "robert.w@example.com",
      company: "Wilson Tech Ventures",
      subscriptionAmount: 30000,
      tokenAllocation: 3000,
      status: "pending",
      dateAdded: "2023-05-20",
      securityType: "token",
      investmentDate: "2023-05-20",
      kycStatus: "not_started",
      paymentStatus: "pending",
      notes: "Interested in token allocation only",
      subscriptionId: "",
    },
  ],
}: CapTableViewProps) => {
  const [activeTab, setActiveTab] = useState("investors");
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([]);
  const [isAddInvestorDialogOpen, setIsAddInvestorDialogOpen] = useState(false);
  const [investorToEdit, setInvestorToEdit] = useState<Investor | null>(null);
  const [capTableInvestors, setCapTableInvestors] =
    useState<Investor[]>(investors);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate summary statistics
  const totalAllocation = authorizedShares * sharePrice; // Calculate based on authorized shares and price
  const allocatedAmount = capTableInvestors.reduce(
    (sum, investor) => sum + investor.subscriptionAmount,
    0,
  );
  const remainingAmount = totalAllocation - allocatedAmount;
  const investorCount = capTableInvestors.length;
  const averageAllocation =
    investorCount > 0 ? allocatedAmount / investorCount : 0;
  const allocationPercentage = Math.round(
    (allocatedAmount / totalAllocation) * 100,
  );

  // Calculate shares statistics
  const issuedShares = Math.round(allocatedAmount / sharePrice);
  const remainingShares = authorizedShares - issuedShares;

  // Calculate security type distribution
  const securityTypeCounts: { [key: string]: number } = {};
  capTableInvestors.forEach((investor) => {
    securityTypeCounts[investor.securityType] =
      (securityTypeCounts[investor.securityType] || 0) + 1;
  });

  const securityTypes: { [key: string]: number } = {};
  Object.entries(securityTypeCounts).forEach(([type, count]) => {
    securityTypes[type] = Math.round((count / investorCount) * 100);
  });

  const { toast } = useToast();

  // Fetch cap table data when component mounts or projectId changes
  useEffect(() => {
    const fetchCapTableData = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Get the cap table for this project
        const capTable = await getCapTable(projectId);
        if (!capTable) {
          throw new Error(`Cap table not found for project ${projectId}`);
        }

        // Get all investors with their subscriptions
        const investorsData = await getCapTableInvestors(projectId);

        // Transform the data to match the UI format
        const transformedInvestors = investorsData.map((inv) => ({
          id: inv.investor_id,
          name: inv.name,
          email: inv.email,
          company: inv.company,
          subscriptionAmount: inv.subscriptionAmount,
          tokenAllocation: inv.tokenAllocation,
          status: inv.status as "pending" | "confirmed" | "rejected",
          dateAdded: inv.investmentDate,
          securityType: inv.securityType as
            | "equity"
            | "convertible_note"
            | "safe"
            | "token",
          investmentDate: inv.investmentDate,
          kycStatus: inv.kycStatus as
            | "approved"
            | "pending"
            | "failed"
            | "not_started",
          paymentStatus: inv.paymentStatus as "paid" | "pending" | "failed",
          notes: inv.notes,
          subscriptionId: inv.subscriptionId,
        }));

        setCapTableInvestors(
          transformedInvestors.length > 0 ? transformedInvestors : investors,
        );
      } catch (err) {
        console.error("Error fetching cap table data:", err);
        setError("Failed to load cap table data. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load cap table data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCapTableData();
  }, [projectId, toast]);

  const handleAddInvestor = () => {
    setInvestorToEdit(null);
    setIsAddInvestorDialogOpen(true);
  };

  const handleEditInvestor = (investor: Investor) => {
    setInvestorToEdit(investor);
    setIsAddInvestorDialogOpen(true);
  };

  const handleDeleteInvestor = async (investorId: string) => {
    try {
      setIsLoading(true);

      // Get the cap table for this project
      const capTable = await getCapTable(projectId);
      if (!capTable) {
        throw new Error(`Cap table not found for project ${projectId}`);
      }

      // Find the investor to get their subscription ID
      const investor = capTableInvestors.find((inv) => inv.id === investorId);
      if (investor?.subscriptionId) {
        // First delete the subscription
        const { deleteSubscription } = await import("@/services/investor/investors");
        await deleteSubscription(investor.subscriptionId);
      }

      // Remove the investor from the cap table
      await removeInvestorFromCapTable(capTable.id, investorId);

      // Update the UI
      setCapTableInvestors((prev) =>
        prev.filter((inv) => inv.id !== investorId),
      );

      toast({
        title: "Success",
        description: "Investor removed successfully",
      });
    } catch (err) {
      console.error("Error deleting investor:", err);
      toast({
        title: "Error",
        description: "Failed to remove investor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = (action: string, selectedIds: string[]) => {
    setSelectedInvestors(selectedIds);
  };

  const handleInvestorSubmit = async (data: any) => {
    try {
      setIsLoading(true);

      if (investorToEdit) {
        // Update existing investor
        const subscriptionId =
          investorToEdit.subscriptionId || data.subscriptionId;
        if (!subscriptionId) {
          throw new Error("Subscription ID is required for updates");
        }

        // Call the updateInvestorSubscription function
        await updateInvestorSubscription(subscriptionId, {
          fiat_amount: parseFloat(data.subscriptionAmount),
          confirmed: data.status === "confirmed",
          allocated: data.status === "confirmed" || data.status === "allocated",
          distributed: data.status === "distributed",
          notes: data.notes,
          token_amount: parseFloat(
            data.tokenAllocation || data.subscriptionAmount / 10,
          ),
          token_type: data.securityType,
        });

        // Update the UI
        setCapTableInvestors((prev) =>
          prev.map((inv) =>
            inv.id === investorToEdit.id
              ? {
                  ...inv,
                  name: data.name,
                  email: data.email,
                  company: data.company,
                  subscriptionAmount: parseFloat(data.subscriptionAmount),
                  tokenAllocation: parseFloat(
                    data.tokenAllocation || data.subscriptionAmount / 10,
                  ),
                  status: data.status,
                  securityType: data.securityType,
                  notes: data.notes,
                }
              : inv,
          ),
        );

        toast({
          title: "Success",
          description: "Investor updated successfully",
        });
      } else {
        // Add new investor to cap table
        const result = await addInvestorToCapTable(projectId, data);

        // Add to the UI
        const newInvestor: Investor = {
          id: data.investor_id,
          name: data.name || "New Investor",
          email: data.email || "",
          company: data.company || "",
          subscriptionAmount: parseFloat(data.fiat_amount),
          tokenAllocation: parseFloat(data.token_amount),
          status: data.confirmed ? "confirmed" : "pending",
          dateAdded: new Date().toISOString().split("T")[0],
          securityType: data.token_type as "equity" | "convertible_note" | "safe" | "token",
          investmentDate: data.subscription_date,
          kycStatus: "pending" as "approved" | "pending" | "failed" | "not_started",
          paymentStatus: data.confirmed ? "paid" as "paid" : "pending" as "pending",
          notes: data.notes || "",
          subscriptionId: result.subscription.id,
        };

        setCapTableInvestors((prev) => [...prev, newInvestor]);

        toast({
          title: "Success",
          description: "Investor added successfully",
        });
      }
    } catch (err) {
      console.error("Error submitting investor data:", err);
      toast({
        title: "Error",
        description: "Failed to save investor data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsAddInvestorDialogOpen(false);
      setInvestorToEdit(null);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedInvestors.length === 0) return;

    try {
      setIsLoading(true);

      // Get the subscription IDs for the selected investors
      const selectedInvestorData = capTableInvestors.filter((inv) =>
        selectedInvestors.includes(inv.id),
      );

      // For each investor, update their status
      for (const investor of selectedInvestorData) {
        if (investor.subscriptionId) {
          await updateInvestorSubscription(investor.subscriptionId, {
            confirmed: status === "confirmed",
            allocated: status === "confirmed" || status === "allocated",
            distributed: status === "distributed",
          });
        }
      }

      // Update the UI
      setCapTableInvestors((prev) =>
        prev.map((inv) =>
          selectedInvestors.includes(inv.id)
            ? { ...inv, status: status as "pending" | "confirmed" | "rejected" }
            : inv,
        ),
      );

      toast({
        title: "Success",
        description: `Status updated to ${status} for ${selectedInvestors.length} investor(s)`,
      });

      // Clear selection
      setSelectedInvestors([]);
    } catch (err) {
      console.error("Error updating investor status:", err);
      toast({
        title: "Error",
        description: "Failed to update investor status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvestors.length === 0) return;

    try {
      setIsLoading(true);

      // Get the cap table for this project
      const capTable = await getCapTable(projectId);
      if (!capTable) {
        throw new Error(`Cap table not found for project ${projectId}`);
      }

      // Get the selected investor data
      const selectedInvestorData = capTableInvestors.filter((inv) =>
        selectedInvestors.includes(inv.id),
      );

      // Delete each selected investor
      for (const investor of selectedInvestorData) {
        // First delete the subscription if it exists
        if (investor.subscriptionId) {
          const { deleteSubscription } = await import("@/services/investor/investors");
          await deleteSubscription(investor.subscriptionId);
        }

        // Then remove from cap table
        await removeInvestorFromCapTable(capTable.id, investor.id);
      }

      // Update the UI
      setCapTableInvestors((prev) =>
        prev.filter((inv) => !selectedInvestors.includes(inv.id)),
      );

      toast({
        title: "Success",
        description: `${selectedInvestors.length} investor(s) removed successfully`,
      });

      // Clear selection
      setSelectedInvestors([]);
    } catch (err) {
      console.error("Error deleting investors:", err);
      toast({
        title: "Error",
        description: "Failed to remove investors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-6 space-y-6">
      {/* Header with back button and project info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="h-9 w-9"
            title="Back to Projects"
            aria-label="Back to Projects"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{projectName}</h1>
            <div className="flex gap-2 items-center">
              <p className="text-sm text-muted-foreground">
                Project ID: {projectId} | Symbol: {projectSymbol} | Type:{" "}
                {projectType} | Round: {fundingRound}
              </p>
              <div className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                Valuation: ${(companyValuation / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Export Cap Table</span>
          </Button>
          <Button
            onClick={handleAddInvestor}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            <span>Add Investor</span>
          </Button>
        </div>
      </div>

      {/* Cap Table Summary */}
      <CapTableSummary
        totalAllocation={totalAllocation}
        allocatedAmount={allocatedAmount}
        remainingAmount={remainingAmount}
        investorCount={investorCount}
        averageAllocation={averageAllocation}
        allocationPercentage={allocationPercentage}
        authorizedShares={authorizedShares}
        issuedShares={issuedShares}
        remainingShares={remainingShares}
        sharePrice={sharePrice}
        projectType={projectType}
        securityTypes={securityTypes}
      />

      {/* Tabs for different views */}
      <Tabs
        defaultValue="investors"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="investors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Investors</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="waterfall" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span>Waterfall</span>
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Scenarios</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span>Reports</span>
            </TabsTrigger>
          </TabsList>

          {/* Bulk operations menu - only show when on investors tab */}
          {activeTab === "investors" && selectedInvestors.length > 0 && (
            <BulkOperationsMenu
              selectedCount={selectedInvestors.length}
              onUpdateStatus={handleBulkStatusUpdate}
              onDelete={handleBulkDelete}
              onTag={() => console.log("Tag investors")}
            />
          )}
        </div>

        <TabsContent value="investors" className="mt-0">
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
            <InvestorsTable
              investors={capTableInvestors}
              onEdit={handleEditInvestor}
              onDelete={handleDeleteInvestor}
              onBulkAction={handleBulkAction}
              onAddInvestor={handleAddInvestor}
            />
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Documents Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2">
                  Upload project documents such as term sheets, subscription
                  agreements, and other legal documents.
                </p>
                <Button className="mt-4">
                  <FileText className="mr-2 h-4 w-4" /> Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waterfall" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Waterfall Model</CardTitle>
              <CardDescription>
                Visualize the distribution of proceeds in different exit
                scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PieChart className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Waterfall Modeling</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2">
                  This feature will allow you to model how proceeds would be
                  distributed in various exit scenarios based on the preferences
                  and rights of different security types in your cap table.
                </p>
                <Button className="mt-4">
                  <PieChart className="mr-2 h-4 w-4" /> Create Waterfall Model
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Planning</CardTitle>
              <CardDescription>
                Model different investment rounds and their impact on the cap
                table
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Scenario Planning</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2">
                  This feature will allow you to model how future investment
                  rounds would affect ownership percentages, dilution, and
                  valuation based on different terms and conditions.
                </p>
                <Button className="mt-4">
                  <TrendingUp className="mr-2 h-4 w-4" /> Create New Scenario
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Cap Table Reports</CardTitle>
              <CardDescription>
                Generate comprehensive reports for your cap table
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Ownership Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Breakdown of ownership by investor type, security type,
                      and individual stakeholders.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Dilution Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Analysis of ownership dilution across funding rounds and
                      investment scenarios.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      Investment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Summary of all investments, including amounts, dates, and
                      security types.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      Convertible Securities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Analysis of convertible notes and SAFEs, including
                      conversion scenarios.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Compliance Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Overview of KYC/AML compliance status for all investors.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Custom Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Create a custom report with the specific metrics and data
                      you need.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      Create Custom Report
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end mt-6">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Export All Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Investor Dialog */}
      <InvestorDialog
        open={isAddInvestorDialogOpen}
        onOpenChange={setIsAddInvestorDialogOpen}
        investor={
          investorToEdit
            ? {
                id: investorToEdit.id,
                name: investorToEdit.name,
                email: investorToEdit.email,
                company: investorToEdit.company || "",
                type: InvestorEntityType.INDIVIDUAL,
                kycStatus: 
                  investorToEdit.kycStatus === "approved" ? KycStatus.APPROVED :
                  investorToEdit.kycStatus === "failed" ? KycStatus.FAILED : KycStatus.PENDING,
                createdAt: investorToEdit.dateAdded,
                updatedAt: investorToEdit.dateAdded,
                userId: undefined,
                walletAddress: undefined,
                riskScore: undefined,
                riskFactors: undefined
              }
            : undefined
        }
        onSubmit={handleInvestorSubmit}
        mode={investorToEdit ? "edit" : "add"}
      />
    </div>
  );
};

export default CapTableView;
