import { createClient, User as AuthUser } from "@supabase/supabase-js";
import { User } from "@/types/domain/user/User";
import { supabase } from "@/infrastructure/database/client";
import type { Database } from '@/types/core/database';
import type { Tables } from '@/types/core/supabase';
import { normalizeRole } from "@/utils/auth/roleUtils";
import { logActivity } from "@/infrastructure/activityLogger";
import { v4 as uuidv4 } from "uuid";

// Create a Supabase client with admin privileges for user management
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

try {
  // Initialize admin client if we have the credentials
  if (
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  ) {
    supabaseAdmin = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );
  }
} catch (error) {
  console.error("Failed to initialize admin Supabase client:", error);
}

// Check if we're in test mode (no Supabase URL/key)
const isTestMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (isTestMode) {
  console.warn("Running in TEST MODE - no actual Supabase calls will be made");
}

// Mock user counter for test mode
let mockUserCounter = 100;

/**
 * Creates a user in both Supabase auth and the custom users table
 */
export async function createUser(userData: {
  name: string;
  email: string;
  role: string;
  publicKey?: string;
  encryptedPrivateKey?: string;
  password: string;
  sendInvitation?: boolean;
}) {
  console.log("Creating user:", userData);
  
  if (isTestMode) {
    console.log("TEST MODE: Returning mock user");
    return {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      role: normalizeRole(userData.role),
      publicKey: userData.publicKey,
      encryptedPrivateKey: userData.encryptedPrivateKey,
      created_at: new Date().toISOString()
    };
  }
  
  try {
    // Make sure supabaseAdmin is initialized
    if (!supabaseAdmin) {
      throw new Error("Admin client not initialized");
    }
    
    // Step 1: Create user in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin!.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: userData.sendInvitation || false,
      user_metadata: {
        name: userData.name,
        role: normalizeRole(userData.role)
      }
    });

    if (authError) {
      console.error("Auth error creating user:", authError);
      throw authError;
    }

    console.log("Auth user created successfully");

    try {
      // Step 2: Create matching record in custom users table
      const { data: dbUser, error: dbError } = await supabaseAdmin!
        .from("users")
        .insert({
          id: authUser.user.id,
          name: userData.name,
          email: userData.email,
          role: normalizeRole(userData.role),
          status: "active",
          public_key: userData.publicKey || null,
          encrypted_private_key: userData.encryptedPrivateKey || null
        })
        .select()
        .single();

      if (dbError) {
        console.error("DB error creating user:", dbError);
        // Rollback: Delete the auth user
        await supabaseAdmin!.auth.admin.deleteUser(authUser.user.id);
        throw dbError;
      }

      console.log("DB user created successfully");

      // Step 3: Create entry in user_roles table
      try {
        const { error: roleError } = await supabaseAdmin!.from("user_roles").insert({
          user_id: authUser.user.id,
          role: normalizeRole(userData.role),
        });
    
        if (roleError) {
          console.error("Role error creating user:", roleError);
          // Rollback: Delete both users
          await supabaseAdmin!.from("users").delete().eq("id", authUser.user.id);
          await supabaseAdmin!.auth.admin.deleteUser(authUser.user.id);
          throw roleError;
        }
        
        console.log("User role assigned successfully");
      } catch (roleErr) {
        console.log("Role table might not exist, continuing without role assignment");
      }

      return { ...dbUser, auth_id: authUser.user.id };
    } catch (error) {
      // If any step fails after auth user creation, clean up the auth user
      await supabaseAdmin!.auth.admin.deleteUser(authUser.user.id);
      throw error;
    }
  } catch (error) {
    console.error("Error in user creation process:", error);
    throw error;
  }
}

/**
 * Updates a user in both Supabase auth and the users table
 */
export async function updateUser(
  userId: string, 
  updates: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    password?: string;
    publicKey?: string;
    encryptedPrivateKey?: string;
  }
) {
  console.log("updateUser called for ID:", userId);
  
  if (isTestMode) {
    console.log("TEST MODE: Returning mock updated user");
    return {
      id: userId,
      ...updates,
      updated_at: new Date().toISOString()
    };
  }
  
  try {
    // First check if user exists in the database
    const { data: dbUser, error: dbCheckError } = await supabaseAdmin!
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (dbCheckError) {
      console.error("Error checking db user:", dbCheckError);
      throw dbCheckError;
    }

    if (!dbUser) {
      throw new Error("User not found in database");
    }

    // Check if user exists in auth system (but don't fail if they don't)
    let authUser = null;
    try {
      const { data: authData, error: authCheckError } = await supabaseAdmin!.auth.admin.getUserById(userId);
      if (!authCheckError && authData) {
        authUser = authData.user;
      }
    } catch (error) {
      console.log("User not found in auth system, continuing with database update only");
    }

    // If updating email, check it's not already taken
    if (updates.email && updates.email !== dbUser.email) {
      const { data: existingUser } = await supabaseAdmin!
        .from("users")
        .select("id")
        .eq("email", updates.email)
        .maybeSingle();

      if (existingUser) {
        throw new Error("Email address is already in use");
      }
    }

    // Prepare updates for each system
    const authUpdates: Record<string, any> = {};
    const dbUpdates: Record<string, any> = {};
    
    // Map updates to their respective systems
    if (updates.name) {
      dbUpdates.name = updates.name;
      if (authUser) {
        authUpdates.user_metadata = { ...authUser.user_metadata, name: updates.name };
      }
    }
    if (updates.email) {
      dbUpdates.email = updates.email;
      if (authUser) {
        authUpdates.email = updates.email;
      }
    }
    if (updates.role) {
      const normalizedRole = normalizeRole(updates.role);
      dbUpdates.role = normalizedRole;
      if (authUser) {
        authUpdates.user_metadata = { 
          ...authUser.user_metadata, 
          role: normalizedRole
        };
      }
      
      // Also update the user_roles table if it exists
      try {
        const { data: existingRoles } = await supabaseAdmin!
          .from("user_roles")
          .select("id")
          .eq("user_id", userId);
          
        if (existingRoles && existingRoles.length > 0) {
          // Update the existing role entry
          await supabaseAdmin!
            .from("user_roles")
            .update({ role: normalizedRole })
            .eq("user_id", userId);
        } else {
          // Insert a new role entry
          await supabaseAdmin!
            .from("user_roles")
            .insert({ user_id: userId, role: normalizedRole });
        }
      } catch (roleError) {
        console.log("Error updating role in user_roles table, may not exist:", roleError);
      }
    }
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.password && authUser) authUpdates.password = updates.password;
    if (updates.publicKey) dbUpdates.public_key = updates.publicKey;
    if (updates.encryptedPrivateKey) dbUpdates.encrypted_private_key = updates.encryptedPrivateKey;
    
    // Update auth user if it exists and there are auth updates
    if (authUser && Object.keys(authUpdates).length > 0) {
      console.log("Updating auth user...");
      const { error: authError } = await supabaseAdmin!.auth.admin.updateUserById(
        userId,
        authUpdates
      );
      
      if (authError) {
        console.error("Error updating auth user:", authError);
        // Don't throw here, continue with database update
        console.log("Continuing with database update despite auth update failure");
      } else {
        console.log("Auth user updated successfully");
      }
    }
    
    // Update custom users table
    if (Object.keys(dbUpdates).length > 0) {
      console.log("Updating database user...");
      const { data: updatedUser, error: dbError } = await supabaseAdmin!
        .from("users")
        .update(dbUpdates)
        .eq("id", userId)
        .select()
        .single();
        
      if (dbError) {
        console.error("Error updating database user:", dbError);
        throw dbError;
      }
      console.log("Database user updated successfully");
      
      return updatedUser;
    }
    
    return dbUser;
  } catch (error) {
    console.error("Error in user update process:", error);
    throw error;
  }
}

/**
 * Deletes a user from both auth and users table, handling cases where the user
 * might exist in one system but not the other
 */
