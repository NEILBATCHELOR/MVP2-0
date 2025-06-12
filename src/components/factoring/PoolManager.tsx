import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NavigationCards } from "./TokenDistributionHelpers";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, PlusCircle, BarChart3, FolderPlus, Edit, Trash2, ArrowUpDown } from "lucide-react";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Pool, PoolType, Invoice, PoolFormData } from "./types";
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table";
import { EditableCell } from "@/components/ui/editable-cell";
import { ColumnDef } from "@tanstack/react-table";

interface PoolManagerProps {
  projectId: string;
}

const PoolManager: React.FC<PoolManagerProps> = ({ projectId }) => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [unassignedInvoices, setUnassignedInvoices] = useState<Invoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [poolFormData, setPoolFormData] = useState<PoolFormData>({
    poolName: "",
    poolType: PoolType.TOTAL_POOL,
    invoiceIds: [],
  });
  const { toast } = useToast();

  // Add editMode state
  const [editMode, setEditMode] = useState(false);
  
  // Track the active tab
  const [activeTab, setActiveTab] = useState<"pools" | "pool-detail" | "view">("pools");
  
  // Add dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [isEditingPool, setIsEditingPool] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Add a new helper function to calculate invoice duration
  const getDuration = (invoice: Invoice): number => {
    if (!invoice.invoiceDate || !invoice.dueDate) return 0;
    
    try {
      const invDate = new Date(invoice.invoiceDate);
      const dDate = new Date(invoice.dueDate);
      
      if (isNaN(invDate.getTime()) || isNaN(dDate.getTime())) {
        return 0;
      }
      
      const days = Math.floor((dDate.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch (e) {
      return 0;
    }
  };

  // Add state for duration filter
  const [durationFilter, setDurationFilter] = useState<string>("all");

  useEffect(() => {
    fetchPoolsAndInvoices();
  }, [projectId]);

  const fetchPoolsAndInvoices = async () => {
    try {
      setLoading(true);
      
      // Fetch pools
      const { data: poolData, error: poolError } = await supabase
        .from("pool")
        .select("*")
        .order("creation_timestamp", { ascending: false });

      if (poolError) throw poolError;

      // Format pool data
      const formattedPools: Pool[] = poolData.map(item => ({
        id: String(item.pool_id),
        poolName: item.pool_name,
        poolType: item.pool_type as PoolType,
        creationTimestamp: item.creation_timestamp,
        createdAt: item.creation_timestamp,
      }));

      // Fetch invoices including provider and payer info
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoice")
        .select(`
          *,
          provider:provider_id(name),
          payer:payer_id(name),
          pool:pool_id(pool_name)
        `)
        .order("upload_timestamp", { ascending: false });

      if (invoiceError) throw invoiceError;

      // Format invoice data
      const formattedInvoices: Invoice[] = invoiceData.map(item => ({
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
        poolName: item.pool?.pool_name,
        createdAt: item.upload_timestamp,
      }));

      // Calculate pool statistics
      const enhancedPools = formattedPools.map(pool => {
        const poolInvoices = formattedInvoices.filter(invoice => invoice.poolId === pool.id);
        const totalValue = poolInvoices.reduce((sum, invoice) => sum + invoice.netAmountDue, 0);
        const invoiceCount = poolInvoices.length;
        
        // Calculate average duration between invoice date and due date in days
        const totalDuration = poolInvoices.reduce((sum, invoice) => {
          if (!invoice.invoiceDate || !invoice.dueDate) return sum;
          
          const invoiceDate = new Date(invoice.invoiceDate);
          const dueDate = new Date(invoice.dueDate);
          
          // Skip invalid dates
          if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) return sum;
          
          const durationInDays = Math.floor((dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + (durationInDays > 0 ? durationInDays : 0); // Ensure non-negative
        }, 0);
        const averageAge = invoiceCount > 0 ? Math.round(totalDuration / invoiceCount) : 0;
        
        // Calculate weighted average discount rate
        const totalWeightedRate = poolInvoices.reduce((sum, invoice) => {
          return sum + (invoice.netAmountDue * invoice.factoringDiscountRate);
        }, 0);
        
        const averageDiscountRate = totalValue > 0 
          ? Number((totalWeightedRate / totalValue).toFixed(4)) 
          : 0;
        
        return {
          ...pool,
          totalValue,
          invoiceCount,
          averageAge,
          averageDiscountRate,
        };
      });

      // Filter unassigned invoices
      const unassigned = formattedInvoices.filter(invoice => !invoice.poolId);

      setPools(enhancedPools);
      setInvoices(formattedInvoices);
      setUnassignedInvoices(unassigned);
    } catch (error) {
      console.error("Error fetching pools and invoices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pools and invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePool = async () => {
    if (!poolFormData.poolName.trim() || selectedInvoices.length === 0 || !poolFormData.poolType) return;

    try {
      setLoading(true);
      console.log("Creating pool with data:", poolFormData);
      
      // Create the pool
      const { data: poolData, error: poolError } = await supabase
        .from("pool")
        .insert({
          pool_name: poolFormData.poolName,
          pool_type: poolFormData.poolType as any,
        })
        .select("pool_id")
        .single();

      if (poolError) {
        console.error("Pool creation error:", poolError);
        throw poolError;
      }

      console.log("Pool created successfully:", poolData);

      // Update invoices with the new pool ID
      const { error: invoiceError } = await supabase
        .from("invoice")
        .update({ pool_id: poolData.pool_id })
        .in("invoice_id", selectedInvoices.map(id => Number(id)));

      if (invoiceError) {
        console.error("Invoice update error:", invoiceError);
        throw invoiceError;
      }

      toast({
        title: "Success",
        description: `Pool "${poolFormData.poolName}" created successfully`,
        variant: "default",
      });

      // Reset form
      setPoolFormData({
        poolName: "",
        poolType: PoolType.TOTAL_POOL,
        invoiceIds: [],
      });
      setSelectedInvoices([]);
      setCreateDialogOpen(false);
      
      // Refresh the pools and invoices
      await fetchPoolsAndInvoices();
      
      // Switch to the pools tab
      setActiveTab("pools");
    } catch (error) {
      console.error("Error creating pool:", error);
      toast({
        title: "Error",
        description: "Failed to create pool. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceId)) {
        return prev.filter(id => id !== invoiceId);
      } else {
        return [...prev, invoiceId];
      }
    });
    
    setPoolFormData(prev => {
      if (prev.invoiceIds.includes(invoiceId)) {
        return {
          ...prev,
          invoiceIds: prev.invoiceIds.filter(id => id !== invoiceId),
        };
      } else {
        return {
          ...prev,
          invoiceIds: [...prev.invoiceIds, invoiceId],
        };
      }
    });
  };

  const handleSelectAllInvoices = (checked: boolean) => {
    if (checked) {
      const allIds = unassignedInvoices.map(invoice => invoice.id);
      setSelectedInvoices(allIds);
      setPoolFormData(prev => ({
        ...prev,
        invoiceIds: allIds,
      }));
    } else {
      setSelectedInvoices([]);
      setPoolFormData(prev => ({
        ...prev,
        invoiceIds: [],
      }));
    }
  };

  const handleViewPool = (pool: Pool) => {
    setSelectedPool(pool);
    setEditMode(false);
    setActiveTab("view");
  };

  const handleEditPool = (pool: Pool) => {
    setSelectedPool(pool);
    setEditMode(true);
    setPoolFormData({
      poolName: pool.poolName,
      poolType: pool.poolType,
      invoiceIds: []
    });
    setActiveTab("view");
  };

  const handleUpdatePool = async () => {
    try {
      if (!selectedPool) return;
      
      setLoading(true);
      
      // Update the pool
      const { error } = await supabase
        .from("pool")
        .update({
          pool_name: poolFormData.poolName,
          pool_type: poolFormData.poolType as any
        })
        .eq("pool_id", Number(selectedPool.id));
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Pool updated successfully",
        variant: "default",
      });
      
      // Refresh the pools and invoices
      fetchPoolsAndInvoices();
      
      // Switch back to view mode
      setEditMode(false);
      setActiveTab("pools");
    } catch (error) {
      console.error("Error updating pool:", error);
      toast({
        title: "Error",
        description: "Failed to update pool",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePool = async (pool: Pool) => {
    try {
      setLoading(true);
      
      // Get invoices in the pool
      const poolInvoices = invoices.filter(invoice => invoice.poolId === pool.id);
      const invoiceIds = poolInvoices.map(invoice => Number(invoice.id));
      
      // Remove pool association from invoices
      if (invoiceIds.length > 0) {
        const { error: invoiceError } = await supabase
          .from("invoice")
          .update({ pool_id: null })
          .in("invoice_id", invoiceIds);

        if (invoiceError) throw invoiceError;
      }
      
      // Delete the pool
      const { error: poolError } = await supabase
        .from("pool")
        .delete()
        .eq("pool_id", Number(pool.id));

      if (poolError) throw poolError;
      
      toast({
        title: "Success",
        description: `Pool "${pool.poolName}" removed successfully`,
        variant: "default",
      });
      
      // Refresh the pools and invoices
      fetchPoolsAndInvoices();
      
      // Reset selected pool if it was the one removed
      if (selectedPool?.id === pool.id) {
        setSelectedPool(null);
        // Navigate back to pools tab
        setActiveTab("pools");
      }
    } catch (error) {
      console.error("Error removing pool:", error);
      toast({
        title: "Error",
        description: "Failed to remove pool",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total value of selected invoices
  const calculateTotalValue = () => {
    return selectedInvoices.reduce((sum, id) => {
      const invoice = unassignedInvoices.find(inv => inv.id === id);
      return sum + (invoice ? invoice.netAmountDue : 0);
    }, 0);
  };
  
  // Format currency for better display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Handle saving edited pool data
  const handleSavePool = async (pool: Pool, column: string, value: string | number) => {
    try {
      // Create update object with snake_case keys for Supabase
      const updateData: Record<string, any> = {};
      
      // Convert camelCase column name to snake_case for Supabase
      const snakeCaseColumn = column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      updateData[snakeCaseColumn] = value;
      
      const { error } = await supabase
        .from('pool')
        .update(updateData)
        .eq('pool_id', Number(pool.id));
        
      if (error) throw error;
      
      // Update local state
      setPools(prev => 
        prev.map(p => 
          p.id === pool.id 
            ? { ...p, [column]: value } 
            : p
        )
      );
      
      toast({
        title: "Success",
        description: "Pool updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating pool:", error);
      toast({
        title: "Error",
        description: "Failed to update pool",
        variant: "destructive",
      });
      throw error;
    }
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
      
      // Create a clone of the updated invoice with the new value
      const updatedInvoice = { ...invoice, [column]: value };
      
      // Update both invoices and unassignedInvoices state with the new objects
      // This ensures React detects the state change properly
      setInvoices(prev => prev.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
      setUnassignedInvoices(prev => prev.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
      
      toast({
        title: "Success",
        description: "Invoice updated successfully",
        variant: "default",
      });
      
      // Force a refresh of the table data after a short delay
      setTimeout(() => {
        fetchPoolsAndInvoices();
      }, 300);
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleRemoveInvoiceFromPool = async (invoice: Invoice) => {
    try {
      setLoading(true);
      
      // Remove pool association from invoice
      const { error } = await supabase
        .from("invoice")
        .update({ pool_id: null })
        .eq("invoice_id", Number(invoice.id));

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Invoice removed from pool successfully",
        variant: "default",
      });
      
      // Refresh the pools and invoices
      fetchPoolsAndInvoices();
    } catch (error) {
      console.error("Error removing invoice from pool:", error);
      toast({
        title: "Error",
        description: "Failed to remove invoice from pool",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Define pool columns with sorting capabilities
  const poolColumns = useMemo<ColumnDef<Pool, any>[]>(() => [
    {
      accessorKey: "poolName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Pool Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.poolName}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "poolType",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.poolType,
      enableSorting: true,
    },
    {
      accessorKey: "invoiceCount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Invoices
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.invoiceCount || 0,
      enableSorting: true,
    },
    {
      accessorKey: "totalValue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Total Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatCurrency(row.original.totalValue || 0),
      enableSorting: true,
    },
    {
      accessorKey: "averageDiscountRate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Avg. Discount Rate (%)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.averageDiscountRate ? `${row.original.averageDiscountRate.toFixed(4)}%` : 'N/A',
      enableSorting: true,
    },
    {
      accessorKey: "averageAge",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Avg. Duration (days)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.averageAge || 0,
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const pool = row.original;
        return (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() => handleViewPool(pool)}
            >
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() => handleEditPool(pool)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemovePool(pool)}
            >
              Remove
            </Button>
          </div>
        );
      },
      enableSorting: false,
    },
  ], []);

  // Define columns for the invoice table
  const invoiceColumns: ColumnDef<Invoice, any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }) => (
        <EditableCell
          value={row.original.invoiceNumber || ""}
          row={row.original}
          column="invoiceNumber"
          onSave={handleSaveInvoice}
        />
      ),
    },
    {
      accessorKey: "providerName",
      header: "Provider",
      cell: ({ row }) => row.original.providerName || "Unknown Provider",
    },
    {
      accessorKey: "payerName",
      header: "Payer",
      cell: ({ row }) => row.original.payerName || "Unknown Payer",
    },
    {
      accessorKey: "netAmountDue",
      header: "Amount",
      meta: { alignment: "right" },
      cell: ({ row }) => (
        <EditableCell
          value={row.original.netAmountDue}
          row={row.original}
          column="netAmountDue"
          type="number"
          onSave={handleSaveInvoice}
          displayValue={formatCurrency(row.original.netAmountDue)}
        />
      ),
    },
    {
      accessorKey: "factoringDiscountRate",
      header: "Discount Rate",
      meta: { alignment: "right" },
      cell: ({ row }) => (
        <EditableCell
          value={row.original.factoringDiscountRate}
          row={row.original}
          column="factoringDiscountRate"
          type="number"
          onSave={handleSaveInvoice}
          displayValue={`${row.original.factoringDiscountRate}%`}
        />
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <EditableCell
          value={row.original.dueDate || ""}
          row={row.original}
          column="dueDate"
          type="date"
          onSave={handleSaveInvoice}
          displayValue={row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString() : ""}
        />
      ),
    },
    {
      id: "duration",
      header: "Duration",
      cell: ({ row }) => `${getDuration(row.original)} days`,
      accessorFn: (row) => getDuration(row),
      meta: { alignment: "right" },
    },
    {
      id: "poolName",
      header: "Pool",
      cell: ({ row }) => row.original.poolName || "Unassigned",
    },
  ];

  // Define columns for the pool invoices table
  const poolInvoiceColumns = useMemo<ColumnDef<Invoice, any>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Invoice #",
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
        header: "Provider",
        enableSorting: true,
      },
      {
        accessorKey: "patientName",
        header: "Patient",
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
        header: "Payer",
        enableSorting: true,
      },
      {
        accessorKey: "netAmountDue",
        header: "Amount",
        cell: ({ row }) => (
          <EditableCell
            value={row.getValue("netAmountDue")}
            row={row.original}
            column="netAmountDue"
            onSave={handleSaveInvoice}
            type="number"
            formatter={(value) => `$${new Intl.NumberFormat('en-US').format(Number(value))}`}
          />
        ),
        dataType: "number",
        enableSorting: true,
      },
      {
        accessorKey: "invoiceDate",
        header: "Invoice Date",
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
        header: "Due Date",
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
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveInvoiceFromPool(row.original)}
            title="Remove from Pool"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    []
  );

  // Add edit pool content
  const renderEditPoolContent = () => {
    if (!selectedPool || !editMode) return null;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Pool</CardTitle>
          <CardDescription>
            Update pool information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="editPoolName">Pool Name</Label>
              <Input
                id="editPoolName"
                value={poolFormData.poolName}
                onChange={(e) => setPoolFormData(prev => ({ ...prev, poolName: e.target.value }))}
                placeholder="Enter pool name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Pool Type</Label>
              <RadioGroup
                value={poolFormData.poolType as any}
                onValueChange={(value) => setPoolFormData(prev => ({ ...prev, poolType: value as PoolType }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={PoolType.TOTAL_POOL as any} id="edit-total-pool" />
                  <Label htmlFor="edit-total-pool">Total Pool</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={PoolType.TRANCHE as any} id="edit-partial-pool" />
                  <Label htmlFor="edit-partial-pool">Tranche</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => { setEditMode(false); setActiveTab("pools"); fetchPoolsAndInvoices(); }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePool}
            disabled={loading || !poolFormData.poolName}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderPoolsTable = () => (
    <EnhancedDataTable
      columns={poolColumns}
      data={pools}
      searchKey="poolName"
      searchPlaceholder="Search pools..."
      initialSorting={[
        {
          id: "poolName",
          desc: false
        }
      ]}
      exportFilename="pools-export"
    />
  );

  // Update the renderInvoicesTable function to use EnhancedDataTable
  const renderInvoicesTable = () => (
    <EnhancedDataTable
      columns={invoiceColumns}
      data={invoices.filter(invoice => invoice.poolId === selectedPool.id)}
      searchKey="invoiceNumber"
      searchPlaceholder="Search invoices..."
      enableRowSelection={true}
      onRowSelectionChange={(selection) => 
        setSelectedInvoices(Object.keys(selection))
      }
      getRowId={(row) => row.id}
      initialSorting={[
        {
          id: "invoiceNumber",
          desc: false
        }
      ]}
      exportFilename={`pool-${selectedPool.id}-invoices`}
    />
  );

  // Navigation items for pool tabs
  const navigationItems = useMemo(() => [
    {
      id: "pools",
      label: "All Pools",
      icon: <BarChart3 className="h-5 w-5" />, 
      description: "Manage pools of invoices",
      count: pools.length
    },
    ...(selectedPool ? [{
      id: "view",
      label: "Pool Details",
      icon: <FolderPlus className="h-5 w-5" />, 
      description: "View selected pool details",
      count: 1
    }] : [])
  ], [pools.length, selectedPool]);

  return (
    <div className="mx-6 my-4">
      <NavigationCards
        items={navigationItems}
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as "pools" | "view")}
        pendingCount={pools.length}
        distributedCount={0}
        totalAllocationValue={0}
      />
      <div className="flex justify-between items-center mt-4">
        <h2 className="text-xl font-semibold">
          {navigationItems.find(item => item.id === activeTab)?.label}
        </h2>
        <div>
          {activeTab === "pools" && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Pool
            </Button>
          )}
          {activeTab === "view" && selectedPool && (
            <Button variant="outline" size="sm" onClick={() => { setSelectedPool(null); setActiveTab("pools"); }}>
              Back to Pools
            </Button>
          )}
        </div>
      </div>
      {/* Content based on active tab */}
      {activeTab === "pools" && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Manage Pools</CardTitle>
            <CardDescription>
              Create and manage pools of invoices for tokenization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              renderPoolsTable()
            )}
          </CardContent>
        </Card>
      )}
      {activeTab === "view" && selectedPool && (
        editMode ? (
          renderEditPoolContent()
        ) : (
          <Card className="mt-4">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedPool.poolName}</CardTitle>
                  <CardDescription>
                    {selectedPool.poolType} | {selectedPool.invoiceCount} Invoices | ${new Intl.NumberFormat('en-US').format(selectedPool.totalValue as number || 0)} Total Value | {selectedPool.averageAge} Days Avg. Duration
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={fetchPoolsAndInvoices} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditPool(selectedPool)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Pool
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleRemovePool(selectedPool)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Pool
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedPool(null); setActiveTab("pools"); }}>
                    Back to Pools
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Invoices in This Pool</h3>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  renderInvoicesTable()
                )}
              </div>
            </CardContent>
          </Card>
        )
      )}
      {/* Create Pool Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Create New Pool</DialogTitle>
            <DialogDescription>
              Create a new pool and assign invoices to it
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="poolName" className="text-right">
                Pool Name
              </Label>
              <Input
                id="poolName"
                value={poolFormData.poolName}
                onChange={(e) => setPoolFormData(prev => ({ ...prev, poolName: e.target.value }))}
                className="col-span-3"
                placeholder="Enter pool name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="poolType" className="text-right">
                Pool Type
              </Label>
              <Select 
                value={poolFormData.poolType as any}
                onValueChange={(value) => setPoolFormData(prev => ({ ...prev, poolType: value as PoolType }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select pool type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PoolType.TOTAL_POOL as any}>Total Pool</SelectItem>
                  <SelectItem value={PoolType.TRANCHE as any}>Tranche</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-4">
              <Label>Select Invoices</Label>
              <div className="text-sm text-muted-foreground">
                Selected: {selectedInvoices.length} | Total Value: {formatCurrency(calculateTotalValue())}
              </div>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search invoices by number, client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-60">
                  <Select
                    value={durationFilter}
                    onValueChange={setDurationFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Durations</SelectItem>
                      <SelectItem value="0-30">0-30 Days</SelectItem>
                      <SelectItem value="31-60">31-60 Days</SelectItem>
                      <SelectItem value="61-90">61-90 Days</SelectItem>
                      <SelectItem value="91+">91+ Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="h-60 border rounded-md overflow-auto p-1">
                {unassignedInvoices
                  .filter(invoice => {
                    // Text filter
                    const matchesText = !searchQuery || 
                      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (invoice.patientName && invoice.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (invoice.policyNumber && invoice.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()));
                    
                    // Duration filter
                    let matchesDuration = true;
                    if (durationFilter !== "all") {
                      const duration = getDuration(invoice);
                      switch (durationFilter) {
                        case "0-30":
                          matchesDuration = duration >= 0 && duration <= 30;
                          break;
                        case "31-60":
                          matchesDuration = duration > 30 && duration <= 60;
                          break;
                        case "61-90":
                          matchesDuration = duration > 60 && duration <= 90;
                          break;
                        case "91+":
                          matchesDuration = duration > 90;
                          break;
                      }
                    }
                    
                    return matchesText && matchesDuration;
                  })
                  .map(invoice => (
                    <div key={invoice.id} className="flex items-center space-x-2 py-2 border-b last:border-b-0">
                      <Checkbox 
                        id={`invoice-${invoice.id}`} 
                        checked={selectedInvoices.includes(invoice.id)}
                        onCheckedChange={() => handleSelectInvoice(invoice.id)}
                      />
                      <Label htmlFor={`invoice-${invoice.id}`} className="flex justify-between w-full cursor-pointer leading-relaxed">
                        <span>{invoice.invoiceNumber} - {invoice.patientName}</span>
                        <span className="font-medium">{formatCurrency(invoice.netAmountDue)}</span>
                      </Label>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePool} disabled={loading}>
              {loading ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Creating...
                </>
              ) : (
                'Create Pool'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoolManager;