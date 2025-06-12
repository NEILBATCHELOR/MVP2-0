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
  ArrowUp,
  ArrowDown,
  ListFilter,
  SlidersHorizontal,
  Plus,
  FlameIcon,
  MoreHorizontal,
  Loader2,
  Copy,
  Check,
  X,
  Trash,
  Columns2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenAllocation } from "@/types/core/centralModels";
import TokenMintingDialog from "./TokenMintingDialog";
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

interface TokenMintingManagerProps {
  projectId: string;
  projectName?: string;
}

interface TokenSummary {
  tokenType: string;
  tokenStandard: string | null;
  totalAmount: number;
  confirmedAmount: number;
  distributedAmount: number;
  mintedAmount: number;
  remainingToMint: number;
  totalCount: number;
  confirmedCount: number;
  distributedCount: number;
  mintedCount: number;
  status: string;
  readyToMint: boolean;
  isMinted: boolean;
  isPartiallyMinted: boolean;
  allocations: any[];
  tokenSymbols: string[];
}

interface MintAmount {
  tokenType: string;
  amount: number;
}

const TokenMintingManager = ({
  projectId,
  projectName = "Project",
}: TokenMintingManagerProps) => {
  const [activeTab, setActiveTab] = useState("minting");
  const [tokenSummaries, setTokenSummaries] = useState<TokenSummary[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMintDialogOpen, setIsMintDialogOpen] = useState(false);
  const [selectedTokenType, setSelectedTokenType] = useState<string | null>(null);
  const [selectedTokenTypes, setSelectedTokenTypes] = useState<string[]>([]);
  const [mintAmounts, setMintAmounts] = useState<MintAmount[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { toast } = useToast();
  const [sortColumn, setSortColumn] = useState<string>("tokenType");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "tokenType", "confirmedAmount", "mintedAmount", "remainingToMint", "status", "actions"
  ]);
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [isBulkMintOpen, setIsBulkMintOpen] = useState(false);

  // Available columns for the table
  const availableColumns = [
    { id: "tokenType", label: "Token Type" },
    { id: "confirmedAmount", label: "Confirmed Amount" },
    { id: "mintedAmount", label: "Minted Amount" },
    { id: "remainingToMint", label: "Remaining to Mint" },
    { id: "status", label: "Status" },
    { id: "actions", label: "Actions" }
  ];

  // Fetch data when component mounts
  useEffect(() => {
    if (projectId) {
      console.log(
        "TokenMintingManager: Fetching allocations for project ID:",
        projectId,
      );
      fetchTokenAllocations();
    } else {
      console.warn("TokenMintingManager: No project ID provided");
    }
  }, [projectId]);

  // Update token status whenever token summaries change
  useEffect(() => {
    if (tokenSummaries.length > 0) {
      updateTokenStatus();
    }
  }, []); // Using empty dependency array to run only once on mount to avoid infinite loop

  // Recalculate status for all token summaries to ensure it's up to date
  const updateTokenStatus = () => {
    const updatedSummaries = tokenSummaries.map((summary) => {
      const isPartiallyMinted =
        summary.mintedAmount > 0 && summary.remainingToMint > 0;
      let status = "pending";

      if (summary.confirmedAmount === 0) {
        status = "pending";
      } else if (isPartiallyMinted) {
        status = "partially_minted";
      } else if (summary.mintedAmount > 0 && summary.remainingToMint <= 0) {
        status = "minted";
      } else if (summary.confirmedAmount > 0) {
        status = "ready_to_mint";
      }

      if (summary.status !== status || 
          summary.readyToMint !== (summary.confirmedAmount > summary.mintedAmount) ||
          summary.isMinted !== (summary.mintedAmount > 0) ||
          summary.isPartiallyMinted !== isPartiallyMinted) {
        return {
          ...summary,
          status,
          readyToMint: summary.confirmedAmount > summary.mintedAmount,
          isMinted: summary.mintedAmount > 0,
          isPartiallyMinted,
        };
      }
      
      return summary;
    });
    
    const hasChanges = updatedSummaries.some((updated, index) => updated !== tokenSummaries[index]);
    if (hasChanges) {
      setTokenSummaries(updatedSummaries);
    }
  };

  const fetchTokenAllocations = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching token allocations for project ID:", projectId);

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
          minted,
          minting_date,
          minting_tx_hash,
          project_id,
          notes,
          standard,
          symbol,
          token_id,
          subscriptions!inner(confirmed, allocated, subscription_id, currency, fiat_amount),
          investors!inner(name, email, wallet_address)
        `,
        )
        .eq("project_id", projectId)
        .order("allocation_date", { ascending: true });

      console.log("Token allocations query result:", { data: allocationsData, error: allocationsError });

      if (allocationsError) throw allocationsError;

      // Fetch token symbols from distributions table
      const { data: distributionsData, error: distributionsError } = await supabase
        .from("distributions")
        .select("token_allocation_id, token_symbol, token_type")
        .eq("project_id", projectId);

      if (distributionsError) throw distributionsError;

      // Create a map of allocation_id to token_symbol
      const tokenSymbolMap = {};
      distributionsData?.forEach(item => {
        if (item.token_symbol) {
          tokenSymbolMap[item.token_allocation_id] = item.token_symbol;
        }
      });

      // Create a map of token_type to its symbols
      const tokenTypeToSymbolsMap = {};
      distributionsData?.forEach(item => {
        if (item.token_symbol && item.token_type) {
          if (!tokenTypeToSymbolsMap[item.token_type]) {
            tokenTypeToSymbolsMap[item.token_type] = new Set();
          }
          tokenTypeToSymbolsMap[item.token_type].add(item.token_symbol);
        }
      });

      // Transform allocation data with enhanced properties
      const transformedAllocations = allocationsData?.map(allocation => {
        const tokenSymbol = tokenSymbolMap[allocation.id] || allocation.symbol || "";
        
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
          ...allocation,
          tokenType: formattedTokenType,
          tokenName: tokenName,
          tokenSymbol: tokenSymbol || extractedSymbol,
          tokenStandard: tokenStandard,
          isUpdating: false // Add for tracking loading state
        };
      }) || [];
      
      // Store transformed allocations
      setAllocations(transformedAllocations);

      // Group allocations by token type
      const tokenGroups = transformedAllocations.reduce(
        (acc, allocation) => {
          const tokenType = allocation.tokenType || "Unassigned";
          if (!acc[tokenType]) {
            acc[tokenType] = [];
          }
          acc[tokenType].push(allocation);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      // Calculate summaries
      const summaries = Object.entries(tokenGroups).map(
        ([tokenType, allocations]) => {
          const totalAmount = allocations.reduce(
            (sum, a) => sum + (a.token_amount || 0),
            0,
          );

          const confirmedAllocations = allocations.filter(
            (a) => a.subscriptions.confirmed && a.subscriptions.allocated,
          );

          const confirmedAmount = confirmedAllocations.reduce(
            (sum, a) => sum + (a.token_amount || 0),
            0,
          );

          const mintedAllocations = allocations.filter(
            (a) => a.minted === true,
          );
          const mintedAmount = mintedAllocations.reduce(
            (sum, a) => sum + (a.token_amount || 0),
            0,
          );

          const distributedAllocations = allocations.filter(
            (a) => a.distributed,
          );
          const distributedAmount = distributedAllocations.reduce(
            (sum, a) => sum + (a.token_amount || 0),
            0,
          );

          // Get unique token symbols for this token type
          const tokenSymbols = [...new Set(
            allocations
              .filter(a => a.tokenSymbol)
              .map(a => a.tokenSymbol)
          )];

          // Add symbols from the tokenTypeToSymbolsMap if available
          if (tokenTypeToSymbolsMap[tokenType]) {
            const additionalSymbols = Array.from(tokenTypeToSymbolsMap[tokenType]);
            additionalSymbols.forEach(symbol => {
              if (!tokenSymbols.includes(symbol)) {
                tokenSymbols.push(symbol);
              }
            });
          }

          // Calculate remaining tokens to mint
          const remainingToMint = confirmedAmount - mintedAmount;

          // Determine if partially minted
          const isPartiallyMinted = mintedAmount > 0 && remainingToMint > 0;

          // Determine status
          let status = "pending";
          if (confirmedAmount === 0) {
            status = "pending";
          } else if (isPartiallyMinted) {
            status = "partially_minted";
          } else if (mintedAmount > 0 && remainingToMint <= 0) {
            status = "minted";
          } else if (confirmedAmount > 0) {
            status = "ready_to_mint";
          }

          // Extract standard from token type
          const tokenStandard = extractStandard(tokenType);

          return {
            tokenType,
            tokenStandard, // Use the extracted standard
            totalAmount,
            confirmedAmount,
            distributedAmount,
            mintedAmount,
            remainingToMint,
            totalCount: allocations.length,
            confirmedCount: confirmedAllocations.length,
            distributedCount: distributedAllocations.length,
            mintedCount: mintedAllocations.length,
            status,
            readyToMint: confirmedAmount > mintedAmount,
            isMinted: mintedAmount > 0,
            isPartiallyMinted,
            allocations,
            tokenSymbols,
          };
        },
      );

      // Set initial summaries
      setTokenSummaries(summaries);

      // Initialize mint amounts for each token type
      const initialMintAmounts = summaries.map((summary) => ({
        tokenType: summary.tokenType,
        amount: summary.remainingToMint,
      }));
      setMintAmounts(initialMintAmounts);
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

  // Reset all filters
  const resetFilters = () => {
    setFilterStatus("all");
    setSearchQuery("");
    setColumnFilters({});
  };

  // Filter token summaries based on search query and status filter with useMemo
  const filteredTokenSummaries = useMemo(() => {
    return tokenSummaries.filter((summary) => {
      const matchesSearch = summary.tokenType
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus = !filterStatus || filterStatus === "all" ? true : summary.status === filterStatus;

      // Apply column filters
      const matchesColumnFilters = Object.entries(columnFilters).every(
        ([column, filterValue]) => {
          if (!filterValue) return true;
          const value = String(summary[column] || "").toLowerCase();
          return value.includes(filterValue.toLowerCase());
        }
      );

      return matchesSearch && matchesStatus && matchesColumnFilters;
    });
  }, [tokenSummaries, searchQuery, filterStatus, columnFilters]);

  // Sort the filtered token summaries with useMemo
  const sortedTokenSummaries = useMemo(() => {
    return [...filteredTokenSummaries].sort((a, b) => {
      let valueA = a[sortColumn];
      let valueB = b[sortColumn];

      // Handle special cases for sorting
      if (
        sortColumn === "totalAmount" ||
        sortColumn === "confirmedAmount" ||
        sortColumn === "mintedAmount" ||
        sortColumn === "remainingToMint"
      ) {
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
  }, [filteredTokenSummaries, sortColumn, sortDirection]);

  // Toggle card collapse state
  const toggleCardCollapse = (tokenType: string) => {
    setCollapsedCards(prev => ({
      ...prev,
      [tokenType]: !prev[tokenType]
    }));
  };

  // Get a helper function to get sort indicator
  const getSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }
    return null;
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

  // Handle mint tokens with specific amounts
  const handleMintTokens = async (tokenTypes: string[]) => {
    try {
      // In a real implementation, this would interact with a blockchain
      // For now, we'll update the database to mark tokens as minted
      const now = new Date().toISOString();
      let totalMinted = 0;

      // Start tracking updates for selected tokens
      const allImpactedAllocations = [];
      tokenTypes.forEach(tokenType => {
        const summary = tokenSummaries.find(s => s.tokenType === tokenType);
        if (summary) {
          summary.allocations
            .filter(a => a.subscriptions.confirmed && a.subscriptions.allocated && !a.minted)
            .forEach(a => allImpactedAllocations.push(a.id));
        }
      });

      // Set loading state for potentially affected allocations
      setAllocations(prev => 
        prev.map(a => allImpactedAllocations.includes(a.id) ? { ...a, isUpdating: true } : a)
      );

      // For each token type, update the allocations to mark them as minted
      for (const tokenType of tokenTypes) {
        const summary = tokenSummaries.find((s) => s.tokenType === tokenType);
        if (!summary) continue;

        // Get the mint amount for this token type
        const mintAmount =
          mintAmounts.find((m) => m.tokenType === tokenType)?.amount || 0;
        if (mintAmount <= 0) continue;

        // Find all confirmed but not minted allocations for this token type
        const eligibleAllocations = summary.allocations
          .filter(
            (a) =>
              a.subscriptions.confirmed &&
              a.subscriptions.allocated &&
              !a.minted,
          )
          .sort(
            (a, b) =>
              new Date(a.allocation_date).getTime() -
              new Date(b.allocation_date).getTime(),
          );

        let remainingToMint = mintAmount;
        const allocationsToMint = [];

        // Select allocations to mint up to the requested amount
        for (const allocation of eligibleAllocations) {
          if (remainingToMint <= 0) break;

          const allocationAmount = allocation.token_amount || 0;
          if (allocationAmount <= remainingToMint) {
            // Mint the entire allocation
            allocationsToMint.push(allocation.id);
            remainingToMint -= allocationAmount;
            totalMinted += allocationAmount;
          } else {
            // In a real implementation, you might need to split the allocation
            // For this demo, we'll just mint the entire allocation if more than half is needed
            if (remainingToMint > allocationAmount / 2) {
              allocationsToMint.push(allocation.id);
              totalMinted += allocationAmount;
            }
            break;
          }
        }

        if (allocationsToMint.length > 0) {
          // Update the allocations in the database to mark them as minted
          const { error } = await supabase
            .from("token_allocations")
            .update({
              minted: true,
              minting_date: now,
              minting_tx_hash: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
              updated_at: now,
            })
            .in("id", allocationsToMint);

          if (error) throw error;
        }
      }

      // Update local state - set minted state for affected allocations
      setAllocations(prev => 
        prev.map(a => {
          if (allImpactedAllocations.includes(a.id) && tokenTypes.includes(a.tokenType)) {
            return {
              ...a,
              minted: true,
              minting_date: now,
              minting_tx_hash: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
              isUpdating: false
            };
          }
          
          // Clear any loading states for allocations that didn't get minted
          if (a.isUpdating) {
            return {
              ...a,
              isUpdating: false
            };
          }
          
          return a;
        })
      );

      toast({
        title: "Tokens Minted",
        description: `Successfully minted ${totalMinted.toLocaleString()} tokens across ${tokenTypes.length} token type(s).`,
      });

      setIsMintDialogOpen(false);
      setSelectedTokenTypes([]);
      fetchTokenAllocations(); // Refresh data after minting
    } catch (err) {
      console.error("Error minting tokens:", err);
      
      // Clear all loading states on error
      setAllocations(prev => 
        prev.map(a => a.isUpdating ? { ...a, isUpdating: false } : a)
      );
      
      toast({
        title: "Error",
        description: "Failed to mint tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle token type selection for bulk minting
  const handleTokenTypeSelection = (tokenType: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTokenTypes((prev) => [...prev, tokenType]);
    } else {
      setSelectedTokenTypes((prev) =>
        prev.filter((type) => type !== tokenType),
      );
    }
  };

  // Handle mint amount change
  const handleMintAmountChange = (tokenType: string, amount: number) => {
    setMintAmounts((prev) => {
      const existing = prev.find((item) => item.tokenType === tokenType);
      if (existing) {
        return prev.map((item) =>
          item.tokenType === tokenType ? { ...item, amount } : item,
        );
      } else {
        return [...prev, { tokenType, amount }];
      }
    });
  };

  // Export minting data
  const handleExportMintingData = () => {
    try {
      // Prepare export data
      const exportData = tokenSummaries.map(summary => ({
        token_type: summary.tokenType,
        total_allocations: summary.totalCount,
        total_amount: summary.totalAmount,
        confirmed_amount: summary.confirmedAmount,
        minted_amount: summary.mintedAmount,
        remaining_to_mint: summary.remainingToMint,
        status: summary.status,
        minted_percent: summary.confirmedAmount > 0 
          ? Math.round((summary.mintedAmount / summary.confirmedAmount) * 100) 
          : 0
      }));
      
      if (exportData.length === 0) {
        toast({
          title: "No Data",
          description: "No token summaries to export",
          variant: "destructive",
        });
        return;
      }
      
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
      link.setAttribute("download", `token_minting_summary_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} token summaries`
      });
    } catch (err) {
      console.error("Error exporting minting data:", err);
      toast({
        title: "Export Failed",
        description: "Could not export minting data"
      });
    }
  };

  // Handle bulk mint
  const handleBulkMint = () => {
    if (selectedTokenTypes.length === 0) {
      toast({
        title: "No Tokens Selected",
        description: "Please select at least one token type to mint",
        variant: "destructive",
      });
      return;
    }
    setIsBulkMintOpen(true);
  };

  return (
    <div className="w-full h-full bg-gray-50 p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{projectName} Token Minting</h1>
          {isLoading && (
            <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportMintingData}
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              if (selectedTokenTypes.length === 0) {
                // If no token types are selected, select all available and ready to mint
                const readyTokenTypes = tokenSummaries
                  .filter((s) => s.readyToMint)
                  .map((s) => s.tokenType);
                setSelectedTokenTypes(readyTokenTypes);
                if (readyTokenTypes.length > 0) {
                  setIsBulkMintOpen(true);
                } else {
                  toast({
                    title: "No Tokens Ready",
                    description: "There are no tokens ready to mint.",
                    variant: "destructive",
                  });
                }
              } else {
                setIsBulkMintOpen(true);
              }
            }}
            disabled={
              tokenSummaries.filter((s) => s.readyToMint).length === 0
            }
          >
            <Send className="h-4 w-4" />
            <span>Mint All Tokens</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Tokens Card */}
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Token Types
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {tokenSummaries.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Minted Status Summary */}
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Minted Token Types
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {
                    tokenSummaries.filter((s) => s.isMinted).length
                  }
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {tokenSummaries.length > 0
                    ? Math.round(
                        (tokenSummaries.filter(
                          (s) => s.isMinted
                        ).length /
                          tokenSummaries.length) *
                          100
                      )
                    : 0}
                  % of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ready to Mint Summary */}
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ready to Mint
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {tokenSummaries.filter((s) => s.readyToMint).length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <TabsList>
          <TabsTrigger value="minting">Token Minting</TabsTrigger>
          <TabsTrigger value="minted">Minted Tokens</TabsTrigger>
          </TabsList>
            </div>
        </div>

        <TabsContent value="minting" className="pt-4">
          <div className="grid grid-cols-1 gap-6">
            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Token Minting</h2>
                <p className="text-sm text-muted-foreground">
                  Mint tokens for confirmed allocations
                  {selectedTokenTypes.length > 0 && ` • ${selectedTokenTypes.length} selected`}
                </p>
              </div>
              {selectedTokenTypes.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTokenTypes([])}
                  >
                    Clear Selection
                  </Button>
                  <Button onClick={handleBulkMint}>
                    <Send className="h-4 w-4 mr-2" />
                    Mint Selected
                  </Button>
                </div>
              )}
            </div>
            


            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                <p className="mt-2 text-gray-500">Loading token data...</p>
              </div>
            ) : sortedTokenSummaries.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Tokens Available</CardTitle>
                  <CardDescription>
                    There are no token allocations available for minting.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-8 text-gray-500">
                    To mint tokens, first create token allocations in the Allocations section.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Token minting cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedTokenSummaries.map((summary) => {
                    // Get theme based on standard and type
                    // For FACTORING, we need to ensure it's recognized as ERC721
                    const tokenStandard = summary.tokenType.toUpperCase() === 'FACTORING' ? 'ERC721' : summary.tokenStandard;
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
                              {/* Use the proper token name, special handling for FACTORING */}
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
                              {summary.status === "minted"
                                ? "Fully minted"
                                : summary.status === "partially_minted"
                                ? "Partially minted"
                                : summary.status === "ready_to_mint"
                                ? "Ready to mint"
                                : "Pending confirmation"}
                            </CardDescription>
                          )}
                        </CardHeader>
                        
                        {!isCollapsed && (
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Allocations:</span>
                                <span className="font-medium">{summary.totalCount}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Confirmed Amount:</span>
                                <span className="font-medium">
                                  {formatNumber(summary.confirmedAmount)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Minted Amount:</span>
                                <span className="font-medium">
                                  {formatNumber(summary.mintedAmount)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Remaining to Mint:</span>
                                <span className="font-medium">
                                  {formatNumber(summary.remainingToMint)}
                                </span>
                              </div>
                              <div className="pt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${summary.mintedAmount > 0 ? "bg-primary" : "bg-gray-300"}`} 
                                    style={{ width: `${summary.confirmedAmount ? (summary.mintedAmount / summary.confirmedAmount) * 100 : 0}%` }}
                                  />
                                </div>
                                <div className="flex justify-between mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {formatNumber(summary.mintedAmount)} minted
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {summary.confirmedAmount ? Math.round((summary.mintedAmount / summary.confirmedAmount) * 100) : 0}% complete
                                  </span>
                                </div>
                              </div>
                              
                              {summary.tokenSymbols.length > 0 && (
                                <div className="flex gap-1 mt-2">
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
                              
                              <div className="pt-3">
                                {summary.readyToMint ? (
                                  <div className="flex items-center">
                                    <Checkbox
                                      id={`select-${summary.tokenType}`}
                                      checked={selectedTokenTypes.includes(
                                        summary.tokenType,
                                      )}
                                      onCheckedChange={(checked) =>
                                        handleTokenTypeSelection(
                                          summary.tokenType,
                                          checked === true,
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    <label 
                                      htmlFor={`select-${summary.tokenType}`}
                                      className="text-sm cursor-pointer font-medium"
                                    >
                                      Select for minting
                                    </label>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="ml-auto"
                                      onClick={() => {
                                        setSelectedTokenType(summary.tokenType);
                                        setIsMintDialogOpen(true);
                                      }}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Mint
                                    </Button>
                                  </div>
                                ) : summary.isMinted ? (
                                  <div className="flex justify-end">
                                    <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      {summary.isPartiallyMinted
                                        ? "Partially Minted"
                                        : "Fully Minted"}
                                    </Badge>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic text-right">
                                    No confirmed allocations
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
                
                {/* Token minting table for more detailed view */}
                <Card className="mt-8">
                  <CardHeader className="pb-3">
                    <CardTitle>Token Minting Overview</CardTitle>
                    <CardDescription>
                      Detailed view of token minting status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <div className="flex items-center p-4 border-b justify-between">
                        <div className="relative w-full mr-2">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="Search allocations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon" onClick={fetchTokenAllocations} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                          </Button>
                          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                                {filterStatus && filterStatus !== "all" && (
                                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-4" align="end">
                              <div className="space-y-4">
                                <h4 className="font-medium">Filter Tokens</h4>
                                <div className="space-y-2">
                                  <h5 className="text-sm font-medium">Status</h5>
                                  <Select
                                    value={filterStatus}
                                    onValueChange={(value) => setFilterStatus(value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All statuses</SelectItem>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="ready_to_mint">
                                        Ready to Mint
                                      </SelectItem>
                                      <SelectItem value="partially_minted">
                                        Partially Minted
                                      </SelectItem>
                                      <SelectItem value="minted">Minted</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
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
                              <Button variant="outline" size="icon">
                                <Columns2 className="h-4 w-4" />
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
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={
                                  selectedTokenTypes.length > 0 &&
                                  selectedTokenTypes.length === sortedTokenSummaries.filter(s => s.readyToMint).length
                                }
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTokenTypes(
                                      sortedTokenSummaries
                                        .filter((s) => s.readyToMint)
                                        .map((s) => s.tokenType)
                                    );
                                  } else {
                                    setSelectedTokenTypes([]);
                                  }
                                }}
                                id="select-all"
                              />
                            </TableHead>
                            
                            {visibleColumns.includes("tokenType") && (
                              <TableHead 
                                className={cn("cursor-pointer", "hover:bg-gray-50")}
                                onClick={() => handleSort("tokenType")}
                              >
                                <div className="flex items-center gap-1">
                                  Token Type
                                  {sortColumn === "tokenType" && getSortIndicator("tokenType")}
                                </div>
                              </TableHead>
                            )}
                            
                            {visibleColumns.includes("confirmedAmount") && (
                              <TableHead 
                                className={cn("text-right cursor-pointer", "hover:bg-gray-50")}
                                onClick={() => handleSort("confirmedAmount")}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  Confirmed
                                  {sortColumn === "confirmedAmount" && getSortIndicator("confirmedAmount")}
                                </div>
                              </TableHead>
                            )}
                            
                            {visibleColumns.includes("mintedAmount") && (
                              <TableHead 
                                className={cn("text-right cursor-pointer", "hover:bg-gray-50")}
                                onClick={() => handleSort("mintedAmount")}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  Minted
                                  {sortColumn === "mintedAmount" && getSortIndicator("mintedAmount")}
                                </div>
                              </TableHead>
                            )}
                            
                            {visibleColumns.includes("remainingToMint") && (
                              <TableHead 
                                className={cn("text-right cursor-pointer", "hover:bg-gray-50")}
                                onClick={() => handleSort("remainingToMint")}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  Remaining
                                  {sortColumn === "remainingToMint" && getSortIndicator("remainingToMint")}
                                </div>
                              </TableHead>
                            )}
                            
                            {visibleColumns.includes("status") && (
                              <TableHead 
                                className={cn("cursor-pointer", "hover:bg-gray-50")}
                                onClick={() => handleSort("status")}
                              >
                                <div className="flex items-center gap-1">
                                  Status
                                  {sortColumn === "status" && getSortIndicator("status")}
                                </div>
                              </TableHead>
                            )}
                            
                            {visibleColumns.includes("actions") && (
                              <TableHead className="text-right">Actions</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedTokenSummaries.map((summary) => {
                            const theme = getTokenTypeTheme(summary.tokenStandard || summary.tokenType);
                            
                            return (
                              <TableRow key={summary.tokenType}>
                                <TableCell>
                                  {summary.readyToMint && (
                                    <Checkbox
                                      checked={selectedTokenTypes.includes(
                                        summary.tokenType
                                      )}
                                      onCheckedChange={(checked) =>
                                        handleTokenTypeSelection(
                                          summary.tokenType,
                                          checked === true
                                        )
                                      }
                                      aria-label={`Select ${summary.tokenType}`}
                                    />
                                  )}
                                </TableCell>
                                
                                {visibleColumns.includes("tokenType") && (
                                  <TableCell>
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
                                        {formatTokenType(summary.tokenType)}
                                      </Badge>
                                      {summary.tokenSymbols.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {summary.tokenSymbols.map((symbol, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                              {symbol}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                )}
                                
                                {visibleColumns.includes("confirmedAmount") && (
                                  <TableCell className="text-right font-medium">
                                    {formatNumber(summary.confirmedAmount)}
                                  </TableCell>
                                )}
                                
                                {visibleColumns.includes("mintedAmount") && (
                                  <TableCell className="text-right font-medium">
                                    {formatNumber(summary.mintedAmount)}
                                  </TableCell>
                                )}
                                
                                {visibleColumns.includes("remainingToMint") && (
                                  <TableCell className="text-right font-medium">
                                    {formatNumber(summary.remainingToMint)}
                                  </TableCell>
                                )}
                                
                                {visibleColumns.includes("status") && (
                                  <TableCell>
                                    <Badge className={
                                      summary.status === "minted"
                                        ? "bg-green-100 text-green-800" 
                                        : summary.status === "partially_minted"
                                        ? "bg-amber-100 text-amber-800" 
                                        : summary.status === "ready_to_mint"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }>
                                      {summary.status === "minted"
                                        ? "Minted"
                                        : summary.status === "partially_minted"
                                        ? "Partially Minted"
                                        : summary.status === "ready_to_mint"
                                        ? "Ready to Mint"
                                        : "Pending"}
                                    </Badge>
                                  </TableCell>
                                )}
                                
                                {visibleColumns.includes("actions") && (
                                  <TableCell className="text-right">
                                    <DropdownMenu modal={false}>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          className="h-8 w-8 p-0" 
                                          disabled={!summary.readyToMint && !summary.isPartiallyMinted}
                                        >
                                          <span className="sr-only">Open menu</span>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" forceMount>
                                        {(summary.readyToMint || summary.isPartiallyMinted) && (
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              setSelectedTokenType(summary.tokenType);
                                              setIsMintDialogOpen(true);
                                            }}
                                          >
                                            <Send className="mr-2 h-4 w-4" />
                                            Mint Tokens
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                          onClick={() => {
                                            // Copy token summary to clipboard
                                            const summaryText = `
Token Type: ${summary.tokenType}
Confirmed Amount: ${summary.confirmedAmount}
Minted Amount: ${summary.mintedAmount}
Remaining to Mint: ${summary.remainingToMint}
Status: ${summary.status}
                                            `.trim();
                                            
                                            navigator.clipboard.writeText(summaryText);
                                            toast({
                                              title: "Summary Copied",
                                              description: "Token summary copied to clipboard",
                                            });
                                          }}
                                        >
                                          <Copy className="mr-2 h-4 w-4" />
                                          Copy Summary
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={2} className="font-medium">
                              Total
                            </TableCell>
                            {visibleColumns.includes("confirmedAmount") && (
                              <TableCell className="text-right font-bold">
                                {formatNumber(
                                  sortedTokenSummaries.reduce((sum, s) => sum + s.confirmedAmount, 0)
                                )}
                              </TableCell>
                            )}
                            {visibleColumns.includes("mintedAmount") && (
                              <TableCell className="text-right font-bold">
                                {formatNumber(
                                  sortedTokenSummaries.reduce((sum, s) => sum + s.mintedAmount, 0)
                                )}
                              </TableCell>
                            )}
                            {visibleColumns.includes("remainingToMint") && (
                              <TableCell className="text-right font-bold">
                                {formatNumber(
                                  sortedTokenSummaries.reduce((sum, s) => sum + s.remainingToMint, 0)
                                )}
                              </TableCell>
                            )}
                            <TableCell colSpan={2}></TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="minted" className="pt-4">
          <div className="grid grid-cols-1 gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Minted Tokens</h2>
                <p className="text-sm text-muted-foreground">
                  View all tokens that have been minted
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportMintingData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                <p className="mt-2 text-gray-500">Loading token data...</p>
              </div>
            ) : sortedTokenSummaries.filter((s) => s.isMinted).length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Minted Tokens</CardTitle>
                  <CardDescription>
                    No tokens have been minted yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-8 text-gray-500">
                    Once tokens are minted, they will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Minted Tokens</CardTitle>
                  <CardDescription>
                    View all tokens that have been minted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="rounded-md border">
                <div className="flex items-center p-4 border-b justify-between">
                        <div className="relative w-full mr-2">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="Search allocations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon" onClick={fetchTokenAllocations} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                          </Button>
                          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8 p-0">
                                <Filter className="h-4 w-4" />
                                {Object.keys(columnFilters).length > 0 || filterStatus !== "all" ? (
                                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                                ) : null}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-4" align="end">
                              <div className="space-y-4">
                                <h4 className="font-medium">Filter Tokens</h4>
                                <div className="space-y-2">
                                  <h5 className="text-sm font-medium">Status</h5>
                                  <Select
                                    value={filterStatus}
                                    onValueChange={(value) => setFilterStatus(value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All statuses</SelectItem>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="ready_to_mint">
                                        Ready to Mint
                                      </SelectItem>
                                      <SelectItem value="partially_minted">
                                        Partially Minted
                                      </SelectItem>
                                      <SelectItem value="minted">Minted</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
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
                          <Button variant="outline" size="icon" onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}>
                            <Columns2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className={cn("cursor-pointer", "hover:bg-gray-50")}
                            onClick={() => handleSort("tokenType")}
                          >
                            <div className="flex items-center gap-1">
                              Token Type
                              {sortColumn === "tokenType" && getSortIndicator("tokenType")}
                            </div>
                          </TableHead>
                          <TableHead 
                            className={cn("text-right cursor-pointer", "hover:bg-gray-50")}
                            onClick={() => handleSort("confirmedAmount")}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Confirmed
                              {sortColumn === "confirmedAmount" && getSortIndicator("confirmedAmount")}
                            </div>
                          </TableHead>
                          <TableHead 
                            className={cn("text-right cursor-pointer", "hover:bg-gray-50")}
                            onClick={() => handleSort("mintedAmount")}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Minted
                              {sortColumn === "mintedAmount" && getSortIndicator("mintedAmount")}
                            </div>
                          </TableHead>
                          <TableHead 
                            className={cn("cursor-pointer", "hover:bg-gray-50")}
                            onClick={() => handleSort("status")}
                          >
                            <div className="flex items-center gap-1">
                              Status
                              {sortColumn === "status" && getSortIndicator("status")}
                            </div>
                          </TableHead>
                          <TableHead className="text-right">Completion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTokenSummaries
                          .filter((summary) => summary.isMinted)
                          .map((summary) => {
                            const theme = getTokenTypeTheme(summary.tokenStandard || summary.tokenType);
                            const mintingPercent = summary.confirmedAmount
                              ? Math.round((summary.mintedAmount / summary.confirmedAmount) * 100)
                              : 0;
                              
                            return (
                              <TableRow key={summary.tokenType}>
                                <TableCell>
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
                                      {formatTokenType(summary.tokenType)}
                                    </Badge>
                                    {summary.tokenSymbols.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {summary.tokenSymbols.map((symbol, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {symbol}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatNumber(summary.confirmedAmount)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatNumber(summary.mintedAmount)}
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    summary.status === "minted"
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-amber-100 text-amber-800"
                                  }>
                                    {summary.status === "minted"
                                      ? "Fully Minted"
                                      : "Partially Minted"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-primary h-2 rounded-full" 
                                        style={{ width: `${mintingPercent}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium">
                                      {mintingPercent}%
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell className="font-medium">
                            Total
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatNumber(
                              sortedTokenSummaries
                                .filter(s => s.isMinted)
                                .reduce((sum, s) => sum + s.confirmedAmount, 0)
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatNumber(
                              sortedTokenSummaries
                                .filter(s => s.isMinted)
                                .reduce((sum, s) => sum + s.mintedAmount, 0)
                            )}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
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

      {/* Minting Dialog */}
      <TokenMintingDialog
        open={isMintDialogOpen}
        onOpenChange={setIsMintDialogOpen}
        tokenType={selectedTokenType}
        tokenSummaries={tokenSummaries.filter(
          (s) => s.tokenType === selectedTokenType,
        )}
        onMint={handleMintTokens}
      />

      {/* Bulk Mint Confirmation Dialog */}
      <AlertDialog 
        open={isBulkMintOpen} 
        onOpenChange={setIsBulkMintOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mint Selected Tokens</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mint {selectedTokenTypes.length} token type{selectedTokenTypes.length !== 1 ? 's' : ''}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleMintTokens(selectedTokenTypes);
                setIsBulkMintOpen(false);
              }}
            >
              Mint Tokens
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TokenMintingManager;
