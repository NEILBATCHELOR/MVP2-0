import { supabase } from '@/infrastructure/database/client';
import type { Database } from '@/types/core/database';
import { IdenfyService } from '@/components/compliance/operations/documents/services/idenfyService';

export interface DocumentVerificationConfig {
  allowedDocumentTypes: string[];
  maxFileSize: number;
  requiredMetadata: string[];
  validationRules: Record<string, any>;
}

export interface VerificationResult {
  isValid: boolean;
  score: number;
  details: Record<string, any>;
  metadata: Record<string, any>;
}

export class DocumentVerificationService {
  private static instance: DocumentVerificationService;
  private supabase;
  private idenfyService: IdenfyService;

  private constructor() {
    this.supabase = supabase;
    this.idenfyService = IdenfyService.getInstance({
      apiKey: process.env.IDENFY_API_KEY!,
      apiSecret: process.env.IDENFY_API_SECRET!,
      baseUrl: process.env.IDENFY_API_URL!
    });
  }

  public static getInstance(): DocumentVerificationService {
    if (!DocumentVerificationService.instance) {
      DocumentVerificationService.instance = new DocumentVerificationService();
    }
    return DocumentVerificationService.instance;
  }

  // Document Type Configurations
  private readonly documentConfigs: Record<string, DocumentVerificationConfig> = {
    government_id: {
      allowedDocumentTypes: ['passport', 'national_id', 'residence_permit'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      requiredMetadata: ['issuing_country', 'document_number', 'expiry_date'],
      validationRules: {
        minExpiryMonths: 6,
        requireMRZ: true,
        requireFaceMatch: true
      }
    },
    passport: {
      allowedDocumentTypes: ['passport'],
      maxFileSize: 10 * 1024 * 1024,
      requiredMetadata: ['issuing_country', 'passport_number', 'expiry_date'],
      validationRules: {
        minExpiryMonths: 6,
        requireMRZ: true,
        requireFaceMatch: true,
        requireBiometricPage: true
      }
    },
    drivers_license: {
      allowedDocumentTypes: ['driving_license'],
      maxFileSize: 8 * 1024 * 1024,
      requiredMetadata: ['issuing_country', 'license_number', 'expiry_date'],
      validationRules: {
        minExpiryMonths: 3,
        requireFaceMatch: true
      }
    },
    utility_bill: {
      allowedDocumentTypes: ['utility_bill'],
      maxFileSize: 5 * 1024 * 1024,
      requiredMetadata: ['issue_date', 'provider', 'address'],
      validationRules: {
        maxDocumentAge: 90, // days
        requireAddress: true
      }
    },
    bank_statement: {
      allowedDocumentTypes: ['bank_statement'],
      maxFileSize: 10 * 1024 * 1024,
      requiredMetadata: ['bank_name', 'account_holder', 'statement_date'],
      validationRules: {
        maxDocumentAge: 90,
        requireAccountDetails: true,
        requireBankLogo: true
      }
    },
    accreditation_proof: {
      allowedDocumentTypes: ['financial_statement', 'tax_return', 'employment_verification'],
      maxFileSize: 15 * 1024 * 1024,
      requiredMetadata: ['document_type', 'issue_date', 'issuer'],
      validationRules: {
        maxDocumentAge: 365,
        requireFinancialDetails: true
      }
    },
    wealth_statement: {
      allowedDocumentTypes: ['bank_statement', 'investment_statement', 'asset_proof'],
      maxFileSize: 15 * 1024 * 1024,
      requiredMetadata: ['document_type', 'issue_date', 'total_value'],
      validationRules: {
        maxDocumentAge: 90,
        requireMonetaryValue: true
      }
    },
    tax_document: {
      allowedDocumentTypes: ['tax_return', 'tax_certificate', 'tax_id'],
      maxFileSize: 10 * 1024 * 1024,
      requiredMetadata: ['tax_year', 'jurisdiction', 'document_type'],
      validationRules: {
        requireTaxIdentifier: true,
        maxYearsOld: 2
      }
    }
  };

  // Verify Document
  async verifyDocument(params: {
    investorId: string;
    documentType: string;
    file: Buffer;
    metadata: Record<string, any>;
  }): Promise<VerificationResult> {
    const config = this.documentConfigs[params.documentType];
    if (!config) {
      throw new Error(`Unsupported document type: ${params.documentType}`);
    }

    // Verify file size
    if (params.file.length > config.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${config.maxFileSize / 1024 / 1024}MB`);
    }

    // Verify required metadata
    const missingMetadata = config.requiredMetadata.filter(
      (field) => !params.metadata[field]
    );
    if (missingMetadata.length > 0) {
      throw new Error(`Missing required metadata: ${missingMetadata.join(', ')}`);
    }

    // Perform document verification using Idenfy
    const verificationResult = await this.idenfyService.verifyDocument({
      type: params.documentType,
      file: params.file,
      metadata: {
        ...params.metadata,
        validationRules: config.validationRules
      }
    });

    // Store verification result
    await this.storeVerificationResult({
      investorId: params.investorId,
      documentType: params.documentType,
      result: verificationResult,
      metadata: params.metadata
    });

    return this.processVerificationResult(verificationResult);
  }

  // Process Verification Result
  private processVerificationResult(result: any): VerificationResult {
    return {
      isValid: result.status === 'approved',
      score: result.confidence || 0,
      details: result.details || {},
      metadata: result.metadata || {}
    };
  }

  // Store Verification Result
  private async storeVerificationResult(params: {
    investorId: string;
    documentType: string;
    result: any;
    metadata: Record<string, any>;
  }) {
    const { data, error } = await this.supabase
      .from('document_verifications')
      .insert([{
        investor_id: params.investorId,
        document_type: params.documentType,
        verification_result: params.result,
        metadata: params.metadata,
        verified_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return data;
  }

  // Get Verification History
  async getVerificationHistory(investorId: string) {
    const { data, error } = await this.supabase
      .from('document_verifications')
      .select('*')
      .eq('investor_id', investorId)
      .order('verified_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Batch Process Documents
  async batchVerifyDocuments(documents: Array<{
    investorId: string;
    documentType: string;
    file: Buffer;
    metadata: Record<string, any>;
  }>) {
    return Promise.all(
      documents.map((doc) => this.verifyDocument(doc))
    );
  }

  // Get Document Requirements
  getDocumentRequirements(documentType: string): DocumentVerificationConfig {
    const config = this.documentConfigs[documentType];
    if (!config) {
      throw new Error(`Unsupported document type: ${documentType}`);
    }
    return config;
  }
}