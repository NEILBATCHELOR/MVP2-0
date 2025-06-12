import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getKYCStatus, type KYCStatus } from "@/utils/compliance/kyc";

interface KYCStatusCellProps {
  status: "approved" | "pending" | "failed" | "not_started" | "expired";
  lastUpdated?: string;
  onScreenInvestor?: () => void;
}

const statusConfig = {
  approved: {
    icon: CheckCircle2,
    label: "Approved",
    variant: "success",
    tooltipText: "KYC verification approved",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    iconColor: "text-green-500",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    variant: "warning",
    tooltipText: "KYC verification in progress",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
    iconColor: "text-yellow-500",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    variant: "destructive",
    tooltipText: "KYC verification failed",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    iconColor: "text-red-500",
  },
  not_started: {
    icon: AlertCircle,
    label: "Not Started",
    variant: "secondary",
    tooltipText: "KYC verification not started",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    iconColor: "text-gray-500",
  },
  expired: {
    icon: AlertCircle,
    label: "Expired",
    variant: "destructive",
    tooltipText: "KYC verification expired (over 6 months old)",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    iconColor: "text-red-500",
  },
} as const;

const KYCStatusCell = ({
  onScreenInvestor = () => {},
  status = "not_started",
  lastUpdated = "Never",
}: KYCStatusCellProps) => {
  const effectiveStatus = getKYCStatus(status, lastUpdated);
  const config = statusConfig[effectiveStatus] || statusConfig.not_started;
  const Icon = config.icon;

  const needsScreening =
    effectiveStatus === "failed" || effectiveStatus === "not_started";

  return (
    <div className="flex items-center justify-start gap-2 p-2 min-w-[120px]">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border ${config.bgColor} ${config.borderColor} ${config.textColor} cursor-help transition-colors duration-200`}
            >
              <Icon className={`h-4 w-4 ${config.iconColor}`} />
              <span className="text-sm font-medium">{config.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.tooltipText}</p>
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {needsScreening && (
        <Button
          onClick={onScreenInvestor}
          size="sm"
          className="ml-2 h-7 px-2 text-xs"
        >
          Screen
        </Button>
      )}
    </div>
  );
};

export default KYCStatusCell;
