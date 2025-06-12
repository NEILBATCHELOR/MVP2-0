import React, { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/infrastructure/supabaseClient';
import { RedemptionStatusType } from '../types';
import { useRedemptionNotifications } from './RedemptionNotifications';

interface RedemptionStatusSubscriberProps {
  redemptionId: string;
  onStatusChange?: (newStatus: RedemptionStatusType, oldStatus: RedemptionStatusType) => void;
  enableNotifications?: boolean;
  children?: React.ReactNode;
}

export const RedemptionStatusSubscriber: React.FC<RedemptionStatusSubscriberProps> = ({
  redemptionId,
  onStatusChange,
  enableNotifications = true,
  children
}) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { addNotification } = useRedemptionNotifications();

  useEffect(() => {
    if (!redemptionId) return;

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new subscription for specific redemption
    const channel = supabase
      .channel(`redemption_status_${redemptionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'redemption_requests',
          filter: `id=eq.${redemptionId}`
        },
        (payload) => {
          const { new: newRecord, old: oldRecord } = payload;
          
          if (newRecord && oldRecord && newRecord.status !== oldRecord.status) {
            const newStatus = newRecord.status as RedemptionStatusType;
            const oldStatus = oldRecord.status as RedemptionStatusType;
            
            // Call the status change callback
            onStatusChange?.(newStatus, oldStatus);
            
            // Send notification if enabled
            if (enableNotifications) {
              const statusMessages = {
                'pending': 'Redemption request submitted for review',
                'approved': 'Redemption request has been approved',
                'processing': 'Settlement process has started',
                'settled': 'Redemption completed successfully',
                'rejected': 'Redemption request was rejected',
                'cancelled': 'Redemption request was cancelled'
              };

              const notificationTypes = {
                'approved': 'success' as const,
                'settled': 'success' as const,
                'rejected': 'error' as const,
                'cancelled': 'warning' as const,
                'processing': 'info' as const,
                'pending': 'info' as const
              };

              addNotification({
                type: notificationTypes[newStatus] || 'info',
                title: 'Redemption Status Update',
                message: statusMessages[newStatus] || `Status changed to ${newStatus}`,
                redemptionId: redemptionId,
                actionUrl: `/redemptions/${redemptionId}`
              });
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [redemptionId, onStatusChange, enableNotifications, addNotification]);

  // This component doesn't render anything by default, just manages subscriptions
  return children ? <>{children}</> : null;
};

export default RedemptionStatusSubscriber;
