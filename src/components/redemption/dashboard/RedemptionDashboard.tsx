import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
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
  Wallet,
  Eye,
  User
} from 'lucide-react';
import { useRedemptions } from '../hooks/useRedemptions';
import { useRedemptionNotifications } from '../notifications';
import { RedemptionMetrics } from './RedemptionMetrics';
import { RedemptionFilters, FilterState } from './RedemptionFilters';
import { RequestStatusOverview } from './RequestStatusOverview';
import { RedemptionStatusType } from '../types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/auth/useAuth';

// Import redemption components
import { RedemptionRequestForm } from '../requests/RedemptionRequestForm';
import { RedemptionRequestList } from '../requests/RedemptionRequestList';
import { BulkRedemptionForm } from '../requests/BulkRedemptionForm';
import { ApproverDashboard } from '../approvals/ApproverDashboard';
import { RedemptionCalendar } from '../calendar/RedemptionCalendar';
import { NAVManagement } from '../calendar/NAVManagement';
import { RedemptionRequestDetails } from '../requests/RedemptionRequestDetails';
import RedemptionApprovalConfigModal from '../components/RedemptionApprovalConfigModal';

interface RedemptionDashboardProps {
  investorId?: string;
  className?: string;
  showCreateButton?: boolean;
  onCreateRedemption?: () => void;
}

