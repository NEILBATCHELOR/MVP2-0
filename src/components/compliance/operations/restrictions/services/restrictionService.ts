import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/core/supabase';

// Define custom interfaces for tables not in schema
interface CountryRestriction {
  id: string;
  country_code: string;
  country_name: string;
  is_blocked: boolean;
  reason: string;
  created_at: string;
  updated_at: string;
}

interface InvestorTypeRestriction {
  id: string;
  type: string;
  is_blocked: boolean;
  reason: string;
  minimum_investment?: number;
  required_documents: string[];
  created_at: string;
  updated_at: string;
}

interface InvestorValidation {
  id: string;
  investor_id: string;
  is_eligible: boolean;
  reasons: string[];
  required_documents: string[];
  validated_at: string;
}

interface ValidateInvestorParams {
  countryCode: string;
  investorType: string;
  investmentAmount?: number | undefined;
}

export class RestrictionService {
  private static instance: RestrictionService;
  private supabase;

  private constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  public static getInstance(): RestrictionService {
    if (!RestrictionService.instance) {
      RestrictionService.instance = new RestrictionService();
    }
    return RestrictionService.instance;
  }

  // Country Restrictions
  async getCountryRestrictions(): Promise<CountryRestriction[]> {
    const { data, error } = await this.supabase
      .from('country_restrictions')
      .select('*');

    if (error) throw error;
    return data;
  }

  async updateCountryRestriction(restriction: CountryRestriction) {
    const { data, error } = await this.supabase
      .from('country_restrictions')
      .upsert([restriction]);

    if (error) throw error;
    return data;
  }

  async isCountryBlocked(countryCode: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('country_restrictions')
      .select('is_blocked')
      .eq('country_code', countryCode)
      .single();

    if (error) throw error;
    return data?.is_blocked || false;
  }

  // Investor Type Restrictions
  async getInvestorTypeRestrictions(): Promise<InvestorTypeRestriction[]> {
    const { data, error } = await this.supabase
      .from('investor_type_restrictions')
      .select('*');

    if (error) throw error;
    return data;
  }

  async updateInvestorTypeRestriction(restriction: InvestorTypeRestriction) {
    const { data, error } = await this.supabase
      .from('investor_type_restrictions')
      .upsert([restriction]);

    if (error) throw error;
    return data;
  }

  async getInvestorTypeRequirements(type: string): Promise<InvestorTypeRestriction | null> {
    const { data, error } = await this.supabase
      .from('investor_type_restrictions')
      .select('*')
      .eq('type', type)
      .single();

    if (error) throw error;
    return data;
  }

  // Combined Validation
  async validateInvestorEligibility(params: ValidateInvestorParams): Promise<{
    isEligible: boolean;
    reasons: string[];
    requiredDocuments: string[];
  }> {
    const [countryRestriction, typeRestriction] = await Promise.all([
      this.isCountryBlocked(params.countryCode),
      this.getInvestorTypeRequirements(params.investorType)
    ]);

    const reasons: string[] = [];
    if (countryRestriction) {
      reasons.push(`Country ${params.countryCode} is restricted`);
    }

    if (typeRestriction?.is_blocked) {
      reasons.push(`Investor type ${params.investorType} is restricted: ${typeRestriction.reason}`);
    }

    if (
      typeRestriction?.minimum_investment &&
      params.investmentAmount &&
      params.investmentAmount < typeRestriction.minimum_investment
    ) {
      reasons.push(
        `Investment amount (${params.investmentAmount}) is below minimum requirement (${typeRestriction.minimum_investment})`
      );
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
      requiredDocuments: typeRestriction?.required_documents || []
    };
  }

  // Batch Processing
  async batchValidateInvestors(investors: Array<{
    id: string;
    countryCode: string;
    investorType: string;
    investmentAmount?: number;
  }>) {
    const results = await Promise.all(
      investors.map(async (investor) => ({
        investorId: investor.id,
        ...await this.validateInvestorEligibility({
          countryCode: investor.countryCode,
          investorType: investor.investorType,
          investmentAmount: investor.investmentAmount
        })
      }))
    );

    // Define the validation insert type directly without referencing Database
    interface InvestorValidationInsert {
      investor_id: string;
      is_eligible: boolean;
      reasons: string[];
      required_documents: string[];
      validated_at: string;
    }

    const validations: InvestorValidationInsert[] = results.map((result) => ({
      investor_id: result.investorId,
      is_eligible: result.isEligible,
      reasons: result.reasons,
      required_documents: result.requiredDocuments,
      validated_at: new Date().toISOString()
    }));

    const { error } = await this.supabase
      .from('investor_validations')
      .insert(validations);

    if (error) throw error;
    return results;
  }
}