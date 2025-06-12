/**
 * ERC1155 Property Mapper
 * Comprehensive implementation for ERC1155 multi-token properties mapping
 */

import { BaseMapper, ValidationResult } from '../shared/baseMapper';
import { PropertyTableMapper } from '../database/schemaMapper';
import { 
  JsonbConfigMapper, 
  TransferConfig, 
  WhitelistConfig,
  SalesConfig,
  DynamicUriConfig,
  BatchMintingConfig
} from '../config/jsonbConfigMapper';

/**
 * Advanced JSONB configurations specific to ERC1155
 */
export interface ContainerConfig {
  enabled: boolean;
  maxCapacity?: number;
  transferableContents?: boolean;
  containerTypes?: string[];
}

export interface TokenRecipe {
  id: string;
  name: string;
  requiredTokens: Array<{
    tokenId: string;
    amount: string;
  }>;
  outputToken: {
    tokenId: string;
    amount: string;
  };
  enabled: boolean;
}

export interface BulkDiscountTier {
  minQuantity: number;
  discountPercentage: number;
  enabled: boolean;
}

export interface VotingWeightPerToken {
  tokenId: string;
  votingWeight: number;
}

export interface WrappedVersion {
  chainId: string;
  contractAddress: string;
  bridgeType: 'lock-mint' | 'burn-mint';
  enabled: boolean;
}

/**
 * Database schema for ERC1155 properties
 */
export interface TokenERC1155PropertiesDB {
  id: string;
  token_id: string;
  base_uri?: string;
  metadata_storage?: string;
  has_royalty?: boolean;
  royalty_percentage?: string;
  royalty_receiver?: string;
  is_burnable?: boolean;
  is_pausable?: boolean;
  access_control?: string;
  updatable_uris?: boolean;
  supply_tracking?: boolean;
  enable_approval_for_all?: boolean;
  sales_config?: any; // JSONB
  whitelist_config?: any; // JSONB
  batch_transfer_limits?: any; // JSONB
  dynamic_uri_config?: any; // JSONB
  batch_minting_config?: any; // JSONB
  transfer_restrictions?: any; // JSONB
  container_config?: any; // JSONB
  dynamic_uris?: boolean;
  batch_minting_enabled?: boolean;
  container_enabled?: boolean;
  use_geographic_restrictions?: boolean;
  default_restriction_policy?: string;
  mint_roles?: string[];
  burning_enabled?: boolean;
  burn_roles?: string[];
  updatable_metadata?: boolean;
  metadata_update_roles?: string[];
  supply_tracking_advanced?: boolean;
  max_supply_per_type?: string;
  pricing_model?: string;
  base_price?: string;
  price_multipliers?: any; // JSONB
  bulk_discount_enabled?: boolean;
  bulk_discount_tiers?: any; // JSONB
  referral_rewards_enabled?: boolean;
  referral_percentage?: string;
  lazy_minting_enabled?: boolean;
  airdrop_enabled?: boolean;
  airdrop_snapshot_block?: number;
  claim_period_enabled?: boolean;
  claim_start_time?: string;
  claim_end_time?: string;
  crafting_enabled?: boolean;
  fusion_enabled?: boolean;
  token_recipes?: any; // JSONB
  experience_points_enabled?: boolean;
  leveling_enabled?: boolean;
  consumable_tokens?: boolean;
  marketplace_fees_enabled?: boolean;
  marketplace_fee_percentage?: string;
  marketplace_fee_recipient?: string;
  bundle_trading_enabled?: boolean;
  atomic_swaps_enabled?: boolean;
  cross_collection_trading?: boolean;
  voting_power_enabled?: boolean;
  voting_weight_per_token?: any; // JSONB
  community_treasury_enabled?: boolean;
  treasury_percentage?: string;
  proposal_creation_threshold?: string;
  bridge_enabled?: boolean;
  bridgeable_token_types?: string[];
  wrapped_versions?: any; // JSONB
  layer2_support_enabled?: boolean;
  supported_layer2_networks?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Domain model for ERC1155 properties
 */
export interface TokenERC1155Properties {
  id: string;
  tokenId: string;
  baseUri?: string;
  metadataStorage?: string;
  hasRoyalty?: boolean;
  royaltyPercentage?: string;
  royaltyReceiver?: string;
  isBurnable?: boolean;
  isPausable?: boolean;
  accessControl?: string;
  updatableUris?: boolean;
  supplyTracking?: boolean;
  enableApprovalForAll?: boolean;
  salesConfig?: SalesConfig;
  whitelistConfig?: WhitelistConfig;
  batchTransferLimits?: Record<string, any>;
  dynamicUriConfig?: DynamicUriConfig;
  batchMintingConfig?: BatchMintingConfig;
  transferRestrictions?: TransferConfig;
  containerConfig?: ContainerConfig;
  dynamicUris?: boolean;
  batchMintingEnabled?: boolean;
  containerEnabled?: boolean;
  useGeographicRestrictions?: boolean;
  defaultRestrictionPolicy?: string;
  mintRoles?: string[];
  burningEnabled?: boolean;
  burnRoles?: string[];
  updatableMetadata?: boolean;
  metadataUpdateRoles?: string[];
  supplyTrackingAdvanced?: boolean;
  maxSupplyPerType?: string;
  pricingModel?: string;
  basePrice?: string;
  priceMultipliers?: Record<string, any>;
  bulkDiscountEnabled?: boolean;
  bulkDiscountTiers?: BulkDiscountTier[];
  referralRewardsEnabled?: boolean;
  referralPercentage?: string;
  lazyMintingEnabled?: boolean;
  airdropEnabled?: boolean;
  airdropSnapshotBlock?: number;
  claimPeriodEnabled?: boolean;
  claimStartTime?: string;
  claimEndTime?: string;
  craftingEnabled?: boolean;
  fusionEnabled?: boolean;
  tokenRecipes?: TokenRecipe[];
  experiencePointsEnabled?: boolean;
  levelingEnabled?: boolean;
  consumableTokens?: boolean;
  marketplaceFeesEnabled?: boolean;
  marketplaceFeePercentage?: string;
  marketplaceFeeRecipient?: string;
  bundleTradingEnabled?: boolean;
  atomicSwapsEnabled?: boolean;
  crossCollectionTrading?: boolean;
  votingPowerEnabled?: boolean;
  votingWeightPerToken?: VotingWeightPerToken[];
  communityTreasuryEnabled?: boolean;
  treasuryPercentage?: string;
  proposalCreationThreshold?: string;
  bridgeEnabled?: boolean;
  bridgeableTokenTypes?: string[];
  wrappedVersions?: WrappedVersion[];
  layer2SupportEnabled?: boolean;
  supportedLayer2Networks?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Form data interface for ERC1155
 */
export interface ERC1155FormData {
  // Internal fields
  id?: string;
  tokenId?: string;
  
