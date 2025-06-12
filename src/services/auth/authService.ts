import { supabase } from '@/infrastructure/database/client';
import {
  signUp,
  getSession,
  signOut,
  resetPasswordForEmail
} from '@/infrastructure/auth/authClient';
import { User, UserRole } from '@/types/core/centralModels';
import { normalizeRole } from '@/utils/auth/roleUtils';

// Define UserStatus enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

// Add type definitions for the database responses
interface UserRoleWithRole {
  user_id: string;
  role_id: string;
  roles: {
    id: string;
    name: string;
    description: string;
    priority: number;
  };
}

interface CreateUserData {
  email: string;
  name: string;
  password: string;
  roleId: string;
  sendInvite?: boolean;
}

interface UpdateUserData {
  email?: string;
  name?: string;
  roleId?: string;
  status?: UserStatus;
}

// Utility functions to replace the missing imports
const toUserStatus = (status: string): UserStatus => {
  if (!status) return UserStatus.ACTIVE;
  
  const statusLower = status.toLowerCase();
  if (statusLower === 'active') return UserStatus.ACTIVE;
  if (statusLower === 'inactive') return UserStatus.INACTIVE;
  if (statusLower === 'pending') return UserStatus.PENDING;
  if (statusLower === 'suspended') return UserStatus.SUSPENDED;
  
  return UserStatus.ACTIVE;
};

const isUserStatus = (status: any): status is UserStatus => {
  return Object.values(UserStatus).includes(status);
};

const validateUser = (user: any): boolean => {
  return (
    user &&
    typeof user === 'object' &&
    'id' in user &&
    'email' in user
  );
};

const toUserModel = (userData: any): User => {
  // Convert string role to UserRole enum
  let roleValue: UserRole;
  
  if (userData.role) {
    switch(userData.role.toLowerCase()) {
      case 'admin':
        roleValue = UserRole.ADMIN;
        break;
      case 'investor':
        roleValue = UserRole.INVESTOR;
        break;
      default:
        roleValue = UserRole.USER;
    }
  } else {
    roleValue = UserRole.USER;
  }
  
  return {
    id: userData.id,
    email: userData.email,
    name: userData.name || '',
    role: roleValue,
    status: userData.status || UserStatus.ACTIVE,
    createdAt: userData.created_at || userData.createdAt || new Date().toISOString(),
    updatedAt: userData.updated_at || userData.updatedAt,
    publicKey: userData.public_key || userData.publicKey,
    encryptedPrivateKey: userData.encrypted_private_key || userData.encryptedPrivateKey,
    mfaEnabled: userData.mfa_enabled || userData.mfaEnabled,
    lastLoginAt: userData.last_login_at || userData.lastLoginAt,
    preferences: {}
  };
};

// Helper function to execute a function with retries
const executeWithRetry = async <T>(operation: () => any): Promise<any> => {
  const MAX_RETRIES = 3;
  const INITIAL_BACKOFF = 300;
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === MAX_RETRIES - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, INITIAL_BACKOFF * Math.pow(2, i)));
    }
  }
  
  throw new Error('Max retries exceeded');
};

