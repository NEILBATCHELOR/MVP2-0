import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  RefreshCw,
  Plus,
  Edit,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Upload,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, subDays, isAfter, isBefore } from 'date-fns';

export interface NAVData {
  id: string;
  fundId: string;
  date: Date;
  nav: number;
  totalAssets: number;
  totalLiabilities: number;
  outstandingShares: number;
  previousNAV?: number;
  change?: number;
  changePercent?: number;
  source: 'manual' | 'oracle' | 'calculated' | 'administrator';
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NAVCalculationInput {
  totalAssets: number;
  totalLiabilities: number;
  outstandingShares: number;
  date: Date;
  notes?: string;
}

export interface OracleConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey?: string;
  refreshInterval: number; // minutes
  enabled: boolean;
  lastUpdate?: Date;
  lastValue?: number;
  status: 'active' | 'error' | 'disabled';
}

interface NAVManagementProps {
  fundId: string;
  navHistory?: NAVData[];
  oracleConfigs?: OracleConfig[];
  onNAVCreate?: (data: NAVCalculationInput) => void;
  onNAVUpdate?: (id: string, data: Partial<NAVData>) => void;
  onNAVValidate?: (id: string) => void;
  onOracleRefresh?: (oracleId: string) => void;
  onOracleUpdate?: (id: string, config: Partial<OracleConfig>) => void;
  className?: string;
}

