/**
 * Enhanced ERC721 Edit Form
 * Supports NFT-specific features: trait definitions, mint phases, royalty settings, metadata schemas
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
import { AlertCircle, CheckCircle, Clock, Settings, Shield, Users, Zap, Palette, Image, DollarSign, Plus, Trash2 } from 'lucide-react';

// Form Components
import BasicPropertiesStep from '../components/BasicPropertiesStep';
import TokenConfigStep from '../components/TokenConfigStep';
import ComplianceConfigStep from '../components/ComplianceConfigStep';
import ValidationSummary from '../components/ValidationSummary';
import ProgressIndicator from '../components/ProgressIndicator';

// Services and Types
import { erc721Service } from '../../services/enhancedERC721Service';
import { TokenERC721Properties, TokenConfigMode, TokenStandard } from '@/types/core/centralModels';
import { validateERC721Token } from '../../validation/schemas/erc721';

interface ERC721EditFormProps {
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

interface TraitDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  description?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

interface SalesPhase {
  type: 'public' | 'whitelist' | 'dutch_auction';
  enabled: boolean;
  price?: string;
  maxPerWallet?: number;
  startTime?: string;
  endTime?: string;
  startPrice?: string;
  endPrice?: string;
  duration?: number;
  merkleRoot?: string;
}

interface ERC721FormData {
  config_mode: 'min' | 'max';
  standard: TokenStandard; // Add required standard property
  // Basic properties
  name: string;
  symbol: string;
  decimals: number; // Always 0 for NFTs
  
  // NFT-specific properties
  baseUri: string;
  metadataStorage: 'ipfs' | 'arweave' | 'centralized';
  maxSupply?: string;
  assetType: 'unique_asset' | 'real_estate' | 'ip_rights' | 'financial_instrument' | 'collectible';
  
  // Royalty configuration
  hasRoyalty: boolean;
  royaltyPercentage?: string; // Change to string to match expected type
  royaltyReceiver?: string;
  
  // Basic features
  isMintable: boolean;
  isBurnable: boolean;
  isPausable: boolean;
  
  // Advanced NFT features
  mintingMethod: 'open' | 'whitelist' | 'auction' | 'lazy';
  autoIncrementIds: boolean;
  enumerable: boolean;
  uriStorage: 'tokenId' | 'sequential' | 'custom';
  accessControl: 'ownable' | 'roles' | 'none';
  updatableUris: boolean;
  
  // Enhanced configurations (for advanced mode)
  tokenAttributes?: TraitDefinition[];
  salesConfig?: {
    enabled: boolean;
    publicSale?: SalesPhase;
    whitelistSale?: SalesPhase;
    dutchAuction?: SalesPhase;
  };
  whitelistConfig?: {
    enabled: boolean;
    type: 'merkle' | 'signature' | 'simple';
    addresses: string[]; // Make required
    maxMints?: number;
    proof?: string;
  };
  permissionConfig?: {
    minterRole?: string[];
    burnerRole?: string[];
    metadataRole?: string[];
    pauserRole?: string[];
  };
  dynamicUriConfig?: {
    enabled: boolean;
    baseUri?: string;
    revealable: boolean;
    preRevealUri?: string;
    revealTime?: string;
  };
  transferRestrictions?: {
    enabled: boolean;
    soulbound: boolean;
    transferCooldown?: number;
    whitelistedOperators?: string[];
    blockedOperators?: string[];
  };
}

const ERC721EditForm: React.FC<ERC721EditFormProps> = ({
  token,
  onSave,
  validationPaused = false,
  configMode = TokenConfigMode.MIN,
  useAdvancedConfig = false
}) => {
  const [formData, setFormData] = useState<ERC721FormData>({
    config_mode: configMode === TokenConfigMode.MAX ? 'max' : 'min',
    standard: TokenStandard.ERC721, // Add required standard property
    // Basic properties
    name: token.name || '',
    symbol: token.symbol || '',
    decimals: 0, // Always 0 for NFTs
    
    // NFT properties
    baseUri: token.erc721Properties?.baseUri || '',
    metadataStorage: token.erc721Properties?.metadataStorage || 'ipfs',
    maxSupply: token.erc721Properties?.maxSupply || '',
    assetType: token.erc721Properties?.assetType || 'unique_asset',
    
    // Royalty configuration
    hasRoyalty: token.erc721Properties?.hasRoyalty || false,
    royaltyPercentage: token.erc721Properties?.royaltyPercentage || 5,
    royaltyReceiver: token.erc721Properties?.royaltyReceiver || '',
    
    // Basic features
    isMintable: token.erc721Properties?.isMintable ?? true,
    isBurnable: token.erc721Properties?.isBurnable || false,
    isPausable: token.erc721Properties?.isPausable || false,
    
    // Advanced features
    mintingMethod: token.erc721Properties?.mintingMethod || 'open',
    autoIncrementIds: token.erc721Properties?.autoIncrementIds ?? true,
    enumerable: token.erc721Properties?.enumerable ?? true,
    uriStorage: token.erc721Properties?.uriStorage || 'tokenId',
    accessControl: token.erc721Properties?.accessControl || 'ownable',
    updatableUris: token.erc721Properties?.updatableUris || false,
    
    // Enhanced configurations
    tokenAttributes: token.erc721Attributes?.map((attr: any) => ({
      name: attr.traitType,
      type: 'string',
      required: false,
      description: ''
    })) || [],
    salesConfig: token.erc721Properties?.salesConfig || { enabled: false },
    whitelistConfig: token.erc721Properties?.whitelistConfig || { enabled: false, type: 'simple', addresses: [] },
    permissionConfig: token.erc721Properties?.permissionConfig || {},
    dynamicUriConfig: { enabled: false, revealable: false },
    transferRestrictions: { enabled: false, soulbound: false },
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
        description: 'Define core NFT properties',
        icon: <Settings className="h-4 w-4" />,
        isComplete: !!(formData.name && formData.symbol && formData.baseUri),
        hasErrors: !!(errors.name || errors.symbol || errors.baseUri)
      },
      {
        id: 'features',
        title: 'NFT Features',
        description: 'Configure NFT capabilities and metadata',
        icon: <Image className="h-4 w-4" />,
        isComplete: true,
        hasErrors: !!(errors.maxSupply || errors.assetType)
      },
      {
        id: 'traits',
        title: 'Trait Definitions',
        description: 'Define NFT attributes and metadata schema',
        icon: <Palette className="h-4 w-4" />,
        isComplete: true,
        hasErrors: !!(errors.tokenAttributes)
      }
    ];

    if (useAdvancedConfig) {
      basicSteps.push(
        {
          id: 'mint_phases',
          title: 'Mint Phases',
          description: 'Configure sales phases and pricing',
          icon: <DollarSign className="h-4 w-4" />,
          isComplete: true,
          hasErrors: !!(errors.salesConfig)
        },
        {
          id: 'compliance',
          title: 'Access & Security',
          description: 'Set up access control and security features',
          icon: <Shield className="h-4 w-4" />,
          isComplete: true,
          hasErrors: !!(errors.permissionConfig || errors.transferRestrictions)
        }
      );
    }

    return basicSteps;
  };

  const [formSteps] = useState<FormStep[]>(getFormSteps());

  // Real-time validation
  useEffect(() => {
    if (!validationPaused) {
      const validation = validateERC721Token(formData, formData.config_mode);
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

  // Handle trait definition changes
  const handleTraitChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tokenAttributes: prev.tokenAttributes?.map((trait, i) => 
        i === index ? { ...trait, [field]: value } : trait
      ) || []
    }));
  };

  const addTrait = () => {
    setFormData(prev => ({
      ...prev,
      tokenAttributes: [
        ...(prev.tokenAttributes || []),
        {
          name: '',
          type: 'string',
          required: false,
          description: ''
        }
      ]
    }));
  };

  const removeTrait = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tokenAttributes: prev.tokenAttributes?.filter((_, i) => i !== index) || []
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Final validation
      const validation = validateERC721Token(formData, formData.config_mode);
      if (!validation.isValid) {
        setErrors({ general: 'Please fix validation errors before saving' });
        return;
      }

      // Save via enhanced service
      const result = await erc721Service.updateTokenWithProperties(
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
              <h3 className="text-lg font-medium">Basic NFT Properties</h3>
              <p className="text-sm text-muted-foreground">
                Define the core properties of your NFT collection
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="My NFT Collection"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => handleFieldChange('symbol', e.target.value)}
                  placeholder="MNC"
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
                placeholder="https://metadata.example.com/tokens/"
              />
              <p className="text-xs text-muted-foreground">
                Base URI for token metadata. Token ID will be appended.
              </p>
              {errors.baseUri && <p className="text-sm text-destructive">{errors.baseUri}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="maxSupply">Max Supply</Label>
                <Input
                  id="maxSupply"
                  type="number"
                  value={formData.maxSupply}
                  onChange={(e) => handleFieldChange('maxSupply', e.target.value)}
                  placeholder="10000"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited supply
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type</Label>
              <Select
                value={formData.assetType}
                onValueChange={(value) => handleFieldChange('assetType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unique_asset">Unique Asset</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="ip_rights">IP Rights</SelectItem>
                  <SelectItem value="financial_instrument">Financial Instrument</SelectItem>
                  <SelectItem value="collectible">Collectible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 'features':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">NFT Features & Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure NFT capabilities and behavior
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
                        onChange={(e) => handleFieldChange('royaltyPercentage', parseFloat(e.target.value))}
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isMintable"
                      checked={formData.isMintable}
                      onCheckedChange={(checked) => handleFieldChange('isMintable', checked)}
                    />
                    <Label htmlFor="isMintable">Mintable</Label>
                  </div>
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
              </CardContent>
            </Card>

            {/* Advanced Features */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mintingMethod">Minting Method</Label>
                    <Select
                      value={formData.mintingMethod}
                      onValueChange={(value) => handleFieldChange('mintingMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open Minting</SelectItem>
                        <SelectItem value="whitelist">Whitelist Only</SelectItem>
                        <SelectItem value="auction">Auction</SelectItem>
                        <SelectItem value="lazy">Lazy Minting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoIncrementIds"
                      checked={formData.autoIncrementIds}
                      onCheckedChange={(checked) => handleFieldChange('autoIncrementIds', checked)}
                    />
                    <Label htmlFor="autoIncrementIds">Auto-increment IDs</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enumerable"
                      checked={formData.enumerable}
                      onCheckedChange={(checked) => handleFieldChange('enumerable', checked)}
                    />
                    <Label htmlFor="enumerable">Enumerable</Label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="updatableUris"
                    checked={formData.updatableUris}
                    onCheckedChange={(checked) => handleFieldChange('updatableUris', checked)}
                  />
                  <Label htmlFor="updatableUris">Updatable URIs</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'traits':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Trait Definitions</h3>
                <p className="text-sm text-muted-foreground">
                  Define the attributes that your NFTs can have
                </p>
              </div>
              <Button onClick={addTrait} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Trait
              </Button>
            </div>

            {formData.tokenAttributes && formData.tokenAttributes.length > 0 ? (
              <div className="space-y-4">
                {formData.tokenAttributes.map((trait, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <div className="space-y-2">
                            <Label htmlFor={`trait-name-${index}`}>Trait Name</Label>
                            <Input
                              id={`trait-name-${index}`}
                              value={trait.name}
                              onChange={(e) => handleTraitChange(index, 'name', e.target.value)}
                              placeholder="e.g., Background, Eyes, Hat"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`trait-type-${index}`}>Data Type</Label>
                            <Select
                              value={trait.type}
                              onValueChange={(value) => handleTraitChange(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="string">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Yes/No</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTrait(index)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`trait-desc-${index}`}>Description (Optional)</Label>
                          <Textarea
                            id={`trait-desc-${index}`}
                            value={trait.description || ''}
                            onChange={(e) => handleTraitChange(index, 'description', e.target.value)}
                            placeholder="Describe this trait..."
                            rows={2}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`trait-required-${index}`}
                            checked={trait.required}
                            onCheckedChange={(checked) => handleTraitChange(index, 'required', checked)}
                          />
                          <Label htmlFor={`trait-required-${index}`}>Required trait</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No traits defined yet. Click "Add Trait" to define NFT attributes.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'mint_phases':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Mint Phases & Sales Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure different minting phases and pricing strategies
              </p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Mint phases configuration is under development
                </p>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Will include: public sales, whitelist phases, dutch auctions, and pricing tiers
                </p>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'compliance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Access Control & Security</h3>
              <p className="text-sm text-muted-foreground">
                Configure permissions and security features for your NFT collection
              </p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Access control and security configuration is under development
                </p>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Will include: role-based permissions, transfer restrictions, and security policies
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
            Enhanced ERC-721 NFT Configuration
            <Badge variant={useAdvancedConfig ? "default" : "secondary"}>
              {useAdvancedConfig ? "Advanced" : "Basic"} Mode
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure your ERC-721 NFT collection with traits, mint phases, and advanced features
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
                {isLoading ? 'Saving...' : 'Save NFT Collection'}
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
              Review your NFT collection configuration before saving
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="traits">Traits</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Collection Name:</span> {formData.name || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Symbol:</span> {formData.symbol || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Max Supply:</span> {formData.maxSupply || 'Unlimited'}
                  </div>
                  <div>
                    <span className="font-medium">Asset Type:</span> {formData.assetType}
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
                    {formData.hasRoyalty ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Royalties ({formData.royaltyPercentage}%)
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="traits" className="space-y-4">
                <div className="text-sm">
                  <div className="font-medium mb-2">Defined Traits ({formData.tokenAttributes?.length || 0}):</div>
                  {formData.tokenAttributes && formData.tokenAttributes.length > 0 ? (
                    <div className="space-y-1">
                      {formData.tokenAttributes.map((trait, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline">{trait.name}</Badge>
                          <span className="text-xs text-muted-foreground">{trait.type}</span>
                          {trait.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No traits defined</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Minting Method:</span> {formData.mintingMethod}
                  </div>
                  <div>
                    <span className="font-medium">Access Control:</span> {formData.accessControl}
                  </div>
                  <div>
                    <span className="font-medium">Auto-increment IDs:</span> {formData.autoIncrementIds ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Updatable URIs:</span> {formData.updatableUris ? 'Yes' : 'No'}
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

export default ERC721EditForm;
