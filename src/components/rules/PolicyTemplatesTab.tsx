import React, { useState } from "react";
import PolicyTemplateList from "./PolicyTemplateList";
import { Button } from "../ui/button";
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

interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  createdAt: string;
  tags: string[];
  rules: any[];
  approvers: any[];
  isTemplate: boolean;
  status: string;
}

interface PolicyTemplatesTabProps {
  templates: PolicyTemplate[];
  onUseTemplate: (template: PolicyTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onToggleStatus?: (templateId: string, newStatus: string) => void;
}

const PolicyTemplatesTab = ({
  templates = [],
  onUseTemplate = () => {},
  onDeleteTemplate = () => {},
  onToggleStatus,
}: PolicyTemplatesTabProps) => {
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      onDeleteTemplate(templateToDelete);
      setTemplateToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const cancelDelete = () => {
    setTemplateToDelete(null);
    setShowDeleteDialog(false);
  };

  return (
    <div>
      <PolicyTemplateList
        templates={templates}
        onUseTemplate={onUseTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PolicyTemplatesTab;
