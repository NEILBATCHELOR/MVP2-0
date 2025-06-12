/**
 * DFNS Enhanced Error Handling - Comprehensive error codes and classification
 * 
 * This module provides DFNS-specific error codes, classification, and recovery guidance
 * for better debugging, monitoring, and user experience.
 */

import type { DfnsError, DfnsEnhancedError } from '@/types/dfns';

// ===== DFNS Error Code Mapping =====

export enum DfnsErrorCode {
  // Authentication Errors (1xx)
  INVALID_CREDENTIALS = 'DFNS_AUTH_001',
  TOKEN_EXPIRED = 'DFNS_AUTH_002',
  TOKEN_INVALID = 'DFNS_AUTH_003',
  CREDENTIAL_NOT_FOUND = 'DFNS_AUTH_004',
  SIGNATURE_INVALID = 'DFNS_AUTH_005',
  WEBAUTHN_FAILED = 'DFNS_AUTH_006',
  USER_ACTION_REQUIRED = 'DFNS_AUTH_007',
  DELEGATED_AUTH_FAILED = 'DFNS_AUTH_008',

  // Authorization Errors (2xx)
  INSUFFICIENT_PERMISSIONS = 'DFNS_AUTHZ_001',
  POLICY_VIOLATION = 'DFNS_AUTHZ_002',
  APPROVAL_REQUIRED = 'DFNS_AUTHZ_003',
  RESOURCE_ACCESS_DENIED = 'DFNS_AUTHZ_004',
  OPERATION_NOT_ALLOWED = 'DFNS_AUTHZ_005',

  // Wallet Errors (3xx)
  WALLET_NOT_FOUND = 'DFNS_WALLET_001',
  WALLET_CREATION_FAILED = 'DFNS_WALLET_002',
  WALLET_DELEGATED = 'DFNS_WALLET_003',
  WALLET_EXPORTED = 'DFNS_WALLET_004',
  WALLET_INACTIVE = 'DFNS_WALLET_005',
  INSUFFICIENT_BALANCE = 'DFNS_WALLET_006',
  INVALID_ADDRESS = 'DFNS_WALLET_007',

  // Transaction Errors (4xx)
  TRANSACTION_FAILED = 'DFNS_TX_001',
  INSUFFICIENT_GAS = 'DFNS_TX_002',
  NONCE_TOO_LOW = 'DFNS_TX_003',
  NONCE_TOO_HIGH = 'DFNS_TX_004',
  GAS_PRICE_TOO_LOW = 'DFNS_TX_005',
  TRANSACTION_REVERTED = 'DFNS_TX_006',
  INVALID_RECIPIENT = 'DFNS_TX_007',
  AMOUNT_TOO_SMALL = 'DFNS_TX_008',
  AMOUNT_TOO_LARGE = 'DFNS_TX_009',

  // Network Errors (5xx)
  NETWORK_CONGESTION = 'DFNS_NET_001',
  RPC_ERROR = 'DFNS_NET_002',
  TIMEOUT = 'DFNS_NET_003',
  NETWORK_NOT_SUPPORTED = 'DFNS_NET_004',
  NODE_UNAVAILABLE = 'DFNS_NET_005',

  // Rate Limiting (6xx)
  RATE_LIMIT_EXCEEDED = 'DFNS_RATE_001',
  QUOTA_EXCEEDED = 'DFNS_RATE_002',
  DAILY_LIMIT_REACHED = 'DFNS_RATE_003',

  // API Errors (7xx)
  INVALID_REQUEST = 'DFNS_API_001',
  MALFORMED_DATA = 'DFNS_API_002',
  UNSUPPORTED_OPERATION = 'DFNS_API_003',
  API_VERSION_DEPRECATED = 'DFNS_API_004',
  FEATURE_NOT_AVAILABLE = 'DFNS_API_005',

  // Policy Errors (8xx)
  POLICY_NOT_FOUND = 'DFNS_POLICY_001',
  POLICY_EVALUATION_FAILED = 'DFNS_POLICY_002',
  COMPLIANCE_CHECK_FAILED = 'DFNS_POLICY_003',
  AML_CHECK_FAILED = 'DFNS_POLICY_004',
  SANCTIONS_SCREENING_FAILED = 'DFNS_POLICY_005',

  // Integration Errors (9xx)
  EXCHANGE_ERROR = 'DFNS_INTG_001',
  STAKING_ERROR = 'DFNS_INTG_002',
  WEBHOOK_DELIVERY_FAILED = 'DFNS_INTG_003',
  THIRD_PARTY_SERVICE_ERROR = 'DFNS_INTG_004',

