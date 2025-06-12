/**
 * Token Update Service - Handles updating tokens and their properties
 */
import { supabase } from '@/infrastructure/database/client';
import { TokenFormData, EnhancedTokenData } from '../types';
import { TokenUpdate } from '@/types/core/database';
import { TokenStandard } from '@/types/core/centralModels';
import { getEnhancedTokenData } from './tokenDataService';

/**
 * Update a token and its standard-specific properties
 * @param tokenId The ID of the token to update
 * @param tokenData The token data to update
 * @returns The updated token data
 */
export async function updateToken(tokenId: string, tokenData: Partial<TokenFormData | EnhancedTokenData>) {
  console.log('[TokenUpdateService] Updating token with data:', JSON.stringify(tokenData, null, 2));
  
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
    console.log(`[TokenUpdateService] Updating token with standard: ${standard}`);
    
    // 2. Prepare main token data for update
    const tokenUpdate: TokenUpdate = {
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
    };

    // Add blocks if provided
    if (tokenData.blocks) {
      tokenUpdate.blocks = tokenData.blocks;
    }

    // Update metadata if provided
    if (tokenData.description || (existingToken.metadata && typeof existingToken.metadata === 'object')) {
      tokenUpdate.metadata = {
        ...(existingToken.metadata as Record<string, any> || {}),
        ...(tokenData.description ? { description: tokenData.description } : {})
      };
    }

    // Add total_supply if provided
    const formData = tokenData as TokenFormData;
    if (formData.initialSupply || tokenData.totalSupply) {
      tokenUpdate.total_supply = formData.initialSupply || tokenData.totalSupply;
    }

    // Set total_supply equal to cap when cap is greater than 0
    if (formData.standardProperties?.cap && 
        typeof formData.standardProperties.cap === 'string' && 
        parseFloat(formData.standardProperties.cap) > 0) {
      tokenUpdate.total_supply = formData.standardProperties.cap;
    }
    
    // Update config_mode if provided
    if (tokenData.configMode) {
      tokenUpdate.config_mode = tokenData.configMode;
    }

    console.log(`[TokenUpdateService] Updating main token record with:`, tokenUpdate);

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
    
    console.log(`[TokenUpdateService] Main token record updated successfully`);
    
    // 4. Update standard-specific properties based on the token standard
    let standardPropertiesResult = null;
    
    // Check if we're processing a form submission with tokenPropertiesData.formData
    if (formData.tokenPropertiesData?.formData && formData.tokenPropertiesData.standard === 'ERC-20') {
      // For now, treat this as regular standard properties
      console.log(`[TokenUpdateService] Processing ERC20 form data as standard properties`);
      standardPropertiesResult = await updateStandardProperties(
        TokenStandard.ERC20,
        tokenId,
        formData.tokenPropertiesData.formData
      );
    }
    // Handle traditional standardProperties object
    else if (formData.standardProperties) {
      console.log(`[TokenUpdateService] Updating standard properties for ${standard}`);
      standardPropertiesResult = await updateStandardProperties(
        standard as TokenStandard,
        tokenId,
        formData.standardProperties
      );
    }
    
    // 5. Update standard-specific arrays if provided
    let standardArraysResult = null;
    if (formData.standardArrays) {
      console.log(`[TokenUpdateService] Updating standard arrays for ${standard}`);
      standardArraysResult = await updateStandardArrays(
        standard as TokenStandard,
        tokenId,
        formData.standardArrays
      );
    }
    
    // Create update results container
    const updateResults = {
      mainToken: { status: 'success', id: updatedToken.id },
      standardProperties: standardPropertiesResult || { status: 'not_updated' },
      arrayData: standardArraysResult || { status: 'not_updated' }
    };
    
    console.log(`[TokenUpdateService] Token update completed with results:`, updateResults);
    
    // Return the full token data with results
    return {
      ...updatedToken,
      updateResults
    };
  } catch (error: any) {
    console.error('[TokenUpdateService] Token update failed:', error);
    throw new Error(`Token update failed: ${error.message}`);
  }
}

/**
 * Update standard-specific properties for a token
 * @param standard The token standard
 * @param tokenId The token ID
 * @param properties The properties to update
 * @returns The result of the update operation
 */
