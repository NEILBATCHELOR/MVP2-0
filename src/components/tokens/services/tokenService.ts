/**
 * Token Service - API functions for token operations
 */
import { supabase } from '@/infrastructure/database/client';
import {
  TokenFormData,
  TokenOperationParams,
  TokenDeploymentConfig,
  TokenDeploymentResult
} from '../types';
import { TokenInsert, TokenUpdate } from '@/types/core/database';
import { validateTokenData } from './tokenDataValidation';

/**
 * Create a new token with comprehensive logging and database validation
 */
export async function createToken(projectId: string, tokenData: Partial<TokenFormData>) {
  console.log('[TokenService] Creating token with data:', JSON.stringify(tokenData, null, 2));
  
  // Validate token data before proceeding
  const validation = validateTokenData(tokenData);
  if (!validation.valid) {
    console.error('[TokenService] Token validation failed:', validation.errors);
    throw new Error(`Token validation failed: ${validation.errors.map(e => `${e.field} - ${e.message}`).join(', ')}`);
  }
  
  // Extract standard fields vs. token standard-specific fields
  const { 
    name, 
    symbol, 
    description, 
    decimals, 
    standard, 
    blocks = {},
    metadata = {},
    totalSupply,
    configOptions,
    standardProperties, // Direct standard properties
    standardArrays,     // Direct array data
    status = 'DRAFT',   // Default status
    ...standardSpecificFields 
  } = tokenData;

  // If data was processed by TokenMapperFactory, it's already in the right format
  // If not, process standardSpecificFields to move them to blocks
  const processedBlocks = blocks && Object.keys(blocks).length > 0 
    ? blocks 
    : {
        ...blocks,
        ...processStandardSpecificFields(standardSpecificFields, standard)
      };

  console.log('[TokenService] Processed blocks:', JSON.stringify(processedBlocks, null, 2));

  // Format token data for database
  // Always set config_mode for DB
  const configModeValue: 'min' | 'max' | 'basic' | 'advanced' =
    (typeof tokenData.config_mode === 'string' && ['min','max','basic','advanced'].includes(tokenData.config_mode))
      ? tokenData.config_mode as 'min' | 'max' | 'basic' | 'advanced'
      : (tokenData.advancedMode ? 'max' : 'min');

  const tokenRecord = {
    project_id: projectId,
    name: name || 'New Token',
    symbol: symbol || 'TOKEN',
    standard: standard || 'ERC20',
    decimals: decimals || 18,
    total_supply: totalSupply?.toString() || '',
    blocks: processedBlocks,
    status, // Add status field
    config_mode: configModeValue,
    metadata: {
      ...(typeof metadata === 'object' ? metadata : {}),
      configOptions,
      description, // Store description in metadata
      availableFeatures: Object.keys(standardSpecificFields) // Store available features for validation
    }
  };

  // Set total_supply equal to cap when cap is greater than 0
  if (processedBlocks.cap && parseFloat(processedBlocks.cap) > 0) {
    tokenRecord.total_supply = processedBlocks.cap;
  }

  // Create token creation log container
  const creationResults: Record<string, any> = {
    mainToken: { status: 'pending' },
    standardProperties: { status: 'pending' },
    arrayData: {}
  };

  try {
    // 1. First, verify the standard-specific tables exist
    const standardTable = getStandardSpecificTable(standard);
    if (standardTable) {
      const { count, error: tableCheckError } = await supabase
        .from(standardTable as any) // Use type assertion
        .select('*', { count: 'exact', head: true });
      
      if (tableCheckError) {
        console.warn(`[TokenService] Token standard table ${standardTable} check failed:`, tableCheckError);
        creationResults.tableChecks = { success: false, error: tableCheckError.message };
      } else {
        console.log(`[TokenService] Token standard table ${standardTable} exists`);
        creationResults.tableChecks = { success: true };
      }
    }

    // 2. Insert main token record
    const { data: tokenData, error: tokenError } = await supabase
    .from('tokens')
    .insert({
      ...tokenRecord,
      standard: tokenRecord.standard as "ERC-20" | "ERC-721" | "ERC-1155" | "ERC-1400" | "ERC-3525" | "ERC-4626"
    })
    .select()
    .single();

    if (tokenError) {
      console.error('[TokenService] Failed to create token:', tokenError);
      creationResults.mainToken = { status: 'failed', error: tokenError.message };
      throw new Error(`Failed to create main token record: ${tokenError.message}`);
    }

    creationResults.mainToken = { status: 'success', id: tokenData.id };
    console.log('[TokenService] Main token record created:', tokenData.id);

    // 3. Now insert standard-specific records if token created successfully
    if (standard && tokenData.id) {
      try {
        let standardResults;
        
        // If direct standardProperties were provided, use them
        if (standardProperties) {
          console.log('[TokenService] Using provided standard properties:', standardProperties);
          standardResults = await createStandardPropertiesFromDirect(
            standard, 
            tokenData.id, 
            standardProperties
          );
        } else {
          // Otherwise create from processed blocks
          console.log('[TokenService] Creating standard properties from blocks');
          standardResults = await createStandardSpecificRecords(
            standard, 
            tokenData.id, 
            processedBlocks
          );
        }
        
        creationResults.standardProperties = { status: 'success', ...standardResults };
        
        // 4. Handle array data
        let arrayResults = {};
        
        // If standard arrays were provided directly, use them
        if (standardArrays && Object.keys(standardArrays).length > 0) {
          console.log('[TokenService] Using provided standard arrays:', standardArrays);
          arrayResults = await createStandardArraysFromDirect(
            standard,
            tokenData.id,
            standardArrays
          );
        } 
        // Otherwise, extract array data from blocks if available
        else if (processedBlocks) {
          console.log('[TokenService] Extracting array data from blocks');
          const extractedArrays = extractArraysFromBlocks(standard, processedBlocks);
          if (Object.keys(extractedArrays).length > 0) {
            arrayResults = await createStandardArraysFromDirect(
              standard,
              tokenData.id,
              extractedArrays
            );
          }
        }
        
        creationResults.arrayData = { ...arrayResults };
        
        // Log success of standard-specific insertions
        console.log(`[TokenService] ${standard} properties created successfully:`, standardResults);
      } catch (standardError: any) {
        console.error(`[TokenService] Failed to create ${standard} properties:`, standardError);
        creationResults.standardProperties = { status: 'failed', error: standardError.message };
      }
    }

    // 5. Return the created token with full creation logs
    return {
      ...tokenData,
      standardInsertionResults: creationResults
    };
  } catch (error: any) {
    console.error('[TokenService] Token creation failed:', error);
    throw new Error(`Token creation failed: ${error.message}`);
  }
}

/**
 * Get the table name for a specific token standard
 */
function getStandardSpecificTable(standard?: string): string | null {
  if (!standard) return null;
  
  const standardsMap: Record<string, string> = {
    'ERC-20': 'token_erc20_properties',
    'ERC-721': 'token_erc721_properties',
    'ERC-1155': 'token_erc1155_properties',
    'ERC-1400': 'token_erc1400_properties',
    'ERC-3525': 'token_erc3525_properties',
    'ERC-4626': 'token_erc4626_properties'
  };
  
  return standardsMap[standard] || null;
}

/**
 * Create standard-specific records based on token standard
 */
async function createStandardSpecificRecords(
  standard: string,
  tokenId: string,
  blocks: Record<string, any>
): Promise<Record<string, any>> {
  const results: Record<string, any> = {
    mainProperties: { status: 'pending' },
    arrayData: {}
  };
  
  try {
    const standardTable = getStandardSpecificTable(standard);
    if (!standardTable) {
      return { 
        status: 'failed', 
        error: `Unsupported token standard: ${standard}` 
      };
    }

    console.log(`[TokenService] Creating ${standard} records for token ${tokenId}`);
    
    // 1. Check if a token property record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from(standardTable as any)
      .select('*')
      .eq('token_id', tokenId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error if no record
      
    const recordExists = existingRecord !== null;
    
    // 2. Create main properties record
    const propertyRecord = createStandardPropertiesRecord(standard, tokenId, blocks);
    console.log(`[TokenService] ${recordExists ? 'Updating' : 'Inserting'} ${standardTable} record:`, JSON.stringify(propertyRecord, null, 2));
    
    let propertiesData;
    let propertiesError;
    
    // If the record exists, update it; otherwise, insert a new one
    if (recordExists) {
      const result = await supabase
        .from(standardTable as any)
        .update(propertyRecord)
        .eq('token_id', tokenId)
        .select()
        .single();
      
      propertiesData = result.data;
      propertiesError = result.error;
    } else {
      const result = await supabase
        .from(standardTable as any)
        .insert(propertyRecord)
        .select()
        .single();
      
      propertiesData = result.data;
      propertiesError = result.error;
    }
    
    if (propertiesError) {
      console.error(`[TokenService] Failed to ${recordExists ? 'update' : 'insert'} ${standardTable} record:`, propertiesError);
      results.mainProperties = { status: 'failed', error: propertiesError.message };
    } else {
      console.log(`[TokenService] ${recordExists ? 'Updated' : 'Inserted'} ${standardTable} record:`, propertiesData);
      results.mainProperties = { status: 'success', data: propertiesData };
    }
    
    // 3. Now handle any array/related data based on token standard
    switch(standard) {
      case 'ERC-721':
        await handleERC721Attributes(tokenId, blocks, results);
        break;
      case 'ERC-1155':
        await handleERC1155TokenTypes(tokenId, blocks, results);
        break;
      case 'ERC-1400':
        await handleERC1400Partitions(tokenId, blocks, results);
        await handleERC1400Controllers(tokenId, blocks, results);
        break;
      case 'ERC-3525':
        await handleERC3525Slots(tokenId, blocks, results);
        break;
      case 'ERC-4626':
        await handleERC4626Strategy(tokenId, blocks, results);
        await handleERC4626AssetAllocations(tokenId, blocks, results);
        break;
    }
    
    return results;
  } catch (error: any) {
    console.error('[TokenService] Failed to create standard-specific records:', error);
    return { 
      status: 'failed', 
      error: error.message,
      mainProperties: results.mainProperties,
      arrayData: results.arrayData
    };
  }
}

/**
 * Create a property record for the standard-specific table
 */
function createStandardPropertiesRecord(standard: string, tokenId: string, blocks: Record<string, any>): Record<string, any> {
  const baseRecord = { token_id: tokenId };
  
  switch(standard) {
    case 'ERC-20':
      // Enhanced feeOnTransfer handling
      let feeOnTransferValue = null;
      if (blocks.fee_on_transfer || blocks.feeOnTransfer) {
        const feeData = blocks.fee_on_transfer || blocks.feeOnTransfer;
        feeOnTransferValue = {
          enabled: !!feeData.enabled,
          fee: feeData.fee || "0",
          feeType: feeData.feeType || "percentage",
          // Only set recipient if it's a valid non-empty address
          recipient: feeData.recipient && feeData.recipient !== "" && feeData.recipient !== "0x0000000000000000000000000000000000000000"
            ? feeData.recipient
            : null
        };
      }
      
      return {
        ...baseRecord,
        initial_supply: blocks.initial_supply || blocks.initialSupply,
        cap: blocks.cap,
        is_mintable: blocks.is_mintable || blocks.isMintable || false,
        is_burnable: blocks.is_burnable || blocks.isBurnable || false,
        is_pausable: blocks.is_pausable || blocks.isPausable || false,
        token_type: blocks.token_type || blocks.tokenType || 'utility',
        
        // JSONB configurations
        transfer_config: blocks.transferConfig || blocks.transfer_config,
        gas_config: blocks.gasConfig || blocks.gas_config,
        compliance_config: blocks.complianceConfig || blocks.compliance_config,
        whitelist_config: blocks.whitelistConfig || blocks.whitelist_config,
        access_control: blocks.access_control || blocks.accessControl || 'ownable',
        allow_management: blocks.allow_management || blocks.allowanceManagement || false,
        permit: blocks.permit || false,
        snapshot: blocks.snapshot || false,
        fee_on_transfer: feeOnTransferValue, // Use processed value
        rebasing: blocks.rebasing,
        governance_features: blocks.governance_features || blocks.governanceFeatures
      };
      
    case 'ERC-721':
      return {
        ...baseRecord,
        base_uri: blocks.base_uri || blocks.baseUri,
        metadata_storage: blocks.metadata_storage || blocks.metadataStorage || 'ipfs',
        max_supply: blocks.max_supply || blocks.maxSupply,
        has_royalty: blocks.has_royalty || blocks.hasRoyalty || false,
        royalty_percentage: blocks.royalty_percentage || blocks.royaltyPercentage,
        royalty_receiver: blocks.royalty_receiver || blocks.royaltyReceiver,
        is_burnable: blocks.is_burnable || blocks.isBurnable || false,
        is_pausable: blocks.is_pausable || blocks.isPausable || false,
        is_mintable: blocks.isMintable ?? blocks.is_mintable ?? true, // FIX: Add missing mintable field
        asset_type: blocks.asset_type || blocks.assetType || 'unique_asset',
        minting_method: blocks.minting_method || blocks.mintingMethod || 'open',
        auto_increment_ids: blocks.auto_increment_ids ?? blocks.autoIncrementIds ?? true,
        enumerable: blocks.enumerable ?? true,
        uri_storage: blocks.uri_storage || blocks.uriStorage || 'tokenId',
        access_control: blocks.access_control || blocks.accessControl || 'ownable',
        updatable_uris: blocks.updatable_uris || blocks.updatableUris || false,
        
        // JSONB configurations
        sales_config: blocks.salesConfig || blocks.sales_config,
        whitelist_config: blocks.whitelistConfig || blocks.whitelist_config,
        permission_config: blocks.permissionConfig || blocks.permission_config,
        dynamic_uri_config: blocks.dynamicUriConfig || blocks.dynamic_uri_config,
        batch_minting_config: blocks.batchMintingConfig || blocks.batch_minting_config,
        transfer_restrictions: blocks.transferRestrictions || blocks.transfer_restrictions
      };
      
    case 'ERC-1155':
      return {
        ...baseRecord,
        base_uri: blocks.base_uri || blocks.baseUri,
        metadata_storage: blocks.metadata_storage || blocks.metadataStorage || 'ipfs',
        has_royalty: blocks.has_royalty || blocks.hasRoyalty || false,
        royalty_percentage: blocks.royalty_percentage || blocks.royaltyPercentage,
        royalty_receiver: blocks.royalty_receiver || blocks.royaltyReceiver,
        is_burnable: blocks.is_burnable || blocks.isBurnable || false,
        is_pausable: blocks.is_pausable || blocks.isPausable || false,
        access_control: blocks.access_control || blocks.accessControl || 'ownable',
        updatable_uris: blocks.updatable_uris || blocks.updatableUris || false,
        supply_tracking: blocks.supply_tracking || blocks.supplyTracking || true,
        enable_approval_for_all: blocks.enable_approval_for_all || blocks.enableApprovalForAll || true,
        
        // FIX: Critical mapping for batchMinting UI field
        batch_minting_enabled: blocks.batchMinting ?? blocks.batch_minting_enabled ?? false,
        
        // FIX: Add missing container support
        container_enabled: blocks.containerEnabled ?? blocks.container_enabled ?? false,
        
        // JSONB configurations
        sales_config: blocks.sales_config || blocks.salesConfig,
        whitelist_config: blocks.whitelist_config || blocks.whitelistConfig,
        batch_transfer_limits: blocks.batch_transfer_limits || blocks.batchTransferLimits,
        dynamic_uri_config: blocks.dynamicUriConfig || blocks.dynamic_uri_config,
        batch_minting_config: blocks.batchMintingConfig || blocks.batch_minting_config,
        transfer_restrictions: blocks.transferRestrictions || blocks.transfer_restrictions,
        container_config: blocks.containerConfig || blocks.container_config,
        dynamic_uris: blocks.dynamicUris ?? blocks.dynamic_uris ?? false
      };
      
    case 'ERC-1400':
      // Handle string to integer conversions for validation fields
      const holdingPeriodInt = blocks.holdingPeriod ? parseInt(blocks.holdingPeriod) || null : null;
      const maxInvestorCountInt = blocks.maxInvestorCount ? parseInt(blocks.maxInvestorCount) || null : null;
      
      return {
        ...baseRecord,
        initial_supply: blocks.initial_supply || blocks.initialSupply,
        cap: blocks.cap,
        is_mintable: blocks.is_mintable || blocks.isMintable || false,
        is_burnable: blocks.is_burnable || blocks.isBurnable || false,
        is_pausable: blocks.is_pausable || blocks.isPausable || false,
        
        // Document fields
        document_uri: blocks.document_uri || blocks.documentUri || blocks.legalTerms,
        document_hash: blocks.document_hash || blocks.documentHash,
        legal_terms: blocks.legalTerms || blocks.legal_terms,
        prospectus: blocks.prospectus,
        
        // Controller & compliance fields (FIX MAPPINGS)
        controller_address: blocks.controller_address || blocks.controllerAddress,
        enforce_kyc: blocks.enforceKYC ?? blocks.enforce_kyc ?? blocks.requireKYC ?? true, // Use new column
        
        // FIX: Correct field name mappings
        forced_transfers: blocks.forcedTransfersEnabled ?? blocks.forced_transfers ?? false,
        forced_redemption_enabled: blocks.forcedRedemptionEnabled ?? blocks.forced_redemption_enabled ?? false,
        whitelist_enabled: blocks.whitelistEnabled ?? blocks.whitelist_enabled ?? false,
        investor_accreditation: blocks.investorAccreditation ?? blocks.investor_accreditation ?? false,
        
        // FIX: Handle integer conversions
        holding_period: holdingPeriodInt,
        max_investor_count: maxInvestorCountInt,
        
        auto_compliance: blocks.autoCompliance ?? blocks.auto_compliance ?? false,
        manual_approvals: blocks.manualApprovals ?? blocks.manual_approvals ?? false,
        compliance_module: blocks.complianceModule || blocks.compliance_module,
        
        // Advanced features
        security_type: blocks.security_type || blocks.securityType || 'equity',
        issuing_jurisdiction: blocks.issuing_jurisdiction || blocks.issuingJurisdiction,
        issuing_entity_name: blocks.issuing_entity_name || blocks.issuingEntityName,
        issuing_entity_lei: blocks.issuing_entity_lei || blocks.issuingEntityLei,
        regulation_type: blocks.regulation_type || blocks.regulationType,
        is_multi_class: blocks.isMultiClass ?? blocks.is_multi_class ?? false,
        tranche_transferability: blocks.trancheTransferability ?? blocks.tranche_transferability ?? false,
        
        // Token management features
        is_issuable: blocks.isIssuable ?? blocks.is_issuable ?? blocks.issuance_modules ?? false,
        granular_control: blocks.granularControl ?? blocks.granular_control ?? false,
        dividend_distribution: blocks.dividendDistribution ?? blocks.dividend_distribution ?? false,
        corporate_actions: blocks.corporateActions ?? blocks.corporate_actions ?? false,
        
        // Array fields (JSONB)
        geographic_restrictions: blocks.geographicRestrictions || blocks.geographic_restrictions || [],
        
        // JSONB configurations
        transfer_restrictions: blocks.transfer_restrictions || blocks.transferRestrictions,
        kyc_settings: blocks.kyc_settings || blocks.kycSettings,
        compliance_settings: blocks.compliance_settings || blocks.complianceSettings,
        custom_features: blocks.customFeatures || blocks.custom_features || null,
        
        // Add missing advanced fields
        compliance_automation_level: blocks.complianceAutomationLevel || blocks.compliance_automation_level || 'manual',
        document_management: blocks.documentManagement || blocks.document_management || false,
        recovery_mechanism: blocks.recoveryMechanism || blocks.recovery_mechanism || false,
        token_details: blocks.tokenDetails || blocks.token_details
      };
      
    case 'ERC-3525':
      return {
        ...baseRecord,
        value_decimals: blocks.value_decimals || blocks.valueDecimals || 0,
        base_uri: blocks.base_uri || blocks.baseUri,
        metadata_storage: blocks.metadata_storage || blocks.metadataStorage || 'ipfs',
        slot_type: blocks.slot_type || blocks.slotType || 'generic',
        is_burnable: blocks.is_burnable || blocks.isBurnable || false,
        is_pausable: blocks.is_pausable || blocks.isPausable || false,
        has_royalty: blocks.has_royalty || blocks.hasRoyalty || false,
        royalty_percentage: blocks.royalty_percentage || blocks.royaltyPercentage,
        royalty_receiver: blocks.royalty_receiver || blocks.royaltyReceiver,
        slot_approvals: blocks.slot_approvals || blocks.slotApprovals || true,
        value_approvals: blocks.value_approvals || blocks.valueApprovals || true,
        access_control: blocks.access_control || blocks.accessControl || 'ownable',
        updatable_uris: blocks.updatable_uris || blocks.updatableUris || false,
        updatable_slots: blocks.updatable_slots || blocks.updatableSlots || false,
        value_transfers_enabled: blocks.value_transfers_enabled || blocks.valueTransfersEnabled || true,
        
        // FIX: Add missing advanced features
        fractional_ownership_enabled: blocks.fractionalOwnershipEnabled || blocks.fractional_ownership_enabled || false,
        mergable: blocks.mergable || false,
        splittable: blocks.splittable || false,
        dynamic_metadata: blocks.dynamicMetadata || blocks.dynamic_metadata || false,
        allows_slot_enumeration: blocks.allowsSlotEnumeration ?? blocks.allows_slot_enumeration ?? true,
        value_aggregation: blocks.valueAggregation ?? blocks.value_aggregation ?? false,
        permissioning_enabled: blocks.permissioningEnabled ?? blocks.permissioning_enabled ?? false,
        supply_tracking: blocks.supplyTracking ?? blocks.supply_tracking ?? false,
        updatable_values: blocks.updatableValues ?? blocks.updatable_values ?? false,
        fractionalizable: blocks.fractionalizable || false,
        
        // Complex configurations
        sales_config: blocks.sales_config || blocks.salesConfig,
        slot_transfer_validation: blocks.slot_transfer_validation || blocks.slotTransferValidation,
        custom_extensions: blocks.customExtensions || blocks.custom_extensions,
        metadata: blocks.metadata || null
      };
      
    case 'ERC-4626':
      return {
        ...baseRecord,
        // Core vault properties
        asset_address: blocks.asset_address || blocks.assetAddress,
        asset_name: blocks.asset_name || blocks.assetName,
        asset_symbol: blocks.asset_symbol || blocks.assetSymbol,
        asset_decimals: blocks.asset_decimals || blocks.assetDecimals || 18,
        vault_type: blocks.vault_type || blocks.vaultType || 'yield',
        vault_strategy: blocks.vault_strategy || blocks.vaultStrategy || (blocks.yieldStrategy?.protocol ? blocks.yieldStrategy.protocol[0] : 'simple'),
        custom_strategy: blocks.custom_strategy || blocks.customStrategy || false,
        strategy_controller: blocks.strategy_controller || blocks.strategyController,
        access_control: blocks.access_control || blocks.accessControl || 'ownable',
        
        // Standard features
        is_mintable: blocks.is_mintable || blocks.isMintable || false,
        is_burnable: blocks.is_burnable || blocks.isBurnable || false,
        is_pausable: blocks.is_pausable || blocks.isPausable || false,
        permit: blocks.permit || false,
        flash_loans: blocks.flash_loans || blocks.flashLoans || false,
        emergency_shutdown: blocks.emergency_shutdown || blocks.emergencyShutdown || false,
        performance_metrics: blocks.performance_metrics || blocks.performanceMetrics || false,
        performance_tracking: blocks.performanceTracking || blocks.performance_tracking || false,
        
        // FIX: Add missing advanced features
        yield_optimization_enabled: blocks.yieldOptimizationEnabled || blocks.yield_optimization_enabled || false,
        automated_rebalancing: blocks.automatedRebalancing || blocks.automated_rebalancing || false,
        yield_source: blocks.yieldSource || blocks.yield_source || 'external',
        strategy_documentation: blocks.strategyDocumentation || blocks.strategy_documentation,
        rebalance_threshold: blocks.rebalanceThreshold || blocks.rebalance_threshold,
        liquidity_reserve: blocks.liquidityReserve || blocks.liquidity_reserve || '10',
        max_slippage: blocks.maxSlippage || blocks.max_slippage,
        
        // Deposit/withdrawal limits
        deposit_limit: blocks.depositLimit || blocks.deposit_limit,
        withdrawal_limit: blocks.withdrawalLimit || blocks.withdrawal_limit,
        min_deposit: blocks.minDeposit || blocks.min_deposit,
        max_deposit: blocks.maxDeposit || blocks.max_deposit,
        min_withdrawal: blocks.minWithdrawal || blocks.min_withdrawal,
        max_withdrawal: blocks.maxWithdrawal || blocks.max_withdrawal,
        
        // Fee structure
        deposit_fee: blocks.depositFee || blocks.deposit_fee,
        withdrawal_fee: blocks.withdrawalFee || blocks.withdrawal_fee,
        management_fee: blocks.managementFee || blocks.management_fee,
        performance_fee: blocks.performanceFee || blocks.performance_fee,
        fee_recipient: blocks.feeRecipient || blocks.fee_recipient,
        
        // Complex configurations (JSONB)
        fee_structure: blocks.feeStructure || blocks.fee_structure || blocks.fee || {},
        rebalancing_rules: blocks.rebalancingRules || blocks.rebalancing_rules,
        withdrawal_rules: blocks.withdrawalRules || blocks.withdrawal_rules
      };
      
    default:
      return baseRecord;
  }
}

// Helper functions for handling specific token standards' related data

// ERC-721 Attributes Handler
async function handleERC721Attributes(tokenId: string, blocks: Record<string, any>, results: Record<string, any>) {
  const tokenAttributes = blocks.tokenAttributes || blocks.token_attributes;
  
  if (tokenAttributes && Array.isArray(tokenAttributes) && tokenAttributes.length > 0) {
    results.arrayData.tokenAttributes = { status: 'pending', count: tokenAttributes.length };
    
    try {
      const attributeRecords = tokenAttributes.map(attr => ({
        token_id: tokenId,
        trait_type: attr.name || attr.trait_type || 'unknown',
        values: Array.isArray(attr.values) ? attr.values : [attr.value || 'unknown']
      }));
      
      console.log('[TokenService] Inserting token_erc721_attributes records:', attributeRecords);
      
      const { data: attributesData, error: attributesError } = await supabase
        .from('token_erc721_attributes')
        .insert(attributeRecords);
      
      if (attributesError) {
        console.error('[TokenService] Failed to insert token_erc721_attributes records:', attributesError);
        results.arrayData.tokenAttributes = { 
          status: 'failed', 
          error: attributesError.message,
          attempted: attributeRecords.length
        };
      } else {
        console.log('[TokenService] Inserted token_erc721_attributes records:', attributesData);
        results.arrayData.tokenAttributes = { 
          status: 'success', 
          count: attributeRecords.length 
        };
      }
    } catch (attrError: any) {
      console.error('[TokenService] Error processing token attributes:', attrError);
      results.arrayData.tokenAttributes = { 
        status: 'failed', 
        error: attrError.message 
      };
    }
  }
}

// ERC-1155 Token Types Handler
async function handleERC1155TokenTypes(tokenId: string, blocks: Record<string, any>, results: Record<string, any>) {
  const tokenTypes = blocks.tokenTypes || blocks.token_types;
  
  if (tokenTypes && Array.isArray(tokenTypes) && tokenTypes.length > 0) {
    results.arrayData.tokenTypes = { status: 'pending', count: tokenTypes.length };
    
    try {
      const typeRecords = tokenTypes.map((type, index) => ({
        token_id: tokenId,
        token_type_id: type.id || `${index + 1}`,
        name: type.name || `Token Type ${index + 1}`,
        description: type.description || '',
        max_supply: type.supply || type.maxSupply,
        // FIX: Convert boolean to proper fungibility_type string
        fungibility_type: type.fungible !== undefined 
          ? (type.fungible ? 'fungible' : 'non-fungible')
          : 'non-fungible', // Default to non-fungible if not specified
        metadata: {
          rarityLevel: type.rarityLevel || 'common',
          originalFungibleFlag: type.fungible // Preserve original for reference
        }
      }));
      
      console.log('[TokenService] Inserting token_erc1155_types records:', typeRecords);
      
      const { data: typesData, error: typesError } = await supabase
        .from('token_erc1155_types')
        .insert(typeRecords)
        .select();
      
      if (typesError) {
        console.error('[TokenService] Failed to insert token_erc1155_types records:', typesError);
        results.arrayData.tokenTypes = { 
          status: 'failed', 
          error: typesError.message,
          attempted: typeRecords.length
        };
      } else {
        console.log('[TokenService] Inserted token_erc1155_types records:', typesData);
        results.arrayData.tokenTypes = { 
          status: 'success', 
          count: typesData.length,
          data: typesData 
        };
      }
    } catch (typeError: any) {
      console.error('[TokenService] Error processing token types:', typeError);
      results.arrayData.tokenTypes = { 
        status: 'failed', 
        error: typeError.message 
      };
    }
  }
}

// ERC-1400 Partitions Handler
async function handleERC1400Partitions(tokenId: string, blocks: Record<string, any>, results: Record<string, any>) {
  const partitions = blocks.partitions;
  
  if (partitions && Array.isArray(partitions) && partitions.length > 0) {
    results.arrayData.partitions = { status: 'pending', count: partitions.length };
    
    try {
      const partitionRecords = partitions.map((partition, index) => {
        // Include transferable field and put extra fields in metadata
        const { name, partitionId, transferable, amount, ...rest } = partition;
        return {
          token_id: tokenId,
          name: name,
          partition_id: partitionId || `PARTITION-${index + 1}`,
          amount: amount || '',
          transferable: transferable ?? true, // FIX: Ensure transferable is captured, default to true
          metadata: Object.keys(rest).length > 0 ? rest : null
        };
      });
      
      console.log('[TokenService] Inserting token_erc1400_partitions records:', partitionRecords);
      
      const { data: partitionsData, error: partitionsError } = await supabase
        .from('token_erc1400_partitions')
        .insert(partitionRecords)
        .select();
      
      if (partitionsError) {
        console.error('[TokenService] Failed to insert token_erc1400_partitions records:', partitionsError);
        results.arrayData.partitions = { 
          status: 'failed', 
          error: partitionsError.message,
          attempted: partitionRecords.length
        };
      } else {
        console.log('[TokenService] Inserted token_erc1400_partitions records:', partitionsData);
        results.arrayData.partitions = { 
          status: 'success', 
          count: partitionsData.length,
          data: partitionsData 
        };
      }
    } catch (partitionError: any) {
      console.error('[TokenService] Error processing partitions:', partitionError);
      results.arrayData.partitions = { 
        status: 'failed', 
        error: partitionError.message 
      };
    }
  }
}

// ERC-1400 Controllers Handler
async function handleERC1400Controllers(tokenId: string, blocks: Record<string, any>, results: Record<string, any>) {
  const controllers = blocks.controllers;
  
  if (controllers && Array.isArray(controllers) && controllers.length > 0) {
    results.arrayData.controllers = { status: 'pending', count: controllers.length };
    
    try {
      const controllerRecords = controllers.map(controller => {
        // Only insert valid columns
        return {
          token_id: tokenId,
          address: controller,
          permissions: ['ADMIN'] // Default permission
        };
      });
      
      console.log('[TokenService] Inserting token_erc1400_controllers records:', controllerRecords);
      
      const { data: controllersData, error: controllersError } = await supabase
        .from('token_erc1400_controllers')
        .insert(controllerRecords);
      
      if (controllersError) {
        console.error('[TokenService] Failed to insert token_erc1400_controllers records:', controllersError);
        results.arrayData.controllers = { 
          status: 'failed', 
          error: controllersError.message,
          attempted: controllerRecords.length
        };
      } else {
        console.log('[TokenService] Inserted token_erc1400_controllers records:', controllersData);
        results.arrayData.controllers = { 
          status: 'success', 
          count: controllerRecords.length 
        };
      }
    } catch (controllerError: any) {
      console.error('[TokenService] Error processing controllers:', controllerError);
      results.arrayData.controllers = { 
        status: 'failed', 
        error: controllerError.message 
      };
    }
  }
}

// ERC-3525 Slots Handler
async function handleERC3525Slots(tokenId: string, blocks: Record<string, any>, results: Record<string, any>) {
  const slots = blocks.slots;
  
  if (slots && Array.isArray(slots) && slots.length > 0) {
    results.arrayData.slots = { status: 'pending', count: slots.length };
    
    try {
      const slotRecords = slots.map((slot, index) => {
        const { slotId, name, description, valueUnits, transferable, ...rest } = slot;
        return {
          token_id: tokenId,
          slot_id: slotId || slot.id || `${index + 1}`,
          name: name || `Slot ${index + 1}`,
          description: description || '',
          value_units: valueUnits || slot.value_units || 'units',
          slot_transferable: transferable ?? slot.slot_transferable ?? true, // FIX: Ensure transferable is captured
          metadata: Object.keys(rest).length > 0 ? {
            ...rest,
            properties: slot.properties || {}
          } : null
        };
      });
      
      console.log('[TokenService] Inserting token_erc3525_slots records:', slotRecords);
      
      const { data: slotsData, error: slotsError } = await supabase
        .from('token_erc3525_slots')
        .insert(slotRecords)
        .select();
      
      if (slotsError) {
        console.error('[TokenService] Failed to insert token_erc3525_slots records:', slotsError);
        results.arrayData.slots = { 
          status: 'failed', 
          error: slotsError.message,
          attempted: slotRecords.length
        };
      } else {
        console.log('[TokenService] Inserted token_erc3525_slots records:', slotsData);
        results.arrayData.slots = { 
          status: 'success', 
          count: slotsData.length,
          data: slotsData 
        };
      }
    } catch (slotError: any) {
      console.error('[TokenService] Error processing slots:', slotError);
      results.arrayData.slots = { 
        status: 'failed', 
        error: slotError.message 
      };
    }
  }
}

// ERC-4626 Strategy Parameters Handler
async function handleERC4626Strategy(tokenId: string, blocks: Record<string, any>, results: Record<string, any>) {
  // Handle both yieldStrategy.protocol and direct strategyParams
  const protocols = blocks.yieldStrategy?.protocol || [];
  
  if (protocols.length > 0) {
    results.arrayData.strategyParams = { status: 'pending', count: protocols.length };
    
    try {
      const strategyParamRecords = protocols.map((protocol: string, index: number) => ({
        token_id: tokenId,
        name: 'protocol',
        value: protocol,
        description: `Yield protocol ${index + 1}`
      }));
      
      // Add rebalancing frequency if available
      if (blocks.yieldStrategy?.rebalancingFrequency) {
        strategyParamRecords.push({
          token_id: tokenId,
          name: 'rebalancingFrequency',
          value: blocks.yieldStrategy.rebalancingFrequency,
          description: 'Frequency of rebalancing'
        });
      }
      
      console.log('[TokenService] Inserting token_erc4626_strategy_params records:', strategyParamRecords);
      
      const { data: paramsData, error: paramsError } = await supabase
        .from('token_erc4626_strategy_params')
        .insert(strategyParamRecords);
      
      if (paramsError) {
        console.error('[TokenService] Failed to insert token_erc4626_strategy_params records:', paramsError);
        results.arrayData.strategyParams = { 
          status: 'failed', 
          error: paramsError.message,
          attempted: strategyParamRecords.length
        };
      } else {
        console.log('[TokenService] Inserted token_erc4626_strategy_params records:', paramsData);
        results.arrayData.strategyParams = { 
          status: 'success', 
          count: strategyParamRecords.length 
        };
      }
    } catch (paramError: any) {
      console.error('[TokenService] Error processing strategy parameters:', paramError);
      results.arrayData.strategyParams = { 
        status: 'failed', 
        error: paramError.message 
      };
    }
  }
}

// ERC-4626 Asset Allocations Handler
async function handleERC4626AssetAllocations(tokenId: string, blocks: Record<string, any>, results: Record<string, any>) {
  const assetAllocations = blocks.assetAllocation || [];
  
  if (assetAllocations.length > 0) {
    results.arrayData.assetAllocations = { status: 'pending', count: assetAllocations.length };
    
    try {
      const allocationRecords = assetAllocations.map((allocation: any) => ({
        token_id: tokenId,
        asset: allocation.asset,
        percentage: allocation.percentage
      }));
      
      console.log('[TokenService] Inserting token_erc4626_asset_allocations records:', allocationRecords);
      
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('token_erc4626_asset_allocations')
        .insert(allocationRecords);
      
      if (allocationsError) {
        console.error('[TokenService] Failed to insert token_erc4626_asset_allocations records:', allocationsError);
        results.arrayData.assetAllocations = { 
          status: 'failed', 
          error: allocationsError.message,
          attempted: allocationRecords.length
        };
      } else {
        console.log('[TokenService] Inserted token_erc4626_asset_allocations records:', allocationsData);
        results.arrayData.assetAllocations = { 
          status: 'success', 
          count: allocationRecords.length 
        };
      }
    } catch (allocationError: any) {
      console.error('[TokenService] Error processing asset allocations:', allocationError);
      results.arrayData.assetAllocations = { 
        status: 'failed', 
        error: allocationError.message 
      };
    }
  }
}

/**
 * Helper function to process standard-specific fields
 * Converts camelCase to snake_case and handles nested structures
 */
function processStandardSpecificFields(fields: Record<string, any>, standard?: string): Record<string, any> {
  if (!fields || Object.keys(fields).length === 0) return {};
  
  console.log(`[TokenService] Processing ${standard} specific fields:`, JSON.stringify(fields, null, 2));
  
  const result: Record<string, any> = {};
  
  // Process all fields, converting camelCase to snake_case
  for (const [key, value] of Object.entries(fields)) {
    // Convert camelCase to snake_case for the key
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    // Handle nested objects (but not arrays)
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = processStandardSpecificFields(value, standard);
    } else {
      result[snakeKey] = value;
    }
  }
  
  // Preserve array fields based on standard
  if (standard === 'ERC-721' && fields.tokenAttributes) {
    result.token_attributes = fields.tokenAttributes;
  } else if (standard === 'ERC-1155' && fields.tokenTypes) {
    result.token_types = fields.tokenTypes;
  } else if (standard === 'ERC-1400') {
    if (fields.partitions) result.partitions = fields.partitions;
    if (fields.controllers) result.controllers = fields.controllers;
  } else if (standard === 'ERC-3525' && fields.slots) {
    result.slots = fields.slots;
  } else if (standard === 'ERC-4626') {
    if (fields.yieldStrategy) result.yield_strategy = fields.yieldStrategy;
    if (fields.assetAllocation) result.asset_allocation = fields.assetAllocation;
  }
  
  // Map common field names regardless of token standard
  const commonMappings: Record<string, string> = {
    'initialSupply': 'initial_supply',
    'isMintable': 'is_mintable',
    'isBurnable': 'is_burnable',
    'isPausable': 'is_pausable',
    'baseUri': 'base_uri',
    'metadataStorage': 'metadata_storage',
    'hasRoyalty': 'has_royalty',
    'royaltyPercentage': 'royalty_percentage',
    'royaltyReceiver': 'royalty_receiver',
    'tokenType': 'token_type',
    'accessControl': 'access_control',
    'allowanceManagement': 'allow_management',
    'maxSupply': 'max_supply',
    'assetType': 'asset_type',
    'mintingMethod': 'minting_method',
    'autoIncrementIds': 'auto_increment_ids',
    'updatableUris': 'updatable_uris',
    'valueDecimals': 'value_decimals',
    'slotType': 'slot_type',
    'slotApprovals': 'slot_approvals',
    'valueApprovals': 'value_approvals',
    'updatableSlots': 'updatable_slots',
    'valueTransfersEnabled': 'value_transfers_enabled',
    'assetAddress': 'asset_address',
    'assetName': 'asset_name',
    'assetSymbol': 'asset_symbol',
    'assetDecimals': 'asset_decimals',
    'vaultType': 'vault_type',
    'customStrategy': 'custom_strategy',
    'strategyController': 'strategy_controller',
    'flashLoans': 'flash_loans',
    'emergencyShutdown': 'emergency_shutdown',
    'performanceMetrics': 'performance_metrics',
    'feeOnTransfer': 'fee_on_transfer',
    'supplyTracking': 'supply_tracking',
    'enableApprovalForAll': 'enable_approval_for_all',
    'securityType': 'security_type',
    'enforceKYC': 'require_kyc',
    'transferRestrictions': 'transfer_restrictions',
    'forcedTransfersEnabled': 'forced_transfers',
    'isIssuable': 'issuance_modules'
  };
  
  // Apply common mappings
  for (const [camelCase, snakeCase] of Object.entries(commonMappings)) {
    if (fields[camelCase] !== undefined) {
      result[snakeCase] = fields[camelCase];
    }
  }
  
  // Handle structured data for ERC-20 feeOnTransfer
  if (standard === 'ERC-20' && fields.feeOnTransfer) {
    const feeOnTransfer = fields.feeOnTransfer;
    
    // Ensure proper structure and validation
    result.fee_on_transfer = {
      enabled: !!feeOnTransfer.enabled,
      fee: feeOnTransfer.fee || "0",
      feeType: feeOnTransfer.feeType || "percentage",
      recipient: feeOnTransfer.recipient && feeOnTransfer.recipient !== "" 
        ? feeOnTransfer.recipient 
        : null // Use null instead of zero address for empty recipients
    };
  }
  
  // Handle structured data for ERC-4626
  if (standard === 'ERC-4626' && fields.fee) {
    result.fee_structure = typeof fields.fee === 'object' ? fields.fee : { enabled: true, managementFee: fields.fee };
  }
  
  // Handle special case for token metadata
  if (fields.metadata && typeof fields.metadata === 'object') {
    result.metadata = fields.metadata;
  }
  
  console.log(`[TokenService] Processed fields result:`, JSON.stringify(result, null, 2));
  
  return result;
}

/**
 * Update an existing token with comprehensive standard properties and array data
 */
export async function updateToken(tokenId: string, tokenData: Partial<TokenFormData>) {
  console.log('[TokenService] Updating token with data:', JSON.stringify(tokenData, null, 2));
  
  try {
    // 1. First, get the token to confirm it exists and get its standard
    const { data: existingToken, error: getError } = await supabase
      .from('tokens')
      .select('standard, project_id, metadata')
      .eq('id', tokenId)
      .single();
    
    if (getError) {
      throw new Error(`Failed to get token for update: ${getError.message}`);
    }
    
    const standard = tokenData.standard || existingToken.standard;
    
    // 2. Prepare main token data for update
    const tokenUpdate: TokenUpdate = {
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      blocks: tokenData.blocks || {},
      metadata: {
        ...(existingToken.metadata as Record<string, any> || {}),
        ...(tokenData.description ? { description: tokenData.description } : {})
      },
    };

    // Add total_supply if provided
    if (tokenData.initialSupply) {
      tokenUpdate.total_supply = tokenData.initialSupply;
    }

    // Set total_supply equal to cap when cap is greater than 0
    if (tokenUpdate.blocks && 
        typeof tokenUpdate.blocks === 'object' && 
        'cap' in tokenUpdate.blocks && 
        tokenUpdate.blocks.cap && 
        typeof tokenUpdate.blocks.cap === 'string' && 
        parseFloat(tokenUpdate.blocks.cap) > 0) {
      tokenUpdate.total_supply = tokenUpdate.blocks.cap;
    }

    // 3. Update main token record in database
    const { data: updatedToken, error: updateError } = await supabase
      .from('tokens')
      .update(tokenUpdate)
      .eq('id', tokenId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update token: ${updateError.message}`);
    }
    
    // Create update results container
    const updateResults: Record<string, any> = {
      mainToken: { status: 'success', id: updatedToken.id },
      standardProperties: { status: 'pending' },
      arrayData: {}
    };
    
    // Return the full token data with results
    return {
      ...updatedToken,
      updateResults
    };
  } catch (error: any) {
    console.error('[TokenService] Token update failed:', error);
    throw new Error(`Token update failed: ${error.message}`);
  }
}

/**
 * Get a complete token with all its related properties and array data
 */
export async function getCompleteToken(tokenId: string): Promise<any> {
  if (!tokenId) {
    throw new Error('Token ID is required to fetch complete token data');
  }

  try {
    // 1. Get the main token record
    const { data: token, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (error) {
      throw new Error(`Failed to get token: ${error.message}`);
    }

    if (!token) {
      throw new Error(`Token not found with ID: ${tokenId}`);
    }

    // 2. Get standard-specific properties
    const standard = token.standard;
    const standardTable = getStandardSpecificTable(standard);
    let properties = null;
    
    if (standardTable) {
      const { data: propsData, error: propsError } = await supabase
        .from(standardTable as any)
        .select('*')
        .eq('token_id', tokenId)
        .maybeSingle();
        
      if (propsError) {
        console.warn(`Warning: Failed to get ${standardTable} properties:`, propsError);
      } else if (propsData) {
        properties = propsData;
      }
    }

    // 3. Get related array data
    const arrayData = await getTokenArrayData(standard, tokenId);

    // 4. Combine all data
    return {
      ...token,
      properties,
      ...arrayData
    };
  } catch (error: any) {
    console.error('Error getting complete token:', error);
    throw new Error(`Failed to get complete token: ${error.message}`);
  }
}

/**
 * Get token-related array data based on standard
 */
async function getTokenArrayData(standard: string, tokenId: string): Promise<Record<string, any>> {
  const result: Record<string, any> = {};
  
  // Define tables for each standard
  const tables: Record<string, Record<string, [string, string]>> = {
    'ERC-721': {
      'tokenAttributes': ['token_erc721_attributes', 'attributes']
    },
    'ERC-1155': {
      'tokenTypes': ['token_erc1155_types', 'types'],
      'initialBalances': ['token_erc1155_balances', 'balances'],
      'uriMappings': ['token_erc1155_uri_mappings', 'uriMappings']
    },
    'ERC-1400': {
      'partitions': ['token_erc1400_partitions', 'partitions'],
      'controllers': ['token_erc1400_controllers', 'controllers']
    },
    'ERC-3525': {
      'slots': ['token_erc3525_slots', 'slots'],
      'allocations': ['token_erc3525_allocations', 'allocations']
    },
    'ERC-4626': {
      'strategyParams': ['token_erc4626_strategy_params', 'strategyParams'],
      'assetAllocations': ['token_erc4626_asset_allocations', 'assetAllocations']
    }
  };
  
  // Get relevant tables for this standard
  const tablesForStandard = tables[standard] || {};
  
  // Query each table and add to result
  for (const [resultName, [tableName, arrayName]] of Object.entries(tablesForStandard)) {
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('token_id', tokenId);
        
      if (error) {
        console.warn(`Warning: Failed to get ${tableName} data:`, error);
      } else if (data && data.length > 0) {
        result[resultName] = data;
      }
    } catch (err: any) {
      console.error(`Error getting data from ${tableName}:`, err);
    }
  }
  
  return result;
}

/**
 * Get a token by ID
 */
export async function getToken(tokenId: string) {
  if (!tokenId) {
    throw new Error('Token ID is required to fetch token details');
  }

  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('id', tokenId)
    .single();

  if (error) {
    throw new Error(`Failed to get token: ${error.message}`);
  }

  return data;
}

/**
 * Get all tokens
 */
export async function getTokens(projectId: string | null | undefined) {
  if (!projectId || projectId === "undefined") {
    // Return empty array without a warning since this is a common case during routing
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error(`Failed to get tokens: ${error.message}`);
      throw new Error(`Failed to get tokens: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching tokens:', error);
    return [];
  }
}

/**
 * Get tokens by project ID
 */
export async function getTokensByProject(projectId: string | null | undefined) {
  if (!projectId || projectId === "undefined") {
    console.warn('Invalid project ID provided when fetching tokens by project, returning empty array');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error(`Failed to get tokens: ${error.message}`);
      throw new Error(`Failed to get tokens: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching tokens by project:', error);
    return [];
  }
}

/**
 * Update a token's deployment status and details
 */
export async function updateTokenDeployment(tokenId: string, deploymentData: {
  address: string;
  blockchain: string;
  transaction_hash: string;
  status: string;
}) {
  if (!tokenId) {
    throw new Error('Token ID is required to update deployment');
  }

  if (!deploymentData.address) {
    throw new Error('Token address is required for deployment');
  }

  // Update token with deployment information
  const { data, error } = await supabase
    .from('tokens')
    .update({
      address: deploymentData.address,
      blockchain: deploymentData.blockchain,
      status: deploymentData.status as "DRAFT" | "UNDER REVIEW" | "APPROVED" | "READY TO MINT" | "MINTED" | "DEPLOYED" | "PAUSED" | "DISTRIBUTED" | "REJECTED",
      metadata: { transaction_hash: deploymentData.transaction_hash }
    })
    .eq('id', tokenId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update token deployment: ${error.message}`);
  }

  return data;
}

/**
 * Deploy a token to the blockchain
 */
export async function deployToken(config: TokenDeploymentConfig): Promise<TokenDeploymentResult> {
  // First, create a deployment record in the database
  // Include both required fields
  const { data: deploymentRecord, error: deploymentError } = await supabase
    .from('token_deployments')
    .insert({
      token_id: config.tokenId,
      network: config.network,
      deployed_by: config.deployer || 'system',
      status: 'PENDING',
      // Add placeholder values for required fields
      contract_address: 'pending',
      transaction_hash: 'pending',
      deployment_data: {
        environment: config.environment
      }
    })
    .select()
    .single();

  if (deploymentError) {
    throw new Error(`Failed to create deployment record: ${deploymentError.message}`);
  }

  // In a real implementation, you'd make a call to a blockchain service here
  // This is a placeholder that simulates a successful deployment
  const simulatedBlockchainCall = async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock data
    return {
      contractAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
    };
  };

  try {
    // Simulate the blockchain call
    const deploymentResult = await simulatedBlockchainCall();

    // Update the deployment record with the result
    const { data: updatedDeployment, error: updateError } = await supabase
      .from('token_deployments')
      .update({
        contract_address: deploymentResult.contractAddress,
        transaction_hash: deploymentResult.transactionHash,
        deployed_at: new Date().toISOString(),
        status: 'SUCCESSFUL'
      })
      .eq('id', deploymentRecord.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update deployment record: ${updateError.message}`);
    }

    // Format the result to match the expected return type
    return {
      tokenId: config.tokenId,
      network: config.network,
      environment: config.environment,
      contractAddress: deploymentResult.contractAddress,
      transactionHash: deploymentResult.transactionHash,
      deployedBy: config.deployer || 'system',
      deployedAt: new Date().toISOString(),
      status: 'SUCCESSFUL'
    };
  } catch (error: any) {
    // Update the deployment record with the error
    await supabase
      .from('token_deployments')
      .update({
        status: 'FAILED',
        error_message: error.message
      })
      .eq('id', deploymentRecord.id);

    throw new Error(`Deployment failed: ${error.message}`);
  }
}

/**
 * Execute a token operation (mint, burn, pause, etc.)
 */
export async function executeTokenOperation(params: TokenOperationParams) {
  // Create an operation record in the database
  const { data: operationRecord, error: operationError } = await supabase
    .from('token_operations')
    .insert({
      token_id: params.tokenId,
      operation_type: params.operationType,
      operator: 'current_user', // This would normally be the authenticated user
      recipient_address: params.recipient,
      amount: params.amount ? Number(params.amount) : undefined,
      sender_address: params.sender,
      target_address: params.targetAddress,
      nft_token_id: params.nftTokenId,
      token_type_id: params.tokenTypeId,
      slot_id: params.slotId,
      value: params.value ? Number(params.value) : undefined,
      partition: params.partition,
      asset_token_address: params.assetTokenAddress,
      lock_duration: params.lockDuration,
      lock_reason: params.lockReason,
      unlock_time: params.unlockTime,
      lock_id: params.lockId,
      status: 'PENDING',
      operation_data: {
        operationDetails: params
      }
    })
    .select()
    .single();

  if (operationError) {
    throw new Error(`Failed to create operation record: ${operationError.message}`);
  }

  // In a real implementation, you'd make a call to a blockchain service here
  // This is a placeholder that simulates a successful operation
  const simulatedBlockchainCall = async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return mock data
    return {
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      timestamp: new Date().toISOString(),
    };
  };

  try {
    // Simulate the blockchain call
    const operationResult = await simulatedBlockchainCall();

    // Update the operation record with the result
    const { data: updatedOperation, error: updateError } = await supabase
      .from('token_operations')
      .update({
        transaction_hash: operationResult.transactionHash,
        timestamp: operationResult.timestamp,
        status: 'SUCCESSFUL'
      })
      .eq('id', operationRecord.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update operation record: ${updateError.message}`);
    }

    return updatedOperation;
  } catch (error: any) {
    // Update the operation record with the error
    await supabase
      .from('token_operations')
      .update({
        status: 'FAILED',
        error_message: error.message
      })
      .eq('id', operationRecord.id);

    throw new Error(`Operation failed: ${error.message}`);
  }
}

