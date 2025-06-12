'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  User,
  Wallet,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  Share,
  Download,
  Building,
  Mail,
  Shield,
  Award,
  Link,
  TrendingUp,
  Globe,
  Coins,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils';
import { 
  RedemptionRequest,
  RedemptionStatusType,
  SettlementInfo,
  ApprovalInfo
} from '../types';
import { useRedemptionStatus, useRedemptionApprovals } from '../hooks';
import { supabase } from '@/infrastructure/supabaseClient';

interface RedemptionRequestDetailsProps {
  redemptionId: string;
  onEdit?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  className?: string;
}

// Enhanced data interfaces
interface InvestorProfile {
  investor_id: string;
  name: string;
  email: string;
  type: string;
  company?: string;
  wallet_address?: string;
  kyc_status: string;
  accreditation_status: string;
  phone?: string;
  created_at: string;
}

interface SubscriptionDetails {
  id: string;
  subscription_id: string;
  investor_id: string;
  fiat_amount: number;
  currency: string;
  subscription_date: string;
  notes?: string;
  status: string;
  project_id: string;
  allocated: boolean;
  confirmed: boolean;
  distributed: boolean;
  created_at: string;
  updated_at: string;
}

interface DistributionDetails {
  id: string;
  investor_id: string;
  subscription_id?: string;
  token_amount: number;
  remaining_amount: number;
  token_address?: string;
  token_symbol?: string;
  blockchain: string;
  standard?: string;
  distribution_date: string;
  notes?: string;
}

interface EnhancedRedemptionData {
  investor?: InvestorProfile;
  subscription?: SubscriptionDetails;
  distribution?: DistributionDetails;
  loading: boolean;
  error?: string;
}

