// TokenDistributionHelpers.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, CheckCircle2, ArrowRight, FileText, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils";
import { TokenAllocation } from "./TokenDistributionHooks";
import BulkEditAllocations from "./BulkEditAllocations";
import { NavigationItem } from "./TokenDistributionHooks";

interface StatusMessageProps {
  message: string | null;
}

export function StatusMessage({ message }: StatusMessageProps) {
  if (!message) return null;
  
  return (
    <Alert className="mb-4">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

interface NavigationCardsProps {
  items: NavigationItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  distributedCount: number;
  totalAllocationValue: number;
}

export function NavigationCards({
  items,
  activeTab,
  setActiveTab,
  pendingCount,
  distributedCount,
  totalAllocationValue
}: NavigationCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <div 
          key={item.id}
          onClick={() => {
            if (activeTab !== item.id) {
              setActiveTab(item.id);
            }
          }}
          className={cn(
            "cursor-pointer transition-all duration-200 ease-in-out",
            "transform hover:-translate-y-1 hover:shadow-lg",
            "border rounded-lg overflow-hidden",
            activeTab === item.id 
              ? "border-primary bg-primary/5 shadow-md" 
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-full",
                  activeTab === item.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-medium">{item.label}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
              {item.count !== undefined && (
                <Badge variant={activeTab === item.id ? "default" : "outline"} className="ml-2">
                  {item.count}
                </Badge>
              )}
            </div>
            
            {activeTab === item.id && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  {item.id === "allocations" && (
                    <>
                      <span>Ready to distribute</span>
                      <span>{pendingCount} allocations</span>
                    </>
                  )}
                  {item.id === "distributed" && (
                    <>
                      <span>Total value distributed</span>
                      <span>${distributedCount > 0 ? totalAllocationValue.toLocaleString() : "0"}</span>
                    </>
                  )}
                  {item.id === "investors" && (
                    <>
                      <span>Total allocation value</span>
                      <span>${totalAllocationValue.toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface BulkActionsProps {
  selectedRows: string[];
  bulkDeleteLoading: boolean;
  handleClearSelection: () => void;
  handleBulkDeleteSelected: () => void;
  getSelectedAllocations: (allocations: TokenAllocation[]) => TokenAllocation[];
  allocations: TokenAllocation[];
  fetchData: () => Promise<void>;
}

export function BulkActions({
  selectedRows,
  bulkDeleteLoading,
  handleClearSelection,
  handleBulkDeleteSelected,
  getSelectedAllocations,
  allocations,
  fetchData
}: BulkActionsProps) {
  return (
    <div className="flex ml-4 space-x-2">
      <Button variant="outline" size="sm" onClick={handleClearSelection}>
        Clear Selection ({selectedRows.length})
      </Button>
      <BulkEditAllocations
        selectedAllocations={getSelectedAllocations(allocations)}
        onRefresh={fetchData}
        onDeselectAll={handleClearSelection}
      />
      <Button
        variant="destructive"
        size="sm"
        onClick={handleBulkDeleteSelected}
        disabled={bulkDeleteLoading || selectedRows.length === 0}
      >
        {bulkDeleteLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Deleting...
          </>
        ) : (
          `Delete Selected (${selectedRows.length})`
        )}
      </Button>
    </div>
  );
}

export function createNavigationItems(
  pendingCount: number,
  distributedCount: number,
  investorCount: number
): NavigationItem[] {
  return [
    {
      id: "allocations",
      label: "Pending Allocations",
      icon: <FileText className="h-5 w-5" />,
      description: "Manage and distribute token allocations",
      count: pendingCount
    },
    {
      id: "distributed",
      label: "Distributed Tokens",
      icon: <Wallet className="h-5 w-5" />,
      description: "View completed token distributions",
      count: distributedCount
    },
    {
      id: "investors",
      label: "Investors",
      icon: <Users className="h-5 w-5" />,
      description: "Manage investors and their token allocations",
      count: investorCount
    }
  ];
}