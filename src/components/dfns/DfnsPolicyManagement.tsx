/**
 * Enhanced DFNS Policy Management Component
 * 
 * Provides comprehensive policy configuration and approval workflow management
 * for DFNS operations including transfer approvals, spending limits, and compliance rules.
 * Enhanced with new policy manager capabilities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield,
  Plus,
  MoreHorizontal,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Users,
  DollarSign,
  Calendar,
  Network,
  Loader2,
  Settings,
  Activity,
  BarChart3,
  Archive,
  Target
} from 'lucide-react';

import { 
  DfnsPolicyManager,
  PolicyConfig,
  PolicyApproval,
  PolicyRuleKind,
  ActivityKind,
  PolicyStatus,
  PolicyApprovalStatus,
  TimeWindow,
  TimeUnit,
  RiskLevel,
  PolicyTargetType,
  type PolicyAssignment
} from '@/infrastructure/dfns/policy-manager';
import { DfnsAuthenticator } from '@/infrastructure/dfns';
import { DEFAULT_CLIENT_CONFIG } from '@/infrastructure/dfns/config';
import { formatDate } from '@/utils/date/dateHelpers';

interface DfnsPolicyManagementProps {
  className?: string;
  authenticator?: DfnsAuthenticator;
  onPolicyCreated?: (policy: PolicyConfig) => void;
  onPolicyDeleted?: (policyId: string) => void;
  defaultView?: 'policies' | 'approvals' | 'assignments' | 'templates';
}

interface PolicyFormData {
  name: string;
  description: string;
  activityKind: ActivityKind;
  ruleKind: PolicyRuleKind;
  status: PolicyStatus;
  ruleConfig: {
    // Amount limit config
    amount?: string;
    currency?: string;
    timeWindow?: TimeWindow;
    
    // Velocity config
    maxAmount?: string;
    maxCount?: number;
    timeWindowDuration?: number;
    timeWindowUnit?: TimeUnit;
    
    // Whitelist config
    addresses?: string[];
    allowedNetworks?: string[];
    
    // Chainalysis config
    riskLevel?: RiskLevel;
    sanctionsScreening?: boolean;
    amlChecking?: boolean;
    
    // Approval config
    approvers?: string[];
    requiredApprovals?: number;
    approvalTimeout?: number;
  };
}

export function DfnsPolicyManagement({ 
  className, 
  authenticator,
  onPolicyCreated,
  onPolicyDeleted,
  defaultView = 'policies'
}: DfnsPolicyManagementProps) {
  // ===== State Management =====
  const [policyManager] = useState(() => 
    new DfnsPolicyManager(DEFAULT_CLIENT_CONFIG, authenticator)
  );
  
  const [policies, setPolicies] = useState<PolicyConfig[]>([]);
  const [approvals, setApprovals] = useState<PolicyApproval[]>([]);
  const [assignments, setAssignments] = useState<PolicyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState(defaultView);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyConfig | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<PolicyFormData>({
    name: '',
    description: '',
    activityKind: ActivityKind.TransferAsset,
    ruleKind: PolicyRuleKind.TransactionAmountLimit,
    status: PolicyStatus.Active,
    ruleConfig: {}
  });

  // ===== Data Loading =====
  
  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { policies: policyList } = await policyManager.listPolicies();
      setPolicies(policyList);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [policyManager]);

  const loadApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const { approvals: approvalList } = await policyManager.listPendingApprovals();
      setApprovals(approvalList);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [policyManager]);

  useEffect(() => {
    loadPolicies();
    loadApprovals();
  }, [loadPolicies, loadApprovals]);

  // ===== Policy Operations =====

  const handleCreatePolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const policyConfig: Omit<PolicyConfig, 'id'> = {
        name: formData.name,
        description: formData.description,
        activityKind: formData.activityKind,
        status: formData.status,
        rule: {
          kind: formData.ruleKind,
          configuration: {
            enabled: true,
            ...formData.ruleConfig
          }
        }
      };

      const newPolicy = await policyManager.createPolicy(policyConfig);
      setPolicies(prev => [...prev, newPolicy]);
      setIsCreateDialogOpen(false);
      resetForm();
      onPolicyCreated?.(newPolicy);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePolicy = async (policyId: string, updates: Partial<PolicyConfig>) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedPolicy = await policyManager.updatePolicy(policyId, updates);
      setPolicies(prev => prev.map(p => p.id === policyId ? updatedPolicy : p));
      
      if (selectedPolicy?.id === policyId) {
        setSelectedPolicy(updatedPolicy);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await policyManager.archivePolicy(policyId);
      setPolicies(prev => prev.filter(p => p.id !== policyId));
      
      if (selectedPolicy?.id === policyId) {
        setSelectedPolicy(null);
      }
      
      onPolicyDeleted?.(policyId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalDecision = async (approvalId: string, decision: 'approve' | 'reject', reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (decision === 'approve') {
        await policyManager.approveDecision(approvalId, reason);
      } else {
        await policyManager.rejectDecision(approvalId, reason);
      }
      
      setApprovals(prev => prev.filter(a => a.id !== approvalId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (templateName: string) => {
    const templates = policyManager.createStandardPolicyTemplates();
    const template = templates[templateName];
    
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        activityKind: template.activityKind,
        ruleKind: template.rule.kind,
        status: template.status,
        ruleConfig: template.rule.configuration
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      activityKind: ActivityKind.TransferAsset,
      ruleKind: PolicyRuleKind.TransactionAmountLimit,
      status: PolicyStatus.Active,
      ruleConfig: {}
    });
  };

  // ===== Render Helpers =====

  const renderError = () => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };

  const getStatusBadge = (status: PolicyStatus) => {
    const variants = {
      [PolicyStatus.Active]: { variant: 'default' as const, icon: CheckCircle },
      [PolicyStatus.Inactive]: { variant: 'secondary' as const, icon: XCircle },
      [PolicyStatus.Draft]: { variant: 'outline' as const, icon: Clock }
    };
    
    const config = variants[status] || variants[PolicyStatus.Inactive];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getApprovalStatusBadge = (status: PolicyApprovalStatus) => {
    const variants = {
      [PolicyApprovalStatus.Pending]: { variant: 'secondary' as const, icon: Clock },
      [PolicyApprovalStatus.Approved]: { variant: 'default' as const, icon: CheckCircle },
      [PolicyApprovalStatus.Rejected]: { variant: 'destructive' as const, icon: XCircle },
      [PolicyApprovalStatus.Failed]: { variant: 'destructive' as const, icon: AlertTriangle },
      [PolicyApprovalStatus.Expired]: { variant: 'outline' as const, icon: Calendar }
    };
    
    const config = variants[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getPolicyTypeIcon = (activityKind: ActivityKind) => {
    if (activityKind.includes('Transfer')) return DollarSign;
    if (activityKind.includes('Wallet')) return Shield;
    if (activityKind.includes('Key')) return Users;
    return Shield;
  };

  const getRuleKindLabel = (ruleKind: PolicyRuleKind) => {
    const labels = {
      [PolicyRuleKind.AlwaysActivated]: 'Always Active',
      [PolicyRuleKind.TransactionAmountLimit]: 'Amount Limit',
      [PolicyRuleKind.TransactionAmountVelocity]: 'Amount Velocity',
      [PolicyRuleKind.TransactionCountVelocity]: 'Count Velocity',
      [PolicyRuleKind.TransactionRecipientWhitelist]: 'Recipient Whitelist',
      [PolicyRuleKind.ChainalysisTransactionPrescreening]: 'Chainalysis Prescreening',
      [PolicyRuleKind.ChainalysisTransactionScreening]: 'Chainalysis Screening',
      [PolicyRuleKind.MultiPartyApproval]: 'Multi-Party Approval',
      [PolicyRuleKind.TimeBasedApproval]: 'Time-Based Approval',
      [PolicyRuleKind.GeographicRestriction]: 'Geographic Restriction'
    };
    
    return labels[ruleKind] || ruleKind;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading policy management...</p>
        </CardContent>
      </Card>
    );
  }

  // ===== Main Render =====

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Enhanced Policy Management</h3>
          <p className="text-sm text-muted-foreground">
            Configure advanced approval workflows and compliance policies for DFNS operations
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Policy
        </Button>
      </div>

      {renderError()}

      <Tabs value={currentView} onValueChange={(value: string) => setCurrentView(value as typeof currentView)}>
        <TabsList>
          <TabsTrigger value="policies">
            <Shield className="h-4 w-4 mr-2" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <Clock className="h-4 w-4 mr-2" />
            Approvals ({approvals.length})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <Target className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Policies</CardTitle>
              <CardDescription>
                Manage your organization's approval workflows and compliance rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policies.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Policies Configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first policy to establish approval workflows and compliance rules.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Policy
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy</TableHead>
                      <TableHead>Rule Type</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((policy) => {
                      const TypeIcon = getPolicyTypeIcon(policy.activityKind);
                      
                      return (
                        <TableRow key={policy.id}>
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                <TypeIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{policy.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {policy.description}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getRuleKindLabel(policy.rule.kind)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {policy.activityKind.replace(':', ' → ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(policy.status)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {policy.createdAt ? formatDate(policy.createdAt) : 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPolicy(policy);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Policy
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    handleUpdatePolicy(policy.id!, {
                                      status: policy.status === PolicyStatus.Active 
                                        ? PolicyStatus.Inactive 
                                        : PolicyStatus.Active
                                    });
                                  }}
                                >
                                  {policy.status === PolicyStatus.Active ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPolicy(policy);
                                    setIsAssignDialogOpen(true);
                                  }}
                                >
                                  <Target className="mr-2 h-4 w-4" />
                                  Manage Assignments
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeletePolicy(policy.id!)}
                                  className="text-destructive"
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive Policy
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Approvals ({approvals.length})
              </CardTitle>
              <CardDescription>
                Review and approve or reject pending policy-triggered actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p>No pending approvals at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvals.map((approval) => (
                    <div
                      key={approval.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">Activity ID: {approval.activityId}</p>
                          {getApprovalStatusBadge(approval.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Policy: {approval.policyId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Approvals: {approval.currentApprovals}/{approval.requiredApprovals} • 
                          Created {formatDate(approval.createdAt)}
                        </p>
                        {approval.reason && (
                          <p className="text-sm text-yellow-600 mt-1">
                            Reason: {approval.reason}
                          </p>
                        )}
                      </div>
                      
                      {approval.status === PolicyApprovalStatus.Pending && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApprovalDecision(approval.id, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleApprovalDecision(approval.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <PolicyTemplatesView
            policyManager={policyManager}
            onUseTemplate={handleUseTemplate}
            onCreateFromTemplate={() => setIsCreateDialogOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Create Policy Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <PolicyCreateDialog
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreatePolicy}
            onCancel={() => setIsCreateDialogOpen(false)}
            onUseTemplate={handleUseTemplate}
            isLoading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Sub-components =====

interface PolicyTemplatesViewProps {
  policyManager: DfnsPolicyManager;
  onUseTemplate: (templateName: string) => void;
  onCreateFromTemplate: () => void;
}

const PolicyTemplatesView: React.FC<PolicyTemplatesViewProps> = ({
  policyManager,
  onUseTemplate,
  onCreateFromTemplate
}) => {
  const templates = policyManager.createStandardPolicyTemplates();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.entries(templates).map(([key, template]) => (
        <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">{template.name}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{template.activityKind}</Badge>
                <Badge variant="outline">{getRuleKindLabel(template.rule.kind)}</Badge>
              </div>
            </div>
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => {
                onUseTemplate(key);
                onCreateFromTemplate();
              }}
            >
              Use This Template
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Helper function (moved to component scope)
const getRuleKindLabel = (ruleKind: PolicyRuleKind) => {
  const labels = {
    [PolicyRuleKind.AlwaysActivated]: 'Always Active',
    [PolicyRuleKind.TransactionAmountLimit]: 'Amount Limit',
    [PolicyRuleKind.TransactionAmountVelocity]: 'Amount Velocity',
    [PolicyRuleKind.TransactionCountVelocity]: 'Count Velocity',
    [PolicyRuleKind.TransactionRecipientWhitelist]: 'Recipient Whitelist',
    [PolicyRuleKind.ChainalysisTransactionPrescreening]: 'Chainalysis Prescreening',
    [PolicyRuleKind.ChainalysisTransactionScreening]: 'Chainalysis Screening',
    [PolicyRuleKind.MultiPartyApproval]: 'Multi-Party Approval',
    [PolicyRuleKind.TimeBasedApproval]: 'Time-Based Approval',
    [PolicyRuleKind.GeographicRestriction]: 'Geographic Restriction'
  };
  
  return labels[ruleKind] || ruleKind;
};

interface PolicyCreateDialogProps {
  formData: PolicyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PolicyFormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  onUseTemplate: (templateName: string) => void;
  isLoading: boolean;
}

const PolicyCreateDialog: React.FC<PolicyCreateDialogProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  onUseTemplate,
  isLoading
}) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Policy</DialogTitle>
        <DialogDescription>
          Configure advanced approval workflows and compliance rules for your organization
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="policyName">Policy Name *</Label>
            <Input
              id="policyName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., High Value Transfer Approval"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="policyDescription">Description</Label>
            <Textarea
              id="policyDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this policy does..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="activityKind">Activity Type *</Label>
              <Select 
                value={formData.activityKind} 
                onValueChange={(value: ActivityKind) => setFormData(prev => ({ ...prev, activityKind: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ActivityKind.TransferAsset}>Transfer Assets</SelectItem>
                  <SelectItem value={ActivityKind.WalletCreation}>Wallet Creation</SelectItem>
                  <SelectItem value={ActivityKind.KeyCreation}>Key Creation</SelectItem>
                  <SelectItem value={ActivityKind.KeyGenerateSignature}>Key Signing</SelectItem>
                  <SelectItem value={ActivityKind.WalletExport}>Wallet Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ruleKind">Rule Type *</Label>
              <Select 
                value={formData.ruleKind} 
                onValueChange={(value: PolicyRuleKind) => setFormData(prev => ({ ...prev, ruleKind: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PolicyRuleKind.TransactionAmountLimit}>Amount Limit</SelectItem>
                  <SelectItem value={PolicyRuleKind.TransactionAmountVelocity}>Amount Velocity</SelectItem>
                  <SelectItem value={PolicyRuleKind.TransactionRecipientWhitelist}>Recipient Whitelist</SelectItem>
                  <SelectItem value={PolicyRuleKind.ChainalysisTransactionScreening}>Chainalysis Screening</SelectItem>
                  <SelectItem value={PolicyRuleKind.MultiPartyApproval}>Multi-Party Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Rule Configuration */}
        <Separator />
        
        <div>
          <Label className="text-base font-medium">Rule Configuration</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Configure the specific parameters for your selected rule type.
          </p>
          
          {formData.ruleKind === PolicyRuleKind.TransactionAmountLimit && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Amount Limit *</Label>
                <Input
                  id="amount"
                  value={formData.ruleConfig.amount || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ruleConfig: { ...prev.ruleConfig, amount: e.target.value }
                  }))}
                  placeholder="10000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.ruleConfig.currency || 'USD'}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    ruleConfig: { ...prev.ruleConfig, currency: value }
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timeWindow">Time Window</Label>
                <Select 
                  value={formData.ruleConfig.timeWindow || TimeWindow.Daily}
                  onValueChange={(value: TimeWindow) => setFormData(prev => ({
                    ...prev,
                    ruleConfig: { ...prev.ruleConfig, timeWindow: value }
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TimeWindow.Daily}>Daily</SelectItem>
                    <SelectItem value={TimeWindow.Weekly}>Weekly</SelectItem>
                    <SelectItem value={TimeWindow.Monthly}>Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formData.ruleKind === PolicyRuleKind.MultiPartyApproval && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requiredApprovals">Required Approvals *</Label>
                <Input
                  id="requiredApprovals"
                  type="number"
                  min="1"
                  value={formData.ruleConfig.requiredApprovals || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ruleConfig: { ...prev.ruleConfig, requiredApprovals: parseInt(e.target.value) || 1 }
                  }))}
                  placeholder="2"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="approvalTimeout">Timeout (hours)</Label>
                <Input
                  id="approvalTimeout"
                  type="number"
                  min="1"
                  value={formData.ruleConfig.approvalTimeout || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ruleConfig: { ...prev.ruleConfig, approvalTimeout: parseInt(e.target.value) || 24 }
                  }))}
                  placeholder="24"
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Additional rule parameters can be configured after creation through the policy editor.
            Use templates for common policy configurations.
          </AlertDescription>
        </Alert>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={onSubmit}
          disabled={isLoading || !formData.name || !formData.activityKind}
        >
          {isLoading ? 'Creating...' : 'Create Policy'}
        </Button>
      </DialogFooter>
    </>
  );
};

// Export the Props interface
export type { DfnsPolicyManagementProps };

export default DfnsPolicyManagement;
