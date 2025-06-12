import { supabase } from "@/infrastructure/database/client";
import { getCurrentUserId } from "./auth/index";

/**
 * Logs an activity in the audit_logs table
 * @param params The activity details to log
 * @returns The created audit log entry
 */
export async function logActivity(params: {
  action: string;
  entity_id?: string | null;
  entity_type?: string | null;
  details?: any;
  status?: string | null;
  project_id?: string | null;
}): Promise<any> {
  try {
    const userId = await getCurrentUserId();
    
    // Get user email if userId is available
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
    
    // Insert audit log entry
    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        action: params.action,
        entity_id: params.entity_id || null,
        entity_type: params.entity_type || null,
        details: typeof params.details === 'string' 
          ? params.details 
          : JSON.stringify(params.details),
        status: params.status || "success",
        user_id: userId,
        user_email: userEmail,
        username: username,
        project_id: params.project_id || null,
        timestamp: new Date().toISOString(),
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