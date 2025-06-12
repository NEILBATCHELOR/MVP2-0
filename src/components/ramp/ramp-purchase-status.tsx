/**
 * RAMP Purchase Status Component
 * 
 * Displays the status and details of a RAMP Network purchase or sale
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  Copy
} from 'lucide-react';

import { RampNetworkManager } from '@/infrastructure/dfns/fiat/ramp-network-manager';
import type { 
  RampPurchase, 
  RampSale, 
  RampPurchaseStatus as RampPurchaseStatusType, 
  RampSaleStatus as RampSaleStatusType,
  RampNetworkEnhancedConfig 
} from '@/types/ramp';

export interface RampPurchaseStatusProps {
  /** Purchase or sale transaction */
  transaction: RampPurchase | RampSale;
  
  /** Transaction type */
  type: 'purchase' | 'sale';
  
  /** Purchase view token for fetching updates */
  viewToken: string;
  
  /** RAMP Network configuration */
  config: RampNetworkEnhancedConfig;
  
  /** Whether to auto-refresh status */
  autoRefresh?: boolean;
  
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Callback when transaction status changes */
  onStatusChange?: (transaction: RampPurchase | RampSale, oldStatus: string) => void;
  
  /** Callback when transaction completes */
  onComplete?: (transaction: RampPurchase | RampSale) => void;
  
  /** Whether to show detailed information */
  showDetails?: boolean;
  
  /** Whether to show refresh button */
  showRefresh?: boolean;
}

