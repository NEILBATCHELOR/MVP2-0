import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Activity, 
  Zap,
  PieChart,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  ArrowUpDown,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react';
import { moonpayService } from '@/services/wallet/MoonpayService';
import { nftService } from '@/services/wallet/moonpay/core/NFTService';
import { swapService } from '@/services/wallet/moonpay/core/SwapService';
import { supabase } from '@/infrastructure/database/client';

interface AnalyticsData {
  transactions: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalVolume: number;
    totalFees: number;
    avgTransactionSize: number;
    conversionRate: number;
  };
  swaps: {
    total: number;
    completed: number;
    totalVolume: number;
    avgSlippage: number;
    popularPairs: Array<{
      pair: string;
      count: number;
      volume: number;
    }>;
  };
  nfts: {
    totalPasses: number;
    minted: number;
    transferred: number;
    uniqueOwners: number;
    collections: number;
    topCollections: Array<{
      name: string;
      passes: number;
      volume: number;
    }>;
  };
  customers: {
    total: number;
    verified: number;
    pending: number;
    kycLevels: Record<string, number>;
  };
  revenue: {
    total: number;
    fromTransactions: number;
    fromSwaps: number;
    fromNFTs: number;
    monthlyGrowth: number;
  };
}

interface TimeRange {
  value: string;
  label: string;
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { value: '24h', label: 'Last 24 Hours', days: 1 },
  { value: '7d', label: 'Last 7 Days', days: 7 },
  { value: '30d', label: 'Last 30 Days', days: 30 },
  { value: '90d', label: 'Last 90 Days', days: 90 },
  { value: '1y', label: 'Last Year', days: 365 }
];

const AnalyticsDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const days = TIME_RANGES.find(r => r.value === timeRange)?.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Load transaction analytics
      const transactionAnalytics = await loadTransactionAnalytics(startDate);
      
      // Load swap analytics
      const swapAnalytics = await loadSwapAnalytics(startDate);
      
      // Load NFT analytics
      const nftAnalytics = await loadNFTAnalytics(startDate);
      
      // Load customer analytics
      const customerAnalytics = await loadCustomerAnalytics(startDate);
      
      // Calculate revenue analytics
      const revenueAnalytics = calculateRevenueAnalytics(
        transactionAnalytics,
        swapAnalytics,
        nftAnalytics
      );

      setAnalyticsData({
        transactions: transactionAnalytics,
        swaps: swapAnalytics,
        nfts: nftAnalytics,
        customers: customerAnalytics,
        revenue: revenueAnalytics
      });
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactionAnalytics = async (startDate: Date) => {
    // TODO: Replace with actual moonpay_transactions table when available
    // const { data, error } = await supabase
    //   .from('moonpay_transactions')
    //   .select('*')
    //   .gte('created_at', startDate.toISOString());

    // if (error) throw error;

    // Mock data for development
    const data: any[] = [];

    const total = data.length;
    const completed = data.filter(t => t.status === 'completed').length;
    const pending = data.filter(t => t.status === 'pending' || t.status === 'waitingPayment').length;
    const failed = data.filter(t => t.status === 'failed').length;
    
    const completedTransactions = data.filter(t => t.status === 'completed');
    const totalVolume = completedTransactions.reduce((sum, t) => sum + (t.fiat_amount || 0), 0);
    const totalFees = completedTransactions.reduce((sum, t) => {
      const fees = t.fees as any;
      return sum + (fees?.moonpay || 0);
    }, 0);
    
    const avgTransactionSize = completedTransactions.length > 0 
      ? totalVolume / completedTransactions.length 
      : 0;
    const conversionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      pending,
      failed,
      totalVolume,
      totalFees,
      avgTransactionSize,
      conversionRate
    };
  };

  const loadSwapAnalytics = async (startDate: Date) => {
    // TODO: Replace with actual moonpay_swap_transactions table when available
    // const { data, error } = await supabase
    //   .from('moonpay_swap_transactions')
    //   .select('*')
    //   .gte('created_at', startDate.toISOString());

    // if (error) throw error;

    // Mock data for development
    const data: any[] = [];

    const total = data.length;
    const completed = data.filter(t => t.status === 'completed').length;
    const totalVolume = data.reduce((sum, t) => sum + (t.base_amount || 0), 0);
    
    // Calculate average slippage (simplified)
    const avgSlippage = 0.5; // Placeholder
    
    // Popular trading pairs
    const pairCounts = new Map<string, { count: number; volume: number }>();
    data.forEach(tx => {
      const pair = `${tx.base_currency}-${tx.quote_currency}`;
      const existing = pairCounts.get(pair) || { count: 0, volume: 0 };
      pairCounts.set(pair, {
        count: existing.count + 1,
        volume: existing.volume + (tx.base_amount || 0)
      });
    });

    const popularPairs = Array.from(pairCounts.entries())
      .map(([pair, data]) => ({ pair, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total,
      completed,
      totalVolume,
      avgSlippage,
      popularPairs
    };
  };

  const loadNFTAnalytics = async (startDate: Date) => {
    // TODO: Replace with actual moonpay_passes table when available
    // const { data, error } = await supabase
    //   .from('moonpay_passes')
    //   .select('*')
    //   .gte('created_at', startDate.toISOString());

    // if (error) throw error;

    // Mock data for development
    const data: any[] = [];

    const totalPasses = data.length;
    const minted = data.filter(p => p.status === 'minted').length;
    const transferred = data.filter(p => p.status === 'transferred').length;
    
    const uniqueOwners = new Set(
      data.filter(p => p.owner_address).map(p => p.owner_address)
    ).size;

    // Get collections count - TODO: Replace with actual moonpay_projects table
    // const { data: projects } = await supabase
    //   .from('moonpay_projects')
    //   .select('*')
    //   .gte('created_at', startDate.toISOString());
    
    const projects: any[] = []; // Mock data
    const collections = projects?.length || 0;

    // Top collections by pass count
    const collectionCounts = new Map<string, number>();
    data.forEach(pass => {
      const count = collectionCounts.get(pass.project_id) || 0;
      collectionCounts.set(pass.project_id, count + 1);
    });

    const topCollections = Array.from(collectionCounts.entries())
      .map(([projectId, passes]) => ({
        name: `Project ${projectId.slice(0, 8)}...`,
        passes,
        volume: passes * 100 // Simplified volume calculation
      }))
      .sort((a, b) => b.passes - a.passes)
      .slice(0, 5);

    return {
      totalPasses,
      minted,
      transferred,
      uniqueOwners,
      collections,
      topCollections
    };
  };

  const loadCustomerAnalytics = async (startDate: Date) => {
    // TODO: Replace with actual moonpay_customers table when available
    // const { data, error } = await supabase
    //   .from('moonpay_customers')
    //   .select('*')
    //   .gte('created_at', startDate.toISOString());

    // if (error) throw error;

    // Mock data for development
    const data: any[] = [];

    const total = data.length;
    const verified = data.filter(c => c.identity_verification_status === 'completed').length;
    const pending = data.filter(c => c.identity_verification_status === 'pending').length;
    
    // KYC levels distribution
    const kycLevels: Record<string, number> = {};
    data.forEach(customer => {
      const level = customer.kyc_level || 'none';
      kycLevels[level] = (kycLevels[level] || 0) + 1;
    });

    return {
      total,
      verified,
      pending,
      kycLevels
    };
  };

  const calculateRevenueAnalytics = (
    transactions: any,
    swaps: any,
    nfts: any
  ) => {
    const fromTransactions = transactions.totalFees;
    const fromSwaps = swaps.totalVolume * 0.003; // 0.3% fee assumption
    const fromNFTs = nfts.minted * 5; // $5 per NFT mint assumption
    
    const total = fromTransactions + fromSwaps + fromNFTs;
    const monthlyGrowth = 15.5; // Placeholder growth percentage

    return {
      total,
      fromTransactions,
      fromSwaps,
      fromNFTs,
      monthlyGrowth
    };
  };

  const exportAnalytics = async () => {
    if (!analyticsData) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Transactions', analyticsData.transactions.total],
      ['Completed Transactions', analyticsData.transactions.completed],
      ['Total Volume', `$${analyticsData.transactions.totalVolume.toFixed(2)}`],
      ['Total Swaps', analyticsData.swaps.total],
      ['Total NFT Passes', analyticsData.nfts.totalPasses],
      ['Total Revenue', `$${analyticsData.revenue.total.toFixed(2)}`],
      ['Conversion Rate', `${analyticsData.transactions.conversionRate.toFixed(2)}%`]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `moonpay-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    change?: number,
    color: string = 'blue'
  ) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center text-sm ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
          <div className={`text-${color}-500`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOverviewTab = () => {
    if (!analyticsData) return null;

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {renderMetricCard(
            'Total Revenue',
            `$${analyticsData.revenue.total.toFixed(2)}`,
            <DollarSign className="w-8 h-8" />,
            analyticsData.revenue.monthlyGrowth,
            'green'
          )}
          
          {renderMetricCard(
            'Total Transactions',
            analyticsData.transactions.total.toLocaleString(),
            <Activity className="w-8 h-8" />,
            undefined,
            'blue'
          )}
          
          {renderMetricCard(
            'Conversion Rate',
            `${analyticsData.transactions.conversionRate.toFixed(1)}%`,
            <Target className="w-8 h-8" />,
            undefined,
            'purple'
          )}
          
          {renderMetricCard(
            'Active Users',
            analyticsData.customers.total.toLocaleString(),
            <Users className="w-8 h-8" />,
            undefined,
            'orange'
          )}
        </div>

        {/* Transaction Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Transaction Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Completed</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{analyticsData.transactions.completed}</div>
                    <div className="text-sm text-muted-foreground">
                      {((analyticsData.transactions.completed / analyticsData.transactions.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span>Pending</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{analyticsData.transactions.pending}</div>
                    <div className="text-sm text-muted-foreground">
                      {((analyticsData.transactions.pending / analyticsData.transactions.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>Failed</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{analyticsData.transactions.failed}</div>
                    <div className="text-sm text-muted-foreground">
                      {((analyticsData.transactions.failed / analyticsData.transactions.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Transactions</span>
                  <div className="text-right">
                    <div className="font-medium">${analyticsData.revenue.fromTransactions.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {((analyticsData.revenue.fromTransactions / analyticsData.revenue.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Swaps</span>
                  <div className="text-right">
                    <div className="font-medium">${analyticsData.revenue.fromSwaps.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {((analyticsData.revenue.fromSwaps / analyticsData.revenue.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>NFTs</span>
                  <div className="text-right">
                    <div className="font-medium">${analyticsData.revenue.fromNFTs.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {((analyticsData.revenue.fromNFTs / analyticsData.revenue.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderTransactionsTab = () => {
    if (!analyticsData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderMetricCard(
            'Total Volume',
            `$${analyticsData.transactions.totalVolume.toLocaleString()}`,
            <DollarSign className="w-8 h-8" />
          )}
          
          {renderMetricCard(
            'Average Transaction',
            `$${analyticsData.transactions.avgTransactionSize.toFixed(2)}`,
            <BarChart3 className="w-8 h-8" />
          )}
          
          {renderMetricCard(
            'Total Fees',
            `$${analyticsData.transactions.totalFees.toFixed(2)}`,
            <Zap className="w-8 h-8" />
          )}
        </div>
      </div>
    );
  };

  const renderSwapsTab = () => {
    if (!analyticsData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderMetricCard(
            'Total Swaps',
            analyticsData.swaps.total.toLocaleString(),
            <ArrowUpDown className="w-8 h-8" />
          )}
          
          {renderMetricCard(
            'Swap Volume',
            `$${analyticsData.swaps.totalVolume.toLocaleString()}`,
            <BarChart3 className="w-8 h-8" />
          )}
          
          {renderMetricCard(
            'Avg Slippage',
            `${analyticsData.swaps.avgSlippage.toFixed(2)}%`,
            <Target className="w-8 h-8" />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Popular Trading Pairs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.swaps.popularPairs.map((pair, index) => (
                <div key={pair.pair} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-medium">{pair.pair}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{pair.count} swaps</div>
                    <div className="text-sm text-muted-foreground">
                      ${pair.volume.toFixed(2)} volume
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderNFTsTab = () => {
    if (!analyticsData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {renderMetricCard(
            'Total Passes',
            analyticsData.nfts.totalPasses.toLocaleString(),
            <PieChart className="w-8 h-8" />
          )}
          
          {renderMetricCard(
            'Minted',
            analyticsData.nfts.minted.toLocaleString(),
            <CheckCircle className="w-8 h-8" />
          )}
          
          {renderMetricCard(
            'Collections',
            analyticsData.nfts.collections.toLocaleString(),
            <BarChart3 className="w-8 h-8" />
          )}
          
          {renderMetricCard(
            'Unique Owners',
            analyticsData.nfts.uniqueOwners.toLocaleString(),
            <Users className="w-8 h-8" />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.nfts.topCollections.map((collection, index) => (
                <div key={collection.name} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-medium">{collection.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{collection.passes} passes</div>
                    <div className="text-sm text-muted-foreground">
                      ${collection.volume} volume
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor your Moonpay integration performance</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      ) : analyticsData ? (
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="swaps">Swaps</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            {renderOverviewTab()}
          </TabsContent>
          
          <TabsContent value="transactions" className="mt-6">
            {renderTransactionsTab()}
          </TabsContent>
          
          <TabsContent value="swaps" className="mt-6">
            {renderSwapsTab()}
          </TabsContent>
          
          <TabsContent value="nfts" className="mt-6">
            {renderNFTsTab()}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No analytics data available</h3>
          <p className="text-muted-foreground">Data will appear here once you start using Moonpay services</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
