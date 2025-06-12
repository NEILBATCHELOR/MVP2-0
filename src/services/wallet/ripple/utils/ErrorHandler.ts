/**
 * Comprehensive error handling for Ripple API services
 * Provides consistent error processing and categorization
 */

import type { 
  RippleApiError, 
  ServiceError, 
  ErrorCategory,
  ServiceResult 
} from '../types';

// Standard Ripple API error codes
export const RIPPLE_ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'invalid_credentials',
  TOKEN_EXPIRED: 'token_expired',
  INSUFFICIENT_SCOPE: 'insufficient_scope',
  RATE_LIMITED: 'rate_limited',
  
  // Payment errors
  PAYMENT_NOT_FOUND: 'payment_not_found',
  PAYMENT_EXPIRED: 'payment_expired',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  INVALID_RECIPIENT: 'invalid_recipient',
  COMPLIANCE_FAILED: 'compliance_failed',
  
  // Quote errors
  QUOTE_EXPIRED: 'quote_expired',
  QUOTE_NOT_FOUND: 'quote_not_found',
  UNSUPPORTED_CORRIDOR: 'unsupported_corridor',
  
  // Network errors
  NETWORK_ERROR: 'network_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  TIMEOUT: 'timeout',
  
  // Validation errors
  INVALID_PARAMETER: 'invalid_parameter',
  MISSING_PARAMETER: 'missing_parameter',
  INVALID_FORMAT: 'invalid_format',
  
  // Business logic errors
  DUPLICATE_TRANSACTION: 'duplicate_transaction',
  BUSINESS_RULE_VIOLATION: 'business_rule_violation',
  REGULATORY_RESTRICTION: 'regulatory_restriction'
} as const;

// Error categorization mapping
const ERROR_CATEGORY_MAP: Record<string, ErrorCategory> = {
  // Authentication category
  [RIPPLE_ERROR_CODES.INVALID_CREDENTIALS]: 'authentication',
  [RIPPLE_ERROR_CODES.TOKEN_EXPIRED]: 'authentication',
  [RIPPLE_ERROR_CODES.INSUFFICIENT_SCOPE]: 'authorization',
  
  // Rate limiting
  [RIPPLE_ERROR_CODES.RATE_LIMITED]: 'rate_limit',
  
  // Network category
  [RIPPLE_ERROR_CODES.NETWORK_ERROR]: 'network',
  [RIPPLE_ERROR_CODES.SERVICE_UNAVAILABLE]: 'server',
  [RIPPLE_ERROR_CODES.TIMEOUT]: 'network',
  
  // Validation category
  [RIPPLE_ERROR_CODES.INVALID_PARAMETER]: 'validation',
  [RIPPLE_ERROR_CODES.MISSING_PARAMETER]: 'validation',
  [RIPPLE_ERROR_CODES.INVALID_FORMAT]: 'validation',
  
  // Business logic category
  [RIPPLE_ERROR_CODES.PAYMENT_NOT_FOUND]: 'business_logic',
  [RIPPLE_ERROR_CODES.PAYMENT_EXPIRED]: 'business_logic',
  [RIPPLE_ERROR_CODES.INSUFFICIENT_FUNDS]: 'business_logic',
  [RIPPLE_ERROR_CODES.COMPLIANCE_FAILED]: 'business_logic',
  [RIPPLE_ERROR_CODES.DUPLICATE_TRANSACTION]: 'business_logic',
  [RIPPLE_ERROR_CODES.BUSINESS_RULE_VIOLATION]: 'business_logic',
  [RIPPLE_ERROR_CODES.REGULATORY_RESTRICTION]: 'business_logic'
};

