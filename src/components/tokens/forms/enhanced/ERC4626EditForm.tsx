/**
 * Enhanced ERC4626 Edit Form
 * Supports JSONB configurations, multi-step architecture, and vault strategy features
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Clock, Settings, Shield, Users, DollarSign, TrendingUp } from 'lucide-react';

// Form Components
import BasicPropertiesStep from '../components/BasicPropertiesStep';
import TokenConfigStep from '../components/TokenConfigStep';
import ValidationSummary from '../components/ValidationSummary';
import ProgressIndicator from '../components/ProgressIndicator';

// Services and Types
import { erc4626Service } from '../../services/enhancedERC4626Service';
import { TokenERC4626Properties, TokenConfigMode, TokenStandard } from '@/types/core/centralModels';
import { validateERC4626Token } from '../../validation/schemas/erc4626';

// Define schema type locally since it's not exported
interface ERC4626SchemaType {
  config_mode?: 'min' | 'max';
  // Basic properties
  name?: string;
  symbol?: string;
  decimals?: number;
  assetAddress?: string;
  assetName?: string;
  assetSymbol?: string;
  assetDecimals?: number;
  vaultType?: string;
  // Add other base properties as needed
}

interface ERC4626EditFormProps {
  token: any;
  onSave?: (data: any) => Promise<void>;
  onSubmit?: (data: any) => Promise<void>;
  projectId?: string;
  validationPaused?: boolean;
  configMode?: TokenConfigMode;
  failedFields?: string[];
  isLoading?: boolean;
}

interface FormStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isComplete: boolean;
  hasErrors: boolean;
}

interface ERC4626FormData extends ERC4626SchemaType {
  standard: TokenStandard; // Use TokenStandard enum
  // Basic properties (required)
  name: string;
  symbol: string;
  decimals: number;
  assetAddress: string;
  assetName: string;
  assetSymbol: string;
  assetDecimals: number;
  vaultType: string;
  
  // Additional ERC4626 properties
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  customStrategy?: boolean;
  strategyController?: string;
  accessControl?: string;
  flashLoans?: boolean;
  emergencyShutdown?: boolean;
  yieldOptimizationEnabled?: boolean;
  automatedRebalancing?: boolean;
  depositLimit?: string;
  withdrawalLimit?: string;
  // Enhanced configurations for advanced mode
  vaultStrategies?: Array<{
    strategyId: string;
    name: string;
    description?: string;
    strategyType: 'lending' | 'custom' | 'yield_farming' | 'arbitrage' | 'market_making' | 'delta_neutral';
    targetApy?: string;
    riskLevel: 'low' | 'medium' | 'high';
    protocol?: string;
    active: boolean;
    allocation?: string; // percentage
    // Required properties for mapper compatibility
    targetAssets: string[]; // Make required
    allocationPercentage: string; // Make required
    isActive: boolean; // Make required (not optional)
    autoRebalance: boolean; // Make required (not optional)
  }>;
  assetAllocations?: Array<{
    asset: string;
    percentage: string;
    description?: string;
    protocol?: string;
    expectedApy?: string;
    riskRating?: 'low' | 'medium' | 'high';
    isActive: boolean;
  }>;
  performanceSettings?: {
    targetApy?: string;
    benchmarkIndex?: string;
    performanceFee?: string;
    highWaterMark?: boolean;
    rebalanceThreshold?: string;
    reportingFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  };
  feeTiers?: Array<{
    tierId: string;
    name: string;
    minAmount: string;
    managementFee: string;
    performanceFee: string;
    withdrawalFee: string;
    description?: string;
  }>;
  riskParameters?: {
    maxDrawdown?: string;
    volatilityTarget?: string;
    leverageLimit?: string;
    concentrationLimit?: string;
    stopLossThreshold?: string;
    rebalanceFrequency?: 'daily' | 'weekly' | 'monthly';
  };
  vaultGovernance?: {
    enabled: boolean;
    governanceToken?: string;
    votingPeriod?: number;
    quorumRequired?: string;
    proposalThreshold?: string;
  };
  emergencyFeatures?: {
    pauseEnabled: boolean;
    emergencyWithdrawal: boolean;
    circuitBreaker: boolean;
    adminMultisig?: string;
    emergencyDelay?: number; // hours
  };
}

const ERC4626EditForm: React.FC<ERC4626EditFormProps> = ({
  token,
  onSave,
  onSubmit,
  projectId,
  validationPaused = false,
  configMode = TokenConfigMode.MIN,
  failedFields = []
}) => {
  const [formData, setFormData] = useState<ERC4626FormData>({
    standard: TokenStandard.ERC4626, // Use enum value
    // Basic properties
    name: token.name || '',
    symbol: token.symbol || '',
    decimals: token.decimals || 18,
    
    // Core ERC4626 properties
    assetAddress: token.erc4626Properties?.assetAddress || '',
    assetName: token.erc4626Properties?.assetName || '',
    assetSymbol: token.erc4626Properties?.assetSymbol || '',
    assetDecimals: token.erc4626Properties?.assetDecimals || 18,
    vaultType: token.erc4626Properties?.vaultType || 'yield',
    
    // Basic features
    isMintable: token.erc4626Properties?.isMintable || false,
    isBurnable: token.erc4626Properties?.isBurnable || false,
    isPausable: token.erc4626Properties?.isPausable || false,
    customStrategy: token.erc4626Properties?.customStrategy || false,
    strategyController: token.erc4626Properties?.strategyController || '',
    accessControl: token.erc4626Properties?.accessControl || 'ownable',
    flashLoans: token.erc4626Properties?.flashLoans || false,
    emergencyShutdown: token.erc4626Properties?.emergencyShutdown || false,
    yieldOptimizationEnabled: token.erc4626Properties?.yieldOptimizationEnabled || false,
    automatedRebalancing: token.erc4626Properties?.automatedRebalancing || false,
    depositLimit: token.erc4626Properties?.depositLimit || '',
    withdrawalLimit: token.erc4626Properties?.withdrawalLimit || '',
    
    // Enhanced configurations (for advanced mode)
    vaultStrategies: token.erc4626Properties?.vaultStrategies || [],
    assetAllocations: token.erc4626Properties?.assetAllocations || [],
    performanceSettings: token.erc4626Properties?.performanceSettings || {},
    feeTiers: token.erc4626Properties?.feeTiers || [],
    riskParameters: token.erc4626Properties?.riskParameters || {},
    vaultGovernance: token.erc4626Properties?.vaultGovernance || { enabled: false },
    emergencyFeatures: token.erc4626Properties?.emergencyFeatures || { 
      pauseEnabled: false, 
      emergencyWithdrawal: false, 
      circuitBreaker: false 
    },
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<any>({ valid: true, errors: [] });
  
  // Type adapter function that creates a compatible version of the form data for the property mapper
  // This approach preserves the original form data structure while providing a compatible interface for validation
  const createMapperCompatibleData = (data: ERC4626FormData): any => {
    // Create a type that satisfies the property mapper's expected interface
    const compatibleData = {
      ...data,
      // Ensure standard is properly typed to match the expected TokenStandard enum
      standard: data.standard as any, // This handles the TokenStandard enum mismatch
      // Add a custom getter for assetAllocations that transforms the data on-the-fly
      get assetAllocations() {
        if (!data.assetAllocations || data.assetAllocations.length === 0) return undefined;
        
        return data.assetAllocations.map((allocation, index) => {
          // Return an object that matches the AssetAllocation interface
          return {
            allocationId: `allocation-${index}-${Date.now()}`,
            assetAddress: allocation.asset || '',
            assetSymbol: allocation.asset || '',
            targetPercentage: allocation.percentage || '0',
            currentPercentage: allocation.percentage || '0',
            minPercentage: '0',
            maxPercentage: '100',
            rebalanceBand: '5',
            lastRebalance: new Date().toISOString(),
            isCore: true,
            // Keep original properties for backward compatibility
            asset: allocation.asset,
            percentage: allocation.percentage,
            description: allocation.description,
            protocol: allocation.protocol,
            expectedApy: allocation.expectedApy,
            riskRating: allocation.riskRating,
            isActive: allocation.isActive
          };
        });
      }
    };
    
    return compatibleData;
  };

  // Define form steps based on configuration mode
  const getFormSteps = (): FormStep[] => {
    const basicSteps: FormStep[] = [
      {
        id: 'basic',
        title: 'Basic Properties',
        description: 'Define core vault token properties',
        icon: <Settings className="h-4 w-4" />,
        isComplete: !!(formData.name && formData.symbol && formData.assetAddress),
        hasErrors: !!(errors.name || errors.symbol || errors.assetAddress)
      },
      {
        id: 'vault',
        title: 'Vault Configuration',
        description: 'Configure vault type and asset properties',
        icon: <DollarSign className="h-4 w-4" />,
        isComplete: !!(formData.assetName && formData.assetSymbol),
        hasErrors: !!(errors.assetName || errors.assetSymbol || errors.vaultType)
      }
    ];

    if (configMode === TokenConfigMode.MAX) {
      basicSteps.push(
        {
          id: 'strategies',
          title: 'Vault Strategies',
          description: 'Configure investment strategies and allocations',
          icon: <TrendingUp className="h-4 w-4" />,
          isComplete: (formData.vaultStrategies?.length || 0) > 0,
          hasErrors: !!(errors.vaultStrategies)
        },
        {
          id: 'performance',
          title: 'Performance & Fees',
          description: 'Set up performance metrics and fee structures',
          icon: <Shield className="h-4 w-4" />,
          isComplete: true, // Optional
          hasErrors: !!(errors.performanceMetrics || errors.feeTiers)
        },
        {
          id: 'governance',
          title: 'Governance & Risk',
          description: 'Configure governance and risk management',
          icon: <Users className="h-4 w-4" />,
          isComplete: true, // Optional
          hasErrors: !!(errors.vaultGovernance || errors.riskParameters)
        }
      );
    }

    return basicSteps;
  };

  const [formSteps] = useState<FormStep[]>(getFormSteps());

  // Real-time validation
  useEffect(() => {
    if (!validationPaused) {
      // Create a compatible version of the form data for validation
      const compatibleData = createMapperCompatibleData(formData);
      const validation = validateERC4626Token(compatibleData, configMode === TokenConfigMode.MAX ? 'max' : 'min');
      setValidationResult(validation);
      
      if (!validation.isValid) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(validation.errors || {}).forEach(([field, fieldErrors]) => {
          if (Array.isArray(fieldErrors)) {
            fieldErrors[field] = fieldErrors[0];
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({});
      }
      
      setWarnings(Object.values(validation.warnings || {}).flat());
    }
  }, [formData, validationPaused, configMode]);

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

  // Add new vault strategy
  const addVaultStrategy = () => {
    const newStrategy = {
      strategyId: crypto.randomUUID(),
      name: `Strategy ${(formData.vaultStrategies?.length || 0) + 1}`,
      description: '',
      strategyType: 'lending' as const,
      riskLevel: 'medium' as const,
      active: true,
      allocation: '0',
      targetAssets: [], // Provide default empty array for required property
      allocationPercentage: '0', // Provide default value for required property
      isActive: true, // Provide default value for required property
      autoRebalance: false, // Provide default value for required property
    };
    
    const currentStrategies = formData.vaultStrategies || [];
    handleArrayConfigChange('vaultStrategies', [...currentStrategies, newStrategy]);
  };

  // Remove vault strategy
  const removeVaultStrategy = (strategyId: string) => {
    const currentStrategies = formData.vaultStrategies || [];
    const updatedStrategies = currentStrategies.filter(strategy => strategy.strategyId !== strategyId);
    handleArrayConfigChange('vaultStrategies', updatedStrategies);
  };

  // Add asset allocation
  const addAssetAllocation = () => {
    const newAllocation = {
      asset: '',
      percentage: '0',
      description: '',
      isActive: true,
      riskRating: 'medium' as const,
    };
    
    const currentAllocations = formData.assetAllocations || [];
    handleArrayConfigChange('assetAllocations', [...currentAllocations, newAllocation]);
  };

  // Add fee tier
  const addFeeTier = () => {
    const newTier = {
      tierId: crypto.randomUUID(),
      name: `Tier ${(formData.feeTiers?.length || 0) + 1}`,
      minAmount: '0',
      managementFee: '0',
      performanceFee: '0',
      withdrawalFee: '0',
      description: '',
    };
    
    const currentTiers = formData.feeTiers || [];
    handleArrayConfigChange('feeTiers', [...currentTiers, newTier]);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Create a compatible version of the form data for validation and submission
      const compatibleData = createMapperCompatibleData(formData);
      
      // Final validation
      const validation = validateERC4626Token(compatibleData, formData.config_mode);
      if (!validation.isValid) {
        setErrors({ general: 'Please fix validation errors before saving' });
        return;
      }

      // Save via enhanced service
      const result = await erc4626Service.updateTokenWithProperties(
        token.id,
        {}, // No token data updates for now
        compatibleData // Use compatible data for the service call
      );
      
      if (result.success && result.data) {
        if (onSave) {
          await onSave(result.data);
        } else if (onSubmit) {
          await onSubmit(result.data);
        }
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

  // Calculate total allocation percentage
  const getTotalAllocation = () => {
    return formData.assetAllocations?.reduce((total, allocation) => {
      return total + parseFloat(allocation.percentage || '0');
    }, 0) || 0;
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
                name: 'assetAddress',
                label: 'Underlying Asset Address',
                type: 'text',
                placeholder: '0x...',
                description: 'Contract address of the underlying asset',
                required: true
              }
            ]}
          />
        );
      
      case 'vault':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Vault Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure the underlying asset and vault type
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Asset Name</label>
                  <input
                    type="text"
                    value={formData.assetName || ''}
                    onChange={(e) => handleFieldChange('assetName', e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., Ethereum"
                    required
                  />
                  {errors.assetName && (
                    <p className="text-sm text-red-500 mt-1">{errors.assetName}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Asset Symbol</label>
                  <input
                    type="text"
                    value={formData.assetSymbol || ''}
                    onChange={(e) => handleFieldChange('assetSymbol', e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., ETH"
                    required
                  />
                  {errors.assetSymbol && (
                    <p className="text-sm text-red-500 mt-1">{errors.assetSymbol}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Asset Decimals</label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    value={formData.assetDecimals || 18}
                    onChange={(e) => handleFieldChange('assetDecimals', parseInt(e.target.value))}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Vault Type</label>
                  <select
                    value={formData.vaultType || 'yield'}
                    onChange={(e) => handleFieldChange('vaultType', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="yield">Yield Vault</option>
                    <option value="fund">Investment Fund</option>
                    <option value="staking">Staking Vault</option>
                    <option value="lending">Lending Vault</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Strategy Controller</label>
                  <input
                    type="text"
                    value={formData.strategyController || ''}
                    onChange={(e) => handleFieldChange('strategyController', e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="0x... (optional)"
                  />
                </div>
                
                <TokenConfigStep
                  formData={formData}
                  errors={errors}
                  onChange={handleFieldChange}
                  configMode={configMode}
                  additionalToggles={[
                    { name: 'flashLoans', label: 'Flash Loans', description: 'Enable flash loan functionality' },
                    { name: 'emergencyShutdown', label: 'Emergency Shutdown', description: 'Enable emergency shutdown capability' },
                    { name: 'performanceMetrics', label: 'Performance Tracking', description: 'Enable performance metrics tracking' },
                    { name: 'customStrategy', label: 'Custom Strategy', description: 'Use custom investment strategy' },
                    { name: 'yieldOptimizationEnabled', label: 'Yield Optimization', description: 'Enable automatic yield optimization' },
                    { name: 'automatedRebalancing', label: 'Auto Rebalancing', description: 'Enable automated portfolio rebalancing' }
                  ]}
                />
              </div>
            </div>
          </div>
        );
      
      case 'strategies':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Vault Strategies</h3>
                <p className="text-sm text-muted-foreground">
                  Configure investment strategies and asset allocations
                </p>
              </div>
              <Button onClick={addVaultStrategy} variant="outline" size="sm">
                Add Strategy
              </Button>
            </div>
            
            {/* Vault Strategies */}
            <div className="space-y-4">
              <h4 className="font-medium">Investment Strategies</h4>
              {formData.vaultStrategies?.map((strategy, index) => (
                <Card key={strategy.strategyId}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Strategy {index + 1}</CardTitle>
                      <Button 
                        onClick={() => removeVaultStrategy(strategy.strategyId)}
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
                        <label className="text-sm font-medium">Strategy Name</label>
                        <input
                          type="text"
                          value={strategy.name}
                          onChange={(e) => {
                            const updatedStrategies = formData.vaultStrategies?.map(s => 
                              s.strategyId === strategy.strategyId ? { ...s, name: e.target.value } : s
                            ) || [];
                            handleArrayConfigChange('vaultStrategies', updatedStrategies);
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="Strategy name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Strategy Type</label>
                        <select
                          value={strategy.strategyType}
                          onChange={(e) => {
                            const updatedStrategies = formData.vaultStrategies?.map(s => 
                              s.strategyId === strategy.strategyId ? { ...s, strategyType: e.target.value as any } : s
                            ) || [];
                            handleArrayConfigChange('vaultStrategies', updatedStrategies);
                          }}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="lending">Lending</option>
                          <option value="yield_farming">Yield Farming</option>
                          <option value="arbitrage">Arbitrage</option>
                          <option value="market_making">Market Making</option>
                          <option value="delta_neutral">Delta Neutral</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Target APY (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={strategy.targetApy || ''}
                          onChange={(e) => {
                            const updatedStrategies = formData.vaultStrategies?.map(s => 
                              s.strategyId === strategy.strategyId ? { ...s, targetApy: e.target.value } : s
                            ) || [];
                            handleArrayConfigChange('vaultStrategies', updatedStrategies);
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="5.0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Risk Level</label>
                        <select
                          value={strategy.riskLevel}
                          onChange={(e) => {
                            const updatedStrategies = formData.vaultStrategies?.map(s => 
                              s.strategyId === strategy.strategyId ? { ...s, riskLevel: e.target.value as any } : s
                            ) || [];
                            handleArrayConfigChange('vaultStrategies', updatedStrategies);
                          }}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Allocation (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={strategy.allocation || ''}
                          onChange={(e) => {
                            const updatedStrategies = formData.vaultStrategies?.map(s => 
                              s.strategyId === strategy.strategyId ? { ...s, allocation: e.target.value } : s
                            ) || [];
                            handleArrayConfigChange('vaultStrategies', updatedStrategies);
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="25.0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={strategy.description || ''}
                        onChange={(e) => {
                          const updatedStrategies = formData.vaultStrategies?.map(s => 
                            s.strategyId === strategy.strategyId ? { ...s, description: e.target.value } : s
                          ) || [];
                          handleArrayConfigChange('vaultStrategies', updatedStrategies);
                        }}
                        className="w-full p-2 border rounded-md"
                        rows={2}
                        placeholder="Strategy description"
                      />
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={strategy.active}
                        onChange={(e) => {
                          const updatedStrategies = formData.vaultStrategies?.map(s => 
                            s.strategyId === strategy.strategyId ? { ...s, active: e.target.checked } : s
                          ) || [];
                          handleArrayConfigChange('vaultStrategies', updatedStrategies);
                        }}
                      />
                      <span className="text-sm">Active Strategy</span>
                    </label>
                  </CardContent>
                </Card>
              ))}
              
              {(!formData.vaultStrategies || formData.vaultStrategies.length === 0) && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <p>No strategies configured yet. Click "Add Strategy" to create your first strategy.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Asset Allocations */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Asset Allocations</h4>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Total: {getTotalAllocation().toFixed(1)}%
                  </span>
                  <Button onClick={addAssetAllocation} variant="outline" size="sm">
                    Add Asset
                  </Button>
                </div>
              </div>
              
              {formData.assetAllocations?.map((allocation, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="text-sm font-medium">Asset Address</label>
                        <input
                          type="text"
                          value={allocation.asset}
                          onChange={(e) => {
                            const updatedAllocations = formData.assetAllocations?.map((a, i) => 
                              i === index ? { ...a, asset: e.target.value } : a
                            ) || [];
                            handleArrayConfigChange('assetAllocations', updatedAllocations);
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="0x..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Percentage (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={allocation.percentage}
                          onChange={(e) => {
                            const updatedAllocations = formData.assetAllocations?.map((a, i) => 
                              i === index ? { ...a, percentage: e.target.value } : a
                            ) || [];
                            handleArrayConfigChange('assetAllocations', updatedAllocations);
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="25.0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Expected APY (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={allocation.expectedApy || ''}
                          onChange={(e) => {
                            const updatedAllocations = formData.assetAllocations?.map((a, i) => 
                              i === index ? { ...a, expectedApy: e.target.value } : a
                            ) || [];
                            handleArrayConfigChange('assetAllocations', updatedAllocations);
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="5.0"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          const updatedAllocations = formData.assetAllocations?.filter((_, i) => i !== index) || [];
                          handleArrayConfigChange('assetAllocations', updatedAllocations);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getTotalAllocation() !== 100 && formData.assetAllocations && formData.assetAllocations.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Asset allocations should sum to 100%. Currently: {getTotalAllocation().toFixed(1)}%
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        );
      
      case 'performance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Performance & Fee Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Set up performance tracking and fee structures
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Target APY (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.performanceSettings?.targetApy || ''}
                      onChange={(e) => {
                        handleConfigChange('performanceSettings', {
                          ...formData.performanceSettings,
                          targetApy: e.target.value
                        });
                      }}
                      className="w-full p-2 border rounded-md"
                      placeholder="8.0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Benchmark Index</label>
                    <input
                      type="text"
                      value={formData.performanceSettings?.benchmarkIndex || ''}
                      onChange={(e) => {
                        handleConfigChange('performanceSettings', {
                          ...formData.performanceSettings,
                          benchmarkIndex: e.target.value
                        });
                      }}
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., DeFi Pulse Index"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reporting Frequency</label>
                    <select
                      value={formData.performanceSettings?.reportingFrequency || 'monthly'}
                      onChange={(e) => {
                        handleConfigChange('performanceSettings', {
                          ...formData.performanceSettings,
                          reportingFrequency: e.target.value
                        });
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.performanceSettings?.highWaterMark || false}
                      onChange={(e) => {
                        handleConfigChange('performanceSettings', {
                          ...formData.performanceSettings,
                          highWaterMark: e.target.checked
                        });
                      }}
                    />
                    <span className="text-sm">High Water Mark</span>
                  </label>
                </CardContent>
              </Card>

              {/* Fee Tiers */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">Fee Tiers</CardTitle>
                    <Button onClick={addFeeTier} variant="outline" size="sm">
                      Add Tier
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.feeTiers?.map((tier, index) => (
                    <div key={tier.tierId} className="p-3 border rounded-md space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{tier.name}</span>
                        <Button
                          onClick={() => {
                            const updatedTiers = formData.feeTiers?.filter(t => t.tierId !== tier.tierId) || [];
                            handleArrayConfigChange('feeTiers', updatedTiers);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label>Min Amount</label>
                          <input
                            type="text"
                            value={tier.minAmount}
                            onChange={(e) => {
                              const updatedTiers = formData.feeTiers?.map(t => 
                                t.tierId === tier.tierId ? { ...t, minAmount: e.target.value } : t
                              ) || [];
                              handleArrayConfigChange('feeTiers', updatedTiers);
                            }}
                            className="w-full p-1 border rounded text-xs"
                            placeholder="1000"
                          />
                        </div>
                        <div>
                          <label>Management Fee (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={tier.managementFee}
                            onChange={(e) => {
                              const updatedTiers = formData.feeTiers?.map(t => 
                                t.tierId === tier.tierId ? { ...t, managementFee: e.target.value } : t
                              ) || [];
                              handleArrayConfigChange('feeTiers', updatedTiers);
                            }}
                            className="w-full p-1 border rounded text-xs"
                            placeholder="2.0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!formData.feeTiers || formData.feeTiers.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center">
                      No fee tiers configured
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case 'governance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Governance & Risk Management</h3>
              <p className="text-sm text-muted-foreground">
                Configure governance features and risk parameters
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vault Governance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Vault Governance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.vaultGovernance?.enabled || false}
                      onChange={(e) => {
                        handleConfigChange('vaultGovernance', {
                          ...formData.vaultGovernance,
                          enabled: e.target.checked
                        });
                      }}
                    />
                    <span className="text-sm">Enable Governance</span>
                  </label>
                  
                  {formData.vaultGovernance?.enabled && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Governance Token</label>
                        <input
                          type="text"
                          value={formData.vaultGovernance?.governanceToken || ''}
                          onChange={(e) => {
                            handleConfigChange('vaultGovernance', {
                              ...formData.vaultGovernance,
                              governanceToken: e.target.value
                            });
                          }}
                          className="w-full p-2 border rounded-md"
                          placeholder="0x..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Quorum Required (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.vaultGovernance?.quorumRequired || ''}
                          onChange={(e) => {
                            handleConfigChange('vaultGovernance', {
                              ...formData.vaultGovernance,
                              quorumRequired: e.target.value
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

              {/* Risk Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Risk Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Max Drawdown (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      max="100"
                      value={formData.riskParameters?.maxDrawdown || ''}
                      onChange={(e) => {
                        handleConfigChange('riskParameters', {
                          ...formData.riskParameters,
                          maxDrawdown: e.target.value
                        });
                      }}
                      className="w-full p-2 border rounded-md"
                      placeholder="20.0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Volatility Target (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.riskParameters?.volatilityTarget || ''}
                      onChange={(e) => {
                        handleConfigChange('riskParameters', {
                          ...formData.riskParameters,
                          volatilityTarget: e.target.value
                        });
                      }}
                      className="w-full p-2 border rounded-md"
                      placeholder="15.0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Leverage Limit</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={formData.riskParameters?.leverageLimit || ''}
                      onChange={(e) => {
                        handleConfigChange('riskParameters', {
                          ...formData.riskParameters,
                          leverageLimit: e.target.value
                        });
                      }}
                      className="w-full p-2 border rounded-md"
                      placeholder="3.0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rebalance Frequency</label>
                    <select
                      value={formData.riskParameters?.rebalanceFrequency || 'weekly'}
                      onChange={(e) => {
                        handleConfigChange('riskParameters', {
                          ...formData.riskParameters,
                          rebalanceFrequency: e.target.value
                        });
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Features */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Emergency Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.emergencyFeatures?.pauseEnabled || false}
                        onChange={(e) => {
                          handleConfigChange('emergencyFeatures', {
                            ...formData.emergencyFeatures,
                            pauseEnabled: e.target.checked
                          });
                        }}
                      />
                      <span className="text-sm">Pause Enabled</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.emergencyFeatures?.emergencyWithdrawal || false}
                        onChange={(e) => {
                          handleConfigChange('emergencyFeatures', {
                            ...formData.emergencyFeatures,
                            emergencyWithdrawal: e.target.checked
                          });
                        }}
                      />
                      <span className="text-sm">Emergency Withdrawal</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.emergencyFeatures?.circuitBreaker || false}
                        onChange={(e) => {
                          handleConfigChange('emergencyFeatures', {
                            ...formData.emergencyFeatures,
                            circuitBreaker: e.target.checked
                          });
                        }}
                      />
                      <span className="text-sm">Circuit Breaker</span>
                    </label>
                    <div>
                      <label className="text-sm font-medium">Emergency Delay (hours)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.emergencyFeatures?.emergencyDelay || ''}
                        onChange={(e) => {
                          handleConfigChange('emergencyFeatures', {
                            ...formData.emergencyFeatures,
                            emergencyDelay: parseInt(e.target.value) || 0
                          });
                        }}
                        className="w-full p-2 border rounded-md"
                        placeholder="24"
                      />
                    </div>
                  </div>
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
            Enhanced ERC-4626 Vault Token Configuration
            <Badge variant={configMode === TokenConfigMode.MAX ? "default" : "secondary"}>
              {configMode === TokenConfigMode.MAX ? "Advanced" : "Basic"} Mode
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure your ERC-4626 tokenized vault with strategies, allocations, performance metrics, and risk management
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
      {configMode === TokenConfigMode.MAX && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Preview</CardTitle>
            <CardDescription>
              Review your vault token configuration before saving
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="vault">Vault</TabsTrigger>
                <TabsTrigger value="strategies">Strategies</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="governance">Governance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Token Name:</span> {formData.name || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Token Symbol:</span> {formData.symbol || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Asset Address:</span> {formData.assetAddress || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Vault Type:</span> {formData.vaultType}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="vault" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Asset:</span> {formData.assetName} ({formData.assetSymbol})
                  </div>
                  <div>
                    <span className="font-medium">Asset Decimals:</span> {formData.assetDecimals}
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.flashLoans ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Flash Loans
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.yieldOptimizationEnabled ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Yield Optimization
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="strategies" className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Strategies:</span> {formData.vaultStrategies?.length || 0}
                  </div>
                  <div>
                    <span className="font-medium">Asset Allocations:</span> {formData.assetAllocations?.length || 0} (Total: {getTotalAllocation().toFixed(1)}%)
                  </div>
                  {formData.vaultStrategies?.map((strategy, index) => (
                    <div key={strategy.strategyId} className="ml-4">
                      <span className="font-medium">{strategy.name}:</span> {strategy.strategyType}
                      {strategy.targetApy && <span className="text-muted-foreground"> ({strategy.targetApy}% target)</span>}
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Target APY:</span> {formData.performanceSettings?.targetApy || 'Not set'}%
                  </div>
                  <div>
                    <span className="font-medium">Fee Tiers:</span> {formData.feeTiers?.length || 0}
                  </div>
                  <div>
                    <span className="font-medium">High Water Mark:</span> {formData.performanceSettings?.highWaterMark ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="governance" className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Governance:</span> {formData.vaultGovernance?.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                  <div>
                    <span className="font-medium">Max Drawdown:</span> {formData.riskParameters?.maxDrawdown || 'Not set'}%
                  </div>
                  <div>
                    <span className="font-medium">Emergency Features:</span> {[
                      formData.emergencyFeatures?.pauseEnabled && 'Pause',
                      formData.emergencyFeatures?.emergencyWithdrawal && 'Emergency Withdrawal',
                      formData.emergencyFeatures?.circuitBreaker && 'Circuit Breaker'
                    ].filter(Boolean).join(', ') || 'None'}
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

export default ERC4626EditForm;
