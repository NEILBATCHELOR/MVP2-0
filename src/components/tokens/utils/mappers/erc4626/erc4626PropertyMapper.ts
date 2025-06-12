/**
 * ERC4626 Property Mapper
 * Comprehensive implementation for ERC4626 tokenized vault properties mapping
 */

import { BaseMapper, ValidationResult } from '../shared/baseMapper';
import { PropertyTableMapper } from '../database/schemaMapper';
import { JsonbConfigMapper, TransferConfig, WhitelistConfig, ComplianceConfig } from '../config/jsonbConfigMapper';

/**
 * ERC4626 specific configurations
 */
export interface VaultStrategy {
  strategyType: 'conservative' | 'moderate' | 'aggressive' | 'custom';
  allocation: Record<string, string>;
  isActive: boolean;
  rebalanceFrequency?: number;
  riskLevel?: number;
}

export interface AssetAllocation {
  assetType: string;
  percentage: string;
  minAllocation?: string;
  maxAllocation?: string;
}

export interface YieldConfiguration {
  yieldType: 'fixed' | 'variable' | 'hybrid';
  expectedApr?: string;
  distributionFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  autoReinvest?: boolean;
}

export interface VaultLimits {
  maxTotalAssets?: string;
  minDeposit?: string;
  maxDeposit?: string;
  minWithdrawal?: string;
  maxWithdrawal?: string;
}

export interface FeeStructure {
  managementFee?: string;
  performanceFee?: string;
  depositFee?: string;
  withdrawalFee?: string;
  rebalancingFee?: string;
}

/**
 * Database schema for ERC4626 properties
 */
export interface TokenERC4626PropertiesDB {
  id: string;
  token_id: string;
  asset_address?: string;
  vault_name?: string;
  vault_symbol?: string;
  share_decimals?: number;
  asset_decimals?: number;
  total_assets_cap?: string;
  initial_assets?: string;
  is_private?: boolean;
  vault_strategies?: any; // JSONB
  asset_allocations?: any; // JSONB
  yield_configuration?: any; // JSONB
  vault_limits?: any; // JSONB
  fee_structure?: any; // JSONB
  withdrawal_queue_enabled?: boolean;
  deposit_queue_enabled?: boolean;
  emergency_withdrawal?: boolean;
  asset_whitelist?: string[];
  investor_whitelist_enabled?: boolean;
  minimum_lock_period?: number;
  performance_tracking?: boolean;
  auto_rebalancing?: boolean;
  rebalancing_threshold?: string;
  slippage_tolerance?: string;
  max_slippage?: string;
  gas_optimization?: boolean;
  multicall_enabled?: boolean;
  permit2_enabled?: boolean;
  cross_chain_enabled?: boolean;
  layer2_support?: boolean;
  yield_farming_enabled?: boolean;
  liquidity_mining?: boolean;
  staking_rewards?: boolean;
  compound_interest?: boolean;
  risk_assessment?: any; // JSONB
  insurance_coverage?: boolean;
  audit_reports?: string[];
  regulatory_compliance?: any; // JSONB
  kyc_required?: boolean;
  accredited_only?: boolean;
  geographic_restrictions?: any; // JSONB
  investment_strategy_desc?: string;
  vault_governance?: any; // JSONB
  created_at?: string;
  updated_at?: string;
}

/**
 * Domain model for ERC4626 properties
 */
