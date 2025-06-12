import React, { useState, useEffect, useCallback } from "react";
import { Tables } from "@/types/core/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Download, Filter, RefreshCw, Search, Info, Table2, Database } from "lucide-react";
import { format } from "date-fns";
import LoadingState from "@/components/shared/LoadingState";
import EmptyState from "@/components/shared/EmptyState";
import { supabase } from "@/infrastructure/database/client";
import ActivityLogDetails from "./ActivityLogDetails";
import SystemProcessDashboard from "./SystemProcessDashboard";

type ActivityLogEntry = Tables<"audit_logs">;

interface ActivityMonitorProps {
  projectId?: string;
  limit?: number;
  showHeader?: boolean;
  hideSystemAndMetricsTabs?: boolean;
}

const ActivityMonitor: React.FC<ActivityMonitorProps> = ({ 
  projectId,
  limit = 20,
  showHeader = true,
  hideSystemAndMetricsTabs = false
}) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    action_type: "",
    entity_type: "",
    entity_id: "",
    table_name: "",
    operation: "",
    status: "",
    start_date: "",
    end_date: "",
    source: "",
    importance: "",
    system_process_id: "",
    batch_operation_id: "",
    severity: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [operations, setOperations] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>(["user", "system"]);
  const [selectedLog, setSelectedLog] = useState<ActivityLogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const ITEMS_PER_PAGE = limit;

  // Load activity logs
  const loadLogs = async () => {
    // Skip loading if metrics tab is selected since it will navigate away
    if (activeTab === "metrics") return;
    
    // Also skip loading for system tab as it has its own dashboard component
    if (activeTab === "system") return;
    
    setLoading(true);
    try {
      // Calculate offset based on current page
      const offset = (page - 1) * ITEMS_PER_PAGE;

      // Prepare query
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      // Apply filters if they are set
      if (filters.action_type) {
        query = query.eq("action", filters.action_type);
      }

      if (filters.entity_type) {
        query = query.eq("entity_type", filters.entity_type);
      }
      
      // Enhanced entity filtering - support exact match on entity_id
      if (filters.entity_id) {
        query = query.eq("entity_id", filters.entity_id);
      }
      
      // Enhanced table name filtering with improved logic
      if (filters.table_name) {
        // Search in both metadata->table_name and entity_id prefix
        query = query.or(`metadata->table_name.eq.${filters.table_name},entity_id.like.${filters.table_name}_%`);
      }
      
      // Apply operation filter if set
      if (filters.operation) {
        query = query.or(`action.like.%${filters.operation}%,details.like.%${filters.operation}%`);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      // Enhanced source filtering
      if (filters.source) {
        if (filters.source === "user") {
          query = query.not("user_id", "is", null);
        } else if (filters.source === "system") {
          query = query.eq("source", "system");
        } else if (filters.source === "integration") {
          query = query.eq("source", "integration");
        } else if (filters.source === "scheduled") {
          query = query.eq("source", "scheduled");
        }
      }
      
      // Apply severity filter if set
      if (filters.severity) {
        query = query.eq("severity", filters.severity);
      }
      
      // Apply system process filter if set
      if (filters.system_process_id) {
        query = query.eq("system_process_id", filters.system_process_id);
      }

      // Apply batch operation filter if set
      if (filters.batch_operation_id) {
        query = query.eq("batch_operation_id", filters.batch_operation_id);
      }

      if (filters.start_date) {
        query = query.gte("timestamp", filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte("timestamp", filters.end_date);
      }

      // Apply tab-specific filters
      if (activeTab === "auth") {
        query = query.ilike("action", "auth_%");
      } else if (activeTab === "data") {
        query = query.or(
          "action.ilike.%_investors,action.ilike.%_subscriptions,action.ilike.%_token_allocations,action.ilike.%_projects",
        );
      } else if (activeTab === "admin") {
        query = query.or(
          "action.ilike.%_user_roles,action.ilike.%_rules,action.ilike.%_permissions",
        );
      } else if (activeTab === "system") {
        query = query.eq("action_type", "system");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching activity logs:", error);
        setLogs([]);
      } else {
        // Filter by search query if provided
        let filteredLogs = data || [];
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredLogs = filteredLogs.filter(
            (log) =>
              (log.user_email &&
                log.user_email.toLowerCase().includes(query)) ||
              (log.action && log.action.toLowerCase().includes(query)) ||
              (log.entity_type &&
                log.entity_type.toLowerCase().includes(query)) ||
              (log.entity_id && log.entity_id.toLowerCase().includes(query)) ||
              (log.details &&
                String(log.details).toLowerCase().includes(query)),
          );
        }

        setLogs(filteredLogs);

        // Calculate total pages - in a real app, you would get the count from the API
        // For now, we'll assume there are more pages if we got a full page of results
        setTotalPages(
          Math.max(1, filteredLogs.length === ITEMS_PER_PAGE ? page + 1 : page),
        );
      }
    } catch (error) {
      console.error("Error loading activity logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique values for filters
  const extractUniqueValues = useCallback(async () => {
    try {
      // Fetch unique action types
      const { data: actionData } = await supabase
        .from("audit_logs")
        .select("action")
        .not("action", "is", null);
      
      // Fetch unique entity types
      const { data: entityData } = await supabase
        .from("audit_logs")
        .select("entity_type")
        .not("entity_type", "is", null);
      
      // Fetch unique table names from both direct references and metadata
      const { data: tableData } = await supabase
        .from("audit_logs")
        .select("entity_id, metadata");
      
      if (actionData) {
        const actions = Array.from(
          new Set(actionData.map((item) => item.action).filter(Boolean))
        );
        setActionTypes(actions as string[]);
      }
      
      if (entityData) {
        const entities = Array.from(
          new Set(entityData.map((item) => item.entity_type).filter(Boolean))
        );
        setEntityTypes(entities as string[]);
      }
      
      if (tableData) {
        const tables = new Set<string>();

        // Extract table names from metadata
        tableData.forEach(log => {
          if (log.metadata && typeof log.metadata === 'object' && 'table_name' in log.metadata) {
            const tableName = log.metadata.table_name;
            if (typeof tableName === 'string') {
              tables.add(tableName);
            }
          }
        });

        // Extract table names from entity_id (format: table_id)
        tableData.forEach(log => {
          if (log.entity_id && log.entity_id.includes('_')) {
            const tableName = log.entity_id.split('_')[0];
            tables.add(tableName);
          }
        });

        setTableNames(Array.from(tables).sort());
        
        // Extract common operations
        const commonOperations = ["create", "update", "delete", "read", "export", "import", "sync", "process"];
        setOperations(commonOperations);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, []);

  // Extract unique table names from audit logs
  const extractUniqueTables = useCallback(async () => {
    try {
      // Fetch distinct table names from metadata
      const { data: metadataTableData } = await supabase
        .from("audit_logs")
        .select("metadata")
        .not("metadata", "is", null);

      // Fetch distinct table names from entity_id
      const { data: entityTableData } = await supabase
        .from("audit_logs")
        .select("entity_id")
        .not("entity_id", "is", null);

      const tables = new Set<string>();

      // Extract table names from metadata
      if (metadataTableData) {
        metadataTableData.forEach(log => {
          if (log.metadata && typeof log.metadata === 'object' && 'table_name' in log.metadata) {
            const tableName = log.metadata.table_name;
            if (typeof tableName === 'string') {
              tables.add(tableName);
            }
          }
        });
      }

      // Extract table names from entity_id (format: table_id)
      if (entityTableData) {
        entityTableData.forEach(log => {
          if (log.entity_id && log.entity_id.includes('_')) {
            const tableName = log.entity_id.split('_')[0];
            tables.add(tableName);
          }
        });
      }

      setTableNames(Array.from(tables).sort());
    } catch (error) {
      console.error("Error extracting table names:", error);
    }
  }, []);

  // Load filters on component mount
  useEffect(() => {
    extractUniqueValues();
    extractUniqueTables();
  }, [extractUniqueValues, extractUniqueTables]);

  // Load logs when component mounts or filters change
  useEffect(() => {
    loadLogs();
  }, [page, activeTab, filters]);

  // Handle search
  const handleSearch = () => {
    setPage(1); // Reset to first page
    loadLogs();
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // Reset to first page
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      action_type: "",
      entity_type: "",
      entity_id: "",
      table_name: "",
      operation: "",
      status: "",
      start_date: "",
      end_date: "",
      source: "",
      importance: "",
      system_process_id: "",
      batch_operation_id: "",
      severity: ""
    });
    setSearchQuery("");
    setPage(1);
  };

  // Export logs to CSV
  const exportToCSV = () => {
    if (logs.length === 0) return;

    // Define CSV headers
    const headers = [
      "Timestamp",
      "User",
      "Action",
      "Entity Type",
      "Entity ID",
      "Status",
      "Details",
    ];

    // Format the data for each log
    const rows = logs.map((log) => {
      // Format timestamp
      const timestamp = log.timestamp
        ? new Date(log.timestamp).toISOString()
        : "";

      // Escape fields that might contain commas or quotes
      const escapeCsvField = (field: string | null | undefined): string => {
        if (field === null || field === undefined) return "";
        const str = String(field);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`; // Escape quotes by doubling them
        }
        return str;
      };

      return [
        timestamp,
        escapeCsvField(log.user_email),
        escapeCsvField(log.action),
        escapeCsvField(log.entity_type),
        escapeCsvField(log.entity_id),
        escapeCsvField(log.status),
        escapeCsvField(log.details),
      ].join(",");
    });

    // Combine headers and rows
    const csv = [headers.join(","), ...rows].join("\n");

    // Create and download the CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `activity_logs_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "Unknown";
    return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
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

  // Open log details
  const openLogDetails = (log: ActivityLogEntry) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  // Enhanced entity filtering with related entity searching
  const handleEntitySearch = async (entityType: string, searchTerm: string) => {
    if (!entityType || !searchTerm) return;
    
    setLoading(true);
    try {
      // Search for related entities
      const { data, error } = await supabase
        .from("audit_logs")
        .select("entity_id")
        .eq("entity_type", entityType)
        .ilike("entity_id", `%${searchTerm}%`)
        .limit(10);
        
      if (error) {
        console.error("Error searching entities:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const entityIds = data.map(item => item.entity_id);
        setFilters(prev => ({
          ...prev,
          entity_id: entityIds[0] // Use the first match
        }));
      }
    } catch (error) {
      console.error("Error in entity search:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add system activity specific filters
  const handleSystemActivityFiltering = (activityType: string) => {
    setActiveTab("system");
    
    // Clear existing filters
    setFilters({
      action_type: "",
      entity_type: "",
      entity_id: "",
      table_name: "",
      operation: "",
      status: "",
      start_date: "",
      end_date: "",
      source: "system",
      importance: "",
      system_process_id: "",
      batch_operation_id: "",
      severity: ""
    });
    
    // Set appropriate filter based on activity type
    switch (activityType) {
      case "scheduled":
        setFilters(prev => ({ ...prev, action_type: "scheduled_task" }));
        break;
      case "batch":
        setFilters(prev => ({ ...prev, batch_operation_id: "*" }));
        break;
      case "integration":
        setFilters(prev => ({ ...prev, action_type: "integration" }));
        break;
      case "error":
        setFilters(prev => ({ ...prev, status: "failed" }));
        break;
      default:
        // No specific filter
        break;
    }
    
    // Reset page and trigger load
    setPage(1);
    loadLogs();
  };

  // Now add the table filter dropdown in the filter section of the UI
  const renderEnhancedFilters = () => {
    return (
      <div className="space-y-4 p-4 bg-muted/20 rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Table Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Table Name</label>
            <Select
              value={filters.table_name}
              onValueChange={(value) => handleFilterChange("table_name", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tables</SelectItem>
                {tableNames.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Entity ID Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Entity ID</label>
            <Input
              placeholder="Enter entity ID"
              value={filters.entity_id}
              onChange={(e) => handleFilterChange("entity_id", e.target.value)}
            />
          </div>
          
          {/* System Process Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">System Process</label>
            <Input
              placeholder="Process ID"
              value={filters.system_process_id}
              onChange={(e) => handleFilterChange("system_process_id", e.target.value)}
            />
          </div>
          
          {/* Batch Operation Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Batch Operation</label>
            <Input
              placeholder="Batch ID"
              value={filters.batch_operation_id}
              onChange={(e) => handleFilterChange("batch_operation_id", e.target.value)}
            />
          </div>
          
          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <Select
              value={filters.severity}
              onValueChange={(value) => handleFilterChange("severity", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activity Monitor</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button variant="outline" size="sm" onClick={loadLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className={`grid w-full grid-cols-${hideSystemAndMetricsTabs ? "4" : "6"}`}>
              <TabsTrigger value="all">All Activity</TabsTrigger>
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="data">Data Operations</TabsTrigger>
              <TabsTrigger value="admin">Admin Actions</TabsTrigger>
              {!hideSystemAndMetricsTabs && (
                <>
                  <TabsTrigger value="system">System Activities</TabsTrigger>
                  <TabsTrigger value="metrics" onClick={() => window.location.href = "/activity/metrics"}>Metrics</TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>

          {/* Show search and filters only for non-system tabs */}
          {activeTab !== "system" && (
            <>
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-8"
                  />
                </div>
                <Button onClick={handleSearch}>Search</Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-muted/20 rounded-md">
                  <div>
                    <label className="text-sm font-medium">Action Type</label>
                    <Select
                      value={filters.action_type}
                      onValueChange={(value) =>
                        handleFilterChange("action_type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Actions</SelectItem>
                        {actionTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatActionType(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Entity Type</label>
                    <Select
                      value={filters.entity_type}
                      onValueChange={(value) =>
                        handleFilterChange("entity_type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Entities</SelectItem>
                        {entityTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {showAdvancedFilters && renderEnhancedFilters()}
                </div>
              )}
            </>
          )}

          {/* System Activities Tab Content */}
          {activeTab === "system" ? (
            <SystemProcessDashboard limit={limit} />
          ) : loading ? (
            <LoadingState message="Loading activity logs..." />
          ) : logs.length === 0 ? (
            <EmptyState
              title="No activity logs found"
              description="No logs match your current filters. Try adjusting your search criteria."
            />
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openLogDetails(log)}
                      >
                        <TableCell className="font-mono text-xs">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>{log.user_email || "System"}</TableCell>
                        <TableCell>{formatActionType(log.action)}</TableCell>
                        <TableCell>
                          {log.entity_type && (
                            <span className="text-xs">
                              {log.entity_type.charAt(0).toUpperCase() +
                                log.entity_type.slice(1)}
                              {log.entity_id && (
                                <span className="text-muted-foreground ml-1">
                                  ({log.entity_id.substring(0, 8)}...)
                                </span>
                              )}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.details ? (
                            <span className="text-xs text-muted-foreground">
                              {typeof log.details === "object"
                                ? JSON.stringify(log.details).substring(0, 50) +
                                  "..."
                                : String(log.details).substring(0, 50) + "..."}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLogDetails(log);
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={page !== 1 ? () => setPage((p) => Math.max(1, p - 1)) : undefined}
                      aria-disabled={page === 1}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={page !== totalPages ? () => setPage((p) => Math.min(totalPages, p + 1)) : undefined}
                      aria-disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </CardContent>
      </Card>

      {selectedLog && (
        <ActivityLogDetails
          log={selectedLog}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  );
};

export default ActivityMonitor;
