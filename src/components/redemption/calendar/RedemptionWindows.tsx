import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Settings,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Download,
  Upload,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, addMonths, parseISO } from 'date-fns';

export interface RedemptionWindowConfig {
  id: string;
  name: string;
  frequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
  submissionWindowDays: number;
  lockUpPeriod: number;
  maxRedemptionPercentage?: number;
  enableProRataDistribution: boolean;
  queueUnprocessedRequests: boolean;
  useWindowNAV: boolean;
  lockTokensOnRequest: boolean;
  enableAdminOverride: boolean;
  notificationDays: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RedemptionWindowInstance {
  id: string;
  configId: string;
  config: RedemptionWindowConfig;
  startDate: Date;
  endDate: Date;
  submissionStartDate: Date;
  submissionEndDate: Date;
  status: 'scheduled' | 'submission_open' | 'submission_closed' | 'processing' | 'completed' | 'cancelled';
  nav?: number;
  totalRequests: number;
  totalRequestValue: number;
  processedRequests: number;
  processedValue: number;
  rejectedRequests: number;
  queuedRequests: number;
  notes?: string;
}

interface RedemptionWindowsProps {
  configs: RedemptionWindowConfig[];
  instances: RedemptionWindowInstance[];
  onConfigCreate?: (config: Omit<RedemptionWindowConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onConfigUpdate?: (id: string, config: Partial<RedemptionWindowConfig>) => void;
  onConfigDelete?: (id: string) => void;
  onInstanceUpdate?: (id: string, instance: Partial<RedemptionWindowInstance>) => void;
  onInstanceCancel?: (id: string) => void;
  onInstanceProcess?: (id: string) => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
  className?: string;
}

export const RedemptionWindows: React.FC<RedemptionWindowsProps> = ({
  configs,
  instances,
  onConfigCreate,
  onConfigUpdate,
  onConfigDelete,
  onInstanceUpdate,
  onInstanceCancel,
  onInstanceProcess,
  onExport,
  onImport,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'configs' | 'instances'>('instances');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<RedemptionWindowConfig | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newConfig, setNewConfig] = useState<Partial<RedemptionWindowConfig>>({
    name: '',
    frequency: 'quarterly',
    submissionWindowDays: 14,
    lockUpPeriod: 90,
    maxRedemptionPercentage: 25,
    enableProRataDistribution: true,
    queueUnprocessedRequests: true,
    useWindowNAV: true,
    lockTokensOnRequest: true,
    enableAdminOverride: false,
    notificationDays: 7,
    active: true
  });

  // Filter instances based on status
  const filteredInstances = useMemo(() => {
    if (filterStatus === 'all') return instances;
    return instances.filter(instance => instance.status === filterStatus);
  }, [instances, filterStatus]);

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    const totalRequests = instances.reduce((sum, i) => sum + i.totalRequests, 0);
    const totalValue = instances.reduce((sum, i) => sum + i.totalRequestValue, 0);
    const processedRequests = instances.reduce((sum, i) => sum + i.processedRequests, 0);
    const processedValue = instances.reduce((sum, i) => sum + i.processedValue, 0);
    const activeWindows = instances.filter(i => i.status === 'submission_open').length;
    const upcomingWindows = instances.filter(i => i.status === 'scheduled').length;

    return {
      totalRequests,
      totalValue,
      processedRequests,
      processedValue,
      activeWindows,
      upcomingWindows,
      successRate: totalRequests > 0 ? (processedRequests / totalRequests) * 100 : 0
    };
  }, [instances]);

