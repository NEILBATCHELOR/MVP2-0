import { v4 as uuidv4 } from 'uuid';
import type { ComplianceCheck } from '../../types';

// Define the ComplianceCheckStatus type locally to avoid import errors
type ComplianceCheckStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
type OnfidoStatusType = 'complete' | 'in_progress' | 'awaiting_applicant' | 'withdrawn' | 'paused' | 'reopened';
type IdenfyStatusType = 'APPROVED' | 'FAILED' | 'UNVERIFIED' | 'EXPIRED';

// Base interfaces
export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  [key: string]: any;
}

export interface VerificationResult {
  id?: string;
  status: string;
  provider: string;
  providerData: any;
  applicantId: string;
  [key: string]: any;
}

export interface ComplianceCheckData {
  id: string;
  type: 'KYC' | 'AML' | 'DOCUMENT' | 'PEP/Sanctions';
  status: ComplianceCheckStatus;
  applicantId: string;
  investorId: string;
  provider: string;
  details: any;
  [key: string]: any;
}

// Provider-specific interfaces
export interface OnfidoConfig {
  apiToken: string;
  webhookToken?: string;
  region?: string;
}

export interface IdenfyConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

// Abstract provider interface
export interface VerificationProvider {
  createApplicant(applicantData: Partial<Applicant>): Promise<Applicant>;
  startVerification(applicantId: string, isBackgroundCheck?: boolean): Promise<VerificationResult>;
  getVerificationStatus(verificationId: string): Promise<VerificationResult>;
  storeResult(checkData: ComplianceCheckData): Promise<ComplianceCheckData>;
}

// Onfido implementation
export class OnfidoProvider implements VerificationProvider {
  private config: OnfidoConfig;
  
  constructor(config: OnfidoConfig) {
    this.config = {
      ...config,
      region: config.region || 'us'
    };
  }
  
  private getApiUrl(): string {
    switch (this.config.region) {
      case 'eu':
        return 'https://api.eu.onfido.com/v3.6';
      case 'ca':
        return 'https://api.ca.onfido.com/v3.6';
      case 'us':
      default:
        return 'https://api.us.onfido.com/v3.6';
    }
  }
  
