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
import { History, Save } from "lucide-react";

interface PolicyTemplateVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  currentVersion: string;
  onConfirm: (version: string, notes: string) => void;
  onCancel: () => void;
}

const PolicyTemplateVersionDialog = ({
  open,
  onOpenChange,
  templateName,
  currentVersion,
  onConfirm,
  onCancel,
}: PolicyTemplateVersionDialogProps) => {
  // Calculate a new version by incrementing the current one or starting at "1.0"
  const getNextVersion = () => {
    if (!currentVersion) return "1.0";
    
    // Try to parse the version as semantic versioning
    const parts = currentVersion.split(".");
    if (parts.length >= 2) {
      const major = parseInt(parts[0], 10);
      const minor = parseInt(parts[1], 10);
      
      // Increment the minor version
      return `${major}.${minor + 1}`;
    }
    
    // If we can't parse it, just append .1
    return `${currentVersion}.1`;
  };
  
  const [version, setVersion] = useState(getNextVersion());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!version.trim()) {
      setError("Version cannot be empty");
      return;
    }
    onConfirm(version, notes);
    setVersion("");
    setNotes("");
    setError("");
  };

  const handleCancel = () => {
    onCancel();
    setVersion("");
    setNotes("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <DialogTitle>Save New Template Version</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Save a new version of "{templateName}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="version" className="text-sm font-medium">
              Version Number
            </Label>
            <Input
              id="version"
              value={version}
              onChange={(e) => {
                setVersion(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              placeholder="e.g. 1.0, 2.1"
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="versionNotes"
              className="text-sm font-medium"
            >
              Version Notes (Optional)
            </Label>
            <Textarea
              id="versionNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what changed in this version"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
            <p>This version will include:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Current state of all rules and conditions</li>
              <li>Current approvers configuration</li>
              <li>Any changes since the last version</li>
            </ul>
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
            <Save className="mr-2 h-4 w-4" />
            Save Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyTemplateVersionDialog;