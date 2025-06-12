import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import ProjectSelector from "./ProjectSelector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/infrastructure/database/client";
import {
  getProjectSubscriptions,
  confirmSubscriptions,
  createSubscriptionV2 as createSubscription,
  deleteSubscription,
  updateSubscriptionV2 as updateSubscription,
  Subscription,
} from "@/infrastructure/subscriptions";
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Upload,
  CheckSquare,
  Trash2,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Download,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import SubscriptionDialog from "./SubscriptionDialog";
import SubscriptionUploadDialog from "./SubscriptionUploadDialog";
import SubscriptionConfirmationDialog from "./SubscriptionConfirmationDialog";
import BulkStatusUpdateDialog from "./BulkStatusUpdateDialog";
import SubscriptionExportDialog from "./SubscriptionExportDialog";
import { v4 as uuidv4 } from "uuid";
import { Label } from "@/components/ui/label";

interface SubscriptionManagerProps {
  projectId?: string;
}

const SubscriptionManager = ({ projectId }: SubscriptionManagerProps) => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState<
    string[]
  >([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isBulkStatusUpdateOpen, setIsBulkStatusUpdateOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [bulkEditAmount, setBulkEditAmount] = useState<string>("");
  const [bulkEditCurrency, setBulkEditCurrency] = useState<string>("USD");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<
    string | null
  >(null);
  const [editingSubscription, setEditingSubscription] = useState<string | null>(
    null,
  );
  const [editAmount, setEditAmount] = useState<string>("");
  const [editCurrency, setEditCurrency] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string>("investor.name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tokenTypeFilter, setTokenTypeFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [tokenTypes] = useState<string[]>([
    "ERC-20",
    "ERC-1400",
    "SAFE",
    "Equity",
  ]); // Hardcoded for simplicity
  const [currencies] = useState<string[]>(["USD", "EUR", "GBP", "JPY", "CHF"]); // Common currencies
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      fetchSubscriptions();
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    const subscriptionChannel = supabase
      .channel("subscriptions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `project_id=eq.${projectId}`,
        },
        () => fetchSubscriptions(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, [projectId]);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      if (!projectId) {
        setSubscriptions([]); // Clear subscriptions if no projectId
        return;
      }

      console.log("Fetching subscriptions for project ID:", projectId);
      const data = await getProjectSubscriptions(projectId);
      console.log("Fetched subscription data:", data);
      setSubscriptions(data);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      toast({
        title: "Error",
        description: "Failed to load subscriptions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and search to subscriptions
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    // Apply search filter
    const matchesSearch = [
      subscription.investor.name,
      subscription.investor.email,
      subscription.subscription_id,
    ].some((field) => field?.toLowerCase().includes(searchQuery.toLowerCase()));

    // Apply status filter
    const matchesStatus = !statusFilter
      ? true
      : (statusFilter === "confirmed" && subscription.confirmed) ||
        (statusFilter === "pending" && !subscription.confirmed) ||
        (statusFilter === "allocated" && subscription.allocated) ||
        (statusFilter === "distributed" && subscription.distributed);

    // Apply token type filter (assuming token_type is available)
    const matchesTokenType = !tokenTypeFilter
      ? true
      : subscription.token_type === tokenTypeFilter;

    return matchesSearch && matchesStatus && matchesTokenType;
  });

  // Sort the filtered subscriptions
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    let valueA, valueB;

    // Handle nested properties like investor.name
    if (sortColumn === "investor.name") {
      valueA = a.investor.name.toLowerCase();
      valueB = b.investor.name.toLowerCase();
    } else if (sortColumn === "fiat_amount") {
      valueA = a.fiat_amount || 0;
      valueB = b.fiat_amount || 0;
    } else if (sortColumn === "subscription_date") {
      valueA = new Date(a.subscription_date).getTime();
      valueB = new Date(b.subscription_date).getTime();
    } else if (sortColumn === "status") {
      // Sort by confirmed status first, then allocated, then distributed
      valueA =
        (a.confirmed ? "1" : "0") +
        (a.allocated ? "1" : "0") +
        (a.distributed ? "1" : "0");
      valueB =
        (b.confirmed ? "1" : "0") +
        (b.allocated ? "1" : "0") +
        (b.distributed ? "1" : "0");
    } else {
      valueA = a[sortColumn];
      valueB = b[sortColumn];
    }

    // Compare the values based on sort direction
    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedSubscriptions.length / rowsPerPage);
  const paginatedSubscriptions = sortedSubscriptions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  // Handle select all checkbox - simplified to avoid circular dependencies
  const handleSelectAll = (checked: boolean) => {
    setSelectedSubscriptionIds(
      checked ? paginatedSubscriptions.map((sub) => sub.id) : [],
    );
  };

  // Handle select subscription
  const handleSelectSubscription = (
    subscriptionId: string,
    isSelected: boolean,
  ) => {
    setSelectedSubscriptionIds((prev) =>
      isSelected
        ? [...prev, subscriptionId]
        : prev.filter((id) => id !== subscriptionId),
    );
  };

  // Handle sorting when a column header is clicked
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle sort direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handle editing a subscription amount and currency
  const handleEditAmount = (subscription: any) => {
    setEditingSubscription(subscription.id);
    setEditAmount(subscription.fiat_amount.toString());
    setEditCurrency(subscription.currency || "USD");
    // Focus the input after rendering
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 0);
  };

  // Handle saving edited amount and currency
  const handleSaveAmount = async (subscription: any) => {
    try {
      const newAmount = parseFloat(editAmount);
      if (isNaN(newAmount) || newAmount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount greater than 0",
          variant: "destructive",
        });
        return;
      }

      if (!editCurrency || editCurrency.trim() === "") {
        toast({
          title: "Invalid currency",
          description: "Please enter a valid currency code",
          variant: "destructive",
        });
        return;
      }

      // Make API call to update the subscription
      console.log(`Updating subscription ${subscription.id} with amount ${newAmount} ${editCurrency}`);
      
      // Call the updateSubscription method with the specific fields we want to update
      await updateSubscription(subscription.id, {
        fiat_amount: newAmount,
        currency: editCurrency,
      });

      // Update local state immediately for a smoother UX
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === subscription.id
            ? {
                ...sub,
                fiat_amount: newAmount,
                currency: editCurrency,
              }
            : sub,
        ),
      );

      toast({
        title: "Success",
        description: "Subscription details updated successfully",
      });
      
      // Refresh the subscriptions to ensure data consistency
      await fetchSubscriptions();
    } catch (err) {
      console.error("Error updating subscription:", err);
      toast({
        title: "Error",
        description: "Failed to update subscription details",
        variant: "destructive",
      });
    } finally {
      setEditingSubscription(null);
      setEditAmount("");
      setEditCurrency("");
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingSubscription(null);
    setEditAmount("");
    setEditCurrency("");
  };

  // Handle delete single subscription
  const handleDeleteSubscription = (subscriptionId: string) => {
    setSubscriptionToDelete(subscriptionId);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete single subscription
  const confirmDeleteSubscription = async () => {
    if (!subscriptionToDelete) return;

    try {
      await deleteSubscription(subscriptionToDelete);

      // Update local state
      setSubscriptions((prev) =>
        prev.filter((sub) => sub.id !== subscriptionToDelete),
      );

      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting subscription:", err);
      toast({
        title: "Error",
        description: "Failed to delete subscription",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
    }
  };

  const handleAddSubscription = async (subscriptionData: any) => {
    try {
      if (!projectId) {
        toast({
          title: "Error",
          description: "Project ID is required. Please select a project first.",
          variant: "destructive",
        });
        return;
      }

      // Create subscription
      await createSubscription({
        project_id: projectId,
        investor_id: subscriptionData.investor_id, 
        subscription_id: `SUB-${Date.now()}`,
        currency: subscriptionData.currency || "USD",
        fiat_amount: parseFloat(subscriptionData.amount),
        subscription_date: subscriptionData.date || new Date().toISOString(),
        confirmed: false,
        allocated: false,
        distributed: false,
        notes: subscriptionData.notes || "",
        // These fields are used for display only but are not part of SubscriptionInsert
        // passing them as extra properties to be used by the implementation
      });

      toast({
        title: "Success",
        description: "Subscription added successfully",
      });
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Error adding subscription:", err);
      toast({
        title: "Error",
        description: "Failed to add subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUploadSubscriptions = async (subscriptionsData: any[]) => {
    try {
      if (!projectId) return;

      for (const sub of subscriptionsData) {
        await createSubscription({
          project_id: projectId,
          investor_id: sub.investor_id || uuidv4(),
          subscription_id: `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          currency: sub.currency || "USD",
          fiat_amount: parseFloat(sub.amount),
          subscription_date: sub.date || new Date().toISOString(),
          confirmed: false,
          allocated: false,
          distributed: false,
          notes: sub.notes || "",
          // These fields are used for display only but are not part of SubscriptionInsert
          // passing them as extra properties to be used by the implementation
        });
      }

      toast({
        title: "Success",
        description: `${subscriptionsData.length} subscriptions uploaded successfully`,
      });
      setIsUploadDialogOpen(false);
    } catch (err) {
      console.error("Error uploading subscriptions:", err);
      toast({
        title: "Error",
        description: "Failed to upload subscriptions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmSubscriptions = async () => {
    try {
      if (!projectId || selectedSubscriptionIds.length === 0) return;

      await confirmSubscriptions(selectedSubscriptionIds, projectId);
      toast({
        title: "Success",
        description: `${selectedSubscriptionIds.length} subscriptions confirmed successfully`,
      });
      setIsConfirmDialogOpen(false);
      setSelectedSubscriptionIds([]);
    } catch (err) {
      console.error("Error confirming subscriptions:", err);
      toast({
        title: "Error",
        description: "Failed to confirm subscriptions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubscriptions = async () => {
    try {
      if (!projectId || selectedSubscriptionIds.length === 0) return;

      for (const id of selectedSubscriptionIds) {
        await deleteSubscription(id);
      }

      // Fixed audit_logs insert
      await supabase.from("audit_logs").insert({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        action: "subscription_deleted",
        // Don't include user_id if you don't have a valid UUID
        user_email: "admin@example.com",
        details: `Deleted ${selectedSubscriptionIds.length} subscription(s)`,
        entity_id: selectedSubscriptionIds.join(","),
        entity_type: "subscription",
        status: "success",
        // Add these fields to match successful logs
        action_type: "delete",
        occurred_at: new Date().toISOString(),
        severity: "info",
        source: "web_app",
        username: "admin"
      });

      toast({
        title: "Success",
        description: `${selectedSubscriptionIds.length} subscriptions deleted successfully`,
      });
      setSelectedSubscriptionIds([]);
    } catch (err) {
      console.error("Error deleting subscriptions:", err);
      toast({
        title: "Error",
        description: "Failed to delete subscriptions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToTokenAllocations = async () => {
    if (selectedSubscriptionIds.length === 0 || !projectId) {
      toast({
        title: "No subscriptions selected",
        description: "Please select at least one subscription",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get selected subscriptions
      const selectedSubscriptions = subscriptions.filter((sub) =>
        selectedSubscriptionIds.includes(sub.id),
      );

      // Create token allocations for each selected subscription
      const now = new Date().toISOString();
      let successCount = 0;

      for (const subscription of selectedSubscriptions) {
        try {
          // Check if subscription has valid amount
          const hasValidAmount = subscription.fiat_amount > 0;

          // Create a default token allocation for each subscription
          const { error } = await supabase.from("token_allocations").insert({
            id: uuidv4(), // Using uuidv4() instead of crypto.randomUUID()
            investor_id: subscription.investor_id,
            subscription_id: subscription.id,
            project_id: projectId,
            token_type: "ERC-20", // Default token type
            token_amount: subscription.fiat_amount,
            // Auto-confirm if there's a valid subscription amount
            allocation_date: hasValidAmount ? now : null,
            created_at: now,
            updated_at: now,
            distributed: false,
            minted: false,
            minting_date: null,
            minting_tx_hash: null,
            distribution_date: null,
            distribution_tx_hash: null,
            notes: null
          });

          if (error) throw error;

          // Update subscription to mark as allocated
          await supabase
            .from("subscriptions")
            .update({ allocated: true, updated_at: now })
            .eq("id", subscription.id);

          successCount++;
        } catch (err) {
          console.error(
            "Error creating allocation for subscription:",
            subscription.id,
            err,
          );
        }
      }

      toast({
        title: "Success",
        description: `${successCount} subscriptions added to token allocations`,
      });

      // Navigate to allocations page
      navigate(`/projects/${projectId}/captable/allocations`);
    } catch (err) {
      console.error("Error adding to token allocations:", err);
      toast({
        title: "Error",
        description: "Failed to add subscriptions to token allocations",
        variant: "destructive",
      });
    }
  };

  // Handle export subscriptions
  const handleExportSubscriptions = async (options: any) => {
    try {
      // Determine which subscriptions to export
      const subscriptionsToExport =
        options.exportType === "selected"
          ? sortedSubscriptions.filter((sub) =>
              selectedSubscriptionIds.includes(sub.id),
            )
          : sortedSubscriptions;

      if (subscriptionsToExport.length === 0) {
        toast({
          title: "No Data",
          description: "No subscriptions to export",
          variant: "destructive",
        });
        return;
      }

      // Create headers based on selected options
      const headers = ["Subscription ID", "Date", "Currency", "Amount"];

      if (options.includeInvestorDetails) {
        headers.push("Investor Name", "Investor Email", "Wallet Address");
      }

      if (options.includeStatus) {
        headers.push("Confirmed", "Allocated", "Distributed");
      }

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...subscriptionsToExport.map((subscription) => {
          const row = [
            `"${subscription.subscription_id}"`,
            `"${new Date(subscription.subscription_date).toLocaleDateString()}"`,
            `"${subscription.currency}"`,
            subscription.fiat_amount,
          ];

          if (options.includeInvestorDetails) {
            row.push(
              `"${subscription.investor.name}"`,
              `"${subscription.investor.email}"`,
              `"${subscription.investor.wallet_address || ""}"`,
            );
          }

          if (options.includeStatus) {
            row.push(
              subscription.confirmed ? "Yes" : "No",
              subscription.allocated ? "Yes" : "No",
              subscription.distributed ? "Yes" : "No",
            );
          }

          return row.join(",");
        }),
      ].join("\n");

      // Create and download the file
      if (options.fileFormat === "csv") {
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `subscriptions_export_${new Date().toISOString().split("T")[0]}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For Excel, we'd normally use a library like xlsx
        // For simplicity, we'll just use CSV with an .xlsx extension
        const blob = new Blob([csvContent], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `subscriptions_export_${new Date().toISOString().split("T")[0]}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Success",
        description: `${subscriptionsToExport.length} subscriptions exported successfully`,
      });
    } catch (err) {
      console.error("Error exporting subscriptions:", err);
      toast({
        title: "Error",
        description: "Failed to export subscriptions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // New handler for bulk edit amount operation
  const handleBulkEditAmount = async () => {
    try {
      if (selectedSubscriptionIds.length === 0 || !projectId) {
        toast({
          title: "No subscriptions selected",
          description: "Please select at least one subscription",
          variant: "destructive",
        });
        return;
      }

      const newAmount = parseFloat(bulkEditAmount);
      if (isNaN(newAmount) || newAmount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount greater than 0",
          variant: "destructive",
        });
        return;
      }

      if (!bulkEditCurrency || bulkEditCurrency.trim() === "") {
        toast({
          title: "Invalid currency",
          description: "Please enter a valid currency code",
          variant: "destructive",
        });
        return;
      }

      // Update each selected subscription
      let successCount = 0;
      for (const subscriptionId of selectedSubscriptionIds) {
        try {
          await updateSubscription(subscriptionId, {
            fiat_amount: newAmount,
            currency: bulkEditCurrency,
          });
          successCount++;
        } catch (err) {
          console.error(`Error updating subscription ${subscriptionId}:`, err);
        }
      }

      toast({
        title: "Success",
        description: `Updated ${successCount} of ${selectedSubscriptionIds.length} subscriptions`,
      });

      // Refresh subscriptions
      await fetchSubscriptions();
      setIsBulkEditDialogOpen(false);
      setBulkEditAmount("");
      setSelectedSubscriptionIds([]);
    } catch (err) {
      console.error("Error performing bulk edit:", err);
      toast({
        title: "Error",
        description: "Failed to update subscriptions. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Subscription Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage investor subscriptions and token allocations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchSubscriptions}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsUploadDialogOpen(true)}
            disabled={!projectId}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Subscriptions</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsExportDialogOpen(true)}
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={() => setIsAddDialogOpen(true)}
            disabled={!projectId}
          >
            <Plus className="h-4 w-4" />
            <span>Add Subscription</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>
                View and manage investor subscriptions
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscriptions..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                    {(statusFilter || tokenTypeFilter) && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {(statusFilter ? 1 : 0) + (tokenTypeFilter ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <div className="mb-2">
                      <p className="text-sm font-medium mb-1">Status</p>
                      <select
                        className="w-full p-2 text-sm rounded-md border border-input bg-background"
                        value={statusFilter || ""}
                        onChange={(e) =>
                          setStatusFilter(e.target.value || null)
                        }
                      >
                        <option value="">All Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="allocated">Allocated</option>
                        <option value="distributed">Distributed</option>
                      </select>
                    </div>

                    <div className="mb-2">
                      <p className="text-sm font-medium mb-1">Token Type</p>
                      <select
                        className="w-full p-2 text-sm rounded-md border border-input bg-background"
                        value={tokenTypeFilter || ""}
                        onChange={(e) =>
                          setTokenTypeFilter(e.target.value || null)
                        }
                      >
                        <option value="">All Types</option>
                        {tokenTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        setStatusFilter(null);
                        setTokenTypeFilter(null);
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedSubscriptionIds.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setIsConfirmDialogOpen(true)}
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>Confirm Selected</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setIsBulkStatusUpdateOpen(true)}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Update Status</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 text-blue-600"
                    onClick={handleAddToTokenAllocations}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Token Allocations</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 text-red-600"
                    onClick={handleDeleteSubscriptions}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Selected</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setIsBulkEditDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Bulk Edit Amount</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        paginatedSubscriptions.length > 0 &&
                        selectedSubscriptionIds.length ===
                          paginatedSubscriptions.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("investor.name")}
                  >
                    <div className="flex items-center">
                      Investor
                      {sortColumn === "investor.name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                      {sortColumn !== "investor.name" && (
                        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Subscription ID</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("fiat_amount")}
                  >
                    <div className="flex items-center justify-end">
                      Amount
                      {sortColumn === "fiat_amount" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                      {sortColumn !== "fiat_amount" && (
                        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center justify-center">
                      Status
                      {sortColumn === "status" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                      {sortColumn !== "status" && (
                        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("subscription_date")}
                  >
                    <div className="flex items-center">
                      Date
                      {sortColumn === "subscription_date" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                      {sortColumn !== "subscription_date" && (
                        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSubscriptionIds.includes(
                            subscription.id,
                          )}
                          onCheckedChange={(checked) =>
                            handleSelectSubscription(subscription.id, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {subscription.investor.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.investor.email}
                        </div>
                      </TableCell>
                      <TableCell>{subscription.subscription_id}</TableCell>
                      <TableCell className="text-right">
                        {editingSubscription === subscription.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <div className="flex flex-col gap-1 items-end">
                              <div className="flex items-center gap-1">
                                <select
                                  value={editCurrency}
                                  onChange={(e) =>
                                    setEditCurrency(e.target.value)
                                  }
                                  className="w-16 text-xs rounded-md border border-input bg-background px-2 py-1"
                                >
                                  {currencies.map((currency) => (
                                    <option key={currency} value={currency}>
                                      {currency}
                                    </option>
                                  ))}
                                </select>
                                <Input
                                  ref={editInputRef}
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) =>
                                    setEditAmount(e.target.value)
                                  }
                                  className="w-24 text-right"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveAmount(subscription);
                                    } else if (e.key === "Escape") {
                                      handleCancelEdit();
                                    }
                                  }}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Press Enter to save
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveAmount(subscription)}
                              className="h-8 w-8"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelEdit}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          formatCurrency(
                            subscription.fiat_amount,
                            subscription.currency,
                          )
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {editingSubscription ===
                          `status-${subscription.id}` ? (
                            <div className="flex items-center gap-1">
                              <select
                                className="text-xs rounded-md border border-input bg-background px-2 py-1"
                                value={
                                  subscription.confirmed
                                    ? "confirmed"
                                    : "pending"
                                }
                                onChange={async (e) => {
                                  try {
                                    const newStatus = e.target.value;
                                    await updateSubscription(subscription.id, {
                                      confirmed: newStatus === "confirmed",
                                    });

                                    // Update local state
                                    setSubscriptions((prev) =>
                                      prev.map((sub) =>
                                        sub.id === subscription.id
                                          ? {
                                              ...sub,
                                              confirmed:
                                                newStatus === "confirmed",
                                            }
                                          : sub,
                                      ),
                                    );

                                    toast({
                                      title: "Success",
                                      description:
                                        "Status updated successfully",
                                    });
                                  } catch (err) {
                                    console.error(
                                      "Error updating status:",
                                      err,
                                    );
                                    toast({
                                      title: "Error",
                                      description: "Failed to update status",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setEditingSubscription(null);
                                  }
                                }}
                              >
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingSubscription(null)}
                                className="h-6 w-6"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Badge
                              className={`cursor-pointer ${subscription.confirmed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                              onClick={() =>
                                setEditingSubscription(
                                  `status-${subscription.id}`,
                                )
                              }
                            >
                              {subscription.confirmed ? "Confirmed" : "Pending"}
                            </Badge>
                          )}

                          {editingSubscription ===
                          `allocated-${subscription.id}` ? (
                            <div className="flex items-center gap-1">
                              <select
                                className="text-xs rounded-md border border-input bg-background px-2 py-1"
                                value={
                                  subscription.allocated
                                    ? "allocated"
                                    : "not_allocated"
                                }
                                onChange={async (e) => {
                                  try {
                                    const newStatus = e.target.value;
                                    await updateSubscription(subscription.id, {
                                      allocated: newStatus === "allocated",
                                    });

                                    // Update local state
                                    setSubscriptions((prev) =>
                                      prev.map((sub) =>
                                        sub.id === subscription.id
                                          ? {
                                              ...sub,
                                              allocated:
                                                newStatus === "allocated",
                                            }
                                          : sub,
                                      ),
                                    );

                                    toast({
                                      title: "Success",
                                      description:
                                        "Allocation status updated successfully",
                                    });
                                  } catch (err) {
                                    console.error(
                                      "Error updating allocation status:",
                                      err,
                                    );
                                    toast({
                                      title: "Error",
                                      description:
                                        "Failed to update allocation status",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setEditingSubscription(null);
                                  }
                                }}
                              >
                                <option value="allocated">Allocated</option>
                                <option value="not_allocated">
                                  Not Allocated
                                </option>
                              </select>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingSubscription(null)}
                                className="h-6 w-6"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            subscription.allocated && (
                              <Badge
                                className="ml-1 bg-blue-100 text-blue-800 cursor-pointer"
                                onClick={() =>
                                  setEditingSubscription(
                                    `allocated-${subscription.id}`,
                                  )
                                }
                              >
                                Allocated
                              </Badge>
                            )
                          )}

                          {editingSubscription ===
                          `distributed-${subscription.id}` ? (
                            <div className="flex items-center gap-1">
                              <select
                                className="text-xs rounded-md border border-input bg-background px-2 py-1"
                                value={
                                  subscription.distributed
                                    ? "distributed"
                                    : "not_distributed"
                                }
                                onChange={async (e) => {
                                  try {
                                    const newStatus = e.target.value;
                                    await updateSubscription(subscription.id, {
                                      distributed: newStatus === "distributed",
                                    });

                                    // Update local state
                                    setSubscriptions((prev) =>
                                      prev.map((sub) =>
                                        sub.id === subscription.id
                                          ? {
                                              ...sub,
                                              distributed:
                                                newStatus === "distributed",
                                            }
                                          : sub,
                                      ),
                                    );

                                    toast({
                                      title: "Success",
                                      description:
                                        "Distribution status updated successfully",
                                    });
                                  } catch (err) {
                                    console.error(
                                      "Error updating distribution status:",
                                      err,
                                    );
                                    toast({
                                      title: "Error",
                                      description:
                                        "Failed to update distribution status",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setEditingSubscription(null);
                                  }
                                }}
                              >
                                <option value="distributed">Distributed</option>
                                <option value="not_distributed">
                                  Not Distributed
                                </option>
                              </select>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingSubscription(null)}
                                className="h-6 w-6"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            subscription.distributed && (
                              <Badge
                                className="ml-1 bg-purple-100 text-purple-800 cursor-pointer"
                                onClick={() =>
                                  setEditingSubscription(
                                    `distributed-${subscription.id}`,
                                  )
                                }
                              >
                                Distributed
                              </Badge>
                            )
                          )}

                          {!subscription.allocated &&
                            !subscription.distributed &&
                            editingSubscription !==
                              `status-${subscription.id}` && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() =>
                                  setEditingSubscription(
                                    `status-${subscription.id}`,
                                  )
                                }
                              >
                                <Edit className="h-3 w-3 mr-1" /> Edit
                              </Button>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[150px]">
                        {subscription.investor.wallet_address || "Not set"}
                      </TableCell>
                      <TableCell>
                        {new Date(
                          subscription.subscription_date,
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAmount(subscription)}
                            className="h-8 w-8"
                            disabled={editingSubscription !== null}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeleteSubscription(subscription.id)
                            }
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            disabled={editingSubscription !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {sortedSubscriptions.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * rowsPerPage + 1,
                  sortedSubscriptions.length,
                )}{" "}
                to{" "}
                {Math.min(
                  currentPage * rowsPerPage,
                  sortedSubscriptions.length,
                )}{" "}
                of {sortedSubscriptions.length} subscriptions
              </div>
              <div className="flex items-center space-x-2">
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
                  Page {currentPage} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SubscriptionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddSubscription}
        projectId={projectId}
      />
      <SubscriptionUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploadComplete={handleUploadSubscriptions}
      />
      <SubscriptionConfirmationDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        selectedCount={selectedSubscriptionIds.length}
        onConfirm={handleConfirmSubscriptions}
      />

      {/* Export Dialog */}
      <SubscriptionExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        onExport={handleExportSubscriptions}
        selectedCount={selectedSubscriptionIds.length}
        totalCount={sortedSubscriptions.length}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subscription? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSubscription}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Update Dialog */}
      <BulkStatusUpdateDialog
        open={isBulkStatusUpdateOpen}
        onOpenChange={setIsBulkStatusUpdateOpen}
        title="Update Subscription Status"
        description="Change the status of selected subscriptions"
        selectedCount={selectedSubscriptionIds.length}
        statusOptions={[
          { value: "confirmed", label: "Confirmed" },
          { value: "pending", label: "Pending" },
          { value: "allocated", label: "Allocated" },
          { value: "distributed", label: "Distributed" },
        ]}
        onConfirm={async (newStatus) => {
          try {
            if (!projectId || selectedSubscriptionIds.length === 0) return;

            // Update subscriptions based on the selected status
            const updates: Record<string, boolean> = {};

            if (newStatus === "confirmed") updates.confirmed = true;
            if (newStatus === "pending") updates.confirmed = false;
            if (newStatus === "allocated") updates.allocated = true;
            if (newStatus === "distributed") updates.distributed = true;

            // Apply updates to all selected subscriptions
            for (const id of selectedSubscriptionIds) {
              await updateSubscription(id, updates);
            }

            // Fixed audit_logs insert
            await supabase.from("audit_logs").insert({
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              action: `subscription_status_updated_to_${newStatus}`,
              // Don't include user_id if you don't have a valid UUID
              user_email: "admin@example.com",
              details: `Updated ${selectedSubscriptionIds.length} subscription(s) to ${newStatus}`,
              entity_id: selectedSubscriptionIds.join(","),
              entity_type: "subscription",
              status: "success",
              // Add these fields to match successful logs
              action_type: "update",
              occurred_at: new Date().toISOString(),
              severity: "info",
              source: "web_app",
              username: "admin"
            });

            toast({
              title: "Success",
              description: `${selectedSubscriptionIds.length} subscriptions updated to ${newStatus}`,
            });

            // Refresh data
            fetchSubscriptions();
            setSelectedSubscriptionIds([]);
          } catch (err) {
            console.error("Error updating subscription status:", err);
            toast({
              title: "Error",
              description: "Failed to update subscription status",
              variant: "destructive",
            });
            throw err; // Re-throw to be caught by the dialog
          }
        }}
      />

      {/* Add the BulkEditDialog */}
      <AlertDialog
        open={isBulkEditDialogOpen}
        onOpenChange={setIsBulkEditDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Edit Subscriptions</AlertDialogTitle>
            <AlertDialogDescription>
              Update the amount and currency for {selectedSubscriptionIds.length}{" "}
              selected subscription(s).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="bulk-amount">Amount</Label>
                <Input
                  id="bulk-amount"
                  value={bulkEditAmount}
                  onChange={(e) => setBulkEditAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter amount"
                />
              </div>
              <div className="w-24 space-y-1">
                <Label htmlFor="bulk-currency">Currency</Label>
                <select
                  id="bulk-currency"
                  value={bulkEditCurrency}
                  onChange={(e) => setBulkEditCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkEditAmount}>Update</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionManager;
