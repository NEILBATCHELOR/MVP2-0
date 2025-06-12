// Dashboard Components
export { default as ComplianceDashboard } from './ComplianceDashboard';

// KYC Components
export { default as KYCComplianceDashboard } from './kyc/KYCComplianceDashboard';
export { BatchAMLCheck } from './kyc/components/BatchAMLCheck';
export { BatchVerificationProcessor } from './kyc/components/BatchVerificationProcessor';
export { AMLCheck } from './kyc/components/AMLCheck';
export { RiskAssessment } from './kyc/components/RiskAssessment';

// Issuer Components
export { default as IssuerComplianceDashboard } from './issuer/IssuerComplianceDashboard';
export { IssuerBulkUpload } from './issuer/IssuerBulkUpload';
export { KYBVerification } from './issuer/kyb/KYBVerification';

// Investor Components
export { InvestorBulkUpload } from './investor/InvestorBulkUpload';

// Approval Components
export { ApprovalWorkflow } from './approvals/components/ApprovalWorkflow';
export { BatchApprovalProcessor } from './approvals/components/BatchApprovalProcessor';
export { default as ComplianceApprovalDashboard } from './approvals/ComplianceApprovalDashboard';

// Shared Components
export { DataExportPanel } from './shared/DataExportPanel';

// Chart Components
export { default as ComplianceBarChart } from './charts/ComplianceBarChart';
export { default as CompliancePieChart } from './charts/CompliancePieChart';

// Services
export { ApprovalWorkflowService } from './approvals/services/approvalWorkflowService';

// Legacy exports
export { default as KYCDashboard } from './kyc/KYCDashboard';
export { default as KYCAMLChecks } from './kyc/KYCAMLChecks';
export * from './restrictions/types';
export * from './restrictions/services';