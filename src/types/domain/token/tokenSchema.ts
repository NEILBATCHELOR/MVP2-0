/**
 * Token Schema Types
 * 
 * This file defines TypeScript interfaces for the enhanced token database schema.
 * It provides strong typing for all token standard specific tables and properties.
 */

import type { Json } from '@/types/core/supabase';
import type { TokensTable, TokenInsert, TokenUpdate } from '@/types/core/database';

/**
 * Token Standard Enum
 */
export enum TokenStandardEnum {
  ERC20 = 'ERC-20',
  ERC721 = 'ERC-721',
  ERC1155 = 'ERC-1155',
  ERC1400 = 'ERC-1400',
  ERC3525 = 'ERC-3525',
  ERC4626 = 'ERC-4626'
}

/**
 * Token Configuration Mode Enum
 */
export enum TokenConfigModeEnum {
  MIN = 'min',
  MAX = 'max',
  BASIC = 'basic',
  ADVANCED = 'advanced'
}

/**
 * Token Status Enum
 */
export enum TokenStatusEnum {
  DRAFT = 'DRAFT',
  REVIEW = 'UNDER REVIEW',
  APPROVED = 'APPROVED',
  READY_TO_MINT = 'READY TO MINT',
  MINTED = 'MINTED',
  DEPLOYED = 'DEPLOYED',
  PAUSED = 'PAUSED',
  DISTRIBUTED = 'DISTRIBUTED',
  REJECTED = 'REJECTED'
}

/**
 * Base Token Properties Interface
 */
