/**
 * Supabase client - centralized export for consistent imports
 * 
 * This file provides the main supabase client that should be used throughout the application.
 * It re-exports from the database directory to maintain clean import paths.
 */
export { supabase } from '@/infrastructure/database/client';
export { executeWithRetry, checkSupabaseConnection, debugQuery } from '@/infrastructure/database/client';
export { getUserRoles, logAction, uploadDocument, getPublicUrl, removeDocument } from '@/infrastructure/database/client';
