import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Ban } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { TokenOperationType } from "@/components/tokens/types";
import { executeTokenOperation } from "@/components/tokens/services/tokenService";

interface BlockOperationProps {
  tokenId: string;
  tokenStandard: string;
  tokenName: string;
  tokenSymbol: string;
  isDeployed: boolean;
  onSuccess?: () => void;
}

/**
 * BlockOperation component for blacklisting addresses
 * Prevents specific addresses from interacting with the token
 */
const BlockOperation: React.FC<BlockOperationProps> = ({
  tokenId,
  tokenStandard,
  tokenName,
  tokenSymbol,
  isDeployed,
  onSuccess
}) => {
  const [targetAddress, setTargetAddress] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleBlock = async () => {
    if (!isDeployed) {
      setError("Token must be deployed before blocking addresses");
      return;
    }

    if (!targetAddress) {
      setError("Target address is required");
      return;
    }

    // Validate that this is a blacklistable token
    if (tokenStandard !== "ERC-1400" && tokenStandard !== "ERC-20") {
      setError("Blocking is only available for ERC-1400 and some ERC-20 tokens");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Prepare block operation parameters
      const operationParams = {
        tokenId,
        operationType: TokenOperationType.BLOCK,
        targetAddress,
        lockReason: reason || undefined
      };

      await executeTokenOperation(operationParams);
      setSuccess(true);
      if (onSuccess) onSuccess();

      // Reset form after successful operation
      setTargetAddress("");
      setReason("");
    } catch (err: any) {
      setError(err.message || "Failed to block address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Ban className="h-5 w-5 mr-2 text-red-500" />
          Block Address for {tokenName} ({tokenSymbol})
        </CardTitle>
        <CardDescription>
          Prevent specific addresses from interacting with this token
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isDeployed && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Deployed</AlertTitle>
            <AlertDescription>
              This token must be deployed to a blockchain before blocking addresses
            </AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              Address blocked successfully
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
            <Label htmlFor="targetAddress">Address to Block</Label>
            <Input
              id="targetAddress"
              placeholder="0x..."
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              disabled={loading || !isDeployed}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Reason for blocking this address"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading || !isDeployed}
            />
          </div>

          <Alert className="bg-amber-50 border-amber-200">
            <AlertTitle className="text-amber-800">Important Notice</AlertTitle>
            <AlertDescription className="text-amber-700">
              Blocking addresses should only be used for compliance or security reasons. This action can be reversed later.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleBlock} 
          disabled={loading || !isDeployed}
          variant="destructive"
          className="w-full"
        >
          {loading ? "Processing..." : "Block Address"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BlockOperation;