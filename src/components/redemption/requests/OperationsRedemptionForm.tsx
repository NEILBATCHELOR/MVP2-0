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
import { Loader2, Calculator, Plus, Minus, CheckCircle } from 'lucide-react';
import { cn } from '@/utils';
import { 
  CreateRedemptionRequestInput, 
  RedemptionRequest,
  Distribution,
  EnrichedDistribution
} from '../types';
import { useRedemptions } from '../hooks';
import { redemptionService } from '../services';

// Form validation schema - simple validation without eligibility checks
const operationsRedemptionFormSchema = z.object({
  distributionId: z.string().min(1, 'Distribution is required'),
  tokenAmount: z.number().min(0.01, 'Token amount must be greater than 0'),
  tokenType: z.enum(['ERC-20', 'ERC-721', 'ERC-1155', 'ERC-1400', 'ERC-3525', 'ERC-4626']),
  redemptionType: z.enum(['standard', 'interval']),
  sourceWallet: z.string().min(1, 'Source wallet address is required'),
  destinationWallet: z.string().min(1, 'Destination wallet address is required'),
  conversionRate: z.number().min(0, 'Conversion rate must be positive').optional(),
  notes: z.string().optional()
});

type OperationsRedemptionFormData = z.infer<typeof operationsRedemptionFormSchema>;

interface OperationsRedemptionFormProps {
  onSuccess?: (redemption: RedemptionRequest) => void;
  onCancel?: () => void;
  className?: string;
}

// Utility function to map distribution token standard to form enum values
const mapTokenStandard = (standard: string): string => {
  if (!standard) return 'ERC-20';
  
  const normalized = standard.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const standardMap: Record<string, string> = {
    'ERC20': 'ERC-20',
    'ERC721': 'ERC-721', 
    'ERC1155': 'ERC-1155',
    'ERC1400': 'ERC-1400',
    'ERC3525': 'ERC-3525',
    'ERC4626': 'ERC-4626',
    'ERC-20': 'ERC-20',
    'ERC-721': 'ERC-721',
    'ERC-1155': 'ERC-1155', 
    'ERC-1400': 'ERC-1400',
    'ERC-3525': 'ERC-3525',
    'ERC-4626': 'ERC-4626'
  };
  
  return standardMap[normalized] || 'ERC-20';
};

