/**
 * Supabase client - re-exports the supabase instance from infrastructure/supabase.ts
 * 
 * This file exists to maintain compatibility with existing imports while
 * preventing duplicate GoTrueClient instances in the browser context.
 */
import { supabase } from '@/infrastructure/database/client';

// Re-export the supabase client from infrastructure/supabase.ts
export { supabase };