import { CountryRestriction, InvestorTypeRestriction, InvestorValidation } from '@/types/core/database';

/**
 * Restriction rule interface
 */
export interface RestrictionRule {
  id: string;
  type: 'country' | 'investor_type' | 'jurisdiction' | 'investment_amount';
  value: string;
  active: boolean;
  reason: string;
  created_at: string;
  created_by: string;
  updated_at: string;
}

/**
 * Statistics for restrictions
 */
export interface RestrictionStatistics {
  active_rules: number;
  blocked_countries: number;
  blocked_investor_types: number;
  total_rules: number;
}

/**
 * Restriction audit log entry
 */
export interface RestrictionAuditLog {
  id: string;
  rule_id: string;
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
  performed_by: string;
  performed_at: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
}

/**
 * Restriction effectiveness data
 */
export interface RestrictionEffectiveness {
  ruleId: string;
  totalBlocks: number;
  lastTriggered: Date;
}

// Re-export database types
export type { CountryRestriction, InvestorTypeRestriction, InvestorValidation }; 