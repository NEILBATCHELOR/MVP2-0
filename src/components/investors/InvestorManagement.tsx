import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/infrastructure/database/client";
import { getAllInvestorTypes, getInvestorTypeName } from "@/utils/compliance/investorTypes";
import InvestorUpload from "./InvestorUpload";
import InvestorsList from "./InvestorsList";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Users,
  FileText,
  CheckSquare,
  XSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InvestorManagementProps {
  projectId?: string;
}

const InvestorManagement = ({ projectId }: InvestorManagementProps) => {
  const [activeTab, setActiveTab] = useState("list");
  const [investors, setInvestors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [kycStatusFilter, setKycStatusFilter] = useState<string | null>(null);
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([]);
  const [isGeneratingCapTable, setIsGeneratingCapTable] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch investors
  useEffect(() => {
    fetchInvestors();

    // Set up realtime subscription
    const investorsSubscription = supabase
      .channel("investors-management-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "investors" },
        () => {
          fetchInvestors();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(investorsSubscription);
    };
  }, []);

  const fetchInvestors = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("investors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check for expired KYC (older than 6 months)
      const investorsWithKycStatus = data?.map((investor) => {
        let kycStatus = investor.kyc_status;

        // If KYC is approved, check if it's expired
        if (kycStatus === "approved" && investor.kyc_expiry_date) {
          const expiryDate = new Date(investor.kyc_expiry_date);
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

          if (expiryDate < sixMonthsAgo) {
            kycStatus = "expired";
          }
        }

        return {
          ...investor,
          kycStatus,
        };
      });

      setInvestors(investorsWithKycStatus || []);
    } catch (err) {
      console.error("Error fetching investors:", err);
      toast({
        title: "Error",
        description: "Failed to load investors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter investors based on search and filters
  const filteredInvestors = investors.filter((investor) => {
    const matchesSearch =
      investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (investor.company &&
        investor.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (investor.wallet_address &&
        investor.wallet_address
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter ? investor.type === typeFilter : true;
    const matchesKycStatus = kycStatusFilter
      ? investor.kycStatus === kycStatusFilter
      : true;

    return matchesSearch && matchesType && matchesKycStatus;
  });

  // Handle investor selection
  const handleSelectInvestor = (investorId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedInvestors((prev) => [...prev, investorId]);
    } else {
      setSelectedInvestors((prev) => prev.filter((id) => id !== investorId));
    }
  };

  // Handle select all
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedInvestors(
        filteredInvestors.map((investor) => investor.investor_id),
      );
    } else {
      setSelectedInvestors([]);
    }
  };

  // Handle upload complete
  const handleUploadComplete = (uploadedInvestors: any[]) => {
    fetchInvestors(); // Refresh the list
    setActiveTab("list"); // Switch to list view
    toast({
      title: "Upload Complete",
      description: `${uploadedInvestors.length} investors processed successfully`,
    });
  };

  // Handle generate cap table
  const handleGenerateCapTable = async () => {
    if (selectedInvestors.length === 0) {
      toast({
        title: "No investors selected",
        description: "Please select at least one investor",
        variant: "destructive",
      });
      return;
    }

    if (!projectId) {
      toast({
        title: "No project selected",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingCapTable(true);

      // Get the cap table for this project
      const { data: capTable, error: capTableError } = await supabase
        .from("cap_tables")
        .select("id")
        .eq("project_id", projectId)
        .single();

      if (capTableError) throw capTableError;

      // Add investors to cap table
      const now = new Date().toISOString();
      const capTableInvestors = selectedInvestors.map((investorId) => ({
        cap_table_id: capTable.id,
        investor_id: investorId,
        created_at: now,
      }));

      const { error: insertError } = await supabase
        .from("cap_table_investors")
        .upsert(capTableInvestors);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `${selectedInvestors.length} investors added to cap table`,
      });

      // Clear selection
      setSelectedInvestors([]);
      setIsConfirmDialogOpen(false);
    } catch (err) {
      console.error("Error generating cap table:", err);
      toast({
        title: "Error",
        description: "Failed to generate cap table. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCapTable(false);
    }
  };

  // Handle rescreen investors
  const handleRescreenInvestors = async () => {
    if (selectedInvestors.length === 0) {
      toast({
        title: "No investors selected",
        description: "Please select at least one investor",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update KYC status to pending for selected investors
      const { error } = await supabase
        .from("investors")
        .update({
          kyc_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .in("investor_id", selectedInvestors);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedInvestors.length} investors marked for rescreening`,
      });

      // Refresh the list
      fetchInvestors();

      // Clear selection
      setSelectedInvestors([]);
    } catch (err) {
      console.error("Error rescreening investors:", err);
      toast({
        title: "Error",
        description: "Failed to update KYC status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter(null);
    setKycStatusFilter(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Investor Management</h1>
          <p className="text-muted-foreground">
            Upload, manage, and verify investors for your projects
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchInvestors}
            disabled={isLoading}
            title="Refresh investors"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setActiveTab("upload")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Investors</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Investors List</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Upload Investors</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <InvestorsList />
        </TabsContent>

        <TabsContent value="upload" className="mt-0">
          <InvestorUpload onUploadComplete={handleUploadComplete} />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Cap Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to add {selectedInvestors.length} selected
              investor(s) to the cap table? This will make them available for
              token allocation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGenerateCapTable}
              disabled={isGeneratingCapTable}
            >
              {isGeneratingCapTable ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvestorManagement;
