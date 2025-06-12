import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tables } from "@/types/core/database";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingState from "@/components/shared/LoadingState";
import { supabase } from "@/infrastructure/database/client";
import { Bar, BarChart, CartesianGrid, LineChart, Line, XAxis, YAxis, Tooltip, Legend, TooltipProps, ResponsiveContainer, Pie, PieChart, Cell } from "recharts";
import { format } from "date-fns";

// Define time series data type
type TimeSeriesDataPoint = {
  date: string;
  hour: number;
  total: number;
  success: number;
  failed: number;
};

type ActivityLogEntry = Tables<"audit_logs">;
type SystemProcess = Tables<"system_processes">;
type BatchOperation = Tables<"bulk_operations">;

// Format timestamp for display
const formatTimestamp = (timestamp: string | null) => {
  if (!timestamp) return "N/A";
  return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
};

interface ActivityMetricsProps {
  projectId?: string;
  className?: string;
  period?: "day" | "week" | "month";
}

// Chart configuration according to Shadcn UI patterns
type ChartConfig = {
  [key: string]: {
    label: string;
    color: string;
  }
};

// Updated chart config with blue color palette from Shadcn UI
const chartConfig: ChartConfig = {
  user: {
    label: "User Actions",
    color: "hsl(217.2 91.2% 59.8%)" // blue-500
  },
  system: {
    label: "System Actions",
    color: "hsl(221.2 83.2% 53.3%)" // blue-600
  },
  success: {
    label: "Success",
    color: "hsl(212.7 26.8% 83.9%)" // blue-200
  },
  failed: {
    label: "Failed",
    color: "hsl(213.3 31.8% 91.4%)" // blue-100
  },
  pending: {
    label: "Pending",
    color: "hsl(224.3 76.3% 48%)" // blue-700
  },
  // Additional colors for various chart elements
  timeline: {
    label: "Timeline",
    color: "hsl(217.2 91.2% 59.8%)" // blue-500
  },
  actions: {
    label: "Actions",
    color: "hsl(221.2 83.2% 53.3%)" // blue-600
  },
  entities: {
    label: "Entities",
    color: "hsl(224.3 76.3% 48%)" // blue-700
  },
  status: {
    label: "Status",
    color: "hsl(226.4 71.0% 40.4%)" // blue-800
  }
};

type ProcessStats = {
  total: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  successRate: number;
};

