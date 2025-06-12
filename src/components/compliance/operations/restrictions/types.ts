import type { Country } from "@/utils/compliance/countries";
import type { InvestorType } from "@/utils/compliance/investorTypes";
import type { Database } from "@/types/core/supabase";

export interface RestrictionRule {
  id: string;
  type: "COUNTRY" | "INVESTOR_TYPE";
  value: string;
  reason: string;
  createdAt: Date;
  createdBy: string;
  active: boolean;
}

export interface RestrictionRuleFormData {
  type: "COUNTRY" | "INVESTOR_TYPE";
  value: string;
  reason: string;
}

export interface RestrictionStats {
  totalRules: number;
  activeRules: number;
  blockedCountries: number;
  blockedInvestorTypes: number;
}

export interface RestrictionManagerProps {
  onCreateRule: (rule: RestrictionRuleFormData) => Promise<void>;
  onToggleRule: (ruleId: string, active: boolean) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
  onError: (error: Error) => void;
}

export type RestrictionAuditLog = Database['public']['Tables']['audit_logs']['Row'] & {
  entity_type: 'onboarding_restriction';
  metadata: {
    type: "COUNTRY" | "INVESTOR_TYPE";
    value: string;
    reason: string;
    active: boolean;
  };
};

export class RestrictionServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'RestrictionServiceError';
  }
}

export type RPCResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};