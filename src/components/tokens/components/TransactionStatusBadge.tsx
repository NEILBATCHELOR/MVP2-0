import React from 'react';
import { cn } from '@/utils';
import { Check, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'unknown';

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
  txHash?: string;
  className?: string;
  showTooltip?: boolean;
}

export const TransactionStatusBadge: React.FC<TransactionStatusBadgeProps> = ({
  status,
  txHash,
  className,
  showTooltip = true,
}) => {
  const getStatusDetails = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          icon: <Loader2 className="mr-1 h-3 w-3 animate-spin" />,
          variant: 'outline',
          tooltip: 'Transaction is being processed',
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          icon: <Check className="mr-1 h-3 w-3" />,
          variant: 'success',
          tooltip: 'Transaction has been confirmed',
        };
      case 'failed':
        return {
          label: 'Failed',
          icon: <AlertCircle className="mr-1 h-3 w-3" />,
          variant: 'destructive',
          tooltip: 'Transaction has failed',
        };
      default:
        return {
          label: 'Unknown',
          icon: <Clock className="mr-1 h-3 w-3" />,
          variant: 'secondary',
          tooltip: 'Transaction status unknown',
        };
    }
  };

  const { label, icon, variant, tooltip } = getStatusDetails(status);

  const badgeContent = (
    <Badge 
      className={cn("flex items-center", className)} 
      variant={variant as any}
    >
      {icon}
      {label}
    </Badge>
  );

  if (showTooltip && txHash) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              TX: {txHash?.substring(0, 10)}...
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
};