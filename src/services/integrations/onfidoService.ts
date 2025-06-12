import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/core/database';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

export class OnfidoService {
  private static instance: OnfidoService;
  private supabase;

  private constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  public static getInstance(): OnfidoService {
    if (!OnfidoService.instance) {
      OnfidoService.instance = new OnfidoService();
    }
    return OnfidoService.instance;
  }

  // Create an applicant using Edge Function
  async createApplicant(applicantData: {
    firstName: string;
    lastName: string;
    email?: string;
    dob?: string;
    address?: any;
  }) {
    try {
      const { data, error } = await this.supabase.functions.invoke('onfido-create-applicant', {
        body: { applicantData }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error creating applicant:', error);
      throw error;
    }
  }

  // Generate SDK token using Edge Function
  async createSdkToken(applicantId: string, referrer: string) {
    try {
      const { data, error } = await this.supabase.functions.invoke('onfido-generate-sdk-token', {
        body: { applicantId, referrer }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error generating SDK token:', error);
      throw error;
    }
  }

  // Create a check using Edge Function
  async createCheck(applicantId: string, checkType: 'standard' | 'express' = 'standard') {
    try {
      const { data, error } = await this.supabase.functions.invoke('onfido-create-check', {
        body: { 
          applicantId, 
          reportNames: ['document', 'facial_similarity', 'watchlist', 'identity'],
          consider: checkType === 'express' ? 'accept_until_withdrawn' : undefined
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error creating check:', error);
      throw error;
    }
  }

  // Get check status using Edge Function
  async getCheckResults(checkId: string) {
    try {
      const { data, error } = await this.supabase.functions.invoke('onfido-get-check-status', {
        body: { checkId }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error getting check results:', error);
      throw error;
    }
  }

  // Add method for Studio workflow support
  async startWorkflow(applicantId: string, workflowId: string) {
    try {
      const { data, error } = await this.supabase.functions.invoke('onfido-start-workflow', {
        body: { applicantId, workflowId }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error starting workflow:', error);
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
      return new Error('Network error connecting to verification service');
    } else if (error instanceof FunctionsFetchError) {
      console.error('Function fetch error:', error);
      return new Error('Failed to fetch from verification service');
    } else {
      return error;
    }
  }

  // Store verification result in database
  async storeVerificationResult(data: {
    investorId: string;
    verificationType: string;
    result: any;
    status: 'pending' | 'approved' | 'rejected';
    metadata?: Record<string, any>;
  }) {
    const { error } = await this.supabase
      .from('verification_results')
      .insert({
        investor_id: data.investorId,
        verification_type: data.verificationType,
        result: data.result,
        status: data.status,
        metadata: data.metadata || {}
      });
    
    if (error) throw error;
    return { success: true };
  }
}