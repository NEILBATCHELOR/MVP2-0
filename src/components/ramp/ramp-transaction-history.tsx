/**
 * RAMP Transaction History Component
 * 
 * Displays a list of RAMP Network transactions with filtering and pagination
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

import { getRampNetworkDataService } from '@/services/dfns/ramp-network-data-service';
import type { 
  RampNetworkEnhancedConfig,
  RampTransactionEvent,
  RampEventQuery 
} from '@/types/ramp';

export interface TransactionHistoryItem {
  id: string;
  type: 'onramp' | 'offramp';
  status: string;
  asset: {
    symbol: string;
    name: string;
    logoUrl: string;
    chain: string;
  };
  amount: {
    crypto: string;
    fiat: string;
    currency: string;
  };
  fees: {
    amount: string;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
  txHash?: string;
  providerTransactionId: string;
}

export interface RampTransactionHistoryProps {
  /** RAMP Network configuration */
  config: RampNetworkEnhancedConfig;
  
  /** User ID to filter transactions */
  userId?: string;
  
  /** Project ID to filter transactions */
  projectId?: string;
  
  /** Number of transactions per page */
  pageSize?: number;
  
  /** Whether to show filters */
  showFilters?: boolean;
  
  /** Whether to show search */
  showSearch?: boolean;
  
  /** Whether to show refresh button */
  showRefresh?: boolean;
  
  /** Whether to auto-refresh */
  autoRefresh?: boolean;
  
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Callback when transaction is clicked */
  onTransactionClick?: (transaction: TransactionHistoryItem) => void;
  
  /** Custom transaction renderer */
  renderTransaction?: (transaction: TransactionHistoryItem) => React.ReactNode;
}

