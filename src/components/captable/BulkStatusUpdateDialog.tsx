import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface BulkStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  selectedCount: number;
  statusOptions: { value: string; label: string }[];
  onConfirm: (newStatus: string) => Promise<void>;
}

const BulkStatusUpdateDialog = ({
  open,
  onOpenChange,
  title,
  description,
  selectedCount,
  statusOptions,
  onConfirm,
}: BulkStatusUpdateDialogProps) => {
  const [selectedStatus, setSelectedStatus] = React.useState<string>("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSelectedStatus("");
      setIsProcessing(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!selectedStatus) return;

    try {
      setIsProcessing(true);
      await onConfirm(selectedStatus);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm">
            You are about to update the status of{" "}
            <strong>{selectedCount}</strong> selected items.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStatus || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkStatusUpdateDialog;
