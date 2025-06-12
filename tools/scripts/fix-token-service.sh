#!/bin/bash

# Script to directly fix the tokenService.ts syntax errors

echo "Fixing tokenService.ts syntax errors..."

# Create backup directory
BACKUP_DIR="backups/token-fixes-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup the current file
cp src/services/token/tokenService.ts "$BACKUP_DIR/tokenService.ts"
echo "Created backup at $BACKUP_DIR/tokenService.ts"

# Create the fixed version
cat > src/services/token/tokenService.ts << 'EOL'
import { supabase } from '@/infrastructure/supabase';
import { TokenFormData, TokenApiResponse, DeployedToken } from '@/components/tokens/types';
import { TokenConfig, ERC20Config, ERC721Config, ERC1155Config, ERC1400Config, ERC3525Config, ERC4626Config } from '@/components/tokens/config/types';
import type { InsertTables, UpdateTables } from '@/types/database';
import type { Json } from '@/types/supabase';
import { TokenStatus } from '@/types/centralModels';
import { 
  transformTokenToDb, 
  transformTokenFromDb,
  formatStandardForDB
} from './transformers';
import { validateTokenConfig } from './validators';

// Type definitions
type TokenInsert = InsertTables<'tokens'>;
type TokenUpdate = UpdateTables<'tokens'>;

/**
 * Get all tokens with optional filtering
 */
export async function getTokens(options?: { projectId?: string }): Promise<TokenApiResponse> {
  try {
    let query = supabase.from('tokens').select('*');
    
    // Apply filters if provided
    if (options?.projectId) {
      query = query.eq('project_id', options.projectId);
    }
    
    // Execute query with ordering
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Transform results to application format
    const tokens = data.map(transformTokenFromDb);

    return {
      success: true,
      data: tokens
    };
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get a single token by ID
 */
export async function getTokenById(tokenId: string): Promise<TokenApiResponse> {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Token with ID ${tokenId} not found`);

    return {
      success: true,
      data: transformTokenFromDb(data)
    };
  } catch (error) {
    console.error('Error fetching token by ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Create a new token with standard-specific validation
 */
export async function createToken(tokenData: TokenFormData): Promise<TokenApiResponse> {
  try {
    // Validate token data based on standard
    const validationResult = validateTokenConfig(tokenData);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: `Invalid token configuration: ${validationResult.errors.join(', ')}`
      };
    }
    
    // Transform to database format
    const dbToken = transformTokenToDb(tokenData);
    
    // Use provided ID if available
    const insertData: TokenInsert = tokenData.id 
      ? { ...dbToken, id: tokenData.id } 
      : dbToken;
    
    const { data, error } = await supabase
      .from('tokens')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: transformTokenFromDb(data)
    };
  } catch (error) {
    console.error('Error creating token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create token'
    };
  }
}

/**
 * Update an existing token
 */
export async function updateToken(tokenId: string, tokenData: TokenFormData): Promise<TokenApiResponse> {
  try {
    // Fetch existing token to ensure we don't lose data
    const { data: existingToken, error: fetchError } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();
    
    // If token doesn't exist, create it instead
    if (fetchError && fetchError.code === 'PGRST116' && fetchError.details === 'The result contains 0 rows') {
      console.log(`Token with ID ${tokenId} not found, creating instead of updating.`);
      return createToken({ ...tokenData, id: tokenId });
    }
    
    if (fetchError) throw fetchError;
    
    // Transform to database format while preserving existing data
    const dbToken = transformTokenToDb(tokenData, existingToken);
    
    const { data, error } = await supabase
      .from('tokens')
      .update(dbToken)
      .eq('id', tokenId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: transformTokenFromDb(data)
    };
  } catch (error) {
    console.error('Error updating token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update token'
    };
  }
}

/**
 * Delete a token by ID
 */
export async function deleteToken(tokenId: string): Promise<TokenApiResponse> {
  try {
    const { error } = await supabase
      .from('tokens')
      .delete()
      .eq('id', tokenId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete token'
    };
  }
}

/**
 * Update token deployment information
 */
export async function updateTokenDeployment(
  tokenId: string, 
  deploymentData: Partial<DeployedToken>
): Promise<TokenApiResponse> {
  try {
    // Get the existing token
    const { data: existingToken, error: fetchError } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Safely handle metadata object
    const existingMetadata = typeof existingToken.metadata === 'object' ? existingToken.metadata : {};
    const existingDeployment = existingMetadata?.deployment || {};
    
    // Update metadata with deployment info
    const metadata = {
      ...existingMetadata,
      deployment: {
        ...existingDeployment,
        address: deploymentData.deploymentAddress,
        network: deploymentData.deploymentNetwork,
        txHash: deploymentData.deploymentTxHash,
        timestamp: deploymentData.deploymentTimestamp || new Date().toISOString(),
        verified: deploymentData.contractVerified
      }
    };
    
    // Update the token
    const { data, error } = await supabase
      .from('tokens')
      .update({ metadata })
      .eq('id', tokenId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: transformTokenFromDb(data)
    };
  } catch (error) {
    console.error('Error updating token deployment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update token deployment'
    };
  }
}

/**
 * Update verification status
 */
export async function updateVerificationStatus(
  tokenId: string,
  verified: boolean
): Promise<TokenApiResponse> {
  try {
    // Get the existing token
    const { data: existingToken, error: fetchError } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Safely handle metadata object
    const existingMetadata = typeof existingToken.metadata === 'object' ? existingToken.metadata : {};
    const existingDeployment = existingMetadata?.deployment || {};
    
    // Update metadata with verification status
    const metadata = {
      ...existingMetadata,
      deployment: {
        ...existingDeployment,
        verified
      }
    };
    
    // Update the token
    const { data, error } = await supabase
      .from('tokens')
      .update({ metadata })
      .eq('id', tokenId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: transformTokenFromDb(data)
    };
  } catch (error) {
    console.error('Error updating verification status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update verification status'
    };
  }
}
EOL

echo "Fixed tokenService.ts successfully"
echo "Run 'npx tsc --noEmit' to verify the fix"