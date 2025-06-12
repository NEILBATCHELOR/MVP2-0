/**
 * Token Status Transition Service
 * Handles status transitions for tokens with workflow validation
 */
import { supabase } from '@/infrastructure/database/client';
import { TokenStatus } from '@/types/core/centralModels';
import { UnifiedTokenData } from '../display/utils/token-display-utils';

/**
 * Status transition configuration mapping
 */
export const STATUS_TRANSITIONS: Record<TokenStatus, TokenStatus[]> = {
  [TokenStatus.DRAFT]: [TokenStatus.REVIEW],
  [TokenStatus.REVIEW]: [TokenStatus.APPROVED, TokenStatus.REJECTED, TokenStatus.DRAFT],
  [TokenStatus.APPROVED]: [TokenStatus.READY_TO_MINT, TokenStatus.REVIEW],
  [TokenStatus.REJECTED]: [TokenStatus.DRAFT],
  [TokenStatus.READY_TO_MINT]: [TokenStatus.MINTED, TokenStatus.APPROVED],
  [TokenStatus.MINTED]: [TokenStatus.DEPLOYED],
  [TokenStatus.DEPLOYED]: [TokenStatus.PAUSED, TokenStatus.DISTRIBUTED],
  [TokenStatus.PAUSED]: [TokenStatus.DEPLOYED],
  [TokenStatus.DISTRIBUTED]: [] // Final status
};

/**
 * Status display names for UI
 */
export const STATUS_DISPLAY_NAMES: Record<TokenStatus, string> = {
  [TokenStatus.DRAFT]: 'Draft',
  [TokenStatus.REVIEW]: 'Under Review',
  [TokenStatus.APPROVED]: 'Approved',
  [TokenStatus.REJECTED]: 'Rejected',
  [TokenStatus.READY_TO_MINT]: 'Ready to Mint',
  [TokenStatus.MINTED]: 'Minted',
  [TokenStatus.DEPLOYED]: 'Deployed',
  [TokenStatus.PAUSED]: 'Paused',
  [TokenStatus.DISTRIBUTED]: 'Distributed'
};

/**
 * Status descriptions for tooltips
 */
export const STATUS_DESCRIPTIONS: Record<TokenStatus, string> = {
  [TokenStatus.DRAFT]: 'Token is being configured and edited',
  [TokenStatus.REVIEW]: 'Token is under review by approvers',
  [TokenStatus.APPROVED]: 'Token has been approved and is ready for minting',
  [TokenStatus.REJECTED]: 'Token has been rejected and needs revision',
  [TokenStatus.READY_TO_MINT]: 'Token is ready to be minted on blockchain',
  [TokenStatus.MINTED]: 'Token has been minted and exists on blockchain',
  [TokenStatus.DEPLOYED]: 'Token is deployed and active on blockchain',
  [TokenStatus.PAUSED]: 'Token transfers are temporarily paused',
  [TokenStatus.DISTRIBUTED]: 'Token has been distributed to holders'
};

/**
 * Get available status transitions for a given status
 */
