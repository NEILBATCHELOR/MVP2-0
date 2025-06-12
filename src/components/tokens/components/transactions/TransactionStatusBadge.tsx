import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ArrowRightLeft,
  Ban
} from 'lucide-react';

export interface TransactionStatusBadgeProps {
  status: string;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const TransactionStatusBadge: React.FC<TransactionStatusBadgeProps> = ({
  status,
  className,
  showLabel = true,
  size = 'md'
}) => {
  const getStatusInfo = () => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'complete':
      case 'success':
        return {
          label: 'Confirmed',
          variant: 'success',
          icon: <CheckCircle className={sizeClass} />,
        };
        
      case 'failed':
      case 'error':
      case 'rejected':
        return {
          label: 'Failed',
          variant: 'destructive',
          icon: <XCircle className={sizeClass} />,
        };
        
      case 'pending':
      case 'processing':
      case 'submitted':
        return {
          label: 'Pending',
          variant: 'warning',
          icon: <Clock className={sizeClass} />,
        };
        
      case 'replaced':
        return {
          label: 'Replaced',
          variant: 'outline',
          icon: <ArrowRightLeft className={sizeClass} />,
        };
        
      case 'speed_up':
      case 'speedup':
        return {
          label: 'Sped Up',
          variant: 'outline',
          icon: <ArrowRightLeft className={sizeClass} />,
        };
        
      case 'canceled':
        return {
          label: 'Canceled',
          variant: 'secondary',
          icon: <Ban className={sizeClass} />,
        };
        
      default:
        return {
          label: 'Unknown',
          variant: 'secondary',
          icon: <AlertTriangle className={sizeClass} />,
        };
    }
  };

  const { label, variant, icon } = getStatusInfo();
  
  return (
    <Badge
      variant={variant as any}
      className={cn(
        'gap-1',
        {
          'px-2 py-0.5 h-6': size === 'md',
          'px-1.5 py-0 h-5 text-xs': size === 'sm',
          'px-2.5 py-1 h-7': size === 'lg',
        },
        className
      )}
    >
      {icon}
      {showLabel && <span>{label}</span>}
    </Badge>
  );
};

export default TransactionStatusBadge;