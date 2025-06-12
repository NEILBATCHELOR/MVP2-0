import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/Spinner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  ArrowLeft,
  XCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { transactionMonitorService } from "@/services/wallet/TransactionMonitorService";
import { ExplorerService } from "@/services/ExplorerService";

export interface TransactionConfirmationProps {
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'none';
  title: string;
  description: string;
  blockchain?: string; // Add blockchain parameter
  details?: {
    from?: string;
    to?: string;
    amount?: string;
    fee?: string;
    asset?: string;
    timestamp?: string;
    [key: string]: any;
  };
  errorMessage?: string;
  onBack: () => void;
  onRetry?: () => void;
  hideExplorer?: boolean;
}

export function TransactionConfirmation({
  txHash,
  status,
  title,
  description,
  blockchain,
  details,
  errorMessage,
  onBack,
  onRetry,
  hideExplorer = false,
}: TransactionConfirmationProps) {
  const [progress, setProgress] = useState(0);
  const [transaction, setTransaction] = useState<any | null>(null);
  const { toast } = useToast();
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The transaction hash has been copied to your clipboard",
    });
  };
  
  // If transaction is pending, show progress animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'pending') {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          // Slowly increment progress but never reach 100% until confirmed
          const nextProgress = prev + (100 - prev) * 0.05;
          return Math.min(nextProgress, 95);
        });
      }, 300);
    } else if (status === 'confirmed') {
      setProgress(100);
    } else if (status === 'failed') {
      setProgress(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);
  
  // Fetch transaction details if hash is provided
  useEffect(() => {
    if (txHash && (status === 'pending' || status === 'confirmed')) {
      const fetchTransaction = async () => {
        try {
          const tx = await transactionMonitorService.getTransactionDetails(txHash);
          setTransaction(tx);
        } catch (error) {
          console.error("Error fetching transaction:", error);
        }
      };
      
      fetchTransaction();
      
      // Set up a polling interval to check for updates
      const interval = setInterval(fetchTransaction, 10000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [txHash, status]);
  
  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Confirmed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return null;
    }
  };
  
  const getStatusContent = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 my-8 text-center">
            <div className="relative h-24 w-24 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Transaction In Progress</h3>
              <p className="text-muted-foreground">This might take a few minutes to complete</p>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        );
      case 'confirmed':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 my-8 text-center">
            <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Transaction Confirmed</h3>
              <p className="text-muted-foreground">
                Your transaction has been successfully confirmed
              </p>
            </div>
          </div>
        );
      case 'failed':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 my-8 text-center">
            <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Transaction Failed</h3>
              <p className="text-muted-foreground">
                {errorMessage || "Your transaction has failed to execute on the blockchain"}
              </p>
            </div>
            {onRetry && (
              <Button onClick={onRetry} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent>
        {getStatusContent()}
        
        {/* Transaction details section */}
        {(details || txHash) && (
          <div className="mt-6">
            <h4 className="font-medium mb-2">Transaction Details</h4>
            
            {/* Transaction hash display */}
            {txHash && (
              <div className="flex flex-col space-y-2 mb-4">
                <div className="text-sm text-muted-foreground">Transaction Hash</div>
                <div className="p-2 bg-muted rounded flex items-center justify-between">
                  <span className="font-mono text-xs truncate">
                    {txHash}
                  </span>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(txHash)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!hideExplorer && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => window.open(ExplorerService.getTransactionUrl(txHash, blockchain), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Additional transaction details */}
            {details && (
              <div className="space-y-3 text-sm">
                {details.from && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-medium truncate max-w-[200px]">{details.from}</span>
                  </div>
                )}
                
                {details.to && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-medium truncate max-w-[200px]">{details.to}</span>
                  </div>
                )}
                
                {details.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{details.amount} {details.asset || ''}</span>
                  </div>
                )}
                
                {details.fee && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Transaction Fee</span>
                    <span className="font-medium">{details.fee}</span>
                  </div>
                )}
                
                {details.timestamp && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(details.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                )}
                
                {/* Extra custom fields */}
                {Object.entries(details).map(([key, value]) => {
                  if (!['from', 'to', 'amount', 'fee', 'asset', 'timestamp'].includes(key)) {
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium">{value?.toString()}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Error message alert for failed transactions */}
        {status === 'failed' && errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Transaction Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {status === 'confirmed' || status === 'failed' ? 'Back to Home' : 'Go Back'}
        </Button>
        
        {!hideExplorer && txHash && (
          <Button 
            variant="outline"
            onClick={() => window.open(ExplorerService.getTransactionUrl(txHash, blockchain), '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 