  // Basic multi-token properties
  baseUri?: string;
  metadataStorage?: string;
  accessControl?: string;
  
  // Royalty configuration
  hasRoyalty?: boolean;
  royaltyPercentage?: string;
  royaltyReceiver?: string;
  
  // Token capabilities
  isBurnable?: boolean;
  isPausable?: boolean;
  updatableUris?: boolean;
  supplyTracking?: boolean;
  enableApprovalForAll?: boolean;
  
  // Minting configuration
  mintRoles?: string[];
  burningEnabled?: boolean;
  burnRoles?: string[];
  updatableMetadata?: boolean;
  metadataUpdateRoles?: string[];
  
  // Supply and pricing
  supplyTrackingAdvanced?: boolean;
  maxSupplyPerType?: string;
  pricingModel?: string;
  basePrice?: string;
  bulkDiscountEnabled?: boolean;
  referralRewardsEnabled?: boolean;
  referralPercentage?: string;
  
  // Minting features
  lazyMintingEnabled?: boolean;
  batchMintingEnabled?: boolean;
  dynamicUris?: boolean;
  
  // Airdrop and claiming
  airdropEnabled?: boolean;
  airdropSnapshotBlock?: number;
  claimPeriodEnabled?: boolean;
  claimStartTime?: string;
  claimEndTime?: string;
  
  // Gaming features
  craftingEnabled?: boolean;
  fusionEnabled?: boolean;
  experiencePointsEnabled?: boolean;
  levelingEnabled?: boolean;
  consumableTokens?: boolean;
  containerEnabled?: boolean;
  
  // Marketplace features
  marketplaceFeesEnabled?: boolean;
  marketplaceFeePercentage?: string;
  marketplaceFeeRecipient?: string;
  bundleTradingEnabled?: boolean;
  atomicSwapsEnabled?: boolean;
  crossCollectionTrading?: boolean;
  
  // Governance features
  votingPowerEnabled?: boolean;
  communityTreasuryEnabled?: boolean;
  treasuryPercentage?: string;
  proposalCreationThreshold?: string;
  
  // Cross-chain features
  bridgeEnabled?: boolean;
  bridgeableTokenTypes?: string[];
  layer2SupportEnabled?: boolean;
  supportedLayer2Networks?: string[];
  
  // Compliance
  useGeographicRestrictions?: boolean;
  defaultRestrictionPolicy?: string;
  
