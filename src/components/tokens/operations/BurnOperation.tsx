import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Flame } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TokenOperationType } from "@/components/tokens/types";
import { executeTokenOperation } from "@/components/tokens/services/tokenService";

interface BurnOperationProps {
  tokenId: string;
  tokenStandard: string;
  tokenName: string;
  tokenSymbol: string;
  isDeployed: boolean;
  onSuccess?: () => void;
}

/**
 * BurnOperation component for burning (destroying) tokens
 * Adapts to different token standards with appropriate fields
 */
const BurnOperation: React.FC<BurnOperationProps> = ({
  tokenId,
  tokenStandard,
  tokenName,
  tokenSymbol,
  isDeployed,
  onSuccess
}) => {
  const [sender, setSender] = useState("");
  const [amount, setAmount] = useState("");
  const [nftTokenId, setNftTokenId] = useState("");
  const [tokenTypeId, setTokenTypeId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleBurn = async () => {
    if (!isDeployed) {
      setError("Token must be deployed before burning");
      return;
    }

    // Different token standards have different requirements
    if (tokenStandard === "ERC-20" || tokenStandard === "ERC-1400" || tokenStandard === "ERC-4626") {
      if (!amount) {
        setError("Amount is required");
        return;
      }
    } else if (tokenStandard === "ERC-721") {
      if (!nftTokenId) {
        setError("Token ID is required");
        return;
      }
    } else if (tokenStandard === "ERC-1155") {
      if (!tokenTypeId || !amount) {
        setError("Token type ID and amount are required");
        return;
      }
    } else if (tokenStandard === "ERC-3525") {
      if (!nftTokenId) {
        setError("Token ID is required");
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      // Prepare operation parameters based on token standard
      const operationParams = {
        tokenId,
        operationType: TokenOperationType.BURN,
        sender: sender || undefined,
        amount: amount || undefined,
        nftTokenId: nftTokenId || undefined,
        tokenTypeId: tokenTypeId || undefined,
        slotId: slotId || undefined
      };

      await executeTokenOperation(operationParams);
      setSuccess(true);
      if (onSuccess) onSuccess();

      // Reset form after successful operation
      setSender("");
      setAmount("");
      setNftTokenId("");
      setTokenTypeId("");
      setSlotId("");
    } catch (err: any) {
      setError(err.message || "Failed to burn tokens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Flame className="h-5 w-5 mr-2 text-red-500" />
          Burn {tokenName} ({tokenSymbol})
        </CardTitle>
        <CardDescription>
          Permanently destroy tokens from circulation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isDeployed && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Deployed</AlertTitle>
            <AlertDescription>
              This token must be deployed to a blockchain before burning
            </AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              Tokens burned successfully
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Sender address (optional for some standards) */}
          <div className="space-y-2">
            <Label htmlFor="sender">From Address (Optional)</Label>
            <Input
              id="sender"
              placeholder="0x..."
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              disabled={loading || !isDeployed}
            />
            <p className="text-sm text-muted-foreground">
              Leave blank to burn from the connected wallet
            </p>
          </div>

          {/* Conditional fields based on token standard */}
          {(tokenStandard === "ERC-20" || tokenStandard === "ERC-1400" || tokenStandard === "ERC-4626") && (
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading || !isDeployed}
              />
            </div>
          )}

          {tokenStandard === "ERC-721" && (
            <div className="space-y-2">
              <Label htmlFor="nftTokenId">Token ID</Label>
              <Input
                id="nftTokenId"
                placeholder="E.g., 1"
                value={nftTokenId}
                onChange={(e) => setNftTokenId(e.target.value)}
                disabled={loading || !isDeployed}
              />
            </div>
          )}

          {tokenStandard === "ERC-1155" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tokenTypeId">Token Type ID</Label>
                <Input
                  id="tokenTypeId"
                  placeholder="E.g., 1"
                  value={tokenTypeId}
                  onChange={(e) => setTokenTypeId(e.target.value)}
                  disabled={loading || !isDeployed}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  placeholder="E.g., 100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading || !isDeployed}
                />
              </div>
            </>
          )}

          {tokenStandard === "ERC-3525" && (
            <div className="space-y-2">
              <Label htmlFor="nftTokenId">Token ID</Label>
              <Input
                id="nftTokenId"
                placeholder="E.g., 1"
                value={nftTokenId}
                onChange={(e) => setNftTokenId(e.target.value)}
                disabled={loading || !isDeployed}
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleBurn} 
          disabled={loading || !isDeployed}
          variant="destructive"
          className="w-full"
        >
          {loading ? "Processing..." : "Burn Tokens"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BurnOperation;