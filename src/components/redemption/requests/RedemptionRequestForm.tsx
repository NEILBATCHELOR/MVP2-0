'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle, Info, Calculator, Plus, Minus } from 'lucide-react';
import { cn } from '@/utils';
import { 
  CreateRedemptionRequestInput, 
  RedemptionRequest,
  EligibilityResult,
  ValidationResult,
  Distribution,
  EnrichedDistribution
} from '../types';
import { useRedemptions } from '../hooks';
import { eligibilityService, redemptionService } from '../services';
import { supabase } from '@/infrastructure/supabaseClient';
// Approver components removed

// Form validation schema
const redemptionFormSchema = z.object({
  distributionId: z.string().min(1, 'Distribution is required'),
  tokenAmount: z.number().min(0.01, 'Token amount must be greater than 0'),
  tokenType: z.enum(['ERC-20', 'ERC-721', 'ERC-1155', 'ERC-1400', 'ERC-3525', 'ERC-4626']),
  redemptionType: z.enum(['standard', 'interval']),
  sourceWallet: z.string().min(1, 'Source wallet address is required'),
  destinationWallet: z.string().min(1, 'Destination wallet address is required'),
  conversionRate: z.number().min(0, 'Conversion rate must be positive').optional(),
  notes: z.string().optional()
});

type RedemptionFormData = z.infer<typeof redemptionFormSchema>;

interface RedemptionRequestFormProps {
  investorId: string;
  onSuccess?: (redemption: RedemptionRequest) => void;
  onCancel?: () => void;
  className?: string;
}

interface InvestorData {
  investor_id: string;
  name: string;
  email: string;
  type: string;
  wallet_address: string;
  company?: string;
  kyc_status: string;
  accreditation_status: string;
}

interface SubscriptionData {
  id: string;
  subscription_id: string;
  fiat_amount: string;
  currency: string;
  subscription_date: string;
  notes?: string;
}

// Utility function to title case strings
const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Utility function to format investor type in human readable format
const formatInvestorType = (type: string): string => {
  if (!type) return 'Individual';
  
  // Convert snake_case and special cases to human readable format
  const formatted = type
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Llc/g, 'LLC')
    .replace(/Corp/g, 'Corporation')
    .replace(/Inc/g, 'Incorporated')
    .replace(/Ltd/g, 'Limited')
    .replace(/Lp/g, 'LP')
    .replace(/Llp/g, 'LLP');
    
  return formatted;
};

// Utility function to map distribution token standard to form enum values
const mapTokenStandard = (standard: string): string => {
  if (!standard) return 'ERC-20';
  
  // Handle various formats that might come from the database
  const normalized = standard.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Map common variations to exact enum values
  const standardMap: Record<string, string> = {
    'ERC20': 'ERC-20',
    'ERC721': 'ERC-721', 
    'ERC1155': 'ERC-1155',
    'ERC1400': 'ERC-1400',
    'ERC3525': 'ERC-3525',
    'ERC4626': 'ERC-4626',
    // Handle exact matches
    'ERC-20': 'ERC-20',
    'ERC-721': 'ERC-721',
    'ERC-1155': 'ERC-1155', 
    'ERC-1400': 'ERC-1400',
    'ERC-3525': 'ERC-3525',
    'ERC-4626': 'ERC-4626'
  };
  
  return standardMap[normalized] || 'ERC-20';
};

