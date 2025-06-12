/**
 * useTokens Hook
 * 
 * React hook for managing lists of tokens with filtering, pagination,
 * and real-time updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { UseTokensOptions, TokensHookResult } from './types';
import { EnhancedTokenData, TokenFormData } from '../types';
import { TokenStandard } from '@/types/core/centralModels';
import { 
  getTokens, 
  createToken 
} from '../services/tokenService';

export function useTokens(options: UseTokensOptions = {}): TokensHookResult {
  const {
    projectId,
    standard,
    status,
    search,
    limit = 20,
    offset = 0,
    enabled = true,
    refetchInterval,
    onError,
    onSuccess
  } = options;

  const [tokens, setTokens] = useState<EnhancedTokenData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentOffset, setCurrentOffset] = useState(offset);

  // Fetch tokens data
  const fetchTokens = useCallback(async (newOffset = currentOffset) => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Call getTokens with projectId only (the function signature expects a single parameter)
      const result = await getTokens(projectId);
      
      // Apply client-side filtering since the service doesn't support advanced filtering yet
      let filteredTokens = (result || []).map(token => ({
        ...token,
        standard: token.standard as TokenStandard,
        blocks: (token.blocks as Record<string, any>) || {},
        metadata: (token.metadata as Record<string, any>) || {}
      })) as EnhancedTokenData[];
      
      // Apply standard filter
      if (standard) {
        filteredTokens = filteredTokens.filter(token => token.standard === standard);
      }
      
      // Apply status filter
      if (status) {
        filteredTokens = filteredTokens.filter(token => token.status === status);
      }
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filteredTokens = filteredTokens.filter(token => 
          token.name?.toLowerCase().includes(searchLower) ||
          token.symbol?.toLowerCase().includes(searchLower) ||
          token.description?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply pagination
      const totalCount = filteredTokens.length;
      const paginatedTokens = filteredTokens.slice(newOffset, newOffset + limit);

      // If this is a new search or filter, replace tokens
      // If this is pagination, append tokens
      if (newOffset === 0) {
        setTokens(paginatedTokens);
      } else {
        setTokens(prev => [...prev, ...paginatedTokens]);
      }
      
      setTotalCount(totalCount);
      setCurrentOffset(newOffset);
      
      if (onSuccess) {
        onSuccess({ tokens: paginatedTokens, totalCount });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch tokens');
      setError(error);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    projectId, 
    standard, 
    status, 
    search, 
    limit, 
    currentOffset, 
    enabled, 
    onSuccess, 
    onError
  ]);

  // Create new token
  const createNewToken = useCallback(async (data: TokenFormData): Promise<EnhancedTokenData> => {
    if (!projectId) throw new Error('Project ID is required to create tokens');

    setIsLoading(true);
    setError(null);

    try {
      const newToken = await createToken(projectId, data);
      
      // Ensure the returned data has the correct TokenStandard type
      const enhancedData: EnhancedTokenData = {
        ...newToken,
        standard: newToken.standard as TokenStandard,
        blocks: (newToken.blocks as Record<string, any>) || {},
        metadata: (newToken.metadata as Record<string, any>) || {}
      };
      
      // Add the new token to the beginning of the list
      setTokens(prev => [enhancedData, ...prev]);
      setTotalCount(prev => prev + 1);
      
      if (onSuccess) {
        onSuccess(enhancedData);
      }

      return enhancedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create token');
      setError(error);
      
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [projectId, onSuccess, onError]);

  // Fetch next page
  const fetchNextPage = useCallback(async () => {
    const nextOffset = currentOffset + limit;
    await fetchTokens(nextOffset);
  }, [fetchTokens, currentOffset, limit]);

  // Check if there are more pages
  const hasNextPage = currentOffset + limit < totalCount;

  // Refetch wrapper (resets to first page)
  const refetch = useCallback(async () => {
    setCurrentOffset(0);
    await fetchTokens(0);
  }, [fetchTokens]);

  // Initial fetch
  useEffect(() => {
    fetchTokens(0);
  }, [projectId, standard, status, search, limit]); // Reset to first page when filters change

  // Set up polling if refetchInterval is provided
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => fetchTokens(0), refetchInterval);
    return () => clearInterval(interval);
  }, [fetchTokens, refetchInterval, enabled]);

  return {
    tokens,
    totalCount,
    isLoading,
    error,
    refetch,
    create: createNewToken,
    hasNextPage,
    fetchNextPage
  };
}
