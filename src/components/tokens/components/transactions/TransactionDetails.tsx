import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { InfoIcon, ExternalLink } from 'lucide-react';
import type { Transaction } from '@/types/core/centralModels';
import { Badge } from '@/components/ui/badge';

interface TransactionDetailsProps {
  transaction: Transaction;
  blockchain: string;
  getExplorerLink?: (txHash: string) => string;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transaction,
  blockchain,
  getExplorerLink
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('');
  
  // Update time ago
  useEffect(() => {
    const updateTimeAgo = () => {
      try {
        setTimeAgo(formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true }));
      } catch (error) {
        setTimeAgo('Unknown');
      }
    };
    
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [transaction.timestamp]);
  
  // Parse metadata with error handling
  const getMetadata = () => {
    try {
      if (typeof transaction.metadata === 'string') {
        return JSON.parse(transaction.metadata);
      }
      return transaction.metadata || {};
    } catch (error) {
      return {};
    }
  };
  
  const metadata = getMetadata();
  
  // Format blockchain value to be more readable
  const formatBlockchainName = (name: string) => {
    if (name.startsWith('ethereum-')) {
      return name.replace('ethereum-', 'Ethereum ').toUpperCase();
    }
    if (name.startsWith('polygon-')) {
      return name.replace('polygon-', 'Polygon ').toUpperCase();
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Transaction Type</h4>
          <p className="text-sm font-semibold capitalize">{transaction.type}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Blockchain</h4>
          <p className="text-sm font-semibold">{formatBlockchainName(blockchain)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Timestamp</h4>
          <p className="text-sm">{new Date(transaction.timestamp).toLocaleString()}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Age</h4>
          <p className="text-sm">{timeAgo}</p>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Transaction Details</h4>
        
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hash</span>
            <span className="font-mono">
              {transaction.txHash}
              {getExplorerLink && (
                <a
                  href={getExplorerLink(transaction.txHash!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block ml-2 text-primary hover:opacity-80"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </span>
          </div>
          
          {metadata.blockNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Block</span>
              <span>{metadata.blockNumber}</span>
            </div>
          )}
          
          {metadata.confirmations && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confirmations</span>
              <span>{metadata.confirmations}</span>
            </div>
          )}
          
          {transaction.value && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Value</span>
              <span>{transaction.value}</span>
            </div>
          )}
          
          {metadata.gasUsed && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas Used</span>
              <span>{metadata.gasUsed}</span>
            </div>
          )}
          
          {metadata.effectiveGasPrice && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Effective Gas Price</span>
              <span>{metadata.effectiveGasPrice} wei</span>
            </div>
          )}
          
          {metadata.gasPrice && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas Price</span>
              <span>{metadata.gasPrice} wei</span>
            </div>
          )}
          
          {metadata.replacedBy && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Replaced By</span>
              <span className="font-mono">{metadata.replacedBy}</span>
            </div>
          )}
          
          {/* Display other metadata fields */}
          {Object.entries(metadata)
            .filter(([key]) => !['blockNumber', 'confirmations', 'gasUsed', 'effectiveGasPrice', 'gasPrice', 'replacedBy'].includes(key))
            .map(([key, value]) => {
              // Skip complex objects, arrays, etc.
              if (typeof value === 'object' && value !== null) return null;
              
              return (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <span className="truncate max-w-[60%]" title={String(value)}>
                    {String(value)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
      
      {transaction.status === 'failed' && metadata.error && (
        <div className="mt-4">
          <Badge variant="destructive" className="mb-2">Error Details</Badge>
          <div className="bg-destructive/10 p-3 rounded-md text-sm">
            {metadata.error}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetails;