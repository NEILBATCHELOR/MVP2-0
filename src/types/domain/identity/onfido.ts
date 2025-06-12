/**
 * Type definitions for Onfido API
 * Based on Onfido API documentation v3.6
 */

// Applicant types
export interface OnfidoApplicant {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email?: string;
  dob?: string;
  address?: OnfidoAddress;
  id_numbers?: OnfidoIdNumber[];
}

export interface OnfidoApplicantRequest {
  first_name: string;
  last_name: string;
  email?: string;
  dob?: string;
  address?: OnfidoAddress;
  id_numbers?: OnfidoIdNumber[];
}

export interface OnfidoAddress {
  flat_number?: string;
  building_number?: string;
  building_name?: string;
  street: string;
  sub_street?: string;
  town: string;
  state?: string;
  postcode: string;
  country: string;
}

export interface OnfidoIdNumber {
  type: 'ssn' | 'social_insurance' | 'tax_id' | 'identity_card' | 'driving_license' | 'passport';
  value: string;
  state_code?: string;
}

// Document types
export interface OnfidoDocument {
  id: string;
  created_at: string;
  file_name: string;
  file_type: string;
  file_size: number;
  type: OnfidoDocumentType;
  side?: 'front' | 'back';
  issuing_country?: string;
}

export type OnfidoDocumentType = 
  | 'passport' 
  | 'driving_licence'
  | 'national_identity_card'
  | 'residence_permit'
  | 'visa'
  | 'work_permit'
  | 'utility_bill'
  | 'bank_statement'
  | 'council_tax'
  | 'benefit_letters'
  | 'government_letter';

// Check types
export interface OnfidoCheck {
  id: string;
  created_at: string;
  status: OnfidoCheckStatus;
  result: OnfidoCheckResult;
  applicant_id: string;
  report_ids: string[];
  tags?: string[];
  webhook_ids?: string[];
  privacy_notices_read_consent_given?: boolean;
  consider?: 'accept_until_withdrawn';
  sub_result?: string;
  form_id?: string;
}

/**
 * AML Check interface for Anti-Money Laundering check results
 */
export interface AMLCheck {
  id: string;
  status: 'match' | 'no_match' | 'possible_match';
  result: 'match' | 'no_match' | 'possible_match';
  details?: Record<string, any> | string;
  checkType?: 'sanction' | 'pep' | 'adverse_media' | 'full';
  provider?: 'onfido' | 'refinitiv' | 'complyadvantage';
  createdAt: string;
  updatedAt?: string;
  investorId: string;
  type: string;
}

export type OnfidoCheckStatus = 
  | 'in_progress' 
  | 'awaiting_applicant' 
  | 'complete' 
  | 'withdrawn'
  | 'paused';

export type OnfidoCheckResult = 
  | 'clear' 
  | 'consider' 
  | 'unidentified';

export interface OnfidoCheckRequest {
  applicant_id: string;
  report_names: string[];
  document_ids?: string[];
  consider?: 'accept_until_withdrawn';
  asynchronous?: boolean;
  tags?: string[];
  webhook_ids?: string[];
  privacy_notices_read_consent_given?: boolean;
}

// Report types
export interface OnfidoReport {
  id: string;
  created_at: string;
  name: string;
  status: 'awaiting_data' | 'awaiting_approval' | 'complete' | 'withdrawn';
  result: 'clear' | 'consider' | 'unidentified';
  sub_result?: string;
  breakdown: Record<string, any>;
  properties: Record<string, any>;
  check_id: string;
}

// Live Photo/Video types
export interface OnfidoLivePhoto {
  id: string;
  created_at: string;
  file_name: string;
  file_type: string;
  file_size: number;
  href: string;
  applicant_id: string;
}

export interface OnfidoLiveVideo {
  id: string;
  created_at: string;
  file_name: string;
  file_type: string;
  file_size: number;
  href: string;
  applicant_id: string;
}

// SDK Token types
export interface OnfidoSdkToken {
  token: string;
  token_expires_at: string;
  applicant_id: string;
  referrer: string;
}

export interface OnfidoSdkTokenRequest {
  applicant_id: string;
  referrer: string;
  cross_device_url?: string;
  application_id?: string;
}

// Webhook types
export interface OnfidoWebhook {
  id: string;
  token: string;
  url: string;
  enabled: boolean;
  environments: ('sandbox' | 'live')[];
  events: string[];
}

// API Error types
export interface OnfidoApiError {
  error: {
    type: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

// SDK types
export interface OnfidoSDKOptions {
  token: string;
  containerId: string;
  onComplete: (data: OnfidoComplete) => void;
  onError: (error: OnfidoError) => void;
  language?: string;
  steps?: {
    welcome?: boolean;
    document?: {
      enabled: boolean;
      documentTypes?: {
        passport?: boolean;
        driving_licence?: boolean;
        national_identity_card?: boolean;
        residence_permit?: boolean;
      };
      countryCodes?: string[];
    };
    face?: {
      type: 'photo' | 'video';
      options?: {
        recording_duration?: number;
        uploadFallback?: boolean;
      };
    };
    complete?: {
      message?: string;
      submessage?: string;
    };
  };
  useModal?: boolean;
  isModalOpen?: boolean;
  showCountrySelection?: boolean;
  customUI?: Record<string, any>;
}

export interface OnfidoComplete {
  document: {
    type: OnfidoDocumentType;
    side?: 'front' | 'back';
    id: string;
    captureMethod?: 'upload' | 'camera';
    frontCaptureFallback?: boolean;
    backCaptureFallback?: boolean;
  };
  face?: {
    id: string;
    variant: 'standard' | 'with_challenge' | 'with_video';
    captureFallback?: boolean;
  };
  data?: Record<string, any>;
}

export interface OnfidoError {
  type: string;
  message: string;
  fields?: Record<string, string[]>;
  origin?: 'client' | 'server';
  data?: Record<string, any>;
}

// API config options
export interface OnfidoApiOptions {
  apiToken: string;
  webhookToken?: string;
  region?: 'eu' | 'us' | 'ca';
}

// API request options
export interface OnfidoRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: any;
}

// Workflow types
export interface OnfidoWorkflow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'draft' | 'inactive';
  resource_type: 'workflow';
}

export interface OnfidoWorkflowRun {
  id: string;
  applicant_id: string;
  workflow_id: string;
  status: 'in_progress' | 'complete' | 'awaiting_input' | 'errored';
  created_at: string;
  updated_at: string;
  resource_type: 'workflow_run';
}

/**
 * Risk Assessment related types
 */
export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskFactor {
  factor: string;
  weight: number;
  score: number;
  description?: string;
  category: 'identity' | 'geography' | 'activity' | 'legal' | 'financial';
}

export interface RiskReviewHistory {
  reviewedBy: string;
  date: string;
  riskLevel: RiskLevel;
  comments?: string;
}

export interface RiskAssessment {
  id: string;
  investorId: string;
  totalScore: number;
  riskLevel: RiskLevel;
  assessmentDate: string;
  nextReviewDate: string;
  factors: RiskFactor[];
  reviewHistory?: RiskReviewHistory[];
}

/**
 * Verification status for use across components
 */
export type VerificationStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NOT_STARTED' | 'PENDING';