export interface TokenERC4626Properties {
  id: string;
  tokenId: string;
  assetAddress?: string;
  vaultName?: string;
  vaultSymbol?: string;
  shareDecimals?: number;
  assetDecimals?: number;
  totalAssetsCap?: string;
  initialAssets?: string;
  isPrivate?: boolean;
  vaultStrategies?: VaultStrategy[];
  assetAllocations?: AssetAllocation[];
  yieldConfiguration?: YieldConfiguration;
  vaultLimits?: VaultLimits;
  feeStructure?: FeeStructure;
  withdrawalQueueEnabled?: boolean;
  depositQueueEnabled?: boolean;
  emergencyWithdrawal?: boolean;
  assetWhitelist?: string[];
  investorWhitelistEnabled?: boolean;
  minimumLockPeriod?: number;
  performanceTracking?: boolean;
  autoRebalancing?: boolean;
  rebalancingThreshold?: string;
  slippageTolerance?: string;
  maxSlippage?: string;
  gasOptimization?: boolean;
  multicallEnabled?: boolean;
  permit2Enabled?: boolean;
  crossChainEnabled?: boolean;
  layer2Support?: boolean;
  yieldFarmingEnabled?: boolean;
  liquidityMining?: boolean;
  stakingRewards?: boolean;
  compoundInterest?: boolean;
  riskAssessment?: Record<string, any>;
  insuranceCoverage?: boolean;
  auditReports?: string[];
  regulatoryCompliance?: Record<string, any>;
  kycRequired?: boolean;
  accreditedOnly?: boolean;
  geographicRestrictions?: Record<string, any>;
  investmentStrategyDesc?: string;
  vaultGovernance?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Form data interface for ERC4626
 */
export interface ERC4626FormData {
  // Basic vault properties
  assetAddress?: string;
  vaultName?: string;
  vaultSymbol?: string;
  shareDecimals?: number;
  assetDecimals?: number;
  totalAssetsCap?: string;
  initialAssets?: string;
  isPrivate?: boolean;
  
  // Investment strategy
  vaultStrategies?: VaultStrategy[];
  assetAllocations?: AssetAllocation[];
  yieldConfiguration?: YieldConfiguration;
  investmentStrategyDesc?: string;
  
  // Vault limits and fees
  vaultLimits?: VaultLimits;
  feeStructure?: FeeStructure;
  
  // Queue management
  withdrawalQueueEnabled?: boolean;
  depositQueueEnabled?: boolean;
  emergencyWithdrawal?: boolean;
  
  // Access control
  assetWhitelist?: string[];
  investorWhitelistEnabled?: boolean;
  minimumLockPeriod?: number;
  
  // Performance and rebalancing
  performanceTracking?: boolean;
  autoRebalancing?: boolean;
  rebalancingThreshold?: string;
  slippageTolerance?: string;
  maxSlippage?: string;
  
  // Technical features
  gasOptimization?: boolean;
  multicallEnabled?: boolean;
  permit2Enabled?: boolean;
  crossChainEnabled?: boolean;
  layer2Support?: boolean;
  
  // Yield features
  yieldFarmingEnabled?: boolean;
  liquidityMining?: boolean;
  stakingRewards?: boolean;
  compoundInterest?: boolean;
  
  // Risk and compliance
  riskAssessment?: Record<string, any>;
  insuranceCoverage?: boolean;
  auditReports?: string[];
  regulatoryCompliance?: Record<string, any>;
  kycRequired?: boolean;
  accreditedOnly?: boolean;
  geographicRestrictions?: Record<string, any>;
  
  // Governance
  vaultGovernance?: Record<string, any>;
}

/**
 * ERC4626 Property Mapper
 */
export class ERC4626PropertyMapper extends PropertyTableMapper<TokenERC4626Properties, TokenERC4626PropertiesDB> {
  
  protected getTableName(): string {
    return 'token_erc4626_properties';
  }

  protected getRequiredFields(): string[] {
    return ['token_id'];
  }

