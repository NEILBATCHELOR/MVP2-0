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
import { Download, FileText, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TokenAllocationExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
  selectedCount: number;
  totalCount: number;
}

export interface ExportOptions {
  exportType: "selected" | "all";
  fileFormat: "csv" | "excel";
  includeInvestorDetails: boolean;
  includeSubscriptionDetails: boolean;
  includeStatus: boolean;
  includeTokenDetails: boolean;
}

const TokenAllocationExportDialog = ({
  open,
  onOpenChange,
  onExport,
  selectedCount,
  totalCount,
}: TokenAllocationExportDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    exportType: selectedCount > 0 ? "selected" : "all",
    fileFormat: "csv",
    includeInvestorDetails: true,
    includeSubscriptionDetails: true,
    includeStatus: true,
    includeTokenDetails: true,
  });

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      await onExport(exportOptions);
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <span>Export Token Allocations</span>
          </DialogTitle>
          <DialogDescription>
            Export token allocation data to CSV or Excel format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Export Range</h3>
              <RadioGroup
                value={exportOptions.exportType}
                onValueChange={(value) =>
                  setExportOptions({
                    ...exportOptions,
                    exportType: value as "selected" | "all",
                  })
                }
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="selected"
                    id="selected"
                    disabled={selectedCount === 0}
                  />
                  <Label htmlFor="selected" className="cursor-pointer">
                    Selected allocations ({selectedCount})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer">
                    All allocations ({totalCount})
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">File Format</h3>
              <RadioGroup
                value={exportOptions.fileFormat}
                onValueChange={(value) =>
                  setExportOptions({
                    ...exportOptions,
                    fileFormat: value as "csv" | "excel",
                  })
                }
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="cursor-pointer">
                    CSV (.csv)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excel" id="excel" />
                  <Label htmlFor="excel" className="cursor-pointer">
                    Excel (.xlsx)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Include Fields</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeInvestorDetails"
                    checked={exportOptions.includeInvestorDetails}
                    onCheckedChange={(checked) =>
                      setExportOptions({
                        ...exportOptions,
                        includeInvestorDetails: !!checked,
                      })
                    }
                  />
                  <Label
                    htmlFor="includeInvestorDetails"
                    className="cursor-pointer"
                  >
                    Include investor details (name, email, wallet address)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSubscriptionDetails"
                    checked={exportOptions.includeSubscriptionDetails}
                    onCheckedChange={(checked) =>
                      setExportOptions({
                        ...exportOptions,
                        includeSubscriptionDetails: !!checked,
                      })
                    }
                  />
                  <Label
                    htmlFor="includeSubscriptionDetails"
                    className="cursor-pointer"
                  >
                    Include subscription details (ID, currency, amount)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeStatus"
                    checked={exportOptions.includeStatus}
                    onCheckedChange={(checked) =>
                      setExportOptions({
                        ...exportOptions,
                        includeStatus: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="includeStatus" className="cursor-pointer">
                    Include status fields (confirmed, distributed)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeTokenDetails"
                    checked={exportOptions.includeTokenDetails}
                    onCheckedChange={(checked) =>
                      setExportOptions({
                        ...exportOptions,
                        includeTokenDetails: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="includeTokenDetails" className="cursor-pointer">
                    Include token details (token name, token symbol, token status)
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/20 p-4 rounded-md">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="text-sm font-medium">Export Information</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The export will include token type, allocation amounts, and
                  dates, along with token names and statuses. Additional fields can be selected above.
                </p>
              </div>
            </div>
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
          <Button onClick={handleExport} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              "Export"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TokenAllocationExportDialog;
