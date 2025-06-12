/**
 * ERC20 Property Mapper
 * Reference implementation for ERC20 properties mapping
 */

import { BaseMapper, ValidationResult } from '../shared/baseMapper';
import { PropertyTableMapper } from '../database/schemaMapper';
import { JsonbConfigMapper, TransferConfig, GasConfig, ComplianceConfig, WhitelistConfig, GovernanceConfig, VestingConfig } from '../config/jsonbConfigMapper';

/**
 * Database schema for ERC20 properties
 */
export interface TokenERC20PropertiesDB {
  id: string;
  token_id: string;
  initial_supply?: string;
  cap?: string;
  is_mintable?: boolean;
  is_burnable?: boolean;
  is_pausable?: boolean;
  token_type?: string;
  access_control?: string;
  allow_management?: boolean;
  permit?: boolean;
  snapshot?: boolean;
  fee_on_transfer?: any; // JSONB
  rebasing?: any; // JSONB
  governance_features?: any; // JSONB
  transfer_config?: any; // JSONB
  gas_config?: any; // JSONB
  compliance_config?: any; // JSONB
  whitelist_config?: any; // JSONB
  governance_enabled?: boolean;
  quorum_percentage?: string;
  proposal_threshold?: string;
  voting_delay?: number;
  voting_period?: number;
  timelock_delay?: number;
  governance_token_address?: string;
  pausable_by?: string;
  mintable_by?: string;
  burnable_by?: string;
  max_total_supply?: string;
  anti_whale_enabled?: boolean;
  max_wallet_amount?: string;
  cooldown_period?: number;
  blacklist_enabled?: boolean;
  deflation_enabled?: boolean;
  deflation_rate?: string;
  staking_enabled?: boolean;
  staking_rewards_rate?: string;
  buy_fee_enabled?: boolean;
  sell_fee_enabled?: boolean;
  liquidity_fee_percentage?: string;
  marketing_fee_percentage?: string;
  charity_fee_percentage?: string;
  auto_liquidity_enabled?: boolean;
  reflection_enabled?: boolean;
  reflection_percentage?: string;
  burn_on_transfer?: boolean;
  burn_percentage?: string;
  lottery_enabled?: boolean;
  lottery_percentage?: string;
  trading_start_time?: string;
  presale_enabled?: boolean;
  presale_rate?: string;
  presale_start_time?: string;
  presale_end_time?: string;
  vesting_enabled?: boolean;
  vesting_cliff_period?: number;
  vesting_total_period?: number;
  vesting_release_frequency?: string;
  use_geographic_restrictions?: boolean;
  default_restriction_policy?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Domain model for ERC20 properties
 */
export interface TokenERC20Properties {
  id: string;
  tokenId: string;
  initialSupply?: string;
  cap?: string;
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  tokenType?: string;
  accessControl?: string;
  allowManagement?: boolean;
  permit?: boolean;
  snapshot?: boolean;
  feeOnTransfer?: Record<string, any>;
  rebasing?: Record<string, any>;
  governanceFeatures?: Record<string, any>;
  transferConfig?: TransferConfig;
  gasConfig?: GasConfig;
  complianceConfig?: ComplianceConfig;
  whitelistConfig?: WhitelistConfig;
  governanceEnabled?: boolean;
  quorumPercentage?: string;
  proposalThreshold?: string;
  votingDelay?: number;
  votingPeriod?: number;
  timelockDelay?: number;
  governanceTokenAddress?: string;
  pausableBy?: string;
  mintableBy?: string;
  burnableBy?: string;
  maxTotalSupply?: string;
  antiWhaleEnabled?: boolean;
  maxWalletAmount?: string;
  cooldownPeriod?: number;
  blacklistEnabled?: boolean;
  deflationEnabled?: boolean;
  deflationRate?: string;
  stakingEnabled?: boolean;
  stakingRewardsRate?: string;
  buyFeeEnabled?: boolean;
  sellFeeEnabled?: boolean;
  liquidityFeePercentage?: string;
  marketingFeePercentage?: string;
  charityFeePercentage?: string;
  autoLiquidityEnabled?: boolean;
  reflectionEnabled?: boolean;
  reflectionPercentage?: string;
  burnOnTransfer?: boolean;
  burnPercentage?: string;
  lotteryEnabled?: boolean;
  lotteryPercentage?: string;
  tradingStartTime?: string;
  presaleEnabled?: boolean;
  presaleRate?: string;
  presaleStartTime?: string;
  presaleEndTime?: string;
  vestingEnabled?: boolean;
  vestingCliffPeriod?: number;
  vestingTotalPeriod?: number;
  vestingReleaseFrequency?: string;
  useGeographicRestrictions?: boolean;
  defaultRestrictionPolicy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Form data interface for ERC20
 */
export interface ERC20FormData {
  // System fields
  id?: string;
  tokenId?: string;
  