// Timeline view component for activity sequences
const ActivitySequenceTimeline: React.FC<{ data: ActivityLogEntry[] }> = ({ data }) => {
  // Group activities by entity to show sequences
  const entitySequences = React.useMemo(() => {
    const sequences: Record<string, {
      entity: string;
      activities: Array<{id: string; action: string; timestamp: string; status: string}>
    }> = {};
    
    // Process activities to extract sequences
    data.forEach(activity => {
      if (activity.entity_id && activity.entity_type) {
        const key = `${activity.entity_type}:${activity.entity_id}`;
        if (!sequences[key]) {
          sequences[key] = {
            entity: `${activity.entity_type} (${activity.entity_id.split('_').pop()})`,
            activities: []
          };
        }
        
        sequences[key].activities.push({
          id: activity.id,
          action: activity.action || 'unknown',
          timestamp: activity.timestamp || new Date().toISOString(),
          status: activity.status || 'unknown'
        });
      }
    });
    
    // Sort activities by timestamp and limit to top sequences
    Object.values(sequences).forEach(sequence => {
      sequence.activities.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
    
    // Return top 5 sequences with most activities
    return Object.values(sequences)
      .sort((a, b) => b.activities.length - a.activities.length)
      .slice(0, 5);
  }, [data]);
  
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle>Activity Sequences</CardTitle>
        <CardDescription>Timeline view of related activities on entities</CardDescription>
      </CardHeader>
      <CardContent>
        {entitySequences.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity sequences found
          </div>
        ) : (
          <div className="space-y-6">
            {entitySequences.map((sequence) => (
              <div key={sequence.entity} className="space-y-2">
                <h4 className="text-sm font-medium">{sequence.entity}</h4>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute top-0 bottom-0 left-3 border-l-2 border-muted-foreground/20" />
                  
                  {/* Timeline events */}
                  <div className="space-y-3 ml-6">
                    {sequence.activities.map((activity, index) => (
                      <div key={activity.id} className="relative pl-6">
                        {/* Timeline dot */}
                        <div className={`absolute left-[-14px] top-1 w-4 h-4 rounded-full flex items-center justify-center
                          ${activity.status === 'success' 
                            ? 'bg-green-100 text-green-600 border border-green-600' 
                            : activity.status === 'failure' 
                              ? 'bg-red-100 text-red-600 border border-red-600' 
                              : 'bg-blue-100 text-blue-600 border border-blue-600'
                          }`}>
                          <div className={`w-2 h-2 rounded-full
                            ${activity.status === 'success' 
                              ? 'bg-green-600' 
                              : activity.status === 'failure' 
                                ? 'bg-red-600' 
                                : 'bg-blue-600'
                            }`} />
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium">
                            {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimestamp(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Distribution chart by activity type
const ActivityDistributionChart: React.FC<{ 
  actionCounts: Record<string, number>
}> = ({ actionCounts }) => {
  const chartData = React.useMemo(() => {
    return Object.entries(actionCounts)
      .map(([name, value]) => ({ 
        name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [actionCounts]);
  
  const colors = [
    '#3b82f6', // blue-500
    '#60a5fa', // blue-400
    '#93c5fd', // blue-300
    '#bfdbfe', // blue-200
    '#dbeafe', // blue-100
    '#2563eb', // blue-600
    '#1d4ed8', // blue-700
    '#1e40af', // blue-800
    '#1e3a8a', // blue-900
    '#eff6ff', // blue-50
  ];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Activity Distribution</CardTitle>
        <CardDescription>Activities by type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={90}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="value" name="Count">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced success/failure visualization
const SuccessFailureVisualization: React.FC<{
  successRate: number;
  totalCount: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
}> = ({ successRate, totalCount, successCount, failureCount, pendingCount }) => {
  // Calculate percentages for the chart
  const successPercentage = Math.round((successCount / totalCount) * 100) || 0;
  const failurePercentage = Math.round((failureCount / totalCount) * 100) || 0;
  const pendingPercentage = Math.round((pendingCount / totalCount) * 100) || 0;
  const otherPercentage = 100 - successPercentage - failurePercentage - pendingPercentage;
  
  // Data for the pie chart
  const chartData = [
    { name: 'Success', value: successCount, percentage: successPercentage, color: '#22c55e' },
    { name: 'Failure', value: failureCount, percentage: failurePercentage, color: '#ef4444' },
    { name: 'Pending', value: pendingCount, percentage: pendingPercentage, color: '#3b82f6' },
    { name: 'Other', value: totalCount - successCount - failureCount - pendingCount, percentage: otherPercentage, color: '#94a3b8' },
  ].filter(item => item.value > 0);
  
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle>Success/Failure Analysis</CardTitle>
        <CardDescription>Detailed breakdown of activity outcomes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={1}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="space-y-6">
              {/* Success rate gauge */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Success Rate</h4>
                  <span className="text-xl font-bold">{successRate.toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      successRate >= 90 ? 'bg-green-500' : 
                      successRate >= 75 ? 'bg-green-400' : 
                      successRate >= 50 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              </div>
              
              {/* Detailed metrics */}
              <div className="grid grid-cols-2 gap-4">
                {chartData.map((item) => (
                  <div key={item.name} className="bg-muted/20 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm">{item.percentage}%</span>
                    </div>
                    <div className="mt-1 text-xl font-bold">{item.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityMetrics: React.FC<ActivityMetricsProps> = ({
  projectId,
  className = "",
  period = "week",
}) => {
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityLogEntry[]>([]);
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});
  const [userSystemSplit, setUserSystemSplit] = useState({ user: 0, system: 0 });
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [processStats, setProcessStats] = useState<ProcessStats>({
    total: 0,
    running: 0,
    completed: 0, 
    failed: 0,
    cancelled: 0,
    successRate: 0
  });
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [activePeriod, setActivePeriod] = useState<"day" | "week" | "month">(period);
  const [activityTypesData, setActivityTypesData] = useState<{ name: string; value: number }[]>([]);
  const [successFailureData, setSuccessFailureData] = useState<{
    totalCount: number;
    successCount: number;
    failureCount: number;
    pendingCount: number;
    otherCount: number;
    successRate: number;
    failureRate: number;
  }>({
    totalCount: 0,
    successCount: 0,
    failureCount: 0,
    pendingCount: 0,
    otherCount: 0,
    successRate: 0,
    failureRate: 0,
  });

  // Calculate date range based on period
  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();

    switch (activePeriod) {
      case "day":
        startDate.setDate(now.getDate() - 1);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return {
      start: startDate.toISOString(),
      end: now.toISOString(),
    };
  };

  // Fetch system process data
  const fetchProcessData = async () => {
    try {
      const { start } = getDateRange();
      
      // Get system processes
      const { data: processes, error: processError } = await supabase
        .from("system_processes")
        .select("*")
        .gte("start_time", start)
        .order("start_time", { ascending: false });
        
      if (processError) {
        console.error("Error fetching system processes:", processError);
          return;
        }

      // Calculate process statistics
      const stats: ProcessStats = {
        total: processes?.length || 0,
        running: processes?.filter(p => p.status === 'running').length || 0,
        completed: processes?.filter(p => p.status === 'completed').length || 0,
        failed: processes?.filter(p => p.status === 'failed').length || 0,
        cancelled: processes?.filter(p => p.status === 'cancelled').length || 0,
        successRate: 0
      };
      
      // Calculate success rate if we have processes
      if (stats.total > 0) {
        stats.successRate = Math.round((stats.completed / stats.total) * 100);
      }
      
      setProcessStats(stats);
    } catch (error) {
      console.error("Error fetching process data:", error);
    }
  };

  // Fetch activity data
  const fetchActivityData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Prepare query
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .gte("timestamp", start)
        .lte("timestamp", end)
        .limit(1000); // Reasonable limit for analytics

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching activity data:", error);
        setActivityData([]);
      } else {
        setActivityData(data || []);
        processActivityData(data || []);
      }
      } catch (error) {
      console.error("Error in fetchActivityData:", error);
      setActivityData([]);
      } finally {
      setLoading(false);
    }
  };

  // Process the activity data for charts
  const processActivityData = (data: ActivityLogEntry[]) => {
    // Count by action type
    const actionCounter: Record<string, number> = {};
    // Count by entity type
    const entityCounter: Record<string, number> = {};
    // Count by status
    const statusCounter: Record<string, number> = {};
    // Count by source (user vs system)
    let userCount = 0;
    let systemCount = 0;
    // Create time series data (hourly breakdown)
    const timeCounter: Record<string, { total: number; success: number; failed: number }> = {};
    // Activity type distribution
    const typeDistribution: Record<string, number> = {};
    
    // Get hour slots for the past 24 hours
    const hourSlots = Array.from({ length: 24 }, (_, i) => {
      const d = new Date();
      d.setHours(d.getHours() - 23 + i);
      return d.toISOString().slice(0, 13); // YYYY-MM-DDTHH format
    });
    
    // Initialize timeCounter with all hour slots
    hourSlots.forEach(hour => {
      timeCounter[hour] = { total: 0, success: 0, failed: 0 };
    });
    
    // Process each activity log
    data.forEach((log) => {
      // Action counts
      const action = log.action || "unknown";
      actionCounter[action] = (actionCounter[action] || 0) + 1;
      
      // Entity counts
      const entity = log.entity_type || "unknown";
      entityCounter[entity] = (entityCounter[entity] || 0) + 1;
      
      // Status counts
      const status = log.status || "unknown";
      statusCounter[status] = (statusCounter[status] || 0) + 1;
      
      // User vs System counts
      if (log.action_type === "system" || !log.user_id) {
        systemCount++;
      } else {
        userCount++;
      }
      
      // Time series data
      if (log.timestamp) {
        const hour = new Date(log.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH format
        
        if (!timeCounter[hour]) {
          timeCounter[hour] = { total: 0, success: 0, failed: 0 };
        }
        
        timeCounter[hour].total += 1;
        
        if (log.status === "success") {
          timeCounter[hour].success += 1;
        } else if (log.status === "failure" || log.status === "failed") {
          timeCounter[hour].failed += 1;
        }
      }
      
      // Activity type distribution (from category or derived from action)
      const activityType = log.category || 
        (log.action && log.action.includes('_') ? log.action.split('_')[0] : "other");
      typeDistribution[activityType] = (typeDistribution[activityType] || 0) + 1;
    });
    
    // Convert to array for charts
    setActionCounts(actionCounter);
    setEntityCounts(entityCounter);
    setStatusCounts(statusCounter);
    setUserSystemSplit({ user: userCount, system: systemCount });
    
    // Create time series data array
    const timeSeriesArray = Object.entries(timeCounter).map(([date, counts]) => ({
      date,
      hour: new Date(date).getHours(),
      total: counts.total,
      success: counts.success,
      failed: counts.failed
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    setTimeSeriesData(timeSeriesArray);
    
    // Create activity type distribution data
    const activityTypesData = prepareDonutData(
      typeDistribution,
      (key) => key.charAt(0).toUpperCase() + key.slice(1)
    );
    setActivityTypesData(activityTypesData);
    
    // Create success/failure rate data
    const successRate = calculateSuccessRate(statusCounter);
    setSuccessFailureData(successRate);
  };

  // Calculate success/failure metrics
  const calculateSuccessRate = (statusCounts: Record<string, number>) => {
    const totalLogs = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const successCount = statusCounts["success"] || 0;
    const failureCount = (statusCounts["failure"] || 0) + (statusCounts["failed"] || 0);
    const pendingCount = statusCounts["pending"] || 0;
    const otherCount = totalLogs - successCount - failureCount - pendingCount;
    
    return {
      totalCount: totalLogs,
      successCount,
      failureCount,
      pendingCount,
      otherCount,
      successRate: totalLogs > 0 ? (successCount / totalLogs) * 100 : 0,
      failureRate: totalLogs > 0 ? (failureCount / totalLogs) * 100 : 0,
    };
  };

  // Format action names for display
  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Prepare data for charts
  const prepareDonutData = (
    countData: Record<string, number>,
    formatter: (key: string) => string = (k) => k
  ) => {
    return Object.entries(countData)
      .map(([key, value]) => ({
        name: formatter(key),
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 for donut charts
  };

  const prepareBarData = (
    countData: Record<string, number>,
    formatter: (key: string) => string = (k) => k
  ) => {
    return Object.entries(countData)
      .map(([key, value]) => ({
        name: formatter(key),
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 for bar charts
  };

  // Load data on component mount and when period changes
  useEffect(() => {
    fetchActivityData();
    fetchProcessData();
  }, [projectId, activePeriod]);

  // Generate a consistent blue color gradient for charts
  const getBlueShade = (index: number, total: number) => {
    const baseHue = 220; // Blue base hue
    const hue = baseHue + (index * 10) % 30; // Small hue variation
    const saturation = 75 - (index * 5) % 20; // Saturation variation
    const lightness = 60 - (index * 5) % 30; // Lightness variation
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  };

  // Prepare chart data
  const userSystemChartData = [
    { name: "User", value: userSystemSplit.user, fill: chartConfig.user.color },
    { name: "System", value: userSystemSplit.system, fill: chartConfig.system.color }
  ];

  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    fill: chartConfig[status]?.color || chartConfig.status.color
  }));

  const actionBarData = prepareBarData(actionCounts, formatActionName);
  
  // Process entity data with blue color palette
  const entityChartData = Object.entries(entityCounts)
    .map(([entity, count], index) => ({
      name: entity.charAt(0).toUpperCase() + entity.slice(1),
      value: count,
      fill: getBlueShade(index, Object.keys(entityCounts).length)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Create custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
    return (
        <div className="bg-background border border-border p-2 rounded-md shadow-sm">
          <p className="text-xs font-medium">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {`${entry.name}: ${entry.value}`}
            </p>
        ))}
      </div>
    );
  }
    return null;
  };

  // Prepare process stats data for charts
  const processStatsData = [
    { name: "Running", value: processStats.running, fill: "#3b82f6" },
    { name: "Completed", value: processStats.completed, fill: "#10b981" },
    { name: "Failed", value: processStats.failed, fill: "#ef4444" },
    { name: "Cancelled", value: processStats.cancelled, fill: "#f59e0b" }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activity Metrics</h2>
          <p className="text-muted-foreground">
            Analytics and insights for system and user activities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Tabs
            value={activePeriod}
            onValueChange={(value) => setActivePeriod(value as "day" | "week" | "month")}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Please wait while we process the activity data" />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="user-system">User vs System</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="success-failure">Success/Failure</TabsTrigger>
            <TabsTrigger value="timelines">Activity Timelines</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="total" stroke={chartConfig.timeline.color} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">User vs System Actions</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userSystemChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {userSystemChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Top Actions</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={actionBarData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill={chartConfig.actions.color} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartConfig[entry.name.toLowerCase()]?.color || chartConfig.status.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="user-system">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">System vs User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userSystemChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill={chartConfig.status.color}
                          dataKey="value"
                        >
                          {userSystemChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">User vs System Actions</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'User Actions', value: userSystemSplit.user },
                            { name: 'System Actions', value: userSystemSplit.system }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          <Cell fill={chartConfig.user.color} />
                          <Cell fill={chartConfig.system.color} />
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} activities`, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActivityDistributionChart actionCounts={actionCounts} />
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Entity Type Distribution</CardTitle>
                  <CardDescription>Activities by entity type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(entityCounts)
                            .map(([name, value]) => ({ 
                              name: name.charAt(0).toUpperCase() + name.slice(1), 
                              value 
                            }))
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 8)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {Object.entries(entityCounts)
                            .map(([name, value]) => ({ name, value }))
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 8)
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getBlueShade(index, 8)} />
                            ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Activity Status Distribution Over Time</CardTitle>
                  <CardDescription>How activity outcomes change over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={timeSeriesData.map(point => ({
                          name: point.hour.toString(),
                          Success: point.success,
                          Failed: point.failed,
                          Other: point.total - point.success - point.failed
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Success" stackId="a" fill="#22c55e" />
                        <Bar dataKey="Failed" stackId="a" fill="#ef4444" />
                        <Bar dataKey="Other" stackId="a" fill="#94a3b8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="success-failure">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SuccessFailureVisualization 
                successRate={successFailureData.successRate}
                totalCount={successFailureData.totalCount}
                successCount={successFailureData.successCount}
                failureCount={successFailureData.failureCount}
                pendingCount={successFailureData.pendingCount}
              />
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Success Rate Trends</CardTitle>
                  <CardDescription>How success rates change over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={timeSeriesData.map(point => {
                          const total = point.total || 1; // Avoid division by zero
                          return {
                            name: point.hour.toString(),
                            rate: Math.round((point.success / total) * 100)
                          };
                        })}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} label={{ value: 'Success %', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                        <Line
                          type="monotone"
                          dataKey="rate"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timelines">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActivitySequenceTimeline data={activityData} />
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Activity Volume Timeline</CardTitle>
                  <CardDescription>Activity volume over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={timeSeriesData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip formatter={(value) => [value, 'Activities']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          name="Total"
                          stroke="#3b82f6" 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ActivityMetrics;
