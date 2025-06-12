import { supabase } from "@/infrastructure/database/client";
import { v4 as uuidv4 } from "uuid";
import { normalizeRole } from "@/utils/auth/roleUtils";
import type { Tables } from "@/types/core/database";
import type { User } from "@/types/shared/models";

// Types
export interface UserRole {
  user_id: string;
  role_id: string;
  created_at?: string;
  updated_at?: string;
  role?: string; // For backwards compatibility with normalized role values
}

// Get all roles for a user
export const getUserRoles = async (userId: string): Promise<UserRole[]> => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error(`Error fetching roles for user ${userId}:`, error);
      throw error;
    }

    // Normalize all roles to ensure consistency
    if (data) {
      return data.map(role => ({
        user_id: role.user_id,
        role_id: role.role_id,
        created_at: role.created_at,
        updated_at: role.updated_at,
        role: normalizeRole(role.role_id) // Add role property based on role_id for backwards compatibility
      }));
    }

    return [];
  } catch (error) {
    console.error(`Error in getUserRoles for user ${userId}:`, error);
    return [];
  }
};

// Add a role to a user
export const addUserRole = async (
  userId: string,
  role: string,
): Promise<UserRole> => {
  try {
    const now = new Date().toISOString();
    const normalizedRole = normalizeRole(role);

    // Make DB-compatible insert object
    const insertData: Tables<"user_roles"> = {
      user_id: userId,
      role_id: normalizedRole,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("user_roles")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`Error adding role ${role} to user ${userId}:`, error);
      throw error;
    }

    // Return with additional role field for backwards compatibility
    return {
      user_id: data.user_id,
      role_id: data.role_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      role: normalizedRole
    };
  } catch (error) {
    console.error(`Error in addUserRole for user ${userId}:`, error);
    throw error;
  }
};

// Remove a role from a user
export const removeUserRole = async (
  userId: string, 
  roleId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role_id", roleId);

    if (error) {
      console.error(`Error removing role ${roleId} from user ${userId}:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`Error in removeUserRole for user ${userId} and role ${roleId}:`, error);
    throw error;
  }
};

// Update a user's role
export const updateUserRole = async (
  userId: string,
  oldRoleId: string,
  newRole: string,
): Promise<UserRole> => {
  try {
    const now = new Date().toISOString();
    const normalizedRole = normalizeRole(newRole);
    
    // Since we can't update the primary key directly, we need to delete and insert
    // First, delete the old role
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role_id", oldRoleId);
      
    if (deleteError) {
      console.error(`Error deleting old role ${oldRoleId} for user ${userId}:`, deleteError);
      throw deleteError;
    }
    
    // Then, insert the new role
    const insertData = {
      user_id: userId,
      role_id: normalizedRole,
      created_at: now,
      updated_at: now,
    };
    
    const { data, error } = await supabase
      .from("user_roles")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`Error adding new role ${normalizedRole} to user ${userId}:`, error);
      throw error;
    }

    // Return with additional role field for backwards compatibility
    return {
      user_id: data.user_id,
      role_id: data.role_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      role: normalizedRole
    };
  } catch (error) {
    console.error(`Error in updateUserRole for user ${userId}:`, error);
    throw error;
  }
};

// Get all users with a specific role
export const getUsersByRole = async (role: string): Promise<string[]> => {
  try {
    const normalizedRole = normalizeRole(role);
    
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role_id", normalizedRole);

    if (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      throw error;
    }

    return data?.map((item) => item.user_id) || [];
  } catch (error) {
    console.error(`Error in getUsersByRole for role ${role}:`, error);
    return [];
  }
};