/**
 * Create a token template
 */
export async function createTokenTemplate(projectId: string, templateData: any) {
  const { data, error } = await supabase
    .from('token_templates')
    .insert({
      project_id: projectId,
      name: templateData.name,
      description: templateData.description || '',
      standard: templateData.standard,
      blocks: templateData.blocks || {},
      metadata: templateData.metadata || {}
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create token template: ${error.message}`);
  }

  return data;
}

/**
 * Get token templates by project ID
 */
export async function getTokenTemplatesByProject(projectId: string) {
  const { data, error } = await supabase
    .from('token_templates')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    throw new Error(`Failed to get token templates: ${error.message}`);
  }

  return data;
}

/**
 * Delete a token and all its associated resources
 */
export async function deleteToken(projectId: string, tokenId: string) {
  try {
    // Start with a check to ensure the token exists and belongs to the project
    const { data: token, error: getError } = await supabase
      .from('tokens')
      .select('standard, project_id')
      .eq('id', tokenId)
      .single();
    
    if (getError) {
      throw new Error(`Token not found: ${getError.message}`);
    }
    
    if (token.project_id !== projectId) {
      throw new Error('Token does not belong to this project');
    }
    
    const standard = token.standard;
    
    // Create deletion results container
    const results: Record<string, any> = {
      standardArrays: {},
      standardProperties: { status: 'pending' },
      mainToken: { status: 'pending' }
    };
    
    try {
      // 1. First delete any array data for the token
      const arrayResults = await deleteStandardArrayRecords(standard, tokenId, results);
      results.standardArrays = arrayResults;
      
      // 2. Now delete the standard properties record
      const standardTable = getStandardSpecificTable(standard);
      if (standardTable) {
        console.log(`[TokenService] Deleting ${standardTable} record for token ${tokenId}`);
        
        const { error: deletePropertiesError } = await supabase
          .from(standardTable as any)
          .delete()
          .eq('token_id', tokenId);
        
        if (deletePropertiesError) {
          console.error(`[TokenService] Failed to delete ${standardTable} record:`, deletePropertiesError);
          results.standardProperties = { status: 'failed', error: deletePropertiesError.message };
        } else {
          console.log(`[TokenService] Successfully deleted ${standardTable} record for token ${tokenId}`);
          results.standardProperties = { status: 'success' };
        }
      }
      
      // 3. Finally delete the main token record
      const { error: deleteTokenError } = await supabase
        .from('tokens')
        .delete()
        .eq('id', tokenId);
      
      if (deleteTokenError) {
        throw new Error(`Failed to delete token: ${deleteTokenError.message}`);
      }
      
      results.mainToken = { status: 'success' };
    } catch (error: any) {
      console.error('[TokenService] Error during token deletion:', error);
      throw error;
    }
    
    return {
      success: true,
      message: `Token ${tokenId} deleted successfully`,
      results
    };
  } catch (error: any) {
    console.error('[TokenService] Token deletion failed:', error);
    throw new Error(`Token deletion failed: ${error.message}`);
  }
}

/**
 * Delete standard-specific array records
 */
async function deleteStandardArrayRecords(
  standard: string, 
  tokenId: string,
  results: Record<string, any>
): Promise<Record<string, any>> {
  // Map of standard to array tables that need cleanup
  const arrayTables: Record<string, string[]> = {
    'ERC-721': ['token_erc721_attributes'],
    'ERC-1155': ['token_erc1155_types', 'token_erc1155_balances', 'token_erc1155_uri_mappings'],
    'ERC-1400': ['token_erc1400_partitions', 'token_erc1400_controllers'],
    'ERC-3525': ['token_erc3525_slots', 'token_erc3525_allocations'],
    'ERC-4626': ['token_erc4626_strategy_params', 'token_erc4626_asset_allocations']
  };
  
  // Get array tables for this standard
  const tables = arrayTables[standard] || [];
  
  // Delete from each table and record results
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('token_id', tokenId);
      
      results[table] = {
        status: error ? 'failed' : 'success',
        error: error?.message
      };
      
      if (error) {
        console.warn(`Warning: Failed to delete records from ${table}: ${error.message}`);
      } else {
        console.log(`Deleted records from ${table}`);
      }
    } catch (err: any) {
      console.error(`Error deleting from ${table}:`, err);
      results[table] = { status: 'failed', error: err.message };
    }
  }
  
  return results;
}

/**
 * Create standard-specific properties from direct data
 */
async function createStandardPropertiesFromDirect(
  standard: string,
  tokenId: string,
  properties: any
): Promise<Record<string, any>> {
  const standardTable = getStandardSpecificTable(standard);
  if (!standardTable) {
    throw new Error(`Unsupported token standard: ${standard}`);
  }
  
  // Ensure token_id is set
  const propertyRecord = {
    token_id: tokenId,
    ...properties
  };
  
  console.log(`[TokenService] Inserting ${standardTable} record from direct data:`, propertyRecord);
  
  const { data: propertiesData, error: propertiesError } = await supabase
    .from(standardTable as any) // Use type assertion
    .insert(propertyRecord)
    .select()
    .single();
    
  if (propertiesError) {
    console.error(`[TokenService] Failed to insert ${standardTable} record:`, propertiesError);
    throw propertiesError;
  }
  
  return { data: propertiesData };
}

/**
 * Create standard-specific array records from direct data
 */
async function createStandardArraysFromDirect(
  standard: string,
  tokenId: string,
  arrays: Record<string, any[]>
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  
  // Map standard-specific array tables
  const arrayTables: Record<string, string> = {
    'ERC-721': {
      token_attributes: 'token_erc721_attributes'
    },
    'ERC-1155': {
      token_types: 'token_erc1155_types',
      uri_mappings: 'token_erc1155_uri_mappings',
      initial_balances: 'token_erc1155_balances'
    },
    'ERC-1400': {
      partitions: 'token_erc1400_partitions',
      controllers: 'token_erc1400_controllers'
    },
    'ERC-3525': {
      slots: 'token_erc3525_slots',
      allocations: 'token_erc3525_allocations'
    },
    'ERC-4626': {
      strategyParams: 'token_erc4626_strategy_params',
      assetAllocations: 'token_erc4626_asset_allocations'
    }
  }[standard] || {};
  
  // Process each array type
  for (const [arrayType, items] of Object.entries(arrays)) {
    if (!items || !Array.isArray(items) || items.length === 0) continue;
    
    const tableName = arrayTables[arrayType];
    if (!tableName) {
      console.warn(`[TokenService] Unknown array type '${arrayType}' for standard ${standard}`);
      continue;
    }
    
    results[arrayType] = { status: 'pending', count: items.length };
    
    try {
      let records;
      if (tableName === 'token_erc1400_partitions') {
        // Only insert valid columns for partitions
        records = items.map((partition: any, index: number) => {
          const { name, partitionId, ...rest } = partition;
          return {
            token_id: tokenId,
            name: name,
            partition_id: partitionId || `PARTITION-${index + 1}`,
            metadata: Object.keys(rest).length > 0 ? rest : null
          };
        });
      } else if (tableName === 'token_erc1400_controllers') {
        // Only insert valid columns for controllers
        records = items.map((controller: any) => {
          return {
            token_id: tokenId,
            address: controller,
            permissions: ['ADMIN']
          };
        });
      } else if (tableName === 'token_erc3525_slots') {
        // Special handling for ERC-3525 slots - move properties to metadata
        records = items.map((slot: any) => {
          const { id, name, description, properties, ...rest } = slot;
          return {
            token_id: tokenId,
            slot_id: id,
            name: name || `Slot ${id}`,
            description: description || '',
            // Store properties in metadata if they exist
            metadata: properties || rest || null
          };
        });
      } else {
        // Default: add token_id to each item
        records = items.map(item => ({
          token_id: tokenId,
          ...item
        }));
      }
      
      console.log(`[TokenService] Inserting ${tableName} records:`, records);
      
      const { data, error } = await supabase
        .from(tableName as any) // Use type assertion
        .insert(records);
        
      if (error) {
        console.error(`[TokenService] Failed to insert ${tableName} records:`, error);
        results[arrayType] = { 
          status: 'failed', 
          error: error.message,
          attempted: records.length
        };
      } else {
        console.log(`[TokenService] Inserted ${tableName} records successfully`);
        results[arrayType] = { 
          status: 'success', 
          count: records.length 
        };
      }
    } catch (error: any) {
      console.error(`[TokenService] Error processing ${arrayType}:`, error);
      results[arrayType] = { 
        status: 'failed', 
        error: error.message 
      };
    }
  }
  
  return results;
}

/**
 * Extract array data from blocks for a specific token standard
 */
function extractArraysFromBlocks(standard: string, blocks: Record<string, any>): Record<string, any[]> {
  const result: Record<string, any[]> = {};
  
  switch (standard) {
    case 'ERC-721':
      if (blocks.tokenAttributes && Array.isArray(blocks.tokenAttributes)) {
        result.token_attributes = blocks.tokenAttributes;
      }
      break;
    case 'ERC-1155':
      if (blocks.tokenTypes && Array.isArray(blocks.tokenTypes)) {
        result.token_types = blocks.tokenTypes;
      }
      break;
    case 'ERC-1400':
      if (blocks.partitions && Array.isArray(blocks.partitions)) {
        result.partitions = blocks.partitions;
      }
      if (blocks.controllers && Array.isArray(blocks.controllers)) {
        result.controllers = blocks.controllers;
      }
      break;
    case 'ERC-3525':
      if (blocks.slots && Array.isArray(blocks.slots)) {
        result.slots = blocks.slots;
      }
      break;
    case 'ERC-4626':
      if (blocks.yieldStrategy?.protocol && Array.isArray(blocks.yieldStrategy.protocol)) {
        result.strategyParams = blocks.yieldStrategy.protocol.map((p: string) => ({
          name: 'protocol',
          value: p
        }));
      } else if (blocks.standardArrays?.strategyParams && Array.isArray(blocks.standardArrays.strategyParams)) {
        result.strategyParams = blocks.standardArrays.strategyParams;
      }
      
      if (blocks.assetAllocation && Array.isArray(blocks.assetAllocation)) {
        result.assetAllocations = blocks.assetAllocation;
      } else if (blocks.standardArrays?.assetAllocations && Array.isArray(blocks.standardArrays.assetAllocations)) {
        result.assetAllocations = blocks.standardArrays.assetAllocations;
      }
      break;
  }
  
  return result;
}

/**
 * Update a token's status
 * @param tokenId The token ID to update
 * @param status The new status
 * @returns The updated token data
 */
export async function updateTokenStatus(tokenId: string, status: string) {
  if (!tokenId) {
    console.error('[TokenService] Error: No token ID provided');
    throw new Error('No token ID provided');
  }

  if (!status) {
    console.error('[TokenService] Error: No status provided');
    throw new Error('No status provided');
  }

  // Define the valid database status enum type
  type TokenStatusEnum = "DRAFT" | "UNDER REVIEW" | "APPROVED" | "READY TO MINT" | "MINTED" | "DEPLOYED" | "PAUSED" | "DISTRIBUTED" | "REJECTED";
  
  // Map frontend enum values to database enum values
  const statusMap: Record<string, TokenStatusEnum> = {
    'DRAFT': 'DRAFT',
    'REVIEW': 'UNDER REVIEW',
    'UNDER_REVIEW': 'UNDER REVIEW',
    'APPROVED': 'APPROVED',
    'REJECTED': 'REJECTED',
    'READY_TO_MINT': 'READY TO MINT',
    'READY TO MINT': 'READY TO MINT', // Direct match for database format
    'MINTED': 'MINTED',
    'DEPLOYED': 'DEPLOYED',
    'PAUSED': 'PAUSED',
    'DISTRIBUTED': 'DISTRIBUTED'
  };
  
  // Handle status with underscores (frontend format) or spaces (database format)
  let normalizedStatus = status;
  
  // Convert frontend enum format with underscores to database format with spaces
  if (status === 'READY_TO_MINT') {
    normalizedStatus = 'READY TO MINT';
    console.log(`[TokenService] Normalized READY_TO_MINT to 'READY TO MINT'`);
  } else if (status === 'UNDER_REVIEW' || status === 'REVIEW') {
    normalizedStatus = 'UNDER REVIEW';
    console.log(`[TokenService] Normalized ${status} to 'UNDER REVIEW'`);
  }
  
  // Get the mapped database status value, defaulting to DRAFT if not found
  let dbStatus: TokenStatusEnum;
  
  // First check if the normalized status is already a valid database enum value
  if (Object.values(statusMap).includes(normalizedStatus as TokenStatusEnum)) {
    dbStatus = normalizedStatus as TokenStatusEnum;
    console.log(`[TokenService] Using normalized status directly: ${dbStatus}`);
  } else {
    // Otherwise use the mapping
    dbStatus = statusMap[normalizedStatus] || 'DRAFT';
    console.log(`[TokenService] Mapped status ${normalizedStatus} to ${dbStatus}`);
  }
  
  console.log(`[TokenService] Updating token ${tokenId} status from ${status} to database value ${dbStatus}`);
  
  try {
    // First, check if the token exists
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select('id, status')
      .eq('id', tokenId)
      .single();
    
    if (tokenError) {
      console.error(`[TokenService] Error finding token: ${tokenError.message}`);
      throw new Error(`Error finding token: ${tokenError.message}`);
    }
    
    if (!tokenData) {
      console.error(`[TokenService] Token not found with ID: ${tokenId}`);
      throw new Error(`Token not found with ID: ${tokenId}`);
    }
    
    console.log(`[TokenService] Found token with current status: ${tokenData.status}`);
    
    // Now update the token status
    const { data, error } = await supabase
      .from('tokens')
      .update({ status: dbStatus })
      .eq('id', tokenId)
      .select()
      .single();
    
    if (error) {
      console.error(`[TokenService] Error updating token status: ${error.message}`);
      console.error(`[TokenService] Error details:`, error);
      throw new Error(`Error updating token status: ${error.message}`);
    }
    
    if (!data) {
      console.error(`[TokenService] No data returned after update`);
      throw new Error('No data returned after update');
    }
  
    console.log(`[TokenService] Successfully updated token status to: ${data.status}`);
    return data;
  } catch (error) {
    console.error(`[TokenService] Unexpected error updating token status:`, error);
    throw error;
  }
}