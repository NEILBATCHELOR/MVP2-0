import React from 'react';
import { Button, ButtonProps } from './button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/utils';

interface RefreshLinkProps extends ButtonProps {
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const RefreshLink = React.forwardRef<HTMLButtonElement, RefreshLinkProps>(
  ({ className, children, refreshing = false, onRefresh, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="sm"
        className={cn("gap-1 p-0 h-auto hover:bg-transparent", className)}
        onClick={onRefresh}
        disabled={refreshing}
        {...props}
      >
        <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        {children || "Refresh"}
      </Button>
    );
  }
);

RefreshLink.displayName = 'RefreshLink'; 