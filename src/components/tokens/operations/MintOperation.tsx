import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TokenOperationType } from "@/components/tokens/types";
import { executeTokenOperation } from "@/components/tokens/services/tokenService";

interface MintOperationProps {
  tokenId: string;
  tokenStandard: string;
  tokenName: string;
  tokenSymbol: string;
  isDeployed: boolean;
  onSuccess?: () => void;
}

/**
 * MintOperation component for minting new tokens
 * Adapts to different token standards with appropriate fields
 */
const MintOperation: React.FC<MintOperationProps> = ({
  tokenId,
  tokenStandard,
  tokenName,
  tokenSymbol,
  isDeployed,
  onSuccess
}) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [nftTokenId, setNftTokenId] = useState("");
  const [tokenTypeId, setTokenTypeId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleMint = async () => {
    if (!isDeployed) {
      setError("Token must be deployed before minting");
      return;
    }

    if (!recipient) {
      setError("Recipient address is required");
      return;
    }

    // Different token standards have different requirements
    if (tokenStandard === "ERC-20" || tokenStandard === "ERC-1400" || tokenStandard === "ERC-4626") {
      if (!amount) {
        setError("Amount is required");
        return;
      }
    } else if (tokenStandard === "ERC-721") {
      // For ERC-721, recipient is sufficient
    } else if (tokenStandard === "ERC-1155") {
      if (!tokenTypeId || !amount) {
        setError("Token type ID and amount are required");
        return;
      }
    } else if (tokenStandard === "ERC-3525") {
      if (!slotId || !value) {
        setError("Slot ID and value are required");
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      // Prepare operation parameters based on token standard
      const operationParams = {
        tokenId,
        operationType: TokenOperationType.MINT,
        recipient,
        amount: amount || undefined,
        nftTokenId: nftTokenId || undefined,
        tokenTypeId: tokenTypeId || undefined,
        slotId: slotId || undefined,
        value: value || undefined
      };

      await executeTokenOperation(operationParams);
      setSuccess(true);
      if (onSuccess) onSuccess();

      // Reset form after successful operation
      setAmount("");
      setNftTokenId("");
      setTokenTypeId("");
      setSlotId("");
      setValue("");
    } catch (err: any) {
      setError(err.message || "Failed to mint tokens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Mint {tokenName} ({tokenSymbol})
        </CardTitle>
        <CardDescription>
          Create new tokens and assign them to a wallet address
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isDeployed && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Deployed</AlertTitle>
            <AlertDescription>
              This token must be deployed to a blockchain before minting
            </AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              Tokens minted successfully
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
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={loading || !isDeployed}
            />
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
              <Label htmlFor="nftTokenId">Token ID (Optional)</Label>
              <Input
                id="nftTokenId"
                placeholder="Leave blank to auto-generate"
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
            <>
              <div className="space-y-2">
                <Label htmlFor="slotId">Slot ID</Label>
                <Input
                  id="slotId"
                  placeholder="E.g., 1"
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                  disabled={loading || !isDeployed}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  placeholder="E.g., 100"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={loading || !isDeployed}
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleMint} 
          disabled={loading || !isDeployed}
          className="w-full"
        >
          {loading ? "Processing..." : "Mint Tokens"}
          {!loading && <ChevronRight className="h-4 w-4 ml-2" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MintOperation;