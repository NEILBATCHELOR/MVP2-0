import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Copy } from "lucide-react";

interface DuplicatePolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

const DuplicatePolicyDialog = ({
  open,
  onOpenChange,
  policyName,
  onConfirm,
  onCancel,
}: DuplicatePolicyDialogProps) => {
  const [newPolicyName, setNewPolicyName] = useState(`${policyName} (Copy)`);
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!newPolicyName.trim()) {
      setError("Policy name cannot be empty");
      return;
    }
    onConfirm(newPolicyName);
    setNewPolicyName("");
    setError("");
  };

  const handleCancel = () => {
    onCancel();
    setNewPolicyName("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-blue-600" />
            <DialogTitle>Duplicate Policy</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Create a copy of <span className="font-medium">{policyName}</span>{" "}
            as a starting point for a new policy.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newPolicyName" className="text-sm font-medium">
              New Policy Name
            </Label>
            <Input
              id="newPolicyName"
              value={newPolicyName}
              onChange={(e) => {
                setNewPolicyName(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              placeholder="Enter new policy name"
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
            <p>The duplicated policy will include:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>All rules and conditions</li>
              <li>Jurisdiction and effective dates</li>
              <li>Tags and metadata</li>
              <li>Approval workflow settings</li>
            </ul>
            <p className="mt-2 text-xs">
              Note: The duplicated policy will be created as a draft.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-[#0f172b] hover:bg-[#0f172b]/90"
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicatePolicyDialog;
