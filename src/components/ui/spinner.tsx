import React from "react";
import { cn } from "@/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg';
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'default', ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)}
        {...props}
      >
        <Loader2 className="h-full w-full" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";