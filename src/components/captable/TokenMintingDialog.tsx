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
import { Coins, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/utils";
import { 
  getTokenTypeTheme, 
  extractStandard, 
  formatNumber, 
  formatTokenType 
} from "@/utils/shared/tokenThemeUtils";

interface TokenMintingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenType: string | null;
  tokenSummaries: {
    tokenType: string;
    totalAmount: number;
    status: string;
    tokenSymbols?: string[];
  }[];
  onMint: (tokenTypes: string[]) => void;
}

const TokenMintingDialog = ({
  open,
  onOpenChange,
  tokenType,
  tokenSummaries,
  onMint,
}: TokenMintingDialogProps) => {
  const [selectedTokenTypes, setSelectedTokenTypes] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [distributionStep, setDistributionStep] = useState<
    "select" | "confirm" | "processing" | "complete"
  >("select");
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedTokenTypes([]);
      setDistributionStep("select");
      setIsProcessing(false);
      setConfirmChecked(false);
    }
  }, [open]);

  // Handle token type selection
  const handleTokenTypeSelection = (tokenType: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTokenTypes((prev) => [...prev, tokenType]);
    } else {
      setSelectedTokenTypes((prev) =>
        prev.filter((type) => type !== tokenType),
      );
    }
  };

  // Handle select all
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedTokenTypes(
        tokenSummaries
          .filter((summary) => summary.status === "ready_to_mint")
          .map((summary) => summary.tokenType),
      );
    } else {
      setSelectedTokenTypes([]);
    }
  };

  // Handle mint tokens
  const handleMintTokens = async () => {
    try {
      setIsProcessing(true);
      setDistributionStep("processing");

      // Simulate minting process with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call the onMint callback
      await onMint(selectedTokenTypes);

      // Set minting as complete
      setDistributionStep("complete");
    } catch (error) {
      console.error("Error minting tokens:", error);
      // Reset to selection step on error
      setDistributionStep("select");
    } finally {
      setIsProcessing(false);
    }
  };

  // Render content based on current step
  const renderContent = () => {
    switch (distributionStep) {
      case "select":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={
                  selectedTokenTypes.length ===
                    tokenSummaries.filter(
                      (summary) => summary.status === "ready_to_mint",
                    ).length &&
                  tokenSummaries.some(
                    (summary) => summary.status === "ready_to_mint",
                  )
                }
                onCheckedChange={handleSelectAll}
                disabled={
                  !tokenSummaries.some(
                    (summary) => summary.status === "ready_to_mint",
                  )
                }
              />
              <Label htmlFor="select-all">Select All Ready Tokens</Label>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {tokenSummaries.map((summary) => {
                // Extract styling information based on token type
                const tokenType = summary.tokenType;
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
                                    
                // Status badge styling
                const statusBadgeClass = 
                  summary.status === "minted" ? "bg-green-100 text-green-800" :
                  summary.status === "ready_to_mint" ? "bg-blue-100 text-blue-800" :
                  "bg-yellow-100 text-yellow-800";

                return (
                  <div
                    key={summary.tokenType}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`token-${summary.tokenType}`}
                        checked={selectedTokenTypes.includes(summary.tokenType)}
                        onCheckedChange={(checked) =>
                          handleTokenTypeSelection(summary.tokenType, !!checked)
                        }
                        disabled={summary.status !== "ready_to_mint"}
                      />
                      <div>
                        <Label
                          htmlFor={`token-${summary.tokenType}`}
                          className="font-medium"
                        >
                          {formatTokenType(summary.tokenType)}
                          {summary.tokenSymbols && summary.tokenSymbols.length > 0 && (
                            <span className={cn("ml-1 px-1 rounded text-xs font-mono", getTokenTypeTheme(summary.tokenType).badge)}>
                              {summary.tokenSymbols[0]}
                              {summary.tokenSymbols.length > 1 && '+'}
                            </span>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(summary.totalAmount)} tokens
                        </p>
                      </div>
                    </div>
                    <div>
                      {summary.status === "minted" ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Minted
                        </span>
                      ) : summary.status === "ready_to_mint" ? (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Ready to Mint
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {tokenSummaries.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No token types available for minting
                </div>
              )}
            </div>
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                You are about to mint {selectedTokenTypes.length} token type(s).
                This action will create the tokens on the blockchain and cannot
                be undone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <h3 className="text-sm font-medium">Selected Token Types:</h3>
              <ul className="list-disc list-inside space-y-1">
                {selectedTokenTypes.map((tokenType) => {
                  const summary = tokenSummaries.find(
                    (s) => s.tokenType === tokenType,
                  );
                  return (
                    <li key={tokenType}>
                      {formatTokenType(tokenType)}
                      {summary?.tokenSymbols && summary.tokenSymbols.length > 0 && (
                        <span className={cn("ml-1 px-1 rounded text-xs font-mono", getTokenTypeTheme(summary.tokenType).badge)}>
                          {summary.tokenSymbols[0]}
                          {summary.tokenSymbols.length > 1 && '+'}
                        </span>
                      )}
                      {" - "}{formatNumber(summary?.totalAmount || 0)}{" "}
                      tokens
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="confirm-mint"
                checked={confirmChecked}
                onCheckedChange={(checked) => setConfirmChecked(!!checked)}
              />
              <Label htmlFor="confirm-mint">
                I confirm that I want to mint these tokens and understand this
                action cannot be reversed
              </Label>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="space-y-4 text-center py-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h3 className="text-lg font-medium">Minting Tokens</h3>
            <p className="text-muted-foreground">
              Please wait while your tokens are being minted. This process may
              take a few minutes.
            </p>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-4 text-center py-6">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-medium">Minting Complete</h3>
            <p className="text-muted-foreground">
              Your tokens have been successfully minted. You can now distribute
              them to investors.
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
      case "select":
        return (
          <>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setDistributionStep("confirm")}
              disabled={selectedTokenTypes.length === 0}
            >
              <Coins className="mr-2 h-4 w-4" />
              Continue to Mint
            </Button>
          </>
        );

      case "confirm":
        return (
          <>
            <Button
              variant="outline"
              onClick={() => setDistributionStep("select")}
              disabled={isProcessing}
            >
              Back
            </Button>
            <Button
              onClick={handleMintTokens}
              disabled={isProcessing || !confirmChecked}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Mint Tokens
                </>
              )}
            </Button>
          </>
        );

      case "processing":
        return (
          <Button disabled={true}>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Minting in Progress...
          </Button>
        );

      case "complete":
        return <Button onClick={() => onOpenChange(false)}>Close</Button>;

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span>Mint Tokens</span>
          </DialogTitle>
          <DialogDescription>
            Select token types to mint for confirmed allocations
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TokenMintingDialog;