export function RampTransactionHistory({
  config,
  userId,
  projectId,
  pageSize = 20,
  showFilters = true,
  showSearch = true,
  showRefresh = true,
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute
  className,
  onTransactionClick,
  renderTransaction
}: RampTransactionHistoryProps) {
  // State
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Refs
  const refreshIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Hooks
  const { toast } = useToast();
  const dataService = getRampNetworkDataService(config);
  
  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;
    
    const startAutoRefresh = () => {
      refreshIntervalRef.current = setInterval(() => {
        loadTransactions(true);
      }, refreshInterval);
    };
    
    startAutoRefresh();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);
  
  // Load transactions
  const loadTransactions = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      // Query parameters
      const query: RampEventQuery = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        orderBy: 'timestamp',
        orderDirection: 'desc'
      };
      
      // Apply filters
      if (searchQuery) {
        // This would need to be implemented in the data service
        // For now, we'll filter client-side
      }
      
      if (statusFilter !== 'all') {
        query.eventType = statusFilter;
      }
      
      // Mock data for now - replace with actual API call
      const mockTransactions: TransactionHistoryItem[] = [
        {
          id: '1',
          type: 'onramp',
          status: 'completed',
          asset: {
            symbol: 'ETH',
            name: 'Ethereum',
            logoUrl: 'https://assets.ramp.network/crypto-assets/eth.svg',
            chain: 'ETH'
          },
          amount: {
            crypto: '0.5',
            fiat: '1500.00',
            currency: 'USD'
          },
          fees: {
            amount: '15.00',
            currency: 'USD'
          },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 82800000).toISOString(),
          txHash: '0x1234...5678',
          providerTransactionId: 'ramp_123456'
        },
        {
          id: '2',
          type: 'offramp',
          status: 'pending',
          asset: {
            symbol: 'USDC',
            name: 'USD Coin',
            logoUrl: 'https://assets.ramp.network/crypto-assets/usdc.svg',
            chain: 'ETH'
          },
          amount: {
            crypto: '1000',
            fiat: '995.00',
            currency: 'USD'
          },
          fees: {
            amount: '5.00',
            currency: 'USD'
          },
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
          providerTransactionId: 'ramp_789012'
        }
      ];
      
      // Apply client-side filters
      let filtered = mockTransactions;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(tx =>
          tx.asset.symbol.toLowerCase().includes(query) ||
          tx.asset.name.toLowerCase().includes(query) ||
          tx.providerTransactionId.toLowerCase().includes(query) ||
          tx.txHash?.toLowerCase().includes(query)
        );
      }
      
      if (typeFilter !== 'all') {
        filtered = filtered.filter(tx => tx.type === typeFilter);
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(tx => tx.status === statusFilter);
      }
      
      setTransactions(filtered);
      setTotalPages(Math.ceil(filtered.length / pageSize));
      setHasMore(filtered.length > pageSize);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load transactions';
      setError(errorMsg);
      
      toast({
        title: 'Loading Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load transactions on mount and when filters change
  useEffect(() => {
    loadTransactions();
  }, [currentPage, searchQuery, statusFilter, typeFilter, config]);
  
  // Get status info
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; icon: React.ReactNode }> = {
      completed: {
        label: 'Completed',
        variant: 'default',
        icon: <CheckCircle className="h-4 w-4" />
      },
      pending: {
        label: 'Pending',
        variant: 'outline',
        icon: <Clock className="h-4 w-4" />
      },
      failed: {
        label: 'Failed',
        variant: 'destructive',
        icon: <XCircle className="h-4 w-4" />
      },
      cancelled: {
        label: 'Cancelled',
        variant: 'destructive',
        icon: <XCircle className="h-4 w-4" />
      },
      expired: {
        label: 'Expired',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />
      }
    };
    
    return statusMap[status] || {
      label: status,
      variant: 'outline',
      icon: <AlertCircle className="h-4 w-4" />
    };
  };
  
  // Format currency
  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(num);
  };
  
  // Format crypto amount
  const formatCrypto = (amount: string, symbol: string) => {
    const num = parseFloat(amount);
    return `${num.toFixed(6)} ${symbol}`;
  };
  
  // Handle transaction click
  const handleTransactionClick = (transaction: TransactionHistoryItem) => {
    onTransactionClick?.(transaction);
  };
  
  // Default transaction renderer
  const defaultTransactionRenderer = (transaction: TransactionHistoryItem) => {
    const statusInfo = getStatusInfo(transaction.status);
    
    return (
      <div
        key={transaction.id}
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
        onClick={() => handleTransactionClick(transaction)}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={transaction.asset.logoUrl} alt={transaction.asset.symbol} />
              <AvatarFallback>
                {transaction.asset.symbol.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1">
              {transaction.type === 'onramp' ? (
                <TrendingUp className="h-4 w-4 text-green-500 bg-background rounded-full p-0.5" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 bg-background rounded-full p-0.5" />
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {transaction.type === 'onramp' ? 'Buy' : 'Sell'} {transaction.asset.symbol}
              </span>
              <Badge variant="outline" className="text-xs">
                {transaction.asset.chain}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCrypto(transaction.amount.crypto, transaction.asset.symbol)} • 
              {formatCurrency(transaction.amount.fiat, transaction.amount.currency)}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(transaction.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            {statusInfo.icon}
            <Badge variant={statusInfo.variant} className="text-xs">
              {statusInfo.label}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Fee: {formatCurrency(transaction.fees.amount, transaction.fees.currency)}
          </div>
          {transaction.txHash && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://etherscan.io/tx/${transaction.txHash}`, '_blank');
              }}
              className="h-auto p-1 mt-1"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  // Render loading state
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Loading your RAMP Network transactions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
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
            onClick={() => loadTransactions()} 
            variant="outline" 
            className="mt-4 w-full"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Transaction History
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadTransactions(true)}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Your RAMP Network buy and sell transactions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        {(showSearch || showFilters) && (
          <div className="flex flex-col sm:flex-row gap-4">
            {showSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            
            {showFilters && (
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="onramp">Buy</SelectItem>
                    <SelectItem value="offramp">Sell</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
        
        {/* Transaction List */}
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found</p>
                <p className="text-sm">Your RAMP Network transactions will appear here</p>
              </div>
            ) : (
              transactions.map((transaction) => 
                renderTransaction ? renderTransaction(transaction) : defaultTransactionRenderer(transaction)
              )
            )}
          </div>
        </ScrollArea>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RampTransactionHistory;
