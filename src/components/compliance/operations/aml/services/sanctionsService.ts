import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/core/database';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import type { AmlCheck, AmlStatus, AmlResult, AmlListType } from '@/types/domain/compliance/compliance';

export class SanctionsService {
  private static instance: SanctionsService;
  private supabase;
  private config: {
    apiKey?: string;
    provider: 'complyadvantage' | 'refinitiv' | 'mock';
  };

  private constructor(config: {
    apiKey?: string;
    provider: 'complyadvantage' | 'refinitiv' | 'mock';
  }) {
    this.config = config;
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  public static getInstance(config?: {
    apiKey?: string;
    provider?: 'complyadvantage' | 'refinitiv' | 'mock';
  }): SanctionsService {
    if (!SanctionsService.instance) {
      SanctionsService.instance = new SanctionsService({
        apiKey: config?.apiKey || process.env.NEXT_PUBLIC_SANCTIONS_API_KEY,
        provider: config?.provider || 'complyadvantage'
      });
    }
    return SanctionsService.instance;
  }

  // Screen an individual against global sanction lists
  async screenIndividual(personData: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    nationality?: string;
    country?: string;
  }): Promise<AmlCheck> {
    try {
      const { data, error } = await this.supabase.functions.invoke('aml-screen-individual', {
        body: { 
          personData,
          config: this.config,
          listTypes: ['SANCTIONS', 'PEP', 'ADVERSE_MEDIA']
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return this.formatAmlCheckResult(data);
    } catch (error) {
      console.error('Error screening individual:', error);
      throw error;
    }
  }

  // Get detailed information about a specific AML check
  async getCheckDetails(checkId: string): Promise<AmlCheck> {
    try {
      const { data, error } = await this.supabase.functions.invoke('aml-get-check-details', {
        body: { 
          checkId,
          config: this.config
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return this.formatAmlCheckResult(data);
    } catch (error) {
      console.error('Error getting check details:', error);
      throw error;
    }
  }

  // Run batch screening for multiple individuals
  async batchScreenIndividuals(persons: Array<{
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    nationality?: string;
    country?: string;
  }>): Promise<{ batchId: string; status: string }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('aml-batch-screen', {
        body: { 
          persons,
          config: this.config,
          listTypes: ['SANCTIONS', 'PEP', 'ADVERSE_MEDIA']
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error batch screening individuals:', error);
      throw error;
    }
  }

  // Get batch screening results
  async getBatchResults(batchId: string): Promise<{
    batchId: string;
    status: 'pending' | 'completed' | 'failed';
    results?: Array<{
      personId: string;
      check: AmlCheck;
    }>;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('aml-get-batch-results', {
        body: { 
          batchId,
          config: this.config
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      
      // Format the results
      if (data.results) {
        data.results = data.results.map((result: any) => ({
          personId: result.personId,
          check: this.formatAmlCheckResult(result.check)
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Error getting batch results:', error);
      throw error;
    }
  }

  // Store AML check result in database
  async storeCheckResult(amlCheck: AmlCheck) {
    try {
      const { error } = await this.supabase
        .from('verification_results')
        .insert({
          investor_id: amlCheck.investorId,
          verification_type: 'AML',
          provider: this.config.provider,
          provider_id: amlCheck.externalId,
          result: amlCheck,
          status: this.mapAmlStatusToDbStatus(amlCheck.status),
          metadata: {
            listTypes: amlCheck.listTypes,
            matchDetails: amlCheck.matchDetails
          }
        });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error storing AML check result:', error);
      throw error;
    }
  }

  // Handle errors properly
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

  // Format the AML check result to a consistent format
  private formatAmlCheckResult(data: any): AmlCheck {
    return {
      id: data.id || crypto.randomUUID(),
      investorId: data.investorId,
      provider: this.config.provider,
      externalId: data.externalId,
      status: this.mapProviderStatus(data.status),
      result: this.mapProviderResult(data.result),
      listTypes: data.listTypes || [],
      details: data.details || {},
      matchDetails: data.matchDetails || [],
      createdAt: new Date(data.createdAt || new Date()),
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      reviewedBy: data.reviewedBy,
      reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : undefined,
      reviewNotes: data.reviewNotes
    };
  }

  // Map provider-specific status to our AML status
  private mapProviderStatus(status: string): AmlStatus {
    switch (status) {
      case 'pending':
      case 'processing':
        return 'IN_PROGRESS';
      case 'completed':
      case 'success':
        return 'COMPLETED';
      case 'failed':
      case 'error':
        return 'FAILED';
      case 'review':
      case 'review_required':
        return 'REVIEW_REQUIRED';
      default:
        return 'NOT_STARTED';
    }
  }

  // Map provider-specific result to our AML result
  private mapProviderResult(result: string): AmlResult {
    switch (result) {
      case 'match':
      case 'true_match':
        return 'MATCH';
      case 'potential_match':
      case 'possible_match':
        return 'POTENTIAL_MATCH';
      case 'no_match':
      case 'false_match':
        return 'NO_MATCH';
      case 'error':
      case 'failed':
        return 'ERROR';
      default:
        return 'NO_MATCH';
    }
  }

  // Map AML status to database status
  private mapAmlStatusToDbStatus(status: AmlStatus): string {
    switch (status) {
      case 'COMPLETED':
        return 'completed';
      case 'FAILED':
        return 'failed';
      case 'IN_PROGRESS':
        return 'in_progress';
      case 'REVIEW_REQUIRED':
        return 'review_required';
      default:
        return 'pending';
    }
  }
}