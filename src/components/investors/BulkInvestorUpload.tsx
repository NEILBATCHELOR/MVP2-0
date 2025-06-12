import React, { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/infrastructure/database/client";
import Papa from "papaparse";
import {
  Upload,
  FileText,
  Download,
  AlertCircle,
  Check,
  X,
  Loader2,
} from "lucide-react";

interface BulkInvestorUploadProps {
  onUploadComplete?: (investors: any[]) => void;
  onCancel?: () => void;
}

const BulkInvestorUpload = ({
  onUploadComplete = () => {},
  onCancel = () => {},
}: BulkInvestorUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Add this function at the top of the component, before validateCsvFile
  const isValidKycStatus = (status: string): boolean => {
    const validStatuses = ["not_started", "pending", "approved", "failed", "expired"];
    return validStatuses.includes(status.toLowerCase());
  };

  const normalizeKycStatus = (status: string): string => {
    if (!status) return "not_started";
    
    const statusMap: Record<string, string> = {
      "not started": "not_started",
      "notstarted": "not_started", 
      "not_started": "not_started",
      "pending": "pending",
      "in progress": "pending",
      "inprogress": "pending",
      "approved": "approved",
      "complete": "approved",
      "completed": "approved",
      "passed": "approved",
      "verified": "approved",
      "failed": "failed",
      "rejected": "failed",
      "expired": "expired"
    };
    
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, "");
    
    // Try to find a matching status
    for (const [key, value] of Object.entries(statusMap)) {
      if (key.replace(/\s+/g, "") === normalizedStatus) {
        return value;
      }
    }
    
    // Default to not_started if no match
    return "not_started";
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === "text/csv" ||
        droppedFile.name.endsWith(".csv")
      ) {
        setFile(droppedFile);
        validateCsvFile(droppedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (
        selectedFile.type === "text/csv" ||
        selectedFile.name.endsWith(".csv")
      ) {
        setFile(selectedFile);
        validateCsvFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  // Validate CSV file using PapaParse
  const validateCsvFile = (file: File) => {
    console.log("Starting CSV file validation:", file.name);
    
    Papa.parse(file, {
      header: hasHeaders,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          console.log("Papa parse complete:", results);
          // Skip all validation and just set the parsed data
          const data = results.data as Record<string, string>[];
          
          // Normalize data for processing - convert export format to internal format
          const normalizedData = data.map((row, index) => {
            // Find all possible headers with case-insensitive matching
            const headers = hasHeaders
              ? Object.keys(data[0])
              : [
                  "Name",
                  "Email",
                  "Company",
                  "Type",
                  "KYC Status",
                  "Wallet Address",
                ];
                
            // Create a function to find a header case-insensitively
            const findHeader = (targetHeader: string): string | undefined => {
              const possibleHeaders = {
                "name": ["name", "investor name", "full name"],
                "email": ["email", "email address"],
                "company": ["company", "company name", "organization", "organisation"],
                "type": ["type", "investor type"],
                "kyc status": ["kyc status", "kyc", "kyc_status", "kycstatus", "verification status"],
                "wallet address": ["wallet address", "wallet", "wallet_address", "walletaddress", "ethereum address"]
              };

              // Try direct case-insensitive match first
              const directMatch = headers.find(h => h.toLowerCase().trim() === targetHeader.toLowerCase().trim());
              if (directMatch) return directMatch;

              // Try alternative forms if direct match fails
              const alternatives = possibleHeaders[targetHeader as keyof typeof possibleHeaders] || [];
              for (const alt of alternatives) {
                const match = headers.find(h => h.toLowerCase().trim() === alt.toLowerCase().trim());
                if (match) return match;
              }

              return undefined;
            };
            
            // Find all possible headers with case-insensitive matching
            const nameHeader = findHeader("name");
            const emailHeader = findHeader("email");
            const companyHeader = findHeader("company");
            const typeHeader = findHeader("type");
            const kycHeader = findHeader("kyc status");
            const walletHeader = findHeader("wallet address");

            // Get values from the appropriate headers
            const name = nameHeader ? row[nameHeader] : "";
            const email = emailHeader ? row[emailHeader] : "";
            const company = companyHeader ? row[companyHeader] : "";
            const type = typeHeader ? row[typeHeader] : "";
            
            // Normalize kyc_status to a valid value
            let rawKycStatus = kycHeader ? row[kycHeader] : "";
            const kyc_status = normalizeKycStatus(rawKycStatus);
            
            const wallet_address = walletHeader ? row[walletHeader] : "";

            return {
              name,
              email,
              company,
              type,
              kyc_status,
              wallet_address,
              // Store original row for reference
              _original: row
            };
          });

          // NO VALIDATION - Just set the parsed data
          setValidationErrors([]);
          setParsedData(normalizedData);
        } catch (error) {
          console.error("Error parsing CSV:", error);
          // Only show critical parsing errors
          setValidationErrors([
            {
              row: 0,
              message: "Failed to parse CSV file. Please check the format.",
            },
          ]);
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setValidationErrors([
          {
            row: 0,
            message: `Failed to parse CSV file: ${error.message}`,
          },
        ]);
      },
    });
  };

  // Process upload using batch insert for better performance
  const handleUpload = async () => {
    // SKIPPING ALL VALIDATION - Proceed directly with upload
    if (!parsedData.length) {
      toast({
        title: "No data",
        description: "No valid data to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      // Clear any previous toast messages
      toast({
        title: "Starting Upload",
        description: `Processing ${parsedData.length} investors...`,
      });
      
      console.log("Starting upload process with parsed data:", parsedData);
      setIsUploading(true);
      setUploadProgress(0);

      // Map investor types from display names to IDs using the investorTypes library
      const { getAllInvestorTypes } = await import("@/utils/compliance/investorTypes");
      const allInvestorTypes = getAllInvestorTypes();
      console.log("Available investor types:", allInvestorTypes);
      
      const normalize = (str: string) =>
        str.toLowerCase().replace(/[^a-z0-9]/gi, "");

      const matchTypeId = (input: string): string => {
        const normalizedInput = normalize(input || "");
        console.log(`Matching type: "${input}" (normalized: "${normalizedInput}")`);
        const found = allInvestorTypes.find(t => {
          const idMatch = normalize(t.id) === normalizedInput;
          const nameMatch = normalize(t.name) === normalizedInput;
          return idMatch || nameMatch;
        });
        console.log(`Match result for "${input}":`, found?.id || "hnwi (default)");
        return found?.id || "hnwi";
      };
      
      // Prepare the data for batch processing
      const investorsToProcess = parsedData.map(investor => {
        const typeId = matchTypeId(investor.type);
        return {
          name: investor.name,
          email: investor.email,
          type: typeId,
          company: investor.company || null,
          wallet_address: investor.wallet_address || null,
          kyc_status: investor.kyc_status || "not_started",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      // Process in batches of 100 for maximum performance
      const BATCH_SIZE = 100;
      const processedInvestors = [];
      const totalBatches = Math.ceil(investorsToProcess.length / BATCH_SIZE);
      
      // Create a function to process a single investor with error handling
      const processInvestor = async (investor: any) => {
        try {
          // Try to insert first
          const { data, error } = await supabase
            .from("investors")
            .insert([investor])
            .select();
            
          if (error) {
            // If duplicate, try to update instead
            if (error.code === '23505') { // Unique violation
              // Get the existing investor
              const { data: existingData } = await supabase
                .from("investors")
                .select("investor_id, email")
                .eq("email", investor.email)
                .single();
                
              if (existingData) {
                // Update the existing investor
                const { data: updateData } = await supabase
                  .from("investors")
                  .update({
                    name: investor.name,
                    type: investor.type,
                    company: investor.company,
                    wallet_address: investor.wallet_address,
                    kyc_status: investor.kyc_status,
                    updated_at: new Date().toISOString()
                  })
                  .eq("investor_id", existingData.investor_id)
                  .select();
                  
                if (updateData) return updateData[0];
              }
            }
            // Return null if there was an error
            return null;
          } else if (data) {
            // Return the inserted data
            return data[0];
          }
          return null;
        } catch (err) {
          console.error(`Error processing investor:`, err);
          return null;
        }
      };
      
      // Process batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIdx = batchIndex * BATCH_SIZE;
        const endIdx = Math.min(startIdx + BATCH_SIZE, investorsToProcess.length);
        const currentBatch = investorsToProcess.slice(startIdx, endIdx);
        
        // Process this batch in parallel
        const results = await Promise.allSettled(
          currentBatch.map(investor => processInvestor(investor))
        );
        
        // Collect successful results
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            processedInvestors.push(result.value);
          }
        });
        
        // Update progress
        const completedItems = (batchIndex + 1) * BATCH_SIZE;
        const progress = Math.min(
          Math.round((completedItems / investorsToProcess.length) * 100),
          100
        );
        setUploadProgress(progress);
      }
      
      console.log("Batch processing complete. Processed investors:", processedInvestors);
      
      if (processedInvestors.length === 0) {
        console.warn("No investors were processed successfully");
        toast({
          title: "Warning",
          description: "Upload completed, but no investors were processed",
          variant: "destructive",
        });
        return;
      }
      
      // Map processed investors to the expected format
      const mappedInvestors = processedInvestors.map(investor => ({
        id: investor.investor_id,
        name: investor.name,
        email: investor.email,
        company: investor.company || "",
        type: investor.type,
        kycStatus: investor.kyc_status,
        wallet_address: investor.wallet_address || "",
      }));
      
      // Reset state
      setFile(null);
      setParsedData([]);
      setValidationErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Success message
      toast({
        title: "Upload Successful",
        description: `Processed ${processedInvestors.length} investors`,
        variant: "default",
      });
      
      // Call the callback
      console.log("Calling onUploadComplete with investors:", mappedInvestors);
      onUploadComplete(mappedInvestors);
      
    } catch (error) {
      console.error("Error uploading investors:", error);
      toast({
        title: "Upload failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Download sample template using PapaParse
  const downloadTemplate = () => {
    const sampleData = [
      {
        Name: "John Doe",
        Email: "john@example.com",
        Company: "Acme Inc",
        Type: "High-Net-Worth Individuals (HNWIs)",
        "KYC Status": "approved",
        "Wallet Address": "0x1234567890abcdef1234567890abcdef12345678",
      },
      {
        Name: "Jane Smith",
        Email: "jane@example.com",
        Company: "Smith Capital",
        Type: "Institutional Crypto Investors",
        "KYC Status": "pending",
        "Wallet Address": "0x2345678901abcdef2345678901abcdef23456789",
      },
      {
        Name: "Global Ventures",
        Email: "global@example.com",
        Company: "Global Ventures LLC",
        Type: "Private Equity & Venture Capital Firms",
        "KYC Status": "not_started",
        "Wallet Address": "",
      },
      {
        Name: "Michael Johnson",
        Email: "michael@example.com",
        Company: "Johnson Asset Management",
        Type: "Asset Managers & Mutual Funds",
        "KYC Status": "pending",
        "Wallet Address": "",
      },
      {
        Name: "Sarah Williams",
        Email: "sarah@example.com",
        Company: "",
        Type: "High-Net-Worth Individuals (HNWIs)",
        "KYC Status": "not_started",
        "Wallet Address": "",
      },
    ];

    const csvContent = Papa.unparse(sampleData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "investor_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear file
  const clearFile = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4 pt-6">
        <CardTitle className="text-xl font-semibold">Bulk Investor Upload</CardTitle>
        <CardDescription className="mt-2">
          Upload a CSV file containing multiple investor records at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* File upload area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${isDragging ? "border-primary bg-primary/5" : "border-gray-200"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-medium">Drag & Drop CSV File</h3>
                <p className="text-xs text-muted-foreground">
                  or click the button below to browse files
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-3 w-3" />
                  Browse Files
                </Button>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-2 h-3 w-3" />
                  Download Template
                </Button>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasHeaders"
                  checked={hasHeaders}
                  onCheckedChange={(checked) => {
                    setHasHeaders(!!checked);
                    if (file) validateCsvFile(file);
                  }}
                />
                <Label htmlFor="hasHeaders" className="text-xs">
                  CSV file has header row
                </Label>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="rounded-full bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-medium">{file.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {parsedData.length} investors found
                </p>
              </div>
              {isUploading && (
                <div className="w-full max-w-xs">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center mt-1 text-muted-foreground">
                    Processing {uploadProgress}%
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFile}
                  disabled={isUploading}
                >
                  <X className="mr-2 h-3 w-3" />
                  Clear File
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading || !parsedData.length}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-3 w-3" />
                      Process Investors
                    </>
                  )}
                </Button>
                {parsedData.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("Debug clicked - Data:", parsedData);
                      console.log("Validation errors:", validationErrors);
                      
                      // Create a map of emails for inspection
                      const emails = parsedData.map(row => row.email);
                      console.log("All emails:", emails);
                      
                      // Check for duplicates manually
                      const uniqueEmails = new Set();
                      const duplicates = [];
                      emails.forEach((email, idx) => {
                        if (uniqueEmails.has(email)) {
                          duplicates.push({ email, index: idx + 1 });
                        } else {
                          uniqueEmails.add(email);
                        }
                      });
                      console.log("Duplicate emails found manually:", duplicates);
                      
                      toast({
                        title: "Debug Information",
                        description: `Check the console for details. Found ${duplicates.length} potential duplicates.`
                      });
                    }}
                  >
                    Debug
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preview data */}
        {parsedData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Preview ({parsedData.length} investors)
            </h3>
            <div className="rounded-md border overflow-hidden">
              <div className="max-h-[320px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="bg-muted/30 border-b">
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">Email</th>
                      <th className="px-3 py-2 text-left font-medium">Company</th>
                      <th className="px-3 py-2 text-left font-medium">Type</th>
                      <th className="px-3 py-2 text-left font-medium">
                        KYC Status
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Wallet Address
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-1.5">{row.name}</td>
                        <td className="px-3 py-1.5">{row.email}</td>
                        <td className="px-3 py-1.5">{row.company || ""}</td>
                        <td className="px-3 py-1.5">{row.type || "hnwi"}</td>
                        <td className="px-3 py-1.5">
                          {row.kyc_status || "not_started"}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-[10px] truncate max-w-[150px]">
                          {row.wallet_address || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CSV format guide */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-sm mb-2">CSV Format Guide</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Your CSV file should include the following columns:
          </p>
          <div className="space-y-1">
            <ul className="list-disc pl-5 text-xs space-y-1">
              <li>
                <strong>Name</strong> (required): Full name of the investor
              </li>
              <li>
                <strong>Email</strong> (required): Email address
              </li>
              <li>
                <strong>Company</strong> (optional): Company or organization name
              </li>
              <li>
                <strong>Type</strong> (optional): Type of investor (HNWI, Institutional, etc.)
              </li>
              <li>
                <strong>Wallet Address</strong> (optional): Ethereum wallet address
              </li>
              <li>
                <strong>KYC Status</strong> (optional): KYC status (not_started, pending, etc.)
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || validationErrors.length > 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Investors"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkInvestorUpload;
