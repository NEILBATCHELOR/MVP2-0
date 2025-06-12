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
import { CheckSquare, Loader2 } from "lucide-react";

interface SubscriptionConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => void;
}

const SubscriptionConfirmationDialog = ({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: SubscriptionConfirmationDialogProps) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const handleConfirm = async () => {
    if (!confirmationChecked || selectedCount === 0) return;

    try {
      setIsConfirming(true);
      await onConfirm();
      setConfirmationChecked(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error confirming subscriptions:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span>Confirm Subscriptions</span>
          </DialogTitle>
          <DialogDescription>
            Confirm {selectedCount} selected subscription
            {selectedCount !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md border p-4 space-y-2">
            <p className="text-sm">
              You are about to confirm {selectedCount} subscription
              {selectedCount !== 1 ? "s" : ""}. This action will lock in the
              subscription details and prepare them for token allocation.
            </p>
            <p className="text-sm font-medium mt-2">
              Once confirmed, subscription details cannot be modified.
            </p>
          </div>

          <div className="flex items-start space-x-2 pt-4">
            <Checkbox
              id="confirmation"
              checked={confirmationChecked}
              onCheckedChange={(checked) => setConfirmationChecked(!!checked)}
            />
            <Label
              htmlFor="confirmation"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I confirm that all subscription details are correct and I want to
              proceed with confirming these subscriptions.
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
              !confirmationChecked || selectedCount === 0 || isConfirming
            }
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              "Confirm Subscriptions"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionConfirmationDialog;
