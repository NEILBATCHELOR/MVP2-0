#!/usr/bin/env npx tsx

/**
 * ERC-4626 (Tokenized Vault) Enhancement Script
 * 
 * This script enhances the ERC-4626 implementation to ensure complete CRUD functionality:
 * - Creates missing form components
 * - Enhances mappers with full field coverage
 * - Adds missing hooks
 * - Updates validation schemas
 * - Creates comprehensive documentation
 * 
 * Date: June 6, 2025
 * Part of: Token Field Mapping Project Phase 4+
 */

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';

class ERC4626Enhancer {
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    console.log('🚀 ERC-4626 Enhancement Starting...\n');
  }

  /**
   * Run all enhancements
   */
  async runEnhancements(): Promise<void> {
    try {
      console.log('📋 Enhancement Plan:');
      console.log('  1. ✨ Create missing ERC4626EditForm component');
      console.log('  2. 🗺️ Enhance mappers with complete field coverage');
      console.log('  3. 🔗 Create ERC4626-specific hooks');
      console.log('  4. 📝 Create form sub-components');
      console.log('  5. 🛠️ Update validation schemas');
      console.log('  6. 📚 Create comprehensive documentation');
      console.log('  7. 🔧 Create utility functions');
      console.log();

      await this.createERC4626EditForm();
      await this.enhanceMappers();
      await this.createHooks();
      await this.createFormSubComponents();
      await this.updateValidationSchemas();
      await this.createDocumentation();
      await this.createUtilities();
      await this.updateIndexFiles();

      console.log('🎉 ERC-4626 enhancement completed successfully!');
      console.log();
      console.log('✅ Next steps:');
      console.log('  1. Run: npm run test:erc4626 (if available)');
      console.log('  2. Run: npx tsx scripts/validate-erc4626-crud.ts');
      console.log('  3. Test token creation in both basic and advanced modes');
      console.log('  4. Verify all database fields are properly saved');
      
    } catch (error) {
      console.error('❌ Enhancement failed:', error);
      process.exit(1);
    }
  }

  /**
   * Create comprehensive ERC4626EditForm component
   */
  private async createERC4626EditForm(): Promise<void> {
    console.log('1. ✨ Creating ERC4626EditForm component...');

    const editFormContent = `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertCircle, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { EnhancedTokenData } from '../types';
import { getERC4626Token, updateERC4626FromForm } from '../services/erc4626Service';

// Form sub-components
import { BasicDetailsForm } from './erc4626/BasicDetailsForm';
import { AssetConfigForm } from './erc4626/AssetConfigForm';
import { StrategyForm } from './erc4626/StrategyForm';
import { FeesForm } from './erc4626/FeesForm';
import { FeaturesForm } from './erc4626/FeaturesForm';

interface ERC4626EditFormProps {
  tokenId: string;
  onSave?: (tokenData: EnhancedTokenData) => void;
  onCancel?: () => void;
  saveErrors?: Record<string, string>;
  isSaving?: boolean;
}

/**
 * Comprehensive ERC4626 Token Edit Form
 * Supports both basic and advanced configuration modes
 */
export const ERC4626EditForm: React.FC<ERC4626EditFormProps> = ({
  tokenId,
  onSave,
  onCancel,
  saveErrors = {},
  isSaving = false
}) => {
  const [tokenData, setTokenData] = useState<EnhancedTokenData | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load token data on mount
  useEffect(() => {
    loadTokenData();
  }, [tokenId]);

  /**
   * Load existing token data
   */
  const loadTokenData = async () => {
    try {
      setLoading(true);
      const data = await getERC4626Token(tokenId);
      setTokenData(data);
      
      // Initialize form data from token data
      setFormData({
        // Basic information
        name: data.name || '',
        symbol: data.symbol || '',
        description: data.metadata?.description || '',
        decimals: data.decimals || 18,
        
        // Asset information
        assetAddress: data.erc4626Properties?.assetAddress || '',
        assetName: data.erc4626Properties?.assetName || '',
        assetSymbol: data.erc4626Properties?.assetSymbol || '',
        assetDecimals: data.erc4626Properties?.assetDecimals || 18,
        
        // Vault configuration
        vaultType: data.erc4626Properties?.vaultType || 'yield',
        isMintable: data.erc4626Properties?.isMintable || false,
        isBurnable: data.erc4626Properties?.isBurnable || false,
        isPausable: data.erc4626Properties?.isPausable || false,
        accessControl: data.erc4626Properties?.accessControl || 'ownable',
        
        // Strategy
        yieldStrategy: data.erc4626Properties?.yieldStrategy || 'lending',
        yieldSource: data.erc4626Properties?.yieldSource || 'external',
        vaultStrategy: data.erc4626Properties?.vaultStrategy || 'simple',
        hasCustomStrategy: data.erc4626Properties?.hasCustomStrategy || false,
        strategyDescription: data.erc4626Properties?.strategyDescription || '',
        
        // Yield optimization (Phase 2 fields)
        yieldOptimizationEnabled: data.erc4626Properties?.yieldOptimizationEnabled || false,
        automatedRebalancing: data.erc4626Properties?.automatedRebalancing || false,
        rebalancingFrequency: data.erc4626Properties?.rebalancingFrequency || 'weekly',
        
        // Strategy parameters
        strategyParams: data.erc4626Properties?.strategyParams || {
          rebalanceThreshold: data.erc4626Properties?.strategyParams?.rebalanceThreshold || '',
          liquidityReserve: data.erc4626Properties?.strategyParams?.liquidityReserve || '10',
          maxSlippage: data.erc4626Properties?.strategyParams?.maxSlippage || ''
        },
        
        // Limits
        depositLimit: data.erc4626Properties?.depositLimit || '',
        withdrawalLimit: data.erc4626Properties?.withdrawalLimit || '',
        maximumWithdrawal: data.erc4626Properties?.maximumWithdrawal || '',
        
        // Fees
        depositFee: data.erc4626Properties?.depositFee || '',
        withdrawalFee: data.erc4626Properties?.withdrawalFee || '',
        managementFee: data.erc4626Properties?.managementFee || '',
        performanceFee: data.erc4626Properties?.performanceFee || '',
        feeRecipient: data.erc4626Properties?.feeRecipient || '',
        
        // Strategy parameters and asset allocations arrays
        strategyParametersList: data.erc4626StrategyParams || [],
        assetAllocations: data.erc4626AssetAllocations || []
      });
      
    } catch (error: any) {
      console.error('Failed to load token data:', error);
      setErrors({ general: \`Failed to load token: \${error.message}\` });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form field changes
   */
  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      // Handle nested field updates (e.g., "strategyParams.rebalanceThreshold")
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      
      // Handle simple field updates
      return {
        ...prev,
        [field]: value
      };
    });

    // Clear any existing error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle form submission
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrors({});

      // Validate required fields
      const validationErrors: Record<string, string> = {};
      
      if (!formData.name?.trim()) {
        validationErrors.name = 'Name is required';
      }
      
      if (!formData.symbol?.trim()) {
        validationErrors.symbol = 'Symbol is required';
      }
      
      if (!formData.assetAddress?.trim()) {
        validationErrors.assetAddress = 'Asset address is required';
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Update token using service
      const result = await updateERC4626FromForm(tokenId, formData);
      
      if (!result.success) {
        setErrors(result.errors || { general: 'Update failed' });
        return;
      }

      // Reload token data to get updated information
      await loadTokenData();
      
      // Notify parent component
      if (onSave && tokenData) {
        onSave(tokenData);
      }

    } catch (error: any) {
      console.error('Failed to save token:', error);
      setErrors({ general: \`Failed to save: \${error.message}\` });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Check if a field has a save error
   */
  const hasSaveError = (fieldName: string): boolean => {
    return !!(saveErrors[fieldName] || errors[fieldName]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading token data...</span>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load token data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save errors display */}
      {(Object.keys(saveErrors).length > 0 || Object.keys(errors).length > 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Save Error</AlertTitle>
          <AlertDescription>
            Some fields failed to save. Please check the highlighted fields and try again.
            {Object.entries({ ...saveErrors, ...errors }).map(([field, error]) => (
              <div key={field} className="mt-1">
                <strong>{field}:</strong> {error}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Edit ERC-4626 Tokenized Vault</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="asset">Asset</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <BasicDetailsForm
                formData={formData}
                onChange={handleChange}
                errors={errors}
                hasSaveError={hasSaveError}
              />
            </TabsContent>

            <TabsContent value="asset" className="space-y-4">
              <AssetConfigForm
                formData={formData}
                onChange={handleChange}
                errors={errors}
                hasSaveError={hasSaveError}
              />
            </TabsContent>

            <TabsContent value="strategy" className="space-y-4">
              <StrategyForm
                formData={formData}
                onChange={handleChange}
                errors={errors}
                hasSaveError={hasSaveError}
              />
            </TabsContent>

            <TabsContent value="fees" className="space-y-4">
              <FeesForm
                formData={formData}
                onChange={handleChange}
                errors={errors}
                hasSaveError={hasSaveError}
              />
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <FeaturesForm
                formData={formData}
                onChange={handleChange}
                errors={errors}
                hasSaveError={hasSaveError}
              />
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving || isSaving}
            >
              Cancel
            </Button>
            
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || isSaving}
            >
              {(saving || isSaving) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ERC4626EditForm;`;

    await this.ensureDirectoryExists(join(this.projectRoot, 'src/components/tokens/forms'));
    await writeFile(
      join(this.projectRoot, 'src/components/tokens/forms/ERC4626EditForm.tsx'),
      editFormContent
    );

    console.log('   ✅ Created ERC4626EditForm.tsx');
  }

  /**
   * Enhance mappers with complete field coverage
   */
  private async enhanceMappers(): Promise<void> {
    console.log('2. 🗺️ Enhancing mappers with complete field coverage...');

    // Create enhanced direct mapper
    const directMapperContent = `/**
 * Enhanced ERC4626 Direct Mapper
 * Complete field mapping between forms and database
 * 
 * Includes all Phase 2+ enhancements:
 * - yield_optimization_enabled
 * - automated_rebalancing
 * - Complete fee structure
 * - Enhanced limit controls
 * - JSONB configurations
 */

export interface ERC4626FormData {
  // Basic information
  name: string;
  symbol: string;
  description?: string;
  decimals: number;
  
  // Asset information
  assetAddress: string;
  assetName?: string;
  assetSymbol?: string;
  assetDecimals?: number;
  
  // Vault configuration
  vaultType?: 'yield' | 'fund' | 'staking' | 'lending';
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  accessControl?: 'ownable' | 'roles' | 'none';
  
  // Strategy
  yieldStrategy?: string;
  yieldSource?: string;
  vaultStrategy?: string;
  hasCustomStrategy?: boolean;
  strategyDescription?: string;
  
  // Phase 2+ Fields: Yield optimization
  yieldOptimizationEnabled?: boolean;
  automatedRebalancing?: boolean;
  rebalancingFrequency?: 'daily' | 'weekly' | 'monthly';
  
  // Strategy parameters (nested object)
  strategyParams?: {
    rebalanceThreshold?: string;
    liquidityReserve?: string;
    maxSlippage?: string;
  };
  
  // Individual limit fields (map to DB columns)
  depositLimit?: string;
  withdrawalLimit?: string;
  maximumWithdrawal?: string;
  
  // Individual fee fields (map to DB columns)
  depositFee?: string;
  withdrawalFee?: string;
  managementFee?: string;
  performanceFee?: string;
  feeRecipient?: string;
  
  // Complex JSONB configurations
  feeStructure?: Record<string, any>;
  rebalancingRules?: Record<string, any>;
  withdrawalRules?: Record<string, any>;
  
  // Array data
  strategyParametersList?: Array<{
    name: string;
    value: string;
    description?: string;
    paramType?: string;
  }>;
  assetAllocations?: Array<{
    asset: string;
    percentage: string;
    description?: string;
    protocol?: string;
    expectedApy?: string;
  }>;
}

export interface ERC4626DatabaseProperties {
  token_id: string;
  asset_address?: string;
  asset_name?: string;
  asset_symbol?: string;
  asset_decimals?: number;
  vault_type?: string;
  is_mintable?: boolean;
  is_burnable?: boolean;
  is_pausable?: boolean;
  access_control?: string;
  yield_strategy?: string;
  yield_source?: string;
  vault_strategy?: string;
  custom_strategy?: boolean;
  strategy_documentation?: string;
  
  // Phase 2+ Fields
  yield_optimization_enabled?: boolean;
  automated_rebalancing?: boolean;
  rebalance_threshold?: string;
  liquidity_reserve?: string;
  max_slippage?: string;
  
  // Individual fee columns
  deposit_fee?: string;
  withdrawal_fee?: string;
  management_fee?: string;
  performance_fee?: string;
  fee_recipient?: string;
  
  // Individual limit columns
  deposit_limit?: string;
  withdrawal_limit?: string;
  min_deposit?: string;
  max_deposit?: string;
  min_withdrawal?: string;
  max_withdrawal?: string;
  
  // JSONB columns
  fee_structure?: Record<string, any>;
  rebalancing_rules?: Record<string, any>;
  withdrawal_rules?: Record<string, any>;
}

/**
 * Map ERC4626 form data to database format
 */
export function mapERC4626FormToDatabase(
  formData: ERC4626FormData
): {
  properties: ERC4626DatabaseProperties;
  strategyParams: Array<any>;
  assetAllocations: Array<any>;
} {
  // Map properties with complete field coverage
  const properties: ERC4626DatabaseProperties = {
    token_id: formData.name, // Will be set by caller
    asset_address: formData.assetAddress,
    asset_name: formData.assetName,
    asset_symbol: formData.assetSymbol,
    asset_decimals: formData.assetDecimals || 18,
    vault_type: formData.vaultType || 'yield',
    is_mintable: formData.isMintable || false,
    is_burnable: formData.isBurnable || false,
    is_pausable: formData.isPausable || false,
    access_control: formData.accessControl || 'ownable',
    yield_strategy: formData.yieldStrategy,
    yield_source: formData.yieldSource,
    vault_strategy: formData.vaultStrategy,
    custom_strategy: formData.hasCustomStrategy || false,
    strategy_documentation: formData.strategyDescription,
    
    // Phase 2+ Fields: Yield optimization
    yield_optimization_enabled: formData.yieldOptimizationEnabled || false,
    automated_rebalancing: formData.automatedRebalancing || false,
    rebalance_threshold: formData.strategyParams?.rebalanceThreshold,
    liquidity_reserve: formData.strategyParams?.liquidityReserve || '10',
    max_slippage: formData.strategyParams?.maxSlippage,
    
    // Individual fee fields
    deposit_fee: formData.depositFee,
    withdrawal_fee: formData.withdrawalFee,
    management_fee: formData.managementFee,
    performance_fee: formData.performanceFee,
    fee_recipient: formData.feeRecipient,
    
    // Individual limit fields
    deposit_limit: formData.depositLimit,
    withdrawal_limit: formData.withdrawalLimit,
    min_deposit: undefined, // Set from limits object if available
    max_deposit: undefined, // Set from limits object if available
    min_withdrawal: undefined, // Set from limits object if available
    max_withdrawal: formData.maximumWithdrawal,
    
    // JSONB configurations
    fee_structure: formData.feeStructure,
    rebalancing_rules: formData.rebalancingRules,
    withdrawal_rules: formData.withdrawalRules
  };

  // Map strategy parameters
  const strategyParams = (formData.strategyParametersList || []).map(param => ({
    name: param.name,
    value: param.value,
    description: param.description,
    param_type: param.paramType || 'string',
    is_required: false,
    default_value: null
  }));

  // Map asset allocations
  const assetAllocations = (formData.assetAllocations || []).map(allocation => ({
    asset: allocation.asset,
    percentage: allocation.percentage,
    description: allocation.description,
    protocol: allocation.protocol,
    expected_apy: allocation.expectedApy
  }));

  return {
    properties,
    strategyParams,
    assetAllocations
  };
}

/**
 * Map database data to ERC4626 form format
 */
export function mapDatabaseToERC4626Form(
  properties: ERC4626DatabaseProperties,
  strategyParams: Array<any> = [],
  assetAllocations: Array<any> = [],
  configMode: 'min' | 'max' = 'max'
): ERC4626FormData {
  const formData: ERC4626FormData = {
    // Basic information (will be set by caller)
    name: '',
    symbol: '',
    description: '',
    decimals: 18,
    
    // Asset information
    assetAddress: properties.asset_address || '',
    assetName: properties.asset_name,
    assetSymbol: properties.asset_symbol,
    assetDecimals: properties.asset_decimals || 18,
    
    // Vault configuration
    vaultType: (properties.vault_type as any) || 'yield',
    isMintable: properties.is_mintable || false,
    isBurnable: properties.is_burnable || false,
    isPausable: properties.is_pausable || false,
    accessControl: (properties.access_control as any) || 'ownable',
    
    // Strategy
    yieldStrategy: properties.yield_strategy,
    yieldSource: properties.yield_source,
    vaultStrategy: properties.vault_strategy,
    hasCustomStrategy: properties.custom_strategy || false,
    strategyDescription: properties.strategy_documentation,
    
    // Phase 2+ Fields: Yield optimization
    yieldOptimizationEnabled: properties.yield_optimization_enabled || false,
    automatedRebalancing: properties.automated_rebalancing || false,
    rebalancingFrequency: properties.automated_rebalancing ? 'weekly' : undefined,
    
    // Strategy parameters (nested object)
    strategyParams: {
      rebalanceThreshold: properties.rebalance_threshold,
      liquidityReserve: properties.liquidity_reserve || '10',
      maxSlippage: properties.max_slippage
    },
    
    // Individual limit fields
    depositLimit: properties.deposit_limit,
    withdrawalLimit: properties.withdrawal_limit,
    maximumWithdrawal: properties.max_withdrawal,
    
    // Individual fee fields
    depositFee: properties.deposit_fee,
    withdrawalFee: properties.withdrawal_fee,
    managementFee: properties.management_fee,
    performanceFee: properties.performance_fee,
    feeRecipient: properties.fee_recipient,
    
    // JSONB configurations
    feeStructure: properties.fee_structure,
    rebalancingRules: properties.rebalancing_rules,
    withdrawalRules: properties.withdrawal_rules,
    
    // Array data
    strategyParametersList: strategyParams.map(param => ({
      name: param.name,
      value: param.value,
      description: param.description,
      paramType: param.param_type || 'string'
    })),
    assetAllocations: assetAllocations.map(allocation => ({
      asset: allocation.asset,
      percentage: allocation.percentage,
      description: allocation.description,
      protocol: allocation.protocol,
      expectedApy: allocation.expected_apy
    }))
  };

  return formData;
}`;

    await this.ensureDirectoryExists(join(this.projectRoot, 'src/components/tokens/utils/mappers/erc4626Direct'));
    await writeFile(
      join(this.projectRoot, 'src/components/tokens/utils/mappers/erc4626Direct/enhancedMapper.ts'),
      directMapperContent
    );

    console.log('   ✅ Created enhanced direct mapper');
  }

  /**
   * Create ERC4626-specific hooks
   */
  private async createHooks(): Promise<void> {
    console.log('3. 🔗 Creating ERC4626-specific hooks...');

    const hooksContent = `import { useState, useEffect, useCallback } from 'react';
import { getERC4626Token, updateERC4626FromForm, deleteERC4626Token } from '../services/erc4626Service';
import { EnhancedTokenData } from '../types';

/**
 * Hook for managing ERC4626 token state
 */
export const useERC4626Token = (tokenId: string) => {
  const [tokenData, setTokenData] = useState<EnhancedTokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadToken = useCallback(async () => {
    if (!tokenId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getERC4626Token(tokenId);
      setTokenData(data);
    } catch (err: any) {
      setError(err.message);
      setTokenData(null);
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  const updateToken = useCallback(async (formData: any) => {
    try {
      setError(null);
      const result = await updateERC4626FromForm(tokenId, formData);
      
      if (!result.success) {
        throw new Error(Object.values(result.errors || {}).join(', '));
      }
      
      await loadToken(); // Reload to get updated data
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [tokenId, loadToken]);

  const deleteToken = useCallback(async () => {
    try {
      setError(null);
      const result = await deleteERC4626Token(tokenId);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      setTokenData(null);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [tokenId]);

  return {
    tokenData,
    loading,
    error,
    loadToken,
    updateToken,
    deleteToken
  };
};

/**
 * Hook for ERC4626 form validation
 */
export const useERC4626Validation = () => {
  const validateForm = useCallback((formData: any) => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.symbol?.trim()) {
      errors.symbol = 'Symbol is required';
    }

    if (!formData.assetAddress?.trim()) {
      errors.assetAddress = 'Asset address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.assetAddress)) {
      errors.assetAddress = 'Invalid Ethereum address format';
    }

    // Fee validation
    const validateFee = (value: string, fieldName: string) => {
      if (value && (!/^\\d*\\.?\\d+$/.test(value) || parseFloat(value) < 0 || parseFloat(value) > 100)) {
        errors[fieldName] = 'Fee must be a number between 0 and 100';
      }
    };

    validateFee(formData.depositFee, 'depositFee');
    validateFee(formData.withdrawalFee, 'withdrawalFee');
    validateFee(formData.managementFee, 'managementFee');
    validateFee(formData.performanceFee, 'performanceFee');

    // Limit validation
    const validateLimit = (value: string, fieldName: string) => {
      if (value && !/^\\d*\\.?\\d+$/.test(value)) {
        errors[fieldName] = 'Limit must be a valid number';
      }
    };

    validateLimit(formData.depositLimit, 'depositLimit');
    validateLimit(formData.withdrawalLimit, 'withdrawalLimit');
    validateLimit(formData.maximumWithdrawal, 'maximumWithdrawal');

    // Strategy params validation
    if (formData.strategyParams?.rebalanceThreshold) {
      validateFee(formData.strategyParams.rebalanceThreshold, 'strategyParams.rebalanceThreshold');
    }

    if (formData.strategyParams?.liquidityReserve) {
      validateFee(formData.strategyParams.liquidityReserve, 'strategyParams.liquidityReserve');
    }

    if (formData.strategyParams?.maxSlippage) {
      validateFee(formData.strategyParams.maxSlippage, 'strategyParams.maxSlippage');
    }

    // Asset allocations validation
    if (formData.assetAllocations && formData.assetAllocations.length > 0) {
      let totalAllocation = 0;
      
      formData.assetAllocations.forEach((allocation: any, index: number) => {
        if (!allocation.asset?.trim()) {
          errors[\`assetAllocations[\${index}].asset\`] = 'Asset address is required';
        } else if (!/^0x[a-fA-F0-9]{40}$/.test(allocation.asset)) {
          errors[\`assetAllocations[\${index}].asset\`] = 'Invalid asset address format';
        }

        if (!allocation.percentage || !/^\\d*\\.?\\d+$/.test(allocation.percentage)) {
          errors[\`assetAllocations[\${index}].percentage\`] = 'Valid percentage is required';
        } else {
          const percentage = parseFloat(allocation.percentage);
          if (percentage < 0 || percentage > 100) {
            errors[\`assetAllocations[\${index}].percentage\`] = 'Percentage must be between 0 and 100';
          }
          totalAllocation += percentage;
        }
      });

      if (totalAllocation > 100) {
        errors.assetAllocations = 'Total allocation cannot exceed 100%';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  return { validateForm };
};

/**
 * Hook for ERC4626 strategy management
 */
export const useERC4626Strategy = () => {
  const [strategies] = useState([
    { value: 'lending', label: 'Lending (Aave, Compound)', description: 'Lend assets to earn interest' },
    { value: 'staking', label: 'Staking', description: 'Stake assets in proof-of-stake networks' },
    { value: 'liquidity', label: 'Liquidity Provision', description: 'Provide liquidity to DEXs' },
    { value: 'yield_farming', label: 'Yield Farming', description: 'Participate in yield farming protocols' },
    { value: 'custom', label: 'Custom Strategy', description: 'Implement custom yield strategy' }
  ]);

  const [yieldSources] = useState([
    { value: 'external', label: 'External Protocol' },
    { value: 'compound', label: 'Compound' },
    { value: 'aave', label: 'Aave' },
    { value: 'yearn', label: 'Yearn' },
    { value: 'convex', label: 'Convex' },
    { value: 'hybrid', label: 'Multi-Protocol Hybrid' }
  ]);

  const [vaultTypes] = useState([
    { value: 'yield', label: 'Yield Generation', description: 'Focus on generating yield from assets' },
    { value: 'fund', label: 'Investment Fund', description: 'Managed investment portfolio' },
    { value: 'staking', label: 'Staking', description: 'Stake assets for rewards' },
    { value: 'lending', label: 'Lending Pool', description: 'Decentralized lending protocol' }
  ]);

  return {
    strategies,
    yieldSources,
    vaultTypes
  };
};`;

    await writeFile(
      join(this.projectRoot, 'src/components/tokens/hooks/useERC4626.ts'),
      hooksContent
    );

    console.log('   ✅ Created ERC4626 hooks');
  }

  /**
   * Create form sub-components
   */
  private async createFormSubComponents(): Promise<void> {
    console.log('4. 📝 Creating form sub-components...');

    await this.ensureDirectoryExists(join(this.projectRoot, 'src/components/tokens/forms/erc4626'));

    // Basic Details Form
    const basicDetailsForm = `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BasicDetailsFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  hasSaveError: (field: string) => boolean;
}

export const BasicDetailsForm: React.FC<BasicDetailsFormProps> = ({
  formData,
  onChange,
  errors,
  hasSaveError
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={\`space-y-2 \${hasSaveError('name') ? 'border-red-500 border rounded-md p-4' : ''}\`}>
            <Label htmlFor="name">Vault Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="My Yield Vault"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className={\`space-y-2 \${hasSaveError('symbol') ? 'border-red-500 border rounded-md p-4' : ''}\`}>
            <Label htmlFor="symbol">Vault Token Symbol *</Label>
            <Input
              id="symbol"
              value={formData.symbol}
              onChange={(e) => onChange('symbol', e.target.value)}
              placeholder="yTKN"
              className={errors.symbol ? 'border-red-500' : ''}
            />
            {errors.symbol && <p className="text-sm text-red-500">{errors.symbol}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="A brief description of your vault and its yield strategy"
            className="min-h-20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="decimals">Vault Share Decimals *</Label>
            <Input
              id="decimals"
              type="number"
              min="0"
              max="18"
              value={formData.decimals}
              onChange={(e) => onChange('decimals', parseInt(e.target.value))}
              placeholder="18"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaultType">Vault Type *</Label>
            <Select value={formData.vaultType} onValueChange={(value) => onChange('vaultType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select vault type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yield">Yield Generation</SelectItem>
                <SelectItem value="fund">Investment Fund</SelectItem>
                <SelectItem value="staking">Staking</SelectItem>
                <SelectItem value="lending">Lending Pool</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};`;

    await writeFile(
      join(this.projectRoot, 'src/components/tokens/forms/erc4626/BasicDetailsForm.tsx'),
      basicDetailsForm
    );

    // Asset Config Form
    const assetConfigForm = `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AssetConfigFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  hasSaveError: (field: string) => boolean;
}

export const AssetConfigForm: React.FC<AssetConfigFormProps> = ({
  formData,
  onChange,
  errors,
  hasSaveError
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Underlying Asset Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={\`space-y-2 \${hasSaveError('assetAddress') ? 'border-red-500 border rounded-md p-4' : ''}\`}>
          <Label htmlFor="assetAddress">Asset Token Address *</Label>
          <Input
            id="assetAddress"
            value={formData.assetAddress}
            onChange={(e) => onChange('assetAddress', e.target.value)}
            placeholder="0x..."
            className={errors.assetAddress ? 'border-red-500' : ''}
          />
          {errors.assetAddress && <p className="text-sm text-red-500">{errors.assetAddress}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="assetName">Asset Name</Label>
            <Input
              id="assetName"
              value={formData.assetName}
              onChange={(e) => onChange('assetName', e.target.value)}
              placeholder="e.g., DAI Stablecoin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetSymbol">Asset Symbol</Label>
            <Input
              id="assetSymbol"
              value={formData.assetSymbol}
              onChange={(e) => onChange('assetSymbol', e.target.value)}
              placeholder="e.g., DAI"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assetDecimals">Asset Token Decimals *</Label>
          <Input
            id="assetDecimals"
            type="number"
            min="0"
            max="18"
            value={formData.assetDecimals}
            onChange={(e) => onChange('assetDecimals', parseInt(e.target.value))}
            placeholder="18"
          />
        </div>
      </CardContent>
    </Card>
  );
};`;

    await writeFile(
      join(this.projectRoot, 'src/components/tokens/forms/erc4626/AssetConfigForm.tsx'),
      assetConfigForm
    );

    // Strategy Form with Phase 2+ enhancements
    const strategyForm = `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface StrategyFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  hasSaveError: (field: string) => boolean;
}

export const StrategyForm: React.FC<StrategyFormProps> = ({
  formData,
  onChange,
  errors,
  hasSaveError
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Yield Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="yieldStrategy">Yield Strategy Type *</Label>
              <Select value={formData.yieldStrategy} onValueChange={(value) => onChange('yieldStrategy', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select yield strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lending">Lending (Aave, Compound)</SelectItem>
                  <SelectItem value="staking">Staking</SelectItem>
                  <SelectItem value="liquidity">Liquidity Provision</SelectItem>
                  <SelectItem value="custom">Custom Strategy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yieldSource">Yield Source</Label>
              <Select value={formData.yieldSource} onValueChange={(value) => onChange('yieldSource', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select yield source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">External Protocol</SelectItem>
                  <SelectItem value="compound">Compound</SelectItem>
                  <SelectItem value="aave">Aave</SelectItem>
                  <SelectItem value="yearn">Yearn</SelectItem>
                  <SelectItem value="convex">Convex</SelectItem>
                  <SelectItem value="hybrid">Multi-Protocol Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategyDescription">Strategy Description</Label>
            <Textarea
              id="strategyDescription"
              value={formData.strategyDescription}
              onChange={(e) => onChange('strategyDescription', e.target.value)}
              placeholder="Explain how your vault will generate yield..."
              className="min-h-24"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yield Optimization & Automation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Yield Optimization</span>
              </div>
              <Switch
                checked={formData.yieldOptimizationEnabled}
                onCheckedChange={(checked) => onChange('yieldOptimizationEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Automated Rebalancing</span>
              </div>
              <Switch
                checked={formData.automatedRebalancing}
                onCheckedChange={(checked) => onChange('automatedRebalancing', checked)}
              />
            </div>
          </div>

          {formData.automatedRebalancing && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Rebalancing Parameters</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="rebalanceThreshold">Rebalance Threshold (%)</Label>
                    <Input
                      id="rebalanceThreshold"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.strategyParams?.rebalanceThreshold || ''}
                      onChange={(e) => onChange('strategyParams.rebalanceThreshold', e.target.value)}
                      placeholder="5.0"
                      className={errors['strategyParams.rebalanceThreshold'] ? 'border-red-500' : ''}
                    />
                    {errors['strategyParams.rebalanceThreshold'] && (
                      <p className="text-sm text-red-500">{errors['strategyParams.rebalanceThreshold']}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="liquidityReserve">Liquidity Reserve (%)</Label>
                    <Input
                      id="liquidityReserve"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.strategyParams?.liquidityReserve || '10'}
                      onChange={(e) => onChange('strategyParams.liquidityReserve', e.target.value)}
                      placeholder="10"
                      className={errors['strategyParams.liquidityReserve'] ? 'border-red-500' : ''}
                    />
                    {errors['strategyParams.liquidityReserve'] && (
                      <p className="text-sm text-red-500">{errors['strategyParams.liquidityReserve']}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxSlippage">Maximum Slippage (%)</Label>
                    <Input
                      id="maxSlippage"
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={formData.strategyParams?.maxSlippage || ''}
                      onChange={(e) => onChange('strategyParams.maxSlippage', e.target.value)}
                      placeholder="1.0"
                      className={errors['strategyParams.maxSlippage'] ? 'border-red-500' : ''}
                    />
                    {errors['strategyParams.maxSlippage'] && (
                      <p className="text-sm text-red-500">{errors['strategyParams.maxSlippage']}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};`;

    await writeFile(
      join(this.projectRoot, 'src/components/tokens/forms/erc4626/StrategyForm.tsx'),
      strategyForm
    );

    // Fees Form with complete fee structure
    const feesForm = `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FeesFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  hasSaveError: (field: string) => boolean;
}

export const FeesForm: React.FC<FeesFormProps> = ({
  formData,
  onChange,
  errors,
  hasSaveError
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fee Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={\`space-y-2 \${hasSaveError('managementFee') ? 'border-red-500 border rounded-md p-4' : ''}\`}>
              <Label htmlFor="managementFee">Management Fee (% per year)</Label>
              <Input
                id="managementFee"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.managementFee}
                onChange={(e) => onChange('managementFee', e.target.value)}
                placeholder="2.0"
                className={errors.managementFee ? 'border-red-500' : ''}
              />
              {errors.managementFee && <p className="text-sm text-red-500">{errors.managementFee}</p>}
            </div>

            <div className={\`space-y-2 \${hasSaveError('performanceFee') ? 'border-red-500 border rounded-md p-4' : ''}\`}>
              <Label htmlFor="performanceFee">Performance Fee (%)</Label>
              <Input
                id="performanceFee"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.performanceFee}
                onChange={(e) => onChange('performanceFee', e.target.value)}
                placeholder="20.0"
                className={errors.performanceFee ? 'border-red-500' : ''}
              />
              {errors.performanceFee && <p className="text-sm text-red-500">{errors.performanceFee}</p>}
            </div>

            <div className={\`space-y-2 \${hasSaveError('depositFee') ? 'border-red-500 border rounded-md p-4' : ''}\`}>
              <Label htmlFor="depositFee">Deposit Fee (%)</Label>
              <Input
                id="depositFee"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.depositFee}
                onChange={(e) => onChange('depositFee', e.target.value)}
                placeholder="0.1"
                className={errors.depositFee ? 'border-red-500' : ''}
              />
              {errors.depositFee && <p className="text-sm text-red-500">{errors.depositFee}</p>}
            </div>

            <div className={\`space-y-2 \${hasSaveError('withdrawalFee') ? 'border-red-500 border rounded-md p-4' : ''}\`}>
              <Label htmlFor="withdrawalFee">Withdrawal Fee (%)</Label>
              <Input
                id="withdrawalFee"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.withdrawalFee}
                onChange={(e) => onChange('withdrawalFee', e.target.value)}
                placeholder="0.1"
                className={errors.withdrawalFee ? 'border-red-500' : ''}
              />
              {errors.withdrawalFee && <p className="text-sm text-red-500">{errors.withdrawalFee}</p>}
            </div>
          </div>

          <div className={\`space-y-2 \${hasSaveError('feeRecipient') ? 'border-red-500 border rounded-md p-4' : ''}\`}>
            <Label htmlFor="feeRecipient">Fee Recipient Address</Label>
            <Input
              id="feeRecipient"
              value={formData.feeRecipient}
              onChange={(e) => onChange('feeRecipient', e.target.value)}
              placeholder="0x... (address to receive fees)"
              className={errors.feeRecipient ? 'border-red-500' : ''}
            />
            {errors.feeRecipient && <p className="text-sm text-red-500">{errors.feeRecipient}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deposit & Withdrawal Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={\`space-y-2 \${hasSaveError('depositLimit') ? 'border-red-500 border rounded-md p-4' : ''}\`}>
              <Label htmlFor="depositLimit">Total Deposit Limit</Label>
              <Input
                id="depositLimit"
                value={formData.depositLimit}
                onChange={(e) => onChange('depositLimit', e.target.value)}
                placeholder="Leave blank for unlimited"
                className={errors.depositLimit ? 'border-red-500' : ''}
              />
              {errors.depositLimit && <p className="text-sm text-red-500">{errors.depositLimit}</p>}
            </div>

            <div className={\`space-y-2 \${hasSaveError('withdrawalLimit') ? 'border-red-500 border rounded-md p-4' : ''}\`}>
              <Label htmlFor="withdrawalLimit">Daily Withdrawal Limit</Label>
              <Input
                id="withdrawalLimit"
                value={formData.withdrawalLimit}
                onChange={(e) => onChange('withdrawalLimit', e.target.value)}
                placeholder="Leave blank for unlimited"
                className={errors.withdrawalLimit ? 'border-red-500' : ''}
              />
              {errors.withdrawalLimit && <p className="text-sm text-red-500">{errors.withdrawalLimit}</p>}
            </div>

            <div className={\`space-y-2 \${hasSaveError('maximumWithdrawal') ? 'border-red-500 border rounded-md p-4' : ''}\`}>
              <Label htmlFor="maximumWithdrawal">Maximum Withdrawal Per Transaction</Label>
              <Input
                id="maximumWithdrawal"
                value={formData.maximumWithdrawal}
                onChange={(e) => onChange('maximumWithdrawal', e.target.value)}
                placeholder="Leave blank for no maximum"
                className={errors.maximumWithdrawal ? 'border-red-500' : ''}
              />
              {errors.maximumWithdrawal && <p className="text-sm text-red-500">{errors.maximumWithdrawal}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};`;

    await writeFile(
      join(this.projectRoot, 'src/components/tokens/forms/erc4626/FeesForm.tsx'),
      feesForm
    );

    // Features Form
    const featuresForm = `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FeaturesFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  hasSaveError: (field: string) => boolean;
}

export const FeaturesForm: React.FC<FeaturesFormProps> = ({
  formData,
  onChange,
  errors,
  hasSaveError
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Standard Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Mintable</span>
              </div>
              <Switch
                checked={formData.isMintable}
                onCheckedChange={(checked) => onChange('isMintable', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Burnable</span>
              </div>
              <Switch
                checked={formData.isBurnable}
                onCheckedChange={(checked) => onChange('isBurnable', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Pausable</span>
              </div>
              <Switch
                checked={formData.isPausable}
                onCheckedChange={(checked) => onChange('isPausable', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessControl">Access Control Model</Label>
            <Select value={formData.accessControl} onValueChange={(value) => onChange('accessControl', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select access control" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ownable">Ownable (Single owner)</SelectItem>
                <SelectItem value="roles">Role-Based (Multiple roles)</SelectItem>
                <SelectItem value="none">None (No central control)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};`;

    await writeFile(
      join(this.projectRoot, 'src/components/tokens/forms/erc4626/FeaturesForm.tsx'),
      featuresForm
    );

    console.log('   ✅ Created form sub-components');
  }

  /**
   * Update validation schemas
   */
  private async updateValidationSchemas(): Promise<void> {
    console.log('5. 🛠️ Updating validation schemas...');

    // Add enhanced validation schema
    const enhancedSchemaContent = `import { z } from 'zod';

/**
 * Enhanced ERC4626 validation schema with Phase 2+ fields
 * Includes yield optimization, automated rebalancing, and complete fee structure
 */

// Strategy parameters validation
const strategyParamsSchema = z.object({
  rebalanceThreshold: z.string()
    .refine(val => val === '' || (/^[0-9]+(\.[0-9]+)?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) <= 100), {
      message: 'Rebalance threshold must be a number between 0 and 100'
    })
    .optional(),
  liquidityReserve: z.string()
    .refine(val => val === '' || (/^[0-9]+(\.[0-9]+)?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) <= 100), {
      message: 'Liquidity reserve must be a number between 0 and 100'
    })
    .optional(),
  maxSlippage: z.string()
    .refine(val => val === '' || (/^[0-9]+(\.[0-9]+)?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) <= 10), {
      message: 'Max slippage must be a number between 0 and 10'
    })
    .optional(),
}).optional();

// Enhanced ERC4626 form schema with all Phase 2+ fields
export const erc4626EnhancedFormSchema = z.object({
  // Basic information
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  description: z.string().optional(),
  decimals: z.number().int().min(0).max(18).default(18),
  
  // Asset information
  assetAddress: z.string()
    .min(1, 'Asset address is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  assetName: z.string().optional(),
  assetSymbol: z.string().optional(),
  assetDecimals: z.number().int().min(0).max(18).default(18),
  
  // Vault configuration
  vaultType: z.enum(['yield', 'fund', 'staking', 'lending']).default('yield'),
  isMintable: z.boolean().default(false),
  isBurnable: z.boolean().default(false),
  isPausable: z.boolean().default(false),
  accessControl: z.enum(['ownable', 'roles', 'none']).default('ownable'),
  
  // Strategy
  yieldStrategy: z.string().optional(),
  yieldSource: z.string().optional(),
  vaultStrategy: z.string().optional(),
  hasCustomStrategy: z.boolean().default(false),
  strategyDescription: z.string().optional(),
  
  // Phase 2+ Fields: Yield optimization
  yieldOptimizationEnabled: z.boolean().default(false),
  automatedRebalancing: z.boolean().default(false),
  rebalancingFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  
  // Strategy parameters (nested object)
  strategyParams: strategyParamsSchema,
  
  // Individual fee fields
  depositFee: z.string()
    .refine(val => val === '' || (/^[0-9]+(\.[0-9]+)?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) <= 100), {
      message: 'Deposit fee must be a number between 0 and 100'
    })
    .optional(),
  withdrawalFee: z.string()
    .refine(val => val === '' || (/^[0-9]+(\.[0-9]+)?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) <= 100), {
      message: 'Withdrawal fee must be a number between 0 and 100'
    })
    .optional(),
  managementFee: z.string()
    .refine(val => val === '' || (/^[0-9]+(\.[0-9]+)?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) <= 100), {
      message: 'Management fee must be a number between 0 and 100'
    })
    .optional(),
  performanceFee: z.string()
    .refine(val => val === '' || (/^[0-9]+(\.[0-9]+)?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) <= 100), {
      message: 'Performance fee must be a number between 0 and 100'
    })
    .optional(),
  feeRecipient: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
    .optional(),
  
  // Individual limit fields
  depositLimit: z.string()
    .refine(val => val === '' || /^[0-9]+(\.[0-9]+)?$/.test(val), {
      message: 'Deposit limit must be a valid number'
    })
    .optional(),
  withdrawalLimit: z.string()
    .refine(val => val === '' || /^[0-9]+(\.[0-9]+)?$/.test(val), {
      message: 'Withdrawal limit must be a valid number'
    })
    .optional(),
  maximumWithdrawal: z.string()
    .refine(val => val === '' || /^[0-9]+(\.[0-9]+)?$/.test(val), {
      message: 'Maximum withdrawal must be a valid number'
    })
    .optional(),
  
  // Complex JSONB configurations
  feeStructure: z.record(z.unknown()).optional(),
  rebalancingRules: z.record(z.unknown()).optional(),
  withdrawalRules: z.record(z.unknown()).optional(),
  
  // Array data
  strategyParametersList: z.array(z.object({
    name: z.string().min(1, 'Parameter name is required'),
    value: z.string().min(1, 'Parameter value is required'),
    description: z.string().optional(),
    paramType: z.string().optional()
  })).optional(),
  
  assetAllocations: z.array(z.object({
    asset: z.string()
      .min(1, 'Asset address is required')
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid asset address format'),
    percentage: z.string()
      .refine(val => /^[0-9]+(\.[0-9]+)?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) <= 100, {
        message: 'Percentage must be a number between 0 and 100'
      }),
    description: z.string().optional(),
    protocol: z.string().optional(),
    expectedApy: z.string().optional()
  })).optional()
});

export type ERC4626EnhancedFormValues = z.infer<typeof erc4626EnhancedFormSchema>;

/**
 * Validation function with custom business rules
 */
export const validateERC4626Enhanced = (data: ERC4626EnhancedFormValues): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Validate asset allocations total
  if (data.assetAllocations && data.assetAllocations.length > 0) {
    const totalAllocation = data.assetAllocations.reduce((sum, allocation) => {
      return sum + parseFloat(allocation.percentage);
    }, 0);

    if (totalAllocation > 100) {
      errors.assetAllocations = 'Total allocation cannot exceed 100%';
    }
  }

  // Validate yield optimization requires automated rebalancing for some strategies
  if (data.yieldOptimizationEnabled && !data.automatedRebalancing && data.yieldStrategy === 'liquidity') {
    errors.automatedRebalancing = 'Liquidity provision strategy requires automated rebalancing';
  }

  // Validate strategy parameters are provided when automated rebalancing is enabled
  if (data.automatedRebalancing) {
    if (!data.strategyParams?.rebalanceThreshold) {
      errors['strategyParams.rebalanceThreshold'] = 'Rebalance threshold is required when automated rebalancing is enabled';
    }
    if (!data.strategyParams?.liquidityReserve) {
      errors['strategyParams.liquidityReserve'] = 'Liquidity reserve is required when automated rebalancing is enabled';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};`;

    await writeFile(
      join(this.projectRoot, 'src/components/tokens/validation/schemas/erc4626EnhancedSchema.ts'),
      enhancedSchemaContent
    );

    console.log('   ✅ Created enhanced validation schema');
  }

  /**
   * Create comprehensive documentation
   */
  private async createDocumentation(): Promise<void> {
    console.log('6. 📚 Creating comprehensive documentation...');

    const documentationContent = `# ERC-4626 Tokenized Vault Implementation

## Overview

This document provides comprehensive guidance for working with ERC-4626 tokenized vault tokens in the Chain Capital Production platform.

## Features Implemented

### Core ERC-4626 Standard
- ✅ Complete vault share token implementation
- ✅ Deposit and withdrawal functionality
- ✅ Preview functions (previewDeposit, previewMint, etc.)
- ✅ Asset management and accounting
- ✅ Compliance with ERC-4626 specification

### Phase 2+ Enhancements
- ✅ Yield optimization strategies
- ✅ Automated rebalancing
- ✅ Complete fee structure (deposit, withdrawal, management, performance)
- ✅ Enhanced limit controls (deposit/withdrawal limits)
- ✅ Strategy parameter configuration
- ✅ Asset allocation management
- ✅ JSONB configuration support (fee structure, rebalancing rules, withdrawal rules)

## Database Schema

### Main Tables

#### \`token_erc4626_properties\`
Contains the core ERC-4626 vault configuration:

- \`asset_address\` - Address of the underlying asset
- \`asset_name\`, \`asset_symbol\`, \`asset_decimals\` - Asset metadata
- \`vault_type\` - Type of vault (yield, fund, staking, lending)
- \`is_mintable\`, \`is_burnable\`, \`is_pausable\` - Standard features
- \`yield_optimization_enabled\` - Enable yield optimization strategies
- \`automated_rebalancing\` - Enable automated portfolio rebalancing
- \`deposit_fee\`, \`withdrawal_fee\`, \`management_fee\`, \`performance_fee\` - Fee structure
- \`fee_recipient\` - Address to receive fees
- \`deposit_limit\`, \`withdrawal_limit\` - Total limits
- \`min_deposit\`, \`max_deposit\`, \`min_withdrawal\`, \`max_withdrawal\` - Per-transaction limits
- \`fee_structure\`, \`rebalancing_rules\`, \`withdrawal_rules\` - JSONB configurations

#### \`token_erc4626_strategy_params\`
Strategy-specific parameters:

- \`name\` - Parameter name
- \`value\` - Parameter value
- \`description\` - Parameter description
- \`param_type\` - Parameter type (string, number, percentage)

#### \`token_erc4626_asset_allocations\`
Asset allocation configuration:

- \`asset\` - Asset address
- \`percentage\` - Allocation percentage
- \`description\` - Allocation description
- \`protocol\` - Protocol used for this allocation
- \`expected_apy\` - Expected annual percentage yield

## Service Layer (\`erc4626Service.ts\`)

### Main Functions

#### \`getERC4626Token(tokenId: string)\`
Retrieves complete ERC-4626 token data including:
- Main token properties
- ERC-4626 specific properties
- Strategy parameters
- Asset allocations

#### \`updateERC4626FromForm(tokenId: string, formData: any)\`
Updates ERC-4626 token from form data:
- Validates and maps form data to database format
- Updates main properties
- Updates strategy parameters (replaces all)
- Updates asset allocations (replaces all)
- Returns success/error status

#### \`deleteERC4626Token(tokenId: string)\`
Deletes ERC-4626 token and all related data:
- Deletes strategy parameters
- Deletes asset allocations
- Deletes main properties
- Deletes main token record

#### \`mapERC4626PropertiesToFormData(properties: any)\`
Converts database properties to form-compatible format:
- Handles both flat and nested fee structures
- Ensures array fields are present
- Provides default values for missing fields

## Configuration Components

### Basic Configuration (\`/config/min/ERC4626Config.tsx\`)
Simplified configuration for basic vault setup:
- Asset configuration
- Basic fee structure
- Deposit limits
- Core features (pausable)

### Advanced Configuration (\`/config/max/ERC4626Config.tsx\`)
Comprehensive configuration with all features:
- Complete vault details
- Asset configuration
- Strategy management with yield optimization
- Fee structure with all fee types
- Deposit/withdrawal limits
- Access control
- Protocol integrations
- JSONB configurations

## Form Components

### Main Edit Form (\`/forms/ERC4626EditForm.tsx\`)
Tabbed interface for editing ERC-4626 tokens:
- Basic Details tab
- Asset Configuration tab
- Strategy tab (with yield optimization)
- Fees tab (complete fee structure)
- Features tab

### Sub-Components (\`/forms/erc4626/\`)
- \`BasicDetailsForm.tsx\` - Name, symbol, description, vault type
- \`AssetConfigForm.tsx\` - Underlying asset configuration
- \`StrategyForm.tsx\` - Yield strategy and optimization settings
- \`FeesForm.tsx\` - Complete fee structure and limits
- \`FeaturesForm.tsx\` - Standard features and access control

## Validation

### Enhanced Schema (\`erc4626EnhancedSchema.ts\`)
Comprehensive validation with:
- Address format validation
- Fee percentage validation (0-100%)
- Limit validation (positive numbers)
- Asset allocation validation (total ≤ 100%)
- Business rule validation

### Custom Validation Functions
- \`validateERC4626Enhanced()\` - Complete form validation
- Custom business rules (e.g., liquidity strategies require rebalancing)

## Hooks (\`/hooks/useERC4626.ts\`)

### \`useERC4626Token(tokenId)\`
Manages ERC-4626 token state:
- Loads token data
- Provides update and delete functions
- Handles loading and error states

### \`useERC4626Validation()\`
Form validation hook:
- Validates all form fields
- Provides detailed error messages
- Validates business rules

### \`useERC4626Strategy()\`
Strategy management utilities:
- Predefined strategy options
- Yield source options
- Vault type options

## Mappers

### Direct Mapper (\`/mappers/erc4626Direct/enhancedMapper.ts\`)
Complete field mapping between forms and database:
- \`mapERC4626FormToDatabase()\` - Form to database format
- \`mapDatabaseToERC4626Form()\` - Database to form format
- Handles all Phase 2+ fields
- Supports both min and max configurations

### Standard Mappers
- \`maxMapper.ts\` - Advanced configuration mapping
- \`minMapper.ts\` - Basic configuration mapping

## Usage Examples

### Creating a New Vault
\`\`\`typescript
const vaultData = {
  name: 'My Yield Vault',
  symbol: 'MYV',
  assetAddress: '0x...',
  vaultType: 'yield',
  yieldOptimizationEnabled: true,
  automatedRebalancing: true,
  managementFee: '2.0',
  performanceFee: '20.0'
};

const result = await updateERC4626FromForm(tokenId, vaultData);
\`\`\`

### Loading Vault Data
\`\`\`typescript
const vault = await getERC4626Token(tokenId);
console.log(vault.erc4626Properties.yieldOptimizationEnabled);
\`\`\`

### Using the Hook
\`\`\`typescript
const { tokenData, loading, error, updateToken } = useERC4626Token(tokenId);

const handleSave = async (formData) => {
  await updateToken(formData);
};
\`\`\`

## Testing

### Validation Script
Run the comprehensive validation script:
\`\`\`bash
npx tsx scripts/validate-erc4626-crud.ts
\`\`\`

This validates:
- Database schema completeness
- Service layer functionality
- Mapper implementations
- Form components
- Complete CRUD operations
- Field mapping coverage

## Best Practices

### Fee Structure
- Use percentage values (0-100) for all fees
- Always validate fee recipient addresses
- Consider total fee impact on users

### Yield Optimization
- Enable automated rebalancing for liquidity strategies
- Set appropriate rebalance thresholds (typically 3-10%)
- Maintain adequate liquidity reserves (10-20%)

### Asset Allocations
- Ensure total allocations don't exceed 100%
- Validate asset addresses
- Document allocation rationale

### Strategy Parameters
- Use descriptive parameter names
- Provide clear descriptions
- Set appropriate defaults

## Troubleshooting

### Common Issues

1. **Field Not Saving**
   - Check field mapping in service layer
   - Verify database column exists
   - Validate form field name matches mapper

2. **Validation Errors**
   - Check enhanced schema validation
   - Verify business rule compliance
   - Validate address formats

3. **Array Data Issues**
   - Ensure arrays are properly initialized
   - Check for proper array mapping in service
   - Validate array item structure

### Debug Steps

1. Check browser console for errors
2. Verify database data in Supabase
3. Test individual service functions
4. Run validation script
5. Check mapper field coverage

## Future Enhancements

### Planned Features
- Real-time yield tracking
- Advanced rebalancing strategies
- Multi-protocol integrations
- Performance analytics
- Risk management tools

### Extension Points
- Custom strategy implementations
- Additional fee types
- Enhanced limit controls
- Advanced asset allocation strategies
- Integration with external yield sources

---

This implementation provides a comprehensive foundation for ERC-4626 tokenized vault management with room for future expansion and customization.`;

    await writeFile(
      join(this.projectRoot, 'docs/erc4626-implementation-guide.md'),
      documentationContent
    );

    console.log('   ✅ Created comprehensive documentation');
  }

  /**
   * Create utility functions
   */
  private async createUtilities(): Promise<void> {
    console.log('7. 🔧 Creating utility functions...');

    const utilitiesContent = `/**
 * ERC-4626 Utility Functions
 * Helper functions for working with ERC-4626 tokenized vaults
 */

import { ERC4626EnhancedFormValues } from '../validation/schemas/erc4626EnhancedSchema';

/**
 * Calculate total fees for a vault
 */
export const calculateTotalFees = (formData: ERC4626EnhancedFormValues): number => {
  let totalFees = 0;
  
  if (formData.depositFee) totalFees += parseFloat(formData.depositFee);
  if (formData.withdrawalFee) totalFees += parseFloat(formData.withdrawalFee);
  if (formData.managementFee) totalFees += parseFloat(formData.managementFee);
  if (formData.performanceFee) totalFees += parseFloat(formData.performanceFee);
  
  return totalFees;
};

/**
 * Validate asset allocation totals
 */
export const validateAssetAllocations = (allocations: Array<{ percentage: string }>): {
  isValid: boolean;
  total: number;
  error?: string;
} => {
  if (!allocations || allocations.length === 0) {
    return { isValid: true, total: 0 };
  }
  
  let total = 0;
  for (const allocation of allocations) {
    const percentage = parseFloat(allocation.percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return {
        isValid: false,
        total: 0,
        error: 'Invalid percentage value'
      };
    }
    total += percentage;
  }
  
  if (total > 100) {
    return {
      isValid: false,
      total,
      error: 'Total allocation exceeds 100%'
    };
  }
  
  return { isValid: true, total };
};

/**
 * Generate strategy parameter defaults based on strategy type
 */
export const getStrategyDefaults = (strategyType: string): {
  rebalanceThreshold: string;
  liquidityReserve: string;
  maxSlippage: string;
} => {
  const defaults = {
    lending: {
      rebalanceThreshold: '5.0',
      liquidityReserve: '10.0',
      maxSlippage: '0.5'
    },
    staking: {
      rebalanceThreshold: '3.0',
      liquidityReserve: '15.0',
      maxSlippage: '1.0'
    },
    liquidity: {
      rebalanceThreshold: '2.0',
      liquidityReserve: '20.0',
      maxSlippage: '2.0'
    },
    custom: {
      rebalanceThreshold: '5.0',
      liquidityReserve: '10.0',
      maxSlippage: '1.0'
    }
  };
  
  return defaults[strategyType as keyof typeof defaults] || defaults.custom;
};

/**
 * Format vault type for display
 */
export const formatVaultType = (vaultType: string): string => {
  const types = {
    yield: 'Yield Generation',
    fund: 'Investment Fund',
    staking: 'Staking',
    lending: 'Lending Pool'
  };
  
  return types[vaultType as keyof typeof types] || vaultType;
};

/**
 * Format yield strategy for display
 */
export const formatYieldStrategy = (strategy: string): string => {
  const strategies = {
    lending: 'Lending (Aave, Compound)',
    staking: 'Staking',
    liquidity: 'Liquidity Provision',
    yield_farming: 'Yield Farming',
    custom: 'Custom Strategy'
  };
  
  return strategies[strategy as keyof typeof strategies] || strategy;
};

/**
 * Validate Ethereum address format
 */
export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Generate vault symbol from name
 */
export const generateVaultSymbol = (name: string): string => {
  // Remove common words and create acronym
  const words = name
    .replace(/\b(vault|yield|token|tokenized|fund|pool)\b/gi, '')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  let symbol = '';
  for (const word of words.slice(0, 3)) {
    symbol += word.charAt(0).toUpperCase();
  }
  
  // Ensure minimum length and add prefix if needed
  if (symbol.length < 2) {
    symbol = 'YV' + symbol; // Yield Vault prefix
  }
  
  return symbol.substring(0, 6); // Max 6 characters
};

/**
 * Calculate estimated APY based on strategy and allocations
 */
export const estimateAPY = (
  strategy: string,
  allocations: Array<{ expectedApy?: string; percentage: string }>
): number => {
  if (!allocations || allocations.length === 0) {
    // Default APY estimates by strategy
    const strategyAPY = {
      lending: 4.5,
      staking: 8.0,
      liquidity: 12.0,
      yield_farming: 15.0,
      custom: 6.0
    };
    
    return strategyAPY[strategy as keyof typeof strategyAPY] || 5.0;
  }
  
  // Calculate weighted average APY from allocations
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const allocation of allocations) {
    const percentage = parseFloat(allocation.percentage);
    const apy = parseFloat(allocation.expectedApy || '5.0');
    
    if (!isNaN(percentage) && !isNaN(apy)) {
      weightedSum += (apy * percentage);
      totalWeight += percentage;
    }
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 5.0;
};

/**
 * Validate fee structure for reasonableness
 */
export const validateFeeStructure = (formData: ERC4626EnhancedFormValues): {
  isReasonable: boolean;
  warnings: string[];
} => {
  const warnings: string[] = [];
  
  // Check for high fees
  const managementFee = parseFloat(formData.managementFee || '0');
  const performanceFee = parseFloat(formData.performanceFee || '0');
  const depositFee = parseFloat(formData.depositFee || '0');
  const withdrawalFee = parseFloat(formData.withdrawalFee || '0');
  
  if (managementFee > 3.0) {
    warnings.push('Management fee above 3% is quite high for DeFi vaults');
  }
  
  if (performanceFee > 25.0) {
    warnings.push('Performance fee above 25% is very high');
  }
  
  if (depositFee > 1.0) {
    warnings.push('Deposit fee above 1% may discourage deposits');
  }
  
  if (withdrawalFee > 1.0) {
    warnings.push('Withdrawal fee above 1% may discourage withdrawals');
  }
  
  const totalFees = managementFee + depositFee + withdrawalFee;
  if (totalFees > 5.0) {
    warnings.push('Total fees may be too high for competitive vault');
  }
  
  return {
    isReasonable: warnings.length === 0,
    warnings
  };
};

/**
 * Generate default JSONB configurations
 */
export const generateDefaultConfigurations = (formData: ERC4626EnhancedFormValues) => {
  const feeStructure = formData.feeStructure || {
    type: 'flat',
    managementFee: formData.managementFee || '0',
    performanceFee: formData.performanceFee || '0',
    depositFee: formData.depositFee || '0',
    withdrawalFee: formData.withdrawalFee || '0',
    feeRecipient: formData.feeRecipient
  };
  
  const rebalancingRules = formData.rebalancingRules || {
    enabled: formData.automatedRebalancing || false,
    frequency: formData.rebalancingFrequency || 'weekly',
    threshold: formData.strategyParams?.rebalanceThreshold || '5.0',
    maxRebalanceSize: '25.0',
    triggers: ['threshold_breach', 'time_based']
  };
  
  const withdrawalRules = formData.withdrawalRules || {
    lockupPeriod: '0',
    noticePeriod: '0',
    maxWithdrawalPerPeriod: formData.maximumWithdrawal || '',
    penalties: {}
  };
  
  return {
    feeStructure,
    rebalancingRules,
    withdrawalRules
  };
};`;

    await writeFile(
      join(this.projectRoot, 'src/components/tokens/utils/erc4626Utils.ts'),
      utilitiesContent
    );

    console.log('   ✅ Created utility functions');
  }

  /**
   * Update index files
   */
  private async updateIndexFiles(): Promise<void> {
    console.log('8. 📁 Updating index files...');

    // Update forms index
    const formsIndexPath = join(this.projectRoot, 'src/components/tokens/forms/index.ts');
    let formsIndex = '';
    
    try {
      formsIndex = await readFile(formsIndexPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, create new one
    }
    
    if (!formsIndex.includes('ERC4626EditForm')) {
      formsIndex += `
// ERC4626 Forms
export { default as ERC4626EditForm } from './ERC4626EditForm';
export { BasicDetailsForm } from './erc4626/BasicDetailsForm';
export { AssetConfigForm } from './erc4626/AssetConfigForm';
export { StrategyForm } from './erc4626/StrategyForm';
export { FeesForm } from './erc4626/FeesForm';
export { FeaturesForm } from './erc4626/FeaturesForm';
`;
      
      await writeFile(formsIndexPath, formsIndex);
    }

    // Update hooks index
    const hooksIndexPath = join(this.projectRoot, 'src/components/tokens/hooks/index.ts');
    let hooksIndex = '';
    
    try {
      hooksIndex = await readFile(hooksIndexPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, create new one
    }
    
    if (!hooksIndex.includes('useERC4626')) {
      hooksIndex += `
// ERC4626 Hooks
export { useERC4626Token, useERC4626Validation, useERC4626Strategy } from './useERC4626';
`;
      
      await writeFile(hooksIndexPath, hooksIndex);
    }

    // Create erc4626 form components index
    const erc4626FormsIndexPath = join(this.projectRoot, 'src/components/tokens/forms/erc4626/index.ts');
    const erc4626FormsIndex = `export { BasicDetailsForm } from './BasicDetailsForm';
export { AssetConfigForm } from './AssetConfigForm';
export { StrategyForm } from './StrategyForm';
export { FeesForm } from './FeesForm';
export { FeaturesForm } from './FeaturesForm';
`;
    
    await writeFile(erc4626FormsIndexPath, erc4626FormsIndex);

    console.log('   ✅ Updated index files');
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await access(dirPath);
    } catch (error) {
      await mkdir(dirPath, { recursive: true });
    }
  }
}

// Run enhancement if called directly
if (require.main === module) {
  const enhancer = new ERC4626Enhancer();
  enhancer.runEnhancements().catch(error => {
    console.error('💥 Enhancement script failed:', error);
    process.exit(1);
  });
}

export { ERC4626Enhancer };
