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
import { supabase } from "@/infrastructure/database/client";
import {
  Upload,
  FileText,
  Download,
  AlertCircle,
  Check,
  X,
} from "lucide-react";

interface InvestorUploadProps {
  onUploadComplete?: (investors: any[]) => void;
}

const InvestorUpload = ({
  onUploadComplete = () => {},
}: InvestorUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [hasHeaders, setHasHeaders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  // Validate CSV file
  const validateCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n");

        // Check if file is empty
        if (lines.length <= 1) {
          setValidationErrors([
            {
              row: 0,
              message: "CSV file is empty or contains only headers",
            },
          ]);
          return;
        }

        // Parse headers
        const headers = hasHeaders
          ? lines[0].split(",").map((h) => h.trim())
          : [
              "name",
              "email",
              "company",
              "type",
              "kyc_status",
              "wallet_address",
            ];

        // Required headers
        const requiredHeaders = ["name", "email"];
        const missingHeaders = requiredHeaders.filter(
          (h) =>
            !headers.some((header) => header.toLowerCase() === h.toLowerCase()),
        );

        if (missingHeaders.length > 0) {
          setValidationErrors([
            {
              row: 0,
              message: `Missing required headers: ${missingHeaders.join(", ")}`,
            },
          ]);
          return;
        }

        // Parse and validate data rows
        const startRow = hasHeaders ? 1 : 0;
        const data = [];
        const errors = [];

        for (let i = startRow; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(",").map((v) => v.trim());
          const row: Record<string, string> = {};

          // Check if row has correct number of columns
          if (values.length !== headers.length) {
            errors.push({
              row: i,
              message: `Row ${i} has ${values.length} columns, expected ${headers.length}`,
            });
            continue;
          }

          headers.forEach((header, index) => {
            row[header.toLowerCase()] = values[index] || "";
          });

          // Validate required fields
          if (!row.name) {
            errors.push({
              row: i,
              message: `Row ${i}: Missing required field 'name'`,
            });
          }

          if (!row.email) {
            errors.push({
              row: i,
              message: `Row ${i}: Missing required field 'email'`,
            });
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            errors.push({
              row: i,
              message: `Row ${i}: Invalid email format '${row.email}'`,
            });
          }

          // Check for wallet address format if provided
          if (
            row.wallet_address &&
            !/^0x[a-fA-F0-9]{40}$/.test(row.wallet_address)
          ) {
            errors.push({
              row: i,
              message: `Row ${i}: Invalid wallet address format '${row.wallet_address}'`,
            });
          }

          data.push(row);
        }

        // Check for duplicate emails
        const emails = data.map((row) => row.email.toLowerCase());
        const duplicateEmails = emails.filter(
          (email, index) => emails.indexOf(email) !== index,
        );

        if (duplicateEmails.length > 0) {
          duplicateEmails.forEach((email) => {
            const indices = data
              .map((row, index) =>
                row.email.toLowerCase() === email ? index + 1 : -1,
              )
              .filter((index) => index !== -1);

            errors.push({
              row: indices.join(", "),
              message: `Duplicate email '${email}' found in rows ${indices.join(", ")}`,
            });
          });
        }

        setValidationErrors(errors);
        setParsedData(data);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setValidationErrors([
          {
            row: 0,
            message: "Failed to parse CSV file. Please check the format.",
          },
        ]);
      }
    };

    reader.readAsText(file);
  };

  // Process upload
  const handleUpload = async () => {
    console.log("Starting upload process");
    if (validationErrors.length > 0) {
      toast({
        title: "Validation errors",
        description: "Please fix the errors before uploading",
        variant: "destructive",
      });
      return;
    }

    if (!parsedData.length) {
      toast({
        title: "No data",
        description: "No valid data to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Process each investor
      const processedInvestors = [];

      for (const investor of parsedData) {
        // Check if investor already exists
        const { data: existingInvestor } = await supabase
          .from("investors")
          .select("*")
          .eq("email", investor.email)
          .maybeSingle();

        if (existingInvestor) {
          // Update existing investor
          const { data: updatedInvestor, error: updateError } = await supabase
            .from("investors")
            .update({
              name: investor.name,
              type: investor.type || existingInvestor.type,
              company: investor.company || existingInvestor.company,
              wallet_address:
                investor.wallet_address || existingInvestor.wallet_address,
              kyc_status: investor.kyc_status || existingInvestor.kyc_status,
              updated_at: new Date().toISOString(),
            })
            .eq("investor_id", existingInvestor.investor_id)
            .select()
            .single();

          if (updateError) throw updateError;
          processedInvestors.push(updatedInvestor);
        } else {
          // Create new investor
          console.log("Creating new investor from CSV:", {
            name: investor.name,
            email: investor.email,
            type: investor.type || "hnwi",
            kyc_status: investor.kyc_status || "not_started",
            company: investor.company || null,
            wallet_address: investor.wallet_address || null,
          });

          const { data: newInvestor, error: createError } = await supabase
            .from("investors")
            .insert({
              name: investor.name,
              email: investor.email,
              type: investor.type || "hnwi",
              kyc_status: investor.kyc_status || "not_started",
              company: investor.company || null,
              wallet_address: investor.wallet_address || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating investor from CSV:", createError);
            throw createError;
          }

          console.log("Successfully created investor from CSV:", newInvestor);
          processedInvestors.push(newInvestor);
        }
      }

      toast({
        title: "Upload successful",
        description: `Processed ${processedInvestors.length} investors`,
        variant: "default",
      });

      console.log("Upload completed successfully", processedInvestors);

      // Reset state
      setFile(null);
      setParsedData([]);
      setValidationErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Call the callback
      onUploadComplete(processedInvestors);
    } catch (error) {
      console.error("Error uploading investors:", error);
      toast({
        title: "Upload failed",
        description: "An error occurred while processing the investors",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Download sample template
  const downloadTemplate = () => {
    const headers = "name,email,type,company,wallet_address,kyc_status";
    const sampleData = [
      "John Doe,john@example.com,hnwi,Acme Inc,0x1234567890abcdef1234567890abcdef12345678,approved",
      "Jane Smith,jane@example.com,institutional_crypto,Smith Capital,0x2345678901abcdef2345678901abcdef23456789,pending",
    ];
    const csvContent = [headers, ...sampleData].join("\n");

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
      <CardHeader>
        <CardTitle className="text-xl">Upload Investors</CardTitle>
        <CardDescription>
          Upload a CSV file containing investor information or drag and drop it
          below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File upload area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragging ? "border-primary bg-primary/5" : "border-gray-200"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Drag & Drop CSV File</h3>
                <p className="text-sm text-muted-foreground">
                  or click the button below to browse files
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Browse Files
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
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
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="hasHeaders"
                  checked={hasHeaders}
                  onCheckedChange={(checked) => {
                    setHasHeaders(!!checked);
                    if (file) validateCsvFile(file);
                  }}
                />
                <Label htmlFor="hasHeaders" className="text-sm">
                  CSV file has header row
                </Label>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-primary/10 p-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{file.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {parsedData.length} investors found
                </p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={clearFile}>
                  <X className="mr-2 h-4 w-4" />
                  Clear File
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || validationErrors.length > 0}
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Process Investors
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <div className="mt-2 max-h-[200px] overflow-y-auto">
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview data */}
        {parsedData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Preview ({parsedData.length} investors)
            </h3>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">Email</th>
                    <th className="px-4 py-2 text-left font-medium">Company</th>
                    <th className="px-4 py-2 text-left font-medium">Type</th>
                    <th className="px-4 py-2 text-left font-medium">
                      KYC Status
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Wallet Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2">{row.email}</td>
                      <td className="px-4 py-2">{row.company || ""}</td>
                      <td className="px-4 py-2">{row.type || "hnwi"}</td>
                      <td className="px-4 py-2">
                        {row.kyc_status || "not_started"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {row.wallet_address || ""}
                      </td>
                    </tr>
                  ))}
                  {parsedData.length > 5 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-2 text-center text-muted-foreground"
                      >
                        ... and {parsedData.length - 5} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CSV format guide */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">CSV Format Guide</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Your CSV file should include the following columns:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>
              <strong>name</strong> (required): Full name of the investor
            </li>
            <li>
              <strong>email</strong> (required): Email address
            </li>
            <li>
              <strong>type</strong> (optional): Type of investor (hnwi,
              institutional_crypto, etc.)
            </li>
            <li>
              <strong>company</strong> (optional): Company or organization name
            </li>
            <li>
              <strong>wallet_address</strong> (optional): Ethereum wallet
              address (must start with 0x)
            </li>
            <li>
              <strong>kyc_status</strong> (optional): KYC status (not_started,
              pending, approved, failed, expired)
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestorUpload;
