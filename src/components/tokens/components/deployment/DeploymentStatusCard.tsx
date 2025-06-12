import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpRight, CheckCircle2, Clock, ExternalLink, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { DeploymentStatus } from '@/types/deployment/deployment';
import { cn } from '@/utils/utils';
import { DeploymentService } from '@/services/deployment/DeploymentService';
import { formatDistanceToNow } from 'date-fns';
import { getExplorerUrl } from '@/utils/shared/explorerUtils';
import { formatAddress } from '@/utils/shared/addressUtils';

// Get singleton instance
const deploymentService = DeploymentService.getInstance();

interface DeploymentStatusCardProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  tokenStandard: string;
  blockchain: string;
  environment: string;
  onStatusChange?: (status: DeploymentStatus) => void;
  className?: string;
}

const DeploymentStatusCard: React.FC<DeploymentStatusCardProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  tokenStandard,
  blockchain,
  environment,
  onStatusChange,
  className
}) => {
  const [status, setStatus] = useState<DeploymentStatus>(DeploymentStatus.PENDING);
  const [deploymentDetails, setDeploymentDetails] = useState<{
    tokenAddress?: string;
    transactionHash?: string;
    blockNumber?: number;
    timestamp?: number;
    gasUsed?: string;
    confirmations?: number;
    progress?: number;
    error?: string;
  }>({
    progress: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [timeSince, setTimeSince] = useState<string>('');

  // Effect to fetch initial status
  useEffect(() => {
    fetchDeploymentStatus();
    
    // Set up listeners for deployment events
    const successListener = (data: any) => {
      if (data.tokenId === tokenId) {
        setStatus(DeploymentStatus.SUCCESS);
        setDeploymentDetails({
          tokenAddress: data.result.tokenAddress,
          transactionHash: data.result.transactionHash,
          blockNumber: data.result.blockNumber,
          timestamp: data.result.timestamp,
          gasUsed: data.result.gasUsed,
          progress: 100
        });
        
        if (onStatusChange) {
          onStatusChange(DeploymentStatus.SUCCESS);
        }
      }
    };
    
    const failedListener = (data: any) => {
      if (data.tokenId === tokenId) {
        setStatus(DeploymentStatus.FAILED);
        setDeploymentDetails(prev => ({
          ...prev,
          error: data.error,
          progress: 0
        }));
        
        if (onStatusChange) {
          onStatusChange(DeploymentStatus.FAILED);
        }
      }
    };
    
    const statusListener = (data: any) => {
      if (data.tokenId === tokenId) {
        setStatus(data.status);
        
        if (onStatusChange) {
          onStatusChange(data.status);
        }
      }
    };
    
    // Progress event listener
    const progressListener = (data: any) => {
      if (data.tokenId === tokenId) {
        const progressValue = data.confirmationCount ? Math.min(data.confirmationCount * 10, 90) : 
          data.progress || (status === DeploymentStatus.DEPLOYING ? 50 : 0);
        
        setDeploymentDetails(prev => ({
          ...prev,
          confirmations: data.confirmationCount,
          progress: progressValue,
          transactionHash: data.transactionHash || prev.transactionHash
        }));
      }
    };
    
    deploymentService.registerCallback('success', successListener);
    deploymentService.registerCallback('failed', failedListener);
    deploymentService.registerCallback('status', statusListener);
    deploymentService.on('deployment:progress', progressListener);
    
    // Update time since every minute
    const timeInterval = setInterval(() => {
      if (deploymentDetails.timestamp) {
        const formattedTime = formatDistanceToNow(new Date(deploymentDetails.timestamp), { addSuffix: true });
        setTimeSince(formattedTime);
      }
    }, 60000);
    
    return () => {
      deploymentService.unregisterCallback('success', successListener);
      deploymentService.unregisterCallback('failed', failedListener);
      deploymentService.unregisterCallback('status', statusListener);
      deploymentService.off('deployment:progress', progressListener);
      clearInterval(timeInterval);
    };
  }, [tokenId, onStatusChange, status]);
  
  // Fetch deployment status from service
  const fetchDeploymentStatus = async () => {
    setRefreshing(true);
    try {
      const currentStatus = await deploymentService.getDeploymentStatus(tokenId);
      
      if (currentStatus) {
        setStatus(currentStatus);
        
        // If status is success, fetch deployment details
        if (currentStatus === DeploymentStatus.SUCCESS) {
          const tokenData = await fetch(`/api/tokens/${tokenId}`).then(res => res.json());
          
          if (tokenData) {
            setDeploymentDetails({
              tokenAddress: tokenData.address,
              transactionHash: tokenData.deployment_transaction,
              blockNumber: tokenData.deployment_block,
              timestamp: new Date(tokenData.deployment_timestamp).getTime(),
              progress: 100
            });
            
            if (tokenData.deployment_timestamp) {
              const formattedTime = formatDistanceToNow(new Date(tokenData.deployment_timestamp), { addSuffix: true });
              setTimeSince(formattedTime);
            }
          }
        } else if (currentStatus === DeploymentStatus.DEPLOYING) {
          // Set progress for deploying state
          setDeploymentDetails(prev => ({
            ...prev,
            progress: prev.progress || 50
          }));
        }
        
        if (onStatusChange) {
          onStatusChange(currentStatus);
        }
      }
    } catch (error) {
      console.error('Error fetching deployment status:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Helper function to get status badge
  const getStatusBadge = () => {
    switch (status) {
      case DeploymentStatus.PENDING:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case DeploymentStatus.DEPLOYING:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Deploying</Badge>;
      case DeploymentStatus.SUCCESS:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Deployed</Badge>;
      case DeploymentStatus.FAILED:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      case DeploymentStatus.ABORTED:
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Aborted</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Helper function to get status icon
  const getStatusIcon = () => {
    switch (status) {
      case DeploymentStatus.PENDING:
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case DeploymentStatus.DEPLOYING:
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case DeploymentStatus.SUCCESS:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case DeploymentStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case DeploymentStatus.ABORTED:
        return <XCircle className="h-5 w-5 text-slate-500" />;
      default:
        return <Clock className="h-5 w-5 text-slate-500" />;
    }
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            Deployment Status
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            {tokenStandard} Token: {tokenName} ({tokenSymbol})
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchDeploymentStatus}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          {/* Progress indicator */}
          {(status === DeploymentStatus.DEPLOYING || status === DeploymentStatus.SUCCESS) && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Deployment Progress</span>
                <span>{deploymentDetails.progress || 0}%</span>
              </div>
              <Progress value={deploymentDetails.progress || 0} />
            </div>
          )}
          
          {/* Status details */}
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="font-medium text-muted-foreground">Network</div>
            <div>{blockchain} {environment.toLowerCase()}</div>
            
            {deploymentDetails.transactionHash && (
              <>
                <div className="font-medium text-muted-foreground">Transaction</div>
                <div className="flex items-center space-x-1 truncate">
                  <span className="truncate">
                    {deploymentDetails.transactionHash.substring(0, 10)}...
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a 
                          href={getExplorerUrl(blockchain, deploymentDetails.transactionHash, 'transaction')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View transaction on blockchain explorer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </>
            )}
            
            {status === DeploymentStatus.SUCCESS && deploymentDetails.tokenAddress && (
              <>
                <div className="font-medium text-muted-foreground">Contract</div>
                <div className="flex items-center space-x-1 truncate">
                  <span className="truncate">
                    {deploymentDetails.tokenAddress.substring(0, 10)}...
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a 
                          href={getExplorerUrl(blockchain, deploymentDetails.tokenAddress, 'address')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View contract on blockchain explorer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {deploymentDetails.blockNumber && (
                  <>
                    <div className="font-medium text-muted-foreground">Block</div>
                    <div>{deploymentDetails.blockNumber}</div>
                  </>
                )}
                
                {timeSince && (
                  <>
                    <div className="font-medium text-muted-foreground">Deployed</div>
                    <div>{timeSince}</div>
                  </>
                )}
              </>
            )}
            
            {status === DeploymentStatus.FAILED && deploymentDetails.error && (
              <>
                <div className="font-medium text-muted-foreground">Error</div>
                <div className="text-red-500 truncate" title={deploymentDetails.error}>
                  {deploymentDetails.error.length > 30 
                    ? `${deploymentDetails.error.substring(0, 30)}...` 
                    : deploymentDetails.error
                  }
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {status === DeploymentStatus.SUCCESS && deploymentDetails.tokenAddress && (
          <a 
            href={getExplorerUrl(blockchain, deploymentDetails.tokenAddress, 'address')} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="outline" className="w-full" size="sm">
              View on Blockchain Explorer
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        )}
        
        {status === DeploymentStatus.FAILED && (
          <Button 
            variant="outline" 
            className="w-full" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry Deployment
            <RefreshCw className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default DeploymentStatusCard;