import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/core/database';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import type { KycDocument, KycDocumentType } from '@/types/domain/compliance/compliance';

export class DocumentAnalysisService {
  private static instance: DocumentAnalysisService;
  private supabase;
  private config: {
    provider: 'internal' | 'azure' | 'google' | 'mock';
    apiKey?: string;
  };

  private constructor(config: {
    provider: 'internal' | 'azure' | 'google' | 'mock';
    apiKey?: string;
  }) {
    this.config = config;
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  public static getInstance(config?: {
    provider?: 'internal' | 'azure' | 'google' | 'mock';
    apiKey?: string;
  }): DocumentAnalysisService {
    if (!DocumentAnalysisService.instance) {
      DocumentAnalysisService.instance = new DocumentAnalysisService({
        provider: config?.provider || 'internal',
        apiKey: config?.apiKey || process.env.DOCUMENT_AI_API_KEY
      });
    }
    return DocumentAnalysisService.instance;
  }

  // Analyze a document to detect its type, verify its authenticity, and extract information
  async analyzeDocument(
    documentId: string
  ): Promise<{
    valid: boolean;
    documentType?: KycDocumentType;
    confidence: number;
    extractedData?: Record<string, any>;
    warnings?: string[];
  }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('document-analysis', {
        body: { 
          documentId,
          config: this.config
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw error;
    }
  }

  // Verify specific document type
  async verifyDocumentType(
    documentId: string,
    expectedType: KycDocumentType
  ): Promise<{
    matches: boolean;
    confidence: number;
    detectedType?: KycDocumentType;
    warnings?: string[];
  }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('document-verify-type', {
        body: { 
          documentId,
          expectedType,
          config: this.config
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error verifying document type:', error);
      throw error;
    }
  }

  // Extract specific fields from a document
  async extractDocumentData(
    documentId: string,
    fields: string[]
  ): Promise<{
    success: boolean;
    extractedData: Record<string, any>;
    confidence: Record<string, number>;
  }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('document-extract-data', {
        body: { 
          documentId,
          fields,
          config: this.config
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error extracting document data:', error);
      throw error;
    }
  }

  // Detect document tampering or forgery
  async detectTampering(
    documentId: string
  ): Promise<{
    tampered: boolean;
    confidence: number;
    issues?: string[];
  }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('document-detect-tampering', {
        body: { 
          documentId,
          config: this.config
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error detecting document tampering:', error);
      throw error;
    }
  }

  // Cross-validate extracted data with existing investor data
  async crossValidateData(
    documentId: string,
    investorId: string
  ): Promise<{
    matches: boolean;
    mismatches?: {
      field: string;
      documentValue: any;
      investorValue: any;
    }[];
  }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('document-cross-validate', {
        body: { 
          documentId,
          investorId,
          config: this.config
        }
      });
      
      if (error) throw this.handleFunctionError(error);
      return data;
    } catch (error) {
      console.error('Error cross-validating document data:', error);
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
      return new Error('Network error connecting to document analysis service');
    } else if (error instanceof FunctionsFetchError) {
      console.error('Function fetch error:', error);
      return new Error('Failed to fetch from document analysis service');
    } else {
      return error;
    }
  }
}