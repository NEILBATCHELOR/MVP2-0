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
import { supabase } from "@/infrastructure/database/client";
import {
  Search,
  RefreshCw,
  Send,
  CheckCircle,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  ListFilter,
  SlidersHorizontal,
  Plus,
  Copy,
  MoreHorizontal,
  Loader2,
  Columns2,
  X,
  Check,
  Trash,
  Edit,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import TokenDistributionDialog from "./TokenDistributionDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { TokenAllocation } from "@/types/core/centralModels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/utils";
import { 
  getTokenTypeTheme, 
  extractStandard, 
  formatNumber, 
  formatTokenType, 
  generateUUID 
} from "@/utils/shared/tokenThemeUtils";

interface TokenDistributionManagerProps {
  projectId: string;
  projectName?: string;
}

const TokenDistributionManager = ({
  projectId,
  projectName = "Project",
}: TokenDistributionManagerProps) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [allocations, setAllocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDistributionDialogOpen, setIsDistributionDialogOpen] = useState(false);
  const [selectedAllocations, setSelectedAllocations] = useState<string[]>([]);
  const [tokenTypeFilter, setTokenTypeFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const [sortColumn, setSortColumn] = useState<string>("investorName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "investorName", "tokenType", "tokenAmount", "status", "walletAddress", "distributionDate", "txHash"
  ]);
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [isBulkDistributeOpen, setIsBulkDistributeOpen] = useState(false);

  // Available columns for the table
  const availableColumns = [
    { id: "investorName", label: "Investor" },
    { id: "tokenType", label: "Token Type" },
    { id: "tokenAmount", label: "Amount" },
    { id: "status", label: "Status" },
    { id: "walletAddress", label: "Wallet Address" },
    { id: "distributionDate", label: "Distribution Date" },
    { id: "txHash", label: "Transaction Hash" }
  ];

  // Fetch data when component mounts
  useEffect(() => {
    if (projectId) {
      fetchTokenAllocations();
    }
  }, [projectId]);

  const fetchTokenAllocations = async () => {
    try {
      setIsLoading(true);

      // Fetch token allocations from the database
      const { data: allocationsData, error: allocationsError } = await supabase
        .from("token_allocations")
        .select(
          `
          id,
          investor_id,
          subscription_id,
          token_type,
          token_amount,
          distributed,
          distribution_date,
          distribution_tx_hash,
          allocation_date,
          notes,
          standard,
          symbol,
          token_id,
          subscriptions!inner(confirmed, allocated, subscription_id, currency, fiat_amount),
          investors!inner(name, email, wallet_address)
        `,
        )
        .eq("project_id", projectId)
        .not("allocation_date", "is", null); // Only get confirmed allocations

      if (allocationsError) throw allocationsError;

      // Now fetch the token_symbols and to_address from distributions table
      const { data: distributionsData, error: distributionsError } = await supabase
        .from("distributions")
        .select("token_allocation_id, token_symbol, to_address")
        .eq("project_id", projectId);

      if (distributionsError) throw distributionsError;

      // Create a map of allocation_id to token_symbol and to_address
      const tokenSymbolMap = {};
      const toAddressMap = {};
      distributionsData?.forEach(item => {
        if (item.token_symbol) {
          tokenSymbolMap[item.token_allocation_id] = item.token_symbol;
        }
        if (item.to_address) {
          toAddressMap[item.token_allocation_id] = item.to_address;
        }
      });

      // Transform data for the table
      const transformedAllocations = allocationsData?.map((allocation) => {
        const tokenSymbol = tokenSymbolMap[allocation.id] || allocation.symbol || "";
        const destinationAddress = toAddressMap[allocation.id] || allocation.investors.wallet_address || "";
        
        // Extract standard from token_type or use standard column
        let tokenStandard = allocation.standard ? allocation.standard.replace(/-/g, '') : "";
        if (!tokenStandard) {
          tokenStandard = extractStandard(allocation.token_type);
        }

        // Try to extract token name and symbol from token_type (format: "Name (Symbol)")
        const tokenTypeMatch = allocation.token_type.match(/(.+?)\s*(?:\((.+?)\))?(?:\s*-\s*(.+))?/);
        let tokenName = allocation.token_type;
        let extractedSymbol = "";
        
        if (tokenTypeMatch) {
          tokenName = tokenTypeMatch[1]?.trim() || allocation.token_type;
          extractedSymbol = tokenTypeMatch[2]?.trim() || "";
          if (!tokenStandard && tokenTypeMatch[3]) {
            tokenStandard = tokenTypeMatch[3].trim().replace(/-/g, '').toUpperCase();
          }
        }
        
        // Format token type to include standard if available
        let formattedTokenType = allocation.token_type;
        if (tokenStandard && !formattedTokenType.includes(tokenStandard)) {
          formattedTokenType = extractedSymbol 
            ? `${tokenName} (${extractedSymbol}) - ${tokenStandard}`
            : `${tokenName} - ${tokenStandard}`;
        }
        
        return {
          id: allocation.id,
          investorId: allocation.investor_id,
          investorName: allocation.investors.name,
          investorEmail: allocation.investors.email,
          walletAddress: destinationAddress, // Use destination address from distributions or fallback to investor wallet
          distributionAddress: toAddressMap[allocation.id] || "", // Original to_address from distributions
          investorWalletAddress: allocation.investors.wallet_address || "", // Original wallet from investor
          subscriptionId: allocation.subscriptions.subscription_id,
          currency: allocation.subscriptions.currency,
          fiatAmount: allocation.subscriptions.fiat_amount,
          tokenType: formattedTokenType,
          tokenName: tokenName,
          tokenSymbol: tokenSymbol || extractedSymbol,
          tokenStandard: tokenStandard,
          tokenId: allocation.token_id,
          tokenAmount: allocation.token_amount,
          distributed: allocation.distributed,
          distributionDate: allocation.distribution_date,
          distributionTxHash: allocation.distribution_tx_hash,
          allocationDate: allocation.allocation_date,
          notes: allocation.notes,
          confirmed: allocation.subscriptions.confirmed,
          allocated: allocation.subscriptions.allocated,
          isUpdating: false, // Added for tracking loading state
        };
      });

      setAllocations(transformedAllocations || []);
    } catch (err) {
      console.error("Error fetching token allocations:", err);
      toast({
        title: "Error",
        description: "Failed to load token allocation data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique token types for filtering
  const tokenTypes = useMemo(() => [...new Set(allocations.map((a) => a.tokenType))].sort(), [allocations]);

  // Group allocations by token type with useMemo
  const groupedAllocations = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    allocations.forEach((allocation) => {
      const tokenType = allocation.tokenType || "Unknown";
      if (!grouped[tokenType]) {
        grouped[tokenType] = [];
      }
      grouped[tokenType].push(allocation);
    });
    
    return grouped;
  }, [allocations]);

  // Calculate token summaries for the stats cards with useMemo
  const tokenSummaries = useMemo(() => tokenTypes.map(type => {
    const typeAllocations = allocations.filter(a => a.tokenType === type);
    const totalAmount = typeAllocations.reduce((sum, a) => sum + a.tokenAmount, 0);
    const distributedAmount = typeAllocations
      .filter(a => a.distributed)
      .reduce((sum, a) => sum + a.tokenAmount, 0);
    const distributedCount = typeAllocations.filter(a => a.distributed).length;
    const pendingCount = typeAllocations.filter(a => !a.distributed).length;
    
    // Find the standard from the first allocation with this token type
    const firstAllocation = typeAllocations[0];
    const tokenStandard = firstAllocation?.tokenStandard || "";
    
    return {
      tokenType: type,
      tokenStandard: tokenStandard,
      totalAmount,
      distributedAmount,
      distributedCount,
      pendingCount,
      totalCount: typeAllocations.length,
      percentDistributed: typeAllocations.length > 0 
        ? Math.round((distributedCount / typeAllocations.length) * 100) 
        : 0,
      tokenSymbols: [...new Set(typeAllocations.filter(a => a.tokenSymbol).map(a => a.tokenSymbol))]
    };
  }), [tokenTypes, allocations]);

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
    setStatusFilter("all");
    setTokenTypeFilter("all");
    setColumnFilters({});
  };

  // Filter allocations based on all filtering criteria with useMemo
  const filteredAllocations = useMemo(() => {
    return allocations.filter((allocation) => {
      // Match search query
      const matchesSearch =
        allocation.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        allocation.investorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        allocation.tokenType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (allocation.walletAddress && allocation.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()));

      // Match token type filter
      const matchesTokenType = tokenTypeFilter === "all" || allocation.tokenType === tokenTypeFilter;

      // Match status filter
      const matchesStatus = statusFilter === "all" || (statusFilter === "distributed" ? allocation.distributed : !allocation.distributed);

      // Apply column filters
      const matchesColumnFilters = Object.entries(columnFilters).every(
        ([column, filterValue]) => {
          if (!filterValue) return true;
          const value = String(allocation[column] || "").toLowerCase();
          return value.includes(filterValue.toLowerCase());
        },
      );

      return matchesSearch && matchesTokenType && matchesStatus && matchesColumnFilters;
    });
  }, [allocations, searchQuery, tokenTypeFilter, statusFilter, columnFilters]);

  // Sort the filtered allocations with useMemo
  const sortedAllocations = useMemo(() => {
    return [...filteredAllocations].sort((a, b) => {
      let valueA = a[sortColumn];
      let valueB = b[sortColumn];

      // Handle special cases for sorting
      if (sortColumn === "tokenAmount" || sortColumn === "fiatAmount") {
        valueA = Number(valueA) || 0;
        valueB = Number(valueB) || 0;
      } else if (sortColumn === "distributionDate") {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      } else {
        valueA = String(valueA || "").toLowerCase();
        valueB = String(valueB || "").toLowerCase();
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredAllocations, sortColumn, sortDirection]);

  // Toggle card collapse state
  const toggleCardCollapse = (tokenType: string) => {
    setCollapsedCards(prev => ({
      ...prev,
      [tokenType]: !prev[tokenType]
    }));
  };

  // Handle distribute tokens
  const handleDistributeTokens = async (allocationsToDistribute: string[]) => {
    try {
      // In a real implementation, this would interact with a blockchain
      // For now, we'll just update the database
      const now = new Date().toISOString();

      // Update allocations to mark as distributed and set to loading state
      setAllocations(prev => 
        prev.map(a => allocationsToDistribute.includes(a.id) ? { ...a, isUpdating: true } : a)
      );

      // Update the allocations to mark them as distributed
      const { error } = await supabase
        .from("token_allocations")
        .update({
          distributed: true,
          distribution_date: now,
          distribution_tx_hash: generateUUID(),
        })
        .in("id", allocationsToDistribute);

      if (error) throw error;

      // Update local state
      setAllocations(prev => 
        prev.map(a => {
          if (allocationsToDistribute.includes(a.id)) {
            return {
              ...a,
              distributed: true,
              distributionDate: now,
              distributionTxHash: generateUUID(),
              isUpdating: false
            };
          }
          return a;
        })
      );

      toast({
        title: "Tokens Distributed",
        description: `Successfully distributed tokens to ${allocationsToDistribute.length} allocation(s).`,
      });

      setIsDistributionDialogOpen(false);
      setSelectedAllocations([]);
    } catch (err) {
      console.error("Error distributing tokens:", err);
      
      // Clear loading state on error
      setAllocations(prev => 
        prev.map(a => allocationsToDistribute.includes(a.id) ? { ...a, isUpdating: false } : a)
      );
      
      toast({
        title: "Error",
        description: "Failed to distribute tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select allocations that are not already distributed
      setSelectedAllocations(
        filteredAllocations
          .filter((allocation) => !allocation.distributed)
          .map((allocation) => allocation.id),
      );
    } else {
      setSelectedAllocations([]);
    }
  };

  // Handle select allocation
  const handleSelectAllocation = (allocationId: string) => {
    setSelectedAllocations((prev) => {
      if (prev.includes(allocationId)) {
        return prev.filter((id) => id !== allocationId);
      } else {
        return [...prev, allocationId];
      }
    });
  };

  // Handle copy wallet address
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address).then(
      () => {
        toast({
          title: "Address copied",
          description: "Wallet address has been copied to clipboard",
        });
      },
      (err) => {
        toast({
          title: "Error copying address",
          description: "Could not copy the address to clipboard",
          variant: "destructive",
        });
      }
    );
  };

  // Handle copy transaction hash
  const handleCopyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash).then(
      () => {
        toast({
          title: "Transaction hash copied",
          description: "Transaction hash has been copied to clipboard",
        });
      },
      (err) => {
        toast({
          title: "Error copying transaction hash",
          description: "Could not copy the transaction hash to clipboard",
          variant: "destructive",
        });
      }
    );
  };

  // Add a helper function to get the sort indicator
  const getSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }
    return null;
  };

  // Handle exporting token distributions
  const handleExportDistributions = () => {
    try {
      const distributionsToExport = filteredAllocations.filter(a => a.distributed);
      
      if (distributionsToExport.length === 0) {
        toast({
          title: "No Data",
          description: "No distributions to export",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare export data
      const exportData = distributionsToExport.map(a => ({
        investor_name: a.investorName,
        investor_email: a.investorEmail,
        wallet_address: a.walletAddress || "",
        token_type: a.tokenType,
        token_amount: a.tokenAmount,
        distribution_date: a.distributionDate ? new Date(a.distributionDate).toLocaleDateString() : "",
        distribution_tx_hash: a.distributionTxHash || ""
      }));
      
      // Convert to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map(row => 
          headers.map(key => 
            typeof row[key] === "string" && row[key].includes(",") 
              ? `"${row[key]}"` 
              : row[key]
          ).join(",")
        )
      ].join("\n");
      
      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `token_distributions_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} token distributions`
      });
    } catch (err) {
      console.error("Error exporting distributions:", err);
      toast({
        title: "Export Failed",
        description: "Could not export token distributions"
      });
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{projectName} Token Distributions</h1>
          {isLoading && (
            <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex gap-2">
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              if (selectedAllocations.length > 0) {
                setIsDistributionDialogOpen(true);
              } else {
                toast({
                  title: "No Allocations Selected",
                  description:
                    "Please select at least one allocation to distribute.",
                  variant: "destructive",
                });
              }
            }}
            disabled={selectedAllocations.length === 0}
          >
            <Send className="h-4 w-4" />
            <span>Distribute Selected</span>
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

        {/* Distributed Status Summary */}
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Distributed Allocations
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {
                    allocations.filter((a) => a.distributed).length
                  }
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {allocations.length > 0
                    ? Math.round(
                        (allocations.filter(
                          (a) => a.distributed
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
                  {tokenTypes.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Type Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {tokenSummaries.map((summary) => {
          // Get theme based on token standard and type
          const theme = getTokenTypeTheme(summary.tokenStandard || summary.tokenType);
          const isCollapsed = collapsedCards[summary.tokenType] || false;
          
          // Extract display name (without standard)
          const displayName = summary.tokenType;
          
          return (
            <Card 
              key={summary.tokenType} 
              className={cn("border", theme.border, theme.bg, "transition-all duration-200")}
              style={{
                // Force inline styles to override any CSS classes
                backgroundColor: theme.bg.includes('blue') ? '#EFF6FF' : 
                                 theme.bg.includes('purple') ? '#F3E8FF' : 
                                 theme.bg.includes('amber') ? '#FFFBEB' : 
                                 theme.bg.includes('green') ? '#ECFDF5' : 
                                 theme.bg.includes('pink') ? '#FDF2F8' : 
                                 theme.bg.includes('cyan') ? '#ECFEFF' : 
                                 '#F9FAFB',
                borderColor: theme.border.includes('blue') ? '#BFDBFE' : 
                             theme.border.includes('purple') ? '#DDD6FE' : 
                             theme.border.includes('amber') ? '#FDE68A' : 
                             theme.border.includes('green') ? '#A7F3D0' : 
                             theme.border.includes('pink') ? '#FBCFE8' : 
                             theme.border.includes('cyan') ? '#A5F3FC' : 
                             '#E5E7EB',
              }}
            >
              <CardHeader className="pb-2">
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleCardCollapse(summary.tokenType)}
                >
                  <CardTitle className="text-lg flex items-center gap-2">
                    {summary.tokenType.toLowerCase().includes('factoring') ? 'FACTORING (MRA)' : displayName.toUpperCase()}
                    {summary.tokenStandard && (
                    <Badge className={cn("font-mono", theme.badge)} style={{
                    backgroundColor: theme.badge.includes('blue') ? '#DBEAFE' : 
                    theme.badge.includes('purple') ? '#F3E8FF' :
                    theme.badge.includes('amber') ? '#FEF3C7' :
                    theme.badge.includes('green') ? '#D1FAE5' :
                    theme.badge.includes('pink') ? '#FCE7F3' :
                    theme.badge.includes('cyan') ? '#CFFAFE' :
                                      '#F3F4F6'
                    }}>
                      {summary.tokenStandard}
                      </Badge>
                      )}
                      </CardTitle>
                    <Button variant="ghost" size="icon" className={theme.text}>
                      {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                  </div>
                  {!isCollapsed && (
                    <CardDescription className={theme.text}>
                      {summary.totalCount} allocations with {summary.distributedCount} distributed
                    </CardDescription>
                  )}
                </CardHeader>
                
                {!isCollapsed && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h3 className={cn("text-sm font-medium", theme.text)}>Total Allocations</h3>
                        <p className="text-xl font-bold">
                          {formatNumber(summary.totalAmount)}
                        </p>
                      </div>
                      <div>
                        <h3 className={cn("text-sm font-medium", theme.text)}>Distributed</h3>
                        <p className="text-xl font-bold">
                          {summary.distributedCount} / {summary.totalCount}
                        </p>
                      </div>
                      <div>
                        <h3 className={cn("text-sm font-medium", theme.text)}>Distribution %</h3>
                        <p className="text-xl font-bold">
                          {summary.percentDistributed}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${summary.percentDistributed}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(summary.distributedAmount)} distributed
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(summary.totalAmount - summary.distributedAmount)} pending
                        </span>
                      </div>
                    </div>

                    {summary.tokenSymbols.length > 0 && (
                      <div className="flex gap-1 mt-4">
                        {summary.tokenSymbols.map((symbol, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className={cn("text-xs", theme.badge)}
                            style={{
                              backgroundColor: theme.badge.includes('blue') ? '#DBEAFE' : 
                                              theme.badge.includes('purple') ? '#F3E8FF' :
                                              theme.badge.includes('amber') ? '#FEF3C7' :
                                              theme.badge.includes('green') ? '#D1FAE5' :
                                              theme.badge.includes('pink') ? '#FCE7F3' :
                                              theme.badge.includes('cyan') ? '#CFFAFE' :
                                              '#F3F4F6'
                            }}
                          >
                            {symbol}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="distributed">Distributed</TabsTrigger>
                <TabsTrigger value="all">All Allocations</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="pending" className="pt-4">
            <div className="grid grid-cols-1 gap-6">
              {/* Action buttons */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Pending Distributions</h2>
                  <p className="text-sm text-muted-foreground">
                    Distribute tokens to investors
                    {selectedAllocations.length > 0 && ` • ${selectedAllocations.length} selected`}
                  </p>
                </div>
                {selectedAllocations.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAllocations([])}
                    >
                      Clear Selection
                    </Button>
                    <Button
                      onClick={() => setIsDistributionDialogOpen(true)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Distribute Selected
                    </Button>
                  </div>
                )}
              </div>
              


              {isLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                  <p className="mt-2 text-gray-500">Loading allocations...</p>
                </div>
              ) : sortedAllocations.filter(a => !a.distributed).length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Pending Distributions</CardTitle>
                    <CardDescription>
                      All allocations have been distributed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-8 text-gray-500">
                      All token allocations have been distributed to investors.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Pending Token Distributions</CardTitle>
                    <CardDescription>
                      Select allocations to distribute tokens to investors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                  <div className="rounded-md border">
                  <div className="flex items-center p-4 border-b justify-between">
                  <div className="flex flex-1 items-center">
                  <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                  placeholder="Search allocations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8"
                  />
                  </div>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportDistributions}
                  className="ml-2"
                  >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  </Button>
                  </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={fetchTokenAllocations} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                      </Button>
                      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 p-0">
                            <Filter className="h-4 w-4" />
                            {Object.keys(columnFilters).length > 0 || statusFilter !== "all" || tokenTypeFilter !== "all" ? (
                              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                            ) : null}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4" align="end">
                          <div className="space-y-4">
                            <h4 className="font-medium">Filter Distributions</h4>
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium">Status</h5>
                              <Select
                                value={statusFilter}
                                onValueChange={(value) => setStatusFilter(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All statuses</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="distributed">Distributed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {tokenTypes.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium">Token Type</h5>
                                <Select
                                  value={tokenTypeFilter}
                                  onValueChange={(value) => setTokenTypeFilter(value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="All token types" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All token types</SelectItem>
                                    {tokenTypes.map(type => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              </div>
                            )}
                            
                            <div className="flex justify-between pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={resetFilters}
                              >
                                Reset
                              </Button>
                              <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                                Apply
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Popover open={isColumnSelectorOpen} onOpenChange={setIsColumnSelectorOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 p-0">
                            <Columns2 className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-4" align="end">
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
                                                </div>
                                      </div>
                                      <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-12">
                                            <Checkbox
                                              checked={
                                                selectedAllocations.length > 0 &&
                                                selectedAllocations.length ===
                                                  sortedAllocations.filter(
                                                    (a) => !a.distributed
                                                  ).length
                                              }
                                              onCheckedChange={handleSelectAll}
                                              aria-label="Select all"
                                              id="select-all"
                                            />
                                          </TableHead>
                                          
                                          {visibleColumns.includes("investorName") && (
                                            <TableHead 
                                              className={cn("cursor-pointer", "hover:bg-gray-50")}
                                              onClick={() => handleSort("investorName")}
                                            >
                                              <div className="flex items-center gap-1">
                                                Investor
                                                {sortColumn === "investorName" && getSortIndicator("investorName")}
                                              </div>
                                            </TableHead>
                                          )}
                                          
                                          {visibleColumns.includes("tokenType") && (
                                            <TableHead 
                                              className={cn("cursor-pointer", "hover:bg-gray-50")}
                                              onClick={() => handleSort("tokenType")}
                                            >
                                              <div className="flex items-center gap-1">
                                                Token
                                                {sortColumn === "tokenType" && getSortIndicator("tokenType")}
                                              </div>
                                            </TableHead>
                                          )}
                                          
                                          {visibleColumns.includes("tokenAmount") && (
                                            <TableHead 
                                              className={cn("text-right cursor-pointer", "hover:bg-gray-50")}
                                              onClick={() => handleSort("tokenAmount")}
                                            >
                                              <div className="flex items-center justify-end gap-1">
                                                Amount
                                                {sortColumn === "tokenAmount" && getSortIndicator("tokenAmount")}
                                              </div>
                                            </TableHead>
                                          )}
                                          
                                          {visibleColumns.includes("walletAddress") && (
                                            <TableHead 
                                              className={cn("cursor-pointer", "hover:bg-gray-50")}
                                              onClick={() => handleSort("walletAddress")}
                                            >
                                              <div className="flex items-center gap-1">
                                                Wallet Address
                                                {sortColumn === "walletAddress" && getSortIndicator("walletAddress")}
                                              </div>
                                            </TableHead>
                                          )}
                                          
                                          {visibleColumns.includes("status") && (
                                            <TableHead 
                                              className={cn("cursor-pointer", "hover:bg-gray-50")}
                                              onClick={() => handleSort("distributed")}
                                            >
                                              <div className="flex items-center gap-1">
                                                Status
                                                {sortColumn === "distributed" && getSortIndicator("distributed")}
                                              </div>
                                            </TableHead>
                                          )}
                                          
                                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {sortedAllocations
                                          .filter((allocation) => !allocation.distributed)
                                          .map((allocation) => (
                                            <TableRow key={allocation.id}>
                                              <TableCell>
                                                <Checkbox
                                                  checked={selectedAllocations.includes(
                                                    allocation.id
                                                  )}
                                                  onCheckedChange={() =>
                                                    handleSelectAllocation(allocation.id)
                                                  }
                                                  aria-label={`Select ${allocation.investorName}`}
                                                />
                                              </TableCell>
                                              
                                              {visibleColumns.includes("investorName") && (
                                                <TableCell>
                                                  <div className="font-medium">
                                                    {allocation.investorName}
                                                  </div>
                                                  <div className="text-sm text-muted-foreground">
                                                    {allocation.investorEmail}
                                                  </div>
                                                </TableCell>
                                              )}
                                              
                                              {visibleColumns.includes("tokenType") && (
                                                <TableCell>
                                                  {(() => {
                                                    // Extract the token standard
                                                    const standard = allocation.tokenStandard || extractStandard(allocation.tokenType || "");
                                                    
                                                    // Get the theme based on the standard directly
                                                    const theme = getTokenTypeTheme(standard || allocation.tokenType || "");
                                                    
                                                    // Split the token type to get name and standard separately
                                                    const tokenTypeParts = allocation.tokenType.split(" - ");
                                                    const displayName = tokenTypeParts[0] || allocation.tokenType;
                                                    
                                                    return (
                                                      <div className="space-y-1">
                                                        <Badge 
                                                          variant="outline" 
                                                          className={theme.badge}
                                                          style={{
                                                            // Force inline styles to override any CSS
                                                            backgroundColor: theme.badge.includes('blue') ? '#DBEAFE' : 
                                                                            theme.badge.includes('purple') ? '#F3E8FF' :
                                                                            theme.badge.includes('amber') ? '#FEF3C7' :
                                                                            theme.badge.includes('green') ? '#D1FAE5' :
                                                                            theme.badge.includes('pink') ? '#FCE7F3' :
                                                                            theme.badge.includes('cyan') ? '#CFFAFE' :
                                                                            '#F3F4F6',
                                                            color: theme.badge.includes('blue') ? '#1E40AF' : 
                                                            theme.badge.includes('purple') ? '#6B21A8' :
                                                            theme.badge.includes('amber') ? '#92400E' :
                                                            theme.badge.includes('green') ? '#065F46' :
                                                            theme.badge.includes('pink') ? '#9D174D' :
                                                            theme.badge.includes('cyan') ? '#155E75' :
                                                            '#1F2937'
                                                          }}
                                                        >
                                                          <span className="mr-1">{displayName.toUpperCase()}</span>
                                                          {standard && (
                                                            <span className="px-1 rounded text-xs font-mono">
                                                              {standard}
                                                            </span>
                                                          )}
                                                        </Badge>
                                                        {allocation.tokenSymbol && (
                                                          <Badge variant="outline" className="ml-1 text-xs">
                                                            {allocation.tokenSymbol}
                                                          </Badge>
                                                        )}
                                                        {allocation.notes && (
                                                          <div className="text-xs text-muted-foreground">
                                                            {allocation.notes}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })()}
                                                </TableCell>
                                              )}
                                              
                                              {visibleColumns.includes("tokenAmount") && (
                                                <TableCell className="text-right font-medium">
                                                  {formatNumber(allocation.tokenAmount)}
                                                </TableCell>
                                              )}
                                              
                                              {visibleColumns.includes("walletAddress") && (
                                                <TableCell>
                                                  {allocation.walletAddress ? (
                                                    <div className="flex items-center">
                                                      <span className="truncate">
                                                        {allocation.walletAddress}
                                                      </span>
                                                      <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 ml-1"
                                                        title="Copy Address"
                                                        onClick={() => handleCopyAddress(allocation.walletAddress || "")}
                                                      >
                                                        <Copy className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  ) : (
                                                    <Badge variant="outline" className="bg-purple-100 text-purple-800 opacity-50">
                                                      No Wallet
                                                    </Badge>
                                                  )}
                                                </TableCell>
                                              )}
                                              
                                              {visibleColumns.includes("status") && (
                                                <TableCell>
                                                  {allocation.isUpdating ? (
                                                    <div className="flex justify-center">
                                                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                  ) : (
                                                    <Badge variant="outline" className="bg-purple-100 text-purple-800 opacity-70">
                                                      Pending
                                                    </Badge>
                                                  )}
                                                </TableCell>
                                              )}
                                              
                                              <TableCell className="text-right">
                                                <DropdownMenu modal={false}>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button 
                                                      variant="ghost" 
                                                      className="h-8 w-8 p-0" 
                                                      disabled={allocation.isUpdating}
                                                    >
                                                      <span className="sr-only">Open menu</span>
                                                      {allocation.isUpdating ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                      ) : (
                                                        <MoreHorizontal className="h-4 w-4" />
                                                      )}
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end" forceMount>
                                                    <DropdownMenuItem 
                                                      onClick={() => {
                                                        setSelectedAllocations([allocation.id]);
                                                        setIsDistributionDialogOpen(true);
                                                      }}
                                                      disabled={allocation.isUpdating}
                                                    >
                                                      <Send className="mr-2 h-4 w-4" />
                                                      Distribute Token
                                                    </DropdownMenuItem>
                                                    {allocation.walletAddress && (
                                                      <DropdownMenuItem
                                                        onClick={() => handleCopyAddress(allocation.walletAddress || "")}
                                                      >
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Copy Wallet Address
                                                      </DropdownMenuItem>
                                                    )}
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="distributed" className="pt-4">
                          <div className="grid grid-cols-1 gap-6">
                            <div className="flex justify-between items-center">
                              <div>
                                <h2 className="text-xl font-semibold">Distributed Tokens</h2>
                                <p className="text-sm text-muted-foreground">
                                  View all completed token distributions
                                </p>
                              </div>
                              <div className="flex gap-2">
                              <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleExportDistributions}
                              >
                              <Download className="h-4 w-4 mr-2" />
                              Export
                              </Button>
                              </div>
                            </div>

                            {isLoading ? (
                              <div className="p-8 text-center">
                                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                                <p className="mt-2 text-gray-500">Loading allocations...</p>
                              </div>
                            ) : sortedAllocations.filter(a => a.distributed).length === 0 ? (
                              <Card>
                                <CardHeader>
                                  <CardTitle>No Distributed Tokens</CardTitle>
                                  <CardDescription>
                                    No token distributions have been completed yet.
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-center py-8 text-gray-500">
                                    Once tokens are distributed, they will appear here.
                                  </p>
                                </CardContent>
                              </Card>
                            ) : (
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle>Distributed Tokens</CardTitle>
                                  <CardDescription>
                                    Tokens that have been distributed to investors
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                <div className="rounded-md border">
                                <div className="flex items-center p-4 border-b justify-between">
                                        <div className="flex flex-1 items-center">
                                          <div className="relative flex-grow">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                              placeholder="Search allocations..."
                                              value={searchQuery}
                                              onChange={(e) => setSearchQuery(e.target.value)}
                                              className="w-full pl-8"
                                            />
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleExportDistributions}
                                            className="ml-2"
                                          >
                                            <Download className="h-4 w-4 mr-2" />
                                            Export
                                          </Button>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Button variant="outline" size="icon" onClick={fetchTokenAllocations} disabled={isLoading}>
                                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                                          </Button>
                                          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                            <PopoverTrigger asChild>
                                              <Button variant="outline" size="icon" className="h-8 w-8 p-0">
                                                <Filter className="h-4 w-4" />
                                                {Object.keys(columnFilters).length > 0 || statusFilter !== "all" || tokenTypeFilter !== "all" ? (
                                                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                                                ) : null}
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-4" align="end">
                                              <div className="space-y-4">
                                                <h4 className="font-medium">Filter Distributions</h4>
                                                <div className="space-y-2">
                                                  <h5 className="text-sm font-medium">Status</h5>
                                                  <Select
                                                    value={statusFilter}
                                                    onValueChange={(value) => setStatusFilter(value)}
                                                  >
                                                    <SelectTrigger>
                                                      <SelectValue placeholder="All statuses" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem value="all">All statuses</SelectItem>
                                                      <SelectItem value="pending">Pending</SelectItem>
                                                      <SelectItem value="distributed">Distributed</SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                
                                                {tokenTypes.length > 0 && (
                                                  <div className="space-y-2">
                                                    <h5 className="text-sm font-medium">Token Type</h5>
                                                    <Select
                                                      value={tokenTypeFilter}
                                                      onValueChange={(value) => setTokenTypeFilter(value)}
                                                    >
                                                      <SelectTrigger>
                                                        <SelectValue placeholder="All token types" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="all">All token types</SelectItem>
                                                        {tokenTypes.map(type => (
                                                          <SelectItem key={type} value={type}>{type}</SelectItem>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                )}
                                                
                                                <div className="flex justify-between pt-2">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={resetFilters}
                                                  >
                                                    Reset
                                                  </Button>
                                                  <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                                                    Apply
                                                  </Button>
                                                </div>
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                          <Popover open={isColumnSelectorOpen} onOpenChange={setIsColumnSelectorOpen}>
                                            <PopoverTrigger asChild>
                                              <Button variant="outline" size="icon" className="h-8 w-8 p-0">
                                                <Columns2 className="h-4 w-4" />
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-60 p-4" align="end">
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
                                                            </div>
                                                          </div>
                                                          <Table>
                                                          <TableHeader>
                                                            <TableRow>
                                                              {visibleColumns.includes("investorName") && (
                                                                <TableHead 
                                                                  className={cn("cursor-pointer", "hover:bg-gray-50")}
                                                                  onClick={() => handleSort("investorName")}
                                                                >
                                                                  <div className="flex items-center gap-1">
                                                                    Investor
                                                                    {sortColumn === "investorName" && getSortIndicator("investorName")}
                                                                  </div>
                                                                </TableHead>
                                                              )}
                                                              
                                                              {visibleColumns.includes("tokenType") && (
                                                                <TableHead 
                                                                  className={cn("cursor-pointer", "hover:bg-gray-50")}
                                                                  onClick={() => handleSort("tokenType")}
                                                                >
                                                                  <div className="flex items-center gap-1">
                                                                    Token
                                                                    {sortColumn === "tokenType" && getSortIndicator("tokenType")}
                                                                  </div>
                                                                </TableHead>
                                                              )}
                                                              
                                                              {visibleColumns.includes("tokenAmount") && (
                                                                <TableHead 
                                                                  className={cn("text-right cursor-pointer", "hover:bg-gray-50")}
                                                                  onClick={() => handleSort("tokenAmount")}
                                                                >
                                                                  <div className="flex items-center justify-end gap-1">
                                                                    Amount
                                                                    {sortColumn === "tokenAmount" && getSortIndicator("tokenAmount")}
                                                                  </div>
                                                                </TableHead>
                                                              )}
                                                              
                                                              {visibleColumns.includes("distributionDate") && (
                                                                <TableHead 
                                                                  className={cn("cursor-pointer", "hover:bg-gray-50")}
                                                                  onClick={() => handleSort("distributionDate")}
                                                                >
                                                                  <div className="flex items-center gap-1">
                                                                    Distribution Date
                                                                    {sortColumn === "distributionDate" && getSortIndicator("distributionDate")}
                                                                  </div>
                                                                </TableHead>
                                                              )}
                                                              
                                                              {visibleColumns.includes("walletAddress") && (
                                                                <TableHead 
                                                                  className={cn("cursor-pointer", "hover:bg-gray-50")}
                                                                  onClick={() => handleSort("walletAddress")}
                                                                >
                                                                  <div className="flex items-center gap-1">
                                                                    Wallet Address
                                                                    {sortColumn === "walletAddress" && getSortIndicator("walletAddress")}
                                                                  </div>
                                                                </TableHead>
                                                              )}
                                                              
                                                              {visibleColumns.includes("txHash") && (
                                                                <TableHead 
                                                                  className={cn("cursor-pointer", "hover:bg-gray-50")}
                                                                  onClick={() => handleSort("distributionTxHash")}
                                                                >
                                                                  <div className="flex items-center gap-1">
                                                                    Transaction Hash
                                                                    {sortColumn === "distributionTxHash" && getSortIndicator("distributionTxHash")}
                                                                  </div>
                                                                </TableHead>
                                                              )}
                                                              
                                                              <TableHead className="w-[80px] text-right">Actions</TableHead>
                                                            </TableRow>
                                                          </TableHeader>
                                                          <TableBody>
                                                            {sortedAllocations
                                                              .filter((allocation) => allocation.distributed)
                                                              .map((allocation) => (
                                                                <TableRow key={allocation.id}>
                                                                  {visibleColumns.includes("investorName") && (
                                                                    <TableCell>
                                                                      <div className="font-medium">
                                                                        {allocation.investorName}
                                                                      </div>
                                                                      <div className="text-sm text-muted-foreground">
                                                                        {allocation.investorEmail}
                                                                      </div>
                                                                    </TableCell>
                                                                  )}
                                                                  
                                                                  {visibleColumns.includes("tokenType") && (
                                                                    <TableCell>
                                                                      {(() => {
                                                                        // Extract the token standard
                                                                        const standard = allocation.tokenStandard || extractStandard(allocation.tokenType || "");
                                                                        
                                                                        // Get the theme based on the standard directly
                                                                        const theme = getTokenTypeTheme(standard || allocation.tokenType || "");
                                                                        
                                                                        // Split the token type to get name and standard separately
                                                                        const tokenTypeParts = allocation.tokenType.split(" - ");
                                                                        const displayName = tokenTypeParts[0] || allocation.tokenType;
                                                                        
                                                                        return (
                                                                          <div className="space-y-1">
                                                                            <Badge 
                                                                              variant="outline" 
                                                                              className={theme.badge}
                                                                              style={{
                                                                                backgroundColor: theme.badge.includes('blue') ? '#DBEAFE' : 
                                                                                                theme.badge.includes('purple') ? '#F3E8FF' :
                                                                                                theme.badge.includes('amber') ? '#FEF3C7' :
                                                                                                theme.badge.includes('green') ? '#D1FAE5' :
                                                                                                theme.badge.includes('pink') ? '#FCE7F3' :
                                                                                                theme.badge.includes('cyan') ? '#CFFAFE' :
                                                                                                '#F3F4F6',
                                                                                color: theme.badge.includes('blue') ? '#1E40AF' : 
                                                                                       theme.badge.includes('purple') ? '#6B21A8' :
                                                                                       theme.badge.includes('amber') ? '#92400E' :
                                                                                       theme.badge.includes('green') ? '#065F46' :
                                                                                       theme.badge.includes('pink') ? '#9D174D' :
                                                                                       theme.badge.includes('cyan') ? '#155E75' :
                                                                                       '#1F2937'
                                                                                      }}
                                                                            >
                                                                              <span className="mr-1">{displayName.toUpperCase()}</span>
                                                                              {standard && (
                                                                                <span className="px-1 rounded text-xs font-mono">
                                                                                  {standard}
                                                                                </span>
                                                                              )}
                                                                            </Badge>
                                                                            {allocation.tokenSymbol && (
                                                                              <Badge variant="outline" className="ml-1 text-xs">
                                                                                {allocation.tokenSymbol}
                                                                              </Badge>
                                                                            )}
                                                                          </div>
                                                                        );
                                                                      })()}
                                                                    </TableCell>
                                                                  )}
                                                                  
                                                                  {visibleColumns.includes("tokenAmount") && (
                                                                    <TableCell className="text-right font-medium">
                                                                      {formatNumber(allocation.tokenAmount)}
                                                                    </TableCell>
                                                                  )}
                                                                  
                                                                  {visibleColumns.includes("distributionDate") && (
                                                                    <TableCell>
                                                                      {allocation.distributionDate
                                                                        ? new Date(
                                                                            allocation.distributionDate
                                                                          ).toLocaleDateString()
                                                                        : "N/A"}
                                                                    </TableCell>
                                                                  )}
                                                                  
                                                                  {visibleColumns.includes("walletAddress") && (
                                                                    <TableCell>
                                                                      {allocation.walletAddress ? (
                                                                        <div className="flex items-center">
                                                                          <span className="truncate">
                                                                            {allocation.walletAddress}
                                                                          </span>
                                                                          <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-5 w-5 ml-1"
                                                                            title="Copy Address"
                                                                            onClick={() => handleCopyAddress(allocation.walletAddress || "")}
                                                                          >
                                                                            <Copy className="h-3 w-3" />
                                                                          </Button>
                                                                        </div>
                                                                      ) : (
                                                                        <Badge variant="outline" className="bg-purple-100 text-purple-800 opacity-50">
                                                                          No Wallet
                                                                        </Badge>
                                                                      )}
                                                                    </TableCell>
                                                                  )}
                                                                  
                                                                  {visibleColumns.includes("txHash") && (
                                                                    <TableCell>
                                                                      {allocation.distributionTxHash ? (
                                                                        <div className="font-mono text-xs truncate max-w-[120px] flex items-center">
                                                                          <span className="truncate">
                                                                            {allocation.distributionTxHash}
                                                                          </span>
                                                                          <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-5 w-5 ml-1"
                                                                            title="Copy Transaction Hash"
                                                                            onClick={() => handleCopyTxHash(allocation.distributionTxHash || "")}
                                                                          >
                                                                            <Copy className="h-3 w-3" />
                                                                          </Button>
                                                                        </div>
                                                                      ) : (
                                                                        "N/A"
                                                                      )}
                                                                    </TableCell>
                                                                  )}
                                                                  
                                                                  <TableCell className="text-right">
                                                                    <DropdownMenu modal={false}>
                                                                      <DropdownMenuTrigger asChild>
                                                                        <Button 
                                                                          variant="ghost" 
                                                                          className="h-8 w-8 p-0" 
                                                                        >
                                                                          <span className="sr-only">Open menu</span>
                                                                          <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                      </DropdownMenuTrigger>
                                                                      <DropdownMenuContent align="end" forceMount>
                                                                        {allocation.walletAddress && (
                                                                          <DropdownMenuItem
                                                                            onClick={() => handleCopyAddress(allocation.walletAddress || "")}
                                                                          >
                                                                            <Copy className="mr-2 h-4 w-4" />
                                                                            Copy Wallet Address
                                                                          </DropdownMenuItem>
                                                                        )}
                                                                        {allocation.distributionTxHash && (
                                                                          <DropdownMenuItem
                                                                            onClick={() => handleCopyTxHash(allocation.distributionTxHash || "")}
                                                                          >
                                                                            <Copy className="mr-2 h-4 w-4" />
                                                                            Copy Transaction Hash
                                                                          </DropdownMenuItem>
                                                                        )}
                                                                      </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                  </TableCell>
                                                                </TableRow>
                                                              ))}
                                                          </TableBody>
                                                          <TableFooter>
                                                            <TableRow>
                                                              <TableCell colSpan={2} className="font-medium">
                                                                Total
                                                              </TableCell>
                                                              {visibleColumns.includes("tokenAmount") && (
                                                                <TableCell className="text-right font-bold">
                                                                  {formatNumber(
                                                                    sortedAllocations
                                                                      .filter(a => a.distributed)
                                                                      .reduce((sum, a) => sum + a.tokenAmount, 0)
                                                                  )}
                                                                </TableCell>
                                                              )}
                                                              <TableCell colSpan={3}></TableCell>
                                                            </TableRow>
                                                          </TableFooter>
                                                        </Table>
                                                    </div>
                                                    </CardContent>
                                                  </Card>
                                                )
                                              }
                                            </div>
                                          </TabsContent>


                                            <TabsContent value="all" className="pt-4">
                                              <div className="grid grid-cols-1 gap-6">
                                                <div className="flex justify-between items-center">
                                                  <div>
                                                    <h2 className="text-xl font-semibold">All Token Allocations</h2>
                                                    <p className="text-sm text-muted-foreground">
                                                      Complete view of all token allocations
                                                    </p>
                                                  </div>
                                                  <div className="flex gap-2">
                                                    <Button 
                                                      variant="outline" 
                                                      size="sm"
                                                      onClick={handleExportDistributions}
                                                    >
                                                      <Download className="h-4 w-4 mr-2" />
                                                      Export
                                                    </Button>
                                                  </div>
                                                </div>

                                                {isLoading ? (
                                                  <div className="p-8 text-center">
                                                    <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                                                    <p className="mt-2 text-gray-500">Loading allocations...</p>
                                                  </div>
                                                ) : sortedAllocations.length === 0 ? (
                                                  <Card>
                                                    <CardHeader>
                                                      <CardTitle>No Allocations Found</CardTitle>
                                                      <CardDescription>
                                                        No token allocations match your search criteria.
                                                      </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                      <p className="text-center py-8 text-gray-500">
                                                        Try adjusting your search or clear filters.
                                                      </p>
                                                    </CardContent>
                                                  </Card>
                                                ) : (
                                                  <Card>
                                                    <CardHeader className="pb-3">
                                                      <CardTitle>All Token Allocations</CardTitle>
                                                      <CardDescription>
                                                        Complete list of all token allocations
                                                      </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                      <div className="rounded-md border">
                                                        <div className="flex items-center p-4 border-b justify-between">
                                                            <div className="flex flex-1 items-center">
                                                              <div className="relative flex-grow">
                                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                                <Input
                                                                  placeholder="Search allocations..."
                                                                  value={searchQuery}
                                                                  onChange={(e) => setSearchQuery(e.target.value)}
                                                                  className="w-full pl-8"
                                                                />
                                                              </div>
                                                              <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={handleExportDistributions}
                                                                className="ml-2"
                                                              >
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Export
                                                              </Button>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                              <Button variant="outline" size="icon" onClick={fetchTokenAllocations} disabled={isLoading}>
                                                                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                                                              </Button>
                                                              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                                                <PopoverTrigger asChild>
                                                                  <Button variant="outline" size="icon" className="h-8 w-8 p-0">
                                                                    <Filter className="h-4 w-4" />
                                                                    {Object.keys(columnFilters).length > 0 || statusFilter !== "all" || tokenTypeFilter !== "all" ? (
                                                                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                                                                    ) : null}
                                                                  </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-64 p-4" align="end">
                                                                  <div className="space-y-4">
                                                                    <h4 className="font-medium">Filter Distributions</h4>
                                                                    <div className="space-y-2">
                                                                      <h5 className="text-sm font-medium">Status</h5>
                                                                      <Select
                                                                        value={statusFilter}
                                                                        onValueChange={(value) => setStatusFilter(value)}
                                                                      >
                                                                        <SelectTrigger>
                                                                          <SelectValue placeholder="All statuses" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                          <SelectItem value="all">All statuses</SelectItem>
                                                                          <SelectItem value="pending">Pending</SelectItem>
                                                                          <SelectItem value="distributed">Distributed</SelectItem>
                                                                        </SelectContent>
                                                                      </Select>
                                                                    </div>
                                                                    
                                                                    {tokenTypes.length > 0 && (
                                                                      <div className="space-y-2">
                                                                        <h5 className="text-sm font-medium">Token Type</h5>
                                                                        <Select
                                                                          value={tokenTypeFilter}
                                                                          onValueChange={(value) => setTokenTypeFilter(value)}
                                                                        >
                                                                          <SelectTrigger>
                                                                            <SelectValue placeholder="All token types" />
                                                                          </SelectTrigger>
                                                                          <SelectContent>
                                                                            <SelectItem value="all">All token types</SelectItem>
                                                                            {tokenTypes.map(type => (
                                                                              <SelectItem key={type} value={type}>{type}</SelectItem>
                                                                            ))}
                                                                          </SelectContent>
                                                                        </Select>
                                                                      </div>
                                                                    )}
                                                                    
                                                                    <div className="flex justify-between pt-2">
                                                                      <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={resetFilters}
                                                                      >
                                                                        Reset
                                                                      </Button>
                                                                      <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                                                                        Apply
                                                                      </Button>
                                                                    </div>
                                                                  </div>
                                                                </PopoverContent>
                                                              </Popover>
                                                              <Popover open={isColumnSelectorOpen} onOpenChange={setIsColumnSelectorOpen}>
                                                                <PopoverTrigger asChild>
                                                                  <Button variant="outline" size="icon" className="h-8 w-8 p-0">
                                                                    <Columns2 className="h-4 w-4" />
                                                                  </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-60 p-4" align="end">
                                                                  <div className="space-y-4">
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
                                                                                  </PopoverContent>
                                                                                </Popover>
                                                                              </div>
                                                                            </div>
                                                                            <Table>
                                                                            <TableHeader>
                                                                              <TableRow>
                                                                                {visibleColumns.includes("investorName") && (
                                                                                  <TableHead 
                                                                                    className={cn("cursor-pointer", "hover:bg-gray-50")}
                                                                                    onClick={() => handleSort("investorName")}
                                                                                  >
                                                                                    <div className="flex items-center gap-1">
                                                                                      Investor
                                                                                      {sortColumn === "investorName" && getSortIndicator("investorName")}
                                                                                    </div>
                                                                                  </TableHead>
                                                                                )}
                                                                                
                                                                                {visibleColumns.includes("tokenType") && (
                                                                                  <TableHead 
                                                                                    className={cn("cursor-pointer", "hover:bg-gray-50")}
                                                                                    onClick={() => handleSort("tokenType")}
                                                                                  >
                                                                                    <div className="flex items-center gap-1">
                                                                                      Token
                                                                                      {sortColumn === "tokenType" && getSortIndicator("tokenType")}
                                                                                    </div>
                                                                                  </TableHead>
                                                                                )}
                                                                                
                                                                                {visibleColumns.includes("tokenAmount") && (
                                                                                  <TableHead 
                                                                                    className={cn("text-right cursor-pointer", "hover:bg-gray-50")}
                                                                                    onClick={() => handleSort("tokenAmount")}
                                                                                  >
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                      Amount
                                                                                      {sortColumn === "tokenAmount" && getSortIndicator("tokenAmount")}
                                                                                    </div>
                                                                                  </TableHead>
                                                                                )}
                                                                                
                                                                                {visibleColumns.includes("status") && (
                                                                                  <TableHead 
                                                                                    className={cn("cursor-pointer", "hover:bg-gray-50")}
                                                                                    onClick={() => handleSort("distributed")}
                                                                                  >
                                                                                    <div className="flex items-center gap-1">
                                                                                      Status
                                                                                      {sortColumn === "distributed" && getSortIndicator("distributed")}
                                                                                    </div>
                                                                                  </TableHead>
                                                                                )}
                                                                                
                                                                                {visibleColumns.includes("distributionDate") && (
                                                                                  <TableHead 
                                                                                    className={cn("cursor-pointer", "hover:bg-gray-50")}
                                                                                    onClick={() => handleSort("distributionDate")}
                                                                                  >
                                                                                    <div className="flex items-center gap-1">
                                                                                      Distribution Date
                                                                                      {sortColumn === "distributionDate" && getSortIndicator("distributionDate")}
                                                                                    </div>
                                                                                  </TableHead>
                                                                                )}
                                                                                
                                                                                {visibleColumns.includes("walletAddress") && (
                                                                                  <TableHead 
                                                                                    className={cn("cursor-pointer", "hover:bg-gray-50")}
                                                                                    onClick={() => handleSort("walletAddress")}
                                                                                  >
                                                                                    <div className="flex items-center gap-1">
                                                                                      Wallet Address
                                                                                      {sortColumn === "walletAddress" && getSortIndicator("walletAddress")}
                                                                                    </div>
                                                                                  </TableHead>
                                                                                )}
                                                                                
                                                                                <TableHead className="w-[80px] text-right">Actions</TableHead>
                                                                              </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                              {sortedAllocations.map((allocation) => (
                                                                                <TableRow key={allocation.id}>
                                                                                  {visibleColumns.includes("investorName") && (
                                                                                    <TableCell>
                                                                                      <div className="font-medium">
                                                                                        {allocation.investorName}
                                                                                      </div>
                                                                                      <div className="text-sm text-muted-foreground">
                                                                                        {allocation.investorEmail}
                                                                                      </div>
                                                                                    </TableCell>
                                                                                  )}
                                                                                  
                                                                                  {visibleColumns.includes("tokenType") && (
                                                                                    <TableCell>
                                                                                      {(() => {
                                                                                        // Extract the token standard
                                                                                        const standard = allocation.tokenStandard || extractStandard(allocation.tokenType || "");
                                                                                        
                                                                                        // Get the theme based on the standard directly
                                                                                        const theme = getTokenTypeTheme(standard || allocation.tokenType || "");
                                                                                        
                                                                                        // Split the token type to get name and standard separately
                                                                                        const tokenTypeParts = allocation.tokenType.split(" - ");
                                                                                        const displayName = tokenTypeParts[0] || allocation.tokenType;
                                                                                        
                                                                                        return (
                                                                                          <div className="space-y-1">
                                                                                            <Badge 
                                                                                              variant="outline" 
                                                                                              className={theme.badge}
                                                                                              style={{
                                                                                                backgroundColor: theme.badge.includes('blue') ? '#DBEAFE' : 
                                                                                                                theme.badge.includes('purple') ? '#F3E8FF' :
                                                                                                                theme.badge.includes('amber') ? '#FEF3C7' :
                                                                                                                theme.badge.includes('green') ? '#D1FAE5' :
                                                                                                                theme.badge.includes('pink') ? '#FCE7F3' :
                                                                                                                theme.badge.includes('cyan') ? '#CFFAFE' :
                                                                                                                '#F3F4F6',
                                                                                                color: theme.badge.includes('blue') ? '#1E40AF' : 
                                                                                                       theme.badge.includes('purple') ? '#6B21A8' :
                                                                                                       theme.badge.includes('amber') ? '#92400E' :
                                                                                                       theme.badge.includes('green') ? '#065F46' :
                                                                                                       theme.badge.includes('pink') ? '#9D174D' :
                                                                                                       theme.badge.includes('cyan') ? '#155E75' :
                                                                                                       '#1F2937'
                                                                                                      }}
                                                                                            >
                                                                                              <span className="mr-1">{displayName.toUpperCase()}</span>
                                                                                              {standard && (
                                                                                                <span className="px-1 rounded text-xs font-mono">
                                                                                                  {standard}
                                                                                                </span>
                                                                                              )}
                                                                                            </Badge>
                                                                                            {allocation.tokenSymbol && (
                                                                                              <Badge variant="outline" className="ml-1 text-xs">
                                                                                                {allocation.tokenSymbol}
                                                                                              </Badge>
                                                                                            )}
                                                                                          </div>
                                                                                        );
                                                                                      })()}
                                                                                    </TableCell>
                                                                                  )}
                                                                                  
                                                                                  {visibleColumns.includes("tokenAmount") && (
                                                                                    <TableCell className="text-right font-medium">
                                                                                      {formatNumber(allocation.tokenAmount)}
                                                                                    </TableCell>
                                                                                  )}
                                                                                  
                                                                                  {visibleColumns.includes("status") && (
                                                                                    <TableCell>
                                                                                      {allocation.isUpdating ? (
                                                                                        <div className="flex justify-center">
                                                                                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                                                        </div>
                                                                                      ) : allocation.distributed ? (
                                                                                        <Badge className="bg-green-100 text-green-800">DISTRIBUTED</Badge>
                                                                                      ) : (
                                                                                        <Badge className="bg-yellow-100 text-yellow-800">PENDING</Badge>
                                                                                      )}
                                                                                    </TableCell>
                                                                                  )}
                                                                                  
                                                                                  {visibleColumns.includes("distributionDate") && (
                                                                                    <TableCell>
                                                                                      {allocation.distributionDate
                                                                                        ? new Date(
                                                                                            allocation.distributionDate
                                                                                          ).toLocaleDateString()
                                                                                        : "N/A"}
                                                                                    </TableCell>
                                                                                  )}
                                                                                  
                                                                                  {visibleColumns.includes("walletAddress") && (
                                                                                    <TableCell>
                                                                                      {allocation.walletAddress ? (
                                                                                        <div className="flex items-center">
                                                                                          <span className="truncate">
                                                                                            {allocation.walletAddress}
                                                                                          </span>
                                                                                          <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-5 w-5 ml-1"
                                                                                            title="Copy Address"
                                                                                            onClick={() => handleCopyAddress(allocation.walletAddress || "")}
                                                                                          >
                                                                                            <Copy className="h-3 w-3" />
                                                                                          </Button>
                                                                                        </div>
                                                                                      ) : (
                                                                                        <Badge variant="outline" className="bg-purple-100 text-purple-800 opacity-50">
                                                                                          No Wallet
                                                                                        </Badge>
                                                                                      )}
                                                                                    </TableCell>
                                                                                  )}
                                                                                  
                                                                                  <TableCell className="text-right">
                                                                                    <DropdownMenu modal={false}>
                                                                                      <DropdownMenuTrigger asChild>
                                                                                        <Button 
                                                                                          variant="ghost" 
                                                                                          className="h-8 w-8 p-0" 
                                                                                          disabled={allocation.isUpdating}
                                                                                        >
                                                                                          <span className="sr-only">Open menu</span>
                                                                                          {allocation.isUpdating ? (
                                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                                          ) : (
                                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                                          )}
                                                                                        </Button>
                                                                                      </DropdownMenuTrigger>
                                                                                      <DropdownMenuContent align="end" forceMount>
                                                                                        {!allocation.distributed && (
                                                                                          <DropdownMenuItem 
                                                                                            onClick={() => {
                                                                                              setSelectedAllocations([allocation.id]);
                                                                                              setIsDistributionDialogOpen(true);
                                                                                            }}
                                                                                            disabled={allocation.isUpdating}
                                                                                          >
                                                                                            <Send className="mr-2 h-4 w-4" />
                                                                                            Distribute Token
                                                                                          </DropdownMenuItem>
                                                                                        )}
                                                                                        {allocation.walletAddress && (
                                                                                          <DropdownMenuItem
                                                                                            onClick={() => handleCopyAddress(allocation.walletAddress || "")}
                                                                                          >
                                                                                            <Copy className="mr-2 h-4 w-4" />
                                                                                            Copy Wallet Address
                                                                                          </DropdownMenuItem>
                                                                                        )}
                                                                                        {allocation.distributionTxHash && (
                                                                                          <DropdownMenuItem
                                                                                            onClick={() => handleCopyTxHash(allocation.distributionTxHash || "")}
                                                                                          >
                                                                                            <Copy className="mr-2 h-4 w-4" />
                                                                                            Copy Transaction Hash
                                                                                          </DropdownMenuItem>
                                                                                        )}
                                                                                      </DropdownMenuContent>
                                                                                    </DropdownMenu>
                                                                                  </TableCell>
                                                                                </TableRow>
                                                                              ))}
                                                                            </TableBody>
                                                                            <TableFooter>
                                                                              <TableRow>
                                                                                <TableCell colSpan={2} className="font-medium">
                                                                                  Total
                                                                                </TableCell>
                                                                                {visibleColumns.includes("tokenAmount") && (
                                                                                  <TableCell className="text-right font-bold">
                                                                                    {formatNumber(
                                                                                      sortedAllocations.reduce((sum, a) => sum + a.tokenAmount, 0)
                                                                                    )}
                                                                                  </TableCell>
                                                                                )}
                                                                                <TableCell colSpan={3}></TableCell>
                                                                              </TableRow>
                                                                            </TableFooter>
                                                                          </Table>
                                                                        </div>
                                                                      </CardContent>
                                                                    </Card>
                                                                  )}
                                                                </div>
                                                              </TabsContent>
                                                            </Tabs>

                                                            {/* Distribution Dialog */}
                                                            <TokenDistributionDialog
                                                              open={isDistributionDialogOpen}
                                                              onOpenChange={setIsDistributionDialogOpen}
                                                              allocations={allocations.filter((a) =>
                                                                selectedAllocations.includes(a.id)
                                                              )}
                                                              onDistribute={handleDistributeTokens}
                                                            />

                                                            {/* Bulk Distribute Confirmation Dialog */}
                                                            <AlertDialog 
                                                              open={isBulkDistributeOpen} 
                                                              onOpenChange={setIsBulkDistributeOpen}
                                                            >
                                                              <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                  <AlertDialogTitle>Distribute Selected Tokens</AlertDialogTitle>
                                                                  <AlertDialogDescription>
                                                                    Are you sure you want to distribute {selectedAllocations.length} token allocation{selectedAllocations.length !== 1 ? 's' : ''}?
                                                                    This action cannot be undone.
                                                                  </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                  <AlertDialogAction 
                                                                    onClick={(e) => {
                                                                      e.preventDefault();
                                                                      handleDistributeTokens(selectedAllocations);
                                                                      setIsBulkDistributeOpen(false);
                                                                    }}
                                                                  >
                                                                    Distribute
                                                                  </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                              </AlertDialogContent>
                                                            </AlertDialog>
                                                          </div>
  );
};

export default TokenDistributionManager;
