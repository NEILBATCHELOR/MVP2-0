/**
 * Token Deployment Interface Types
 * 
 * Centralized type definitions for token deployment to ensure consistency
 * across components and services.
 */

/**
 * Deployment status values
 */
export enum DeploymentStatusValue {
  PENDING = 'PENDING',
  DEPLOYING = 'DEPLOYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  VERIFYING = 'VERIFYING',
  VERIFIED = 'VERIFIED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED'
}

/**
 * Deployment status information interface
 */
export interface DeploymentStatusInfo {
  status: DeploymentStatusValue;
  message: string;
  token?: any;
  tokenAddress?: string;
  transactionHash?: string;
  explorerUrl?: string;
  error?: string;
  verificationId?: string;
  blockchain?: string;
  environment?: string;
  isRateLimitError?: boolean;
}

/**
 * Security validation finding interface
 */
export interface SecurityFinding {
  severity: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
}

/**
 * Security validation result interface
 */
export interface SecurityValidationResult {
  hasIssues: boolean;
  findings: SecurityFinding[];
}

/**
 * Token deployment parameters interface
 */
export interface TokenDeploymentParams {
  projectId: string;
  standard: string;
  tokenName: string;
  tokenSymbol: string;
  initialSupply?: string;
  decimals?: number;
  maxSupply?: string;
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  network?: string;
  environment?: string;
  [key: string]: any; // Allow additional parameters based on token standard
}

/**
 * Rate limit check result interface
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}

/**
 * Verification result interface
 */
export interface VerificationResult {
  success: boolean;
  message: string;
  verificationId?: string;
}