  toDomain(dbRecord: TokenERC4626PropertiesDB): TokenERC4626Properties {
    return {
      id: dbRecord.id,
      tokenId: dbRecord.token_id,
      assetAddress: dbRecord.asset_address,
      vaultName: dbRecord.vault_name,
      vaultSymbol: dbRecord.vault_symbol,
      shareDecimals: dbRecord.share_decimals,
      assetDecimals: dbRecord.asset_decimals,
      totalAssetsCap: dbRecord.total_assets_cap,
      initialAssets: dbRecord.initial_assets,
      isPrivate: dbRecord.is_private,
      vaultStrategies: this.mapVaultStrategies(dbRecord.vault_strategies),
      assetAllocations: this.mapAssetAllocations(dbRecord.asset_allocations),
      yieldConfiguration: this.mapYieldConfiguration(dbRecord.yield_configuration),
      vaultLimits: this.mapVaultLimits(dbRecord.vault_limits),
      feeStructure: this.mapFeeStructure(dbRecord.fee_structure),
      withdrawalQueueEnabled: dbRecord.withdrawal_queue_enabled,
      depositQueueEnabled: dbRecord.deposit_queue_enabled,
      emergencyWithdrawal: dbRecord.emergency_withdrawal,
      assetWhitelist: dbRecord.asset_whitelist,
      investorWhitelistEnabled: dbRecord.investor_whitelist_enabled,
      minimumLockPeriod: dbRecord.minimum_lock_period,
      performanceTracking: dbRecord.performance_tracking,
      autoRebalancing: dbRecord.auto_rebalancing,
      rebalancingThreshold: dbRecord.rebalancing_threshold,
      slippageTolerance: dbRecord.slippage_tolerance,
      maxSlippage: dbRecord.max_slippage,
      gasOptimization: dbRecord.gas_optimization,
      multicallEnabled: dbRecord.multicall_enabled,
      permit2Enabled: dbRecord.permit2_enabled,
      crossChainEnabled: dbRecord.cross_chain_enabled,
      layer2Support: dbRecord.layer2_support,
      yieldFarmingEnabled: dbRecord.yield_farming_enabled,
      liquidityMining: dbRecord.liquidity_mining,
      stakingRewards: dbRecord.staking_rewards,
      compoundInterest: dbRecord.compound_interest,
      riskAssessment: this.handleJsonbField(dbRecord.risk_assessment),
      insuranceCoverage: dbRecord.insurance_coverage,
      auditReports: dbRecord.audit_reports,
      regulatoryCompliance: this.handleJsonbField(dbRecord.regulatory_compliance),
      kycRequired: dbRecord.kyc_required,
      accreditedOnly: dbRecord.accredited_only,
      geographicRestrictions: this.handleJsonbField(dbRecord.geographic_restrictions),
      investmentStrategyDesc: dbRecord.investment_strategy_desc,
      vaultGovernance: this.handleJsonbField(dbRecord.vault_governance),
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  toDatabase(domainObject: TokenERC4626Properties): TokenERC4626PropertiesDB {
    return this.cleanUndefined({
      id: domainObject.id,
      token_id: domainObject.tokenId,
      asset_address: domainObject.assetAddress,
      vault_name: domainObject.vaultName,
      vault_symbol: domainObject.vaultSymbol,
      share_decimals: domainObject.shareDecimals,
      asset_decimals: domainObject.assetDecimals,
      total_assets_cap: domainObject.totalAssetsCap,
      initial_assets: domainObject.initialAssets,
      is_private: domainObject.isPrivate,
      vault_strategies: this.prepareJsonbField(domainObject.vaultStrategies),
      asset_allocations: this.prepareJsonbField(domainObject.assetAllocations),
      yield_configuration: this.prepareJsonbField(domainObject.yieldConfiguration),
      vault_limits: this.prepareJsonbField(domainObject.vaultLimits),
      fee_structure: this.prepareJsonbField(domainObject.feeStructure),
      withdrawal_queue_enabled: domainObject.withdrawalQueueEnabled,
      deposit_queue_enabled: domainObject.depositQueueEnabled,
      emergency_withdrawal: domainObject.emergencyWithdrawal,
      asset_whitelist: domainObject.assetWhitelist,
      investor_whitelist_enabled: domainObject.investorWhitelistEnabled,
      minimum_lock_period: domainObject.minimumLockPeriod,
      performance_tracking: domainObject.performanceTracking,
      auto_rebalancing: domainObject.autoRebalancing,
      rebalancing_threshold: domainObject.rebalancingThreshold,
      slippage_tolerance: domainObject.slippageTolerance,
      max_slippage: domainObject.maxSlippage,
      gas_optimization: domainObject.gasOptimization,
      multicall_enabled: domainObject.multicallEnabled,
      permit2_enabled: domainObject.permit2Enabled,
      cross_chain_enabled: domainObject.crossChainEnabled,
      layer2_support: domainObject.layer2Support,
      yield_farming_enabled: domainObject.yieldFarmingEnabled,
      liquidity_mining: domainObject.liquidityMining,
      staking_rewards: domainObject.stakingRewards,
      compound_interest: domainObject.compoundInterest,
      risk_assessment: this.prepareJsonbField(domainObject.riskAssessment),
      insurance_coverage: domainObject.insuranceCoverage,
      audit_reports: domainObject.auditReports,
      regulatory_compliance: this.prepareJsonbField(domainObject.regulatoryCompliance),
      kyc_required: domainObject.kycRequired,
      accredited_only: domainObject.accreditedOnly,
      geographic_restrictions: this.prepareJsonbField(domainObject.geographicRestrictions),
      investment_strategy_desc: domainObject.investmentStrategyDesc,
      vault_governance: this.prepareJsonbField(domainObject.vaultGovernance),
      created_at: domainObject.createdAt,
      updated_at: domainObject.updatedAt,
    }) as TokenERC4626PropertiesDB;
  }

  fromForm(formData: ERC4626FormData, tokenId?: string): TokenERC4626PropertiesDB {
    return this.cleanUndefined({
      id: this.generateId(),
      token_id: tokenId || '',
      asset_address: formData.assetAddress,
      vault_name: formData.vaultName,
      vault_symbol: formData.vaultSymbol,
      share_decimals: formData.shareDecimals || 18,
      asset_decimals: formData.assetDecimals || 18,
      total_assets_cap: formData.totalAssetsCap,
      initial_assets: formData.initialAssets,
      is_private: formData.isPrivate || false,
      vault_strategies: this.prepareJsonbField(formData.vaultStrategies || []),
      asset_allocations: this.prepareJsonbField(formData.assetAllocations || []),
      yield_configuration: this.prepareJsonbField(formData.yieldConfiguration || {}),
      vault_limits: this.prepareJsonbField(formData.vaultLimits || {}),
      fee_structure: this.prepareJsonbField(formData.feeStructure || {}),
      withdrawal_queue_enabled: formData.withdrawalQueueEnabled || false,
      deposit_queue_enabled: formData.depositQueueEnabled || false,
      emergency_withdrawal: formData.emergencyWithdrawal || false,
      asset_whitelist: formData.assetWhitelist || [],
      investor_whitelist_enabled: formData.investorWhitelistEnabled || false,
      minimum_lock_period: formData.minimumLockPeriod || 0,
      performance_tracking: formData.performanceTracking || false,
      auto_rebalancing: formData.autoRebalancing || false,
      rebalancing_threshold: formData.rebalancingThreshold,
      slippage_tolerance: formData.slippageTolerance,
      max_slippage: formData.maxSlippage,
      gas_optimization: formData.gasOptimization || false,
      multicall_enabled: formData.multicallEnabled || false,
      permit2_enabled: formData.permit2Enabled || false,
      cross_chain_enabled: formData.crossChainEnabled || false,
      layer2_support: formData.layer2Support || false,
      yield_farming_enabled: formData.yieldFarmingEnabled || false,
      liquidity_mining: formData.liquidityMining || false,
      staking_rewards: formData.stakingRewards || false,
      compound_interest: formData.compoundInterest || false,
      risk_assessment: this.prepareJsonbField(formData.riskAssessment || {}),
      insurance_coverage: formData.insuranceCoverage || false,
      audit_reports: formData.auditReports || [],
      regulatory_compliance: this.prepareJsonbField(formData.regulatoryCompliance || {}),
      kyc_required: formData.kycRequired || false,
      accredited_only: formData.accreditedOnly || false,
      geographic_restrictions: this.prepareJsonbField(formData.geographicRestrictions || {}),
      investment_strategy_desc: formData.investmentStrategyDesc,
      vault_governance: this.prepareJsonbField(formData.vaultGovernance || {}),
    }) as TokenERC4626PropertiesDB;
  }

  toForm(domainObject: TokenERC4626Properties): ERC4626FormData {
    return {
      assetAddress: domainObject.assetAddress,
      vaultName: domainObject.vaultName,
      vaultSymbol: domainObject.vaultSymbol,
      shareDecimals: domainObject.shareDecimals,
      assetDecimals: domainObject.assetDecimals,
      totalAssetsCap: domainObject.totalAssetsCap,
      initialAssets: domainObject.initialAssets,
      isPrivate: domainObject.isPrivate,
      vaultStrategies: domainObject.vaultStrategies,
      assetAllocations: domainObject.assetAllocations,
      yieldConfiguration: domainObject.yieldConfiguration,
      vaultLimits: domainObject.vaultLimits,
      feeStructure: domainObject.feeStructure,
      withdrawalQueueEnabled: domainObject.withdrawalQueueEnabled,
      depositQueueEnabled: domainObject.depositQueueEnabled,
      emergencyWithdrawal: domainObject.emergencyWithdrawal,
      assetWhitelist: domainObject.assetWhitelist,
      investorWhitelistEnabled: domainObject.investorWhitelistEnabled,
      minimumLockPeriod: domainObject.minimumLockPeriod,
      performanceTracking: domainObject.performanceTracking,
      autoRebalancing: domainObject.autoRebalancing,
      rebalancingThreshold: domainObject.rebalancingThreshold,
      slippageTolerance: domainObject.slippageTolerance,
      maxSlippage: domainObject.maxSlippage,
      gasOptimization: domainObject.gasOptimization,
      multicallEnabled: domainObject.multicallEnabled,
      permit2Enabled: domainObject.permit2Enabled,
      crossChainEnabled: domainObject.crossChainEnabled,
      layer2Support: domainObject.layer2Support,
      yieldFarmingEnabled: domainObject.yieldFarmingEnabled,
      liquidityMining: domainObject.liquidityMining,
      stakingRewards: domainObject.stakingRewards,
      compoundInterest: domainObject.compoundInterest,
      riskAssessment: domainObject.riskAssessment,
      insuranceCoverage: domainObject.insuranceCoverage,
      auditReports: domainObject.auditReports,
      regulatoryCompliance: domainObject.regulatoryCompliance,
      kycRequired: domainObject.kycRequired,
      accreditedOnly: domainObject.accreditedOnly,
      geographicRestrictions: domainObject.geographicRestrictions,
      investmentStrategyDesc: domainObject.investmentStrategyDesc,
      vaultGovernance: domainObject.vaultGovernance,
    };
  }

  /**
   * Map vault strategies from database
   */
  private mapVaultStrategies(data: any): VaultStrategy[] {
    if (!data) return [];
    
    try {
      const strategies = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(strategies) ? strategies.map(strategy => ({
        strategyType: strategy.strategyType || 'conservative',
        allocation: strategy.allocation || {},
        isActive: Boolean(strategy.isActive),
        rebalanceFrequency: Number(strategy.rebalanceFrequency),
        riskLevel: Number(strategy.riskLevel),
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map asset allocations from database
   */
  private mapAssetAllocations(data: any): AssetAllocation[] {
    if (!data) return [];
    
    try {
      const allocations = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(allocations) ? allocations.map(allocation => ({
        assetType: allocation.assetType || '',
        percentage: allocation.percentage || '0',
        minAllocation: allocation.minAllocation,
        maxAllocation: allocation.maxAllocation,
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map yield configuration from database
   */
  private mapYieldConfiguration(data: any): YieldConfiguration | undefined {
    if (!data) return undefined;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        yieldType: config.yieldType || 'variable',
        expectedApr: config.expectedApr,
        distributionFrequency: config.distributionFrequency || 'monthly',
        autoReinvest: Boolean(config.autoReinvest),
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Map vault limits from database
   */
  private mapVaultLimits(data: any): VaultLimits | undefined {
    if (!data) return undefined;
    
    try {
      const limits = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        maxTotalAssets: limits.maxTotalAssets,
        minDeposit: limits.minDeposit,
        maxDeposit: limits.maxDeposit,
        minWithdrawal: limits.minWithdrawal,
        maxWithdrawal: limits.maxWithdrawal,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Map fee structure from database
   */
  private mapFeeStructure(data: any): FeeStructure | undefined {
    if (!data) return undefined;
    
    try {
      const fees = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        managementFee: fees.managementFee,
        performanceFee: fees.performanceFee,
        depositFee: fees.depositFee,
        withdrawalFee: fees.withdrawalFee,
        rebalancingFee: fees.rebalancingFee,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Generate a new UUID for the property record
   */
  private generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Validate ERC4626 form data
   */
  validate(data: ERC4626FormData): ValidationResult {
    const baseValidation = super.validate(data);
    if (!baseValidation.valid) return baseValidation;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate asset address
    if (data.assetAddress && !/^0x[a-fA-F0-9]{40}$/.test(data.assetAddress)) {
      errors.push('Invalid asset address format');
    }

    // Validate decimals
    if (data.shareDecimals && (data.shareDecimals < 0 || data.shareDecimals > 18)) {
      errors.push('Share decimals must be between 0 and 18');
    }

    if (data.assetDecimals && (data.assetDecimals < 0 || data.assetDecimals > 18)) {
      errors.push('Asset decimals must be between 0 and 18');
    }

    // Validate vault strategies
    if (data.vaultStrategies) {
      for (const strategy of data.vaultStrategies) {
        if (!strategy.strategyType || !['conservative', 'moderate', 'aggressive', 'custom'].includes(strategy.strategyType)) {
          errors.push('Invalid strategy type');
        }
      }
    }

    // Validate asset allocations
    if (data.assetAllocations) {
      let totalPercentage = 0;
      for (const allocation of data.assetAllocations) {
        const percentage = parseFloat(allocation.percentage);
        if (percentage < 0 || percentage > 100) {
          errors.push('Asset allocation percentage must be between 0 and 100');
        }
        totalPercentage += percentage;
      }
      
      if (totalPercentage > 100) {
        errors.push('Total asset allocation cannot exceed 100%');
      }
    }

    // Validate lock period
    if (data.minimumLockPeriod && data.minimumLockPeriod < 0) {
      errors.push('Minimum lock period must be non-negative');
    }

    // Business logic warnings
    if (data.autoRebalancing && !data.rebalancingThreshold) {
      warnings.push('Auto-rebalancing enabled but no threshold set');
    }

    if (data.emergencyWithdrawal && data.minimumLockPeriod && data.minimumLockPeriod > 0) {
      warnings.push('Emergency withdrawal with lock period may create conflicts');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create default ERC4626 properties
   */
  static createDefaults(): ERC4626FormData {
    return {
      shareDecimals: 18,
      assetDecimals: 18,
      isPrivate: false,
      withdrawalQueueEnabled: false,
      depositQueueEnabled: false,
      emergencyWithdrawal: false,
      investorWhitelistEnabled: false,
      minimumLockPeriod: 0,
      performanceTracking: true,
      autoRebalancing: false,
      gasOptimization: true,
      multicallEnabled: true,
      permit2Enabled: false,
      crossChainEnabled: false,
      layer2Support: false,
      yieldFarmingEnabled: false,
      liquidityMining: false,
      stakingRewards: false,
      compoundInterest: true,
      insuranceCoverage: false,
      kycRequired: false,
      accreditedOnly: false,
      vaultStrategies: [],
      assetAllocations: [],
      assetWhitelist: [],
      auditReports: [],
    };
  }
}

/**
 * Export utility function for backward compatibility with standardServices.ts
 */
export function mapERC4626FormToDatabase(data: ERC4626FormData & { config_mode?: string; tokenId: string }) {
  const mapper = new ERC4626PropertyMapper();
  const properties = mapper.fromForm(data);
  
  return {
    properties,
    strategyParams: data.vaultStrategies || [],
    assetAllocations: data.assetAllocations || [],
  };
}
