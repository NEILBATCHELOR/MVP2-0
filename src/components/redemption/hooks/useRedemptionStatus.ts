import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { 
  RedemptionRequest, 
  RedemptionStatusType, 
  SettlementStatusType,
  ApprovalStatusType
} from '../types';
import { redemptionService, settlementService, approvalService } from '../services';
import { supabase } from '@/infrastructure/supabaseClient';

interface StatusUpdate {
  timestamp: Date;
  status: RedemptionStatusType;
  message?: string;
  details?: Record<string, any>;
}

interface SettlementInfo {
  status: SettlementStatusType;
  transactionHash?: string;
  gasUsed?: number;
  timestamp?: Date;
}

interface ApprovalInfo {
  status: ApprovalStatusType;
  approvedBy?: string[];
  rejectedBy?: string[];
  requiredApprovals: number;
  currentApprovals: number;
  timestamp?: Date;
}

export interface UseRedemptionStatusParams {
  redemptionId: string;
  pollingInterval?: number;
  enableRealTimeUpdates?: boolean;
}

export interface UseRedemptionStatusReturn {
  // Current state
  redemption: RedemptionRequest | null;
  loading: boolean;
  error: string | null;
  
  // Status information
  currentStatus: RedemptionStatusType | null;
  statusHistory: StatusUpdate[];
  settlementInfo: SettlementInfo | null;
  approvalInfo: ApprovalInfo | null;
  
  // Progress tracking
  progressPercentage: number;
  estimatedCompletion?: Date;
  timeRemaining?: string;
  
  // Actions
  refreshStatus: () => Promise<void>;
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
  
  // Utility
  isInProgress: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  canCancel: boolean;
  getStatusMessage: () => string;
  clearError: () => void;
}

export const useRedemptionStatus = (params: UseRedemptionStatusParams): UseRedemptionStatusReturn => {
  const {
    redemptionId,
    pollingInterval = 10000, // 10 seconds
    enableRealTimeUpdates = true
  } = params;

  // State
  const [redemption, setRedemption] = useState<RedemptionRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusUpdate[]>([]);
  const [settlementInfo, setSettlementInfo] = useState<SettlementInfo | null>(null);
  const [approvalInfo, setApprovalInfo] = useState<ApprovalInfo | null>(null);

  // Refs for cleanup and connection management
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isUnmountedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const baseReconnectDelay = 2000; // 2 seconds

  // Clear error function
  const clearError = useCallback(() => setError(null), []);

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback((attempt: number): number => {
    return Math.min(baseReconnectDelay * Math.pow(2, attempt), 15000); // Max 15 seconds
  }, []);

  // Fetch redemption status
  const fetchRedemptionStatus = useCallback(async () => {
    if (isUnmountedRef.current) return;
    
    try {
      setLoading(true);
      clearError();

      const response = await redemptionService.getRedemptionRequest(redemptionId);

      if (isUnmountedRef.current) return;

      if (response.success) {
        const updatedRedemption = response.data;
        
        // Update redemption data
        setRedemption(prevRedemption => {
          // Update status history if status changed
          if (prevRedemption && prevRedemption.status !== updatedRedemption.status) {
            setStatusHistory(prev => [...prev, {
              timestamp: new Date(),
              status: updatedRedemption.status,
              message: getStatusChangeMessage(prevRedemption.status, updatedRedemption.status)
            }]);
          }
          return updatedRedemption;
        });

        // Fetch additional status information
        await Promise.all([
          fetchSettlementInfo(redemptionId),
          fetchApprovalInfo(redemptionId)
        ]);

      } else {
        setError(response.error || 'Failed to fetch redemption status');
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
  }, [redemptionId, clearError]);

  // Fetch settlement information
  const fetchSettlementInfo = useCallback(async (reqId: string) => {
    if (isUnmountedRef.current) return;
    
    try {
      const response = await settlementService.getSettlementStatus(reqId);
      
      if (response.success && response.data && !isUnmountedRef.current) {
        const responseData = response.data as any;
        const settlementData = responseData.settlement || responseData;
        setSettlementInfo({
          status: settlementData.status,
          transactionHash: settlementData.transactionHash || settlementData.burnTxHash || settlementData.transferTxHash,
          gasUsed: settlementData.gasUsed || settlementData.burnGasUsed || settlementData.transferGasUsed,
          timestamp: settlementData.timestamp ? new Date(settlementData.timestamp) : 
                     settlementData.completedAt ? new Date(settlementData.completedAt) :
                     settlementData.updatedAt ? new Date(settlementData.updatedAt) : undefined
        });
      }
    } catch (err) {
      // Settlement info is optional, don't set error
      console.warn('Failed to fetch settlement info:', err);
    }
  }, []);

  // Fetch approval information
  const fetchApprovalInfo = useCallback(async (reqId: string) => {
    if (isUnmountedRef.current) return;
    
    try {
      const response = await approvalService.getApprovalStatus(reqId);
      
      if (response.success && response.data && !isUnmountedRef.current) {
        const approvalData = response.data;
        setApprovalInfo({
          status: approvalData.status,
          approvedBy: approvalData.approvers?.filter(a => a.decision === 'approved').map(a => a.approverName) || [],
          rejectedBy: approvalData.approvers?.filter(a => a.decision === 'rejected').map(a => a.approverName) || [],
          requiredApprovals: approvalData.requiredApprovals,
          currentApprovals: approvalData.currentApprovals,
          timestamp: approvalData.createdAt ? new Date(approvalData.createdAt) : 
                     approvalData.updatedAt ? new Date(approvalData.updatedAt) : undefined
        });
      }
    } catch (err) {
      // Approval info is optional, don't set error
      console.warn('Failed to fetch approval info:', err);
    }
  }, []);

  // Get status change message
  const getStatusChangeMessage = (oldStatus: RedemptionStatusType, newStatus: RedemptionStatusType): string => {
    const messages: Record<string, string> = {
      'draft->pending': 'Redemption request submitted for review',
      'pending->approved': 'Redemption request approved',
      'approved->processing': 'Settlement process initiated',
      'processing->settled': 'Redemption completed successfully',
      'pending->rejected': 'Redemption request rejected',
      'approved->cancelled': 'Redemption request cancelled',
      'processing->cancelled': 'Settlement process cancelled'
    };
    
    return messages[`${oldStatus}->${newStatus}`] || `Status changed from ${oldStatus} to ${newStatus}`;
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    if (!redemption) return 0;
    
    const statusProgress: Record<RedemptionStatusType, number> = {
      'draft': 0,
      'pending': 20,
      'approved': 40,
      'processing': 70,
      'settled': 100,
      'rejected': 0,
      'cancelled': 0
    };
    
    return statusProgress[redemption.status] || 0;
  };

  // Calculate estimated completion time
  const calculateEstimatedCompletion = (): Date | undefined => {
    if (!redemption || redemption.status === 'settled' || redemption.status === 'rejected' || redemption.status === 'cancelled') {
      return undefined;
    }
    
    // Estimate based on status and historical data
    const estimatedHours: Record<RedemptionStatusType, number> = {
      'draft': 72, // 3 days
      'pending': 48, // 2 days  
      'approved': 24, // 1 day
      'processing': 4, // 4 hours
      'settled': 0,
      'rejected': 0,
      'cancelled': 0
    };
    
    const hoursRemaining = estimatedHours[redemption.status] || 0;
    return new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);
  };

  // Calculate time remaining
  const calculateTimeRemaining = (): string | undefined => {
    const estimatedCompletion = calculateEstimatedCompletion();
    if (!estimatedCompletion) return undefined;
    
    const timeRemaining = estimatedCompletion.getTime() - Date.now();
    if (timeRemaining <= 0) return 'Soon';
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return 'Less than 1 hour';
    }
  };

  // Get current status message
  const getStatusMessage = (): string => {
    if (!redemption) return 'Loading...';
    
    const messages: Record<RedemptionStatusType, string> = {
      'draft': 'Draft - Ready to submit',
      'pending': 'Pending approval',
      'approved': 'Approved - Settlement pending',
      'processing': 'Processing settlement',
      'settled': 'Completed successfully',
      'rejected': 'Request rejected',
      'cancelled': 'Request cancelled'
    };
    
    return messages[redemption.status] || redemption.status;
  };

  // Clean up all timers
  const cleanupTimers = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
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
      }
    }
  }, []);

  // Attempt to reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (isUnmountedRef.current || !enableRealTimeUpdates) return;
    
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached for redemption status updates');
      return;
    }

    const delay = getReconnectDelay(reconnectAttemptsRef.current);
    reconnectAttemptsRef.current += 1;
    
    console.log(`Attempting to reconnect status updates in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        subscribeToUpdates();
      }
    }, delay);
  }, [enableRealTimeUpdates, getReconnectDelay]);

  // Handle real-time subscription events
  const handleRealtimeEvent = useCallback((payload: any) => {
    if (isUnmountedRef.current) return;
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (newRecord && newRecord.id === redemptionId) {
      // Update redemption data
      setRedemption(prevRedemption => {
        // Add to status history if status changed
        if (prevRedemption && prevRedemption.status !== newRecord.status) {
          setStatusHistory(prev => [...prev, {
            timestamp: new Date(),
            status: newRecord.status,
            message: getStatusChangeMessage(prevRedemption.status, newRecord.status)
          }]);
        }
        return newRecord;
      });
      
      // Fetch additional status information when status changes
      if (oldRecord && oldRecord.status !== newRecord.status) {
        Promise.all([
          fetchSettlementInfo(redemptionId),
          fetchApprovalInfo(redemptionId)
        ]);
      }
    }
  }, [redemptionId, fetchSettlementInfo, fetchApprovalInfo]);

  // Subscribe to real-time updates
  const subscribeToUpdates = useCallback(() => {
    if (!enableRealTimeUpdates || isUnmountedRef.current) return;

    // Clean up existing subscription first
    cleanupRealtimeSubscription();

    try {
      const channelName = `redemption_status_${redemptionId}_${Date.now()}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'redemption_requests',
            filter: `id=eq.${redemptionId}`
          },
          handleRealtimeEvent
        )
        .subscribe((status, err) => {
          if (isUnmountedRef.current) return;
          
          console.log('Status subscription status:', status);
          
          switch (status) {
            case 'SUBSCRIBED':
              console.log('Status real-time channel connected successfully');
              reconnectAttemptsRef.current = 0; // Reset on success
              break;
              
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              console.error('Status real-time subscription error:', status, err?.message);
              if (!isUnmountedRef.current) {
                attemptReconnect();
              }
              break;
          }
        });
      
      channelRef.current = channel;

    } catch (err) {
      console.warn('Failed to establish status real-time subscription:', err);
      attemptReconnect();
    }
  }, [redemptionId, enableRealTimeUpdates, handleRealtimeEvent, cleanupRealtimeSubscription, attemptReconnect]);

  // Unsubscribe from real-time updates
  const unsubscribeFromUpdates = useCallback(() => {
    cleanupRealtimeSubscription();
  }, [cleanupRealtimeSubscription]);

  // Refresh status
  const refreshStatus = useCallback(async () => {
    await fetchRedemptionStatus();
  }, [fetchRedemptionStatus]);

  // Computed properties
  const currentStatus = redemption?.status || null;
  const progressPercentage = calculateProgress();
  const estimatedCompletion = calculateEstimatedCompletion();
  const timeRemaining = calculateTimeRemaining();
  
  const isInProgress = currentStatus ? 
    ['pending', 'approved', 'processing'].includes(currentStatus) : false;
  const isCompleted = currentStatus === 'settled';
  const isFailed = currentStatus ? ['rejected', 'cancelled'].includes(currentStatus) : false;
  const canCancel = currentStatus ? ['draft', 'pending', 'approved'].includes(currentStatus) : false;

  // Initial load effect
  useEffect(() => {
    isUnmountedRef.current = false;
    fetchRedemptionStatus();
  }, [fetchRedemptionStatus]);

  // Setup polling effect
  useEffect(() => {
    if (isCompleted || isFailed) return;

    pollingIntervalRef.current = setInterval(() => {
      if (!loading && !isUnmountedRef.current) {
        fetchRedemptionStatus();
      }
    }, pollingInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [pollingInterval, loading, isCompleted, isFailed, fetchRedemptionStatus]);

  // Setup real-time updates effect
  useEffect(() => {
    if (enableRealTimeUpdates && !isCompleted && !isFailed) {
      // Small delay to avoid immediate connection after data load
      const timeoutId = setTimeout(() => {
        if (!isUnmountedRef.current) {
          subscribeToUpdates();
        }
      }, 1500);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [enableRealTimeUpdates, isCompleted, isFailed, subscribeToUpdates]);

  // Cleanup effect on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      cleanupTimers();
      cleanupRealtimeSubscription();
    };
  }, [cleanupTimers, cleanupRealtimeSubscription]);

  return {
    redemption,
    loading,
    error,
    currentStatus,
    statusHistory,
    settlementInfo,
    approvalInfo,
    progressPercentage,
    estimatedCompletion,
    timeRemaining,
    refreshStatus,
    subscribeToUpdates,
    unsubscribeFromUpdates,
    isInProgress,
    isCompleted,
    isFailed,
    canCancel,
    getStatusMessage,
    clearError
  };
};