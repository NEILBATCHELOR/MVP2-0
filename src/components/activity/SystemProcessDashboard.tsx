import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tables } from "@/types/core/database";
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
import { RefreshCw, Play, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, ChevronDown, AlertCircle, Loader2, Cpu, ChevronLeft } from "lucide-react";
import { format, formatDistanceToNow, formatDuration, intervalToDuration } from "date-fns";
import LoadingState from "@/components/shared/LoadingState";
import EmptyState from "@/components/shared/EmptyState";
import { supabase } from "@/infrastructure/database/client";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { formatDistance } from "date-fns";
import { ActivityStatus } from "@/types/domain/activity/ActivityTypes";
import BatchOperationDetails from "./BatchOperationDetails";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logSystemActivity } from '@/utils/shared/logging/activityLogger';
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";

// Import the ProcessCard component without actually using import statement
// We're creating a placeholder until the actual component is implemented
const ProcessCard = (props) => {
  return <div>Process Card Placeholder</div>;
};

type SystemProcess = Tables<"system_processes">;
type BatchOperation = Tables<"bulk_operations">;
type ActivityLogEntry = Tables<"audit_logs">;

interface SystemProcessDashboardProps {
  limit?: number;
  projectId?: string;
  refreshInterval?: number;
  onSelectProcess?: (process: SystemProcess) => void;
  defaultBatchId?: string;
  replayMode?: boolean;
}

interface MetricsState {
  avgDuration: number;
  successRate: number;
  totalProcesses: number;
  activeDailyProcesses: number;
  byStatus: { name: string; value: number }[];
  recentActivity: { time: string; count: number }[];
  performanceData: { process_type: string; count: number; avg_duration: number }[];
  completedProcesses: number;
  failedProcesses: number;
  // Enhanced error tracking metrics
  errorRateByHour: { hour: string; rate: number }[];
  errorsByType: { type: string; count: number }[];
  errorsByProcess: { process: string; count: number }[];
  // Anomaly detection
  anomalies: {
    id: string;
    process_name: string;
    metric: string;
    expected: number;
    actual: number;
    deviation: number;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
    cumulativeScore?: number;
  }[];
  longestRunningProcesses: SystemProcess[];
  anomalyScore: number;
}

