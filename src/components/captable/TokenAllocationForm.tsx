import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/infrastructure/database/client";
import { getTokens } from "@/services/token";
import { getTemplates } from "@/services/token";
import { TokenStatus } from "@/types/core/centralModels";

interface TokenAllocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  projectId: string;
  subscriptionId?: string;
  investorId?: string;
}

// Form validation schema
const tokenAllocationSchema = z.object({
  subscription_id: z.string().min(1, { message: "Subscription is required" }),
  allocations: z
    .array(
      z.object({
        token_type: z.string().min(1, { message: "Token type is required" }),
        token_amount: z.coerce
          .number()
          .min(0.000001, { message: "Amount must be greater than 0" }),
        token_id: z.string().optional()
      }),
    )
    .min(1, { message: "At least one token allocation is required" }),
  notes: z.string().optional(),
});

type TokenAllocationFormValues = z.infer<typeof tokenAllocationSchema>;

const TokenAllocationForm = ({
  open,
  onOpenChange,
  onSubmit,
  projectId,
  subscriptionId,
  investorId,
}: TokenAllocationFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<TokenAllocationFormValues>({
    resolver: zodResolver(tokenAllocationSchema),
    defaultValues: {
      subscription_id: subscriptionId || "",
      allocations: [
        {
          token_type: "",
          token_amount: 0,
          token_id: undefined
        },
      ],
      notes: "",
    },
  });

  // Watch for changes to subscription_id
  const watchedSubscriptionId = form.watch("subscription_id");

  // Fetch subscriptions and tokens when dialog opens
  useEffect(() => {
    if (open) {
      fetchSubscriptions();
      fetchAvailableTokenOptions();
    }
  }, [open]);

  // Update selected subscription when subscription_id changes
  useEffect(() => {
    if (watchedSubscriptionId) {
      const subscription = subscriptions.find(
        (sub) => sub.id === watchedSubscriptionId,
      );
      setSelectedSubscription(subscription);
    } else {
      setSelectedSubscription(null);
    }
  }, [watchedSubscriptionId, subscriptions]);

  // Fetch available tokens and templates with eligible statuses
  const fetchAvailableTokenOptions = async () => {
    try {
      setIsLoading(true);
      
      // Get tokens with eligible statuses
      const eligibleStatuses = [
        TokenStatus.APPROVED,
        TokenStatus.READY_TO_MINT,
        TokenStatus.MINTED,
        TokenStatus.DEPLOYED
      ];
      
      // Fetch tokens
      const response = await getTokens({ projectId });
      const allTokens = response.success && response.data ? (Array.isArray(response.data) ? response.data : [response.data]) : [];
      const tokens = allTokens.filter(token => eligibleStatuses.includes(token.status as TokenStatus));
      
      // Transform tokens for the dropdown
      const formattedTokens = tokens.map(token => ({
        id: token.id || '',
        name: token.name || '',
        symbol: 'symbol' in token ? token.symbol : '',
        type: `${token.name || ''} (${'symbol' in token ? token.symbol : ''}) - ${token.standard || ''}`,
        standard: token.standard || '',
        status: token.status || '',
        category: "Active Token"
      }));
      
      setAvailableTokens(formattedTokens);
      
      // Fetch templates with APPROVED status
      // We need to fetch templates for each status since the API only supports one status at a time
      let allTemplates = [];
      
      try {
        const templatesResponse = await getTemplates({ projectId });
        const templates = templatesResponse.success && templatesResponse.data 
          ? (Array.isArray(templatesResponse.data) ? templatesResponse.data : [templatesResponse.data])
          : [];
        
        // Filter templates by status
        const filteredTemplates = templates.filter(template => {
          // Check if metadata exists and has a status property
          const metadata = template.metadata && typeof template.metadata === 'object' 
            ? (template.metadata as Record<string, any>) 
            : undefined;
          
          // Get status from metadata or template
          const templateStatus = metadata?.status || 
            (template as Record<string, any>).status;
          
          // Check if the status is in eligible statuses
          return templateStatus && eligibleStatuses.includes(templateStatus as any);
        });
        
        if (filteredTemplates && filteredTemplates.length > 0) {
          allTemplates = [...allTemplates, ...filteredTemplates];
        }
      } catch (err) {
        console.error(`Error fetching templates:`, err);
      }
      
      // Remove duplicates (a template might appear in multiple statuses)
      const uniqueTemplates = allTemplates.filter((template, index, self) =>
        index === self.findIndex((t) => t.id === template.id)
      );
      
      // Transform templates for the dropdown
      const formattedTemplates = uniqueTemplates.map(template => ({
        id: template.id,
        name: template.name,
        type: `${template.name} - ${template.standard} (Template)`,
        standard: template.standard,
        status: template.metadata && typeof template.metadata === 'object' 
          ? (template.metadata as Record<string, any>).status 
          : (template as Record<string, any>).status || "TEMPLATE",
        category: "Token Template"
      }));
      
      setAvailableTemplates(formattedTemplates);
      
    } catch (err) {
      console.error("Error fetching available tokens and templates:", err);
      toast({
        title: "Error",
        description: "Failed to load token options. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subscriptions for the project
  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from("subscriptions")
        .select(
          `
          id,
          investor_id,
          subscription_id,
          currency,
          fiat_amount,
          subscription_date,
          confirmed,
          allocated,
          notes,
          investors!inner(name, email, wallet_address)
        `,
        )
        .eq("project_id", projectId);

      // If investorId is provided, filter by investor
      if (investorId) {
        query = query.eq("investor_id", investorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSubscriptions(data || []);

      // If subscriptionId is provided, set it as selected
      if (subscriptionId) {
        const subscription = data?.find((sub) => sub.id === subscriptionId);
        setSelectedSubscription(subscription);
        form.setValue("subscription_id", subscriptionId);
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      toast({
        title: "Error",
        description: "Failed to load subscriptions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new token allocation field
  const addTokenAllocation = () => {
    const currentAllocations = [...form.getValues("allocations")];
    currentAllocations.push({ token_type: "", token_amount: 0, token_id: undefined });
    form.setValue("allocations", currentAllocations, { shouldDirty: true });
  };

  // Remove a token allocation field
  const removeTokenAllocation = (index: number) => {
    const currentAllocations = [...form.getValues("allocations")];
    if (currentAllocations.length <= 1) return; // Keep at least one allocation

    currentAllocations.splice(index, 1);
    form.setValue("allocations", currentAllocations, { shouldDirty: true });
  };

  // Handle form submission
  const handleSubmit = async (formData: TokenAllocationFormValues) => {
    try {
      setIsLoading(true);

      if (!projectId) {
        toast({
          title: "Error",
          description: "Project ID is required.",
          variant: "destructive",
        });
        return;
      }

      // Find the selected subscription
      const subscription = subscriptions.find(
        (sub) => sub.id === formData.subscription_id,
      );

      if (!subscription) {
        toast({
          title: "Error",
          description: "Selected subscription not found.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for submission
      const allocationData = {
        subscription_id: formData.subscription_id,
        investor_id: subscription.investor_id,
        project_id: projectId,
        investor_name: subscription.investors.name,
        investor_email: subscription.investors.email,
        wallet_address: subscription.investors.wallet_address,
        fiat_amount: subscription.fiat_amount,
        currency: subscription.currency,
        allocations: formData.allocations,
        notes: formData.notes,
      };

      // Call the onSubmit callback
      await onSubmit(allocationData);

      // Reset form
      form.reset();

      toast({
        title: "Success",
        description: `Token allocations added for ${subscription.investors.name}`,
      });
    } catch (err) {
      console.error("Error submitting form:", err);
      toast({
        title: "Error",
        description: "Failed to add token allocations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Token Allocation</DialogTitle>
          <DialogDescription>
            Add token allocation details for an investor subscription.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="subscription_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || !!subscriptionId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subscription" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subscriptions.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.investors.name} - {sub.currency}{" "}
                          {sub.fiat_amount} (ID: {sub.subscription_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select an investor subscription to allocate tokens.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedSubscription && (
              <div className="p-4 border rounded-md bg-gray-50">
                <h4 className="font-medium">Subscription Details</h4>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <p className="text-gray-500">Investor:</p>
                    <p>{selectedSubscription.investors.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount:</p>
                    <p>
                      {selectedSubscription.currency}{" "}
                      {selectedSubscription.fiat_amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status:</p>
                    <p>
                      {selectedSubscription.confirmed ? "Confirmed" : "Pending"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Wallet:</p>
                    <p className="truncate">
                      {selectedSubscription.investors.wallet_address || "None"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Token Allocations</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTokenAllocation}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Token
                </Button>
              </div>

              {form.getValues("allocations").map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 items-center"
                >
                  <FormField
                    control={form.control}
                    name={`allocations.${index}.token_type`}
                    render={({ field }) => (
                      <FormItem className="col-span-7">
                        <FormLabel className={index !== 0 ? "sr-only" : ""}>
                          Token Type
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            
                            const selectedToken = [...availableTokens, ...availableTemplates].find(
                              token => token.type === value
                            );
                            
                            if (selectedToken?.id) {
                              form.setValue(`allocations.${index}.token_id`, selectedToken.id);
                              console.log(`Setting token_id to ${selectedToken.id} for ${value}`);
                            } else {
                              form.setValue(`allocations.${index}.token_id`, undefined);
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select token type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableTokens.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-sm font-semibold">Active Tokens</div>
                                {availableTokens.map((token) => (
                                  <SelectItem key={token.id} value={token.type}>
                                    {token.type} ({token.status})
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            
                            {availableTemplates.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-sm font-semibold mt-2">Token Templates</div>
                                {availableTemplates.map((template) => (
                                  <SelectItem key={template.id} value={template.type}>
                                    {template.type}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            
                            {availableTokens.length === 0 && availableTemplates.length === 0 && (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No eligible tokens found. Create tokens with status: Approved, Ready to Mint, Minted, or Deployed.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`allocations.${index}.token_amount`}
                    render={({ field }) => (
                      <FormItem className="col-span-4">
                        <FormLabel className={index !== 0 ? "sr-only" : ""}>
                          Amount
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.0"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === "" ? 0 : parseFloat(value),
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`allocations.${index}.token_id`}
                    render={({ field }) => (
                      <input type="hidden" {...field} value={field.value || ""} />
                    )}
                  />

                  <div className="col-span-1 flex justify-end">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTokenAllocation(index)}
                      >
                        <Trash className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add any notes about this allocation"
                      {...field}
                    />
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
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Allocation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TokenAllocationForm;