  // JSONB configurations
  salesConfig?: SalesConfig;
  whitelistConfig?: WhitelistConfig;
  batchTransferLimits?: Record<string, any>;
  dynamicUriConfig?: DynamicUriConfig;
  batchMintingConfig?: BatchMintingConfig;
  transferRestrictions?: TransferConfig;
  containerConfig?: ContainerConfig;
  priceMultipliers?: Record<string, any>;
  bulkDiscountTiers?: BulkDiscountTier[];
  tokenRecipes?: TokenRecipe[];
  votingWeightPerToken?: VotingWeightPerToken[];
  wrappedVersions?: WrappedVersion[];
}

/**
 * ERC1155 Property Mapper
 */
export class ERC1155PropertyMapper extends PropertyTableMapper<TokenERC1155Properties, TokenERC1155PropertiesDB> {
  
  protected getTableName(): string {
    return 'token_erc1155_properties';
  }

  protected getRequiredFields(): string[] {
    return ['token_id'];
  }

  toDomain(dbRecord: TokenERC1155PropertiesDB): TokenERC1155Properties {
    return {
      id: dbRecord.id,
      tokenId: dbRecord.token_id,
      baseUri: dbRecord.base_uri,
      metadataStorage: dbRecord.metadata_storage,
      hasRoyalty: dbRecord.has_royalty,
      royaltyPercentage: dbRecord.royalty_percentage,
      royaltyReceiver: dbRecord.royalty_receiver,
      isBurnable: dbRecord.is_burnable,
      isPausable: dbRecord.is_pausable,
      accessControl: dbRecord.access_control,
      updatableUris: dbRecord.updatable_uris,
      supplyTracking: dbRecord.supply_tracking,
      enableApprovalForAll: dbRecord.enable_approval_for_all,
      salesConfig: this.mapSalesConfig(dbRecord.sales_config),
      whitelistConfig: JsonbConfigMapper.mapWhitelistConfig(dbRecord.whitelist_config),
      batchTransferLimits: this.handleJsonbField(dbRecord.batch_transfer_limits),
      dynamicUriConfig: this.mapDynamicUriConfig(dbRecord.dynamic_uri_config),
      batchMintingConfig: this.mapBatchMintingConfig(dbRecord.batch_minting_config),
      transferRestrictions: JsonbConfigMapper.mapTransferConfig(dbRecord.transfer_restrictions),
      containerConfig: this.mapContainerConfig(dbRecord.container_config),
      dynamicUris: dbRecord.dynamic_uris,
      batchMintingEnabled: dbRecord.batch_minting_enabled,
      containerEnabled: dbRecord.container_enabled,
      useGeographicRestrictions: dbRecord.use_geographic_restrictions,
      defaultRestrictionPolicy: dbRecord.default_restriction_policy,
      mintRoles: dbRecord.mint_roles,
      burningEnabled: dbRecord.burning_enabled,
      burnRoles: dbRecord.burn_roles,
      updatableMetadata: dbRecord.updatable_metadata,
      metadataUpdateRoles: dbRecord.metadata_update_roles,
      supplyTrackingAdvanced: dbRecord.supply_tracking_advanced,
      maxSupplyPerType: dbRecord.max_supply_per_type,
      pricingModel: dbRecord.pricing_model,
      basePrice: dbRecord.base_price,
      priceMultipliers: this.handleJsonbField(dbRecord.price_multipliers),
      bulkDiscountEnabled: dbRecord.bulk_discount_enabled,
      bulkDiscountTiers: this.mapBulkDiscountTiers(dbRecord.bulk_discount_tiers),
      referralRewardsEnabled: dbRecord.referral_rewards_enabled,
      referralPercentage: dbRecord.referral_percentage,
      lazyMintingEnabled: dbRecord.lazy_minting_enabled,
      airdropEnabled: dbRecord.airdrop_enabled,
      airdropSnapshotBlock: dbRecord.airdrop_snapshot_block,
      claimPeriodEnabled: dbRecord.claim_period_enabled,
      claimStartTime: dbRecord.claim_start_time,
      claimEndTime: dbRecord.claim_end_time,
      craftingEnabled: dbRecord.crafting_enabled,
      fusionEnabled: dbRecord.fusion_enabled,
      tokenRecipes: this.mapTokenRecipes(dbRecord.token_recipes),
      experiencePointsEnabled: dbRecord.experience_points_enabled,
      levelingEnabled: dbRecord.leveling_enabled,
      consumableTokens: dbRecord.consumable_tokens,
      marketplaceFeesEnabled: dbRecord.marketplace_fees_enabled,
      marketplaceFeePercentage: dbRecord.marketplace_fee_percentage,
      marketplaceFeeRecipient: dbRecord.marketplace_fee_recipient,
      bundleTradingEnabled: dbRecord.bundle_trading_enabled,
      atomicSwapsEnabled: dbRecord.atomic_swaps_enabled,
      crossCollectionTrading: dbRecord.cross_collection_trading,
      votingPowerEnabled: dbRecord.voting_power_enabled,
      votingWeightPerToken: this.mapVotingWeights(dbRecord.voting_weight_per_token),
      communityTreasuryEnabled: dbRecord.community_treasury_enabled,
      treasuryPercentage: dbRecord.treasury_percentage,
      proposalCreationThreshold: dbRecord.proposal_creation_threshold,
      bridgeEnabled: dbRecord.bridge_enabled,
      bridgeableTokenTypes: dbRecord.bridgeable_token_types,
      wrappedVersions: this.mapWrappedVersions(dbRecord.wrapped_versions),
      layer2SupportEnabled: dbRecord.layer2_support_enabled,
      supportedLayer2Networks: dbRecord.supported_layer2_networks,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  toDatabase(domainObject: TokenERC1155Properties): TokenERC1155PropertiesDB {
    return this.cleanUndefined({
      id: domainObject.id,
      token_id: domainObject.tokenId,
      base_uri: domainObject.baseUri,
      metadata_storage: domainObject.metadataStorage,
      has_royalty: domainObject.hasRoyalty,
      royalty_percentage: domainObject.royaltyPercentage,
      royalty_receiver: domainObject.royaltyReceiver,
      is_burnable: domainObject.isBurnable,
      is_pausable: domainObject.isPausable,
      access_control: domainObject.accessControl,
      updatable_uris: domainObject.updatableUris,
      supply_tracking: domainObject.supplyTracking,
      enable_approval_for_all: domainObject.enableApprovalForAll,
      sales_config: this.prepareJsonbField(domainObject.salesConfig),
      whitelist_config: this.prepareJsonbField(domainObject.whitelistConfig),
      batch_transfer_limits: this.prepareJsonbField(domainObject.batchTransferLimits),
      dynamic_uri_config: this.prepareJsonbField(domainObject.dynamicUriConfig),
      batch_minting_config: this.prepareJsonbField(domainObject.batchMintingConfig),
      transfer_restrictions: this.prepareJsonbField(domainObject.transferRestrictions),
      container_config: this.prepareJsonbField(domainObject.containerConfig),
      dynamic_uris: domainObject.dynamicUris,
      batch_minting_enabled: domainObject.batchMintingEnabled,
      container_enabled: domainObject.containerEnabled,
      use_geographic_restrictions: domainObject.useGeographicRestrictions,
      default_restriction_policy: domainObject.defaultRestrictionPolicy,
      mint_roles: domainObject.mintRoles,
      burning_enabled: domainObject.burningEnabled,
      burn_roles: domainObject.burnRoles,
      updatable_metadata: domainObject.updatableMetadata,
      metadata_update_roles: domainObject.metadataUpdateRoles,
      supply_tracking_advanced: domainObject.supplyTrackingAdvanced,
      max_supply_per_type: domainObject.maxSupplyPerType,
      pricing_model: domainObject.pricingModel,
      base_price: domainObject.basePrice,
      price_multipliers: this.prepareJsonbField(domainObject.priceMultipliers),
      bulk_discount_enabled: domainObject.bulkDiscountEnabled,
      bulk_discount_tiers: this.prepareJsonbField(domainObject.bulkDiscountTiers),
      referral_rewards_enabled: domainObject.referralRewardsEnabled,
      referral_percentage: domainObject.referralPercentage,
      lazy_minting_enabled: domainObject.lazyMintingEnabled,
      airdrop_enabled: domainObject.airdropEnabled,
      airdrop_snapshot_block: domainObject.airdropSnapshotBlock,
      claim_period_enabled: domainObject.claimPeriodEnabled,
      claim_start_time: domainObject.claimStartTime,
      claim_end_time: domainObject.claimEndTime,
      crafting_enabled: domainObject.craftingEnabled,
      fusion_enabled: domainObject.fusionEnabled,
      token_recipes: this.prepareJsonbField(domainObject.tokenRecipes),
      experience_points_enabled: domainObject.experiencePointsEnabled,
      leveling_enabled: domainObject.levelingEnabled,
      consumable_tokens: domainObject.consumableTokens,
      marketplace_fees_enabled: domainObject.marketplaceFeesEnabled,
      marketplace_fee_percentage: domainObject.marketplaceFeePercentage,
      marketplace_fee_recipient: domainObject.marketplaceFeeRecipient,
      bundle_trading_enabled: domainObject.bundleTradingEnabled,
      atomic_swaps_enabled: domainObject.atomicSwapsEnabled,
      cross_collection_trading: domainObject.crossCollectionTrading,
      voting_power_enabled: domainObject.votingPowerEnabled,
      voting_weight_per_token: this.prepareJsonbField(domainObject.votingWeightPerToken),
      community_treasury_enabled: domainObject.communityTreasuryEnabled,
      treasury_percentage: domainObject.treasuryPercentage,
      proposal_creation_threshold: domainObject.proposalCreationThreshold,
      bridge_enabled: domainObject.bridgeEnabled,
      bridgeable_token_types: domainObject.bridgeableTokenTypes,
      wrapped_versions: this.prepareJsonbField(domainObject.wrappedVersions),
      layer2_support_enabled: domainObject.layer2SupportEnabled,
      supported_layer2_networks: domainObject.supportedLayer2Networks,
      created_at: domainObject.createdAt,
      updated_at: domainObject.updatedAt,
    }) as TokenERC1155PropertiesDB;
  }

  fromForm(formData: ERC1155FormData): TokenERC1155PropertiesDB {
    return this.cleanUndefined({
      id: formData.id || this.generateId(),
      token_id: formData.tokenId,
      base_uri: formData.baseUri,
      metadata_storage: formData.metadataStorage || 'ipfs',
      has_royalty: formData.hasRoyalty || false,
      royalty_percentage: formData.royaltyPercentage,
      royalty_receiver: formData.royaltyReceiver,
      is_burnable: formData.isBurnable || false,
      is_pausable: formData.isPausable || false,
      access_control: formData.accessControl || 'ownable',
      updatable_uris: formData.updatableUris || false,
      supply_tracking: formData.supplyTracking || false,
      enable_approval_for_all: formData.enableApprovalForAll ?? true,
      sales_config: this.prepareJsonbField(formData.salesConfig),
      whitelist_config: this.prepareJsonbField(formData.whitelistConfig),
      batch_transfer_limits: this.prepareJsonbField(formData.batchTransferLimits),
      dynamic_uri_config: this.prepareJsonbField(formData.dynamicUriConfig),
      batch_minting_config: this.prepareJsonbField(formData.batchMintingConfig),
      transfer_restrictions: this.prepareJsonbField(formData.transferRestrictions),
      container_config: this.prepareJsonbField(formData.containerConfig),
      dynamic_uris: formData.dynamicUris || false,
      batch_minting_enabled: formData.batchMintingEnabled || false,
      container_enabled: formData.containerEnabled || false,
      use_geographic_restrictions: formData.useGeographicRestrictions || false,
      default_restriction_policy: formData.defaultRestrictionPolicy || 'allow',
      mint_roles: formData.mintRoles,
      burning_enabled: formData.burningEnabled || false,
      burn_roles: formData.burnRoles,
      updatable_metadata: formData.updatableMetadata || false,
      metadata_update_roles: formData.metadataUpdateRoles,
      supply_tracking_advanced: formData.supplyTrackingAdvanced || false,
      max_supply_per_type: formData.maxSupplyPerType,
      pricing_model: formData.pricingModel || 'fixed',
      base_price: formData.basePrice,
      price_multipliers: this.prepareJsonbField(formData.priceMultipliers),
      bulk_discount_enabled: formData.bulkDiscountEnabled || false,
      bulk_discount_tiers: this.prepareJsonbField(formData.bulkDiscountTiers),
      referral_rewards_enabled: formData.referralRewardsEnabled || false,
      referral_percentage: formData.referralPercentage,
      lazy_minting_enabled: formData.lazyMintingEnabled || false,
      airdrop_enabled: formData.airdropEnabled || false,
      airdrop_snapshot_block: formData.airdropSnapshotBlock,
      claim_period_enabled: formData.claimPeriodEnabled || false,
      claim_start_time: formData.claimStartTime,
      claim_end_time: formData.claimEndTime,
      crafting_enabled: formData.craftingEnabled || false,
      fusion_enabled: formData.fusionEnabled || false,
      token_recipes: this.prepareJsonbField(formData.tokenRecipes),
      experience_points_enabled: formData.experiencePointsEnabled || false,
      leveling_enabled: formData.levelingEnabled || false,
      consumable_tokens: formData.consumableTokens || false,
      marketplace_fees_enabled: formData.marketplaceFeesEnabled || false,
      marketplace_fee_percentage: formData.marketplaceFeePercentage,
      marketplace_fee_recipient: formData.marketplaceFeeRecipient,
      bundle_trading_enabled: formData.bundleTradingEnabled || false,
      atomic_swaps_enabled: formData.atomicSwapsEnabled || false,
      cross_collection_trading: formData.crossCollectionTrading || false,
      voting_power_enabled: formData.votingPowerEnabled || false,
      voting_weight_per_token: this.prepareJsonbField(formData.votingWeightPerToken),
      community_treasury_enabled: formData.communityTreasuryEnabled || false,
      treasury_percentage: formData.treasuryPercentage,
      proposal_creation_threshold: formData.proposalCreationThreshold,
      bridge_enabled: formData.bridgeEnabled || false,
      bridgeable_token_types: formData.bridgeableTokenTypes,
      wrapped_versions: this.prepareJsonbField(formData.wrappedVersions),
      layer2_support_enabled: formData.layer2SupportEnabled || false,
      supported_layer2_networks: formData.supportedLayer2Networks,
    }) as TokenERC1155PropertiesDB;
  }

  toForm(domainObject: TokenERC1155Properties): ERC1155FormData {
    return {
      baseUri: domainObject.baseUri,
      metadataStorage: domainObject.metadataStorage,
      accessControl: domainObject.accessControl,
      hasRoyalty: domainObject.hasRoyalty,
      royaltyPercentage: domainObject.royaltyPercentage,
      royaltyReceiver: domainObject.royaltyReceiver,
      isBurnable: domainObject.isBurnable,
      isPausable: domainObject.isPausable,
      updatableUris: domainObject.updatableUris,
      supplyTracking: domainObject.supplyTracking,
      enableApprovalForAll: domainObject.enableApprovalForAll,
      mintRoles: domainObject.mintRoles,
      burningEnabled: domainObject.burningEnabled,
      burnRoles: domainObject.burnRoles,
      updatableMetadata: domainObject.updatableMetadata,
      metadataUpdateRoles: domainObject.metadataUpdateRoles,
      supplyTrackingAdvanced: domainObject.supplyTrackingAdvanced,
      maxSupplyPerType: domainObject.maxSupplyPerType,
      pricingModel: domainObject.pricingModel,
      basePrice: domainObject.basePrice,
      bulkDiscountEnabled: domainObject.bulkDiscountEnabled,
      referralRewardsEnabled: domainObject.referralRewardsEnabled,
      referralPercentage: domainObject.referralPercentage,
      lazyMintingEnabled: domainObject.lazyMintingEnabled,
      batchMintingEnabled: domainObject.batchMintingEnabled,
      dynamicUris: domainObject.dynamicUris,
      airdropEnabled: domainObject.airdropEnabled,
      airdropSnapshotBlock: domainObject.airdropSnapshotBlock,
      claimPeriodEnabled: domainObject.claimPeriodEnabled,
      claimStartTime: domainObject.claimStartTime,
      claimEndTime: domainObject.claimEndTime,
      craftingEnabled: domainObject.craftingEnabled,
      fusionEnabled: domainObject.fusionEnabled,
      experiencePointsEnabled: domainObject.experiencePointsEnabled,
      levelingEnabled: domainObject.levelingEnabled,
      consumableTokens: domainObject.consumableTokens,
      containerEnabled: domainObject.containerEnabled,
      marketplaceFeesEnabled: domainObject.marketplaceFeesEnabled,
      marketplaceFeePercentage: domainObject.marketplaceFeePercentage,
      marketplaceFeeRecipient: domainObject.marketplaceFeeRecipient,
      bundleTradingEnabled: domainObject.bundleTradingEnabled,
      atomicSwapsEnabled: domainObject.atomicSwapsEnabled,
      crossCollectionTrading: domainObject.crossCollectionTrading,
      votingPowerEnabled: domainObject.votingPowerEnabled,
      communityTreasuryEnabled: domainObject.communityTreasuryEnabled,
      treasuryPercentage: domainObject.treasuryPercentage,
      proposalCreationThreshold: domainObject.proposalCreationThreshold,
      bridgeEnabled: domainObject.bridgeEnabled,
      bridgeableTokenTypes: domainObject.bridgeableTokenTypes,
      layer2SupportEnabled: domainObject.layer2SupportEnabled,
      supportedLayer2Networks: domainObject.supportedLayer2Networks,
      useGeographicRestrictions: domainObject.useGeographicRestrictions,
      defaultRestrictionPolicy: domainObject.defaultRestrictionPolicy,
      salesConfig: domainObject.salesConfig,
      whitelistConfig: domainObject.whitelistConfig,
      batchTransferLimits: domainObject.batchTransferLimits,
      dynamicUriConfig: domainObject.dynamicUriConfig,
      batchMintingConfig: domainObject.batchMintingConfig,
      transferRestrictions: domainObject.transferRestrictions,
      containerConfig: domainObject.containerConfig,
      priceMultipliers: domainObject.priceMultipliers,
      bulkDiscountTiers: domainObject.bulkDiscountTiers,
      tokenRecipes: domainObject.tokenRecipes,
      votingWeightPerToken: domainObject.votingWeightPerToken,
      wrappedVersions: domainObject.wrappedVersions,
    };
  }

  /**
   * Map Sales configuration
   */
  private mapSalesConfig(data: any): SalesConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        enabled: Boolean(config.enabled),
        price: config.price || '0',
        currency: config.currency || 'ETH',
        maxPurchase: config.maxPurchase || '1',
        minPurchase: config.minPurchase || '1',
        startTime: config.startTime,
        endTime: config.endTime,
      };
    } catch {
      return null;
    }
  }