export interface BaseTokenProperties {
  id: string;
  token_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * ERC20 Token Properties
 */
export interface TokenERC20Properties extends BaseTokenProperties {
  initial_supply?: string;
  cap?: string;
  is_mintable: boolean;
  is_burnable: boolean;
  is_pausable: boolean;
  token_type?: string;
  access_control?: string;
  allow_management?: boolean;
  permit?: boolean;
  snapshot?: boolean;
  fee_on_transfer?: Json;
  rebasing?: Json;
  governance_features?: Json;
}

/**
 * ERC721 Token Properties
 */
export interface TokenERC721Properties extends BaseTokenProperties {
  base_uri?: string;
  metadata_storage?: string;
  max_supply?: string;
  has_royalty: boolean;
  royalty_percentage?: string;
  royalty_receiver?: string;
  is_burnable: boolean;
  is_pausable: boolean;
  asset_type?: string;
  minting_method?: string;
  auto_increment_ids: boolean;
  enumerable: boolean;
  uri_storage?: string;
  access_control?: string;
  updatable_uris: boolean;
  sales_config?: Json;
  whitelist_config?: Json;
  permission_config?: Json;
}

/**
 * ERC1155 Token Properties
 */
export interface TokenERC1155Properties extends BaseTokenProperties {
  base_uri?: string;
  metadata_storage?: string;
  has_royalty: boolean;
  royalty_percentage?: string;
  royalty_receiver?: string;
  is_burnable: boolean;
  is_pausable: boolean;
  access_control?: string;
  updatable_uris: boolean;
  supply_tracking: boolean;
  enable_approval_for_all: boolean;
  sales_config?: Json;
  whitelist_config?: Json;
  batch_transfer_limits?: Json;
}

/**
 * ERC1400 Token Properties
 */
export interface TokenERC1400Properties extends BaseTokenProperties {
  initial_supply?: string;
  cap?: string;
  is_mintable: boolean;
  is_burnable: boolean;
  is_pausable: boolean;
  document_uri?: string;
  document_hash?: string;
  controller_address?: string;
  require_kyc: boolean;
  security_type?: string;
  issuing_jurisdiction?: string;
  issuing_entity_name?: string;
  issuing_entity_lei?: string;
  transfer_restrictions?: Json;
  kyc_settings?: Json;
  compliance_settings?: Json;
  forced_transfers: boolean;
  issuance_modules: boolean;
  document_management: boolean;
  recovery_mechanism: boolean;
}

/**
 * ERC3525 Token Properties
 */
export interface TokenERC3525Properties extends BaseTokenProperties {
  value_decimals: number;
  base_uri?: string;
  metadata_storage?: string;
  slot_type?: string;
  is_burnable: boolean;
  is_pausable: boolean;
  has_royalty: boolean;
  royalty_percentage?: string;
  royalty_receiver?: string;
  slot_approvals: boolean;
  value_approvals: boolean;
  access_control?: string;
  updatable_uris: boolean;
  updatable_slots: boolean;
  value_transfers_enabled: boolean;
  sales_config?: Json;
  mergable: boolean;
  splittable: boolean;
  slot_transfer_validation?: Json;
}

/**
 * ERC4626 Token Properties
 */
export interface TokenERC4626Properties extends BaseTokenProperties {
  asset_address?: string;
  asset_name?: string;
  asset_symbol?: string;
  asset_decimals: number;
  vault_type?: string;
  is_mintable: boolean;
  is_burnable: boolean;
  is_pausable: boolean;
  vault_strategy?: string;
  custom_strategy: boolean;
  strategy_controller?: string;
  access_control?: string;
  permit: boolean;
  flash_loans: boolean;
  emergency_shutdown: boolean;
  fee_structure?: Json;
  rebalancing_rules?: Json;
  performance_metrics: boolean;
  withdrawal_rules?: Json;
}

/**
 * Array Item Interfaces
 */

// ERC721 Token Attributes
export interface TokenERC721Attribute {
  id: string;
  token_id: string;
  trait_type: string;
  values: string[];
  created_at: string;
}

// ERC1155 Token Types
export interface TokenERC1155Type {
  id: string;
  token_id: string;
  token_type_id: string;
  name?: string;
  description?: string;
  max_supply?: string;
  metadata?: Json;
  created_at: string;
}

// ERC1155 Initial Balances
export interface TokenERC1155Balance {
  id: string;
  token_id: string;
  token_type_id: string;
  address: string;
  amount: string;
  created_at: string;
}

// ERC1155 URI Mappings
export interface TokenERC1155UriMapping {
  id: string;
  token_id: string;
  token_type_id: string;
  uri: string;
  created_at: string;
}

// ERC3525 Slots
export interface TokenERC3525Slot {
  id: string;
  token_id: string;
  slot_id: string;
  name?: string;
  description?: string;
  metadata?: Json;
  created_at: string;
}

// ERC3525 Initial Allocations
export interface TokenERC3525Allocation {
  id: string;
  token_id: string;
  slot_id: string;
  token_id_within_slot: string;
  value: string;
  created_at: string;
}

// ERC1400 Partitions
export interface TokenERC1400Partition {
  id: string;
  token_id: string;
  name: string;
  partition_id: string;
  metadata?: Json;
  created_at: string;
}

// ERC1400 Controllers
export interface TokenERC1400Controller {
  id: string;
  token_id: string;
  address: string;
  permissions: string[];
  created_at: string;
}

// ERC4626 Strategy Parameters
export interface TokenERC4626StrategyParam {
  id: string;
  token_id: string;
  name: string;
  value: string;
  description?: string;
  created_at: string;
}

// ERC4626 Asset Allocations
export interface TokenERC4626AssetAllocation {
  id: string;
  token_id: string;
  asset: string;
  percentage: string;
  created_at: string;
}

/**
 * Type for base token without required config_mode
 * This is used to avoid conflicts between TokensTable and enhanced types
 */
export type BaseTokenFields = Omit<TokensTable, 'config_mode'>;

/**
 * Enhanced Token Table with Configuration Mode
 */
export interface EnhancedTokensTable extends BaseTokenFields {
  config_mode: TokenConfigModeEnum;
}

/**
 * Enhanced Token Insert with Configuration Mode
 */
export interface EnhancedTokenInsert extends TokenInsert {
  config_mode?: TokenConfigModeEnum;
}

/**
 * Enhanced Token Update with Configuration Mode
 */
export interface EnhancedTokenUpdate extends TokenUpdate {
  config_mode?: TokenConfigModeEnum;
}

/**
 * Token View Interfaces
 */

// ERC20 Token View
export interface TokenERC20View extends BaseTokenFields {
  config_mode: TokenConfigModeEnum;
  config_mode_from_metadata?: string;
  property_id?: string;
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
  fee_on_transfer?: Json;
  rebasing?: Json;
  governance_features?: Json;
  property_created_at?: string;
  property_updated_at?: string;
}

// ERC721 Token View
export interface TokenERC721View extends BaseTokenFields {
  config_mode: TokenConfigModeEnum;
  config_mode_from_metadata?: string;
  property_id?: string;
  base_uri?: string;
  metadata_storage?: string;
  max_supply?: string;
  has_royalty?: boolean;
  royalty_percentage?: string;
  royalty_receiver?: string;
  is_burnable?: boolean;
  is_pausable?: boolean;
  asset_type?: string;
  minting_method?: string;
  auto_increment_ids?: boolean;
  enumerable?: boolean;
  uri_storage?: string;
  access_control?: string;
  updatable_uris?: boolean;
  sales_config?: Json;
  whitelist_config?: Json;
  permission_config?: Json;
  property_created_at?: string;
  property_updated_at?: string;
}

// ERC1155 Token View
export interface TokenERC1155View extends BaseTokenFields {
  config_mode: TokenConfigModeEnum;
  config_mode_from_metadata?: string;
  property_id?: string;
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
  sales_config?: Json;
  whitelist_config?: Json;
  batch_transfer_limits?: Json;
  property_created_at?: string;
  property_updated_at?: string;
}

// ERC1400 Token View
export interface TokenERC1400View extends BaseTokenFields {
  config_mode: TokenConfigModeEnum;
  config_mode_from_metadata?: string;
  property_id?: string;
  initial_supply?: string;
  cap?: string;
  is_mintable?: boolean;
  is_burnable?: boolean;
  is_pausable?: boolean;
  document_uri?: string;
  document_hash?: string;
  controller_address?: string;
  require_kyc?: boolean;
  security_type?: string;
  issuing_jurisdiction?: string;
  issuing_entity_name?: string;
  issuing_entity_lei?: string;
  transfer_restrictions?: Json;
  kyc_settings?: Json;
  compliance_settings?: Json;
  forced_transfers?: boolean;
  issuance_modules?: boolean;
  document_management?: boolean;
  recovery_mechanism?: boolean;
  property_created_at?: string;
  property_updated_at?: string;
}

// ERC3525 Token View
export interface TokenERC3525View extends BaseTokenFields {
  config_mode: TokenConfigModeEnum;
  config_mode_from_metadata?: string;
  property_id?: string;
  value_decimals?: number;
  base_uri?: string;
  metadata_storage?: string;
  slot_type?: string;
  is_burnable?: boolean;
  is_pausable?: boolean;
  has_royalty?: boolean;
  royalty_percentage?: string;
  royalty_receiver?: string;
  slot_approvals?: boolean;
  value_approvals?: boolean;
  access_control?: string;
  updatable_uris?: boolean;
  updatable_slots?: boolean;
  value_transfers_enabled?: boolean;
  sales_config?: Json;
  mergable?: boolean;
  splittable?: boolean;
  slot_transfer_validation?: Json;
  property_created_at?: string;
  property_updated_at?: string;
}

// ERC4626 Token View
export interface TokenERC4626View extends BaseTokenFields {
  config_mode: TokenConfigModeEnum;
  config_mode_from_metadata?: string;
  property_id?: string;
  asset_address?: string;
  asset_name?: string;
  asset_symbol?: string;
  asset_decimals?: number;
  vault_type?: string;
  is_mintable?: boolean;
  is_burnable?: boolean;
  is_pausable?: boolean;
  vault_strategy?: string;
  custom_strategy?: boolean;
  strategy_controller?: string;
  access_control?: string;
  permit?: boolean;
  flash_loans?: boolean;
  emergency_shutdown?: boolean;
  fee_structure?: Json;
  rebalancing_rules?: Json;
  performance_metrics?: boolean;
  property_created_at?: string;
  property_updated_at?: string;
  withdrawal_rules?: Json;
}

/**
 * Complete Token with Arrays and Relations
 */

// Complete ERC20 Token
export interface CompleteERC20Token extends TokenERC20View {}

// Complete ERC721 Token
export interface CompleteERC721Token extends TokenERC721View {
  attributes?: TokenERC721Attribute[];
}

// Complete ERC1155 Token
export interface CompleteERC1155Token extends TokenERC1155View {
  tokenTypes?: TokenERC1155Type[];
  initialBalances?: TokenERC1155Balance[];
  uriMappings?: TokenERC1155UriMapping[];
}

// Complete ERC1400 Token
export interface CompleteERC1400Token extends TokenERC1400View {
  partitions?: TokenERC1400Partition[];
  controllers?: TokenERC1400Controller[];
}

// Complete ERC3525 Token
export interface CompleteERC3525Token extends TokenERC3525View {
  slots?: TokenERC3525Slot[];
  allocations?: TokenERC3525Allocation[];
}

// Complete ERC4626 Token
export interface CompleteERC4626Token extends TokenERC4626View {
  strategyParams?: TokenERC4626StrategyParam[];
  assetAllocations?: TokenERC4626AssetAllocation[];
}

/**
 * Union type for all token property tables
 */
export type TokenProperties =
  | TokenERC20Properties
  | TokenERC721Properties
  | TokenERC1155Properties
  | TokenERC1400Properties
  | TokenERC3525Properties
  | TokenERC4626Properties;

/**
 * Union type for all complete token views
 */
export type CompleteToken =
  | CompleteERC20Token
  | CompleteERC721Token
  | CompleteERC1155Token
  | CompleteERC1400Token
  | CompleteERC3525Token
  | CompleteERC4626Token;

/**
 * Type guard functions
 */
export function isERC20Token(token: BaseTokenFields & { standard: string }): token is CompleteERC20Token {
  return token.standard === TokenStandardEnum.ERC20;
}

export function isERC721Token(token: BaseTokenFields & { standard: string }): token is CompleteERC721Token {
  return token.standard === TokenStandardEnum.ERC721;
}

export function isERC1155Token(token: BaseTokenFields & { standard: string }): token is CompleteERC1155Token {
  return token.standard === TokenStandardEnum.ERC1155;
}

export function isERC1400Token(token: BaseTokenFields & { standard: string }): token is CompleteERC1400Token {
  return token.standard === TokenStandardEnum.ERC1400;
}

export function isERC3525Token(token: BaseTokenFields & { standard: string }): token is CompleteERC3525Token {
  return token.standard === TokenStandardEnum.ERC3525;
}

export function isERC4626Token(token: BaseTokenFields & { standard: string }): token is CompleteERC4626Token {
  return token.standard === TokenStandardEnum.ERC4626;
}