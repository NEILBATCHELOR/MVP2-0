/**
 * useEnhancedTokens Hook
 * 
 * Enhanced React hook for managing token data with additional features
 * and standard-specific properties.
 */

import { useState, useEffect, useCallback } from 'react';
import { EnhancedTokenData } from '../types';
import { getEnhancedTokenData } from '../services/tokenDataService';
import { useTokens } from './useTokens';

interface UseEnhancedTokensResult {
  tokens: EnhancedTokenData[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useEnhancedTokens(projectId?: string): UseEnhancedTokensResult {
  const [enhancedTokens, setEnhancedTokens] = useState<EnhancedTokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use the base useTokens hook
  const { tokens: baseTokens, isLoading: baseLoading, error: baseError, refetch: baseRefetch } = useTokens({
    projectId,
    enabled: !!projectId
  });

  // Enhance tokens with additional data
  const enhanceTokens = useCallback(async (tokens: any[]) => {
    if (!tokens.length) {
      setEnhancedTokens([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const enhancedPromises = tokens.map(async (token) => {
        try {
          const enhancedData = await getEnhancedTokenData(token.id);
          return enhancedData;
        } catch (error) {
          console.error(`Error enhancing token ${token.id}:`, error);
          // Return the base token if enhancement fails
          return token;
        }
      });

      const enhanced = await Promise.all(enhancedPromises);
      setEnhancedTokens(enhanced);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to enhance tokens');
      setError(error);
      console.error('Error enhancing tokens:', error);
      // Fallback to base tokens
      setEnhancedTokens(tokens);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to enhance tokens when base tokens change
  useEffect(() => {
    if (baseTokens.length > 0) {
      enhanceTokens(baseTokens);
    } else {
      setEnhancedTokens([]);
      setLoading(false);
    }
  }, [baseTokens, enhanceTokens]);

  // Effect to handle base loading and error states
  useEffect(() => {
    if (baseError) {
      setError(baseError);
      setLoading(false);
    }
  }, [baseError]);

  const refetch = useCallback(async () => {
    await baseRefetch();
  }, [baseRefetch]);

  return {
    tokens: enhancedTokens,
    loading: baseLoading || loading,
    error: error || baseError,
    refetch
  };
}

export default useEnhancedTokens;
