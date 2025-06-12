// Administrative Supabase client using service role for privileged operations
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/core/database";

// Service role key for administrative operations (should be in environment variables)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jrwfkxfzsnnjppogthaw.supabase.co';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Create service role client that bypasses RLS
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      "x-client-info": "chain-capital-admin",
    },
  },
});

/**
 * Check if service role is available
 */
export function hasServiceRole(): boolean {
  return !!supabaseServiceKey;
}

/**
 * Administrative settlement operations that bypass RLS
 * Use with caution - only for system operations
 */
export class AdminSettlementService {
  /**
   * Get settlement status (admin access)
   */
  async getSettlementStatus(settlementId: string) {
    if (!hasServiceRole()) {
      throw new Error('Service role not configured');
    }

    const { data, error } = await supabaseAdmin
      .from('redemption_settlements')
      .select('*')
      .eq('id', settlementId)
      .single();

    if (error) {
      throw new Error(`Failed to get settlement status: ${error.message}`);
    }

    return data;
  }

  /**
   * List all settlements (admin access)
   */
  async listSettlements(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    if (!hasServiceRole()) {
      throw new Error('Service role not configured');
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('redemption_settlements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list settlements: ${error.message}`);
    }

    return { data, count };
  }
}

// Export singleton instance
export const adminSettlementService = new AdminSettlementService();