export const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  if (isTestMode) {
    console.log("TEST MODE: Pretending to delete user", userId);
    return { success: true };
  }

  try {
    // First verify user exists in database
    const { data: dbUser, error: userError } = await supabaseAdmin!
      .from('users')
      .select<'*', Database['public']['Tables']['users']['Row']>('*')
      .eq('id', userId)
      .single();

    if (userError) {
      return { success: false, error: `Error checking user: ${userError.message}` };
    }

    if (!dbUser) {
      return { success: false, error: 'User not found in database' };
    }

    // Call the privileged function to delete the user
    const { error: deleteError } = await supabaseAdmin!
      .rpc('delete_user_with_privileges', { user_id: userId });

    if (deleteError) {
      return { success: false, error: `Error deleting from database: ${deleteError.message}` };
    }

    // Try to delete from auth.users, but don't fail if user doesn't exist
    try {
      await supabaseAdmin!.auth.admin.deleteUser(userId);
      console.log('Successfully deleted user from auth system');
    } catch (authError: any) {
      // Log but continue if user not found in auth
      if (authError?.status === 404) {
        console.log('User not found in auth system, database cleanup completed');
      } else {
        // For other auth errors, log but don't fail
        console.error('Non-critical error deleting from auth system:', authError);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteUser:', error);
    return { success: false, error: 'Internal error deleting user' };
  }
}

/**
 * Gets users from both auth and custom users table with filtering, sorting and pagination
 */
export async function getUsers(options?: {
  page?: number;
  pageSize?: number;
  filter?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}) {
  console.log("getUsers called with options:", options);
  
  if (isTestMode) {
    console.log("TEST MODE: Returning mock users list");
    return getMockUsers(options);
  }
  
  try {
    // First get users from the custom table
    let query = supabaseAdmin!
      .from("users")
      .select<'*', Database['public']['Tables']['users']['Row']>("*", { count: 'exact' });
    
    // Apply filtering if provided
    if (options?.filter) {
      const filter = options.filter.toLowerCase();
      query = query.or(
        `name.ilike.%${filter}%,email.ilike.%${filter}%,role.ilike.%${filter}%`
      );
    }
    
    // Apply sorting
    const sortField = options?.sortBy || 'name';
    const sortOrder = options?.sortDirection || 'asc';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });
    
    // Apply pagination
    if (options?.page && options?.pageSize) {
      const from = (options.page - 1) * options.pageSize;
      const to = from + options.pageSize - 1;
      query = query.range(from, to);
    }
    
    // Execute query
    const { data: dbUsers, error: dbError, count } = await query;
    
    if (dbError) {
      console.error("Error fetching users from database:", dbError);
      throw dbError;
    }

    // Get auth users data
    const { data: authData, error: authError } = await supabaseAdmin!.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching auth users:", authError);
      throw authError;
    }

    type DbUser = Database['public']['Tables']['users']['Row'];

    // Merge auth and db data
    const mergedUsers = dbUsers?.map((dbUser: DbUser) => {
      const authUser = authData.users.find((au: AuthUser) => au.id === dbUser.id);
      return {
        ...dbUser,
        auth_metadata: authUser?.user_metadata || {},
        auth_confirmed: !!authUser?.confirmed_at,
        auth_last_sign_in: authUser?.last_sign_in_at,
        auth_created_at: authUser?.created_at,
        roles: [(dbUser as any).role]
      };
    });

    console.log(`Found ${mergedUsers?.length || 0} users`);
    
    return {
      users: mergedUsers || [],
      total: count || 0,
      page: options?.page || 1,
      pageSize: options?.pageSize || 10
    };
  } catch (error) {
    console.error("Error in user retrieval process:", error);
    throw error;
  }
}

// Helper function for mock data
function getMockUsers(options?: {
  page?: number;
  pageSize?: number;
  filter?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}) {
  const mockUsers = [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      role: "superAdmin",
      status: "active",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
      auth_metadata: { name: "John Doe", role: "superAdmin" },
      auth_confirmed: true,
      auth_last_sign_in: "2024-01-01T00:00:00.000Z",
      roles: ["superAdmin"]
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "complianceManager",
      status: "active",
      created_at: "2023-01-02T00:00:00.000Z",
      updated_at: "2023-01-02T00:00:00.000Z",
      auth_metadata: { name: "Jane Smith", role: "complianceManager" },
      auth_confirmed: true,
      auth_last_sign_in: "2024-01-02T00:00:00.000Z",
      roles: ["complianceManager"]
    },
    {
      id: "3",
      name: "Robert Johnson",
      email: "robert.johnson@example.com",
      role: "agent",
      status: "suspended",
      created_at: "2023-01-03T00:00:00.000Z",
      updated_at: "2023-01-03T00:00:00.000Z",
      auth_metadata: { name: "Robert Johnson", role: "agent" },
      auth_confirmed: false,
      auth_last_sign_in: null,
      roles: ["agent"]
    },
  ];
  
  // Apply filter if provided
  let filtered = [...mockUsers];
  if (options?.filter) {
    const filter = options.filter.toLowerCase();
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(filter) ||
      user.email.toLowerCase().includes(filter) ||
      user.role.toLowerCase().includes(filter)
    );
  }
  
  // Apply sorting
  const sortField = options?.sortBy || 'name';
  const sortDirection = options?.sortDirection || 'asc';
  filtered.sort((a, b) => {
    const aValue = a[sortField as keyof typeof a] || '';
    const bValue = b[sortField as keyof typeof b] || '';
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return 0;
  });
  
  // Apply pagination
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedUsers = filtered.slice(start, end);
  
  return {
    users: paginatedUsers,
    total: filtered.length,
    page,
    pageSize
  };
}