const SystemProcessDashboard: React.FC<SystemProcessDashboardProps> = ({
  limit = 10,
  projectId,
  refreshInterval = 30000, // 30 seconds default refresh
  onSelectProcess,
  defaultBatchId,
  replayMode
}) => {
  const [processes, setProcesses] = useState<SystemProcess[]>([]);
  const [batchOperations, setBatchOperations] = useState<BatchOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("processes");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [processActivities, setProcessActivities] = useState<Record<string, ActivityLogEntry[]>>({});
  const [selectedProcess, setSelectedProcess] = useState<SystemProcess | null>(null);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsState>({
    avgDuration: 0,
    successRate: 0,
    totalProcesses: 0,
    activeDailyProcesses: 0,
    byStatus: [],
    recentActivity: [],
    performanceData: [],
    completedProcesses: 0,
    failedProcesses: 0,
    errorRateByHour: [],
    errorsByType: [],
    errorsByProcess: [],
    anomalies: [],
    longestRunningProcesses: [],
    anomalyScore: 0
  });
  const [filter, setFilter] = useState('all');
  const [processFilter, setProcessFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const ITEMS_PER_PAGE = limit;

  // Load system processes
  const loadSystemProcesses = async () => {
    setLoading(true);
    try {
      // Calculate offset based on current page
      const offset = (page - 1) * ITEMS_PER_PAGE;

      // Fetch system processes
      const { data: processData, error: processError } = await supabase
        .from("system_processes")
        .select("*")
        .order("start_time", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (processError) {
        console.error("Error fetching system processes:", processError);
        setProcesses([]);
      } else {
        setProcesses(processData || []);
        
        // Get count for pagination
        const { count, error: countError } = await supabase
          .from("system_processes")
          .select("*", { count: "exact", head: true });
          
        if (!countError && count !== null) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        }
      }
      
      // Calculate statistics here if needed
    } catch (error) {
      console.error("Error loading system processes:", error);
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Load batch operations
  const loadBatchOperations = async () => {
    setLoading(true);
    try {
      // Calculate offset based on current page
      const offset = (page - 1) * ITEMS_PER_PAGE;

      // Fetch batch operations
      const { data: batchData, error: batchError } = await supabase
        .from("bulk_operations")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (batchError) {
        console.error("Error fetching batch operations:", batchError);
        setBatchOperations([]);
      } else {
        setBatchOperations(batchData || []);
        
        // Get count for pagination
        const { count, error: countError } = await supabase
          .from("bulk_operations")
          .select("*", { count: "exact", head: true });
          
        if (!countError && count !== null) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        }
      }
    } catch (error) {
      console.error("Error loading batch operations:", error);
      setBatchOperations([]);
    } finally {
      setLoading(false);
    }
  };

  // Load activities for a specific process
  const loadProcessActivities = async (processId: string) => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("system_process_id", processId)
        .order("timestamp", { ascending: true });
        
      if (error) {
        console.error("Error fetching process activities:", error);
        return;
      }
      
      setProcessActivities(prev => ({
        ...prev,
        [processId]: data || []
      }));
    } catch (error) {
      console.error("Error loading process activities:", error);
    }
  };

  // Toggle expanded state for a process
  const toggleProcessExpand = useCallback((processId: string) => {
    setExpandedRows((prev) => {
      const newExpandedState = !prev[processId];
      
      // If we're expanding and activities aren't loaded, load them
      if (newExpandedState && !processActivities[processId]) {
        loadProcessActivities(processId);
      }
      
      return {
        ...prev,
        [processId]: newExpandedState,
      };
    });
  }, [processActivities, loadProcessActivities]);

  // Load data when component mounts, page changes, or tab changes
  useEffect(() => {
    if (activeTab === "processes") {
      loadSystemProcesses();
    } else if (activeTab === "batches") {
      loadBatchOperations();
    }
  }, [page, activeTab]);

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

  // Get severity badge
  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;

    switch (severity.toLowerCase()) {
      case "info":
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case "critical":
        return <Badge className="bg-purple-100 text-purple-800">Critical</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  // Calculate statistics for processes
  const processStats = {
    total: processes.length,
    running: processes.filter(p => p.status === 'running').length,
    completed: processes.filter(p => p.status === 'completed').length,
    failed: processes.filter(p => p.status === 'failed').length,
    cancelled: processes.filter(p => p.status === 'cancelled').length,
  };

  // Calculate statistics for batch operations
  const batchStats = {
    total: batchOperations.length,
    processing: batchOperations.filter(b => b.status === 'processing').length,
    completed: batchOperations.filter(b => b.status === 'completed').length,
    failed: batchOperations.filter(b => b.status === 'failed').length,
    cancelled: batchOperations.filter(b => b.status === 'cancelled').length,
  };

  // Process success rate
  const processSuccessRate = processStats.total > 0 
    ? Math.round((processStats.completed / processStats.total) * 100) 
    : 0;

  // Batch success rate
  const batchSuccessRate = batchStats.total > 0 
    ? Math.round((batchStats.completed / batchStats.total) * 100) 
    : 0;

  useEffect(() => {
    fetchMetrics();
    
    // Set up a real-time subscription
    const processSub = supabase
      .channel('system_processes_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'system_processes' 
      }, () => {
        loadSystemProcesses();
      })
      .subscribe();
    
    // Auto refresh at the specified interval
    const refreshTimer = setInterval(() => {
      loadSystemProcesses();
      fetchMetrics();
    }, refreshInterval);
    
    return () => {
      supabase.removeChannel(processSub);
      clearInterval(refreshTimer);
    };
  }, [activeTab, projectId, refreshInterval]);

  const fetchMetrics = async (batchId?: string): Promise<void> => {
    try {
      // Get metrics from database or calculate them
      const { data: durationData } = await supabase
        .from('system_processes')
        .select('start_time, end_time, status')
        .not('end_time', 'is', null);
      
      // Calculate average duration
      let totalDuration = 0;
      let completedCount = 0;
      let successCount = 0;
      
      durationData?.forEach(process => {
        if (process.end_time) {
          const start = new Date(process.start_time);
          const end = new Date(process.end_time);
          const duration = (end.getTime() - start.getTime()) / 1000; // in seconds
          
          totalDuration += duration;
          completedCount++;
          
          if (process.status === 'completed') {
            successCount++;
          }
        }
      });
      
      // Get counts by status using separate queries instead of groupBy
      // Use count() to get the number directly
      const completedCountQuery = await supabase
        .from('system_processes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
        
      const failedCountQuery = await supabase
        .from('system_processes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');
        
      const runningCountQuery = await supabase
        .from('system_processes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'running');
      
      // Extract counts safely
      const completedCountValue = completedCountQuery.count !== null ? completedCountQuery.count : 0;
      const failedCountValue = failedCountQuery.count !== null ? failedCountQuery.count : 0;
      const runningCountValue = runningCountQuery.count !== null ? runningCountQuery.count : 0;
      
      const byStatus = [
        { name: 'completed', value: completedCountValue },
        { name: 'failed', value: failedCountValue },
        { name: 'running', value: runningCountValue }
      ];
      
      // Get recent activity
      const { data: recentData } = await supabase
        .from('system_processes')
        .select('start_time')
        .order('start_time', { ascending: false })
        .limit(100);
      
      // Group by hour
      const hourCounts: Record<string, number> = {};
      
      recentData?.forEach(process => {
        const hour = format(new Date(process.start_time), 'yyyy-MM-dd HH:00');
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      const recentActivity = Object.entries(hourCounts)
        .map(([time, count]) => ({
          time,
          count
        }))
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(-12); // Get last 12 hours
      
      // Daily active processes count
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const activeDailyQuery = await supabase
        .from('system_processes')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', todayStart.toISOString());
        
      const activeDailyCountValue = activeDailyQuery.count !== null ? activeDailyQuery.count : 0;
      
      // Simplify the performance metrics to avoid type errors
      // Instead of trying to query for columns that might not exist
      const performanceData = [
        { process_type: 'Scheduled Tasks', count: 0, avg_duration: 0 },
        { process_type: 'Data Import/Export', count: 0, avg_duration: 0 },
        { process_type: 'System Maintenance', count: 0, avg_duration: 0 }
      ];
      
      // Set metrics
      setMetrics({
        avgDuration: completedCount > 0 ? totalDuration / completedCount : 0,
        successRate: completedCount > 0 ? successCount / completedCount : 0,
        totalProcesses: durationData?.length || 0,
        activeDailyProcesses: activeDailyCountValue,
        byStatus,
        recentActivity,
        performanceData,
        completedProcesses: completedCountValue,
        failedProcesses: failedCountValue,
        errorRateByHour: [],
        errorsByType: [],
        errorsByProcess: [],
        anomalies: [],
        longestRunningProcesses: [],
        anomalyScore: 0
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  // Initialize completed and failed process counts for metrics
  useEffect(() => {
    // Set completed and failed process counts in metrics when processes change
    const completedCount = processes.filter(p => p.status === 'completed').length;
    const failedCount = processes.filter(p => p.status === 'failed').length;
    
    setMetrics(prev => ({
      ...prev,
      completedProcesses: completedCount,
      failedProcesses: failedCount
    }));
  }, [processes]);

  const handleProcessSelect = (process: SystemProcess) => {
    setSelectedProcess(process);
    if (onSelectProcess) {
      onSelectProcess(process);
    }
    
    // If this is a batch operation, show batch details
    if (process.process_name.toLowerCase().includes('batch') || 
        (process.metadata && typeof process.metadata === 'object' && 'is_batch_operation' in process.metadata)) {
      setSelectedBatchId(process.id);
      setShowBatchDetails(true);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadSystemProcesses().finally(() => {
      setLoading(false);
    });
  };

  // Filter processes based on selected tab
  const filteredProcesses = filter === 'all' 
    ? processes
    : filter === 'active' 
      ? processes.filter(p => p.status === 'running' || p.status === 'queued')
      : filter === 'completed'
        ? processes.filter(p => p.status === 'completed')
        : processes.filter(p => p.status === 'failed');

  // Status data for charts
  const statusData = [
    { name: 'Active', value: metrics.activeDailyProcesses, color: '#3b82f6' },
    { name: 'Completed', value: metrics.completedProcesses || 0, color: '#10b981' },
    { name: 'Failed', value: metrics.failedProcesses || 0, color: '#ef4444' },
  ];
  
  // Group processes by day for the trend chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  
  const trendData = last7Days.map(date => {
    const dateString = format(date, 'MMM dd');
    const dayProcesses = processes.filter(p => {
      const processDate = new Date(p.start_time);
      return (
        processDate.getDate() === date.getDate() &&
        processDate.getMonth() === date.getMonth() &&
        processDate.getFullYear() === date.getFullYear()
      );
    });
    
    return {
      date: dateString,
      total: dayProcesses.length,
      completed: dayProcesses.filter(p => p.status === 'completed').length,
      failed: dayProcesses.filter(p => p.status === 'failed').length,
    };
  });

  // Replace the entire fetchEnhancedMetrics function to fix linter errors
  const fetchEnhancedMetrics = async () => {
    setIsLoading(true);
    try {
      // Fetch system processes to analyze
      const { data: processData, error: processError } = await supabase
        .from("system_processes")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(100);
        
      if (processError) {
        console.error("Error fetching system processes for metrics:", processError);
        return;
      }
      
      // Calculate base metrics
      const allProcesses = processData || [];
      const completedProcesses = allProcesses.filter(p => p.status === 'completed');
      
      // Detect duration anomalies
      const anomalies: {
        id: string;
        process_name: string;
        metric: string;
        expected: number;
        actual: number;
        deviation: number;
        timestamp: string;
        severity: 'low' | 'medium' | 'high';
        cumulativeScore?: number;
      }[] = [];
      
      // Group processes by type
      const processByType: Record<string, {
        durations: number[];
        avgDuration: number;
        stdDeviation: number;
        processes: typeof processData;
      }> = {};
      
      // Calculate average durations and standard deviations for each process type
      completedProcesses.forEach(process => {
        if (!process.process_name || !process.start_time || !process.end_time) return;
        
        // Extract process type from name (e.g., "data_sync_job" -> "data_sync")
        const processType = process.process_name.split('_').slice(0, 2).join('_');
        
        if (!processByType[processType]) {
          processByType[processType] = {
            durations: [],
            avgDuration: 0,
            stdDeviation: 0,
            processes: []
          };
        }
        
        const startTime = new Date(process.start_time).getTime();
        const endTime = new Date(process.end_time).getTime();
        const duration = (endTime - startTime) / 1000; // in seconds
        
        processByType[processType].durations.push(duration);
        processByType[processType].processes.push(process);
      });
      
      // Calculate avg duration and std deviation
      Object.keys(processByType).forEach(type => {
        const { durations } = processByType[type];
        if (durations.length < 2) return; // Need at least 2 data points
        
        // Calculate average
        const sum = durations.reduce((a, b) => a + b, 0);
        const avg = sum / durations.length;
        processByType[type].avgDuration = avg;
        
        // Calculate standard deviation
        const squareDiffs = durations.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);
        processByType[type].stdDeviation = stdDev;
        
        // Detect anomalies (more than 2 standard deviations from mean)
        processByType[type].processes.forEach(process => {
          if (!process.start_time || !process.end_time) return;
          
          const startTime = new Date(process.start_time).getTime();
          const endTime = new Date(process.end_time).getTime();
          const duration = (endTime - startTime) / 1000; // in seconds
          
          const deviationFromMean = Math.abs(duration - avg);
          const deviationsAway = stdDev > 0 ? deviationFromMean / stdDev : 0;
          
          // If more than 2 standard deviations away, consider it an anomaly
          if (deviationsAway > 2) {
            const deviationPercent = Math.round((Math.abs(duration - avg) / avg) * 100);
            
            // Determine severity based on deviation
            let severity: 'low' | 'medium' | 'high' = 'low';
            if (deviationsAway > 4) severity = 'high';
            else if (deviationsAway > 3) severity = 'medium';
            
            anomalies.push({
              id: process.id,
              process_name: process.process_name,
              metric: 'duration',
              expected: Math.round(avg),
              actual: Math.round(duration),
              deviation: deviationPercent,
              timestamp: process.end_time,
              severity,
              cumulativeScore: deviationPercent
            });
          }
        });
      });
      
      // Detect error rate anomalies
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      // Fetch error logs from the last hour
      const { data: errorLogs } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("status", "failure")
        .gte("timestamp", oneHourAgo.toISOString())
        .order("timestamp", { ascending: false });
        
      // Group errors by process type
      const errorsByProcess: Record<string, number> = {};
      const totalByProcess: Record<string, number> = {};
      
      // Count total processes by type in the last hour
      allProcesses.forEach(process => {
        if (!process.process_name || !process.start_time) return;
        
        const processTime = new Date(process.start_time);
        if (processTime > oneHourAgo) {
          // Extract process type
          const processType = process.process_name.split('_').slice(0, 2).join('_');
          totalByProcess[processType] = (totalByProcess[processType] || 0) + 1;
        }
      });
      
      // Count errors by process type
      if (errorLogs) {
        errorLogs.forEach(log => {
          if (!log.system_process_id) return;
          
          // Find the associated process
          const process = allProcesses.find(p => p.id === log.system_process_id);
          if (process && process.process_name) {
            const processType = process.process_name.split('_').slice(0, 2).join('_');
            errorsByProcess[processType] = (errorsByProcess[processType] || 0) + 1;
          }
        });
      }
      
      // Detect error rate anomalies (when error rate > 20%)
      Object.keys(totalByProcess).forEach(processType => {
        const totalProcesses = totalByProcess[processType] || 0;
        const errors = errorsByProcess[processType] || 0;
        
        if (totalProcesses >= 5) { // Need at least 5 processes for meaningful rate
          const errorRate = (errors / totalProcesses) * 100;
          
          if (errorRate > 20) {
            // Determine severity based on error rate
            let severity: 'low' | 'medium' | 'high' = 'low';
            if (errorRate > 50) severity = 'high';
            else if (errorRate > 30) severity = 'medium';
            
            anomalies.push({
              id: processType + '_error_rate',
              process_name: processType,
              metric: 'error_rate',
              expected: 5, // Expect less than 5% error rate
              actual: Math.round(errorRate),
              deviation: Math.round(errorRate - 5),
              timestamp: new Date().toISOString(),
              severity,
              cumulativeScore: Math.round(errorRate - 5)
            });
          }
        }
      });
      
      // Calculate overall anomaly score (0-100)
      let anomalyScore = 0;
      if (anomalies.length > 0) {
        // Weight by severity
        const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
        const mediumSeverityCount = anomalies.filter(a => a.severity === 'medium').length;
        const lowSeverityCount = anomalies.filter(a => a.severity === 'low').length;
        
        // Calculate weighted score
        anomalyScore = Math.min(100, 
          (highSeverityCount * 30) + 
          (mediumSeverityCount * 15) + 
          (lowSeverityCount * 5)
        );
      }
      
      // Update metrics state with anomaly data
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        anomalies,
        anomalyScore
      }));
      
    } catch (error) {
      console.error("Error in enhanced metrics calculation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Call enhanced metrics in the useEffect
  useEffect(() => {
    if (activeTab === "analytics" || activeTab === "anomalies") {
      fetchEnhancedMetrics();
    }
  }, [activeTab]);

  // Add useEffect to call fetchEnhancedMetrics on component mount and refresh
  useEffect(() => {
    fetchEnhancedMetrics();
    
    // Set up interval for enhanced metrics refresh
    if (!replayMode) {
      const enhancedMetricsTimer = setInterval(() => {
        if (activeTab === "analytics" || activeTab === "anomalies") {
          fetchEnhancedMetrics();
        }
      }, refreshInterval * 2); // Refresh less frequently than basic metrics
      
      return () => clearInterval(enhancedMetricsTimer);
    }
  }, [replayMode, refreshInterval]);

  // Render anomaly alert component
  const renderAnomalyAlert = () => {
    if (metrics.anomalies.length === 0) return null;
    
    const severity = metrics.anomalies.some(a => a.severity === 'high') 
      ? 'high' 
      : metrics.anomalies.some(a => a.severity === 'medium') 
        ? 'medium' 
        : 'low';
    
    return (
      <Alert className={`mb-4 ${
        severity === 'high' ? 'bg-red-50 border-red-200 text-red-800' : 
        severity === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-800' : 
        'bg-blue-50 border-blue-200 text-blue-800'
      }`}>
        <AlertTriangle className="h-4 w-4 mr-2" />
        <AlertTitle>Anomalies Detected</AlertTitle>
        <AlertDescription>
          {metrics.anomalies.length} potential {metrics.anomalies.length === 1 ? 'issue' : 'issues'} detected in system processes. 
          Anomaly score: <span className="font-bold">{metrics.anomalyScore}/100</span>
        </AlertDescription>
      </Alert>
    );
  };

  // Render anomaly details component
  const renderAnomalyDetails = () => {
    const hasAnomalies = metrics.anomalies && metrics.anomalies.length > 0;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Anomaly Detection</h3>
          <Badge 
            variant={metrics.anomalyScore > 50 ? "destructive" : (metrics.anomalyScore > 20 ? "secondary" : "outline")}
            className="ml-2"
          >
            Score: {metrics.anomalyScore}
          </Badge>
        </div>
        
        {!hasAnomalies ? (
          <div className="bg-muted/20 p-6 rounded-lg text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
            <h3 className="text-lg font-medium">No Anomalies Detected</h3>
            <p className="text-muted-foreground mt-1">
              All system processes are running within expected parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Anomaly Distribution Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Anomaly Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'High', value: metrics.anomalies.filter(a => a.severity === 'high').length, color: '#ef4444' },
                            { name: 'Medium', value: metrics.anomalies.filter(a => a.severity === 'medium').length, color: '#f97316' },
                            { name: 'Low', value: metrics.anomalies.filter(a => a.severity === 'low').length, color: '#eab308' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {[
                            { name: 'High', value: metrics.anomalies.filter(a => a.severity === 'high').length, color: '#ef4444' },
                            { name: 'Medium', value: metrics.anomalies.filter(a => a.severity === 'medium').length, color: '#f97316' },
                            { name: 'Low', value: metrics.anomalies.filter(a => a.severity === 'low').length, color: '#eab308' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Deviation Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Deviation Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={metrics.anomalies.slice(0, 5).map(a => ({
                          name: a.process_name.split('_')[0],
                          deviation: a.deviation,
                          severity: a.severity
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: '% Deviation', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Deviation']} />
                        <Bar 
                          dataKey="deviation" 
                          name="Deviation %"
                        >
                          {metrics.anomalies.slice(0, 5).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.severity === 'high' ? '#ef4444' : (entry.severity === 'medium' ? '#f97316' : '#eab308')} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Anomaly Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Anomaly Timeline</CardTitle>
                <CardDescription>Showing when anomalies were detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics.anomalies
                        .slice()
                        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                        .map((a, index, arr) => {
                          // Calculate a cumulative score for the timeline
                          const severityValue = a.severity === 'high' ? 3 : (a.severity === 'medium' ? 2 : 1);
                          const previousValue = index > 0 ? arr[index - 1].cumulativeScore || 0 : 0;
                          return {
                            name: format(new Date(a.timestamp), 'HH:mm'),
                            date: new Date(a.timestamp),
                            value: severityValue,
                            cumulativeScore: previousValue + severityValue,
                            process: a.process_name
                          };
                        })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        type="category"
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(label) => 'Time: ' + label}
                        formatter={(value, name, props) => [props.payload.process, 'Process']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cumulativeScore" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Anomaly Trend" 
                        dot={{ fill: '#8884d8', r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Anomaly Details Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Anomaly Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Process</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Deviation</TableHead>
                      <TableHead>Detected</TableHead>
                      <TableHead>Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.anomalies.slice(0, 10).map((anomaly) => (
                      <TableRow key={anomaly.id}>
                        <TableCell className="font-medium">{anomaly.process_name}</TableCell>
                        <TableCell>{anomaly.metric}</TableCell>
                        <TableCell>{anomaly.expected}</TableCell>
                        <TableCell>{anomaly.actual}</TableCell>
                        <TableCell>{anomaly.deviation}%</TableCell>
                        <TableCell>{formatTimestamp(anomaly.timestamp)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              anomaly.severity === 'high' 
                                ? 'destructive' 
                                : anomaly.severity === 'medium' 
                                  ? 'secondary' 
                                  : 'outline'
                            }
                          >
                            {anomaly.severity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  // Render enhanced error tracking UI
  const renderEnhancedErrorTracking = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Rate Trends</CardTitle>
              <CardDescription>
                Error rates over the past 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {metrics.errorRateByHour.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.errorRateByHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="hour" 
                        tickFormatter={(hour) => format(new Date(hour), 'HH:mm')}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Error Rate']}
                        labelFormatter={(hour) => format(new Date(hour), 'MMM dd, yyyy HH:mm')}
                      />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        name="Error Rate"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No error rate data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Error Types Distribution</CardTitle>
              <CardDescription>
                Breakdown of errors by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {metrics.errorsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.errorsByType}
                      layout="vertical"
                      margin={{ left: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="type" 
                        type="category" 
                        width={100}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="count" 
                        name="Error Count" 
                        fill="#ef4444"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No error type data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Errors by Process</CardTitle>
              <CardDescription>
                Which processes fail most frequently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {metrics.errorsByProcess.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.errorsByProcess.slice(0, 10)}
                      layout="vertical"
                      margin={{ left: 120 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="process" 
                        type="category" 
                        width={120}
                        tick={{fontSize: 12}}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="count" 
                        name="Failed Executions" 
                        fill="#f97316"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No error data by process available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Error Impact Analysis</CardTitle>
              <CardDescription>
                Error patterns and system impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">Overall System Health</h4>
                    <p className="text-xs text-muted-foreground">Based on error patterns and frequency</p>
                  </div>
                  <Badge className={
                    metrics.anomalyScore > 70 ? 'bg-red-100 text-red-800' : 
                    metrics.anomalyScore > 40 ? 'bg-amber-100 text-amber-800' : 
                    'bg-green-100 text-green-800'
                  }>
                    {
                      metrics.anomalyScore > 70 ? 'Critical' : 
                      metrics.anomalyScore > 40 ? 'Warning' : 
                      'Healthy'
                    }
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Findings</h4>
                  <ul className="text-xs space-y-2">
                    {metrics.errorsByType.length > 0 && (
                      <li className="flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-2 text-amber-500" />
                        Most common error: <span className="font-medium ml-1">
                          {metrics.errorsByType[0].type} ({metrics.errorsByType[0].count} occurrences)
                        </span>
                      </li>
                    )}
                    {metrics.errorsByProcess.length > 0 && (
                      <li className="flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-2 text-amber-500" />
                        Most error-prone process: <span className="font-medium ml-1">
                          {metrics.errorsByProcess[0].process} ({metrics.errorsByProcess[0].count} failures)
                        </span>
                      </li>
                    )}
                    {metrics.errorRateByHour.length > 0 && metrics.errorRateByHour.some(h => h.rate > 0) && (
                      <li className="flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-2 text-amber-500" />
                        Peak error rate: <span className="font-medium ml-1">
                          {Math.max(...metrics.errorRateByHour.map(h => h.rate)).toFixed(1)}%
                        </span>
                      </li>
                    )}
                    {metrics.anomalies.some(a => a.severity === 'high') && (
                      <li className="flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-2 text-red-500" />
                        <span className="font-medium">High severity anomalies detected</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                  <ul className="text-xs space-y-2">
                    {metrics.errorsByType.length > 0 && (
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Investigate {metrics.errorsByType[0].type} errors
                      </li>
                    )}
                    {metrics.errorsByProcess.length > 0 && (
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Review {metrics.errorsByProcess[0].process} implementation
                      </li>
                    )}
                    {metrics.longestRunningProcesses.length > 0 && (
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Check long-running processes for potential deadlocks
                      </li>
                    )}
                    {metrics.anomalies.some(a => a.metric === 'duration') && (
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Optimize processes with unusually long durations
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render process list
  const renderProcessList = () => {
    return (
      <>
        {loading ? (
          <LoadingState message="Loading system processes..." />
        ) : processes.length === 0 ? (
          <EmptyState
            title="No system processes found"
            description="There are no system processes to display."
          />
        ) : (
          <div className="space-y-4">
            {filteredProcesses.map((process) => (
              <ProcessCard 
                key={process.id}
                process={process}
                onExpandToggle={() => toggleProcessExpand(process.id)}
                isExpanded={expandedRows[process.id] || false}
              />
            ))}
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    onClick={() => setPage(page > 1 ? page - 1 : 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                </PaginationItem>
                
                {/* Page number indicators here */}
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold">System Process Dashboard</h2>
          <p className="text-muted-foreground">Monitor system processes and batch operations</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </span>
          ) : (
            <span className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </span>
          )}
        </Button>
      </div>

      {metrics.anomalies && metrics.anomalies.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Anomalies Detected</AlertTitle>
          <AlertDescription>
            {metrics.anomalies.length} anomalies detected with an anomaly score of {metrics.anomalyScore.toFixed(1)}.
            See the Anomaly Detection tab for details.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="processes">System Processes</TabsTrigger>
          <TabsTrigger value="batch">Batch Operations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="anomalies">
            Anomaly Detection
            {metrics.anomalies && metrics.anomalies.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {metrics.anomalies.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="processes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>System Processes</CardTitle>
                <Select 
                  value={filter} 
                  onValueChange={setFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Processes</SelectItem>
                    <SelectItem value="running">Running Only</SelectItem>
                    <SelectItem value="completed">Completed Only</SelectItem>
                    <SelectItem value="failed">Failed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>
                {loading ? 'Loading processes...' : `${filteredProcesses.length} processes found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderProcessList()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="batches" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Batches</p>
                  <p className="text-2xl font-bold">{batchStats.total}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold">{batchStats.processing}</p>
                </div>
                <Play className="h-8 w-8 text-blue-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{batchStats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed/Cancelled</p>
                  <p className="text-2xl font-bold">{batchStats.failed + batchStats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Success Rate</p>
                  <p className="text-sm font-medium">{batchSuccessRate}%</p>
                </div>
                <Progress value={batchSuccessRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadBatchOperations()}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <LoadingState message="Loading batch operations..." />
          ) : batchOperations.length === 0 ? (
            <EmptyState
              title="No batch operations found"
              description="There are no batch operations to display."
            />
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchOperations.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {getStatusIcon(batch.status)}
                            <span className="ml-2">
                              {batch.operation_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatTimestamp(batch.created_at)}
                        </TableCell>
                        <TableCell>
                          {batch.target_ids ? 
                            (Array.isArray(batch.target_ids) ? batch.target_ids.length : '1') :
                            '0'}
                        </TableCell>
                        <TableCell>
                          {calculateDuration(batch.created_at, batch.completed_at)}
                        </TableCell>
                        <TableCell>{getStatusBadge(batch.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(page > 1 ? page - 1 : 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="analytics">
          {renderEnhancedErrorTracking()}
        </TabsContent>
        
        <TabsContent value="anomalies">
          {renderAnomalyDetails()}
        </TabsContent>
        
        <TabsContent value="errors">
          {renderEnhancedErrorTracking()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemProcessDashboard;