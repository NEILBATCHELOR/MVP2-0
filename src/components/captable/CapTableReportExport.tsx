import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CapTableReportExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: string;
  projectId: string;
  investors: any[];
  projectData: any;
}

const CapTableReportExport = ({
  open,
  onOpenChange,
  reportType,
  projectId,
  investors,
  projectData,
}: CapTableReportExportProps) => {
  const [exportFormat, setExportFormat] = useState("pdf");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const getReportTitle = () => {
    switch (reportType) {
      case "ownership":
        return "Ownership Distribution Report";
      case "investors":
        return "Investor Analysis Report";
      case "securities":
        return "Securities Breakdown Report";
      case "timeline":
        return "Investment Timeline Report";
      case "analytics":
        return "Cap Table Analytics Report";
      default:
        return "Cap Table Report";
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // In a real implementation, this would call an API to generate the report
      // For now, we'll simulate the export process

      // Prepare the export data
      const exportData = {
        reportType,
        format: exportFormat,
        options: {
          includeCharts,
          includeRawData,
          includeSummary,
        },
        projectId,
        projectData,
        investors,
        generatedAt: new Date().toISOString(),
      };

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demonstration, we'll just log the export data
      console.log("Exporting report:", exportData);

      // In a real implementation, we would generate and download the file
      // For now, we'll just show a success message
      toast({
        title: "Report Exported",
        description: `${getReportTitle()} has been exported as ${exportFormat.toUpperCase()}.`,
      });

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Export Failed",
        description:
          "There was an error exporting the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Export {getReportTitle()}</span>
          </DialogTitle>
          <DialogDescription>
            Choose export options for your report.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                <SelectItem value="csv">CSV File</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Report Contents</Label>
            <div className="space-y-2 rounded-md border p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                />
                <Label
                  htmlFor="includeCharts"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include charts and visualizations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRawData"
                  checked={includeRawData}
                  onCheckedChange={(checked) => setIncludeRawData(checked === true)}
                />
                <Label
                  htmlFor="includeRawData"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include raw data tables
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                />
                <Label
                  htmlFor="includeSummary"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include summary statistics
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CapTableReportExport;
