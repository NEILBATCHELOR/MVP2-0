import { supabase } from '@/infrastructure/database/client';
import { UserRole, UserStatus } from '@/types/core/centralModels';
import type { User } from '@/types/core/centralModels';
import type { Database } from '@/types/core/supabase';

export const mapRoleToEnum = (role: string | undefined): UserRole => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return UserRole.ADMIN;
    case 'investor':
      return UserRole.INVESTOR;
    default:
      return UserRole.USER;
  }
};

export const mapStatusToEnum = (status: string | undefined): UserStatus => {
  switch (status?.toLowerCase()) {
    case 'inactive':
      return UserStatus.INACTIVE;
    case 'pending':
      return UserStatus.PENDING;
    case 'suspended':
      return UserStatus.SUSPENDED;
    default:
      return UserStatus.ACTIVE;
  }
};

type UserMetadata = {
  preferences?: Record<string, any>;
  mfa_enabled?: boolean;
  [key: string]: any;
};

type UserData = {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  public_key: string | null;
  encrypted_private_key: string | null;
  raw_user_meta_data?: UserMetadata | null;
  raw_app_meta_data?: UserMetadata | null;
  last_sign_in_at?: string | null;
  user_roles: Array<{
    roles: {
      name: string;
      description: string;
      priority: number;
    };
  }>;
};

export class UserService {
  /**
   * Fetches a user's profile including their role information
   * @param userId The ID of the user to fetch
   * @returns The user profile with role information
   * @throws Error if the user cannot be found or if there's a database error
   */
  static async getUserProfile(userId: string): Promise<User> {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          user_roles!inner (
            roles!inner (
              name,
              description,
              priority
            )
          )
        `)
        .eq('id', userId)
        .single();

      if (userError) throw new Error(`Error fetching user: ${userError.message}`);
      if (!userData) throw new Error('User not found');

      const typedUserData = userData as unknown as UserData;

      // Get the user's preferences from metadata
      const preferences = {
        ...(typedUserData.raw_user_meta_data?.preferences || {}),
        ...(typedUserData.raw_app_meta_data?.preferences || {}),
      };

      // Transform the database response to match our User type
      const userProfile: User = {
        id: typedUserData.id,
        email: typedUserData.email,
        name: typedUserData.name,
        role: mapRoleToEnum(typedUserData.user_roles?.[0]?.roles?.name),
        status: mapStatusToEnum(typedUserData.status),
        createdAt: typedUserData.created_at,
        updatedAt: typedUserData.updated_at,
        publicKey: typedUserData.public_key || undefined,
        encryptedPrivateKey: typedUserData.encrypted_private_key || undefined,
        mfaEnabled: Boolean(typedUserData.raw_app_meta_data?.mfa_enabled),
        lastLoginAt: typedUserData.last_sign_in_at || undefined,
        preferences
      };

      return userProfile;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  }

  /**
   * Updates a user's profile
   * @param userId The ID of the user to update
   * @param updates The fields to update
   * @returns The updated user profile
   * @throws Error if the update fails
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    try {
      // Extract preferences to store in metadata
      const { preferences, ...userUpdates } = updates;
      
      const updateData: any = {
        ...userUpdates,
        updated_at: new Date().toISOString()
      };

      if (preferences) {
        updateData.raw_user_meta_data = {
          preferences
        };
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!updatedUser) throw new Error('Failed to update user');

      // Fetch the complete profile with roles
      return await this.getUserProfile(userId);
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  }

  /**
   * Checks if a user has a specific role
   * @param userId The ID of the user to check
   * @param roleName The name of the role to check for
   * @returns True if the user has the role, false otherwise
   */
  static async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('roles!inner(name)')
        .eq('user_id', userId)
        .eq('roles.name', roleName)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error in hasRole:', error);
      return false;
    }
  }
} 