export const RedemptionDashboard: React.FC<RedemptionDashboardProps> = ({
  investorId,
  className,
  showCreateButton = true,
  onCreateRedemption
}) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [isBulkRequestOpen, setIsBulkRequestOpen] = useState(false);
  const [isConfigureApproversOpen, setIsConfigureApproversOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Use the provided investorId or fallback to the current user's ID
  const currentInvestorId = investorId || user?.id || null;

  const {
    redemptions,
    loading,
    error,
    totalCount,
    realtimeConnected,
    refreshRedemptions,
    getRedemptionsByStatus,
    cancelRedemption
  } = useRedemptions({
    investorId: currentInvestorId,
    status: filters.status as RedemptionStatusType,
    enableRealtime: true,
    autoRefresh: true,
    refreshInterval: 5000 // 5 seconds background refresh
  });

  const { addNotification } = useRedemptionNotifications();

  // Calculate metrics
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
        message: 'Redemption data has been updated'
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

  // Handle view details
  const handleViewDetails = (requestId: string) => {
    setSelectedRequestId(requestId);
    setIsDetailsOpen(true);
  };

  // Handle close details
  const handleCloseDetails = () => {
    setSelectedRequestId(null);
    setIsDetailsOpen(false);
  };

  const handleRequestCreated = () => {
    setIsCreateRequestOpen(false);
    setIsBulkRequestOpen(false);
    refreshRedemptions();
    addNotification({
      type: 'success',
      title: 'Request Created',
      message: 'Redemption request has been submitted successfully'
    });
  };

  // Loading state
  if (loading && redemptions.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Redemption Management</h1>
              <p className="text-muted-foreground">Loading your redemption dashboard...</p>
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Coins className="h-8 w-8 text-primary" />
              Redemption Management
              {/* Connection Status Indicator */}
              <div className="flex items-center gap-2 ml-4">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  realtimeConnected ? "bg-green-500" : "bg-yellow-500"
                )} />
                <span className="text-sm text-muted-foreground">
                  {realtimeConnected ? "Live" : "Polling"}
                </span>
              </div>
            </h1>
            <p className="text-muted-foreground">
              Manage token redemptions and track settlement status
              <span className="ml-2 text-xs">
                • Auto-refresh: 5s • {realtimeConnected ? "Realtime connected" : "Background polling active"}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsConfigureApproversOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configure Approvers
            </Button>
            <Button
              onClick={() => setIsBulkRequestOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Bulk Request
            </Button>
            <Button
              onClick={handleCreateRedemption}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Request
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <span>Active: {totalCount - settledCount - rejectedCount}</span>
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
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <div className="p-1.5 rounded-md bg-[#2563eb]/10">
                  {(pendingCount + approvedCount) > 0 ? (
                    <Clock className="h-4 w-4 text-[#2563eb]" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-[#2563eb]" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{pendingCount + approvedCount}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>Pending: {pendingCount} | Approved: {approvedCount}</span>
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
                <span>Completion Rate: {completionRate}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Requests */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Recent Requests
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
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No redemption requests found</p>
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
                    <div className="space-y-4">
                      {redemptions.slice(0, 5).map((redemption) => (
                        <div
                          key={redemption.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          {/* Header row with main info and status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-base">
                                  {redemption.tokenAmount.toLocaleString()} {redemption.tokenType}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {redemption.redemptionType === 'standard' ? 'Standard' : 'Interval Fund'}
                                </Badge>
                                {redemption.isBulkRedemption && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    Bulk ({redemption.investorCount || 1})
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Value: <span className="font-medium text-green-600">{formatCurrency(redemption.usdcAmount || 0)} USDC</span>
                                {redemption.conversionRate && redemption.conversionRate !== 1 && (
                                  <span className="ml-2">
                                    @ {redemption.conversionRate.toFixed(3)} rate
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge 
                                className={getStatusColor(redemption.status)}
                                variant="outline"
                              >
                                {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(redemption.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Investor Information Row */}
                          <div className="mb-3 p-2 bg-muted/30 rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {redemption.investorName || 'Unknown Investor'}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    ID: {redemption.investorId ? redemption.investorId.slice(0, 8) + '...' : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => handleViewDetails(redemption.id)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>

                          {/* Details grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {/* Left column */}
                            <div className="space-y-2">
                              {redemption.sourceWallet && (
                                <div className="flex items-center gap-2">
                                  <Wallet className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">From:</span>
                                  <span className="font-mono text-xs">
                                    {redemption.sourceWallet.slice(0, 6)}...{redemption.sourceWallet.slice(-4)}
                                  </span>
                                </div>
                              )}
                              {redemption.requiredApprovals > 0 && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Approvals:</span>
                                  <span className="font-medium">
                                    {redemption.requiredApprovals} required
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Right column */}
                            <div className="space-y-2">
                              {redemption.destinationWallet && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">To:</span>
                                  <span className="font-mono text-xs">
                                    {redemption.destinationWallet.slice(0, 6)}...{redemption.destinationWallet.slice(-4)}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Activity className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Request ID:</span>
                                <span className="font-mono text-xs">
                                  {redemption.id.slice(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status timeline indicators */}
                          {(redemption.validatedAt || redemption.approvedAt || redemption.executedAt || redemption.settledAt) && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {redemption.validatedAt && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-blue-500" />
                                    <span>Validated {new Date(redemption.validatedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {redemption.approvedAt && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span>Approved {new Date(redemption.approvedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {redemption.executedAt && (
                                  <div className="flex items-center gap-1">
                                    <Activity className="h-3 w-3 text-purple-500" />
                                    <span>Executed {new Date(redemption.executedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {redemption.settledAt && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span>Settled {new Date(redemption.settledAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Notes or rejection reason */}
                          {(redemption.notes || redemption.rejectionReason) && (
                            <div className="mt-3 pt-3 border-t">
                              {redemption.rejectionReason && (
                                <div className="flex items-start gap-2 text-sm">
                                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                  <div>
                                    <span className="text-red-600 font-medium">Rejection Reason:</span>
                                    <p className="text-red-600">{redemption.rejectionReason}</p>
                                    {redemption.rejectedBy && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Rejected by {redemption.rejectedBy}
                                        {redemption.rejectionTimestamp && (
                                          <span> on {new Date(redemption.rejectionTimestamp).toLocaleDateString()}</span>
                                        )}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                              {redemption.notes && !redemption.rejectionReason && (
                                <div className="flex items-start gap-2 text-sm">
                                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <span className="text-muted-foreground">Notes:</span>
                                    <p className="text-muted-foreground">{redemption.notes}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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

              {/* Quick Actions */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleCreateRedemption}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Request
                  </Button>
                  <Button
                    onClick={() => setIsBulkRequestOpen(true)}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Bulk Request
                  </Button>
                  <Button
                    onClick={() => setIsConfigureApproversOpen(true)}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Approvers
                  </Button>
                  <Button
                    onClick={() => setActiveTab('approvals')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Approvals
                  </Button>
                  <Button
                    onClick={() => setActiveTab('calendar')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Redemption Calendar
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
                <CardTitle>Request Management</CardTitle>
              </CardHeader>
              <CardContent>
                <RedemptionFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  loading={loading}
                />
                <div className="mt-6">
                  <RedemptionRequestList
                    investorId={currentInvestorId}
                    showBulkActions={true}
                    onCreateNew={handleCreateRedemption}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>Approval Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ApproverDashboard approverId={currentInvestorId || 'current-user'} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>Redemption Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                <RedemptionCalendar 
                  windows={[]} // TODO: Connect to actual redemption windows data
                    onCreateRedemption={handleCreateRedemption}
                />
                <NAVManagement 
                  fundId="default-fund" // TODO: Use actual fund ID
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
                <CardTitle>Analytics & Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <RedemptionMetrics 
                  redemptions={redemptions}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={isCreateRequestOpen} onOpenChange={setIsCreateRequestOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Redemption Request</DialogTitle>
              <DialogDescription>
                Submit a new redemption request to convert your tokens to USDC
              </DialogDescription>
            </DialogHeader>
            <RedemptionRequestForm
              investorId={currentInvestorId || 'current-user'}
              onSuccess={handleRequestCreated}
              onCancel={() => setIsCreateRequestOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isBulkRequestOpen} onOpenChange={setIsBulkRequestOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Redemption Request</DialogTitle>
              <DialogDescription>
                Create multiple redemption requests for multiple investors at once
              </DialogDescription>
            </DialogHeader>
            <BulkRedemptionForm
              onSuccess={handleRequestCreated}
              onCancel={() => setIsBulkRequestOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Redemption Request Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Redemption Request Details</DialogTitle>
              <DialogDescription>
                View complete information and status for this redemption request
              </DialogDescription>
            </DialogHeader>
            {selectedRequestId && (
              <RedemptionRequestDetails
                redemptionId={selectedRequestId}
                onClose={handleCloseDetails}
                onEdit={() => {
                  // Open edit form with current request data
                  const request = redemptions.find(r => r.id === selectedRequestId);
                  if (request) {
                    handleCloseDetails();
                    // For now, show alert since edit form needs to be implemented
                    alert(`Edit functionality for request ${request.id.slice(0, 8)}... is coming soon. This would open an edit form with the current request data pre-populated.`);
                    // TODO: Implement proper edit form
                    // setIsEditRequestOpen(true);
                    // setEditingRequest(request);
                  }
                }}
                onCancel={async () => {
                  if (selectedRequestId) {
                    const success = await cancelRedemption(selectedRequestId);
                    if (success) {
                      addNotification({
                        type: 'success',
                        title: 'Request Cancelled',
                        message: 'Redemption request has been cancelled successfully'
                      });
                    } else {
                      addNotification({
                        type: 'error',
                        title: 'Cancel Failed',
                        message: 'Failed to cancel redemption request'
                      });
                    }
                    handleCloseDetails();
                  }
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Configure Approvers Modal */}
        <RedemptionApprovalConfigModal
          open={isConfigureApproversOpen}
          onOpenChange={setIsConfigureApproversOpen}
          onSuccess={() => {
            addNotification({
              type: 'success',
              title: 'Approvers Configured',
              message: 'Redemption approvers have been successfully configured'
            });
            refreshRedemptions(); // Refresh data after configuration change
          }}
        />
      </div>
    </div>
  );
};

export default RedemptionDashboard;
