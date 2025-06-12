import React from "react";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const riskIndicatorVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
  {
    variants: {
      variant: {
        low: "bg-green-100 text-green-700 hover:bg-green-200/80",
        medium: "bg-amber-100 text-amber-700 hover:bg-amber-200/80",
        high: "bg-orange-100 text-orange-700 hover:bg-orange-200/80",
        critical: "bg-red-100 text-red-700 hover:bg-red-200/80",
        unknown: "bg-gray-100 text-gray-700 hover:bg-gray-200/80",
      },
      size: {
        default: "h-8 px-3 py-2",
        sm: "h-6 px-2 rounded-md text-xs",
        lg: "h-10 px-4 rounded-md",
        icon: "h-8 w-8",
      },
      shape: {
        default: "rounded-md",
        circle: "rounded-full",
        square: "rounded-sm",
      },
    },
    defaultVariants: {
      variant: "unknown",
      size: "default",
      shape: "default",
    },
  }
);

export interface WalletRiskIndicatorProps extends 
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof riskIndicatorVariants> {
  score?: number;
  showLabel?: boolean;
  showScore?: boolean;
  tooltip?: string;
  onClick?: () => void;
}

export const WalletRiskIndicator: React.FC<WalletRiskIndicatorProps> = ({
  variant = "unknown",
  size = "default",
  shape = "default",
  score,
  showLabel = false,
  showScore = false,
  tooltip,
  className,
  onClick,
  ...props
}) => {
  const getIcon = () => {
    switch (variant) {
      case "low":
        return <CheckCircle className="h-4 w-4" />;
      case "medium":
        return <Shield className="h-4 w-4" />;
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "critical":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (variant) {
      case "low":
        return "Low Risk";
      case "medium":
        return "Medium Risk";
      case "high":
        return "High Risk";
      case "critical":
        return "Critical Risk";
      default:
        return "Unknown Risk";
    }
  };

  const content = (
    <div
      className={cn(
        riskIndicatorVariants({ variant, size, shape }),
        className,
        "cursor-pointer"
      )}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-center space-x-1">
        {getIcon()}
        {showLabel && <span className="ml-1.5">{getLabel()}</span>}
        {showScore && score !== undefined && (
          <span className="ml-1.5">{score}/100</span>
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

// Helper function to determine risk level from score
export function getRiskLevelFromScore(score: number): "low" | "medium" | "high" | "critical" | "unknown" {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  if (score >= 0) return "critical";
  return "unknown";
}