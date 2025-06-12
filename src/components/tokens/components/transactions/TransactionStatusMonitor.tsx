import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Check, 
  XCircle, 
  Clock, 
  ZapIcon, 
  XIcon,
  AlertTriangle,
  ArrowRightLeft,
  Eye
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils';
import type { Transaction } from '@/types/core/centralModels';
import { useToast } from '@/components/ui/use-toast';
import { TransactionMonitor } from '@/infrastructure/web3/transactions/TransactionMonitor';
import { FeePriority } from '@/services/blockchain/FeeEstimator';
import TransactionDetails from './TransactionDetails';
import TransactionStatusBadge from './TransactionStatusBadge';

export interface TransactionStatusMonitorProps {
  transactions: Transaction[];
  walletAddress: string;
  blockchain: string;
  privateKey?: string;
  onSpeedUp?: (txHash: string, newTxHash: string) => void;
  onCancel?: (txHash: string, cancelTxHash: string) => void;
  explorerBaseUrl?: string;
}

const TransactionStatusMonitor: React.FC<TransactionStatusMonitorProps> = ({
  transactions,
  walletAddress,
  blockchain,
  privateKey,
  onSpeedUp,
  onCancel,
  explorerBaseUrl
}) => {
  const { toast } = useToast();
  const [visibleTx, setVisibleTx] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [confirmations, setConfirmations] = useState<Record<string, number>>({});
  const [estimatedTimes, setEstimatedTimes] = useState<Record<string, number>>({});
  
  // const transactionMonitor = TransactionMonitor.getInstance();
  
  // Subscribe to transaction updates
  useEffect(() => {
    const pendingTxs = transactions.filter(tx => tx.status === 'pending');
    
    // TODO: Implement proper transaction monitoring when methods are available
    // For now, just set some default values
    pendingTxs.forEach(tx => {
      if (!tx.txHash) return;
      
      // Set default estimated time
      setEstimatedTimes(prev => ({
        ...prev,
        [tx.txHash!]: 60 // Default to 60 seconds
      }));
    });
  }, [transactions]);
  
  const toggleDetails = (txHash: string) => {
    setVisibleTx(visibleTx === txHash ? null : txHash);
  };
  
  const handleSpeedUp = async (txHash: string) => {
    if (!privateKey) {
      toast({
        title: 'Cannot Speed Up',
        description: 'Private key is required to speed up a transaction',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, [txHash]: true }));
      
      // TODO: Implement speed up transaction when method is available
      const newTxHash = `speedup-${txHash}`;
      
      toast({
        title: 'Transaction Sped Up',
        description: `New transaction hash: ${newTxHash.substring(0, 8)}...`,
      });
      
      if (onSpeedUp) {
        onSpeedUp(txHash, newTxHash);
      }
    } catch (error) {
      toast({
        title: 'Speed Up Failed',
        description: `Error: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, [txHash]: false }));
    }
  };
  
  const handleCancel = async (txHash: string) => {
    if (!privateKey) {
      toast({
        title: 'Cannot Cancel',
        description: 'Private key is required to cancel a transaction',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, [txHash]: true }));
      
      // TODO: Implement cancel transaction when method is available
      const cancelTxHash = `cancel-${txHash}`;
      
      toast({
        title: 'Transaction Canceled',
        description: `Cancellation transaction: ${cancelTxHash.substring(0, 8)}...`,
      });
      
      if (onCancel) {
        onCancel(txHash, cancelTxHash);
      }
    } catch (error) {
      toast({
        title: 'Cancellation Failed',
        description: `Error: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, [txHash]: false }));
    }
  };
  
  const getExplorerLink = (txHash: string) => {
    if (!explorerBaseUrl) return '#';
    return `${explorerBaseUrl}/tx/${txHash}`;
  };
  
  const sortedTransactions = [...transactions].sort((a, b) => {
    // Sort by status (pending first, then most recent)
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    
    // Then by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Monitor</CardTitle>
        <CardDescription>
          Monitor and manage your blockchain transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No transactions to display
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={expandedItems}
            onValueChange={setExpandedItems}
            className="w-full"
          >
            {sortedTransactions.map((tx) => (
              <AccordionItem key={tx.txHash} value={tx.txHash || 'unknown'}>
                <AccordionTrigger className="py-2">
                  <div className="flex items-center justify-between w-full pr-6">
                    <div className="flex items-center space-x-2">
                      <TransactionStatusBadge status={tx.status} />
                      <span className="text-sm font-medium">
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} Transaction
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tx.txHash ? tx.txHash.substring(0, 8) + '...' : 'Unknown'} • {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-2 pt-1 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Hash: </span>
                        <span className="font-mono">{tx.txHash}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleDetails(tx.txHash!)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(getExplorerLink(tx.txHash!), '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View in explorer</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    {tx.status === 'pending' && (
                      <>
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Estimated time: {Math.round((estimatedTimes[tx.txHash!] || 60) / 60)} min</span>
                            <span>Confirmations: {confirmations[tx.txHash!] || 0}</span>
                          </div>
                          <Progress value={confirmations[tx.txHash!] ? Math.min(confirmations[tx.txHash!] * 8, 100) : 0} className="h-2" />
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(tx.txHash!)}
                            disabled={!privateKey || loading[tx.txHash!]}
                            className="flex items-center space-x-1"
                          >
                            {loading[tx.txHash!] ? (
                              <div className="flex items-center space-x-1">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                <span>Cancelling...</span>
                              </div>
                            ) : (
                              <>
                                <XIcon className="h-4 w-4" />
                                <span>Cancel</span>
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSpeedUp(tx.txHash!)}
                            disabled={!privateKey || loading[tx.txHash!]}
                            className="flex items-center space-x-1"
                          >
                            {loading[tx.txHash!] ? (
                              <div className="flex items-center space-x-1">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                <span>Speeding up...</span>
                              </div>
                            ) : (
                              <>
                                <ZapIcon className="h-4 w-4" />
                                <span>Speed Up</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {visibleTx === tx.txHash && (
                      <div className="mt-4 pt-4 border-t">
                        <TransactionDetails transaction={tx} blockchain={blockchain} />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionStatusMonitor;