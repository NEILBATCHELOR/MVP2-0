import { supabase } from '@/infrastructure/supabaseClient';
import { TokenFormData } from '../types';
import { validateForm } from '../validation/formErrorParser';
import {
  erc20Schema,
  erc721Schema,
  erc1155Schema,
  erc1400Schema,
  erc3525Schema,
  erc4626Schema
} from '../validation/schemas';
import {
  getFormToPropertiesAdapter,
  standardToEnum,
  enumToStandard
} from '../validation/schemaAdapters';
import { TokenStandardEnum, TokenConfigModeEnum } from '@/types/domain/token/tokenSchema';
import { mapERC721FormToDatabase } from '../utils/mappers/erc721/erc721PropertyMapper';
import { mapERC1155FormToDatabase } from '../utils/mappers/erc1155/erc1155PropertyMapper';
import { mapERC4626FormToDatabase } from '../utils/mappers/erc4626/erc4626PropertyMapper';
import { 
  TokenErc721AttributesTable, 
  TokenErc1155TypesTable, 
  TokenErc1155BalancesTable, 
  TokenErc1155UriMappingsTable,
  TokenErc4626StrategyParamsTable,
  TokenErc4626AssetAllocationsTable
} from '@/types/core/database';

// Forward declaration of direct mapper functions for other standards
// These will be used from try/catch blocks to provide fallback behavior
let mapERC20FormToDatabase: any;
let mapERC1400FormToDatabase: any;
let mapERC3525FormToDatabase: any;

try {
  mapERC20FormToDatabase = require('../utils/mappers/erc20/erc20PropertyMapper').mapERC20FormToDatabase;
} catch (e) {
  console.log('ERC20 direct mapper not available');
}

try {
  mapERC1400FormToDatabase = require('../utils/mappers/erc1400/erc1400PropertyMapper').mapERC1400FormToDatabase;
} catch (e) {
  console.log('ERC1400 direct mapper not available');
}

try {
  mapERC3525FormToDatabase = require('../utils/mappers/erc3525/erc3525PropertyMapper').mapERC3525FormToDatabase;
} catch (e) {
  console.log('ERC3525 direct mapper not available');
}

/**
 * Base function to save a token with standard-specific validation
 */
async function saveTokenWithValidation(
  tokenId: string | null,
  projectId: string,
  tokenData: TokenFormData,
  schema: any
) {
  // Validate token data against schema
  const validation = validateForm(schema, tokenData);
  
  if (!validation.success) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }
  
  // Prepare token data for database
  const tokenRecord: any = {
    name: tokenData.name,
    symbol: tokenData.symbol,
    standard: tokenData.standard,
    config_mode: tokenData.config_mode || TokenConfigModeEnum.MIN,
    blocks: tokenData.blocks || {},
    metadata: {
      description: tokenData.description,
      configOptions: tokenData.configOptions
    }
  };
  
  // Add decimals if provided (for token standards that support it)
  if ('decimals' in tokenData) {
    tokenRecord.decimals = tokenData.decimals;
  }
  
  // Add total supply if provided (for fungible tokens)
  if ('initialSupply' in tokenData && tokenData.initialSupply) {
    tokenRecord.total_supply = tokenData.initialSupply.toString();
  }
  
  // If tokenId is provided, update existing token, otherwise create new one
  if (tokenId) {
    // Update existing token
    const { data, error } = await supabase
      .from('tokens')
      .update(tokenRecord)
      .eq('id', tokenId)
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to update token: ${error.message}`);
    }
    
    return data;
  } else {
    // Create new token
    tokenRecord.project_id = projectId;
    
    const { data, error } = await supabase
      .from('tokens')
      .insert(tokenRecord)
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to create token: ${error.message}`);
    }
    
    return data;
  }
}

/**
 * Save token-specific properties to their dedicated tables
 */
