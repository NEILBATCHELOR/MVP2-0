/**
 * Token Batch Service - API functions for batch token operations
 */
import { supabase } from '@/infrastructure/database/client';
import { TokenFormData } from '../types';
import { createToken, updateToken, deleteToken, getToken } from './tokenService';
import { TokenStandard } from '@/types/core/centralModels';
import { Json } from '@/types/core/supabase';
import { validateBatchTokenData, getBatchValidationSummary } from './tokenDataValidation';

// Define interfaces for template and source token structures
interface TokenTemplate {
  id: string;
  name: string;
  symbol?: string;
  description?: string;
  standard: string;
  project_id: string;
  blocks: Json;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

// Results interface to avoid repeating the same structure
interface BatchOperationResult {
  success: boolean;
  results: any[];
  failed: number;
  succeeded: number;
  errors: any[];
}

/**
 * Create multiple tokens with a single operation
 * @param projectId Project ID to associate tokens with
 * @param tokensData Array of token data to create
 * @returns Results of batch creation with individual token results
 */
export async function createTokensBatch(
  projectId: string, 
  tokensData: Partial<TokenFormData>[]
): Promise<BatchOperationResult> {
  console.log(`[TokenBatchService] Creating ${tokensData.length} tokens in batch`);
  
  // Validate all tokens in the batch first
  const batchValidation = validateBatchTokenData(tokensData);
  const validationSummary = getBatchValidationSummary(batchValidation);
  
  // If pre-validation enabled and any token is invalid, reject the entire batch
  if (!validationSummary.valid) {
    console.error(`[TokenBatchService] Batch validation failed:`, validationSummary.errors);
    return {
      success: false,
      results: batchValidation.map((result, index) => ({
        index,
        data: result.tokenData,
        status: result.validation.valid ? 'valid' : 'invalid',
        errors: result.validation.errors
      })),
      failed: validationSummary.invalidCount,
      succeeded: validationSummary.validCount,
      errors: validationSummary.errors
    };
  }
  
  // Prepare result container
  const results: any[] = [];
  const errors: any[] = [];
  let succeeded = 0;
  let failed = 0;
  
  // Process each token creation sequentially
  // Note: We could use Promise.all for parallel processing, but sequential
  // is safer for database consistency and easier to track failures
  for (let i = 0; i < tokensData.length; i++) {
    const tokenData = tokensData[i];
    try {
      // Create the token using the existing service
      const result = await createToken(projectId, tokenData);
      results.push({
        index: i,
        id: result.id,
        name: result.name,
        symbol: result.symbol,
        standard: result.standard,
        status: 'success'
      });
      succeeded++;
    } catch (error: any) {
      console.error(`[TokenBatchService] Failed to create token at index ${i}:`, error);
      results.push({
        index: i,
        data: tokenData,
        status: 'failed',
        error: error.message || 'Unknown error'
      });
      errors.push({
        index: i,
        error: error
      });
      failed++;
    }
  }
  
  // Return batch operation summary
  return {
    success: failed === 0,
    results,
    failed,
    succeeded,
    errors
  };
}

/**
 * Update multiple tokens with a single operation
 * @param projectId Project ID for validation
 * @param tokensData Array of token data with IDs to update
 * @returns Results of batch update with individual token results
 */
export async function updateTokensBatch(
  projectId: string,
  tokensData: { id: string; data: Partial<TokenFormData> }[]
): Promise<BatchOperationResult> {
  console.log(`[TokenBatchService] Updating ${tokensData.length} tokens in batch`);
  
  // Prepare result container
  const results: any[] = [];
  const errors: any[] = [];
  let succeeded = 0;
  let failed = 0;
  
  // Process each token update sequentially
  for (let i = 0; i < tokensData.length; i++) {
    const { id, data } = tokensData[i];
    
    try {
      // Validate token belongs to the project
      const { data: token, error } = await supabase
        .from('tokens')
        .select('id')
        .eq('id', id)
        .eq('project_id', projectId)
        .single();
      
      if (error || !token) {
        throw new Error(`Token with ID ${id} not found in project ${projectId}`);
      }
      
      // Update the token using the existing service
      const result = await updateToken(id, data);
      results.push({
        index: i,
        id,
        status: 'success'
      });
      succeeded++;
    } catch (error: any) {
      console.error(`[TokenBatchService] Failed to update token at index ${i}:`, error);
      results.push({
        index: i,
        id,
        status: 'failed',
        error: error.message || 'Unknown error'
      });
      errors.push({
        index: i,
        id,
        error
      });
      failed++;
    }
  }
  
  // Return batch operation summary
  return {
    success: failed === 0,
    results,
    failed,
    succeeded,
    errors
  };
}

/**
 * Delete multiple tokens with a single operation
 * @param projectId Project ID for validation
 * @param tokenIds Array of token IDs to delete
 * @returns Results of batch deletion with individual token results
 */
export async function deleteTokensBatch(
  projectId: string,
  tokenIds: string[]
): Promise<BatchOperationResult> {
  console.log(`[TokenBatchService] Deleting ${tokenIds.length} tokens in batch`);
  
  // Prepare result container
  const results: any[] = [];
  const errors: any[] = [];
  let succeeded = 0;
  let failed = 0;
  
  // Process each token deletion sequentially
  for (let i = 0; i < tokenIds.length; i++) {
    const id = tokenIds[i];
    
    try {
      // Delete the token using the existing service
      const result = await deleteToken(projectId, id);
      results.push({
        index: i,
        id,
        status: 'success',
        results: result.results
      });
      succeeded++;
    } catch (error: any) {
      console.error(`[TokenBatchService] Failed to delete token at index ${i}:`, error);
      results.push({
        index: i,
        id,
        status: 'failed',
        error: error.message || 'Unknown error'
      });
      errors.push({
        index: i,
        id,
        error
      });
      failed++;
    }
  }
  
  // Return batch operation summary
  return {
    success: failed === 0,
    results,
    failed,
    succeeded,
    errors
  };
}

/**
 * Import tokens from templates with a single operation
 * @param projectId Project ID to associate tokens with
 * @param templates Array of template IDs to create tokens from
 * @returns Results of batch import with individual token results
 */
export async function importTokensFromTemplates(
  projectId: string,
  templates: { templateId: string; overrides?: Partial<TokenFormData> }[]
): Promise<BatchOperationResult> {
  console.log(`[TokenBatchService] Importing ${templates.length} tokens from templates`);
  
  // Prepare result container
  const results: any[] = [];
  const errors: any[] = [];
  let succeeded = 0;
  let failed = 0;
  
  // Process each template import sequentially
  for (let i = 0; i < templates.length; i++) {
    const { templateId, overrides = {} } = templates[i];
    
    try {
      // Get the template
      const { data: template, error } = await supabase
        .from('token_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error || !template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Safely cast the template to our interface
      const tokenTemplate = template as unknown as TokenTemplate;
      
      // Convert template.standard to TokenStandard enum if needed
      const standardValue = overrides.standard || tokenTemplate.standard;
      let tokenStandard: TokenStandard;
      
      // Handle string to TokenStandard conversion
      switch (standardValue) {
        case 'ERC-20':
          tokenStandard = TokenStandard.ERC20;
          break;
        case 'ERC-721':
          tokenStandard = TokenStandard.ERC721;
          break;
        case 'ERC-1155':
          tokenStandard = TokenStandard.ERC1155;
          break;
        case 'ERC-1400':
          tokenStandard = TokenStandard.ERC1400;
          break;
        case 'ERC-3525':
          tokenStandard = TokenStandard.ERC3525;
          break;
        case 'ERC-4626':
          tokenStandard = TokenStandard.ERC4626;
          break;
        default:
          // If it's already a TokenStandard enum, use it directly
          tokenStandard = standardValue as TokenStandard;
      }
      
      // Merge template with overrides
      const tokenData: Partial<TokenFormData> = {
        name: overrides.name || tokenTemplate.name,
        symbol: overrides.symbol || tokenTemplate.symbol,
        description: overrides.description || tokenTemplate.description,
        standard: tokenStandard,
        blocks: {
          ...(typeof tokenTemplate.blocks === 'object' ? tokenTemplate.blocks : {}),
          ...(overrides.blocks || {})
        },
        metadata: {
          ...(typeof tokenTemplate.metadata === 'object' ? tokenTemplate.metadata : {}),
          ...(overrides.metadata || {}),
          imported_from_template: templateId
        },
        // Include any standard-specific properties from overrides
        ...(overrides.standardProperties ? { standardProperties: overrides.standardProperties } : {}),
        ...(overrides.standardArrays ? { standardArrays: overrides.standardArrays } : {})
      };
      
      // Create the token
      const result = await createToken(projectId, tokenData);
      results.push({
        index: i,
        id: result.id,
        templateId,
        status: 'success'
      });
      succeeded++;
    } catch (error: any) {
      console.error(`[TokenBatchService] Failed to import from template at index ${i}:`, error);
      results.push({
        index: i,
        templateId,
        status: 'failed',
        error: error.message || 'Unknown error'
      });
      errors.push({
        index: i,
        templateId,
        error
      });
      failed++;
    }
  }
  
  // Return batch operation summary
  return {
    success: failed === 0,
    results,
    failed,
    succeeded,
    errors
  };
}

/**
 * Clone existing tokens with optional modifications
 * @param projectId Project ID to associate tokens with
 * @param cloneRequests Array of token IDs to clone with optional modifications
 * @returns Results of batch cloning with individual token results
 */
export async function cloneTokensBatch(
  projectId: string,
  cloneRequests: { sourceTokenId: string; modifications?: Partial<TokenFormData> }[]
): Promise<BatchOperationResult> {
  console.log(`[TokenBatchService] Cloning ${cloneRequests.length} tokens`);
  
  // Prepare result container
  const results: any[] = [];
  const errors: any[] = [];
  let succeeded = 0;
  let failed = 0;
  
  // Process each clone request sequentially
  for (let i = 0; i < cloneRequests.length; i++) {
    const { sourceTokenId, modifications = {} } = cloneRequests[i];
    
    try {
      // Get the source token with all its data
      const sourceToken = await getToken(sourceTokenId);
      
      if (!sourceToken) {
        throw new Error(`Source token with ID ${sourceTokenId} not found`);
      }
      
      // Convert sourceToken.standard to TokenStandard enum if needed
      const standardValue = modifications.standard || sourceToken.standard;
      let tokenStandard: TokenStandard;
      
      // Handle string to TokenStandard conversion
      switch (standardValue) {
        case 'ERC-20':
          tokenStandard = TokenStandard.ERC20;
          break;
        case 'ERC-721':
          tokenStandard = TokenStandard.ERC721;
          break;
        case 'ERC-1155':
          tokenStandard = TokenStandard.ERC1155;
          break;
        case 'ERC-1400':
          tokenStandard = TokenStandard.ERC1400;
          break;
        case 'ERC-3525':
          tokenStandard = TokenStandard.ERC3525;
          break;
        case 'ERC-4626':
          tokenStandard = TokenStandard.ERC4626;
          break;
        default:
          // If it's already a TokenStandard enum, use it directly
          tokenStandard = standardValue as TokenStandard;
      }
      
      // Get description from metadata if it's not directly on the source token
      const sourceDescription = typeof sourceToken.metadata === 'object' && 
                              sourceToken.metadata !== null && 
                              'description' in sourceToken.metadata ? 
                              String(sourceToken.metadata.description) : '';
      
      // Prepare clone data by merging source token with modifications
      const cloneData: Partial<TokenFormData> = {
        name: modifications.name || `${sourceToken.name} (Clone)`,
        symbol: modifications.symbol || sourceToken.symbol,
        description: modifications.description || sourceDescription,
        standard: tokenStandard,
        decimals: modifications.decimals ?? sourceToken.decimals,
        blocks: {
          ...(typeof sourceToken.blocks === 'object' ? sourceToken.blocks : {}),
          ...(modifications.blocks || {})
        },
        metadata: {
          ...(typeof sourceToken.metadata === 'object' ? sourceToken.metadata : {}),
          ...(modifications.metadata || {}),
          cloned_from: sourceTokenId,
          cloned_at: new Date().toISOString()
        },
        // Allow overriding standard-specific fields
        ...(modifications.standardProperties ? { standardProperties: modifications.standardProperties } : {}),
        ...(modifications.standardArrays ? { standardArrays: modifications.standardArrays } : {})
      };
      
      // Create the cloned token
      const result = await createToken(projectId, cloneData);
      results.push({
        index: i,
        id: result.id,
        sourceTokenId,
        status: 'success'
      });
      succeeded++;
    } catch (error: any) {
      console.error(`[TokenBatchService] Failed to clone token at index ${i}:`, error);
      results.push({
        index: i,
        sourceTokenId,
        status: 'failed',
        error: error.message || 'Unknown error'
      });
      errors.push({
        index: i,
        sourceTokenId,
        error
      });
      failed++;
    }
  }
  
  // Return batch operation summary
  return {
    success: failed === 0,
    results,
    failed,
    succeeded,
    errors
  };
}

/**
 * Perform batch token status updates
 * @param projectId Project ID for validation
 * @param statusUpdates Array of token IDs and new statuses
 * @returns Results of batch status update with individual token results
 */
export async function updateTokenStatusBatch(
  projectId: string,
  statusUpdates: { tokenId: string; status: string }[]
): Promise<BatchOperationResult> {
  console.log(`[TokenBatchService] Updating status for ${statusUpdates.length} tokens`);
  
  // Prepare result container
  const results: any[] = [];
  const errors: any[] = [];
  let succeeded = 0;
  let failed = 0;
  
  // Process each status update sequentially
  for (let i = 0; i < statusUpdates.length; i++) {
    const { tokenId, status } = statusUpdates[i];
    
    try {
      // Validate token belongs to the project
      const { data: token, error } = await supabase
        .from('tokens')
        .select('id')
        .eq('id', tokenId)
        .eq('project_id', projectId)
        .single();
      
      if (error || !token) {
        throw new Error(`Token with ID ${tokenId} not found in project ${projectId}`);
      }
      
      // Update token status
      const { data: updatedToken, error: updateError } = await supabase
        .from('tokens')
        .update({ status: status as any })
        .eq('id', tokenId)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Failed to update token status: ${updateError.message}`);
      }
      
      results.push({
        index: i,
        tokenId,
        status: 'success',
        newStatus: status
      });
      succeeded++;
    } catch (error: any) {
      console.error(`[TokenBatchService] Failed to update token status at index ${i}:`, error);
      results.push({
        index: i,
        tokenId,
        status: 'failed',
        error: error.message || 'Unknown error'
      });
      errors.push({
        index: i,
        tokenId,
        error
      });
      failed++;
    }
  }
  
  // Return batch operation summary
  return {
    success: failed === 0,
    results,
    failed,
    succeeded,
    errors
  };
} 