// Function to check if form is ready for submission
const getSubmissionBlockers = (
  formState: any,
  eligibilityCheck: EligibilityResult | null,
  selectedDistribution: EnrichedDistribution | null,
  tokenAmount: number,
  // approvers removed
): string[] => {
  const blockers: string[] = [];

  // Check form validation errors
  if (!formState.isValid || Object.keys(formState.errors).length > 0) {
    const errorFields = Object.keys(formState.errors);
    if (errorFields.includes('distributionId')) blockers.push('Please select a distribution');
    if (errorFields.includes('tokenAmount')) blockers.push('Please enter a valid token amount');
    if (errorFields.includes('sourceWallet')) blockers.push('Please enter a valid source wallet address');
    if (errorFields.includes('destinationWallet')) blockers.push('Please enter a valid destination wallet address');
    if (errorFields.includes('tokenType')) blockers.push('Please select a token type');
    if (errorFields.includes('redemptionType')) blockers.push('Please select a redemption type');
  }

  // Check business logic requirements
  if (!selectedDistribution) {
    blockers.push('Please select a distribution to redeem from');
  } else {
    if (tokenAmount <= 0) {
      blockers.push('Token amount must be greater than 0');
    } else if (tokenAmount > selectedDistribution.remainingAmount) {
      blockers.push(`Token amount cannot exceed available balance (${selectedDistribution.remainingAmount.toLocaleString()})`);
    }
  }

  // Approver requirements check removed

  return blockers;
};

