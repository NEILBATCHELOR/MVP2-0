import React from "react";
import { Badge } from "@/components/ui/badge";

interface KycStatusBadgeProps {
  status: string;
  className?: string;
}

const KycStatusBadge = ({ status, className = "" }: KycStatusBadgeProps) => {
  switch (status) {
    case "approved":
      return (
        <Badge className={`bg-green-100 text-green-800 ${className}`}>
          Approved
        </Badge>
      );
    case "pending":
      return (
        <Badge className={`bg-yellow-100 text-yellow-800 ${className}`}>
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className={`bg-red-100 text-red-800 ${className}`}>Failed</Badge>
      );
    case "not_started":
      return (
        <Badge className={`bg-gray-100 text-gray-800 ${className}`}>
          Not Started
        </Badge>
      );
    case "expired":
      return (
        <Badge className={`bg-orange-100 text-orange-800 ${className}`}>
          Expired
        </Badge>
      );
    default:
      return <Badge className={className}>{status || "Unknown"}</Badge>;
  }
};

export default KycStatusBadge;
