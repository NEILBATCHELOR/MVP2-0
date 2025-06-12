/**
 * Compliance module type definitions
 * Contains shared types for KYC/AML, identity verification, and compliance workflows
 */

import type { Country } from '@/utils/compliance/countries';
import type { InvestorType } from '@/utils/compliance/investorTypes';
import type { OnfidoApplicant, OnfidoCheck } from '@/types/domain/identity/onfido';
import type { IdenfySessionResponse } from '@/types/domain/identity/idenfy';

/**
 * Identity verification providers supported by the system
 */
export type IdentityProvider = 'onfido' | 'idenfy' | 'manual';
/**
 * Mapping between investor and identity verification provider
 */
export interface IdentityProviderMapping {
  id: string;
  investorId: string;
  provider: IdentityProvider;
  providerId: string; // External ID (e.g., Onfido applicant ID)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * KYC verification status for an investor
 */
export type KycStatus = 
  | 'NOT_STARTED'
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'EXPIRED'
  | 'REVIEW_REQUIRED';

/**
 * KYC verification result
 */
export type KycResult = 
  | 'PASS' 
  | 'FAIL' 
  | 'REVIEW_REQUIRED' 
  | 'PENDING';

/**
 * KYC verification record for an investor
 */
export interface KycVerification {
  id: string;
  investorId: string;
  provider: IdentityProvider;
  externalId?: string;
  status: KycStatus;
  result?: KycResult;
  checkId?: string;
  details: Record<string, any>;
  documents: KycDocument[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

/**
 * KYC document type
 */
export type KycDocumentType = 
  | 'PASSPORT' 
  | 'DRIVERS_LICENSE' 
  | 'ID_CARD' 
  | 'RESIDENCE_PERMIT'
  | 'UTILITY_BILL'
  | 'BANK_STATEMENT'
  | 'OTHER';

/**
 * KYC document status
 */
export type KycDocumentStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED';

/**
 * KYC document record
 */
export interface KycDocument {
  id: string;
  kycVerificationId: string;
  type: KycDocumentType;
  status: KycDocumentStatus;
  provider: IdentityProvider;
  externalId?: string;
  fileUrl?: string;
  rejectionReason?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

/**
 * AML (Anti-Money Laundering) check status
 */
export type AmlStatus = 
  | 'NOT_STARTED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'FAILED'
  | 'REVIEW_REQUIRED';

/**
 * AML check result
 */
export type AmlResult = 
  | 'NO_MATCH' 
  | 'POTENTIAL_MATCH' 
  | 'MATCH' 
  | 'ERROR';

/**
 * AML list types
 */
export type AmlListType = 
  | 'SANCTIONS' 
  | 'PEP' 
  | 'ADVERSE_MEDIA' 
  | 'WATCHLIST'
  | 'GLOBAL_SANCTIONS';

/**
 * AML check record
 */
export interface AmlCheck {
  id: string;
  investorId: string;
  provider: string;
  externalId?: string;
  status: AmlStatus;
  result?: AmlResult;
  listTypes: AmlListType[];
  details: Record<string, any>;
  matchDetails?: AmlMatchDetail[];
  createdAt: Date;
  completedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

/**
 * AML match detail record
 */
export interface AmlMatchDetail {
  listType: AmlListType;
  matchType: 'EXACT' | 'PARTIAL' | 'FUZZY';
  confidence: number; // 0-100 confidence score
  details: Record<string, any>;
}

/**
 * Risk factor category
 */
export type RiskFactorCategory =
  | 'GEOGRAPHIC'
  | 'CUSTOMER'
  | 'TRANSACTION'
  | 'BUSINESS'
  | 'REGULATORY';

/**
 * Risk factor definition
 */
export interface RiskFactor {
  id: string;
  name: string;
  description: string;
  category: RiskFactorCategory;
  weight: number; // 1-10 weighting factor
  scoringLogic: string; // Description of scoring logic
  enabled: boolean;
}

/**
 * Risk factor assessment for a specific entity
 */
export interface RiskFactorAssessment {
  factorId: string;
  score: number; // 1-10 score
  notes?: string;
  assessedBy: string;
  assessedAt: Date;
}

/**
 * Types of entities that can be approved
 */
export type ApprovalEntityType = 'INVESTOR' | 'ISSUER' | 'TRANSACTION';

/**
 * Entity type for approval workflows
 */
export type EntityType = 'INVESTOR' | 'ISSUER';

/**
 * Approval level
 */
export type ApprovalLevel = 'L1' | 'L2' | 'EXECUTIVE';

/**
 * Approval workflow status
 */
export type ApprovalStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'ERROR';

/**
 * Approver status in approval workflow
 */
export type ApproverStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECUSED';

/**
 * Approver role
 */
export type ApproverRole = 
  | 'COMPLIANCE_OFFICER' 
  | 'MANAGER' 
  | 'DIRECTOR' 
  | 'EXECUTIVE';

/**
 * Risk level for compliance assessments
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Multi-signature approval workflow
 */
export interface ApprovalWorkflow {
  id: string;
  entityId: string;
  entityType: EntityType;
  entityName?: string;
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
  riskLevel: RiskLevel;
  updatedBy?: {
    id: string;
    name: string;
    role?: string;
  };
  comment?: string;
  reason?: string;
  requiredApprovals: number;
  currentApprovals: number;
  approvers: {
    userId: string;
    status: ApproverStatus;
    timestamp?: Date;
    comments?: string;
  }[];
}

/**
 * Approver in an approval workflow
 */
export interface Approver {
  userId: string;
  level: ApprovalLevel;
  role: ApproverRole;
  status: ApproverStatus;
  timestamp?: Date;
  comments?: string;
}

/**
 * Verification status for KYC/AML checks
 */
export type VerificationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PENDING';

/**
 * Audit log entry for compliance actions
 */
export interface AuditLog {
  id: string;
  project_id: string;
  timestamp: string;
  action: string;
  user_id: string;
  user_email: string;
  details: string;
  entity_id?: string;
  entity_type?: string;
  ip_address?: string;
  metadata?: any;
}

/**
 * Mapping between provider types and our system types
 */
export interface IdentityProviderFactory {
  createApplicant: (investorData: any) => Promise<any>;
  getApplicant: (applicantId: string) => Promise<any>;
  createCheck: (applicantId: string, options?: any) => Promise<any>;
  getCheckResult: (checkId: string) => Promise<any>;
  mapProviderCheck: (providerCheck: any) => ComplianceCheck;
}

/**
 * Document requirement for compliance rules
 */
export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  validityPeriod?: number; // in months
}

/**
 * Compliance rule definition
 */
export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  blockedCountries: string[]; // country ids
  blockedInvestorTypes: string[]; // investor type ids
  requiredDocuments: DocumentRequirement[];
  riskLevel: RiskLevel;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/**
 * Compliance check record
 */
export interface ComplianceCheck {
  id: string;
  type: 'KYC' | 'KYB' | 'AML' | 'DOCUMENT' | 'RISK' | 'ASSET';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  result?: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
  details: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Compliance audit log entry
 */
export interface ComplianceAuditLog {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: string;
  details: Record<string, any>;
  performedBy: string;
  timestamp: Date;
}

/**
 * Document verification record
 */
export interface DocumentVerification {
  id: string;
  documentType: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationMethod: 'AUTOMATED' | 'MANUAL';
  verifiedBy?: string;
  verificationDate?: Date;
  expiryDate?: Date;
  rejectionReason?: string;
}

/**
 * Risk assessment record
 */
export interface RiskAssessment {
  id: string;
  entityId: string;
  entityType: EntityType;
  riskLevel: RiskLevel;
  factors: {
    factor: string;
    weight: number;
    score: number;
  }[];
  totalScore: number;
  assessedBy: string;
  assessmentDate: Date;
  nextReviewDate: Date;
}

/**
 * Investor compliance record
 */
export interface InvestorCompliance {
  investorId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED';
  kycStatus: VerificationStatus;
  amlStatus: VerificationStatus;
  documents: DocumentVerification[];
  riskAssessment?: RiskAssessment;
  approvalWorkflow?: ApprovalWorkflow;
  checks: ComplianceCheck[];
  updatedAt: Date;
}

/**
 * Issuer compliance record
 */
export interface IssuerCompliance {
  issuerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED';
  kybStatus: VerificationStatus;
  documents: DocumentVerification[];
  assetValidations: {
    assetId: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    details: Record<string, any>;
  }[];
  riskAssessment?: RiskAssessment;
  approvalWorkflow?: ApprovalWorkflow;
  checks: ComplianceCheck[];
  updatedAt: Date;
}