export function RampPurchaseStatus({
  transaction: initialTransaction,
  type,
  viewToken,
  config,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  className,
  onStatusChange,
  onComplete,
  showDetails = true,
  showRefresh = true
}: RampPurchaseStatusProps) {
  // State
  const [transaction, setTransaction] = useState(initialTransaction);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Refs
  const refreshIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const rampManagerRef = React.useRef<RampNetworkManager | null>(null);
  
  // Hooks
  const { toast } = useToast();
  
  // Initialize RAMP manager
  useEffect(() => {
    const manager = new RampNetworkManager(config);
    rampManagerRef.current = manager;
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [config]);
  
  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;
    
    const startAutoRefresh = () => {
      refreshIntervalRef.current = setInterval(() => {
        handleRefresh();
      }, refreshInterval);
    };
    
    startAutoRefresh();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);
  
  // Refresh transaction status
  const handleRefresh = async () => {
    const manager = rampManagerRef.current;
    if (!manager || loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const oldStatus = transaction.status;
      let result;
      
      if (type === 'purchase') {
        result = await manager.getPurchaseStatus(transaction.id, viewToken);
      } else {
        result = await manager.getSaleStatus(transaction.id, viewToken);
      }
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch transaction status');
      }
      
      const updatedTransaction = result.data;
      setTransaction(updatedTransaction);
      setLastUpdated(new Date());
      
      // Notify status change
      if (oldStatus !== updatedTransaction.status) {
        onStatusChange?.(updatedTransaction, oldStatus);
        
        toast({
          title: 'Status Updated',
          description: `Transaction status changed to ${updatedTransaction.status}`,
        });
      }
      
      // Check if completed
      const completedStatuses = ['RELEASED', 'COMPLETED'];
      if (completedStatuses.includes(updatedTransaction.status) && !completedStatuses.includes(oldStatus)) {
        onComplete?.(updatedTransaction);
        
        toast({
          title: 'Transaction Completed',
          description: 'Your transaction has been successfully completed!',
        });
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh status';
      setError(errorMsg);
      
      toast({
        title: 'Refresh Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Get status info
  const getStatusInfo = (status: RampPurchaseStatusType | RampSaleStatusType) => {
    const statusMap: Record<string, { label: string; variant: any; icon: React.ReactNode; description: string }> = {
      INITIALIZED: {
        label: 'Initialized',
        variant: 'outline',
        icon: <Clock className="h-4 w-4" />,
        description: 'Transaction has been created'
      },
      PAYMENT_STARTED: {
        label: 'Payment Started',
        variant: 'outline',
        icon: <Clock className="h-4 w-4" />,
        description: 'Payment process has begun'
      },
      PAYMENT_IN_PROGRESS: {
        label: 'Payment Processing',
        variant: 'default',
        icon: <Clock className="h-4 w-4" />,
        description: 'Payment is being processed'
      },
      PAYMENT_FAILED: {
        label: 'Payment Failed',
        variant: 'destructive',
        icon: <XCircle className="h-4 w-4" />,
        description: 'Payment could not be processed'
      },
      PAYMENT_EXECUTED: {
        label: 'Payment Successful',
        variant: 'default',
        icon: <CheckCircle className="h-4 w-4" />,
        description: 'Payment has been successfully processed'
      },
      FIAT_SENT: {
        label: 'Fiat Sent',
        variant: 'default',
        icon: <CheckCircle className="h-4 w-4" />,
        description: 'Fiat payment has been sent'
      },
      FIAT_RECEIVED: {
        label: 'Fiat Received',
        variant: 'default',
        icon: <CheckCircle className="h-4 w-4" />,
        description: 'Fiat payment has been received'
      },
      RELEASING: {
        label: 'Releasing Crypto',
        variant: 'default',
        icon: <Clock className="h-4 w-4" />,
        description: 'Cryptocurrency is being released'
      },
      RELEASED: {
        label: 'Completed',
        variant: 'default',
        icon: <CheckCircle className="h-4 w-4" />,
        description: 'Transaction completed successfully'
      },
      COMPLETED: {
        label: 'Completed',
        variant: 'default',
        icon: <CheckCircle className="h-4 w-4" />,
        description: 'Transaction completed successfully'
      },
      EXPIRED: {
        label: 'Expired',
        variant: 'destructive',
        icon: <XCircle className="h-4 w-4" />,
        description: 'Transaction has expired'
      },
      CANCELLED: {
        label: 'Cancelled',
        variant: 'destructive',
        icon: <XCircle className="h-4 w-4" />,
        description: 'Transaction was cancelled'
      },
      CRYPTO_EXCHANGE_IN_PROGRESS: {
        label: 'Exchanging Crypto',
        variant: 'default',
        icon: <Clock className="h-4 w-4" />,
        description: 'Cryptocurrency exchange in progress'
      }
    };
    
    return statusMap[status] || {
      label: status,
      variant: 'outline',
      icon: <AlertCircle className="h-4 w-4" />,
      description: 'Unknown status'
    };
  };
  
  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number | string, currency: string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
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
  
  const statusInfo = getStatusInfo(transaction.status);
  const isPurchase = type === 'purchase' && 'cryptoAmount' in transaction;
  const isSale = type === 'sale' && 'crypto' in transaction;
  
  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{type === 'purchase' ? 'Purchase' : 'Sale'} Status</span>
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Transaction ID: {transaction.id}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(transaction.id, 'Transaction ID')}
            className="ml-2 h-auto p-1"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {statusInfo.icon}
          <Badge variant={statusInfo.variant}>
            {statusInfo.label}
          </Badge>
          <span className="text-sm text-muted-foreground ml-auto">
            {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        
        {/* Status Description */}
        <p className="text-sm text-muted-foreground">
          {statusInfo.description}
        </p>
        
        {/* Transaction Details */}
        {showDetails && (
          <>
            <Separator />
            <div className="space-y-3">
              {isPurchase && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Amount:</span>
                    <span className="text-sm">
                      {formatCurrency(transaction.fiatValue, transaction.fiatCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Crypto:</span>
                    <span className="text-sm">
                      {formatCrypto(transaction.cryptoAmount, transaction.asset.symbol)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Fee:</span>
                    <span className="text-sm">
                      {formatCurrency(transaction.appliedFee, transaction.fiatCurrency)}
                    </span>
                  </div>
                  {transaction.finalTxHash && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tx Hash:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-mono">
                          {transaction.finalTxHash.slice(0, 10)}...
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(transaction.finalTxHash!, 'Transaction hash')}
                          className="h-auto p-1"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://etherscan.io/tx/${transaction.finalTxHash}`, '_blank')}
                          className="h-auto p-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {isSale && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Crypto Amount:</span>
                    <span className="text-sm">
                      {formatCrypto(transaction.crypto.amount, transaction.crypto.assetInfo.symbol)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Fiat Amount:</span>
                    <span className="text-sm">
                      {formatCurrency(transaction.fiat.amount, transaction.fiat.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Fee:</span>
                    <span className="text-sm">
                      {formatCurrency(transaction.fees.amount, transaction.fees.currencySymbol)}
                    </span>
                  </div>
                  {transaction.exchangeRate && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Exchange Rate:</span>
                      <span className="text-sm">{transaction.exchangeRate}</span>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm">
                  {new Date(transaction.createdAt).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Updated:</span>
                <span className="text-sm">
                  {new Date(transaction.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default RampPurchaseStatus;
