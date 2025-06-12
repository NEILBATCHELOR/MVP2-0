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
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing: boolean;
  itemName: string;
  itemType: string;
}

const DeleteConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isProcessing,
  itemName,
  itemType,
}: DeleteConfirmationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete{" "}
            {itemType
              ? itemType.charAt(0).toUpperCase() + itemType.slice(1)
              : "Item"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{itemName}</span>? This action
            cannot be undone and all associated data will be permanently
            removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