  // Basic properties
  initialSupply?: string;
  cap?: string;
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  tokenType?: string;
  
  // Access control
  accessControl?: string;
  allowManagement?: boolean;
  pausableBy?: string;
  mintableBy?: string;
  burnableBy?: string;
  
  // Advanced features
  permit?: boolean;
  snapshot?: boolean;
  maxTotalSupply?: string;
  
  // Anti-whale and transfer controls
  antiWhaleEnabled?: boolean;
  maxWalletAmount?: string;
  cooldownPeriod?: number;
  blacklistEnabled?: boolean;
  
  // Economic features
  deflationEnabled?: boolean;
  deflationRate?: string;
  stakingEnabled?: boolean;
  stakingRewardsRate?: string;
  
  // Fee structure
  buyFeeEnabled?: boolean;
  sellFeeEnabled?: boolean;
  liquidityFeePercentage?: string;
  marketingFeePercentage?: string;
  charityFeePercentage?: string;
  autoLiquidityEnabled?: boolean;
  
  // Reflection and burning
  reflectionEnabled?: boolean;
  reflectionPercentage?: string;
  burnOnTransfer?: boolean;
  burnPercentage?: string;
  
  // Lottery and gaming
  lotteryEnabled?: boolean;
  lotteryPercentage?: string;
  
  // Trading controls
  tradingStartTime?: string;
  
  // Presale
  presaleEnabled?: boolean;
  presaleRate?: string;
  presaleStartTime?: string;
  presaleEndTime?: string;
  
  // Vesting
  vestingEnabled?: boolean;
  vestingCliffPeriod?: number;
  vestingTotalPeriod?: number;
  vestingReleaseFrequency?: string;
  
  // Governance
  governanceEnabled?: boolean;
  quorumPercentage?: string;
  proposalThreshold?: string;
  votingDelay?: number;
  votingPeriod?: number;
  timelockDelay?: number;
  governanceTokenAddress?: string;
  
  // Compliance
  useGeographicRestrictions?: boolean;
  defaultRestrictionPolicy?: string;
  
  // JSONB configurations
  transferConfig?: TransferConfig;
  gasConfig?: GasConfig;
  complianceConfig?: ComplianceConfig;
  whitelistConfig?: WhitelistConfig;
  feeOnTransfer?: Record<string, any>;
  rebasing?: Record<string, any>;
  governanceFeatures?: Record<string, any>;
}

/**
 * ERC20 Property Mapper
 */
export class ERC20PropertyMapper extends PropertyTableMapper<TokenERC20Properties, TokenERC20PropertiesDB> {
  
  protected getTableName(): string {
    return 'token_erc20_properties';
  }

  protected getRequiredFields(): string[] {
    return ['token_id'];
  }

