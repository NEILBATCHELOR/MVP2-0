import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

interface SubscriptionBadgeProps {
  status: "active" | "canceled" | "expired" | "trial" | string;
  className?: string;
}

const SubscriptionBadge = ({
  status,
  className = "",
}: SubscriptionBadgeProps) => {
  const getStatusDetails = () => {
    switch (status) {
      case "active":
        return {
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          text: "Active",
          className: "bg-green-100 text-green-800",
        };
      case "trial":
        return {
          icon: <Clock className="h-3 w-3 mr-1" />,
          text: "Trial",
          className: "bg-blue-100 text-blue-800",
        };
      case "canceled":
        return {
          icon: <XCircle className="h-3 w-3 mr-1" />,
          text: "Canceled",
          className: "bg-yellow-100 text-yellow-800",
        };
      case "expired":
        return {
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          text: "Expired",
          className: "bg-red-100 text-red-800",
        };
      default:
        return {
          icon: null,
          text: status,
          className: "bg-gray-100 text-gray-800",
        };
    }
  };

  const { icon, text, className: statusClassName } = getStatusDetails();

  return (
    <Badge className={`flex items-center ${statusClassName} ${className}`}>
      {icon}
      {text}
    </Badge>
  );
};

export default SubscriptionBadge;
