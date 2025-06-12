import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Investor } from "./InvestorTypes";
import OnfidoVerificationDialog from "./OnfidoVerificationDialog";

interface ScreeningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScreen: (status: string) => Promise<void>;
  investorName: string;
  investor?: Investor;
}

const ScreeningDialog = ({
  open,
  onOpenChange,
  onScreen,
  investorName,
  investor,
}: ScreeningDialogProps) => {
  const [selectedStatus, setSelectedStatus] = React.useState<string>("pending");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [screeningMethod, setScreeningMethod] = React.useState<
    "manual" | "automated"
  >("manual");
  const [showOnfidoDialog, setShowOnfidoDialog] = React.useState(false);

  const handleScreen = async () => {
    try {
      setIsProcessing(true);
      await onScreen(selectedStatus);
      onOpenChange(false);
    } catch (error) {
      // Error will be handled by the parent component
      console.error("Error in handleScreen:", error);
      // Don't close the dialog on error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutomatedScreen = () => {
    setShowOnfidoDialog(true);
    onOpenChange(false);
  };

  const handleVerificationComplete = async (status: string) => {
    // This will be called when the Onfido verification is complete
    await onScreen(status);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Screen Investor: {investorName}</DialogTitle>
            <DialogDescription>
              Choose a screening method to verify this investor.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="manual"
            value={screeningMethod}
            onValueChange={(value) =>
              setScreeningMethod(value as "manual" | "automated")
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Screening</TabsTrigger>
              <TabsTrigger value="automated">Automated KYC/KYB</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>KYC Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Manually update the KYC status for this investor.
              </p>
            </TabsContent>

            <TabsContent value="automated" className="space-y-4 py-4">
              <div className="space-y-4">
                <p>
                  Use Onfido's automated KYC/KYB verification service to verify
                  this investor's identity.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Verify identity documents</li>
                  <li>Perform facial recognition</li>
                  <li>Check against global watchlists</li>
                  <li>Verify business information (for business investors)</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  This will launch the Onfido verification flow where the
                  investor can submit their documents.
                </p>
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
            {screeningMethod === "manual" ? (
              <Button onClick={handleScreen} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Update Status"}
              </Button>
            ) : (
              <Button onClick={handleAutomatedScreen}>
                Start Verification
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {investor && (
        <OnfidoVerificationDialog
          open={showOnfidoDialog}
          onOpenChange={setShowOnfidoDialog}
          investor={investor}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </>
  );
};

export default ScreeningDialog;
