/**
 * RAMP Analytics Dashboard Component
 * 
 * Displays analytics and insights for RAMP Network transactions
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  Activity,
  RefreshCw,
  Calendar,
  Download,
  Filter,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

import { getRampNetworkDataService } from '@/services/dfns/ramp-network-data-service';
import type { RampNetworkEnhancedConfig } from '@/types/ramp';

export interface RampAnalyticsData {
  overview: {
    totalTransactions: number;
    totalVolume: number;
    averageTransaction: number;
    conversionRate: number;
    totalFees: number;
  };
  byType: {
    onramp: {
      transactions: number;
      volume: number;
      conversionRate: number;
    };
    offramp: {
      transactions: number;
      volume: number;
      conversionRate: number;
    };
  };
  byStatus: {
    completed: number;
    pending: number;
    failed: number;
    cancelled: number;
  };
  topAssets: Array<{
    symbol: string;
    transactions: number;
    volume: number;
    percentage: number;
  }>;
  topPaymentMethods: Array<{
    method: string;
    transactions: number;
    percentage: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    onramp: number;
    offramp: number;
    volume: number;
  }>;
  geographical: Array<{
    country: string;
    transactions: number;
    volume: number;
  }>;
}

export interface RampAnalyticsDashboardProps {
  /** RAMP Network configuration */
  config: RampNetworkEnhancedConfig;
  
  /** Date range for analytics */
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  
  /** Whether to show real-time data */
  realTime?: boolean;
  
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  
  /** Currency for volume display */
  currency?: string;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Whether to show export functionality */
  showExport?: boolean;
  
  /** Custom title */
  title?: string;
}

