import type { Country } from '@/utils/compliance/countries';
import type { InvestorType } from '@/utils/compliance/investorTypes';
import type { 
  ApprovalStatus, 
  ApproverStatus, 
  ApprovalLevel, 
  EntityType, 
  RiskLevel, 
  VerificationStatus,
  DocumentRequirement,
  ComplianceRule,
  ComplianceCheck,
  ComplianceAuditLog,
  DocumentVerification,
  RiskAssessment,
  ApprovalWorkflow,
  InvestorCompliance,
  IssuerCompliance
} from '@/types/domain/compliance/compliance';

// Re-export all types to maintain backwards compatibility
export {
  RiskLevel,
  DocumentRequirement,
  ComplianceRule,
  ComplianceCheck,
  ComplianceAuditLog,
  DocumentVerification,
  RiskAssessment,
  ApprovalWorkflow,
  InvestorCompliance,
  IssuerCompliance
};