  // Generic Errors (999)
  UNKNOWN_ERROR = 'DFNS_UNKNOWN',
  INTERNAL_SERVER_ERROR = 'DFNS_INTERNAL',
  SERVICE_UNAVAILABLE = 'DFNS_UNAVAILABLE'
}

// ===== Error Classification =====

export enum DfnsErrorCategory {
  AUTHENTICATION = 'Authentication',
  AUTHORIZATION = 'Authorization', 
  WALLET = 'Wallet',
  TRANSACTION = 'Transaction',
  NETWORK = 'Network',
  RATE_LIMITING = 'RateLimit',
  API = 'API',
  POLICY = 'Policy',
  INTEGRATION = 'Integration',
  SYSTEM = 'System'
}

export enum DfnsErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface DfnsErrorMetadata {
  code: DfnsErrorCode;
  category: DfnsErrorCategory;
  severity: DfnsErrorSeverity;
  retryable: boolean;
  userFriendly: boolean;
  suggestedAction: string;
  documentation?: string;
  estimatedResolutionTime?: string;
}

// ===== Error Code Mapping =====

export const DFNS_ERROR_MAPPING: Record<string, DfnsErrorMetadata> = {
  // Authentication Errors
  [DfnsErrorCode.INVALID_CREDENTIALS]: {
    code: DfnsErrorCode.INVALID_CREDENTIALS,
    category: DfnsErrorCategory.AUTHENTICATION,
    severity: DfnsErrorSeverity.HIGH,
    retryable: false,
    userFriendly: true,
    suggestedAction: 'Check your credentials and try logging in again',
    documentation: 'https://docs.dfns.co/authentication'
  },

  [DfnsErrorCode.TOKEN_EXPIRED]: {
    code: DfnsErrorCode.TOKEN_EXPIRED,
    category: DfnsErrorCategory.AUTHENTICATION,
    severity: DfnsErrorSeverity.MEDIUM,
    retryable: true,
    userFriendly: true,
    suggestedAction: 'Your session has expired. Please log in again',
    estimatedResolutionTime: 'immediate'
  },

  [DfnsErrorCode.WEBAUTHN_FAILED]: {
    code: DfnsErrorCode.WEBAUTHN_FAILED,
    category: DfnsErrorCategory.AUTHENTICATION,
    severity: DfnsErrorSeverity.HIGH,
    retryable: true,
    userFriendly: true,
    suggestedAction: 'Biometric authentication failed. Please try again or use an alternative method',
    documentation: 'https://docs.dfns.co/webauthn'
  },

  // Wallet Errors
  [DfnsErrorCode.WALLET_NOT_FOUND]: {
    code: DfnsErrorCode.WALLET_NOT_FOUND,
    category: DfnsErrorCategory.WALLET,
    severity: DfnsErrorSeverity.MEDIUM,
    retryable: false,
    userFriendly: true,
    suggestedAction: 'The specified wallet could not be found. Please check the wallet ID',
    documentation: 'https://docs.dfns.co/wallets'
  },

  [DfnsErrorCode.INSUFFICIENT_BALANCE]: {
    code: DfnsErrorCode.INSUFFICIENT_BALANCE,
    category: DfnsErrorCategory.WALLET,
    severity: DfnsErrorSeverity.MEDIUM,
    retryable: false,
    userFriendly: true,
    suggestedAction: 'Insufficient balance for this transaction. Please add funds or reduce the amount'
  },

  // Transaction Errors
  [DfnsErrorCode.TRANSACTION_FAILED]: {
    code: DfnsErrorCode.TRANSACTION_FAILED,
    category: DfnsErrorCategory.TRANSACTION,
    severity: DfnsErrorSeverity.HIGH,
    retryable: true,
    userFriendly: true,
    suggestedAction: 'Transaction failed. Please check the details and try again',
    estimatedResolutionTime: '1-2 minutes'
  },

  [DfnsErrorCode.INSUFFICIENT_GAS]: {
    code: DfnsErrorCode.INSUFFICIENT_GAS,
    category: DfnsErrorCategory.TRANSACTION,
    severity: DfnsErrorSeverity.MEDIUM,
    retryable: true,
    userFriendly: true,
    suggestedAction: 'Insufficient gas for transaction. Please increase gas limit or price'
  },

  [DfnsErrorCode.NETWORK_CONGESTION]: {
    code: DfnsErrorCode.NETWORK_CONGESTION,
    category: DfnsErrorCategory.NETWORK,
    severity: DfnsErrorSeverity.MEDIUM,
    retryable: true,
    userFriendly: true,
    suggestedAction: 'Network is congested. Please try again in a few minutes',
    estimatedResolutionTime: '5-15 minutes'
  },

  // Rate Limiting
  [DfnsErrorCode.RATE_LIMIT_EXCEEDED]: {
    code: DfnsErrorCode.RATE_LIMIT_EXCEEDED,
    category: DfnsErrorCategory.RATE_LIMITING,
    severity: DfnsErrorSeverity.MEDIUM,
    retryable: true,
    userFriendly: true,
    suggestedAction: 'Rate limit exceeded. Please wait before making more requests',
    estimatedResolutionTime: '1-60 minutes'
  },

  // Policy Errors
  [DfnsErrorCode.POLICY_VIOLATION]: {
    code: DfnsErrorCode.POLICY_VIOLATION,
    category: DfnsErrorCategory.POLICY,
    severity: DfnsErrorSeverity.HIGH,
    retryable: false,
    userFriendly: true,
    suggestedAction: 'This action violates a security policy. Please contact your administrator'
  },

  [DfnsErrorCode.APPROVAL_REQUIRED]: {
    code: DfnsErrorCode.APPROVAL_REQUIRED,
    category: DfnsErrorCategory.AUTHORIZATION,
    severity: DfnsErrorSeverity.MEDIUM,
    retryable: false,
    userFriendly: true,
    suggestedAction: 'This action requires approval. Please wait for approval or contact an administrator'
  }
};

