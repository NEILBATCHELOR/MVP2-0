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
} from "lucide-react";
import {
  investorTypeCategories,
  getAllInvestorTypes,
} from "@/utils/compliance/investorTypes";
import { Investor, InvestorEntityType, KycStatus } from "@/types/core/centralModels";
import { updateState } from "@/utils/state/stateHelpers";
import { isInvestor } from "@/utils/types/typeGuards";

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
  investorType: z
    .string()
    .refine((value) => allInvestorTypeIds.includes(value), {
      message: "Please select a valid investor type",
    }),
  subscriptionAmount: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Please enter a valid subscription amount greater than 0.",
    }),
  status: z.enum(["pending", "confirmed", "rejected"]),
  securityType: z.enum(["equity", "convertible_note", "safe", "token"]),
  investmentDate: z.string(),
  conversionCap: z.string().optional(),
  conversionDiscount: z.string().optional(),
  interestRate: z.string().optional(),
  maturityDate: z.string().optional(),
  proRataRights: z.boolean().optional(),
  votingRights: z.boolean().optional(),
  notes: z.string().optional(),
});

type InvestorFormValues = z.infer<typeof investorFormSchema>;

interface InvestorDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  investor?: Investor;
  onSubmit?: (data: InvestorFormValues) => void;
  mode?: "add" | "edit";
}

const defaultInvestor: InvestorFormValues = {
  name: "",
  email: "",
  company: "",
  investorType: "hnwi", // Default to High-Net-Worth Individual
  subscriptionAmount: "",
  status: "pending",
  securityType: "equity",
  investmentDate: new Date().toISOString().split("T")[0],
  conversionCap: "",
  conversionDiscount: "",
  interestRate: "",
  maturityDate: "",
  proRataRights: false,
  votingRights: false,
  notes: "",
};

const InvestorDialog: React.FC<InvestorDialogProps> = ({
  open = true,
  onOpenChange = () => {},
  investor,
  onSubmit = () => {},
  mode = "add",
}) => {
  const [formData, setFormData] = useState<Investor>({
    id: investor?.id || "",
    name: investor?.name || "",
    email: investor?.email || "",
    type: investor?.type || InvestorEntityType.INDIVIDUAL,
    company: investor?.company || "",
    kycStatus: investor?.kycStatus || KycStatus.PENDING,
    createdAt: investor?.createdAt || new Date().toISOString(),
    updatedAt: investor?.updatedAt || new Date().toISOString()
  });

  useEffect(() => {
    if (investor && isInvestor(investor)) {
      setFormData(investor);
    }
  }, [investor]);

  const handleChange = (field: keyof Investor, value: any) => {
    updateState(setFormData, { [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData as InvestorFormValues);
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const form = useForm<InvestorFormValues>({
    resolver: zodResolver(investorFormSchema),
    defaultValues: formData,
  });

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
              ? "Add a new investor to the cap table with their subscription details."
              : "Update the investor's information and subscription details."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={handleSubmit}
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
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="investorType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investor Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                name="subscriptionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="10000"
                          type="text"
                          inputMode="numeric"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the investment amount in USD
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="securityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select security type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="equity">Equity</SelectItem>
                        <SelectItem value="convertible_note">
                          Convertible Note
                        </SelectItem>
                        <SelectItem value="safe">SAFE</SelectItem>
                        <SelectItem value="token">Token</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of security being issued to this investor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="investmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" type="date" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Conditional fields based on security type */}
            {form.watch("securityType") === "convertible_note" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="conversionCap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversion Cap</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="5000000"
                            type="text"
                            inputMode="numeric"
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
                  name="conversionDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversion Discount (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="20"
                            type="text"
                            inputMode="numeric"
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
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="5"
                            type="text"
                            inputMode="numeric"
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
                  name="maturityDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maturity Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" type="date" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {form.watch("securityType") === "safe" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="conversionCap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversion Cap</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="5000000"
                            type="text"
                            inputMode="numeric"
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
                  name="conversionDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversion Discount (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="20"
                            type="text"
                            inputMode="numeric"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {form.watch("securityType") === "equity" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="votingRights"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          <div className="flex items-center">
                            <Vote className="mr-2 h-4 w-4 text-muted-foreground" />
                            Voting Rights
                          </div>
                        </FormLabel>
                        <FormDescription>
                          Does this investor have voting rights?
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proRataRights"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          <div className="flex items-center">
                            <Share2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            Pro-Rata Rights
                          </div>
                        </FormLabel>
                        <FormDescription>
                          Does this investor have pro-rata rights for future
                          rounds?
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                            <span>Pending</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="confirmed">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span>Confirmed</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            <span>Rejected</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The current status of this investor's subscription
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        />
                      </div>
                    </FormControl>
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
              >
                Cancel
              </Button>
              <Button type="submit">
                <Check className="mr-2 h-4 w-4" />
                {mode === "add" ? "Add Investor" : "Update Investor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InvestorDialog;
