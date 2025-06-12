import React, { useState, useEffect } from "react";
import { Tables } from "@/types/core/database";
import { ActivityLog } from "@/types/core/centralModels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import LoadingState from "@/components/shared/LoadingState";
import EmptyState from "@/components/shared/EmptyState";
import ActivityLogDetails from "./ActivityLogDetails";
import { supabase } from "@/infrastructure/database/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Using the same type as in ActivityMonitor.tsx for consistency
type ActivityLogEntry = Tables<"audit_logs">;

interface EntityActivityLogProps {
  entityId: string;
  entityType: string;
  limit?: number;
  className?: string;
  title?: string;
  showToggle?: boolean;
}

const EntityActivityLog: React.FC<EntityActivityLogProps> = ({
  entityId,
  entityType,
  limit = 10,
  className = "",
  title = "Activity Log",
  showToggle = true,
}) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<"all" | "user" | "system">("all");

  // Load activity logs for the entity
  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      // Apply source filter if not "all"
      if (sourceFilter === "user") {
        query = query.not("user_id", "is", null);
      } else if (sourceFilter === "system") {
        query = query.eq("action_type", "system");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching entity activity logs:", error);
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error("Exception in loadLogs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and on entityId/entityType/sourceFilter change
  useEffect(() => {
    if (entityId && entityType) {
      loadLogs();
    }
  }, [entityId, entityType, sourceFilter]);

  // Handle log click to show details
  const handleLogClick = (log: ActivityLogEntry) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  // Format timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(date, "MMM d");
  };

  // Format action name
  const formatAction = (action?: string) => {
    if (!action) return "";
    return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
  const getSourceBadge = (log: ActivityLogEntry) => {
    if (log.action_type === "system") {
      return <Badge className="bg-blue-100 text-blue-800">System</Badge>;
    } else if (log.user_email) {
      return <Badge className="bg-purple-100 text-purple-800">User</Badge>;
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {showToggle && (
            <Select 
              value={sourceFilter} 
              onValueChange={(value: "all" | "user" | "system") => setSourceFilter(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Source Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="user">User Actions</SelectItem>
                <SelectItem value="system">System Actions</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="sm" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingState message="Loading activity logs..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No activity records"
            description={`No activity has been recorded for this ${entityType} yet.`}
          />
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/20 px-2 rounded-md transition-colors"
                onClick={() => handleLogClick(log)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">
                      {formatAction(log.action)}
                    </div>
                    {getSourceBadge(log)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    {log.user_email ? (
                      <span>By {log.user_email}</span>
                    ) : (
                      <span>Automated process</span>
                    )}
                    {log.status && (
                      <span className="ml-2">{getStatusBadge(log.status)}</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1 sm:mt-0">
                  {formatTimestamp(log.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}

        <ActivityLogDetails
          log={selectedLog}
          open={showDetails}
          onOpenChange={setShowDetails}
        />
      </CardContent>
    </Card>
  );
};

export default EntityActivityLog;
