import { supabase } from "@/infrastructure/database/client";
import { getCurrentUserId } from "./auth/index";

/**
 * Logs an activity to the audit_logs table
 * @param params Activity parameters
 * @returns The created audit log entry
 */
export async function logActivity(params: {
  action: string;
  details?: any;
  entity_id?: string;
  entity_type?: string;
  status?: string;
  project_id?: string;
}) {
  try {
    const userId = await getCurrentUserId();
    
    // Get user details if userId is available
    let userEmail = null;
    let username = null;
    
    if (userId) {
      const { data: userData } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", userId)
        .single();
        
      if (userData) {
        userEmail = userData.email;
        username = userData.name;
      }
    }
    
    // Format details if it's an object
    const formattedDetails = typeof params.details === 'object' 
      ? JSON.stringify(params.details)
      : params.details;
    
    // Insert audit log
    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        action: params.action,
        details: formattedDetails,
        entity_id: params.entity_id,
        entity_type: params.entity_type,
        status: params.status || "success",
        user_id: userId,
        user_email: userEmail,
        username: username,
        project_id: params.project_id,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error logging activity:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Exception in logActivity:", error);
    return null;
  }
}