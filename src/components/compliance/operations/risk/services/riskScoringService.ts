import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/core/database';
import type { RiskLevel, RiskAssessment } from '@/components/compliance/operations/types';
import type { RiskFactor, RiskFactorAssessment, RiskFactorCategory } from '@/types/domain/compliance/compliance';

export class RiskScoringService {
  private static instance: RiskScoringService;
  private supabase;

  private constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  public static getInstance(): RiskScoringService {
    if (!RiskScoringService.instance) {
      RiskScoringService.instance = new RiskScoringService();
    }
    return RiskScoringService.instance;
  }

  // Fetch all configured risk factors from the database
  async getRiskFactors(): Promise<RiskFactor[]> {
    const { data, error } = await this.supabase
      .from('risk_factors')
      .select('*')
      .eq('enabled', true)
      .order('category', { ascending: true })
      .order('weight', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Get risk factors by category
  async getRiskFactorsByCategory(category: RiskFactorCategory): Promise<RiskFactor[]> {
    const { data, error } = await this.supabase
      .from('risk_factors')
      .select('*')
      .eq('category', category)
      .eq('enabled', true)
      .order('weight', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Perform a risk assessment for an investor
  async assessInvestorRisk(
    investorId: string, 
    factorAssessments: RiskFactorAssessment[],
    assessedBy: string
  ): Promise<RiskAssessment> {
    try {
      // Get the risk factors to calculate weights properly
      const riskFactors = await this.getRiskFactors();
      
      // Calculate the total score
      let totalScore = 0;
      let totalWeight = 0;
      
      const enrichedFactors = factorAssessments.map(assessment => {
        const factor = riskFactors.find(f => f.id === assessment.factorId);
        if (!factor) {
          throw new Error(`Risk factor ${assessment.factorId} not found`);
        }
        
        const weightedScore = assessment.score * factor.weight;
        totalScore += weightedScore;
        totalWeight += factor.weight;
        
        return {
          factor: factor.name,
          weight: factor.weight,
          score: assessment.score
        };
      });
      
      // Calculate average score (0-10 scale)
      const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0;
      
      // Determine risk level based on score
      const riskLevel = this.determineRiskLevel(averageScore);
      
      // Create the risk assessment object
      const riskAssessment: RiskAssessment = {
        id: crypto.randomUUID(),
        entityId: investorId,
        entityType: 'INVESTOR',
        riskLevel,
        factors: enrichedFactors,
        totalScore: averageScore,
        assessedBy,
        assessmentDate: new Date(),
        nextReviewDate: this.calculateNextReviewDate(riskLevel)
      };
      
      // Store the risk assessment in the database
      await this.storeRiskAssessment(riskAssessment);
      
      return riskAssessment;
    } catch (error) {
      console.error('Error assessing investor risk:', error);
      throw error;
    }
  }

  // Store a risk assessment in the database
  async storeRiskAssessment(assessment: RiskAssessment) {
    const { error } = await this.supabase
      .from('risk_assessments')
      .insert({
        id: assessment.id,
        entity_id: assessment.entityId,
        entity_type: assessment.entityType,
        risk_level: assessment.riskLevel,
        factors: assessment.factors,
        total_score: assessment.totalScore,
        assessed_by: assessment.assessedBy,
        assessment_date: assessment.assessmentDate.toISOString(),
        next_review_date: assessment.nextReviewDate.toISOString()
      });
    
    if (error) throw error;
    return { success: true };
  }

  // Get the risk assessment for an entity
  async getRiskAssessment(entityId: string, entityType: 'INVESTOR' | 'ISSUER'): Promise<RiskAssessment | null> {
    const { data, error } = await this.supabase
      .from('risk_assessments')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      throw error;
    }
    
    return data ? {
      id: data.id,
      entityId: data.entity_id,
      entityType: data.entity_type as 'INVESTOR' | 'ISSUER',
      riskLevel: data.risk_level as RiskLevel,
      factors: data.factors,
      totalScore: data.total_score,
      assessedBy: data.assessed_by,
      assessmentDate: new Date(data.assessment_date),
      nextReviewDate: new Date(data.next_review_date)
    } : null;
  }

  // Get all entities that need risk assessment review
  async getEntitiesDueForReview(): Promise<{
    entityId: string;
    entityType: 'INVESTOR' | 'ISSUER';
    riskLevel: RiskLevel;
    assessmentDate: Date;
    nextReviewDate: Date;
  }[]> {
    const today = new Date().toISOString();
    
    const { data, error } = await this.supabase
      .from('risk_assessments')
      .select('id, entity_id, entity_type, risk_level, assessment_date, next_review_date')
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      entityId: item.entity_id,
      entityType: item.entity_type as 'INVESTOR' | 'ISSUER',
      riskLevel: item.risk_level as RiskLevel,
      assessmentDate: new Date(item.assessment_date),
      nextReviewDate: new Date(item.next_review_date)
    }));
  }

  // Determine risk level based on score
  private determineRiskLevel(score: number): RiskLevel {
    if (score < 3.5) {
      return 'LOW';
    } else if (score < 7) {
      return 'MEDIUM';
    } else {
      return 'HIGH';
    }
  }

  // Calculate next review date based on risk level
  private calculateNextReviewDate(riskLevel: RiskLevel): Date {
    const today = new Date();
    const nextReview = new Date(today);
    
    switch (riskLevel) {
      case 'LOW':
        // Review in 1 year
        nextReview.setFullYear(today.getFullYear() + 1);
        break;
      case 'MEDIUM':
        // Review in 6 months
        nextReview.setMonth(today.getMonth() + 6);
        break;
      case 'HIGH':
        // Review in 3 months
        nextReview.setMonth(today.getMonth() + 3);
        break;
    }
    
    return nextReview;
  }
}