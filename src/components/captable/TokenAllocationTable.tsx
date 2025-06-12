import React, { useState, useMemo, useEffect, memo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Edit, 
  Check, 
  Copy, 
  X, 
  AlertCircle, 
  Pencil, 
  MoreHorizontal, 
  Trash, 
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { TokenAllocationsTable } from "@/types/core/database";
import { supabase } from "@/infrastructure/database/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { cn } from "@/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
  getTokenTypeTheme, 
  extractStandard, 
  formatNumber, 
  formatTokenType 
} from "@/utils/shared/tokenThemeUtils";

// Enhanced TokenAllocation interface that handles database-to-UI mapping
interface ExtendedTokenAllocation extends Partial<TokenAllocationsTable> {
  // Database fields (snake_case) - only fields not already defined in TokenAllocationsTable
  investor_id?: string;
  subscription_id?: string; 
  project_id?: string;
  token_type?: string;
  token_amount?: number;
  allocation_date?: string;
  distribution_date?: string;
  distribution_tx_hash?: string;
  minted?: boolean;
  minting_date?: string;
  minting_tx_hash?: string;
  distributed?: boolean;
  notes?: string;
  symbol?: string;
  token_id?: string;
  // standard is already defined in TokenAllocationsTable with correct enum type
  
  // UI fields (camelCase) - computed or joined from other tables
  investorName?: string;
  investorEmail?: string;
  subscriptionId?: string;
  currency?: string;
  fiatAmount?: number;
  walletAddress?: string;
  isUpdating?: boolean; // Added for tracking loading state
  tokenName?: string;
  tokenSymbol?: string;
  tokenStandard?: string;
  dbStandard?: string;
  
  // Computed fields
  allocatedAmount?: number; // Maps to token_amount
  subscribedAmount?: number; // From subscription data
  allocationConfirmed?: boolean; // Based on allocation_date presence
  tokenType?: string; // Maps to token_type
}

interface TokenAllocationProps {
  allocations: ExtendedTokenAllocation[];
  selectedIds: string[];
  onSelectId: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onUpdateAllocation: (
    id: string,
    amount: number,
    onSuccess?: () => void,
    onError?: (message: string) => void
  ) => void;
  onFinalizeAllocation?: (
    id: string,
    onSuccess?: () => void,
    onError?: (message: string) => void
  ) => void;
  onCopyAddress?: (address: string) => void;
  onEditAllocation: (allocation: ExtendedTokenAllocation) => void;
  loading?: boolean;
  error?: string;
  editable?: boolean;
  visibleColumns?: string[];
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
}

const formatCurrency = (amount: number, currency: string = "USD") => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
};

