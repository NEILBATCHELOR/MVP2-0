/**
 * Type definitions for Idenfy API
 * Based on Idenfy API documentation
 */

// Authentication types
export interface IdenfyAuthToken {
  authToken: string;
  expiryTime: string;
}

// Verification session types
export interface IdenfySessionRequest {
  clientId: string;
  firstName: string;
  lastName: string;
  successUrl?: string;
  errorUrl?: string;
  unverifiedUrl?: string;
  locale?: string;
  showInstructions?: boolean;
  expiryTime?: string;
  dateOfBirth?: string;
  personIdentificationNumber?: string;
  email?: string;
  phoneNumber?: string;
  callbackUrl?: string;
  additionalData?: Record<string, any>;
  utilityBill?: boolean;
  reviewSuccessUrl?: string;
  reviewErrorUrl?: string;
  reviewUnverifiedUrl?: string;
  selectedCountry?: string;
  selectedDocumentType?: IdenfyDocumentType;
}

export interface IdenfySessionResponse {
  authToken: string;
  scanRef: string;
  identificationUrl: string;
  expiryTime: string;
}

// Document types
export type IdenfyDocumentType = 
  | 'ID_CARD' 
  | 'PASSPORT' 
  | 'RESIDENCE_PERMIT' 
  | 'DRIVER_LICENSE' 
  | 'OTHER';

// Callback types for verification results
export interface IdenfyWebhookCallback {
  platform: string;
  scanRef: string;
  clientId: string;
  startTime: string;
  finishTime?: string;
  status: IdenfyVerificationStatus;
  data: IdenfyCallbackData;
  issuedAt: string;
  signature: string;
}

export interface IdenfyCallbackData {
  autoDocument: IdenfyAutoDocumentAnalysis;
  autoFace: IdenfyAutoFaceAnalysis;
  manualDocument?: IdenfyManualDocumentAnalysis;
  manualFace?: IdenfyManualFaceAnalysis;
  selectedCountry?: string;
  selectedDocumentType?: IdenfyDocumentType;
  documentsFilled?: string;
  suspectLevels?: IdenfySuspectLevels;
}

export type IdenfyVerificationStatus = 
  | 'APPROVED' 
  | 'DENIED' 
  | 'SUSPECTED' 
  | 'REVIEWING' 
  | 'EXPIRED';

// Document analysis
export interface IdenfyAutoDocumentAnalysis {
  status: 'APPROVED' | 'DENIED' | 'SUSPECTED';
  documentType?: IdenfyDocumentType;
  country?: string;
  documentSide?: 'FRONT' | 'BACK' | 'FACE';
  validityDate?: string;
  personalNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  docNumber?: string;
  sex?: string;
  address?: string;
  documentValid?: boolean;
  mrzValid?: boolean;
  selectedCountry?: string;
  selectedDocumentType?: IdenfyDocumentType;
}

export interface IdenfyAutoFaceAnalysis {
  status: 'APPROVED' | 'DENIED' | 'SUSPECTED';
  matchPercentage?: number;
  liveFaceDetected?: boolean;
  faceMaskDetected?: boolean;
}

export interface IdenfyManualDocumentAnalysis {
  status: 'APPROVED' | 'DENIED' | 'SUSPECTED';
  documentType?: IdenfyDocumentType;
  country?: string;
  documentSide?: 'FRONT' | 'BACK' | 'FACE';
  validityDate?: string;
  personalNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  docNumber?: string;
  sex?: string;
  address?: string;
  documentValid?: boolean;
  mrzValid?: boolean;
  similarDocuments?: IdenfySimilarDocument[];
}

export interface IdenfyManualFaceAnalysis {
  status: 'APPROVED' | 'DENIED' | 'SUSPECTED';
  matchPercentage?: number;
  liveFaceDetected?: boolean;
  faceMaskDetected?: boolean;
}

export interface IdenfySimilarDocument {
  documentType: IdenfyDocumentType;
  country: string;
  matchPercentage: number;
  comment: string;
}

export interface IdenfySuspectLevels {
  suspectLevelManual: number;
  suspectLevelAuto: number;
}

// Verification status types
export interface IdenfyVerificationStatusResponse {
  status: IdenfyVerificationStatus;
  processStatus: IdenfyProcessStatus;
  clientId: string;
  startTime: string;
  finishTime?: string;
}

export type IdenfyProcessStatus = 
  | 'VERIFICATION_SUCCESSFUL' 
  | 'VERIFICATION_UNSUCCESSFUL' 
  | 'VERIFICATION_POSTPONED';

// File download response
export interface IdenfyFileDownloadResponse {
  base64Encoded: string;
  fileExtension: string;
}

// Error types
export interface IdenfyError {
  message: string;
  errorCode: number;
  description?: string;
}

// API configuration
export interface IdenfyApiOptions {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}