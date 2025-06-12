import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/core/database';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import type { IdenfySessionRequest, IdenfySessionResponse, IdenfyVerificationStatus } from '@/types/domain/identity/idenfy';

export class IdenfyService {
  private supabase;
  private config: {
    apiKey: string;
    apiSecret: string;
    baseUrl?: string;
  };

  constructor(config?: {
    apiKey: string;
    apiSecret: string;
    baseUrl?: string;
  }) {
    this.config = config || {
      apiKey: process.env.NEXT_PUBLIC_IDENFY_API_KEY || '',
      apiSecret: process.env.NEXT_PUBLIC_IDENFY_API_SECRET || '',
      baseUrl: 'https://ivs.idenfy.com/api/v2'
    };
    
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Create a verification session
  async createSession(sessionData: {
    clientId: string;
    firstName: string;
    lastName: string;
    successUrl?: string;
    errorUrl?: string;
    callbackUrl?: string;
  }): Promise<IdenfySessionResponse> {
    try {
      const { data, error } = await this.supabase.functions.invoke('idenfy-create-session', {
        body: { 
          sessionData,
          config: this.config
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error creating Idenfy session:', error);
      throw error;
    }
  }

  // Get verification status
  async getVerificationStatus(scanRef: string): Promise<IdenfyVerificationStatus> {
    try {
      const { data, error } = await this.supabase.functions.invoke('idenfy-get-status', {
        body: { 
          scanRef,
          config: this.config
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error getting verification status:', error);
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
    scanRef: string;
    result: any;
    status: 'pending' | 'approved' | 'rejected';
    metadata?: Record<string, any>;
  }) {
    const { error } = await this.supabase
      .from('verification_results')
      .insert({
        investor_id: data.investorId,
        verification_type: 'KYC',
        provider: 'idenfy',
        provider_id: data.scanRef,
        result: data.result,
        status: data.status,
        metadata: data.metadata || {}
      });
    
    if (error) throw error;
    return { success: true };
  }
}