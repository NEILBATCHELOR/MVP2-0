import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/infrastructure/database/client";

// Types for the API
export interface TransactionEvent {
  id: string;
  requestId: string;
  eventType:
    | "status_change"
    | "approval"
    | "blockchain_confirmation"
    | "rejection"
    | "creation";
  timestamp: string;
  data: any;
  actor?: string;
  actorRole?: string;
}

// Create transaction_events table in Supabase
export const createTransactionEventsTable = async () => {
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from("transaction_events")
      .select("id")
      .limit(1);

    if (error && error.code === "42P01") {
      // Table doesn't exist
      // Create the table using SQL
      const { error: createError } = await supabase.rpc(
        "create_transaction_events_table",
        {},
      );
      if (createError) throw createError;

      // Add to realtime publication
      const { error: realtimeError } = await supabase.rpc(
        "add_table_to_realtime",
        {
          table_name: "transaction_events",
        },
      );
      if (realtimeError) throw realtimeError;
    }
  } catch (error) {
    console.error("Error creating transaction_events table:", error);
  }
};

// API functions

// Get transaction history for a specific redemption request
export const getTransactionHistory = async (
  requestId: string,
): Promise<TransactionEvent[]> => {
  try {
    // Ensure the table exists
    await createTransactionEventsTable();

    const { data, error } = await supabase
      .from("transaction_events")
      .select("*")
      .eq("request_id", requestId)
      .order("timestamp", { ascending: false });

    if (error) throw error;

    // Transform data to match our interface
    return (
      data?.map((item) => ({
        id: item.id,
        requestId: item.request_id,
        eventType: item.event_type as
          | "status_change"
          | "approval"
          | "blockchain_confirmation"
          | "rejection"
          | "creation",
        timestamp: item.timestamp,
        data: item.data,
        actor: item.actor,
        actorRole: item.actor_role,
      })) || []
    );
  } catch (error) {
    console.error(
      `Error fetching transaction history for request ${requestId}:`,
      error,
    );
    return [];
  }
};

// Add a new transaction event
export const addTransactionEvent = async (
  event: Omit<TransactionEvent, "id">,
): Promise<TransactionEvent> => {
  try {
    // Ensure the table exists
    await createTransactionEventsTable();

    // Format the data for Supabase
    const dbEvent = {
      request_id: event.requestId,
      event_type: event.eventType,
      timestamp: event.timestamp || new Date().toISOString(),
      data: event.data,
      actor: event.actor,
      actor_role: event.actorRole,
    };

    const { data, error } = await supabase
      .from("transaction_events")
      .insert(dbEvent)
      .select()
      .single();

    if (error) throw error;

    // Return the created event with the format expected by the frontend
    return {
      id: data.id,
      requestId: data.request_id,
      eventType: data.event_type as
        | "status_change"
        | "approval"
        | "blockchain_confirmation"
        | "rejection"
        | "creation",
      timestamp: data.timestamp,
      data: data.data,
      actor: data.actor,
      actorRole: data.actor_role,
    };
  } catch (error) {
    console.error("Error adding transaction event:", error);
    throw error;
  }
};

// Get all transaction events (for admin purposes)
export const getAllTransactionEvents = async (): Promise<
  TransactionEvent[]
> => {
  try {
    // Ensure the table exists
    await createTransactionEventsTable();

    const { data, error } = await supabase
      .from("transaction_events")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) throw error;

    // Transform data to match our interface
    return (
      data?.map((item) => ({
        id: item.id,
        requestId: item.request_id,
        eventType: item.event_type as
          | "status_change"
          | "approval"
          | "blockchain_confirmation"
          | "rejection"
          | "creation",
        timestamp: item.timestamp,
        data: item.data,
        actor: item.actor,
        actorRole: item.actor_role,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching all transaction events:", error);
    return [];
  }
};

// Get transaction events by type
export const getTransactionEventsByType = async (
  eventType: TransactionEvent["eventType"],
): Promise<TransactionEvent[]> => {
  try {
    // Ensure the table exists
    await createTransactionEventsTable();

    const { data, error } = await supabase
      .from("transaction_events")
      .select("*")
      .eq("event_type", eventType)
      .order("timestamp", { ascending: false });

    if (error) throw error;

    // Transform data to match our interface
    return (
      data?.map((item) => ({
        id: item.id,
        requestId: item.request_id,
        eventType: item.event_type as
          | "status_change"
          | "approval"
          | "blockchain_confirmation"
          | "rejection"
          | "creation",
        timestamp: item.timestamp,
        data: item.data,
        actor: item.actor,
        actorRole: item.actor_role,
      })) || []
    );
  } catch (error) {
    console.error(
      `Error fetching transaction events by type ${eventType}:`,
      error,
    );
    return [];
  }
};
