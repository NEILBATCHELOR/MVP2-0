import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate as formatDateUtil } from "@/utils/shared/formatting/formatters";

// Define a local Invoice type to use in this component
interface Invoice {
  id: string;
  amount: number;
  status: "paid" | "pending" | "failed" | "canceled";
  dueDate: string;
  paidDate?: string;
  invoiceNumber: string;
}

interface SubscriptionDetailsProps {
  subscriptionId?: string;
  planName?: string;
  planDescription?: string;
  status?: "active" | "canceled" | "expired" | "trial";
  startDate?: string;
  endDate?: string;
  trialEndDate?: string;
  billingCycle?: "monthly" | "quarterly" | "annual";
  price?: number;
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  paymentMethod?: {
    type: "credit_card" | "bank_transfer" | "paypal";
    last4?: string;
    expiryDate?: string;
    cardType?: string;
  };
  invoices?: Invoice[];
  onCancelSubscription?: () => void;
  onRenewSubscription?: () => void;
  onUpdatePaymentMethod?: (data: any) => void;
  onViewInvoice?: (invoiceId: string) => void;
  isLoading?: boolean;
}

const SubscriptionDetails = ({
  subscriptionId = "sub_123456",
  planName = "Professional",
  planDescription = "Advanced features for growing businesses",
  status = "active",
  startDate = "2023-06-01",
  endDate,
  trialEndDate,
  billingCycle = "monthly",
  price = 99.99,
  nextPaymentDate = "2023-07-01",
  lastPaymentDate = "2023-06-01",
  paymentMethod = {
    type: "credit_card",
    last4: "4242",
    expiryDate: "06/25",
    cardType: "Visa",
  },
  invoices = [
    {
      id: "inv_001",
      amount: 99.99,
      status: "paid",
      dueDate: "2023-06-01",
      paidDate: "2023-06-01",
      invoiceNumber: "INV-2023-001",
    },
    {
      id: "inv_002",
      amount: 99.99,
      status: "pending",
      dueDate: "2023-07-01",
      invoiceNumber: "INV-2023-002",
    },
  ],
  onCancelSubscription = () => {},
  onRenewSubscription = () => {},
  onUpdatePaymentMethod = () => {},
  onViewInvoice = () => {},
  isLoading = false,
}: SubscriptionDetailsProps) => {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return formatDateUtil(dateString);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" /> Active
          </Badge>
        );
      case "trial":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" /> Trial
          </Badge>
        );
      case "canceled":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <XCircle className="h-3 w-3 mr-1" /> Canceled
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" /> Expired
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" /> Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" /> Failed
          </Badge>
        );
      case "canceled":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" /> Canceled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </div>
            {getStatusBadge(status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Plan
                </h3>
                <p className="text-lg font-semibold">{planName}</p>
                <p className="text-sm text-muted-foreground">
                  {planDescription}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Billing Cycle
                </h3>
                <p className="text-lg font-semibold">
                  ${price} / {billingCycle}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Start Date
                  </h3>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p>{formatDate(startDate)}</p>
                  </div>
                </div>

                {endDate && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      End Date
                    </h3>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>{formatDate(endDate)}</p>
                    </div>
                  </div>
                )}

                {trialEndDate && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Trial Ends
                    </h3>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>{formatDate(trialEndDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Payment Method
                </h3>
                <div className="flex items-center mt-1">
                  <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                  {paymentMethod.type === "credit_card" ? (
                    <p>
                      {paymentMethod.cardType} ending in {paymentMethod.last4}{" "}
                      (expires
                      {paymentMethod.expiryDate})
                    </p>
                  ) : paymentMethod.type === "bank_transfer" ? (
                    <p>Bank Transfer</p>
                  ) : (
                    <p>PayPal</p>
                  )}
                </div>
                <Button
                  variant="link"
                  className="p-0 h-auto mt-1"
                  onClick={() => onUpdatePaymentMethod({})}
                >
                  Update payment method
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Last Payment
                  </h3>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p>{formatDate(lastPaymentDate)}</p>
                  </div>
                </div>

                {nextPaymentDate && status === "active" && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Next Payment
                    </h3>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>{formatDate(nextPaymentDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <div className="w-full flex justify-between">
            <Button 
              variant="outline" 
              onClick={onUpdatePaymentMethod}
              disabled={isLoading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Update Payment Method
            </Button>
            <div className="space-x-2">
              {status === "canceled" || status === "expired" ? (
                <Button 
                  variant="default" 
                  onClick={onRenewSubscription}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renew Subscription
                </Button>
              ) : (
                <Button 
                  variant="destructive" 
                  onClick={onCancelSubscription}
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Recent invoices and payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices && invoices.length > 0 ? (
              invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewInvoice && onViewInvoice(invoice.id)}
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-muted-foreground mr-3" />
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-medium">
                      ${invoice.amount?.toFixed(2) || "0.00"}
                    </p>
                    {getInvoiceStatusBadge(invoice.status || "")}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No invoices available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You will lose
              access to premium features at the end of your current billing
              period.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-md bg-yellow-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Important Information
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Your subscription will remain active until{" "}
                        {formatDate(nextPaymentDate)}
                      </li>
                      <li>
                        You will not be charged again after your current billing
                        period ends
                      </li>
                      <li>
                        You can reactivate your subscription at any time before
                        it expires
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onCancelSubscription();
                setIsCancelDialogOpen(false);
              }}
            >
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionDetails;
