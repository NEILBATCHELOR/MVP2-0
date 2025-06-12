import React from "react";
import { Tables } from "@/types/core/database";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type ActivityLogEntry = Tables<"audit_logs">;

interface ActivityLogDetailsProps {
  log: ActivityLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ActivityLogDetails: React.FC<ActivityLogDetailsProps> = ({
  log,
  open,
  onOpenChange,
}) => {
  if (!log) return null;

  // Format timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    try {
      return format(new Date(timestamp), "PPP pp");
    } catch (e) {
      console.error("Error formatting timestamp:", e);
      return timestamp;
    }
  };

  // Format action type for display
  const formatActionType = (actionType?: string) => {
    if (!actionType) return "";
    return actionType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get status badge color
  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;

    switch (status.toLowerCase()) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "failure":
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get source badge (user or system)
  const getSourceBadge = () => {
    if (log.action_type === "system") {
      return <Badge className="bg-blue-100 text-blue-800">System</Badge>;
    } else if (log.user_email) {
      return <Badge className="bg-purple-100 text-purple-800">User</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  // Format JSON for display
  const formatJSON = (json: any) => {
    try {
      if (typeof json === "string") {
        json = JSON.parse(json);
      }
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return JSON.stringify(json);
    }
  };

  // Extract system metadata if available
  const getSystemMetadata = () => {
    if (!log.metadata) return null;
    
    let metadata;
    try {
      metadata = typeof log.metadata === 'string' 
        ? JSON.parse(log.metadata) 
        : log.metadata;
    } catch (e) {
      return null;
    }
    
    if (metadata.source !== 'system') return null;
    
    return (
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-medium mb-2">System Process Details</h4>
        <div className="grid grid-cols-2 gap-4">
          {metadata.process_name && (
            <div>
              <h5 className="text-xs font-medium mb-1">Process</h5>
              <p className="text-xs">{metadata.process_name}</p>
            </div>
          )}
          
          {metadata.initiated_by && (
            <div>
              <h5 className="text-xs font-medium mb-1">Initiated By</h5>
              <p className="text-xs">{metadata.initiated_by}</p>
            </div>
          )}
          
          {metadata.batch_id && (
            <div>
              <h5 className="text-xs font-medium mb-1">Batch ID</h5>
              <p className="text-xs font-mono">{metadata.batch_id}</p>
            </div>
          )}
          
          {metadata.automation_type && (
            <div>
              <h5 className="text-xs font-medium mb-1">Automation Type</h5>
              <p className="text-xs">{metadata.automation_type}</p>
            </div>
          )}
          
          {metadata.automated !== undefined && (
            <div>
              <h5 className="text-xs font-medium mb-1">Automated</h5>
              <p className="text-xs">{metadata.automated ? "Yes" : "No"}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Activity Log Details</DialogTitle>
          <DialogDescription>
            Detailed information about this activity log entry.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Timestamp</h4>
            <p className="text-sm">{formatTimestamp(log.timestamp)}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Source</h4>
            <div>{getSourceBadge()}</div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">User</h4>
            <p className="text-sm">{log.user_email || "System Process"}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Action</h4>
            <p className="text-sm">{formatActionType(log.action)}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Status</h4>
            <div>{getStatusBadge(log.status)}</div>
          </div>

          {log.entity_type && (
            <div>
              <h4 className="text-sm font-medium mb-1">Entity Type</h4>
              <p className="text-sm capitalize">{log.entity_type}</p>
            </div>
          )}

          {log.entity_id && (
            <div>
              <h4 className="text-sm font-medium mb-1">Entity ID</h4>
              <p className="text-sm font-mono">{log.entity_id}</p>
            </div>
          )}

          {log.project_id && (
            <div>
              <h4 className="text-sm font-medium mb-1">Project ID</h4>
              <p className="text-sm font-mono">{log.project_id}</p>
            </div>
          )}
          
          {log.action_type && (
            <div>
              <h4 className="text-sm font-medium mb-1">Action Type</h4>
              <p className="text-sm">{log.action_type}</p>
            </div>
          )}

          {log.occurred_at && (
            <div>
              <h4 className="text-sm font-medium mb-1">Occurred At</h4>
              <p className="text-sm">{formatTimestamp(log.occurred_at)}</p>
            </div>
          )}
        </div>

        {/* System-specific metadata section */}
        {getSystemMetadata()}

        {/* Data changes section */}
        {log.changes && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Data Changes</h4>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {formatJSON(log.changes)}
              </pre>
            </ScrollArea>
          </div>
        )}

        {/* Before/After data section */}
        {(log.old_data || log.new_data) && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Data Comparison</h4>
            <div className="grid grid-cols-2 gap-4">
              {log.old_data && (
                <div>
                  <h5 className="text-xs font-medium mb-1">Before</h5>
                  <ScrollArea className="h-[180px] rounded-md border p-2">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {formatJSON(log.old_data)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
              
              {log.new_data && (
                <div>
                  <h5 className="text-xs font-medium mb-1">After</h5>
                  <ScrollArea className="h-[180px] rounded-md border p-2">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {formatJSON(log.new_data)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional details section */}
        {(log.details || log.metadata) && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Additional Details</h4>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {log.details && formatJSON(log.details)}
                {log.metadata && (
                  <>
                    {log.details && <hr className="my-2" />}
                    <h5 className="font-semibold mb-1">Metadata:</h5>
                    {formatJSON(log.metadata)}
                  </>
                )}
              </pre>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActivityLogDetails;
