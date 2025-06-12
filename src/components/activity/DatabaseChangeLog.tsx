import React, { useState, useEffect } from "react";
import { supabase } from "@/infrastructure/database/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, DatabaseIcon, Code, GitMerge, RefreshCw, Loader2, ChevronUp, Database, Shield, Table2, AlignLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logSystemActivity } from '@/utils/shared/logging/activityLogger';
import { ActivityStatus } from '@/types/domain/activity/ActivityTypes';

interface DatabaseChange {
  id: string;
  timestamp: string;
  action: string;
  username: string;
  details: {
    schema?: string;
    table?: string;
    operation?: string;
    sql?: string;
    old_data?: any;
    new_data?: any;
    [key: string]: any;
  };
  category: string;
  severity: string;
  entity_type: string;
  entity_id?: string;
}

type ChangeCategory = 'schema' | 'data' | 'trigger' | 'other';

interface DatabaseChangeLogProps {
  limit?: number;
  showHeader?: boolean;
  projectId?: string;
}

const DatabaseChangeLog: React.FC<DatabaseChangeLogProps> = ({ 
  limit = 20,
  showHeader = true,
  projectId
}) => {
  const [changes, setChanges] = useState<DatabaseChange[]>([]);
  const [filteredData, setFilteredData] = useState<DatabaseChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedChangeIds, setExpandedChangeIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Toggle expand/collapse for a change
  const toggleExpandChange = (id: string) => {
    setExpandedChangeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  useEffect(() => {
    fetchDatabaseChanges();

    // Set up realtime subscription
    const subscription = supabase
      .channel('audit_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs',
          filter: 'category=eq.database',
        },
        (payload) => {
          fetchDatabaseChanges();
        }
      )
      .subscribe();

    // Set up real-time subscription for new database changes
    const newSubscription = supabase
      .channel('db_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: 'category=eq.database',
        },
        (payload) => {
          // Here we need to map from database format to component's expected format
          if (payload.new) {
            const newChange = transformAuditLogToChange(payload.new);
            if (newChange) {
              setChanges((prevChanges) => [newChange, ...prevChanges]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(newSubscription);
    };
  }, []);

  // Helper function to transform database audit log to our DatabaseChange format
  const transformAuditLogToChange = (dbLog: any): DatabaseChange | null => {
    // Make sure required fields exist
    if (!dbLog.id || !dbLog.timestamp || !dbLog.action) {
      return null;
    }
    
    // Parse details if needed
    let detailsObj = dbLog.details;
    if (typeof detailsObj === 'string') {
      try {
        detailsObj = JSON.parse(detailsObj);
      } catch (e) {
        detailsObj = {};
      }
    }
    
    return {
      id: dbLog.id,
      timestamp: dbLog.timestamp,
      action: dbLog.action,
      username: dbLog.user_email || 'System',
      details: detailsObj || {},
      category: dbLog.category || 'database',
      severity: dbLog.severity || 'info',
      entity_type: dbLog.entity_type || '',
      entity_id: dbLog.entity_id
    };
  };

  const fetchDatabaseChanges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('category', 'database')
        .in('entity_type', ['table', 'function', 'trigger', 'schema', 'view', 'index'])
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        // Transform to expected format
        const transformedChanges = data
          .filter(item => item)
          .map(item => transformAuditLogToChange(item))
          .filter((item): item is DatabaseChange => item !== null);
        
        setChanges(transformedChanges);
      }
    } catch (error) {
      console.error('Error fetching database changes:', error);
      logSystemActivity('FETCH_DATABASE_CHANGES', {
        status: ActivityStatus.FAILURE,
        details: { error: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredData(changes);
    } else {
      // Filter by change type
      const changeTypeMap = {
        'schema': ['CREATE_SCHEMA', 'ALTER_SCHEMA', 'DROP_SCHEMA', 'CREATE_TABLE', 'ALTER_TABLE', 'DROP_TABLE', 'ADD_COLUMN', 'ALTER_COLUMN', 'DROP_COLUMN'],
        'data': ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'],
        'triggers': ['CREATE_TRIGGER', 'DROP_TRIGGER', 'CREATE_FUNCTION', 'ALTER_FUNCTION', 'DROP_FUNCTION']
      };
      
      setFilteredData(changes.filter(change => {
        const operation = change.details?.operation || change.action;
        return changeTypeMap[activeTab].some(type => 
          operation.toUpperCase().includes(type)
        );
      }));
    }
  }, [changes, activeTab]);

  // Get change icon
  const getChangeIcon = (change: DatabaseChange) => {
    const operation = change.details?.operation || change.action;
    if (operation.toUpperCase().includes('CREATE')) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Create</Badge>;
    } else if (operation.toUpperCase().includes('ALTER') || operation.toUpperCase().includes('UPDATE')) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Modify</Badge>;
    } else if (operation.toUpperCase().includes('DROP') || operation.toUpperCase().includes('DELETE')) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Delete</Badge>;
    } else {
      return <Badge variant="outline">{operation}</Badge>;
    }
  };

  // Get category label
  const getCategoryLabel = (change: DatabaseChange) => {
    const operation = change.details?.operation || change.action;
    
    if (['CREATE_SCHEMA', 'ALTER_SCHEMA', 'DROP_SCHEMA', 'CREATE_TABLE', 'ALTER_TABLE', 'DROP_TABLE', 'ADD_COLUMN', 'ALTER_COLUMN', 'DROP_COLUMN'].some(
      type => operation.toUpperCase().includes(type)
    )) {
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Schema</Badge>;
    } else if (['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'].some(
      type => operation.toUpperCase().includes(type)
    )) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Data</Badge>;
    } else if (['CREATE_TRIGGER', 'DROP_TRIGGER', 'CREATE_FUNCTION', 'ALTER_FUNCTION', 'DROP_FUNCTION'].some(
      type => operation.toUpperCase().includes(type)
    )) {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Trigger/Function</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Other</Badge>;
    }
  };

  // Get change type
  const getChangeType = (change: DatabaseChange): string => {
    if (change.entity_type.toLowerCase().includes('schema') || 
        change.action.toLowerCase().includes('table') || 
        change.action.toLowerCase().includes('column')) {
      return 'schema';
    } else if (change.entity_type.toLowerCase().includes('trigger') || 
               change.entity_type.toLowerCase().includes('function')) {
      return 'trigger';
    } else {
      return 'data';
    }
  };

  // Filter based on active category
  const displayChanges = activeCategory === 'all'
    ? filteredData
    : filteredData.filter(change => getChangeType(change) === activeCategory);

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Database Change Log</CardTitle>
            <CardDescription>
              Track schema and data changes across the system
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDatabaseChanges} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </CardHeader>
      )}
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Changes</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="triggers">Triggers & Functions</TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayChanges.length === 0 ? (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>No database changes found</AlertTitle>
              <AlertDescription>
                No database changes match your current filter criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {displayChanges.map((change) => (
                <Collapsible 
                  key={change.id}
                  open={expandedChangeIds.has(change.id)}
                  onOpenChange={() => toggleExpandChange(change.id)}
                  className="border rounded-md"
                >
                  <CollapsibleTrigger asChild>
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center space-x-4">
                        {expandedChangeIds.has(change.id) 
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> 
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        }
                        <div>
                          <div className="font-medium flex items-center">
                            {getChangeIcon(change)}
                            <span className="ml-2">
                              {change.details?.table 
                                ? `${change.details.table} ${change.details?.operation || change.action}`
                                : change.action}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(change.timestamp), { addSuffix: true })} by {change.username}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 items-center">
                        {getCategoryLabel(change)}
                        <Badge variant="outline" className="bg-slate-50">
                          {change.details?.schema || 'public'}
                        </Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 border-t bg-muted/20 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Change Details</h4>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Timestamp:</span> {format(new Date(change.timestamp), 'PPpp')}</p>
                            <p><span className="font-medium">User:</span> {change.username}</p>
                            <p><span className="font-medium">Action:</span> {change.action}</p>
                            {change.details?.schema && (
                              <p><span className="font-medium">Schema:</span> {change.details.schema}</p>
                            )}
                            {change.details?.table && (
                              <p><span className="font-medium">Table:</span> {change.details.table}</p>
                            )}
                            {change.details?.operation && (
                              <p><span className="font-medium">Operation:</span> {change.details.operation}</p>
                            )}
                            {change.severity && (
                              <p><span className="font-medium">Severity:</span> {change.severity}</p>
                            )}
                          </div>
                        </div>
                        
                        {change.details?.columns && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Affected Columns</h4>
                            <div className="text-sm">
                              <ul className="list-disc pl-4">
                                {Array.isArray(change.details.columns) 
                                  ? change.details.columns.map((col, i) => <li key={i}>{col}</li>)
                                  : Object.keys(change.details.columns).map(col => (
                                    <li key={col}>{col}: {change.details.columns[col]}</li>
                                  ))
                                }
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {change.details?.sql && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center">
                            <AlignLeft className="h-4 w-4 mr-1" />
                            SQL Statement
                          </h4>
                          <div className="bg-slate-100 p-3 rounded text-sm font-mono overflow-auto max-h-60">
                            {change.details.sql}
                          </div>
                        </div>
                      )}
                      
                      {change.details?.old_data && change.details?.new_data && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Data Changes</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-xs font-medium mb-1">Previous Data</h5>
                              <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-60">
                                {JSON.stringify(change.details.old_data, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium mb-1">New Data</h5>
                              <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-60">
                                {JSON.stringify(change.details.new_data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {change.details && Object.keys(change.details).length > 0 && 
                       !['schema', 'table', 'operation', 'sql', 'old_data', 'new_data', 'columns'].some(k => k in change.details) && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Additional Details</h4>
                          <div className="bg-slate-100 p-3 rounded text-sm overflow-auto max-h-60">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(change.details, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DatabaseChangeLog; 