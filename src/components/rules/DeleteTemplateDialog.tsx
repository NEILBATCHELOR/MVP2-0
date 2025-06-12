import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertCircle, Trash2 } from "lucide-react";

interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteTemplateDialog = ({
  open,
  onOpenChange,
  templateName,
  onConfirm,
  onCancel,
}: DeleteTemplateDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-col items-center justify-center text-center">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl">Delete Template</DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to delete "{templateName}"? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 my-4 text-sm text-orange-800">
          <p>
            <strong>Warning:</strong> Deleting this template will permanently
            remove it and all associated versions from the system. This will not affect any
            policies that were created from this template.
          </p>
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTemplateDialog;