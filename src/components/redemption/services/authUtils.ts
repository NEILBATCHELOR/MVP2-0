// Authentication utilities for redemption services
import { supabase } from '@/infrastructure/supabaseClient';

/**
 * Note: Authentication has been disabled for redemption services as per user requirements
 * All functions now act as pass-through operations without authentication checks
 */

/**
 * Ensures user is authenticated before making database queries
 * NOW DISABLED: Returns true immediately without authentication checks
 */
export async function ensureAuthentication(): Promise<boolean> {
  // Authentication disabled - always return true
  console.log('Authentication disabled for redemption services - proceeding without auth checks');
  return true;
}

/**
 * Wrapper for database operations that originally required authentication
 * NOW DISABLED: Simply executes the operation without authentication checks
 */
export async function withAuth<T>(operation: () => Promise<T>): Promise<T> {
  // Skip authentication entirely and execute operation directly
  return operation();
}
