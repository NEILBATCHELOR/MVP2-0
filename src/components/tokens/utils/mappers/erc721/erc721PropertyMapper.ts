/**
 * ERC721 Property Mapper
 * Reference implementation for ERC721 properties mapping with comprehensive NFT features
 */

import { BaseMapper, ValidationResult } from '../shared/baseMapper';
import { PropertyTableMapper } from '../database/schemaMapper';
import { 
  JsonbConfigMapper, 
  TransferConfig, 
  SalesConfig, 
  WhitelistConfig, 
  RoyaltyConfig,
  DynamicUriConfig,
  BatchMintingConfig
} from '../config/jsonbConfigMapper';

/**
 * Advanced JSONB configurations specific to ERC721
 */
export interface BridgeConfig {
  chains: Array<{
    chainId: string;
    contractAddress: string;
    bridgeType: 'lock-mint' | 'burn-mint';
    enabled: boolean;
  }>;
}

export interface MintPhase {
  id: string;
  name: string;
  price: string;
  maxSupply: string;
  maxMints: number;
  startTime: string;
  endTime: string;
  merkleRoot?: string;
  requiresWhitelist: boolean;
  enabled: boolean;
}

/**
 * Database schema for ERC721 properties
 */
export interface TokenERC721PropertiesDB {
  id: string;
  token_id: string;
  base_uri?: string;
  metadata_storage?: string;
  max_supply?: string;
  has_royalty?: boolean;
  royalty_percentage?: string;
  royalty_receiver?: string;
  is_burnable?: boolean;
  is_pausable?: boolean;
  is_mintable?: boolean;
  asset_type?: string;
  minting_method?: string;
  auto_increment_ids?: boolean;
  enumerable?: boolean;
  uri_storage?: string;
  access_control?: string;
  updatable_uris?: boolean;
  sales_config?: any; // JSONB
  whitelist_config?: any; // JSONB
  permission_config?: any; // JSONB
  dynamic_uri_config?: any; // JSONB
  batch_minting_config?: any; // JSONB
  transfer_restrictions?: any; // JSONB
  supply_validation_enabled?: boolean;
  contract_uri?: string;
  custom_base_uri?: string;
  revealable?: boolean;
  pre_reveal_uri?: string;
  reserved_tokens?: number;
  minting_price?: string;
  max_mints_per_tx?: number;
  max_mints_per_wallet?: number;
  enable_fractional_ownership?: boolean;
  enable_dynamic_metadata?: boolean;
  use_safe_transfer?: boolean;
  public_sale_enabled?: boolean;
  public_sale_price?: string;
  public_sale_start_time?: string;
  public_sale_end_time?: string;
  whitelist_sale_enabled?: boolean;
  whitelist_sale_price?: string;
  whitelist_sale_start_time?: string;
  whitelist_sale_end_time?: string;
  reveal_batch_size?: number;
  auto_reveal?: boolean;
  reveal_delay?: number;
  placeholder_image_uri?: string;
  metadata_frozen?: boolean;
  metadata_provenance_hash?: string;
  mint_roles?: string[];
  admin_mint_enabled?: boolean;
  public_mint_enabled?: boolean;
  burn_roles?: string[];
  transfer_locked?: boolean;
  soulbound?: boolean;
  creator_earnings_enabled?: boolean;
  creator_earnings_percentage?: string;
  creator_earnings_address?: string;
  marketplace_approved?: string[];
  operator_filter_enabled?: boolean;
  custom_operator_filter_address?: string;
  utility_enabled?: boolean;
  utility_type?: string;
  staking_enabled?: boolean;
  staking_rewards_token_address?: string;
  staking_rewards_rate?: string;
  breeding_enabled?: boolean;
  evolution_enabled?: boolean;
  supply_cap_enabled?: boolean;
  total_supply_cap?: string;
  mint_phases_enabled?: boolean;
  dutch_auction_enabled?: boolean;
  dutch_auction_start_price?: string;
  dutch_auction_end_price?: string;
  dutch_auction_duration?: number;
  cross_chain_enabled?: boolean;
  bridge_contracts?: any; // JSONB
  layer2_enabled?: boolean;
  layer2_networks?: string[];
  use_geographic_restrictions?: boolean;
  default_restriction_policy?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Domain model for ERC721 properties
 */
export interface TokenERC721Properties {
  id: string;
  tokenId: string;
  baseUri?: string;
  metadataStorage?: string;
  maxSupply?: string;
  hasRoyalty?: boolean;
  royaltyPercentage?: string;
  royaltyReceiver?: string;
  isBurnable?: boolean;
  isPausable?: boolean;
  isMintable?: boolean;
  assetType?: string;
  mintingMethod?: string;
  autoIncrementIds?: boolean;
  enumerable?: boolean;
  uriStorage?: string;
  accessControl?: string;
  updatableUris?: boolean;
  salesConfig?: SalesConfig;
  whitelistConfig?: WhitelistConfig;
  permissionConfig?: Record<string, any>;
  dynamicUriConfig?: DynamicUriConfig;
  batchMintingConfig?: BatchMintingConfig;
  transferRestrictions?: TransferConfig;
  supplyValidationEnabled?: boolean;
  contractUri?: string;
  customBaseUri?: string;
  revealable?: boolean;
  preRevealUri?: string;
  reservedTokens?: number;
  mintingPrice?: string;
  maxMintsPerTx?: number;
  maxMintsPerWallet?: number;
  enableFractionalOwnership?: boolean;
  enableDynamicMetadata?: boolean;
  useSafeTransfer?: boolean;
  publicSaleEnabled?: boolean;
  publicSalePrice?: string;
  publicSaleStartTime?: string;
  publicSaleEndTime?: string;
  whitelistSaleEnabled?: boolean;
  whitelistSalePrice?: string;
  whitelistSaleStartTime?: string;
  whitelistSaleEndTime?: string;
  revealBatchSize?: number;
  autoReveal?: boolean;
  revealDelay?: number;
  placeholderImageUri?: string;
  metadataFrozen?: boolean;
  metadataProvenanceHash?: string;
  mintRoles?: string[];
  adminMintEnabled?: boolean;
  publicMintEnabled?: boolean;
  burnRoles?: string[];
  transferLocked?: boolean;
  soulbound?: boolean;
  creatorEarningsEnabled?: boolean;
  creatorEarningsPercentage?: string;
  creatorEarningsAddress?: string;
  marketplaceApproved?: string[];
  operatorFilterEnabled?: boolean;
  customOperatorFilterAddress?: string;
  utilityEnabled?: boolean;
  utilityType?: string;
  stakingEnabled?: boolean;
  stakingRewardsTokenAddress?: string;
  stakingRewardsRate?: string;
  breedingEnabled?: boolean;
  evolutionEnabled?: boolean;
  supplyCapEnabled?: boolean;
  totalSupplyCap?: string;
  mintPhasesEnabled?: boolean;
  dutchAuctionEnabled?: boolean;
  dutchAuctionStartPrice?: string;
  dutchAuctionEndPrice?: string;
  dutchAuctionDuration?: number;
  crossChainEnabled?: boolean;
  bridgeContracts?: BridgeConfig;
  layer2Enabled?: boolean;
  layer2Networks?: string[];
  useGeographicRestrictions?: boolean;
  defaultRestrictionPolicy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Trait definition interface
 */
export interface TokenERC721Attribute {
  id: string;
  tokenId: string;
  traitType: string;
  values: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Form data interface for ERC721
 */
export interface ERC721FormData {
  // System fields
  id?: string;
  tokenId?: string;

