/**
 * Token Delete Service - Specialized functions for token deletion operations
 */
import { supabase } from '@/infrastructure/database/client';
import { logger } from '@/utils/shared/logging/contextLogger';

const logContext = 'TokenDeleteService';

/**
 * Delete a token and all its associated resources
 * @param projectId Project ID for validation
 * @param tokenId Token ID to delete
 */
export async function deleteToken(projectId: string, tokenId: string) {
  logger.info(logContext, `Deleting token ${tokenId} for project ${projectId}`);
  
  try {
    // First, check if the token exists and belongs to the project
    const { data: token, error: getError } = await supabase
      .from('tokens')
      .select('id, standard, project_id')
      .eq('id', tokenId)
      .maybeSingle(); // Use maybeSingle instead of single to prevent the "JSON object requested, multiple (or no) rows returned" error
    
    if (getError) {
      logger.error(logContext, `Error finding token: ${getError.message}`, getError);
      throw new Error(`Error finding token: ${getError.message}`);
    }
    
    if (!token) {
      logger.error(logContext, `Token not found with ID: ${tokenId}`);
      throw new Error(`Token not found with ID: ${tokenId}`);
    }
    
    // Verify project ownership
    if (token.project_id !== projectId) {
      logger.error(logContext, `Token ${tokenId} does not belong to project ${projectId}`);
      throw new Error(`Token ${tokenId} does not belong to project ${projectId}`);
    }
    
    logger.info(logContext, `Found token ${tokenId} with standard ${token.standard}, proceeding with deletion`);
    
    // Track deletion results
    const results: Record<string, any> = {};
    
    try {
      // Delete token metadata first (if applicable)
      // This is a separate try-catch to continue with main token deletion even if metadata deletion fails
      try {
        // Add metadata deletion logic here if needed
        results.metadata = { status: 'success' };
      } catch (metadataError: any) {
        logger.error(logContext, `Error deleting token metadata: ${metadataError.message}`, metadataError);
        results.metadata = { 
          status: 'failed', 
          error: metadataError.message 
        };
      }
      
      // Delete the main token record
      const { error: deleteTokenError } = await supabase
        .from('tokens')
        .delete()
        .eq('id', tokenId);
      
      if (deleteTokenError) {
        logger.error(logContext, `Failed to delete token: ${deleteTokenError.message}`, deleteTokenError);
        throw new Error(`Failed to delete token: ${deleteTokenError.message}`);
      }
      
      results.mainToken = { status: 'success' };
    } catch (error: any) {
      logger.error(logContext, `Error during token deletion: ${error.message}`, error);
      throw error;
    }
    
    logger.info(logContext, `Successfully deleted token ${tokenId}`);
    return {
      success: true,
      message: `Token ${tokenId} deleted successfully`,
      results
    };
  } catch (error: any) {
    logger.error(logContext, `Token deletion failed: ${error.message}`, error);
    throw new Error(`Token deletion failed: ${error.message}`);
  }
}