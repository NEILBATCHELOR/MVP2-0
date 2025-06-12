// User domain validation
import type { User } from './types';

export function validateUser(user: Partial<User>): string[] {
  const errors: string[] = [];
  
  if (!user.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Invalid email format');
  }
  
  if (!user.firstName) {
    errors.push('First name is required');
  }
  
  if (!user.lastName) {
    errors.push('Last name is required');
  }
  
  return errors;
}
