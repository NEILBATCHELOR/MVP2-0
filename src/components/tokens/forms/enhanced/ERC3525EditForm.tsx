/**
 * Enhanced ERC3525 Edit Form
 * Supports JSONB configurations, multi-step architecture, and semi-fungible token features
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Clock, Settings, Shield, Users, Layers, TrendingUp } from 'lucide-react';

// Form Components
import BasicPropertiesStep from '../components/BasicPropertiesStep';
import TokenConfigStep from '../components/TokenConfigStep';
import ValidationSummary from '../components/ValidationSummary';
import ProgressIndicator from '../components/ProgressIndicator';

// Services and Types
import { erc3525Service } from '../../services/enhancedERC3525Service';
import { TokenERC3525Properties, TokenConfigMode, TokenStandard } from '@/types/core/centralModels';
import { erc3525MinSchema, erc3525MaxSchema } from '../../validation/schemas/erc3525';
import { z } from 'zod';

// Utility Functions
import { ERC3525PropertyMapper, SlotConfiguration } from '../../utils/mappers/erc3525/erc3525PropertyMapper';

interface ERC3525EditFormProps {
  token: any;
  onSave: (data: any) => Promise<void>;
  validationPaused?: boolean;
  configMode?: TokenConfigMode;
  useAdvancedConfig?: boolean;
}

interface FormStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isComplete: boolean;
  hasErrors: boolean;
}

type ERC3525SchemaType = z.infer<typeof erc3525MinSchema>;

interface ERC3525FormData extends ERC3525SchemaType {
  standard: TokenStandard; // Use TokenStandard enum
  // Basic token properties
  name?: string;
  symbol?: string;
  decimals?: number;
  baseUri?: string;
  valueDecimals?: number;
  slotType?: string;
  
  // Missing properties from error log
  isBurnable?: boolean;
  isPausable?: boolean;
  valueTransfersEnabled?: boolean;
  mergable?: boolean;
  splittable?: boolean;
  slotApprovals?: boolean;
  valueApprovals?: boolean;
  updatableUris?: boolean;
  updatableSlots?: boolean;
  
  // Enhanced configurations for advanced mode
  slotConfigurations?: SlotConfiguration[];
  valueAllocations?: Array<{
    allocationId: string;
    slotId: string;
    holderAddress: string;
    allocatedValue: string;
    restrictions?: string[];
    metadata?: Record<string, any>;
  }>;
  paymentSchedules?: Array<{
    scheduleId: string;
    slotId: string;
    amount: string;
    frequency: 'custom' | 'monthly' | 'quarterly' | 'annually';
    startDate: string;
    endDate?: string;
    autoExecute: boolean;
    paymentType: 'fee' | 'interest' | 'principal' | 'dividend' | 'coupon';
    dueDate: string;
    recipients: Array<{
      slotId: string;
      percentage: string;
    }>;
    status: 'pending' | 'processed' | 'overdue' | 'cancelled';
  }>;
  valueAdjustments?: Array<{
    adjustmentId: string;
    slotId: string;
    adjustmentType: 'increase' | 'decrease' | 'rebalance';
    amount: string;
    reason: string;
    effectiveDate: string;
  }>;
  financialInstruments?: Array<{
    instrumentId: string;
    instrumentType: 'bond' | 'loan' | 'derivative' | 'structured_product' | 'insurance' | 'other';
    name: string;
    description?: string;
    issuanceDate: string;
    underlyingAsset?: string;
    terms?: Record<string, any>;
    maturityDate?: string;
    yieldRate?: string;
  }>;
  royaltyConfig?: {
    enabled: boolean;
    percentage?: number;
    recipient?: string;
    perpetual?: boolean;
  };
  governanceConfig?: {
    enabled: boolean;
    votingRights?: boolean;
    proposalRights?: boolean;
    quorum?: number;
  };
  stakingConfig?: {
    enabled: boolean;
    stakingRewards?: string;
    lockupPeriod?: number;
    compoundingEnabled?: boolean;
  };
}

const ERC3525EditForm: React.FC<ERC3525EditFormProps> = ({
  token,
  onSave,
  validationPaused = false,
  configMode = TokenConfigMode.MIN,
  useAdvancedConfig = false
}) => {
  const [formData, setFormData] = useState<ERC3525FormData>({
    standard: TokenStandard.ERC3525, // Use enum value
    // Basic properties
    name: token.name || '',
    symbol: token.symbol || '',
    decimals: token.decimals || 0,
    baseUri: token.erc3525Properties?.baseUri || '',
    valueDecimals: token.erc3525Properties?.valueDecimals || 0,
    
    // Basic features
    slotType: token.erc3525Properties?.slotType || 'generic',
    isBurnable: token.erc3525Properties?.isBurnable || false,
    isPausable: token.erc3525Properties?.isPausable || false,
    slotApprovals: token.erc3525Properties?.slotApprovals || true,
    valueApprovals: token.erc3525Properties?.valueApprovals || true,
    updatableUris: token.erc3525Properties?.updatableUris || false,
    updatableSlots: token.erc3525Properties?.updatableSlots || false,
    valueTransfersEnabled: token.erc3525Properties?.valueTransfersEnabled || true,
    mergable: token.erc3525Properties?.mergable || false,
    splittable: token.erc3525Properties?.splittable || false,
    
    // Enhanced configurations (for advanced mode)
    slotConfigurations: token.erc3525Properties?.slotConfigurations || [],
    valueAllocations: token.erc3525Properties?.valueAllocations || [],
    paymentSchedules: token.erc3525Properties?.paymentSchedules || [],
    valueAdjustments: token.erc3525Properties?.valueAdjustments || [],
    financialInstruments: token.erc3525Properties?.financialInstruments || [],
    royaltyConfig: token.erc3525Properties?.royaltyConfig || { enabled: false },
    governanceConfig: token.erc3525Properties?.governanceConfig || { enabled: false },
    stakingConfig: token.erc3525Properties?.stakingConfig || { enabled: false },
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Define form steps based on configuration mode
  const getFormSteps = (): FormStep[] => {
    const basicSteps: FormStep[] = [
      {
        id: 'basic',
        title: 'Basic Properties',
        description: 'Define core semi-fungible token properties',
        icon: <Settings className="h-4 w-4" />,
        isComplete: !!(formData.name && formData.symbol && formData.baseUri),
        hasErrors: !!(errors.name || errors.symbol || errors.baseUri)
      },
      {
        id: 'features',
        title: 'Semi-Fungible Features',
        description: 'Configure slot and value transfer capabilities',
        icon: <Layers className="h-4 w-4" />,
        isComplete: true, // Optional features
        hasErrors: !!(errors.slotType || errors.valueDecimals)
      }
    ];

    if (useAdvancedConfig) {
      basicSteps.push(
        {
          id: 'slots',
          title: 'Slot Management',
          description: 'Configure token slots and allocations',
          icon: <TrendingUp className="h-4 w-4" />,
          isComplete: (formData.slotConfigurations?.length || 0) > 0,
          hasErrors: !!(errors.slotConfigurations)
        },
        {
          id: 'financial',
          title: 'Financial Instruments',
          description: 'Set up financial products and payment schedules',
          icon: <Shield className="h-4 w-4" />,
          isComplete: true, // Optional
          hasErrors: !!(errors.financialInstruments || errors.paymentSchedules)
        },
        {
          id: 'governance',
          title: 'Governance & Rewards',
          description: 'Configure governance, royalties, and staking',
          icon: <Users className="h-4 w-4" />,
          isComplete: true, // Optional
          hasErrors: !!(errors.governanceConfig || errors.royaltyConfig)
        }
      );
    }

    return basicSteps;
  };

  const [formSteps] = useState<FormStep[]>(getFormSteps());
  const [propertyMapper] = useState(new ERC3525PropertyMapper());

  // Real-time validation
  useEffect(() => {
    if (!validationPaused) {
      // Create a compatible version of the form data for validation
      const compatibleData = createMapperCompatibleData(formData);
      const validation = propertyMapper.validate(compatibleData);
      setValidationResult(validation);
      
      if (!validation.valid) {
        const fieldErrors: Record<string, string> = {};
        validation.errors?.forEach((error: string) => {
          // Map validation errors to specific fields
          if (error.includes('name')) fieldErrors.name = error;
          if (error.includes('symbol')) fieldErrors.symbol = error;
          if (error.includes('baseUri')) fieldErrors.baseUri = error;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({});
      }
      
      setWarnings(validation.warnings || []);
    }
  }, [formData, validationPaused]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested configuration changes
  const handleConfigChange = (configType: string, config: any) => {
    setFormData(prev => ({
      ...prev,
      [configType]: config
    }));
  };

  // Handle array-based configuration changes
  const handleArrayConfigChange = (configType: string, items: any[]) => {
    setFormData(prev => ({
      ...prev,
      [configType]: items
    }));
  };

  // Add new slot configuration
  const addSlotConfiguration = () => {
    const newSlot: SlotConfiguration = {
      slotId: crypto.randomUUID(),
      name: `Slot ${(formData.slotConfigurations?.length || 0) + 1}`,
      description: '',
      categoryType: 'custom',
      valueDecimals: 18,
      isTransferable: true,
      maxUnitsPerSlot: undefined,
      minimumValue: undefined,
      metadata: {},
    };
    
    const currentSlots = formData.slotConfigurations || [];
    handleArrayConfigChange('slotConfigurations', [...currentSlots, newSlot]);
  };

  // Remove slot configuration
  const removeSlotConfiguration = (slotId: string) => {
    const currentSlots = formData.slotConfigurations || [];
    const updatedSlots = currentSlots.filter(slot => slot.slotId !== slotId);
    handleArrayConfigChange('slotConfigurations', updatedSlots);
  };

  // Add financial instrument
  const addFinancialInstrument = () => {
    const newInstrument = {
      instrumentId: crypto.randomUUID(),
      instrumentType: 'other' as const, // Use valid enum value
      name: `Instrument ${(formData.financialInstruments?.length || 0) + 1}`,
      description: '',
      issuanceDate: new Date().toISOString().split('T')[0], // Add required issuanceDate
      terms: {},
    };
    
    const currentInstruments = formData.financialInstruments || [];
    handleArrayConfigChange('financialInstruments', [...currentInstruments, newInstrument]);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    try {
      // Create a compatible version of the form data for validation and submission
      const compatibleData = createMapperCompatibleData(formData);
      
      // Final validation
      const validation = propertyMapper.validate(compatibleData);
      if (!validation.valid) {
        setErrors({ general: 'Please fix validation errors before saving' });
        return;
      }

      // Save via enhanced service
      const result = await erc3525Service.updateTokenWithProperties(
        token.id,
        {}, // No token data updates for now
        compatibleData // Use compatible data for the service call
      );
      
      if (result.success && result.data) {
        await onSave(result.data);
      } else {
        setErrors(result.errors ? { general: result.errors.join(', ') } : { general: result.error || 'Failed to save token' });
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate between steps
  const handleStepChange = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleNext = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Type adapter function that creates a compatible version of the form data for the property mapper
  // This approach preserves the original form data structure while providing a compatible interface for validation
  const createMapperCompatibleData = (data: ERC3525FormData): any => {
    // Create a type that satisfies the property mapper's expected interface
    const compatibleData = {
      ...data,
      // Ensure standard is properly typed to match the expected TokenStandard enum
      standard: data.standard as any, // This handles the TokenStandard enum mismatch
      // Add a custom getter for paymentSchedules that transforms the data on-the-fly
      get paymentSchedules() {
        if (!data.paymentSchedules || data.paymentSchedules.length === 0) return undefined;
        
        return data.paymentSchedules.map(schedule => {
          // Map form frequency values to property mapper frequency values
          let frequency: 'one_time' | 'recurring' = 'one_time';
          let recurringPeriod: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | undefined = undefined;
          
          if (schedule.frequency === 'custom') {
            frequency = 'one_time';
          } else {
            frequency = 'recurring';
            // Map form frequency values to property mapper recurringPeriod values
            switch (schedule.frequency) {
              case 'monthly':
                recurringPeriod = 'monthly';
                break;
              case 'quarterly':
                recurringPeriod = 'quarterly';
                break;
              case 'annually':
                recurringPeriod = 'annual';
                break;
            }
          }
          
          // Return a compatible payment schedule object
          return {
            ...schedule,
            frequency,
            recurringPeriod
          };
        });
      }
    };
    
    return compatibleData;
  };

  // Render step content
  const renderStepContent = () => {
    const step = formSteps[currentStep];
    
    switch (step.id) {
      case 'basic':
        return (
          <BasicPropertiesStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            showDecimals={true}
            additionalFields={[
              {
                name: 'baseUri',
                label: 'Base URI',
                type: 'url',
                placeholder: 'https://example.com/metadata/',
                description: 'Base URI for token metadata',
                required: true
              },
              {
                name: 'valueDecimals',
                label: 'Value Decimals',
                type: 'number',
                placeholder: '0',
                description: 'Decimal places for token values',
                min: 0,
                max: 18
              }
            ]}
          />
        );
      
      case 'features':
        return (
          <TokenConfigStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            configMode={configMode}
            additionalFields={[
              {
                name: 'slotType',
                label: 'Slot Type',
                type: 'select',
                options: [
                  { value: 'generic', label: 'Generic' },
                  { value: 'time', label: 'Time-based' },
                  { value: 'category', label: 'Category-based' },
                  { value: 'financial', label: 'Financial' }
                ],
                description: 'Type of slot categorization'
              }
            ]}
            additionalToggles={[
              { name: 'slotApprovals', label: 'Slot Approvals', description: 'Enable approval mechanism for slot transfers' },
              { name: 'valueApprovals', label: 'Value Approvals', description: 'Enable approval mechanism for value transfers' },
              { name: 'updatableUris', label: 'Updatable URIs', description: 'Allow metadata URI updates' },
              { name: 'updatableSlots', label: 'Updatable Slots', description: 'Allow slot configuration updates' },
              { name: 'valueTransfersEnabled', label: 'Value Transfers', description: 'Enable value transfers between tokens' },
              { name: 'mergable', label: 'Mergeable', description: 'Allow tokens to be merged' },
              { name: 'splittable', label: 'Splittable', description: 'Allow tokens to be split' }
            ]}
          />
        );
      
      case 'slots':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Slot Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Define token slots and their properties
                </p>
              </div>
              <Button onClick={addSlotConfiguration} variant="outline" size="sm">
                Add Slot
              </Button>
            </div>
            
            <div className="space-y-4">
              {formData.slotConfigurations?.map((slot, index) => (
                <Card key={slot.slotId}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Slot {index + 1}</CardTitle>
                      <Button 
                        onClick={() => removeSlotConfiguration(slot.slotId)}
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <input
                          type="text"
                          value={slot.name}
                          onChange={(e) => {
                            const updatedSlots = formData.slotConfigurations?.map(s => 
                              s.slotId === slot.slotId ? { ...s, name: e.target.value } : s
                            ) || [];
                            handleArrayConfigChange('slotConfigurations', updatedSlots);
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="Slot name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Value Units</label>
                        <input
                          type="text"
                          value={(slot as any).valueUnits || ''}
                          onChange={(e) => {
                            const updatedSlots = formData.slotConfigurations?.map(s => 
                              s.slotId === slot.slotId ? { ...s, valueUnits: e.target.value } : s
                            ) || [];
                            handleArrayConfigChange('slotConfigurations', updatedSlots);
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="e.g., USD, shares, points"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={slot.description || ''}
                        onChange={(e) => {
                          const updatedSlots = formData.slotConfigurations?.map(s => 
                            s.slotId === slot.slotId ? { ...s, description: e.target.value } : s
                          ) || [];
                          handleArrayConfigChange('slotConfigurations', updatedSlots);
                        }}
                        className="w-full p-2 border rounded-md"
                        rows={2}
                        placeholder="Slot description"
                      />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={slot.isTransferable || false}
                          onChange={(e) => {
                            const updatedSlots = formData.slotConfigurations?.map(s => 
                              s.slotId === slot.slotId ? { ...s, isTransferable: e.target.checked } : s
                            ) || [];
                            handleArrayConfigChange('slotConfigurations', updatedSlots);
                          }}
                        />
                        <span className="text-sm">Transferable</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={(slot as any).mergeable || false}
                          onChange={(e) => {
                            const updatedSlots = formData.slotConfigurations?.map(s => 
                              s.slotId === slot.slotId ? { ...s, mergeable: e.target.checked } : s
                            ) || [];
                            handleArrayConfigChange('slotConfigurations', updatedSlots);
                          }}
                        />
                        <span className="text-sm">Mergeable</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={(slot as any).splittable || false}
                          onChange={(e) => {
                            const updatedSlots = formData.slotConfigurations?.map(s => 
                              s.slotId === slot.slotId ? { ...s, splittable: e.target.checked } : s
                            ) || [];
                            handleArrayConfigChange('slotConfigurations', updatedSlots);
                          }}
                        />
                        <span className="text-sm">Splittable</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!formData.slotConfigurations || formData.slotConfigurations.length === 0) && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <p>No slots configured yet. Click "Add Slot" to create your first slot.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      
      case 'financial':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Financial Instruments</h3>
                <p className="text-sm text-muted-foreground">
                  Configure financial products and payment schedules
                </p>
              </div>
              <Button onClick={addFinancialInstrument} variant="outline" size="sm">
                Add Instrument
              </Button>
            </div>
            
            <div className="space-y-4">
              {formData.financialInstruments?.map((instrument, index) => (
                <Card key={instrument.instrumentId}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Instrument {index + 1}</CardTitle>
                      <Button 
                        onClick={() => {
                          const updatedInstruments = formData.financialInstruments?.filter(
                            i => i.instrumentId !== instrument.instrumentId
                          ) || [];
                          handleArrayConfigChange('financialInstruments', updatedInstruments);
                        }}
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <input
                          type="text"
                          value={instrument.name}
                          onChange={(e) => {
                            const updatedInstruments = formData.financialInstruments?.map(i => 
                              i.instrumentId === instrument.instrumentId ? { ...i, name: e.target.value } : i
                            ) || [];
                            handleArrayConfigChange('financialInstruments', updatedInstruments);
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="Instrument name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <select
                          value={instrument.instrumentType}
                          onChange={(e) => {
                            const updatedInstruments = formData.financialInstruments?.map(i => 
                              i.instrumentId === instrument.instrumentId ? { ...i, instrumentType: e.target.value as any } : i
                            ) || [];
                            handleArrayConfigChange('financialInstruments', updatedInstruments);
                          }}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="bond">Bond</option>
                          <option value="loan">Loan</option>
                          <option value="derivative">Derivative</option>
                          <option value="structured_product">Structured Product</option>
                          <option value="insurance">Insurance</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={instrument.description || ''}
                        onChange={(e) => {
                          const updatedInstruments = formData.financialInstruments?.map(i => 
                            i.instrumentId === instrument.instrumentId ? { ...i, description: e.target.value } : i
                          ) || [];
                          handleArrayConfigChange('financialInstruments', updatedInstruments);
                        }}
                        className="w-full p-2 border rounded-md"
                        rows={2}
                        placeholder="Instrument description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Underlying Asset</label>
                        <input
                          type="text"
                          value={instrument.underlyingAsset || ''}
                          onChange={(e) => {
                            const updatedInstruments = formData.financialInstruments?.map(i => 
                              i.instrumentId === instrument.instrumentId ? { ...i, underlyingAsset: e.target.value } : i
                            ) || [];
                            handleArrayConfigChange('financialInstruments', updatedInstruments);
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="e.g., ETH, BTC, AAPL"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Yield Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={instrument.yieldRate || ''}
                          onChange={(e) => {
                            const updatedInstruments = formData.financialInstruments?.map(i => 
                              i.instrumentId === instrument.instrumentId ? { ...i, yieldRate: e.target.value } : i
                            ) || [];
                            handleArrayConfigChange('financialInstruments', updatedInstruments);
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="e.g., 5.5"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!formData.financialInstruments || formData.financialInstruments.length === 0) && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <p>No financial instruments configured yet. Click "Add Instrument" to create your first instrument.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      
      case 'governance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Governance & Rewards Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Set up governance features, royalties, and staking rewards
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Royalty Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Royalty Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.royaltyConfig?.enabled || false}
                      onChange={(e) => {
                        handleConfigChange('royaltyConfig', {
                          ...formData.royaltyConfig,
                          enabled: e.target.checked
                        });
                      }}
                    />
                    <span className="text-sm">Enable Royalties</span>
                  </label>
                  
                  {formData.royaltyConfig?.enabled && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Percentage (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          max="10"
                          value={formData.royaltyConfig?.percentage || ''}
                          onChange={(e) => {
                            handleConfigChange('royaltyConfig', {
                              ...formData.royaltyConfig,
                              percentage: parseFloat(e.target.value) || 0
                            });
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="2.5"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Recipient Address</label>
                        <input
                          type="text"
                          value={formData.royaltyConfig?.recipient || ''}
                          onChange={(e) => {
                            handleConfigChange('royaltyConfig', {
                              ...formData.royaltyConfig,
                              recipient: e.target.value
                            });
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="0x..."
                        />
                      </div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.royaltyConfig?.perpetual || false}
                          onChange={(e) => {
                            handleConfigChange('royaltyConfig', {
                              ...formData.royaltyConfig,
                              perpetual: e.target.checked
                            });
                          }}
                        />
                        <span className="text-sm">Perpetual Royalties</span>
                      </label>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Governance Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Governance Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.governanceConfig?.enabled || false}
                      onChange={(e) => {
                        handleConfigChange('governanceConfig', {
                          ...formData.governanceConfig,
                          enabled: e.target.checked
                        });
                      }}
                    />
                    <span className="text-sm">Enable Governance</span>
                  </label>
                  
                  {formData.governanceConfig?.enabled && (
                    <>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.governanceConfig?.votingRights || false}
                          onChange={(e) => {
                            handleConfigChange('governanceConfig', {
                              ...formData.governanceConfig,
                              votingRights: e.target.checked
                            });
                          }}
                        />
                        <span className="text-sm">Voting Rights</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.governanceConfig?.proposalRights || false}
                          onChange={(e) => {
                            handleConfigChange('governanceConfig', {
                              ...formData.governanceConfig,
                              proposalRights: e.target.checked
                            });
                          }}
                        />
                        <span className="text-sm">Proposal Rights</span>
                      </label>
                      <div>
                        <label className="text-sm font-medium">Quorum (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.governanceConfig?.quorum || ''}
                          onChange={(e) => {
                            handleConfigChange('governanceConfig', {
                              ...formData.governanceConfig,
                              quorum: parseInt(e.target.value) || 0
                            });
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="51"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Staking Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Staking Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.stakingConfig?.enabled || false}
                      onChange={(e) => {
                        handleConfigChange('stakingConfig', {
                          ...formData.stakingConfig,
                          enabled: e.target.checked
                        });
                      }}
                    />
                    <span className="text-sm">Enable Staking</span>
                  </label>
                  
                  {formData.stakingConfig?.enabled && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Staking Rewards (APY %)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.stakingConfig?.stakingRewards || ''}
                          onChange={(e) => {
                            handleConfigChange('stakingConfig', {
                              ...formData.stakingConfig,
                              stakingRewards: e.target.value
                            });
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="5.0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Lockup Period (days)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.stakingConfig?.lockupPeriod || ''}
                          onChange={(e) => {
                            handleConfigChange('stakingConfig', {
                              ...formData.stakingConfig,
                              lockupPeriod: parseInt(e.target.value) || 0
                            });
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="30"
                        />
                      </div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.stakingConfig?.compoundingEnabled || false}
                          onChange={(e) => {
                            handleConfigChange('stakingConfig', {
                              ...formData.stakingConfig,
                              compoundingEnabled: e.target.checked
                            });
                          }}
                        />
                        <span className="text-sm">Auto-Compounding</span>
                      </label>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Enhanced ERC-3525 Semi-Fungible Token Configuration
            <Badge variant={useAdvancedConfig ? "default" : "secondary"}>
              {useAdvancedConfig ? "Advanced" : "Basic"} Mode
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure your ERC-3525 semi-fungible token with slot management, value transfers, and financial instruments
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress Indicator */}
      <ProgressIndicator
        steps={formSteps}
        currentStep={currentStep}
        onStepClick={handleStepChange}
      />

      {/* Validation Summary */}
      <ValidationSummary
        validationResult={validationResult}
        errors={errors}
        warnings={warnings}
      />

      {/* Main Form Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="flex justify-between items-center p-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep < formSteps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || Object.keys(errors).length > 0}
              >
                {isLoading ? 'Saving...' : 'Save Token'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Preview (Advanced Mode) */}
      {useAdvancedConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Preview</CardTitle>
            <CardDescription>
              Review your semi-fungible token configuration before saving
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="slots">Slots</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="governance">Governance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {formData.name || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Symbol:</span> {formData.symbol || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Decimals:</span> {formData.decimals}
                  </div>
                  <div>
                    <span className="font-medium">Value Decimals:</span> {formData.valueDecimals}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Base URI:</span> {formData.baseUri || 'Not set'}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {formData.valueTransfersEnabled ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Value Transfers
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.mergable ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Mergeable
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.splittable ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Splittable
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.slotApprovals ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Slot Approvals
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.valueApprovals ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Value Approvals
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.updatableUris ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Updatable URIs
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="slots" className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Slot Count:</span> {formData.slotConfigurations?.length || 0}
                  </div>
                  <div>
                    <span className="font-medium">Slot Type:</span> {formData.slotType}
                  </div>
                  {formData.slotConfigurations?.map((slot, index) => (
                    <div key={slot.slotId} className="ml-4">
                      <span className="font-medium">Slot {index + 1}:</span> {slot.name}
                      {(slot as any).valueUnits && <span className="text-muted-foreground"> ({(slot as any).valueUnits})</span>}
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="financial" className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Financial Instruments:</span> {formData.financialInstruments?.length || 0}
                  </div>
                  {formData.financialInstruments?.map((instrument, index) => (
                    <div key={instrument.instrumentId} className="ml-4">
                      <span className="font-medium">{instrument.name}:</span> {instrument.instrumentType}
                      {instrument.yieldRate && <span className="text-muted-foreground"> ({instrument.yieldRate}% yield)</span>}
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="governance" className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Royalties:</span> {formData.royaltyConfig?.enabled ? `Enabled (${formData.royaltyConfig.percentage}%)` : 'Disabled'}
                  </div>
                  <div>
                    <span className="font-medium">Governance:</span> {formData.governanceConfig?.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                  <div>
                    <span className="font-medium">Staking:</span> {formData.stakingConfig?.enabled ? `Enabled (${formData.stakingConfig.stakingRewards}% APY)` : 'Disabled'}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ERC3525EditForm;