// Memoized allocation row component to prevent unnecessary re-renders
const AllocationRow = memo(({ 
  allocation, 
  isSelected, 
  onSelectId, 
  onEditAllocation, 
  onUpdateAllocation, 
  handleCopyAddress, 
  editMode, 
  setEditMode, 
  editValues, 
  setEditValues, 
  handleEdit, 
  handleSave, 
  handleCancel, 
  handleInputChange, 
  toast 
}: any) => {
  return (
    <TableRow key={allocation.id} data-allocation-id={allocation.id}>
      <TableCell>
        <div className="flex items-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectId(allocation.id)}
            aria-label={`Select allocation for ${allocation.investorName}`}
            id={`select-${allocation.id}`}
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{allocation.investorName}</div>
        <div className="text-sm text-muted-foreground">
          {allocation.investorEmail}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {allocation.subscriptionId?.substring(0, 12)}...
        </div>
        <div className="text-xs text-muted-foreground">
          {allocation.currency}{" "}
          {allocation.fiatAmount?.toLocaleString()}
        </div>
      </TableCell>
      <TableCell>
        {(allocation.tokenType || allocation.token_type) === 'FACTORING' ? (
          <div className="space-y-1">
            <Badge variant="outline" className="flex gap-1">
              {formatTokenType((allocation.tokenType || allocation.token_type) || "Unassigned")}
              <span className="bg-blue-100 text-blue-800 px-1 rounded text-xs font-mono">FCT</span>
            </Badge>
            {allocation.notes && (
              <div className="text-xs text-muted-foreground">
                {allocation.notes}
              </div>
            )}
          </div>
        ) : (
          <Badge variant="outline">
            {formatTokenType((allocation.tokenType || allocation.token_type) || "Unassigned")}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        {editMode[allocation.id] ? (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={editValues[allocation.id] || ""}
              onChange={(e) => handleInputChange(allocation.id, e.target.value)}
              className="w-24 h-8 text-right"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave(allocation.id);
                if (e.key === "Escape") handleCancel(allocation.id, (allocation.allocatedAmount || allocation.token_amount || allocation.subscribedAmount) || 0);
              }}
            />
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleSave(allocation.id)}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleCancel(allocation.id, allocation.allocatedAmount || allocation.subscribedAmount || 0)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="cursor-pointer hover:underline"
            onClick={() => handleEdit(allocation.id, (allocation.allocatedAmount || allocation.token_amount || allocation.subscribedAmount) || 0)}
          >
            {formatCurrency((allocation.allocatedAmount || allocation.token_amount || allocation.subscribedAmount) || 0)}
          </div>
        )}
      </TableCell>
      <TableCell className="text-center">
        {allocation.isUpdating ? (
          <div className="flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : allocation.allocationConfirmed ? (
          <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-800">Unconfirmed</Badge>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs truncate max-w-[150px]">
        <div className="flex items-center space-x-1">
          <span className="truncate">
            {allocation.walletAddress || "Not set"}
          </span>
          {allocation.walletAddress && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-1"
              title="Copy Address"
              onClick={() => handleCopyAddress(allocation.walletAddress || "")}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TableCell>
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
              onClick={() => onEditAllocation(allocation)}
              disabled={allocation.isUpdating}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Token Type
            </DropdownMenuItem>
            {!allocation.allocationConfirmed && (
              <DropdownMenuItem
                onClick={() => {
                  onUpdateAllocation(
                    allocation.id,
                    allocation.allocatedAmount,
                    () => {
                      toast({
                        title: "Allocation confirmed",
                        description: "Token allocation has been confirmed successfully",
                      });
                    },
                    (error) => {
                      toast({
                        title: "Error confirming allocation",
                        description: error,
                        variant: "destructive",
                      });
                    }
                  );
                }}
                disabled={allocation.isUpdating}
              >
                <Check className="mr-2 h-4 w-4" />
                Confirm Allocation
              </DropdownMenuItem>
            )}
            {allocation.allocationConfirmed && (
              <DropdownMenuItem
                onClick={() => {
                  // For unconfirming, we need to update the backend to set allocation_date to null
                  // We'll use the existing amount but trigger an update to allocation_date via the manager
                  onUpdateAllocation(
                    allocation.id,
                    allocation.allocatedAmount,
                    () => {
                      toast({
                        title: "Allocation unconfirmed",
                        description: "Token allocation has been unconfirmed successfully",
                      });
                    },
                    (error) => {
                      toast({
                        title: "Error unconfirming allocation",
                        description: error,
                        variant: "destructive",
                      });
                    }
                  );
                }}
                disabled={allocation.isUpdating}
              >
                <X className="mr-2 h-4 w-4" />
                Unconfirm Allocation
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onUpdateAllocation(
                  allocation.id,
                  0,
                  () => {
                    toast({
                      title: "Allocation deleted",
                      description: "Token allocation has been deleted successfully",
                    });
                  },
                  (error) => {
                    toast({
                      title: "Error deleting allocation",
                      description: error,
                      variant: "destructive",
                    });
                  }
                );
              }}
              className="text-red-600"
              disabled={allocation.isUpdating}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Allocation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

AllocationRow.displayName = "AllocationRow";

const TokenAllocationsTable: React.FC<TokenAllocationProps> = ({
  allocations,
  selectedIds,
  onSelectId,
  onSelectAll,
  onUpdateAllocation,
  onFinalizeAllocation,
  onCopyAddress,
  onEditAllocation,
  loading = false,
  error,
  editable = true,
  visibleColumns = ["investorName", "subscriptionId", "tokenType", "allocatedAmount", "status", "walletAddress"],
  onSort,
  sortColumn = "investorName",
  sortDirection = "asc",
}) => {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  // Group allocations by token type - optimized with useMemo
  const groupedAllocations = useMemo<Record<string, ExtendedTokenAllocation[]>>(() => {
    const grouped: Record<string, ExtendedTokenAllocation[]> = {};
    
    allocations.forEach((allocation) => {
      const tokenType = allocation.tokenType || allocation.token_type || "Unknown";
      if (!grouped[tokenType]) {
        grouped[tokenType] = [];
      }
      grouped[tokenType].push(allocation);
    });
    
    return grouped;
  }, [allocations]);

  // Calculate totals for each token type - optimized with useMemo
  const tokenTypeTotals = useMemo(() => {
    const totals: Record<string, { allocated: number; subscribed: number }> = {};
    
    Object.entries(groupedAllocations).forEach(([tokenType, allocations]) => {
      totals[tokenType] = allocations.reduce(
        (acc, curr) => {
          return {
            allocated: acc.allocated + (curr.allocatedAmount || curr.token_amount || 0),
            subscribed: acc.subscribed + (curr.subscribedAmount || 0),
          };
        },
        { allocated: 0, subscribed: 0 }
      );
    });
    
    return totals;
  }, [groupedAllocations]);

  // Calculate grand totals - optimized with useMemo
  const grandTotal = useMemo(() => {
    return Object.values(tokenTypeTotals).reduce(
      (acc, curr) => {
        return {
          allocated: acc.allocated + curr.allocated,
          subscribed: acc.subscribed + curr.subscribed,
        };
      },
      { allocated: 0, subscribed: 0 }
    );
  }, [tokenTypeTotals]);

  // Toggle card collapse state
  const toggleCardCollapse = (tokenType: string) => {
    console.log(`Toggling collapse for: ${tokenType}`, collapsedCards[tokenType]);
    setCollapsedCards(prev => ({
      ...prev,
      [tokenType]: !prev[tokenType]
    }));
  };

  // Handle entering edit mode for an allocation
  const handleEdit = (id: string, currentAmount: number) => {
    setEditMode({ ...editMode, [id]: true });
    setEditValues({ ...editValues, [id]: currentAmount.toString() });
  };

  // Handle selecting an allocation
  const handleSelectId = (id: string) => (checked: boolean | 'indeterminate') => {
    onSelectId(id);
  };

  // Handle saving edited allocation
  const handleSave = (id: string) => {
    const newAmount = parseFloat(editValues[id]);
    if (isNaN(newAmount) || newAmount < 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    onUpdateAllocation(
      id, 
      newAmount,
      () => {
        setEditMode({ ...editMode, [id]: false });
        toast({
          title: "Allocation updated",
          description: "Token allocation has been updated successfully",
        });
      },
      (error) => {
        toast({
          title: "Error updating allocation",
          description: error,
          variant: "destructive",
        });
      }
    );
  };

  // Handle canceling edit mode
  const handleCancel = (id: string, originalAmount: number) => {
    setEditMode({ ...editMode, [id]: false });
    setEditValues({ ...editValues, [id]: originalAmount.toString() });
  };

  // Handle input change for edited allocation
  const handleInputChange = (id: string, value: string) => {
    setEditValues({ ...editValues, [id]: value });
  };

  // Handle selecting all allocations
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    onSelectAll(checked === true);
  };

  // Handle copying wallet address
  const handleCopyAddress = (address: string) => {
    if (onCopyAddress) {
      onCopyAddress(address);
    } else {
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
    }
  };

  // Handle finalizing selected allocations
  const handleFinalizeSelected = () => {
    if (onFinalizeAllocation && selectedIds.length > 0) {
      // We could implement batch processing here
      toast({
        title: "Finalizing allocations",
        description: `Processing ${selectedIds.length} allocation(s)`,
      });
      
      // For now just inform the user
      toast({
        title: "Batch finalization",
        description: "Batch finalization is not yet implemented",
      });
    }
  };

  // Add a helper function to get the sort indicator
  const getSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? "↑" : "↓";
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 border rounded-lg bg-destructive/10">
        <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <div className="text-center p-6 border rounded-lg">
        <p className="text-muted-foreground">No token allocations found</p>
      </div>
    );
  }

  // If we have more than 100 allocations, add a note about performance
  const hasManyAllocations = allocations.length > 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Token Allocation</h2>
          <p className="text-sm text-muted-foreground">
            Manage token allocations for confirmed subscriptions
            {hasManyAllocations && " • Displaying a large number of records"}
            {selectedIds.length > 0 && ` • ${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'} selected`}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectAll(false)}
              className="text-xs"
            >
              Clear Selection
            </Button>
          )}
          <Button
            onClick={handleFinalizeSelected}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            <span>Finalize Allocations</span>
          </Button>
        </div>
      </div>
      
      {/* Token Type Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(tokenTypeTotals).map(([tokenType, totals]) => {
          // Get the standard from the first allocation with this token type
          const firstAllocation = groupedAllocations[tokenType]?.[0];
          
          // Extract standard for theme application - be more explicit
          const tokenStandard = firstAllocation?.tokenStandard || 
                              firstAllocation?.dbStandard || 
                              extractStandard(tokenType);
          
          // Debug logs with clear markers
          console.log(`🔵 CARD: Rendering card for token type: "${tokenType}"`);
          console.log(`🔵 CARD: Using standard: "${tokenStandard}" (DB: ${firstAllocation?.dbStandard})`);
          
          // Use the standard directly for theme lookup
          const theme = getTokenTypeTheme(tokenStandard || tokenType);
            
          // Debug log for the applied theme
          console.log(`🔵 CARD: Applied theme:`, theme);
          
          const isCollapsed = collapsedCards[tokenType] || false;
          
          // Extract display name (without standard)
          const displayName = tokenType.includes(" - ") 
            ? tokenType.split(" - ")[0]
            : tokenType;
          
          return (
            <Card
              key={tokenType}
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
                  onClick={() => toggleCardCollapse(tokenType)}
                >
                  <CardTitle className="text-lg flex items-center gap-2">
                    {displayName.toUpperCase()}
                    {tokenStandard && (
                      <Badge className={cn("font-mono", theme.badge)} style={{
                        backgroundColor: theme.badge.includes('blue') ? '#DBEAFE' : 
                                        theme.badge.includes('purple') ? '#F3E8FF' :
                                        theme.badge.includes('amber') ? '#FEF3C7' :
                                        theme.badge.includes('green') ? '#D1FAE5' :
                                        theme.badge.includes('pink') ? '#FCE7F3' :
                                        theme.badge.includes('cyan') ? '#CFFAFE' :
                                        '#F3F4F6'
                      }}>
                        {tokenStandard}
                      </Badge>
                    )}
              </CardTitle>
                  <Button variant="ghost" size="icon" className={theme.text}>
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
            </div>
                {!isCollapsed && (
                  <CardDescription className={theme.text}>
                    {groupedAllocations[tokenType]?.length || 0} allocations with total value {formatCurrency(totals.allocated)}
            </CardDescription>
                )}
          </CardHeader>
              
              {!isCollapsed && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                      <h3 className={cn("text-sm font-medium", theme.text)}>Total Allocations</h3>
                <p className="text-xl font-bold">
                        {formatCurrency(totals.allocated)}
                </p>
              </div>
              <div>
                      <h3 className={cn("text-sm font-medium", theme.text)}>Number of Allocations</h3>
                <p className="text-xl font-bold">
                        {groupedAllocations[tokenType]?.length || 0}
                </p>
              </div>
              <div>
                      <h3 className={cn("text-sm font-medium", theme.text)}>Confirmed Status</h3>
                <p className="text-xl font-bold">
                        {groupedAllocations[tokenType]?.filter(a => a.allocationConfirmed ?? Boolean(a.allocation_date)).length || 0} / {groupedAllocations[tokenType]?.length || 0}
                </p>
              </div>
            </div>
                  
                  {/* Notes section for FACTORING tokens */}
                  {tokenType.toUpperCase() === 'FACTORING' && (
            <div className="mt-4">
                      <h3 className={cn("text-sm font-medium", theme.text, "mb-1")}>Notes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-24 overflow-y-auto text-xs">
                        {(groupedAllocations[tokenType] || [])
                  .filter(a => a.notes)
                  .slice(0, 4)
                  .map((allocation, index) => (
                    <div key={index} className="p-2 bg-white rounded border border-blue-100">
                      {allocation.notes}
                    </div>
                  ))}
                        {(groupedAllocations[tokenType] || []).filter(a => a.notes).length > 4 && (
                  <div className="text-blue-800 text-center p-2">
                            + {(groupedAllocations[tokenType] || []).filter(a => a.notes).length - 4} more
                  </div>
                )}
              </div>
            </div>
                  )}
          </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Allocation Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <div className="flex items-center space-x-1">
                  <Checkbox
                    checked={
                      allocations.length > 0 &&
                      selectedIds.length === allocations.length
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all allocations"
                    id="select-all"
                  />
                  <label 
                    htmlFor="select-all" 
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                  >
                    {allocations.length > 0 && selectedIds.length === allocations.length 
                      ? "All" 
                      : selectedIds.length > 0 
                        ? `${selectedIds.length}` 
                        : ""}
                  </label>
                </div>
              </TableHead>
              
              {visibleColumns.includes("investorName") && (
                <TableHead 
                  className={cn("cursor-pointer", onSort && "hover:bg-gray-50")}
                  onClick={() => onSort && onSort("investorName")}
                >
                  <div className="flex items-center gap-1">
                    Investor
                    {getSortIndicator("investorName") && (
                      <span>{getSortIndicator("investorName")}</span>
                    )}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.includes("subscriptionId") && (
                <TableHead 
                  className={cn("cursor-pointer", onSort && "hover:bg-gray-50")}
                  onClick={() => onSort && onSort("subscriptionId")}
                >
                  <div className="flex items-center gap-1">
                    Subscription
                    {getSortIndicator("subscriptionId") && (
                      <span>{getSortIndicator("subscriptionId")}</span>
                    )}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.includes("tokenType") && (
                <TableHead 
                  className={cn("cursor-pointer", onSort && "hover:bg-gray-50")}
                  onClick={() => onSort && onSort("tokenType")}
                >
                  <div className="flex items-center gap-1">
                    Token Type
                    {getSortIndicator("tokenType") && (
                      <span>{getSortIndicator("tokenType")}</span>
                    )}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.includes("allocatedAmount") && (
                <TableHead 
                  className={cn("text-right cursor-pointer", onSort && "hover:bg-gray-50")}
                  onClick={() => onSort && onSort("allocatedAmount")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    {getSortIndicator("allocatedAmount") && (
                      <span>{getSortIndicator("allocatedAmount")}</span>
                    )}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.includes("status") && (
                <TableHead 
                  className={cn("text-center cursor-pointer", onSort && "hover:bg-gray-50")}
                  onClick={() => onSort && onSort("allocationConfirmed")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Status
                    {getSortIndicator("allocationConfirmed") && (
                      <span>{getSortIndicator("allocationConfirmed")}</span>
                    )}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.includes("walletAddress") && (
                <TableHead 
                  className={cn("cursor-pointer", onSort && "hover:bg-gray-50")}
                  onClick={() => onSort && onSort("walletAddress")}
                >
                  <div className="flex items-center gap-1">
                    Wallet Address
                    {getSortIndicator("walletAddress") && (
                      <span>{getSortIndicator("walletAddress")}</span>
                    )}
                  </div>
                </TableHead>
              )}
              
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.map((allocation) => (
              <TableRow key={allocation.id} data-allocation-id={allocation.id}>
                <TableCell>
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedIds.includes(allocation.id)}
                      onCheckedChange={() => onSelectId(allocation.id)}
                      aria-label={`Select allocation for ${allocation.investorName}`}
                      id={`select-${allocation.id}`}
                    />
                  </div>
                </TableCell>
                
                {visibleColumns.includes("investorName") && (
                  <TableCell>
                    <div className="font-medium">{allocation.investorName}</div>
                    <div className="text-sm text-muted-foreground">
                      {allocation.investorEmail}
                    </div>
                  </TableCell>
                )}
                
                {visibleColumns.includes("subscriptionId") && (
                  <TableCell>
                    <div className="text-sm">
                      {allocation.subscriptionId?.substring(0, 12)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {allocation.currency}{" "}
                      {allocation.fiatAmount?.toLocaleString()}
                    </div>
                  </TableCell>
                )}
                
                {visibleColumns.includes("tokenType") && (
                  <TableCell>
                    {(() => {
                      // Extract the token standard
                      const standard = allocation.tokenStandard || allocation.dbStandard || extractStandard((allocation.tokenType || allocation.token_type) || "");
                      
                      // Get the theme based on the standard directly
                      const theme = getTokenTypeTheme(standard || (allocation.tokenType || allocation.token_type) || "");
                      
                      // Split the token type to get name and standard separately
                      const tokenTypeParts = (allocation.tokenType || allocation.token_type || "").split(" - ");
                      const displayName = tokenTypeParts[0] || (allocation.tokenType || allocation.token_type);
                      
                      // Debug logs
                      console.log(`🟢 ROW: Processing ${allocation.id} - token type: "${allocation.tokenType || allocation.token_type}"`);
                      console.log(`🟢 ROW: Using standard: "${standard}" (DB: ${allocation.dbStandard})`);
                      console.log(`🟢 ROW: Applied theme:`, theme?.badge);
                      
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
                
                {visibleColumns.includes("allocatedAmount") && (
                  <TableCell className="text-right">
                    {editMode[allocation.id] ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={editValues[allocation.id] || ""}
                          onChange={(e) => handleInputChange(allocation.id, e.target.value)}
                          className="w-24 h-8 text-right"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave(allocation.id);
                            if (e.key === "Escape") handleCancel(allocation.id, (allocation.allocatedAmount || allocation.token_amount || allocation.subscribedAmount) || 0);
                          }}
                        />
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleSave(allocation.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCancel(allocation.id, allocation.allocatedAmount || allocation.subscribedAmount || 0)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer hover:underline"
                        onClick={() => handleEdit(allocation.id, allocation.allocatedAmount || allocation.subscribedAmount || 0)}
                      >
                        {formatCurrency(allocation.allocatedAmount || allocation.subscribedAmount || 0)}
                      </div>
                    )}
                  </TableCell>
                )}
                
                {visibleColumns.includes("status") && (
                  <TableCell className="text-center">
                    {allocation.isUpdating ? (
                      <div className="flex justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (allocation.allocationConfirmed ?? Boolean(allocation.allocation_date)) ? (
                      <Badge className="bg-green-100 text-green-800">CONFIRMED</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">UNCONFIRMED</Badge>
                    )}
                  </TableCell>
                )}
                
                {visibleColumns.includes("walletAddress") && (
                  <TableCell className="font-mono text-xs truncate max-w-[150px]">
                    <div className="flex items-center space-x-1">
                      <span className="truncate">
                        {allocation.walletAddress || "Not set"}
                      </span>
                      {allocation.walletAddress && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1"
                          title="Copy Address"
                          onClick={() => handleCopyAddress(allocation.walletAddress || "")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
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
                        onClick={() => onEditAllocation(allocation)}
                        disabled={allocation.isUpdating}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Token Type
                      </DropdownMenuItem>
                      {!(allocation.allocationConfirmed ?? Boolean(allocation.allocation_date)) && (
                        <DropdownMenuItem
                          onClick={() => {
                            onUpdateAllocation(
                              allocation.id,
                              (allocation.allocatedAmount || allocation.token_amount),
                              () => {
                                toast({
                                  title: "Allocation confirmed",
                                  description: "Token allocation has been confirmed successfully",
                                });
                              },
                              (error) => {
                                toast({
                                  title: "Error confirming allocation",
                                  description: error,
                                  variant: "destructive",
                                });
                              }
                            );
                          }}
                          disabled={allocation.isUpdating}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Confirm Allocation
                        </DropdownMenuItem>
                      )}
                      {(allocation.allocationConfirmed ?? Boolean(allocation.allocation_date)) && (
                        <DropdownMenuItem
                          onClick={() => {
                            // For unconfirming, we need to update the backend to set allocation_date to null
                            // We'll use the existing amount but trigger an update to allocation_date via the manager
                            onUpdateAllocation(
                              allocation.id,
                              (allocation.allocatedAmount || allocation.token_amount),
                              () => {
                                toast({
                                  title: "Allocation unconfirmed",
                                  description: "Token allocation has been unconfirmed successfully",
                                });
                              },
                              (error) => {
                                toast({
                                  title: "Error unconfirming allocation",
                                  description: error,
                                  variant: "destructive",
                                });
                              }
                            );
                          }}
                          disabled={allocation.isUpdating}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Unconfirm Allocation
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          onUpdateAllocation(
                            allocation.id,
                            0,
                            () => {
                              toast({
                                title: "Allocation deleted",
                                description: "Token allocation has been deleted successfully",
                              });
                            },
                            (error) => {
                              toast({
                                title: "Error deleting allocation",
                                description: error,
                                variant: "destructive",
                              });
                            }
                          );
                        }}
                        className="text-red-600"
                        disabled={allocation.isUpdating}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Allocation
                      </DropdownMenuItem>
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
              {visibleColumns.includes("allocatedAmount") && (
                <TableCell colSpan={visibleColumns.includes("tokenType") ? 1 : 2} className="text-right font-bold">
                  {formatCurrency(grandTotal.allocated)}
                </TableCell>
              )}
              <TableCell colSpan={2}></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};

export default TokenAllocationsTable;
