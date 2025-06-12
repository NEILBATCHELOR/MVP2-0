import { supabase } from '@/infrastructure/database/client';
import type { Tables } from "@/types/core/database";

/**
 * Gets the current user's role from Supabase
 * @returns The user's role or null if not authenticated
 */
export async function getCurrentUserRole(): Promise<string | null> {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn("No active session found");
      return null;
    }
    
    // Get the user's status from the database - the 'status' field will be used for role
    // since there's no role field in the schema
    const { data, error } = await supabase
      .from("users")
      .select("status")
      .eq("id", session.user.id)
      .single();
    
    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
    
    // Using status as a substitute for role
    const userTableData = data as Tables<'users'>;
    return userTableData?.status || null;
  } catch (error) {
    console.error("Error in getCurrentUserRole:", error);
    return null;
  }
}

/**
 * Gets the current user's ID from the Supabase session
 * @returns The user's ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error("Error in getCurrentUserId:", error);
    return null;
  }
}

/**
 * Checks if the current user has a specific role
 * @param role The role to check
 * @returns Boolean indicating if user has the role
 */
export async function hasRole(role: string): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  return userRole === role;
}

/**
 * Checks if the current user can perform a specific action
 * @param action The action to check permission for
 * @returns Boolean indicating if user has permission
 */
export async function canPerformAction(action: string): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  
  if (!userRole) return false;
  
  // Get permissions for the user's role
  let query = supabase
    .from("role_permissions")
    .select("*");
  
  query = (query as any).eq("role", userRole).single();
  
  const { data, error } = await query;
  
  if (error || !data) {
    console.error("Error fetching permissions:", error);
    return false;
  }
  
  // Check if there's a permissions array in the data
  // The permissions might be stored as a JSON field
  if (data && typeof data === 'object') {
    const permissionsData = data as Record<string, any>;
    
    // Check if permissions exists and is an array
    if (Array.isArray(permissionsData.permissions)) {
      return permissionsData.permissions.includes(action);
    }
    
    // If permissions is a string, try to parse it as JSON
    if (typeof permissionsData.permissions === 'string') {
      try {
        const parsedPermissions = JSON.parse(permissionsData.permissions);
        if (Array.isArray(parsedPermissions)) {
          return parsedPermissions.includes(action);
        }
      } catch (e) {
        console.error("Error parsing permissions:", e);
      }
    }
  }
  
  // Default: no permission found
  return false;
}