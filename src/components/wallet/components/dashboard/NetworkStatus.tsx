import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CircleCheck, AlertTriangle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

// Network data - in a real app, this would come from an API or context
const networks = [
  {
    id: "ethereum",
    name: "Ethereum",
    status: "operational",
    gasPrice: "25",
    blockHeight: 19245678,
    lastUpdated: "30 sec ago",
    averageBlockTime: "12.3s",
  },
  {
    id: "polygon",
    name: "Polygon",
    status: "operational",
    gasPrice: "110",
    blockHeight: 52364789,
    lastUpdated: "15 sec ago",
    averageBlockTime: "2.1s",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    status: "operational",
    gasPrice: "32",
    blockHeight: 43289176,
    lastUpdated: "20 sec ago",
    averageBlockTime: "2.8s",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    status: "degraded",
    gasPrice: "0.35",
    blockHeight: 187654321,
    lastUpdated: "45 sec ago",
    averageBlockTime: "0.25s",
  },
  {
    id: "optimism",
    name: "Optimism",
    status: "operational",
    gasPrice: "0.25",
    blockHeight: 112345678,
    lastUpdated: "25 sec ago",
    averageBlockTime: "0.3s",
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    status: "operational",
    gasPrice: "15 sat/vB",
    blockHeight: 824569,
    lastUpdated: "8 min ago",
    averageBlockTime: "9.5m",
  }
];

// Function to format gas price
const formatGasPrice = (price: string) => {
  if (price.includes("sat")) return price;
  return `${price} gwei`;
};

// Function to get status indicator
const getStatusIndicator = (status: string) => {
  switch (status) {
    case "operational":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">
          <CircleCheck className="h-3 w-3 mr-1" />
          Operational
        </Badge>
      );
    case "degraded":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Degraded
        </Badge>
      );
    case "outage":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">
          <AlertCircle className="h-3 w-3 mr-1" />
          Outage
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
};

export const NetworkStatus: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Network Status</CardTitle>
            <CardDescription>
              Real-time blockchain network information
            </CardDescription>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 mr-1" />
            Last updated: 30s ago
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {networks.map((network) => (
            <div key={network.id} className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{network.name}</span>
                  {getStatusIndicator(network.status)}
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="text-xs">
                  <span className="text-muted-foreground">Gas Price:</span>{" "}
                  <span className="font-medium">{formatGasPrice(network.gasPrice)}</span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Block:</span>{" "}
                  <span className="font-medium">{network.blockHeight.toLocaleString()}</span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Avg Time:</span>{" "}
                  <span className="font-medium">{network.averageBlockTime}</span>
                </div>
              </div>
              
              <div className="mt-2">
                <Progress 
                  value={network.status === "operational" ? 100 : network.status === "degraded" ? 60 : 20} 
                  className="h-1"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};