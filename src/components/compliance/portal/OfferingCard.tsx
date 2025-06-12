import React, { useState } from "react";
import { ProjectUI } from "@/types/core/centralModels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import OfferingDetailsDialog from "./OfferingDetailsDialog";

interface OfferingCardProps {
  offering: ProjectUI;
}

const OfferingCard = ({ offering }: OfferingCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  // Format duration for display
  const formatDuration = (duration?: string) => {
    if (!duration) return "N/A";
    return duration.replace(/_/g, " ");
  };

  // Determine the location based on jurisdiction if available
  const getLocation = (offering: ProjectUI) => {
    return (offering as any).jurisdiction || "Multiple Locations";
  };

  // Format currency
  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return "N/A";
    const currencySymbol = getCurrencySymbol(offering.currency || "USD");
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

  // Helper for currency symbols
  const getCurrencySymbol = (currencyCode: string): string => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      AUD: "A$",
      CAD: "C$",
      CHF: "Fr",
      CNY: "¥",
      INR: "₹",
      // Add more as needed
    };
    return symbols[currencyCode] || currencyCode;
  };

  return (
    <>
      <Card className="overflow-hidden flex flex-col h-full">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-xl font-bold">{offering.name}</h3>
              <div className="flex space-x-2">
                <Badge variant="outline" className="capitalize">
                  {offering.projectType || "N/A"}
                </Badge>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                  Open
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow pb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type:</p>
                <p className="font-medium capitalize">{offering.projectType || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Notional:</p>
                <p className="font-medium">
                  {offering.totalNotional 
                    ? formatCurrency(offering.totalNotional)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location:</p>
                <p className="font-medium">{getLocation(offering)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Min Investment:</p>
                <p className="font-medium">
                  {formatCurrency(offering.minimumInvestment || offering.sharePrice || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Return:</p>
                <p className="font-medium">
                  {offering.estimatedYieldPercentage
                    ? `${offering.estimatedYieldPercentage}%`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Term:</p>
                <p className="font-medium capitalize">{formatDuration(offering.duration)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscription Period:</p>
                <p className="font-medium">
                  {offering.subscriptionStartDate 
                    ? new Date(offering.subscriptionStartDate).toLocaleDateString() 
                    : "Open"} - {offering.subscriptionEndDate 
                    ? new Date(offering.subscriptionEndDate).toLocaleDateString()
                    : "Ongoing"}
                </p>
              </div>
            </div>

            <p className="text-sm mt-4 line-clamp-3">
              {offering.description || "No description available."}
            </p>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            className="w-full"
            onClick={() => setShowDetails(true)}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>

      {showDetails && (
        <OfferingDetailsDialog
          offering={offering}
          open={showDetails}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
};

export default OfferingCard;