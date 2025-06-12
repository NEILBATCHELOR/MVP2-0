import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tables } from "@/types/core/database";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { supabase } from "@/infrastructure/database/client";
import { CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import LoadingState from "@/components/shared/LoadingState";

// Extend the batch operation type with missing updated_at property
interface BatchOperation extends Tables<"bulk_operations"> {
  updated_at?: string;
}

type ActivityLogEntry = Tables<"audit_logs">;

interface BatchOperationDetailsProps {
  batchId: string;
  onClose?: () => void;
}

const BatchOperationDetails: React.FC<BatchOperationDetailsProps> = ({
  batchId,
  onClose,
}) => {
  const [batchOperation, setBatchOperation] = useState<BatchOperation | null>(null);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Load batch operation details
  const loadBatchOperation = async () => {
    try {
      const { data, error } = await supabase
        .from("bulk_operations")
        .select("*")
        .eq("id", batchId)
        .single();

      if (error) {
        console.error("Error loading batch operation:", error);
        return;
      }

      setBatchOperation(data);

      // Also load activities
      await loadBatchActivities();
    } catch (error) {
      console.error("Exception in loadBatchOperation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load activities related to this batch operation
  const loadBatchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("batch_operation_id", batchId)
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("Error loading batch activities:", error);
        return;
      }

      setActivities(data || []);
    } catch (error) {
      console.error("Exception in loadBatchActivities:", error);
    }
  };

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
    if (!status) return <Clock className="h-5 w-5" />;

    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "processing":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "cancelled":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    } else {
      const interval = setInterval(() => {
        if (batchOperation?.status === 'processing') {
          loadBatchOperation();
        } else {
          clearInterval(interval);
          setAutoRefresh(false);
        }
      }, 5000);
      setRefreshInterval(interval);
    }
    setAutoRefresh(!autoRefresh);
  };

  // Load data when component mounts
  useEffect(() => {
    loadBatchOperation();

    // Clean up interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [batchId]);

  // Auto-start refresh if operation is in processing state
  useEffect(() => {
    if (batchOperation?.status === 'processing' && !autoRefresh && !refreshInterval) {
      toggleAutoRefresh();
    } else if (batchOperation?.status !== 'processing' && autoRefresh && refreshInterval) {
      toggleAutoRefresh();
    }
  }, [batchOperation?.status]);

  if (loading) {
    return <LoadingState message="Loading batch operation details..." />;
  }

  if (!batchOperation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Batch operation not found</h3>
            <p className="text-muted-foreground">
              The requested batch operation could not be found.
            </p>
            {onClose && (
              <Button onClick={onClose} className="mt-4">
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalItems = Array.isArray(batchOperation.target_ids) 
    ? batchOperation.target_ids.length 
    : 0;
  const processedItems = batchOperation.processed_count || 0;
  const failedItems = batchOperation.failed_count || 0;
  const pendingItems = totalItems - processedItems - failedItems;
  const progress = batchOperation.progress || 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(batchOperation.status)}
            <CardTitle>
              {batchOperation.operation_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
            <Badge
              className={
                batchOperation.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : batchOperation.status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : batchOperation.status === 'processing'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }
            >
              {batchOperation.status?.charAt(0).toUpperCase() + batchOperation.status?.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadBatchOperation}
              className="h-8"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
            {batchOperation.status === 'processing' && (
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={toggleAutoRefresh}
                className="h-8"
              >
                {autoRefresh ? "Auto-Refreshing" : "Auto-Refresh"}
              </Button>
            )}
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Batch Details</h3>
            <dl className="grid grid-cols-3 gap-1 text-sm">
              <dt className="font-medium text-muted-foreground">ID:</dt>
              <dd className="col-span-2 font-mono">{batchOperation.id}</dd>
              
              <dt className="font-medium text-muted-foreground">Created:</dt>
              <dd className="col-span-2">{formatTimestamp(batchOperation.created_at)}</dd>
              
              <dt className="font-medium text-muted-foreground">Completed:</dt>
              <dd className="col-span-2">
                {batchOperation.completed_at 
                  ? formatTimestamp(batchOperation.completed_at)
                  : 'In progress'}
              </dd>
              
              <dt className="font-medium text-muted-foreground">Duration:</dt>
              <dd className="col-span-2">
                {calculateDuration(batchOperation.created_at, batchOperation.completed_at)}
              </dd>
              
              <dt className="font-medium text-muted-foreground">Total Items:</dt>
              <dd className="col-span-2">{totalItems}</dd>
              
              <dt className="font-medium text-muted-foreground">Processed:</dt>
              <dd className="col-span-2">{processedItems}</dd>
              
              <dt className="font-medium text-muted-foreground">Failed:</dt>
              <dd className="col-span-2">{failedItems}</dd>
              
              <dt className="font-medium text-muted-foreground">Pending:</dt>
              <dd className="col-span-2">{pendingItems}</dd>
            </dl>
          </div>

          {batchOperation.metadata && (
            <div>
              <h3 className="text-sm font-medium mb-2">Metadata</h3>
              <div className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-48">
                <pre>{JSON.stringify(batchOperation.metadata, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {batchOperation.error_details && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2 text-red-700">Error Details</h3>
            <div className="bg-red-50 p-3 rounded-md text-xs text-red-800 overflow-auto max-h-48">
              <pre>{JSON.stringify(batchOperation.error_details, null, 2)}</pre>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Progress</h3>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}% complete</span>
              <span>
                {processedItems} processed / {failedItems} failed / {totalItems} total
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Activity Log</h3>
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activities recorded for this batch operation.</p>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <div className="divide-y">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-3 hover:bg-muted/30">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center">
                        {getStatusIcon(activity.status)}
                        <span className="ml-2 font-medium text-sm">
                          {activity.action?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="text-sm ml-7">{activity.details}</p>
                    )}
                    {activity.entity_type && activity.entity_id && (
                      <div className="text-xs text-muted-foreground ml-7">
                        {activity.entity_type.charAt(0).toUpperCase() + activity.entity_type.slice(1)}: {activity.entity_id}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-muted/30 flex justify-between py-3">
        <div className="text-xs text-muted-foreground">
          Last updated: {formatTimestamp(batchOperation.updated_at || batchOperation.created_at)}
        </div>
        {batchOperation.status === 'processing' && autoRefresh && (
          <div className="text-xs font-medium text-blue-700">
            Auto-refreshing...
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default BatchOperationDetails;