  // Basic NFT properties
  baseUri?: string;
  metadataStorage?: string;
  maxSupply?: string;
  contractUri?: string;
  customBaseUri?: string;
  
  // Royalty configuration
  hasRoyalty?: boolean;
  royaltyPercentage?: string;
  royaltyReceiver?: string;
  
  // Token capabilities
  isBurnable?: boolean;
  isPausable?: boolean;
  isMintable?: boolean;
  autoIncrementIds?: boolean;
  enumerable?: boolean;
  updatableUris?: boolean;
  useSafeTransfer?: boolean;
  
  // Asset configuration
  assetType?: string;
  mintingMethod?: string;
  uriStorage?: string;
  accessControl?: string;
  
  // Minting configuration
  mintingPrice?: string;
  maxMintsPerTx?: number;
  maxMintsPerWallet?: number;
  reservedTokens?: number;
  adminMintEnabled?: boolean;
  publicMintEnabled?: boolean;
  mintRoles?: string[];
  
  // Reveal configuration
  revealable?: boolean;
  preRevealUri?: string;
  placeholderImageUri?: string;
  revealBatchSize?: number;
  autoReveal?: boolean;
  revealDelay?: number;
  metadataFrozen?: boolean;
  metadataProvenanceHash?: string;
  
  // Sale configuration
  publicSaleEnabled?: boolean;
  publicSalePrice?: string;
  publicSaleStartTime?: string;
  publicSaleEndTime?: string;
  whitelistSaleEnabled?: boolean;
  whitelistSalePrice?: string;
  whitelistSaleStartTime?: string;
  whitelistSaleEndTime?: string;
  
  // Advanced features
  enableFractionalOwnership?: boolean;
  enableDynamicMetadata?: boolean;
  supplyValidationEnabled?: boolean;
  supplyCapEnabled?: boolean;
  totalSupplyCap?: string;
  transferLocked?: boolean;
  soulbound?: boolean;
  
  // Creator earnings
  creatorEarningsEnabled?: boolean;
  creatorEarningsPercentage?: string;
  creatorEarningsAddress?: string;
  
