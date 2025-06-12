import React, { useState, useEffect } from 'react';
import { supabase } from '@/infrastructure/database/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ChevronRight, ChevronDown, Clock, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { logSystemActivity } from '@/utils/shared/logging/activityLogger';
import { ActivityStatus } from '@/types/domain/activity/ActivityTypes';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Define the interface based on the actual database schema
interface BulkOperation {
  id: string;
  operation_type: string;
  status: string;
  created_at: string;
  completed_at?: string;
  created_by: string;
  progress: number;
  target_ids?: string[];
  processed_count: number;
  failed_count: number;
  error_details?: any;
  metadata?: any;
  tags?: string[];
  // Additional fields not from direct database columns
  username?: string;
  target_count?: number;
  success_count?: number;
}

interface OperationMetrics {
  totalOperations: number;
  activeOperations: number;
  completedOperations: number;
  failedOperations: number;
  successRate: number;
  operationsByType: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A44A44'];

export function BulkOperationDashboard() {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<OperationMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const fetchOperations = async () => {
    setLoading(true);
    try {
      // Fetch operations without joining users table
      const { data, error } = await supabase
        .from('bulk_operations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // Process data without relying on the users join
        const formattedData = data.map(operation => ({
          ...operation,
          username: 'System', // Default value
          target_count: operation.target_ids?.length || 0,
          success_count: operation.processed_count - (operation.failed_count || 0)
        })) as BulkOperation[];
        
        setOperations(formattedData);
        calculateMetrics(formattedData);
      }
    } catch (error) {
      console.error('Error fetching bulk operations:', error);
      logSystemActivity('FETCH_BULK_OPERATIONS', {
        status: ActivityStatus.FAILURE,
        details: { error: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (operationData: BulkOperation[]) => {
    // Filter for recent operations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOperations = operationData.filter(
      op => new Date(op.created_at) >= thirtyDaysAgo
    );
    
    // Basic counts
    const completed = recentOperations.filter(op => op.status === 'completed').length;
    const failed = recentOperations.filter(op => op.status === 'failed').length;
    const cancelled = recentOperations.filter(op => op.status === 'cancelled').length;
    const active = recentOperations.filter(
      op => ['pending', 'processing'].includes(op.status)
    ).length;
    const total = recentOperations.length;
    
    // Success rate
    const successRate = (completed + failed + cancelled > 0)
      ? (completed / (completed + failed + cancelled)) * 100
      : 0;
    
    // Operations by type
    const typeCount = {};
    recentOperations.forEach(op => {
      typeCount[op.operation_type] = (typeCount[op.operation_type] || 0) + 1;
    });
    
    const operationsByType = Object.keys(typeCount).map(type => ({
      name: type,
      value: typeCount[type]
    }));
    
    // Status distribution
    const statusDistribution = [
      { name: 'Pending', value: recentOperations.filter(op => op.status === 'pending').length },
      { name: 'Processing', value: recentOperations.filter(op => op.status === 'processing').length },
      { name: 'Completed', value: completed },
      { name: 'Failed', value: failed },
      { name: 'Cancelled', value: cancelled }
    ];
    
    setMetrics({
      totalOperations: total,
      activeOperations: active,
      completedOperations: completed,
      failedOperations: failed,
      successRate,
      operationsByType,
      statusDistribution
    });
  };

  useEffect(() => {
    fetchOperations();
    
    const subscription = supabase
      .channel('bulk_operations_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bulk_operations'
      }, () => {
        fetchOperations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredOperations(operations);
    } else {
      const statusMap = {
        'active': ['pending', 'processing'],
        'completed': ['completed'],
        'failed': ['failed', 'cancelled']
      };
      
      setFilteredOperations(operations.filter(op => 
        statusMap[activeTab].includes(op.status)
      ));
    }
  }, [operations, activeTab]);

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pending</Badge>,
      'processing': <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Processing</Badge>,
      'completed': <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>,
      'failed': <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>,
      'cancelled': <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Cancelled</Badge>
    };
    return variants[status] || status;
  };

  const calculateCompletionRate = (operation: BulkOperation) => {
    if (!operation.target_ids || operation.target_ids.length === 0) return 0;
    return Math.floor((operation.processed_count / operation.target_ids.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalOperations || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.successRate ? `${metrics.successRate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Operations completed successfully</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.activeOperations || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.failedOperations || 0}
            </div>
            <p className="text-xs text-muted-foreground">Failures in the last 30 days</p>
          </CardContent>
        </Card>
      </div>
  
      {/* Chart Section */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Operation Types</CardTitle>
              <CardDescription>Distribution by operation type</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {metrics.operationsByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.operationsByType}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Operations by current status</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {metrics.statusDistribution.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.statusDistribution.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {metrics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
  
      {/* Operations Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Bulk Operations</CardTitle>
              <CardDescription>
                View and manage bulk data operations
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOperations}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Operations</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
            
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOperations.length === 0 ? (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>No operations found</AlertTitle>
                <AlertDescription>
                  No bulk operations match your current filter.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOperations.map((operation) => (
                      <React.Fragment key={operation.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50" 
                          onClick={() => setExpandedRowId(expandedRowId === operation.id ? null : operation.id)}
                        >
                          <TableCell>
                            <div className="flex items-center">
                              {expandedRowId === operation.id 
                                ? <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" /> 
                                : <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                              }
                              <div className="font-medium">{operation.operation_type}</div>
                            </div>
                          </TableCell>
                          <TableCell>{operation.operation_type}</TableCell>
                          <TableCell>{getStatusBadge(operation.status)}</TableCell>
                          <TableCell>
                            <div className="w-32">
                              <Progress 
                                value={calculateCompletionRate(operation)} 
                                className="h-2"
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                {calculateCompletionRate(operation)}%
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <span className="font-medium">{operation.processed_count}</span>
                              <span className="text-muted-foreground">/{operation.target_ids?.length || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(operation.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{operation.username}</TableCell>
                        </TableRow>
                        
                        {expandedRowId === operation.id && (
                          <TableRow>
                            <TableCell colSpan={7} className="p-0">
                              <div className="bg-muted/50 p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Operation Information</h4>
                                    <div className="text-sm">
                                      <p><span className="font-medium">Operation ID:</span> {operation.id}</p>
                                      <p><span className="font-medium">Created:</span> {format(new Date(operation.created_at), 'PPpp')}</p>
                                      {operation.completed_at && (
                                        <p><span className="font-medium">Completed:</span> {format(new Date(operation.completed_at), 'PPpp')}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Processing Statistics</h4>
                                    <div className="text-sm">
                                      <p><span className="font-medium">Target Count:</span> {operation.target_ids?.length || 0}</p>
                                      <p><span className="font-medium">Processed:</span> {operation.processed_count}</p>
                                      <p><span className="font-medium">Successful:</span> {operation.processed_count - (operation.failed_count || 0)}</p>
                                      <p><span className="font-medium">Failed:</span> {operation.failed_count || 0}</p>
                                      <p>
                                        <span className="font-medium">Success Rate:</span> 
                                        {operation.processed_count > 0 
                                          ? ` ${Math.round(((operation.processed_count - (operation.failed_count || 0)) / operation.processed_count) * 100)}%` 
                                          : ' N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {operation.status === 'failed' && operation.error_details && (
                                    <div>
                                      <h4 className="text-sm font-medium mb-1 text-red-500 flex items-center">
                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                        Error Information
                                      </h4>
                                      <div className="bg-red-50 p-2 rounded text-sm text-red-700 overflow-auto max-h-32">
                                        {typeof operation.error_details === 'string' 
                                          ? operation.error_details 
                                          : JSON.stringify(operation.error_details, null, 2)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {operation.metadata && Object.keys(operation.metadata).length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Additional Metadata</h4>
                                    <div className="bg-slate-100 p-2 rounded text-sm overflow-auto max-h-32">
                                      <pre className="whitespace-pre-wrap">
                                        {JSON.stringify(operation.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                
                                {(['pending', 'processing'].includes(operation.status)) && (
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-amber-600 hover:text-amber-700 border-amber-200 hover:border-amber-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Placeholder for operation pause
                                        alert(`Pause operation ${operation.id} (${operation.operation_type})`);
                                      }}
                                    >
                                      Pause Operation
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Placeholder for operation cancellation
                                        alert(`Cancel operation ${operation.id} (${operation.operation_type})`);
                                      }}
                                    >
                                      Cancel Operation
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 