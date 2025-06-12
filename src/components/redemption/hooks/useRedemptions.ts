import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { 
  RedemptionRequest, 
  RedemptionListResponse, 
  CreateRedemptionRequestInput,
  RedemptionRequestResponse,
  BulkRedemptionData,
  RedemptionStatusType
} from '../types';
import { redemptionService } from '../services';
import { supabase } from '@/infrastructure/supabaseClient';

export interface UseRedemptionsParams {
  investorId?: string;
  status?: RedemptionStatusType;
  enableRealtime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseRedemptionsReturn {
  redemptions: RedemptionRequest[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  realtimeConnected: boolean;
  // Actions
  createRedemption: (input: CreateRedemptionRequestInput) => Promise<RedemptionRequest | null>;
  createBulkRedemption: (data: BulkRedemptionData) => Promise<RedemptionRequest[] | null>;
  updateRedemption: (id: string, updates: Partial<RedemptionRequest>) => Promise<boolean>;
  cancelRedemption: (id: string) => Promise<boolean>;
  refreshRedemptions: () => Promise<void>;
  loadMore: () => Promise<void>;
  // Utility
  getRedemptionById: (id: string) => RedemptionRequest | undefined;
  getRedemptionsByStatus: (status: RedemptionStatusType) => RedemptionRequest[];
  clearError: () => void;
}

export const useRedemptions = (params: UseRedemptionsParams = {}): UseRedemptionsReturn => {
  const {
    investorId,
    status,
    enableRealtime = true,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = params;

  // State
  const [redemptions, setRedemptions] = useState<RedemptionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  
  // Refs for cleanup and connection management
  const channelRef = useRef<RealtimeChannel | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const maxReconnectAttempts = 3; // Reduced from 5
  const baseReconnectDelay = 2000; // Increased from 1000ms

  // Clear error function
  const clearError = useCallback(() => setError(null), []);

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback((attempt: number): number => {
    return Math.min(baseReconnectDelay * Math.pow(2, attempt), 60000); // Max 60 seconds
  }, []);

  // Handle real-time subscription events
  const handleRealtimeEvent = useCallback((payload: any) => {
    if (isUnmountedRef.current) return;
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord && shouldIncludeRecord(newRecord)) {
          setRedemptions(prev => {
            // Check if record already exists to prevent duplicates
            const exists = prev.some(r => r.id === newRecord.id);
            if (!exists) {
              return [newRecord, ...prev];
            }
            return prev;
          });
          setTotalCount(prev => prev + 1);
        }
        break;
        
      case 'UPDATE':
        if (newRecord) {
          setRedemptions(prev => prev.map(redemption => 
            redemption.id === newRecord.id ? newRecord : redemption
          ));
        }
        break;
        
      case 'DELETE':
        if (oldRecord) {
          setRedemptions(prev => prev.filter(redemption => redemption.id !== oldRecord.id));
          setTotalCount(prev => Math.max(0, prev - 1));
        }
        break;
    }
  }, []);

  // Helper function to determine if a record should be included based on filters
  const shouldIncludeRecord = useCallback((record: any): boolean => {
    if (investorId && record.investor_id !== investorId) {
      return false;
    }
    if (status && record.status !== status) {
      return false;
    }
    return true;
  }, [investorId, status]);

  // Clean up all timeouts and intervals
  const cleanupTimers = useCallback(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Clean up real-time subscription
  const cleanupRealtimeSubscription = useCallback(() => {
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (err) {
        console.warn('Error removing channel during cleanup:', err);
      } finally {
        channelRef.current = null;
        setRealtimeConnected(false);
      }
    }
  }, []);

  // Attempt to reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (isUnmountedRef.current || !enableRealtime) return;
    
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached. Switching to polling mode.');
      // Switch to polling mode instead of realtime
      if (autoRefresh) return;
      autoRefreshRef.current = setInterval(() => {
        if (!loading && !isUnmountedRef.current) {
          fetchRedemptions(1, false);
        }
      }, 30000); // Poll every 30 seconds
      return;
    }

    const delay = getReconnectDelay(reconnectAttemptsRef.current);
    reconnectAttemptsRef.current += 1;
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        setupRealtimeSubscription();
      }
    }, delay);
  }, [enableRealtime, getReconnectDelay, autoRefresh, loading]);

  // Set up real-time subscription with proper error handling
  const setupRealtimeSubscription = useCallback(() => {
    if (!enableRealtime || isUnmountedRef.current) return;
    
    // Clean up existing subscription first
    cleanupRealtimeSubscription();
    
    try {
      const channelName = `redemption_requests_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'redemption_requests',
            // Add filter for investor if specified
            ...(investorId && { filter: `investor_id=eq.${investorId}` })
          },
          handleRealtimeEvent
        )
        .subscribe((status, err) => {
          if (isUnmountedRef.current) return;
          
          // Use debug logging to reduce console spam
          if (process.env.NODE_ENV === 'development') {
            console.debug('Realtime subscription status:', status);
          }
          
          switch (status) {
            case 'SUBSCRIBED':
              console.log('Realtime channel connected successfully');
              setRealtimeConnected(true);
              reconnectAttemptsRef.current = 0; // Reset reconnect attempts on success
              break;
              
            case 'CHANNEL_ERROR':
              if (err?.message && !err.message.includes('406')) {
                console.error('Realtime channel error:', err.message);
              }
              setRealtimeConnected(false);
              attemptReconnect();
              break;
              
            case 'TIMED_OUT':
              console.warn('Realtime server did not respond in time');
              setRealtimeConnected(false);
              attemptReconnect();
              break;
              
            case 'CLOSED':
              if (process.env.NODE_ENV === 'development') {
                console.debug('Realtime channel was closed');
              }
              setRealtimeConnected(false);
              // Only attempt reconnect if this wasn't intentional cleanup
              if (!isUnmountedRef.current) {
                attemptReconnect();
              }
              break;
          }
        });
      
      channelRef.current = channel;
    } catch (err) {
      console.error('Failed to set up realtime subscription:', err);
      setRealtimeConnected(false);
      attemptReconnect();
    }
  }, [enableRealtime, investorId, handleRealtimeEvent, cleanupRealtimeSubscription, attemptReconnect]);

  // Fetch redemptions with pagination
  const fetchRedemptions = useCallback(async (page: number = 1, append: boolean = false) => {
    if (isUnmountedRef.current) return;
    
    try {
      setLoading(true);
      clearError();

      const response: RedemptionListResponse = await redemptionService.getRedemptions({
        investorId,
        status,
        page,
        limit: 20
      });

      if (isUnmountedRef.current) return;

      if (response.success && response.data) {
        const responseData = response.data as any;
        const newRedemptions = Array.isArray(responseData) ? responseData : (responseData.redemptions || responseData.requests || responseData);
        
        setRedemptions(prev => append ? [...prev, ...newRedemptions] : newRedemptions);
        setTotalCount(response.totalCount || (responseData && typeof responseData === 'object' && 'totalCount' in responseData ? responseData.totalCount as number : newRedemptions.length));
        setHasMore(response.hasMore || (responseData && typeof responseData === 'object' && 'hasMore' in responseData ? Boolean(responseData.hasMore) : false));
        setCurrentPage(page);
      } else {
        setError(response.error || 'Failed to fetch redemptions');
      }
    } catch (err) {
      if (!isUnmountedRef.current) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, [investorId, status, clearError]);

  // Create single redemption
  const createRedemption = useCallback(async (input: CreateRedemptionRequestInput): Promise<RedemptionRequest | null> => {
    try {
      setLoading(true);
      clearError();

      const response: RedemptionRequestResponse = await redemptionService.createRedemptionRequest(input);

      if (response.success) {
        const newRedemption = response.data;
        setRedemptions(prev => [newRedemption, ...prev]);
        setTotalCount(prev => prev + 1);
        return newRedemption;
      } else {
        setError(response.error || 'Failed to create redemption request');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Create bulk redemption
  const createBulkRedemption = useCallback(async (data: BulkRedemptionData): Promise<RedemptionRequest[] | null> => {
    try {
      setLoading(true);
      clearError();

      const requests: CreateRedemptionRequestInput[] = data.investors.map(investor => ({
        tokenAmount: investor.tokenAmount,
        tokenType: data.tokenType,
        redemptionType: data.redemptionType,
        sourceWallet: investor.sourceWallet || investor.walletAddress,
        destinationWallet: investor.destinationWallet || investor.walletAddress,
        sourceWalletAddress: investor.sourceWallet || investor.walletAddress,
        destinationWalletAddress: investor.destinationWallet || investor.walletAddress,
        conversionRate: data.conversionRate,
        usdcAmount: investor.usdcAmount || investor.tokenAmount * data.conversionRate,
        investorName: investor.investorName,
        investorId: investor.investorId
      }));
      
      const response = await redemptionService.createBulkRedemption(requests);

      if (response.success) {
        const newRedemptions = response.data.requests;
        setRedemptions(prev => [...newRedemptions, ...prev]);
        setTotalCount(prev => prev + newRedemptions.length);
        return newRedemptions;
      } else {
        setError(response.error || 'Failed to create bulk redemption');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Update redemption
  const updateRedemption = useCallback(async (id: string, updates: Partial<RedemptionRequest>): Promise<boolean> => {
    try {
      clearError();

      const response = await redemptionService.updateRedemptionRequest(id, updates);

      if (response.success) {
        setRedemptions(prev => prev.map(redemption => 
          redemption.id === id ? { ...redemption, ...updates } : redemption
        ));
        return true;
      } else {
        setError(response.error || 'Failed to update redemption');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    }
  }, [clearError]);

  // Cancel redemption
  const cancelRedemption = useCallback(async (id: string): Promise<boolean> => {
    try {
      clearError();

      const response = await redemptionService.cancelRedemptionRequest(id);

      if (response.success) {
        setRedemptions(prev => prev.map(redemption => 
          redemption.id === id ? { ...redemption, status: 'cancelled' } : redemption
        ));
        return true;
      } else {
        setError(response.error || 'Failed to cancel redemption');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    }
  }, [clearError]);

  // Refresh redemptions
  const refreshRedemptions = useCallback(async () => {
    await fetchRedemptions(1, false);
  }, [fetchRedemptions]);

  // Load more redemptions
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await fetchRedemptions(currentPage + 1, true);
    }
  }, [hasMore, loading, currentPage, fetchRedemptions]);

  // Utility functions
  const getRedemptionById = useCallback((id: string): RedemptionRequest | undefined => {
    return redemptions.find(redemption => redemption.id === id);
  }, [redemptions]);

  const getRedemptionsByStatus = useCallback((filterStatus: RedemptionStatusType): RedemptionRequest[] => {
    return redemptions.filter(redemption => redemption.status === filterStatus);
  }, [redemptions]);

  // Initial load effect
  useEffect(() => {
    isUnmountedRef.current = false;
    fetchRedemptions(1, false);
  }, [fetchRedemptions]);

  // Real-time subscription effect (separate from initial load)
  useEffect(() => {
    if (enableRealtime) {
      // Small delay to avoid immediate connection after data load
      const timeoutId = setTimeout(() => {
        if (!isUnmountedRef.current) {
          setupRealtimeSubscription();
        }
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [enableRealtime, investorId, status, setupRealtimeSubscription]);

  // Auto-refresh effect (only when real-time is disabled)
  useEffect(() => {
    if (!autoRefresh || enableRealtime) return;

    autoRefreshRef.current = setInterval(() => {
      if (!loading && !isUnmountedRef.current) {
        refreshRedemptions();
      }
    }, refreshInterval);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    };
  }, [autoRefresh, enableRealtime, refreshInterval, loading, refreshRedemptions]);

  // Cleanup effect on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      cleanupTimers();
      cleanupRealtimeSubscription();
    };
  }, [cleanupTimers, cleanupRealtimeSubscription]);

  return {
    redemptions,
    loading,
    error,
    totalCount,
    hasMore,
    realtimeConnected,
    createRedemption,
    createBulkRedemption,
    updateRedemption,
    cancelRedemption,
    refreshRedemptions,
    loadMore,
    getRedemptionById,
    getRedemptionsByStatus,
    clearError
  };
};