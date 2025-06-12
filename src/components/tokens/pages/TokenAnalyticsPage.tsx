import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TokenPageLayout from '../layout/TokenPageLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Activity, Users, BarChart3, TrendingUp, LineChart, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import TokenNavigation from '../components/TokenNavigation';
import { supabase } from '@/infrastructure/database/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatUnits, parseUnits } from 'ethers';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
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

interface TokenAnalytics {
  holders: {
    total: number;
    active: number;
    distribution: { address: string; balance: string; percentage: number }[];
  };
  transactions: {
    total: number;
    daily: { date: string; count: number; volume: string }[];
    types: { type: string; count: number; percentage: number }[];
  };
  activity: {
    totalTransfers: number;
    totalMints: number;
    totalBurns: number;
    totalApprovals: number;
    timeline: { date: string; transfers: number; mints: number; burns: number; approvals: number }[];
  };
}

// Sample data for demo purposes
const generateSampleData = (tokenStandard: string): TokenAnalytics => {
  // Generate dates for the last 30 days
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  // Generate random holders data
  const holders = {
    total: Math.floor(Math.random() * 500) + 50,
    active: Math.floor(Math.random() * 300) + 20,
    distribution: Array.from({ length: 10 }, (_, i) => ({
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      balance: parseUnits((Math.random() * 1000).toFixed(2), 18).toString(),
      percentage: Math.random() * 20
    }))
  };

  // Generate random transaction data
  const transactions = {
    total: Math.floor(Math.random() * 1000) + 100,
    daily: dates.map(date => ({
      date,
      count: Math.floor(Math.random() * 50) + 1,
      volume: parseUnits((Math.random() * 100).toFixed(2), 18).toString()
    })),
    types: [
      { type: 'Transfer', count: Math.floor(Math.random() * 500) + 50, percentage: 0 },
      { type: 'Mint', count: Math.floor(Math.random() * 200) + 10, percentage: 0 },
      { type: 'Burn', count: Math.floor(Math.random() * 100) + 5, percentage: 0 },
      { type: 'Approval', count: Math.floor(Math.random() * 300) + 20, percentage: 0 }
    ]
  };

  // Calculate percentages
  const totalCount = transactions.types.reduce((sum, item) => sum + item.count, 0);
  transactions.types.forEach(item => {
    item.percentage = (item.count / totalCount) * 100;
  });

  // Generate random activity data
  const activity = {
    totalTransfers: transactions.types.find(t => t.type === 'Transfer')?.count || 0,
    totalMints: transactions.types.find(t => t.type === 'Mint')?.count || 0,
    totalBurns: transactions.types.find(t => t.type === 'Burn')?.count || 0,
    totalApprovals: transactions.types.find(t => t.type === 'Approval')?.count || 0,
    timeline: dates.map(date => ({
      date,
      transfers: Math.floor(Math.random() * 30) + 1,
      mints: Math.floor(Math.random() * 10) + 0,
      burns: Math.floor(Math.random() * 5) + 0,
      approvals: Math.floor(Math.random() * 15) + 0
    }))
  };

  return { holders, transactions, activity };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const TokenAnalyticsPage: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { projectId, project, isLoading: projectLoading } = useTokenProjectContext();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<TokenDetails | null>(null);
  const [analytics, setAnalytics] = useState<TokenAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');

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
      
      // In a production environment, you would fetch real analytics data
      // For demo purposes, we'll generate sample data
      setAnalytics(generateSampleData(data.standard));
    } catch (err: any) {
      console.error('Error fetching token:', err);
      setError(err.message || 'Failed to load token details');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatEther = (wei: string): string => {
    try {
      return parseFloat(formatUnits(wei, 18)).toFixed(2);
    } catch {
      return '0.00';
    }
  };

  if (loading) {
    return (
      <TokenPageLayout
        title={token ? `${token.name} Analytics` : 'Token Analytics'}
      >
        <div className="flex justify-center items-center p-12">
          <p>Loading token analytics...</p>
        </div>
      </TokenPageLayout>
    );
  }

  if (error) {
    return (
      <TokenPageLayout
        title="Token Analytics Error"
      >
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </TokenPageLayout>
    );
  }

  return (
    <TokenPageLayout
      title={token ? `${token.name} Analytics` : 'Token Analytics'}
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchToken()}>
                <Clock className="h-4 w-4 mr-2" />
                Refresh Data
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
                This token has not been deployed to a blockchain yet. Analytics will be available after deployment.
              </AlertDescription>
            </Alert>
          )}

          {token.address && analytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Token Holders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold">{formatNumber(analytics.holders.total)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(analytics.holders.active)} active
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Users className="h-4 w-4 text-muted-foreground mr-1" />
                    <span className="text-xs text-muted-foreground">
                      Top holder owns {analytics.holders.distribution[0]?.percentage.toFixed(2)}%
                    </span>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold">{formatNumber(analytics.transactions.total)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(analytics.transactions.daily.slice(-7).reduce((sum, day) => sum + day.count, 0))} last 7d
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Activity className="h-4 w-4 text-muted-foreground mr-1" />
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(analytics.transactions.daily.slice(-1)[0]?.count || 0)} in last 24h
                    </span>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Transaction Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold">
                        {formatEther(analytics.transactions.daily.reduce((sum, day) => 
                          sum + day.volume, 
                          '0'
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {token.symbol}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
                    <span className="text-xs text-muted-foreground">
                      {formatEther(analytics.transactions.daily.slice(-1)[0]?.volume || '0')} {token.symbol} in last 24h
                    </span>
                  </CardFooter>
                </Card>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Activity Overview</h2>
                  <div className="flex gap-2">
                    <Button 
                      variant={timeRange === '7d' ? 'secondary' : 'outline'} 
                      size="sm"
                      onClick={() => setTimeRange('7d')}
                    >
                      7D
                    </Button>
                    <Button 
                      variant={timeRange === '30d' ? 'secondary' : 'outline'} 
                      size="sm"
                      onClick={() => setTimeRange('30d')}
                    >
                      30D
                    </Button>
                    <Button 
                      variant={timeRange === 'all' ? 'secondary' : 'outline'} 
                      size="sm"
                      onClick={() => setTimeRange('all')}
                    >
                      All
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={analytics.activity.timeline.slice(
                          timeRange === '7d' ? -7 : timeRange === '30d' ? -30 : 0
                        )}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorTransfers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorMints" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorBurns" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="transfers" 
                          name="Transfers"
                          stroke="#8884d8" 
                          fillOpacity={1} 
                          fill="url(#colorTransfers)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="mints" 
                          name="Mints"
                          stroke="#82ca9d" 
                          fillOpacity={1} 
                          fill="url(#colorMints)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="burns" 
                          name="Burns"
                          stroke="#ffc658" 
                          fillOpacity={1} 
                          fill="url(#colorBurns)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="transactions" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="holders">Holder Distribution</TabsTrigger>
                  <TabsTrigger value="activity">Activity Breakdown</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction Types</CardTitle>
                      <CardDescription>
                        Breakdown of transaction types for this token
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={analytics.transactions.types}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="type"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {analytics.transactions.types.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatNumber(Number(value))} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium mb-4">Transaction Summary</h3>
                          <ul className="space-y-2">
                            {analytics.transactions.types.map((type, index) => (
                              <li key={index} className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-full mr-2" 
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  ></div>
                                  <span>{type.type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{formatNumber(type.count)}</span>
                                  <span className="text-muted-foreground text-sm">
                                    ({type.percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="holders" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Token Holders</CardTitle>
                      <CardDescription>
                        Distribution of token ownership among top holders
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-4">Address</th>
                                <th className="text-right py-2 px-4">Balance</th>
                                <th className="text-right py-2 px-4">Percentage</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.holders.distribution.map((holder, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-2 px-4 font-mono text-sm">{holder.address}</td>
                                  <td className="py-2 px-4 text-right">{formatEther(holder.balance)}</td>
                                  <td className="py-2 px-4 text-right">{holder.percentage.toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity Breakdown</CardTitle>
                      <CardDescription>
                        Detailed analysis of token activity over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">Transfers</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{formatNumber(analytics.activity.totalTransfers)}</div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">Mints</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{formatNumber(analytics.activity.totalMints)}</div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">Burns</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{formatNumber(analytics.activity.totalBurns)}</div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">Approvals</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{formatNumber(analytics.activity.totalApprovals)}</div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={analytics.activity.timeline.slice(
                            timeRange === '7d' ? -7 : timeRange === '30d' ? -30 : 0
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="transfers" name="Transfers" fill="#8884d8" />
                          <Bar dataKey="mints" name="Mints" fill="#82ca9d" />
                          <Bar dataKey="burns" name="Burns" fill="#ffc658" />
                          <Bar dataKey="approvals" name="Approvals" fill="#ff8042" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}
    </TokenPageLayout>
  );
};

export default TokenAnalyticsPage;