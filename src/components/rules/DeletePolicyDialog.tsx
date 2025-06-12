import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DeletePolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeletePolicyDialog = ({
  open,
  onOpenChange,
  policyName,
  onConfirm,
  onCancel,
}: DeletePolicyDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Are you sure you want to delete{" "}
            <span className="font-medium">{policyName}</span>? This action
            cannot be undone and all associated rules and approvers will be
            permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Policy
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePolicyDialog;