// Retryable error codes
const RETRYABLE_ERRORS = new Set<string>([
  RIPPLE_ERROR_CODES.NETWORK_ERROR,
  RIPPLE_ERROR_CODES.SERVICE_UNAVAILABLE,
  RIPPLE_ERROR_CODES.TIMEOUT,
  RIPPLE_ERROR_CODES.RATE_LIMITED
]);

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  [RIPPLE_ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid API credentials. Please check your client ID and secret.',
  [RIPPLE_ERROR_CODES.TOKEN_EXPIRED]: 'Access token has expired. Please authenticate again.',
  [RIPPLE_ERROR_CODES.INSUFFICIENT_SCOPE]: 'Insufficient permissions for this operation.',
  [RIPPLE_ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait before trying again.',
  [RIPPLE_ERROR_CODES.PAYMENT_NOT_FOUND]: 'Payment not found.',
  [RIPPLE_ERROR_CODES.PAYMENT_EXPIRED]: 'Payment has expired.',
  [RIPPLE_ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds for this transaction.',
  [RIPPLE_ERROR_CODES.INVALID_RECIPIENT]: 'Invalid recipient address or details.',
  [RIPPLE_ERROR_CODES.COMPLIANCE_FAILED]: 'Transaction failed compliance checks.',
  [RIPPLE_ERROR_CODES.QUOTE_EXPIRED]: 'Quote has expired. Please request a new quote.',
  [RIPPLE_ERROR_CODES.QUOTE_NOT_FOUND]: 'Quote not found.',
  [RIPPLE_ERROR_CODES.UNSUPPORTED_CORRIDOR]: 'This payment corridor is not supported.',
  [RIPPLE_ERROR_CODES.NETWORK_ERROR]: 'Network connection error. Please try again.',
  [RIPPLE_ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable.',
  [RIPPLE_ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again.',
  [RIPPLE_ERROR_CODES.INVALID_PARAMETER]: 'Invalid parameter provided.',
  [RIPPLE_ERROR_CODES.MISSING_PARAMETER]: 'Required parameter is missing.',
  [RIPPLE_ERROR_CODES.INVALID_FORMAT]: 'Invalid data format.',
  [RIPPLE_ERROR_CODES.DUPLICATE_TRANSACTION]: 'Duplicate transaction detected.',
  [RIPPLE_ERROR_CODES.BUSINESS_RULE_VIOLATION]: 'Transaction violates business rules.',
  [RIPPLE_ERROR_CODES.REGULATORY_RESTRICTION]: 'Transaction restricted by regulations.'
};

export class RippleErrorHandler {
  /**
   * Create a ServiceError from an API error response
   */
  static createServiceError(
    code: string,
    message?: string,
    details?: any
  ): ServiceError {
    const category = ERROR_CATEGORY_MAP[code] || 'server';
    const retryable = RETRYABLE_ERRORS.has(code);
    const userMessage = ERROR_MESSAGES[code] || message || 'An unexpected error occurred';

    return {
      code,
      message: userMessage,
      details,
      retryable,
      category
    };
  }

  /**
   * Parse API error response into ServiceError
   */
  static parseApiError(error: any): ServiceError {
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
      return this.createServiceError(
        RIPPLE_ERROR_CODES.NETWORK_ERROR,
        'Network connection failed',
        error
      );
    }

    // Handle timeout errors
    if (error.code === 'TIMEOUT' || error.name === 'TimeoutError') {
      return this.createServiceError(
        RIPPLE_ERROR_CODES.TIMEOUT,
        'Request timed out',
        error
      );
    }

    // Handle API response errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle specific HTTP status codes
      switch (status) {
        case 401:
          return this.createServiceError(
            RIPPLE_ERROR_CODES.INVALID_CREDENTIALS,
            data?.error_description || 'Authentication failed',
            data
          );
        
        case 403:
          return this.createServiceError(
            RIPPLE_ERROR_CODES.INSUFFICIENT_SCOPE,
            data?.error_description || 'Access forbidden',
            data
          );
        
        case 429:
          return this.createServiceError(
            RIPPLE_ERROR_CODES.RATE_LIMITED,
            data?.error_description || 'Rate limit exceeded',
            data
          );
        
        case 404:
          return this.createServiceError(
            data?.error || 'not_found',
            data?.error_description || 'Resource not found',
            data
          );
        
        case 400:
          return this.createServiceError(
            data?.error || RIPPLE_ERROR_CODES.INVALID_PARAMETER,
            data?.error_description || 'Bad request',
            data
          );
        
        case 500:
        case 502:
        case 503:
        case 504:
          return this.createServiceError(
            RIPPLE_ERROR_CODES.SERVICE_UNAVAILABLE,
            'Service temporarily unavailable',
            data
          );
        
        default:
          return this.createServiceError(
            data?.error || 'unknown_error',
            data?.error_description || `HTTP ${status} error`,
            data
          );
      }
    }

    // Handle Ripple API specific errors
    if (error.error) {
      return this.createServiceError(
        error.error,
        error.error_description || error.message,
        error
      );
    }

    // Handle generic errors
    return this.createServiceError(
      'unknown_error',
      error.message || 'An unexpected error occurred',
      error
    );
  }

  /**
   * Create a failed ServiceResult from an error
   */
  static createFailureResult<T>(error: any): ServiceResult<T> {
    const serviceError = this.parseApiError(error);
    
    return {
      success: false,
      error: serviceError
    };
  }

  /**
   * Create a successful ServiceResult
   */
  static createSuccessResult<T>(data: T, metadata?: Record<string, any>): ServiceResult<T> {
    return {
      success: true,
      data,
      metadata
    };
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: ServiceError): boolean {
    return error.retryable;
  }

  /**
   * Get retry delay based on error type and attempt count
   */
  static getRetryDelay(error: ServiceError, attemptCount: number): number {
    // Rate limiting: exponential backoff starting from 1 second
    if (error.code === RIPPLE_ERROR_CODES.RATE_LIMITED) {
      return Math.min(1000 * Math.pow(2, attemptCount), 30000); // Max 30 seconds
    }

    // Network errors: linear backoff
    if (error.category === 'network' || error.category === 'rate_limit') {
      return Math.min(2000 * attemptCount, 15000); // Max 15 seconds
    }

    // Server errors: exponential backoff
    if (error.category === 'server') {
      return Math.min(500 * Math.pow(2, attemptCount), 10000); // Max 10 seconds
    }

    return 1000; // Default 1 second
  }

  /**
   * Log error with appropriate level based on category
   */
  static logError(error: ServiceError, context?: string): void {
    const logMessage = `[Ripple ${context || 'API'}] ${error.code}: ${error.message}`;
    
    switch (error.category) {
      case 'authentication':
      case 'authorization':
        console.warn(logMessage, error.details);
        break;
      
      case 'validation':
        console.info(logMessage, error.details);
        break;
      
      case 'network':
      case 'server':
      case 'rate_limit':
        console.error(logMessage, error.details);
        break;
      
      default:
        console.error(logMessage, error.details);
    }
  }

  /**
   * Create user-friendly error message for UI display
   */
  static createUserMessage(error: ServiceError): string {
    // Return the user-friendly message if available
    if (ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }

    // Fallback to generic messages based on category
    switch (error.category) {
      case 'authentication':
        return 'Authentication failed. Please check your credentials.';
      
      case 'authorization':
        return 'You do not have permission to perform this action.';
      
      case 'validation':
        return 'The provided information is invalid. Please check and try again.';
      
      case 'network':
        return 'Network connection error. Please check your internet connection and try again.';
      
      case 'rate_limit':
        return 'Too many requests. Please wait a moment before trying again.';
      
      case 'server':
        return 'Service temporarily unavailable. Please try again later.';
      
      case 'business_logic':
        return error.message || 'This action cannot be completed at this time.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

// Export error handling utilities
export const handleRippleError = RippleErrorHandler.parseApiError;
export const createFailureResult = RippleErrorHandler.createFailureResult;
export const createSuccessResult = RippleErrorHandler.createSuccessResult;
export const isRetryableError = RippleErrorHandler.isRetryable;
export const getRetryDelay = RippleErrorHandler.getRetryDelay;
export const createUserErrorMessage = RippleErrorHandler.createUserMessage;
