import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileUp, FileText, CheckCircle2, RefreshCw, Download, ArrowUpDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Invoice, InvoiceFormData, InvoiceCsvRow, InvoiceValidationError } from "./types";
import { format, parseISO, differenceInDays } from "date-fns";
import { parseCSV, generateCSV, downloadCSV } from "@/utils/shared/formatting/csv";
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table";
import { EditableCell } from "@/components/ui/editable-cell";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import BulkEditInvoices from "./BulkEditInvoices";
import { NavigationCards } from "./TokenDistributionHelpers";

interface InvoiceIngestionManagerProps {
  projectId: string;
}

const InvoiceIngestionManager: React.FC<InvoiceIngestionManagerProps> = ({ projectId }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<InvoiceValidationError[]>([]);
  const [currentTab, setCurrentTab] = useState("upload");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, [projectId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Join the invoice table with provider and payer tables
      const { data, error } = await supabase
        .from("invoice")
        .select(`
          *,
          provider:provider_id(name),
          payer:payer_id(name)
        `)
        .order("upload_timestamp", { ascending: false });

      if (error) {
        throw error;
      }

      // Transform data to match our Invoice interface
      const formattedInvoices: Invoice[] = data.map(item => ({
        id: String(item.invoice_id),
        providerId: item.provider_id,
        providerName: item.provider?.name,
        patientName: item.patient_name,
        patientDob: item.patient_dob,
        serviceDates: item.service_dates,
        procedureCodes: item.procedure_codes,
        diagnosisCodes: item.diagnosis_codes,
        billedAmount: item.billed_amount,
        adjustments: item.adjustments,
        netAmountDue: item.net_amount_due,
        payerId: item.payer_id,
        payerName: item.payer?.name,
        policyNumber: item.policy_number,
        invoiceNumber: item.invoice_number,
        invoiceDate: item.invoice_date,
        dueDate: item.due_date,
        factoringDiscountRate: item.factoring_discount_rate,
        factoringTerms: item.factoring_terms,
        uploadTimestamp: item.upload_timestamp,
        poolId: item.pool_id ? String(item.pool_id) : undefined,
        createdAt: item.upload_timestamp,
      }));

      setInvoices(formattedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedRows([]);
  };

  // Handle row selection
  const handleRowSelectionChange = (rowId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedRows(prev => [...prev, rowId]);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== rowId));
    }
  };

  // Handle select all
  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const allIds = invoices.map(invoice => invoice.id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  // Get selected invoices
  const selectedInvoices = useMemo(() => {
    return invoices.filter(invoice => selectedRows.includes(invoice.id));
  }, [invoices, selectedRows]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationErrors([]);
    }
  };

  const validateCsvData = (data: InvoiceCsvRow[]): InvoiceValidationError[] => {
    const errors: InvoiceValidationError[] = [];

    data.forEach((row, index) => {
      // Required fields validation
      const requiredFields: (keyof InvoiceCsvRow)[] = [
        "provider_name", "patient_name", "net_amount_due", 
        "payer_name", "invoice_number", "invoice_date", "factoring_discount_rate"
      ];

      requiredFields.forEach(field => {
        if (!row[field]) {
          errors.push({
            rowIndex: index,
            fieldName: field,
            errorMessage: `Missing required field: ${field}`,
          });
        }
      });

      // Number validation
      const numberFields: (keyof InvoiceCsvRow)[] = [
        "billed_amount", "adjustments", "net_amount_due", "factoring_discount_rate"
      ];

      numberFields.forEach(field => {
        if (row[field] && isNaN(Number(row[field]))) {
          errors.push({
            rowIndex: index,
            fieldName: field,
            errorMessage: `Invalid number format for ${field}: ${row[field]}`,
          });
        }
      });

      // Date validation
      const dateFields: (keyof InvoiceCsvRow)[] = [
        "patient_dob", "invoice_date", "due_date"
      ];

      dateFields.forEach(field => {
        if (row[field] && isNaN(Date.parse(row[field]))) {
          errors.push({
            rowIndex: index,
            fieldName: field,
            errorMessage: `Invalid date format for ${field}: ${row[field]}`,
          });
        }
      });

      // Net amount due should be non-negative
      if (row.net_amount_due && Number(row.net_amount_due) < 0) {
        errors.push({
          rowIndex: index,
          fieldName: "net_amount_due",
          errorMessage: `Net amount due cannot be negative: ${row.net_amount_due}`,
        });
      }

      // Factoring discount rate validation
      if (row.factoring_discount_rate) {
        const discountRate = Number(row.factoring_discount_rate);
        
        // Check if discount rate is within reasonable bounds (0-100%)
        if (discountRate < 0 || discountRate > 100) {
          errors.push({
            rowIndex: index,
            fieldName: "factoring_discount_rate",
            errorMessage: `Factoring discount rate must be between 0 and 100: ${row.factoring_discount_rate}`,
          });
        }
      }
    });

    return errors;
  };

  const processCsvFile = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      
      // Use the parseCSV utility instead of manual parsing
      const dataRows = await parseCSV(selectedFile) as InvoiceCsvRow[];
      
      // Validate data
      const errors = validateCsvData(dataRows);
      setValidationErrors(errors);
      
      if (errors.length > 0) {
        toast({
          title: "Validation Failed",
          description: `Found ${errors.length} errors in the CSV file`,
          variant: "destructive",
        });
        return;
      }
      
      // Process and save each invoice
      for (const row of dataRows) {
        // Check if provider exists, if not create
        let providerId: number;
        const providerResult = await supabase
          .from('provider')
          .select('provider_id')
          .eq('name', row.provider_name)
          .single();
          
        if (providerResult.error) {
          // Provider doesn't exist, create it
          const newProviderResult = await supabase
            .from('provider')
            .insert({ name: row.provider_name, address: row.provider_address })
            .select('provider_id')
            .single();
            
          if (newProviderResult.error) throw newProviderResult.error;
          providerId = newProviderResult.data.provider_id;
        } else {
          providerId = providerResult.data.provider_id;
        }
        
        // Check if payer exists, if not create
        let payerId: number;
        const payerResult = await supabase
          .from('payer')
          .select('payer_id')
          .eq('name', row.payer_name)
          .single();
          
        if (payerResult.error) {
          // Payer doesn't exist, create it
          const newPayerResult = await supabase
            .from('payer')
            .insert({ name: row.payer_name })
            .select('payer_id')
            .single();
            
          if (newPayerResult.error) throw newPayerResult.error;
          payerId = newPayerResult.data.payer_id;
        } else {
          payerId = payerResult.data.payer_id;
        }
        
        // Insert the invoice
        const { error: invoiceError } = await supabase
          .from('invoice')
          .insert({
            provider_id: providerId,
            patient_name: row.patient_name,
            patient_dob: row.patient_dob ? new Date(row.patient_dob).toISOString() : null,
            service_dates: row.service_dates,
            procedure_codes: row.procedure_codes,
            diagnosis_codes: row.diagnosis_codes,
            billed_amount: Number(row.billed_amount) || 0,
            adjustments: Number(row.adjustments) || 0,
            net_amount_due: Number(row.net_amount_due) || 0,
            payer_id: payerId,
            policy_number: row.policy_number,
            invoice_number: row.invoice_number,
            invoice_date: row.invoice_date ? new Date(row.invoice_date).toISOString().split('T')[0] : null,
            due_date: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null,
            factoring_discount_rate: Number(row.factoring_discount_rate) || 0,
            factoring_terms: row.factoring_terms,
          });
          
        if (invoiceError) throw invoiceError;
      }
      
      toast({
        title: "Success",
        description: `Successfully imported ${dataRows.length} invoices`,
        variant: "default",
      });
      
      // Refresh the invoices list
      fetchInvoices();
      
      // Reset the file input
      setSelectedFile(null);
      setCurrentTab("view");
      
    } catch (error) {
      console.error("Error processing CSV file:", error);
      toast({
        title: "Error",
        description: "Failed to process CSV file: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "provider_name", "provider_address", "patient_name", "patient_dob", 
      "service_dates", "procedure_codes", "diagnosis_codes", "billed_amount", 
      "adjustments", "net_amount_due", "payer_name", "policy_number", 
      "invoice_number", "invoice_date", "due_date", "factoring_discount_rate", "factoring_terms"
    ];
    
    const sampleData = [
      {
        provider_name: "Sample Healthcare Provider",
        provider_address: "123 Main St, Anytown, USA 12345",
        patient_name: "John Doe",
        patient_dob: "1980-01-01",
        service_dates: "2023-01-01 - 2023-01-05",
        procedure_codes: "PROC123",
        diagnosis_codes: "DIAG456",
        billed_amount: "10000.00",
        adjustments: "1000.00",
        net_amount_due: "9000.00",
        payer_name: "Sample Insurance",
        policy_number: "POL123456",
        invoice_number: "INV001",
        invoice_date: "2023-01-10",
        due_date: "2023-02-10",
        factoring_discount_rate: "1.0", // Default discount rate of 1%
        factoring_terms: "Net 30"
      }
    ];

    const csvContent = generateCSV(sampleData, headers);
    downloadCSV(csvContent, "invoice_import_template.csv");
  };

  // Handle saving edited invoice data
  const handleSaveInvoice = async (invoice: Invoice, column: string, value: string | number) => {
    try {
      // Create update object with snake_case keys for Supabase
      const updateData: Record<string, any> = {};
      
      // Convert camelCase column name to snake_case for Supabase
      const snakeCaseColumn = column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      updateData[snakeCaseColumn] = value;
      
      const { error } = await supabase
        .from('invoice')
        .update(updateData)
        .eq('invoice_id', Number(invoice.id));
        
      if (error) throw error;
      
      // Update local state
      setInvoices(prev => 
        prev.map(inv => 
          inv.id === invoice.id 
            ? { ...inv, [column]: value } 
            : inv
        )
      );
      
      toast({
        title: "Success",
        description: "Invoice updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
      throw error; // Re-throw to let the EditableCell component know the save failed
    }
  };

  // Selection column for bulk operations
  const selectionColumn: ColumnDef<Invoice, any> = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={selectedRows.length === invoices.length && invoices.length > 0}
        onCheckedChange={(checked) => {
          handleSelectAll(!!checked);
        }}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={selectedRows.includes(row.original.id)}
        onCheckedChange={(checked) => {
          handleRowSelectionChange(row.original.id, !!checked);
        }}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  // Define columns for the invoice table
  const invoiceColumns: ColumnDef<Invoice>[] = useMemo(() => [
    selectionColumn,
    {
      accessorKey: "uploadTimestamp",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Uploaded At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const ts = row.original.uploadTimestamp;
        return <div>{ts ? format(parseISO(ts), "yyyy-MM-dd HH:mm:ss") : "N/A"}</div>;
      },
    },
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Invoice #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue("invoiceNumber")}
          row={row.original}
          column="invoiceNumber"
          onSave={handleSaveInvoice}
        />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "providerName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Provider
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue("providerName")}
          row={row.original}
          column="providerName"
          onSave={handleSaveInvoice}
        />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "patientName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Patient
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue("patientName")}
          row={row.original}
          column="patientName"
          onSave={handleSaveInvoice}
        />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "payerName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Payer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue("payerName")}
          row={row.original}
          column="payerName"
          onSave={handleSaveInvoice}
        />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "netAmountDue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Net Amount Due
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <EditableCell
          value={`$${(row.getValue("netAmountDue") as number).toFixed(2)}`}
          row={row.original}
          column="netAmountDue"
          onSave={handleSaveInvoice}
        />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "factoringDiscountRate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Discount Rate (%)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <EditableCell
          value={`${(row.getValue("factoringDiscountRate") as number).toFixed(2)}%`}
          row={row.original}
          column="factoringDiscountRate"
          onSave={handleSaveInvoice}
        />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "discountedValue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Discounted Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const netAmount = row.getValue("netAmountDue") as number;
        const discountRate = row.getValue("factoringDiscountRate") as number;
        const discountedValue = netAmount * (1 - discountRate / 100);
        return (
          <div>
            ${discountedValue.toFixed(2)}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "invoiceDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Invoice Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue("invoiceDate")}
          row={row.original}
          column="invoiceDate"
          onSave={handleSaveInvoice}
          type="date"
        />
      ),
      dataType: "date",
      enableSorting: true,
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue("dueDate")}
          row={row.original}
          column="dueDate"
          onSave={handleSaveInvoice}
          type="date"
        />
      ),
      dataType: "date",
      enableSorting: true,
    },
    {
      accessorKey: "duration",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Duration (Days)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const invoiceDate = row.original.invoiceDate;
        const dueDate = row.original.dueDate;
        
        if (!invoiceDate || !dueDate) return <div>N/A</div>;
        
        try {
          const invDate = parseISO(invoiceDate);
          const dDate = parseISO(dueDate);
          const days = differenceInDays(dDate, invDate);
          return <div>{days} days</div>;
        } catch (e) {
          return <div>N/A</div>;
        }
      },
      accessorFn: (row) => {
        if (!row.invoiceDate || !row.dueDate) return 0;
        try {
          const invDate = parseISO(row.invoiceDate);
          const dDate = parseISO(row.dueDate);
          return differenceInDays(dDate, invDate);
        } catch (e) {
          return 0;
        }
      },
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.poolId ? "outline" : "secondary"}>
          {row.original.poolId ? "In Pool" : "Unassigned"}
        </Badge>
      ),
      accessorFn: (row) => row.poolId ? "In Pool" : "Unassigned",
      enableSorting: true,
    },
  ], [format, parseISO, handleSaveInvoice, selectedRows, invoices]);

  const navigationItems = useMemo(
    () => [
      { id: "upload", label: "Upload Invoices", icon: <FileUp className="h-5 w-5" />, description: "Upload a CSV file" },
      { id: "view", label: "View Invoices", icon: <FileText className="h-5 w-5" />, description: "View and manage all invoices", count: invoices.length }
    ],
    [invoices.length]
  );

  return (
    <div className="mx-6 my-4">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <NavigationCards
              items={navigationItems}
              activeTab={currentTab}
              setActiveTab={setCurrentTab}
              pendingCount={0}
              distributedCount={0}
              totalAllocationValue={0}
            />
          </div>
          <Button onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
        
        {currentTab === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Invoices</CardTitle>
              <CardDescription>
                Upload a CSV file containing invoice data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="invoice-csv">Invoice CSV File</Label>
                  <Input
                    id="invoice-csv"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with invoice data
                  </p>
                </div>
                
                {selectedFile && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <Badge variant="outline">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </Badge>
                  </div>
                )}
                
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Validation Errors</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 max-h-[200px] overflow-auto">
                        <ul className="list-disc pl-5 space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index} className="text-sm">
                              Row {error.rowIndex + 1}: {error.errorMessage}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                disabled={!selectedFile || uploading}
                onClick={processCsvFile}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4 mr-2" />
                    Upload Invoices
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentTab === "view" && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice List</CardTitle>
              <CardDescription>
                View and manage all invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-muted-foreground">
                      {selectedRows.length > 0 ? (
                        <>Selected: {selectedRows.length} of {invoices.length}</>
                      ) : (
                        <>Total Invoices: {invoices.length}</>
                      )}
                    </div>
                    
                    {/* Bulk Edit/Delete controls */}
                    <div className="flex items-center gap-2">
                      <BulkEditInvoices 
                        selectedInvoices={selectedInvoices}
                        onRefresh={fetchInvoices}
                        onDeselectAll={handleClearSelection}
                      />
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={fetchInvoices}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                  
                  <EnhancedDataTable
                    columns={invoiceColumns}
                    data={invoices}
                    searchKey="invoiceNumber"
                    searchPlaceholder="Search invoices..."
                    exportFilename="invoices-export"
                    getRowId={(row) => row.id}
                    initialSorting={[
                      {
                        id: "uploadTimestamp",
                        desc: true
                      }
                    ]}
                  />
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InvoiceIngestionManager;