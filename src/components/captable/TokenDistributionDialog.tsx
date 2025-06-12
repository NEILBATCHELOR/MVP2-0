import React, { useState } from "react";
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
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils";
import { 
  getTokenTypeTheme, 
  formatNumber, 
  formatTokenType, 
  generateUUID 
} from "@/utils/shared/tokenThemeUtils";

interface TokenDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocations: {
    id: string;
    investorName: string;
    investorEmail: string;
    walletAddress: string | null;
    tokenType: string;
    tokenAmount: number;
    tokenSymbol?: string;
  }[];
  onDistribute: (allocationIds: string[]) => void;
}

const TokenDistributionDialog = ({
  open,
  onOpenChange,
  allocations,
  onDistribute,
}: TokenDistributionDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [distributionStep, setDistributionStep] = useState<
    "review" | "confirm" | "processing" | "complete"
  >("review");
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setDistributionStep("review");
      setIsProcessing(false);
      setConfirmChecked(false);
    }
  }, [open]);

  // Check if any allocations are missing wallet addresses
  const missingWalletAddresses = allocations.filter(
    (allocation) => !allocation.walletAddress,
  );

  // Handle distribute tokens
  const handleDistributeTokens = async () => {
    try {
      setIsProcessing(true);
      setDistributionStep("processing");

      // Simulate distribution process with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call the onDistribute callback
      await onDistribute(allocations.map(a => a.id));

      // Set distribution as complete
      setDistributionStep("complete");
    } catch (error) {
      console.error("Error distributing tokens:", error);
      // Reset to review step on error
      setDistributionStep("review");
    } finally {
      setIsProcessing(false);
    }
  };

  // Group allocations by token type
  const allocationsByTokenType = allocations.reduce(
    (acc, allocation) => {
      const { tokenType } = allocation;
      if (!acc[tokenType]) {
        acc[tokenType] = [];
      }
      acc[tokenType].push(allocation);
      return acc;
    },
    {} as Record<string, typeof allocations>,
  );

  // Calculate total tokens by type
  const tokenTotals = Object.entries(allocationsByTokenType).map(
    ([tokenType, allocations]) => ({
      tokenType,
      total: allocations.reduce((sum, a) => sum + a.tokenAmount, 0),
      count: allocations.length,
    }),
  );

  // Render content based on current step
  const renderContent = () => {
    switch (distributionStep) {
      case "review":
        return (
          <div className="space-y-4">
            {missingWalletAddresses.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {missingWalletAddresses.length} allocation(s) are missing
                  wallet addresses. Please update investor details before
                  distributing.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Distribution Summary</h3>
              <div className="rounded-md border p-4 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Allocations
                  </p>
                  <p className="text-lg font-medium">{allocations.length}</p>
                </div>
                <div className="space-y-2">
                  {tokenTotals.map((tokenTotal) => (
                    <div
                      key={tokenTotal.tokenType}
                      className="flex justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {tokenTotal.tokenType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tokenTotal.count} allocation(s)
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatNumber(tokenTotal.total)} tokens
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <h3 className="text-sm font-medium">Allocations to Distribute</h3>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">Investor</th>
                      <th className="text-left p-2">Token Type</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-left p-2">Wallet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((allocation) => {
                      // Extract styling information based on token type
                      const tokenType = allocation.tokenType;
                      const isFactoring = tokenType.toUpperCase().includes('FACTORING');
                      const isNFT = tokenType.toLowerCase().includes('nft');
                      
                      // Choose colors based on token type
                      const badgeBg = isFactoring ? "bg-blue-100" : 
                                     isNFT ? "bg-purple-100" : 
                                     tokenType.includes("ERC20") || tokenType.includes("ERC-20") ? "bg-blue-100" :
                                     tokenType.includes("ERC721") || tokenType.includes("ERC-721") ? "bg-purple-100" :
                                     tokenType.includes("ERC1155") || tokenType.includes("ERC-1155") ? "bg-amber-100" :
                                     "bg-gray-100";
                                       
                      const badgeText = isFactoring ? "text-blue-800" : 
                                       isNFT ? "text-purple-800" : 
                                       tokenType.includes("ERC20") || tokenType.includes("ERC-20") ? "text-blue-800" :
                                       tokenType.includes("ERC721") || tokenType.includes("ERC-721") ? "text-purple-800" :
                                       tokenType.includes("ERC1155") || tokenType.includes("ERC-1155") ? "text-amber-800" :
                                       "text-gray-800";
                      
                      return (
                        <tr key={allocation.id} className="border-t">
                          <td className="p-2">
                            <div>{allocation.investorName}</div>
                            <div className="text-xs text-muted-foreground">
                              {allocation.investorEmail}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {formatTokenType(allocation.tokenType)}
                              </span>
                              {allocation.tokenSymbol && (
                                <Badge
                                  variant="outline"
                                  className={cn("w-fit mt-1 text-xs", getTokenTypeTheme(allocation.tokenType).badge)}
                                >
                                  {allocation.tokenSymbol}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-right">
                            {formatNumber(allocation.tokenAmount)}
                          </td>
                          <td className="p-2 font-mono text-xs truncate max-w-[150px]">
                            {allocation.walletAddress ? (
                              <span className="text-blue-600">
                                {allocation.walletAddress.substring(0, 6)}...
                                {allocation.walletAddress.substring(
                                  allocation.walletAddress.length - 4
                                )}
                              </span>
                            ) : (
                              <span className="text-red-500">Not set</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                You are about to distribute tokens to {allocations.length}{" "}
                investor(s). This action will send tokens to the specified
                wallet addresses and cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Distribution Details</h3>
              <div className="rounded-md border p-4 space-y-2">
                {tokenTotals.map((tokenTotal) => (
                  <div key={tokenTotal.tokenType}>
                    <p className="font-medium">{tokenTotal.tokenType}</p>
                    <p className="text-sm">
                      {formatNumber(tokenTotal.total)} tokens to{" "}
                      {tokenTotal.count} investor(s)
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="confirm-distribution"
                checked={confirmChecked}
                onCheckedChange={(checked) => setConfirmChecked(!!checked)}
              />
              <Label htmlFor="confirm-distribution">
                I confirm that I want to distribute these tokens and understand
                this action cannot be reversed
              </Label>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="space-y-4 text-center py-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h3 className="text-lg font-medium">Distributing Tokens</h3>
            <p className="text-muted-foreground">
              Please wait while your tokens are being distributed. This process
              may take a few minutes.
            </p>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-4 text-center py-6">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-medium">Distribution Complete</h3>
            <p className="text-muted-foreground">
              Your tokens have been successfully distributed to investor
              wallets.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // Render footer based on current step
  const renderFooter = () => {
    switch (distributionStep) {
      case "review":
        return (
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => setDistributionStep("confirm")}
              disabled={
                missingWalletAddresses.length > 0 || allocations.length === 0
              }
            >
              Continue
            </Button>
          </>
        );

      case "confirm":
        return (
          <>
            <Button
              variant="outline"
              onClick={() => setDistributionStep("review")}
            >
              Back
            </Button>
            <Button
              onClick={handleDistributeTokens}
              disabled={!confirmChecked || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Distribute Tokens
                </>
              )}
            </Button>
          </>
        );

      case "processing":
        // No footer during processing
        return null;

      case "complete":
        return (
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {distributionStep === "complete"
              ? "Distribution Complete"
              : distributionStep === "processing"
              ? "Processing Distribution"
              : distributionStep === "confirm"
              ? "Confirm Distribution"
              : "Distribute Tokens"}
          </DialogTitle>
          <DialogDescription>
            {distributionStep === "complete"
              ? "Tokens have been successfully distributed to investors."
              : distributionStep === "processing"
              ? "Please wait while we process your distribution."
              : distributionStep === "confirm"
              ? "Please confirm that you want to distribute these tokens."
              : "Review and distribute tokens to investors."}
          </DialogDescription>
        </DialogHeader>

        {/* Content varies based on step */}
        {renderContent()}

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TokenDistributionDialog;
