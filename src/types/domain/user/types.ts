// User domain types (camelCase)
import type { UsersTable } from '../../core/database';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'USER' | 'INVESTOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface UserProfile extends User {
  avatar?: string;
  phone?: string;
  bio?: string;
}
