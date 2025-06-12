import React, { useState, useEffect } from "react";
import { supabase } from "@/infrastructure/database/client";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart2,
  List,
  RefreshCw,
  Clock4,
  Activity,
  ArrowUpDown,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingState from "@/components/shared/LoadingState";
import EmptyState from "@/components/shared/EmptyState";
import { Tables } from "@/types/core/database";

type SystemProcess = Tables<"system_processes">;
type ActivityLogEntry = Tables<"audit_logs">;

// Define metadata type to fix TypeScript errors
interface ProcessMetadata {
  is_scheduled?: boolean;
  schedule?: string;
  cron?: string;
  next_run?: string;
  [key: string]: any;
}

interface ProcessActivityMonitorProps {
  limit?: number;
  projectId?: string;
  refreshInterval?: number;
  processType?: string;
}

const ProcessActivityMonitor: React.FC<ProcessActivityMonitorProps> = ({
  limit = 10,
  projectId,
  refreshInterval = 30000,
  processType,
}) => {
  const [processes, setProcesses] = useState<SystemProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scheduled");
  const [scheduledJobs, setScheduledJobs] = useState<any[]>([]);
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [jobMetrics, setJobMetrics] = useState<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    pendingJobs: number;
    successRate: number;
    averageDuration: number;
    jobsByType: { name: string; value: number }[];
    executionFrequency?: { name: string; count: number; lastRun: string | null }[];
  }>({
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    pendingJobs: 0,
    successRate: 0,
    averageDuration: 0,
    jobsByType: [],
  });

  // Load scheduled processes
  const loadScheduledProcesses = async () => {
    setLoading(true);
    try {
      // Fetch system processes that are scheduled jobs
      let query = supabase
        .from("system_processes")
        .select("*")
        .or("metadata->is_scheduled.eq.true,process_name.ilike.%schedule%,process_name.ilike.%cron%,process_name.ilike.%job%,process_name.ilike.%task%")
        .order("start_time", { ascending: false })
        .limit(50);

      if (processType) {
        query = query.ilike("process_name", `%${processType}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching scheduled processes:", error);
        setProcesses([]);
      } else {
        setProcesses(data || []);
        processJobData(data || []);
      }

      // Fetch scheduled job execution history
      const { data: historyData, error: historyError } = await supabase
        .from("audit_logs")
        .select("*")
        .or("category.eq.scheduled,action_type.eq.scheduled")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (historyError) {
        console.error("Error fetching job history:", historyError);
        setJobHistory([]);
      } else {
        setJobHistory(historyData || []);
      }
    } catch (error) {
      console.error("Exception in loadScheduledProcesses:", error);
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  };

  // Process job data for metrics and scheduled jobs list
  const processJobData = (data: SystemProcess[]) => {
    // Extract scheduled jobs
    const scheduledJobsData = data.filter(
      (process) => {
        // Safely check if metadata is an object and has the required properties
        const metadata = process.metadata as ProcessMetadata | null;
        return metadata && 
          typeof metadata === "object" &&
          (metadata.is_scheduled === true ||
           typeof metadata.schedule === "string" ||
           typeof metadata.cron === "string" ||
           process.process_name.toLowerCase().includes("scheduled") ||
           process.process_name.toLowerCase().includes("cron"));
      }
    );

    // Calculate metrics
    const completed = data.filter(
      (process) => process.status === "completed"
    ).length;
    const failed = data.filter(
      (process) => process.status === "failed"
    ).length;
    const pending = data.filter(
      (process) =>
        process.status === "running" || process.status === "queued"
    ).length;
    const total = data.length;

    // Calculate average duration for completed processes
    let totalDuration = 0;
    let processesWithDuration = 0;

    data.forEach((process) => {
      if (
        process.status === "completed" &&
        process.start_time &&
        process.end_time
      ) {
        const startTime = new Date(process.start_time).getTime();
        const endTime = new Date(process.end_time).getTime();
        const duration = (endTime - startTime) / 1000; // in seconds
        totalDuration += duration;
        processesWithDuration++;
      }
    });

    const avgDuration =
      processesWithDuration > 0 ? totalDuration / processesWithDuration : 0;

    // Count jobs by type
    const jobTypeCounter: Record<string, number> = {};
    data.forEach((process) => {
      let jobType = "Unknown";
      if (process.process_name) {
        // Extract a meaningful job type from the process name
        const nameParts = process.process_name.split("_");
        if (nameParts.length > 1) {
          jobType = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
        } else {
          jobType = process.process_name;
        }
      }
      jobTypeCounter[jobType] = (jobTypeCounter[jobType] || 0) + 1;
    });

    // Convert to array for charts
    const jobsByType = Object.entries(jobTypeCounter).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
    
    // Calculate execution frequency
    const executionFrequency: Record<string, { count: number, lastRun: Date | null }> = {};
    
    // Group processes by name to analyze execution patterns
    data.forEach((process) => {
      if (!process.process_name) return;
      
      const processName = process.process_name;
      
      if (!executionFrequency[processName]) {
        executionFrequency[processName] = { 
          count: 0,
          lastRun: null
        };
      }
      
      executionFrequency[processName].count++;
      
      // Track last run time for each process
      if (process.start_time) {
        const startTime = new Date(process.start_time);
        
        if (!executionFrequency[processName].lastRun || 
            startTime > executionFrequency[processName].lastRun!) {
          executionFrequency[processName].lastRun = startTime;
        }
      }
    });
    
    // Calculate execution frequency data for visualization
    const executionFrequencyData = Object.entries(executionFrequency)
      .map(([name, data]) => ({
        name: name.split('_').slice(0, 2).join('_'),
        count: data.count,
        lastRun: data.lastRun ? data.lastRun.toISOString() : null
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Set metrics
    setJobMetrics({
      totalJobs: total,
      completedJobs: completed,
      failedJobs: failed,
      pendingJobs: pending,
      successRate: total > 0 ? (completed / total) * 100 : 0,
      averageDuration: avgDuration,
      jobsByType,
      executionFrequency: executionFrequencyData
    });

    // Set scheduled jobs with enhanced data
    setScheduledJobs(
      scheduledJobsData.map((job) => {
        // Extract schedule information from metadata
        let schedule = "Unknown";
        let nextRun = null;
        
        // Calculate next run time based on frequency pattern if available
        let estimatedNextRun = null;
        if (job.metadata && typeof job.metadata === 'object') {
          const metadata = job.metadata as ProcessMetadata;
          
          if (metadata.schedule) {
            schedule = metadata.schedule as string;
          } else if (metadata.cron) {
            schedule = metadata.cron as string;
          } else if (metadata.frequency) {
            schedule = metadata.frequency as string;
          }
          
          if (metadata.next_run) {
            nextRun = metadata.next_run as string;
          }
        }
        
        // For frequency-based calculation of next run (if not explicitly specified)
        if (!nextRun && job.start_time) {
          // Use simple frequency pattern detection
          const processName = job.process_name;
          const similarJobs = data.filter(p => 
            p.process_name === processName && 
            p.start_time && 
            p.start_time !== job.start_time
          );
          
          if (similarJobs.length > 1) {
            // Sort by start_time
            similarJobs.sort((a, b) => 
              new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime()
            );
            
            // Calculate average time between runs
            let totalInterval = 0;
            let intervalCount = 0;
            
            for (let i = 1; i < similarJobs.length; i++) {
              const prev = new Date(similarJobs[i-1].start_time!).getTime();
              const current = new Date(similarJobs[i].start_time!).getTime();
              totalInterval += (current - prev);
              intervalCount++;
            }
            
            if (intervalCount > 0) {
              const avgInterval = totalInterval / intervalCount;
              const lastRunTime = new Date(job.start_time).getTime();
              estimatedNextRun = new Date(lastRunTime + avgInterval);
              
              // Only use estimated time if it's in the future
              if (estimatedNextRun > new Date()) {
                nextRun = estimatedNextRun.toISOString();
              }
            }
          }
        }
        
        // Enhanced job data
        return {
          ...job,
          schedule,
          nextRun,
          frequency: executionFrequency[job.process_name || '']?.count || 1,
          lastRun: job.end_time || job.start_time,
          duration: job.start_time && job.end_time 
            ? (new Date(job.end_time).getTime() - new Date(job.start_time).getTime()) / 1000
            : null
        };
      }).sort((a, b) => {
        // Sort by next run time (null values last)
        if (a.nextRun && !b.nextRun) return -1;
        if (!a.nextRun && b.nextRun) return 1;
        if (a.nextRun && b.nextRun) {
          return new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime();
        }
        return 0;
      })
    );
  };

  // Initialize component
  useEffect(() => {
    loadScheduledProcesses();

    // Set up refresh interval
    const refreshTimer = setInterval(() => {
      loadScheduledProcesses();
    }, refreshInterval);

    return () => clearInterval(refreshTimer);
  }, [processType, refreshInterval]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "N/A";
    return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
  };

  // Format duration in a human-readable way
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  // Get status badge with appropriate color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">Completed</Badge>
        );
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      case "queued":
        return <Badge className="bg-yellow-100 text-yellow-800">Queued</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Convert job data for charts
  const prepareChartData = (data: any[]) => {
    const chartData: Record<string, number> = {};
    data.forEach((item) => {
      const date = new Date(item.timestamp || item.start_time);
      const dateKey = format(date, "MM-dd");
      chartData[dateKey] = (chartData[dateKey] || 0) + 1;
    });
    return Object.entries(chartData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Add Timeline view for process execution history
  const ProcessExecutionTimeline: React.FC<{ 
    processes: SystemProcess[];
    jobHistory: any[];
  }> = ({ processes, jobHistory }) => {
    // Combine processes and history for a comprehensive timeline
    const timelineData = React.useMemo(() => {
      const combined = [
        ...processes.map(p => ({
          id: p.id,
          name: p.process_name || 'Unknown',
          status: p.status || 'unknown',
          time: p.start_time || p.created_at,
          end_time: p.end_time,
          type: 'process',
          source: 'direct'
        })),
        ...jobHistory.map(log => ({
          id: log.id,
          name: log.action || 'Unknown Activity',
          status: log.status || 'unknown',
          time: log.timestamp,
          end_time: null,
          type: 'log',
          source: 'scheduled'
        }))
      ].filter(item => item.time) // Filter out items without time
       .sort((a, b) => new Date(b.time!).getTime() - new Date(a.time!).getTime()); // Sort by time descending
      
      return combined.slice(0, 30); // Limit to most recent 30 events
    }, [processes, jobHistory]);
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Process Execution Timeline</CardTitle>
          <CardDescription>Chronological history of process executions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-0 bottom-0 left-2 border-l-2 border-muted-foreground/20" />
              
              <div className="space-y-4">
                {timelineData.map(item => (
                  <div key={item.id} className="ml-6 relative">
                    {/* Timeline dot */}
                    <div className={`absolute left-[-14px] top-1 w-4 h-4 rounded-full 
                      ${item.status === 'completed' || item.status === 'success'
                        ? 'bg-green-100 border border-green-600'
                        : item.status === 'failed' || item.status === 'failure'
                          ? 'bg-red-100 border border-red-600'
                          : 'bg-blue-100 border border-blue-600'
                      }`}>
                      <div className={`w-2 h-2 rounded-full m-auto
                        ${item.status === 'completed' || item.status === 'success'
                          ? 'bg-green-600'
                          : item.status === 'failed' || item.status === 'failure'
                            ? 'bg-red-600'
                            : 'bg-blue-600'
                        }`} />
                    </div>
                    
                    <div className="mb-1 flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {item.name}
                          <Badge className="ml-2" variant={
                            item.status === 'completed' || item.status === 'success'
                              ? 'default'
                              : item.status === 'failed' || item.status === 'failure'
                                ? 'destructive' 
                                : 'secondary'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(item.time!)}
                        </div>
                      </div>
                      
                      {item.end_time && item.time && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock4 className="h-3 w-3" />
                          {formatDuration(
                            (new Date(item.end_time).getTime() - new Date(item.time).getTime()) / 1000
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  // Render component UI
  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Process Activity Monitor
        </CardTitle>
        <CardDescription>
          Monitor scheduled jobs and process executions
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <LoadingState message="Please wait while we load the scheduled process data" />
        ) : (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold">{jobMetrics.totalJobs}</div>
                  <div className="text-sm text-muted-foreground">Total Processes</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-green-600">
                    {jobMetrics.completedJobs} <span className="text-sm text-muted-foreground">({jobMetrics.successRate.toFixed(0)}%)</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-red-600">{jobMetrics.failedJobs}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold">{formatDuration(jobMetrics.averageDuration)}</div>
                  <div className="text-sm text-muted-foreground">Avg Duration</div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="scheduled" className="px-4">
              <TabsList className="mb-4 grid grid-cols-4 md:w-[400px]">
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="execution">Execution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="scheduled">
                {scheduledJobs.length === 0 ? (
                  <EmptyState
                    title="No scheduled jobs found"
                    description="There are no scheduled jobs running in the system currently."
                    icon={<Clock className="h-12 w-12 text-muted-foreground" />}
                  />
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job Name</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead>Last Run</TableHead>
                          <TableHead>Next Run</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheduledJobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.process_name}</TableCell>
                            <TableCell>{job.schedule}</TableCell>
                            <TableCell>
                              {job.lastRun
                                ? formatDistanceToNow(new Date(job.lastRun), {
                                    addSuffix: true,
                                  })
                                : "Never"}
                            </TableCell>
                            <TableCell>
                              {job.nextRun
                                ? formatDistanceToNow(new Date(job.nextRun), {
                                    addSuffix: true,
                                  })
                                : "Unknown"}
                            </TableCell>
                            <TableCell>{getStatusBadge(job.status || "")}</TableCell>
                            <TableCell>
                              {job.duration ? formatDuration(job.duration) : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history">
                <ProcessExecutionTimeline 
                  processes={processes} 
                  jobHistory={jobHistory} 
                />
              </TabsContent>
              
              <TabsContent value="analytics">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Process Types</CardTitle>
                      <CardDescription>Distribution of processes by type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={jobMetrics.jobsByType}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => 
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {jobMetrics.jobsByType.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={[
                                    "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", 
                                    "#dbeafe", "#2563eb", "#1d4ed8", "#1e40af"
                                  ][index % 8]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} processes`, 'Count']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Success Rate by Process Type</CardTitle>
                      <CardDescription>Success rate for different process types</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={prepareChartData(processes)}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                            <Bar dataKey="successRate" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {jobMetrics.executionFrequency && jobMetrics.executionFrequency.length > 0 && (
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle>Execution Frequency</CardTitle>
                        <CardDescription>How often processes are executed</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={jobMetrics.executionFrequency}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              layout="vertical"
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis 
                                dataKey="name" 
                                type="category"
                                tick={{ fontSize: 12 }}
                                width={150}
                              />
                              <Tooltip formatter={(value) => [`${value} runs`, 'Frequency']} />
                              <Bar dataKey="count" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="execution">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Process Duration</CardTitle>
                      <CardDescription>Average execution time for processes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={processes
                              .filter(p => p.start_time && p.end_time)
                              .map(p => {
                                const start = new Date(p.start_time!).getTime();
                                const end = new Date(p.end_time!).getTime();
                                const duration = (end - start) / 1000;
                                
                                return {
                                  name: p.process_name?.split('_').slice(0, 2).join('_') || 'Unknown',
                                  duration: Math.round(duration)
                                };
                              })
                              .reduce((acc, curr) => {
                                const existing = acc.find(item => item.name === curr.name);
                                if (existing) {
                                  existing.count++;
                                  existing.totalDuration += curr.duration;
                                  existing.avgDuration = Math.round(existing.totalDuration / existing.count);
                                } else {
                                  acc.push({
                                    name: curr.name,
                                    count: 1,
                                    totalDuration: curr.duration,
                                    avgDuration: curr.duration
                                  });
                                }
                                return acc;
                              }, [] as Array<{
                                name: string;
                                count: number;
                                totalDuration: number;
                                avgDuration: number;
                              }>)
                              .sort((a, b) => b.avgDuration - a.avgDuration)
                              .slice(0, 10)
                            }
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis
                              dataKey="name"
                              type="category" 
                              tick={{ fontSize: 12 }}
                              width={150}
                            />
                            <Tooltip 
                              formatter={(value) => [formatDuration(value as number), 'Avg Duration']} 
                            />
                            <Bar dataKey="avgDuration" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Process Status Distribution</CardTitle>
                      <CardDescription>Current status of all processes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Completed', value: jobMetrics.completedJobs, color: '#22c55e' },
                                { name: 'Failed', value: jobMetrics.failedJobs, color: '#ef4444' },
                                { name: 'Running', value: jobMetrics.pendingJobs, color: '#3b82f6' },
                                { 
                                  name: 'Other', 
                                  value: jobMetrics.totalJobs - jobMetrics.completedJobs - 
                                         jobMetrics.failedJobs - jobMetrics.pendingJobs,
                                  color: '#94a3b8'
                                }
                              ].filter(item => item.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => 
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {[
                                { name: 'Completed', value: jobMetrics.completedJobs, color: '#22c55e' },
                                { name: 'Failed', value: jobMetrics.failedJobs, color: '#ef4444' },
                                { name: 'Running', value: jobMetrics.pendingJobs, color: '#3b82f6' },
                                { 
                                  name: 'Other', 
                                  value: jobMetrics.totalJobs - jobMetrics.completedJobs - 
                                         jobMetrics.failedJobs - jobMetrics.pendingJobs,
                                  color: '#94a3b8'
                                }
                              ]
                              .filter(item => item.value > 0)
                              .map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} processes`, 'Count']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessActivityMonitor; 