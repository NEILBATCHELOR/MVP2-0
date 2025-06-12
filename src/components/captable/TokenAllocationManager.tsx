import React, { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/infrastructure/database/client";
import { 
  Search, 
  RefreshCw, 
  Plus, 
  Upload, 
  Edit, 
  Download, 
  ListFilter, 
  Trash,
  ChevronDown,
  ChevronUp,
  Loader2,
  Filter,
  Columns2,
  SlidersHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import TokenAllocationsTable from "./TokenAllocationTable";
import AllocationConfirmationDialog from "./AllocationConfirmationDialog";
import TokenAllocationForm from "./TokenAllocationForm";
import TokenAllocationUploadDialog from "./TokenAllocationUploadDialog";
import TokenAllocationExportDialog from "./TokenAllocationExportDialog";
import BulkStatusUpdateDialog from "./BulkStatusUpdateDialog";
import { getTokens } from "@/services/token";
import { TokenStatus, TokenStandard } from "@/types/core/centralModels";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Tag } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
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

interface TokenAllocationManagerProps {
  projectId: string;
  projectName?: string;
}

// Add this schema for the bulk token type update
const bulkTokenTypeSchema = z.object({
  token_type: z.string().min(1, { message: "Token type is required" }),
  token_id: z.string().optional(),
});

const TokenAllocationManager = ({
  projectId,
  projectName = "Project",
}: TokenAllocationManagerProps) => {
  const [activeTab, setActiveTab] = useState("allocations");
  const [allocations, setAllocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAllocationIds, setSelectedAllocationIds] = useState<string[]>(
    [],
  );
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isAllocationFormOpen, setIsAllocationFormOpen] = useState(false);
  const [isAllocationUploadOpen, setIsAllocationUploadOpen] = useState(false);
  const [isAllocationExportOpen, setIsAllocationExportOpen] = useState(false);
  const [isBulkStatusUpdateOpen, setIsBulkStatusUpdateOpen] = useState(false);
  const [isBulkTokenTypeUpdateOpen, setIsBulkTokenTypeUpdateOpen] = useState(false);
  const [isEditAllocationOpen, setIsEditAllocationOpen] = useState(false);
  const [currentEditAllocation, setCurrentEditAllocation] = useState<any>(null);
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);
  const { toast } = useToast();
  const [isSelectActionOpen, setIsSelectActionOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  
  // New state variables for sorting, filtering and column selection
  const [sortColumn, setSortColumn] = useState<string>("investorName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tokenTypeFilter, setTokenTypeFilter] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "investorName", "subscriptionId", "tokenType", "allocatedAmount", "status", "walletAddress"
  ]);

  // Available columns for the table
  const availableColumns = [
    { id: "investorName", label: "Investor" },
    { id: "subscriptionId", label: "Subscription" },
    { id: "tokenType", label: "Token Type" },
    { id: "allocatedAmount", label: "Amount" },
    { id: "status", label: "Status" },
    { id: "walletAddress", label: "Wallet Address" }
  ];

  // Fetch data when component mounts
  useEffect(() => {
    if (projectId) {
      fetchAllocations();
      fetchAllocationTokens();
    }
  }, [projectId]);

  // Fetch tokens with eligible statuses for allocation
  const fetchAllocationTokens = async () => {
    try {
      // Get tokens with eligible statuses
      const eligibleStatuses = [
        TokenStatus.APPROVED,
        TokenStatus.READY_TO_MINT,
        TokenStatus.MINTED,
        TokenStatus.DEPLOYED
      ];
      
      const response = await getTokens({ projectId });
      const allTokens = response.success && response.data 
        ? (Array.isArray(response.data) ? response.data : [response.data]) 
        : [];
      
      const tokens = allTokens.filter(token => 
        eligibleStatuses.includes(token.status as TokenStatus)
      );
      
      console.log("Available tokens for allocation:", tokens);
      
      // Transform tokens for the dropdown
      const formattedTokens = tokens.map(token => {
        // Get the standard value and normalize it (removing hyphens)
        let normalizedStandard = '';
        if (token.standard) {
          normalizedStandard = token.standard.replace(/-/g, '');
        }
        
        return {
          id: token.id || '',
          name: token.name || '',
          symbol: 'symbol' in token ? token.symbol : '',
          // Include the standard in the type display for dropdown selection
          type: `${token.name || ''} (${'symbol' in token ? token.symbol : ''})${normalizedStandard ? ` - ${normalizedStandard}` : ''}`,
          standard: token.standard || '',     // Keep the original standard with hyphens (ERC-20)
          normalizedStandard: normalizedStandard, // Store normalized version for display/comparison (ERC20)
          status: token.status || ''
        };
      });
      
      console.log("Formatted tokens for allocation:", formattedTokens);
      
      setAvailableTokens(formattedTokens);
    } catch (err) {
      console.error("Error fetching allocation tokens:", err);
    }
  };

  const fetchAllocations = async () => {
    try {
      setIsLoading(true);

      // First, fetch available tokens to get their standards
      const { data: tokensData, error: tokensError } = await supabase
        .from("tokens")
        .select("id, name, symbol, standard")
        .eq("project_id", projectId);

      if (tokensError) {
        console.error("Error fetching tokens:", tokensError);
      }

      console.log("Tokens data for standards mapping:", tokensData);

      // Create a mapping of token names to standards
      const tokenStandardsMap = new Map();
      tokensData?.forEach(token => {
        // Format standard to ensure consistent ERC format
        let standard = token.standard || "";
        
        // Normalize standard format (ensure it's ERC1234 not ERC-1234)
        standard = standard.replace(/-/g, '').toUpperCase();
        if (standard && !standard.startsWith('ERC') && /^\d+$/.test(standard)) {
          standard = `ERC${standard}`;
        }
        
        const tokenName = token.name;
        const tokenKey = `${token.name} (${token.symbol})`;
        
        tokenStandardsMap.set(tokenKey, standard);
        tokenStandardsMap.set(tokenName, standard); // Also map by name only
        tokenStandardsMap.set(token.symbol, standard); // Also map by symbol
        
        console.log(`Setting mapping: ${tokenName} -> ${standard}, ${tokenKey} -> ${standard}`);
      });

      // Query token_allocations table directly
      const { data, error } = await supabase
        .from("token_allocations")
        .select(
          `
          id,
          investor_id,
          subscription_id,
          token_type,
          token_amount,
          distributed,
          allocation_date,
          notes,
          standard,
          symbol,
          token_id,
          subscriptions!inner(currency, fiat_amount, confirmed, allocated, subscription_id),
          investors!inner(name, email, wallet_address)
        `,
        )
        .eq("project_id", projectId);

      if (error) throw error;

      console.log("Raw token allocations:", data);

      // Transform data for the table
      const transformedAllocations =
        data?.map((allocation) => {
          // Try to extract token name and symbol from token_type (format: "Name (Symbol)")
          const tokenTypeMatch = allocation.token_type.match(/(.+?)\s*(?:\((.+?)\))?(?:\s*-\s*(.+))?/);
          let tokenName = allocation.token_type;
          let tokenSymbol = allocation.symbol || ""; // Use the column value if available
          
          // Get standard and normalize it (convert from "ERC-20" format to "ERC20")
          let tokenStandard = "";
          if (allocation.standard) {
            // Convert from enum format (ERC-20) to normalized format (ERC20)
            tokenStandard = allocation.standard.replace(/-/g, '');
          } else if (tokenTypeMatch && tokenTypeMatch[3]) {
            // Extract from token_type if not in DB
            tokenStandard = tokenTypeMatch[3].trim().replace(/-/g, '').toUpperCase();
            if (!tokenStandard.startsWith('ERC') && /^\d+$/.test(tokenStandard)) {
              tokenStandard = `ERC${tokenStandard}`;
            }
          }
          
          if (!tokenSymbol || !tokenStandard) {
            // Fall back to parsing from token_type if the columns aren't populated
            if (tokenTypeMatch) {
              tokenName = tokenTypeMatch[1]?.trim() || allocation.token_type;
              if (!tokenSymbol) tokenSymbol = tokenTypeMatch[2]?.trim() || "";
            }
          }
          
          console.log(`Parsed allocation "${allocation.token_type}":`, {
            tokenName,
            tokenSymbol,
            tokenStandard,
            dbSymbol: allocation.symbol,
            dbStandard: allocation.standard
          });
          
          // If we don't have a standard yet, try to look it up from the tokens table
          if (!tokenStandard) {
            const lookupKey = tokenSymbol ? `${tokenName} (${tokenSymbol})` : tokenName;
            tokenStandard = tokenStandardsMap.get(lookupKey) || tokenStandardsMap.get(tokenName) || "";
            console.log(`Looking up standard for "${lookupKey}" or "${tokenName}": ${tokenStandard}`);
          }
          
          // Format token type to include standard if available
          let formattedTokenType = allocation.token_type;
          if (tokenStandard && !formattedTokenType.includes(tokenStandard)) {
            formattedTokenType = tokenSymbol 
              ? `${tokenName} (${tokenSymbol}) - ${tokenStandard}`
              : `${tokenName} - ${tokenStandard}`;
            console.log(`Formatted token type: ${formattedTokenType}`);
          }

          return {
            id: allocation.id,
            investorId: allocation.investor_id,
            investorName: allocation.investors.name,
            investorEmail: allocation.investors.email,
            walletAddress: allocation.investors.wallet_address,
            tokenType: formattedTokenType,
            tokenName: tokenName,
            tokenSymbol: tokenSymbol,
            tokenStandard: tokenStandard,
            dbSymbol: allocation.symbol || null,     // Keep track of DB field
            dbStandard: allocation.standard || null, // Keep track of DB field
            tokenId: allocation.token_id || null,    // Include token_id in the transformed allocation
            subscriptionId: allocation.subscriptions.subscription_id,
            currency: allocation.subscriptions.currency,
            fiatAmount: allocation.subscriptions.fiat_amount || 0,
            subscribedAmount: allocation.subscriptions.fiat_amount || 0,
            allocatedAmount: allocation.token_amount || 0,
            confirmed: allocation.subscriptions.confirmed || false,
            allocated: allocation.subscriptions.allocated || false,
            allocationConfirmed: allocation.allocation_date ? true : false,
            distributed: allocation.distributed || false,
            notes: allocation.notes || '',
          };
        }) || [];

      console.log("Transformed allocations with standards:", transformedAllocations);
      
      // Extra debugging - count allocations by standard to identify potential problems
      const standardCounts = {};
      transformedAllocations.forEach(allocation => {
        const standard = allocation.tokenStandard || 'MISSING';
        standardCounts[standard] = (standardCounts[standard] || 0) + 1;
      });
      console.log("🧪 Token standards distribution:", standardCounts);
      
      // Log any tokens without standards
      const missingStandards = transformedAllocations.filter(a => !a.tokenStandard);
      if (missingStandards.length > 0) {
        console.warn("⚠️ Found tokens missing standards:", missingStandards.map(a => a.tokenType));
      }
      
      setAllocations(transformedAllocations);
    } catch (err) {
      console.error("Error fetching allocations:", err);
      toast({
        title: "Error",
        description: "Failed to load allocation data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setTokenTypeFilter(null);
    setColumnFilters({});
  };

  // Filter allocations based on all filtering criteria
  const filteredAllocations = useMemo(() => {
    return allocations.filter((allocation) => {
      // Match search query
      const matchesSearch =
        allocation.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        allocation.investorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        allocation.tokenType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (allocation.walletAddress && allocation.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()));

      // Match status filter
      const matchesStatusFilter = statusFilter
        ? statusFilter === "confirmed" 
          ? allocation.allocationConfirmed
          : statusFilter === "unconfirmed" 
            ? !allocation.allocationConfirmed
            : true
        : true;

      // Match token type filter
      const matchesTokenTypeFilter = tokenTypeFilter
        ? allocation.tokenType === tokenTypeFilter
        : true;

      // Apply column filters
      const matchesColumnFilters = Object.entries(columnFilters).every(
        ([column, filterValue]) => {
          if (!filterValue) return true;
          const value = String(allocation[column] || "").toLowerCase();
          return value.includes(filterValue.toLowerCase());
        },
      );

      return (
        matchesSearch &&
        matchesStatusFilter &&
        matchesTokenTypeFilter &&
        matchesColumnFilters
      );
    });
  }, [allocations, searchQuery, statusFilter, tokenTypeFilter, columnFilters]);

  // Sort the filtered allocations
  const sortedAllocations = useMemo(() => {
    return [...filteredAllocations].sort((a, b) => {
      let valueA = a[sortColumn];
      let valueB = b[sortColumn];

      // Handle special cases for sorting
      if (sortColumn === "allocatedAmount" || sortColumn === "subscribedAmount") {
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
  }, [filteredAllocations, sortColumn, sortDirection]);

  // Handle allocation selection
  const handleSelectId = (id: string) => {
    setSelectedAllocationIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle select all
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedAllocationIds(filteredAllocations.map((a) => a.id));
    } else {
      setSelectedAllocationIds([]);
    }
  };

  // Handle update allocation
  const handleUpdateAllocation = async (
    id: string,
    amount: number,
    onSuccess?: () => void,
    onError?: (message: string) => void
  ) => {
    try {
      // Set loading state for this specific allocation
      setAllocations(prev => 
        prev.map(a => a.id === id ? { ...a, isUpdating: true } : a)
      );

      // Find the allocation
      const allocation = allocations.find((a) => a.id === id);
      if (!allocation) {
        throw new Error("Allocation not found");
      }

      // Update token allocation amount
      const updates: Record<string, any> = {
        token_amount: amount,
        updated_at: new Date().toISOString(),
      };

      // If amount is 0, we're deleting the allocation
      if (amount === 0) {
        const { error } = await supabase
          .from("token_allocations")
          .delete()
          .eq("id", id);

        if (error) throw error;
        
        // Remove from local state
        setAllocations(prev => prev.filter(a => a.id !== id));
        
        toast({
          title: "Allocation Deleted",
          description: "Token allocation has been deleted successfully.",
        });
      } else {
        // Check if we're confirming or unconfirming based on current state
        // If currently unconfirmed and in the confirm dropdown action, set allocation_date
        if (!allocation.allocationConfirmed && allocation.allocatedAmount === amount) {
          updates.allocation_date = new Date().toISOString();
        }
        
        // If currently confirmed and in the unconfirm dropdown action, clear allocation_date
        if (allocation.allocationConfirmed && allocation.allocatedAmount === amount) {
          updates.allocation_date = null;
        }

        const { error } = await supabase
          .from("token_allocations")
          .update(updates)
          .eq("id", id);

        if (error) throw error;
        
        // Update only the relevant allocation
        setAllocations(prev => 
          prev.map(a => {
            if (a.id === id) {
              // Create updated allocation based on the operation
              let updatedAllocation = { ...a, isUpdating: false, allocatedAmount: amount };
              
              // If confirming
              if (!a.allocationConfirmed && a.allocatedAmount === amount) {
                updatedAllocation.allocationConfirmed = true;
              }
              
              // If unconfirming
              if (a.allocationConfirmed && a.allocatedAmount === amount) {
                updatedAllocation.allocationConfirmed = false;
              }
              
              return updatedAllocation;
            }
            return a;
          })
        );

        toast({
          title: "Allocation Updated",
          description: "Token allocation has been updated successfully.",
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error updating allocation:", err);
      
      // Clear loading state on error
      setAllocations(prev => 
        prev.map(a => a.id === id ? { ...a, isUpdating: false } : a)
      );
      
      const errorMessage = "Failed to update allocation. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Handle confirm allocations
  const handleConfirmAllocations = async () => {
    try {
      const now = new Date().toISOString();

      // Update token_allocations to set allocation_date (which marks them as confirmed)
      const { error: updateError } = await supabase
        .from("token_allocations")
        .update({
          allocation_date: now,
          updated_at: now,
        })
        .in("id", selectedAllocationIds);

      if (updateError) throw updateError;

      // Update local state
      setAllocations((prev) =>
        prev.map((a) =>
          selectedAllocationIds.includes(a.id)
            ? { ...a, allocationConfirmed: true }
            : a,
        ),
      );

      // No need to recalculate token summaries

      toast({
        title: "Allocations Confirmed",
        description: `${selectedAllocationIds.length} allocations have been confirmed.`,
      });

      // Clear selection
      setSelectedAllocationIds([]);
      setIsConfirmDialogOpen(false);

      // Refresh allocations to ensure UI is up to date
      fetchAllocations();
    } catch (err) {
      console.error("Error confirming allocations:", err);
      toast({
        title: "Error",
        description: "Failed to confirm allocations. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle export token allocations
  const handleExportAllocations = async (options: any) => {
    try {
      setIsLoading(true);

      // Select allocations to export
      const allocationsToExport =
        options.exportType === "selected"
          ? allocations.filter((a) => selectedAllocationIds.includes(a.id))
          : allocations;

      // Prepare data for export
      const exportData = allocationsToExport.map((allocation) => {
        const data: Record<string, any> = {
          allocation_id: allocation.id,
          token_type: allocation.tokenType,
          token_amount: allocation.allocatedAmount,
          allocation_date: allocation.allocationConfirmed
            ? new Date(allocation.allocationDate).toLocaleDateString()
            : "",
          distributed: allocation.distributed ? "Yes" : "No",
        };

        // Include investor details if requested
        if (options.includeInvestorDetails) {
          data.investor_name = allocation.investorName;
          data.investor_email = allocation.investorEmail;
          data.wallet_address = allocation.walletAddress || "";
        }

        // Include subscription details if requested
        if (options.includeSubscriptionDetails) {
          data.subscription_id = allocation.subscriptionId;
          data.currency = allocation.currency;
          data.fiat_amount = allocation.fiatAmount;
        }

        // Include status fields if requested
        if (options.includeStatus) {
          data.subscription_confirmed = allocation.confirmed ? "Yes" : "No";
          data.allocation_confirmed = allocation.allocationConfirmed
            ? "Yes"
            : "No";
          data.distributed = allocation.distributed ? "Yes" : "No";
        }

        // Include token details if requested
        if (options.includeTokenDetails) {
          const tokenParts = allocation.tokenType.split(' - ');
          const nameSymbolPart = tokenParts[0] || '';
          const standardPart = tokenParts[1] || '';
          
          // Extract name and symbol from format "Name (Symbol)"
          const nameSymbolMatch = nameSymbolPart.match(/(.+) \((.+)\)/);
          if (nameSymbolMatch) {
            data.token_name = nameSymbolMatch[1];
            data.token_symbol = nameSymbolMatch[2];
          } else {
            data.token_name = nameSymbolPart;
            data.token_symbol = "";
          }
          
          data.token_standard = standardPart;
        }

        return data;
      });

      if (exportData.length === 0) {
        toast({
          title: "No Data",
          description: "No allocations to export",
          variant: "destructive",
        });
        return;
      }

      // Create headers based on selected options
      const headers = ["Token Type", "Allocated Amount"];

      if (options.includeInvestorDetails) {
        headers.push("Investor Name", "Investor Email", "Wallet Address");
      }

      if (options.includeSubscriptionDetails) {
        headers.push("Subscription ID", "Currency", "Subscription Amount");
      }

      if (options.includeStatus) {
        headers.push("Confirmed", "Distributed");
      }

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...exportData.map((data) => {
          const row = [
            `"${data.token_type}"`,
            data.token_amount,
          ];

          if (options.includeInvestorDetails) {
            row.push(
              `"${data.investor_name}"`,
              `"${data.investor_email}"`,
              `"${data.wallet_address}"`,
            );
          }

          if (options.includeSubscriptionDetails) {
            row.push(
              `"${data.subscription_id}"`,
              `"${data.currency}"`,
              data.fiat_amount,
            );
          }

          if (options.includeStatus) {
            row.push(
              data.subscription_confirmed,
              data.distributed,
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
          `token_allocations_export_${new Date().toISOString().split("T")[0]}.csv`,
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
          `token_allocations_export_${new Date().toISOString().split("T")[0]}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Success",
        description: `${exportData.length} token allocations exported successfully`,
      });
    } catch (err) {
      console.error("Error exporting token allocations:", err);
      toast({
        title: "Error",
        description: "Failed to export token allocations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete allocation
  const handleDeleteAllocation = async (id: string) => {
    try {
      // Delete the allocation from the database
      const { error } = await supabase
        .from("token_allocations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setAllocations((prev) => prev.filter((a) => a.id !== id));

      toast({
        title: "Allocation Deleted",
        description: "Token allocation has been deleted successfully.",
      });
    } catch (err) {
      console.error("Error deleting allocation:", err);
      toast({
        title: "Error",
        description: "Failed to delete allocation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle adding token allocations
  const handleAddTokenAllocations = async (allocationData: any) => {
    try {
      const { subscription_id, investor_id, project_id, allocations, notes } =
        allocationData;

      // Get subscription details to check amount
      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("fiat_amount")
          .eq("id", subscription_id)
          .single();

      if (subscriptionError) throw subscriptionError;

      const hasValidAmount =
        subscriptionData && subscriptionData.fiat_amount > 0;
      const now = new Date().toISOString();

      // Create token allocations for each token type
      for (const allocation of allocations) {
        // Extract standard and symbol information
        let symbol = "";
        let standard = "";
        let token_id = allocation.token_id || null; // Get token_id directly from form data
        
        // If token_id isn't in form data, try to get from selected token in dropdown
        if (!token_id) {
          // Try to get from selected token in the dropdown
          const selectedToken = availableTokens.find(t => t.type === allocation.token_type);
          if (selectedToken) {
            symbol = selectedToken.symbol;
            standard = selectedToken.standard;
            token_id = selectedToken.id; // Add token_id from the selected token
            console.log(`Found token_id ${token_id} for token type ${allocation.token_type}`);
          } else {
            // Try to extract from token_type string
            const tokenTypeMatch = allocation.token_type.match(/(.+?)\s*(?:\((.+?)\))?(?:\s*-\s*(.+))?/);
            if (tokenTypeMatch) {
              symbol = tokenTypeMatch[2]?.trim() || "";
              standard = tokenTypeMatch[3]?.trim() || "";
            }
          }
        } else {
          console.log(`Using token_id ${token_id} from form data for token type ${allocation.token_type}`);
          // If we have a token_id, make sure we also get the symbol and standard
          const selectedToken = availableTokens.find(t => t.id === token_id);
          if (selectedToken) {
            symbol = selectedToken.symbol;
            standard = selectedToken.standard;
          }
        }
        
        // Normalize standard format and ensure it's a valid enum value
        let standardEnum: "ERC-20" | "ERC-721" | "ERC-1155" | "ERC-1400" | "ERC-3525" | "ERC-4626" | null = null;
        if (standard) {
          // Convert normalized standard (ERC20) to enum format (ERC-20)
          if (standard === "ERC20") standardEnum = "ERC-20";
          else if (standard === "ERC721") standardEnum = "ERC-721";
          else if (standard === "ERC1155") standardEnum = "ERC-1155";
          else if (standard === "ERC1400") standardEnum = "ERC-1400";
          else if (standard === "ERC3525") standardEnum = "ERC-3525";
          else if (standard === "ERC4626") standardEnum = "ERC-4626";
        }
        
        console.log("Creating allocation with:", {
          tokenType: allocation.token_type,
          amount: allocation.token_amount,
          symbol,
          standard,
          standardEnum,
          token_id // log token_id
        });

        const { data, error } = await supabase
          .from("token_allocations")
          .insert({
            investor_id,
            subscription_id,
            project_id,
            token_type: allocation.token_type,
            token_amount: allocation.token_amount,
            symbol,
            standard: standardEnum,
            token_id, // Include token_id in the insert
            notes,
            // Auto-confirm if there's a valid subscription amount
            allocation_date: hasValidAmount ? now : null,
            created_at: now,
            updated_at: now,
          });

        if (error) throw error;
      }

      // Update subscription to mark as allocated
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ allocated: true, updated_at: new Date().toISOString() })
        .eq("id", subscription_id);

      if (updateError) throw updateError;

      // Refresh allocations
      fetchAllocations();

      toast({
        title: "Success",
        description: `${allocations.length} token allocation(s) added successfully`,
      });

      setIsAllocationFormOpen(false);
    } catch (err) {
      console.error("Error adding token allocations:", err);
      toast({
        title: "Error",
        description: "Failed to add token allocations. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle bulk upload of token allocations
  const handleUploadTokenAllocations = async (allocationsData: any[]) => {
    try {
      if (!projectId) {
        toast({
          title: "Error",
          description: "Project ID is required. Please select a project first.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      const now = new Date().toISOString();
      let successCount = 0;

      for (const allocation of allocationsData) {
        try {
          // Get subscription details
          const { data: subscriptionData, error: subscriptionError } =
            await supabase
              .from("subscriptions")
              .select("id, investor_id")
              .eq("subscription_id", allocation.subscription_id)
              .eq("project_id", projectId)
              .single();

          if (subscriptionError) {
            console.error(
              `Subscription not found: ${allocation.subscription_id}`,
            );
            continue;
          }

          // Create token allocation
          const { error: insertError } = await supabase
            .from("token_allocations")
            .insert({
              subscription_id: subscriptionData.id,
              investor_id: subscriptionData.investor_id,
              project_id: projectId,
              token_type: allocation.token_type,
              token_amount: allocation.token_amount,
              created_at: now,
              updated_at: now,
            });

          if (insertError) {
            console.error("Error inserting allocation:", insertError);
            continue;
          }

          // Update subscription to mark as allocated
          await supabase
            .from("subscriptions")
            .update({ allocated: true, updated_at: now })
            .eq("id", subscriptionData.id);

          successCount++;
        } catch (err) {
          console.error("Error processing allocation:", err);
        }
      }

      toast({
        title: "Success",
        description: `${successCount} of ${allocationsData.length} token allocations uploaded successfully`,
      });
      setIsAllocationUploadOpen(false);

      // Refresh allocations
      fetchAllocations();
    } catch (err) {
      console.error("Error uploading token allocations:", err);
      toast({
        title: "Error",
        description: "Failed to upload token allocations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to handle editing an allocation
  const handleEditAllocation = (allocation: any) => {
    setCurrentEditAllocation(allocation);
    setIsEditAllocationOpen(true);
  };

  // Update allocation token type
  const handleUpdateTokenType = async (id: string, tokenType: string, tokenId?: string) => {
    try {
      console.log("Attempting to update token type:", { id, tokenType });
      
      // Validate token type format to match constraint
      if (!tokenType || !tokenType.includes('(') || !tokenType.includes(')')) {
        toast({
          title: "Invalid token type",
          description: "Token type must be in the format 'Name (Symbol) - Standard'",
          variant: "destructive",
        });
        return;
      }
      
      // Extract standard and symbol information
      let symbol = "";
      let standard = "";
      let token_id = null;
      
      // If tokenId is provided, use it directly
      if (tokenId) {
        token_id = tokenId;
        console.log(`Using provided token_id ${token_id} for update`);
        
        // Get symbol and standard from the availableTokens
        const selectedToken = availableTokens.find(t => t.id === tokenId);
        if (selectedToken) {
          symbol = selectedToken.symbol;
          standard = selectedToken.standard;
        }
      } else {
        // Try to get from selected token in the dropdown
        const selectedToken = availableTokens.find(t => t.type === tokenType);
        if (selectedToken) {
          symbol = selectedToken.symbol;
          standard = selectedToken.standard;
          token_id = selectedToken.id;
          console.log(`Found token_id ${token_id} for token type ${tokenType}`);
        } else {
          // Try to extract from token_type string
          const tokenTypeMatch = tokenType.match(/(.+?)\s*(?:\((.+?)\))?(?:\s*-\s*(.+))?/);
          if (tokenTypeMatch) {
            symbol = tokenTypeMatch[2]?.trim() || "";
            standard = tokenTypeMatch[3]?.trim() || "";
          }
        }
      }
      
      // Normalize standard format and ensure it's a valid enum value
      let standardEnum: "ERC-20" | "ERC-721" | "ERC-1155" | "ERC-1400" | "ERC-3525" | "ERC-4626" | null = null;
      if (standard) {
        // Convert normalized standard (ERC20) to enum format (ERC-20)
        if (standard === "ERC20") standardEnum = "ERC-20";
        else if (standard === "ERC721") standardEnum = "ERC-721";
        else if (standard === "ERC1155") standardEnum = "ERC-1155";
        else if (standard === "ERC1400") standardEnum = "ERC-1400";
        else if (standard === "ERC3525") standardEnum = "ERC-3525";
        else if (standard === "ERC4626") standardEnum = "ERC-4626";
      }
      
      console.log("Updating allocation with:", {
        tokenType,
        symbol,
        standard,
        standardEnum,
        token_id
      });
      
      // Update token allocation type in database
      const { error } = await supabase
        .from("token_allocations")
        .update({
          token_type: tokenType,
          symbol,
          standard: standardEnum,
          token_id, // Add token_id to update
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Error updating token type:", error);
        
        if (error.code === '23514') {
          toast({
            title: "Invalid token type format",
            description: "The token type format doesn't meet database constraints. Use the dropdown to select a valid option.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update token type. Database error: " + error.message,
            variant: "destructive",
          });
        }
        return;
      }

      // Update local state
      setAllocations(prev =>
        prev.map(a => {
          if (a.id === id) {
            return { 
              ...a, 
              tokenType,
              tokenSymbol: symbol,
              tokenStandard: standard,
              tokenId: token_id // Update tokenId in local state
            };
          }
          return a;
        })
      );

      toast({
        title: "Allocation Updated",
        description: "Token type has been updated successfully.",
      });
      
      setIsEditAllocationOpen(false);
    } catch (err) {
      console.error("Error updating token type:", err);
      toast({
        title: "Error",
        description: "Failed to update token type. Please ensure the token type is valid.",
        variant: "destructive",
      });
    }
  };

  // Add new function to handle bulk token type updates
  const handleBulkTokenTypeUpdate = async (tokenType: string, tokenId?: string) => {
    try {
      if (!projectId || selectedAllocationIds.length === 0) return;

      setIsLoading(true);
      const now = new Date().toISOString();
      
      // Track which allocations are being updated
      setAllocations(prev => 
        prev.map(a => selectedAllocationIds.includes(a.id) ? { ...a, isUpdating: true } : a)
      );

      // Extract standard and symbol information
      let symbol = "";
      let standard = "";
      let token_id = null;
      
      // If tokenId is provided, use it directly
      if (tokenId) {
        token_id = tokenId;
        console.log(`Using provided token_id ${token_id} for bulk update`);
        
        // Get symbol and standard from the availableTokens
        const selectedToken = availableTokens.find(t => t.id === tokenId);
        if (selectedToken) {
          symbol = selectedToken.symbol;
          standard = selectedToken.standard;
        }
      } else {
        // Try to get from selected token in the dropdown
        const selectedToken = availableTokens.find(t => t.type === tokenType);
        if (selectedToken) {
          symbol = selectedToken.symbol;
          standard = selectedToken.standard;
          token_id = selectedToken.id;
          console.log(`Found token_id ${token_id} for token type ${tokenType}`);
        } else {
          // Try to extract from token_type string
          const tokenTypeMatch = tokenType.match(/(.+?)\s*(?:\((.+?)\))?(?:\s*-\s*(.+))?/);
          if (tokenTypeMatch) {
            symbol = tokenTypeMatch[2]?.trim() || "";
            standard = tokenTypeMatch[3]?.trim() || "";
          }
        }
      }
      
      // Normalize standard format and ensure it's a valid enum value
      let standardEnum: "ERC-20" | "ERC-721" | "ERC-1155" | "ERC-1400" | "ERC-3525" | "ERC-4626" | null = null;
      if (standard) {
        // Convert normalized standard (ERC20) to enum format (ERC-20)
        if (standard === "ERC20") standardEnum = "ERC-20";
        else if (standard === "ERC721") standardEnum = "ERC-721";
        else if (standard === "ERC1155") standardEnum = "ERC-1155";
        else if (standard === "ERC1400") standardEnum = "ERC-1400";
        else if (standard === "ERC3525") standardEnum = "ERC-3525";
        else if (standard === "ERC4626") standardEnum = "ERC-4626";
      }
      
      console.log("Bulk updating allocations with:", {
        tokenType,
        symbol,
        standard,
        standardEnum,
        token_id,
        count: selectedAllocationIds.length
      });

      // Update token_type for all selected allocations
      const { error } = await supabase
        .from("token_allocations")
        .update({
          token_type: tokenType,
          symbol,
          standard: standardEnum,
          token_id, // Add token_id to bulk update
          updated_at: now
        })
        .in("id", selectedAllocationIds);

      if (error) {
        console.error("Error updating token types:", error);
        throw error;
      }

      // Update local state
      setAllocations(prev =>
        prev.map(a => {
          if (selectedAllocationIds.includes(a.id)) {
            return { 
              ...a, 
              tokenType, 
              tokenSymbol: symbol,
              tokenStandard: standard,
              tokenId: token_id, // Update tokenId in local state
              isUpdating: false 
            };
          }
          return a;
        })
      );

      toast({
        title: "Success",
        description: `Updated token type for ${selectedAllocationIds.length} allocations`,
      });

      // Clear selection
      setSelectedAllocationIds([]);
      setIsBulkTokenTypeUpdateOpen(false);
    } catch (err) {
      console.error("Error updating token types:", err);
      
      // Clear updating state
      setAllocations(prev => 
        prev.map(a => selectedAllocationIds.includes(a.id) ? { ...a, isUpdating: false } : a)
      );
      
      toast({
        title: "Error",
        description: "Failed to update token types. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      if (!projectId || selectedAllocationIds.length === 0) return;

      // Delete all selected allocations
      const { error } = await supabase
        .from("token_allocations")
        .delete()
        .in("id", selectedAllocationIds);

      if (error) throw error;

      // Update local state
      setAllocations((prev) =>
        prev.filter((a) => !selectedAllocationIds.includes(a.id))
      );

      toast({
        title: "Success",
        description: `${selectedAllocationIds.length} allocations deleted successfully`,
      });

      // Clear selection
      setSelectedAllocationIds([]);
      setIsBulkDeleteOpen(false);
    } catch (err) {
      console.error("Error deleting allocations:", err);
      toast({
        title: "Error",
        description: "Failed to delete allocations",
        variant: "destructive",
      });
      throw err;
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{projectName} Token Allocations</h1>
          {isLoading && (
            <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsAllocationUploadOpen(true)}
            disabled={!projectId}
          >
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsAllocationExportOpen(true)}
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={() => setIsAllocationFormOpen(true)}
            disabled={!projectId}
          >
            <Plus className="h-4 w-4" />
            <span>Add Allocation</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Allocations Card */}
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Allocations
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {allocations.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmed Status Summary */}
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Confirmed Allocations
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {
                    allocations.filter((a) => a.allocationConfirmed).length
                  }
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {allocations.length > 0
                    ? Math.round(
                        (allocations.filter(
                          (a) => a.allocationConfirmed
                        ).length /
                          allocations.length) *
                          100
                      )
                    : 0}
                  % of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Types Summary */}
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Token Types
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {new Set(allocations.map((a) => a.tokenType)).size}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Allocation Database</CardTitle>
          <CardDescription>
            View and manage all token allocations for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search allocations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchAllocations}
                disabled={isLoading}
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Filter Allocations</h4>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Status</h5>
                      <Select
                        value={statusFilter || ""}
                        onValueChange={(value) =>
                          setStatusFilter(value === "all_statuses" ? null : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_statuses">All Statuses</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Token Type</h5>
                      <Select
                        value={tokenTypeFilter || ""}
                        onValueChange={(value) =>
                          setTokenTypeFilter(value === "all_types" ? null : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Token Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_types">All Token Types</SelectItem>
                          {Array.from(new Set(allocations.map(a => a.tokenType))).map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Investor Name</h5>
                      <Input
                        placeholder="Filter by investor name"
                        value={columnFilters.investorName || ""}
                        onChange={(e) =>
                          handleColumnFilterChange("investorName", e.target.value)
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

              {selectedAllocationIds.length > 0 && (
                <DropdownMenu modal={false} open={isSelectActionOpen} onOpenChange={setIsSelectActionOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <span>Bulk Actions</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56" forceMount>
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => {
                        setIsBulkStatusUpdateOpen(true);
                        setIsSelectActionOpen(false);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Update Status</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setIsBulkTokenTypeUpdateOpen(true);
                        setIsSelectActionOpen(false);
                      }}>
                        <Tag className="mr-2 h-4 w-4" />
                        <span>Update Token Type</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => {
                          setIsBulkDeleteOpen(true);
                          setIsSelectActionOpen(false);
                        }}
                        className="text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete Allocations</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div>
            <TokenAllocationsTable
              allocations={sortedAllocations}
              selectedIds={selectedAllocationIds}
              onSelectId={handleSelectId}
              onSelectAll={handleSelectAll}
              onUpdateAllocation={handleUpdateAllocation}
              onEditAllocation={handleEditAllocation}
              loading={isLoading}
              visibleColumns={visibleColumns}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
            />
          </div>
        </CardContent>
      </Card>

      {/* Allocation Confirmation Dialog */}
      <AllocationConfirmationDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        selectedInvestorIds={selectedAllocationIds}
        onConfirm={handleConfirmAllocations}
        projectId={projectId}
        allocations={sortedAllocations
          .filter((allocation) => selectedAllocationIds.includes(allocation.id))
          .map((allocation) => ({
            investorId: allocation.investorId,
            investorName: allocation.investorName,
            tokenType: allocation.tokenType,
            amount: allocation.allocatedAmount,
          }))}
      />

      {/* Token Allocation Upload Dialog */}
      <TokenAllocationUploadDialog
        open={isAllocationUploadOpen}
        onOpenChange={setIsAllocationUploadOpen}
        onUploadComplete={handleUploadTokenAllocations}
        projectId={projectId}
      />

      {/* Token Allocation Export Dialog */}
      <TokenAllocationExportDialog
        open={isAllocationExportOpen}
        onOpenChange={setIsAllocationExportOpen}
        onExport={handleExportAllocations}
        selectedCount={selectedAllocationIds.length}
        totalCount={sortedAllocations.length}
      />

      {/* Token Allocation Form */}
      <TokenAllocationForm
        open={isAllocationFormOpen}
        onOpenChange={setIsAllocationFormOpen}
        onSubmit={handleAddTokenAllocations}
        projectId={projectId}
      />

      {/* Bulk Status Update Dialog */}
      <BulkStatusUpdateDialog
        open={isBulkStatusUpdateOpen}
        onOpenChange={setIsBulkStatusUpdateOpen}
        title="Update Allocation Status"
        description="Change the status of selected allocations"
        selectedCount={selectedAllocationIds.length}
        statusOptions={[
          { value: "confirmed", label: "Confirmed" },
          { value: "unconfirmed", label: "Unconfirmed" },
          { value: "distributed", label: "Distributed" },
          { value: "not_distributed", label: "Not Distributed" },
        ]}
        onConfirm={async (newStatus) => {
          try {
            if (!projectId || selectedAllocationIds.length === 0) return;

            const now = new Date().toISOString();
            const updates: Record<string, any> = { updated_at: now };

            if (newStatus === "confirmed") {
              updates.allocation_date = now;
            } else if (newStatus === "unconfirmed") {
              updates.allocation_date = null;
            } else if (newStatus === "distributed") {
              updates.distributed = true;
              updates.distribution_date = now;
            } else if (newStatus === "not_distributed") {
              updates.distributed = false;
              updates.distribution_date = null;
            }

            // Update all selected allocations
            const { error } = await supabase
              .from("token_allocations")
              .update(updates)
              .in("id", selectedAllocationIds);

            if (error) throw error;

            // Update local state
            setAllocations((prev) =>
              prev.map((a) => {
                if (selectedAllocationIds.includes(a.id)) {
                  const updated = { ...a };

                  if (newStatus === "confirmed") {
                    updated.allocationConfirmed = true;
                  } else if (newStatus === "unconfirmed") {
                    updated.allocationConfirmed = false;
                  } else if (newStatus === "distributed") {
                    updated.distributed = true;
                  } else if (newStatus === "not_distributed") {
                    updated.distributed = false;
                  }

                  return updated;
                }
                return a;
              }),
            );

            toast({
              title: "Success",
              description: `${selectedAllocationIds.length} allocations updated to ${newStatus}`,
            });

            // Clear selection
            setSelectedAllocationIds([]);
          } catch (err) {
            console.error("Error updating allocation status:", err);
            toast({
              title: "Error",
              description: "Failed to update allocation status",
              variant: "destructive",
            });
            throw err; // Re-throw to be caught by the dialog
          }
        }}
      />

      {/* Bulk Token Type Update Dialog */}
      <BulkTokenTypeUpdateDialog
        open={isBulkTokenTypeUpdateOpen}
        onOpenChange={setIsBulkTokenTypeUpdateOpen}
        availableTokens={availableTokens}
        onSubmit={handleBulkTokenTypeUpdate}
        selectedCount={selectedAllocationIds.length}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog 
        open={isBulkDeleteOpen} 
        onOpenChange={(open) => {
          setIsBulkDeleteOpen(open);
          // Give time for animation to complete before re-enabling focus
          if (!open) {
            setTimeout(() => {
              const bulkActionsButton = document.querySelector('[aria-haspopup="menu"]');
              if (bulkActionsButton instanceof HTMLElement) {
                bulkActionsButton.focus();
              }
            }, 100);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Allocations</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAllocationIds.length} allocation{selectedAllocationIds.length !== 1 && 's'}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleBulkDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedAllocationIds.length} Allocation{selectedAllocationIds.length !== 1 && 's'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Token Allocation Dialog */}
      <EditTokenAllocationDialog
        open={isEditAllocationOpen}
        onOpenChange={setIsEditAllocationOpen}
        allocation={currentEditAllocation}
        availableTokens={availableTokens}
        onSubmit={(tokenType, tokenId) => {
          if (currentEditAllocation) {
            handleUpdateTokenType(currentEditAllocation.id, tokenType, tokenId);
          }
        }}
      />
    </div>
  );
};

// Add a new component for bulk token type updates
interface BulkTokenTypeUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableTokens: any[];
  onSubmit: (tokenType: string, tokenId?: string) => void;
  selectedCount: number;
}

const BulkTokenTypeUpdateDialog = ({
  open,
  onOpenChange,
  availableTokens,
  onSubmit,
  selectedCount,
}: BulkTokenTypeUpdateDialogProps) => {
  const form = useForm<z.infer<typeof bulkTokenTypeSchema>>({
    resolver: zodResolver(bulkTokenTypeSchema),
    defaultValues: {
      token_type: "",
      token_id: undefined,
    },
  });

  // Only show available tokens that match the right format
  const filteredTokens = availableTokens.filter(token => 
    token.type && token.type.includes('(') && token.type.includes(')')
  );

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    
    // Reset form when dialog is closed
    if (!open) {
      form.reset();
      // Improve focus management
      setTimeout(() => {
        const bulkActionsButton = document.querySelector('[aria-haspopup="menu"]');
        if (bulkActionsButton instanceof HTMLElement) {
          bulkActionsButton.focus();
        }
      }, 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Update Token Types</DialogTitle>
          <DialogDescription>
            Update the token type for {selectedCount} selected allocation{selectedCount !== 1 && 's'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => {
            onSubmit(data.token_type, data.token_id);
            // Don't close the dialog here - let the onSubmit handler do it
          })} className="space-y-6">
            <div className="grid gap-4">
              <div className="p-4 border rounded-md bg-gray-50">
                <h4 className="font-medium">Update Information</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  You are about to update the token type for {selectedCount} allocation{selectedCount !== 1 && 's'}.
                  This action cannot be undone.
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="token_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Token Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // When token type changes, also update the token_id if available
                        field.onChange(value);
                        
                        // Find the selected token to get its ID
                        const selectedToken = filteredTokens.find(token => token.type === value);
                        
                        if (selectedToken?.id) {
                          // Update the token_id field
                          form.setValue("token_id", selectedToken.id);
                          console.log(`Setting token_id to ${selectedToken.id} for ${value}`);
                        } else {
                          // Clear token_id if no match found
                          form.setValue("token_id", undefined);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select token type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredTokens.map((token) => (
                          <SelectItem key={token.id} value={token.type}>
                            {token.type} ({token.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Hidden field for token_id */}
              <FormField
                control={form.control}
                name="token_id"
                render={({ field }) => (
                  <input type="hidden" {...field} value={field.value || ""} />
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update {selectedCount} Allocation{selectedCount !== 1 && 's'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Add new component for editing token allocation
interface EditTokenAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocation: any;
  availableTokens: any[];
  onSubmit: (tokenType: string, tokenId?: string) => void;
}

const editAllocationSchema = z.object({
  token_type: z.string().min(1, { message: "Token type is required" }),
  token_id: z.string().optional(),
});

const EditTokenAllocationDialog = ({
  open,
  onOpenChange,
  allocation,
  availableTokens,
  onSubmit,
}: EditTokenAllocationDialogProps) => {
  const form = useForm<z.infer<typeof editAllocationSchema>>({
    resolver: zodResolver(editAllocationSchema),
    defaultValues: {
      token_type: allocation?.tokenType || "",
      token_id: allocation?.tokenId || undefined,
    },
  });

  // Reset form when allocation changes
  React.useEffect(() => {
    if (allocation) {
      form.reset({
        token_type: allocation.tokenType,
        token_id: allocation.tokenId || undefined,
      });
    }
  }, [allocation, form]);

  if (!allocation) return null;

  // Only show available tokens that match the right format
  const filteredTokens = availableTokens.filter(token => 
    token.type && token.type.includes('(') && token.type.includes(')')
  );

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    
    // Reset form when dialog is closed
    if (!open) {
      // Focus management - find the relevant row in the table
      setTimeout(() => {
        const row = document.querySelector(`[data-allocation-id="${allocation.id}"]`);
        if (row instanceof HTMLElement) {
          const actionButton = row.querySelector('button');
          if (actionButton instanceof HTMLElement) {
            actionButton.focus();
          }
        }
      }, 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Token Allocation</DialogTitle>
          <DialogDescription>
            Update the token type for {allocation?.investorName}'s allocation
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => {
            onSubmit(data.token_type, data.token_id);
            // The calling component will close the dialog
          })} className="space-y-6">
            <div className="grid gap-4">
              <div className="p-4 border rounded-md bg-gray-50">
                <h4 className="font-medium">Allocation Details</h4>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <p className="text-gray-500">Investor:</p>
                    <p>{allocation?.investorName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount:</p>
                    <p>{allocation?.allocatedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Subscription:</p>
                    <p>{allocation?.currency} {allocation?.fiatAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Type:</p>
                    <p className="font-mono">{allocation?.tokenType}</p>
                  </div>
                  {allocation?.tokenId && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Token ID:</p>
                      <p className="font-mono text-xs truncate">{allocation?.tokenId}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="token_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // When token type changes, also update the token_id if available
                        field.onChange(value);
                        
                        // Find the selected token to get its ID
                        const selectedToken = filteredTokens.find(token => token.type === value);
                        
                        if (selectedToken?.id) {
                          // Update the token_id field
                          form.setValue("token_id", selectedToken.id);
                          console.log(`Setting token_id to ${selectedToken.id} for ${value}`);
                        } else {
                          // Clear token_id if no match found
                          form.setValue("token_id", undefined);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select token type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredTokens.map((token) => (
                          <SelectItem key={token.id} value={token.type}>
                            {token.type} ({token.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Hidden field for token_id */}
              <FormField
                control={form.control}
                name="token_id"
                render={({ field }) => (
                  <input type="hidden" {...field} value={field.value || ""} />
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TokenAllocationManager;
