/**
 * Enhanced ERC1155 Edit Form
 * Supports multi-token features: token type configuration, batch operations, URI mappings, container functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Clock, Settings, Shield, Users, Zap, Layers, Package, DollarSign, Plus, Trash2, Grid3X3, Container } from 'lucide-react';

// Form Components
import BasicPropertiesStep from '../components/BasicPropertiesStep';
import TokenConfigStep from '../components/TokenConfigStep';
import ComplianceConfigStep from '../components/ComplianceConfigStep';
import ValidationSummary from '../components/ValidationSummary';
import ProgressIndicator from '../components/ProgressIndicator';

// Services and Types
import { erc1155Service } from '../../services/enhancedERC1155Service';
import { TokenERC1155Properties, TokenConfigMode, TokenStandard } from '@/types/core/centralModels';
import { validateERC1155Token } from '../../validation/schemas/erc1155';

interface ERC1155EditFormProps {
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

interface TokenType {
  id: string;
  name: string;
  description?: string;
  maxSupply?: string;
  fungibilityType: 'fungible' | 'non-fungible' | 'semi-fungible';
  rarityLevel?: 'common' | 'uncommon' | 'rare' | 'legendary';
  metadata?: Record<string, any>;
}

interface BatchConfig {
  enabled: boolean;
  maxBatchSize?: number;
  gasOptimization?: boolean;
  batchDiscounts?: Array<{
    quantity: number;
    discountPercentage: number;
  }>;
}

interface ContainerConfig {
  enabled: boolean;
  maxCapacity?: number;
  allowedTypes?: string[];
  containerFee?: string;
  unlockConditions?: Record<string, any>;
}

interface ERC1155FormData {
  config_mode: 'min' | 'max';
  standard: TokenStandard; // Use TokenStandard enum
  // Basic properties
  name: string;
  symbol: string;
  decimals: number; // Always 0 for ERC1155
  
  // Multi-token properties
  baseUri: string;
  metadataStorage: 'ipfs' | 'arweave' | 'centralized';
  supplyTracking: boolean;
  enableApprovalForAll: boolean;
  
  // Royalty configuration
  hasRoyalty: boolean;
  royaltyPercentage?: string; // Changed from number to string for consistency
  royaltyReceiver?: string;
  
  // Basic features
  isBurnable: boolean;
  isPausable: boolean;
  
  // Advanced multi-token features
  accessControl: 'ownable' | 'roles' | 'none';
  updatableUris: boolean;
  dynamicUris: boolean;
  batchMintingEnabled: boolean;
  containerEnabled: boolean;
  
  // Token types configuration
  tokenTypes: TokenType[];
  
  // Enhanced configurations (for advanced mode)
  batchMintingConfig?: BatchConfig;
  containerConfig?: ContainerConfig;
  dynamicUriConfig?: {
    enabled: boolean;
    baseUri?: string;
    revealable: boolean;
    preRevealUri?: string;
    revealTime?: string;
  };
  transferRestrictions?: {
    enabled: boolean;
    maxTransferAmount?: string;
    cooldownPeriod?: number;
    whitelistedOperators?: string[];
    blockedOperators?: string[];
  };
  batchTransferLimits?: {
    enabled: boolean;
    maxBatchSize?: number;
    dailyLimit?: string;
    requireApproval?: boolean;
  };
}

const ERC1155EditForm: React.FC<ERC1155EditFormProps> = ({
  token,
  onSave,
  validationPaused = false,
  configMode = TokenConfigMode.MIN,
  useAdvancedConfig = false
}) => {
  const [formData, setFormData] = useState<ERC1155FormData>({
    config_mode: configMode === TokenConfigMode.MAX ? 'max' : 'min',
    standard: TokenStandard.ERC1155, // Use enum value
    // Basic properties
    name: token.name || '',
    symbol: token.symbol || '',
    decimals: 0, // Always 0 for ERC1155
    
    // Multi-token properties
    baseUri: token.erc1155Properties?.baseUri || '',
    metadataStorage: token.erc1155Properties?.metadataStorage || 'ipfs',
    supplyTracking: token.erc1155Properties?.supplyTracking ?? true,
    enableApprovalForAll: token.erc1155Properties?.enableApprovalForAll ?? true,
    
    // Royalty configuration
    hasRoyalty: token.erc1155Properties?.hasRoyalty || false,
    royaltyPercentage: token.erc1155Properties?.royaltyPercentage?.toString() || '5', // Convert to string
    royaltyReceiver: token.erc1155Properties?.royaltyReceiver || '',
    
    // Basic features
    isBurnable: token.erc1155Properties?.isBurnable || false,
    isPausable: token.erc1155Properties?.isPausable || false,
    
    // Advanced features
    accessControl: token.erc1155Properties?.accessControl || 'ownable',
    updatableUris: token.erc1155Properties?.updatableUris || false,
    dynamicUris: token.erc1155Properties?.dynamicUris || false,
    batchMintingEnabled: token.erc1155Properties?.batchMintingEnabled || false,
    containerEnabled: token.erc1155Properties?.containerEnabled || false,
    
    // Token types
    tokenTypes: token.erc1155Types?.map((type: any) => ({
      id: type.tokenTypeId || type.id,
      name: type.name || '',
      description: type.description || '',
      maxSupply: type.maxSupply || '',
      fungibilityType: type.fungibilityType || 'non-fungible',
      rarityLevel: type.metadata?.rarityLevel || 'common',
      metadata: type.metadata || {}
    })) || [
      {
        id: '1',
        name: 'Token Type 1',
        fungibilityType: 'non-fungible' as const,
        rarityLevel: 'common' as const
      }
    ],
    
    // Enhanced configurations
    batchMintingConfig: token.erc1155Properties?.batchMintingConfig || { enabled: false },
    containerConfig: token.erc1155Properties?.containerConfig || { enabled: false },
    dynamicUriConfig: { enabled: false, revealable: false },
    transferRestrictions: { enabled: false },
    batchTransferLimits: { enabled: false },
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
        description: 'Define core multi-token properties',
        icon: <Settings className="h-4 w-4" />,
        isComplete: !!(formData.name && formData.symbol && formData.baseUri),
        hasErrors: !!(errors.name || errors.symbol || errors.baseUri)
      },
      {
        id: 'features',
        title: 'Multi-Token Features',
        description: 'Configure multi-token capabilities',
        icon: <Layers className="h-4 w-4" />,
        isComplete: true,
        hasErrors: false
      },
      {
        id: 'token_types',
        title: 'Token Types',
        description: 'Define different token types and their properties',
        icon: <Grid3X3 className="h-4 w-4" />,
        isComplete: formData.tokenTypes.length > 0 && formData.tokenTypes.every(type => type.name),
        hasErrors: !!(errors.tokenTypes)
      }
    ];

    if (useAdvancedConfig) {
      basicSteps.push(
        {
          id: 'batch_operations',
          title: 'Batch Operations',
          description: 'Configure batch minting and transfer settings',
          icon: <Package className="h-4 w-4" />,
          isComplete: true,
          hasErrors: !!(errors.batchMintingConfig)
        },
        {
          id: 'advanced',
          title: 'Advanced Features',
          description: 'Container functionality and transfer restrictions',
          icon: <Container className="h-4 w-4" />,
          isComplete: true,
          hasErrors: !!(errors.containerConfig || errors.transferRestrictions)
        }
      );
    }

    return basicSteps;
  };

  const [formSteps] = useState<FormStep[]>(getFormSteps());

  // Real-time validation
  useEffect(() => {
    if (!validationPaused) {
      const validation = validateERC1155Token(formData, formData.config_mode);
      setValidationResult(validation);
      
      if (!validation.isValid) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(validation.errors || {}).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            fieldErrors[field] = messages[0];
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({});
      }
      
      const warningMessages: string[] = [];
      Object.entries(validation.warnings || {}).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          warningMessages.push(...messages);
        }
      });
      setWarnings(warningMessages);
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

  // Handle token type changes
  const handleTokenTypeChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tokenTypes: prev.tokenTypes.map((type, i) => 
        i === index ? { ...type, [field]: value } : type
      )
    }));
  };

  const addTokenType = () => {
    const newId = (formData.tokenTypes.length + 1).toString();
    setFormData(prev => ({
      ...prev,
      tokenTypes: [
        ...prev.tokenTypes,
        {
          id: newId,
          name: `Token Type ${newId}`,
          fungibilityType: 'non-fungible',
          rarityLevel: 'common'
        }
      ]
    }));
  };

  const removeTokenType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tokenTypes: prev.tokenTypes.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Final validation
      const validation = validateERC1155Token(formData, formData.config_mode);
      if (!validation.isValid) {
        setErrors({ general: 'Please fix validation errors before saving' });
        return;
      }

      // Save via enhanced service
      const result = await erc1155Service.updateTokenWithProperties(
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
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Basic Multi-Token Properties</h3>
              <p className="text-sm text-muted-foreground">
                Define the core properties of your ERC-1155 multi-token contract
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Contract Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="My Multi-Token Contract"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => handleFieldChange('symbol', e.target.value)}
                  placeholder="MMT"
                />
                {errors.symbol && <p className="text-sm text-destructive">{errors.symbol}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUri">Base URI *</Label>
              <Input
                id="baseUri"
                value={formData.baseUri}
                onChange={(e) => handleFieldChange('baseUri', e.target.value)}
                placeholder="https://metadata.example.com/tokens/{id}.json"
              />
              <p className="text-xs text-muted-foreground">
                Base URI for token metadata. Use {"{id}"} as placeholder for token ID.
              </p>
              {errors.baseUri && <p className="text-sm text-destructive">{errors.baseUri}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadataStorage">Metadata Storage</Label>
              <Select
                value={formData.metadataStorage}
                onValueChange={(value) => handleFieldChange('metadataStorage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ipfs">IPFS</SelectItem>
                  <SelectItem value="arweave">Arweave</SelectItem>
                  <SelectItem value="centralized">Centralized</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 'features':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Multi-Token Features & Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure capabilities for your multi-token contract
              </p>
            </div>

            {/* Royalty Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Royalty Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasRoyalty"
                    checked={formData.hasRoyalty}
                    onCheckedChange={(checked) => handleFieldChange('hasRoyalty', checked)}
                  />
                  <Label htmlFor="hasRoyalty">Enable Royalties</Label>
                </div>

                {formData.hasRoyalty && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="royaltyPercentage">Royalty Percentage (%)</Label>
                      <Input
                        id="royaltyPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.royaltyPercentage}
                        onChange={(e) => handleFieldChange('royaltyPercentage', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="royaltyReceiver">Royalty Receiver Address</Label>
                      <Input
                        id="royaltyReceiver"
                        value={formData.royaltyReceiver}
                        onChange={(e) => handleFieldChange('royaltyReceiver', e.target.value)}
                        placeholder="0x..."
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Basic Features */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isBurnable"
                      checked={formData.isBurnable}
                      onCheckedChange={(checked) => handleFieldChange('isBurnable', checked)}
                    />
                    <Label htmlFor="isBurnable">Burnable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPausable"
                      checked={formData.isPausable}
                      onCheckedChange={(checked) => handleFieldChange('isPausable', checked)}
                    />
                    <Label htmlFor="isPausable">Pausable</Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="supplyTracking"
                      checked={formData.supplyTracking}
                      onCheckedChange={(checked) => handleFieldChange('supplyTracking', checked)}
                    />
                    <Label htmlFor="supplyTracking">Supply Tracking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableApprovalForAll"
                      checked={formData.enableApprovalForAll}
                      onCheckedChange={(checked) => handleFieldChange('enableApprovalForAll', checked)}
                    />
                    <Label htmlFor="enableApprovalForAll">Approval for All</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Features */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessControl">Access Control</Label>
                  <Select
                    value={formData.accessControl}
                    onValueChange={(value) => handleFieldChange('accessControl', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ownable">Ownable</SelectItem>
                      <SelectItem value="roles">Role-Based</SelectItem>
                      <SelectItem value="none">No Access Control</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="updatableUris"
                      checked={formData.updatableUris}
                      onCheckedChange={(checked) => handleFieldChange('updatableUris', checked)}
                    />
                    <Label htmlFor="updatableUris">Updatable URIs</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dynamicUris"
                      checked={formData.dynamicUris}
                      onCheckedChange={(checked) => handleFieldChange('dynamicUris', checked)}
                    />
                    <Label htmlFor="dynamicUris">Dynamic URIs</Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="batchMintingEnabled"
                      checked={formData.batchMintingEnabled}
                      onCheckedChange={(checked) => handleFieldChange('batchMintingEnabled', checked)}
                    />
                    <Label htmlFor="batchMintingEnabled">Batch Minting</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="containerEnabled"
                      checked={formData.containerEnabled}
                      onCheckedChange={(checked) => handleFieldChange('containerEnabled', checked)}
                    />
                    <Label htmlFor="containerEnabled">Container Functionality</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'token_types':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Token Type Definitions</h3>
                <p className="text-sm text-muted-foreground">
                  Define the different types of tokens in your multi-token contract
                </p>
              </div>
              <Button onClick={addTokenType} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Token Type
              </Button>
            </div>

            <div className="space-y-4">
              {formData.tokenTypes.map((tokenType, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="space-y-2">
                          <Label htmlFor={`type-name-${index}`}>Token Type Name</Label>
                          <Input
                            id={`type-name-${index}`}
                            value={tokenType.name}
                            onChange={(e) => handleTokenTypeChange(index, 'name', e.target.value)}
                            placeholder="e.g., Gold Coin, Silver Shield, Magic Sword"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`type-id-${index}`}>Token Type ID</Label>
                          <Input
                            id={`type-id-${index}`}
                            value={tokenType.id}
                            onChange={(e) => handleTokenTypeChange(index, 'id', e.target.value)}
                            placeholder="1"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTokenType(index)}
                        className="ml-2"
                        disabled={formData.tokenTypes.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`type-desc-${index}`}>Description (Optional)</Label>
                        <Textarea
                          id={`type-desc-${index}`}
                          value={tokenType.description || ''}
                          onChange={(e) => handleTokenTypeChange(index, 'description', e.target.value)}
                          placeholder="Describe this token type..."
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`type-fungibility-${index}`}>Fungibility</Label>
                          <Select
                            value={tokenType.fungibilityType}
                            onValueChange={(value) => handleTokenTypeChange(index, 'fungibilityType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fungible">Fungible</SelectItem>
                              <SelectItem value="non-fungible">Non-Fungible</SelectItem>
                              <SelectItem value="semi-fungible">Semi-Fungible</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`type-rarity-${index}`}>Rarity Level</Label>
                          <Select
                            value={tokenType.rarityLevel}
                            onValueChange={(value) => handleTokenTypeChange(index, 'rarityLevel', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="common">Common</SelectItem>
                              <SelectItem value="uncommon">Uncommon</SelectItem>
                              <SelectItem value="rare">Rare</SelectItem>
                              <SelectItem value="legendary">Legendary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`type-supply-${index}`}>Max Supply</Label>
                          <Input
                            id={`type-supply-${index}`}
                            type="number"
                            value={tokenType.maxSupply || ''}
                            onChange={(e) => handleTokenTypeChange(index, 'maxSupply', e.target.value)}
                            placeholder="1000"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'batch_operations':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Batch Operations Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure batch minting and transfer capabilities for gas optimization
              </p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Batch operations configuration is under development
                </p>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Will include: batch size limits, gas optimization, bulk discounts, and transfer restrictions
                </p>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'advanced':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Advanced Features</h3>
              <p className="text-sm text-muted-foreground">
                Configure container functionality and advanced transfer restrictions
              </p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Advanced features configuration is under development
                </p>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Will include: container management, complex transfer restrictions, and cross-token interactions
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
            Enhanced ERC-1155 Multi-Token Configuration
            <Badge variant={useAdvancedConfig ? "default" : "secondary"}>
              {useAdvancedConfig ? "Advanced" : "Basic"} Mode
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure your ERC-1155 multi-token contract with token types, batch operations, and advanced features
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
                {isLoading ? 'Saving...' : 'Save Multi-Token Contract'}
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
              Review your multi-token contract configuration before saving
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="types">Token Types</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Contract Name:</span> {formData.name || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Symbol:</span> {formData.symbol || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Metadata Storage:</span> {formData.metadataStorage}
                  </div>
                  <div>
                    <span className="font-medium">Supply Tracking:</span> {formData.supplyTracking ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {formData.isBurnable ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Burnable
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.hasRoyalty ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Royalties ({formData.royaltyPercentage}%)
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.batchMintingEnabled ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Batch Minting
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="types" className="space-y-4">
                <div className="text-sm">
                  <div className="font-medium mb-2">Token Types ({formData.tokenTypes.length}):</div>
                  <div className="space-y-2">
                    {formData.tokenTypes.map((type, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant="outline">ID: {type.id}</Badge>
                        <span>{type.name}</span>
                        <Badge variant="secondary" className="text-xs">{type.fungibilityType}</Badge>
                        <Badge variant="outline" className="text-xs">{type.rarityLevel}</Badge>
                        {type.maxSupply && <span className="text-xs text-muted-foreground">Max: {type.maxSupply}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Access Control:</span> {formData.accessControl}
                  </div>
                  <div>
                    <span className="font-medium">Container Functionality:</span> {formData.containerEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                  <div>
                    <span className="font-medium">Dynamic URIs:</span> {formData.dynamicUris ? 'Enabled' : 'Disabled'}
                  </div>
                  <div>
                    <span className="font-medium">Updatable URIs:</span> {formData.updatableUris ? 'Enabled' : 'Disabled'}
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

export default ERC1155EditForm;
