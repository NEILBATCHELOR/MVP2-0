import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { rpcManager } from '@/infrastructure/web3/rpc/RPCConnectionManager';
import { getConfiguredEndpoints, isChainConfigured } from '@/infrastructure/web3/rpc/RPCConfigReader';
import type { SupportedChain, NetworkType } from '@/infrastructure/web3/adapters/IBlockchainAdapter';

/**
 * RPC Configuration Debug Component
 * Shows the status of RPC connections and environment variable configuration
 */
export function RPCConfigurationTest() {
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [configuredEndpoints, setConfiguredEndpoints] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    // Get health metrics
    const metrics = rpcManager.getHealthMetrics();
    setHealthMetrics(metrics);

    // Get configured endpoints
    const endpoints = getConfiguredEndpoints();
    setConfiguredEndpoints(endpoints);
  }, []);

  const supportedChains: SupportedChain[] = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche',
    'bitcoin', 'solana', 'near', 'sui', 'aptos'
  ];

  const networks: NetworkType[] = ['mainnet', 'testnet', 'devnet'];

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 RPC Connection Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {healthMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">{healthMetrics.totalProviders}</div>
                <div className="text-sm text-gray-600">Total Providers</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-green-600">{healthMetrics.healthyProviders}</div>
                <div className="text-sm text-gray-600">Healthy Providers</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">{Math.round(healthMetrics.averageLatency)}ms</div>
                <div className="text-sm text-gray-600">Average Latency</div>
              </div>
            </div>
          ) : (
            <div>Loading health metrics...</div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ RPC Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {supportedChains.map(chain => (
              <div key={chain} className="space-y-2">
                <h3 className="font-semibold capitalize">{chain}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {networks.map(network => {
                    const isConfigured = isChainConfigured(chain, network);
                    const endpointKey = `${chain}_${network}`;
                    const endpoint = configuredEndpoints[endpointKey];
                    
                    return (
                      <div key={network} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm capitalize">{network}</span>
                          <Badge variant={isConfigured ? 'default' : 'secondary'}>
                            {isConfigured ? 'Configured' : 'Not Set'}
                          </Badge>
                        </div>
                        {endpoint && (
                          <code className="text-xs text-gray-500">
                            {endpoint.substring(0, 30)}...
                          </code>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Separator />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>🌍 Environment Variables Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(configuredEndpoints).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 border rounded">
                <code className="text-sm">VITE_{key.toUpperCase()}_RPC_URL</code>
                <div className="flex items-center space-x-2">
                  <Badge variant={value ? 'default' : 'destructive'}>
                    {value ? 'SET' : 'NOT SET'}
                  </Badge>
                  {value && (
                    <code className="text-xs text-gray-500">
                      {value.substring(0, 40)}...
                    </code>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provider Status Details */}
      {healthMetrics?.providerStatus && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Provider Health Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(healthMetrics.providerStatus).map(([providerId, status]: [string, any]) => (
                <div key={providerId} className="flex items-center justify-between p-2 border rounded">
                  <code className="text-sm">{providerId}</code>
                  <div className="flex items-center space-x-2">
                    <Badge variant={status.isHealthy ? 'default' : 'destructive'}>
                      {status.isHealthy ? 'Healthy' : 'Unhealthy'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {status.latency}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          <strong>How to configure RPC endpoints:</strong>
          <br />
          1. Add VITE_*_RPC_URL variables to your .env file
          <br />
          2. Restart the development server
          <br />
          3. The RPCConnectionManager will automatically load and health-check all configured endpoints
          <br />
          4. Use the BlockchainFactory to create adapters - it will automatically use the optimal RPC provider
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default RPCConfigurationTest;
