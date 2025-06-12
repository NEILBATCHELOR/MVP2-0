/**
 * Identity management types for Ripple KYC and compliance
 * Covers individual and business identity verification
 */

// Core Identity Types
export interface RippleIdentity {
  id: string;
  type: IdentityType;
  status: IdentityStatus;
  verificationLevel: VerificationLevel;
  riskScore: number;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  expiresAt?: string;
  lastReviewed?: string;
  metadata?: Record<string, any>;
}

export type IdentityType = 'individual' | 'business';

export type IdentityStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'suspended'
  | 'expired';

export type VerificationLevel = 
  | 'basic'
  | 'enhanced'
  | 'premium'
  | 'institutional';

export type RiskLevel = 'low' | 'medium' | 'high' | 'prohibited';

// Individual Identity Types
export interface IndividualIdentity extends RippleIdentity {
  type: 'individual';
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  address: AddressInfo;
  documents: IdentityDocument[];
  employment?: EmploymentInfo;
  financialInfo?: FinancialInfo;
  sourceOfFunds?: SourceOfFunds;
}

export interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  nationality: string;
  gender?: Gender;
  martialStatus?: MaritalStatus;
  nationalId?: string;
  passportNumber?: string;
  taxId?: string;
  socialSecurityNumber?: string;
}

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'other';

export interface ContactInfo {
  email: string;
  phone: string;
  alternativeEmail?: string;
  alternativePhone?: string;
  preferredLanguage: string;
  preferredContactMethod: ContactMethod;
}

export type ContactMethod = 'email' | 'phone' | 'sms' | 'mail';

export interface AddressInfo {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  type: AddressType;
  isVerified: boolean;
  verifiedAt?: string;
  isPrimary: boolean;
}

export type AddressType = 'residential' | 'business' | 'mailing' | 'temporary';

// Business Identity Types
export interface BusinessIdentity extends RippleIdentity {
  type: 'business';
  businessInfo: BusinessInfo;
  legalStructure: LegalStructure;
  registrationInfo: RegistrationInfo;
  contactInfo: ContactInfo;
  address: AddressInfo;
  documents: IdentityDocument[];
  beneficialOwners: BeneficialOwner[];
  authorizedSigners: AuthorizedSigner[];
  financialInfo?: BusinessFinancialInfo;
}

export interface BusinessInfo {
  legalName: string;
  tradingName?: string;
  businessDescription: string;
  industry: string;
  subIndustry?: string;
  website?: string;
  establishedDate: string;
  employeeCount?: EmployeeRange;
  annualRevenue?: RevenueRange;
}

export type EmployeeRange = 
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-1000'
  | '1000+';

export type RevenueRange = 
  | 'under_1m'
  | '1m_10m'
  | '10m_50m'
  | '50m_100m'
  | '100m_500m'
  | '500m+';

export interface LegalStructure {
  type: BusinessType;
  jurisdiction: string;
  isPubliclyTraded: boolean;
  stockExchange?: string;
  tickerSymbol?: string;
  isRegulated: boolean;
  regulatoryLicenses?: RegulatoryLicense[];
}

export type BusinessType = 
  | 'corporation'
  | 'llc'
  | 'partnership'
  | 'sole_proprietorship'
  | 'trust'
  | 'foundation'
  | 'ngo'
  | 'government'
  | 'other';

export interface RegulatoryLicense {
  type: string;
  number: string;
  issuedBy: string;
  issuedDate: string;
  expiresDate?: string;
  isActive: boolean;
}

export interface RegistrationInfo {
  registrationNumber: string;
  taxId: string;
  vatNumber?: string;
  registeredCountry: string;
  registeredState?: string;
  registrationDate: string;
  registryUrl?: string;
}

export interface BeneficialOwner {
  id: string;
  personalInfo: PersonalInfo;
  ownershipPercentage: number;
  isPoliticallyExposed: boolean;
  relationshipToEntity: string;
  address: AddressInfo;
  documents: IdentityDocument[];
  verificationStatus: VerificationStatus;
}

export interface AuthorizedSigner {
  id: string;
  personalInfo: PersonalInfo;
  title: string;
  authorities: SigningAuthority[];
  address: AddressInfo;
  documents: IdentityDocument[];
  verificationStatus: VerificationStatus;
}

export type SigningAuthority = 
  | 'payment_authorization'
  | 'account_management'
  | 'legal_agreements'
  | 'regulatory_filings'
  | 'all';

// Document Types
export interface IdentityDocument {
  id: string;
  type: DocumentType;
  category: DocumentCategory;
  name: string;
  description?: string;
  fileUrl?: string;
  fileHash?: string;
  fileSize?: number;
  mimeType?: string;
  status: DocumentStatus;
  uploadedAt: string;
  verifiedAt?: string;
  expiresAt?: string;
  issuer?: string;
  documentNumber?: string;
  metadata?: Record<string, any>;
}

export type DocumentType = 
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'utility_bill'
  | 'bank_statement'
  | 'tax_return'
  | 'employment_letter'
  | 'business_registration'
  | 'articles_of_incorporation'
  | 'memorandum_of_association'
  | 'regulatory_license'
  | 'financial_statement'
  | 'proof_of_address'
  | 'source_of_funds'
  | 'board_resolution'
  | 'power_of_attorney'
  | 'other';

export type DocumentCategory = 
  | 'identity_verification'
  | 'address_verification'
  | 'financial_verification'
  | 'business_verification'
  | 'compliance'
  | 'other';

export type DocumentStatus = 
  | 'uploaded'
  | 'processing'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'requires_update';

// Employment and Financial Information
export interface EmploymentInfo {
  status: EmploymentStatus;
  employer?: string;
  position?: string;
  industry?: string;
  startDate?: string;
  annualIncome?: string;
  incomeSource: IncomeSource[];
}

export type EmploymentStatus = 
  | 'employed'
  | 'self_employed'
  | 'unemployed'
  | 'retired'
  | 'student'
  | 'other';

export type IncomeSource = 
  | 'salary'
  | 'business'
  | 'investment'
  | 'pension'
  | 'inheritance'
  | 'gift'
  | 'other';

export interface FinancialInfo {
  netWorth: string;
  liquidAssets: string;
  cryptoExperience: CryptoExperience;
  investmentObjective: InvestmentObjective[];
  riskTolerance: RiskTolerance;
}

export type CryptoExperience = 'none' | 'basic' | 'intermediate' | 'advanced' | 'professional';
export type InvestmentObjective = 'speculation' | 'trading' | 'long_term_investment' | 'business_use' | 'other';
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

export interface BusinessFinancialInfo {
  annualRevenue: string;
  netIncome: string;
  totalAssets: string;
  fundingSources: FundingSource[];
  primaryBankAccount: BankAccountDetails;
  expectedTransactionVolume: TransactionVolume;
}

export type FundingSource = 
  | 'revenue'
  | 'investment'
  | 'loan'
  | 'grant'
  | 'other';

export interface BankAccountDetails {
  bankName: string;
  accountType: BankAccountType;
  country: string;
  currency: string;
  relationship: string; // How long banking relationship
}

export type BankAccountType = 'checking' | 'savings' | 'business' | 'investment' | 'other';

export interface TransactionVolume {
  monthly: VolumeRange;
  transactionSize: TransactionSizeRange;
  purpose: TransactionPurpose[];
}

export type VolumeRange = 
  | 'under_10k'
  | '10k_50k'
  | '50k_100k'
  | '100k_500k'
  | '500k_1m'
  | 'over_1m';

export type TransactionSizeRange = 
  | 'under_1k'
  | '1k_10k'
  | '10k_50k'
  | '50k_100k'
  | '100k_500k'
  | 'over_500k';

export type TransactionPurpose = 
  | 'payments'
  | 'remittances'
  | 'trading'
  | 'investment'
  | 'business_operations'
  | 'other';

// Source of Funds
export interface SourceOfFunds {
  primary: FundSource;
  secondary?: FundSource;
  description: string;
  supportingDocuments: string[];
}

export interface FundSource {
  type: FundSourceType;
  description: string;
  amount?: string;
  country?: string;
}

export type FundSourceType = 
  | 'salary'
  | 'business_income'
  | 'investment_returns'
  | 'sale_of_assets'
  | 'inheritance'
  | 'gift'
  | 'loan'
  | 'savings'
  | 'other';

// Verification and Compliance Types
export type VerificationStatus = 
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'expired';

export interface VerificationCheck {
  id: string;
  identityId: string;
  type: VerificationCheckType;
  status: VerificationCheckStatus;
  score?: number;
  confidence?: number;
  provider: string;
  reference?: string;
  results: CheckResult[];
  performedAt: string;
  expiresAt?: string;
  cost?: string;
}

export type VerificationCheckType = 
  | 'identity_document'
  | 'address_verification'
  | 'database_check'
  | 'sanctions_screening'
  | 'pep_screening'
  | 'adverse_media'
  | 'credit_check'
  | 'bank_account_verification'
  | 'phone_verification'
  | 'email_verification'
  | 'biometric_verification'
  | 'liveness_check';

export type VerificationCheckStatus = 
  | 'pending'
  | 'completed'
  | 'failed'
  | 'error'
  | 'manual_review';

export interface CheckResult {
  field: string;
  status: 'pass' | 'fail' | 'warning' | 'manual_review';
  confidence?: number;
  details?: string;
  recommendations?: string[];
}