export const NAVManagement: React.FC<NAVManagementProps> = ({
  fundId,
  navHistory = [],
  oracleConfigs = [],
  onNAVCreate,
  onNAVUpdate,
  onNAVValidate,
  onOracleRefresh,
  onOracleUpdate,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'oracles'>('current');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNAVData, setNewNAVData] = useState<NAVCalculationInput>({
    totalAssets: 0,
    totalLiabilities: 0,
    outstandingShares: 0,
    date: new Date(),
    notes: ''
  });
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Calculate current NAV data
  const currentNAV = useMemo(() => {
    if (!navHistory || navHistory.length === 0) return null;
    
    const sorted = [...navHistory].sort((a, b) => b.date.getTime() - a.date.getTime());
    return sorted[0];
  }, [navHistory]);

  // Calculate NAV trend data for charts
  const navTrendData = useMemo(() => {
    const now = new Date();
    const daysBack = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[timeRange];

    const cutoffDate = subDays(now, daysBack);
    
    return (navHistory || [])
      .filter(nav => isAfter(nav.date, cutoffDate))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(nav => ({
        date: format(nav.date, 'MMM d'),
        nav: nav.nav,
        change: nav.change || 0,
        changePercent: nav.changePercent || 0
      }));
  }, [navHistory, timeRange]);

  // Calculate NAV statistics
  const navStats = useMemo(() => {
    if (!navHistory || navHistory.length === 0) return null;

    const values = navHistory.map(n => n.nav);
    const changes = navHistory.map(n => n.changePercent || 0).filter(c => c !== 0);
    
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const avgChange = changes.length > 0 ? changes.reduce((sum, c) => sum + c, 0) / changes.length : 0;
    const volatility = changes.length > 0 ? Math.sqrt(changes.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / changes.length) : 0;

    return {
      highest,
      lowest,
      avgChange,
      volatility,
      totalDataPoints: navHistory.length,
      lastValidated: navHistory.find(n => n.validated)?.validatedAt
    };
  }, [navHistory]);

  // Calculate NAV from inputs
  const calculateNAV = (assets: number, liabilities: number, shares: number): number => {
    if (shares === 0) return 0;
    return (assets - liabilities) / shares;
  };

  // Handle NAV creation
  const handleNAVCreate = () => {
    if (newNAVData.outstandingShares === 0) return;
    
    onNAVCreate?.(newNAVData);
    setIsCreateDialogOpen(false);
    setNewNAVData({
      totalAssets: 0,
      totalLiabilities: 0,
      outstandingShares: 0,
      date: new Date(),
      notes: ''
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  // Get trend color
  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Get validation status color
  const getValidationColor = (validated: boolean) => {
    return validated 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  // Get oracle status color
  const getOracleStatusColor = (status: OracleConfig['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'disabled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">NAV Management</h2>
          <p className="text-sm text-gray-600">
            Monitor and manage Net Asset Value for interval fund redemptions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add NAV Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add NAV Entry</DialogTitle>
                <DialogDescription>
                  Enter the fund's financial data to calculate and record the Net Asset Value.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalAssets">Total Assets ($)</Label>
                    <Input
                      id="totalAssets"
                      type="number"
                      value={newNAVData.totalAssets || ''}
                      onChange={(e) => setNewNAVData(prev => ({ 
                        ...prev, 
                        totalAssets: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="totalLiabilities">Total Liabilities ($)</Label>
                    <Input
                      id="totalLiabilities"
                      type="number"
                      value={newNAVData.totalLiabilities || ''}
                      onChange={(e) => setNewNAVData(prev => ({ 
                        ...prev, 
                        totalLiabilities: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="outstandingShares">Outstanding Shares</Label>
                  <Input
                    id="outstandingShares"
                    type="number"
                    value={newNAVData.outstandingShares || ''}
                    onChange={(e) => setNewNAVData(prev => ({ 
                      ...prev, 
                      outstandingShares: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="navDate">NAV Date</Label>
                  <Input
                    id="navDate"
                    type="datetime-local"
                    value={format(newNAVData.date, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setNewNAVData(prev => ({ 
                      ...prev, 
                      date: new Date(e.target.value) 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={newNAVData.notes || ''}
                    onChange={(e) => setNewNAVData(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    placeholder="Additional notes about this NAV calculation..."
                  />
                </div>
                
                {/* NAV Preview */}
                {newNAVData.outstandingShares > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Calculated NAV: {formatCurrency(calculateNAV(
                          newNAVData.totalAssets,
                          newNAVData.totalLiabilities,
                          newNAVData.outstandingShares
                        ))}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Net Assets: {formatCurrency(newNAVData.totalAssets - newNAVData.totalLiabilities)} ÷ {newNAVData.outstandingShares} shares
                    </p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleNAVCreate} 
                  disabled={newNAVData.outstandingShares === 0}
                >
                  Add NAV Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Current NAV Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current NAV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentNAV ? formatCurrency(currentNAV.nav) : 'N/A'}
            </div>
            {currentNAV?.change && (
              <p className={cn("text-xs flex items-center", getTrendColor(currentNAV.change))}>
                {currentNAV.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {formatPercent(currentNAV.changePercent || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validation Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {currentNAV ? (
              <div>
                <Badge className={getValidationColor(currentNAV.validated)}>
                  {currentNAV.validated ? 'Validated' : 'Pending'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentNAV.validated ? `By ${currentNAV.validatedBy}` : 'Awaiting validation'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No NAV data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{navStats?.totalDataPoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              Historical entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volatility</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {navStats ? formatPercent(navStats.volatility) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Standard deviation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* NAV Chart */}
      <Card>
        <CardHeader>
          <CardTitle>NAV Trend ({timeRange})</CardTitle>
        </CardHeader>
        <CardContent>
          {navTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={navTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(Number(value)), 
                    name === 'nav' ? 'NAV' : name
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="nav" 
                  stroke="#3b82f6" 
                  fill="#dbeafe"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No NAV data available for the selected time range</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('current')}
            className={cn(
              "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === 'current'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Current NAV
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === 'history'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            NAV History ({navHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('oracles')}
            className={cn(
              "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === 'oracles'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Oracle Feeds ({oracleConfigs?.length || 0})
          </button>
        </nav>
      </div>

      {/* Current NAV Tab */}
      {activeTab === 'current' && currentNAV && (
        <Card>
          <CardHeader>
            <CardTitle>Current NAV Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">NAV per Share</Label>
                  <p className="text-xl font-bold">{formatCurrency(currentNAV.nav)}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600">Total Assets</Label>
                  <p className="text-lg">{formatCurrency(currentNAV.totalAssets)}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600">Total Liabilities</Label>
                  <p className="text-lg">{formatCurrency(currentNAV.totalLiabilities)}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600">Net Assets</Label>
                  <p className="text-lg font-medium">
                    {formatCurrency(currentNAV.totalAssets - currentNAV.totalLiabilities)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">Outstanding Shares</Label>
                  <p className="text-lg">{currentNAV.outstandingShares.toLocaleString()}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600">Last Updated</Label>
                  <p className="text-lg">{format(currentNAV.date, 'PPP p')}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600">Source</Label>
                  <Badge variant="secondary">{currentNAV.source}</Badge>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600">Validation Status</Label>
                  <div className="flex items-center space-x-2">
                    <Badge className={getValidationColor(currentNAV.validated)}>
                      {currentNAV.validated ? 'Validated' : 'Pending'}
                    </Badge>
                    {!currentNAV.validated && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onNAVValidate?.(currentNAV.id)}
                      >
                        Validate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {currentNAV.notes && (
              <div className="mt-6 pt-6 border-t">
                <Label className="text-sm text-gray-600">Notes</Label>
                <p className="text-sm mt-1">{currentNAV.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* NAV History Tab */}
      {activeTab === 'history' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>NAV</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Net Assets</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(navHistory || [])
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((nav) => (
                <TableRow key={nav.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{format(nav.date, 'MMM d, yyyy')}</p>
                      <p className="text-xs text-gray-500">{format(nav.date, 'h:mm a')}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-mono">{formatCurrency(nav.nav)}</p>
                  </TableCell>
                  <TableCell>
                    {nav.changePercent !== undefined && (
                      <div className={cn("flex items-center", getTrendColor(nav.changePercent))}>
                        {nav.changePercent > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : nav.changePercent < 0 ? (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        ) : null}
                        <span className="text-sm">{formatPercent(nav.changePercent)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(nav.totalAssets - nav.totalLiabilities)}
                  </TableCell>
                  <TableCell>
                    {nav.outstandingShares.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{nav.source}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getValidationColor(nav.validated)}>
                      {nav.validated ? 'Validated' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {!nav.validated && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onNAVValidate?.(nav.id)}
                        >
                          Validate
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Oracle Feeds Tab */}
      {activeTab === 'oracles' && (
        <Card>
          <CardHeader>
            <CardTitle>Oracle Price Feeds</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead>Last Value</TableHead>
                  <TableHead>Refresh Interval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(oracleConfigs || []).map((oracle) => (
                  <TableRow key={oracle.id}>
                    <TableCell>
                      <p className="font-medium">{oracle.name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-mono text-gray-600">
                        {oracle.endpoint.substring(0, 50)}...
                      </p>
                    </TableCell>
                    <TableCell>
                      {oracle.lastUpdate ? (
                        <div>
                          <p className="text-sm">{format(oracle.lastUpdate, 'MMM d, yyyy')}</p>
                          <p className="text-xs text-gray-500">{format(oracle.lastUpdate, 'h:mm a')}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {oracle.lastValue ? formatCurrency(oracle.lastValue) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {oracle.refreshInterval} minutes
                    </TableCell>
                    <TableCell>
                      <Badge className={getOracleStatusColor(oracle.status)}>
                        {oracle.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onOracleRefresh?.(oracle.id)}
                          disabled={oracle.status === 'disabled'}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NAVManagement;
