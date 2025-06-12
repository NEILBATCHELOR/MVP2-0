import React from "react";
import { ProjectUI, IssuerDocumentType } from "@/types/core/centralModels";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  FileTextIcon, 
  FileIcon, 
  CalendarIcon, 
  MapPinIcon,
  PercentIcon,
  DollarSignIcon,
  BarChartIcon,
  ClockIcon,
  BuildingIcon,
  FileText,
  Calendar,
  ExternalLink,
  Info
} from "lucide-react";

interface OfferingDetailsDialogProps {
  offering: ProjectUI;
  open: boolean;
  onClose: () => void;
}

const OfferingDetailsDialog = ({
  offering,
  open,
  onClose,
}: OfferingDetailsDialogProps) => {
  // Format duration for display
  const formatDuration = (duration?: string) => {
    if (!duration) return "N/A";
    return duration.replace(/_/g, " ");
  };

  // Format document type for display
  const formatDocumentType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get icon based on document type
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "term_sheet":
        return <FileTextIcon className="h-5 w-5 text-primary" />;
      case "financial_highlights":
        return <BarChartIcon className="h-5 w-5 text-amber-500" />;
      case "risk_factors":
        return <FileIcon className="h-5 w-5 text-red-500" />;
      case "legal_regulatory_compliance":
        return <BuildingIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get and format the documents from the offering
  const documents = (offering as any).issuerDocuments || [];

  // Format currency
  const formatCurrency = (amount?: number): string => {
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

  // Format date with better readability and handling ISO strings
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[1100px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div>
            <DialogTitle className="text-2xl font-bold">{offering.name}</DialogTitle>
            {offering.description && (
              <DialogDescription className="text-base mt-2 mb-3 max-w-2xl">
                {offering.description}
              </DialogDescription>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 text-sm px-3 py-1">
                Open for Investment
              </Badge>
              {offering.projectType && (
                <Badge variant="outline" className="capitalize">
                  {offering.projectType}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Investment Highlights */}
          {(offering.totalNotional || offering.estimatedYieldPercentage || offering.duration || offering.minimumInvestment) && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Investment Highlights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {offering.totalNotional && (
                  <Card className="bg-slate-50">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-3xl font-bold">{formatCurrency(offering.totalNotional)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Total Notional</p>
                    </CardContent>
                  </Card>
                )}
                
                {offering.estimatedYieldPercentage && (
                  <Card className="bg-slate-50">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-3xl font-bold">{offering.estimatedYieldPercentage}%</p>
                      <p className="text-sm text-muted-foreground mt-1">Estimated Yield</p>
                    </CardContent>
                  </Card>
                )}
                
                {offering.duration && (
                  <Card className="bg-slate-50">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-3xl font-bold capitalize">{formatDuration(offering.duration)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Investment Term</p>
                    </CardContent>
                  </Card>
                )}
                
                {(offering.minimumInvestment || offering.sharePrice) && (
                  <Card className="bg-slate-50">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-3xl font-bold">{formatCurrency(offering.minimumInvestment || offering.sharePrice)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Minimum Investment</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Offering Details</h3>
              <Card>
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Info className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="font-medium">Important Information</h4>
                    </div>
                    
                    {(offering as any).jurisdiction && (
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <MapPinIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{(offering as any).jurisdiction}</p>
                        </div>
                      </div>
                    )}
                    
                    {offering.totalNotional && (
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <DollarSignIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Notional</p>
                          <p className="font-medium">{formatCurrency(offering.totalNotional)}</p>
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    {/* Key Dates Section */}
                    <div className="pt-2">
                      <h4 className="text-sm font-semibold mb-3">Key Dates</h4>
                      
                      {(offering.subscriptionStartDate || offering.subscriptionEndDate) && (
                        <div className="flex items-start gap-3 mb-3">
                          <Calendar className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Subscription Period</p>
                            <p className="text-sm text-muted-foreground">
                              {offering.subscriptionStartDate ? formatDate(offering.subscriptionStartDate) : "Not set"} 
                              {" - "} 
                              {offering.subscriptionEndDate ? formatDate(offering.subscriptionEndDate) : "Not set"}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {offering.transactionStartDate && (
                        <div className="flex items-start gap-3 mb-3">
                          <Calendar className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Transaction Start</p>
                            <p className="text-sm text-muted-foreground">{formatDate(offering.transactionStartDate)}</p>
                          </div>
                        </div>
                      )}
                      
                      {offering.maturityDate && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Maturity Date</p>
                            <p className="text-sm text-muted-foreground">{formatDate(offering.maturityDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Documents</h3>
              <Card className="max-h-[400px] overflow-y-auto">
                <CardContent className="p-5">
                  {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground font-medium">No public documents available</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Contact the issuer for more information
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-4 p-3 rounded-lg border border-muted hover:bg-muted/50 transition-colors"
                        >
                          <div className="p-2 rounded-full bg-primary/10">
                            {getDocumentIcon(doc.document_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{doc.document_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {formatDocumentType(doc.document_type)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1.5"
                            onClick={() => window.open(doc.document_url, "_blank")}
                          >
                            <span>View</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t flex flex-col sm:flex-row sm:justify-between gap-3">
          <p className="text-xs text-muted-foreground order-2 sm:order-1">
            This offering is subject to terms & conditions. Please read all documents before investing.
          </p>
          <div className="order-1 sm:order-2 space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800">Register Interest</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OfferingDetailsDialog;