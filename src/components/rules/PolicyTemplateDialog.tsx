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
import { Textarea } from "../ui/textarea";
import { BookmarkPlus } from "lucide-react";

interface PolicyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyData: any;
  onConfirm: (templateName: string, templateDescription: string) => void;
  onCancel: () => void;
}

const PolicyTemplateDialog = ({
  open,
  onOpenChange,
  policyData,
  onConfirm,
  onCancel,
}: PolicyTemplateDialogProps) => {
  const [templateName, setTemplateName] = useState(
    policyData?.name ? `${policyData.name} Template` : "New Policy Template",
  );
  const [templateDescription, setTemplateDescription] = useState(
    policyData?.description || "",
  );
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!templateName.trim()) {
      setError("Template name cannot be empty");
      return;
    }
    onConfirm(templateName, templateDescription);
    setTemplateName("");
    setTemplateDescription("");
    setError("");
  };

  const handleCancel = () => {
    onCancel();
    setTemplateName("");
    setTemplateDescription("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookmarkPlus className="h-5 w-5 text-blue-600" />
            <DialogTitle>Save as Policy Template</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Save this policy configuration as a reusable template for future
            policies.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="templateName" className="text-sm font-medium">
              Template Name
            </Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              placeholder="Enter template name"
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="templateDescription"
              className="text-sm font-medium"
            >
              Template Description
            </Label>
            <Textarea
              id="templateDescription"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe what this template is for"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
            <p>This template will include:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>All rules and conditions</li>
              <li>Jurisdiction and effective dates</li>
              <li>Approval workflow settings</li>
              <li>Tags and metadata</li>
            </ul>
            <p className="mt-2 text-xs">
              Note: Templates can be used as starting points for new policies.
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
            <BookmarkPlus className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyTemplateDialog;
