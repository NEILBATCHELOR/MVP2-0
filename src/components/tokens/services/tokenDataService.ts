/**
 * Token Data Service
 * 
 * This service is responsible for fetching and managing token data from the various token-related tables.
 */
import { supabase } from '@/infrastructure/database/client';
import { 
  TokenStandard,
  TokenERC20Properties,
  TokenERC721Properties,
  TokenERC721Attribute,
  TokenERC1155Properties,
  TokenERC1155Type,
  TokenERC1155Balance,
  TokenERC1155UriMapping,
  TokenERC1400Properties,
  TokenERC1400Partition,
  TokenERC1400Controller,
  TokenERC3525Properties,
  TokenERC3525Slot,
  TokenERC3525Allocation,
  TokenERC4626Properties,
  TokenERC4626StrategyParam,
  TokenERC4626AssetAllocation
} from '@/types/core/centralModels';
import { EnhancedTokenData } from '../types';

/**
 * Maps database token standard format to the TokenStandard enum
 * This resolves type compatibility issues between database values and our enum
 */
function mapDatabaseStandardToEnum(standard: string): TokenStandard {
  switch(standard) {
    case 'ERC-20': return TokenStandard.ERC20;
    case 'ERC-721': return TokenStandard.ERC721;
    case 'ERC-1155': return TokenStandard.ERC1155;
    case 'ERC-1400': return TokenStandard.ERC1400;
    case 'ERC-3525': return TokenStandard.ERC3525;
    case 'ERC-4626': return TokenStandard.ERC4626;
    default:
      // If we can't match, use a type assertion as fallback
      // This should be rare since we control the database values
      console.warn(`Unknown token standard: ${standard}, using as-is`);
      return standard as unknown as TokenStandard;
  }
}

/**
 * Helper function to convert database snake_case to camelCase for properties
 */
function toCamelCase<T>(obj: any): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item)) as any;
  }

  const newObj: any = {};
  
  // Common field mapping to ensure consistent property names
  const fieldMappings: Record<string, string> = {
    'token_id': 'tokenId',
    'slot_id': 'slotId',
    'token_type_id': 'tokenTypeId',
    'partition_id': 'partitionId',
    'trait_type': 'traitType',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'is_mintable': 'isMintable',
    'is_burnable': 'isBurnable',
    'is_pausable': 'isPausable',
    'has_royalty': 'hasRoyalty',
    'initial_supply': 'initialSupply',
    'max_supply': 'maxSupply',
    'base_uri': 'baseUri',
    'metadata_storage': 'metadataStorage',
    'royalty_percentage': 'royaltyPercentage',
    'royalty_receiver': 'royaltyReceiver',
    'access_control': 'accessControl',
    'token_type': 'tokenType',
    'auto_increment_ids': 'autoIncrementIds',
    'uri_storage': 'uriStorage',
    'updatable_uris': 'updatableUris',
    'sales_config': 'salesConfig',
    'whitelist_config': 'whitelistConfig',
    'permission_config': 'permissionConfig',
    'fee_on_transfer': 'feeOnTransfer',
    'governance_features': 'governanceFeatures',
    'allow_management': 'allowanceManagement',
    'value_decimals': 'valueDecimals',
    'asset_token_address': 'assetTokenAddress',
    'asset_token_type': 'assetTokenType',
    'deposit_limit': 'depositLimit',
    'withdrawal_limit': 'withdrawalLimit',
    'fee_percentage': 'feePercentage',
    'fee_recipient': 'feeRecipient',
    'strategy_params': 'strategyParams',
    'strategy_type': 'strategyType',
    'yield_strategy': 'yieldStrategy',
    'expected_apy': 'expectedAPY'
  };
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Check if we have a specific mapping for this field
      if (fieldMappings[key]) {
        newObj[fieldMappings[key]] = toCamelCase(obj[key]);
      } else {
        // Otherwise convert snake_case to camelCase
        const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
        newObj[camelKey] = toCamelCase(obj[key]);
      }
    }
  }
  
  return newObj as T;
}

/**
 * Fetch enhanced token data including all standard-specific properties
 * @param tokenId The token ID to fetch data for
 * @returns EnhancedTokenData object with all token data
 */
export async function getEnhancedTokenData(tokenId: string): Promise<EnhancedTokenData> {
  try {
    console.log(`[TokenDataService] Fetching enhanced token data for token ID: ${tokenId}`);
    
    // First get the base token data
    const { data: tokenData, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();
    
    if (error) throw new Error(`Error fetching token: ${error.message}`);
    if (!tokenData) throw new Error(`Token with ID ${tokenId} not found`);
    
    console.log(`[TokenDataService] Found token: ${tokenData.name} (${tokenData.standard})`);
    
    // Initialize enhanced token data with the base token data
    const enhancedToken: EnhancedTokenData = {
      id: tokenData.id,
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      // Map the database standard format to the TokenStandard enum
      standard: mapDatabaseStandardToEnum(tokenData.standard),
      status: tokenData.status,
      blocks: tokenData.blocks ? (tokenData.blocks as Record<string, any>) : {},
      metadata: tokenData.metadata ? (tokenData.metadata as Record<string, any>) : {},
      projectId: tokenData.project_id,
      reviewers: tokenData.reviewers || [],
      approvals: tokenData.approvals || [],
      contractPreview: tokenData.contract_preview,
      totalSupply: tokenData.total_supply,
      configMode: tokenData.config_mode,
      configurationLevel: tokenData.config_mode === 'max' || tokenData.config_mode === 'advanced' ? 
                          'advanced' : 'basic',
      // Include both snake_case and camelCase versions for compatibility
      created_at: tokenData.created_at,
      updated_at: tokenData.updated_at,
      createdAt: tokenData.created_at,
      updatedAt: tokenData.updated_at
    };
    
    // Extract description from metadata if available
    if (enhancedToken.metadata && enhancedToken.metadata.description) {
      enhancedToken.description = enhancedToken.metadata.description;
    }
    
    // Fetch standard-specific data based on token standard
    const standard = mapDatabaseStandardToEnum(tokenData.standard);
    
    // Use Promise.all to fetch all standard-specific data in parallel
    try {
      await Promise.all([
        standard === TokenStandard.ERC20 ? fetchERC20Data(tokenId, enhancedToken) : Promise.resolve(),
        standard === TokenStandard.ERC721 ? fetchERC721Data(tokenId, enhancedToken) : Promise.resolve(),
        standard === TokenStandard.ERC1155 ? fetchERC1155Data(tokenId, enhancedToken) : Promise.resolve(),
        standard === TokenStandard.ERC1400 ? fetchERC1400Data(tokenId, enhancedToken) : Promise.resolve(),
        standard === TokenStandard.ERC3525 ? fetchERC3525Data(tokenId, enhancedToken) : Promise.resolve(),
        standard === TokenStandard.ERC4626 ? fetchERC4626Data(tokenId, enhancedToken) : Promise.resolve()
      ]);
      
      console.log(`[TokenDataService] Successfully fetched all data for ${standard} token`);
    } catch (standardError) {
      console.error(`[TokenDataService] Error fetching standard-specific data for ${standard}:`, standardError);
      // Continue with base token data even if standard-specific data fails
    }
    
    return enhancedToken;
  } catch (error) {
    console.error('[TokenDataService] Error in getEnhancedTokenData:', error);
    throw error;
  }
}

/**
 * Fetch ERC20 token data
 */
async function fetchERC20Data(tokenId: string, tokenData: EnhancedTokenData): Promise<void> {
  console.log(`[TokenDataService] Fetching ERC20 data for token ID: ${tokenId}`);
  
  const { data, error } = await supabase
    .from('token_erc20_properties')
    .select('*')
    .eq('token_id', tokenId)
    .maybeSingle();
  
  if (error) {
    console.error('[TokenDataService] Error fetching ERC20 properties:', error);
    return;
  }
  
  if (!data) {
    console.log('[TokenDataService] No ERC20 properties found for this token');
    return;
  }
  
  if (data) {
    console.log('[TokenDataService] Found ERC20 properties:', data);
    tokenData.erc20Properties = toCamelCase<TokenERC20Properties>(data);
    
    // Ensure boolean properties are properly set
    if (tokenData.erc20Properties) {
      tokenData.erc20Properties.isMintable = !!tokenData.erc20Properties.isMintable;
      tokenData.erc20Properties.isBurnable = !!tokenData.erc20Properties.isBurnable;
      tokenData.erc20Properties.isPausable = !!tokenData.erc20Properties.isPausable;
      tokenData.erc20Properties.allowManagement = !!tokenData.erc20Properties.allowManagement;
      tokenData.erc20Properties.permit = !!tokenData.erc20Properties.permit;
      tokenData.erc20Properties.snapshot = !!tokenData.erc20Properties.snapshot;
    }
  }
}

/**
 * Fetch ERC721 token data
 */
async function fetchERC721Data(tokenId: string, tokenData: EnhancedTokenData): Promise<void> {
  console.log(`[TokenDataService] Fetching ERC721 data for token ID: ${tokenId}`);
  
  // Fetch ERC721 properties
  const { data: properties, error: propError } = await supabase
    .from('token_erc721_properties')
    .select('*')
    .eq('token_id', tokenId)
    .maybeSingle();
  
  if (propError) {
    console.error('[TokenDataService] Error fetching ERC721 properties:', propError);
  } else if (properties) {
    console.log('[TokenDataService] Found ERC721 properties:', properties);
    tokenData.erc721Properties = toCamelCase<TokenERC721Properties>(properties);
    
    // Ensure boolean properties are properly set
    if (tokenData.erc721Properties) {
      tokenData.erc721Properties.hasRoyalty = !!tokenData.erc721Properties.hasRoyalty;
      tokenData.erc721Properties.isMintable = !!tokenData.erc721Properties.isMintable;
      tokenData.erc721Properties.isBurnable = !!tokenData.erc721Properties.isBurnable;
      tokenData.erc721Properties.isPausable = !!tokenData.erc721Properties.isPausable;
      tokenData.erc721Properties.autoIncrementIds = tokenData.erc721Properties.autoIncrementIds !== false;
      tokenData.erc721Properties.enumerable = tokenData.erc721Properties.enumerable !== false;
      tokenData.erc721Properties.updatableUris = !!tokenData.erc721Properties.updatableUris;
    }
  } else {
    console.log('[TokenDataService] No ERC721 properties found for this token');
  }
  
  // Fetch ERC721 attributes
  const { data: attributes, error: attrError } = await supabase
    .from('token_erc721_attributes')
    .select('*')
    .eq('token_id', tokenId);
  
  if (attrError) {
    console.error('[TokenDataService] Error fetching ERC721 attributes:', attrError);
  } else if (attributes && attributes.length > 0) {
    console.log(`[TokenDataService] Found ${attributes.length} ERC721 attributes`);
    tokenData.erc721Attributes = toCamelCase<TokenERC721Attribute[]>(attributes);
  } else {
    console.log('[TokenDataService] No ERC721 attributes found');
    tokenData.erc721Attributes = []; // Initialize as empty array to avoid null checks
  }
}

/**
 * Fetch ERC1155 token data
 */
async function fetchERC1155Data(tokenId: string, tokenData: EnhancedTokenData): Promise<void> {
  console.log(`[TokenDataService] Fetching ERC1155 data for token ID: ${tokenId}`);
  
  // Fetch ERC1155 properties
  const { data: properties, error: propError } = await supabase
    .from('token_erc1155_properties')
    .select('*')
    .eq('token_id', tokenId)
    .maybeSingle();
  
  if (propError) {
    console.error('[TokenDataService] Error fetching ERC1155 properties:', propError);
  } else if (properties) {
    console.log('[TokenDataService] Found ERC1155 properties:', properties);
    tokenData.erc1155Properties = toCamelCase<TokenERC1155Properties>(properties);
    
    // Ensure boolean properties are properly set
    if (tokenData.erc1155Properties) {
      tokenData.erc1155Properties.hasRoyalty = !!tokenData.erc1155Properties.hasRoyalty;
      tokenData.erc1155Properties.isBurnable = !!tokenData.erc1155Properties.isBurnable;
      tokenData.erc1155Properties.isPausable = !!tokenData.erc1155Properties.isPausable;
      tokenData.erc1155Properties.dynamicUris = !!tokenData.erc1155Properties.dynamicUris;
      tokenData.erc1155Properties.updatableUris = !!tokenData.erc1155Properties.updatableUris;
      tokenData.erc1155Properties.supplyTracking = !!tokenData.erc1155Properties.supplyTracking;
      tokenData.erc1155Properties.enableApprovalForAll = !!tokenData.erc1155Properties.enableApprovalForAll;
      tokenData.erc1155Properties.transferRestrictions = !!properties.transfer_restrictions;
    }
  } else {
    console.log('[TokenDataService] No ERC1155 properties found for this token');
  }
  
  // Fetch ERC1155 token types
  const { data: types, error: typesError } = await supabase
    .from('token_erc1155_types')
    .select('*')
    .eq('token_id', tokenId);
  
  if (typesError) {
    console.error('[TokenDataService] Error fetching ERC1155 types:', typesError);
  } else if (types && types.length > 0) {
    console.log(`[TokenDataService] Found ${types.length} ERC1155 types`);
    tokenData.erc1155Types = toCamelCase<TokenERC1155Type[]>(types);
  } else {
    console.log('[TokenDataService] No ERC1155 types found');
    tokenData.erc1155Types = []; // Initialize as empty array
  }
  
  // Fetch ERC1155 balances
  const { data: balances, error: balancesError } = await supabase
    .from('token_erc1155_balances')
    .select('*')
    .eq('token_id', tokenId);
  
  if (balancesError) {
    console.error('[TokenDataService] Error fetching ERC1155 balances:', balancesError);
  } else if (balances && balances.length > 0) {
    console.log(`[TokenDataService] Found ${balances.length} ERC1155 balances`);
    tokenData.erc1155Balances = toCamelCase<TokenERC1155Balance[]>(balances);
  } else {
    console.log('[TokenDataService] No ERC1155 balances found');
    tokenData.erc1155Balances = []; // Initialize as empty array
  }
  
  // Fetch ERC1155 URI mappings
  const { data: uriMappings, error: uriError } = await supabase
    .from('token_erc1155_uri_mappings')
    .select('*')
    .eq('token_id', tokenId);
  
  if (uriError) {
    console.error('[TokenDataService] Error fetching ERC1155 URI mappings:', uriError);
  } else if (uriMappings && uriMappings.length > 0) {
    console.log(`[TokenDataService] Found ${uriMappings.length} ERC1155 URI mappings`);
    tokenData.erc1155UriMappings = toCamelCase<TokenERC1155UriMapping[]>(uriMappings);
  } else {
    console.log('[TokenDataService] No ERC1155 URI mappings found');
    tokenData.erc1155UriMappings = []; // Initialize as empty array
  }
}

/**
 * Fetch ERC1400 token data
 */
async function fetchERC1400Data(tokenId: string, tokenData: EnhancedTokenData): Promise<void> {
  console.log(`[TokenDataService] Fetching ERC1400 data for token ID: ${tokenId}`);
  
  // Fetch ERC1400 properties
  const { data: properties, error: propError } = await supabase
    .from('token_erc1400_properties')
    .select('*')
    .eq('token_id', tokenId)
    .maybeSingle();
  
  if (propError) {
    console.error('[TokenDataService] Error fetching ERC1400 properties:', propError);
  } else if (properties) {
    console.log('[TokenDataService] Found ERC1400 properties:', properties);
    tokenData.erc1400Properties = toCamelCase<TokenERC1400Properties>(properties);
    
    // Ensure boolean properties are properly set
    if (tokenData.erc1400Properties) {
      tokenData.erc1400Properties.isMintable = !!tokenData.erc1400Properties.isMintable;
      tokenData.erc1400Properties.isBurnable = !!tokenData.erc1400Properties.isBurnable;
      tokenData.erc1400Properties.isPausable = !!tokenData.erc1400Properties.isPausable;
      tokenData.erc1400Properties.enforceKYC = !!tokenData.erc1400Properties.enforceKYC;
      tokenData.erc1400Properties.requireKyc = !!tokenData.erc1400Properties.requireKyc;
      tokenData.erc1400Properties.forcedTransfers = !!tokenData.erc1400Properties.forcedTransfers;
      tokenData.erc1400Properties.forcedRedemptionEnabled = !!tokenData.erc1400Properties.forcedRedemptionEnabled;
      tokenData.erc1400Properties.whitelistEnabled = !!tokenData.erc1400Properties.whitelistEnabled;
      tokenData.erc1400Properties.investorAccreditation = !!tokenData.erc1400Properties.investorAccreditation;
      tokenData.erc1400Properties.autoCompliance = !!tokenData.erc1400Properties.autoCompliance;
      tokenData.erc1400Properties.manualApprovals = !!tokenData.erc1400Properties.manualApprovals;
      tokenData.erc1400Properties.granularControl = !!tokenData.erc1400Properties.granularControl;
      tokenData.erc1400Properties.dividendDistribution = !!tokenData.erc1400Properties.dividendDistribution;
      tokenData.erc1400Properties.corporateActions = !!tokenData.erc1400Properties.corporateActions;
      tokenData.erc1400Properties.issuanceModules = !!tokenData.erc1400Properties.issuanceModules;
      tokenData.erc1400Properties.recoveryMechanism = !!tokenData.erc1400Properties.recoveryMechanism;
      tokenData.erc1400Properties.isMultiClass = tokenData.erc1400Properties.securityType === 'multi_class';
      tokenData.erc1400Properties.isIssuable = !!tokenData.erc1400Properties.isMintable;
      
      // Ensure complex objects are properly formatted
      if (properties.transfer_restrictions) {
        tokenData.erc1400Properties.transferRestrictions = properties.transfer_restrictions as Record<string, any>;
      }
      
      if (properties.kyc_settings) {
        tokenData.erc1400Properties.kycSettings = properties.kyc_settings as Record<string, any>;
      }
      
      if (properties.compliance_settings) {
        tokenData.erc1400Properties.complianceSettings = properties.compliance_settings as Record<string, any>;
      }
    }
  } else {
    console.log('[TokenDataService] No ERC1400 properties found for this token');
  }
  
  // Fetch ERC1400 partitions
  const { data: partitions, error: partError } = await supabase
    .from('token_erc1400_partitions')
    .select('*')
    .eq('token_id', tokenId);
  
  if (partError) {
    console.error('[TokenDataService] Error fetching ERC1400 partitions:', partError);
  } else if (partitions && partitions.length > 0) {
    console.log(`[TokenDataService] Found ${partitions.length} ERC1400 partitions`);
    tokenData.erc1400Partitions = toCamelCase<TokenERC1400Partition[]>(partitions);
    
    // Ensure boolean properties are properly set
    if (tokenData.erc1400Partitions) {
      tokenData.erc1400Partitions.forEach(partition => {
        partition.isLockable = !!partition.isLockable;
      });
    }
  } else {
    console.log('[TokenDataService] No ERC1400 partitions found');
    tokenData.erc1400Partitions = []; // Initialize as empty array
  }
  
  // Fetch ERC1400 controllers
  const { data: controllers, error: ctrlError } = await supabase
    .from('token_erc1400_controllers')
    .select('*')
    .eq('token_id', tokenId);
  
  if (ctrlError) {
    console.error('[TokenDataService] Error fetching ERC1400 controllers:', ctrlError);
  } else if (controllers && controllers.length > 0) {
    console.log(`[TokenDataService] Found ${controllers.length} ERC1400 controllers`);
    tokenData.erc1400Controllers = toCamelCase<TokenERC1400Controller[]>(controllers);
    
    // Ensure permissions array is properly formatted
    if (tokenData.erc1400Controllers) {
      tokenData.erc1400Controllers.forEach(controller => {
        if (!controller.permissions || !Array.isArray(controller.permissions)) {
          controller.permissions = ["ADMIN"]; // Default permission
        }
      });
    }
  } else {
    console.log('[TokenDataService] No ERC1400 controllers found');
    tokenData.erc1400Controllers = []; // Initialize as empty array
  }
}

/**
 * Fetch ERC3525 token data
 */
async function fetchERC3525Data(tokenId: string, tokenData: EnhancedTokenData): Promise<void> {
  console.log(`[TokenDataService] Fetching ERC3525 data for token ID: ${tokenId}`);
  
  // Fetch ERC3525 properties
  const { data: properties, error: propError } = await supabase
    .from('token_erc3525_properties')
    .select('*')
    .eq('token_id', tokenId)
    .maybeSingle();
  
  if (propError) {
    console.error('[TokenDataService] Error fetching ERC3525 properties:', propError);
  } else if (properties) {
    console.log('[TokenDataService] Found ERC3525 properties:', properties);
    tokenData.erc3525Properties = toCamelCase<TokenERC3525Properties>(properties);
    
    // Ensure boolean properties are properly set
    if (tokenData.erc3525Properties) {
      tokenData.erc3525Properties.hasRoyalty = !!tokenData.erc3525Properties.hasRoyalty;
      tokenData.erc3525Properties.isBurnable = !!tokenData.erc3525Properties.isBurnable;
      tokenData.erc3525Properties.isPausable = !!tokenData.erc3525Properties.isPausable;
      tokenData.erc3525Properties.isMintable = !!tokenData.erc3525Properties.isMintable;
      tokenData.erc3525Properties.dynamicMetadata = !!tokenData.erc3525Properties.dynamicMetadata;
      tokenData.erc3525Properties.updatableUris = !!tokenData.erc3525Properties.updatableUris;
      tokenData.erc3525Properties.allowsSlotEnumeration = !!tokenData.erc3525Properties.allowsSlotEnumeration;
      tokenData.erc3525Properties.slotTransferability = !!tokenData.erc3525Properties.slotTransferability;
      tokenData.erc3525Properties.supportsEnumeration = !!tokenData.erc3525Properties.supportsEnumeration;
      tokenData.erc3525Properties.fractionalTransfers = !!tokenData.erc3525Properties.fractionalTransfers;
      tokenData.erc3525Properties.supportsApprovalForAll = !!tokenData.erc3525Properties.supportsApprovalForAll;
      tokenData.erc3525Properties.valueTransfersEnabled = !!tokenData.erc3525Properties.valueTransfersEnabled;
      tokenData.erc3525Properties.updatableValues = !!tokenData.erc3525Properties.updatableValues;
      tokenData.erc3525Properties.supplyTracking = !!tokenData.erc3525Properties.supplyTracking;
      tokenData.erc3525Properties.permissioningEnabled = !!tokenData.erc3525Properties.permissioningEnabled;
      tokenData.erc3525Properties.valueAggregation = !!tokenData.erc3525Properties.valueAggregation;
      tokenData.erc3525Properties.slotApprovals = !!tokenData.erc3525Properties.slotApprovals;
    }
  } else {
    console.log('[TokenDataService] No ERC3525 properties found for this token');
  }
  
  // Fetch ERC3525 slots
  const { data: slots, error: slotError } = await supabase
    .from('token_erc3525_slots')
    .select('*')
    .eq('token_id', tokenId);
  
  if (slotError) {
    console.error('[TokenDataService] Error fetching ERC3525 slots:', slotError);
  } else if (slots && slots.length > 0) {
    console.log(`[TokenDataService] Found ${slots.length} ERC3525 slots`);
    tokenData.erc3525Slots = toCamelCase<TokenERC3525Slot[]>(slots);
  } else {
    console.log('[TokenDataService] No ERC3525 slots found');
    tokenData.erc3525Slots = []; // Initialize as empty array
  }
  
  // Fetch ERC3525 allocations
  const { data: allocations, error: allocError } = await supabase
    .from('token_erc3525_allocations')
    .select('*')
    .eq('token_id', tokenId);
  
  if (allocError) {
    console.error('[TokenDataService] Error fetching ERC3525 allocations:', allocError);
  } else if (allocations && allocations.length > 0) {
    console.log(`[TokenDataService] Found ${allocations.length} ERC3525 allocations`);
    tokenData.erc3525Allocations = toCamelCase<TokenERC3525Allocation[]>(allocations);
  } else {
    console.log('[TokenDataService] No ERC3525 allocations found');
    tokenData.erc3525Allocations = []; // Initialize as empty array
  }
}

/**
 * Fetch ERC4626 token data
 */
async function fetchERC4626Data(tokenId: string, tokenData: EnhancedTokenData): Promise<void> {
  console.log(`[TokenDataService] Fetching ERC4626 data for token ID: ${tokenId}`);
  
  // Fetch ERC4626 properties
  const { data: properties, error: propError } = await supabase
    .from('token_erc4626_properties')
    .select('*')
    .eq('token_id', tokenId)
    .maybeSingle();
  
  if (propError) {
    console.error('[TokenDataService] Error fetching ERC4626 properties:', propError);
  } else if (properties) {
    console.log('[TokenDataService] Found ERC4626 properties:', properties);
    tokenData.erc4626Properties = toCamelCase<TokenERC4626Properties>(properties);
    
    // Ensure boolean properties are properly set
    if (tokenData.erc4626Properties) {
      tokenData.erc4626Properties.isMintable = !!tokenData.erc4626Properties.isMintable;
      tokenData.erc4626Properties.isBurnable = !!tokenData.erc4626Properties.isBurnable;
      tokenData.erc4626Properties.isPausable = !!tokenData.erc4626Properties.isPausable;
      tokenData.erc4626Properties.enableFees = !!tokenData.erc4626Properties.enableFees;
      tokenData.erc4626Properties.depositFee = !!tokenData.erc4626Properties.depositFee;
      tokenData.erc4626Properties.withdrawalFee = !!tokenData.erc4626Properties.withdrawalFee;
      tokenData.erc4626Properties.performanceFee = !!tokenData.erc4626Properties.performanceFee;
      tokenData.erc4626Properties.compoundIntegration = !!tokenData.erc4626Properties.compoundIntegration;
      tokenData.erc4626Properties.aaveIntegration = !!tokenData.erc4626Properties.aaveIntegration;
      tokenData.erc4626Properties.uniswapIntegration = !!tokenData.erc4626Properties.uniswapIntegration;
      tokenData.erc4626Properties.curveIntegration = !!tokenData.erc4626Properties.curveIntegration;
      tokenData.erc4626Properties.enableAllowlist = !!tokenData.erc4626Properties.enableAllowlist;
      tokenData.erc4626Properties.customHooks = !!tokenData.erc4626Properties.customHooks;
      tokenData.erc4626Properties.autoReporting = !!tokenData.erc4626Properties.autoReporting;
      tokenData.erc4626Properties.previewFunctions = !!tokenData.erc4626Properties.previewFunctions;
      tokenData.erc4626Properties.limitFunctions = !!tokenData.erc4626Properties.limitFunctions;
      
      // Add form compatibility properties
      tokenData.erc4626Properties.hasDepositFee = !!tokenData.erc4626Properties.depositFee;
      tokenData.erc4626Properties.hasWithdrawalFee = !!tokenData.erc4626Properties.withdrawalFee;
      tokenData.erc4626Properties.hasPerformanceFee = !!tokenData.erc4626Properties.performanceFee;
      tokenData.erc4626Properties.hasCustomStrategy = !!tokenData.erc4626Properties.hasCustomStrategy;
    }
  } else {
    console.log('[TokenDataService] No ERC4626 properties found for this token');
  }
  
  // Fetch ERC4626 strategy parameters
  const { data: strategyParams, error: stratError } = await supabase
    .from('token_erc4626_strategy_params')
    .select('*')
    .eq('token_id', tokenId);
  
  if (stratError) {
    console.error('[TokenDataService] Error fetching ERC4626 strategy parameters:', stratError);
  } else if (strategyParams && strategyParams.length > 0) {
    console.log(`[TokenDataService] Found ${strategyParams.length} ERC4626 strategy parameters`);
    tokenData.erc4626StrategyParams = toCamelCase<TokenERC4626StrategyParam[]>(strategyParams);
  } else {
    console.log('[TokenDataService] No ERC4626 strategy parameters found');
    tokenData.erc4626StrategyParams = []; // Initialize as empty array
  }
  
  // Fetch ERC4626 asset allocations
  const { data: assetAllocations, error: allocError } = await supabase
    .from('token_erc4626_asset_allocations')
    .select('*')
    .eq('token_id', tokenId);
  
  if (allocError) {
    console.error('[TokenDataService] Error fetching ERC4626 asset allocations:', allocError);
  } else if (assetAllocations && assetAllocations.length > 0) {
    console.log(`[TokenDataService] Found ${assetAllocations.length} ERC4626 asset allocations`);
    tokenData.erc4626AssetAllocations = toCamelCase<TokenERC4626AssetAllocation[]>(assetAllocations);
  } else {
    console.log('[TokenDataService] No ERC4626 asset allocations found');
    tokenData.erc4626AssetAllocations = []; // Initialize as empty array
  }
}

/**
 * Update token standard-specific data
 * @param tokenId The token ID
 * @param data The token data to update
 */
export async function updateTokenStandardData(tokenId: string, standard: TokenStandard, data: any): Promise<void> {
  try {
    switch (standard) {
      case TokenStandard.ERC20:
        await updateERC20Data(tokenId, data);
        break;
      case TokenStandard.ERC721:
        await updateERC721Data(tokenId, data);
        break;
      case TokenStandard.ERC1155:
        await updateERC1155Data(tokenId, data);
        break;
      case TokenStandard.ERC1400:
        await updateERC1400Data(tokenId, data);
        break;
      case TokenStandard.ERC3525:
        await updateERC3525Data(tokenId, data);
        break;
      case TokenStandard.ERC4626:
        await updateERC4626Data(tokenId, data);
        break;
    }
  } catch (error) {
    console.error(`Error updating ${standard} data:`, error);
    throw error;
  }
}

/**
 * Update ERC20 token data
 */
async function updateERC20Data(tokenId: string, data: Partial<TokenERC20Properties>): Promise<void> {
  const { error } = await supabase
    .from('token_erc20_properties')
    .upsert({
      ...data,
      token_id: tokenId,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    throw new Error(`Error updating ERC20 properties: ${error.message}`);
  }
}

/**
 * Update ERC721 token data
 */
async function updateERC721Data(tokenId: string, data: any): Promise<void> {
  // Update properties
  if (data.properties) {
    const { error } = await supabase
      .from('token_erc721_properties')
      .upsert({
        ...data.properties,
        token_id: tokenId,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      throw new Error(`Error updating ERC721 properties: ${error.message}`);
    }
  }
  
  // Update attributes
  if (data.attributes && Array.isArray(data.attributes)) {
    // First, delete existing attributes
    const { error: deleteError } = await supabase
      .from('token_erc721_attributes')
      .delete()
      .eq('token_id', tokenId);
    
    if (deleteError) {
      throw new Error(`Error deleting existing ERC721 attributes: ${deleteError.message}`);
    }
    
    // Then insert new attributes
    if (data.attributes.length > 0) {
      const attributesWithTokenId = data.attributes.map((attr: any) => ({
        ...attr,
        token_id: tokenId
      }));
      
      const { error: insertError } = await supabase
        .from('token_erc721_attributes')
        .insert(attributesWithTokenId);
      
      if (insertError) {
        throw new Error(`Error inserting ERC721 attributes: ${insertError.message}`);
      }
    }
  }
}

/**
 * Update ERC1155 token data
 */
async function updateERC1155Data(tokenId: string, data: any): Promise<void> {
  // Update properties
  if (data.properties) {
    // Convert camelCase properties to snake_case for database
    const dbProperties = {
      token_id: tokenId,
      base_uri: data.properties.baseUri,
      metadata_storage: data.properties.metadataStorage,
      has_royalty: data.properties.hasRoyalty,
      royalty_percentage: data.properties.royaltyPercentage,
      royalty_receiver: data.properties.royaltyReceiver,
      is_burnable: data.properties.isBurnable,
      is_pausable: data.properties.isPausable,
      access_control: data.properties.accessControl,
      updatable_uris: data.properties.updatableUris,
      supply_tracking: data.properties.supplyTracking,
      enable_approval_for_all: data.properties.enableApprovalForAll,
      sales_config: data.properties.salesConfig,
      whitelist_config: data.properties.whitelistConfig,
      batch_transfer_limits: data.properties.batchTransferLimits,
      dynamic_uri_config: data.properties.dynamicUris ? {} : null,
      batch_minting_config: data.properties.batchMinting ? {} : null,
      container_config: data.properties.containerEnabled ? {} : null,
      transfer_restrictions: data.properties.transferRestrictions ? {} : null,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('token_erc1155_properties')
      .upsert(dbProperties);
    
    if (error) {
      throw new Error(`Error updating ERC1155 properties: ${error.message}`);
    }
  }
  
  // Update token types
  if (data.types && Array.isArray(data.types)) {
    // For types, we'll use upsert with the token_type_id as the key
    for (const type of data.types) {
      const { error } = await supabase
        .from('token_erc1155_types')
        .upsert({
          ...type,
          token_id: tokenId
        });
      
      if (error) {
        throw new Error(`Error upserting ERC1155 type: ${error.message}`);
      }
    }
    
    // Handle deletes if needed (not implemented here)
  }
  
  // Update balances
  if (data.balances && Array.isArray(data.balances)) {
    for (const balance of data.balances) {
      const { error } = await supabase
        .from('token_erc1155_balances')
        .upsert({
          ...balance,
          token_id: tokenId
        });
      
      if (error) {
        throw new Error(`Error upserting ERC1155 balance: ${error.message}`);
      }
    }
  }
  
  // Update URI mappings
  if (data.uriMappings && Array.isArray(data.uriMappings)) {
    for (const mapping of data.uriMappings) {
      const { error } = await supabase
        .from('token_erc1155_uri_mappings')
        .upsert({
          ...mapping,
          token_id: tokenId
        });
      
      if (error) {
        throw new Error(`Error upserting ERC1155 URI mapping: ${error.message}`);
      }
    }
  }
}

/**
 * Update ERC1400 token data
 */
async function updateERC1400Data(tokenId: string, data: any): Promise<void> {
  // Update properties
  if (data.properties) {
    // Convert camelCase properties to snake_case for database
    const dbProperties = {
      token_id: tokenId,
      initial_supply: data.properties.initialSupply,
      cap: data.properties.cap,
      is_mintable: data.properties.isMintable,
      is_burnable: data.properties.isBurnable,
      is_pausable: data.properties.isPausable,
      document_uri: data.properties.documentUri,
      document_hash: data.properties.documentHash,
      controller_address: data.properties.controllerAddress,
      require_kyc: data.properties.requireKyc,
      security_type: data.properties.isMultiClass ? 'multi_class' : data.properties.securityType,
      issuing_jurisdiction: data.properties.issuingJurisdiction,
      issuing_entity_name: data.properties.issuingEntityName,
      issuing_entity_lei: data.properties.issuingEntityLei,
      transfer_restrictions: data.properties.transferRestrictions || null,
      kyc_settings: data.properties.kycSettings || null,
      compliance_settings: data.properties.complianceSettings || null,
      forced_transfers: data.properties.forcedTransfers,
      issuance_modules: data.properties.issuanceModules,
      document_management: data.properties.documentManagement,
      recovery_mechanism: data.properties.recoveryMechanism,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('token_erc1400_properties')
      .upsert(dbProperties);
    
    if (error) {
      throw new Error(`Error updating ERC1400 properties: ${error.message}`);
    }
  }
  
  // Update partitions
  if (data.partitions && Array.isArray(data.partitions)) {
    // For partitions, we'll use upsert with the partition_id as the key
    for (const partition of data.partitions) {
      // Ensure partition_id is set
      if (!partition.partitionId && partition.name) {
        partition.partitionId = partition.name.toLowerCase().replace(/\s+/g, '_');
      }
      
      const { error } = await supabase
        .from('token_erc1400_partitions')
        .upsert({
          token_id: tokenId,
          name: partition.name,
          partition_id: partition.partitionId,
          metadata: partition.metadata || {}
        });
      
      if (error) {
        throw new Error(`Error upserting ERC1400 partition: ${error.message}`);
      }
    }
  }
  
  // Update controllers
  if (data.controllers && Array.isArray(data.controllers)) {
    // First delete existing controllers
    const { error: deleteError } = await supabase
      .from('token_erc1400_controllers')
      .delete()
      .eq('token_id', tokenId);
    
    if (deleteError) {
      throw new Error(`Error deleting existing ERC1400 controllers: ${deleteError.message}`);
    }
    
    // Then insert new controllers
    if (data.controllers.length > 0) {
      const controllersWithTokenId = data.controllers.map((ctrl: any) => ({
        token_id: tokenId,
        address: ctrl.address,
        permissions: Array.isArray(ctrl.permissions) ? ctrl.permissions : ["ADMIN"]
      }));
      
      const { error: insertError } = await supabase
        .from('token_erc1400_controllers')
        .insert(controllersWithTokenId);
      
      if (insertError) {
        throw new Error(`Error inserting ERC1400 controllers: ${insertError.message}`);
      }
    }
  }
}

/**
 * Update ERC3525 token data
 */
async function updateERC3525Data(tokenId: string, data: any): Promise<void> {
  // Update properties
  if (data.properties) {
    const { error } = await supabase
      .from('token_erc3525_properties')
      .upsert({
        ...data.properties,
        token_id: tokenId,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      throw new Error(`Error updating ERC3525 properties: ${error.message}`);
    }
  }
  
  // Update slots
  if (data.slots && Array.isArray(data.slots)) {
    // For slots, we'll use upsert with the slot_id as the key
    for (const slot of data.slots) {
      const { error } = await supabase
        .from('token_erc3525_slots')
        .upsert({
          ...slot,
          token_id: tokenId
        });
      
      if (error) {
        throw new Error(`Error upserting ERC3525 slot: ${error.message}`);
      }
    }
  }
  
  // Update allocations
  if (data.allocations && Array.isArray(data.allocations)) {
    // For allocations, we'll just delete and re-insert
    const { error: deleteError } = await supabase
      .from('token_erc3525_allocations')
      .delete()
      .eq('token_id', tokenId);
    
    if (deleteError) {
      throw new Error(`Error deleting existing ERC3525 allocations: ${deleteError.message}`);
    }
    
    if (data.allocations.length > 0) {
      const allocationsWithTokenId = data.allocations.map((alloc: any) => ({
        ...alloc,
        token_id: tokenId
      }));
      
      const { error: insertError } = await supabase
        .from('token_erc3525_allocations')
        .insert(allocationsWithTokenId);
      
      if (insertError) {
        throw new Error(`Error inserting ERC3525 allocations: ${insertError.message}`);
      }
    }
  }
}

/**
 * Update ERC4626 token data
 */
async function updateERC4626Data(tokenId: string, data: any): Promise<void> {
  // Update properties
  if (data.properties) {
    const { error } = await supabase
      .from('token_erc4626_properties')
      .upsert({
        ...data.properties,
        token_id: tokenId,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      throw new Error(`Error updating ERC4626 properties: ${error.message}`);
    }
  }
  
  // Update strategy parameters
  if (data.strategyParams && Array.isArray(data.strategyParams)) {
    // First delete existing parameters
    const { error: deleteError } = await supabase
      .from('token_erc4626_strategy_params')
      .delete()
      .eq('token_id', tokenId);
    
    if (deleteError) {
      throw new Error(`Error deleting existing ERC4626 strategy parameters: ${deleteError.message}`);
    }
    
    if (data.strategyParams.length > 0) {
      const paramsWithTokenId = data.strategyParams.map((param: any) => ({
        ...param,
        token_id: tokenId
      }));
      
      const { error: insertError } = await supabase
        .from('token_erc4626_strategy_params')
        .insert(paramsWithTokenId);
      
      if (insertError) {
        throw new Error(`Error inserting ERC4626 strategy parameters: ${insertError.message}`);
      }
    }
  }
  
  // Update asset allocations
  if (data.assetAllocations && Array.isArray(data.assetAllocations)) {
    // For asset allocations, we'll use the asset_address as the key
    for (const allocation of data.assetAllocations) {
      const { error } = await supabase
        .from('token_erc4626_asset_allocations')
        .upsert({
          ...allocation,
          token_id: tokenId
        });
      
      if (error) {
        throw new Error(`Error upserting ERC4626 asset allocation: ${error.message}`);
      }
    }
  }
}
