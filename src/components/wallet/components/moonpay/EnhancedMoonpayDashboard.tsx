/**
 * Enhanced Moonpay Integration Dashboard
 * Comprehensive interface for all MoonPay API capabilities
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Users, 
  BarChart3, 
  Shield, 
  Settings, 
  Globe, 
  Zap,
  TrendingUp,
  Palette,
  Repeat,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';

// Import all services
import { moonpayServices, checkServicesHealth } from './services';
import type { 
  MoonpayAccount,
  AnalyticsMetrics,
  ComplianceProfile,
  NetworkFee,
  PartnerAccount,
  WebhookStats,
  NFTMarketplaceStats,
  SwapAnalytics
} from './services';

interface DashboardStats {
  account?: MoonpayAccount;
  analytics?: AnalyticsMetrics;
  compliance?: any;
  networkFees?: NetworkFee[];
  partner?: PartnerAccount;
  webhooks?: WebhookStats[];
  nftStats?: NFTMarketplaceStats;
  swapStats?: SwapAnalytics;
  servicesHealth?: any;
}

const EnhancedMoonpayDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data from all services
      const [
        servicesHealth,
        analytics,
        nftStats,
        swapStats,
        networkFees
      ] = await Promise.allSettled([
        checkServicesHealth(),
        moonpayServices.analytics.getAnalyticsMetrics('month'),
        moonpayServices.nft.getMarketplaceStats('24h'),
        moonpayServices.swap.getSwapAnalytics('24h'),
        moonpayServices.networkFees.getNetworkFees(['eth', 'btc'], ['usd'])
      ]);

      setStats({
        servicesHealth: servicesHealth.status === 'fulfilled' ? servicesHealth.value : null,
        analytics: analytics.status === 'fulfilled' ? analytics.value : null,
        nftStats: nftStats.status === 'fulfilled' ? nftStats.value : null,
        swapStats: swapStats.status === 'fulfilled' ? swapStats.value : null,
        networkFees: networkFees.status === 'fulfilled' ? networkFees.value : null
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'down': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MoonPay Integration Dashboard</h1>
          <p className="text-gray-600">Complete cryptocurrency infrastructure and services</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Services Health Overview */}
      {stats.servicesHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Services Health
            </CardTitle>
            <CardDescription>
              Real-time status of all MoonPay API services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Badge 
                variant={stats.servicesHealth.status === 'healthy' ? 'default' : 'destructive'}
                className="text-sm"
              >
                {stats.servicesHealth.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-600">
                {Object.values(stats.servicesHealth.services).filter((s: any) => s === 'up').length} of{' '}
                {Object.keys(stats.servicesHealth.services).length} services operational
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.servicesHealth.services).map(([service, status]: [string, any]) => (
                <div key={service} className="flex items-center gap-2 p-2 rounded border">
                  {getHealthStatusIcon(status)}
                  <div>
                    <div className="text-sm font-medium capitalize">{service}</div>
                    <div className={`text-xs ${getHealthStatusColor(status)}`}>
                      {status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="nft">NFT</TabsTrigger>
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Transaction Overview */}
            {stats.analytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">
                        {stats.analytics.transactions.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total transactions</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="font-medium">{stats.analytics.transactions.buy}</div>
                        <div className="text-gray-600">Buy</div>
                      </div>
                      <div>
                        <div className="font-medium">{stats.analytics.transactions.sell}</div>
                        <div className="text-gray-600">Sell</div>
                      </div>
                      <div>
                        <div className="font-medium">{stats.analytics.transactions.swap}</div>
                        <div className="text-gray-600">Swap</div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Success Rate</span>
                        <span className="font-medium">{stats.analytics.transactions.successRate}%</span>
                      </div>
                      <Progress value={stats.analytics.transactions.successRate} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Volume Overview */}
            {stats.analytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">
                        ${stats.analytics.transactions.volume.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total volume</div>
                    </div>
                    <div>
                      <div className="text-lg font-medium">
                        ${stats.analytics.transactions.averageSize.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Average transaction size</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Conversion Rate</span>
                        <span className="font-medium">{stats.analytics.transactions.conversionRate}%</span>
                      </div>
                      <Progress value={stats.analytics.transactions.conversionRate} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Overview */}
            {stats.analytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">
                        {stats.analytics.customers.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total customers</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="font-medium">{stats.analytics.customers.new}</div>
                        <div className="text-gray-600">New</div>
                      </div>
                      <div>
                        <div className="font-medium">{stats.analytics.customers.returning}</div>
                        <div className="text-gray-600">Returning</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-medium">
                        ${stats.analytics.customers.lifetimeValue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Average lifetime value</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Network Fees */}
          {stats.networkFees && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Network Fees
                </CardTitle>
                <CardDescription>
                  Real-time network fee information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stats.networkFees.map((fee, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{fee.currency.toUpperCase()}</h4>
                        <Badge variant={
                          fee.congestionLevel === 'low' ? 'default' :
                          fee.congestionLevel === 'medium' ? 'secondary' :
                          fee.congestionLevel === 'high' ? 'destructive' : 'destructive'
                        }>
                          {fee.congestionLevel}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="font-medium">{fee.standardFee} {fee.unit}</div>
                          <div className="text-gray-600">Standard</div>
                          <div className="text-xs text-gray-500">
                            ~{fee.estimatedConfirmationTime.standard}m
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{fee.fastFee} {fee.unit}</div>
                          <div className="text-gray-600">Fast</div>
                          <div className="text-xs text-gray-500">
                            ~{fee.estimatedConfirmationTime.fast}m
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{fee.priorityFee} {fee.unit}</div>
                          <div className="text-gray-600">Priority</div>
                          <div className="text-xs text-gray-500">
                            ~{fee.estimatedConfirmationTime.priority}m
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive business intelligence and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Advanced analytics dashboard will be displayed here</p>
                <p className="text-sm">Including conversion funnels, customer segments, and predictive insights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NFT Tab */}
        <TabsContent value="nft">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                NFT Marketplace
              </CardTitle>
              <CardDescription>
                NFT trading, minting, and portfolio management
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.nftStats ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.nftStats.overview.totalCollections}</div>
                    <div className="text-sm text-gray-600">Collections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.nftStats.overview.totalTokens.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total NFTs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">${stats.nftStats.overview.totalVolume.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Volume</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.nftStats.overview.uniqueHolders.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Unique Holders</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>NFT marketplace data will be displayed here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Swap Tab */}
        <TabsContent value="swap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="w-5 h-5" />
                Swap & DeFi
              </CardTitle>
              <CardDescription>
                Advanced trading, limit orders, and DeFi integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.swapStats ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">${stats.swapStats.overview.totalVolume.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Swap Volume</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.swapStats.overview.totalSwaps.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Swaps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.swapStats.overview.uniqueUsers.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Unique Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">${stats.swapStats.overview.averageSize.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Avg. Size</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Repeat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Swap analytics will be displayed here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Compliance & Risk
              </CardTitle>
              <CardDescription>
                AML screening, transaction monitoring, and regulatory compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Compliance dashboard will be displayed here</p>
                <p className="text-sm">Including AML alerts, risk scores, and regulatory reports</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedMoonpayDashboard;
