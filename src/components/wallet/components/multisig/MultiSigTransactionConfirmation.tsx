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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  ArrowLeft,
  Lock,
  Users,
  UserCheck,
  KeyRound,
  Share2,
  ChevronRight,
  Loader2
} from "lucide-react";
import { TransactionConfirmation, TransactionConfirmationProps } from "../TransactionConfirmation";
import * as MultiSigWalletManager from "@/services/wallet/MultiSigWalletService";
// Define types locally based on Tables from database
type Transaction = {
  id: string;
  wallet_id: string;
  destination: string;
  value: string;
  data: string;
  description?: string;
  submitted_at: string;
  status: string;
  executed_at?: string;
  created_at: string;
  executed: boolean; // Added this property which is needed for status checks
  // Aliases for camelCase access
  createdAt?: string; // Alias for created_at
};

type Confirmation = {
  id: string;
  transaction_id: string;
  owner_address: string;
  confirmed_at: string;
  created_at: string;
  // Aliases for camelCase access
  createdAt?: string; // Alias for created_at
  owner?: string; // Alias for owner_address
};

interface MultiSigTransactionConfirmationProps extends Omit<TransactionConfirmationProps, 'status'> {
  transactionId: string;
  walletId: string;
  threshold: number;
  owners: string[];
  canSign: boolean;
  onSignTransaction: () => Promise<void>;
  onShareTransaction: (transactionId: string) => void;
}

export function MultiSigTransactionConfirmation({
  transactionId,
  walletId,
  txHash,
  title,
  description,
  details,
  threshold,
  owners,
  canSign,
  errorMessage,
  onBack,
  onRetry,
  onSignTransaction,
  onShareTransaction,
  hideExplorer = false,
}: MultiSigTransactionConfirmationProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed' | 'none'>('pending');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch transaction and confirmations data
  const fetchTransactionData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch transaction by ID directly
      const txData = await MultiSigWalletManager.getTransactionById(transactionId);
      
      if (!txData) {
        throw new Error("Transaction not found");
      }
      
      // Extract transaction and confirmation data from the response
      // Map snake_case to camelCase properties
      const tx = {
        ...txData as unknown as Transaction,
        createdAt: txData.created_at,
      };
      setTransaction(tx);
      
      // Extract confirmations from the nested data structure
      // The getTransactionById method includes multi_sig_confirmations in its response
      const confirms = (txData.multi_sig_confirmations || []).map((confirmation: any) => ({
        ...confirmation,
        createdAt: confirmation.created_at,
        owner: confirmation.owner_address, // Map owner_address to owner
      })) as Confirmation[];
      setConfirmations(confirms);
      
      // Determine status based on transaction data
      if (tx.executed) {
        setStatus('confirmed');
      } else if (confirms.length >= threshold) {
        setStatus('pending'); // Ready to execute but not executed yet
      } else {
        setStatus('pending'); // Awaiting more signatures
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching transaction data:", err);
      setError(err instanceof Error ? err.message : "Failed to load transaction data");
      setStatus('failed');
      setIsLoading(false);
    }
  };
  
  // Sign the transaction
  const handleSignTransaction = async () => {
    try {
      setIsSigning(true);
      await onSignTransaction();
      await fetchTransactionData(); // Refresh data after signing
      
      toast({
        title: "Transaction Signed",
        description: "Your signature has been added to the transaction"
      });
    } catch (err) {
      console.error("Error signing transaction:", err);
      setError(err instanceof Error ? err.message : "Failed to sign transaction");
      
      toast({
        variant: "destructive",
        title: "Signature Failed",
        description: err instanceof Error ? err.message : "Failed to sign transaction"
      });
    } finally {
      setIsSigning(false);
    }
  };
  
  // Format addresses for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard"
    });
  };
  
  // Share transaction for signing
  const handleShareTransaction = () => {
    onShareTransaction(transactionId);
    toast({
      title: "Share Link Generated",
      description: "You can now share this link with other signatories"
    });
  };
  
  // Initial data load
  useEffect(() => {
    fetchTransactionData();
    
    // Set up polling to check for new confirmations
    const interval = setInterval(fetchTransactionData, 15000);
    return () => clearInterval(interval);
  }, [transactionId]);
  
  // If loading, show loading UI
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading transaction data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If there's an error fetching data, show error UI
  if (error && !transaction) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transaction Error</CardTitle>
          <CardDescription>There was a problem loading this transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to load transaction</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={fetchTransactionData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // If transaction was found, render the signature collection UI
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={status === 'confirmed' ? 'default' : 'outline'}>
            {transaction?.executed 
              ? <CheckCircle className="h-3 w-3 mr-1" /> 
              : <Clock className="h-3 w-3 mr-1" />}
            {transaction?.executed ? 'Executed' : 'Awaiting Signatures'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Signature progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">
              Signature Progress: {confirmations.length} of {threshold} required
            </span>
            <span className="text-sm">
              {Math.min(100, Math.round((confirmations.length / threshold) * 100))}%
            </span>
          </div>
          <Progress 
            value={Math.min(100, Math.round((confirmations.length / threshold) * 100))} 
            className="h-2" 
          />
          
          {/* Status message */}
          <div className="mt-2 text-sm text-muted-foreground">
            {confirmations.length >= threshold 
              ? transaction?.executed 
                ? 'Transaction has been executed' 
                : 'Ready to execute once all signatures are collected'
              : `Waiting for ${threshold - confirmations.length} more signature(s)`
            }
          </div>
        </div>
        
        {/* Transaction details */}
        <div className="space-y-4">
          <h4 className="font-medium">Transaction Details</h4>
          
          {/* Display transaction hash if available */}
          {txHash && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Transaction Hash</label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-xs font-mono truncate flex-1">{txHash}</span>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(txHash)}>
                  <Copy className="h-4 w-4" />
                </Button>
                {!hideExplorer && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => window.open(`https://etherscan.io/tx/${txHash}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Display basic transaction details */}
          <div className="grid gap-3 text-sm">
            {details?.from && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium">{formatAddress(details.from)}</span>
              </div>
            )}
            {details?.to && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{formatAddress(details.to)}</span>
              </div>
            )}
            {details?.amount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{details.amount} {details.asset || ''}</span>
              </div>
            )}
            {transaction?.createdAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Signatures section */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <UserCheck className="h-4 w-4 mr-2" /> 
            Signatures ({confirmations.length}/{owners.length})
          </h4>
          
          <div className="space-y-2">
            {confirmations.length > 0 ? (
              confirmations.map((confirmation) => (
                <div 
                  key={confirmation.id} 
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{formatAddress(confirmation.owner || confirmation.owner_address)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(confirmation.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No signatures collected yet
              </div>
            )}
          </div>
          
          {/* Remaining signers */}
          {owners.length > confirmations.length && (
            <div className="mt-4">
              <h5 className="text-sm font-medium mb-2">Pending Signatures</h5>
              {owners
                .filter(owner => !confirmations.some(conf => conf.owner === owner))
                .map((owner, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{formatAddress(owner)}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Awaiting</Badge>
                  </div>
                ))
              }
            </div>
          )}
        </div>
        
        {/* Error message if any */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-3">
        <div className="w-full flex items-center gap-2">
          {!transaction?.executed && canSign && !confirmations.some(c => c.owner === owners[0]) && (
            <Button 
              className="flex-1" 
              disabled={isSigning}
              onClick={handleSignTransaction}
            >
              {isSigning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4 mr-2" />
              )}
              Sign Transaction
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleShareTransaction}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share for Signing
          </Button>
        </div>
        
        <div className="w-full flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Button 
            variant="ghost"
            onClick={fetchTransactionData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 