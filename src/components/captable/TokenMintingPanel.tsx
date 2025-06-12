import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Coins, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatTokenType } from "@/components/tokens/utils/tokenFormatters";
import { cn } from "@/utils";

interface TokenSummary {
  tokenType: string;
  totalAmount: number;
  confirmedAmount: number;
  status: string;
  readyToMint: boolean;
}

interface TokenMintingPanelProps {
  tokenSummaries: TokenSummary[];
  onMintTokens: (tokenTypes: string[]) => void;
  isLoading: boolean;
}

// Token type color themes mapping
const getTokenTypeTheme = (tokenType: string) => {
  // Normalize the input to remove hyphens and make uppercase
  const normalizedType = tokenType.toUpperCase().replace(/-/g, '');
  
  // Direct standard mapping with normalized keys
  const standardMap: Record<string, { bg: string, border: string, text: string, badge: string }> = {
    // Format: { bg: "background", border: "border", text: "text color", badge: "badge background" }
    "ERC20": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-800" },
    "ERC721": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", badge: "bg-purple-100 text-purple-800" },
    "ERC1155": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-100 text-amber-800" },
    "ERC1400": { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", badge: "bg-green-100 text-green-800" },
    "ERC3525": { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-800", badge: "bg-pink-100 text-pink-800" },
    "ERC4626": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-800", badge: "bg-cyan-100 text-cyan-800" },
    "FACTORING": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-800" },
    "default": { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", badge: "bg-gray-100 text-gray-800" }
  };

  // Also add entries with hyphens for direct DB values (ERC-20)
  standardMap["ERC-20"] = standardMap["ERC20"];
  standardMap["ERC-721"] = standardMap["ERC721"];
  standardMap["ERC-1155"] = standardMap["ERC1155"];
  standardMap["ERC-1400"] = standardMap["ERC1400"];
  standardMap["ERC-3525"] = standardMap["ERC3525"];
  standardMap["ERC-4626"] = standardMap["ERC4626"];

  // Direct check for known standards
  if (standardMap[normalizedType]) {
    return standardMap[normalizedType];
  }
  
  // Also try the non-normalized type (might be from DB with hyphens)
  if (standardMap[tokenType]) {
    return standardMap[tokenType];
  }
  
  // If we don't have a direct match, extract the standard
  const extractedStandard = extractStandard(tokenType);
  if (extractedStandard && standardMap[extractedStandard]) {
    return standardMap[extractedStandard];
  }
  
  // Special case for FACTORING
  if (tokenType.toUpperCase().includes('FACTORING')) {
    return standardMap.FACTORING;
  }
  
  // Special case for equity
  if (tokenType.toLowerCase().includes('equity')) {
    return standardMap.ERC20;
  }
  
  // Special case for NFTs
  if (tokenType.toLowerCase().includes('nft')) {
    return standardMap.ERC721;
  }
  
  // Return the default if nothing matches
  return standardMap.default;
};

// Extract standard from token type
const extractStandard = (tokenType: string): string => {
  if (!tokenType) return "";
  
  // IMMEDIATE CHECK: Is this a specific known standard with or without hyphens?
  const standardsMap = {
    "ERC20": "ERC20", "ERC-20": "ERC20",
    "ERC721": "ERC721", "ERC-721": "ERC721",
    "ERC1155": "ERC1155", "ERC-1155": "ERC1155",
    "ERC1400": "ERC1400", "ERC-1400": "ERC1400",
    "ERC3525": "ERC3525", "ERC-3525": "ERC3525",
    "ERC4626": "ERC4626", "ERC-4626": "ERC4626"
  };
  
  if (standardsMap[tokenType]) {
    return standardsMap[tokenType];
  }
  
  // Check if tokenType is already just a standard with numbers (ERC followed by numbers)
  if (/^ERC[-]?[0-9]+$/i.test(tokenType)) {
    const standardOnly = tokenType.replace(/-/g, '').toUpperCase();
    return standardOnly;
  }
  
  // Pattern 1: Name (Symbol) - Standard
  let matches = tokenType.match(/ - (ERC[-]?[0-9]+)/i);
  
  // Pattern 2: Standard in the name part
  if (!matches) {
    matches = tokenType.match(/(ERC[-]?[0-9]+)/i);
  }
  
  if (matches) {
    const standard = matches[1].replace(/-/g, '').toUpperCase();
    return standard;
  }
  
  return "";
};

const TokenMintingPanel = ({
  tokenSummaries = [],
  onMintTokens,
  isLoading,
}: TokenMintingPanelProps) => {
  const [selectedTokenTypes, setSelectedTokenTypes] = useState<string[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
          .filter((summary) => summary.readyToMint)
          .map((summary) => summary.tokenType),
      );
    } else {
      setSelectedTokenTypes([]);
    }
  };

  // Handle mint tokens
  const handleMintTokens = async () => {
    if (!confirmationChecked || selectedTokenTypes.length === 0) return;

    try {
      setIsMinting(true);
      await onMintTokens(selectedTokenTypes);
      setSelectedTokenTypes([]);
      setConfirmationChecked(false);
    } catch (error) {
      console.error("Error minting tokens:", error);
    } finally {
      setIsMinting(false);
    }
  };

  // Filter token types that are ready to mint
  const mintableTokenTypes = tokenSummaries.filter(
    (summary) => summary.readyToMint,
  );

  // Calculate progress percentage
  const calculateProgress = (confirmed: number, total: number) => {
    if (total === 0) return 0;
    return Math.min(Math.round((confirmed / total) * 100), 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <span>Token Minting</span>
        </CardTitle>
        <CardDescription>
          Review and mint tokens for confirmed allocations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tokenSummaries.length === 0 ? (
          <div className="text-center py-10">
            <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No Token Types Available</h3>
            <p className="text-sm text-muted-foreground mt-2">
              No token types have been defined for this project yet.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Available Token Types</h3>
              {mintableTokenTypes.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={
                      selectedTokenTypes.length === mintableTokenTypes.length &&
                      mintableTokenTypes.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm">
                    Select All Ready to Mint
                  </Label>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {tokenSummaries.map((summary) => {
                // Extract styling information based on token type
                const tokenType = summary.tokenType;
                const isFactoring = tokenType.toUpperCase().includes('FACTORING');
                const isNFT = tokenType.toLowerCase().includes('nft');
                
                // Choose colors based on token type
                const cardBg = isFactoring ? "bg-blue-50" : 
                              isNFT ? "bg-purple-50" : 
                              tokenType.includes("ERC20") || tokenType.includes("ERC-20") ? "bg-blue-50" :
                              tokenType.includes("ERC721") || tokenType.includes("ERC-721") ? "bg-purple-50" :
                              tokenType.includes("ERC1155") || tokenType.includes("ERC-1155") ? "bg-amber-50" :
                              "bg-gray-50";
                              
                const cardBorder = isFactoring ? "border-blue-200" : 
                                  isNFT ? "border-purple-200" : 
                                  tokenType.includes("ERC20") || tokenType.includes("ERC-20") ? "border-blue-200" :
                                  tokenType.includes("ERC721") || tokenType.includes("ERC-721") ? "border-purple-200" :
                                  tokenType.includes("ERC1155") || tokenType.includes("ERC-1155") ? "border-amber-200" :
                                  "border-gray-200";
                                    
                // Badge styling
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
                  <div
                    key={summary.tokenType}
                    className={cn("border rounded-lg p-4 space-y-3", 
                      getTokenTypeTheme(summary.tokenType).bg, 
                      getTokenTypeTheme(summary.tokenType).border)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {summary.readyToMint && (
                          <Checkbox
                            id={`token-${summary.tokenType}`}
                            checked={selectedTokenTypes.includes(
                              summary.tokenType,
                            )}
                            onCheckedChange={(checked) =>
                              handleTokenTypeSelection(
                                summary.tokenType,
                                !!checked,
                              )
                            }
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{formatTokenType(summary.tokenType)}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(summary.totalAmount)}
                          </p>
                        </div>
                      </div>
                      {summary.readyToMint ? (
                        <Badge className={cn(getTokenTypeTheme(summary.tokenType).badge)}>
                          Ready to Mint
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Pending Confirmation
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confirmation Progress</span>
                        <span>
                          {calculateProgress(
                            summary.confirmedAmount,
                            summary.totalAmount,
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={calculateProgress(
                          summary.confirmedAmount,
                          summary.totalAmount,
                        )}
                        className="h-2"
                      />
                    </div>

                    {!summary.readyToMint && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-md text-sm text-yellow-800">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          Allocations need to be confirmed before minting can
                          proceed.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {mintableTokenTypes.length > 0 && (
              <div className="flex items-start space-x-2 pt-4 border-t">
                <Checkbox
                  id="mint-confirmation"
                  checked={confirmationChecked}
                  onCheckedChange={(checked) =>
                    setConfirmationChecked(!!checked)
                  }
                  disabled={selectedTokenTypes.length === 0}
                />
                <Label
                  htmlFor="mint-confirmation"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I confirm that I want to mint these tokens. This action
                  requires multi-signature approval and cannot be undone.
                </Label>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleMintTokens}
          disabled={
            !confirmationChecked ||
            selectedTokenTypes.length === 0 ||
            isMinting ||
            isLoading
          }
        >
          {isMinting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Minting Tokens...
            </>
          ) : (
            <>
              <Coins className="mr-2 h-4 w-4" />
              Mint Selected Tokens
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TokenMintingPanel;
