/**
 * Enhanced ERC20 Edit Form
 * Supports JSONB configurations, multi-step architecture, and relationship management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Clock, Settings, Shield, Users, Zap } from 'lucide-react';

// Form Components
import BasicPropertiesStep from '../components/BasicPropertiesStep';
import TokenConfigStep from '../components/TokenConfigStep';
import ComplianceConfigStep from '../components/ComplianceConfigStep';
import ValidationSummary from '../components/ValidationSummary';
import ProgressIndicator from '../components/ProgressIndicator';

// Services and Types
import { erc20Service } from '../../services/enhancedERC20Service';
import { TokenERC20Properties, TokenConfigMode, TokenStandard } from '@/types/core/centralModels';
import { erc20MinSchema, erc20MaxSchema } from '../../validation/schemas/erc20';
import { z } from 'zod';

// Utility Functions
import { ERC20PropertyMapper } from '../../utils/mappers/erc20/erc20PropertyMapper';
import { FailedSaveField } from '../../utils/saveStateComparison';

interface ERC20EditFormProps {
  token: any;
  onSave: (data: any) => Promise<void>;
  validationPaused?: boolean;
  configMode?: TokenConfigMode;
  useAdvancedConfig?: boolean;
  failedFields?: FailedSaveField[];
}

interface FormStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isComplete: boolean;
  hasErrors: boolean;
}

type ERC20SchemaType = z.infer<typeof erc20MinSchema>;

interface ERC20FormData extends ERC20SchemaType {
  standard: TokenStandard; // Use TokenStandard enum
  // Basic token properties
  name?: string;
  symbol?: string;
  decimals?: number;
  
  // Additional token properties
  tokenType?: string;
  allowManagement?: boolean;
  snapshot?: boolean;
  
  // Enhanced configurations for advanced mode
  transferConfig?: {
    enabled: boolean; // Make enabled required
    maxTransferAmount?: string;
    transferCooldown?: number;
    restrictedAddresses?: string[];
    transferFee?: {
      percentage?: number;
      recipient?: string;
    };
  };
  gasConfig?: {
    optimization: 'standard' | 'aggressive' | 'minimal';
    gasOptimization?: boolean;
    gasLimit?: string;
    priorityFee?: string;
  };
  complianceConfig?: {
    kycRequired: boolean; // Make required to match mapper
    amlChecks: boolean; // Make required to match mapper
    jurisdictionRestrictions?: string[];
    sanctionsChecking?: boolean;
    maxHolders?: number;
  };
  whitelistConfig?: {
    enabled: boolean; // Make required to match mapper
    addresses: string[]; // Make required to match mapper  
    merkleRoot?: string;
    autoApproval?: boolean;
  };
  governanceConfig?: {
    governanceToken?: boolean;
    votingDelay?: number;
    votingPeriod?: number;
    quorum?: number;
  };
  vestingConfig?: {
    vestingSchedules?: Array<{
      beneficiary: string;
      amount: string;
      startTime: number;
      duration: number;
      cliffPeriod?: number;
    }>;
  };
}

const ERC20EditForm: React.FC<ERC20EditFormProps> = ({
  token,
  onSave,
  validationPaused = false,
  configMode = TokenConfigMode.MIN,
  useAdvancedConfig = false
}) => {
  const [formData, setFormData] = useState<ERC20FormData>({
    standard: TokenStandard.ERC20, // Use enum value
    // Basic properties
    name: token.name || '',
    symbol: token.symbol || '',
    decimals: token.decimals || 18,
    initialSupply: token.erc20Properties?.initialSupply || '1000000',
    cap: token.erc20Properties?.cap || '',
    
    // Basic features
    isMintable: token.erc20Properties?.isMintable || false,
    isBurnable: token.erc20Properties?.isBurnable || false,
    isPausable: token.erc20Properties?.isPausable || false,
    
    // Advanced properties
    tokenType: token.erc20Properties?.tokenType || 'utility',
    allowManagement: token.erc20Properties?.allowManagement || false,
    snapshot: token.erc20Properties?.snapshot || false,
    
    // Enhanced configurations (for advanced mode)
    transferConfig: {
      enabled: token.erc20Properties?.transferConfig?.enabled || false,
      ...token.erc20Properties?.transferConfig
    },
    gasConfig: {
      optimization: token.erc20Properties?.gasConfig?.optimization || 'standard',
      gasOptimization: token.erc20Properties?.gasConfig?.gasOptimization || false,
      ...token.erc20Properties?.gasConfig
    },
    complianceConfig: {
      kycRequired: token.erc20Properties?.complianceConfig?.kycRequired || false,
      amlChecks: token.erc20Properties?.complianceConfig?.amlChecks || false,
      ...token.erc20Properties?.complianceConfig
    },
    whitelistConfig: {
      enabled: token.erc20Properties?.whitelistConfig?.enabled || false,
      addresses: token.erc20Properties?.whitelistConfig?.addresses || [],
      ...token.erc20Properties?.whitelistConfig
    },
    governanceConfig: token.erc20Properties?.governanceConfig || {},
    vestingConfig: token.erc20Properties?.vestingConfig || {},
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
        description: 'Define core token properties',
        icon: <Settings className="h-4 w-4" />,
        isComplete: !!(formData.name && formData.symbol),
        hasErrors: !!(errors.name || errors.symbol)
      },
      {
        id: 'features',
        title: 'Token Features',
        description: 'Configure token capabilities',
        icon: <Zap className="h-4 w-4" />,
        isComplete: true, // Optional features
        hasErrors: !!(errors.initialSupply || errors.cap)
      }
    ];

    if (useAdvancedConfig) {
      basicSteps.push(
        {
          id: 'compliance',
          title: 'Compliance & Security',
          description: 'Set up compliance rules and security features',
          icon: <Shield className="h-4 w-4" />,
          isComplete: true, // Optional
          hasErrors: !!(errors.transferConfig || errors.complianceConfig)
        },
        {
          id: 'governance',
          title: 'Governance & Vesting',
          description: 'Configure governance and token distribution',
          icon: <Users className="h-4 w-4" />,
          isComplete: true, // Optional
          hasErrors: !!(errors.governanceConfig || errors.vestingConfig)
        }
      );
    }

    return basicSteps;
  };

  const [formSteps] = useState<FormStep[]>(getFormSteps());
  const [propertyMapper] = useState(new ERC20PropertyMapper());

  // Real-time validation
  useEffect(() => {
    if (!validationPaused) {
      const validation = propertyMapper.validate(formData);
      setValidationResult(validation);
      
      if (!validation.valid) {
        const fieldErrors: Record<string, string> = {};
        validation.errors?.forEach((error: string) => {
          // Map validation errors to specific fields
          if (error.includes('name')) fieldErrors.name = error;
          if (error.includes('symbol')) fieldErrors.symbol = error;
          if (error.includes('initialSupply')) fieldErrors.initialSupply = error;
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

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Final validation
      const validation = propertyMapper.validate(formData);
      if (!validation.valid) {
        setErrors({ general: 'Please fix validation errors before saving' });
        return;
      }

      // Save via enhanced service
      const result = await erc20Service.updateTokenWithProperties(
        token.id,
        {}, // No token data updates for now
        formData // Properties data
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
          />
        );
      
      case 'features':
        return (
          <TokenConfigStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            configMode={configMode}
          />
        );
      
      case 'compliance':
        return (
          <ComplianceConfigStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            onConfigChange={handleConfigChange}
          />
        );
      
      case 'governance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Governance Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Set up governance features and token distribution schedules
              </p>
            </div>
            
            {/* Governance and vesting configuration will be implemented here */}
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Governance and vesting configuration coming soon
                </p>
              </CardContent>
            </Card>
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
            Enhanced ERC-20 Token Configuration
            <Badge variant={useAdvancedConfig ? "default" : "secondary"}>
              {useAdvancedConfig ? "Advanced" : "Basic"} Mode
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure your ERC-20 token with comprehensive features and compliance options
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
              Review your token configuration before saving
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
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
                    <span className="font-medium">Initial Supply:</span> {formData.initialSupply}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {formData.isMintable ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Mintable
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.isBurnable ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Burnable
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.isPausable ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Pausable
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="compliance" className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">KYC Required:</span> {formData.complianceConfig?.kycRequired ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Sanctions Checking:</span> {formData.complianceConfig?.sanctionsChecking ? 'Enabled' : 'Disabled'}
                  </div>
                  <div>
                    <span className="font-medium">Whitelist:</span> {formData.whitelistConfig?.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Gas Optimization:</span> {formData.gasConfig?.gasOptimization ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Governance Token:</span> {formData.governanceConfig?.governanceToken ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Transfer Config:</span> {formData.transferConfig?.enabled ? 'Enabled' : 'Disabled'}
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

export default ERC20EditForm;