  toDomain(dbRecord: TokenERC20PropertiesDB): TokenERC20Properties {
    return {
      id: dbRecord.id,
      tokenId: dbRecord.token_id,
      initialSupply: dbRecord.initial_supply,
      cap: dbRecord.cap,
      isMintable: dbRecord.is_mintable,
      isBurnable: dbRecord.is_burnable,
      isPausable: dbRecord.is_pausable,
      tokenType: dbRecord.token_type,
      accessControl: dbRecord.access_control,
      allowManagement: dbRecord.allow_management,
      permit: dbRecord.permit,
      snapshot: dbRecord.snapshot,
      feeOnTransfer: this.handleJsonbField(dbRecord.fee_on_transfer),
      rebasing: this.handleJsonbField(dbRecord.rebasing),
      governanceFeatures: this.handleJsonbField(dbRecord.governance_features),
      transferConfig: JsonbConfigMapper.mapTransferConfig(dbRecord.transfer_config),
      gasConfig: JsonbConfigMapper.mapGasConfig(dbRecord.gas_config),
      complianceConfig: JsonbConfigMapper.mapComplianceConfig(dbRecord.compliance_config),
      whitelistConfig: JsonbConfigMapper.mapWhitelistConfig(dbRecord.whitelist_config),
      governanceEnabled: dbRecord.governance_enabled,
      quorumPercentage: dbRecord.quorum_percentage,
      proposalThreshold: dbRecord.proposal_threshold,
      votingDelay: dbRecord.voting_delay,
      votingPeriod: dbRecord.voting_period,
      timelockDelay: dbRecord.timelock_delay,
      governanceTokenAddress: dbRecord.governance_token_address,
      pausableBy: dbRecord.pausable_by,
      mintableBy: dbRecord.mintable_by,
      burnableBy: dbRecord.burnable_by,
      maxTotalSupply: dbRecord.max_total_supply,
      antiWhaleEnabled: dbRecord.anti_whale_enabled,
      maxWalletAmount: dbRecord.max_wallet_amount,
      cooldownPeriod: dbRecord.cooldown_period,
      blacklistEnabled: dbRecord.blacklist_enabled,
      deflationEnabled: dbRecord.deflation_enabled,
      deflationRate: dbRecord.deflation_rate,
      stakingEnabled: dbRecord.staking_enabled,
      stakingRewardsRate: dbRecord.staking_rewards_rate,
      buyFeeEnabled: dbRecord.buy_fee_enabled,
      sellFeeEnabled: dbRecord.sell_fee_enabled,
      liquidityFeePercentage: dbRecord.liquidity_fee_percentage,
      marketingFeePercentage: dbRecord.marketing_fee_percentage,
      charityFeePercentage: dbRecord.charity_fee_percentage,
      autoLiquidityEnabled: dbRecord.auto_liquidity_enabled,
      reflectionEnabled: dbRecord.reflection_enabled,
      reflectionPercentage: dbRecord.reflection_percentage,
      burnOnTransfer: dbRecord.burn_on_transfer,
      burnPercentage: dbRecord.burn_percentage,
      lotteryEnabled: dbRecord.lottery_enabled,
      lotteryPercentage: dbRecord.lottery_percentage,
      tradingStartTime: dbRecord.trading_start_time,
      presaleEnabled: dbRecord.presale_enabled,
      presaleRate: dbRecord.presale_rate,
      presaleStartTime: dbRecord.presale_start_time,
      presaleEndTime: dbRecord.presale_end_time,
      vestingEnabled: dbRecord.vesting_enabled,
      vestingCliffPeriod: dbRecord.vesting_cliff_period,
      vestingTotalPeriod: dbRecord.vesting_total_period,
      vestingReleaseFrequency: dbRecord.vesting_release_frequency,
      useGeographicRestrictions: dbRecord.use_geographic_restrictions,
      defaultRestrictionPolicy: dbRecord.default_restriction_policy,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  toDatabase(domainObject: TokenERC20Properties): TokenERC20PropertiesDB {
    return this.cleanUndefined({
      id: domainObject.id,
      token_id: domainObject.tokenId,
      initial_supply: domainObject.initialSupply,
      cap: domainObject.cap,
      is_mintable: domainObject.isMintable,
      is_burnable: domainObject.isBurnable,
      is_pausable: domainObject.isPausable,
      token_type: domainObject.tokenType,
      access_control: domainObject.accessControl,
      allow_management: domainObject.allowManagement,
      permit: domainObject.permit,
      snapshot: domainObject.snapshot,
      fee_on_transfer: this.prepareJsonbField(domainObject.feeOnTransfer),
      rebasing: this.prepareJsonbField(domainObject.rebasing),
      governance_features: this.prepareJsonbField(domainObject.governanceFeatures),
      transfer_config: this.prepareJsonbField(domainObject.transferConfig),
      gas_config: this.prepareJsonbField(domainObject.gasConfig),
      compliance_config: this.prepareJsonbField(domainObject.complianceConfig),
      whitelist_config: this.prepareJsonbField(domainObject.whitelistConfig),
      governance_enabled: domainObject.governanceEnabled,
      quorum_percentage: domainObject.quorumPercentage,
      proposal_threshold: domainObject.proposalThreshold,
      voting_delay: domainObject.votingDelay,
      voting_period: domainObject.votingPeriod,
      timelock_delay: domainObject.timelockDelay,
      governance_token_address: domainObject.governanceTokenAddress,
      pausable_by: domainObject.pausableBy,
      mintable_by: domainObject.mintableBy,
      burnable_by: domainObject.burnableBy,
      max_total_supply: domainObject.maxTotalSupply,
      anti_whale_enabled: domainObject.antiWhaleEnabled,
      max_wallet_amount: domainObject.maxWalletAmount,
      cooldown_period: domainObject.cooldownPeriod,
      blacklist_enabled: domainObject.blacklistEnabled,
      deflation_enabled: domainObject.deflationEnabled,
      deflation_rate: domainObject.deflationRate,
      staking_enabled: domainObject.stakingEnabled,
      staking_rewards_rate: domainObject.stakingRewardsRate,
      buy_fee_enabled: domainObject.buyFeeEnabled,
      sell_fee_enabled: domainObject.sellFeeEnabled,
      liquidity_fee_percentage: domainObject.liquidityFeePercentage,
      marketing_fee_percentage: domainObject.marketingFeePercentage,
      charity_fee_percentage: domainObject.charityFeePercentage,
      auto_liquidity_enabled: domainObject.autoLiquidityEnabled,
      reflection_enabled: domainObject.reflectionEnabled,
      reflection_percentage: domainObject.reflectionPercentage,
      burn_on_transfer: domainObject.burnOnTransfer,
      burn_percentage: domainObject.burnPercentage,
      lottery_enabled: domainObject.lotteryEnabled,
      lottery_percentage: domainObject.lotteryPercentage,
      trading_start_time: domainObject.tradingStartTime,
      presale_enabled: domainObject.presaleEnabled,
      presale_rate: domainObject.presaleRate,
      presale_start_time: domainObject.presaleStartTime,
      presale_end_time: domainObject.presaleEndTime,
      vesting_enabled: domainObject.vestingEnabled,
      vesting_cliff_period: domainObject.vestingCliffPeriod,
      vesting_total_period: domainObject.vestingTotalPeriod,
      vesting_release_frequency: domainObject.vestingReleaseFrequency,
      use_geographic_restrictions: domainObject.useGeographicRestrictions,
      default_restriction_policy: domainObject.defaultRestrictionPolicy,
      created_at: domainObject.createdAt,
      updated_at: domainObject.updatedAt,
    }) as TokenERC20PropertiesDB;
  }

  fromForm(formData: ERC20FormData): TokenERC20PropertiesDB {
    return this.cleanUndefined({
      id: formData.id || this.generateId(),
      token_id: formData.tokenId,
      initial_supply: formData.initialSupply,
      cap: formData.cap,
      is_mintable: formData.isMintable,
      is_burnable: formData.isBurnable,
      is_pausable: formData.isPausable,
      token_type: formData.tokenType,
      access_control: formData.accessControl,
      allow_management: formData.allowManagement,
      permit: formData.permit,
      snapshot: formData.snapshot,
      fee_on_transfer: this.prepareJsonbField(formData.feeOnTransfer),
      rebasing: this.prepareJsonbField(formData.rebasing),
      governance_features: this.prepareJsonbField(formData.governanceFeatures),
      transfer_config: this.prepareJsonbField(formData.transferConfig),
      gas_config: this.prepareJsonbField(formData.gasConfig),
      compliance_config: this.prepareJsonbField(formData.complianceConfig),
      whitelist_config: this.prepareJsonbField(formData.whitelistConfig),
      governance_enabled: formData.governanceEnabled,
      quorum_percentage: formData.quorumPercentage,
      proposal_threshold: formData.proposalThreshold,
      voting_delay: formData.votingDelay,
      voting_period: formData.votingPeriod,
      timelock_delay: formData.timelockDelay,
      governance_token_address: formData.governanceTokenAddress,
      pausable_by: formData.pausableBy,
      mintable_by: formData.mintableBy,
      burnable_by: formData.burnableBy,
      max_total_supply: formData.maxTotalSupply,
      anti_whale_enabled: formData.antiWhaleEnabled,
      max_wallet_amount: formData.maxWalletAmount,
      cooldown_period: formData.cooldownPeriod,
      blacklist_enabled: formData.blacklistEnabled,
      deflation_enabled: formData.deflationEnabled,
      deflation_rate: formData.deflationRate,
      staking_enabled: formData.stakingEnabled,
      staking_rewards_rate: formData.stakingRewardsRate,
      buy_fee_enabled: formData.buyFeeEnabled,
      sell_fee_enabled: formData.sellFeeEnabled,
      liquidity_fee_percentage: formData.liquidityFeePercentage,
      marketing_fee_percentage: formData.marketingFeePercentage,
      charity_fee_percentage: formData.charityFeePercentage,
      auto_liquidity_enabled: formData.autoLiquidityEnabled,
      reflection_enabled: formData.reflectionEnabled,
      reflection_percentage: formData.reflectionPercentage,
      burn_on_transfer: formData.burnOnTransfer,
      burn_percentage: formData.burnPercentage,
      lottery_enabled: formData.lotteryEnabled,
      lottery_percentage: formData.lotteryPercentage,
      trading_start_time: formData.tradingStartTime,
      presale_enabled: formData.presaleEnabled,
      presale_rate: formData.presaleRate,
      presale_start_time: formData.presaleStartTime,
      presale_end_time: formData.presaleEndTime,
      vesting_enabled: formData.vestingEnabled,
      vesting_cliff_period: formData.vestingCliffPeriod,
      vesting_total_period: formData.vestingTotalPeriod,
      vesting_release_frequency: formData.vestingReleaseFrequency,
      use_geographic_restrictions: formData.useGeographicRestrictions,
      default_restriction_policy: formData.defaultRestrictionPolicy,
    }) as TokenERC20PropertiesDB;
  }

  toForm(domainObject: TokenERC20Properties): ERC20FormData {
    return {
      initialSupply: domainObject.initialSupply,
      cap: domainObject.cap,
      isMintable: domainObject.isMintable,
      isBurnable: domainObject.isBurnable,
      isPausable: domainObject.isPausable,
      tokenType: domainObject.tokenType,
      accessControl: domainObject.accessControl,
      allowManagement: domainObject.allowManagement,
      permit: domainObject.permit,
      snapshot: domainObject.snapshot,
      feeOnTransfer: domainObject.feeOnTransfer,
      rebasing: domainObject.rebasing,
      governanceFeatures: domainObject.governanceFeatures,
      transferConfig: domainObject.transferConfig,
      gasConfig: domainObject.gasConfig,
      complianceConfig: domainObject.complianceConfig,
      whitelistConfig: domainObject.whitelistConfig,
      governanceEnabled: domainObject.governanceEnabled,
      quorumPercentage: domainObject.quorumPercentage,
      proposalThreshold: domainObject.proposalThreshold,
      votingDelay: domainObject.votingDelay,
      votingPeriod: domainObject.votingPeriod,
      timelockDelay: domainObject.timelockDelay,
      governanceTokenAddress: domainObject.governanceTokenAddress,
      pausableBy: domainObject.pausableBy,
      mintableBy: domainObject.mintableBy,
      burnableBy: domainObject.burnableBy,
      maxTotalSupply: domainObject.maxTotalSupply,
      antiWhaleEnabled: domainObject.antiWhaleEnabled,
      maxWalletAmount: domainObject.maxWalletAmount,
      cooldownPeriod: domainObject.cooldownPeriod,
      blacklistEnabled: domainObject.blacklistEnabled,
      deflationEnabled: domainObject.deflationEnabled,
      deflationRate: domainObject.deflationRate,
      stakingEnabled: domainObject.stakingEnabled,
      stakingRewardsRate: domainObject.stakingRewardsRate,
      buyFeeEnabled: domainObject.buyFeeEnabled,
      sellFeeEnabled: domainObject.sellFeeEnabled,
      liquidityFeePercentage: domainObject.liquidityFeePercentage,
      marketingFeePercentage: domainObject.marketingFeePercentage,
      charityFeePercentage: domainObject.charityFeePercentage,
      autoLiquidityEnabled: domainObject.autoLiquidityEnabled,
      reflectionEnabled: domainObject.reflectionEnabled,
      reflectionPercentage: domainObject.reflectionPercentage,
      burnOnTransfer: domainObject.burnOnTransfer,
      burnPercentage: domainObject.burnPercentage,
      lotteryEnabled: domainObject.lotteryEnabled,
      lotteryPercentage: domainObject.lotteryPercentage,
      tradingStartTime: domainObject.tradingStartTime,
      presaleEnabled: domainObject.presaleEnabled,
      presaleRate: domainObject.presaleRate,
      presaleStartTime: domainObject.presaleStartTime,
      presaleEndTime: domainObject.presaleEndTime,
      vestingEnabled: domainObject.vestingEnabled,
      vestingCliffPeriod: domainObject.vestingCliffPeriod,
      vestingTotalPeriod: domainObject.vestingTotalPeriod,
      vestingReleaseFrequency: domainObject.vestingReleaseFrequency,
      useGeographicRestrictions: domainObject.useGeographicRestrictions,
      defaultRestrictionPolicy: domainObject.defaultRestrictionPolicy,
    };
  }

  /**
   * Advanced validation for ERC20 properties
   */
  validate(data: ERC20FormData): ValidationResult {
    const baseValidation = super.validate(data);
    if (!baseValidation.valid) return baseValidation;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate initial supply and cap
    if (data.initialSupply && data.cap) {
      const initial = parseFloat(data.initialSupply);
      const cap = parseFloat(data.cap);
      if (initial > cap) {
        errors.push('Initial supply cannot exceed cap');
      }
    }

    // Validate fee percentages
    const feeFields = [
      'liquidityFeePercentage',
      'marketingFeePercentage', 
      'charityFeePercentage',
      'reflectionPercentage',
      'burnPercentage',
      'lotteryPercentage'
    ];

    for (const field of feeFields) {
      const value = data[field as keyof ERC20FormData] as string;
      if (value) {
        const percentage = parseFloat(value);
        if (percentage < 0 || percentage > 100) {
          errors.push(`${field} must be between 0 and 100`);
        }
      }
    }

    // Validate addresses
    const addressFields = ['governanceTokenAddress', 'pausableBy', 'mintableBy', 'burnableBy'];
    for (const field of addressFields) {
      const address = data[field as keyof ERC20FormData] as string;
      if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        errors.push(`Invalid ${field} address format`);
      }
    }

    // Validate time periods
    if (data.votingDelay && data.votingDelay < 0) {
      errors.push('Voting delay must be non-negative');
    }

    if (data.votingPeriod && data.votingPeriod <= 0) {
      errors.push('Voting period must be positive');
    }

    if (data.cooldownPeriod && data.cooldownPeriod < 0) {
      errors.push('Cooldown period must be non-negative');
    }

    // Validate presale dates
    if (data.presaleStartTime && data.presaleEndTime) {
      const start = new Date(data.presaleStartTime);
      const end = new Date(data.presaleEndTime);
      if (start >= end) {
        errors.push('Presale start time must be before end time');
      }
    }

    // Business logic warnings
    if (data.deflationEnabled && data.deflationRate) {
      const rate = parseFloat(data.deflationRate);
      if (rate > 10) {
        warnings.push('High deflation rate may impact token utility');
      }
    }

    if (data.antiWhaleEnabled && !data.maxWalletAmount) {
      warnings.push('Anti-whale protection enabled but no maximum wallet amount set');
    }

    // Validate JSONB configurations
    if (data.transferConfig) {
      const transferValidation = JsonbConfigMapper.validateTransferConfig(data.transferConfig);
      if (!transferValidation.valid) {
        errors.push(...transferValidation.errors);
      }
    }

    if (data.whitelistConfig && data.whitelistConfig.enabled && data.whitelistConfig.addresses.length === 0) {
      warnings.push('Whitelist is enabled but no addresses are configured');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate a new UUID for the property record
   */
  private generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Create default ERC20 properties
   */
  static createDefaults(tokenId: string): ERC20FormData {
    return {
      isMintable: false,
      isBurnable: false,
      isPausable: false,
      tokenType: 'standard',
      accessControl: 'owner',
      allowManagement: true,
      permit: false,
      snapshot: false,
      antiWhaleEnabled: false,
      blacklistEnabled: false,
      deflationEnabled: false,
      stakingEnabled: false,
      buyFeeEnabled: false,
      sellFeeEnabled: false,
      autoLiquidityEnabled: false,
      reflectionEnabled: false,
      burnOnTransfer: false,
      lotteryEnabled: false,
      presaleEnabled: false,
      vestingEnabled: false,
      governanceEnabled: false,
      useGeographicRestrictions: false,
      defaultRestrictionPolicy: 'allow',
      transferConfig: JsonbConfigMapper.createDefaultTransferConfig(),
      gasConfig: JsonbConfigMapper.createDefaultGasConfig(),
      complianceConfig: JsonbConfigMapper.createDefaultComplianceConfig(),
      whitelistConfig: JsonbConfigMapper.createDefaultWhitelistConfig(),
    };
  }
}
