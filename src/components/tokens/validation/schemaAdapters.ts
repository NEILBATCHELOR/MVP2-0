/**
 * Schema Adapters
 * Provides functions to adapt form data to properties format and enum conversions
 */

/**
 * Token standard enum mappings
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
 * Convert string standard to enum
 */
export function standardToEnum(standard: string): TokenStandardEnum {
  switch (standard) {
    case 'ERC-20':
      return TokenStandardEnum.ERC20;
    case 'ERC-721':
      return TokenStandardEnum.ERC721;
    case 'ERC-1155':
      return TokenStandardEnum.ERC1155;
    case 'ERC-1400':
      return TokenStandardEnum.ERC1400;
    case 'ERC-3525':
      return TokenStandardEnum.ERC3525;
    case 'ERC-4626':
      return TokenStandardEnum.ERC4626;
    default:
      throw new Error(`Unknown token standard: ${standard}`);
  }
}

/**
 * Convert enum to string standard
 */
export function enumToStandard(enumValue: TokenStandardEnum): string {
  return enumValue;
}

/**
 * Adapter function type
 */
type FormToPropertiesAdapter = (formData: any) => any;

/**
 * ERC-20 form to properties adapter
 */
function erc20Adapter(formData: any): any {
  return {
    initial_supply: formData.initialSupply,
    cap: formData.cap,
    is_mintable: formData.isMintable,
    is_burnable: formData.isBurnable,
    is_pausable: formData.isPausable,
    token_type: formData.tokenType,
    access_control: formData.accessControl,
    allowance_management: formData.allowanceManagement,
    permit_enabled: formData.permit,
    snapshot_enabled: formData.snapshot,
    fee_on_transfer: formData.feeOnTransfer,
    rebasing_enabled: formData.rebasing,
    governance_features: formData.governanceFeatures,
    transfer_config: formData.transferConfig,
    gas_config: formData.gasConfig,
    compliance_config: formData.complianceConfig,
    whitelist_config: formData.whitelistConfig
  };
}

/**
 * ERC-721 form to properties adapter
 */
function erc721Adapter(formData: any): any {
  return {
    base_uri: formData.baseUri,
    metadata_storage: formData.metadataStorage,
    max_supply: formData.maxSupply,
    has_royalty: formData.hasRoyalty,
    royalty_percentage: formData.royaltyPercentage,
    royalty_receiver: formData.royaltyReceiver,
    is_burnable: formData.isBurnable,
    is_pausable: formData.isPausable,
    is_mintable: formData.isMintable,
    asset_type: formData.assetType,
    minting_method: formData.mintingMethod,
    auto_increment_ids: formData.autoIncrementIds,
    enumerable: formData.enumerable,
    uri_storage: formData.uriStorage,
    access_control: formData.accessControl,
    updatable_uris: formData.updatableUris
  };
}

/**
 * ERC-1155 form to properties adapter
 */
function erc1155Adapter(formData: any): any {
  return {
    base_uri: formData.baseUri,
    metadata_storage: formData.metadataStorage,
    has_royalty: formData.hasRoyalty,
    royalty_percentage: formData.royaltyPercentage,
    royalty_receiver: formData.royaltyReceiver,
    is_burnable: formData.isBurnable,
    is_pausable: formData.isPausable,
    is_mintable: formData.isMintable,
    batch_operations: formData.batchOperations,
    access_control: formData.accessControl,
    updatable_uris: formData.updatableUris
  };
}

/**
 * ERC-1400 form to properties adapter
 */
function erc1400Adapter(formData: any): any {
  return {
    initial_supply: formData.initialSupply,
    cap: formData.cap,
    is_mintable: formData.isMintable,
    is_burnable: formData.isBurnable,
    is_pausable: formData.isPausable,
    document_uri: formData.documentUri,
    document_hash: formData.documentHash,
    controller_address: formData.controllerAddress,
    require_kyc: formData.requireKyc,
    security_type: formData.securityType,
    issuing_jurisdiction: formData.issuingJurisdiction,
    issuing_entity_name: formData.issuingEntityName,
    issuing_entity_lei: formData.issuingEntityLei,
    transfer_restrictions: formData.transferRestrictions,
    kyc_settings: formData.kycSettings,
    compliance_settings: formData.complianceSettings,
    forced_transfers: formData.forcedTransfers,
    issuance_modules: formData.issuanceModules,
    document_management: formData.documentManagement,
    recovery_mechanism: formData.recoveryMechanism
  };
}

/**
 * ERC-3525 form to properties adapter
 */
function erc3525Adapter(formData: any): any {
  return {
    value_decimals: formData.valueDecimals,
    base_uri: formData.baseUri,
    metadata_storage: formData.metadataStorage,
    slot_type: formData.slotType,
    is_burnable: formData.isBurnable,
    is_pausable: formData.isPausable,
    has_royalty: formData.hasRoyalty,
    royalty_percentage: formData.royaltyPercentage,
    royalty_receiver: formData.royaltyReceiver,
    slot_approvals: formData.slotApprovals,
    value_approvals: formData.valueApprovals,
    access_control: formData.accessControl,
    updatable_uris: formData.updatableUris,
    updatable_slots: formData.updatableSlots,
    value_transfers_enabled: formData.valueTransfersEnabled,
    sales_config: formData.salesConfig,
    mergable: formData.mergable,
    splittable: formData.splittable,
    slot_transfer_validation: formData.slotTransferValidation
  };
}

/**
 * ERC-4626 form to properties adapter
 */
function erc4626Adapter(formData: any): any {
  return {
    asset_address: formData.assetAddress,
    asset_symbol: formData.assetSymbol,
    asset_name: formData.assetName,
    asset_decimals: formData.assetDecimals,
    strategy_type: formData.strategyType,
    yield_source: formData.yieldSource,
    management_fee: formData.managementFee,
    performance_fee: formData.performanceFee,
    fee_recipient: formData.feeRecipient,
    deposit_limit: formData.depositLimit,
    withdrawal_limit: formData.withdrawalLimit,
    max_total_assets: formData.maxTotalAssets,
    access_control: formData.accessControl,
    pause_guardian: formData.pauseGuardian,
    emergency_shutdown: formData.emergencyShutdown,
    rebalancing_enabled: formData.rebalancingEnabled,
    auto_compound: formData.autoCompound,
    slippage_tolerance: formData.slippageTolerance,
    harvest_threshold: formData.harvestThreshold
  };
}

/**
 * Adapter registry mapping token standards to their adapters
 */
const adapterRegistry: Record<TokenStandardEnum, FormToPropertiesAdapter> = {
  [TokenStandardEnum.ERC20]: erc20Adapter,
  [TokenStandardEnum.ERC721]: erc721Adapter,
  [TokenStandardEnum.ERC1155]: erc1155Adapter,
  [TokenStandardEnum.ERC1400]: erc1400Adapter,
  [TokenStandardEnum.ERC3525]: erc3525Adapter,
  [TokenStandardEnum.ERC4626]: erc4626Adapter
};

/**
 * Get the form to properties adapter for a specific token standard
 */
export function getFormToPropertiesAdapter(standard: TokenStandardEnum): FormToPropertiesAdapter | null {
  return adapterRegistry[standard] || null;
}

/**
 * Apply the adapter for a token standard to form data
 */
export function adaptFormToProperties(standard: string, formData: any): any {
  const enumStandard = standardToEnum(standard);
  const adapter = getFormToPropertiesAdapter(enumStandard);
  
  if (!adapter) {
    throw new Error(`No adapter found for token standard: ${standard}`);
  }
  
  return adapter(formData);
}
