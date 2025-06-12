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
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Separator } from "../ui/separator";
import { Download, FileJson, FileText, Check } from "lucide-react";

interface PolicyExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policies: any[];
  selectedPolicyIds?: string[];
}

const PolicyExportDialog = ({
  open,
  onOpenChange,
  policies,
  selectedPolicyIds = [],
}: PolicyExportDialogProps) => {
  const [exportFormat, setExportFormat] = useState<"json" | "pdf">("json");
  const [exportScope, setExportScope] = useState<"selected" | "all">(
    "selected",
  );

  const handleExport = () => {
    // Determine which policies to export
    const policiesToExport =
      exportScope === "selected"
        ? policies.filter((policy) => selectedPolicyIds.includes(policy.id))
        : policies;

    if (policiesToExport.length === 0) {
      alert("No policies selected for export");
      return;
    }

    if (exportFormat === "json") {
      // Export as JSON
      const jsonData = JSON.stringify(policiesToExport, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `policies_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For PDF export, in a real app you would use a library like jsPDF or pdfmake
      // Here we'll just show an alert for demonstration
      alert(
        "PDF export would be implemented with a PDF generation library in a production app.",
      );
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Policies</DialogTitle>
          <DialogDescription>
            Export your policies for backup or sharing purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) =>
                setExportFormat(value as "json" | "pdf")
              }
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="json" id="format-json" />
                <Label
                  htmlFor="format-json"
                  className="flex items-center cursor-pointer"
                >
                  <FileJson className="mr-2 h-5 w-5 text-blue-500" />
                  <div>
                    <div>JSON Format</div>
                    <p className="text-xs text-gray-500">
                      Export as a structured JSON file for programmatic use or
                      importing into another system.
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="pdf" id="format-pdf" />
                <Label
                  htmlFor="format-pdf"
                  className="flex items-center cursor-pointer"
                >
                  <FileText className="mr-2 h-5 w-5 text-red-500" />
                  <div>
                    <div>PDF Format</div>
                    <p className="text-xs text-gray-500">
                      Export as a formatted PDF document for easy sharing and
                      printing.
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Policies to Export</Label>
            <RadioGroup
              value={exportScope}
              onValueChange={(value) =>
                setExportScope(value as "selected" | "all")
              }
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="selected" id="scope-selected" />
                <Label
                  htmlFor="scope-selected"
                  className="flex items-center cursor-pointer"
                >
                  <div>
                    <div>Selected Policies</div>
                    <p className="text-xs text-gray-500">
                      Export only the {selectedPolicyIds.length} selected
                      {selectedPolicyIds.length === 1 ? " policy" : " policies"}
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="all" id="scope-all" />
                <Label
                  htmlFor="scope-all"
                  className="flex items-center cursor-pointer"
                >
                  <div>
                    <div>All Policies</div>
                    <p className="text-xs text-gray-500">
                      Export all {policies.length} policies in your system
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            className="bg-[#0f172b] hover:bg-[#0f172b]/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Export {exportFormat.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyExportDialog;
