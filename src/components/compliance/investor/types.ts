import { InvestorType } from '@/utils/compliance/investorTypes'; 

export interface InvestorOnboardingState {
  currentStep: number;
  steps: OnboardingStep[];
  investorData: InvestorData;
  complianceStatus: ComplianceStatus;
  walletStatus: WalletStatus;
}

export interface InvestorData {
  // Account Information
  fullName: string;
  businessEmail: string;
  investorType: string;
  countryOfResidence: string;
  
  // Profile & Qualification
  accreditationType: string;
  investmentExperience: string;
  taxResidency: string;
  taxIdNumber: string;
  riskTolerance: string;
  investmentGoals: string;
  
  // Wallet Information
  walletType: 'guardian' | 'external';
  walletAddress?: string;
  isMultiSigEnabled: boolean;
  signatories?: SignatoryInfo[];
}

export interface SignatoryInfo {
  id: string;
  name: string;
  email: string;
  role: 'primary' | 'approver';
}

export interface ComplianceStatus {
  kycStatus: VerificationStatus;
  accreditationStatus: VerificationStatus;
  taxDocumentationStatus: VerificationStatus;
  walletVerificationStatus: VerificationStatus;
  overallProgress: number;
}

export interface WalletStatus {
  status: 'pending' | 'active' | 'blocked';
  guardianPolicyStatus: 'pending' | 'verified' | 'failed';
  activationDate?: string;
  lastVerified?: string;
}

export type VerificationStatus = 
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'action_required'
  | 'verified'
  | 'rejected';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: VerificationStatus;
  isRequired: boolean;
  component: React.ComponentType<any>;
}

export interface DocumentRequirement {
  type: string;
  description: string;
  isRequired: boolean;
  acceptedFormats: string[];
  maxSize: number; // in bytes
  status: VerificationStatus;
}

export interface VerificationDocument {
  id: string;
  type: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  status: VerificationStatus;
  verificationDate?: string;
  rejectionReason?: string;
}