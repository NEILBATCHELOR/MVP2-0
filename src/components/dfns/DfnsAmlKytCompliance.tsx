/**
 * DFNS AML/KYT Compliance Component - UI for compliance monitoring and management
 * 
 * This component provides a comprehensive interface for:
 * - Real-time transaction screening and monitoring
 * - AML/KYT alerts and compliance management
 * - Address risk analysis and sanctions screening
 * - Compliance reporting and analytics
 * - Policy configuration and automation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  DfnsAmlKytManager,
  AmlScreeningResult,
  AmlAlert,
  AddressAnalysis,
  ComplianceReport,
  ComplianceStatistics,
  ScreeningStatus,
  AlertType,
  AlertSeverity,
  RiskLevel,
  AddressCategory,
  RecommendedAction,
  ReportType
} from '@/infrastructure/dfns/aml-kyt-manager';
import { DfnsAuthenticator } from '@/infrastructure/dfns';
import { DEFAULT_CLIENT_CONFIG } from '@/infrastructure/dfns/config';
import { 
  Shield, 
  AlertTriangle, 
  Search, 
  Eye, 
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  FileText,
  Settings,
  TrendingUp,
  TrendingDown,
  Ban,
  Flag,
  RefreshCw
} from 'lucide-react';

// ===== Types =====

interface AmlKytComplianceProps {
  authenticator?: DfnsAuthenticator;
  organizationId?: string;
  onAlertAction?: (alertId: string, action: string) => void;
  defaultView?: 'dashboard' | 'screening' | 'alerts' | 'analysis' | 'reports';
}

interface ScreeningFormData {
  type: 'outbound' | 'inbound';
  walletId: string;
  address: string;
  amount: string;
  asset: string;
  network: string;
  txHash?: string;
}

interface AlertActionFormData {
  alertId: string;
  action: 'approve' | 'block' | 'review' | 'false_positive';
  notes: string;
  assignee?: string;
}

// ===== Main Component =====

export const DfnsAmlKytCompliance: React.FC<AmlKytComplianceProps> = ({
  authenticator,
  organizationId,
  onAlertAction,
  defaultView = 'dashboard'
}) => {
  // ===== State Management =====
  const [amlKytManager] = useState(() => 
    new DfnsAmlKytManager(DEFAULT_CLIENT_CONFIG, authenticator)
  );
  
  const [screenings, setScreenings] = useState<AmlScreeningResult[]>([]);
  const [alerts, setAlerts] = useState<AmlAlert[]>([]);
  const [addressAnalyses, setAddressAnalyses] = useState<AddressAnalysis[]>([]);
  const [statistics, setStatistics] = useState<ComplianceStatistics | null>(null);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AmlAlert | null>(null);
  const [isScreeningDialogOpen, setIsScreeningDialogOpen] = useState(false);
  const [isAlertActionDialogOpen, setIsAlertActionDialogOpen] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState(defaultView);

  // ===== Data Loading =====

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { alerts: alertList } = await amlKytManager.listAlerts({
        organizationId,
        limit: 100
      });
      setAlerts(alertList);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [amlKytManager, organizationId]);

  const loadStatistics = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      
      const stats = await amlKytManager.getComplianceStatistics(
        organizationId,
        startDate,
        endDate
      );
      setStatistics(stats);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [amlKytManager, organizationId]);

  // ===== Effects =====

  useEffect(() => {
    loadAlerts();
    loadStatistics();
  }, [loadAlerts, loadStatistics]);

  // ===== AML/KYT Operations =====

  const handleScreenTransaction = async (formData: ScreeningFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let result: AmlScreeningResult;
      
      if (formData.type === 'outbound') {
        result = await amlKytManager.screenOutboundTransaction({
          walletId: formData.walletId,
          toAddress: formData.address,
          amount: formData.amount,
          asset: formData.asset,
          network: formData.network
        });
      } else {
        if (!formData.txHash) {
          throw new Error('Transaction hash is required for inbound screening');
        }
        
        result = await amlKytManager.screenInboundTransaction({
          walletId: formData.walletId,
          fromAddress: formData.address,
          amount: formData.amount,
          asset: formData.asset,
          network: formData.network,
          txHash: formData.txHash
        });
      }
      
      setScreenings(prev => [...prev, result]);
      setIsScreeningDialogOpen(false);
      
      // Reload alerts if new ones were generated
      if (result.alerts.length > 0) {
        loadAlerts();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeAddress = async (address: string, network: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const analysis = await amlKytManager.analyzeAddress(address, network, {
        includeIndirectExposure: true,
        maxDepth: 3
      });
      
      setAddressAnalyses(prev => [...prev, analysis]);
      setIsAnalysisDialogOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlertAction = async (formData: AlertActionFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updates = {
        status: formData.action,
        notes: formData.notes,
        assignee: formData.assignee,
        falsePositive: formData.action === 'false_positive'
      };
      
      await amlKytManager.updateAlert(formData.alertId, updates);
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === formData.alertId 
          ? { ...alert, ...updates } 
          : alert
      ));
      
      setIsAlertActionDialogOpen(false);
      setSelectedAlert(null);
      onAlertAction?.(formData.alertId, formData.action);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (period: 'daily' | 'weekly' | 'monthly') => {
    if (!organizationId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'daily':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
      }
      
      const report = await amlKytManager.generateComplianceReport(
        organizationId,
        {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          timezone: 'UTC'
        },
        period === 'daily' ? ReportType.Daily : period === 'weekly' ? ReportType.Weekly : ReportType.Monthly
      );
      
      setReports(prev => [...prev, report]);
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

  const getScreeningStatusBadge = (status: ScreeningStatus) => {
    const variants = {
      [ScreeningStatus.Pending]: 'secondary',
      [ScreeningStatus.Completed]: 'default',
      [ScreeningStatus.Failed]: 'destructive',
      [ScreeningStatus.Skipped]: 'outline'
    } as const;
    
    const icons = {
      [ScreeningStatus.Pending]: Clock,
      [ScreeningStatus.Completed]: CheckCircle,
      [ScreeningStatus.Failed]: XCircle,
      [ScreeningStatus.Skipped]: RefreshCw
    };
    
    const Icon = icons[status];
    
    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getAlertSeverityBadge = (severity: AlertSeverity) => {
    const variants = {
      [AlertSeverity.Low]: 'outline',
      [AlertSeverity.Medium]: 'secondary',
      [AlertSeverity.High]: 'destructive',
      [AlertSeverity.Critical]: 'destructive'
    } as const;
    
    const colors = {
      [AlertSeverity.Low]: 'text-green-600',
      [AlertSeverity.Medium]: 'text-yellow-600',
      [AlertSeverity.High]: 'text-orange-600',
      [AlertSeverity.Critical]: 'text-red-600'
    };
    
    return (
      <Badge variant={variants[severity]} className={colors[severity]}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        {severity}
      </Badge>
    );
  };

  const getRiskLevelBadge = (level: RiskLevel) => {
    const variants = {
      [RiskLevel.Low]: 'default',
      [RiskLevel.Medium]: 'secondary',
      [RiskLevel.High]: 'destructive'
    } as const;
    
    const colors = {
      [RiskLevel.Low]: 'text-green-600',
      [RiskLevel.Medium]: 'text-yellow-600',
      [RiskLevel.High]: 'text-red-600'
    };
    
    return (
      <Badge variant={variants[level]} className={colors[level]}>
        <Shield className="h-3 w-3 mr-1" />
        {level} Risk
      </Badge>
    );
  };

  const getRecommendedActionBadge = (action: RecommendedAction) => {
    const variants = {
      [RecommendedAction.Approve]: 'default',
      [RecommendedAction.Review]: 'secondary',
      [RecommendedAction.Block]: 'destructive',
      [RecommendedAction.Flag]: 'outline',
      [RecommendedAction.Monitor]: 'outline'
    } as const;
    
    const icons = {
      [RecommendedAction.Approve]: CheckCircle,
      [RecommendedAction.Review]: Eye,
      [RecommendedAction.Block]: Ban,
      [RecommendedAction.Flag]: Flag,
      [RecommendedAction.Monitor]: Activity
    };
    
    const Icon = icons[action];
    
    return (
      <Badge variant={variants[action]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {action}
      </Badge>
    );
  };

  // ===== Main Render =====

  return (
    <div className="space-y-6">
      {renderError()}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AML/KYT Compliance</h2>
          <p className="text-gray-600">Monitor transactions and manage compliance requirements</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isScreeningDialogOpen} onOpenChange={setIsScreeningDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Screen Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <TransactionScreeningDialog
                onSubmit={handleScreenTransaction}
                onCancel={() => setIsScreeningDialogOpen(false)}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Analyze Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <AddressAnalysisDialog
                onSubmit={handleAnalyzeAddress}
                onCancel={() => setIsAnalysisDialogOpen(false)}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Compliance Dashboard */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Screenings</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.topRiskCategories[0]?.count || 0}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.filter(a => a.severity === AlertSeverity.High).length}</div>
              <p className="text-xs text-muted-foreground">
                High priority: {alerts.filter(a => a.severity === AlertSeverity.Critical).length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sanctions Hits</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.sanctionsHits}</div>
              <p className="text-xs text-muted-foreground">
                Blocked transactions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(statistics.riskDistribution).reduce((a, b) => a + b, 0) > 0 
                  ? Math.round((statistics.riskDistribution[RiskLevel.High] || 0) * 100 / Object.values(statistics.riskDistribution).reduce((a, b) => a + b, 0))
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                High risk transactions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={currentView} onValueChange={(value: string) => setCurrentView(value as typeof currentView)}>
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="screening">
            <Search className="h-4 w-4 mr-2" />
            Screening
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <Eye className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <ComplianceDashboardView
            statistics={statistics}
            alerts={alerts}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="screening" className="space-y-4">
          <ScreeningResultsView
            screenings={screenings}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsView
            alerts={alerts}
            selectedAlert={selectedAlert}
            onSelectAlert={setSelectedAlert}
            onActionAlert={(alert) => {
              setSelectedAlert(alert);
              setIsAlertActionDialogOpen(true);
            }}
            isLoading={isLoading}
          />
          
          {selectedAlert && (
            <Dialog open={isAlertActionDialogOpen} onOpenChange={setIsAlertActionDialogOpen}>
              <DialogContent className="max-w-lg">
                <AlertActionDialog
                  alert={selectedAlert}
                  onSubmit={handleAlertAction}
                  onCancel={() => setIsAlertActionDialogOpen(false)}
                  isLoading={isLoading}
                />
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <AddressAnalysisView
            analyses={addressAnalyses}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Compliance Reports</h3>
            <div className="flex gap-2">
              <Button onClick={() => handleGenerateReport('daily')} disabled={isLoading}>
                Daily Report
              </Button>
              <Button onClick={() => handleGenerateReport('weekly')} disabled={isLoading}>
                Weekly Report
              </Button>
              <Button onClick={() => handleGenerateReport('monthly')} disabled={isLoading}>
                Monthly Report
              </Button>
            </div>
          </div>
          
          <ReportsView
            reports={reports}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ===== Sub-components =====

interface TransactionScreeningDialogProps {
  onSubmit: (data: ScreeningFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const TransactionScreeningDialog: React.FC<TransactionScreeningDialogProps> = ({
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState<ScreeningFormData>({
    type: 'outbound',
    walletId: '',
    address: '',
    amount: '',
    asset: 'ETH',
    network: 'Ethereum'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Screen Transaction</DialogTitle>
        <DialogDescription>
          Perform AML/KYT screening on a transaction before or after execution.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Screening Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'outbound' | 'inbound' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outbound">Outbound (Pre-screening)</SelectItem>
              <SelectItem value="inbound">Inbound (Post-screening)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="wallet-id">Wallet ID</Label>
          <Input
            id="wallet-id"
            value={formData.walletId}
            onChange={(e) => setFormData(prev => ({ ...prev, walletId: e.target.value }))}
            placeholder="Enter wallet ID"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Enter address to screen"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.000001"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="Enter amount"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="asset">Asset</Label>
          <Input
            id="asset"
            value={formData.asset}
            onChange={(e) => setFormData(prev => ({ ...prev, asset: e.target.value }))}
            placeholder="ETH, BTC, USDC, etc."
            required
          />
        </div>
        
        <div>
          <Label htmlFor="network">Network</Label>
          <Input
            id="network"
            value={formData.network}
            onChange={(e) => setFormData(prev => ({ ...prev, network: e.target.value }))}
            placeholder="Ethereum, Bitcoin, etc."
            required
          />
        </div>
        
        {formData.type === 'inbound' && (
          <div>
            <Label htmlFor="tx-hash">Transaction Hash</Label>
            <Input
              id="tx-hash"
              value={formData.txHash || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, txHash: e.target.value }))}
              placeholder="Enter transaction hash"
              required
            />
          </div>
        )}
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !formData.walletId || !formData.address}>
            {isLoading ? 'Screening...' : 'Start Screening'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

// AddressAnalysisDialog Component
interface AddressAnalysisDialogProps {
  onSubmit: (address: string, network: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const AddressAnalysisDialog: React.FC<AddressAnalysisDialogProps> = ({
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('Ethereum');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(address, network);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Analyze Address</DialogTitle>
        <DialogDescription>
          Perform risk analysis on a blockchain address.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter blockchain address"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="network">Network</Label>
          <Select value={network} onValueChange={setNetwork}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ethereum">Ethereum</SelectItem>
              <SelectItem value="Bitcoin">Bitcoin</SelectItem>
              <SelectItem value="Polygon">Polygon</SelectItem>
              <SelectItem value="Arbitrum">Arbitrum</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !address}>
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

// ComplianceDashboardView Component
interface ComplianceDashboardViewProps {
  statistics: ComplianceStatistics | null;
  alerts: AmlAlert[];
  isLoading: boolean;
}

const ComplianceDashboardView: React.FC<ComplianceDashboardViewProps> = ({
  statistics,
  alerts,
  isLoading
}) => {
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Compliance Dashboard</h3>
      
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(statistics.riskDistribution).map(([level, count]) => (
                  <div key={level} className="flex justify-between">
                    <span>{level}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Risk Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statistics.topRiskCategories.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{category.category}</span>
                    <span>{category.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// ScreeningResultsView Component
interface ScreeningResultsViewProps {
  screenings: AmlScreeningResult[];
  isLoading: boolean;
}

const ScreeningResultsView: React.FC<ScreeningResultsViewProps> = ({
  screenings,
  isLoading
}) => {
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading screenings...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Screening Results</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Wallet ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Risk Level</TableHead>
            <TableHead>Risk Score</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {screenings.map((screening) => (
            <TableRow key={screening.id}>
              <TableCell>{screening.transactionId}</TableCell>
              <TableCell>{screening.walletId}</TableCell>
              <TableCell>
                <Badge variant={screening.status === ScreeningStatus.Completed ? 'default' : 'secondary'}>
                  {screening.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={screening.riskLevel === RiskLevel.High ? 'destructive' : 'default'}>
                  {screening.riskLevel}
                </Badge>
              </TableCell>
              <TableCell>{screening.riskScore}</TableCell>
              <TableCell>{new Date(screening.dateCreated).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// AlertsView Component
interface AlertsViewProps {
  alerts: AmlAlert[];
  selectedAlert: AmlAlert | null;
  onSelectAlert: (alert: AmlAlert) => void;
  onActionAlert: (alert: AmlAlert) => void;
  isLoading: boolean;
}

const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  selectedAlert,
  onSelectAlert,
  onActionAlert,
  isLoading
}) => {
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading alerts...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">AML/KYT Alerts</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id} className={selectedAlert?.id === alert.id ? 'bg-muted' : ''}>
              <TableCell>{alert.type}</TableCell>
              <TableCell>
                <Badge variant={alert.severity === AlertSeverity.High ? 'destructive' : 'default'}>
                  {alert.severity}
                </Badge>
              </TableCell>
              <TableCell>{alert.category}</TableCell>
              <TableCell>{alert.description}</TableCell>
              <TableCell>
                <Badge variant="outline">{alert.recommendedAction}</Badge>
              </TableCell>
              <TableCell>{new Date(alert.dateDetected).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onSelectAlert(alert)}
                  >
                    View
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => onActionAlert(alert)}
                  >
                    Action
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// AlertActionDialog Component
interface AlertActionDialogProps {
  alert: AmlAlert;
  onSubmit: (data: AlertActionFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const AlertActionDialog: React.FC<AlertActionDialogProps> = ({
  alert,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [action, setAction] = useState<'approve' | 'block' | 'review' | 'false_positive'>('review');
  const [notes, setNotes] = useState('');
  const [assignee, setAssignee] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      alertId: alert.id,
      action,
      notes,
      assignee
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Alert Action - {alert.type}</DialogTitle>
        <DialogDescription>
          Take action on this AML/KYT alert: {alert.description}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Action</Label>
          <Select value={action} onValueChange={(value) => setAction(value as typeof action)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="block">Block</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="false_positive">False Positive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this action"
          />
        </div>
        
        <div>
          <Label htmlFor="assignee">Assignee (Optional)</Label>
          <Input
            id="assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Assign to team member"
          />
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Submit Action'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

// AddressAnalysisView Component
interface AddressAnalysisViewProps {
  analyses: AddressAnalysis[];
  isLoading: boolean;
}

const AddressAnalysisView: React.FC<AddressAnalysisViewProps> = ({
  analyses,
  isLoading
}) => {
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading analyses...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Address Analysis</h3>
      
      <div className="grid grid-cols-1 gap-4">
        {analyses.map((analysis, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-sm font-mono">{analysis.address}</CardTitle>
              <CardDescription>{analysis.network}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Category:</span>
                  <Badge>{analysis.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Transactions:</span>
                  <span>{analysis.transactionHistory.totalTransactions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span>{analysis.transactionHistory.volume}</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk Score:</span>
                  <span>{analysis.directExposure.totalRiskScore}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ReportsView Component
interface ReportsViewProps {
  reports: ComplianceReport[];
  isLoading: boolean;
}

const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  isLoading
}) => {
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading reports...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Report Type</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Total Transactions</TableHead>
            <TableHead>Flagged</TableHead>
            <TableHead>Blocked</TableHead>
            <TableHead>Generated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>{report.reportType}</TableCell>
              <TableCell>{report.startDate} - {report.endDate}</TableCell>
              <TableCell>{report.summary.totalTransactions}</TableCell>
              <TableCell>{report.summary.flaggedTransactions}</TableCell>
              <TableCell>{report.summary.blockedTransactions}</TableCell>
              <TableCell>{new Date(report.dateGenerated).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// ===== Export =====

export default DfnsAmlKytCompliance;
