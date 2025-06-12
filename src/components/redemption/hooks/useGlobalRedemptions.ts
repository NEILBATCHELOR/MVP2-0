// Global redemptions hook for open access redemption management
// Provides hook interface for global redemption operations

import { useState, useEffect, useCallback, useMemo } from 'react';
import { globalRedemptionService } from '../services/globalRedemptionService';
import type { 
  RedemptionRequest, 
  RedemptionListResponse,
  GlobalCreateRedemptionRequestInput 
} from '../types';

export interface UseGlobalRedemptionsParams {
  page?: number;
  limit?: number;
  status?: string;
  tokenType?: string;
  redemptionType?: 'standard' | 'interval';
  enableRealtime?: boolean;
}

export interface UseGlobalRedemptionsReturn {
  redemptions: RedemptionRequest[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refresh: () => Promise<void>;
  refreshRedemptions: () => Promise<void>;
  createRedemption: (input: GlobalCreateRedemptionRequestInput) => Promise<{ success: boolean; data?: RedemptionRequest; error?: string }>;
  loadMore: () => Promise<void>;
  metrics: {
    uniqueTokenTypes: number;
    totalValue: number;
    successRate: number;
  } | null;
  getRedemptionsByStatus: (status: string) => RedemptionRequest[];
}

export function useGlobalRedemptions(params: UseGlobalRedemptionsParams = {}): UseGlobalRedemptionsReturn {
  const [redemptions, setRedemptions] = useState<RedemptionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const {
    page = 1,
    limit = 20,
    status,
    tokenType,
    redemptionType,
    enableRealtime = false
  } = params;

  const fetchRedemptions = useCallback(async (resetData = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await globalRedemptionService.getAllRedemptionRequests({
        page: resetData ? 1 : page,
        limit,
        status,
        tokenType,
        redemptionType
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch redemptions');
      }

      const newRedemptions = response.data || [];
      
      if (resetData) {
        setRedemptions(newRedemptions);
      } else {
        setRedemptions(prev => page === 1 ? newRedemptions : [...prev, ...newRedemptions]);
      }

      setTotalCount(response.totalCount || 0);
      setHasMore(response.hasMore || false);
      setPagination(response.pagination || null);

    } catch (err) {
      console.error('Error fetching global redemptions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setRedemptions([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, tokenType, redemptionType]);

  const refresh = useCallback(async () => {
    await fetchRedemptions(true);
  }, [fetchRedemptions]);

  const refreshRedemptions = refresh; // Alias for compatibility

  // Calculate metrics
  const metrics = useMemo(() => {
    if (redemptions.length === 0) return null;
    
    const uniqueTokenTypes = new Set(redemptions.map(r => r.tokenType)).size;
    const totalValue = redemptions.reduce((sum, r) => sum + (r.usdcAmount || 0), 0);
    const settledCount = redemptions.filter(r => r.status === 'settled').length;
    const successRate = redemptions.length > 0 ? (settledCount / redemptions.length) * 100 : 0;
    
    return {
      uniqueTokenTypes,
      totalValue,
      successRate
    };
  }, [redemptions]);

  // Helper function to get redemptions by status
  const getRedemptionsByStatus = useCallback((status: string) => {
    return redemptions.filter(r => r.status === status);
  }, [redemptions]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    try {
      const nextPage = pagination ? pagination.page + 1 : page + 1;
      const response = await globalRedemptionService.getAllRedemptionRequests({
        page: nextPage,
        limit,
        status,
        tokenType,
        redemptionType
      });

      if (response.success && response.data) {
        setRedemptions(prev => [...prev, ...response.data!]);
        setHasMore(response.hasMore || false);
        setPagination(response.pagination || null);
      }
    } catch (err) {
      console.error('Error loading more redemptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more redemptions');
    }
  }, [hasMore, loading, pagination, page, limit, status, tokenType, redemptionType]);

  const createRedemption = useCallback(async (input: GlobalCreateRedemptionRequestInput) => {
    try {
      const response = await globalRedemptionService.createGlobalRedemptionRequest(input);
      
      if (response.success && response.data) {
        // Add the new redemption to the beginning of the list
        setRedemptions(prev => [response.data!, ...prev]);
        setTotalCount(prev => prev + 1);
      }

      return response;
    } catch (err) {
      console.error('Error creating global redemption:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create redemption'
      };
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRedemptions(true);
  }, [fetchRedemptions]);

  // Real-time updates (if enabled)
  useEffect(() => {
    if (!enableRealtime) return;

    const interval = setInterval(() => {
      refresh();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [enableRealtime, refresh]);

  return {
    redemptions,
    loading,
    error,
    totalCount,
    hasMore,
    pagination,
    refresh,
    refreshRedemptions,
    createRedemption,
    loadMore,
    metrics,
    getRedemptionsByStatus
  };
}

export default useGlobalRedemptions;