export const OperationsRedemptionForm: React.FC<OperationsRedemptionFormProps> = ({
  onSuccess,
  onCancel,
  className
}) => {
  // Hooks
  const { createRedemption, loading: submitting } = useRedemptions();
  const form = useForm<OperationsRedemptionFormData>({
    resolver: zodResolver(operationsRedemptionFormSchema),
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

  // Watch form values for calculations
  const watchedValues = form.watch();
  const { distributionId, tokenAmount, conversionRate } = watchedValues;

  // Load all distributions for operations team
  useEffect(() => {
    const loadDistributions = async () => {
      try {
        setDistributionsLoading(true);
        
        // Load all distributions for operations team - no investor filter
        const response = await redemptionService.getEnrichedDistributions();
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

    loadDistributions();
  }, []);

  // Update selected distribution when distributionId changes
  useEffect(() => {
    if (distributionId) {
      const distribution = distributions.find(d => d.id === distributionId);
      setSelectedDistribution(distribution);
      
      if (distribution) {
        // Auto-populate source wallet from investor data if available
        if (distribution.investor?.wallet_address && !form.getValues('sourceWallet')) {
          form.setValue('sourceWallet', distribution.investor.wallet_address);
        }
        
        // Auto-populate token standard from distribution
        if (distribution.standard) {
          const mappedStandard = mapTokenStandard(distribution.standard);
          form.setValue('tokenType', mappedStandard as any, { shouldValidate: true });
        }
      }
    } else {
      setSelectedDistribution(null);
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

  // Handle percentage toggle for token amount
  const handlePctToggle = (pct: number) => {
    if (!selectedDistribution) return;
    
    const availableTokens = selectedDistribution.remainingAmount;
    const targetAmount = Math.floor((availableTokens * pct) / 100);
    form.setValue('tokenAmount', targetAmount);
  };

  // Handle form submission - NO ELIGIBILITY CHECKS
  const onSubmit = async (data: OperationsRedemptionFormData) => {
    try {
      if (!selectedDistribution) {
        form.setError('root', { 
          message: 'Please select a distribution' 
        });
        return;
      }

      const input: CreateRedemptionRequestInput = {
        distributionId: selectedDistribution.id, // Include distribution ID for proper linking
        tokenAmount: data.tokenAmount,
        tokenType: data.tokenType,
        redemptionType: data.redemptionType,
        sourceWallet: data.sourceWallet,
        destinationWallet: data.destinationWallet,
        sourceWalletAddress: data.sourceWallet,
        destinationWalletAddress: data.destinationWallet,
        conversionRate: data.conversionRate || 1.0,
        usdcAmount: estimatedValue,
        investorId: selectedDistribution.investorId,
        investorName: selectedDistribution.investor?.name,
        notes: data.notes
      };

      const redemption = await createRedemption(input);
      
      if (redemption) {
        onSuccess?.(redemption);
        form.reset();
      }
    } catch (error) {
      form.setError('root', { 
        message: error instanceof Error ? error.message : 'Failed to create redemption request' 
      });
    }
  };

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Operations: Create Redemption Request
        </CardTitle>
        <CardDescription>
          Create redemption requests for any investor. All requests will go to approval queue.
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
                  <FormLabel>Select Distribution</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {distributionsLoading ? (
                        <div className="flex items-center justify-center p-8 border rounded-lg">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading distributions...</span>
                        </div>
                      ) : distributions.length === 0 ? (
                        <div className="flex items-center justify-center p-8 border rounded-lg">
                          <span>No distributions found</span>
                        </div>
                      ) : (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a distribution to redeem" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {distributions.map((dist) => (
                              <SelectItem key={dist.id} value={dist.id}>
                                <div className="flex flex-col py-1">
                                  <span className="font-medium">
                                    {dist.investor?.name || dist.investorId} - {dist.tokenSymbol || 'TOKEN'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {dist.remainingAmount.toLocaleString()} available • {dist.standard || 'N/A'} • {new Date(dist.distributionDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select any distribution to create a redemption request for that investor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Distribution Details */}
            {selectedDistribution && (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <h4 className="font-semibold">Distribution Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Investor:</span>
                    <div className="font-medium">{selectedDistribution.investor?.name || selectedDistribution.investorId}</div>
                    {selectedDistribution.investor?.email && (
                      <div className="text-xs text-muted-foreground">{selectedDistribution.investor.email}</div>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Token:</span>
                    <div className="font-medium">{selectedDistribution.tokenSymbol || 'TOKEN'}</div>
                    <div className="text-xs text-muted-foreground">{selectedDistribution.standard}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Available:</span>
                    <div className="font-medium text-green-600">{selectedDistribution.remainingAmount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">of {selectedDistribution.tokenAmount.toLocaleString()} total</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Amount Selection */}
            {selectedDistribution && (
              <div className="space-y-2">
                <FormLabel>Quick Amount Selection</FormLabel>
                <div className="flex gap-2 flex-wrap">
                  {[25, 50, 75, 100].map(pct => (
                    <Button
                      key={pct}
                      size="sm"
                      type="button"
                      variant="outline"
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
                    const incrementAmount = currentValue >= 1000 ? 100 : currentValue >= 100 ? 10 : 1;
                    field.onChange(currentValue + incrementAmount);
                  };
                  
                  const decrement = () => {
                    const currentValue = field.value || 0;
                    const decrementAmount = currentValue > 1000 ? 100 : currentValue > 100 ? 10 : 1;
                    field.onChange(Math.max(currentValue - decrementAmount, 0));
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
                            className="text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={increment}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Number of tokens to redeem
                        {selectedDistribution && (
                          <span className="block text-xs text-muted-foreground mt-1">
                            Max available: {selectedDistribution.remainingAmount.toLocaleString()}
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
                          Auto-populated: {selectedDistribution.standard}
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
                      Standard = immediate processing, Interval = scheduled windows
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
                      Token-to-USDC conversion rate
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
                  <span className="font-medium text-green-800">Estimated Redemption Value</span>
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
                      Wallet holding the tokens
                      {selectedDistribution?.investor?.wallet_address && (
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
                      Wallet to receive USDC
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
                  <FormLabel>Internal Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Internal notes for this redemption request..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Errors */}
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Request...
                  </>
                ) : (
                  'Create Redemption Request'
                )}
              </Button>
              
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            {/* Info */}
            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <strong>Operations Note:</strong> This form creates redemption requests without eligibility checks. 
              All requests will be sent to the approval queue for review and processing.
            </div>
            
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};