  // Get status color
  const getStatusColor = (status: RedemptionWindowInstance['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submission_open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'submission_closed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: RedemptionWindowInstance['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-3 w-3" />;
      case 'submission_open':
        return <CheckCircle className="h-3 w-3" />;
      case 'submission_closed':
        return <AlertTriangle className="h-3 w-3" />;
      case 'processing':
        return <TrendingUp className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'cancelled':
        return <Trash2 className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle config save
  const handleConfigSave = () => {
    if (!newConfig.name) return;
    
    if (editingConfig) {
      onConfigUpdate?.(editingConfig.id, newConfig);
    } else {
      onConfigCreate?.(newConfig as Omit<RedemptionWindowConfig, 'id' | 'createdAt' | 'updatedAt'>);
    }
    
    setIsCreateDialogOpen(false);
    setEditingConfig(null);
    setNewConfig({
      name: '',
      frequency: 'quarterly',
      submissionWindowDays: 14,
      lockUpPeriod: 90,
      maxRedemptionPercentage: 25,
      enableProRataDistribution: true,
      queueUnprocessedRequests: true,
      useWindowNAV: true,
      lockTokensOnRequest: true,
      enableAdminOverride: false,
      notificationDays: 7,
      active: true
    });
  };

  // Handle config edit
  const handleConfigEdit = (config: RedemptionWindowConfig) => {
    setEditingConfig(config);
    setNewConfig(config);
    setIsCreateDialogOpen(true);
  };

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport?.(file);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redemption Windows</h1>
          <p className="text-gray-600">
            Manage interval fund redemption windows and configurations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="file-import" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import
              <input
                id="file-import"
                type="file"
                accept=".json,.csv"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingConfig ? 'Edit' : 'Create'} Redemption Window Configuration
                </DialogTitle>
                <DialogDescription>
                  Configure the rules and parameters for interval fund redemption windows.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    value={newConfig.name || ''}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Quarterly Fund Redemption"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newConfig.frequency}
                    onValueChange={(value) => setNewConfig(prev => ({ 
                      ...prev, 
                      frequency: value as RedemptionWindowConfig['frequency'] 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi_annually">Semi-Annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="submissionWindow">Submission Window (Days)</Label>
                  <Input
                    id="submissionWindow"
                    type="number"
                    value={newConfig.submissionWindowDays || ''}
                    onChange={(e) => setNewConfig(prev => ({ 
                      ...prev, 
                      submissionWindowDays: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lockUpPeriod">Lock-up Period (Days)</Label>
                  <Input
                    id="lockUpPeriod"
                    type="number"
                    value={newConfig.lockUpPeriod || ''}
                    onChange={(e) => setNewConfig(prev => ({ 
                      ...prev, 
                      lockUpPeriod: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxRedemption">Max Redemption (%)</Label>
                  <Input
                    id="maxRedemption"
                    type="number"
                    value={newConfig.maxRedemptionPercentage || ''}
                    onChange={(e) => setNewConfig(prev => ({ 
                      ...prev, 
                      maxRedemptionPercentage: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="e.g., 25"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notificationDays">Notification Days</Label>
                  <Input
                    id="notificationDays"
                    type="number"
                    value={newConfig.notificationDays || ''}
                    onChange={(e) => setNewConfig(prev => ({ 
                      ...prev, 
                      notificationDays: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                
                <div className="col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="proRata">Enable Pro-rata Distribution</Label>
                    <Switch
                      id="proRata"
                      checked={newConfig.enableProRataDistribution}
                      onCheckedChange={(checked) => setNewConfig(prev => ({ 
                        ...prev, 
                        enableProRataDistribution: checked 
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="queueRequests">Queue Unprocessed Requests</Label>
                    <Switch
                      id="queueRequests"
                      checked={newConfig.queueUnprocessedRequests}
                      onCheckedChange={(checked) => setNewConfig(prev => ({ 
                        ...prev, 
                        queueUnprocessedRequests: checked 
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="windowNAV">Use Window NAV</Label>
                    <Switch
                      id="windowNAV"
                      checked={newConfig.useWindowNAV}
                      onCheckedChange={(checked) => setNewConfig(prev => ({ 
                        ...prev, 
                        useWindowNAV: checked 
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lockTokens">Lock Tokens on Request</Label>
                    <Switch
                      id="lockTokens"
                      checked={newConfig.lockTokensOnRequest}
                      onCheckedChange={(checked) => setNewConfig(prev => ({ 
                        ...prev, 
                        lockTokensOnRequest: checked 
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="adminOverride">Enable Admin Override</Label>
                    <Switch
                      id="adminOverride"
                      checked={newConfig.enableAdminOverride}
                      onCheckedChange={(checked) => setNewConfig(prev => ({ 
                        ...prev, 
                        enableAdminOverride: checked 
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="active">Active Configuration</Label>
                    <Switch
                      id="active"
                      checked={newConfig.active}
                      onCheckedChange={(checked) => setNewConfig(prev => ({ 
                        ...prev, 
                        active: checked 
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfigSave} disabled={!newConfig.name}>
                  {editingConfig ? 'Update' : 'Create'} Configuration
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Windows</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeWindows}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.upcomingWindows} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(metrics.successRate)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.processedValue)} processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs.length}</div>
            <p className="text-xs text-muted-foreground">
              {configs.filter(c => c.active).length} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('instances')}
            className={cn(
              "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === 'instances'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Window Instances ({instances.length})
          </button>
          <button
            onClick={() => setActiveTab('configs')}
            className={cn(
              "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === 'configs'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Configurations ({configs.length})
          </button>
        </nav>
      </div>

      {/* Window Instances Tab */}
      {activeTab === 'instances' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label className="text-sm">Filter by status:</Label>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="submission_open">Submission Open</SelectItem>
                <SelectItem value="submission_closed">Submission Closed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instances Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Window</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Submission Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(instance.startDate, 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {instance.config.frequency.replace('_', ' ')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{instance.config.name}</p>
                      <p className="text-xs text-gray-500">
                        {instance.config.submissionWindowDays}d window
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(instance.submissionStartDate, 'MMM d')} - {format(instance.submissionEndDate, 'MMM d')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(instance.status)}>
                        {getStatusIcon(instance.status)}
                        <span className="ml-1">{instance.status.replace('_', ' ')}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{instance.totalRequests} total</p>
                        <p className="text-xs text-gray-500">
                          {instance.processedRequests} processed
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatCurrency(instance.totalRequestValue)}</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(instance.processedValue)} processed
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-16">
                        <Progress 
                          value={instance.totalRequests > 0 ? (instance.processedRequests / instance.totalRequests) * 100 : 0}
                          className="h-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {instance.totalRequests > 0 ? Math.round((instance.processedRequests / instance.totalRequests) * 100) : 0}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {instance.status === 'processing' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onInstanceProcess?.(instance.id)}
                          >
                            Process
                          </Button>
                        )}
                        {(instance.status === 'scheduled' || instance.status === 'submission_open') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onInstanceCancel?.(instance.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Configurations Tab */}
      {activeTab === 'configs' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Submission Window</TableHead>
                <TableHead>Lock-up Period</TableHead>
                <TableHead>Settings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>
                    <p className="font-medium">{config.name}</p>
                    <p className="text-xs text-gray-500">
                      Created {format(config.createdAt, 'MMM d, yyyy')}
                    </p>
                  </TableCell>
                  <TableCell>
                    {config.frequency.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    {config.submissionWindowDays} days
                  </TableCell>
                  <TableCell>
                    {config.lockUpPeriod} days
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {config.enableProRataDistribution && (
                        <Badge variant="secondary" className="text-xs">Pro-rata</Badge>
                      )}
                      {config.useWindowNAV && (
                        <Badge variant="secondary" className="text-xs">Window NAV</Badge>
                      )}
                      {config.lockTokensOnRequest && (
                        <Badge variant="secondary" className="text-xs">Lock Tokens</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.active ? "default" : "secondary"}>
                      {config.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleConfigEdit(config)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onConfigDelete?.(config.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default RedemptionWindows;
