import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpRight,
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Loader2, 
  RefreshCw, 
  Server, 
  XCircle 
} from 'lucide-react';

import { TokenDetails } from '@/components/tokens/interfaces/TokenInterfaces';
import { DeploymentStatus } from '@/types/deployment/deployment';
import { formatAddress } from '@/utils/shared/addressUtils';
import { getExplorerUrl } from '@/utils/shared/explorerUtils';
import { DeploymentService } from '@/services/deployment/DeploymentService';
import DeploymentStatusCard from './DeploymentStatusCard';
import DeploymentHistoryView from './DeploymentHistoryView';

// Get singleton instance
const deploymentService = DeploymentService.getInstance();

interface TokenDeploymentStatusSectionProps {
  token: TokenDetails;
  projectId: string;
  deploymentStatus: DeploymentStatus | null;
  onStatusChange: (status: DeploymentStatus) => void;
}

const TokenDeploymentStatusSection: React.FC<TokenDeploymentStatusSectionProps> = ({
  token,
  projectId,
  deploymentStatus,
  onStatusChange
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Set up event listeners for deployment status updates
  useEffect(() => {
    if (!token.id) return;

    const handleStatusChange = (event: any) => {
      if (event.tokenId === token.id) {
        onStatusChange(event.status);
      }
    };

    const handleSuccess = (data: any) => {
      if (data.tokenId === token.id) {
        onStatusChange(DeploymentStatus.SUCCESS);
      }
    };

    const handleFailure = (data: any) => {
      if (data.tokenId === token.id) {
        onStatusChange(DeploymentStatus.FAILED);
      }
    };

    deploymentService.registerCallback('status', handleStatusChange);
    deploymentService.registerCallback('success', handleSuccess);
    deploymentService.registerCallback('failed', handleFailure);

    return () => {
      deploymentService.unregisterCallback('status', handleStatusChange);
      deploymentService.unregisterCallback('success', handleSuccess);
      deploymentService.unregisterCallback('failed', handleFailure);
    };
  }, [token.id, onStatusChange]);

  // Helper function to get status badge
  const getStatusBadge = (status: DeploymentStatus | null) => {
    if (!status) return null;
    
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Status card */}
      <div className="md:col-span-2">
        {(deploymentStatus === DeploymentStatus.DEPLOYING || 
          deploymentStatus === DeploymentStatus.SUCCESS || 
          deploymentStatus === DeploymentStatus.FAILED) && token ? (
          <DeploymentStatusCard
            tokenId={token.id}
            tokenName={token.name}
            tokenSymbol={token.symbol}
            tokenStandard={token.standard}
            blockchain={token.blockchain || ''}
            environment={token.deployment_environment || 'TESTNET'}
            onStatusChange={onStatusChange}
          />
        ) : token?.address && token?.blockchain ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Deployment Information</CardTitle>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Deployed
                </Badge>
              </div>
              <CardDescription>
                This token has been deployed to the {token.blockchain} network.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Contract Address</p>
                  <p className="font-medium flex items-center">
                    <span className="truncate mr-1">{formatAddress(token.address || '')}</span>
                    <a
                      href={getExplorerUrl(token.blockchain || 'ethereum', token.address || '', 'address')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 ml-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Network</p>
                  <p className="font-medium">{token.blockchain}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Token Name</p>
                  <p className="font-medium">{token.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Symbol</p>
                  <p className="font-medium">{token.symbol}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Standard</p>
                  <p className="font-medium">{token.standard}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Decimals</p>
                  <p className="font-medium">{token.decimals}</p>
                </div>
                {token.total_supply && (
                  <div className="space-y-2 col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Supply</p>
                    <p className="font-medium">{token.total_supply}</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/projects/${projectId}/tokens/${token.id}`)}
                className="w-full"
              >
                View Full Token Details
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Alert>
            <Server className="h-4 w-4" />
            <AlertTitle>Not Deployed</AlertTitle>
            <AlertDescription>
              This token has not been deployed to a blockchain network yet.
              Go to the Configure Deployment tab to start the deployment process.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Deployment history */}
      <div className="md:col-span-1 md:row-span-2">
        <DeploymentHistoryView tokenId={token.id} />
      </div>
      
      {/* Token Dashboard buttons (if deployed) */}
      {token?.address && token?.blockchain && (
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Token Dashboard</CardTitle>
              <CardDescription>
                Manage and monitor your deployed token with these tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate(`/projects/${projectId}/tokens/${token.id}`)}
              >
                Token Details
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate(`/projects/${projectId}/tokens/${token.id}/holders`)}
              >
                Token Holders
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/projects/${projectId}/tokens/${token.id}/transactions`)}
              >
                Transactions
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TokenDeploymentStatusSection;