import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Rocket } from "lucide-react";
import NetworkSelector from "./NetworkSelector";
import EnvironmentSelector from "./EnvironmentSelector";
import GasConfigurator, { GasConfig } from "./GasConfigurator";
import DeploymentStatus, { DeploymentStatusType } from "./DeploymentStatus";
import { BlockchainNetwork, NetworkEnvironment } from "@/components/tokens/types";
import { deployToken } from "@/components/tokens/services/tokenService";
import { useToast } from "@/components/ui/use-toast";

interface DeploymentPanelProps {
  tokenId: string;
  tokenStandard: string;
  tokenName: string;
  tokenSymbol: string;
  isDeployed: boolean;
  isReadyForDeployment: boolean;
  onDeploymentComplete?: () => void;
}

/**
 * Main deployment panel component for deploying tokens to blockchain networks
 */
const DeploymentPanel: React.FC<DeploymentPanelProps> = ({
  tokenId,
  tokenStandard,
  tokenName,
  tokenSymbol,
  isDeployed,
  isReadyForDeployment,
  onDeploymentComplete
}) => {
  const { toast } = useToast();
  const [selectedNetwork, setSelectedNetwork] = useState<BlockchainNetwork>(BlockchainNetwork.ETHEREUM);
  const [selectedEnvironment, setSelectedEnvironment] = useState<NetworkEnvironment>(NetworkEnvironment.TESTNET);
  const [gasConfig, setGasConfig] = useState<GasConfig>({
    mode: "recommended"
  });
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatusType>(
    isDeployed ? "success" : "not_started"
  );
  const [contractAddress, setContractAddress] = useState<string>("");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [deployedAt, setDeployedAt] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [deploying, setDeploying] = useState(false);

  // Handle deployment process
  const handleDeploy = async () => {
    if (deploying) return;
    
    setDeploying(true);
    setDeploymentStatus("pending");
    setErrorMessage("");
    
    try {
      // Create deployment configuration
      const deploymentConfig = {
        tokenId,
        network: selectedNetwork,
        environment: selectedEnvironment,
        gasConfig: gasConfig.mode === "custom" ? {
          gasLimit: gasConfig.gasLimit,
          maxFeePerGas: gasConfig.maxFeePerGas,
          maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas
        } : undefined
      };
      
      // Perform deployment
      const result = await deployToken(deploymentConfig);
      
      // Update deployment status
      setDeploymentStatus("success");
      setContractAddress(result.contractAddress);
      setTransactionHash(result.transactionHash);
      setDeployedAt(result.deployedAt);
      
      // Notify success
      toast({
        title: "Deployment Successful",
        description: `${tokenName} (${tokenSymbol}) has been deployed to ${selectedNetwork} ${selectedEnvironment}`,
        variant: "default",
      });
      
      // Call completion callback
      if (onDeploymentComplete) {
        onDeploymentComplete();
      }
    } catch (error: any) {
      // Handle deployment error
      setDeploymentStatus("failed");
      setErrorMessage(error.message || "Deployment failed");
      
      // Notify error
      toast({
        title: "Deployment Failed",
        description: error.message || "An error occurred during deployment",
        variant: "destructive",
      });
    } finally {
      setDeploying(false);
    }
  };

  // Get issues that prevent deployment
  const getDeploymentIssues = (): string[] => {
    const issues: string[] = [];
    
    if (!isReadyForDeployment) {
      issues.push("Token configuration is incomplete or invalid");
    }
    
    if (gasConfig.mode === "custom") {
      if (!gasConfig.gasLimit || parseInt(gasConfig.gasLimit) <= 0) {
        issues.push("Gas limit is required and must be a positive number");
      }
      
      const requiresEIP1559 = [
        BlockchainNetwork.ETHEREUM,
        BlockchainNetwork.POLYGON,
        BlockchainNetwork.OPTIMISM,
        BlockchainNetwork.BASE
      ].includes(selectedNetwork);
      
      if (requiresEIP1559) {
        if (!gasConfig.maxFeePerGas || parseFloat(gasConfig.maxFeePerGas) <= 0) {
          issues.push("Max fee per gas is required and must be a positive number");
        }
        
        if (!gasConfig.maxPriorityFeePerGas || parseFloat(gasConfig.maxPriorityFeePerGas) <= 0) {
          issues.push("Max priority fee is required and must be a positive number");
        }
      }
    }
    
    return issues;
  };
  
  const deploymentIssues = getDeploymentIssues();
  const canDeploy = deploymentIssues.length === 0 && !isDeployed && deploymentStatus !== "pending";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Rocket className="h-5 w-5 mr-2 text-primary" />
          Deploy {tokenName} ({tokenSymbol})
        </CardTitle>
        <CardDescription>
          Configure and deploy your token to the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isDeployed && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Already Deployed</AlertTitle>
            <AlertDescription>
              This token has already been deployed to the blockchain.
            </AlertDescription>
          </Alert>
        )}
        
        {deploymentStatus !== "not_started" && (
          <DeploymentStatus
            status={deploymentStatus}
            contractAddress={contractAddress}
            transactionHash={transactionHash}
            deployedAt={deployedAt}
            errorMessage={errorMessage}
            network={selectedNetwork}
            environment={selectedEnvironment}
          />
        )}

        <div className="space-y-4">
          <NetworkSelector
            selectedNetwork={selectedNetwork}
            onChange={setSelectedNetwork}
            tokenStandard={tokenStandard}
            disabled={deploying || isDeployed}
          />
          
          <Separator />
          
          <EnvironmentSelector
            selectedEnvironment={selectedEnvironment}
            onChange={setSelectedEnvironment}
            selectedNetwork={selectedNetwork}
            disabled={deploying || isDeployed}
          />
          
          <Separator />
          
          <GasConfigurator
            gasConfig={gasConfig}
            onChange={setGasConfig}
            selectedNetwork={selectedNetwork}
            selectedEnvironment={selectedEnvironment}
            disabled={deploying || isDeployed}
          />
        </div>

        {deploymentIssues.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cannot Deploy</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                {deploymentIssues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleDeploy} 
          disabled={!canDeploy || deploying}
          className="w-full"
        >
          {deploying ? "Deploying..." : `Deploy to ${selectedNetwork} ${selectedEnvironment}`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeploymentPanel;