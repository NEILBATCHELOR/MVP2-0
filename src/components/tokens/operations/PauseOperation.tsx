import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, PauseCircle, PlayCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TokenOperationType } from "@/components/tokens/types";
import { executeTokenOperation } from "@/components/tokens/services/tokenService";

interface PauseOperationProps {
  tokenId: string;
  tokenStandard: string;
  tokenName: string;
  tokenSymbol: string;
  isDeployed: boolean;
  isPaused: boolean;
  onSuccess?: () => void;
  hasPauseFeature: boolean;
}

/**
 * PauseOperation component for pausing/unpausing token transfers
 * Only enabled for tokens with pausable feature
 */
const PauseOperation: React.FC<PauseOperationProps> = ({
  tokenId,
  tokenStandard,
  tokenName,
  tokenSymbol,
  isDeployed,
  isPaused,
  onSuccess,
  hasPauseFeature
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTogglePause = async () => {
    if (!isDeployed) {
      setError("Token must be deployed before pausing/unpausing");
      return;
    }

    if (!hasPauseFeature) {
      setError("This token does not have the pausable feature enabled");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Execute pause or unpause operation based on current state
      const operationParams = {
        tokenId,
        operationType: isPaused ? TokenOperationType.UNPAUSE : TokenOperationType.PAUSE
      };

      await executeTokenOperation(operationParams);
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isPaused ? 'unpause' : 'pause'} token`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {isPaused ? (
            <PlayCircle className="h-5 w-5 mr-2 text-green-500" />
          ) : (
            <PauseCircle className="h-5 w-5 mr-2 text-amber-500" />
          )}
          {isPaused ? "Unpause" : "Pause"} {tokenName} ({tokenSymbol})
        </CardTitle>
        <CardDescription>
          {isPaused 
            ? "Resume token transfers and operations" 
            : "Temporarily halt all token transfers and operations"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isDeployed && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Deployed</AlertTitle>
            <AlertDescription>
              This token must be deployed to a blockchain before pausing/unpausing
            </AlertDescription>
          </Alert>
        )}
        
        {!hasPauseFeature && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Feature Not Enabled</AlertTitle>
            <AlertDescription>
              This token does not have the pausable feature enabled
            </AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              Token {isPaused ? 'unpaused' : 'paused'} successfully
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

        <div className="py-2">
          {isPaused ? (
            <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
              <h4 className="text-amber-800 font-medium mb-1">Token is Currently Paused</h4>
              <p className="text-amber-700 text-sm">
                All transfers and operations are temporarily disabled. Unpausing will allow normal operations to resume.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
              <h4 className="text-blue-800 font-medium mb-1">Token is Currently Active</h4>
              <p className="text-blue-700 text-sm">
                Pausing will temporarily halt all transfers and most operations until explicitly unpaused.
                This is useful for emergency situations or maintenance.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleTogglePause} 
          disabled={loading || !isDeployed || !hasPauseFeature}
          variant={isPaused ? "default" : "outline"}
          className="w-full"
        >
          {loading ? "Processing..." : isPaused ? "Unpause Token" : "Pause Token"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PauseOperation;