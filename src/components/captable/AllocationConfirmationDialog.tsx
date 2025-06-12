import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2 } from "lucide-react";

interface Allocation {
  investorId: string;
  investorName: string;
  tokenType: string;
  amount: number;
}

interface AllocationConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvestorIds: string[];
  onConfirm: () => void;
  projectId: string;
  allocations: Allocation[];
}

const AllocationConfirmationDialog = ({
  open,
  onOpenChange,
  selectedInvestorIds,
  onConfirm,
  projectId,
  allocations = [],
}: AllocationConfirmationDialogProps) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const handleConfirm = async () => {
    if (!confirmationChecked || selectedInvestorIds.length === 0) return;

    try {
      setIsConfirming(true);
      await onConfirm();
      setConfirmationChecked(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error confirming allocations:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span>Confirm Allocations</span>
          </DialogTitle>
          <DialogDescription>
            Confirm token allocations for {selectedInvestorIds.length} selected
            investor{selectedInvestorIds.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {allocations.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left">Investor</th>
                    <th className="px-4 py-2 text-left">Token Type</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((allocation, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="px-4 py-2">{allocation.investorName}</td>
                      <td className="px-4 py-2">
                        {allocation.tokenType || "Not assigned"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(allocation.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-md border p-4 text-center text-muted-foreground">
              No allocations found for selected investors. Please ensure
              investors have confirmed subscriptions and allocated tokens.
            </div>
          )}

          <div className="rounded-md border p-4 space-y-2">
            <p className="text-sm">
              You are about to confirm token allocations for{" "}
              {selectedInvestorIds.length} investor
              {selectedInvestorIds.length !== 1 ? "s" : ""}. This action will
              lock in the allocation details and prepare them for token
              distribution.
            </p>
            <p className="text-sm font-medium mt-2">
              Once confirmed, allocation details cannot be modified.
            </p>
          </div>

          <div className="flex items-start space-x-2 pt-4">
            <Checkbox
              id="confirmation"
              checked={confirmationChecked}
              onCheckedChange={(checked) => setConfirmationChecked(!!checked)}
              disabled={allocations.length === 0}
            />
            <Label
              htmlFor="confirmation"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I confirm that all allocation details are correct and I want to
              proceed with confirming these allocations.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              !confirmationChecked ||
              selectedInvestorIds.length === 0 ||
              isConfirming ||
              allocations.length === 0
            }
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              "Confirm Allocations"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AllocationConfirmationDialog;