export const RedemptionRequestForm: React.FC<RedemptionRequestFormProps> = ({
  investorId,
  onSuccess,
  onCancel,
  className
}) => {
  // Don't render if no investorId is provided
  if (!investorId) {
    return (
      <Card className={cn('w-full max-w-6xl mx-auto', className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load redemption form. Please ensure you are logged in.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  // Hooks
  const { createRedemption, loading: submitting } = useRedemptions();
  const form = useForm<RedemptionFormData>({
    resolver: zodResolver(redemptionFormSchema),
    defaultValues: {
      tokenAmount: 0,
      tokenType: 'ERC-20',
      redemptionType: 'standard',
      sourceWallet: '',
      destinationWallet: '',
      conversionRate: 1.0,
      notes: ''
    }
  });

  // State
  const [distributions, setDistributions] = useState<EnrichedDistribution[]>([]);
  const [distributionsLoading, setDistributionsLoading] = useState(true);
  const [selectedDistribution, setSelectedDistribution] = useState<EnrichedDistribution | null>(null);
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [investorData, setInvestorData] = useState<InvestorData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [investorLoading, setInvestorLoading] = useState(false);
  
  // Approver state removed

  // Watch form values for real-time validation
  const watchedValues = form.watch();
  const { distributionId, tokenAmount, conversionRate } = watchedValues;

  // Check what's blocking submission
  const submissionBlockers = getSubmissionBlockers(
    form.formState, 
    null, 
    selectedDistribution, 
    tokenAmount,
    // selectedApprovers removed from dependencies
  );
  const canSubmit = submissionBlockers.length === 0 && !submitting;

  // Load distributions for current investor on component mount
  useEffect(() => {
    const loadDistributions = async () => {
      try {
        setDistributionsLoading(true);
        
        // Resolve the actual investor ID if needed
        let actualInvestorId = investorId;
        if (investorId && investorId !== 'current-user') {
          // Try to resolve if it's a user ID
          const resolvedId = await eligibilityService.resolveInvestorId(investorId);
          if (resolvedId) {
            actualInvestorId = resolvedId;
          }
        }
        
        // Use getEnrichedDistributions with resolved investorId filter to get investor names
        const response = await redemptionService.getEnrichedDistributions(actualInvestorId);
        if (response.success && response.data) {
          setDistributions(response.data);
        } else {
          console.error('Failed to load distributions:', response.error);
        }
      } catch (error) {
        console.error('Error loading distributions:', error);
      } finally {
        setDistributionsLoading(false);
      }
    };

    if (investorId) {
      loadDistributions();
    }
  }, [investorId]);

  // Fetch investor and subscription data
  const fetchInvestorAndSubscriptionData = async (distribution: EnrichedDistribution) => {
    try {
      setInvestorLoading(true);
      
      // Fetch investor data directly from Supabase
      const { data: investor, error: investorError } = await supabase
        .from('investors')
        .select('*')
        .eq('investor_id', distribution.investorId)
        .single();
      
      if (investor && !investorError) {
        setInvestorData(investor);
        
        // Auto-populate source wallet if available
        if (investor.wallet_address && !form.getValues('sourceWallet')) {
          form.setValue('sourceWallet', investor.wallet_address);
        }
      } else if (investorError) {
        console.error('Error fetching investor:', investorError);
      }
      
      // Fetch subscription data if available
      if (distribution.subscriptionId) {
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('id', distribution.subscriptionId)
          .single();
        
        if (subscription && !subscriptionError) {
          // Convert fiat_amount to string to match type expectations
          const formattedSubscription = {
            ...subscription,
            fiat_amount: String(subscription.fiat_amount)
          };
          setSubscriptionData(formattedSubscription);
        } else if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
        }
      }
    } catch (error) {
      console.error('Error fetching investor/subscription data:', error);
    } finally {
      setInvestorLoading(false);
    }
  };

  // Update selected distribution when distributionId changes
  useEffect(() => {
    if (distributionId) {
      const distribution = distributions.find(d => d.id === distributionId);
      setSelectedDistribution(distribution);
      
      if (distribution) {
        // Auto-populate source wallet from enriched investor data if available
        if (distribution.investor?.wallet_address && !form.getValues('sourceWallet')) {
          form.setValue('sourceWallet', distribution.investor.wallet_address);
        }
        
        // Auto-populate token standard from distribution details
        if (distribution.standard) {
          const mappedStandard = mapTokenStandard(distribution.standard);
          const currentValue = form.getValues('tokenType');
          
          if (mappedStandard !== currentValue) {
            console.log('Auto-populating token standard:', {
              distributionStandard: distribution.standard,
              mappedStandard,
              currentFormValue: currentValue,
              distributionId: distribution.id
            });
            
            // Use setTimeout to ensure the form is ready
            setTimeout(() => {
              form.setValue('tokenType', mappedStandard as any, { shouldValidate: true });
            }, 100);
          }
        }
        
        // Fetch related data if needed (fallback for cases where enriched data is incomplete)
        if (!distribution.investor || !distribution.subscription) {
          fetchInvestorAndSubscriptionData(distribution);
        }
      }
    } else {
      setSelectedDistribution(null);
      setInvestorData(null);
      setSubscriptionData(null);
    }
  }, [distributionId, distributions]);

  // Calculate estimated value when amount or conversion rate changes
  useEffect(() => {
    if (tokenAmount && conversionRate) {
      setEstimatedValue(tokenAmount * conversionRate);
    } else {
      setEstimatedValue(0);
    }
  }, [tokenAmount, conversionRate]);

  // Eligibility checking is disabled

  // Handle percentage toggle for token amount
  const handlePctToggle = (pct: number) => {
    if (!selectedDistribution) return;
    
    const availableTokens = selectedDistribution.remainingAmount;
    const targetAmount = Math.floor((availableTokens * pct) / 100);
    form.setValue('tokenAmount', targetAmount);
  };

  // Approvers change handler removed

  // Handle form submission
  const onSubmit = async (data: RedemptionFormData) => {
    try {
      // Check submission blockers
      if (submissionBlockers.length > 0) {
        form.setError('root', { 
          message: `Cannot submit: ${submissionBlockers.join(', ')}` 
        });
        return;
      }

      // Approvers validation removed

      // Resolve the actual investor ID if needed
      let actualInvestorId = investorId;
      if (investorId && investorId !== 'current-user') {
        const resolvedId = await eligibilityService.resolveInvestorId(investorId);
        if (resolvedId) {
          actualInvestorId = resolvedId;
        }
      }

      // Get investor name from available data
      const investorName = selectedDistribution?.investor?.name || 
                          investorData?.name || 
                          undefined;

      const input: CreateRedemptionRequestInput = {
        distributionId: data.distributionId, // Pass distribution ID for auto-population
        tokenAmount: data.tokenAmount,
        tokenType: data.tokenType,
        redemptionType: data.redemptionType,
        sourceWallet: data.sourceWallet,
        destinationWallet: data.destinationWallet,
        sourceWalletAddress: data.sourceWallet,
        destinationWalletAddress: data.destinationWallet,
        conversionRate: data.conversionRate || 1.0,
        usdcAmount: estimatedValue,
        investorId: actualInvestorId,
        investorName: investorName, // Pass investor name when available
        notes: data.notes
      };

      const redemption = await createRedemption(input);
      
      if (redemption) {
        // Approver saving code removed
        
        onSuccess?.(redemption);
        form.reset();
        // setSelectedApprovers reset removed
      }
    } catch (error) {
      form.setError('root', { 
        message: error instanceof Error ? error.message : 'Failed to create redemption request' 
      });
    }
  };

  return (
    <Card className={cn('w-full max-w-6xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Token Redemption Request
        </CardTitle>
        <CardDescription>
          Submit a request to redeem your distributed tokens. Please ensure all information is accurate.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Distribution Selection */}
            <FormField
              control={form.control}
              name="distributionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Distributions</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {distributionsLoading ? (
                        <div className="flex items-center justify-center p-8 border rounded-lg">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading available distributions...</span>
                        </div>
                      ) : distributions.length === 0 ? (
                        <div className="flex items-center justify-center p-8 border rounded-lg">
                          <AlertCircle className="h-6 w-6 mr-2 text-muted-foreground" />
                          <span>No distributions available for redemption</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {distributions.map((dist) => (
                            <div key={dist.id} className="relative">
                              <input
                                type="radio"
                                id={`distribution-${dist.id}`}
                                name="distributionId"
                                value={dist.id}
                                checked={field.value === dist.id}
                                onChange={() => field.onChange(dist.id)}
                                className="sr-only"
                              />
                              <Label
                                htmlFor={`distribution-${dist.id}`}
                                className={cn(
                                  "flex flex-col p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50",
                                  field.value === dist.id
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "border-border hover:bg-muted/50"
                                )}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                      field.value === dist.id
                                        ? "border-primary bg-primary"
                                        : "border-border"
                                    )}>
                                      {field.value === dist.id && (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <div>
                                      <span className="font-medium text-base">
                                        {dist.tokenSymbol || 'TOKEN'} - {dist.remainingAmount.toLocaleString()} available
                                      </span>
                                      <div className="text-sm text-muted-foreground">
                                        Investor: {dist.investor?.name || dist.investorId}
                                      </div>
                                    </div>
                                  </div>
                                  <Badge variant="secondary">
                                    {new Date(dist.distributionDate).toLocaleDateString()}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs text-muted-foreground">
                                  <span>Blockchain: {toTitleCase(dist.blockchain)}</span>
                                  <span>Standard: {dist.standard || 'N/A'}</span>
                                  <span>Total: {dist.tokenAmount.toLocaleString()}</span>
                                  <span>Available: {dist.remainingAmount.toLocaleString()}</span>
                                </div>
                                {dist.tokenAddress && (
                                  <div className="mt-2 pt-2 border-t">
                                    <span className="text-xs text-muted-foreground font-mono">
                                      Contract: {dist.tokenAddress.slice(0, 10)}...{dist.tokenAddress.slice(-6)}
                                    </span>
                                  </div>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select a token distribution to redeem. Only distributions with remaining tokens are shown.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Token Details */}
            {selectedDistribution && (
              <div className="p-6 bg-muted rounded-lg space-y-4">
                <h4 className="font-semibold text-base">Selected Distribution Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium">Investor Information:</span>
                    <div className="ml-2">
                      {investorLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      ) : selectedDistribution.investor ? (
                        <>
                          <div className="font-medium">{selectedDistribution.investor.name}</div>
                          <div className="text-xs text-muted-foreground">{selectedDistribution.investor.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedDistribution.investor.company && selectedDistribution.investor.company !== selectedDistribution.investor.name && (
                              <span>{selectedDistribution.investor.company} • </span>
                            )}
                            {formatInvestorType(selectedDistribution.investor.type)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            KYC: <Badge variant={selectedDistribution.investor.kyc_status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                              {toTitleCase(selectedDistribution.investor.kyc_status)}
                            </Badge>
                          </div>
                        </>
                      ) : investorData ? (
                        <>
                          <div className="font-medium">{investorData.name}</div>
                          <div className="text-xs text-muted-foreground">{investorData.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {investorData.company && investorData.company !== investorData.name && (
                              <span>{investorData.company} • </span>
                            )}
                            {formatInvestorType(investorData.type)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            KYC: <Badge variant={investorData.kyc_status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                              {toTitleCase(investorData.kyc_status)}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium">{selectedDistribution.investorId}</div>
                          <div className="text-xs text-muted-foreground">Investor ID</div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {(selectedDistribution.subscription || subscriptionData) && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-medium">Subscription Details:</span>
                      <div className="ml-2">
                        {selectedDistribution.subscription ? (
                          <>
                            <div className="font-medium">
                              {selectedDistribution.subscription.fiat_amount.toLocaleString()} {selectedDistribution.subscription.currency}
                            </div>
                            <div className="text-xs text-muted-foreground">Investment Amount</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(selectedDistribution.subscription.subscription_date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {selectedDistribution.subscription.subscription_id}
                            </div>
                          </>
                        ) : subscriptionData ? (
                          <>
                            <div className="font-medium">
                              {parseFloat(subscriptionData.fiat_amount).toLocaleString()} {subscriptionData.currency}
                            </div>
                            <div className="text-xs text-muted-foreground">Investment Amount</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(subscriptionData.subscription_date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {subscriptionData.subscription_id}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium">Token Standard:</span>
                    <div className="ml-2">
                      <div className="font-medium">{selectedDistribution.standard || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">Token Standard</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium">Blockchain:</span>
                    <div className="ml-2">
                      <div className="font-medium">{toTitleCase(selectedDistribution.blockchain)}</div>
                      <div className="text-xs text-muted-foreground">Network</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium">Distribution Date:</span>
                    <div className="ml-2">
                      <div className="font-medium">{new Date(selectedDistribution.distributionDate).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">Original Distribution</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium">Total Amount:</span>
                    <div className="ml-2">
                      <div className="font-medium">{selectedDistribution.tokenAmount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Originally Distributed</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium">Available:</span>
                    <div className="ml-2">
                      <div className="font-medium text-green-600">{selectedDistribution.remainingAmount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Redeemable Amount</div>
                    </div>
                  </div>
                </div>
                {selectedDistribution.tokenAddress && (
                  <div className="pt-3 border-t">
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-sm font-medium">Token Contract Address:</span>
                      <div className="ml-2 font-mono text-sm bg-background p-2 rounded border">
                        {selectedDistribution.tokenAddress}
                      </div>
                    </div>
                  </div>
                )}
                {selectedDistribution.tokenSymbol && (
                  <div className="pt-2">
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-sm font-medium">Token Symbol:</span>
                      <div className="ml-2">
                        <Badge variant="outline" className="font-semibold">{selectedDistribution.tokenSymbol}</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Token Amount with Percentage Toggles */}
            {selectedDistribution && (
              <div className="py-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Label>Adjust Token Amount (%)</Label>
                  {[5, 10, 25, 50, 75, 100].map(pct => (
                    <Button
                      key={pct}
                      size="sm"
                      type="button"
                      variant={(() => {
                        if (!selectedDistribution) return "outline";
                        const remaining = selectedDistribution.remainingAmount;
                        const pctCurrent = remaining > 0 ? Math.round(tokenAmount / remaining * 100) : 0;
                        return pctCurrent === pct ? "default" : "outline";
                      })()}
                      onClick={() => handlePctToggle(pct)}
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Token Amount */}
              <FormField
                control={form.control}
                name="tokenAmount"
                render={({ field }) => {
                  const increment = () => {
                    const currentValue = field.value || 0;
                    const maxValue = selectedDistribution?.remainingAmount || Infinity;
                    const incrementAmount = currentValue >= 1000 ? 100 : currentValue >= 100 ? 10 : currentValue >= 10 ? 1 : 0.01;
                    const newValue = Math.min(currentValue + incrementAmount, maxValue);
                    field.onChange(parseFloat(newValue.toFixed(2)));
                  };
                  
                  const decrement = () => {
                    const currentValue = field.value || 0;
                    const decrementAmount = currentValue > 1000 ? 100 : currentValue > 100 ? 10 : currentValue > 10 ? 1 : 0.01;
                    const newValue = Math.max(currentValue - decrementAmount, 0);
                    field.onChange(parseFloat(newValue.toFixed(2)));
                  };
                  
                  return (
                    <FormItem>
                      <FormLabel>Token Amount</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={decrement}
                            disabled={!field.value || field.value <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            max={selectedDistribution?.remainingAmount}
                            className="text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={increment}
                            disabled={selectedDistribution ? field.value >= selectedDistribution.remainingAmount : false}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Number of tokens to redeem
                        {selectedDistribution && (
                          <span className="block text-xs text-muted-foreground mt-1">
                            Max: {selectedDistribution.remainingAmount.toLocaleString()} • Use +/- buttons for quick adjustments
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Token Type */}
              <FormField
                control={form.control}
                name="tokenType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Standard</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select token standard" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ERC-20">ERC-20 (Fungible)</SelectItem>
                        <SelectItem value="ERC-721">ERC-721 (NFT)</SelectItem>
                        <SelectItem value="ERC-1155">ERC-1155 (Multi-Token)</SelectItem>
                        <SelectItem value="ERC-1400">ERC-1400 (Security Token)</SelectItem>
                        <SelectItem value="ERC-3525">ERC-3525 (Semi-Fungible)</SelectItem>
                        <SelectItem value="ERC-4626">ERC-4626 (Vault)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {selectedDistribution?.standard && (
                        <span className="text-xs text-green-600">
                          Auto-populated from distribution: {selectedDistribution.standard}
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Redemption Type */}
              <FormField
                control={form.control}
                name="redemptionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redemption Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard (Immediate)</SelectItem>
                        <SelectItem value="interval">Interval Fund (Periodic)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Standard redemptions are processed immediately. Interval redemptions follow scheduled windows.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conversion Rate */}
              <FormField
                control={form.control}
                name="conversionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conversion Rate (Token to USDC)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="1.000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Current token-to-USDC conversion rate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Estimated Value */}
            {estimatedValue > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Redemption Value</span>
                </div>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {estimatedValue.toLocaleString(undefined, { 
                    style: 'currency', 
                    currency: 'USD',
                    minimumFractionDigits: 2 
                  })} USDC
                </p>
              </div>
            )}

            {/* Wallet Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="sourceWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Wallet Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Wallet address holding the tokens
                      {(selectedDistribution?.investor?.wallet_address || investorData?.wallet_address) && (
                        <span className="block text-xs text-green-600 mt-1">
                          Auto-populated from investor profile
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destinationWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Wallet Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Wallet address to receive USDC
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information or special instructions..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Approver Selection block removed */}

            <Separator />

            {/* Status Check */}
            {submissionBlockers.length === 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Ready for Submission
                </h4>
                
                <Alert variant="default">
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="text-green-700 font-medium">✓ You can now submit this redemption request</p>
                      <p className="text-sm text-green-600">All required information has been provided.</p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Submission Status Check */}
            {submissionBlockers.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Required Information
                </h4>
                <Alert variant="default">
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-medium text-orange-700">Please complete the following to submit your request:</p>
                      <ul className="space-y-1 text-sm">
                        {submissionBlockers.map((blocker, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-600 mt-0.5">•</span>
                            <span>{blocker}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Form Errors */}
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  "flex-1",
                  !canSubmit && submissionBlockers.length > 0 
                    ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" 
                    : ""
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting Request...
                  </>
                ) : (
                  'Submit Redemption Request'
                )}
              </Button>
              
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            {/* Submit Button Status */}
            {submissionBlockers.length > 0 && (
              <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">
                    Submit button is disabled: {submissionBlockers.length} item{submissionBlockers.length !== 1 ? 's' : ''} need{submissionBlockers.length === 1 ? 's' : ''} attention
                  </span>
                </div>
                <p className="text-xs mt-1">
                  Complete the required information above to enable submission.
                </p>
              </div>
            )}

            {/* Help Text */}
            <div className="text-sm text-muted-foreground">
              <Info className="h-4 w-4 inline mr-1" />
              Your request will be reviewed and processed according to the redemption terms. 
              You'll receive notifications about the status of your redemption.
            </div>
            
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};