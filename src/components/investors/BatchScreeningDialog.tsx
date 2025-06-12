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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  UserCheck,
  Building,
  FileText,
} from "lucide-react";
import OnfidoVerificationDialog from "./OnfidoVerificationDialog";

interface BatchScreeningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvestors: any[];
  onScreeningComplete: () => void;
}

const BatchScreeningDialog = ({
  open,
  onOpenChange,
  selectedInvestors,
  onScreeningComplete,
}: BatchScreeningDialogProps) => {
  const [activeTab, setActiveTab] = useState("manual");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState("approved");
  const [expiryDate, setExpiryDate] = useState("");
  const [isOnfidoDialogOpen, setIsOnfidoDialogOpen] = useState(false);
  const [currentInvestor, setCurrentInvestor] = useState<any>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const { toast } = useToast();

  // Set default expiry date to 1 year from now
  useEffect(() => {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    setExpiryDate(oneYearFromNow.toISOString().split("T")[0]);
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setIsProcessing(false);
      setProgress(0);
      setProcessedCount(0);
      setSelectedStatus("approved");
      setActiveTab("manual");
    }
  }, [open]);

  // Handle manual screening
  const handleManualScreening = async () => {
    if (selectedInvestors.length === 0) return;

    try {
      setIsProcessing(true);
      setProgress(0);
      setProcessedCount(0);

      const batchSize = 5; // Process 5 investors at a time
      const totalBatches = Math.ceil(selectedInvestors.length / batchSize);
      
      console.log("Starting manual screening process for", selectedInvestors.length, "investors");
      console.log("Selected status:", selectedStatus);
      console.log("Expiry date:", selectedStatus === "approved" ? expiryDate : "N/A");

      let successCount = 0;
      let errorCount = 0;

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, selectedInvestors.length);
        const batch = selectedInvestors.slice(start, end);
        
        // Get investor IDs ensuring we use the correct ID field
        const batchIds = batch.map(investor => {
          const id = investor.investor_id || investor.id;
          console.log("Processing investor:", id, investor.name);
          return id;
        });

        // Prepare verification details based on status
        const verificationDetails = selectedStatus === "approved" 
          ? {
              method: "manual",
              notes: verificationNotes,
              verified_at: new Date().toISOString(),
            }
          : selectedStatus === "failed"
            ? {
                method: "manual",
                notes: verificationNotes,
                failed_at: new Date().toISOString(),
              }
            : {
                method: "manual",
                notes: verificationNotes,
                updated_at: new Date().toISOString(),
              };

        console.log("Updating investors with IDs:", batchIds);
        
        // Update KYC status for this batch
        const { data, error } = await supabase
          .from("investors")
          .update({
            kyc_status: selectedStatus as "pending" | "approved" | "failed" | "not_started" | "expired",
            kyc_expiry_date: selectedStatus === "approved" ? expiryDate : null,
            verification_details: verificationDetails,
            updated_at: new Date().toISOString(),
          })
          .in("investor_id", batchIds);

        if (error) {
          console.error("Error updating investors:", error);
          errorCount += batch.length;
          
          // Try updating each investor individually if batch update fails
          for (const investor of batch) {
            const id = investor.investor_id || investor.id;
            const { error: individualError } = await supabase
              .from("investors")
              .update({
                kyc_status: selectedStatus as "pending" | "approved" | "failed" | "not_started" | "expired",
                kyc_expiry_date: selectedStatus === "approved" ? expiryDate : null,
                verification_details: verificationDetails,
                updated_at: new Date().toISOString(),
              })
              .eq("investor_id", id);
              
            if (!individualError) {
              successCount++;
              errorCount--;
              console.log("Successfully updated individual investor:", id);
            } else {
              console.error("Error updating individual investor:", id, individualError);
            }
          }
        } else {
          console.log("Successfully updated batch of investors:", batchIds);
          successCount += batch.length;
        }

        // Update progress
        setProcessedCount((prev) => prev + batch.length);
        setProgress(((batchIndex + 1) / totalBatches) * 100);

        // Add a small delay to avoid overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Show success message with details
      toast({
        title: "Screening Complete",
        description: `Successfully updated KYC status for ${successCount} investor(s)${
          errorCount > 0 ? `, failed for ${errorCount} investor(s)` : ''
        }`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

      // Call the onScreeningComplete callback
      onScreeningComplete();
      onOpenChange(false);
    } catch (err) {
      console.error("Error during batch screening:", err);
      toast({
        title: "Error",
        description: "Failed to complete screening process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle automated screening with Onfido
  const handleAutomatedScreening = () => {
    // Start with the first investor
    if (selectedInvestors.length > 0) {
      setCurrentInvestor(selectedInvestors[0]);
      setIsOnfidoDialogOpen(true);
    }
  };

  // Handle completion of Onfido verification for one investor
  const handleOnfidoComplete = async (
    investorId: string,
    status: string,
    details: any,
  ) => {
    try {
      // Update the investor's KYC status
      const { error } = await supabase
        .from("investors")
        .update({
          kyc_status: status as "pending" | "approved" | "failed" | "not_started" | "expired",
          kyc_expiry_date: status === "approved" ? expiryDate : null,
          verification_details: details,
          updated_at: new Date().toISOString(),
        })
        .eq("investor_id", investorId);

      if (error) throw error;

      // Update progress
      setProcessedCount((prev) => prev + 1);
      setProgress(((processedCount + 1) / selectedInvestors.length) * 100);

      // Move to the next investor or finish
      const currentIndex = selectedInvestors.findIndex(
        (inv) => (inv.id || inv.investor_id) === investorId,
      );

      if (currentIndex < selectedInvestors.length - 1) {
        setCurrentInvestor(selectedInvestors[currentIndex + 1]);
      } else {
        // All investors processed
        setIsOnfidoDialogOpen(false);
        toast({
          title: "Screening Complete",
          description: `Successfully completed KYC verification for ${selectedInvestors.length} investor(s)`,
        });
        onScreeningComplete();
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Error updating investor after Onfido verification:", err);
      toast({
        title: "Error",
        description: "Failed to update investor status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get KYC status badge
  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "not_started":
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
      case "expired":
        return <Badge className="bg-orange-100 text-orange-800">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>Batch KYC/AML Screening</span>
            </DialogTitle>
            <DialogDescription>
              Process KYC/AML verification for multiple investors at once
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Manual Screening</span>
              </TabsTrigger>
              <TabsTrigger
                value="automated"
                className="flex items-center gap-2"
              >
                <Building className="h-4 w-4" />
                <span>Automated KYC/KYB</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="bg-muted/20 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">
                    Selected Investors ({selectedInvestors.length})
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {selectedInvestors.map((investor) => (
                      <div
                        key={investor.id || investor.investor_id}
                        className="flex justify-between items-center p-2 bg-white rounded-md border"
                      >
                        <div>
                          <p className="font-medium">{investor.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {investor.email}
                          </p>
                        </div>
                        <div>
                          {getKycStatusBadge(
                            investor.kyc_status || "not_started",
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="kyc-status">KYC Status</Label>
                    <select
                      id="kyc-status"
                      className="w-full p-2 rounded-md border border-input bg-background"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      disabled={isProcessing}
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="not_started">Not Started</option>
                    </select>
                  </div>

                  {selectedStatus === "approved" && (
                    <div className="space-y-2">
                      <Label htmlFor="expiry-date">KYC Expiry Date</Label>
                      <input
                        id="expiry-date"
                        type="date"
                        className="w-full p-2 rounded-md border border-input bg-background"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="verification-notes">
                      Verification Notes
                    </Label>
                    <textarea
                      id="verification-notes"
                      className="w-full p-2 rounded-md border border-input bg-background min-h-[80px]"
                      placeholder="Enter any notes about the verification process"
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>
                        {processedCount} of {selectedInvestors.length} investors
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="automated" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="bg-muted/20 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">
                    Selected Investors ({selectedInvestors.length})
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {selectedInvestors.map((investor) => (
                      <div
                        key={investor.id || investor.investor_id}
                        className="flex justify-between items-center p-2 bg-white rounded-md border"
                      >
                        <div>
                          <p className="font-medium">{investor.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {investor.email}
                          </p>
                        </div>
                        <div>
                          {getKycStatusBadge(
                            investor.kyc_status || "not_started",
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-800">
                        Automated KYC/KYB Verification
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        This will initiate identity verification for individuals
                        or business verification for companies using Onfido.
                        Each investor will need to provide identification
                        documents and complete a biometric check.
                      </p>
                    </div>
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>
                        {processedCount} of {selectedInvestors.length} investors
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            {activeTab === "manual" ? (
              <Button
                onClick={handleManualScreening}
                disabled={isProcessing || selectedInvestors.length === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Process {selectedInvestors.length} Investor(s)
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleAutomatedScreening}
                disabled={isProcessing || selectedInvestors.length === 0}
              >
                <Building className="mr-2 h-4 w-4" />
                Start KYC/KYB Verification
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onfido Verification Dialog */}
      {currentInvestor && (
        <OnfidoVerificationDialog
          open={isOnfidoDialogOpen}
          onOpenChange={setIsOnfidoDialogOpen}
          investor={currentInvestor}
          onComplete={handleOnfidoComplete}
        />
      )}
    </>
  );
};

export default BatchScreeningDialog;
