import { Role } from '@/utils/auth/roleUtils';

export type UserStatus = "active" | "inactive" | "pending" | "blocked";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  public_key?: string;
  encrypted_private_key?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  profile?: UserProfile;
  role?: Role | null;
  allRoles?: Role[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface UserRoleView {
  user_id: string;
  role_id: string;
  role_name: string;
  role_description?: string;
}

export interface UserPermissionView {
  user_id: string;
  permission_id: string;
  permission_name: string;
  permission_description?: string;
}