  private async makeApiRequest(endpoint: string, method: string, data?: any): Promise<any> {
    const url = `${this.getApiUrl()}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Token token=${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Onfido API error: ${errorData.error?.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Onfido API request failed:', error);
      throw error;
    }
  }
  
  async createApplicant(applicantData: Partial<Applicant>): Promise<Applicant> {
    // Map to Onfido format
    const onfidoApplicant = {
      first_name: applicantData.firstName,
      last_name: applicantData.lastName,
      email: applicantData.email,
      dob: applicantData.dateOfBirth,
    };
    
    try {
      const result = await this.makeApiRequest('/applicants', 'POST', onfidoApplicant);
      
      // Map back to our common format
      return {
        id: result.id,
        firstName: result.first_name,
        lastName: result.last_name,
        email: result.email,
        dateOfBirth: result.dob,
        providerData: result
      };
    } catch (error) {
      console.error('Failed to create Onfido applicant:', error);
      throw error;
    }
  }
  
  async startVerification(applicantId: string, isBackgroundCheck: boolean = false): Promise<VerificationResult> {
    try {
      // Create check depending on type
      const checkData = isBackgroundCheck 
        ? {
            applicant_id: applicantId,
            report_names: ['identity', 'document', 'watchlist'],
            document_ids: [], // Would be populated if document was uploaded separately
          }
        : {
            applicant_id: applicantId,
            report_names: ['document', 'facial_similarity'],
            document_ids: [], // Would be populated if document was uploaded separately
          };
      
      const checkResult = await this.makeApiRequest('/checks', 'POST', checkData);
      
      // If background check, return immediately
      if (isBackgroundCheck) {
        return {
          id: checkResult.id,
          status: checkResult.status,
          provider: 'onfido',
          providerData: checkResult,
          applicantId
        };
      }
      
      // Otherwise, create an SDK token for client-side verification
      const sdkTokenResult = await this.makeApiRequest('/sdk_token', 'POST', {
        applicant_id: applicantId,
        referrer: window.location.origin
      });
      
      return {
        id: checkResult.id,
        status: checkResult.status,
        provider: 'onfido',
        providerData: checkResult,
        applicantId,
        sdkToken: sdkTokenResult.token,
      };
    } catch (error) {
      console.error('Failed to start Onfido verification:', error);
      throw error;
    }
  }
  
  async getVerificationStatus(verificationId: string): Promise<VerificationResult> {
    try {
      const result = await this.makeApiRequest(`/checks/${verificationId}`, 'GET');
      
      return {
        id: result.id,
        status: result.status,
        provider: 'onfido',
        providerData: result,
        applicantId: result.applicant_id
      };
    } catch (error) {
      console.error('Failed to get Onfido verification status:', error);
      throw error;
    }
  }
  
  async storeResult(checkData: ComplianceCheckData): Promise<ComplianceCheckData> {
    // In a real implementation, this would store to a database
    // For this demo, we'll simulate successful storage
    console.log('Storing Onfido check result:', checkData);
    
    // Generate a unique ID if not provided
    if (!checkData.id) {
      checkData.id = `onfido-${uuidv4()}`;
    }
    
    return checkData;
  }
}

// Idenfy implementation
export class IdenfyProvider implements VerificationProvider {
  private config: IdenfyConfig;
  
  constructor(config: IdenfyConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://ivs.idenfy.com/api/v2'
    };
  }
  
  private async makeApiRequest(endpoint: string, method: string, data?: any): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.apiKey}:${this.config.apiSecret}`)}`,
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Idenfy API error: ${errorData.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Idenfy API request failed:', error);
      throw error;
    }
  }
  
  async createApplicant(applicantData: Partial<Applicant>): Promise<Applicant> {
    // Idenfy doesn't have a separate applicant creation API
    // So we'll create a local ID and use it for tracking
    const applicantId = uuidv4();
    
    return {
      id: applicantId,
      firstName: applicantData.firstName || '',
      lastName: applicantData.lastName || '',
      email: applicantData.email || '',
      dateOfBirth: applicantData.dateOfBirth,
      providerData: { local: true }
    };
  }
  
  async startVerification(applicantId: string, isBackgroundCheck: boolean = false): Promise<VerificationResult> {
    try {
      // For Idenfy, we need to create an authentication token
      const tokenData = {
        clientId: applicantId,
        // Additional configurations can be added here
        amlPoliticallyExposedPersonChecks: isBackgroundCheck,
        amlSanctionsChecks: isBackgroundCheck,
        amlAdverseMediaChecks: isBackgroundCheck
      };
      
      const tokenResult = await this.makeApiRequest('/token', 'POST', tokenData);
      
      return {
        id: tokenResult.authToken,
        status: 'CREATED',
        provider: 'idenfy',
        providerData: tokenResult,
        applicantId,
        authToken: tokenResult.authToken,
      };
    } catch (error) {
      console.error('Failed to start Idenfy verification:', error);
      throw error;
    }
  }
  
  async getVerificationStatus(verificationId: string): Promise<VerificationResult> {
    try {
      const result = await this.makeApiRequest(`/scanning/${verificationId}/status`, 'GET');
      
      return {
        id: verificationId,
        status: result.status,
        provider: 'idenfy',
        providerData: result,
        applicantId: result.clientId || '',
        scanRef: result.scanRef
      };
    } catch (error) {
      console.error('Failed to get Idenfy verification status:', error);
      throw error;
    }
  }
  
  async storeResult(checkData: ComplianceCheckData): Promise<ComplianceCheckData> {
    // In a real implementation, this would store to a database
    // For this demo, we'll simulate successful storage
    console.log('Storing Idenfy check result:', checkData);
    
    // Generate a unique ID if not provided
    if (!checkData.id) {
      checkData.id = `idenfy-${uuidv4()}`;
    }
    
    return checkData;
  }
}

// Factory to create appropriate provider
export class VerificationProviderFactory {
  static createProvider(
    providerName: 'onfido' | 'idenfy', 
    config: OnfidoConfig | IdenfyConfig
  ): VerificationProvider {
    switch (providerName) {
      case 'onfido':
        return new OnfidoProvider(config as OnfidoConfig);
      case 'idenfy':
        return new IdenfyProvider(config as IdenfyConfig);
      default:
        throw new Error(`Unsupported verification provider: ${providerName}`);
    }
  }
  
  static createComplianceCheck(
    provider: string, 
    type: 'KYC' | 'AML' | 'DOCUMENT' | 'PEP/Sanctions',
    checkData: ComplianceCheckData,
    investorId: string
  ): ComplianceCheck {
    // Map provider status to our standard status
    let standardStatus: ComplianceCheckStatus = 'PENDING';
    
    if (provider === 'onfido') {
      // Cast to OnfidoStatusType for type safety
      const onfidoStatus = checkData.status as unknown as OnfidoStatusType;
      switch (onfidoStatus) {
        case 'complete':
          standardStatus = 'COMPLETED';
          break;
        case 'in_progress':
          standardStatus = 'IN_PROGRESS';
          break;
        case 'awaiting_applicant':
          standardStatus = 'PENDING';
          break;
        case 'withdrawn':
        case 'paused':
          standardStatus = 'FAILED';
          break;
        case 'reopened':
          standardStatus = 'PENDING';
          break;
        default:
          standardStatus = 'PENDING';
      }
    } else if (provider === 'idenfy') {
      // Cast to IdenfyStatusType for type safety
      const idenfyStatus = checkData.status as unknown as IdenfyStatusType;
      switch (idenfyStatus) {
        case 'APPROVED':
          standardStatus = 'COMPLETED';
          break;
        case 'FAILED':
          standardStatus = 'FAILED';
          break;
        case 'UNVERIFIED':
          standardStatus = 'PENDING';
          break;
        case 'EXPIRED':
          standardStatus = 'FAILED';
          break;
        default:
          standardStatus = 'PENDING';
      }
    }
    
    // Map the type to a valid ComplianceCheck type
    let checkType: ComplianceCheck['type'] = 
      type === 'DOCUMENT' ? 'DOCUMENT' :
      type === 'KYC' ? 'KYC' :
      type === 'AML' ? 'AML' :
      'KYC'; // Default to KYC for other types like 'PEP/Sanctions'
    
    return {
      id: checkData.id,
      type: checkType,
      status: standardStatus,
      details: checkData.details,
      createdAt: new Date()
    };
  }
}