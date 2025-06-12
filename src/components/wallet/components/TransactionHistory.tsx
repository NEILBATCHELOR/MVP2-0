import React, { useEffect, useState } from 'react';
import { transactionMonitorService } from '../../../services/wallet/TransactionMonitorService';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ExplorerService } from '@/services/ExplorerService';

interface TransactionHistoryProps {
  walletAddress: string;
  blockchain?: string; // Add blockchain parameter
  onSelectTransaction?: (txHash: string) => void;
}

// Define a simplified transaction type for the component
type TransactionHistoryItem = {
  id: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  value: string;
  status: string;
  created_at?: string;
  confirmation_count?: number;
  [key: string]: any;
};

export function TransactionHistory({ walletAddress, blockchain = 'ethereum', onSelectTransaction }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch transaction history from service
      const history = await transactionMonitorService.getWalletTransactionHistory(walletAddress);
      
      // Ensure value is a string in each transaction
      const formattedHistory = history.map(tx => ({
        ...tx,
        value: tx.value?.toString() || '0'
      }));
      
      setTransactions(formattedHistory);
    } catch (err: any) {
      console.error('Failed to fetch transaction history:', err);
      setError(err.message || 'Failed to fetch transaction history');
    } finally {
      setLoading(false);
    }
  };

  // Refresh transaction data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactionHistory();
    setRefreshing(false);
  };

  // Format transaction value
  const formatValue = (value: string) => {
    try {
      const valueInEth = parseInt(value) / 1e18;
      return valueInEth.toFixed(6) + ' ETH';
    } catch {
      return value;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><AlertCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchTransactionHistory();
    }
  }, [walletAddress]);

  if (loading && !refreshing) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-700">
        <h4 className="font-semibold">Error loading transactions</h4>
        <p>{error}</p>
        <Button variant="outline" onClick={fetchTransactionHistory} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Transaction History</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No transactions found for this wallet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Card key={tx.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium truncate">
                      {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}
                    </CardTitle>
                    <CardDescription>
                      {tx.created_at && formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <div>{getStatusBadge(tx.status)}</div>
                </div>
              </CardHeader>
              <CardContent className="py-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-500">From</p>
                    <p className="truncate">{tx.from_address}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">To</p>
                    <p className="truncate">{tx.to_address}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Value</p>
                    <p>{formatValue(tx.value)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Confirmations</p>
                    <p>{tx.confirmation_count || 0}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-3">
                <div className="flex justify-between w-full">
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => onSelectTransaction && onSelectTransaction(tx.tx_hash)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(ExplorerService.getTransactionUrl(tx.tx_hash, blockchain), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Explorer
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}