async function saveTokenProperties(tokenId: string, standard: string, properties: any) {
  // Determine which table to use based on the standard
  const standardWithoutHyphen = standard.toLowerCase().replace('-', '');
  const tableName = `token_${standardWithoutHyphen}_properties`;
  
  // Insert or update properties in the appropriate table
  const { data, error } = await supabase
    .from(tableName as any)
    .upsert({
      token_id: tokenId,
      ...properties
    })
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to save token properties: ${error.message}`);
  }
  
  return data;
}

/**
 * ERC-20 Token Services
 */
export async function saveERC20Token(
  tokenId: string | null,
  projectId: string,
  tokenData: TokenFormData
) {
  // Save the base token data with validation
  const token = await saveTokenWithValidation(
    tokenId,
    projectId,
    tokenData,
    tokenData.config_mode === TokenConfigModeEnum.MAX ? erc20Schema : erc20Schema
  );
  
  try {
    // Try to use the direct mapper if available - import is at the top of the file
    const { mapERC20FormToDatabase } = require('../utils/mappers/erc20/erc20PropertyMapper');
    
    // Use the direct mapper to convert form data to database format
    const { properties } = mapERC20FormToDatabase({
      ...tokenData,
      config_mode: tokenData.config_mode || TokenConfigModeEnum.MIN,
      standard: TokenStandardEnum.ERC20
    });
    
    // Save token properties
    await saveTokenProperties(token.id, 'ERC-20', properties);
    
    return token;
  } catch (error) {
    console.warn('Direct mapper not available for ERC-20, using fallback method');
    
    // Use adapter to convert form data to database properties
    let properties;
    try {
      const adapter = getFormToPropertiesAdapter(standardToEnum('ERC-20'));
      properties = adapter(tokenData);
    } catch (error) {
      // Fallback to direct mapping if adapter isn't available
      properties = {
        initial_supply: tokenData.initialSupply,
        cap: tokenData.cap,
        is_mintable: tokenData.isMintable,
        is_burnable: tokenData.isBurnable,
        is_pausable: tokenData.isPausable,
        token_type: tokenData.tokenType,
        access_control: tokenData.accessControl,
        allow_management: tokenData.allowanceManagement,
        permit: tokenData.permit,
        snapshot: tokenData.snapshot,
        fee_on_transfer: tokenData.feeOnTransfer,
        rebasing: tokenData.rebasing,
        governance_features: tokenData.governanceFeatures,
        // Additional fields from database schema
        transfer_config: tokenData.transferConfig,
        gas_config: tokenData.gasConfig,
        compliance_config: tokenData.complianceConfig,
        whitelist_config: tokenData.whitelistConfig
      };
    }
    
    // Save token properties
    await saveTokenProperties(token.id, 'ERC-20', properties);
    
    return token;
  }
}

/**
 * ERC-721 Token Services
 */
export async function saveERC721Token(
  tokenId: string | null,
  projectId: string,
  tokenData: TokenFormData
) {
  // Save the base token data with validation
  const token = await saveTokenWithValidation(
    tokenId,
    projectId,
    tokenData,
    tokenData.config_mode === 'max' ? erc721Schema : erc721Schema
  );
  
  // Use the direct mapper to convert form data to database format
  const { properties, attributes } = mapERC721FormToDatabase({
    ...tokenData,
    config_mode: tokenData.config_mode || 'min',
    standard: 'ERC-721'
  });
  
  // Save token properties
  await saveTokenProperties(token.id, 'ERC-721', properties);
  
  // Handle token attributes if provided
  if (attributes && attributes.length > 0) {
    // First delete existing attributes
    await supabase
      .from('token_erc721_attributes')
      .delete()
      .eq('token_id', token.id);
      
    // Create properly typed attributes with required fields
    const dbAttributes: TokenErc721AttributesTable[] = attributes.map(attr => ({
      token_id: token.id,
      trait_type: attr.traitType || '',
      values: attr.values || [],
      id: attr.id,
      created_at: attr.createdAt,
      updated_at: null
    }));
    
    const { error } = await supabase
      .from('token_erc721_attributes')
      .insert(dbAttributes);
      
    if (error) {
      console.error('Failed to save token attributes:', error);
    }
  }
  
  return token;
}

/**
 * ERC-1155 Token Services
 */
export async function saveERC1155Token(
  tokenId: string | null,
  projectId: string,
  tokenData: TokenFormData
) {
  // Save the base token data with validation
  const token = await saveTokenWithValidation(
    tokenId,
    projectId,
    tokenData,
    tokenData.config_mode === 'max' ? erc1155Schema : erc1155Schema
  );
  
  // Use the direct mapper to convert form data to database format
  const { properties, types, balances, uriMappings } = mapERC1155FormToDatabase({
    ...tokenData,
    config_mode: tokenData.config_mode || 'min',
    standard: 'ERC-1155'
  });
  
  // Save token properties
  await saveTokenProperties(token.id, 'ERC-1155', properties);
  
  // Handle token types if provided
  if (types && types.length > 0) {
    // First delete existing token types
    await supabase
      .from('token_erc1155_types')
      .delete()
      .eq('token_id', token.id);
      
    // Create properly typed token types with required fields
    const dbTypes: TokenErc1155TypesTable[] = types.map(type => ({
      token_id: token.id,
      token_type_id: type.token_type_id || '',
      name: type.name || '',
      description: type.description || null,
      max_supply: type.max_supply || null,
      fungibility_type: type.fungibility_type || 'fungible',
      metadata: type.metadata || null,
      id: type.id,
      created_at: type.created_at,
      updated_at: null
    }));
    
    const { error } = await supabase
      .from('token_erc1155_types')
      .insert(dbTypes);
      
    if (error) {
      console.error('Failed to save token types:', error);
    }
  }
  
  // Handle balances if provided
  if (balances && balances.length > 0) {
    // First delete existing balances
    await supabase
      .from('token_erc1155_balances')
      .delete()
      .eq('token_id', token.id);
      
    // Create properly typed balances with required fields
    const dbBalances: TokenErc1155BalancesTable[] = balances.map(balance => ({
      token_id: token.id,
      token_type_id: balance.token_type_id || '',
      address: balance.address || '',
      amount: balance.amount || '0',
      id: balance.id,
      created_at: balance.created_at,
      updated_at: null
    }));
    
    const { error } = await supabase
      .from('token_erc1155_balances')
      .insert(dbBalances);
      
    if (error) {
      console.error('Failed to save token balances:', error);
    }
  }
  
  // Handle URI mappings if provided
  if (uriMappings && uriMappings.length > 0) {
    // First delete existing URI mappings
    await supabase
      .from('token_erc1155_uri_mappings')
      .delete()
      .eq('token_id', token.id);
      
    // Create properly typed URI mappings with required fields
    const dbUriMappings: TokenErc1155UriMappingsTable[] = uriMappings.map(mapping => ({
      token_id: token.id,
      token_type_id: mapping.token_type_id || '',
      uri: mapping.uri || '',
      id: mapping.id,
      created_at: mapping.created_at,
      updated_at: null
    }));
    
    const { error } = await supabase
      .from('token_erc1155_uri_mappings')
      .insert(dbUriMappings);
      
    if (error) {
      console.error('Failed to save URI mappings:', error);
    }
  }
  
  return token;
}

/**
 * ERC-1400 Token Services
 */
export async function saveERC1400Token(
  tokenId: string | null,
  projectId: string,
  tokenData: TokenFormData
) {
  // Save the base token data with validation
  const token = await saveTokenWithValidation(
    tokenId,
    projectId,
    tokenData,
    tokenData.config_mode === 'max' ? erc1400Schema : erc1400Schema
  );
  
  try {
    // Use the direct mapper (imported at the top of the file or loaded dynamically)
    if (!mapERC1400FormToDatabase) {
      // Try to load it if it wasn't available at the start
      mapERC1400FormToDatabase = require('../utils/mappers/erc1400/erc1400PropertyMapper').mapERC1400FormToDatabase;
    }
    
    // Use the direct mapper to convert form data to database format
    const { properties, controllers, partitions, documents } = mapERC1400FormToDatabase({
      ...tokenData,
      config_mode: tokenData.config_mode || 'min',
      tokenId: token.id
    });
    
    // Save token properties
    const { data: existingProperties, error: fetchError } = await supabase
      .from('token_erc1400_properties')
      .select()
      .eq('token_id', token.id)
      .maybeSingle();
      
    if (existingProperties) {
      // Update existing properties
      const { error } = await supabase
        .from('token_erc1400_properties')
        .update({
          ...properties,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProperties.id);
        
      if (error) {
        console.error('Failed to update token properties:', error);
        throw error;
      }
    } else {
      // Insert new properties
      const { error } = await supabase
        .from('token_erc1400_properties')
        .insert({
          ...properties,
          token_id: token.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Failed to insert token properties:', error);
        throw error;
      }
    }
    
    // Handle controllers if provided
    if (controllers && Array.isArray(controllers) && controllers.length > 0) {
      // First delete existing controllers
      await supabase
        .from('token_erc1400_controllers')
        .delete()
        .eq('token_id', token.id);
        
      // Then insert new controllers with required fields
      const dbControllers = controllers.map(controller => ({
        token_id: token.id,
        address: controller.controller_address || controller.address || '',
        permissions: controller.permissions || [],
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('token_erc1400_controllers')
        .insert(dbControllers);
        
      if (error) {
        console.error('Failed to save controllers:', error);
      }
    }
    
    // Handle partitions if provided
    if (partitions && Array.isArray(partitions) && partitions.length > 0) {
      // First delete existing partitions
      await supabase
        .from('token_erc1400_partitions')
        .delete()
        .eq('token_id', token.id);
        
      // Then insert new partitions with required fields
      const dbPartitions = partitions.map(partition => ({
        token_id: token.id,
        name: partition.name || 'default-partition',
        partition_id: partition.partition_id || 'default-id',
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('token_erc1400_partitions')
        .insert(dbPartitions);
        
      if (error) {
        console.error('Failed to save partitions:', error);
      }
    }
    
    // Handle documents if provided
    if (documents && Array.isArray(documents) && documents.length > 0) {
      // First delete existing documents
      await supabase
        .from('token_erc1400_documents')
        .delete()
        .eq('token_id', token.id);
        
      // Then insert new documents with required fields
      const dbDocuments = documents.map(document => ({
        token_id: token.id,
        name: document.name || 'Unnamed Document',
        document_uri: document.document_uri || document.uri || '',
        document_type: document.document_type || document.type || 'general',
        document_hash: document.document_hash || document.hash || null,
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('token_erc1400_documents')
        .insert(dbDocuments);
        
      if (error) {
        console.error('Failed to save documents:', error);
      }
    }
    
    return token.id;
  } catch (error) {
    console.warn('Direct mapper not available for ERC-1400, using fallback method:', error);
    
    // Extract ERC1400-specific properties
    const properties = {
      initial_supply: tokenData.initialSupply,
      cap: tokenData.cap,
      is_mintable: tokenData.isMintable,
      is_burnable: tokenData.isBurnable,
      is_pausable: tokenData.isPausable,
      document_uri: tokenData.documentUri,
      document_hash: tokenData.documentHash,
      controller_address: tokenData.controllerAddress,
      require_kyc: tokenData.requireKyc,
      security_type: tokenData.securityType,
      issuing_jurisdiction: tokenData.issuingJurisdiction,
      issuing_entity_name: tokenData.issuingEntityName,
      issuing_entity_lei: tokenData.issuingEntityLei,
      transfer_restrictions: tokenData.transferRestrictions,
      kyc_settings: tokenData.kycSettings,
      compliance_settings: tokenData.complianceSettings,
      forced_transfers: tokenData.forcedTransfers,
      issuance_modules: tokenData.issuanceModules,
      document_management: tokenData.documentManagement,
      recovery_mechanism: tokenData.recoveryMechanism
    };
    
    // Save token properties
    await saveTokenProperties(token.id, 'ERC-1400', properties);
    
    // Handle partitions if provided
    if (tokenData.partitions && Array.isArray(tokenData.partitions) && tokenData.partitions.length > 0) {
      // First delete existing partitions
      await supabase
        .from('token_erc1400_partitions')
        .delete()
        .eq('token_id', token.id);
        
      // Then insert new partitions
      const partitions = tokenData.partitions.map((partition: any, index: number) => ({
        token_id: token.id,
        name: partition.name,
        partition_id: partition.id || `partition-${index}`,
        metadata: {
          amount: partition.amount,
          partitionType: partition.partitionType
        }
      }));
      
      const { error } = await supabase
        .from('token_erc1400_partitions')
        .insert(partitions);
        
      if (error) {
        console.error('Failed to save partitions:', error);
      }
    }
    
    // Handle controllers if provided
    if (tokenData.controllers && Array.isArray(tokenData.controllers) && tokenData.controllers.length > 0) {
      // First delete existing controllers
      await supabase
        .from('token_erc1400_controllers')
        .delete()
        .eq('token_id', token.id);
        
      // Then insert new controllers
      const controllers = tokenData.controllers.map((controller: any) => ({
        token_id: token.id,
        address: typeof controller === 'string' ? controller : controller.address,
        permissions: Array.isArray(controller.permissions) ? controller.permissions : []
      }));
      
      const { error } = await supabase
        .from('token_erc1400_controllers')
        .insert(controllers);
        
      if (error) {
        console.error('Failed to save controllers:', error);
      }
    }
    
    return token.id;
  }
}

/**
 * ERC-3525 Token Services
 */
export async function saveERC3525Token(
  tokenId: string | null,
  projectId: string,
  tokenData: TokenFormData
) {
  // Save the base token data with validation
  const token = await saveTokenWithValidation(
    tokenId,
    projectId,
    tokenData,
    tokenData.config_mode === 'max' ? erc3525Schema : erc3525Schema
  );
  
  try {
    // Use the direct mapper (imported at the top of the file or loaded dynamically)
    if (!mapERC3525FormToDatabase) {
      // Try to load it if it wasn't available at the start
      mapERC3525FormToDatabase = require('../utils/mappers/erc3525/erc3525PropertyMapper').mapERC3525FormToDatabase;
    }
    
    // Use the direct mapper to convert form data to database format
    const { properties, slots, allocations } = mapERC3525FormToDatabase({
      ...tokenData,
      config_mode: tokenData.config_mode || 'min',
      tokenId: token.id
    });
    
    // Save token properties
    const { data: existingProperties, error: fetchError } = await supabase
      .from('token_erc3525_properties')
      .select()
      .eq('token_id', token.id)
      .maybeSingle();
      
    if (existingProperties) {
      // Update existing properties
      const { error } = await supabase
        .from('token_erc3525_properties')
        .update({
          ...properties,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProperties.id);
        
      if (error) {
        console.error('Failed to update token properties:', error);
        throw error;
      }
    } else {
      // Insert new properties
      const { error } = await supabase
        .from('token_erc3525_properties')
        .insert({
          ...properties,
          token_id: token.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Failed to insert token properties:', error);
        throw error;
      }
    }
    
    // Handle slots if provided
    if (slots && Array.isArray(slots) && slots.length > 0) {
      // First delete existing slots
      await supabase
        .from('token_erc3525_slots')
        .delete()
        .eq('token_id', token.id);
        
      // Then insert new slots with all required fields
      const dbSlots = slots.map(slot => ({
        token_id: token.id,
        slot_id: slot.slot_id || '0',
        name: slot.name || 'default-slot',
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('token_erc3525_slots')
        .insert(dbSlots);
        
      if (error) {
        console.error('Failed to save slots:', error);
      }
    }
    
    // Handle allocations if provided
    if (allocations && Array.isArray(allocations) && allocations.length > 0) {
      // First delete existing allocations
      await supabase
        .from('token_erc3525_allocations')
        .delete()
        .eq('token_id', token.id);
        
      // Then insert new allocations with all required fields
      const dbAllocations = allocations.map(allocation => ({
        token_id: token.id,
        slot_id: allocation.slot_id || '0',
        token_id_within_slot: allocation.token_id_within_slot || '0',
        value: allocation.value || '0',
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('token_erc3525_allocations')
        .insert(dbAllocations);
        
      if (error) {
        console.error('Failed to save allocations:', error);
      }
    }
    
    return token.id;
  } catch (error) {
    console.warn('Direct mapper not available for ERC-3525, using fallback method:', error);
    
    // Extract ERC3525-specific properties
    const properties = {
      value_decimals: tokenData.valueDecimals,
      base_uri: tokenData.baseUri,
      metadata_storage: tokenData.metadataStorage,
      slot_type: tokenData.slotType,
      is_burnable: tokenData.isBurnable,
      is_pausable: tokenData.isPausable,
      has_royalty: tokenData.hasRoyalty,
      royalty_percentage: tokenData.royaltyPercentage,
      royalty_receiver: tokenData.royaltyReceiver,
      slot_approvals: tokenData.slotApprovals,
      value_approvals: tokenData.valueApprovals,
      access_control: tokenData.accessControl,
      updatable_uris: tokenData.updatableUris,
      updatable_slots: tokenData.updatableSlots,
      value_transfers_enabled: tokenData.valueTransfersEnabled,
      sales_config: tokenData.salesConfig,
      mergable: tokenData.mergable,
      splittable: tokenData.splittable,
      slot_transfer_validation: tokenData.slotTransferValidation,
      
      // Additional fields from database schema
      dynamic_metadata: tokenData.dynamicMetadata,
      allows_slot_enumeration: tokenData.allowsSlotEnumeration,
      value_aggregation: tokenData.valueAggregation,
      permissioning_enabled: tokenData.permissioningEnabled,
      supply_tracking: tokenData.supplyTracking,
      updatable_values: tokenData.updatableValues,
      custom_extensions: tokenData.customExtensions,
      fractionalizable: tokenData.fractionalizable
    };
    
    // Save token properties
    await saveTokenProperties(token.id, 'ERC-3525', properties);
    
    // Handle slots if provided
    if (tokenData.slots && Array.isArray(tokenData.slots) && tokenData.slots.length > 0) {
      // First delete existing slots
      await supabase
        .from('token_erc3525_slots')
        .delete()
        .eq('token_id', token.id);
        
      // Then insert new slots
      const slots = tokenData.slots.map((slot: any) => ({
        token_id: token.id,
        slot_id: slot.id,
        name: slot.name,
        description: slot.description,
        metadata: {
          valueUnits: slot.valueUnits
        },
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('token_erc3525_slots')
        .insert(slots);
        
      if (error) {
        console.error('Failed to save slots:', error);
      }
    }
    
    // Handle initial allocations if provided
    if (tokenData.initialAllocations && Array.isArray(tokenData.initialAllocations) && tokenData.initialAllocations.length > 0) {
      // First delete existing allocations
      await supabase
        .from('token_erc3525_allocations')
        .delete()
        .eq('token_id', token.id);
        
      // Then insert new allocations
      const allocations = tokenData.initialAllocations.map((allocation: any) => ({
        token_id: token.id,
        slot_id: allocation.slotId,
        token_id_within_slot: allocation.tokenIdWithinSlot || allocation.tokenUnitId,
        recipient: allocation.recipient || '',
        value: allocation.value || '0',
        linked_token_id: allocation.linkedTokenId || null,
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('token_erc3525_allocations')
        .insert(allocations);
        
      if (error) {
        console.error('Failed to save allocations:', error);
      }
    }
    
    return token.id;
  }
}

/**
 * ERC-4626 Token Services
 */
export async function saveERC4626Token(
  tokenId: string | null,
  projectId: string,
  tokenData: TokenFormData
) {
  // Save the base token data with validation
  const token = await saveTokenWithValidation(
    tokenId,
    projectId,
    tokenData,
    tokenData.config_mode === TokenConfigModeEnum.MAX ? erc4626Schema : erc4626Schema
  );
  
  try {
    // Use the direct mapper (imported at the top of the file)
    const { properties, strategyParams, assetAllocations } = mapERC4626FormToDatabase({
      ...tokenData,
      config_mode: tokenData.config_mode || TokenConfigModeEnum.MIN,
      tokenId: token.id
    });
    
    // 1. Save the token properties
    const { data: existingProperties, error: fetchError } = await supabase
      .from('token_erc4626_properties')
      .select()
      .eq('token_id', token.id)
      .maybeSingle();
      
    let propertiesId = existingProperties?.id;
    
    if (existingProperties) {
      // Update existing properties
      const { error } = await supabase
        .from('token_erc4626_properties')
        .update({
          ...properties,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProperties.id);
        
      if (error) {
        console.error('Failed to update token properties:', error);
        throw error;
      }
    } else {
      // Insert new properties
      const { data, error } = await supabase
        .from('token_erc4626_properties')
        .insert({
          ...properties,
          token_id: token.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Failed to insert token properties:', error);
        throw error;
      }
      
      propertiesId = data.id;
    }
    
    // Handle strategy parameters if provided
    if (strategyParams && Array.isArray(strategyParams) && strategyParams.length > 0) {
      // First delete existing strategy parameters
      await supabase
        .from('token_erc4626_strategy_params')
        .delete()
        .eq('token_id', token.id);
        
      // Then insert new strategy parameters with required fields
      const dbStrategyParams = strategyParams.map(param => ({
        token_id: token.id,
        name: param.strategyType || 'parameter',
        value: JSON.stringify(param.allocation) || '',
        created_at: new Date().toISOString(),
      }));
      
      const { error } = await supabase
        .from('token_erc4626_strategy_params')
        .insert(dbStrategyParams);
        
      if (error) {
        console.error('Failed to save strategy parameters:', error);
      }
    }
    
    // Handle asset allocations if provided
    if (assetAllocations && Array.isArray(assetAllocations) && assetAllocations.length > 0) {
      // First delete existing asset allocations
      await supabase
        .from('token_erc4626_asset_allocations')
        .delete()
        .eq('token_id', token.id);
        
      // Then insert new asset allocations with required fields
      const dbAssetAllocations = assetAllocations.map(allocation => ({
        token_id: token.id,
        asset: allocation.assetType || 'default-asset',
        percentage: allocation.percentage || '0',
        created_at: new Date().toISOString(),
      }));
      
      const { error } = await supabase
        .from('token_erc4626_asset_allocations')
        .insert(dbAssetAllocations);
        
      if (error) {
        console.error('Failed to save asset allocations:', error);
      }
    }
    
    // Return the token ID
    return token.id;
  } catch (error) {
    console.error('Error in ERC4626 direct mapper, falling back to adapter approach:', error);
    
    // Fallback to adapter approach
    // Get the adapter for this token standard
    const adapter = getFormToPropertiesAdapter(standardToEnum('ERC-4626'));
    
    if (!adapter) {
      throw new Error('No adapter found for ERC-4626');
    }
    
    // Convert form data to properties format
    const properties = adapter(tokenData);
    
    // Save token properties
    const { data: existingProperties, error: fetchError } = await supabase
      .from('token_erc4626_properties')
      .select()
      .eq('token_id', token.id)
      .maybeSingle();
      
    if (existingProperties) {
      // Update existing properties
      await supabase
        .from('token_erc4626_properties')
        .update({
          ...properties,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProperties.id);
    } else {
      // Insert new properties
      await supabase
        .from('token_erc4626_properties')
        .insert({
          ...properties,
          token_id: token.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
    
    // Return the token ID
    return token.id;
  }
}

/**
 * Save a token based on its standard
 */
export async function saveStandardToken(
  tokenId: string | null,
  projectId: string,
  tokenData: TokenFormData
) {
  switch (tokenData.standard) {
    case 'ERC-20':
      return await saveERC20Token(tokenId, projectId, tokenData);
    case 'ERC-721':
      return await saveERC721Token(tokenId, projectId, tokenData);
    case 'ERC-1155':
      return await saveERC1155Token(tokenId, projectId, tokenData);
    case 'ERC-1400':
      return await saveERC1400Token(tokenId, projectId, tokenData);
    case 'ERC-3525':
      return await saveERC3525Token(tokenId, projectId, tokenData);
    case 'ERC-4626':
      return await saveERC4626Token(tokenId, projectId, tokenData);
    default:
      throw new Error(`Unsupported token standard: ${tokenData.standard}`);
  }
}

/**
 * Get token data with standard-specific properties
 */
export async function getTokenWithProperties(tokenId: string) {
  if (!tokenId) {
    throw new Error('Token ID is required to fetch token details');
  }

  // First get the base token data
  const { data: token, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('id', tokenId)
    .single();

  if (error) {
    throw new Error(`Failed to get token: ${error.message}`);
  }

  if (!token) {
    throw new Error(`Token with ID ${tokenId} not found`);
  }

  // Determine which view to use based on the token standard
  const viewName = `token_${token.standard.toLowerCase().replace('-', '')}_view`;
  
  // Get the token with its properties from the appropriate view
  const { data: tokenWithProperties, error: viewError } = await supabase
    .from(viewName as any)
    .select('*')
    .eq('id', tokenId)
    .single();

  if (viewError) {
    console.warn(`Failed to get token properties from view: ${viewError.message}`);
    return token; // Return the base token data if we can't get the properties
  }

  return tokenWithProperties;
}