  // Marketplace configuration
  marketplaceApproved?: string[];
  operatorFilterEnabled?: boolean;
  customOperatorFilterAddress?: string;
  
  // Utility and gaming
  utilityEnabled?: boolean;
  utilityType?: string;
  stakingEnabled?: boolean;
  stakingRewardsTokenAddress?: string;
  stakingRewardsRate?: string;
  breedingEnabled?: boolean;
  evolutionEnabled?: boolean;
  
  // Auction configuration
  mintPhasesEnabled?: boolean;
  dutchAuctionEnabled?: boolean;
  dutchAuctionStartPrice?: string;
  dutchAuctionEndPrice?: string;
  dutchAuctionDuration?: number;
  
  // Cross-chain and Layer 2
  crossChainEnabled?: boolean;
  layer2Enabled?: boolean;
  layer2Networks?: string[];
  
  // Compliance
  useGeographicRestrictions?: boolean;
  defaultRestrictionPolicy?: string;
  burnRoles?: string[];
  
  // JSONB configurations
  salesConfig?: SalesConfig;
  whitelistConfig?: WhitelistConfig;
  permissionConfig?: Record<string, any>;
  dynamicUriConfig?: DynamicUriConfig;
  batchMintingConfig?: BatchMintingConfig;
  transferRestrictions?: TransferConfig;
  bridgeContracts?: BridgeConfig;
  
  // Attributes/traits
  attributes?: TokenERC721Attribute[];
}

/**
 * ERC721 Property Mapper
 */
export class ERC721PropertyMapper extends PropertyTableMapper<TokenERC721Properties, TokenERC721PropertiesDB> {
  
  protected getTableName(): string {
    return 'token_erc721_properties';
  }

  protected getRequiredFields(): string[] {
    return ['token_id'];
  }

