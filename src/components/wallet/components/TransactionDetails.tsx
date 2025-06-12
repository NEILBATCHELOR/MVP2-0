import React, { useEffect, useState } from 'react';
import { transactionMonitorService } from '../../../services/wallet/TransactionMonitorService';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  ArrowLeft, 
  Copy, 
  LayoutList, 
  ArrowRight,
  Info 
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TransactionDetailsProps {
  txHash: string;
  onBack: () => void;
}

type TransactionDetailsType = {
  id: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  value: string;
  data?: any;
  gas_price?: string | number;
  gas_used?: string | number;
  effective_gas_price?: string | number;
  nonce?: number;
  block_number?: number | string;
  status: string;
  created_at?: string;
  confirmation_count?: number;
  [key: string]: any;
};

export function TransactionDetails({ txHash, onBack }: TransactionDetailsProps) {
  const [transaction, setTransaction] = useState<TransactionDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch transaction details from service
      const details = await transactionMonitorService.getTransactionDetails(txHash);
      
      // Ensure value is a string to satisfy TypeScript
      if (details) {
        const formattedDetails = {
          ...details,
          value: details.value?.toString() || '0'
        };
        setTransaction(formattedDetails);
      } else {
        setTransaction(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch transaction details:', err);
      setError(err.message || 'Failed to fetch transaction details');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Format transaction value
  const formatValue = (value: string | undefined) => {
    if (!value) return '0 ETH';
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
    if (txHash) {
      fetchTransactionDetails();
    }
  }, [txHash]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Skeleton className="h-6 w-40 ml-2" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        <Button variant="outline" onClick={fetchTransactionDetails} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            Transaction details not found. The transaction might not exist or hasn't been indexed yet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getTransactionFee = () => {
    if (transaction && transaction.gas_used && transaction.effective_gas_price) {
      const gasUsed = typeof transaction.gas_used === 'string' 
        ? parseInt(transaction.gas_used) 
        : transaction.gas_used;
      
      const gasPrice = typeof transaction.effective_gas_price === 'string' 
        ? parseInt(transaction.effective_gas_price) 
        : transaction.effective_gas_price;
      
      return formatValue((gasUsed * gasPrice).toString());
    }
    return 'Pending';
  };

  const getGasPrice = () => {
    if (transaction && transaction.gas_price) {
      const gasPriceValue = typeof transaction.gas_price === 'string' 
        ? parseInt(transaction.gas_price) 
        : transaction.gas_price;
      
      return `${gasPriceValue / 1e9} Gwei`;
    }
    return 'N/A';
  };

  const getTransactionData = () => {
    if (transaction && transaction.data) {
      if (typeof transaction.data === 'string') {
        return transaction.data;
      }
      return JSON.stringify(transaction.data, null, 2);
    }
    return '0x';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-lg font-medium">Transaction Details</h2>
        <Button
          variant="ghost" 
          size="sm"
          onClick={() => window.open(`https://etherscan.io/tx/${txHash}`, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View on Explorer
        </Button>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-gray-500">Transaction Hash</div>
          <div className="flex items-center">
            <span className="font-mono">{txHash}</span>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(txHash)} className="ml-1 p-1 h-auto">
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div>
          {getStatusBadge(transaction.status)}
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="overview">
            <LayoutList className="h-4 w-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="data">
            <Info className="h-4 w-4 mr-1" />
            Data
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Clock className="h-4 w-4 mr-1" />
            Event Logs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="p-4 border rounded-md mt-2">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Status</TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Block</TableCell>
                <TableCell>{transaction.block_number || 'Pending'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">From</TableCell>
                <TableCell className="font-mono text-sm break-all">
                  <div className="flex items-center">
                    {transaction.from_address}
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(transaction.from_address)} className="ml-1 p-1 h-auto">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">To</TableCell>
                <TableCell className="font-mono text-sm break-all">
                  <div className="flex items-center">
                    {transaction.to_address}
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(transaction.to_address)} className="ml-1 p-1 h-auto">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Value</TableCell>
                <TableCell>{formatValue(transaction.value)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Transaction Fee</TableCell>
                <TableCell>{getTransactionFee()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Gas Price</TableCell>
                <TableCell>{getGasPrice()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Nonce</TableCell>
                <TableCell>{transaction.nonce || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Timestamp</TableCell>
                <TableCell>
                  {transaction.created_at 
                    ? formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })
                    : 'N/A'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="data" className="p-4 border rounded-md mt-2">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Input Data (Hex)</h4>
              <div className="p-3 bg-gray-50 rounded border overflow-auto max-h-60 font-mono text-xs whitespace-pre-wrap break-all">
                {getTransactionData()}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={() => copyToClipboard(getTransactionData())}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy Data
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="logs" className="p-4 border rounded-md mt-2">
          <div className="text-center py-4 text-gray-500">
            <p>Event logs are not available in this transaction monitor view.</p>
            <p className="text-sm mt-2">Use an explorer like Etherscan for detailed event logs.</p>
            <Button
              variant="outline" 
              size="sm"
              className="mt-2"
              onClick={() => window.open(`https://etherscan.io/tx/${txHash}#eventlog`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View Logs on Etherscan
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}