// User auth admin operations
export const authService = {
  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<User | null> {
    try {
      // Use standard signup instead of admin API
      const { data: authData, error: signUpError } = await signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          },
          // Don't auto-confirm the email if sending an invite
          emailRedirectTo: userData.sendInvite 
            ? `${window.location.origin}/auth/reset-password` 
            : undefined
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Failed to create user");

      // Create user in public.users
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          status: userData.sendInvite ? "pending" : "active",
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Assign role to user
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role_id: userData.roleId,
        });

      if (roleError) throw roleError;

      // For invite flow, send password reset email
      if (userData.sendInvite) {
        try {
          await resetPasswordForEmail(userData.email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          });
        } catch (resetError) {
          console.error("Error sending password reset email:", resetError);
          // Don't throw here, as the user is already created
        }
      } else {
        // If not sending invite, sign out the newly created user
        // Get current session to restore after signup
        const { data: { session: currentSession } } = await getSession();
        
        // Sign out the new user
        await signOut();
        
        // If there was a previous session, restore it
        if (currentSession) {
          // We can't directly restore a session, but in development we can show a message
          console.log("Please note: You've created a new user while logged in. You may need to refresh to restore your session.");
        }
      }

      return this.getUserById(authData.user.id);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  /**
   * Get a user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      // Fetch user profile with our local executeWithRetry
      const { data: profile, error: profileError } = await executeWithRetry(async () => 
        await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single()
      );

      if (profileError) throw profileError;
      if (!profile) return null;

      // Fetch user roles directly with our local executeWithRetry
      const { data: userRoles, error: rolesError } = await executeWithRetry(async () => 
        await supabase
          .from("user_roles")
          .select(`
            role_id,
            roles (
              id,
              name,
              description,
              priority
            )
          `)
          .eq("user_id", userId)
      );

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        // Return a basic user model without roles
        const userModel = toUserModel({
          id: userId,
          email: profile.email,
          name: profile.name,
          role: null,
          status: profile.status,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          mfa_enabled: profile.mfa_enabled,
          public_key: profile.public_key,
          encrypted_private_key: profile.encrypted_private_key
        });
        return validateUser(userModel) ? userModel : null;
      }

      // Properly type the user roles response
      const typedUserRoles = userRoles as unknown as UserRoleWithRole[];
      
      // Get primary role (first one)
      const primaryRole = typedUserRoles.length > 0 && typedUserRoles[0].roles
        ? { 
            id: typedUserRoles[0].role_id, 
            name: normalizeRole(typedUserRoles[0].roles.name),
            description: typedUserRoles[0].roles.description || '',
            priority: typedUserRoles[0].roles.priority || 0
          }
        : null;

      // Map the role name to the UserRole enum
      let userRoleEnum: UserRole;
      const roleName = primaryRole?.name?.toLowerCase() || '';
      
      if (roleName.includes('admin')) {
        userRoleEnum = UserRole.ADMIN;
      } else if (roleName.includes('investor')) {
        userRoleEnum = UserRole.INVESTOR;
      } else {
        userRoleEnum = UserRole.USER;
      }

      // Create the user model with the proper role enum
      const userModel: User = {
        id: userId,
        email: profile.email,
        name: profile.name,
        role: userRoleEnum,
        status: toUserStatus(profile.status),
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        publicKey: profile.public_key,
        encryptedPrivateKey: profile.encrypted_private_key,
        mfaEnabled: profile.mfa_enabled,
        lastLoginAt: profile.last_login_at,
        preferences: {}
      };
      
      // Add extra properties expected by the application
      const userWithExtras = {
        ...userModel,
        profile,
        primaryRole,
        allRoles: typedUserRoles
          .filter(entry => entry.roles)
          .map(entry => ({ 
            id: entry.role_id, 
            name: normalizeRole(entry.roles.name),
            description: entry.roles.description || '',
            priority: entry.roles.priority || 0
          }))
      };
      
      // Validate the user model before returning
      return validateUser(userWithExtras) ? userWithExtras as User : null;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  },

  /**
   * Update a user
   */
  async updateUser(userId: string, userData: UpdateUserData): Promise<User | null> {
    try {
      // 1. Update user profile in public.users
      if (userData.email || userData.name || userData.status) {
        const updateData: any = {};
        if (userData.email) updateData.email = userData.email;
        if (userData.name) updateData.name = userData.name;
        if (userData.status) updateData.status = userData.status;

        const { error: profileError } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", userId);

        if (profileError) throw profileError;

        // Note: We can't update auth.users email from the browser client
        // Email changes would require the user to verify the new email
        if (userData.email) {
          console.log(`Email change for user ${userId} to ${userData.email} will require verification`);
        }
      }

      // 2. Update user role if provided
      if (userData.roleId) {
        // Remove existing roles
        const { error: deleteRoleError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        if (deleteRoleError) throw deleteRoleError;

        // Add new role
        const { error: addRoleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role_id: userData.roleId,
          });

        if (addRoleError) throw addRoleError;
      }

      return this.getUserById(userId);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Note: We can't directly delete from auth.users from the browser
      // Instead, we just delete from public.users and role associations
      
      // 1. Delete user roles
      const { error: rolesDeleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
        
      if (rolesDeleteError) {
        console.error("Error deleting user roles:", rolesDeleteError);
        // Continue anyway to try to delete the user
      }

      // 2. Delete user from public.users
      const { error: profileDeleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (profileDeleteError) throw profileDeleteError;

      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  /**
   * Reset a user's password
   */
  async resetUserPassword(userId: string, newPassword: string, sendEmail: boolean = true): Promise<void> {
    try {
      // We can only send password reset emails from the browser client
      // We can't directly set passwords without the admin API
      
      // Get the user's email
      const { data: userData } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (!userData?.email) throw new Error("User email not found");

      // Send a password reset email
      const { error } = await resetPasswordForEmail(userData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  },

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      // Fetch all users using our local executeWithRetry
      const { data: users, error: usersError } = await executeWithRetry(async () => 
        await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false })
      );

      if (usersError) throw usersError;
      if (!users) return [];

      // Instead of using the view, fetch role data directly using executeWithRetry
      const { data: allUserRoles, error: rolesError } = await executeWithRetry(async () => 
        await supabase
          .from("user_roles")
          .select(`
            user_id,
            role_id,
            roles (
              id,
              name,
              description,
              priority
            )
          `)
      );

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        // Return users without roles, but properly mapped to our User model
        return users
          .map(user => toUserModel({
            id: user.id,
            email: user.email,
            name: user.name,
            status: user.status,
            created_at: user.created_at,
            updated_at: user.updated_at
          }))
          .filter(validateUser); // Filter out invalid users
      }

      // Properly type the user roles response
      const typedUserRoles = allUserRoles as unknown as UserRoleWithRole[];

      // Map users with their roles and convert to our User model
      return users
        .map(user => {
          const userRoleEntries = typedUserRoles.filter(r => r.user_id === user.id);
          
          const primaryRole = userRoleEntries.length > 0 && userRoleEntries[0].roles 
            ? { 
                id: userRoleEntries[0].role_id, 
                name: normalizeRole(userRoleEntries[0].roles.name),
                description: userRoleEntries[0].roles.description || '',
                priority: userRoleEntries[0].roles.priority || 0
              }
            : null;
            
          // Map the role name to the UserRole enum
          let userRoleEnum: UserRole;
          const roleName = primaryRole?.name?.toLowerCase() || '';
          
          if (roleName.includes('admin')) {
            userRoleEnum = UserRole.ADMIN;
          } else if (roleName.includes('investor')) {
            userRoleEnum = UserRole.INVESTOR;
          } else {
            userRoleEnum = UserRole.USER;
          }

          // Create a User model with properly mapped fields
          const userModel: User = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: userRoleEnum,
            status: toUserStatus(user.status),
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            publicKey: user.public_key,
            encryptedPrivateKey: user.encrypted_private_key,
            mfaEnabled: user.mfa_enabled,
            lastLoginAt: user.last_login_at,
            preferences: {}
          };
          
          // Add extra properties for compatibility
          const userWithExtras = {
            ...userModel,
            profile: user,
            primaryRole: primaryRole,
            allRoles: userRoleEntries
              .filter(entry => entry.roles)
              .map(entry => ({ 
                id: entry.role_id, 
                name: normalizeRole(entry.roles.name),
                description: entry.roles.description || '',
                priority: entry.roles.priority || 0
              }))
          };
          
          return userWithExtras as User;
        })
        .filter(validateUser); // Filter out invalid user objects
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  },

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      // Use our local executeWithRetry for improved reliability
      const { data, error } = await executeWithRetry(async () => 
        await supabase.rpc('check_user_permission', {
          user_id: userId,
          permission: permissionName
        })
      );

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error(`Error checking permission ${permissionName} for user ${userId}:`, error);
      return false;
    }
  }
};