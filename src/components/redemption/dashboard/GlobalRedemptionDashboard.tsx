import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Users,
  RefreshCw,
  Plus,
  Coins,
  Calendar,
  Settings,
  Activity,
  FileText,
  Globe,
  Shield
} from 'lucide-react';
import { useGlobalRedemptions } from '../hooks/useGlobalRedemptions';
import { useRedemptionNotifications } from '../notifications';
import { GlobalRedemptionMetrics } from './GlobalRedemptionMetrics';
import { RedemptionFilters, FilterState } from './RedemptionFilters';
import { RequestStatusOverview } from './RequestStatusOverview';
import { RedemptionStatusType } from '../types';
import { cn } from '@/lib/utils';

// Import global redemption components
import { GlobalRedemptionRequestForm } from '../requests/GlobalRedemptionRequestForm';
import { GlobalRedemptionRequestList } from '../requests/GlobalRedemptionRequestList';
import { RedemptionCalendar } from '../calendar/RedemptionCalendar';
import { NAVManagement } from '../calendar/NAVManagement';

interface GlobalRedemptionDashboardProps {
  className?: string;
  showCreateButton?: boolean;
  onCreateRedemption?: () => void;
}

export const GlobalRedemptionDashboard: React.FC<GlobalRedemptionDashboardProps> = ({
  className,
  showCreateButton = true,
  onCreateRedemption
}) => {
  const [filters, setFilters] = useState<FilterState>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);

  const {
    redemptions,
    loading,
    error,
    totalCount,
    metrics,
    refreshRedemptions,
    getRedemptionsByStatus
  } = useGlobalRedemptions({
    status: filters.status as RedemptionStatusType,
    enableRealtime: true
  });

  const { addNotification } = useRedemptionNotifications();

  // Calculate status counts
  const pendingCount = getRedemptionsByStatus('pending').length;
  const approvedCount = getRedemptionsByStatus('approved').length;
  const processingCount = getRedemptionsByStatus('processing').length;
  const settledCount = getRedemptionsByStatus('settled').length;
  const rejectedCount = getRedemptionsByStatus('rejected').length;

  const totalValue = redemptions.reduce((sum, r) => sum + (r.usdcAmount || 0), 0);
  const settledValue = getRedemptionsByStatus('settled').reduce((sum, r) => sum + (r.usdcAmount || 0), 0);

  // Calculate completion rate
  const completionRate = totalCount > 0 ? Math.round((settledCount / totalCount) * 100) : 0;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'settled':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshRedemptions();
      addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: 'Global redemption data has been updated'
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh redemption data'
      });
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

  // Handle create redemption
  const handleCreateRedemption = () => {
    if (onCreateRedemption) {
      onCreateRedemption();
    } else {
      setIsCreateRequestOpen(true);
    }
  };

  const handleRequestCreated = () => {
    setIsCreateRequestOpen(false);
    refreshRedemptions();
    addNotification({
      type: 'success',
      title: 'Request Created',
      message: 'Global redemption request has been submitted successfully'
    });
  };

  // Loading state
  if (loading && redemptions.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Globe className="h-8 w-8 text-primary" />
                Global Redemption Access
              </h1>
              <p className="text-muted-foreground">Loading global redemption dashboard...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("w-full", className)}>
        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={handleRefresh}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header with Global Access Notice */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Globe className="h-8 w-8 text-primary" />
              Global Redemption Access
            </h1>
            <p className="text-muted-foreground">
              Open access to token redemption system • No authentication required
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Shield className="h-3 w-3 mr-1" />
                Global Access Mode
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Activity className="h-3 w-3 mr-1" />
                Real-time Updates
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateRedemption}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Redemption
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="p-4 pb-2 space-y-1.5">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <div className="p-1.5 rounded-md bg-[#2563eb]/10">
                  <Users className="h-4 w-4 text-[#2563eb]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{totalCount}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>Global Access</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="p-4 pb-2 space-y-1.5">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <div className="p-1.5 rounded-md bg-[#2563eb]/10">
                  <DollarSign className="h-4 w-4 text-[#2563eb]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>Settled: {formatCurrency(settledValue)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="p-4 pb-2 space-y-1.5">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <div className="p-1.5 rounded-md bg-[#2563eb]/10">
                  <Clock className="h-4 w-4 text-[#2563eb]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{pendingCount}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>Auto-approval enabled</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="p-4 pb-2 space-y-1.5">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <div className="p-1.5 rounded-md bg-[#2563eb]/10">
                  <Activity className="h-4 w-4 text-[#2563eb]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{processingCount}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>Rate: {completionRate}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="p-4 pb-2 space-y-1.5">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">Token Types</CardTitle>
                <div className="p-1.5 rounded-md bg-[#2563eb]/10">
                  <Coins className="h-4 w-4 text-[#2563eb]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{metrics?.uniqueTokenTypes || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>Available globally</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requests">All Requests</TabsTrigger>
            <TabsTrigger value="calendar">Schedule</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Requests */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Recent Global Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                  ) : redemptions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No global redemption requests found</p>
                      <Button 
                        onClick={handleCreateRedemption} 
                        variant="outline" 
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Request
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {redemptions.slice(0, 5).map((redemption) => (
                        <div
                          key={redemption.id}
                          className="flex items-center justify-between py-2 border-b last:border-b-0"
                        >
                          <div>
                            <p className="font-medium">
                              {redemption.tokenAmount} {redemption.tokenType}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(redemption.usdcAmount || 0)} • {redemption.investorName || 'Anonymous'} • {new Date(redemption.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={redemption.status === 'settled' ? 'default' : 'secondary'}>
                            {redemption.status}
                          </Badge>
                        </div>
                      ))}
                      {redemptions.length > 5 && (
                        <div className="text-center pt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab('requests')}
                          >
                            View All Requests ({totalCount})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Global Access Info */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Global Access Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">No Authentication Required</p>
                      <p className="text-sm text-green-700">Access redemptions without login</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Auto-Approval</p>
                      <p className="text-sm text-blue-700">Simplified approval process</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900">Global Distribution Access</p>
                      <p className="text-sm text-purple-700">View all available token distributions</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateRedemption}
                    className="w-full justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start Global Redemption
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Status Overview */}
            <RequestStatusOverview
              redemptions={redemptions}
              loading={loading}
              onViewDetails={(id) => setActiveTab('requests')}
              onFilterByStatus={(status) => {
                if (status === 'all') {
                  setFilters({});
                } else {
                  setFilters({ status: status as RedemptionStatusType });
                }
                setActiveTab('requests');
              }}
            />
          </TabsContent>

          <TabsContent value="requests">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Global Request Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RedemptionFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  loading={loading}
                />
                <div className="mt-6">
                  <GlobalRedemptionRequestList
                    showBulkActions={false}
                    onCreateNew={handleCreateRedemption}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Global Redemption Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <RedemptionCalendar 
                    windows={[]} // TODO: Connect to actual redemption windows data
                    onCreateRedemption={handleCreateRedemption}
                  />
                  <NAVManagement 
                    fundId="global-fund" // Global fund ID
                    navHistory={[]} // TODO: Connect to actual NAV data
                    oracleConfigs={[]} // TODO: Connect to actual oracle configurations
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Global Analytics & Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GlobalRedemptionMetrics 
                  refreshInterval={30000}
                  showCharts={true}
                  className=""
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Request Dialog */}
        <Dialog open={isCreateRequestOpen} onOpenChange={setIsCreateRequestOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Create Global Redemption Request
              </DialogTitle>
            </DialogHeader>
            <GlobalRedemptionRequestForm
              onSuccess={handleRequestCreated}
              onCancel={() => setIsCreateRequestOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GlobalRedemptionDashboard;
