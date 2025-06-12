import { supabase } from "@/infrastructure/database/client";
import { 
  RealtimeChannel, 
  RealtimePostgresChangesPayload, 
  RealtimePostgresChangesFilter,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload
} from "@supabase/supabase-js";
import { mapDbRedemptionToRedemptionRequest } from "@/utils/shared/formatting/typeMappers";
import { toISOString } from "@/utils/date/dateHelpers";
import { RedemptionRequest, Approver } from "@/types/core/centralModels";
import { mapDbRedemptionRequestToRedemptionRequest, mapDbApproverToApprover } from "@/utils/shared/formatting/workflowMappers";

type InsertCallback<T> = (payload: RealtimePostgresInsertPayload<T>) => void;
type UpdateCallback<T> = (payload: RealtimePostgresUpdatePayload<T>) => void;
type DeleteCallback<T> = (payload: RealtimePostgresDeletePayload<T>) => void;
type AnyEventCallback<T> = (payload: RealtimePostgresChangesPayload<T>) => void;

// Union type for all possible callback types
type SubscriptionCallback<T = any> = 
  | InsertCallback<T> 
  | UpdateCallback<T> 
  | DeleteCallback<T>
  | AnyEventCallback<T>;

interface SubscriptionOptions {
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
  table: string;
  filter?: string;
}

class RealtimeService {
  private subscriptions: Record<string, { unsubscribe: () => void }> = {};

  /**
   * Subscribe to real-time changes on a table
   * @param options Subscription options
   * @param callback Function to call when changes occur
   * @returns Subscription ID
   */
  subscribe<T = any>(
    options: SubscriptionOptions,
    callback: SubscriptionCallback<T>,
  ): string {
    const { event = "*", schema = "public", table, filter } = options;
    const subscriptionId = `${schema}:${table}:${event}:${filter || "all"}`;

    // If we already have this subscription, return its ID
    if (this.subscriptions[subscriptionId]) {
      return subscriptionId;
    }

    // Create filter object that matches Supabase's expected format
    const filterOptions: RealtimePostgresChangesFilter<any> = { 
      event: event as "INSERT" | "UPDATE" | "DELETE" | "*", 
      schema, 
      table: table,
    };
    
    // Add optional filter if provided
    if (filter) {
      filterOptions.filter = filter;
    }

    // Create the subscription with proper typing
    const subscription = supabase
      .channel(subscriptionId)
      .on(
        'postgres_changes', 
        filterOptions, 
        // Cast callback to match expected signature
        ((payload) => {
          callback(payload as any);
        }) as AnyEventCallback<T>
      )
      .subscribe();

    // Store the subscription
    this.subscriptions[subscriptionId] = {
      unsubscribe: () => {
        subscription.unsubscribe();
        delete this.subscriptions[subscriptionId];
      },
    };

    return subscriptionId;
  }

  /**
   * Unsubscribe from a subscription
   * @param subscriptionId The ID of the subscription to unsubscribe from
   */
  unsubscribe(subscriptionId: string): void {
    if (this.subscriptions[subscriptionId]) {
      this.subscriptions[subscriptionId].unsubscribe();
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    Object.keys(this.subscriptions).forEach((id) => {
      this.subscriptions[id].unsubscribe();
    });
  }

  /**
   * Subscribe to redemption request status changes
   * @param requestId The ID of the redemption request to subscribe to
   * @param callback Function to call when the status changes
   * @returns Subscription ID
   */
  subscribeToRedemptionStatus(
    requestId: string,
    callback: (status: string) => void,
  ): string {
    return this.subscribe(
      {
        table: "redemption_requests",
        event: "UPDATE",
        filter: `id=eq.${requestId}`,
      },
      (payload) => {
        if ('new' in payload && 'old' in payload && 
            payload.new && payload.old && 
            payload.new.status !== payload.old.status) {
          callback(payload.new.status);
        }
      },
    );
  }

  /**
   * Subscribe to all redemption requests for an investor
   * @param investorId The ID of the investor
   * @param callback Function to call when new redemption requests are created
   * @returns RealtimeChannel for direct subscription management
   */
  subscribeToInvestorRedemptions(
    investorId: string,
    callback: (redemptionRequest: RedemptionRequest) => void
  ): RealtimeChannel {
    return supabase
      .channel("investor-redemptions")
      .on(
        'postgres_changes',
        {
          event: "INSERT",
          schema: "public",
          table: "redemption_requests",
          filter: `investor_id=eq.${investorId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Convert database record to application model using our mapper
          if ('new' in payload && payload.new) {
            const redemptionRequest = mapDbRedemptionRequestToRedemptionRequest(payload.new);
            callback(redemptionRequest);
          }
        }
      )
      .subscribe();
  }

  /**
   * Maps a status string to one of the valid RedemptionRequest status literals
   * @param status The status string from the database
   * @returns A valid status literal for RedemptionRequest
   */
  private mapStatusToApprovalStatus(
    status: string
  ): "Pending" | "Approved" | "Processing" | "Completed" | "Rejected" {
    // Convert to lowercase for case-insensitive matching
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus.includes("pend")) return "Pending";
    if (normalizedStatus.includes("approv")) return "Approved";
    if (normalizedStatus.includes("process")) return "Processing";
    if (normalizedStatus.includes("complet")) return "Completed";
    if (normalizedStatus.includes("reject")) return "Rejected";
    
    // Default fallback
    return "Pending";
  }

  /**
   * Subscribe to approval changes for a redemption request
   * @param requestId The ID of the redemption request
   * @param callback Function to call when approvals change
   * @returns Subscription ID
   */
  subscribeToApprovals(
    requestId: string,
    callback: (approvers: Approver[]) => void,
  ): string {
    return this.subscribe(
      {
        table: "redemption_approvers",
        filter: `redemption_id=eq.${requestId}`,
      },
      (payload) => {
        // In a real implementation, we would fetch all approvers
        if ('new' in payload && payload.new) {
          const approver = mapDbApproverToApprover(payload.new);
          callback([approver]);
        }
      },
    );
  }
}

// Create a singleton instance
const realtimeService = new RealtimeService();
export default realtimeService;