export function getAvailableTransitions(currentStatus: TokenStatus | string): TokenStatus[] {
  const statusEnum = normalizeStatus(currentStatus);
  return STATUS_TRANSITIONS[statusEnum] || [];
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(fromStatus: TokenStatus | string, toStatus: TokenStatus | string): boolean {
  const fromStatusEnum = normalizeStatus(fromStatus);
  const toStatusEnum = normalizeStatus(toStatus);
  const availableTransitions = STATUS_TRANSITIONS[fromStatusEnum] || [];
  return availableTransitions.includes(toStatusEnum);
}

/**
 * Normalize status string to TokenStatus enum
 */
export function normalizeStatus(status: TokenStatus | string): TokenStatus {
  const statusStr = status.toString().toUpperCase().replace(/\s+/g, '_');
  
  // Handle special cases
  if (statusStr === 'UNDER_REVIEW' || statusStr === 'REVIEW') {
    return TokenStatus.REVIEW;
  }
  
  // Find matching enum value
  const enumValue = Object.values(TokenStatus).find(s => 
    s.toUpperCase().replace(/\s+/g, '_') === statusStr
  );
  
  return enumValue || TokenStatus.DRAFT;
}

/**
 * Get next logical status in the workflow
 */
export function getNextStatus(currentStatus: TokenStatus | string): TokenStatus | null {
  const statusEnum = normalizeStatus(currentStatus);
  const transitions = STATUS_TRANSITIONS[statusEnum] || [];
  
  // Return the first (primary) transition option
  return transitions.length > 0 ? transitions[0] : null;
}

/**
 * Get status workflow position (for progress indication)
 */
export function getStatusPosition(status: TokenStatus | string): number {
  const statusEnum = normalizeStatus(status);
  const workflow = [
    TokenStatus.DRAFT,
    TokenStatus.REVIEW,
    TokenStatus.APPROVED,
    TokenStatus.READY_TO_MINT,
    TokenStatus.MINTED,
    TokenStatus.DEPLOYED,
    TokenStatus.DISTRIBUTED
  ];
  
  const position = workflow.indexOf(statusEnum);
  return position >= 0 ? position : 0;
}

/**
 * Calculate workflow progress percentage
 */
export function getWorkflowProgress(status: TokenStatus | string): number {
  const position = getStatusPosition(status);
  const totalSteps = 7; // Total workflow steps
  return Math.round((position / (totalSteps - 1)) * 100);
}

/**
 * Update token status in database
 */
export async function updateTokenStatus(
  tokenId: string, 
  newStatus: TokenStatus,
  userId?: string,
  notes?: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // First get the current token to validate the transition
    const { data: currentToken, error: fetchError } = await supabase
      .from('tokens')
      .select('status, name, symbol')
      .eq('id', tokenId)
      .single();

    if (fetchError) {
      return { success: false, error: `Failed to fetch token: ${fetchError.message}` };
    }

    // Validate the status transition
    if (!isValidTransition(currentToken.status, newStatus)) {
      return { 
        success: false, 
        error: `Invalid status transition from ${currentToken.status} to ${newStatus}` 
      };
    }

    // Update the token status
    const { data: updatedToken, error: updateError } = await supabase
      .from('tokens')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: `Failed to update status: ${updateError.message}` };
    }

    // Log the status change for audit trail
    await logStatusChange(tokenId, currentToken.status, newStatus, userId, notes);

    return { 
      success: true, 
      data: {
        ...updatedToken,
        previousStatus: currentToken.status
      }
    };

  } catch (error: any) {
    console.error('Error updating token status:', error);
    return { success: false, error: error.message || 'Failed to update token status' };
  }
}

/**
 * Log status change for audit trail
 */
async function logStatusChange(
  tokenId: string,
  fromStatus: string,
  toStatus: TokenStatus,
  userId?: string,
  notes?: string
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        entity_type: 'token',
        entity_id: tokenId,
        action: 'status_change',
        details: JSON.stringify({
          from_status: fromStatus,
          to_status: toStatus,
          notes: notes || null,
          timestamp: new Date().toISOString()
        }),
        user_id: userId || null,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log status change:', error);
    // Don't fail the main operation if logging fails
  }
}

/**
 * Get status workflow information for a token
 */
export function getStatusWorkflowInfo(token: UnifiedTokenData) {
  const currentStatus = normalizeStatus(token.status);
  const availableTransitions = getAvailableTransitions(currentStatus);
  const nextStatus = getNextStatus(currentStatus);
  const progress = getWorkflowProgress(currentStatus);
  const position = getStatusPosition(currentStatus);

  return {
    currentStatus,
    availableTransitions,
    nextStatus,
    progress,
    position,
    displayName: STATUS_DISPLAY_NAMES[currentStatus],
    description: STATUS_DESCRIPTIONS[currentStatus],
    canTransition: availableTransitions.length > 0
  };
}

/**
 * Batch update multiple token statuses
 */
export async function batchUpdateTokenStatus(
  tokenIds: string[],
  newStatus: TokenStatus,
  userId?: string
): Promise<{ success: boolean; results: any[]; errors: string[] }> {
  const results: any[] = [];
  const errors: string[] = [];

  for (const tokenId of tokenIds) {
    const result = await updateTokenStatus(tokenId, newStatus, userId);
    if (result.success) {
      results.push(result.data);
    } else {
      errors.push(`Token ${tokenId}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors
  };
}
