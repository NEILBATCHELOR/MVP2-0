import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, RefreshCw, Trash2, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Invoice } from "./types";
import { cn } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface BulkEditInvoicesProps {
  selectedInvoices: Invoice[];
  onRefresh: () => void;
  onDeselectAll: () => void;
}

// Schema for bulk edit form
const bulkEditSchema = z.object({
  providerName: z.string().optional(),
  payerName: z.string().optional(),
  invoiceNumber: z.string().optional(),
  patientName: z.string().optional(),
  billedAmount: z.string().optional(),
  adjustments: z.string().optional(),
  netAmountDue: z.string().optional(),
  factoringDiscountRate: z.string().optional(),
  invoiceDate: z.date().optional(),
  dueDate: z.date().optional(),
  serviceDates: z.string().optional(),
  procedureCodes: z.string().optional(),
  diagnosisCodes: z.string().optional(),
  policyNumber: z.string().optional(),
  factoringTerms: z.string().optional()
});

type BulkEditFormValues = z.infer<typeof bulkEditSchema>;

const BulkEditInvoices: React.FC<BulkEditInvoicesProps> = ({ 
  selectedInvoices, 
  onRefresh,
  onDeselectAll
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Initialize form
  const form = useForm<BulkEditFormValues>({
    resolver: zodResolver(bulkEditSchema),
    defaultValues: {}
  });

  const handleBulkEdit = async (values: BulkEditFormValues) => {
    try {
      setIsSubmitting(true);

      // Filter out undefined values
      const updates: Record<string, any> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined) {
          // Convert camelCase to snake_case for database
          const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          
          // Handle date fields
          if (value instanceof Date) {
            updates[snakeCaseKey] = format(value, 'yyyy-MM-dd');
          } else {
            updates[snakeCaseKey] = value;
          }
        }
      });

      // Check if there are any updates to make
      if (Object.keys(updates).length === 0) {
        toast({
          title: "No changes",
          description: "No fields were selected for update",
          variant: "default",
        });
        setEditDialogOpen(false);
        return;
      }

      // Get all selected invoice IDs
      const invoiceIds = selectedInvoices.map(invoice => Number(invoice.id));

      // Perform the bulk update
      const { error } = await supabase
        .from('invoice')
        .update(updates)
        .in('invoice_id', invoiceIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${invoiceIds.length} invoices`,
        variant: "default",
      });

      // Close dialog and refresh the invoices list
      setEditDialogOpen(false);
      onRefresh();
      onDeselectAll();
    } catch (error) {
      console.error("Error performing bulk edit:", error);
      toast({
        title: "Error",
        description: "Failed to update invoices: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setIsSubmitting(true);

      // Get all selected invoice IDs
      const invoiceIds = selectedInvoices.map(invoice => Number(invoice.id));

      // Perform the bulk delete
      const { error } = await supabase
        .from('invoice')
        .delete()
        .in('invoice_id', invoiceIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deleted ${invoiceIds.length} invoices`,
        variant: "default",
      });

      // Close dialog and refresh the invoices list
      setDeleteDialogOpen(false);
      onRefresh();
      onDeselectAll();
    } catch (error) {
      console.error("Error performing bulk delete:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoices: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Bulk Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            disabled={selectedInvoices.length === 0}
            onClick={() => form.reset({})}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Bulk Edit ({selectedInvoices.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Edit Invoices</DialogTitle>
            <DialogDescription>
              Edit multiple fields across {selectedInvoices.length} selected invoices.
              Only filled fields will be updated.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleBulkEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Invoice Number */}
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-001" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Provider Name */}
                <FormField
                  control={form.control}
                  name="providerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Provider" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Patient Name */}
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Patient" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payer Name */}
                <FormField
                  control={form.control}
                  name="payerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Payer" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Billed Amount */}
                <FormField
                  control={form.control}
                  name="billedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billed Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Adjustments */}
                <FormField
                  control={form.control}
                  name="adjustments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adjustments</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Net Amount Due */}
                <FormField
                  control={form.control}
                  name="netAmountDue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Net Amount Due</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Factoring Discount Rate */}
                <FormField
                  control={form.control}
                  name="factoringDiscountRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Invoice Date */}
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Invoice Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Service Dates */}
                <FormField
                  control={form.control}
                  name="serviceDates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Dates</FormLabel>
                      <FormControl>
                        <Input placeholder="Service Dates" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Procedure Codes */}
                <FormField
                  control={form.control}
                  name="procedureCodes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedure Codes</FormLabel>
                      <FormControl>
                        <Input placeholder="Procedure Codes" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Diagnosis Codes */}
                <FormField
                  control={form.control}
                  name="diagnosisCodes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis Codes</FormLabel>
                      <FormControl>
                        <Input placeholder="Diagnosis Codes" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Policy Number */}
                <FormField
                  control={form.control}
                  name="policyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Policy Number" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Factoring Terms */}
                <FormField
                  control={form.control}
                  name="factoringTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Factoring Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="Net 30" {...field} value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>Apply Changes</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            disabled={selectedInvoices.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedInvoices.length})
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedInvoices.length} selected invoice{selectedInvoices.length !== 1 ? 's' : ''} 
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BulkEditInvoices; 