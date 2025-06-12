import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/core/database';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import type { AMLCheck, VerificationStatus } from '@/types/domain/identity/onfido';

export class AMLService {
  private static instance: AMLService;
  private supabase;

  private constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  public static getInstance(): AMLService {
    if (!AMLService.instance) {
      AMLService.instance = new AMLService();
    }
    return AMLService.instance;
  }

  // Run AML check with specified provider
  async runAMLCheck(data: {
    investorId: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    nationality?: string;
    checkType: 'sanction' | 'pep' | 'adverse_media' | 'full';
    provider?: 'onfido' | 'refinitiv' | 'complyadvantage';
  }): Promise<AMLCheck> {
    try {
      const { data: result, error } = await this.supabase.functions.invoke('run-aml-check', {
        body: { ...data }
      });
      
      if (error) throw this.handleFunctionError(error);
      return result;
    } catch (error) {
      console.error('Error running AML check:', error);
      throw error;
    }
  }

  // Get AML check status
  async getAMLCheckStatus(checkId: string): Promise<AMLCheck> {
    try {
      const { data: result, error } = await this.supabase.functions.invoke('get-aml-check-status', {
        body: { checkId }
      });
      
      if (error) throw this.handleFunctionError(error);
      return result;
    } catch (error) {
      console.error('Error getting AML check status:', error);
      throw error;
    }
  }

  // Run AML batch check for multiple investors
  async runBatchAMLCheck(investors: Array<{
    investorId: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    nationality?: string;
  }>, options: {
    checkType: 'sanction' | 'pep' | 'adverse_media' | 'full';
    provider?: 'onfido' | 'refinitiv' | 'complyadvantage';
  }): Promise<{
    batchId: string;
    totalInvestors: number;
    status: 'processing';
  }> {
    try {
      const { data: result, error } = await this.supabase.functions.invoke('run-batch-aml-check', {
        body: { 
          investors,
          checkType: options.checkType,
          provider: options.provider
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return result;
    } catch (error) {
      console.error('Error running batch AML check:', error);
      throw error;
    }
  }

  // Get batch AML check results
  async getBatchAMLCheckResults(batchId: string): Promise<{
    batchId: string;
    status: 'processing' | 'completed' | 'failed';
    totalInvestors: number;
    processedInvestors: number;
    results?: Record<string, AMLCheck>;
  }> {
    try {
      const { data: result, error } = await this.supabase.functions.invoke('get-batch-aml-results', {
        body: { batchId }
      });
      
      if (error) throw this.handleFunctionError(error);
      return result;
    } catch (error) {
      console.error('Error getting batch AML results:', error);
      throw error;
    }
  }

  // Store AML check result in database
  async storeAMLResult(data: {
    investorId: string;
    checkId: string;
    checkType: 'sanction' | 'pep' | 'adverse_media' | 'full';
    result: 'match' | 'no_match' | 'possible_match';
    status: VerificationStatus;
    details?: Record<string, any>;
  }) {
    try {
      const { error } = await this.supabase
        .from('aml_checks')
        .insert({
          investor_id: data.investorId,
          check_id: data.checkId,
          check_type: data.checkType,
          result: data.result,
          status: data.status,
          details: data.details || {}
        });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error storing AML result:', error);
      throw error;
    }
  }

  // Update investor compliance status based on AML check
  async updateInvestorComplianceForAML(investorId: string, status: VerificationStatus) {
    try {
      const { error } = await this.supabase
        .from('investor_compliance')
        .update({ 
          aml_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('investor_id', investorId);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating investor compliance:', error);
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
      return new Error('Network error connecting to AML service');
    } else if (error instanceof FunctionsFetchError) {
      console.error('Function fetch error:', error);
      return new Error('Failed to fetch from AML service');
    } else {
      return error;
    }
  }
}