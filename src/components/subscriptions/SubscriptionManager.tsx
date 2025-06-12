import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, CreditCard, Package } from "lucide-react";
import SubscriptionPlans from "./SubscriptionPlans";
import SubscriptionDetails from "./SubscriptionDetails";
import { useToast } from "@/components/ui/use-toast";
import { SubscriptionUI } from "@/types/core/centralModels";

// Define a local Invoice type that matches the SubscriptionDetails component's expectations
interface LocalInvoice {
  id: string;
  amount: number;
  status: "paid" | "pending" | "failed" | "canceled";
  dueDate: string;
  paidDate?: string;
  invoiceNumber: string;
}

interface SubscriptionManagerProps {
  onBack?: () => void;
  currentSubscription?: SubscriptionUI | null;
  onSubscribe?: (planId: string) => void;
  onCancelSubscription?: () => void;
  onRenewSubscription?: () => void;
  onUpdatePaymentMethod?: (data: any) => void;
}

const SubscriptionManager = ({
  onBack = () => {},
  currentSubscription = null,
  onSubscribe = () => {},
  onCancelSubscription = () => {},
  onRenewSubscription = () => {},
  onUpdatePaymentMethod = (data: any) => {},
}: SubscriptionManagerProps) => {
  const [activeTab, setActiveTab] = useState(
    currentSubscription ? "details" : "plans",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] =
    useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { toast } = useToast();

  // Mock invoices since they're not part of the SubscriptionUI type
  const getMockInvoices = (subscription: SubscriptionUI | null): LocalInvoice[] => {
    if (!subscription) return [];
    
    // Generate mock invoices based on subscription data
    return [
      {
        id: `inv-${subscription.id}-1`,
        amount: subscription.price,
        status: "paid",
        dueDate: new Date(subscription.startDate).toISOString(),
        paidDate: new Date(subscription.startDate).toISOString(),
        invoiceNumber: `INV-${subscription.id}-001`
      }
    ];
  };
  
  // Map the billing cycle to match what SubscriptionDetails expects
  const mapBillingCycle = (cycle?: string): "monthly" | "quarterly" | "annual" => {
    if (!cycle) return "monthly";
    
    switch(cycle) {
      case "yearly": return "annual";
      case "monthly": return "monthly";
      case "one-time": return "monthly"; // Default to monthly for one-time
      default: return "monthly";
    }
  };
  
  // Map payment method type to match what SubscriptionDetails expects
  const mapPaymentMethodType = (
    type?: "credit_card" | "bank_transfer" | "crypto"
  ): "credit_card" | "bank_transfer" | "paypal" => {
    if (!type) return "credit_card";
    
    switch(type) {
      case "credit_card": return "credit_card";
      case "bank_transfer": return "bank_transfer";
      case "crypto": return "paypal"; // Map crypto to paypal as a fallback
      default: return "credit_card";
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setIsLoading(true);
      // Call the subscription service to create a new subscription
      // This is a placeholder for the actual implementation
      console.log(`Subscribing to plan ${planId}`);

      // Simulate a successful subscription
      setTimeout(() => {
        if (onSubscribe) {
          onSubscribe(planId);
        }
        toast({
          title: "Success",
          description: "Subscription created successfully",
        });
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      // Call the subscription service to cancel the subscription
      // This is a placeholder for the actual implementation
      console.log("Cancelling subscription");

      // Simulate a successful cancellation
      setTimeout(() => {
        if (onCancelSubscription) {
          onCancelSubscription();
        }
        toast({
          title: "Success",
          description: "Subscription cancelled successfully",
        });
        setIsLoading(false);
        setIsCancelDialogOpen(false);
      }, 1500);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      setIsCancelDialogOpen(false);
    }
  };

  const handleRenewSubscription = async () => {
    try {
      setIsLoading(true);
      // Call the subscription service to renew the subscription
      // This is a placeholder for the actual implementation
      console.log("Renewing subscription");

      // Simulate a successful renewal
      setTimeout(() => {
        if (onRenewSubscription) {
          onRenewSubscription();
        }
        toast({
          title: "Success",
          description: "Subscription renewed successfully",
        });
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error renewing subscription:", error);
      toast({
        title: "Error",
        description: "Failed to renew subscription. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async (data: any) => {
    try {
      setIsLoading(true);
      // Call the subscription service to update the payment method
      // This is a placeholder for the actual implementation
      console.log("Updating payment method", data);

      // Simulate a successful update
      setTimeout(() => {
        if (onUpdatePaymentMethod) {
          onUpdatePaymentMethod(data);
        }
        toast({
          title: "Success",
          description: "Payment method updated successfully",
        });
        setIsLoading(false);
        setIsPaymentMethodDialogOpen(false);
      }, 1500);
    } catch (error) {
      console.error("Error updating payment method:", error);
      toast({
        title: "Error",
        description: "Failed to update payment method. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Subscription Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription plans and billing details
          </p>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Subscription Plans</span>
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="flex items-center gap-2"
              disabled={!currentSubscription}
            >
              <CreditCard className="h-4 w-4" />
              <span>Subscription Details</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="plans" className="mt-0">
          <SubscriptionPlans
            currentPlanId={currentSubscription?.planId}
            onSelectPlan={handleSubscribe}
          />
        </TabsContent>

        <TabsContent value="details" className="mt-0">
          {currentSubscription ? (
            <SubscriptionDetails
              subscriptionId={currentSubscription.id}
              planName={currentSubscription.planName || ""}
              planDescription={currentSubscription.projectName || ""}
              status={currentSubscription.status as "active" | "canceled" | "expired" | "trial"}
              startDate={currentSubscription.startDate}
              endDate={currentSubscription.endDate}
              billingCycle={mapBillingCycle(currentSubscription.billingCycle)}
              price={currentSubscription.price || 0}
              nextPaymentDate={currentSubscription.endDate}
              lastPaymentDate={currentSubscription.startDate}
              paymentMethod={currentSubscription.paymentMethod ? {
                ...currentSubscription.paymentMethod,
                type: mapPaymentMethodType(currentSubscription.paymentMethod.type)
              } : undefined}
              invoices={getMockInvoices(currentSubscription)}
              onCancelSubscription={() => setIsCancelDialogOpen(true)}
              onRenewSubscription={handleRenewSubscription}
              onUpdatePaymentMethod={() => setIsPaymentMethodDialogOpen(true)}
              onViewInvoice={(invoiceId) => console.log("View invoice:", invoiceId)}
              isLoading={isLoading}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-lg text-center mb-4">
                  You don't have an active subscription.
                </p>
                <Button onClick={() => setActiveTab("plans")}>
                  View Plans
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Method Dialog would go here */}
      {/* Subscription Cancellation Dialog would go here */}
    </div>
  );
};

export default SubscriptionManager;
