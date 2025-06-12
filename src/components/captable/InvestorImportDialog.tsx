import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/infrastructure/database/client";

interface InvestorImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onImportComplete: (investors: any[]) => void;
}

const InvestorImportDialog = ({
  open,
  onOpenChange,
  projectId,
  onImportComplete,
}: InvestorImportDialogProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportErrors([]);
    setPreviewData(null);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        setImportErrors(["Please upload a CSV file."]);
        setCsvFile(null);
        return;
      }

      setCsvFile(file);
      previewCsv(file);
    }
  };

  const previewCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n");

        if (lines.length <= 1) {
          setImportErrors(["The CSV file appears to be empty or invalid."]);
          return;
        }

        // Parse CSV
        const headers = hasHeaders
          ? lines[0].split(",").map((h) => h.trim())
          : ["Name", "Email", "Type", "Status", "Wallet Address"];

        // Validate required headers
        const requiredHeaders = ["Name", "Email"];
        const missingHeaders = requiredHeaders.filter(
          (h) =>
            !headers.some((header) => header.toLowerCase() === h.toLowerCase()),
        );

        if (missingHeaders.length > 0) {
          setImportErrors([
            `Missing required headers: ${missingHeaders.join(", ")}`,
          ]);
          return;
        }

        // Parse data rows
        const startRow = hasHeaders ? 1 : 0;
        const data = [];

        for (let i = startRow; i < Math.min(startRow + 5, lines.length); i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(",").map((v) => v.trim());
          const row: Record<string, string> = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          data.push(row);
        }

        setPreviewData(data);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setImportErrors(["Failed to parse CSV file. Please check the format."]);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvFile) return;

    try {
      setIsImporting(true);
      setImportErrors([]);

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n");

          if (lines.length <= 1 && hasHeaders) {
            throw new Error("The CSV file appears to be empty.");
          }

          // Parse CSV
          const headers = hasHeaders
            ? lines[0].split(",").map((h) => h.trim())
            : ["Name", "Email", "Type", "Status", "Wallet Address"];

          // Map headers to database fields
          const headerMap: Record<string, string> = {
            name: "name",
            email: "email",
            type: "investor_type",
            status: "kyc_status",
            "wallet address": "wallet_address",
            company: "company",
            phone: "phone",
            country: "country",
            "subscription amount": "subscription_amount",
            "token type": "token_type",
          };

          // Parse data rows
          const startRow = hasHeaders ? 1 : 0;
          const investors = [];
          const errors = [];

          for (let i = startRow; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(",").map((v) => v.trim());
            const investor: Record<string, any> = {};
            let hasRequiredFields = true;

            headers.forEach((header, index) => {
              const fieldName =
                headerMap[header.toLowerCase()] || header.toLowerCase();
              investor[fieldName] = values[index] || "";
            });

            // Validate required fields
            if (!investor.name || !investor.email) {
              errors.push(
                `Row ${i + 1}: Missing required fields (name or email).`,
              );
              hasRequiredFields = false;
            }

            if (hasRequiredFields) {
              investors.push(investor);
            }
          }

          if (errors.length > 0) {
            setImportErrors(errors);
            throw new Error("Validation errors found in CSV data.");
          }

          // In a real implementation, this would insert the investors into the database
          // For now, we'll simulate the API call

          // Simulate API call delay
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Log the operation for demonstration
          console.log("Importing investors:", {
            projectId,
            investors,
          });

          toast({
            title: "Import Successful",
            description: `Imported ${investors.length} investor(s) from CSV.`,
          });

          // Call the callback to notify parent component
          onImportComplete(investors);

          // Close the dialog
          onOpenChange(false);
        } catch (error) {
          console.error("Error processing CSV:", error);
          if (!importErrors.length) {
            setImportErrors([
              "Failed to process CSV file. Please check the format.",
            ]);
          }
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsText(csvFile);
    } catch (error) {
      console.error("Error importing investors:", error);
      setImportErrors(["An unexpected error occurred. Please try again."]);
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Import Investors from CSV</span>
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file containing investor information to add to your cap
            table.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The CSV file should contain columns for Name, Email, Type, Status,
              and Wallet Address.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasHeaders"
              checked={hasHeaders}
              onCheckedChange={(checked) => {
                setHasHeaders(!!checked);
                if (csvFile) previewCsv(csvFile);
              }}
            />
            <Label
              htmlFor="hasHeaders"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              CSV file has header row
            </Label>
          </div>

          {importErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Import Errors</h4>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {importErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {previewData && previewData.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                Preview (first {previewData.length} rows)
              </h3>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {Object.keys(previewData[0]).map((header) => (
                        <th
                          key={header}
                          className="px-4 py-2 text-left font-medium"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b last:border-0">
                        {Object.values(row).map((value, colIndex) => (
                          <td key={colIndex} className="px-4 py-2">
                            {value as string}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!csvFile || isImporting || importErrors.length > 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Investors"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvestorImportDialog;
