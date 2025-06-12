/**
 * Enhanced ERC1400 Edit Form
 * Supports security token features: partitions, compliance, corporate actions, regulatory filings
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
import { AlertCircle, CheckCircle, Clock, Settings, Shield, Users, Zap, Building, FileText, DollarSign, Plus, Trash2, UserCheck, Gavel, Scale } from 'lucide-react';

// Form Components
import BasicPropertiesStep from '../components/BasicPropertiesStep';
import TokenConfigStep from '../components/TokenConfigStep';
import ComplianceConfigStep from '../components/ComplianceConfigStep';
import ValidationSummary from '../components/ValidationSummary';
import ProgressIndicator from '../components/ProgressIndicator';

// Services and Types
import { erc1400Service } from '../../services/enhancedERC1400Service';
import { TokenERC1400Properties, TokenConfigMode, TokenStandard } from '@/types/core/centralModels';
import { validateERC1400Token } from '../../validation/schemas/erc1400';
import { TransferConfig } from '../../utils/mappers/config/jsonbConfigMapper';

interface ERC1400EditFormProps {
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

interface Partition {
  name: string;
  partitionId: string;
  amount: string;
  transferable: boolean;
  partitionType: 'equity' | 'debt' | 'preferred' | 'common';
}

interface Controller {
  address: string;
  permissions: string[];
}

interface LegalDocument {
  name: string;
  uri: string;
  documentType: string;
  hash?: string;
}

interface ERC1400FormData {
  config_mode: 'min' | 'max';
  standard: TokenStandard; // Use TokenStandard enum
  // Basic properties
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string;
  cap?: string;
  
  // Security token properties
  securityType: 'equity' | 'debt' | 'preferred' | 'hybrid';
  issuingJurisdiction: string;
  issuingEntityName: string;
  issuingEntityLei?: string;
  regulationType: 'reg-d' | 'reg-a-plus' | 'reg-s' | 'reg-cf' | 'public' | 'other';
  
  // Basic features
  isIssuable: boolean;
  isMintable: boolean;
  isBurnable: boolean;
  isPausable: boolean;
  
  // Compliance features
  requireKyc: boolean;
  enforceKyc: boolean;
  transferRestrictions: TransferConfig;
  whitelistEnabled: boolean;
  investorAccreditation: boolean;
  
  // Advanced compliance
  holdingPeriod?: number;
  maxInvestorCount?: number;
  autoCompliance: boolean;
  manualApprovals: boolean;
  complianceModule?: string;
  
  // Corporate actions
  forcedTransfersEnabled: boolean;
  forcedRedemptionEnabled: boolean;
  dividendDistribution: boolean;
  corporateActions: boolean;
  
  // Multi-class features
  isMultiClass: boolean;
  trancheTransferability: boolean;
  granularControl: boolean;
  
  // Partition management
  partitions: Partition[];
  
  // Controllers
  controllers: Controller[];
  
  // Legal documents
  documents: LegalDocument[];
  
  // Geographic restrictions
  geographicRestrictions: {
    restrictedCountries: string[];
    allowedCountries?: string[];
    treatyBenefits?: boolean;
    passportRegime?: boolean;
    taxOptimization?: boolean;
  };
  
  // Enhanced configurations (for advanced mode)
  kycSettings?: {
    enabled: boolean;
    provider?: string;
    autoVerification?: boolean;
    requiredDocuments?: string[];
    expirationPeriod?: number;
  };
  complianceSettings?: {
    automationLevel: 'manual' | 'semi-automatic' | 'fully-automatic';
    riskAssessment?: boolean;
    sanctionsChecking?: boolean;
    piiProtection?: boolean;
  };
  documentManagement?: boolean; // Changed from object to boolean for consistency
}

const ERC1400EditForm: React.FC<ERC1400EditFormProps> = ({
  token,
  onSave,
  validationPaused = false,
  configMode = TokenConfigMode.MIN,
  useAdvancedConfig = false
}) => {
  const [formData, setFormData] = useState<ERC1400FormData>({
    config_mode: configMode === TokenConfigMode.MAX ? 'max' : 'min',
    standard: TokenStandard.ERC1400, // Use enum value
    // Basic properties
    name: token.name || '',
    symbol: token.symbol || '',
    decimals: token.decimals || 18,
    initialSupply: token.erc1400Properties?.initialSupply || '1000000',
    cap: token.erc1400Properties?.cap || '',
    
    // Security token properties
    securityType: token.erc1400Properties?.securityType || 'equity',
    issuingJurisdiction: token.erc1400Properties?.issuingJurisdiction || '',
    issuingEntityName: token.erc1400Properties?.issuingEntityName || '',
    issuingEntityLei: token.erc1400Properties?.issuingEntityLei || '',
    regulationType: token.erc1400Properties?.regulationType || 'reg-d',
    
    // Basic features
    isIssuable: token.erc1400Properties?.isIssuable ?? true,
    isMintable: token.erc1400Properties?.isMintable || false,
    isBurnable: token.erc1400Properties?.isBurnable || false,
    isPausable: token.erc1400Properties?.isPausable || false,
    
    // Compliance features
    requireKyc: token.erc1400Properties?.requireKyc ?? true,
    enforceKyc: token.erc1400Properties?.enforceKyc || false,
    transferRestrictions: token.erc1400Properties?.transferRestrictions || {
      enabled: false,
      restrictions: { requireApproval: false },
      whitelist: { enabled: false, addresses: [] },
      blacklist: { enabled: false, addresses: [] }
    },
    whitelistEnabled: token.erc1400Properties?.whitelistEnabled || false,
    investorAccreditation: token.erc1400Properties?.investorAccreditation || false,
    
    // Advanced compliance
    holdingPeriod: token.erc1400Properties?.holdingPeriod || undefined,
    maxInvestorCount: token.erc1400Properties?.maxInvestorCount || undefined,
    autoCompliance: token.erc1400Properties?.autoCompliance || false,
    manualApprovals: token.erc1400Properties?.manualApprovals || false,
    complianceModule: token.erc1400Properties?.complianceModule || '',
    
    // Corporate actions
    forcedTransfersEnabled: token.erc1400Properties?.forcedTransfers || false,
    forcedRedemptionEnabled: token.erc1400Properties?.forcedRedemptionEnabled || false,
    dividendDistribution: token.erc1400Properties?.dividendDistribution || false,
    corporateActions: token.erc1400Properties?.corporateActions || false,
    
    // Multi-class features
    isMultiClass: token.erc1400Properties?.isMultiClass || false,
    trancheTransferability: token.erc1400Properties?.trancheTransferability || false,
    granularControl: token.erc1400Properties?.granularControl || false,
    
    // Collections
    partitions: token.erc1400Partitions?.map((p: any) => ({
      name: p.name,
      partitionId: p.partitionId,
      amount: p.amount || '0',
      transferable: p.transferable ?? true,
      partitionType: p.partitionType || 'common'
    })) || [
      {
        name: 'Common Shares',
        partitionId: 'COMMON',
        amount: '1000000',
        transferable: true,
        partitionType: 'common' as const
      }
    ],
    
    controllers: token.erc1400Controllers?.map((c: any) => ({
      address: c.address,
      permissions: c.permissions || ['ADMIN']
    })) || [],
    
    documents: token.erc1400Documents?.map((d: any) => ({
      name: d.name,
      uri: d.documentUri,
      documentType: d.documentType || 'legal',
      hash: d.documentHash
    })) || [],
    
    geographicRestrictions: {
      restrictedCountries: token.erc1400Properties?.geographicRestrictions?.restrictedCountries || [],
      allowedCountries: token.erc1400Properties?.geographicRestrictions?.allowedCountries || [],
      treatyBenefits: token.erc1400Properties?.geographicRestrictions?.treatyBenefits || false,
      passportRegime: token.erc1400Properties?.geographicRestrictions?.passportRegime || false,
      taxOptimization: token.erc1400Properties?.geographicRestrictions?.taxOptimization || false,
    },
    
    // Enhanced configurations
    kycSettings: token.erc1400Properties?.kycSettings || {
      enabled: true,
      autoVerification: false,
      requiredDocuments: ['identity', 'address'],
      expirationPeriod: 365
    },
    complianceSettings: token.erc1400Properties?.complianceSettings || {
      automationLevel: 'manual',
      riskAssessment: false,
      sanctionsChecking: true,
      piiProtection: true
    },
    documentManagement: false, // Changed from object to boolean
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
        description: 'Define core security token properties',
        icon: <Settings className="h-4 w-4" />,
        isComplete: !!(formData.name && formData.symbol && formData.issuingJurisdiction && formData.issuingEntityName),
        hasErrors: !!(errors.name || errors.symbol || errors.issuingJurisdiction)
      },
      {
        id: 'security',
        title: 'Security Features',
        description: 'Configure security token capabilities',
        icon: <Shield className="h-4 w-4" />,
        isComplete: true,
        hasErrors: false
      },
      {
        id: 'partitions',
        title: 'Partitions & Classes',
        description: 'Define token partitions and share classes',
        icon: <Scale className="h-4 w-4" />,
        isComplete: formData.partitions.length > 0 && formData.partitions.every(p => p.name && p.partitionId),
        hasErrors: !!(errors.partitions)
      }
    ];

    if (useAdvancedConfig) {
      basicSteps.push(
        {
          id: 'compliance',
          title: 'Compliance & KYC',
          description: 'Advanced compliance and regulatory settings',
          icon: <UserCheck className="h-4 w-4" />,
          isComplete: true,
          hasErrors: !!(errors.kycSettings || errors.complianceSettings)
        },
        {
          id: 'corporate',
          title: 'Corporate Actions',
          description: 'Dividend distribution and corporate governance',
          icon: <Building className="h-4 w-4" />,
          isComplete: true,
          hasErrors: !!(errors.corporateActions)
        },
        {
          id: 'documents',
          title: 'Legal Documents',
          description: 'Manage legal documents and filings',
          icon: <FileText className="h-4 w-4" />,
          isComplete: true,
          hasErrors: !!(errors.documents)
        }
      );
    }

    return basicSteps;
  };

  const [formSteps] = useState<FormStep[]>(getFormSteps());

  // Real-time validation
  useEffect(() => {
    if (!validationPaused) {
      const validation = validateERC1400Token(formData, formData.config_mode);
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

  // Handle partition changes
  const handlePartitionChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      partitions: prev.partitions.map((partition, i) => 
        i === index ? { ...partition, [field]: value } : partition
      )
    }));
  };

  const addPartition = () => {
    const newId = (formData.partitions.length + 1).toString();
    setFormData(prev => ({
      ...prev,
      partitions: [
        ...prev.partitions,
        {
          name: `Partition ${newId}`,
          partitionId: `PARTITION-${newId}`,
          amount: '0',
          transferable: true,
          partitionType: 'common'
        }
      ]
    }));
  };

  const removePartition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      partitions: prev.partitions.filter((_, i) => i !== index)
    }));
  };

  // Handle controller changes
  const handleControllerChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      controllers: prev.controllers.map((controller, i) => 
        i === index ? { ...controller, [field]: value } : controller
      )
    }));
  };

  const addController = () => {
    setFormData(prev => ({
      ...prev,
      controllers: [
        ...prev.controllers,
        {
          address: '',
          permissions: ['ADMIN']
        }
      ]
    }));
  };

  const removeController = (index: number) => {
    setFormData(prev => ({
      ...prev,
      controllers: prev.controllers.filter((_, i) => i !== index)
    }));
  };

  // Handle document changes
  const handleDocumentChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) => 
        i === index ? { ...doc, [field]: value } : doc
      )
    }));
  };

  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          name: '',
          uri: '',
          documentType: 'legal',
          hash: ''
        }
      ]
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Final validation
      const validation = validateERC1400Token(formData, formData.config_mode);
      if (!validation.isValid) {
        setErrors({ general: 'Please fix validation errors before saving' });
        return;
      }

      // Save via enhanced service
      const result = await erc1400Service.updateTokenWithProperties(
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
              <h3 className="text-lg font-medium">Basic Security Token Properties</h3>
              <p className="text-sm text-muted-foreground">
                Define the core properties of your security token
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Security Token Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Acme Corp Security Token"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => handleFieldChange('symbol', e.target.value)}
                  placeholder="ACME"
                />
                {errors.symbol && <p className="text-sm text-destructive">{errors.symbol}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialSupply">Initial Supply</Label>
                <Input
                  id="initialSupply"
                  value={formData.initialSupply}
                  onChange={(e) => handleFieldChange('initialSupply', e.target.value)}
                  placeholder="1000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cap">Maximum Supply (Cap)</Label>
                <Input
                  id="cap"
                  value={formData.cap}
                  onChange={(e) => handleFieldChange('cap', e.target.value)}
                  placeholder="10000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityType">Security Type</Label>
              <Select
                value={formData.securityType}
                onValueChange={(value) => handleFieldChange('securityType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="debt">Debt</SelectItem>
                  <SelectItem value="preferred">Preferred Stock</SelectItem>
                  <SelectItem value="hybrid">Hybrid Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuingJurisdiction">Issuing Jurisdiction *</Label>
                <Input
                  id="issuingJurisdiction"
                  value={formData.issuingJurisdiction}
                  onChange={(e) => handleFieldChange('issuingJurisdiction', e.target.value)}
                  placeholder="Delaware, USA"
                />
                {errors.issuingJurisdiction && <p className="text-sm text-destructive">{errors.issuingJurisdiction}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="issuingEntityName">Issuing Entity Name *</Label>
                <Input
                  id="issuingEntityName"
                  value={formData.issuingEntityName}
                  onChange={(e) => handleFieldChange('issuingEntityName', e.target.value)}
                  placeholder="Acme Corporation"
                />
                {errors.issuingEntityName && <p className="text-sm text-destructive">{errors.issuingEntityName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuingEntityLei">Legal Entity Identifier (LEI)</Label>
                <Input
                  id="issuingEntityLei"
                  value={formData.issuingEntityLei}
                  onChange={(e) => handleFieldChange('issuingEntityLei', e.target.value)}
                  placeholder="549300XXXXXXXXXXXXXXXXXX"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="regulationType">Regulation Type</Label>
                <Select
                  value={formData.regulationType}
                  onValueChange={(value) => handleFieldChange('regulationType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reg-d">Regulation D</SelectItem>
                    <SelectItem value="reg-a-plus">Regulation A+</SelectItem>
                    <SelectItem value="reg-s">Regulation S</SelectItem>
                    <SelectItem value="reg-cf">Regulation CF</SelectItem>
                    <SelectItem value="public">Public Offering</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Security Token Features</h3>
              <p className="text-sm text-muted-foreground">
                Configure security-specific capabilities and compliance features
              </p>
            </div>

            {/* Basic Features */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isIssuable"
                      checked={formData.isIssuable}
                      onCheckedChange={(checked) => handleFieldChange('isIssuable', checked)}
                    />
                    <Label htmlFor="isIssuable">Issuable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isMintable"
                      checked={formData.isMintable}
                      onCheckedChange={(checked) => handleFieldChange('isMintable', checked)}
                    />
                    <Label htmlFor="isMintable">Mintable</Label>
                  </div>
                </div>
                
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
              </CardContent>
            </Card>

            {/* Compliance Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Compliance Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireKyc"
                      checked={formData.requireKyc}
                      onCheckedChange={(checked) => handleFieldChange('requireKyc', checked)}
                    />
                    <Label htmlFor="requireKyc">Require KYC</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enforceKyc"
                      checked={formData.enforceKyc}
                      onCheckedChange={(checked) => handleFieldChange('enforceKyc', checked)}
                    />
                    <Label htmlFor="enforceKyc">Enforce KYC</Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="transferRestrictions"
                      checked={formData.transferRestrictions?.enabled || false}
                      onCheckedChange={(checked) => handleConfigChange('transferRestrictions', { 
                        ...formData.transferRestrictions, 
                        enabled: checked 
                      })}
                    />
                    <Label htmlFor="transferRestrictions">Transfer Restrictions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="whitelistEnabled"
                      checked={formData.whitelistEnabled}
                      onCheckedChange={(checked) => handleFieldChange('whitelistEnabled', checked)}
                    />
                    <Label htmlFor="whitelistEnabled">Whitelist Enabled</Label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="investorAccreditation"
                    checked={formData.investorAccreditation}
                    onCheckedChange={(checked) => handleFieldChange('investorAccreditation', checked)}
                  />
                  <Label htmlFor="investorAccreditation">Investor Accreditation Required</Label>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Compliance */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="holdingPeriod">Holding Period (days)</Label>
                    <Input
                      id="holdingPeriod"
                      type="number"
                      value={formData.holdingPeriod || ''}
                      onChange={(e) => handleFieldChange('holdingPeriod', parseInt(e.target.value) || undefined)}
                      placeholder="365"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxInvestorCount">Max Investor Count</Label>
                    <Input
                      id="maxInvestorCount"
                      type="number"
                      value={formData.maxInvestorCount || ''}
                      onChange={(e) => handleFieldChange('maxInvestorCount', parseInt(e.target.value) || undefined)}
                      placeholder="499"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoCompliance"
                      checked={formData.autoCompliance}
                      onCheckedChange={(checked) => handleFieldChange('autoCompliance', checked)}
                    />
                    <Label htmlFor="autoCompliance">Auto Compliance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="manualApprovals"
                      checked={formData.manualApprovals}
                      onCheckedChange={(checked) => handleFieldChange('manualApprovals', checked)}
                    />
                    <Label htmlFor="manualApprovals">Manual Approvals</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'partitions':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Token Partitions & Share Classes</h3>
                <p className="text-sm text-muted-foreground">
                  Define different classes of shares with varying rights and restrictions
                </p>
              </div>
              <Button onClick={addPartition} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Partition
              </Button>
            </div>

            <div className="space-y-4">
              {formData.partitions.map((partition, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="space-y-2">
                          <Label htmlFor={`partition-name-${index}`}>Partition Name</Label>
                          <Input
                            id={`partition-name-${index}`}
                            value={partition.name}
                            onChange={(e) => handlePartitionChange(index, 'name', e.target.value)}
                            placeholder="e.g., Common Shares, Preferred A"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`partition-id-${index}`}>Partition ID</Label>
                          <Input
                            id={`partition-id-${index}`}
                            value={partition.partitionId}
                            onChange={(e) => handlePartitionChange(index, 'partitionId', e.target.value)}
                            placeholder="COMMON"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePartition(index)}
                        className="ml-2"
                        disabled={formData.partitions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`partition-amount-${index}`}>Amount/Supply</Label>
                        <Input
                          id={`partition-amount-${index}`}
                          value={partition.amount}
                          onChange={(e) => handlePartitionChange(index, 'amount', e.target.value)}
                          placeholder="1000000"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`partition-type-${index}`}>Partition Type</Label>
                        <Select
                          value={partition.partitionType}
                          onValueChange={(value) => handlePartitionChange(index, 'partitionType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="common">Common Stock</SelectItem>
                            <SelectItem value="preferred">Preferred Stock</SelectItem>
                            <SelectItem value="equity">Equity</SelectItem>
                            <SelectItem value="debt">Debt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id={`partition-transferable-${index}`}
                          checked={partition.transferable}
                          onCheckedChange={(checked) => handlePartitionChange(index, 'transferable', checked)}
                        />
                        <Label htmlFor={`partition-transferable-${index}`}>Transferable</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Multi-class features */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Class Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isMultiClass"
                      checked={formData.isMultiClass}
                      onCheckedChange={(checked) => handleFieldChange('isMultiClass', checked)}
                    />
                    <Label htmlFor="isMultiClass">Multi-Class Token</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="trancheTransferability"
                      checked={formData.trancheTransferability}
                      onCheckedChange={(checked) => handleFieldChange('trancheTransferability', checked)}
                    />
                    <Label htmlFor="trancheTransferability">Tranche Transferability</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="granularControl"
                      checked={formData.granularControl}
                      onCheckedChange={(checked) => handleFieldChange('granularControl', checked)}
                    />
                    <Label htmlFor="granularControl">Granular Control</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Advanced Compliance & KYC</h3>
              <p className="text-sm text-muted-foreground">
                Configure detailed compliance automation and KYC requirements
              </p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Advanced compliance configuration is under development
                </p>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Will include: KYC provider integration, compliance automation, sanctions checking, and PII protection
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'corporate':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Corporate Actions & Governance</h3>
              <p className="text-sm text-muted-foreground">
                Configure dividend distribution, forced transfers, and corporate governance features
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Corporate Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="forcedTransfersEnabled"
                      checked={formData.forcedTransfersEnabled}
                      onCheckedChange={(checked) => handleFieldChange('forcedTransfersEnabled', checked)}
                    />
                    <Label htmlFor="forcedTransfersEnabled">Forced Transfers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="forcedRedemptionEnabled"
                      checked={formData.forcedRedemptionEnabled}
                      onCheckedChange={(checked) => handleFieldChange('forcedRedemptionEnabled', checked)}
                    />
                    <Label htmlFor="forcedRedemptionEnabled">Forced Redemption</Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dividendDistribution"
                      checked={formData.dividendDistribution}
                      onCheckedChange={(checked) => handleFieldChange('dividendDistribution', checked)}
                    />
                    <Label htmlFor="dividendDistribution">Dividend Distribution</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="corporateActions"
                      checked={formData.corporateActions}
                      onCheckedChange={(checked) => handleFieldChange('corporateActions', checked)}
                    />
                    <Label htmlFor="corporateActions">Corporate Actions</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Legal Documents & Filings</h3>
                <p className="text-sm text-muted-foreground">
                  Manage legal documents, prospectuses, and regulatory filings
                </p>
              </div>
              <Button onClick={addDocument} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>

            {formData.documents.length > 0 ? (
              <div className="space-y-4">
                {formData.documents.map((document, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <div className="space-y-2">
                            <Label htmlFor={`doc-name-${index}`}>Document Name</Label>
                            <Input
                              id={`doc-name-${index}`}
                              value={document.name}
                              onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                              placeholder="e.g., Prospectus, Term Sheet"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`doc-type-${index}`}>Document Type</Label>
                            <Select
                              value={document.documentType}
                              onValueChange={(value) => handleDocumentChange(index, 'documentType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="legal">Legal Document</SelectItem>
                                <SelectItem value="prospectus">Prospectus</SelectItem>
                                <SelectItem value="term_sheet">Term Sheet</SelectItem>
                                <SelectItem value="regulatory">Regulatory Filing</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`doc-uri-${index}`}>Document URI</Label>
                          <Input
                            id={`doc-uri-${index}`}
                            value={document.uri}
                            onChange={(e) => handleDocumentChange(index, 'uri', e.target.value)}
                            placeholder="https://documents.example.com/prospectus.pdf"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`doc-hash-${index}`}>Document Hash (Optional)</Label>
                          <Input
                            id={`doc-hash-${index}`}
                            value={document.hash || ''}
                            onChange={(e) => handleDocumentChange(index, 'hash', e.target.value)}
                            placeholder="sha256 hash for verification"
                          />
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
                    No legal documents added yet. Click "Add Document" to add legal documents and filings.
                  </p>
                </CardContent>
              </Card>
            )}
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
            Enhanced ERC-1400 Security Token Configuration
            <Badge variant={useAdvancedConfig ? "default" : "secondary"}>
              {useAdvancedConfig ? "Advanced" : "Basic"} Mode
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure your ERC-1400 security token with compliance, partitions, and regulatory features
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
                {isLoading ? 'Saving...' : 'Save Security Token'}
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
              Review your security token configuration before saving
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="partitions">Partitions</TabsTrigger>
                <TabsTrigger value="corporate">Corporate</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Token Name:</span> {formData.name || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Symbol:</span> {formData.symbol || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Security Type:</span> {formData.securityType}
                  </div>
                  <div>
                    <span className="font-medium">Jurisdiction:</span> {formData.issuingJurisdiction || 'Not set'}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="compliance" className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {formData.requireKyc ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    KYC Required
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.transferRestrictions?.enabled ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Transfer Restrictions
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.autoCompliance ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    Auto Compliance
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="partitions" className="space-y-4">
                <div className="text-sm">
                  <div className="font-medium mb-2">Token Partitions ({formData.partitions.length}):</div>
                  <div className="space-y-2">
                    {formData.partitions.map((partition, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant="outline">{partition.partitionId}</Badge>
                        <span>{partition.name}</span>
                        <Badge variant="secondary" className="text-xs">{partition.partitionType}</Badge>
                        <span className="text-xs text-muted-foreground">Amount: {partition.amount}</span>
                        {partition.transferable && <Badge variant="outline" className="text-xs">Transferable</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="corporate" className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Forced Transfers:</span> {formData.forcedTransfersEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                  <div>
                    <span className="font-medium">Dividend Distribution:</span> {formData.dividendDistribution ? 'Enabled' : 'Disabled'}
                  </div>
                  <div>
                    <span className="font-medium">Corporate Actions:</span> {formData.corporateActions ? 'Enabled' : 'Disabled'}
                  </div>
                  <div>
                    <span className="font-medium">Multi-Class:</span> {formData.isMultiClass ? 'Yes' : 'No'}
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

export default ERC1400EditForm;