async function updateStandardProperties(
  standard: TokenStandard,
  tokenId: string,
  properties: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const standardTable = getStandardSpecificTable(standard);
    if (!standardTable) {
      return { 
        status: 'failed', 
        error: `Unsupported token standard: ${standard}` 
      };
    }

    console.log(`[TokenUpdateService] Updating ${standard} properties for token ${tokenId}`);
    
    // 1. Check if a token property record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from(standardTable as any)
      .select('id')
      .eq('token_id', tokenId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error if no record
      
    const recordExists = existingRecord !== null;
    
    // Use our improved mapper if available for this standard
    let propertyRecord: Record<string, any>;
    
    // Default for all standards - add token_id
    propertyRecord = {
      token_id: tokenId,
      ...properties
    };
    
    // Sanitize the property record to ensure boolean values are correctly formatted
    // This prevents issues with PostgreSQL boolean type conversions
    for (const [key, value] of Object.entries(propertyRecord)) {
      if (typeof value === 'boolean') {
        propertyRecord[key] = value;
      } else if (value === 'true' || value === 'false') {
        propertyRecord[key] = value === 'true';
      } else if (key.startsWith('is_') || key.startsWith('has_') || key.startsWith('enable')) {
        // For fields that are likely booleans, ensure they're properly typed
        if (value === undefined || value === null) {
          propertyRecord[key] = false;
        } else if (typeof value !== 'boolean') {
          propertyRecord[key] = Boolean(value);
        }
      }
    }
    
    console.log(`[TokenUpdateService] ${recordExists ? 'Updating' : 'Inserting'} ${standardTable} record:`, JSON.stringify(propertyRecord, null, 2));
    
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
      console.error(`[TokenUpdateService] Failed to ${recordExists ? 'update' : 'insert'} ${standardTable} record:`, propertiesError);
      return { status: 'failed', error: propertiesError.message };
    } else {
      console.log(`[TokenUpdateService] ${recordExists ? 'Updated' : 'Inserted'} ${standardTable} record:`, propertiesData);
      return { status: 'success', data: propertiesData };
    }
  } catch (error: any) {
    console.error('[TokenUpdateService] Failed to update standard-specific properties:', error);
    return { status: 'failed', error: error.message };
  }
}

/**
 * Update standard-specific array data for a token
 * @param standard The token standard
 * @param tokenId The token ID
 * @param arrays The array data to update
 * @returns The result of the update operation
 */
async function updateStandardArrays(
  standard: TokenStandard,
  tokenId: string,
  arrays: Record<string, any[]>
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  
  try {
    // Map standard-specific array tables
    const arrayTables = getStandardArrayTables(standard);
    
    // Process each array type
    for (const [arrayType, items] of Object.entries(arrays)) {
      if (!items || !Array.isArray(items) || items.length === 0) {
        results[arrayType] = { status: 'skipped', reason: 'empty_array' };
        continue;
      }
      
      const tableName = arrayTables[arrayType];
      if (!tableName) {
        console.warn(`[TokenUpdateService] Unknown array type '${arrayType}' for standard ${standard}`);
        results[arrayType] = { status: 'skipped', reason: 'unknown_array_type' };
        continue;
      }
      
      results[arrayType] = { status: 'pending', count: items.length };
      
      try {
        // 1. First, delete existing records for this token
        const { error: deleteError } = await supabase
          .from(tableName as any)
          .delete()
          .eq('token_id', tokenId);
          
        if (deleteError) {
          console.error(`[TokenUpdateService] Failed to delete existing ${tableName} records:`, deleteError);
          results[arrayType] = { 
            status: 'failed', 
            error: deleteError.message,
            phase: 'delete_existing'
          };
          continue;
        }
        
        // If there are no items to insert, we're done
        if (items.length === 0) {
          results[arrayType] = { status: 'success', count: 0 };
          continue;
        }
        
        // 2. Now insert the new records
        const records = prepareArrayRecords(standard, tableName, tokenId, items);
        
        console.log(`[TokenUpdateService] Inserting ${records.length} ${tableName} records`);
        
        const { data, error } = await supabase
          .from(tableName as any)
          .insert(records);
          
        if (error) {
          console.error(`[TokenUpdateService] Failed to insert ${tableName} records:`, error);
          results[arrayType] = { 
            status: 'failed', 
            error: error.message,
            phase: 'insert_new'
          };
        } else {
          console.log(`[TokenUpdateService] Successfully inserted ${records.length} ${tableName} records`);
          results[arrayType] = { 
            status: 'success', 
            count: records.length
          };
        }
      } catch (error: any) {
        console.error(`[TokenUpdateService] Error processing ${arrayType}:`, error);
        results[arrayType] = { 
          status: 'failed', 
          error: error.message
        };
      }
    }
    
    return {
      status: 'completed',
      results
    };
  } catch (error: any) {
    console.error('[TokenUpdateService] Failed to update standard arrays:', error);
    return { 
      status: 'failed', 
      error: error.message,
      results
    };
  }
}

