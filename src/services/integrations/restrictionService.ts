import { supabase } from '@/infrastructure/database/client';
import type { Database } from '@/types/core/supabase';
import type {
  RestrictionStats,
  RestrictionAuditLog,
} from '@/components/compliance/operations/restrictions/types';
import type { CountryRestriction, InvestorTypeRestriction, InvestorValidation } from '@/types/core/database';

// Define a local RestrictionRule interface that matches our database format
export interface RestrictionRule {
  id: string;
  type: "COUNTRY" | "INVESTOR_TYPE";
  value: string;
  active: boolean; 
  reason: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

type OnboardingRestriction = Database['public']['Tables']['onboarding_restrictions']['Row'];
type RestrictionStatisticsView = Database['public']['Views']['restriction_statistics']['Row'];

/**
 * Service for managing onboarding restrictions in the compliance system.
 * Handles creation, modification, and querying of restriction rules for countries and investor types.
 */
export const restrictionService = {
  /**
   * Creates a new restriction rule.
   * @param data - The restriction rule data to create
   * @throws {Error} If the creation fails
   * @returns The created restriction rule
   */
  async createRestriction(data: any): Promise<RestrictionRule> {
    try {
      const { data: restriction, error } = await supabase
        .from('onboarding_restrictions')
        .insert({
          type: data.type,
          value: data.value,
          reason: data.reason,
          active: true,
          created_by: 'system' // TODO: Get actual user ID
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create restriction: ${error.message}`);
      }

      if (!restriction) {
        throw new Error('No restriction data returned after creation');
      }

      return mapRestrictionToRule(restriction);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggles a restriction rule's active status.
   * @param id - The ID of the restriction to toggle
   * @param active - The new active status
   * @throws {Error} If the update fails
   */
  async toggleRestriction(id: string, active: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('onboarding_restrictions')
        .update({ active })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to toggle restriction: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Deletes a restriction rule.
   * @param id - The ID of the restriction to delete
   * @throws {Error} If the deletion fails
   */
  async deleteRestriction(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('onboarding_restrictions')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete restriction: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Retrieves all restriction rules.
   * @throws {Error} If the query fails
   * @returns Array of restriction rules
   */
  async getRestrictions(): Promise<RestrictionRule[]> {
    try {
      const { data: restrictions, error } = await supabase
        .from('onboarding_restrictions')
        .select();

      if (error) {
        throw new Error(`Failed to fetch restrictions: ${error.message}`);
      }

      return restrictions.map(mapRestrictionToRule);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Retrieves restriction statistics.
   * @throws {Error} If the query fails
   * @returns Current restriction statistics
   */
  async getStatistics(): Promise<RestrictionStats> {
    try {
      const { data: stats, error } = await supabase
        .from('restriction_statistics')
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to fetch statistics: ${error.message}`);
      }

      return {
        totalRules: stats.total_rules || 0,
        activeRules: stats.active_rules || 0,
        blockedCountries: stats.blocked_countries || 0,
        blockedInvestorTypes: stats.blocked_investor_types || 0
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Checks if a country is restricted.
   * @param countryCode - The ISO country code to check
   * @throws {Error} If the RPC call fails
   * @returns True if the country is restricted
   */
  async isCountryRestricted(countryCode: string): Promise<boolean> {
    try {
      // Since the RPC call doesn't exist in the Database type, use a direct approach
      const { data: restrictions } = await supabase
        .from('onboarding_restrictions')
        .select('*')
        .eq('type', 'country')
        .eq('value', countryCode)
        .eq('active', true);

      return restrictions && restrictions.length > 0;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Checks if an investor type is restricted.
   * @param investorTypeId - The investor type ID to check
   * @throws {Error} If the RPC call fails
   * @returns True if the investor type is restricted
   */
  async isInvestorTypeRestricted(investorTypeId: string): Promise<boolean> {
    try {
      // Since the RPC call doesn't exist in the Database type, use a direct approach
      const { data: restrictions } = await supabase
        .from('onboarding_restrictions')
        .select('*')
        .eq('type', 'investor_type')
        .eq('value', investorTypeId)
        .eq('active', true);

      return restrictions && restrictions.length > 0;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Retrieves the audit history for a restriction.
   * @param restrictionId - The ID of the restriction
   * @throws {Error} If the query fails
   * @returns Array of audit log entries
   */
  async getRestrictionHistory(restrictionId: string): Promise<RestrictionAuditLog[]> {
    try {
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_id', restrictionId)
        .eq('entity_type', 'onboarding_restriction')
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch restriction history: ${error.message}`);
      }

      return logs as RestrictionAuditLog[];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get country restrictions
   */
  async getCountryRestrictions(): Promise<CountryRestriction[]> {
    // Stub implementation
    return [];
  },

  /**
   * Get investor type restrictions
   */
  async getInvestorTypeRestrictions(): Promise<InvestorTypeRestriction[]> {
    // Stub implementation
    return [];
  },

  /**
   * Check if a country is blocked
   */
  async isCountryBlocked(countryCode: string): Promise<boolean> {
    // Stub implementation
    return false;
  },

  /**
   * Get requirements for an investor type
   */
  async getInvestorTypeRequirements(type: string): Promise<InvestorTypeRestriction | null> {
    // Stub implementation
    return null;
  },

  /**
   * Check if an investor is eligible
   */
  async validateInvestorEligibility(params: {
    countryCode: string;
    investorType: string;
    investmentAmount?: number;
  }): Promise<{
    isEligible: boolean;
    reasons: string[];
    requiredDocuments: string[];
  }> {
    // Stub implementation
    return {
      isEligible: true,
      reasons: [],
      requiredDocuments: []
    };
  }
};

/**
 * Maps a database restriction row to a RestrictionRule object.
 * @param restriction - The database restriction row
 * @returns The mapped restriction rule
 */
function mapRestrictionToRule(restriction: OnboardingRestriction): RestrictionRule {
  return {
    id: restriction.id,
    type: restriction.type.toUpperCase() as "COUNTRY" | "INVESTOR_TYPE", 
    value: restriction.value,
    active: restriction.active,
    reason: restriction.reason,
    createdAt: restriction.created_at,
    createdBy: restriction.created_by,
    updatedAt: restriction.updated_at || new Date().toISOString()
  };
}