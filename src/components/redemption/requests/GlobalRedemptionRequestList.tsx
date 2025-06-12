// Global redemption request list component for displaying all redemption requests
// Provides list interface with filtering, sorting, and pagination for global access
// Updated to fix syntax error - cache clear

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  Users
} from 'lucide-react';
import { useGlobalRedemptions } from '../hooks/useGlobalRedemptions';
import type { RedemptionRequest } from '../types';
import RedemptionApprovalConfigModal from '../components/RedemptionApprovalConfigModal';

interface GlobalRedemptionRequestListProps {
  onViewDetails?: (redemption: RedemptionRequest) => void;
  onCreateNew?: () => void;
  className?: string;
  showFilters?: boolean;
  showBulkActions?: boolean;
  pageSize?: number;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case 'processing':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'settled':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const getVariant = () => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'processing':
        return 'default';
      case 'settled':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getColorClass = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'settled':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Badge variant={getVariant()} className={getColorClass()}>
      <StatusIcon status={status} />
      <span className="ml-1 capitalize">{status}</span>
    </Badge>
  );
};

export function GlobalRedemptionRequestList({
  onViewDetails,
  onCreateNew,
  className = '',
  showFilters = true,
  showBulkActions = false,
  pageSize = 20
}: GlobalRedemptionRequestListProps) {
  // State for approval configuration modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tokenTypeFilter, setTokenTypeFilter] = useState<string>('');
  const [redemptionTypeFilter, setRedemptionTypeFilter] = useState<'standard' | 'interval' | ''>('');
  const [sortField, setSortField] = useState<'submittedAt' | 'tokenAmount' | 'usdcAmount'>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const {
    redemptions,
    loading,
    error,
    totalCount,
    hasMore,
    pagination,
    refresh,
    loadMore
  } = useGlobalRedemptions({
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
    tokenType: tokenTypeFilter || undefined,
    redemptionType: redemptionTypeFilter || undefined,
    enableRealtime: true
  });

  // Filter redemptions based on search term
  const filteredRedemptions = React.useMemo(() => {
    if (!searchTerm.trim()) return redemptions;
    
    const term = searchTerm.toLowerCase();
    return redemptions.filter(redemption =>
      redemption.investorName?.toLowerCase().includes(term) ||
      redemption.investorId?.toLowerCase().includes(term) ||
      redemption.tokenType.toLowerCase().includes(term) ||
      redemption.sourceWallet.toLowerCase().includes(term) ||
      redemption.destinationWallet.toLowerCase().includes(term) ||
      redemption.id.toLowerCase().includes(term)
    );
  }, [redemptions, searchTerm]);

  // Sort redemptions
  const sortedRedemptions = React.useMemo(() => {
    return [...filteredRedemptions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'submittedAt':
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
          break;
        case 'tokenAmount':
          aValue = a.tokenAmount;
          bValue = b.tokenAmount;
          break;
        case 'usdcAmount':
          aValue = a.usdcAmount;
          bValue = b.usdcAmount;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  }, [filteredRedemptions, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewDetails = (redemption: RedemptionRequest) => {
    if (onViewDetails) {
      onViewDetails(redemption);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  const formatTokenAmount = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTokenTypeFilter('');
    setRedemptionTypeFilter('');
    setCurrentPage(1);
  };

  return (
    <>
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Global Redemption Requests
                <Badge variant="outline">{totalCount} total</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                All redemption requests across the platform
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsConfigModalOpen(true)} variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure Approvals
              </Button>
              <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tokenTypeFilter} onValueChange={setTokenTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All token types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All token types</SelectItem>
                  <SelectItem value="ERC-20">ERC-20</SelectItem>
                  <SelectItem value="ERC-721">ERC-721</SelectItem>
                  <SelectItem value="ERC-1155">ERC-1155</SelectItem>
                  <SelectItem value="ERC-1400">ERC-1400</SelectItem>
                  <SelectItem value="ERC-3525">ERC-3525</SelectItem>
                  <SelectItem value="ERC-4626">ERC-4626</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Select value={redemptionTypeFilter} onValueChange={(value) => setRedemptionTypeFilter(value as '' | 'standard' | 'interval')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="interval">Interval</SelectItem>
                  </SelectContent>
                </Select>
                
                {(searchTerm || statusFilter || tokenTypeFilter || redemptionTypeFilter) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Error loading redemption requests: {error}</p>
              <Button onClick={refresh} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {!error && sortedRedemptions.length === 0 && !loading && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No redemption requests found</p>
              {(searchTerm || statusFilter || tokenTypeFilter || redemptionTypeFilter) && (
                <Button onClick={clearFilters} variant="outline" className="mt-4">
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {(sortedRedemptions.length > 0 || loading) && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Investor</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('tokenAmount')}>
                        Token Amount
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('usdcAmount')}>
                        USDC Value
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('submittedAt')}>
                        Submitted
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && redemptions.length === 0 ? (
                    // Loading skeleton
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    sortedRedemptions.map((redemption) => (
                      <TableRow key={redemption.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm">
                          {redemption.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{redemption.investorName || 'Anonymous'}</div>
                            {redemption.investorId && (
                              <div className="text-xs text-gray-500 font-mono">
                                {redemption.investorId.substring(0, 12)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatTokenAmount(redemption.tokenAmount)}</div>
                            <div className="text-xs text-gray-500">{redemption.tokenType}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(redemption.usdcAmount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={redemption.status} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {redemption.redemptionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(redemption.submittedAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(redemption)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} requests
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={pagination.page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Load More Button (alternative to pagination) */}
          {hasMore && !pagination && (
            <div className="text-center mt-6">
              <Button onClick={loadMore} variant="outline" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Redemption Approval Configuration Modal */}
      <RedemptionApprovalConfigModal
        open={isConfigModalOpen}
        onOpenChange={setIsConfigModalOpen}
        onSuccess={refresh}
      />
    </>
  );
}
