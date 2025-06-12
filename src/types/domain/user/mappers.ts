// User type mappers: DB (snake_case) ↔ Domain (camelCase)
import type { UsersTable } from '@/types/core/database';
import type { User, UserProfile } from './types';

export function mapUserToCamelCase(dbUser: UsersTable): User {
  // Split name into first and last name since separate columns don't exist
  const nameParts = dbUser.name?.split(' ') || [''];
  
  return {
    id: dbUser.id,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: dbUser.email,
    role: 'USER', // Default role since role column doesn't exist in current schema
    status: dbUser.status as any,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at || dbUser.created_at,
  };
}

export function mapUserToSnakeCase(user: User): Partial<UsersTable> {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    status: user.status,
    updated_at: new Date().toISOString(),
  };
}
