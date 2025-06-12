import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  PlusCircle,
  DollarSign,
  User,
  Mail,
  Building,
  Check,
  Calendar,
  FileText,
  Percent,
  Clock,
  Vote,
  Share2,
  Loader2,
} from "lucide-react";
import {
  investorTypeCategories,
  getAllInvestorTypes,
} from "@/utils/compliance/investorTypes";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Get all investor type IDs for validation
const allInvestorTypeIds = getAllInvestorTypes().map((type) => type.id);

// Form validation schema
const investorFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Investor name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  company: z.string().optional(),
  type: z.string().refine((value) => allInvestorTypeIds.includes(value), {
    message: "Please select a valid investor type",
  }),
  wallet_address: z.string().optional(),
  kyc_status: z.enum([
    "not_started",
    "pending",
    "approved",
    "failed",
    "expired",
  ]),
  notes: z.string().optional(),
});

type InvestorFormValues = z.infer<typeof investorFormSchema>;

interface InvestorDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  investor?: any;
  onSuccess?: () => void;
  mode?: "add" | "edit";
}

const defaultInvestor: InvestorFormValues = {
  name: "",
  email: "",
  company: "",
  type: "hnwi", // Default to High-Net-Worth Individual
  wallet_address: "",
  kyc_status: "not_started",
  notes: "",
};

const InvestorDialog = ({
  open = false,
  onOpenChange = () => {},
  investor = null,
  onSuccess = () => {},
  mode = "add",
}: InvestorDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form with investor data if in edit mode
  const form = useForm<InvestorFormValues>({
    resolver: zodResolver(investorFormSchema),
    defaultValues: investor
      ? {
          name: investor.name || "",
          email: investor.email || "",
          company: investor.company || "",
          type: investor.type || "hnwi",
          wallet_address: investor.wallet_address || "",
          kyc_status: investor.kyc_status || "not_started",
          notes: investor.notes || "",
        }
      : defaultInvestor,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (investor) {
        try {
          const formValues = {
            name: investor.name || "",
            email: investor.email || "",
            company: investor.company || "",
            type: investor.type || "hnwi",
            wallet_address: investor.wallet_address || "",
            kyc_status: investor.kyc_status || "not_started",
            notes: investor.notes || "",
          };
          form.reset(formValues);
        } catch (error) {
          console.error("Error resetting form:", error);
          toast({
            title: "Error",
            description: "Failed to load investor data. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        form.reset(defaultInvestor);
      }
    }
  }, [open]);

  const handleSubmit = async (data: InvestorFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting investor data:", data);

      const now = new Date().toISOString();

      if (mode === "add") {
        // Create new investor
        console.log("Creating new investor with data:", {
          name: data.name,
          email: data.email,
          company: data.company || null,
          type: data.type,
          wallet_address: data.wallet_address || null,
          kyc_status: data.kyc_status,
          notes: data.notes || null,
        });

        const { data: newInvestor, error } = await supabase
          .from("investors")
          .insert({
            name: data.name,
            email: data.email,
            company: data.company || null,
            type: data.type,
            wallet_address: data.wallet_address || null,
            kyc_status: data.kyc_status,
            notes: data.notes || null,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating investor:", error);
          throw error;
        }

        toast({
          title: "Success",
          description: "Investor created successfully",
        });
      } else {
        // Update existing investor
        const { error } = await supabase
          .from("investors")
          .update({
            name: data.name,
            email: data.email,
            company: data.company || null,
            type: data.type,
            wallet_address: data.wallet_address || null,
            kyc_status: data.kyc_status,
            notes: data.notes || null,
            updated_at: now,
          })
          .eq("investor_id", investor.investor_id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Investor updated successfully",
        });
      }

      // Call success callback
      onSuccess();

      // Close dialog
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving investor:", err);
      toast({
        title: "Error",
        description:
          err.message || "Failed to save investor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? (
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                <span>Add New Investor</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span>Edit Investor Details</span>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add a new investor to the database with their details."
              : "Update the investor's information in the database."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investor Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="John Doe"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="investor@example.com"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="Acme Corp"
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investor Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select investor type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {investorTypeCategories.map((category) => (
                          <React.Fragment key={category.id}>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/30">
                              {category.name}
                            </div>
                            {category.types.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of investor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="wallet_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          placeholder="0x1234..."
                          {...field}
                          value={field.value || ""}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            // Generate random ETH wallet address
                            const hexChars = "0123456789abcdef";
                            let address = "0x";
                            for (let i = 0; i < 40; i++) {
                              address += hexChars.charAt(
                                Math.floor(Math.random() * hexChars.length),
                              );
                            }
                            field.onChange(address);
                          }}
                        >
                          Generate
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Ethereum wallet address for token distribution
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kyc_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KYC Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select KYC status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                            <span>Not Started</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                            <span>Pending</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="approved">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span>Approved</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="failed">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            <span>Failed</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="expired">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                            <span>Expired</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Current KYC verification status
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Additional notes about this investor"
                        {...field}
                        value={field.value || ""}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "add" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {mode === "add" ? "Add Investor" : "Update Investor"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InvestorDialog;
