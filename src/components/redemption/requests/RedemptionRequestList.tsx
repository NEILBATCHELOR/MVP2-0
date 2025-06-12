'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  Filter, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  X, 
  Download,
  RefreshCw,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/utils';
import { 
  RedemptionRequest, 
  RedemptionStatusType,
  RedemptionStatus 
} from '../types';
import { useRedemptions } from '../hooks';
import { RedemptionRequestDetails } from './RedemptionRequestDetails';

interface RedemptionRequestListProps {
  investorId?: string;
  showBulkActions?: boolean;
  onViewRequest?: (request: RedemptionRequest) => void;
  onEditRequest?: (request: RedemptionRequest) => void;
  onCreateNew?: () => void;
  className?: string;
}

const StatusIcon = ({ status }: { status: RedemptionStatusType }) => {
  switch (status) {
    case 'settled':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'processing':
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'cancelled':
      return <X className="h-4 w-4 text-gray-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />;
  }
};

const StatusBadge = ({ status }: { status: RedemptionStatusType }) => {
  const variants: Record<RedemptionStatusType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'draft': 'outline',
    'pending': 'secondary',
    'approved': 'default',
    'processing': 'default',
    'settled': 'default',
    'rejected': 'destructive',
    'cancelled': 'secondary'
  };

  const colors: Record<RedemptionStatusType, string> = {
    'draft': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    'pending': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    'approved': 'bg-green-100 text-green-800 hover:bg-green-200',
    'processing': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    'settled': 'bg-green-100 text-green-800 hover:bg-green-200',
    'rejected': 'bg-red-100 text-red-800 hover:bg-red-200',
    'cancelled': 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  };

  return (
    <Badge 
      variant={variants[status]} 
      className={cn('flex items-center gap-1 capitalize', colors[status])}
    >
      <StatusIcon status={status} />
      {status}
    </Badge>
  );
};

export const RedemptionRequestList: React.FC<RedemptionRequestListProps> = ({
  investorId,
  showBulkActions = false,
  onViewRequest,
  onEditRequest,
  onCreateNew,
  className
}) => {
  // Hooks
  const { 
    redemptions, 
    loading, 
    error, 
    totalCount, 
    hasMore,
    refreshRedemptions,
    loadMore,
    cancelRedemption,
    clearError
  } = useRedemptions({ investorId, autoRefresh: true });

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RedemptionStatusType | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'standard' | 'interval'>('all');
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filter and sort redemptions
  const filteredAndSortedRedemptions = useMemo(() => {
    let filtered = redemptions.filter(request => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          request.id.toLowerCase().includes(searchLower) ||
          request.investorId.toLowerCase().includes(searchLower) ||
          request.tokenType.toLowerCase().includes(searchLower) ||
          (request.notes && request.notes.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && request.redemptionType !== typeFilter) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
        case 'amount':
          comparison = a.tokenAmount - b.tokenAmount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [redemptions, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(filteredAndSortedRedemptions.map(r => r.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    const newSelection = new Set(selectedRequests);
    if (checked) {
      newSelection.add(requestId);
    } else {
      newSelection.delete(requestId);
    }
    setSelectedRequests(newSelection);
  };

  // Handle bulk cancel
  const handleBulkCancel = async () => {
    const cancelableRequests = Array.from(selectedRequests).filter(id => {
      const request = redemptions.find(r => r.id === id);
      return request && ['draft', 'pending', 'approved'].includes(request.status);
    });

    for (const requestId of cancelableRequests) {
      await cancelRedemption(requestId);
    }

    setSelectedRequests(new Set());
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

  // Export to CSV
  const handleExport = () => {
    const csvData = filteredAndSortedRedemptions.map(request => ({
      ID: request.id,
      'Investor ID': request.investorId || 'N/A',
      'Investor Name': request.investorName || 'Unknown',
      'Submitted Date': new Date(request.submittedAt).toLocaleDateString(),
      'Token Amount': request.tokenAmount,
      'Token Type': request.tokenType,
      'Redemption Type': request.redemptionType,
      Status: request.status,
      'USDC Amount': request.usdcAmount,
      'Source Wallet': request.sourceWallet,
      'Destination Wallet': request.destinationWallet
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redemption-requests-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Redemption Requests
              <Badge variant="secondary">{totalCount}</Badge>
            </CardTitle>
            <CardDescription>
              Manage and track your token redemption requests
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshRedemptions}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>

            {onCreateNew && (
              <Button onClick={onCreateNew} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 pt-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="interval">Interval</SelectItem>
            </SelectContent>
          </Select>

          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [field, order] = value.split('-');
            setSortBy(field as any);
            setSortOrder(order as any);
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (Newest)</SelectItem>
              <SelectItem value="date-asc">Date (Oldest)</SelectItem>
              <SelectItem value="amount-desc">Amount (High)</SelectItem>
              <SelectItem value="amount-asc">Amount (Low)</SelectItem>
              <SelectItem value="status-asc">Status (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && selectedRequests.size > 0 && (
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedRequests.size} request(s) selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkCancel}
            >
              Cancel Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedRequests(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="ghost" size="sm" onClick={clearError}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {showBulkActions && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRequests.size === filteredAndSortedRedemptions.length && filteredAndSortedRedemptions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Request ID</TableHead>
                <TableHead>Investor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Token Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>USDC Value</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && redemptions.length === 0 ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {showBulkActions && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAndSortedRedemptions.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={showBulkActions ? 9 : 8} 
                    className="text-center py-12 text-muted-foreground"
                  >
                    {redemptions.length === 0 ? (
                      <div className="space-y-2">
                        <p>No redemption requests found</p>
                        {onCreateNew && (
                          <Button variant="outline" onClick={onCreateNew}>
                            Create your first request
                          </Button>
                        )}
                      </div>
                    ) : (
                      'No requests match your current filters'
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedRedemptions.map((request) => (
                  <TableRow key={request.id}>
                    {showBulkActions && (
                      <TableCell>
                        <Checkbox
                          checked={selectedRequests.has(request.id)}
                          onCheckedChange={(checked) => handleSelectRequest(request.id, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-mono text-sm">
                      {request.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {request.investorName || 'Unknown Investor'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          ID: {request.investorId ? request.investorId.slice(0, 8) + '...' : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(request.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {request.tokenAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.tokenType}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {request.redemptionType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="font-medium">
                      ${request.usdcAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(request.id)}
                          className="h-8 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDetails(request.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {onEditRequest && ['draft', 'pending'].includes(request.status) && (
                              <DropdownMenuItem onClick={() => onEditRequest(request)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Request
                              </DropdownMenuItem>
                            )}
                            {['draft', 'pending', 'approved'].includes(request.status) && (
                              <DropdownMenuItem 
                                onClick={() => cancelRedemption(request.id)}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Request
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Redemption Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequestId && (
            <RedemptionRequestDetails
              redemptionId={selectedRequestId}
              onClose={handleCloseDetails}
              onEdit={() => {
                if (onEditRequest) {
                  const request = redemptions.find(r => r.id === selectedRequestId);
                  if (request) {
                    onEditRequest(request);
                    handleCloseDetails();
                  }
                }
              }}
              onCancel={async () => {
                if (selectedRequestId) {
                  await cancelRedemption(selectedRequestId);
                  handleCloseDetails();
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};