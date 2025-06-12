// Operations module
export * from './operations';

// Issuer compliance components
export * from './issuer';

// Core components
export { default as ComplianceDashboard } from './pages/Dashboard';

// KYC Components
export { default as OnfidoVerification } from './operations/kyc/components/OnfidoVerification';
export { default as KYCComplianceDashboard } from './operations/kyc/KYCComplianceDashboard';
export { default as KYCDashboard } from './operations/kyc/KYCDashboard';
export { default as KYCAMLChecks } from './operations/kyc/KYCAMLChecks';

// Document Components
export { default as DocumentUploader } from './operations/documents/components/DocumentUploader';
export { default as DocumentReview } from './operations/documents/components/DocumentReview';

// Approval Components
export { default as ComplianceApprovalDashboard } from './operations/approvals/ComplianceApprovalDashboard';

// Restrictions Components
export { default as RestrictionManager } from './operations/restrictions/RestrictionManager';

// Audit Components
export { default as AuditLogViewer } from './operations/audit/components/AuditLogViewer';

// Services
export { OnfidoService } from './operations/kyc/services/onfidoService';
export { IdenfyService } from './operations/kyc/services/idenfyService'; 
export { IdentityServiceFactory } from './operations/kyc/services/identityServiceFactory';
export { DocumentAnalysisService } from './operations/documents/services/documentAnalysisService';
export { ApprovalWorkflowService } from './operations/approvals/services/approvalWorkflowService';
export { AuditLogService } from './operations/audit/services/auditLogService';
export { SanctionsService } from './operations/aml/services/sanctionsService';
export { RiskScoringService } from './operations/risk/services/riskScoringService';

// Types - import specific types instead of using wildcard to avoid ambiguity
export type {
  ApprovalStatus,
  ApprovalEntityType,
  ApprovalLevel,
  Approver,
  ApprovalWorkflow,
  EntityType,
  RiskLevel,
  KycStatus,
  KycResult,
  AmlStatus,
  AmlResult
} from '@/types/domain/compliance/compliance';