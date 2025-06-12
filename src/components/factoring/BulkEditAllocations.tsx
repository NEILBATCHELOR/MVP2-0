import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, AlertCircle, FileEdit, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/infrastructure/database/client";
import { TokenAllocation } from "./TokenDistributionHooks";
import { TokenStandard } from "@/types/core/centralModels";

interface BulkEditAllocationsProps {
  selectedAllocations: TokenAllocation[];
  onRefresh: () => void;
  onDeselectAll: () => void;
}

const BulkEditAllocations: React.FC<BulkEditAllocationsProps> = ({
  selectedAllocations,
  onRefresh,
  onDeselectAll,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editField, setEditField] = useState<string>("");
  const [editValue, setEditValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle bulk delete of token allocations
  const handleBulkDelete = async () => {
    try {
      setDeleteLoading(true);
      setError(null);
      
      // Check if any selected allocations are already distributed
      const distributedAllocations = selectedAllocations.filter(
        allocation => allocation.distributionStatus === 'completed'
      );
      
      if (distributedAllocations.length > 0) {
        setError(
          `Cannot delete ${distributedAllocations.length} allocation(s) that have already been distributed.`
        );
        return;
      }
      
      // Get all allocation IDs to delete
      const allocationIds = selectedAllocations.map(allocation => allocation.id);
      
      // For each allocation to delete, get the subscription ID first
      // We'll need to clean up subscription entries if there are no other references to them
      const { data: allocationData, error: fetchError } = await supabase
        .from('token_allocations')
        .select('id, subscription_id')
        .in('id', allocationIds);
      
      if (fetchError) throw fetchError;
      
      // Delete the allocations
      const { error } = await supabase
        .from("token_allocations")
        .delete()
        .in("id", allocationIds);
      
      if (error) throw error;
      
      // Get subscription IDs to clean up
      const subscriptionIds = allocationData?.map(a => a.subscription_id) || [];
      
      // Only delete subscriptions that have no other allocations
      for (const subId of subscriptionIds) {
        // Check if there are any allocations still using this subscription
        const { data: remainingAllocations, error: checkError } = await supabase
          .from('token_allocations')
          .select('id')
          .eq('subscription_id', subId)
          .limit(1);
        
        if (checkError) throw checkError;
        
        // If no allocations reference this subscription, we can delete it
        if (!remainingAllocations || remainingAllocations.length === 0) {
          const { error: deleteSubError } = await supabase
            .from('subscriptions')
            .delete()
            .eq('id', subId);
          
          if (deleteSubError) console.error(`Failed to delete orphaned subscription ${subId}:`, deleteSubError);
        }
      }
      
      toast({
        title: "Success",
        description: `Successfully deleted ${allocationIds.length} allocation(s)`,
      });
      
      // Close dialog and refresh data
      setIsDeleteDialogOpen(false);
      onDeselectAll();
      onRefresh();
    } catch (error) {
      console.error("Error deleting allocations:", error);
      setError(error instanceof Error ? error.message : String(error));
      toast({
        title: "Error",
        description: "Failed to delete allocations",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle bulk edit of token allocations
  const handleBulkEdit = async () => {
    try {
      setEditLoading(true);
      setError(null);
      
      // Get all allocation IDs to update
      const allocationIds = selectedAllocations.map(allocation => allocation.id);
      
      // Check if selected field is valid
      if (!editField) {
        setError("Please select a field to edit");
        return;
      }
      
      // Check if edit value is valid
      if (!editValue && editField !== "notes" && editField !== "distributionStatus") {
        setError("Please enter a value");
        return;
      }
      
      // Create update object
      const updateData: Record<string, any> = {};
      
      // Convert the field name to snake_case for Supabase
      const snakeCaseField = editField.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      
      // Convert value to appropriate type
      if (editField === "tokenAmount") {
        const numValue = parseFloat(editValue);
        if (isNaN(numValue) || numValue <= 0) {
          setError("Token amount must be a positive number");
          return;
        }
        updateData[snakeCaseField] = numValue;
      } else if (editField === "notes") {
        updateData[snakeCaseField] = editValue || null;
      } else if (editField === "distributionStatus") {
        if (!["pending", "completed"].includes(editValue)) {
          setError("Invalid distribution status");
          return;
        }
        updateData[snakeCaseField] = editValue;
      } else if (editField === "standard") {
        // Validate token standard against enum values
        const validStandards = [
          TokenStandard.ERC20,
          TokenStandard.ERC721, 
          TokenStandard.ERC1155, 
          TokenStandard.ERC1400, 
          TokenStandard.ERC3525, 
          TokenStandard.ERC4626
        ];
        
        // Convert from UI format (ERC-20) to enum format if needed
        let standardValue: typeof TokenStandard[keyof typeof TokenStandard] | null = null;
        
        // Map the UI selection to the proper enum value
        if (editValue === "ERC-20") standardValue = TokenStandard.ERC20;
        else if (editValue === "ERC-721") standardValue = TokenStandard.ERC721;
        else if (editValue === "ERC-1155") standardValue = TokenStandard.ERC1155; 
        else if (editValue === "ERC-1400") standardValue = TokenStandard.ERC1400;
        else if (editValue === "ERC-3525") standardValue = TokenStandard.ERC3525;
        else if (editValue === "ERC-4626") standardValue = TokenStandard.ERC4626;
        
        if (!standardValue) {
          setError("Invalid token standard");
          return;
        }
        
        updateData[snakeCaseField] = standardValue;
      } else if (editField === "symbol") {
        if (!editValue) {
          setError("Token symbol cannot be empty");
          return;
        }
        updateData[snakeCaseField] = editValue;
      } else {
        updateData[snakeCaseField] = editValue;
      }

      // Check if any selected allocations are already distributed
      const distributedAllocations = selectedAllocations.filter(
        allocation => allocation.distributionStatus === 'completed'
      );
      
      // For distributed allocations, we only allow updating certain fields
      const allowedFieldsForDistributed = ["notes", "distributionStatus", "standard", "symbol"];
      
      if (distributedAllocations.length > 0 && !allowedFieldsForDistributed.includes(editField)) {
        setError(
          `Cannot modify ${distributedAllocations.length} allocation(s) that have already been distributed. You can only update notes, distribution status, token standard, or symbol for distributed allocations.`
        );
        return;
      }
      
      // Update allocations
      const { error } = await supabase
        .from("token_allocations")
        .update(updateData)
        .in("id", allocationIds);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Successfully updated ${allocationIds.length} allocation(s)`,
      });
      
      // Close dialog and refresh data
      setIsEditDialogOpen(false);
      onDeselectAll();
      onRefresh();
    } catch (error) {
      console.error("Error updating allocations:", error);
      setError(error instanceof Error ? error.message : String(error));
      toast({
        title: "Error",
        description: "Failed to update allocations",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
      {/* Edit Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditDialogOpen(true)}
        disabled={selectedAllocations.length === 0}
      >
        <FileEdit className="h-4 w-4 mr-2" />
        Edit {selectedAllocations.length} Selected
      </Button>
      
      {/* Delete Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDeleteDialogOpen(true)}
        disabled={selectedAllocations.length === 0}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete {selectedAllocations.length} Selected
      </Button>
      
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAllocations.length} selected allocation(s)?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-medium">Selected Allocations:</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedAllocations.map((allocation) => (
                  <Badge key={allocation.id} variant={allocation.distributionStatus === 'completed' ? "default" : "outline"}>
                    {allocation.investorName} - {allocation.tokenAmount.toLocaleString()} tokens
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Allocations"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit Allocations</DialogTitle>
            <DialogDescription>
              Edit {selectedAllocations.length} selected allocation(s).
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="editField">Select Field to Edit</Label>
              <Select value={editField} onValueChange={setEditField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tokenAmount">Token Amount</SelectItem>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="distributionStatus">Distribution Status</SelectItem>
                  <SelectItem value="standard">Token Standard</SelectItem>
                  <SelectItem value="symbol">Token Symbol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {editField && (
              <div>
                <Label htmlFor="editValue">
                  {editField === "tokenAmount"
                    ? "New Token Amount"
                    : editField === "notes"
                    ? "New Notes"
                    : editField === "standard"
                    ? "New Token Standard"
                    : editField === "symbol"
                    ? "New Token Symbol"
                    : "New Status"}
                </Label>
                {editField === "distributionStatus" ? (
                  <Select value={editValue} onValueChange={setEditValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : editField === "standard" ? (
                  <Select value={editValue} onValueChange={setEditValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select token standard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERC-20">ERC-20</SelectItem>
                      <SelectItem value="ERC-721">ERC-721</SelectItem>
                      <SelectItem value="ERC-1155">ERC-1155</SelectItem>
                      <SelectItem value="ERC-1400">ERC-1400</SelectItem>
                      <SelectItem value="ERC-3525">ERC-3525</SelectItem>
                      <SelectItem value="ERC-4626">ERC-4626</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="editValue"
                    type={editField === "tokenAmount" ? "number" : "text"}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder={
                      editField === "tokenAmount" ? "Enter token amount" : 
                      editField === "symbol" ? "Enter token symbol" :
                      "Enter notes"
                    }
                  />
                )}
              </div>
            )}
            
            <div>
              <h3 className="font-medium">Selected Allocations:</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedAllocations.map((allocation) => (
                  <Badge key={allocation.id} variant={allocation.distributionStatus === 'completed' ? "default" : "outline"}>
                    {allocation.investorName} - {allocation.tokenAmount.toLocaleString()} tokens
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkEdit}
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Allocations"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkEditAllocations; 