import React, { useState, useEffect } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/infrastructure/database/client";
import { v4 as uuidv4 } from "uuid";

// Form validation schema
const subscriptionFormSchema = z.object({
  investor_id: z.string().min(1, { message: "Please select an investor." }),
  currency: z.string().min(1, { message: "Please select a currency." }),
  amount: z.coerce
    .number()
    .min(1, { message: "Amount must be greater than 0." }),
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  projectId?: string;
}

// Common currencies
const currencies = ["USD", "EUR", "GBP", "JPY", "CHF"];

const SubscriptionDialog = ({
  open,
  onOpenChange,
  onSubmit,
  projectId,
}: SubscriptionDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [investors, setInvestors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      investor_id: "",
      currency: "USD", // Default to USD for convenience
      amount: undefined,
    },
  });

  // Fetch investors when dialog opens
  useEffect(() => {
    if (open) {
      fetchInvestors();
    }
  }, [open]);

  const fetchInvestors = async () => {
    try {
      setIsSearching(true);

      // Fetch all investors from the database, regardless of project
      const { data, error } = await supabase
        .from("investors")
        .select("investor_id, name, email, wallet_address")
        .order("name", { ascending: true });

      if (error) throw error;

      // Transform data
      const transformedInvestors =
        data?.map((item) => ({
          investor_id: item.investor_id,
          name: item.name,
          email: item.email,
          wallet_address: item.wallet_address,
        })) || [];

      setInvestors(transformedInvestors);
    } catch (err) {
      console.error("Error fetching investors:", err);
      toast({
        title: "Error",
        description: "Failed to load investors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Filter investors based on search query - do this in real-time
  const filteredInvestors = investors.filter((investor) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      investor.name?.toLowerCase().includes(query) ||
      investor.email?.toLowerCase().includes(query)
    );
  });

  // Handle form submission
  const handleSubmit = async (formData: SubscriptionFormValues) => {
    try {
      setIsLoading(true);

      if (!projectId) {
        toast({
          title: "Error",
          description: "No project selected. Please select a project first.",
          variant: "destructive",
        });
        return;
      }

      // Find selected investor details
      const selectedInvestor = investors.find(
        (inv) => inv.investor_id === formData.investor_id,
      );

      if (!selectedInvestor) {
        throw new Error("Selected investor not found");
      }

      // Prepare data for submission
      const subscriptionData = {
        investor_id: formData.investor_id,
        investor_name: selectedInvestor.name,
        investor_email: selectedInvestor.email,
        wallet_address: selectedInvestor.wallet_address,
        currency: formData.currency,
        amount: formData.amount,
        project_id: projectId, // Include the project ID
      };

      console.log("Creating subscription with data:", subscriptionData);

      // Call the onSubmit callback
      await onSubmit(subscriptionData);

      // Reset form
      form.reset();

      toast({
        title: "Success",
        description: `Subscription added for ${selectedInvestor.name}`,
      });
    } catch (err) {
      console.error("Error submitting form:", err);
      toast({
        title: "Error",
        description: "Failed to add subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Add Subscription</span>
          </DialogTitle>
          <DialogDescription>
            Add a new investor subscription to the project
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <FormLabel>Search Investors</FormLabel>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email"
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="investor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Investor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an investor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {isSearching ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading...</span>
                          </div>
                        ) : filteredInvestors.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No investors found
                          </div>
                        ) : (
                          filteredInvestors.map((investor) => (
                            <SelectItem
                              key={investor.investor_id}
                              value={investor.investor_id}
                            >
                              {investor.name} ({investor.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {projectId ? (
                        "Select an investor to add to the current project"
                      ) : (
                        <span className="text-yellow-600">
                          No project selected. Please select a project first.
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the subscription amount in the selected currency
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Subscription"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;
