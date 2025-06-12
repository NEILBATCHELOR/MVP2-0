import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MintOperation from "./MintOperation";
import BurnOperation from "./BurnOperation";
import PauseOperation from "./PauseOperation";
import LockOperation from "./LockOperation";
import BlockOperation from "./BlockOperation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface OperationsPanelProps {
  tokenId: string;
  tokenStandard: string;
  tokenName: string;
  tokenSymbol: string;
  isDeployed: boolean;
  isPaused?: boolean;
  hasPauseFeature?: boolean;
  refreshTokenData?: () => void;
}

/**
 * OperationsPanel component that provides tabs for different token operations
 */
const OperationsPanel: React.FC<OperationsPanelProps> = ({
  tokenId,
  tokenStandard,
  tokenName,
  tokenSymbol,
  isDeployed,
  isPaused = false,
  hasPauseFeature = false,
  refreshTokenData
}) => {
  const [activeTab, setActiveTab] = useState("mint");
  
  // Refreshes token data when operations complete
  const handleOperationSuccess = () => {
    if (refreshTokenData) {
      refreshTokenData();
    }
  };

  // Determines which operations are available for which standards
  const showBurn = ["ERC-20", "ERC-721", "ERC-1155", "ERC-1400", "ERC-3525", "ERC-4626"].includes(tokenStandard);
  const showPause = hasPauseFeature;
  const showLock = ["ERC-20", "ERC-721", "ERC-1155", "ERC-1400", "ERC-3525"].includes(tokenStandard);
  const showBlock = ["ERC-20", "ERC-1400"].includes(tokenStandard);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Token Operations</CardTitle>
          <CardDescription>
            Manage your token with these operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isDeployed ? (
            <div>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Token Not Deployed</AlertTitle>
                <AlertDescription>
                  Operations are only available for deployed tokens. Please deploy this token first.
                </AlertDescription>
              </Alert>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => window.location.href = `/tokens/${tokenId}/deploy`}
              >
                Go to Deployment
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="mint">Mint</TabsTrigger>
                {showBurn && <TabsTrigger value="burn">Burn</TabsTrigger>}
                {showPause && <TabsTrigger value="pause">
                  {isPaused ? "Unpause" : "Pause"}
                </TabsTrigger>}
                {showLock && <TabsTrigger value="lock">Lock</TabsTrigger>}
                {showBlock && <TabsTrigger value="block">Block</TabsTrigger>}
              </TabsList>
              
              <div className="mt-6">
                <TabsContent value="mint">
                  <MintOperation
                    tokenId={tokenId}
                    tokenStandard={tokenStandard}
                    tokenName={tokenName}
                    tokenSymbol={tokenSymbol}
                    isDeployed={isDeployed}
                    onSuccess={handleOperationSuccess}
                  />
                </TabsContent>
                
                {showBurn && (
                  <TabsContent value="burn">
                    <BurnOperation
                      tokenId={tokenId}
                      tokenStandard={tokenStandard}
                      tokenName={tokenName}
                      tokenSymbol={tokenSymbol}
                      isDeployed={isDeployed}
                      onSuccess={handleOperationSuccess}
                    />
                  </TabsContent>
                )}
                
                {showPause && (
                  <TabsContent value="pause">
                    <PauseOperation
                      tokenId={tokenId}
                      tokenStandard={tokenStandard}
                      tokenName={tokenName}
                      tokenSymbol={tokenSymbol}
                      isDeployed={isDeployed}
                      isPaused={isPaused}
                      hasPauseFeature={hasPauseFeature}
                      onSuccess={handleOperationSuccess}
                    />
                  </TabsContent>
                )}
                
                {showLock && (
                  <TabsContent value="lock">
                    <LockOperation
                      tokenId={tokenId}
                      tokenStandard={tokenStandard}
                      tokenName={tokenName}
                      tokenSymbol={tokenSymbol}
                      isDeployed={isDeployed}
                      onSuccess={handleOperationSuccess}
                    />
                  </TabsContent>
                )}
                
                {showBlock && (
                  <TabsContent value="block">
                    <BlockOperation
                      tokenId={tokenId}
                      tokenStandard={tokenStandard}
                      tokenName={tokenName}
                      tokenSymbol={tokenSymbol}
                      isDeployed={isDeployed}
                      onSuccess={handleOperationSuccess}
                    />
                  </TabsContent>
                )}
              </div>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationsPanel;