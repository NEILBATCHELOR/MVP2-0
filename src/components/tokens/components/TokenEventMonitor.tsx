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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, CheckCircle2, Clock, Activity, Layers, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { deploymentService } from '@/services/deployment/DeploymentService';
import { deploymentTransactionMonitor } from '@/infrastructure/web3/transactions/DeploymentTransactionMonitor';
import { TokenStandard } from '@/types/core/centralModels';

interface TokenEventMonitorProps {
  tokenId: string;
  tokenAddress?: string;
  blockchain?: string;
  environment?: string;
}

interface TokenEvent {
  id: string;
  eventName: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: string;
  data: any;
}

const TokenEventMonitor: React.FC<TokenEventMonitorProps> = ({
  tokenId,
  tokenAddress,
  blockchain = 'ethereum',
  environment = 'testnet'
}) => {
  const [events, setEvents] = useState<TokenEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial events
  useEffect(() => {
    if (tokenAddress) {
      fetchTokenEvents();
    }
  }, [tokenAddress]);

  // Set up event listeners
  useEffect(() => {
    // Handler for token events
    const handleTokenEvent = (event: any) => {
      if (event.contractAddress === tokenAddress) {
        setEvents(prev => {
          // Check if event already exists to avoid duplicates
          const exists = prev.some(e => 
            e.transactionHash === event.transactionHash && 
            e.eventName === event.eventName && 
            e.blockNumber === event.blockNumber
          );
          
          if (exists) return prev;
          
          // Add new event
          return [{
            id: `${event.transactionHash}-${event.eventName}-${event.blockNumber}`,
            eventName: event.eventName,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: event.timestamp || new Date().toISOString(),
            data: event.data
          }, ...prev];
        });
      }
    };
    
    // Register event listeners
    deploymentService.on('token:event', handleTokenEvent);
    
    // Clean up
    return () => {
      deploymentService.removeListener('token:event', handleTokenEvent);
    };
  }, [tokenAddress]);

  // Fetch token events
  const fetchTokenEvents = async () => {
    if (!tokenAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Set up token event monitoring if not already set up
      deploymentTransactionMonitor.monitorTokenEvents(
        tokenAddress,
        blockchain,
        environment as any,
        TokenStandard.ERC20 // Default, will be overridden if another standard is detected
      );
      
      // For now we're just displaying real-time events
      // In a real implementation, we would fetch historical events from a database
      
      setLoading(false);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch token events');
      setLoading(false);
    }
  };

  // Get event badge based on event name
  const getEventBadge = (eventName: string) => {
    switch(eventName) {
      case 'Transfer':
        return <Badge className="bg-green-100 text-green-800">Transfer</Badge>;
      case 'Approval':
        return <Badge className="bg-blue-100 text-blue-800">Approval</Badge>;
      case 'Paused':
        return <Badge className="bg-orange-100 text-orange-800">Paused</Badge>;
      case 'Unpaused':
        return <Badge className="bg-purple-100 text-purple-800">Unpaused</Badge>;
      case 'Snapshot':
        return <Badge className="bg-indigo-100 text-indigo-800">Snapshot</Badge>;
      case 'Rebase':
        return <Badge className="bg-yellow-100 text-yellow-800">Rebase</Badge>;
      case 'FeeCollected':
        return <Badge className="bg-red-100 text-red-800">Fee Collected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{eventName}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Token Events</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchTokenEvents}
            disabled={loading || !tokenAddress}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Real-time events for your token contract
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!tokenAddress ? (
          <Alert className="mb-4">
            <Layers className="h-4 w-4" />
            <AlertTitle>Token not deployed</AlertTitle>
            <AlertDescription>
              Deploy your token to the blockchain to monitor events.
            </AlertDescription>
          </Alert>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No events recorded yet.</p>
            <p className="text-sm">Events will appear here in real-time as they occur on the blockchain.</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map(event => (
                  <TableRow key={event.id}>
                    <TableCell>{getEventBadge(event.eventName)}</TableCell>
                    <TableCell>{event.blockNumber}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => {
                          // Show event details in a modal or tooltip
                          alert(JSON.stringify(event.data, null, 2));
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {events.length > 0 && (
        <CardFooter>
          <Button variant="outline" className="w-full" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Events
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default TokenEventMonitor;