/**
 * Get the table name for a specific token standard
 */
function getStandardSpecificTable(standard: TokenStandard): string | null {
  switch (standard) {
    case TokenStandard.ERC20:
      return 'token_erc20_properties';
    case TokenStandard.ERC721:
      return 'token_erc721_properties';
    case TokenStandard.ERC1155:
      return 'token_erc1155_properties';
    case TokenStandard.ERC1400:
      return 'token_erc1400_properties';
    case TokenStandard.ERC3525:
      return 'token_erc3525_properties';
    case TokenStandard.ERC4626:
      return 'token_erc4626_properties';
    default:
      console.warn(`[TokenUpdateService] No specific table for standard: ${standard}`);
      return null;
  }
}

/**
 * Get the array tables for a specific token standard
 */
function getStandardArrayTables(standard: TokenStandard): Record<string, string> {
  switch (standard) {
    case TokenStandard.ERC721:
      return {
        erc721Attributes: 'token_erc721_attributes'
      };
    case TokenStandard.ERC1155:
      return {
        erc1155Types: 'token_erc1155_types',
        erc1155Balances: 'token_erc1155_balances',
        erc1155UriMappings: 'token_erc1155_uri_mappings'
      };
    case TokenStandard.ERC1400:
      return {
        erc1400Partitions: 'token_erc1400_partitions',
        erc1400Controllers: 'token_erc1400_controllers'
      };
    case TokenStandard.ERC3525:
      return {
        erc3525Slots: 'token_erc3525_slots',
        erc3525Allocations: 'token_erc3525_allocations'
      };
    case TokenStandard.ERC4626:
      return {
        erc4626StrategyParams: 'token_erc4626_strategy_params',
        erc4626AssetAllocations: 'token_erc4626_asset_allocations'
      };
    default:
      return {};
  }
}

/**
 * Prepare array records for insertion
 */
function prepareArrayRecords(
  standard: TokenStandard,
  tableName: string,
  tokenId: string,
  items: any[]
): any[] {
  // Ensure all items have the token_id field
  const records = items.map(item => {
    // Convert camelCase keys to snake_case for database
    const record: Record<string, any> = { token_id: tokenId };
    
    // Process each property in the item
    for (const [key, value] of Object.entries(item)) {
      if (key === 'tokenId' || key === 'token_id') continue; // Skip tokenId as we already set it
      
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      
      // Handle special cases for different value types
      if (key === 'metadata' && typeof value === 'object') {
        // Ensure metadata is properly formatted for JSON storage
        record[snakeKey] = value;
      } else if (key === 'permissions' && Array.isArray(value)) {
        // Ensure permissions array is properly formatted
        record[snakeKey] = value;
      } else {
        record[snakeKey] = value;
      }
    }
    
    // Special handling for specific tables
    if (tableName === 'token_erc721_attributes') {
      // Ensure trait_type and values are set
      if (item.traitType) record.trait_type = item.traitType;
      if (item.values) record.values = item.values;
    } else if (tableName === 'token_erc1155_types') {
      // Ensure token_type_id is set
      if (item.tokenTypeId) record.token_type_id = item.tokenTypeId;
      else if (!record.token_type_id) record.token_type_id = `type_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Ensure metadata is properly formatted
      if (item.metadata && typeof item.metadata === 'object') {
        record.metadata = item.metadata;
      } else if (!record.metadata) {
        record.metadata = {};
      }
    } else if (tableName === 'token_erc1155_balances') {
      // Ensure token_type_id and address are set
      if (item.tokenTypeId) record.token_type_id = item.tokenTypeId;
      if (item.address) record.address = item.address;
    } else if (tableName === 'token_erc1155_uri_mappings') {
      // Ensure token_type_id and uri are set
      if (item.tokenTypeId) record.token_type_id = item.tokenTypeId;
      if (item.uri) record.uri = item.uri;
    } else if (tableName === 'token_erc1400_partitions') {
      // Ensure partition_id is set
      if (item.partitionId) record.partition_id = item.partitionId;
      else if (!record.partition_id) {
        // Create a partition_id from the name if not provided
        const name = item.name || `Partition ${Date.now()}`;
        record.partition_id = name.toLowerCase().replace(/\s+/g, '_');
      }
      
      // Ensure metadata is properly formatted
      if (item.metadata && typeof item.metadata === 'object') {
        record.metadata = item.metadata;
      } else if (!record.metadata) {
        record.metadata = {};
      }
    } else if (tableName === 'token_erc1400_controllers') {
      // Ensure address and permissions are set
      if (item.address) record.address = item.address;
      if (item.permissions && Array.isArray(item.permissions)) {
        record.permissions = item.permissions;
      } else if (!record.permissions) {
        record.permissions = ["ADMIN"]; // Default permission
      }
    } else if (tableName === 'token_erc3525_slots') {
      // Ensure slot_id is set
      if (item.slotId) record.slot_id = item.slotId;
      else if (!record.slot_id) record.slot_id = `slot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    return record;
  });
  
  return records;
}

/**
 * Re-export getEnhancedTokenData from tokenDataService
 */
export { getEnhancedTokenData };

/**
 * Fetch a token by ID
 */
export async function fetchTokenById(tokenId: string) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('id', tokenId)
    .single();
    
  if (error) {
    throw new Error(`Failed to fetch token: ${error.message}`);
  }
  
  return data;
}

