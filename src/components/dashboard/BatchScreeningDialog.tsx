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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Upload,
  FileText,
} from "lucide-react";

// Define the Investor interface that was previously imported from InvestorGrid
export interface Investor {
  id: string;
  name: string;
  email: string;
  company?: string;
  kycStatus: 'approved' | 'pending' | 'failed' | 'not_started' | 'expired';
  walletAddress?: string;
}

interface BatchScreeningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investors: Investor[];
  onScreen: (investorIds: string[], status: string) => Promise<void>;
}

const statusConfig = {
  approved: {
    icon: CheckCircle2,
    label: "Approved",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    iconColor: "text-green-500",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
    iconColor: "text-yellow-500",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    iconColor: "text-red-500",
  },
  not_started: {
    icon: AlertCircle,
    label: "Not Started",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    iconColor: "text-gray-500",
  },
};

const BatchScreeningDialog = ({
  open,
  onOpenChange,
  investors,
  onScreen,
}: BatchScreeningDialogProps) => {
  const [selectedInvestorIds, setSelectedInvestorIds] = React.useState<
    Set<string>
  >(new Set());
  const [selectedStatus, setSelectedStatus] = React.useState<string>("pending");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [processedCount, setProcessedCount] = React.useState(0);
  const [totalToProcess, setTotalToProcess] = React.useState(0);
  const [screeningMethod, setScreeningMethod] = React.useState<
    "manual" | "automated"
  >("manual");
  const [csvFile, setCsvFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (open) {
      // Pre-select all investors that need screening
      const needsScreeningIds = new Set(
        investors
          .filter(
            (i) =>
              i.kycStatus === "not_started" ||
              i.kycStatus === "failed" ||
              i.kycStatus === "expired",
          )
          .map((i) => i.id),
      );
      setSelectedInvestorIds(needsScreeningIds);
    } else {
      // Reset state when dialog closes
      setIsProcessing(false);
      setProgress(0);
      setProcessedCount(0);
      setTotalToProcess(0);
    }
  }, [open, investors]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvestorIds(new Set(investors.map((i) => i.id)));
    } else {
      setSelectedInvestorIds(new Set());
    }
  };

  const handleToggleInvestor = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedInvestorIds);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedInvestorIds(newSelection);
  };

  const handleScreen = async () => {
    const selectedIds = Array.from(selectedInvestorIds);
    if (selectedIds.length === 0) return;

    setIsProcessing(true);
    setTotalToProcess(selectedIds.length);
    setProcessedCount(0);
    setProgress(0);

    // Simulate processing with progress updates
    const batchSize = 5; // Process in batches of 5
    const batches = Math.ceil(selectedIds.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, selectedIds.length);
      const batchIds = selectedIds.slice(start, end);

      // Process this batch
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      // Update progress
      setProcessedCount((prev) => prev + batchIds.length);
      setProgress(
        Math.round((((i + 1) * batchSize) / selectedIds.length) * 100),
      );
    }

    try {
      // Complete the screening process
      await onScreen(selectedIds, selectedStatus);
      onOpenChange(false);
    } catch (error) {
      // Error will be handled by the parent component
      console.error("Error in batch screening:", error);
      // Don't close the dialog on error
    } finally {
      setIsProcessing(false);
    }
  };

  const StatusIcon =
    statusConfig[selectedStatus as keyof typeof statusConfig].icon;
  const statusInfo = statusConfig[selectedStatus as keyof typeof statusConfig];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Batch KYC/AML Screening</DialogTitle>
          <DialogDescription>
            Screen multiple investors at once for KYC/AML compliance.
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

          <TabsContent value="manual">
            {!isProcessing ? (
              <>
                <div className="py-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={
                          selectedInvestorIds.size === investors.length &&
                          investors.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="select-all">Select All</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Set status to:
                      </span>
                      <div className="flex gap-2">
                        {Object.entries(statusConfig).map(
                          ([status, config]) => {
                            const Icon = config.icon;
                            return (
                              <Badge
                                key={status}
                                variant="outline"
                                className={`cursor-pointer flex items-center gap-1 ${selectedStatus === status ? `${config.bgColor} ${config.textColor} border-2 ${config.borderColor}` : ""}`}
                                onClick={() => setSelectedStatus(status)}
                              >
                                <Icon
                                  className={`h-3.5 w-3.5 ${config.iconColor}`}
                                />
                                {config.label}
                              </Badge>
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="h-[300px] border rounded-md p-2">
                    <div className="space-y-2">
                      {investors.map((investor) => {
                        const needsScreening =
                          investor.kycStatus === "not_started" ||
                          investor.kycStatus === "failed" ||
                          investor.kycStatus === "expired";
                        const investorStatusInfo =
                          statusConfig[
                            investor.kycStatus as keyof typeof statusConfig
                          ] || statusConfig.not_started;
                        const InvestorStatusIcon = investorStatusInfo.icon;

                        return (
                          <div
                            key={investor.id}
                            className={`flex items-center justify-between p-2 rounded-md ${needsScreening ? "bg-amber-50" : ""}`}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={investor.id}
                                checked={selectedInvestorIds.has(investor.id)}
                                onCheckedChange={(checked) =>
                                  handleToggleInvestor(
                                    investor.id,
                                    checked as boolean,
                                  )
                                }
                              />
                              <Label
                                htmlFor={investor.id}
                                className="flex items-center gap-2"
                              >
                                <span className="font-medium">
                                  {investor.name}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {investor.email}
                                </span>
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`${investorStatusInfo.bgColor} ${investorStatusInfo.textColor} border ${investorStatusInfo.borderColor}`}
                              >
                                <InvestorStatusIcon
                                  className={`h-3.5 w-3.5 mr-1 ${investorStatusInfo.iconColor}`}
                                />
                                {investorStatusInfo.label}
                              </Badge>
                              {needsScreening && (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-700 border-amber-200"
                                >
                                  Needs Screening
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700"
                    >
                      {selectedInvestorIds.size} investors selected
                    </Badge>
                    <Badge
                      className={`${statusInfo.bgColor} ${statusInfo.textColor} border ${statusInfo.borderColor} flex items-center gap-1`}
                    >
                      <StatusIcon
                        className={`h-3.5 w-3.5 ${statusInfo.iconColor}`}
                      />
                      Will be set to: {statusInfo.label}
                    </Badge>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-6 space-y-6">
                <div className="text-center">
                  <Badge
                    className={`${statusInfo.bgColor} ${statusInfo.textColor} border ${statusInfo.borderColor} flex items-center gap-1 mx-auto mb-4 px-3 py-1.5`}
                  >
                    <StatusIcon className={`h-4 w-4 ${statusInfo.iconColor}`} />
                    Setting status to: {statusInfo.label}
                  </Badge>
                  <h3 className="text-lg font-medium mb-1">
                    Processing KYC/AML Screening
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Screening {totalToProcess} investors. Please wait...
                  </p>
                </div>

                <Progress value={progress} className="h-2 w-full" />

                <div className="text-center">
                  <p className="text-sm font-medium">
                    {processedCount} of {totalToProcess} investors processed
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="automated" className="space-y-4 py-4">
            <div className="space-y-4">
              <p>
                Use Onfido's automated KYC/KYB verification service to verify
                multiple investors at once.
              </p>

              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50">
                <div className="flex flex-col items-center gap-4">
                  <Upload className="h-10 w-10 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">
                      Upload a CSV file with investor information
                      <label className="mx-1 text-primary hover:underline cursor-pointer">
                        browse
                        <input
                          type="file"
                          className="hidden"
                          accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setCsvFile(file);
                          }}
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      CSV should include first name, last name, email, and
                      investor type
                    </p>
                  </div>
                </div>

                {csvFile && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>{csvFile.name}</span>
                    <Badge variant="outline">Ready to upload</Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">What happens next?</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>
                    Investors will receive an email with a link to complete
                    their verification
                  </li>
                  <li>
                    They will need to provide identity documents and complete
                    facial recognition
                  </li>
                  <li>
                    Results will be automatically updated in your dashboard
                  </li>
                  <li>You can track progress in real-time</li>
                </ul>
              </div>
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
            <Button
              onClick={handleScreen}
              disabled={selectedInvestorIds.size === 0 || isProcessing}
            >
              {isProcessing ? "Processing..." : "Screen Investors"}
            </Button>
          ) : (
            <Button
              onClick={() =>
                alert(
                  "This would initiate the batch Onfido verification process",
                )
              }
              disabled={!csvFile}
            >
              Start Batch Verification
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchScreeningDialog;
