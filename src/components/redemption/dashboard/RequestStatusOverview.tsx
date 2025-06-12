import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Users,
  Shield,
  Coins,
  TrendingUp,
  Activity,
  ArrowRight,
  Eye,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RedemptionRequest } from '../types/redemption';

interface RequestStatusOverviewProps {
  redemptions: RedemptionRequest[];
  loading?: boolean;
  onViewDetails?: (id: string) => void;
  onFilterByStatus?: (status: string) => void;
}

interface StatusStageInfo {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface WorkflowStage {
  id: string;
  label: string;
  entity: string;
  description: string;
  completed: boolean;
  current: boolean;
  timestamp?: string;
}

export const RequestStatusOverview: React.FC<RequestStatusOverviewProps> = ({
  redemptions,
  loading = false,
  onViewDetails,
  onFilterByStatus
}) => {
  const [activeView, setActiveView] = useState<'summary' | 'workflow' | 'timeline'>('summary');

  // Define status stages based on the redemption workflow
  const statusStages: StatusStageInfo[] = [
    {
      id: 'pending',
      label: 'Pending Validation',
      description: 'Request submitted, awaiting eligibility validation',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'approved',
      label: 'Multi-Sig Approval',
      description: 'Eligibility confirmed, awaiting multi-signature approval',
      icon: <Users className="h-4 w-4" />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'processing',
      label: 'Token Burning',
      description: 'Approved, executing token burn and settlement',
      icon: <Coins className="h-4 w-4" />,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'settled',
      label: 'Settlement Complete',
      description: 'Tokens burned, funds settled, process complete',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'rejected',
      label: 'Rejected',
      description: 'Request rejected during validation or approval',
      icon: <XCircle className="h-4 w-4" />,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  // Calculate metrics for each status
  const getStatusMetrics = () => {
    const metrics = statusStages.map(stage => {
      const count = redemptions.filter(r => r.status === stage.id).length;
      const value = redemptions
        .filter(r => r.status === stage.id)
        .reduce((sum, r) => sum + (r.usdcAmount || 0), 0);
      
      return {
        ...stage,
        count,
        value,
        percentage: redemptions.length > 0 ? Math.round((count / redemptions.length) * 100) : 0
      };
    });
    
    return metrics;
  };

  // Get workflow stages for a specific redemption
  const getWorkflowStages = (redemption: RedemptionRequest): WorkflowStage[] => {
    const stages: WorkflowStage[] = [
      {
        id: 'submission',
        label: 'Request Submission',
        entity: 'Investor',
        description: 'Redemption request submitted by investor',
        completed: true,
        current: false,
        timestamp: redemption.submittedAt.toISOString()
      },
      {
        id: 'validation',
        label: 'Eligibility Validation',
        entity: 'GuardianPolicyEnforcement',
        description: 'KYC/AML and compliance validation',
        completed: ['approved', 'processing', 'settled'].includes(redemption.status),
        current: redemption.status === 'pending',
        timestamp: redemption.validatedAt?.toISOString()
      },
      {
        id: 'approval',
        label: 'Multi-Signature Approval',
        entity: 'MultiSigApprovers',
        description: '2-of-3 signature approval process',
        completed: ['processing', 'settled'].includes(redemption.status),
        current: redemption.status === 'approved',
        timestamp: redemption.approvedAt?.toISOString()
      },
      {
        id: 'execution',
        label: 'Token Burning & Settlement',
        entity: 'GuardianWallet',
        description: 'Token burn and fund settlement execution',
        completed: redemption.status === 'settled',
        current: redemption.status === 'processing',
        timestamp: redemption.executedAt?.toISOString()
      },
      {
        id: 'confirmation',
        label: 'Settlement Confirmation',
        entity: 'Blockchain',
        description: 'Transaction confirmed on blockchain',
        completed: redemption.status === 'settled',
        current: false,
        timestamp: redemption.settledAt?.toISOString()
      }
    ];

    return stages;
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

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusMetrics = getStatusMetrics();
  const totalRequests = redemptions.length;
  const totalValue = redemptions.reduce((sum, r) => sum + (r.usdcAmount || 0), 0);

  if (loading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Request Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-full"></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Request Status Overview
          </CardTitle>
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Total Requests: {totalRequests}</span>
          <span>•</span>
          <span>Total Value: {formatCurrency(totalValue)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <TabsContent value="summary" className="mt-0">
          <div className="space-y-6">
            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {statusMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className={cn(
                    "p-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer group",
                    metric.bgColor,
                    metric.borderColor
                  )}
                  onClick={() => onFilterByStatus?.(metric.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2 rounded-md", metric.bgColor)}>
                      <div className={metric.color}>
                        {metric.icon}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{metric.count}</div>
                      <div className="text-xs text-muted-foreground">{metric.percentage}%</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Badge 
                      variant="outline" 
                      className={cn(metric.bgColor, metric.color, metric.borderColor)}
                    >
                      {metric.label}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(metric.value)}
                    </div>
                    <Progress value={metric.percentage} className="h-1" />
                  </div>
                </div>
              ))}
            </div>

            {/* Process Flow Overview */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Redemption Process Flow
              </h4>
              <div className="flex items-center gap-2 text-sm overflow-x-auto">
                {['Investor', 'GuardianPolicyEnforcement', 'MultiSigApprovers', 'GuardianWallet', 'Blockchain'].map((entity, index, array) => (
                  <React.Fragment key={entity}>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="font-medium text-xs">{entity}</span>
                    </div>
                    {index < array.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="mt-0">
          <div className="space-y-4">
            {redemptions.slice(0, 5).map((redemption) => {
              const stages = getWorkflowStages(redemption);
              const currentStageIndex = stages.findIndex(s => s.current);
              const completedCount = stages.filter(s => s.completed).length;
              const progressPercentage = (completedCount / stages.length) * 100;

              return (
                <div
                  key={redemption.id}
                  className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">
                        {redemption.tokenAmount} {redemption.tokenType}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(redemption.usdcAmount || 0)} • Request ID: {redemption.id.slice(0, 8)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={redemption.status === 'settled' ? 'default' : 'secondary'}>
                        {redemption.status}
                      </Badge>
                      {onViewDetails && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(redemption.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress: {completedCount}/{stages.length} stages</span>
                      <span>{Math.round(progressPercentage)}% complete</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
                    {stages.map((stage, index) => (
                      <div
                        key={stage.id}
                        className={cn(
                          "p-2 rounded text-xs text-center transition-colors",
                          stage.completed && "bg-green-100 text-green-800 border border-green-200",
                          stage.current && "bg-blue-100 text-blue-800 border border-blue-200",
                          !stage.completed && !stage.current && "bg-gray-50 text-gray-600 border border-gray-200"
                        )}
                      >
                        <div className="font-medium">{stage.label}</div>
                        <div className="text-xs opacity-75">{stage.entity}</div>
                        {stage.timestamp && (
                          <div className="text-xs mt-1">{formatDate(stage.timestamp)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {redemptions.length > 5 && (
              <div className="text-center">
                <Button variant="outline" onClick={() => onFilterByStatus?.('all')}>
                  <Filter className="h-4 w-4 mr-2" />
                  View All {redemptions.length} Requests
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <div className="space-y-4">
            {redemptions
              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .slice(0, 10)
              .map((redemption, index) => (
                <div key={redemption.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium",
                      redemption.status === 'settled' && "bg-green-500",
                      redemption.status === 'processing' && "bg-purple-500",
                      redemption.status === 'approved' && "bg-blue-500",
                      redemption.status === 'pending' && "bg-yellow-500",
                      redemption.status === 'rejected' && "bg-red-500"
                    )}>
                      {index + 1}
                    </div>
                    {index < Math.min(redemptions.length - 1, 9) && (
                      <div className="w-0.5 h-16 bg-border mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {redemption.tokenAmount} {redemption.tokenType}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(redemption.submittedAt.toISOString())}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {formatCurrency(redemption.usdcAmount || 0)} • ID: {redemption.id.slice(0, 8)}
                    </div>
                    <Badge variant={redemption.status === 'settled' ? 'default' : 'secondary'}>
                      {redemption.status}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>
      </CardContent>
    </Card>
  );
};

export default RequestStatusOverview;