export function RampAnalyticsDashboard({
  config,
  dateRange,
  realTime = false,
  refreshInterval = 60000, // 1 minute
  currency = 'USD',
  className,
  showExport = true,
  title = 'RAMP Network Analytics'
}: RampAnalyticsDashboardProps) {
  // State
  const [analyticsData, setAnalyticsData] = useState<RampAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Refs
  const refreshIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Hooks
  const { toast } = useToast();
  const dataService = getRampNetworkDataService(config);
  
  // Real-time updates
  useEffect(() => {
    if (!realTime) return;
    
    const startRealTimeUpdates = () => {
      refreshIntervalRef.current = setInterval(() => {
        loadAnalytics(true);
      }, refreshInterval);
    };
    
    startRealTimeUpdates();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [realTime, refreshInterval]);
  
  // Load analytics data
  const loadAnalytics = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      // Calculate date range based on selected period
      let startDate: string;
      let endDate: string = new Date().toISOString().split('T')[0];
      
      if (dateRange) {
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
      } else {
        const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
        startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      
      // For now, we'll generate mock data
      // In a real implementation, this would call the actual API
      const mockData: RampAnalyticsData = generateMockAnalytics(startDate, endDate);
      
      setAnalyticsData(mockData);
      setLastUpdated(new Date());
      
      if (isRefresh) {
        toast({
          title: 'Analytics Updated',
          description: 'Dashboard data has been refreshed.',
        });
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMsg);
      
      if (!isRefresh) {
        toast({
          title: 'Analytics Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Load analytics on mount and when period changes
  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, config]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  // Format number
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Export data
  const handleExport = () => {
    if (!analyticsData) return;
    
    const csvData = generateCSVExport(analyticsData);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ramp-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: 'Analytics data has been exported to CSV.',
    });
  };
  
  // Render loading state
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={() => loadAnalytics()} 
            variant="outline" 
            className="mt-4 w-full"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!analyticsData) return null;
  
  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </div>
            <div className="flex items-center gap-2">
              {realTime && (
                <Badge variant="outline" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadAnalytics(true)}
                disabled={loading}
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
              {showExport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Transaction analytics and insights</span>
            <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalTransactions)}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+12.5%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData.overview.totalVolume)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+8.2%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData.overview.averageTransaction)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-red-500">-3.1%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(analyticsData.overview.conversionRate)}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+5.7%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData.overview.totalFees)}</p>
              </div>
              <PieChart className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+15.3%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Transaction Types */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>On-ramp (Buy)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(analyticsData.byType.onramp.transactions)}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(analyticsData.byType.onramp.volume)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Off-ramp (Sell)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(analyticsData.byType.offramp.transactions)}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(analyticsData.byType.offramp.volume)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Transaction Status */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analyticsData.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={status === 'completed' ? 'default' : status === 'pending' ? 'outline' : 'destructive'}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                      <span className="font-medium">{formatNumber(count)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Cryptocurrencies</CardTitle>
              <CardDescription>Most traded assets by volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topAssets.map((asset, index) => (
                  <div key={asset.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-4">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{asset.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(asset.transactions)} transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(asset.volume)}</p>
                      <p className="text-sm text-muted-foreground">{formatPercentage(asset.percentage)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Popular payment methods used</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topPaymentMethods.map((method, index) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-4">#{index + 1}</span>
                      <div>
                        <p className="font-medium">
                          {method.method.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(method.transactions)}</p>
                      <p className="text-sm text-muted-foreground">{formatPercentage(method.percentage)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Transaction volume by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.geographical.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-4">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{country.country}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(country.transactions)} transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(country.volume)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Generate mock analytics data
function generateMockAnalytics(startDate: string, endDate: string): RampAnalyticsData {
  return {
    overview: {
      totalTransactions: 1247,
      totalVolume: 2840500,
      averageTransaction: 2275,
      conversionRate: 68.5,
      totalFees: 14202
    },
    byType: {
      onramp: {
        transactions: 834,
        volume: 1896300,
        conversionRate: 72.1
      },
      offramp: {
        transactions: 413,
        volume: 944200,
        conversionRate: 61.8
      }
    },
    byStatus: {
      completed: 1089,
      pending: 97,
      failed: 43,
      cancelled: 18
    },
    topAssets: [
      { symbol: 'ETH', transactions: 456, volume: 1245600, percentage: 43.8 },
      { symbol: 'BTC', transactions: 298, volume: 897300, percentage: 31.6 },
      { symbol: 'USDC', transactions: 287, volume: 456700, percentage: 16.1 },
      { symbol: 'USDT', transactions: 156, volume: 189400, percentage: 6.7 },
      { symbol: 'MATIC', transactions: 50, volume: 51500, percentage: 1.8 }
    ],
    topPaymentMethods: [
      { method: 'CARD_PAYMENT', transactions: 523, percentage: 41.9 },
      { method: 'APPLE_PAY', transactions: 287, percentage: 23.0 },
      { method: 'GOOGLE_PAY', transactions: 213, percentage: 17.1 },
      { method: 'MANUAL_BANK_TRANSFER', transactions: 156, percentage: 12.5 },
      { method: 'AUTO_BANK_TRANSFER', transactions: 68, percentage: 5.5 }
    ],
    timeSeriesData: [],
    geographical: [
      { country: 'United States', transactions: 456, volume: 1234500 },
      { country: 'United Kingdom', transactions: 234, volume: 567800 },
      { country: 'Canada', transactions: 187, volume: 345600 },
      { country: 'Germany', transactions: 123, volume: 289400 },
      { country: 'France', transactions: 98, volume: 198700 }
    ]
  };
}

// Generate CSV export
function generateCSVExport(data: RampAnalyticsData): string {
  const headers = [
    'Metric,Value',
    'Total Transactions,' + data.overview.totalTransactions,
    'Total Volume,' + data.overview.totalVolume,
    'Average Transaction,' + data.overview.averageTransaction,
    'Conversion Rate,' + data.overview.conversionRate + '%',
    '',
    'Asset,Transactions,Volume,Percentage',
    ...data.topAssets.map(asset => 
      `${asset.symbol},${asset.transactions},${asset.volume},${asset.percentage}%`
    )
  ];
  
  return headers.join('\n');
}

export default RampAnalyticsDashboard;
