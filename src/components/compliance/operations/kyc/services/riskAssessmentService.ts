import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/core/database';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import type { RiskAssessment, RiskLevel } from '@/types/domain/identity/onfido';

export class RiskAssessmentService {
  private static instance: RiskAssessmentService;
  private supabase;

  private constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  public static getInstance(): RiskAssessmentService {
    if (!RiskAssessmentService.instance) {
      RiskAssessmentService.instance = new RiskAssessmentService();
    }
    return RiskAssessmentService.instance;
  }

  // Calculate risk score based on various factors
  async calculateRiskScore(data: {
    investorId: string;
    investorType: string;
    nationality: string;
    residenceCountry: string;
    politicalExposure?: boolean;
    sourceOfFunds?: string;
    industryType?: string;
    transactionVolume?: number;
    highRiskFactors?: string[];
  }): Promise<RiskAssessment> {
    try {
      const { data: result, error } = await this.supabase.functions.invoke('calculate-risk-score', {
        body: { ...data }
      });
      
      if (error) throw this.handleFunctionError(error);
      return result;
    } catch (error) {
      console.error('Error calculating risk score:', error);
      throw error;
    }
  }

  // Get risk assessment for an investor
  async getRiskAssessment(entityId: string, entityType: 'investor' | 'issuer'): Promise<RiskAssessment | null> {
    try {
      const { data, error } = await this.supabase
        .from('risk_assessments')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw error;
      }
      
      // Map from database format to RiskAssessment type
      return {
        id: data.id,
        investorId: data.entity_id,
        riskLevel: data.risk_level as RiskLevel,
        factors: data.factors,
        totalScore: data.total_score,
        assessmentDate: data.assessment_date,
        nextReviewDate: data.next_review_date,
        reviewHistory: data.review_history
      };
    } catch (error) {
      console.error('Error getting risk assessment:', error);
      throw error;
    }
  }

  // Update risk assessment
  async updateRiskAssessment(riskAssessment: RiskAssessment): Promise<RiskAssessment> {
    try {
      // Format for database
      const dbRecord = {
        id: riskAssessment.id,
        entity_id: riskAssessment.investorId,
        entity_type: 'investor', // Default to investor type
        risk_level: riskAssessment.riskLevel,
        factors: riskAssessment.factors,
        total_score: riskAssessment.totalScore,
        assessed_by: 'system', // Default value for system assessment
        assessment_date: riskAssessment.assessmentDate,
        next_review_date: riskAssessment.nextReviewDate,
        review_history: riskAssessment.reviewHistory || []
      };
      
      const { data, error } = await this.supabase
        .from('risk_assessments')
        .upsert(dbRecord)
        .select()
        .single();
      
      if (error) throw error;
      
      // Map back to RiskAssessment type
      return {
        id: data.id,
        investorId: data.entity_id,
        riskLevel: data.risk_level as RiskLevel,
        factors: data.factors,
        totalScore: data.total_score,
        assessmentDate: data.assessment_date,
        nextReviewDate: data.next_review_date,
        reviewHistory: data.review_history
      };
    } catch (error) {
      console.error('Error updating risk assessment:', error);
      throw error;
    }
  }

  // Create a new review entry in risk assessment history
  async addRiskReview(data: {
    assessmentId: string;
    reviewedBy: string;
    riskLevel: RiskLevel;
    comments?: string;
  }): Promise<RiskAssessment> {
    try {
      const { data: result, error } = await this.supabase.functions.invoke('add-risk-review', {
        body: { ...data }
      });
      
      if (error) throw this.handleFunctionError(error);
      return result;
    } catch (error) {
      console.error('Error adding risk review:', error);
      throw error;
    }
  }

  // Handle function errors
  private handleFunctionError(error: any) {
    if (error instanceof FunctionsHttpError) {
      console.error('Function error details:', error);
      return new Error(`Function error: ${error.message}`);
    } else if (error instanceof FunctionsRelayError) {
      console.error('Function relay error:', error);
      return new Error('Network error connecting to risk assessment service');
    } else if (error instanceof FunctionsFetchError) {
      console.error('Function fetch error:', error);
      return new Error('Failed to fetch from risk assessment service');
    } else {
      return error;
    }
  }
}