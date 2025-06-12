// Global redemption metrics component for displaying system-wide redemption statistics
// Provides analytics and insights for global redemption activity

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users,
  DollarSign,
  Activity,
  RefreshCw
} from 'lucide-react';
import { globalRedemptionService } from '../services/globalRedemptionService';

interface GlobalMetrics {
  totalRedemptions: number;
  totalVolume: number;
  pendingRedemptions: number;
  completedRedemptions: number;
  rejectedRedemptions: number;
  avgProcessingTime: number;
  successRate: number;
  uniqueTokenTypes: number;
  globalDistributions: number;
}

interface GlobalRedemptionMetricsProps {
  refreshInterval?: number;
  showCharts?: boolean;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function GlobalRedemptionMetrics({
  refreshInterval = 30000, // 30 seconds
  showCharts = true,
  className = ''
}: GlobalRedemptionMetricsProps) {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await globalRedemptionService.getGlobalRedemptionMetrics({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        endDate: new Date().toISOString()
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch metrics');
      }

      setMetrics(response.data || null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching global redemption metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getStatusData = () => {
    if (!metrics) return [];
    return [
      { name: 'Completed', value: metrics.completedRedemptions, color: '#00C49F' },
      { name: 'Pending', value: metrics.pendingRedemptions, color: '#FFBB28' },
      { name: 'Rejected', value: metrics.rejectedRedemptions, color: '#FF8042' }
    ];
  };

  const getVolumeData = () => {
    if (!metrics) return [];
    return [
      { name: 'Total Volume', value: metrics.totalVolume },
      { name: 'Completed Volume', value: (metrics.totalVolume * metrics.successRate) / 100 },
      { name: 'Pending Volume', value: metrics.totalVolume - ((metrics.totalVolume * metrics.successRate) / 100) }
    ];
  };

  if (loading && !metrics) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error loading metrics: {error}</p>
            <Button onClick={fetchMetrics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            No metrics data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusData = getStatusData();
  const volumeData = getVolumeData();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Global Redemption Metrics</h2>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={fetchMetrics} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalRedemptions)}</div>
            <p className="text-xs text-muted-foreground">All-time total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalVolume)}</div>
            <p className="text-xs text-muted-foreground">Token value redeemed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            {metrics.successRate >= 90 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <Badge variant={metrics.successRate >= 90 ? "default" : "destructive"} className="text-xs">
              {metrics.completedRedemptions} / {metrics.totalRedemptions}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgProcessingTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Average completion time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.pendingRedemptions)}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.completedRedemptions)}</div>
            <p className="text-xs text-muted-foreground">Successfully settled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Types</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.uniqueTokenTypes)}</div>
            <p className="text-xs text-muted-foreground">Unique token standards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distributions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.globalDistributions)}</div>
            <p className="text-xs text-muted-foreground">Available for redemption</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Redemption Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Volume Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Redemption Volume Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default GlobalRedemptionMetrics;
