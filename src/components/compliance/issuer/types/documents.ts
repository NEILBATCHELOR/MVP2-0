import { Database } from '@/types/core/supabase';

// Export the document_type enum from the Supabase schema
export type DocumentType = Database['public']['Enums']['document_type'];

// Export the document_status enum from the Supabase schema
export type DocumentStatus = Database['public']['Enums']['document_status'];

// Export the workflow_status enum from the Supabase schema
export type WorkflowStatus = Database['public']['Enums']['workflow_status'];

// Compliance status type - we use our own since it's different from the database enum
export type ComplianceStatus = 'pass' | 'fail' | 'warning';

// Issuer document interface
export interface IssuerDocument {
  id: string;
  issuer_id: string;
  document_type: DocumentType;
  file_url: string;
  status: DocumentStatus;
  metadata: any;
  version: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  uploaded_at: string;
  expires_at?: string | null;
  last_reviewed_at?: string | null;
  reviewed_by?: string | null;
}

// Compliance check interface
export interface ComplianceCheck {
  category: string;
  status: ComplianceStatus;
  description: string;
  recommendation?: string;
}

// Compliance report interface for our app (different from database model)
export interface ComplianceReport {
  id: string;
  project_id: string;
  generated_at: string | Date;
  status: ComplianceStatus;
  findings: ComplianceCheck[];
}

// Database compliance report interface (matching the actual database structure)
export interface DbComplianceReport {
  id: string;
  issuer_id: string;
  generated_at: string;
  status: Database['public']['Enums']['compliance_status'];
  findings: any;
  metadata: any;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

// Sign-off workflow interface
export interface SignOffWorkflow {
  id: string;
  document_id: string;
  required_signers: string[];
  completed_signers: string[];
  status: WorkflowStatus;
  deadline?: string;
}