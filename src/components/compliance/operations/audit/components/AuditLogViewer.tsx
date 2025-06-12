import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { format } from 'date-fns';
import { ComplianceAuditLog, ApprovalEntityType } from '@/types/domain/compliance/compliance';
import { 
  CalendarIcon, 
  DownloadIcon, 
  SearchIcon, 
  FilterIcon, 
  RefreshCw,
  FileText,
  User,
  Clock
} from "lucide-react";

interface AuditLogViewerProps {
  entityType?: ApprovalEntityType;
  entityId?: string;
  onGetAuditLogs: (options: {
    entityType?: ApprovalEntityType;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    actions?: string[];
    limit?: number;
    offset?: number;
  }) => Promise<ComplianceAuditLog[]>;
  onExportAuditLogs?: (format: 'csv' | 'pdf' | 'json') => Promise<{ url: string }>;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  entityType,
  entityId,
  onGetAuditLogs,
  onExportAuditLogs
}) => {
  const [auditLogs, setAuditLogs] = useState<ComplianceAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [actionOptions, setActionOptions] = useState<{value: string; label: string}[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'all' | 'entity'>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<ApprovalEntityType | undefined>(entityType);
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(entityId);
  
  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy HH:mm:ss');
  };
  
  // Load audit logs
  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const options: Parameters<typeof onGetAuditLogs>[0] = {
        limit: pageSize,
        offset: (page - 1) * pageSize
      };
      
      if (viewMode === 'entity') {
        options.entityType = selectedEntityType;
        options.entityId = selectedEntityId;
      }
      
      if (dateRange.from) {
        options.startDate = dateRange.from;
      }
      
      if (dateRange.to) {
        options.endDate = dateRange.to;
      }
      
      if (selectedActions.length > 0) {
        options.actions = selectedActions;
      }
      
      const logs = await onGetAuditLogs(options);
      setAuditLogs(logs);
      
      // In a real implementation, we would get the total count from the API
      setTotalCount(logs.length + ((page - 1) * pageSize));
      
      // Extract action types from logs to build filter options
      const actions = new Set<string>();
      logs.forEach(log => actions.add(log.action));
      
      setActionOptions(
        Array.from(actions).map(action => ({
          value: action,
          label: action
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
        }))
      );
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load logs on initial render and when filters change
  useEffect(() => {
    loadAuditLogs();
  }, [page, viewMode, selectedEntityType, selectedEntityId]);
  
  // Apply filters
  const handleApplyFilters = () => {
    setPage(1);
    loadAuditLogs();
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDateRange({ from: undefined, to: undefined });
    setSelectedActions([]);
    setPage(1);
    loadAuditLogs();
  };
  
  // Export logs
  const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
    if (!onExportAuditLogs) return;
    
    try {
      const result = await onExportAuditLogs(format);
      window.open(result.url, '_blank');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };
  
  // Filter logs with search term
  const filteredLogs = searchTerm
    ? auditLogs.filter(log => 
        JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : auditLogs;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              View and export compliance audit trail
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadAuditLogs()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {onExportAuditLogs && (
              <Select onValueChange={(value) => handleExport(value as any)}>
                <SelectTrigger className="w-[120px]">
                  <div className="flex items-center">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Export
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search audit logs..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to
                    }}
                    onSelect={(range) => {
                      if (range) {
                        setDateRange({
                          from: range.from,
                          to: range.to
                        });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Actions</h4>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select actions" />
                        </SelectTrigger>
                        <SelectContent>
                          {actionOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {!entityType && (
                      <>
                        <div className="space-y-2">
                          <h4 className="font-medium">Entity Type</h4>
                          <Select 
                            value={selectedEntityType}
                            onValueChange={(value) => setSelectedEntityType(value as ApprovalEntityType)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All entity types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INVESTOR">Investor</SelectItem>
                              <SelectItem value="ISSUER">Issuer</SelectItem>
                              <SelectItem value="TRANSACTION">Transaction</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {selectedEntityType && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Entity ID</h4>
                            <Input
                              placeholder="Enter entity ID"
                              value={selectedEntityId}
                              onChange={(e) => setSelectedEntityId(e.target.value)}
                            />
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="flex justify-between pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                      >
                        Reset
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleApplyFilters}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {entityType ? (
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'entity')}>
              <TabsList>
                <TabsTrigger value="entity">Entity Logs</TabsTrigger>
                <TabsTrigger value="all">All Logs</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  {viewMode === 'all' && (
                    <>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Entity ID</TableHead>
                    </>
                  )}
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={viewMode === 'all' ? 6 : 4} className="h-24 text-center">
                      <Spinner className="mx-auto" />
                      <p className="text-sm text-muted-foreground">Loading audit logs...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={viewMode === 'all' ? 6 : 4} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2" />
                        <p>No audit logs found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{formatDate(log.timestamp)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{log.performedBy}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.action
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      {viewMode === 'all' && (
                        <>
                          <TableCell>
                            {log.entityType}
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[120px] truncate">
                            {log.entityId}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="max-w-[200px]">
                        <div className="truncate">
                          {typeof log.details === 'object'
                            ? JSON.stringify(log.details).substring(0, 50) + '...'
                            : log.details}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {filteredLogs.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, totalCount)} of {totalCount} entries
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page * pageSize >= totalCount}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLogViewer;