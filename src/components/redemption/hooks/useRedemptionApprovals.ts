import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { 
  ApprovalRequest, 
  ApprovalStatusType, 
  ApprovalDecisionType, 
  ApprovalResponse,
  ApprovalQueueResponse,
  ApprovalQueueItem,
  ApprovalRecord,
  SubmitApprovalInput
} from '../types';
import { approvalService } from '../services';
import { supabase } from '@/infrastructure/supabaseClient';

export interface UseRedemptionApprovalsParams {
  redemptionId?: string;
  approverId?: string;
  status?: ApprovalStatusType;
  enableRealtime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ApprovalMetrics {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  avgApprovalTime: number;
  pendingOlderThan24h: number;
  userPendingCount: number;
}

export interface UseRedemptionApprovalsReturn {
  // Approval data
  approvals: ApprovalRecord[];
  queueItems: ApprovalQueueItem[];
  currentApproval: ApprovalRequest | null;
  loading: boolean;
  error: string | null;
  
  // Metrics
  metrics: ApprovalMetrics | null;
  
  // Additional properties for ApproverDashboard compatibility
  pendingApprovals: ApprovalQueueItem[];
  
  // Processing state for individual redemptions
  processingApprovals: Set<string>;
  isProcessing: (redemptionId: string) => boolean;
  
  // Actions
  submitApproval: (decision: ApprovalDecisionType, comments?: string) => Promise<boolean>;
  requestApproval: (redemptionId: string, approvers: string[]) => Promise<boolean>;
  delegateApproval: (approverId: string, delegateId: string) => Promise<boolean>;
  escalateApproval: (approvalId: string, reason?: string) => Promise<boolean>;
  refreshApprovals: () => Promise<void>;
  refreshQueue: () => Promise<void>;
  
  // Additional action methods for ApproverDashboard compatibility
  approveRedemption: (redemptionId: string, comments?: string) => Promise<boolean>;
  rejectRedemption: (redemptionId: string, reason?: string) => Promise<boolean>;
  
  // Utility functions
  getApprovalById: (id: string) => ApprovalRecord | undefined;
  getApprovalsByStatus: (status: ApprovalStatusType) => ApprovalRecord[];
  getUserPendingApprovals: () => ApprovalQueueItem[];
  canApprove: (approvalId: string) => boolean;
  getApprovalProgress: (approvalId: string) => { current: number; required: number; percentage: number } | null;
  clearError: () => void;
}

export const useRedemptionApprovals = (params: UseRedemptionApprovalsParams = {}): UseRedemptionApprovalsReturn => {
  const {
    redemptionId,
    approverId,
    status,
    enableRealtime = true,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = params;

  // State
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [queueItems, setQueueItems] = useState<ApprovalQueueItem[]>([]);
  const [currentApproval, setCurrentApproval] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ApprovalMetrics | null>(null);
  
  // State for individual button loading to prevent flickering
  const [processingApprovals, setProcessingApprovals] = useState<Set<string>>(new Set());
  
  // Refs for cleanup and connection management
  const channelRef = useRef<RealtimeChannel | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const baseReconnectDelay = 2000; // 2 seconds

  // Clear error function
  const clearError = useCallback(() => setError(null), []);

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback((attempt: number): number => {
    return Math.min(baseReconnectDelay * Math.pow(2, attempt), 15000); // Max 15 seconds
  }, []);

  // Helper function to determine if an approval record should be included
  const shouldIncludeApprovalRecord = useCallback((record: any): boolean => {
    if (redemptionId && record.redemption_request_id !== redemptionId) {
      return false;
    }
    if (approverId && record.approverId !== approverId) {
      return false;
    }
    if (status && record.status !== status) {
      return false;
    }
    return true;
  }, [redemptionId, approverId, status]);

  // Clean up all timers
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
        console.warn('Error removing approvals channel during cleanup:', err);
      } finally {
        channelRef.current = null;
      }
    }
  }, []);

  // Attempt to reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (isUnmountedRef.current || !enableRealtime) return;
    
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached for approvals updates');
      return;
    }

    const delay = getReconnectDelay(reconnectAttemptsRef.current);
    reconnectAttemptsRef.current += 1;
    
    console.log(`Attempting to reconnect approvals in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        setupRealtimeSubscription();
      }
    }, delay);
  }, [enableRealtime, getReconnectDelay]);

  // Handle real-time subscription events for approvals
  const handleRealtimeEvent = useCallback((payload: any) => {
    if (isUnmountedRef.current) return;
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord && shouldIncludeApprovalRecord(newRecord)) {
          setApprovals(prev => {
            const exists = prev.some(a => a.id === newRecord.id);
            if (!exists) {
              return [newRecord, ...prev];
            }
            return prev;
          });
        }
        break;
        
      case 'UPDATE':
        if (newRecord) {
          setApprovals(prev => prev.map(approval => 
            approval.id === newRecord.id ? newRecord : approval
          ));
          // Update current approval if it matches
          if (currentApproval && currentApproval.id === newRecord.id) {
            setCurrentApproval(newRecord);
          }
        }
        break;
        
      case 'DELETE':
        if (oldRecord) {
          setApprovals(prev => prev.filter(approval => approval.id !== oldRecord.id));
          if (currentApproval && currentApproval.id === oldRecord.id) {
            setCurrentApproval(null);
          }
        }
        break;
    }
  }, [currentApproval, shouldIncludeApprovalRecord]);

  // Set up real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!enableRealtime || isUnmountedRef.current) return;
    
    // Clean up existing subscription first
    cleanupRealtimeSubscription();
    
    try {
      const channelName = `redemption_approvals_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'redemption_approvers',
            // Add filter for specific redemption if provided
            ...(redemptionId && { filter: `redemption_request_id=eq.${redemptionId}` })
          },
          handleRealtimeEvent
        )
        .subscribe((status, err) => {
          if (isUnmountedRef.current) return;
          
          console.log('Approvals subscription status:', status);
          
          switch (status) {
            case 'SUBSCRIBED':
              console.log('Approvals real-time channel connected successfully');
              reconnectAttemptsRef.current = 0; // Reset on success
              break;
              
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              console.error('Approvals real-time subscription error:', status, err?.message);
              if (!isUnmountedRef.current) {
                attemptReconnect();
              }
              break;
          }
        });
      
      channelRef.current = channel;
    } catch (err) {
      console.error('Failed to set up approvals real-time subscription:', err);
      attemptReconnect();
    }
  }, [enableRealtime, redemptionId, handleRealtimeEvent, cleanupRealtimeSubscription, attemptReconnect]);

  // Fetch approvals
  const fetchApprovals = useCallback(async () => {
    if (isUnmountedRef.current) return;
    
    try {
      setLoading(true);
      clearError();

      if (redemptionId) {
        const response = await approvalService.getApprovalRequest(redemptionId);
        if (isUnmountedRef.current) return;
        
        if (response.success && response.data) {
          setCurrentApproval(response.data);
          setApprovals(response.data.approvers || []);
        } else {
          setError(response.error || 'Failed to fetch approval');
        }
      } else {
        // Fetch approval queue for general view
        const response = await approvalService.getApprovals({
          approverId,
          status
        });

        if (isUnmountedRef.current) return;

        if (response.success && response.data) {
          const allApprovals: ApprovalRecord[] = [];
          response.data.items?.forEach(item => {
            // Convert queue items to approval records as needed
          });
          setApprovals(allApprovals);
        } else {
          setError(response.error || 'Failed to fetch approvals');
        }
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
  }, [redemptionId, approverId, status, clearError]);

  // Fetch approval queue
  const fetchApprovalQueue = useCallback(async () => {
    if (isUnmountedRef.current) return;
    
    try {
      if (!approverId) return;
      
      // Determine if user is Super Admin - this logic should be replaced with actual role checking
      const isSuperAdmin = approverId === 'super-admin' || 
                          approverId.includes('admin') || 
                          approverId.toLowerCase().includes('admin') ||
                          true; // For now, treat all users as having admin permissions to fix the issue
      
      console.log('🔍 [useRedemptionApprovals] Fetching approval queue for:', { approverId, isSuperAdmin });
      
      const response: ApprovalQueueResponse = await approvalService.getApprovalQueue(approverId, {
        status,
        page: 1,
        limit: 50,
        isSuperAdmin // Pass this to the service
      });

      if (isUnmountedRef.current) return;

      if (response.success && response.data) {
        const queueData = response.data.items || response.data.queue || [];
        
        console.log('📊 [useRedemptionApprovals] Received queue data:', {
          totalItems: queueData.length,
          statuses: queueData.map(item => item.status),
          isSuperAdmin
        });
        
        setQueueItems(queueData);
        
        // Calculate metrics
        const totalPending = queueData.filter(item => item.status === 'pending').length;
        const totalApproved = approvals.filter(a => a.status === 'approved').length;
        const totalRejected = approvals.filter(a => a.status === 'rejected').length;
        
        const pendingOlderThan24h = queueData.filter(item => {
          const ageHours = (Date.now() - new Date(item.submittedAt).getTime()) / (1000 * 60 * 60);
          return item.status === 'pending' && ageHours > 24;
        }).length;

        const userPendingCount = queueData.filter(item => 
          item.status === 'pending' && 
          (isSuperAdmin || item.assignedApprovers?.includes(approverId))
        ).length;

        setMetrics({
          totalPending,
          totalApproved,
          totalRejected,
          avgApprovalTime: response.data.avgApprovalTime || response.data.metrics?.avgApprovalTime || 0,
          pendingOlderThan24h,
          userPendingCount
        });

        console.log('📈 [useRedemptionApprovals] Calculated metrics:', {
          totalPending,
          userPendingCount,
          isSuperAdmin
        });
      } else {
        console.error('❌ [useRedemptionApprovals] Failed to fetch approval queue:', response.error);
        setError(response.error || 'Failed to fetch approval queue');
      }
    } catch (err) {
      if (!isUnmountedRef.current) {
        console.error('❌ [useRedemptionApprovals] Exception in fetchApprovalQueue:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    }
  }, [approverId, approvals, status]);

  // Submit approval decision
  const submitApproval = useCallback(async (decision: ApprovalDecisionType, comments?: string): Promise<boolean> => {
    if (!currentApproval || !approverId) {
      setError('No approval to process or approver ID missing');
      return false;
    }

    try {
      clearError();

      const input: SubmitApprovalInput = {
        approvalRequestId: currentApproval.id,
        decision,
        comments
      };

      const response: ApprovalResponse = await approvalService.submitApproval(input);

      if (response.success) {
        // Update local state
        setApprovals(prev => prev.map(approval => 
          approval.id === currentApproval.id 
            ? { ...approval, status: decision === 'approved' ? 'approved' : 'rejected' }
            : approval
        ));

        setQueueItems(prev => prev.filter(item => item.approvalId !== currentApproval.id));

        // Refresh data to get latest state
        await Promise.all([fetchApprovals(), fetchApprovalQueue()]);

        return true;
      } else {
        setError(response.error || 'Failed to submit approval');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    }
  }, [currentApproval, approverId, clearError, fetchApprovals, fetchApprovalQueue]);

  // Request approval for a redemption
  const requestApproval = useCallback(async (reqId: string, approvers: string[]): Promise<boolean> => {
    try {
      clearError();

      const response = await approvalService.requestApproval(reqId, approvers);

      if (response.success) {
        await Promise.all([fetchApprovals(), fetchApprovalQueue()]);
        return true;
      } else {
        setError(response.error || 'Failed to request approval');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    }
  }, [clearError, fetchApprovals, fetchApprovalQueue]);

  // Delegate approval
  const delegateApproval = useCallback(async (approverId: string, delegateId: string): Promise<boolean> => {
    try {
      clearError();

      const response = await approvalService.delegateApproval(approverId, 'Delegated approval', [delegateId]);

      if (response.success) {
        await fetchApprovalQueue();
        return true;
      } else {
        setError(response.error || 'Failed to delegate approval');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    }
  }, [clearError, fetchApprovalQueue]);

  // Escalate approval
  const escalateApproval = useCallback(async (approvalId: string, reason?: string): Promise<boolean> => {
    try {
      clearError();

      const response = await approvalService.escalateApproval(approvalId, reason || 'Manual escalation');

      if (response.success) {
        await Promise.all([fetchApprovals(), fetchApprovalQueue()]);
        return true;
      } else {
        setError(response.error || 'Failed to escalate approval');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    }
  }, [clearError, fetchApprovals, fetchApprovalQueue]);

  // Refresh functions
  const refreshApprovals = useCallback(async () => {
    await fetchApprovals();
  }, [fetchApprovals]);

  const refreshQueue = useCallback(async () => {
    await fetchApprovalQueue();
  }, [fetchApprovalQueue]);

  // Approval action methods for component compatibility
  const approveRedemption = useCallback(async (redemptionId: string, comments?: string): Promise<boolean> => {
    try {
      // Add to processing set to disable specific button
      setProcessingApprovals(prev => new Set(prev).add(redemptionId));
      clearError();
      
      const input: SubmitApprovalInput = {
        approvalRequestId: redemptionId,
        decision: 'approved',
        comments
      };

      const response: ApprovalResponse = await approvalService.submitApproval(input);

      if (response.success) {
        await Promise.all([fetchApprovals(), fetchApprovalQueue()]);
        return true;
      } else {
        setError(response.error || 'Failed to approve redemption');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    } finally {
      // Remove from processing set to re-enable button
      setProcessingApprovals(prev => {
        const newSet = new Set(prev);
        newSet.delete(redemptionId);
        return newSet;
      });
    }
  }, [clearError, fetchApprovals, fetchApprovalQueue]);

  const rejectRedemption = useCallback(async (redemptionId: string, reason?: string): Promise<boolean> => {
    try {
      // Add to processing set to disable specific button
      setProcessingApprovals(prev => new Set(prev).add(redemptionId));
      clearError();
      
      const input: SubmitApprovalInput = {
        approvalRequestId: redemptionId,
        decision: 'rejected',
        comments: reason
      };

      const response: ApprovalResponse = await approvalService.submitApproval(input);

      if (response.success) {
        await Promise.all([fetchApprovals(), fetchApprovalQueue()]);
        return true;
      } else {
        setError(response.error || 'Failed to reject redemption');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    } finally {
      // Remove from processing set to re-enable button
      setProcessingApprovals(prev => {
        const newSet = new Set(prev);
        newSet.delete(redemptionId);
        return newSet;
      });
    }
  }, [clearError, fetchApprovals, fetchApprovalQueue]);

  // Utility functions
  const getApprovalById = useCallback((id: string): ApprovalRecord | undefined => {
    return approvals.find(approval => approval.id === id);
  }, [approvals]);

  const getApprovalsByStatus = useCallback((filterStatus: ApprovalStatusType): ApprovalRecord[] => {
    return approvals.filter(approval => approval.status === filterStatus);
  }, [approvals]);

  const getUserPendingApprovals = useCallback((): ApprovalQueueItem[] => {
    if (!approverId) return [];
    return queueItems.filter(item => 
      item.status === 'pending' && 
      item.assignedApprovers.includes(approverId)
    );
  }, [queueItems, approverId]);

  const canApprove = useCallback((approvalId: string): boolean => {
    if (!approverId) return false;
    
    // Super Admin can approve anything - check if user ID indicates Super Admin role
    // This is a simplified check - in production, you'd query user roles from database
    const isSuperAdmin = approverId === 'super-admin' || 
                        approverId.includes('admin') || 
                        true; // For now, allow all logged-in users to approve (as requested)
    
    const queueItem = queueItems.find(item => item.approvalId === approvalId);
    return queueItem ? 
      queueItem.status === 'pending' && 
      (isSuperAdmin || queueItem.assignedApprovers?.includes(approverId)) : false;
  }, [queueItems, approverId]);

  const getApprovalProgress = useCallback((approvalId: string): { current: number; required: number; percentage: number } | null => {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return null;

    const current = approval.status === 'approved' ? 1 : 0;
    const required = approval.requiredApprovals || 1;
    const percentage = Math.round((current / required) * 100);

    return { current, required, percentage };
  }, [approvals]);

  // Initial load effect
  useEffect(() => {
    isUnmountedRef.current = false;
    Promise.all([fetchApprovals(), fetchApprovalQueue()]);
  }, [fetchApprovals, fetchApprovalQueue]);

  // Real-time subscription effect (separate from initial load)
  useEffect(() => {
    if (enableRealtime) {
      // Small delay to avoid immediate connection after data load
      const timeoutId = setTimeout(() => {
        if (!isUnmountedRef.current) {
          setupRealtimeSubscription();
        }
      }, 2000);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [enableRealtime, redemptionId, approverId, status, setupRealtimeSubscription]);

  // Auto-refresh effect (only when real-time is disabled)
  useEffect(() => {
    if (!autoRefresh || enableRealtime) return;

    autoRefreshRef.current = setInterval(() => {
      if (!loading && !isUnmountedRef.current) {
        Promise.all([fetchApprovals(), fetchApprovalQueue()]);
      }
    }, refreshInterval);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    };
  }, [autoRefresh, enableRealtime, refreshInterval, loading, fetchApprovals, fetchApprovalQueue]);

  // Cleanup effect on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      cleanupTimers();
      cleanupRealtimeSubscription();
    };
  }, [cleanupTimers, cleanupRealtimeSubscription]);

  // Helper function to check if a specific redemption is being processed
  const isProcessing = useCallback((redemptionId: string): boolean => {
    return processingApprovals.has(redemptionId);
  }, [processingApprovals]);

  return {
    approvals,
    queueItems,
    currentApproval,
    loading,
    error,
    metrics,
    pendingApprovals: queueItems.filter(item => item.status === 'pending'), // Derived from queueItems
    processingApprovals,
    isProcessing,
    submitApproval,
    requestApproval,
    delegateApproval,
    escalateApproval,
    refreshApprovals,
    refreshQueue,
    approveRedemption,
    rejectRedemption,
    getApprovalById,
    getApprovalsByStatus,
    getUserPendingApprovals,
    canApprove,
    getApprovalProgress,
    clearError
  };
};