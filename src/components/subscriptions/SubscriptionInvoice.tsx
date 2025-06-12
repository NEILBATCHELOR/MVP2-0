import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, CreditCard, CheckCircle } from "lucide-react";

interface SubscriptionInvoiceProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  invoice?: {
    id: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    amount: number;
    status: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    billingDetails: {
      name: string;
      address: string;
      email: string;
    };
    paymentMethod: {
      type: string;
      last4?: string;
      expiryDate?: string;
    };
  };
  onDownload?: () => void;
  onPrint?: () => void;
  invoiceId?: string;
  onPaymentProcessed?: () => void;
  onError?: (message: string) => void;
}

import { useEffect, useState } from "react";
import { getInvoice, processPayment } from "@/infrastructure/subscriptions";

const SubscriptionInvoice = ({
  open = false,
  onOpenChange = () => {},
  invoice = {
    id: "inv_123456",
    invoiceNumber: "INV-2023-001",
    date: "2023-06-01",
    dueDate: "2023-06-01",
    amount: 99.99,
    status: "paid",
    items: [
      {
        description: "Professional Plan - Monthly Subscription",
        quantity: 1,
        unitPrice: 99.99,
        total: 99.99,
      },
    ],
    subtotal: 99.99,
    tax: 0,
    total: 99.99,
    billingDetails: {
      name: "John Doe",
      address: "123 Main St, New York, NY 10001, USA",
      email: "john.doe@example.com",
    },
    paymentMethod: {
      type: "credit_card",
      last4: "4242",
      expiryDate: "06/25",
    },
  },
  onDownload = () => {},
  onPrint = () => {},
  invoiceId,
  onPaymentProcessed = () => {},
  onError = (message: string) => {},
}: SubscriptionInvoiceProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // If invoiceId is provided, fetch the invoice data
  useEffect(() => {
    if (invoiceId) {
      const fetchInvoice = async () => {
        try {
          setIsLoading(true);
          const invoiceData = await getInvoice(invoiceId);
          // Update the invoice state with the fetched data
          // This would be implemented in a real application
          setIsLoading(false);
        } catch (err) {
          console.error("Error fetching invoice:", err);
          onError("Failed to load invoice details");
          setIsLoading(false);
        }
      };

      fetchInvoice();
    }
  }, [invoiceId, onError]);

  // Process payment for this invoice
  const handleProcessPayment = async () => {
    if (!invoiceId) return;

    try {
      setIsLoading(true);

      // Mock payment method for demo
      const paymentMethod = {
        amount: invoice.total,
        paymentMethod: "credit_card",
        paymentDate: new Date().toISOString(),
        transactionId: "tx_" + Math.random().toString(36).substring(2, 15),
        notes: "Payment processed via credit card ending in 4242",
      };

      await processPayment(invoiceId, paymentMethod);
      onPaymentProcessed();
    } catch (err) {
      console.error("Error processing payment:", err);
      onError("Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-white">
        <DialogHeader>
          <DialogTitle>Invoice #{invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Issued on {formatDate(invoice.date)}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-white rounded-md">
          <div className="flex justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary">Chain Capital</h2>
              <p className="text-sm text-muted-foreground">
                123 Business Ave, Suite 100
                <br />
                San Francisco, CA 94107
                <br />
                United States
                <br />
                support@chaincapital.com
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold">Invoice</h3>
              <p className="text-sm text-muted-foreground">
                Invoice #: {invoice.invoiceNumber}
                <br />
                Date: {formatDate(invoice.date)}
                <br />
                Due Date: {formatDate(invoice.dueDate)}
                <br />
                Status:{" "}
                <span
                  className={`font-medium ${invoice.status === "paid" ? "text-green-600" : invoice.status === "pending" ? "text-yellow-600" : "text-red-600"}`}
                >
                  {invoice.status.charAt(0).toUpperCase() +
                    invoice.status.slice(1)}
                </span>
              </p>
            </div>
          </div>

          <div className="border-t border-b py-4">
            <h3 className="font-semibold mb-2">Bill To:</h3>
            <p className="text-sm">
              {invoice.billingDetails.name}
              <br />
              {invoice.billingDetails.address}
              <br />
              {invoice.billingDetails.email}
            </p>
          </div>

          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Description</th>
                  <th className="text-center py-2">Quantity</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.description}</td>
                    <td className="text-center py-2">{item.quantity}</td>
                    <td className="text-right py-2">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="text-right py-2">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}></td>
                  <td className="text-right py-2 font-medium">Subtotal</td>
                  <td className="text-right py-2">
                    {formatCurrency(invoice.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}></td>
                  <td className="text-right py-2 font-medium">Tax</td>
                  <td className="text-right py-2">
                    {formatCurrency(invoice.tax)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td colSpan={2}></td>
                  <td className="text-right py-2 font-bold">Total</td>
                  <td className="text-right py-2 font-bold">
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Payment Information:</h3>
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
              <p className="text-sm">
                {invoice.paymentMethod.type === "credit_card" ? (
                  <span>
                    Credit Card ending in {invoice.paymentMethod.last4} (expires{" "}
                    {invoice.paymentMethod.expiryDate})
                  </span>
                ) : invoice.paymentMethod.type === "bank_transfer" ? (
                  <span>Bank Transfer</span>
                ) : (
                  <span>PayPal</span>
                )}
              </p>
            </div>
            {invoice.status === "paid" && (
              <div className="flex items-center mt-2 text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                <p className="text-sm">
                  Payment received on {formatDate(invoice.date)}
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-4 text-sm text-muted-foreground">
            <p>Thank you for your business!</p>
            <p className="mt-1">
              If you have any questions about this invoice, please contact our
              billing department at billing@chaincapital.com.
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={onPrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
          <Button onClick={onDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionInvoice;
