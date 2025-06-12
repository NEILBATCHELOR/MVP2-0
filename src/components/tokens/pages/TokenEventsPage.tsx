import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TokenPageLayout from '../layout/TokenPageLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, Activity } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import TokenEventMonitor from '../components/TokenEventMonitor';
import TokenNavigation from '../components/TokenNavigation';
import { supabase } from '@/infrastructure/database/client';
import { DeploymentStatus } from '@/types/deployment/TokenDeploymentTypes';
import useTokenProjectContext from '@/hooks/project/useTokenProjectContext';

interface TokenDetails {
  id: string;
  name: string;
  symbol: string;
  standard: string;
  address?: string;
  blockchain?: string;
  deployment_environment?: string;
  deployment_status?: string;
  deployment_transaction?: string;
  verification_status?: string;
}

const TokenEventsPage: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { projectId, project, isLoading: projectLoading } = useTokenProjectContext();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<TokenDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('events');

  // Fetch token details
  useEffect(() => {
    if (tokenId) {
      fetchToken();
    }
  }, [tokenId]);

  const fetchToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('id', tokenId)
        .single();

      if (error) {
        throw error;
      }

      setToken(data);
    } catch (err: any) {
      console.error('Error fetching token:', err);
      setError(err.message || 'Failed to load token details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchToken();
  };

  return (
    <TokenPageLayout
      title={token ? `${token.name} Events` : 'Token Events'}
      description="Monitor and analyze events from your token contract"
      showRefreshButton={true}
      onRefresh={handleRefresh}
    >
      {token && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/projects/${projectId}/tokens/${tokenId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Token
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{token.name} ({token.symbol})</span>
                <Badge variant="outline" className="ml-2">{token.standard}</Badge>
              </CardTitle>
              <CardDescription>
                {token.address ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono">{token.address}</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {token.blockchain || 'ethereum'} / {token.deployment_environment || 'testnet'}
                    </Badge>
                  </div>
                ) : (
                  'Token not yet deployed'
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          {!token.address && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Token not deployed</AlertTitle>
              <AlertDescription>
                This token has not been deployed to a blockchain yet. Events will be available after deployment.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="events" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="events">On-Chain Events</TabsTrigger>
              <TabsTrigger value="history">Deployment History</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-4">
              <TokenEventMonitor 
                tokenId={token.id}
                tokenAddress={token.address}
                blockchain={token.blockchain}
                environment={token.deployment_environment}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Deployment History</CardTitle>
                  <CardDescription>
                    View the deployment history and transactions for this token
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {token.deployment_transaction ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Deployment Transaction</h3>
                          <p className="font-mono text-sm truncate">
                            {token.deployment_transaction}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                          <p>{token.deployment_status}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Verification Status</h3>
                          <p>{token.verification_status || 'Not verified'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No deployment history found.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Token Analytics</CardTitle>
                  <CardDescription>
                    View analytics and insights for your token
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="py-8 text-center text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Analytics coming soon</p>
                    <p className="text-sm">We're working on adding detailed analytics for your tokens.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </TokenPageLayout>
  );
};

export default TokenEventsPage;