import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Clock, 
  AlertCircle, 
  Rocket,
  BatteryMedium,
  BatteryLow,
  Info
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionMonitor } from '@/services/blockchain/TransactionMonitor';
import { FeePriority, NetworkCongestion } from '@/services/blockchain/FeeEstimator';

export interface GasEstimatorProps {
  blockchain: string;
  onSelectFeeData: (feeData: any) => void;
  defaultPriority?: FeePriority;
  className?: string;
}

const GasEstimator: React.FC<GasEstimatorProps> = ({
  blockchain,
  onSelectFeeData,
  defaultPriority = FeePriority.MEDIUM,
  className
}) => {
  const [priority, setPriority] = useState<FeePriority>(defaultPriority);
  const [loading, setLoading] = useState<boolean>(true);
  const [feeData, setFeeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const transactionMonitor = TransactionMonitor.getInstance();
  
  const fetchFeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await transactionMonitor.getOptimalFeeData(blockchain, priority);
      setFeeData(data);
      
      // Pass data to parent
      onSelectFeeData(data);
    } catch (error) {
      setError(`Failed to fetch fee data: ${(error as Error).message}`);
      console.error('Error fetching fee data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch fee data on component mount and when priority changes
  useEffect(() => {
    fetchFeeData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchFeeData, 30000);
    
    return () => clearInterval(interval);
  }, [blockchain, priority]);
  
  const formatGwei = (wei: string) => {
    if (!wei) return '0';
    
    const gwei = Number(BigInt(wei)) / 1e9;
    return gwei.toFixed(2);
  };
  
  const getNetworkCongestionInfo = () => {
    if (!feeData) return { label: 'Unknown', icon: null, color: 'bg-muted' };
    
    switch (feeData.networkCongestion) {
      case NetworkCongestion.LOW:
        return { 
          label: 'Low',
          icon: <BatteryLow className="h-4 w-4 text-green-500" />,
          color: 'bg-green-500'
        };
      case NetworkCongestion.MEDIUM:
        return { 
          label: 'Medium',
          icon: <BatteryMedium className="h-4 w-4 text-yellow-500" />,
          color: 'bg-yellow-500'
        };
      case NetworkCongestion.HIGH:
        return { 
          label: 'High',
          icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
          color: 'bg-orange-500'
        };
      case NetworkCongestion.VERY_HIGH:
        return { 
          label: 'Very High',
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
          color: 'bg-red-500'
        };
      default:
        return { 
          label: 'Unknown',
          icon: <Info className="h-4 w-4" />,
          color: 'bg-muted'
        };
    }
  };
  
  const getEstimatedTime = () => {
    if (!feeData || !feeData.estimatedTimeSeconds) return '~1 min';
    
    const seconds = feeData.estimatedTimeSeconds;
    if (seconds < 60) return `~${seconds} sec`;
    const minutes = Math.round(seconds / 60);
    return `~${minutes} min`;
  };
  
  const congestionInfo = getNetworkCongestionInfo();
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          Gas Fee Estimator
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${congestionInfo.color}`}></div>
            <span className="text-sm">Network Congestion: {congestionInfo.label}</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="text-sm flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {getEstimatedTime()}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated confirmation time for {priority} priority</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Separator className="mb-4" />
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Priority Level</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as FeePriority)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FeePriority.LOW}>
                  <div className="flex items-center gap-2">
                    <BatteryLow className="h-4 w-4" />
                    <span>Low (Slower)</span>
                  </div>
                </SelectItem>
                <SelectItem value={FeePriority.MEDIUM}>
                  <div className="flex items-center gap-2">
                    <BatteryMedium className="h-4 w-4" />
                    <span>Medium (Standard)</span>
                  </div>
                </SelectItem>
                <SelectItem value={FeePriority.HIGH}>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>High (Faster)</span>
                  </div>
                </SelectItem>
                <SelectItem value={FeePriority.URGENT}>
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    <span>Urgent (Fastest)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Gas Price (gwei)</Label>
              {loading ? (
                <Skeleton className="h-7 w-full mt-1" />
              ) : (
                <div className="text-xl font-semibold">
                  {feeData?.gasPrice 
                    ? formatGwei(feeData.gasPrice)
                    : (feeData?.maxFeePerGas ? formatGwei(feeData.maxFeePerGas) : '0')} gwei
                </div>
              )}
            </div>
            
            {feeData?.maxFeePerGas && feeData?.maxPriorityFeePerGas && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Max Fee (gwei)</Label>
                  {loading ? (
                    <Skeleton className="h-5 w-full mt-1" />
                  ) : (
                    <div className="text-sm font-medium">
                      {formatGwei(feeData.maxFeePerGas)}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Priority Fee (gwei)</Label>
                  {loading ? (
                    <Skeleton className="h-5 w-full mt-1" />
                  ) : (
                    <div className="text-sm font-medium">
                      {formatGwei(feeData.maxPriorityFeePerGas)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-2 bg-destructive/10 rounded text-destructive text-sm">
            {error}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end border-t pt-3 pb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchFeeData}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Updating...
            </>
          ) : (
            <>Refresh</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GasEstimator;