// PEP (Politically Exposed Person) Types
export interface PEPCheck {
  isPEP: boolean;
  pepLevel?: PEPLevel;
  positions?: PoliticalPosition[];
  family?: PEPRelation[];
  associates?: PEPRelation[];
  lastChecked: string;
}

export type PEPLevel = 'head_of_state' | 'minister' | 'member_of_parliament' | 'judge' | 'military' | 'other';

export interface PoliticalPosition {
  title: string;
  organization: string;
  country: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

export interface PEPRelation {
  name: string;
  relationship: RelationType;
  pepLevel: PEPLevel;
  country: string;
}

export type RelationType = 'spouse' | 'child' | 'parent' | 'sibling' | 'business_associate' | 'other';

// Request Types
export interface CreateIdentityRequest {
  type: IdentityType;
  personalInfo?: Partial<PersonalInfo>;
  businessInfo?: Partial<BusinessInfo>;
  contactInfo: ContactInfo;
  address: AddressInfo;
  metadata?: Record<string, any>;
}

export interface UpdateIdentityRequest {
  personalInfo?: Partial<PersonalInfo>;
  businessInfo?: Partial<BusinessInfo>;
  contactInfo?: Partial<ContactInfo>;
  address?: Partial<AddressInfo>;
  metadata?: Record<string, any>;
}

export interface SubmitVerificationRequest {
  identityId: string;
  documents: DocumentUpload[];
  additionalInfo?: Record<string, any>;
}

export interface DocumentUpload {
  type: DocumentType;
  category: DocumentCategory;
  file: File | string; // File object or base64 string
  name: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

// Response Types
export interface IdentityListResponse {
  identities: RippleIdentity[];
  totalCount: number;
  page: number;
  size: number;
}

export interface VerificationResponse {
  identityId: string;
  status: IdentityStatus;
  verificationLevel: VerificationLevel;
  checks: VerificationCheck[];
  nextSteps: string[];
  estimatedCompletionTime?: string;
}

// Filter and Search Types
export interface IdentityFilters {
  type?: IdentityType[];
  status?: IdentityStatus[];
  verificationLevel?: VerificationLevel[];
  riskLevel?: RiskLevel[];
  country?: string[];
  createdFrom?: string;
  createdTo?: string;
  lastActivityFrom?: string;
  lastActivityTo?: string;
}

export interface IdentitySearchParams extends IdentityFilters {
  query?: string; // Search in names, emails, etc.
  page?: number;
  size?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'verifiedAt' | 'riskScore' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// Configuration Types
export interface IdentityConfig {
  verificationConfig: VerificationConfig;
  complianceConfig: IdentityComplianceConfig;
  documentConfig: DocumentConfig;
  riskConfig: RiskConfig;
}

export interface VerificationConfig {
  requiredChecks: VerificationCheckType[];
  autoApprovalThreshold: number;
  manualReviewThreshold: number;
  pepScreeningEnabled: boolean;
  sanctionsScreeningEnabled: boolean;
  adverseMediaEnabled: boolean;
  reVerificationInterval: number; // days
}

export interface IdentityComplianceConfig {
  supportedCountries: string[];
  blockedCountries: string[];
  highRiskCountries: string[];
  requiredDocuments: Record<IdentityType, DocumentType[]>;
  maximumRiskScore: number;
  pepAcceptancePolicy: PEPAcceptancePolicy;
}

export type PEPAcceptancePolicy = 'reject_all' | 'manual_review' | 'enhanced_due_diligence' | 'accept_with_monitoring';

export interface DocumentConfig {
  supportedTypes: DocumentType[];
  maxFileSize: number; // bytes
  supportedFormats: string[];
  retentionPeriod: number; // days
  encryptionRequired: boolean;
}

export interface RiskConfig {
  factors: RiskFactor[];
  scoringModel: ScoringModel;
  thresholds: RiskThresholds;
}

export interface RiskFactor {
  name: string;
  weight: number;
  conditions: Record<string, any>;
}

export interface ScoringModel {
  algorithm: 'weighted_sum' | 'neural_network' | 'decision_tree';
  version: string;
  lastUpdated: string;
}

export interface RiskThresholds {
  low: number;
  medium: number;
  high: number;
  prohibited: number;
}

// Analytics Types
export interface IdentityAnalytics {
  totalIdentities: number;
  verifiedIdentities: number;
  pendingReview: number;
  rejectedIdentities: number;
  verificationRate: number;
  averageProcessingTime: string;
  riskDistribution: Record<RiskLevel, number>;
  countryDistribution: Record<string, number>;
  verificationTrends: VerificationTrend[];
}

export interface VerificationTrend {
  date: string;
  submitted: number;
  verified: number;
  rejected: number;
  averageTime: string;
}
