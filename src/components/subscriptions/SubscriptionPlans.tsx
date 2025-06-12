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
import { Check, X } from "lucide-react";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: "monthly" | "quarterly" | "annual";
  features: PlanFeature[];
  isPopular?: boolean;
}

interface SubscriptionPlansProps {
  plans?: SubscriptionPlan[];
  currentPlanId?: string;
  onSelectPlan?: (planId: string) => void;
}

const SubscriptionPlans = ({
  plans = [
    {
      id: "basic",
      name: "Basic",
      description: "Essential features for small projects",
      price: 49.99,
      billingCycle: "monthly",
      features: [
        { name: "Up to 3 projects", included: true },
        { name: "Up to 50 investors", included: true },
        { name: "Email support", included: true },
        { name: "Basic reports", included: true },
        { name: "Waterfall modeling", included: false },
        { name: "Scenario planning", included: false },
        { name: "API access", included: false },
      ],
    },
    {
      id: "professional",
      name: "Professional",
      description: "Advanced features for growing businesses",
      price: 99.99,
      billingCycle: "monthly",
      features: [
        { name: "Up to 10 projects", included: true },
        { name: "Up to 200 investors", included: true },
        { name: "Priority support", included: true },
        { name: "Advanced reports", included: true },
        { name: "Waterfall modeling", included: true },
        { name: "Scenario planning", included: false },
        { name: "API access", included: false },
      ],
      isPopular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Comprehensive solution for large organizations",
      price: 199.99,
      billingCycle: "monthly",
      features: [
        { name: "Unlimited projects", included: true },
        { name: "Unlimited investors", included: true },
        { name: "Dedicated support", included: true },
        { name: "Custom reports", included: true },
        { name: "Waterfall modeling", included: true },
        { name: "Scenario planning", included: true },
        { name: "API access", included: true },
      ],
    },
  ],
  currentPlanId,
  onSelectPlan = () => {},
}: SubscriptionPlansProps) => {
  return (
    <div className="w-full py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">
          Subscription Plans
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Choose the right plan for your business needs. All plans include
          access to our core cap table management features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col h-full ${plan.isPopular ? "border-primary shadow-md" : ""}`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                <Badge className="bg-primary text-white">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">
                  /{plan.billingCycle}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mr-2" />
                    )}
                    <span
                      className={
                        feature.included ? "" : "text-muted-foreground"
                      }
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.isPopular ? "default" : "outline"}
                onClick={() => onSelectPlan(plan.id)}
                disabled={currentPlanId === plan.id}
              >
                {currentPlanId === plan.id ? "Current Plan" : "Select Plan"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