// ===== HTTP Status Code to DFNS Error Mapping =====

export const HTTP_TO_DFNS_ERROR_MAPPING: Record<number, DfnsErrorCode> = {
  400: DfnsErrorCode.INVALID_REQUEST,
  401: DfnsErrorCode.INVALID_CREDENTIALS,
  403: DfnsErrorCode.INSUFFICIENT_PERMISSIONS,
  404: DfnsErrorCode.WALLET_NOT_FOUND,
  409: DfnsErrorCode.POLICY_VIOLATION,
  422: DfnsErrorCode.MALFORMED_DATA,
  429: DfnsErrorCode.RATE_LIMIT_EXCEEDED,
  500: DfnsErrorCode.INTERNAL_SERVER_ERROR,
  502: DfnsErrorCode.SERVICE_UNAVAILABLE,
  503: DfnsErrorCode.SERVICE_UNAVAILABLE,
  504: DfnsErrorCode.TIMEOUT
};

// ===== Error Enhancement Utilities =====

export class DfnsErrorEnhancer {
  /**
   * Enhance a basic error with DFNS-specific metadata
   */
  static enhance(error: any, context?: any): DfnsEnhancedError {
    const dfnsCode = this.mapErrorToDfnsCode(error);
    const metadata = DFNS_ERROR_MAPPING[dfnsCode];

    const enhanced: DfnsEnhancedError = {
      code: dfnsCode,
      message: this.getEnhancedMessage(error, metadata),
      context,
      statusCode: error.status || error.statusCode,
      retryable: metadata?.retryable || this.isRetryableByDefault(error),
      details: {
        originalError: error.message,
        category: metadata?.category,
        severity: metadata?.severity,
        suggestedAction: metadata?.suggestedAction,
        documentation: metadata?.documentation,
        estimatedResolutionTime: metadata?.estimatedResolutionTime,
        userFriendly: metadata?.userFriendly
      }
    };

    return enhanced;
  }

  /**
   * Map error to appropriate DFNS error code
   */
  private static mapErrorToDfnsCode(error: any): DfnsErrorCode {
    // Check if error already has a DFNS code
    if (error.code && Object.values(DfnsErrorCode).includes(error.code)) {
      return error.code as DfnsErrorCode;
    }

    // Map HTTP status codes
    if (error.status || error.statusCode) {
      const statusCode = error.status || error.statusCode;
      return HTTP_TO_DFNS_ERROR_MAPPING[statusCode] || DfnsErrorCode.UNKNOWN_ERROR;
    }

    // Map based on error message patterns
    if (error.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('unauthorized') || message.includes('invalid credentials')) {
        return DfnsErrorCode.INVALID_CREDENTIALS;
      }
      
      if (message.includes('token') && message.includes('expired')) {
        return DfnsErrorCode.TOKEN_EXPIRED;
      }
      
      if (message.includes('insufficient balance')) {
        return DfnsErrorCode.INSUFFICIENT_BALANCE;
      }
      
      if (message.includes('wallet not found')) {
        return DfnsErrorCode.WALLET_NOT_FOUND;
      }
      
      if (message.includes('rate limit')) {
        return DfnsErrorCode.RATE_LIMIT_EXCEEDED;
      }
      
      if (message.includes('timeout')) {
        return DfnsErrorCode.TIMEOUT;
      }
      
      if (message.includes('network') || message.includes('connection')) {
        return DfnsErrorCode.NETWORK_CONGESTION;
      }
    }