  toDomain(dbRecord: TokenERC721PropertiesDB): TokenERC721Properties {
    return {
      id: dbRecord.id,
      tokenId: dbRecord.token_id,
      baseUri: dbRecord.base_uri,
      metadataStorage: dbRecord.metadata_storage,
      maxSupply: dbRecord.max_supply,
      hasRoyalty: dbRecord.has_royalty,
      royaltyPercentage: dbRecord.royalty_percentage,
      royaltyReceiver: dbRecord.royalty_receiver,
      isBurnable: dbRecord.is_burnable,
      isPausable: dbRecord.is_pausable,
      isMintable: dbRecord.is_mintable,
      assetType: dbRecord.asset_type,
      mintingMethod: dbRecord.minting_method,
      autoIncrementIds: dbRecord.auto_increment_ids,
      enumerable: dbRecord.enumerable,
      uriStorage: dbRecord.uri_storage,
      accessControl: dbRecord.access_control,
      updatableUris: dbRecord.updatable_uris,
      salesConfig: JsonbConfigMapper.mapSalesConfig(dbRecord.sales_config),
      whitelistConfig: JsonbConfigMapper.mapWhitelistConfig(dbRecord.whitelist_config),
      permissionConfig: this.handleJsonbField(dbRecord.permission_config),
      dynamicUriConfig: this.mapDynamicUriConfig(dbRecord.dynamic_uri_config),
      batchMintingConfig: this.mapBatchMintingConfig(dbRecord.batch_minting_config),
      transferRestrictions: JsonbConfigMapper.mapTransferConfig(dbRecord.transfer_restrictions),
      supplyValidationEnabled: dbRecord.supply_validation_enabled,
      contractUri: dbRecord.contract_uri,
      customBaseUri: dbRecord.custom_base_uri,
      revealable: dbRecord.revealable,
      preRevealUri: dbRecord.pre_reveal_uri,
      reservedTokens: dbRecord.reserved_tokens,
      mintingPrice: dbRecord.minting_price,
      maxMintsPerTx: dbRecord.max_mints_per_tx,
      maxMintsPerWallet: dbRecord.max_mints_per_wallet,
      enableFractionalOwnership: dbRecord.enable_fractional_ownership,
      enableDynamicMetadata: dbRecord.enable_dynamic_metadata,
      useSafeTransfer: dbRecord.use_safe_transfer,
      publicSaleEnabled: dbRecord.public_sale_enabled,
      publicSalePrice: dbRecord.public_sale_price,
      publicSaleStartTime: dbRecord.public_sale_start_time,
      publicSaleEndTime: dbRecord.public_sale_end_time,
      whitelistSaleEnabled: dbRecord.whitelist_sale_enabled,
      whitelistSalePrice: dbRecord.whitelist_sale_price,
      whitelistSaleStartTime: dbRecord.whitelist_sale_start_time,
      whitelistSaleEndTime: dbRecord.whitelist_sale_end_time,
      revealBatchSize: dbRecord.reveal_batch_size,
      autoReveal: dbRecord.auto_reveal,
      revealDelay: dbRecord.reveal_delay,
      placeholderImageUri: dbRecord.placeholder_image_uri,
      metadataFrozen: dbRecord.metadata_frozen,
      metadataProvenanceHash: dbRecord.metadata_provenance_hash,
      mintRoles: dbRecord.mint_roles,
      adminMintEnabled: dbRecord.admin_mint_enabled,
      publicMintEnabled: dbRecord.public_mint_enabled,
      burnRoles: dbRecord.burn_roles,
      transferLocked: dbRecord.transfer_locked,
      soulbound: dbRecord.soulbound,
      creatorEarningsEnabled: dbRecord.creator_earnings_enabled,
      creatorEarningsPercentage: dbRecord.creator_earnings_percentage,
      creatorEarningsAddress: dbRecord.creator_earnings_address,
      marketplaceApproved: dbRecord.marketplace_approved,
      operatorFilterEnabled: dbRecord.operator_filter_enabled,
      customOperatorFilterAddress: dbRecord.custom_operator_filter_address,
      utilityEnabled: dbRecord.utility_enabled,
      utilityType: dbRecord.utility_type,
      stakingEnabled: dbRecord.staking_enabled,
      stakingRewardsTokenAddress: dbRecord.staking_rewards_token_address,
      stakingRewardsRate: dbRecord.staking_rewards_rate,
      breedingEnabled: dbRecord.breeding_enabled,
      evolutionEnabled: dbRecord.evolution_enabled,
      supplyCapEnabled: dbRecord.supply_cap_enabled,
      totalSupplyCap: dbRecord.total_supply_cap,
      mintPhasesEnabled: dbRecord.mint_phases_enabled,
      dutchAuctionEnabled: dbRecord.dutch_auction_enabled,
      dutchAuctionStartPrice: dbRecord.dutch_auction_start_price,
      dutchAuctionEndPrice: dbRecord.dutch_auction_end_price,
      dutchAuctionDuration: dbRecord.dutch_auction_duration,
      crossChainEnabled: dbRecord.cross_chain_enabled,
      bridgeContracts: this.mapBridgeConfig(dbRecord.bridge_contracts),
      layer2Enabled: dbRecord.layer2_enabled,
      layer2Networks: dbRecord.layer2_networks,
      useGeographicRestrictions: dbRecord.use_geographic_restrictions,
      defaultRestrictionPolicy: dbRecord.default_restriction_policy,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  toDatabase(domainObject: TokenERC721Properties): TokenERC721PropertiesDB {
    return this.cleanUndefined({
      id: domainObject.id,
      token_id: domainObject.tokenId,
      base_uri: domainObject.baseUri,
      metadata_storage: domainObject.metadataStorage,
      max_supply: domainObject.maxSupply,
      has_royalty: domainObject.hasRoyalty,
      royalty_percentage: domainObject.royaltyPercentage,
      royalty_receiver: domainObject.royaltyReceiver,
      is_burnable: domainObject.isBurnable,
      is_pausable: domainObject.isPausable,
      is_mintable: domainObject.isMintable,
      asset_type: domainObject.assetType,
      minting_method: domainObject.mintingMethod,
      auto_increment_ids: domainObject.autoIncrementIds,
      enumerable: domainObject.enumerable,
      uri_storage: domainObject.uriStorage,
      access_control: domainObject.accessControl,
      updatable_uris: domainObject.updatableUris,
      sales_config: this.prepareJsonbField(domainObject.salesConfig),
      whitelist_config: this.prepareJsonbField(domainObject.whitelistConfig),
      permission_config: this.prepareJsonbField(domainObject.permissionConfig),
      dynamic_uri_config: this.prepareJsonbField(domainObject.dynamicUriConfig),
      batch_minting_config: this.prepareJsonbField(domainObject.batchMintingConfig),
      transfer_restrictions: this.prepareJsonbField(domainObject.transferRestrictions),
      supply_validation_enabled: domainObject.supplyValidationEnabled,
      contract_uri: domainObject.contractUri,
      custom_base_uri: domainObject.customBaseUri,
      revealable: domainObject.revealable,
      pre_reveal_uri: domainObject.preRevealUri,
      reserved_tokens: domainObject.reservedTokens,
      minting_price: domainObject.mintingPrice,
      max_mints_per_tx: domainObject.maxMintsPerTx,
      max_mints_per_wallet: domainObject.maxMintsPerWallet,
      enable_fractional_ownership: domainObject.enableFractionalOwnership,
      enable_dynamic_metadata: domainObject.enableDynamicMetadata,
      use_safe_transfer: domainObject.useSafeTransfer,
      public_sale_enabled: domainObject.publicSaleEnabled,
      public_sale_price: domainObject.publicSalePrice,
      public_sale_start_time: domainObject.publicSaleStartTime,
      public_sale_end_time: domainObject.publicSaleEndTime,
      whitelist_sale_enabled: domainObject.whitelistSaleEnabled,
      whitelist_sale_price: domainObject.whitelistSalePrice,
      whitelist_sale_start_time: domainObject.whitelistSaleStartTime,
      whitelist_sale_end_time: domainObject.whitelistSaleEndTime,
      reveal_batch_size: domainObject.revealBatchSize,
      auto_reveal: domainObject.autoReveal,
      reveal_delay: domainObject.revealDelay,
      placeholder_image_uri: domainObject.placeholderImageUri,
      metadata_frozen: domainObject.metadataFrozen,
      metadata_provenance_hash: domainObject.metadataProvenanceHash,
      mint_roles: domainObject.mintRoles,
      admin_mint_enabled: domainObject.adminMintEnabled,
      public_mint_enabled: domainObject.publicMintEnabled,
      burn_roles: domainObject.burnRoles,
      transfer_locked: domainObject.transferLocked,
      soulbound: domainObject.soulbound,
      creator_earnings_enabled: domainObject.creatorEarningsEnabled,
      creator_earnings_percentage: domainObject.creatorEarningsPercentage,
      creator_earnings_address: domainObject.creatorEarningsAddress,
      marketplace_approved: domainObject.marketplaceApproved,
      operator_filter_enabled: domainObject.operatorFilterEnabled,
      custom_operator_filter_address: domainObject.customOperatorFilterAddress,
      utility_enabled: domainObject.utilityEnabled,
      utility_type: domainObject.utilityType,
      staking_enabled: domainObject.stakingEnabled,
      staking_rewards_token_address: domainObject.stakingRewardsTokenAddress,
      staking_rewards_rate: domainObject.stakingRewardsRate,
      breeding_enabled: domainObject.breedingEnabled,
      evolution_enabled: domainObject.evolutionEnabled,
      supply_cap_enabled: domainObject.supplyCapEnabled,
      total_supply_cap: domainObject.totalSupplyCap,
      mint_phases_enabled: domainObject.mintPhasesEnabled,
      dutch_auction_enabled: domainObject.dutchAuctionEnabled,
      dutch_auction_start_price: domainObject.dutchAuctionStartPrice,
      dutch_auction_end_price: domainObject.dutchAuctionEndPrice,
      dutch_auction_duration: domainObject.dutchAuctionDuration,
      cross_chain_enabled: domainObject.crossChainEnabled,
      bridge_contracts: this.prepareJsonbField(domainObject.bridgeContracts),
      layer2_enabled: domainObject.layer2Enabled,
      layer2_networks: domainObject.layer2Networks,
      use_geographic_restrictions: domainObject.useGeographicRestrictions,
      default_restriction_policy: domainObject.defaultRestrictionPolicy,
      created_at: domainObject.createdAt,
      updated_at: domainObject.updatedAt,
    }) as TokenERC721PropertiesDB;
  }

  fromForm(formData: ERC721FormData): TokenERC721PropertiesDB {
    return this.cleanUndefined({
      id: formData.id || this.generateId(),
      token_id: formData.tokenId,
      base_uri: formData.baseUri,
      metadata_storage: formData.metadataStorage || 'ipfs',
      max_supply: formData.maxSupply,
      has_royalty: formData.hasRoyalty || false,
      royalty_percentage: formData.royaltyPercentage,
      royalty_receiver: formData.royaltyReceiver,
      is_burnable: formData.isBurnable || false,
      is_pausable: formData.isPausable || false,
      is_mintable: formData.isMintable || true,
      asset_type: formData.assetType || 'unique_asset',
      minting_method: formData.mintingMethod || 'open',
      auto_increment_ids: formData.autoIncrementIds ?? true,
      enumerable: formData.enumerable ?? true,
      uri_storage: formData.uriStorage || 'tokenId',
      access_control: formData.accessControl || 'ownable',
      updatable_uris: formData.updatableUris || false,
      sales_config: this.prepareJsonbField(formData.salesConfig),
      whitelist_config: this.prepareJsonbField(formData.whitelistConfig),
      permission_config: this.prepareJsonbField(formData.permissionConfig),
      dynamic_uri_config: this.prepareJsonbField(formData.dynamicUriConfig),
      batch_minting_config: this.prepareJsonbField(formData.batchMintingConfig),
      transfer_restrictions: this.prepareJsonbField(formData.transferRestrictions),
      supply_validation_enabled: formData.supplyValidationEnabled || false,
      contract_uri: formData.contractUri,
      custom_base_uri: formData.customBaseUri,
      revealable: formData.revealable || false,
      pre_reveal_uri: formData.preRevealUri,
      reserved_tokens: formData.reservedTokens,
      minting_price: formData.mintingPrice,
      max_mints_per_tx: formData.maxMintsPerTx,
      max_mints_per_wallet: formData.maxMintsPerWallet,
      enable_fractional_ownership: formData.enableFractionalOwnership || false,
      enable_dynamic_metadata: formData.enableDynamicMetadata || false,
      use_safe_transfer: formData.useSafeTransfer ?? true,
      public_sale_enabled: formData.publicSaleEnabled || false,
      public_sale_price: formData.publicSalePrice,
      public_sale_start_time: formData.publicSaleStartTime,
      public_sale_end_time: formData.publicSaleEndTime,
      whitelist_sale_enabled: formData.whitelistSaleEnabled || false,
      whitelist_sale_price: formData.whitelistSalePrice,
      whitelist_sale_start_time: formData.whitelistSaleStartTime,
      whitelist_sale_end_time: formData.whitelistSaleEndTime,
      reveal_batch_size: formData.revealBatchSize,
      auto_reveal: formData.autoReveal || false,
      reveal_delay: formData.revealDelay,
      placeholder_image_uri: formData.placeholderImageUri,
      metadata_frozen: formData.metadataFrozen || false,
      metadata_provenance_hash: formData.metadataProvenanceHash,
      mint_roles: formData.mintRoles,
      admin_mint_enabled: formData.adminMintEnabled ?? true,
      public_mint_enabled: formData.publicMintEnabled || false,
      burn_roles: formData.burnRoles,
      transfer_locked: formData.transferLocked || false,
      soulbound: formData.soulbound || false,
      creator_earnings_enabled: formData.creatorEarningsEnabled || false,
      creator_earnings_percentage: formData.creatorEarningsPercentage,
      creator_earnings_address: formData.creatorEarningsAddress,
      marketplace_approved: formData.marketplaceApproved,
      operator_filter_enabled: formData.operatorFilterEnabled || false,
      custom_operator_filter_address: formData.customOperatorFilterAddress,
      utility_enabled: formData.utilityEnabled || false,
      utility_type: formData.utilityType,
      staking_enabled: formData.stakingEnabled || false,
      staking_rewards_token_address: formData.stakingRewardsTokenAddress,
      staking_rewards_rate: formData.stakingRewardsRate,
      breeding_enabled: formData.breedingEnabled || false,
      evolution_enabled: formData.evolutionEnabled || false,
      supply_cap_enabled: formData.supplyCapEnabled || false,
      total_supply_cap: formData.totalSupplyCap,
      mint_phases_enabled: formData.mintPhasesEnabled || false,
      dutch_auction_enabled: formData.dutchAuctionEnabled || false,
      dutch_auction_start_price: formData.dutchAuctionStartPrice,
      dutch_auction_end_price: formData.dutchAuctionEndPrice,
      dutch_auction_duration: formData.dutchAuctionDuration,
      cross_chain_enabled: formData.crossChainEnabled || false,
      bridge_contracts: this.prepareJsonbField(formData.bridgeContracts),
      layer2_enabled: formData.layer2Enabled || false,
      layer2_networks: formData.layer2Networks,
      use_geographic_restrictions: formData.useGeographicRestrictions || false,
      default_restriction_policy: formData.defaultRestrictionPolicy || 'allow',
    }) as TokenERC721PropertiesDB;
  }

  toForm(domainObject: TokenERC721Properties): ERC721FormData {
    return {
      baseUri: domainObject.baseUri,
      metadataStorage: domainObject.metadataStorage,
      maxSupply: domainObject.maxSupply,
      contractUri: domainObject.contractUri,
      customBaseUri: domainObject.customBaseUri,
      hasRoyalty: domainObject.hasRoyalty,
      royaltyPercentage: domainObject.royaltyPercentage,
      royaltyReceiver: domainObject.royaltyReceiver,
      isBurnable: domainObject.isBurnable,
      isPausable: domainObject.isPausable,
      isMintable: domainObject.isMintable,
      autoIncrementIds: domainObject.autoIncrementIds,
      enumerable: domainObject.enumerable,
      updatableUris: domainObject.updatableUris,
      useSafeTransfer: domainObject.useSafeTransfer,
      assetType: domainObject.assetType,
      mintingMethod: domainObject.mintingMethod,
      uriStorage: domainObject.uriStorage,
      accessControl: domainObject.accessControl,
      mintingPrice: domainObject.mintingPrice,
      maxMintsPerTx: domainObject.maxMintsPerTx,
      maxMintsPerWallet: domainObject.maxMintsPerWallet,
      reservedTokens: domainObject.reservedTokens,
      adminMintEnabled: domainObject.adminMintEnabled,
      publicMintEnabled: domainObject.publicMintEnabled,
      mintRoles: domainObject.mintRoles,
      revealable: domainObject.revealable,
      preRevealUri: domainObject.preRevealUri,
      placeholderImageUri: domainObject.placeholderImageUri,
      revealBatchSize: domainObject.revealBatchSize,
      autoReveal: domainObject.autoReveal,
      revealDelay: domainObject.revealDelay,
      metadataFrozen: domainObject.metadataFrozen,
      metadataProvenanceHash: domainObject.metadataProvenanceHash,
      publicSaleEnabled: domainObject.publicSaleEnabled,
      publicSalePrice: domainObject.publicSalePrice,
      publicSaleStartTime: domainObject.publicSaleStartTime,
      publicSaleEndTime: domainObject.publicSaleEndTime,
      whitelistSaleEnabled: domainObject.whitelistSaleEnabled,
      whitelistSalePrice: domainObject.whitelistSalePrice,
      whitelistSaleStartTime: domainObject.whitelistSaleStartTime,
      whitelistSaleEndTime: domainObject.whitelistSaleEndTime,
      enableFractionalOwnership: domainObject.enableFractionalOwnership,
      enableDynamicMetadata: domainObject.enableDynamicMetadata,
      supplyValidationEnabled: domainObject.supplyValidationEnabled,
      supplyCapEnabled: domainObject.supplyCapEnabled,
      totalSupplyCap: domainObject.totalSupplyCap,
      transferLocked: domainObject.transferLocked,
      soulbound: domainObject.soulbound,
      creatorEarningsEnabled: domainObject.creatorEarningsEnabled,
      creatorEarningsPercentage: domainObject.creatorEarningsPercentage,
      creatorEarningsAddress: domainObject.creatorEarningsAddress,
      marketplaceApproved: domainObject.marketplaceApproved,
      operatorFilterEnabled: domainObject.operatorFilterEnabled,
      customOperatorFilterAddress: domainObject.customOperatorFilterAddress,
      utilityEnabled: domainObject.utilityEnabled,
      utilityType: domainObject.utilityType,
      stakingEnabled: domainObject.stakingEnabled,
      stakingRewardsTokenAddress: domainObject.stakingRewardsTokenAddress,
      stakingRewardsRate: domainObject.stakingRewardsRate,
      breedingEnabled: domainObject.breedingEnabled,
      evolutionEnabled: domainObject.evolutionEnabled,
      mintPhasesEnabled: domainObject.mintPhasesEnabled,
      dutchAuctionEnabled: domainObject.dutchAuctionEnabled,
      dutchAuctionStartPrice: domainObject.dutchAuctionStartPrice,
      dutchAuctionEndPrice: domainObject.dutchAuctionEndPrice,
      dutchAuctionDuration: domainObject.dutchAuctionDuration,
      crossChainEnabled: domainObject.crossChainEnabled,
      layer2Enabled: domainObject.layer2Enabled,
      layer2Networks: domainObject.layer2Networks,
      useGeographicRestrictions: domainObject.useGeographicRestrictions,
      defaultRestrictionPolicy: domainObject.defaultRestrictionPolicy,
      burnRoles: domainObject.burnRoles,
      salesConfig: domainObject.salesConfig,
      whitelistConfig: domainObject.whitelistConfig,
      permissionConfig: domainObject.permissionConfig,
      dynamicUriConfig: domainObject.dynamicUriConfig,
      batchMintingConfig: domainObject.batchMintingConfig,
      transferRestrictions: domainObject.transferRestrictions,
      bridgeContracts: domainObject.bridgeContracts,
    };
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
   * Map Bridge configuration
   */
  private mapBridgeConfig(data: any): BridgeConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        chains: Array.isArray(config.chains) ? config.chains.map((chain: any) => ({
          chainId: chain.chainId,
          contractAddress: chain.contractAddress,
          bridgeType: chain.bridgeType || 'lock-mint',
          enabled: Boolean(chain.enabled),
        })) : [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Advanced validation for ERC721 properties
   */
  validate(data: ERC721FormData): ValidationResult {
    const baseValidation = super.validate(data);
    if (!baseValidation.valid) return baseValidation;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate supply settings
    if (data.maxSupply && data.totalSupplyCap) {
      const maxSupply = parseFloat(data.maxSupply);
      const supplyCap = parseFloat(data.totalSupplyCap);
      if (maxSupply > supplyCap) {
        errors.push('Max supply cannot exceed total supply cap');
      }
    }

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

    // Validate minting settings
    if (data.maxMintsPerTx && data.maxMintsPerTx <= 0) {
      errors.push('Max mints per transaction must be positive');
    }

    if (data.maxMintsPerWallet && data.maxMintsPerWallet <= 0) {
      errors.push('Max mints per wallet must be positive');
    }

    if (data.reservedTokens && data.reservedTokens < 0) {
      errors.push('Reserved tokens must be non-negative');
    }

    // Validate reveal settings
    if (data.revealable) {
      if (!data.preRevealUri && !data.placeholderImageUri) {
        warnings.push('Consider setting a pre-reveal URI or placeholder image for revealable tokens');
      }

      if (data.revealBatchSize && data.revealBatchSize <= 0) {
        errors.push('Reveal batch size must be positive');
      }

      if (data.revealDelay && data.revealDelay < 0) {
        errors.push('Reveal delay must be non-negative');
      }
    }

    // Validate sale settings
    if (data.publicSaleEnabled || data.whitelistSaleEnabled) {
      if (data.publicSaleStartTime && data.publicSaleEndTime) {
        const start = new Date(data.publicSaleStartTime);
        const end = new Date(data.publicSaleEndTime);
        if (start >= end) {
          errors.push('Public sale start time must be before end time');
        }
      }

      if (data.whitelistSaleStartTime && data.whitelistSaleEndTime) {
        const start = new Date(data.whitelistSaleStartTime);
        const end = new Date(data.whitelistSaleEndTime);
        if (start >= end) {
          errors.push('Whitelist sale start time must be before end time');
        }
      }
    }

    // Validate Dutch auction settings
    if (data.dutchAuctionEnabled) {
      if (!data.dutchAuctionStartPrice || !data.dutchAuctionEndPrice) {
        errors.push('Dutch auction requires both start and end prices');
      } else {
        const startPrice = parseFloat(data.dutchAuctionStartPrice);
        const endPrice = parseFloat(data.dutchAuctionEndPrice);
        if (startPrice <= endPrice) {
          errors.push('Dutch auction start price must be greater than end price');
        }
      }

      if (!data.dutchAuctionDuration || data.dutchAuctionDuration <= 0) {
        errors.push('Dutch auction duration must be positive');
      }
    }

    // Validate creator earnings
    if (data.creatorEarningsEnabled) {
      if (!data.creatorEarningsAddress) {
        errors.push('Creator earnings address is required when creator earnings are enabled');
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(data.creatorEarningsAddress)) {
        errors.push('Invalid creator earnings address format');
      }

      if (data.creatorEarningsPercentage) {
        const percentage = parseFloat(data.creatorEarningsPercentage);
        if (percentage < 0 || percentage > 10) {
          errors.push('Creator earnings percentage must be between 0 and 10');
        }
      }
    }

    // Validate staking settings
    if (data.stakingEnabled) {
      if (data.stakingRewardsTokenAddress && !/^0x[a-fA-F0-9]{40}$/.test(data.stakingRewardsTokenAddress)) {
        errors.push('Invalid staking rewards token address format');
      }
    }

    // Validate marketplace settings
    if (data.marketplaceApproved) {
      for (const marketplace of data.marketplaceApproved) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(marketplace)) {
          errors.push(`Invalid marketplace address: ${marketplace}`);
        }
      }
    }

    // Business logic warnings
    if (data.soulbound && (data.publicSaleEnabled || data.whitelistSaleEnabled)) {
      warnings.push('Soulbound tokens typically should not have public sales enabled');
    }

    if (data.transferLocked && !data.soulbound) {
      warnings.push('Transfer locked tokens are typically soulbound');
    }

    if (data.crossChainEnabled && !data.bridgeContracts?.chains?.length) {
      warnings.push('Cross-chain enabled but no bridge contracts configured');
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
   * Create default ERC721 properties
   */
  static createDefaults(tokenId: string): ERC721FormData {
    return {
      metadataStorage: 'ipfs',
      isBurnable: false,
      isPausable: false,
      isMintable: true,
      autoIncrementIds: true,
      enumerable: true,
      updatableUris: false,
      useSafeTransfer: true,
      assetType: 'unique_asset',
      mintingMethod: 'open',
      uriStorage: 'tokenId',
      accessControl: 'ownable',
      hasRoyalty: false,
      adminMintEnabled: true,
      publicMintEnabled: false,
      revealable: false,
      autoReveal: false,
      metadataFrozen: false,
      publicSaleEnabled: false,
      whitelistSaleEnabled: false,
      enableFractionalOwnership: false,
      enableDynamicMetadata: false,
      supplyValidationEnabled: false,
      supplyCapEnabled: false,
      transferLocked: false,
      soulbound: false,
      creatorEarningsEnabled: false,
      operatorFilterEnabled: false,
      utilityEnabled: false,
      stakingEnabled: false,
      breedingEnabled: false,
      evolutionEnabled: false,
      mintPhasesEnabled: false,
      dutchAuctionEnabled: false,
      crossChainEnabled: false,
      layer2Enabled: false,
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
export function mapERC721FormToDatabase(formData: ERC721FormData & { standard?: string; config_mode?: string; tokenId?: string }) {
  const mapper = new ERC721PropertyMapper();
  
  const properties = mapper.fromForm({
    ...formData,
    tokenId: formData.tokenId,
  });

  // Handle attributes if provided
  const attributes = formData.attributes || [];

  return {
    properties,
    attributes,
  };
}