const StatusIndicator = ({ status }: { status: RedemptionStatusType }) => {
  const config = {
    'draft': { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' },
    'pending': { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    'approved': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
    'processing': { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
    'settled': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
    'rejected': { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
    'cancelled': { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100' }
  };

  const Icon = config[status]?.icon || AlertCircle;
  
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium', config[status]?.bg)}>
      <Icon className={cn('h-4 w-4', config[status]?.color)} />
      <span className="capitalize">{status}</span>
    </div>
  );
};

const TimelineStep = ({ 
  title, 
  description, 
  timestamp, 
  isCompleted, 
  isCurrent, 
  isLast 
}: {
  title: string;
  description?: string;
  timestamp?: Date;
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
}) => (
  <div className="relative flex gap-4">
    {/* Timeline line */}
    {!isLast && (
      <div className={cn(
        'absolute left-4 top-8 w-0.5 h-full',
        isCompleted ? 'bg-green-500' : 'bg-gray-200'
      )} />
    )}
    
    {/* Timeline dot */}
    <div className={cn(
      'relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center',
      isCompleted ? 'bg-green-500 border-green-500' : 
      isCurrent ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
    )}>
      {isCompleted ? (
        <CheckCircle className="h-4 w-4 text-white" />
      ) : isCurrent ? (
        <Clock className="h-4 w-4 text-white" />
      ) : (
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
      )}
    </div>
    
    {/* Timeline content */}
    <div className="flex-1 pb-8">
      <h4 className={cn(
        'font-medium',
        isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {title}
      </h4>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
      {timestamp && (
        <p className="text-xs text-muted-foreground mt-2">
          {timestamp.toLocaleString()}
        </p>
      )}
    </div>
  </div>
);

export const RedemptionRequestDetails: React.FC<RedemptionRequestDetailsProps> = ({
  redemptionId,
  onEdit,
  onCancel,
  onClose,
  className
}) => {
  // Enhanced data state
  const [enhancedData, setEnhancedData] = useState<EnhancedRedemptionData>({
    loading: true
  });

  // Hooks
  const {
    redemption,
    loading,
    error,
    currentStatus,
    statusHistory,
    settlementInfo,
    approvalInfo,
    progressPercentage,
    estimatedCompletion,
    timeRemaining,
    isInProgress,
    isCompleted,
    isFailed,
    canCancel,
    getStatusMessage,
    refreshStatus
  } = useRedemptionStatus({ redemptionId });

  const {
    currentApproval,
    getApprovalProgress
  } = useRedemptionApprovals({ redemptionId });

  // Fetch enhanced redemption data
  const fetchEnhancedData = async () => {
    if (!redemption?.investorId) return;
    
    try {
      setEnhancedData(prev => ({ ...prev, loading: true, error: undefined }));
      
      // Fetch investor profile
      const { data: investor, error: investorError } = await supabase
        .from('investors')
        .select('*')
        .eq('investor_id', redemption.investorId)
        .single();
      
      if (investorError && investorError.code !== 'PGRST116') {
        console.error('Error fetching investor:', investorError);
      }
      
      // Fetch distribution details (look for the distribution this redemption is based on)
      // We'll try to find a distribution that matches the redemption details
      const { data: distributions, error: distributionError } = await supabase
        .from('distributions')
        .select('*')
        .eq('investor_id', redemption.investorId)
        .order('distribution_date', { ascending: false })
        .limit(10);
      
      let distribution: DistributionDetails | undefined;
      if (distributions && distributions.length > 0) {
        // Try to find the most relevant distribution
        // Look for distributions with matching token amount or similar characteristics
        distribution = distributions[0]; // For now, take the most recent
      }
      
      if (distributionError) {
        console.error('Error fetching distributions:', distributionError);
      }
      
      // Fetch subscription details if we have a distribution with subscription_id
      let subscription: SubscriptionDetails | undefined;
      if (distribution?.subscription_id) {
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('id', distribution.subscription_id)
          .single();
        
        if (subscriptionData && !subscriptionError) {
          // Create a properly typed subscription object with status
          subscription = {
            id: subscriptionData.id,
            subscription_id: subscriptionData.subscription_id,
            investor_id: subscriptionData.investor_id,
            fiat_amount: subscriptionData.fiat_amount,
            currency: subscriptionData.currency,
            subscription_date: subscriptionData.subscription_date,
            notes: subscriptionData.notes,
            status: 'active', // Default status
            project_id: subscriptionData.project_id,
            allocated: subscriptionData.allocated,
            confirmed: subscriptionData.confirmed,
            distributed: subscriptionData.distributed,
            created_at: subscriptionData.created_at,
            updated_at: subscriptionData.updated_at
          };
        } else if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
        }
      }
      
      setEnhancedData({
        investor: investor || undefined,
        subscription,
        distribution,
        loading: false
      });
      
    } catch (err) {
      console.error('Error fetching enhanced data:', err);
      setEnhancedData({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load enhanced data'
      });
    }
  };
  
  // Load enhanced data when redemption is available
  useEffect(() => {
    if (redemption?.investorId) {
      fetchEnhancedData();
    }
  }, [redemption?.investorId]);

  // Utility functions
  const formatInvestorType = (type: string): string => {
    if (!type) return 'Individual';
    
    return type
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Llc/g, 'LLC')
      .replace(/Corp/g, 'Corporation')
      .replace(/Inc/g, 'Incorporated')
      .replace(/Ltd/g, 'Limited')
      .replace(/Lp/g, 'LP')
      .replace(/Llp/g, 'LLP');
  };
  
  const toTitleCase = (str: string | undefined | null): string => {
    if (!str) return 'N/A';
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Generate export data
  const exportData = () => {
    if (!redemption) return;
    
    const data = {
      requestId: redemption.id,
      submittedDate: redemption.submittedAt,
      investorId: redemption.investorId,
      investorName: redemption.investorName,
      tokenAmount: redemption.tokenAmount,
      tokenType: redemption.tokenType,
      redemptionType: redemption.redemptionType,
      status: redemption.status,
      usdcAmount: redemption.usdcAmount,
      sourceWallet: redemption.sourceWallet,
      destinationWallet: redemption.destinationWallet,
      notes: redemption.notes,
      statusHistory: statusHistory,
      // Enhanced data
      investorProfile: enhancedData.investor,
      subscriptionDetails: enhancedData.subscription,
      distributionDetails: enhancedData.distribution
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redemption-${redemption.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !redemption) {
    return (
      <Card className={cn('w-full max-w-4xl mx-auto', className)}>
        <CardHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !redemption) {
    return (
      <Card className={cn('w-full max-w-4xl mx-auto', className)}>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Redemption request not found'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Timeline steps
  const timelineSteps = [
    {
      title: 'Request Submitted',
      description: 'Redemption request has been submitted for review',
      timestamp: new Date(redemption.submittedAt),
      isCompleted: true
    },
    {
      title: 'Under Review',
      description: 'Request is being reviewed for compliance and eligibility',
      isCompleted: ['approved', 'processing', 'settled'].includes(currentStatus || ''),
      isCurrent: currentStatus === 'pending'
    },
    {
      title: 'Approved',
      description: 'Request has been approved and is ready for processing',
      timestamp: redemption.approvedAt ? new Date(redemption.approvedAt) : undefined,
      isCompleted: ['processing', 'settled'].includes(currentStatus || ''),
      isCurrent: currentStatus === 'approved'
    },
    {
      title: 'Processing',
      description: 'Tokens are being burned and settlement is in progress',
      isCompleted: currentStatus === 'settled',
      isCurrent: currentStatus === 'processing'
    },
    {
      title: 'Completed',
      description: 'Redemption has been completed successfully',
      timestamp: redemption.settledAt ? new Date(redemption.settledAt) : undefined,
      isCompleted: currentStatus === 'settled',
      isCurrent: false
    }
  ];

  const approvalProgress = currentApproval ? getApprovalProgress(currentApproval.id) : null;

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-3">
              Redemption Request
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {redemption.id.slice(0, 8)}...
              </code>
            </CardTitle>
            <CardDescription>
              Submitted on {new Date(redemption.submittedAt).toLocaleDateString()} at{' '}
              {new Date(redemption.submittedAt).toLocaleTimeString()}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <StatusIndicator status={currentStatus || redemption.status} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={refreshStatus}>
                    <Clock className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh status</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Status Message */}
        {isInProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{getStatusMessage()}</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="investor">Investor</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="settlement">Settlement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Request Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Token Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{redemption.tokenAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{redemption.tokenType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Redemption Type:</span>
                    <Badge variant="outline" className="capitalize">{redemption.redemptionType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversion Rate:</span>
                    <span className="font-medium">{redemption.conversionRate || 1.0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>USDC Value:</span>
                    <span>${redemption.usdcAmount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Wallet Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-muted-foreground text-sm">Source Wallet:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                        {redemption.sourceWallet}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(redemption.sourceWallet)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Destination Wallet:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                        {redemption.destinationWallet}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(redemption.destinationWallet)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Notes */}
            {redemption.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{redemption.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {onEdit && ['draft', 'pending'].includes(currentStatus || '') && (
                <Button onClick={onEdit}>
                  Edit Request
                </Button>
              )}
              
              {onCancel && canCancel && (
                <Button variant="destructive" onClick={onCancel}>
                  Cancel Request
                </Button>
              )}
              
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="investor" className="space-y-6">
            {enhancedData.loading ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Loading Investor Information...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : enhancedData.error ? (
              <Card>
                <CardContent className="p-8">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {enhancedData.error}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Investor Profile */}
                {enhancedData.investor && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Investor Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-lg">{enhancedData.investor.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatInvestorType(enhancedData.investor.type)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Email</div>
                              <div className="text-sm text-muted-foreground">{enhancedData.investor.email}</div>
                            </div>
                          </div>
                          
                          {enhancedData.investor.phone && (
                            <div className="flex items-center gap-3">
                              <div className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">Phone</div>
                                <div className="text-sm text-muted-foreground">{enhancedData.investor.phone}</div>
                              </div>
                            </div>
                          )}
                          
                          {enhancedData.investor.company && (
                            <div className="flex items-center gap-3">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">Company</div>
                                <div className="text-sm text-muted-foreground">{enhancedData.investor.company}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">KYC Status</div>
                              <Badge 
                                variant={enhancedData.investor.kyc_status === 'approved' ? 'default' : 'secondary'}
                                className="mt-1"
                              >
                                {toTitleCase(enhancedData.investor.kyc_status)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Accreditation</div>
                              <Badge 
                                variant={enhancedData.investor.accreditation_status === 'accredited' ? 'default' : 'secondary'}
                                className="mt-1"
                              >
                                {toTitleCase(enhancedData.investor.accreditation_status)}
                              </Badge>
                            </div>
                          </div>
                          
                          {enhancedData.investor.wallet_address && (
                            <div className="flex items-center gap-3">
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="text-sm font-medium">Wallet Address</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                                    {enhancedData.investor.wallet_address}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(enhancedData.investor!.wallet_address!)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Joined</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(enhancedData.investor.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Subscription Details */}
                {enhancedData.subscription && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Investment Subscription
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Investment Amount</div>
                              <div className="text-lg font-semibold text-green-600">
                                {enhancedData.subscription.fiat_amount.toLocaleString()} {enhancedData.subscription.currency}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Subscription Date</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(enhancedData.subscription.subscription_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Subscription ID</div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {enhancedData.subscription.subscription_id}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Status</div>
                              <Badge variant="default" className="mt-1">
                                {toTitleCase(enhancedData.subscription.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {enhancedData.subscription.notes && (
                        <div className="pt-3 border-t">
                          <div className="text-sm font-medium mb-2">Notes</div>
                          <p className="text-sm text-muted-foreground">{enhancedData.subscription.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* Distribution Details */}
                {enhancedData.distribution && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Token Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Coins className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Token Details</div>
                              <div className="text-sm">
                                <span className="font-semibold">{enhancedData.distribution.token_amount.toLocaleString()}</span>
                                {enhancedData.distribution.token_symbol && (
                                  <span className="ml-1">{enhancedData.distribution.token_symbol}</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Available: {enhancedData.distribution.remaining_amount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Blockchain</div>
                              <div className="text-sm text-muted-foreground">
                                {toTitleCase(enhancedData.distribution.blockchain)}
                              </div>
                            </div>
                          </div>
                          
                          {enhancedData.distribution.standard && (
                            <div className="flex items-center gap-3">
                              <Link className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">Token Standard</div>
                                <Badge variant="outline" className="mt-1">
                                  {enhancedData.distribution.standard}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Distribution Date</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(enhancedData.distribution.distribution_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          {enhancedData.distribution.token_address && (
                            <div className="flex items-center gap-3">
                              <Link className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="text-sm font-medium">Contract Address</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                                    {enhancedData.distribution.token_address}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(enhancedData.distribution!.token_address!)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`https://etherscan.io/address/${enhancedData.distribution!.token_address}`, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {enhancedData.distribution.notes && (
                        <div className="pt-3 border-t">
                          <div className="text-sm font-medium mb-2">Distribution Notes</div>
                          <p className="text-sm text-muted-foreground">{enhancedData.distribution.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* No Enhanced Data Available */}
                {!enhancedData.investor && !enhancedData.subscription && !enhancedData.distribution && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-muted-foreground">No additional investor information available</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={fetchEnhancedData}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Loading
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request Timeline</CardTitle>
                <CardDescription>
                  Track the progress of your redemption request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timelineSteps.map((step, index) => (
                    <TimelineStep
                      key={index}
                      title={step.title}
                      description={step.description}
                      timestamp={step.timestamp}
                      isCompleted={step.isCompleted}
                      isCurrent={step.isCurrent || false}
                      isLast={index === timelineSteps.length - 1}
                    />
                  ))}
                </div>

                {/* Status History */}
                {statusHistory && statusHistory.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-medium mb-4">Status History</h4>
                    <div className="space-y-2">
                      {statusHistory.map((update, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium capitalize">{update.status}</p>
                            {update.message && (
                              <p className="text-sm text-muted-foreground">{update.message}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {update.timestamp.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approval Status</CardTitle>
                <CardDescription>
                  Multi-signature approval progress for this redemption
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvalProgress ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Approval Progress</span>
                      <span className="font-medium">
                        {approvalProgress.current} of {approvalProgress.required} approvals
                      </span>
                    </div>
                    <Progress value={approvalProgress.percentage} />
                    
                    {approvalInfo && (
                      <div className="space-y-2">
                        {approvalInfo.approvedBy && approvalInfo.approvedBy.length > 0 && (
                          <div>
                            <h5 className="font-medium text-green-700">Approved By:</h5>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {approvalInfo.approvedBy.map((approver, index) => (
                                <li key={index}>{approver}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {approvalInfo.rejectedBy && approvalInfo.rejectedBy.length > 0 && (
                          <div>
                            <h5 className="font-medium text-red-700">Rejected By:</h5>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {approvalInfo.rejectedBy.map((rejecter, index) => (
                                <li key={index}>{rejecter}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No approval information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settlement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Settlement Details</CardTitle>
                <CardDescription>
                  Token burning and fund transfer information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settlementInfo ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className="ml-2 capitalize">{settlementInfo.status}</Badge>
                      </div>
                      {settlementInfo.transactionHash && (
                        <div>
                          <span className="text-muted-foreground">Transaction:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {settlementInfo.transactionHash.slice(0, 10)}...
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(settlementInfo.transactionHash!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://etherscan.io/tx/${settlementInfo.transactionHash}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {settlementInfo.gasUsed && (
                      <div>
                        <span className="text-muted-foreground">Gas Used:</span>
                        <span className="ml-2 font-medium">{settlementInfo.gasUsed.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {settlementInfo.timestamp && (
                      <div>
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="ml-2">{settlementInfo.timestamp.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Settlement has not started yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};