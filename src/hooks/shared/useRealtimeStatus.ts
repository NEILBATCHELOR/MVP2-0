import { useState, useEffect } from "react";
import { useNotifications } from "@/infrastructure/utils/helpers/NotificationContext";
import realtimeService from "@/services/realtime/realtimeService";
import { RedemptionRequest } from "@/infrastructure/api/approvalApi";

// Define Approver type locally since it's not exported from approvalApi
export interface Approver {
  id: string;
  userId: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: string;
  comment?: string;
}

type StatusType =
  | "pending"
  | "approved"
  | "processing"
  | "completed"
  | "rejected";

interface UseRealtimeStatusOptions {
  notifyOnChange?: boolean;
  initialStatus?: StatusType;
}

/**
 * Hook to subscribe to real-time status updates for a redemption request
 */
export function useRealtimeStatus(
  requestId: string,
  options: UseRealtimeStatusOptions = {},
) {
  const { notifyOnChange = true, initialStatus = "pending" } = options;
  const [status, setStatus] = useState<StatusType>(initialStatus);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!requestId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Initial data fetch (in a real app, this would be an API call)
    const fetchInitialData = async () => {
      try {
        // Simulate API call to get current status
        // In a real app, this would be a call to your API
        const response = await fetch(`/api/redemptions/${requestId}`);
        if (!response.ok) throw new Error("Failed to fetch redemption data");

        const data = await response.json();
        setStatus(data.status);
        setApprovers(data.approvers || []);
      } catch (err) {
        console.error("Error fetching redemption data:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));

        // For demo purposes, we'll just set some default data
        // In a real app, you'd want to handle this error properly
        setStatus(initialStatus);
      } finally {
        setIsLoading(false);
      }
    };

    // Uncomment this in a real app
    // fetchInitialData();

    // For demo purposes, just set the initial status
    setStatus(initialStatus);
    setIsLoading(false);

    // Subscribe to status changes
    const statusSubscriptionId = realtimeService.subscribeToRedemptionStatus(
      requestId,
      (newStatus) => {
        setStatus(newStatus as StatusType);

        if (notifyOnChange) {
          // Status change notifications disabled to reduce distractions
        }
      },
    );

    // Subscribe to approval changes
    const approvalSubscriptionId = realtimeService.subscribeToApprovals(
      requestId,
      (newApprovers: any[]) => {
        // Cast the incoming data to our Approver type
        const typedApprovers = newApprovers as unknown as Approver[];
        setApprovers(typedApprovers);

        if (notifyOnChange) {
          // Approval notifications disabled to reduce distractions
        }
      },
    );

    // Clean up subscriptions when component unmounts
    return () => {
      realtimeService.unsubscribe(statusSubscriptionId);
      realtimeService.unsubscribe(approvalSubscriptionId);
    };
  }, [requestId, initialStatus, notifyOnChange, addNotification]);

  return { status, approvers, isLoading, error };
}
