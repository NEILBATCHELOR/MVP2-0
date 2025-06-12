import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign,
  Calendar,
  Target,
  RefreshCw
} from 'lucide-react';
import { RedemptionRequest } from '../types';
import { cn } from '@/lib/utils';

interface RedemptionMetricsProps {
  redemptions: RedemptionRequest[];
  loading: boolean;
  className?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export const RedemptionMetrics: React.FC<RedemptionMetricsProps> = ({
  redemptions,
  loading,
  className,
  timeRange = '30d'
}) => {
  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const filterDate = new Date();
    
    switch (timeRange) {
      case '7d':
        filterDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        filterDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        filterDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filteredRedemptions = redemptions.filter(r => 
      new Date(r.submittedAt) >= filterDate
    );

    // Basic metrics
    const totalRequests = filteredRedemptions.length;
    const totalValue = filteredRedemptions.reduce((sum, r) => sum + (r.usdcAmount || 0), 0);
    const settledCount = filteredRedemptions.filter(r => r.status === 'settled').length;
    const settledValue = filteredRedemptions
      .filter(r => r.status === 'settled')
      .reduce((sum, r) => sum + (r.usdcAmount || 0), 0);

    // Processing times
    const settledRequests = filteredRedemptions.filter(r => 
      r.status === 'settled' && r.settledAt
    );
    
    const processingTimes = settledRequests.map(r => {
      const submitted = new Date(r.submittedAt);
      const settled = new Date(r.settledAt!);
      return Math.abs(settled.getTime() - submitted.getTime()) / (1000 * 60 * 60); // hours
    });

    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    // Success rate
    const successRate = totalRequests > 0 ? (settledCount / totalRequests) * 100 : 0;

    // Daily trends
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayRequests = filteredRedemptions.filter(r => {
        const submittedDate = new Date(r.submittedAt);
        return submittedDate >= dayStart && submittedDate <= dayEnd;
      });

      const daySettled = dayRequests.filter(r => r.status === 'settled');
      
      dailyData.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        requests: dayRequests.length,
        settled: daySettled.length,
        value: dayRequests.reduce((sum, r) => sum + (r.usdcAmount || 0), 0)
      });
    }

    // Status distribution
    const statusCounts = filteredRedemptions.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: getStatusColor(status)
    }));

    // Token type distribution
    const tokenTypeCounts = filteredRedemptions.reduce((acc, r) => {
      acc[r.tokenType] = (acc[r.tokenType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tokenTypeData = Object.entries(tokenTypeCounts).map(([type, count]) => ({
      name: type,
      value: count
    }));

    return {
      totalRequests,
      totalValue,
      settledCount,
      settledValue,
      avgProcessingTime,
      successRate,
      dailyData,
      statusData,
      tokenTypeData
    };
  }, [redemptions, timeRange]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#3b82f6';
      case 'processing': return '#8b5cf6';
      case 'settled': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format time
  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    }
    return `${Math.round(hours / 24)}d`;
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-lg text-gray-600">Loading metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average Processing Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(metrics.avgProcessingTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {metrics.settledCount} completed requests
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.successRate)}%</div>
            <Progress value={metrics.successRate} className="mt-2" />
          </CardContent>
        </Card>

        {/* Settlement Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settlement Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.settledValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((metrics.settledValue / metrics.totalValue) * 100)}% of total value
            </p>
          </CardContent>
        </Card>

        {/* Daily Average */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.totalRequests / 7)}
            </div>
            <p className="text-xs text-muted-foreground">
              Requests per day (7-day avg)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#3b82f6" name="Requests" />
                <Bar dataKey="settled" fill="#10b981" name="Settled" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Value Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Value Trends (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value) => [formatCurrency(Number(value)), 'Value']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Token Type Breakdown */}
      {metrics.tokenTypeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Token Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.tokenTypeData.map((token, index) => {
                const percentage = (token.value / metrics.totalRequests) * 100;
                return (
                  <div key={token.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{token.name}</span>
                    <div className="flex items-center space-x-3">
                      <Progress value={percentage} className="w-24" />
                      <span className="text-sm text-gray-600">
                        {token.value} ({Math.round(percentage)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RedemptionMetrics;