    // Default to unknown error
    return DfnsErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Get enhanced error message with user-friendly text
   */
  private static getEnhancedMessage(error: any, metadata?: DfnsErrorMetadata): string {
    if (metadata?.userFriendly && metadata.suggestedAction) {
      return `${error.message || 'An error occurred'}. ${metadata.suggestedAction}`;
    }
    
    return error.message || 'An unknown error occurred';
  }

  /**
   * Determine if error is retryable by default
   */
  private static isRetryableByDefault(error: any): boolean {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const statusCode = error.status || error.statusCode;
    
    if (statusCode && retryableStatusCodes.includes(statusCode)) {
      return true;
    }

    // Network errors are generally retryable
    if (error.name === 'TypeError' || error.name === 'AbortError') {
      return true;
    }

    return false;
  }

  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(error: DfnsEnhancedError, attempt: number): number {
    const metadata = DFNS_ERROR_MAPPING[error.code as DfnsErrorCode];
    
    if (!metadata?.retryable) {
      return 0; // Don't retry non-retryable errors
    }

    // Base delay calculation
    let baseDelay = 1000; // 1 second

    // Adjust based on error category
    switch (metadata.category) {
      case DfnsErrorCategory.RATE_LIMITING:
        baseDelay = 60000; // 1 minute for rate limiting
        break;
      case DfnsErrorCategory.NETWORK:
        baseDelay = 5000; // 5 seconds for network issues
        break;
      case DfnsErrorCategory.AUTHENTICATION:
        baseDelay = 2000; // 2 seconds for auth issues
        break;
      default:
        baseDelay = 1000;
    }

    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    
    return Math.min(exponentialDelay + jitter, 300000); // Cap at 5 minutes
  }

  /**
   * Check if error should be reported to monitoring
   */
  static shouldReport(error: DfnsEnhancedError): boolean {
    const metadata = DFNS_ERROR_MAPPING[error.code as DfnsErrorCode];
    
    // Always report critical and high severity errors
    if (metadata?.severity === DfnsErrorSeverity.CRITICAL || 
        metadata?.severity === DfnsErrorSeverity.HIGH) {
      return true;
    }

    // Report system and API errors
    if (metadata?.category === DfnsErrorCategory.SYSTEM || 
        metadata?.category === DfnsErrorCategory.API) {
      return true;
    }

    // Don't report user errors (authentication, authorization)
    if (metadata?.category === DfnsErrorCategory.AUTHENTICATION || 
        metadata?.category === DfnsErrorCategory.AUTHORIZATION) {
      return false;
    }

    return true;
  }
}

// ===== Error Utilities =====

/**
 * Create a user-friendly error message
 */
export function createUserFriendlyMessage(error: DfnsEnhancedError): string {
  const metadata = DFNS_ERROR_MAPPING[error.code as DfnsErrorCode];
  
  if (metadata?.userFriendly && metadata.suggestedAction) {
    return metadata.suggestedAction;
  }
  
  // Fallback to generic message based on category
  switch (metadata?.category) {
    case DfnsErrorCategory.AUTHENTICATION:
      return 'Authentication failed. Please check your credentials and try again.';
    case DfnsErrorCategory.NETWORK:
      return 'Network connection issue. Please check your internet connection and try again.';
    case DfnsErrorCategory.RATE_LIMITING:
      return 'Too many requests. Please wait a moment and try again.';
    default:
      return 'An unexpected error occurred. Please try again or contact support.';
  }
}

/**
 * Get estimated resolution time for an error
 */
export function getEstimatedResolutionTime(error: DfnsEnhancedError): string {
  const metadata = DFNS_ERROR_MAPPING[error.code as DfnsErrorCode];
  return metadata?.estimatedResolutionTime || 'unknown';
}

/**
 * Check if error represents a temporary issue
 */
export function isTemporaryError(error: DfnsEnhancedError): boolean {
  const temporaryCategories = [
    DfnsErrorCategory.NETWORK,
    DfnsErrorCategory.RATE_LIMITING
  ];
  
  const metadata = DFNS_ERROR_MAPPING[error.code as DfnsErrorCode];
  return metadata ? temporaryCategories.includes(metadata.category) : false;
}

/**
 * Get documentation URL for an error
 */
export function getDocumentationUrl(error: DfnsEnhancedError): string | null {
  const metadata = DFNS_ERROR_MAPPING[error.code as DfnsErrorCode];
  return metadata?.documentation || null;
}

// ===== Export all utilities =====
// All exports are already declared inline above
