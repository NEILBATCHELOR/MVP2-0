import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TokenOperationType } from "@/components/tokens/types";
import { executeTokenOperation } from "@/components/tokens/services/tokenService";

interface LockOperationProps {
  tokenId: string;
  tokenStandard: string;
  tokenName: string;
  tokenSymbol: string;
  isDeployed: boolean;
  onSuccess?: () => void;
}

/**
 * LockOperation component for locking tokens
 * Allows locking tokens for a specified duration or until a specific date
 */
const LockOperation: React.FC<LockOperationProps> = ({
  tokenId,
  tokenStandard,
  tokenName,
  tokenSymbol,
  isDeployed,
  onSuccess
}) => {
  const [targetAddress, setTargetAddress] = useState("");
  const [lockType, setLockType] = useState<"duration" | "until">("duration");
  const [lockDuration, setLockDuration] = useState("");
  const [unlockTime, setUnlockTime] = useState("");
  const [lockReason, setLockReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLock = async () => {
    if (!isDeployed) {
      setError("Token must be deployed before locking");
      return;
    }

    if (!targetAddress) {
      setError("Target address is required");
      return;
    }

    if (lockType === "duration" && !lockDuration) {
      setError("Lock duration is required");
      return;
    }

    if (lockType === "until" && !unlockTime) {
      setError("Unlock time is required");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Prepare lock operation parameters
      const operationParams = {
        tokenId,
        operationType: TokenOperationType.LOCK,
        targetAddress,
        lockDuration: lockType === "duration" ? parseInt(lockDuration) : undefined,
        unlockTime: lockType === "until" ? unlockTime : undefined,
        lockReason: lockReason || undefined
      };

      await executeTokenOperation(operationParams);
      setSuccess(true);
      if (onSuccess) onSuccess();

      // Reset form after successful operation
      setTargetAddress("");
      setLockDuration("");
      setUnlockTime("");
      setLockReason("");
    } catch (err: any) {
      setError(err.message || "Failed to lock tokens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="h-5 w-5 mr-2 text-blue-500" />
          Lock {tokenName} ({tokenSymbol})
        </CardTitle>
        <CardDescription>
          Restrict token transfers for a specific address
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isDeployed && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Deployed</AlertTitle>
            <AlertDescription>
              This token must be deployed to a blockchain before locking
            </AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              Tokens locked successfully
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
            <Label htmlFor="targetAddress">Address to Lock</Label>
            <Input
              id="targetAddress"
              placeholder="0x..."
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              disabled={loading || !isDeployed}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lockType">Lock Type</Label>
            <Select
              value={lockType}
              onValueChange={(value: "duration" | "until") => setLockType(value)}
              disabled={loading || !isDeployed}
            >
              <SelectTrigger id="lockType">
                <SelectValue placeholder="Select lock type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="duration">For Duration</SelectItem>
                <SelectItem value="until">Until Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {lockType === "duration" ? (
            <div className="space-y-2">
              <Label htmlFor="lockDuration">Lock Duration (days)</Label>
              <Input
                id="lockDuration"
                type="number"
                min="1"
                placeholder="E.g., 30"
                value={lockDuration}
                onChange={(e) => setLockDuration(e.target.value)}
                disabled={loading || !isDeployed}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="unlockTime">Unlock Date</Label>
              <Input
                id="unlockTime"
                type="datetime-local"
                value={unlockTime}
                onChange={(e) => setUnlockTime(e.target.value)}
                disabled={loading || !isDeployed}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="lockReason">Reason (Optional)</Label>
            <Textarea
              id="lockReason"
              placeholder="Reason for locking the tokens"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              disabled={loading || !isDeployed}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleLock} 
          disabled={loading || !isDeployed}
          className="w-full"
        >
          {loading ? "Processing..." : "Lock Tokens"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LockOperation;