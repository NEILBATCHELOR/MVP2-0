import { supabase } from "@/infrastructure/database/client";

// Set up real-time subscriptions for cap table updates
export const setupCapTableRealtimeSubscription = (
  projectId: string,
  onUpdate: (payload: any) => void,
) => {
  // Subscribe to changes in the subscriptions table for this project
  const subscription = supabase
    .channel(`project-${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "subscriptions",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        console.log("New investor added:", payload);
        onUpdate({ type: "investor_added", data: payload.new });
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "subscriptions",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        console.log("Investor updated:", payload);
        onUpdate({ type: "investor_updated", data: payload.new });
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "subscriptions",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        console.log("Investor removed:", payload);
        onUpdate({ type: "investor_removed", data: payload.old });
      },
    )
    .subscribe();

  // Subscribe to changes in the token_allocations table
  const tokenSubscription = supabase
    .channel(`project-tokens-${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "token_allocations",
      },
      (payload) => {
        console.log("Token allocation changed:", payload);
        onUpdate({ type: "token_allocation_changed", data: payload });
      },
    )
    .subscribe();

  // Subscribe to changes in the documents table
  const documentsSubscription = supabase
    .channel(`project-documents-${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "documents",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        console.log("Document changed:", payload);
        onUpdate({ type: "document_changed", data: payload });
      },
    )
    .subscribe();

  // Return a function to clean up all subscriptions
  return () => {
    supabase.removeChannel(subscription);
    supabase.removeChannel(tokenSubscription);
    supabase.removeChannel(documentsSubscription);
  };
};

// Set up real-time subscriptions for investor updates
export const setupInvestorRealtimeSubscription = (
  investorId: string,
  onUpdate: (payload: any) => void,
) => {
  // Subscribe to changes in the investors table for this investor
  const subscription = supabase
    .channel(`investor-${investorId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "investors",
        filter: `investor_id=eq.${investorId}`,
      },
      (payload) => {
        console.log("Investor profile updated:", payload);
        onUpdate({ type: "profile_updated", data: payload.new });
      },
    )
    .subscribe();

  // Subscribe to changes in the subscriptions table for this investor
  const subscriptionsSubscription = supabase
    .channel(`investor-subscriptions-${investorId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "subscriptions",
        filter: `investor_id=eq.${investorId}`,
      },
      (payload) => {
        console.log("Investor subscription changed:", payload);
        onUpdate({ type: "subscription_changed", data: payload });
      },
    )
    .subscribe();

  // Return a function to clean up all subscriptions
  return () => {
    supabase.removeChannel(subscription);
    supabase.removeChannel(subscriptionsSubscription);
  };
};

// Set up real-time subscriptions for project updates
export const setupProjectRealtimeSubscription = (
  projectId: string,
  onUpdate: (payload: any) => void,
) => {
  // Subscribe to changes in the projects table for this project
  const subscription = supabase
    .channel(`project-details-${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "projects",
        filter: `id=eq.${projectId}`,
      },
      (payload) => {
        console.log("Project details updated:", payload);
        onUpdate({ type: "project_updated", data: payload.new });
      },
    )
    .subscribe();

  // Return a function to clean up the subscription
  return () => {
    supabase.removeChannel(subscription);
  };
};

// Set up real-time subscriptions for document updates
export const setupDocumentRealtimeSubscription = (
  documentId: string,
  onUpdate: (payload: any) => void,
) => {
  // Subscribe to changes in the documents table for this document
  const subscription = supabase
    .channel(`document-${documentId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "documents",
        filter: `id=eq.${documentId}`,
      },
      (payload) => {
        console.log("Document updated:", payload);
        onUpdate({ type: "document_updated", data: payload.new });
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "documents",
        filter: `id=eq.${documentId}`,
      },
      (payload) => {
        console.log("Document deleted:", payload);
        onUpdate({ type: "document_deleted", data: payload.old });
      },
    )
    .subscribe();

  // Return a function to clean up the subscription
  return () => {
    supabase.removeChannel(subscription);
  };
};
