import { OnfidoService } from './onfidoService';
import { IdenfyService } from './idenfyService';
import type { IdentityProvider, IdentityProviderFactory } from '@/types/domain/compliance/compliance';
import type { ComplianceCheck } from '@/types/domain/compliance/compliance';
import type { OnfidoCheck } from '@/types/domain/identity/onfido';

/**
 * Factory for creating identity verification services
 */
export class IdentityServiceFactory {
  /**
   * Get an identity service implementation by provider
   */
  static getService(provider: IdentityProvider): IdentityProviderFactory {
    switch (provider) {
      case 'onfido':
        return new OnfidoIdentityProvider();
      case 'idenfy':
        return new IdenfyIdentityProvider();
      case 'manual':
        return new ManualIdentityProvider();
      default:
        throw new Error(`Unsupported identity provider: ${provider}`);
    }
  }
}

/**
 * Onfido identity provider implementation
 */
class OnfidoIdentityProvider implements IdentityProviderFactory {
  private service: OnfidoService;

  constructor() {
    this.service = OnfidoService.getInstance();
  }

  async createApplicant(investorData: {
    firstName: string;
    lastName: string;
    email?: string;
    dob?: string;
    address?: any;
  }) {
    return this.service.createApplicant(investorData);
  }

  async getApplicant(applicantId: string) {
    // This would need to be implemented in the OnfidoService
    throw new Error('Method not implemented.');
  }

  async createCheck(applicantId: string, options?: { express?: boolean }) {
    const checkType = options?.express ? 'express' : 'standard';
    return this.service.createCheck(applicantId, checkType);
  }

  async getCheckResult(checkId: string) {
    return this.service.getCheckResults(checkId);
  }

  mapProviderCheck(providerCheck: OnfidoCheck): ComplianceCheck {
    const status = this.mapCheckStatus(providerCheck.status);
    const result = this.mapCheckResult(providerCheck.result);
    
    return {
      id: providerCheck.id,
      type: 'KYC',
      status,
      result,
      details: {
        provider: 'onfido',
        checkId: providerCheck.id,
        applicantId: providerCheck.applicant_id,
        reportIds: providerCheck.report_ids,
        subResult: providerCheck.sub_result
      },
      createdAt: new Date(providerCheck.created_at),
      completedAt: providerCheck.status === 'complete' ? new Date() : undefined
    };
  }

  private mapCheckStatus(status: string): ComplianceCheck['status'] {
    switch (status) {
      case 'in_progress':
        return 'IN_PROGRESS';
      case 'awaiting_applicant':
        return 'PENDING';
      case 'complete':
        return 'COMPLETED';
      case 'withdrawn':
      case 'paused':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  private mapCheckResult(result?: string): ComplianceCheck['result'] {
    if (!result) return undefined;
    
    switch (result) {
      case 'clear':
        return 'PASS';
      case 'consider':
        return 'REVIEW_REQUIRED';
      case 'unidentified':
        return 'FAIL';
      default:
        return undefined;
    }
  }
}

/**
 * Idenfy identity provider implementation
 */
class IdenfyIdentityProvider implements IdentityProviderFactory {
  private service: IdenfyService;

  constructor() {
    // This would require an IdenfyService implementation
    this.service = new IdenfyService();
  }

  async createApplicant(investorData: {
    firstName: string;
    lastName: string;
    email?: string;
    dob?: string;
  }) {
    // Will be implemented when IdenfyService is created
    throw new Error('Method not implemented.');
  }

  async getApplicant(applicantId: string) {
    throw new Error('Method not implemented.');
  }

  async createCheck(applicantId: string, options?: any) {
    throw new Error('Method not implemented.');
  }

  async getCheckResult(checkId: string) {
    throw new Error('Method not implemented.');
  }

  mapProviderCheck(providerCheck: any): ComplianceCheck {
    throw new Error('Method not implemented.');
  }
}

/**
 * Manual identity verification process
 */
class ManualIdentityProvider implements IdentityProviderFactory {
  async createApplicant(investorData: {
    firstName: string;
    lastName: string;
    email?: string;
    dob?: string;
  }) {
    // Create a manual applicant record
    return {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      first_name: investorData.firstName,
      last_name: investorData.lastName,
      email: investorData.email,
      dob: investorData.dob
    };
  }

  async getApplicant(applicantId: string) {
    throw new Error('Method not implemented.');
  }

  async createCheck(applicantId: string) {
    // Create a manual check that requires staff review
    return {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      status: 'in_progress',
      result: null,
      applicant_id: applicantId,
      report_ids: []
    };
  }

  async getCheckResult(checkId: string) {
    throw new Error('Method not implemented.');
  }

  mapProviderCheck(providerCheck: any): ComplianceCheck {
    return {
      id: providerCheck.id || crypto.randomUUID(),
      type: 'KYC',
      status: 'IN_PROGRESS',
      details: {
        provider: 'manual',
        applicantId: providerCheck.applicant_id,
        manualCheck: true
      },
      createdAt: new Date(providerCheck.created_at || new Date())
    };
  }
}