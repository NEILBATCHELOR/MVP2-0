/**
 * DFNS Webhook Management Component - UI for managing DFNS webhooks
 * 
 * This component provides a comprehensive interface for:
 * - Creating and configuring webhooks
 * - Managing webhook subscriptions
 * - Monitoring webhook deliveries
 * - Testing webhook endpoints
 * - Viewing webhook statistics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DfnsWebhookManager,
  WebhookConfig,
  WebhookDelivery,
  WebhookEvent,
  DfnsWebhookEvent,
  WebhookStatus,
  WebhookDeliveryStatus,
  type WebhookFilterConfig
} from '@/infrastructure/dfns/webhook-manager';
import { DfnsAuthenticator } from '@/infrastructure/dfns';
import { DEFAULT_CLIENT_CONFIG } from '@/infrastructure/dfns/config';
import { 
  Webhook, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  Edit,
  Eye,
  BarChart
} from 'lucide-react';

// ===== Types =====

interface WebhookManagementProps {
  authenticator?: DfnsAuthenticator;
  onWebhookCreated?: (webhook: WebhookConfig) => void;
  onWebhookDeleted?: (webhookId: string) => void;
  defaultView?: 'webhooks' | 'events' | 'statistics';
}

interface WebhookFormData {
  name: string;
  url: string;
  description: string;
  events: DfnsWebhookEvent[];
  secret: string;
  headers: Record<string, string>;
  filterConfig: WebhookFilterConfig;
}

// ===== Main Component =====

export const DfnsWebhookManagement: React.FC<WebhookManagementProps> = ({
  authenticator,
  onWebhookCreated,
  onWebhookDeleted,
  defaultView = 'webhooks'
}) => {
  // ===== State Management =====
  const [webhookManager] = useState(() => 
    new DfnsWebhookManager(DEFAULT_CLIENT_CONFIG, authenticator)
  );
  
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState(defaultView);

  // ===== Data Loading =====

  const loadWebhooks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const webhookList = await webhookManager.listWebhooks();
      setWebhooks(webhookList);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [webhookManager]);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const { events: eventList } = await webhookManager.listWebhookEvents({ limit: 100 });
      setEvents(eventList);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [webhookManager]);

  const loadDeliveries = useCallback(async (webhookId?: string) => {
    if (!webhookId) return;
    
    try {
      setIsLoading(true);
      const { deliveries: deliveryList } = await webhookManager.listWebhookDeliveries(webhookId, { limit: 100 });
      setDeliveries(deliveryList);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [webhookManager]);

  // ===== Effects =====

  useEffect(() => {
    loadWebhooks();
    loadEvents();
  }, [loadWebhooks, loadEvents]);

  useEffect(() => {
    if (selectedWebhook) {
      loadDeliveries(selectedWebhook.id);
    }
  }, [selectedWebhook, loadDeliveries]);

  // ===== Webhook Operations =====

  const handleCreateWebhook = async (formData: WebhookFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const webhookConfig: Omit<WebhookConfig, 'id'> = {
        name: formData.name,
        url: formData.url,
        description: formData.description,
        events: formData.events,
        status: WebhookStatus.Active,
        secret: formData.secret,
        headers: formData.headers,
        filterConfig: formData.filterConfig
      };
      
      const newWebhook = await webhookManager.createWebhook(webhookConfig);
      setWebhooks(prev => [...prev, newWebhook]);
      setIsCreateDialogOpen(false);
      onWebhookCreated?.(newWebhook);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWebhook = async (webhookId: string, updates: Partial<WebhookConfig>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedWebhook = await webhookManager.updateWebhook(webhookId, updates);
      setWebhooks(prev => prev.map(w => w.id === webhookId ? updatedWebhook : w));
      
      if (selectedWebhook?.id === webhookId) {
        setSelectedWebhook(updatedWebhook);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await webhookManager.deleteWebhook(webhookId);
      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      
      if (selectedWebhook?.id === webhookId) {
        setSelectedWebhook(null);
      }
      
      onWebhookDeleted?.(webhookId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await webhookManager.testWebhook(webhookId);
      
      if (result.success) {
        // Show success message
        console.log(`Webhook test successful (${result.responseTime}ms)`);
      } else {
        setError(`Webhook test failed: ${result.error}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await webhookManager.retryWebhookDelivery(deliveryId);
      
      // Reload deliveries
      if (selectedWebhook) {
        loadDeliveries(selectedWebhook.id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Render Helpers =====

  const renderError = () => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };

  const getStatusBadge = (status: WebhookStatus) => {
    const variants = {
      [WebhookStatus.Active]: 'default',
      [WebhookStatus.Inactive]: 'secondary',
      [WebhookStatus.Failed]: 'destructive'
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getDeliveryStatusBadge = (status: WebhookDeliveryStatus) => {
    const variants = {
      [WebhookDeliveryStatus.Delivered]: 'default',
      [WebhookDeliveryStatus.Pending]: 'secondary',
      [WebhookDeliveryStatus.Failed]: 'destructive',
      [WebhookDeliveryStatus.Retrying]: 'outline',
      [WebhookDeliveryStatus.Cancelled]: 'secondary'
    } as const;
    
    const icons = {
      [WebhookDeliveryStatus.Delivered]: CheckCircle,
      [WebhookDeliveryStatus.Pending]: Clock,
      [WebhookDeliveryStatus.Failed]: XCircle,
      [WebhookDeliveryStatus.Retrying]: RefreshCw,
      [WebhookDeliveryStatus.Cancelled]: XCircle
    };
    
    const Icon = icons[status];
    
    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  // ===== Main Render =====

  return (
    <div className="space-y-6">
      {renderError()}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Management</h2>
          <p className="text-gray-600">Configure and monitor DFNS webhook integrations</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <WebhookCreateDialog
              onSubmit={handleCreateWebhook}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as typeof currentView)}>
        <TabsList>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="events">
            <Activity className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhookListView
            webhooks={webhooks}
            selectedWebhook={selectedWebhook}
            onSelectWebhook={setSelectedWebhook}
            onUpdateWebhook={handleUpdateWebhook}
            onDeleteWebhook={handleDeleteWebhook}
            onTestWebhook={handleTestWebhook}
            isLoading={isLoading}
          />
          
          {selectedWebhook && (
            <WebhookDeliveryView
              webhook={selectedWebhook}
              deliveries={deliveries}
              onRetryDelivery={handleRetryDelivery}
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <WebhookEventView
            events={events}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <WebhookStatisticsView
            webhooks={webhooks}
            webhookManager={webhookManager}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ===== Sub-components =====

interface WebhookCreateDialogProps {
  onSubmit: (data: WebhookFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const WebhookCreateDialog: React.FC<WebhookCreateDialogProps> = ({
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState<WebhookFormData>({
    name: '',
    url: '',
    description: '',
    events: [],
    secret: '',
    headers: {},
    filterConfig: {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleEvent = (event: DfnsWebhookEvent) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Webhook</DialogTitle>
        <DialogDescription>
          Configure a new webhook to receive DFNS events.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="webhook-name">Name</Label>
          <Input
            id="webhook-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Webhook"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="webhook-url">URL</Label>
          <Input
            id="webhook-url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://example.com/webhook"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="webhook-description">Description</Label>
          <Textarea
            id="webhook-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description"
          />
        </div>
        
        <div>
          <Label>Events to Subscribe</Label>
          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
            {Object.values(DfnsWebhookEvent).map(event => (
              <div key={event} className="flex items-center space-x-2">
                <Switch
                  id={`event-${event}`}
                  checked={formData.events.includes(event)}
                  onCheckedChange={() => toggleEvent(event)}
                />
                <Label htmlFor={`event-${event}`} className="text-sm">{event}</Label>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <Label htmlFor="webhook-secret">Secret (optional)</Label>
          <Input
            id="webhook-secret"
            type="password"
            value={formData.secret}
            onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
            placeholder="Webhook signing secret"
          />
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !formData.name || !formData.url || formData.events.length === 0}>
            {isLoading ? 'Creating...' : 'Create Webhook'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

interface WebhookListViewProps {
  webhooks: WebhookConfig[];
  selectedWebhook: WebhookConfig | null;
  onSelectWebhook: (webhook: WebhookConfig) => void;
  onUpdateWebhook: (webhookId: string, updates: Partial<WebhookConfig>) => void;
  onDeleteWebhook: (webhookId: string) => void;
  onTestWebhook: (webhookId: string) => void;
  isLoading: boolean;
}

const WebhookListView: React.FC<WebhookListViewProps> = ({
  webhooks,
  selectedWebhook,
  onSelectWebhook,
  onUpdateWebhook,
  onDeleteWebhook,
  onTestWebhook,
  isLoading
}) => {
  const getStatusBadge = (status: WebhookStatus) => {
    const variants = {
      [WebhookStatus.Active]: 'default',
      [WebhookStatus.Inactive]: 'secondary',
      [WebhookStatus.Failed]: 'destructive'
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configured Webhooks</CardTitle>
        <CardDescription>
          Manage your DFNS webhook configurations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {webhooks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No webhooks configured. Create your first webhook to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map(webhook => (
              <div
                key={webhook.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedWebhook?.id === webhook.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                }`}
                onClick={() => onSelectWebhook(webhook)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{webhook.name}</h3>
                      {getStatusBadge(webhook.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{webhook.url}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {webhook.events.length} events subscribed
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTestWebhook(webhook.id!);
                      }}
                      disabled={isLoading}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateWebhook(webhook.id!, {
                          status: webhook.status === WebhookStatus.Active 
                            ? WebhookStatus.Inactive 
                            : WebhookStatus.Active
                        });
                      }}
                      disabled={isLoading}
                    >
                      {webhook.status === WebhookStatus.Active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteWebhook(webhook.id!);
                      }}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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

interface WebhookDeliveryViewProps {
  webhook: WebhookConfig;
  deliveries: WebhookDelivery[];
  onRetryDelivery: (deliveryId: string) => void;
  isLoading: boolean;
}

const WebhookDeliveryView: React.FC<WebhookDeliveryViewProps> = ({
  webhook,
  deliveries,
  onRetryDelivery,
  isLoading
}) => {
  const getDeliveryStatusBadge = (status: WebhookDeliveryStatus) => {
    const variants = {
      [WebhookDeliveryStatus.Delivered]: 'default',
      [WebhookDeliveryStatus.Pending]: 'secondary',
      [WebhookDeliveryStatus.Failed]: 'destructive',
      [WebhookDeliveryStatus.Retrying]: 'outline',
      [WebhookDeliveryStatus.Cancelled]: 'secondary'
    } as const;
    
    const icons = {
      [WebhookDeliveryStatus.Delivered]: CheckCircle,
      [WebhookDeliveryStatus.Pending]: Clock,
      [WebhookDeliveryStatus.Failed]: XCircle,
      [WebhookDeliveryStatus.Retrying]: RefreshCw,
      [WebhookDeliveryStatus.Cancelled]: XCircle
    };
    
    const Icon = icons[status];
    
    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery History - {webhook.name}</CardTitle>
        <CardDescription>
          Recent webhook delivery attempts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {deliveries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No deliveries yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map(delivery => (
                <TableRow key={delivery.id}>
                  <TableCell>{delivery.event}</TableCell>
                  <TableCell>{getDeliveryStatusBadge(delivery.status)}</TableCell>
                  <TableCell>{delivery.attempts}/{delivery.maxAttempts}</TableCell>
                  <TableCell>
                    {delivery.responseCode && (
                      <Badge variant={delivery.responseCode < 400 ? 'default' : 'destructive'}>
                        {delivery.responseCode}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(delivery.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {delivery.status === WebhookDeliveryStatus.Failed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRetryDelivery(delivery.id)}
                        disabled={isLoading}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

// Additional sub-components would go here (WebhookEventView, WebhookStatisticsView)
// Keeping the response within reasonable limits

// WebhookEventView Component
interface WebhookEventViewProps {
  events: WebhookEvent[];
  isLoading: boolean;
}

const WebhookEventView: React.FC<WebhookEventViewProps> = ({
  events,
  isLoading
}) => {
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading events...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Events</CardTitle>
        <CardDescription>
          Recent webhook events and their processing status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No events recorded yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Triggered</TableHead>
                <TableHead>Webhooks</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(event => (
                <TableRow key={event.id}>
                  <TableCell>{event.type}</TableCell>
                  <TableCell>{event.source || 'DFNS'}</TableCell>
                  <TableCell>
                    <Badge variant={event.processed ? 'default' : 'secondary'}>
                      {event.processed ? 'Processed' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.webhookCount || 0}</TableCell>
                  <TableCell>{new Date(event.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

// WebhookStatisticsView Component
interface WebhookStatisticsViewProps {
  webhooks: WebhookConfig[];
  webhookManager: DfnsWebhookManager;
  isLoading: boolean;
}

const WebhookStatisticsView: React.FC<WebhookStatisticsViewProps> = ({
  webhooks,
  webhookManager,
  isLoading
}) => {
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        // Get statistics for all webhooks if available
        if (webhooks.length > 0 && webhooks[0].id) {
          const stats = await webhookManager.getWebhookStatistics(webhooks[0].id!);
          setStatistics(stats);
        }
      } catch (error) {
        console.error('Failed to load webhook statistics:', error);
      }
    };

    if (webhooks.length > 0) {
      loadStatistics();
    }
  }, [webhooks, webhookManager]);

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading statistics...</div>;
  }

  const activeWebhooks = webhooks.filter(w => w.status === WebhookStatus.Active).length;
  const totalEvents = statistics?.totalEvents || 0;
  const successRate = statistics?.successRate || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooks.length}</div>
            <p className="text-xs text-muted-foreground">
              Active: {activeWebhooks}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Delivery success
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.avgResponseTime || 0}ms</div>
            <p className="text-xs text-muted-foreground">
              Response time
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Event Distribution</CardTitle>
          <CardDescription>
            Most common webhook events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statistics?.eventDistribution ? (
            <div className="space-y-2">
              {Object.entries(statistics.eventDistribution).map(([event, count]) => (
                <div key={event} className="flex justify-between">
                  <span className="text-sm">{event}</span>
                  <span className="text-sm font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No event data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ===== Export =====

export default DfnsWebhookManagement;
