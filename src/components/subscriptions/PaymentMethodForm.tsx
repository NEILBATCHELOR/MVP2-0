import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Calendar, Lock } from "lucide-react";

// Form validation schema
const paymentMethodSchema = z.object({
  cardNumber: z
    .string()
    .min(13, { message: "Card number must be at least 13 digits." })
    .max(19, { message: "Card number must be at most 19 digits." })
    .regex(/^[0-9]+$/, { message: "Card number must contain only digits." }),
  cardholderName: z
    .string()
    .min(2, { message: "Cardholder name must be at least 2 characters." }),
  expiryMonth: z.string().min(1, { message: "Please select an expiry month." }),
  expiryYear: z.string().min(1, { message: "Please select an expiry year." }),
  cvv: z
    .string()
    .min(3, { message: "CVV must be at least 3 digits." })
    .max(4, { message: "CVV must be at most 4 digits." })
    .regex(/^[0-9]+$/, { message: "CVV must contain only digits." }),
  billingAddress: z.object({
    line1: z.string().min(1, { message: "Address line 1 is required." }),
    line2: z.string().optional(),
    city: z.string().min(1, { message: "City is required." }),
    state: z.string().min(1, { message: "State is required." }),
    postalCode: z.string().min(1, { message: "Postal code is required." }),
    country: z.string().min(1, { message: "Country is required." }),
  }),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: PaymentMethodFormValues) => void;
  existingPaymentMethod?: any;
}

const PaymentMethodForm = ({
  open = false,
  onOpenChange = () => {},
  onSubmit = () => {},
  existingPaymentMethod,
}: PaymentMethodFormProps) => {
  // Generate years for expiry date selection
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) =>
    (currentYear + i).toString(),
  );

  // Generate months for expiry date selection
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return month < 10 ? `0${month}` : month.toString();
  });

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      cardNumber: "",
      cardholderName: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      billingAddress: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US",
      },
    },
  });

  const handleSubmit = (data: PaymentMethodFormValues) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Payment Method</span>
          </DialogTitle>
          <DialogDescription>
            Enter your payment details to update your payment method
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Card Information</h3>

              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="1234 5678 9012 3456"
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
                name="cardholderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cardholder Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormLabel>Expiry Date</FormLabel>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="expiryMonth"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="MM" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month} value={month}>
                                  {month}
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
                      name="expiryYear"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="YYYY" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="cvv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVV</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="123"
                            maxLength={4}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        3 or 4 digit security code
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Billing Address</h3>

              <FormField
                control={form.control}
                name="billingAddress.line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingAddress.line2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apt 4B" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billingAddress.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingAddress.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billingAddress.postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingAddress.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="JP">Japan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Payment Method</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodForm;
