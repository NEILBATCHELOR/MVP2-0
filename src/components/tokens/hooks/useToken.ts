/**
 * useToken Hook
 * 
 * React hook for managing individual token data, including fetching,
 * updating, and real-time synchronization.
 */

import { useState, useEffect, useCallback } from 'react';
import { UseTokenOptions, TokenHookResult } from './types';
import { EnhancedTokenData } from '../types';
import { TokenStandard } from '@/types/core/centralModels';
import { Json } from '@/types/core/supabase';
import { 
  getToken, 
  updateToken, 
  deleteToken 
} from '../services/tokenService';

export function useToken(options: UseTokenOptions): TokenHookResult {
  const {
    tokenId,
    includeProperties = true,
    includeArrays = true,
    enabled = true,
    refetchInterval,
    onError,
    onSuccess
  } = options;

  const [token, setToken] = useState<EnhancedTokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch token data
  const fetchToken = useCallback(async () => {
    if (!enabled || !tokenId) return;

    setIsLoading(true);
    setError(null);

    try {
      const tokenData = await getToken(tokenId);
      
      // Ensure the returned data has the correct TokenStandard type
      const enhancedData: EnhancedTokenData = {
        ...tokenData,
        standard: tokenData.standard as unknown as TokenStandard,
        blocks: tokenData.blocks as unknown as Record<string, any>,
        metadata: tokenData.metadata as unknown as Record<string, any>
      };

      setToken(enhancedData);
      
      if (onSuccess) {
        onSuccess(enhancedData);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch token');
      setError(error);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tokenId, includeProperties, includeArrays, enabled, onSuccess, onError]);

  // Update token data
  const updateTokenData = useCallback(async (updates: Partial<EnhancedTokenData>): Promise<EnhancedTokenData> => {
    if (!tokenId) throw new Error('Token ID is required for update');

    setIsLoading(true);
    setError(null);

    try {
      const updatedToken = await updateToken(tokenId, updates);
      // Ensure the returned data matches EnhancedTokenData type
      const enhancedData: EnhancedTokenData = {
        ...updatedToken,
        standard: updatedToken.standard as unknown as TokenStandard,
        blocks: updatedToken.blocks as unknown as Record<string, any>,
        metadata: updatedToken.metadata as unknown as Record<string, any>
      };
      setToken(enhancedData);
      
      if (onSuccess) {
        onSuccess(enhancedData);
      }
      
      return enhancedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update token');
      setError(error);
      
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tokenId, onSuccess, onError]);

  // Delete token
  const deleteTokenData = useCallback(async (): Promise<void> => {
    if (!tokenId) throw new Error('Token ID is required for deletion');

    setIsLoading(true);
    setError(null);

    try {
      // Get token to find projectId, then delete with both parameters
      const currentToken = await getToken(tokenId);
      await deleteToken(currentToken.project_id, tokenId);
      setToken(null);
      
      if (onSuccess) {
        onSuccess(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete token');
      setError(error);
      
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tokenId, onSuccess, onError]);

  // Refetch wrapper
  const refetch = useCallback((): Promise<void> => {
    fetchToken();
    return Promise.resolve();
  }, [fetchToken]);

  // Initial fetch
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Set up polling if refetchInterval is provided
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(fetchToken, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchToken, refetchInterval, enabled]);

  return {
    token,
    isLoading,
    error,
    refetch,
    update: updateTokenData,
    delete: deleteTokenData
  };
}