  /**
   * Map Dynamic URI configuration
   */
  private mapDynamicUriConfig(data: any): DynamicUriConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        enabled: Boolean(config.enabled),
        basePattern: config.basePattern,
        variables: Array.isArray(config.variables) ? config.variables : [],
        updateFrequency: config.updateFrequency || 'manual',
      };
    } catch {
      return null;
    }
  }

  /**
   * Map Batch Minting configuration
   */
  private mapBatchMintingConfig(data: any): BatchMintingConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        enabled: Boolean(config.enabled),
        maxBatchSize: Number(config.maxBatchSize) || 100,
        gasPriceMultiplier: Number(config.gasPriceMultiplier) || 1.0,
        retryOnFailure: Boolean(config.retryOnFailure),
        delayBetweenBatches: Number(config.delayBetweenBatches) || 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Map Container configuration
   */
  private mapContainerConfig(data: any): ContainerConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        enabled: Boolean(config.enabled),
        maxCapacity: Number(config.maxCapacity) || 100,
        transferableContents: Boolean(config.transferableContents),
        containerTypes: Array.isArray(config.containerTypes) ? config.containerTypes : [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Map Bulk Discount Tiers
   */
  private mapBulkDiscountTiers(data: any): BulkDiscountTier[] {
    if (!data) return [];
    
    try {
      const tiers = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(tiers) ? tiers.map(tier => ({
        minQuantity: Number(tier.minQuantity) || 1,
        discountPercentage: Number(tier.discountPercentage) || 0,
        enabled: Boolean(tier.enabled),
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Token Recipes
   */
  private mapTokenRecipes(data: any): TokenRecipe[] {
    if (!data) return [];
    
    try {
      const recipes = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(recipes) ? recipes.map(recipe => ({
        id: recipe.id || crypto.randomUUID(),
        name: recipe.name || '',
        requiredTokens: Array.isArray(recipe.requiredTokens) ? recipe.requiredTokens : [],
        outputToken: recipe.outputToken || { tokenId: '', amount: '0' },
        enabled: Boolean(recipe.enabled),
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Voting Weights
   */
  private mapVotingWeights(data: any): VotingWeightPerToken[] {
    if (!data) return [];
    
    try {
      const weights = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(weights) ? weights.map(weight => ({
        tokenId: weight.tokenId || '',
        votingWeight: Number(weight.votingWeight) || 1,
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Wrapped Versions
   */
  private mapWrappedVersions(data: any): WrappedVersion[] {
    if (!data) return [];
    
    try {
      const versions = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(versions) ? versions.map(version => ({
        chainId: version.chainId || '',
        contractAddress: version.contractAddress || '',
        bridgeType: version.bridgeType || 'lock-mint',
        enabled: Boolean(version.enabled),
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Advanced validation for ERC1155 properties
   */
  validate(data: ERC1155FormData): ValidationResult {
    const baseValidation = super.validate(data);
    if (!baseValidation.valid) return baseValidation;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate royalty settings
    if (data.hasRoyalty) {
      if (!data.royaltyReceiver) {
        errors.push('Royalty receiver address is required when royalty is enabled');
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(data.royaltyReceiver)) {
        errors.push('Invalid royalty receiver address format');
      }

      if (data.royaltyPercentage) {
        const percentage = parseFloat(data.royaltyPercentage);
        if (percentage < 0 || percentage > 10) {
          errors.push('Royalty percentage must be between 0 and 10');
        }
      }
    }

    // Validate pricing settings
    if (data.basePrice && parseFloat(data.basePrice) < 0) {
      errors.push('Base price must be non-negative');
    }

    if (data.referralRewardsEnabled && data.referralPercentage) {
      const percentage = parseFloat(data.referralPercentage);
      if (percentage < 0 || percentage > 50) {
        errors.push('Referral percentage must be between 0 and 50');
      }
    }

    // Validate bulk discount tiers
    if (data.bulkDiscountEnabled && data.bulkDiscountTiers) {
      for (const tier of data.bulkDiscountTiers) {
        if (tier.minQuantity <= 0) {
          errors.push('Bulk discount minimum quantity must be positive');
        }
        if (tier.discountPercentage < 0 || tier.discountPercentage > 100) {
          errors.push('Bulk discount percentage must be between 0 and 100');
        }
      }
    }

    // Validate claim period
    if (data.claimPeriodEnabled) {
      if (data.claimStartTime && data.claimEndTime) {
        const start = new Date(data.claimStartTime);
        const end = new Date(data.claimEndTime);
        if (start >= end) {
          errors.push('Claim start time must be before end time');
        }
      }
    }

    // Validate marketplace settings
    if (data.marketplaceFeesEnabled) {
      if (!data.marketplaceFeeRecipient) {
        errors.push('Marketplace fee recipient is required when fees are enabled');
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(data.marketplaceFeeRecipient)) {
        errors.push('Invalid marketplace fee recipient address format');
      }

      if (data.marketplaceFeePercentage) {
        const percentage = parseFloat(data.marketplaceFeePercentage);
        if (percentage < 0 || percentage > 10) {
          errors.push('Marketplace fee percentage must be between 0 and 10');
        }
      }
    }

    // Validate governance settings
    if (data.communityTreasuryEnabled) {
      if (data.treasuryPercentage) {
        const percentage = parseFloat(data.treasuryPercentage);
        if (percentage < 0 || percentage > 100) {
          errors.push('Treasury percentage must be between 0 and 100');
        }
      }
    }

    // Validate token recipes
    if (data.craftingEnabled && data.tokenRecipes) {
      for (const recipe of data.tokenRecipes) {
        if (!recipe.name || recipe.name.trim().length === 0) {
          errors.push('Recipe name cannot be empty');
        }
        if (!recipe.requiredTokens || recipe.requiredTokens.length === 0) {
          errors.push(`Recipe "${recipe.name}" must have required tokens`);
        }
        if (!recipe.outputToken || !recipe.outputToken.tokenId) {
          errors.push(`Recipe "${recipe.name}" must have output token`);
        }
      }
    }

    // Business logic warnings
    if (data.consumableTokens && !data.supplyTracking) {
      warnings.push('Consider enabling supply tracking for consumable tokens');
    }

    if (data.votingPowerEnabled && !data.votingWeightPerToken?.length) {
      warnings.push('Voting power enabled but no token weights configured');
    }

    if (data.bridgeEnabled && !data.bridgeableTokenTypes?.length) {
      warnings.push('Bridge enabled but no token types configured for bridging');
    }

    if (data.layer2SupportEnabled && !data.supportedLayer2Networks?.length) {
      warnings.push('Layer 2 support enabled but no networks specified');
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
   * Create default ERC1155 properties
   */
  static createDefaults(tokenId: string): ERC1155FormData {
    return {
      metadataStorage: 'ipfs',
      accessControl: 'ownable',
      hasRoyalty: false,
      isBurnable: false,
      isPausable: false,
      updatableUris: false,
      supplyTracking: false,
      enableApprovalForAll: true,
      burningEnabled: false,
      updatableMetadata: false,
      supplyTrackingAdvanced: false,
      pricingModel: 'fixed',
      bulkDiscountEnabled: false,
      referralRewardsEnabled: false,
      lazyMintingEnabled: false,
      batchMintingEnabled: false,
      dynamicUris: false,
      airdropEnabled: false,
      claimPeriodEnabled: false,
      craftingEnabled: false,
      fusionEnabled: false,
      experiencePointsEnabled: false,
      levelingEnabled: false,
      consumableTokens: false,
      containerEnabled: false,
      marketplaceFeesEnabled: false,
      bundleTradingEnabled: false,
      atomicSwapsEnabled: false,
      crossCollectionTrading: false,
      votingPowerEnabled: false,
      communityTreasuryEnabled: false,
      bridgeEnabled: false,
      layer2SupportEnabled: false,
      useGeographicRestrictions: false,
      defaultRestrictionPolicy: 'allow',
      salesConfig: JsonbConfigMapper.createDefaultSalesConfig(),
      whitelistConfig: JsonbConfigMapper.createDefaultWhitelistConfig(),
      transferRestrictions: JsonbConfigMapper.createDefaultTransferConfig(),
      dynamicUriConfig: JsonbConfigMapper.createDefaultDynamicUriConfig(),
      batchMintingConfig: JsonbConfigMapper.createDefaultBatchMintingConfig(),
    };
  }
}

/**
 * Standalone function for compatibility with standardServices.ts
 */
export function mapERC1155FormToDatabase(formData: ERC1155FormData & { standard?: string; config_mode?: string; tokenId?: string }) {
  const mapper = new ERC1155PropertyMapper();
  
  const properties = mapper.fromForm({
    ...formData,
    tokenId: formData.tokenId,
  });

  // Handle additional tables (placeholder for types, balances, URI mappings)
  const types: any[] = [];
  const balances: any[] = [];
  const uriMappings: any[] = [];

  return {
    properties,
    types,
    balances,
    uriMappings,
  };
}
