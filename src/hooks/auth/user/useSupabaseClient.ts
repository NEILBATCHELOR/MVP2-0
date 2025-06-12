import { supabase } from "@/infrastructure/database/client";

/**
 * Hook to access the Supabase client instance.
 */
export function useSupabaseClient() {
  return supabase;
}
