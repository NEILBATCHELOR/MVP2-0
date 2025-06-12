import React, { useState } from "react";
import { Tables } from "@/types/core/database";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Play, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ProcessCardProps {
  process: Tables<"system_processes">;
  isExpanded: boolean;
  onExpandToggle: () => void;
}

const ProcessCard: React.FC<ProcessCardProps> = ({
  process,
  isExpanded,
  onExpandToggle
}) => {
  // Format timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
  };

  // Calculate duration
  const calculateDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return "";
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    const durationMs = end.getTime() - start.getTime();
    
    // Format duration
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${Math.round(durationMs / 1000)}s`;
    } else if (durationMs < 3600000) {
      return `${Math.round(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`;
    } else {
      const hours = Math.floor(durationMs / 3600000);
      const minutes = Math.floor((durationMs % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    }
  };

  // Get status icon
  const getStatusIcon = (status?: string) => {
    if (!status) return <Clock className="h-4 w-4" />;

    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "running":
      case "processing":
        return <Play className="h-4 w-4 text-blue-600" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;

    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "running":
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      case "cancelled":
        return <Badge className="bg-yellow-100 text-yellow-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 flex flex-row items-center justify-between cursor-pointer" onClick={onExpandToggle}>
        <div className="flex items-center">
          {getStatusIcon(process.status)}
          <span className="ml-2 font-medium">{process.process_name}</span>
          {getStatusBadge(process.status)}
          <span className="ml-2 text-xs text-muted-foreground">
            {formatTimestamp(process.start_time)}
          </span>
        </div>
        <div className="flex items-center">
          <span className="mr-2 text-sm">
            {calculateDuration(process.start_time, process.end_time)}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pb-4 px-4 bg-muted/10">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Process ID</p>
                <p className="text-sm font-mono">{process.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm">{process.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="text-sm">{formatTimestamp(process.start_time)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ended</p>
                <p className="text-sm">{process.end_time ? formatTimestamp(process.end_time) : 'Still running'}</p>
              </div>
            </div>

            {process.progress !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm">{process.progress}%</span>
                </div>
                <Progress value={process.progress} className="h-2" />
              </div>
            )}

            {process.metadata && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Metadata</p>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(process.metadata, null, 2)}
                </pre>
              </div>
            )}

            {process.error_details && (
              <div>
                <p className="text-sm text-muted-foreground mb-1 text-red-500">Error Details</p>
                <pre className="text-xs bg-red-50 text-red-800 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(process.error_details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ProcessCard; 