/**
 * Validate token update data to ensure it's properly formatted
 * @param tokenData The token data to validate
 * @returns The validated token data
 */
export function validateTokenUpdateData(tokenData: Partial<TokenFormData | EnhancedTokenData>): Partial<TokenFormData | EnhancedTokenData> {
  // Create a copy of the data to avoid mutating the original
  const validatedData = { ...tokenData };
  
  // Ensure decimal values are numbers
  if (validatedData.decimals !== undefined) {
    validatedData.decimals = Number(validatedData.decimals);
  }
  
  // Handle ERC1155 specific properties
  if (validatedData.standard === 'ERC-1155' && validatedData.erc1155Properties) {
    validateERC1155Properties(validatedData.erc1155Properties);
  }
  
  // Handle direct standardProperties (from form data)
  const formData = validatedData as Partial<TokenFormData>;
  if (formData.standardProperties) {
    // Convert string booleans to actual booleans
    for (const [key, value] of Object.entries(formData.standardProperties)) {
      if (value === 'true') formData.standardProperties[key] = true;
      if (value === 'false') formData.standardProperties[key] = false;
      
      // Handle nested objects for configs with the "enabled" pattern
      if (
        key.includes('_config') || 
        key.includes('_restrictions') || 
        key.includes('_limits')
      ) {
        // If it's a boolean, convert to enabled object
        if (typeof value === 'boolean' && value === true) {
          formData.standardProperties[key] = { enabled: true, config: {} };
        } 
        // If it's already an object but missing config, add empty config
        else if (value && typeof value === 'object' && (value as any).enabled === true && !(value as any).config) {
          formData.standardProperties[key] = {
            ...value,
            config: {}
          };
        }
      }
    }
    
    // Special handling for ERC1155 properties
    if (formData.standard === 'ERC-1155') {
      validateERC1155Properties(formData.standardProperties);
    }
  }
  
  return validatedData;
}

/**
 * Helper function to validate and fix ERC1155 properties
 * @param properties The ERC1155 properties to validate
 */
function validateERC1155Properties(properties: Record<string, any>): void {
  // Ensure all config objects have proper structure
  const configFields = [
    'container_config',
    'batch_minting_config',
    'dynamic_uri_config',
    'transfer_restrictions',
    'batch_transfer_limits'
  ];
  
  console.log('[validateERC1155Properties] Validating ERC1155 properties:', JSON.stringify(properties, null, 2));
  
  // Fix standard config objects
  configFields.forEach(field => {
    if (properties[field] === true) {
      // Convert boolean true to proper config object
      properties[field] = { enabled: true, config: {} };
    } else if (properties[field] && typeof properties[field] === 'object') {
      // Ensure the object has enabled property
      if (properties[field].enabled === undefined) {
        properties[field].enabled = true;
      }
      
      // Ensure the object has config property
      if (!properties[field].config) {
        properties[field].config = {};
      }
    } else if (properties[field] === false || properties[field] === null) {
      // Standardize falsy values to null
      properties[field] = null;
    }
  });
  
  // Special handling for batch_transfer_limits
  if (properties.batch_transfer_limits && typeof properties.batch_transfer_limits === 'object') {
    const limits = properties.batch_transfer_limits;
    
    // Ensure max_tokens_per_transfer is present
    if (limits.enabled === true && !limits.max_tokens_per_transfer) {
      // Convert camelCase if present, otherwise use default
      if (limits.maxTokensPerTransfer) {
        limits.max_tokens_per_transfer = limits.maxTokensPerTransfer;
        delete limits.maxTokensPerTransfer;
      } else {
        limits.max_tokens_per_transfer = 50; // default value
      }
    }
  }
  
  console.log('[validateERC1155Properties] Validated properties:', JSON.stringify(properties, null, 2));
}