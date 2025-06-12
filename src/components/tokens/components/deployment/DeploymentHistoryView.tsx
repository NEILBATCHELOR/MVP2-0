import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, ExternalLink, XCircle } from 'lucide-react';
import { DeploymentStatus } from '@/types/deployment/deployment';
import { formatDistanceToNow, format } from 'date-fns';
import { getExplorerUrl } from '@/utils/wallet/blockchain';
import { supabase } from '@/infrastructure/database/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TokenDeploymentHistoryTable, TokenDeploymentsTable } from '@/types/core/database';
import { Json } from '@/types/core/supabase';

// Temporary interface until token_deployment_history table is created
interface DeploymentHistoryItem {
  id: string;
  token_id: string;
  status: string;
  transaction_hash?: string | null;
  blockchain: string;
  environment?: string;
  timestamp: string;
  error?: string | null;
}

interface DeploymentHistoryViewProps {
  tokenId: string;
  className?: string;
}

const DeploymentHistoryView: React.FC<DeploymentHistoryViewProps> = ({
  tokenId,
  className
}) => {
  const [history, setHistory] = useState<DeploymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeploymentHistory();
  }, [tokenId]);
  
  // Helper function to safely extract error message from deployment data
  const extractErrorMessage = (deploymentData: Json | null): string | null => {
    if (!deploymentData) return null;
    
    // Check if it's an object with an error property
    if (typeof deploymentData === 'object' && deploymentData !== null) {
      // Type guard to check if 'error' property exists
      if ('error' in deploymentData && typeof deploymentData.error === 'string') {
        return deploymentData.error;
      }
    }
    
    return null;
  };
  
  const fetchDeploymentHistory = async () => {
    setIsLoading(true);
    try {
      // Temporarily use token_deployments table until the token_deployment_history table is created
      const { data, error } = await supabase
        .from('token_deployments')
        .select('id, token_id, contract_address, transaction_hash, deployed_at, deployed_by, status, network, deployment_data')
        .eq('token_id', tokenId)
        .order('deployed_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Map token_deployments data to match DeploymentHistoryItem format
      if (Array.isArray(data)) {
        const mappedHistory: DeploymentHistoryItem[] = data.map(deployment => {
          // Extract blockchain and environment from network field if available
          let blockchain = 'unknown';
          let environment = 'testnet';
          
          if (deployment.network) {
            const parts = deployment.network.split('-');
            if (parts.length > 0) {
              blockchain = parts[0];
              if (parts.length > 1) {
                environment = parts[1];
              }
            }
          }
          
          // Extract any error message from deployment_data using the helper function
          const errorMsg = extractErrorMessage(deployment.deployment_data);
          
          return {
            id: deployment.id,
            token_id: deployment.token_id,
            status: deployment.status || 'unknown',
            transaction_hash: deployment.transaction_hash,
            blockchain,
            environment,
            timestamp: deployment.deployed_at,
            error: errorMsg
          };
        });
        
        setHistory(mappedHistory);
      } else {
        console.warn('Deployment history data is not an array:', data);
        setHistory([]);
      }
    } catch (err: any) {
      console.error('Error fetching deployment history:', err);
      setError(err.message || 'Failed to load deployment history');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to get status badge
  const getStatusBadge = (status: DeploymentStatus) => {
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
  const getStatusIcon = (status: DeploymentStatus) => {
    switch (status) {
      case DeploymentStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case DeploymentStatus.DEPLOYING:
        return <Clock className="h-4 w-4 text-blue-500" />;
      case DeploymentStatus.SUCCESS:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case DeploymentStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case DeploymentStatus.ABORTED:
        return <XCircle className="h-4 w-4 text-slate-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
          <CardDescription>Recent deployment attempts for this token</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
          <CardDescription>Failed to load history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }
  
  // Ensure history is an array before rendering
  const historyItems = Array.isArray(history) ? history : [];
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Deployment History</CardTitle>
        <CardDescription>Recent deployment attempts for this token</CardDescription>
      </CardHeader>
      <CardContent>
        {historyItems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No deployment history found
          </div>
        ) : (
          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-4">
              {historyItems.map((item) => (
                <div key={item.id} className="flex space-x-3 items-start border-b pb-3 last:border-0">
                  <div className="pt-1">{getStatusIcon(item.status as DeploymentStatus)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {item.blockchain} {item.environment?.toLowerCase()}
                      </span>
                      {getStatusBadge(item.status as DeploymentStatus)}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(item.timestamp), 'PPpp')} 
                      ({formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })})
                    </div>
                    
                    {item.transaction_hash && (
                      <div className="flex items-center space-x-1 text-xs">
                        <span className="text-muted-foreground">Tx:</span>
                        <span>{item.transaction_hash.substring(0, 8)}...{item.transaction_hash.substring(item.transaction_hash.length - 6)}</span>
                        <a 
                          href={getExplorerUrl(item.blockchain, item.transaction_hash, 'transaction')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    
                    {item.error && (
                      <div className="text-xs text-red-500">
                        Error: {item.error.length > 100 
                          ? `${item.error.substring(0, 100)}...` 
                          : item.error
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default DeploymentHistoryView;