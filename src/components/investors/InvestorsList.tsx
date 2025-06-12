import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  ExternalLink,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  RefreshCw,
  Eye,
  Coins,
  FileText,
  CheckSquare,
  XSquare,
  CheckCircle,
  Users,
  User,
  Upload,
  UserCheck,
  Columns2,
  SlidersHorizontal,
  X,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/infrastructure/database/client";
import { getAllInvestorTypes, getInvestorTypeName } from "@/utils/compliance/investorTypes";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InvestorDialog from "./InvestorDialog";
import BulkInvestorUpload from "./BulkInvestorUpload";
import ProjectSelectionDialog from "./ProjectSelectionDialog";
import BatchScreeningDialog from "./BatchScreeningDialog";
import ManageGroupsDialog from "./ManageGroupsDialog";
import KycStatusBadge from "./KycStatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InvestorsListProps {
  projectId?: string;
}

const InvestorsList: React.FC<InvestorsListProps> = ({ projectId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [investors, setInvestors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInvestorDetailsOpen, setIsInvestorDetailsOpen] = useState(false);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [isScreeningDialogOpen, setIsScreeningDialogOpen] = useState(false);
  const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false);
  const [currentInvestor, setCurrentInvestor] = useState<any>(null);
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [kycStatusFilter, setKycStatusFilter] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [investorSubscriptions, setInvestorSubscriptions] = useState<any[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name", "email", "company", "type", "kycStatus", "wallet_address"
  ]);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [investorGroups, setInvestorGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isViewGroupOpen, setIsViewGroupOpen] = useState(false);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 100;

  // Available columns for the table
  const availableColumns = [
    { id: "name", label: "Name" },
    { id: "email", label: "Email" },
    { id: "company", label: "Company" },
    { id: "type", label: "Type" },
    { id: "kycStatus", label: "KYC Status" },
    { id: "wallet_address", label: "Wallet Address" },
    { id: "createdAt", label: "Created At" },
    { id: "updatedAt", label: "Updated At" }
  ];

  // Fetch investors from Supabase
  useEffect(() => {
    console.log("InvestorsList component mounted, fetching investors");
    fetchInvestors();

    // Set up realtime subscription
    const investorsSubscription = supabase
      .channel("investors-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "investors" },
        (payload) => {
          console.log("Realtime update received:", payload);
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
      console.log("Fetching investors from Supabase");
      const { data, error } = await supabase
        .from("investors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching investors:", error);
        throw error;
      }

      console.log("Fetched investors data:", data);

      // Transform data to match UI format
      const transformedInvestors = data?.map((investor) => ({
        id: investor.investor_id,
        name: investor.name,
        email: investor.email,
        company: investor.company || "",
        type: investor.type || "individual",
        kycStatus: investor.kyc_status || "not_started",
        wallet_address: investor.wallet_address || "",
        totalInvestment: 0, // Will be calculated from subscriptions
        projects: 0, // Will be calculated from cap_table_investors
        createdAt: investor.created_at,
        updatedAt: investor.updated_at
      }));

      setInvestors(transformedInvestors || []);
      setError(null);
      
      // Fetch investor groups after investors are loaded
      fetchInvestorGroups();
    } catch (err) {
      console.error("Error fetching investors:", err);
      setError("Failed to load investors. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load investors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch investor groups
  const fetchInvestorGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("investor_groups")
        .select("id, name, member_count, created_at, updated_at")
        .order("name");

      if (error) throw error;

      setInvestorGroups(data || []);
    } catch (err) {
      console.error("Error fetching investor groups:", err);
      toast({
        title: "Error",
        description: "Failed to load investor groups.",
        variant: "destructive",
      });
    }
  };

  // Fetch investor subscriptions when viewing details
  const fetchInvestorSubscriptions = async (investorId: string) => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          `
          id,
          subscription_id,
          project_id,
          fiat_amount,
          currency,
          subscription_date,
          confirmed,
          projects(name)
        `,
        )
        .eq("investor_id", investorId);

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error("Error fetching investor subscriptions:", err);
      toast({
        title: "Error",
        description: "Failed to load investor subscriptions.",
        variant: "destructive",
      });
      return [];
    }
  };

  // Load investor details
  const handleViewInvestorDetails = async (investor: any) => {
    setCurrentInvestor(investor);
    setInvestorSubscriptions([]);
    setIsInvestorDetailsOpen(true);

    const subscriptions = await fetchInvestorSubscriptions(investor.id);
    setInvestorSubscriptions(subscriptions);
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handle column filter change
  const handleColumnFilterChange = (column: string, value: string) => {
    setColumnFilters((prev) => {
      if (!value) {
        const newFilters = { ...prev };
        delete newFilters[column];
        return newFilters;
      }
      return { ...prev, [column]: value };
    });
  };

  // Filter investors based on search query and filters
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

    const matchesTypeFilter = typeFilter ? investor.type === typeFilter : true;
    const matchesKycStatusFilter = kycStatusFilter
      ? investor.kycStatus === kycStatusFilter
      : true;

    // Apply column filters
    const matchesColumnFilters = Object.entries(columnFilters).every(
      ([column, filterValue]) => {
        if (!filterValue) return true;

        const value = String(investor[column] || "").toLowerCase();
        return value.includes(filterValue.toLowerCase());
      },
    );

    return (
      matchesSearch &&
      matchesTypeFilter &&
      matchesKycStatusFilter &&
      matchesColumnFilters
    );
  });

  // Sort the filtered investors
  const sortedInvestors = [...filteredInvestors].sort((a, b) => {
    let valueA = a[sortColumn];
    let valueB = b[sortColumn];

    // Handle special cases for sorting
    if (sortColumn === "totalInvestment" || sortColumn === "projects") {
      valueA = Number(valueA) || 0;
      valueB = Number(valueB) || 0;
    } else {
      valueA = String(valueA || "").toLowerCase();
      valueB = String(valueB || "").toLowerCase();
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedInvestors.length / ITEMS_PER_PAGE);
  const paginatedInvestors = sortedInvestors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Handle select all checkbox - simplified to avoid circular dependencies
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedInvestors(paginatedInvestors.map((investor) => investor.id));
    } else {
      setSelectedInvestors([]);
    }
  };

  // Handle investor selection
  const handleSelectInvestor = (investorId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedInvestors((prev) => [...prev, investorId]);
    } else {
      setSelectedInvestors((prev) => prev.filter((id) => id !== investorId));
    }
  };

  // Handle edit investor
  const handleEditInvestor = (investor: any) => {
    try {
      // Transform the investor object to match the expected structure in InvestorDialog
      const formattedInvestor = {
        investor_id: investor.id,
        name: investor.name || "",
        email: investor.email || "",
        company: investor.company || "",
        type: investor.type || "hnwi",
        kyc_status: investor.kycStatus || "not_started",
        wallet_address: investor.wallet_address || "",
        notes: "",
      };
      console.log("Formatted investor for edit:", formattedInvestor);
      setCurrentInvestor(formattedInvestor);
      // Use setTimeout to ensure state is updated before opening dialog
      setTimeout(() => {
        setIsEditDialogOpen(true);
      }, 0);
    } catch (error) {
      console.error("Error in handleEditInvestor:", error);
      toast({
        title: "Error",
        description: "Failed to edit investor. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle delete investor
  const handleDeleteInvestor = (investor: any) => {
    // For delete, we need the original investor object format
    setCurrentInvestor(investor);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete investor
  const confirmDeleteInvestor = async () => {
    if (!currentInvestor) return;

    try {
      setIsProcessing(true);
      console.log(
        "Deleting investor with ID:",
        currentInvestor.investor_id || currentInvestor.id,
      );
      const { error } = await supabase
        .from("investors")
        .delete()
        .eq("investor_id", currentInvestor.investor_id || currentInvestor.id);

      if (error) throw error;

      setInvestors((prev) =>
        prev.filter(
          (inv) =>
            inv.id !== (currentInvestor.investor_id || currentInvestor.id),
        ),
      );
      setSelectedInvestors((prev) =>
        prev.filter(
          (id) => id !== (currentInvestor.investor_id || currentInvestor.id),
        ),
      );

      toast({
        title: "Success",
        description: "Investor deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setCurrentInvestor(null);
    } catch (err: any) {
      console.error("Error deleting investor:", err);
      toast({
        title: "Error",
        description:
          err.message || "Failed to delete investor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedInvestors.length === 0) return;

    try {
      setIsProcessing(true);

      // Delete each selected investor
      console.log("Bulk deleting investors with IDs:", selectedInvestors);
      const { error } = await supabase
        .from("investors")
        .delete()
        .in("investor_id", selectedInvestors);

      if (error) throw error;

      // Update the state
      setInvestors((prev) =>
        prev.filter((investor) => !selectedInvestors.includes(investor.id)),
      );

      setSelectedInvestors([]);
      setSelectAll(false);

      toast({
        title: "Success",
        description: `${selectedInvestors.length} investors deleted successfully`,
      });
    } catch (err) {
      console.error("Error deleting investors:", err);
      toast({
        title: "Error",
        description: "Failed to delete investors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Open project selection dialog before adding to subscriptions
  const handleAddToSubscriptionsClick = () => {
    if (selectedInvestors.length === 0) {
      toast({
        title: "No investors selected",
        description: "Please select at least one investor",
        variant: "destructive",
      });
      return;
    }
    setIsProjectSelectionOpen(true);
  };

  // Handle adding investors to subscriptions with project ID
  const handleAddToSubscriptions = async (projectId: string) => {
    if (selectedInvestors.length === 0 || !projectId) return;

    try {
      setIsProcessing(true);

      // Get selected investor details
      const { data: selectedInvestorData, error: fetchError } = await supabase
        .from("investors")
        .select("*")
        .in("investor_id", selectedInvestors);

      if (fetchError) throw fetchError;

      // Add each investor to subscriptions with the selected project ID
      const now = new Date().toISOString();
      const subscriptionsToAdd = selectedInvestorData.map((investor) => ({
        investor_id: investor.investor_id,
        project_id: projectId, // Set the project ID from selection
        subscription_id: `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        currency: "USD",
        fiat_amount: 0, // Default amount, can be updated later
        subscription_date: now,
        confirmed: false,
        allocated: false,
        distributed: false,
        created_at: now,
        updated_at: now,
        notes: "Added from investors list",
      }));

      // Insert subscriptions
      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert(subscriptionsToAdd);

      if (insertError) throw insertError;

      // Log activity with try/catch to prevent errors from breaking the flow
      try {
        const { logActivity } = await import("@/infrastructure/activityLogger");
        await logActivity({
          action: "add_investors_to_subscriptions",
          details: {
            project_id: projectId,
            investor_count: selectedInvestors.length,
            investor_ids: selectedInvestors
          }
        });
      } catch (logError) {
        // Just log the warning but don't let it break the flow
        console.warn(
          "Failed to log activity, but subscription was created:",
          logError,
        );
      }

      // Get project name for the toast message
      const { data: projectData } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();

      toast({
        title: "Success",
        description: `${selectedInvestors.length} investors added to ${projectData?.name || "project"} subscriptions`,
      });

      // Clear selection
      setSelectedInvestors([]);
      setSelectAll(false);
      setIsProjectSelectionOpen(false);
    } catch (err) {
      console.error("Error adding investors to subscriptions:", err);
      toast({
        title: "Error",
        description: "Failed to add investors to subscriptions",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle KYC/AML screening
  const handleScreeningClick = () => {
    console.log("Screening click with selected investors:", selectedInvestors);
    
    if (selectedInvestors.length === 0) {
      toast({
        title: "No investors selected",
        description:
          "Please select at least one investor for KYC/AML screening",
        variant: "destructive",
      });
      return;
    }
    
    // Get the full investor data for each selected investor ID
    const selectedInvestorsData = investors.filter(investor => 
      selectedInvestors.includes(investor.id)
    );
    
    console.log("Selected investor data for screening:", selectedInvestorsData);
    
    // Open the screening dialog with the full investor data
    setIsScreeningDialogOpen(true);
  };

  // Handle screening completion
  const handleScreeningComplete = async () => {
    console.log("Screening complete, refreshing investor data");
    
    // Refresh the investors list to show updated KYC statuses
    await fetchInvestors();
    
    // Clear selection and close dialog
    setSelectedInvestors([]);
    setIsScreeningDialogOpen(false);
    
    toast({
      title: "Screening Complete",
      description: "KYC/AML screening process completed successfully",
    });
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    try {
      // Determine which investors to export
      const investorsToExport =
        selectedInvestors.length > 0
          ? filteredInvestors.filter((investor) =>
              selectedInvestors.includes(investor.id),
            )
          : filteredInvestors;

      if (investorsToExport.length === 0) {
        toast({
          title: "No Data",
          description: "No investors to export",
          variant: "destructive",
        });
        return;
      }

      // Create CSV content
      const headers = [
        "Name",
        "Email",
        "Company",
        "Type",
        "KYC Status", 
        "Wallet Address",
        "Created At",
        "Updated At"
      ];
      const csvContent = [
        headers.join(","),
        ...investorsToExport.map((investor) =>
          [
            `"${investor.name}"`,
            `"${investor.email}"`,
            `"${investor.company || ""}"`,
            `"${getInvestorTypeName(investor.type)}"`,
            `"${investor.kycStatus}"`,
            `"${investor.wallet_address || ""}"`,
            `"${investor.createdAt ? new Date(investor.createdAt).toISOString() : ""}"`,
            `"${investor.updatedAt ? new Date(investor.updatedAt).toISOString() : ""}"`
          ].join(","),
        ),
      ].join("\n");

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `investors_export_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `${investorsToExport.length} investors exported successfully`,
      });
    } catch (err) {
      console.error("Error exporting investors:", err);
      toast({
        title: "Error",
        description: "Failed to export investors. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setTypeFilter(null);
    setKycStatusFilter(null);
    setSearchQuery("");
    setColumnFilters({});
  };

  // Handle showing investors from a group
  const handleShowGroupInvestors = async (groupId: string) => {
    try {
      setIsLoading(true);
      setActiveGroupId(groupId);
      
      // Get the investors from both tables
      const { data: newData, error: newError } = await supabase
        .from("investor_groups_investors")
        .select("investor_id")
        .eq("group_id", groupId);

      if (newError) throw newError;
      
      const { data: oldData, error: oldError } = await supabase
        .from("investor_group_members")
        .select("investor_id")
        .eq("group_id", groupId);
        
      if (oldError) throw oldError;
      
      // Combine and deduplicate investor IDs
      const investorIdSet = new Set<string>();
      (newData || []).forEach(item => investorIdSet.add(item.investor_id));
      (oldData || []).forEach(item => investorIdSet.add(item.investor_id));
      
      const investorIds = Array.from(investorIdSet);
      
      if (investorIds.length === 0) {
        setSelectedInvestors([]);
        toast({
          title: "No Investors",
          description: "This group doesn't contain any investors.",
        });
        setIsLoading(false);
        return;
      }
      
      // Fetch the actual investor records
      const { data: groupInvestors, error: investorError } = await supabase
        .from("investors")
        .select("*")
        .in("investor_id", investorIds)
        .order("created_at", { ascending: false });
        
      if (investorError) throw investorError;
      
      // Transform data to match UI format
      const transformedInvestors = groupInvestors?.map((investor) => ({
        id: investor.investor_id,
        name: investor.name,
        email: investor.email,
        company: investor.company || "",
        type: investor.type || "individual",
        kycStatus: investor.kyc_status || "not_started",
        wallet_address: investor.wallet_address || "",
        totalInvestment: 0,
        projects: 0,
        createdAt: investor.created_at,
        updatedAt: investor.updated_at
      }));
      
      setInvestors(transformedInvestors || []);
      
      // Find the active group name for the toast
      const activeGroup = investorGroups.find(g => g.id === groupId);
      
      toast({
        title: "Group Filtered",
        description: `Showing ${transformedInvestors?.length || 0} investors from "${activeGroup?.name || 'Selected Group'}"`,
      });
    } catch (err) {
      console.error("Error fetching group investors:", err);
      toast({
        title: "Error",
        description: "Failed to load investors from this group.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear group filter and show all investors
  const handleClearGroupFilter = () => {
    if (activeGroupId) {
      setActiveGroupId(null);
      fetchInvestors();
      toast({
        title: "Filter Cleared",
        description: "Showing all investors",
      });
    }
  };

  return (
    <>
      {/* Main component JSX */}
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Investors</h1>
            <p className="text-muted-foreground">
              Manage your investor database
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsBulkUploadOpen(true)}
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4" />
              <span>Bulk Upload</span>
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={() => {
                setCurrentInvestor(null);
                setIsAddDialogOpen(true);
              }}
              disabled={isProcessing}
            >
              <Plus className="h-4 w-4" />
              <span>Add Investor</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Investors Card */}
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Investors
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {investors.length}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KYC Status Summary */}
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    KYC Approved
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {
                      investors.filter((inv) => inv.kycStatus === "approved")
                        .length
                    }
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {investors.length > 0
                      ? Math.round(
                          (investors.filter(
                            (inv) => inv.kycStatus === "approved",
                          ).length /
                            investors.length) *
                            100,
                        )
                      : 0}
                    % of total
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investor Types Summary */}
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Investor Types
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {new Set(investors.map((inv) => inv.type)).size}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {investors.filter((inv) => inv.type === "hnwi").length} HNWI
                    investors
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Address Summary */}
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    With Wallet Address
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {
                      investors.filter(
                        (inv) =>
                          inv.wallet_address && inv.wallet_address.length > 0,
                      ).length
                    }
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {investors.length > 0
                      ? Math.round(
                          (investors.filter(
                            (inv) =>
                              inv.wallet_address &&
                              inv.wallet_address.length > 0,
                          ).length /
                            investors.length) *
                            100,
                        )
                      : 0}
                    % of total
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle>Investor Database</CardTitle>
            <CardDescription>
              View and manage all investors across your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search investors..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      <span>Filter</span>
                      {(typeFilter ||
                        kycStatusFilter ||
                        Object.keys(columnFilters).length > 0) && (
                        <Badge
                          variant="secondary"
                          className="ml-1 px-1.5 py-0.5 h-5"
                        >
                          {[
                            typeFilter ? 1 : 0,
                            kycStatusFilter ? 1 : 0,
                            Object.keys(columnFilters).length,
                          ].reduce((a, b) => a + b, 0)}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96">
                    <div className="space-y-4">
                      <h4 className="font-medium">Filter Investors</h4>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Investor Type</h5>
                        <Select
                          value={typeFilter || ""}
                          onValueChange={(value) =>
                            setTypeFilter(value === "all_types" ? null : value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            <SelectItem value="all_types">All Types</SelectItem>
                            {getAllInvestorTypes().map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">KYC Status</h5>
                        <Select
                          value={kycStatusFilter || ""}
                          onValueChange={(value) =>
                            setKycStatusFilter(
                              value === "all_statuses" ? null : value,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_statuses">
                              All Statuses
                            </SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="not_started">
                              Not Started
                            </SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Name</h5>
                        <Input
                          placeholder="Filter by name"
                          value={columnFilters.name || ""}
                          onChange={(e) =>
                            handleColumnFilterChange("name", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Email</h5>
                        <Input
                          placeholder="Filter by email"
                          value={columnFilters.email || ""}
                          onChange={(e) =>
                            handleColumnFilterChange("email", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Company</h5>
                        <Input
                          placeholder="Filter by company"
                          value={columnFilters.company || ""}
                          onChange={(e) =>
                            handleColumnFilterChange("company", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Wallet Address</h5>
                        <Input
                          placeholder="Filter by wallet address"
                          value={columnFilters.wallet_address || ""}
                          onChange={(e) =>
                            handleColumnFilterChange(
                              "wallet_address",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Created At</h5>
                        <Input
                          placeholder="Filter by created date (YYYY-MM-DD)"
                          value={columnFilters.createdAt || ""}
                          onChange={(e) =>
                            handleColumnFilterChange("createdAt", e.target.value)
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Updated At</h5>
                        <Input
                          placeholder="Filter by updated date (YYYY-MM-DD)"
                          value={columnFilters.updatedAt || ""}
                          onChange={(e) =>
                            handleColumnFilterChange("updatedAt", e.target.value)
                          }
                        />
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                        >
                          Reset All Filters
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setIsFilterOpen(false)}
                        >
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover open={isColumnSelectorOpen} onOpenChange={setIsColumnSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Columns2 className="h-4 w-4" />
                      <span>Columns</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60">
                    <div className="space-y-4">
                      <h4 className="font-medium">Select Visible Columns</h4>
                      <div className="space-y-2">
                        {availableColumns.map((column) => (
                          <div key={column.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`column-${column.id}`}
                              checked={visibleColumns.includes(column.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setVisibleColumns(prev => [...prev, column.id]);
                                } else {
                                  setVisibleColumns(prev => 
                                    prev.filter(id => id !== column.id)
                                  );
                                }
                              }}
                            />
                            <label 
                              htmlFor={`column-${column.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {column.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportCSV}>
                      {selectedInvestors.length > 0
                        ? `Export Selected (${selectedInvestors.length})`
                        : "Export All"}{" "}
                      to CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Investor
                </Button>
              </div>
            </div>

            {/* Investor Group Quick Access */}
            {investorGroups.length > 0 && investorGroups.some(group => group.member_count > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeGroupId && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1" 
                    onClick={handleClearGroupFilter}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Clear Filter</span>
                  </Button>
                )}
                {investorGroups
                  .filter(group => group.member_count > 0)
                  .slice(0, 10)
                  .map((group) => (
                    <Button
                      key={group.id}
                      variant={activeGroupId === group.id ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => handleShowGroupInvestors(group.id)}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>{group.name}</span>
                      {group.member_count !== undefined && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {group.member_count}
                        </Badge>
                      )}
                    </Button>
                ))}
                {investorGroups.filter(group => group.member_count > 0).length > 10 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsManageGroupsOpen(true)}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5 mr-1" />
                    <span>More</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => setIsManageGroupsOpen(true)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Manage Groups</span>
                </Button>
              </div>
            )}

            {/* Bulk actions for selected investors */}
            {selectedInvestors.length > 0 && (
              <div className="bg-muted/20 p-3 rounded-md mb-4 flex justify-between items-center">
                <span className="text-sm">
                  {selectedInvestors.length} investor(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInvestors([])}
                  >
                    <XSquare className="h-4 w-4 mr-1" /> Clear Selection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddToSubscriptionsClick}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-1" /> Add to
                        Subscriptions
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsManageGroupsOpen(true)}
                    disabled={isProcessing}
                  >
                    <Users className="h-4 w-4 mr-1" /> Manage Groups
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScreeningClick}
                  >
                    <UserCheck className="h-4 w-4 mr-1" /> KYC/AML Screening
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
                  </Button>
                </div>
              </div>
            )}

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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            paginatedInvestors.length > 0 &&
                            selectedInvestors.length ===
                              paginatedInvestors.length
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all investors"
                        />
                      </TableHead>
                      {visibleColumns.includes("name") && (
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-1">
                            Name
                            {sortColumn === "name" && (
                              <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.includes("email") && (
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("email")}
                        >
                          <div className="flex items-center gap-1">
                            Email
                            {sortColumn === "email" && (
                              <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.includes("company") && (
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("company")}
                        >
                          <div className="flex items-center gap-1">
                            Company
                            {sortColumn === "company" && (
                              <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.includes("type") && (
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("type")}
                        >
                          <div className="flex items-center gap-1">
                            Type
                            {sortColumn === "type" && (
                              <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.includes("kycStatus") && (
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("kycStatus")}
                        >
                          <div className="flex items-center gap-1">
                            KYC Status
                            {sortColumn === "kycStatus" && (
                              <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.includes("wallet_address") && (
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("wallet_address")}
                        >
                          <div className="flex items-center gap-1">
                            Wallet Address
                            {sortColumn === "wallet_address" && (
                              <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.includes("createdAt") && (
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("createdAt")}
                        >
                          <div className="flex items-center gap-1">
                            Created At
                            {sortColumn === "createdAt" && (
                              <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.includes("updatedAt") && (
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("updatedAt")}
                        >
                          <div className="flex items-center gap-1">
                            Updated At
                            {sortColumn === "updatedAt" && (
                              <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                      )}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvestors.length > 0 ? (
                      paginatedInvestors.map((investor) => (
                        <TableRow key={investor.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedInvestors.includes(investor.id)}
                              onCheckedChange={(checked) =>
                                handleSelectInvestor(investor.id, !!checked)
                              }
                              aria-label={`Select ${investor.name}`}
                            />
                          </TableCell>
                          {visibleColumns.includes("name") && (
                            <TableCell className="font-medium">
                              {investor.name}
                            </TableCell>
                          )}
                          {visibleColumns.includes("email") && (
                            <TableCell>{investor.email}</TableCell>
                          )}
                          {visibleColumns.includes("company") && (
                            <TableCell>{investor.company}</TableCell>
                          )}
                          {visibleColumns.includes("type") && (
                            <TableCell>
                              {getInvestorTypeName(investor.type)}
                            </TableCell>
                          )}
                          {visibleColumns.includes("kycStatus") && (
                            <TableCell>
                              <KycStatusBadge status={investor.kycStatus} />
                            </TableCell>
                          )}
                          {visibleColumns.includes("wallet_address") && (
                            <TableCell className="max-w-[150px] truncate">
                              {investor.wallet_address ? (
                                <span title={investor.wallet_address}>
                                  {investor.wallet_address}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">
                                  Not set
                                </span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.includes("createdAt") && (
                            <TableCell>
                              {investor.createdAt ? new Date(investor.createdAt).toLocaleString() : "N/A"}
                            </TableCell>
                          )}
                          {visibleColumns.includes("updatedAt") && (
                            <TableCell>
                              {investor.updatedAt ? new Date(investor.updatedAt).toLocaleString() : "N/A"}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View Investor Details"
                                onClick={() =>
                                  handleViewInvestorDetails(investor)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="KYC/AML Screening"
                                onClick={() => {
                                  setSelectedInvestors([investor.id]);
                                  setIsScreeningDialogOpen(true);
                                }}
                              >
                                <UserCheck className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Email Investor"
                                disabled={isProcessing}
                                onClick={() => {
                                  window.location.href = `mailto:${investor.email}`;
                                }}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit Investor"
                                onClick={() => handleEditInvestor(investor)}
                                disabled={isProcessing}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete Investor"
                                onClick={() => handleDeleteInvestor(investor)}
                                disabled={isProcessing}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={visibleColumns.length + 2}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No investors found matching your search criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    sortedInvestors.length,
                  )}{" "}
                  of {sortedInvestors.length} investors
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Selection Dialog */}
      <ProjectSelectionDialog
        open={isProjectSelectionOpen}
        onOpenChange={setIsProjectSelectionOpen}
        onConfirm={handleAddToSubscriptions}
        title="Select Project for Subscriptions"
        description={`Select a project to add ${selectedInvestors.length} investor(s) to subscriptions`}
      />

      {/* Add Investor Dialog */}
      <InvestorDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        mode="add"
        onSuccess={fetchInvestors}
      />

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="sm:max-w-[900px] p-0 bg-white">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Bulk Upload Investors</DialogTitle>
            <DialogDescription>Upload multiple investors using a CSV file</DialogDescription>
          </DialogHeader>
          <BulkInvestorUpload
            onUploadComplete={(investors) => {
              fetchInvestors();
              setIsBulkUploadOpen(false);
              toast({
                title: "Upload Complete",
                description: `${investors.length} investors processed successfully`,
              });
            }}
            onCancel={() => setIsBulkUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Investor Dialog */}
      <InvestorDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        investor={currentInvestor}
        onSuccess={fetchInvestors}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Investor
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{currentInvestor?.name}</span>?
              This action cannot be undone and all associated data will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteInvestor}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Investor"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Investor Details Dialog */}
      {currentInvestor && (
        <Dialog
          open={isInvestorDetailsOpen}
          onOpenChange={setIsInvestorDetailsOpen}
        >
          <DialogContent className="sm:max-w-[700px] bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <span>Investor Details</span>
              </DialogTitle>
              <DialogDescription>
                Detailed information about {currentInvestor.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Name
                  </h3>
                  <p className="font-medium">{currentInvestor.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Email
                  </h3>
                  <p>{currentInvestor.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Company
                  </h3>
                  <p>{currentInvestor.company || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Type
                  </h3>
                  <p>{getInvestorTypeName(currentInvestor.type)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    KYC Status
                  </h3>
                  <div>
                    <KycStatusBadge status={currentInvestor.kycStatus} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Wallet Address
                  </h3>
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm truncate max-w-[200px]"
                      title={currentInvestor.wallet_address}
                    >
                      {currentInvestor.wallet_address || "Not set"}
                    </p>
                    {currentInvestor.wallet_address && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Copy to clipboard"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            currentInvestor.wallet_address,
                          );
                          toast({
                            title: "Copied",
                            description: "Wallet address copied to clipboard",
                          });
                        }}
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscriptions and Tokens */}
              <div>
                <h3 className="text-md font-medium mb-2">
                  Subscriptions & Token Holdings
                </h3>
                {investorSubscriptions.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {investorSubscriptions.map((subscription) => (
                          <TableRow key={subscription.id}>
                            <TableCell>
                              {subscription.projects?.name || "Unknown Project"}
                            </TableCell>
                            <TableCell className="text-right">
                              {subscription.fiat_amount?.toLocaleString() || 0}
                            </TableCell>
                            <TableCell>
                              {subscription.currency || "USD"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${subscription.confirmed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                              >
                                {subscription.confirmed
                                  ? "Confirmed"
                                  : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {subscription.subscription_date
                                ? new Date(
                                    subscription.subscription_date,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/20 rounded-md">
                    <Coins className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No subscriptions or token holdings found
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInvestorDetailsOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  try {
                    // Transform the investor object for edit when clicking from details view
                    const formattedInvestor = {
                      investor_id:
                        currentInvestor.id || currentInvestor.investor_id,
                      name: currentInvestor.name || "",
                      email: currentInvestor.email || "",
                      company: currentInvestor.company || "",
                      type: currentInvestor.type || "hnwi",
                      kyc_status:
                        currentInvestor.kycStatus ||
                        currentInvestor.kyc_status ||
                        "not_started",
                      wallet_address: currentInvestor.wallet_address || "",
                      notes: "",
                    };
                    console.log(
                      "Formatted investor from details view:",
                      formattedInvestor,
                    );
                    setCurrentInvestor(formattedInvestor);
                    setIsInvestorDetailsOpen(false);
                    // Use setTimeout to ensure state is updated before opening dialog
                    setTimeout(() => {
                      setIsEditDialogOpen(true);
                    }, 0);
                  } catch (error) {
                    console.error("Error editing from details view:", error);
                    toast({
                      title: "Error",
                      description: "Failed to edit investor. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Investor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* KYC/AML Screening Dialog */}
      <BatchScreeningDialog
        open={isScreeningDialogOpen}
        onOpenChange={setIsScreeningDialogOpen}
        selectedInvestors={investors.filter(investor => 
          selectedInvestors.includes(investor.id)
        )}
        onScreeningComplete={handleScreeningComplete}
      />

      {/* Manage Groups Dialog */}
      <ManageGroupsDialog
        open={isManageGroupsOpen}
        onOpenChange={setIsManageGroupsOpen}
        selectedInvestors={investors.filter((investor) =>
          selectedInvestors.includes(investor.id),
        )}
        onComplete={() => {
          fetchInvestors();
          toast({
            title: "Success",
            description: "Investor groups updated successfully",
          });
        }}
      />
    </>
  );
};

export default InvestorsList;
