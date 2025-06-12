import React, { useState } from "react";
import ActivityMonitor from "@/components/activity/ActivityMonitor";
import SystemProcessDashboard from "@/components/activity/SystemProcessDashboard";
import ActivityMetrics from "@/components/activity/ActivityMetrics";
import DatabaseChangeLog from "@/components/activity/DatabaseChangeLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ListFilter, 
  BarChart, 
  Activity, 
  Database, 
  Server, 
  RefreshCcw,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActivityLog } from '@/components/activity/ActivityLogProvider';
import { supabase } from '@/infrastructure/database/client';

const ActivityMonitorPage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const activityLog = useActivityLog();
  const [activeTab, setActiveTab] = useState('user-activities');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setRefreshKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error('Error refreshing activities:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      let query;
      let filename;
      
      switch (activeTab) {
        case 'user-activities':
          query = supabase
            .from('audit_logs')
            .select('*')
            .in('category', ['user', 'integration'])
            .order('timestamp', { ascending: false });
          filename = 'user-activities-export.csv';
          break;
        case 'system-processes':
          query = supabase
            .from('system_processes')
            .select('*')
            .order('start_time', { ascending: false });
          filename = 'system-processes-export.csv';
          break;
        case 'database-changes':
          query = supabase
            .from('audit_logs')
            .select('*')
            .eq('category', 'database')
            .order('timestamp', { ascending: false });
          filename = 'database-changes-export.csv';
          break;
        case 'bulk-operations':
          query = supabase
            .from('bulk_operations')
            .select('*')
            .order('created_at', { ascending: false });
          filename = 'bulk-operations-export.csv';
          break;
        default:
          query = supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false });
          filename = 'all-activities-export.csv';
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const replacer = (key: string, value: any) => value === null ? '' : value;
        const header = Object.keys(data[0]);
        const csv = [
          header.join(','),
          ...data.map(row => header.map(fieldName => 
            JSON.stringify(row[fieldName], replacer)).join(','))
        ].join('\r\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Monitor</h1>
          <p className="text-muted-foreground">
            Track and analyze system and user activities
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="flex items-center gap-1"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="logs" key={`tabs-${refreshKey}`}>
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="logs" className="flex items-center" onClick={() => setActiveTab('user-activities')}>
            <Activity className="h-4 w-4 mr-2" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center" onClick={() => setActiveTab('system-processes')}>
            <Server className="h-4 w-4 mr-2" />
            System Processes
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center" onClick={() => setActiveTab('database-changes')}>
            <Database className="h-4 w-4 mr-2" />
            Database Changes
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center" onClick={() => setActiveTab('metrics')}>
            <BarChart className="h-4 w-4 mr-2" />
            Activity Metrics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                User and system activity history across the application
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ActivityMonitor hideSystemAndMetricsTabs={true} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Processes</CardTitle>
              <CardDescription>
                Monitor automated processes, batch operations, and background tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <SystemProcessDashboard limit={20} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database">
          <DatabaseChangeLog limit={50} showHeader={false} />
        </TabsContent>
        
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Activity Metrics</CardTitle>
              <CardDescription>
                Visual analytics and performance metrics for system activities
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ActivityMetrics />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActivityMonitorPage;
