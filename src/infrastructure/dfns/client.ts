/**
 * DFNS API Client - Core client for DFNS API communication
 * 
 * This client handles authentication, request/response processing, error handling,
 * and retry logic for all DFNS API interactions.
 */

import type {
  DfnsClientConfig,
  DfnsResponse,
  DfnsError,
  DfnsEnhancedError,
  DfnsErrorContext,
  IdempotencyConfig,
  IdempotentRequest
} from '@/types/dfns';
import { DFNS_CONFIG, getApiUrl, getDefaultHeaders, DEFAULT_CLIENT_CONFIG } from './config';
import { DfnsAuthenticator } from './auth';
import { DfnsErrorEnhancer } from './error-codes';

// ===== Core API Client =====

export class DfnsApiClient {
  private config: DfnsClientConfig;
  private authenticator: DfnsAuthenticator;
  private idempotencyConfig: IdempotencyConfig;
  private idempotentRequests: Map<string, IdempotentRequest> = new Map();

  constructor(config?: Partial<DfnsClientConfig>) {
    this.config = { ...DEFAULT_CLIENT_CONFIG, ...config };
    this.authenticator = new DfnsAuthenticator(this.config);
    
    // Initialize idempotency configuration
    this.idempotencyConfig = {
      enabled: true,
      storagePrefix: 'dfns_idem_',
      ttlMs: 24 * 60 * 60 * 1000, // 24 hours
      autoGenerate: true,
      ...config?.idempotency
    };

    // Load existing idempotent requests from storage
    this.loadIdempotentRequests();
    
    // Clean up expired requests periodically
    this.startCleanupInterval();
  }

  // ===== Idempotency Management =====

  /**
   * Generate a unique idempotency key
   */
  private generateIdempotencyKey(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.idempotencyConfig.storagePrefix}${timestamp}_${random}`;
  }

  /**
   * Create hash of request body for consistency checking
   */
  private async createBodyHash(data: any): Promise<string> {
    if (!data) return 'empty';
    
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store idempotent request
   */
  private async storeIdempotentRequest(
    key: string, 
    method: string, 
    endpoint: string, 
    data: any,
    response?: any,
    status?: number
  ): Promise<void> {
    const bodyHash = await this.createBodyHash(data);
    const request: IdempotentRequest = {
      key,
      method,
      endpoint,
      bodyHash,
      timestamp: Date.now(),
      response,
      status
    };

    this.idempotentRequests.set(key, request);
    this.saveIdempotentRequestToStorage(key, request);
  }

  /**
   * Get stored idempotent request
   */
  private getIdempotentRequest(key: string): IdempotentRequest | null {
    const request = this.idempotentRequests.get(key);
    if (!request) return null;

    // Check if request has expired
    if (Date.now() - request.timestamp > this.idempotencyConfig.ttlMs) {
      this.removeIdempotentRequest(key);
      return null;
    }

    return request;
  }

  /**
   * Validate idempotent request consistency
   */
  private async validateIdempotentRequest(
    key: string,
    method: string,
    endpoint: string,
    data: any
  ): Promise<{ valid: boolean; stored?: IdempotentRequest; error?: string }> {
    const stored = this.getIdempotentRequest(key);
    if (!stored) return { valid: true };

    const bodyHash = await this.createBodyHash(data);
    
    if (stored.method !== method || stored.endpoint !== endpoint || stored.bodyHash !== bodyHash) {
      return { 
        valid: false, 
        stored,
        error: 'Idempotency key reused with different request parameters'
      };
    }

    return { valid: true, stored };
  }

  /**
   * Remove idempotent request
   */
  private removeIdempotentRequest(key: string): void {
    this.idempotentRequests.delete(key);
    this.removeIdempotentRequestFromStorage(key);
  }

  /**
   * Load idempotent requests from browser storage
   */
  private loadIdempotentRequests(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
      const keys = Object.keys(sessionStorage).filter(key => 
        key.startsWith(this.idempotencyConfig.storagePrefix)
      );

      for (const storageKey of keys) {
        const data = sessionStorage.getItem(storageKey);
        if (data) {
          const request: IdempotentRequest = JSON.parse(data);
          const key = storageKey.replace(this.idempotencyConfig.storagePrefix, '');
          
          // Check if request has expired
          if (Date.now() - request.timestamp <= this.idempotencyConfig.ttlMs) {
            this.idempotentRequests.set(key, request);
          } else {
            sessionStorage.removeItem(storageKey);
          }
        }
      }
    } catch (error) {
      console.warn('[DFNS Idempotency] Failed to load stored requests:', error);
    }
  }

  /**
   * Save idempotent request to browser storage
   */
  private saveIdempotentRequestToStorage(key: string, request: IdempotentRequest): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
      const storageKey = `${this.idempotencyConfig.storagePrefix}${key}`;
      sessionStorage.setItem(storageKey, JSON.stringify(request));
    } catch (error) {
      console.warn('[DFNS Idempotency] Failed to save request to storage:', error);
    }
  }

  /**
   * Remove idempotent request from browser storage
   */
  private removeIdempotentRequestFromStorage(key: string): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
      const storageKey = `${this.idempotencyConfig.storagePrefix}${key}`;
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('[DFNS Idempotency] Failed to remove request from storage:', error);
    }
  }

  /**
   * Start cleanup interval for expired requests
   */
  private startCleanupInterval(): void {
    if (typeof window === 'undefined') return;

    // Clean up every 30 minutes
    setInterval(() => {
      this.cleanupExpiredRequests();
    }, 30 * 60 * 1000);
  }

  /**
   * Clean up expired idempotent requests
   */
  private cleanupExpiredRequests(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, request] of this.idempotentRequests.entries()) {
      if (now - request.timestamp > this.idempotencyConfig.ttlMs) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.removeIdempotentRequest(key);
    }
  }

  // ===== HTTP Methods =====

  /**
   * Make a GET request
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options?: RequestOptions
  ): Promise<DfnsResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, params, options);
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<DfnsResponse<T>> {
    return this.request<T>('POST', endpoint, data, undefined, options);
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<DfnsResponse<T>> {
    return this.request<T>('PUT', endpoint, data, undefined, options);
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<DfnsResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, undefined, options);
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<DfnsResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, undefined, options);
  }

  // ===== Core Request Method =====

  /**
   * Core request method with retry logic, error handling, and idempotency
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, any>,
    options: RequestOptions = {}
  ): Promise<DfnsResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Handle idempotency for mutating requests
    const isMutatingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
    const shouldUseIdempotency = this.idempotencyConfig.enabled && 
                                isMutatingRequest && 
                                !options.skipIdempotency;

    let idempotencyKey: string | undefined;
    
    if (shouldUseIdempotency) {
      // Use provided key or generate one
      idempotencyKey = options.idempotencyKey || 
                      (this.idempotencyConfig.autoGenerate ? this.generateIdempotencyKey() : undefined);
      
      if (idempotencyKey) {
        // Check if we have a stored response for this idempotency key
        const validation = await this.validateIdempotentRequest(
          idempotencyKey, 
          method, 
          endpoint, 
          data
        );

        if (!validation.valid) {
          throw new Error(`Idempotency key conflict: ${validation.error}`);
        }

        if (validation.stored?.response) {
          // Return cached response
          this.logIdempotencyHit(requestId, idempotencyKey, validation.stored);
          return validation.stored.response;
        }

        // Store the request (without response yet)
        await this.storeIdempotentRequest(idempotencyKey, method, endpoint, data);
      }
    }

    try {
      // Build URL with query parameters
      const url = this.buildUrl(endpoint, params);
      
      // Prepare headers (including idempotency key)
      const headers = await this.prepareHeaders(method, endpoint, data, options, idempotencyKey);
      
      // Log request if enabled
      this.logRequest(requestId, method, url, headers, data);

      // Make request with retries
      const response = await this.makeRequestWithRetry(
        method,
        url,
        headers,
        data,
        options,
        requestId
      );

      // Process response
      const result = await this.processResponse<T>(response, requestId);
      
      // Store successful response for idempotency
      if (shouldUseIdempotency && idempotencyKey && result.kind === 'success') {
        await this.storeIdempotentRequest(
          idempotencyKey, 
          method, 
          endpoint, 
          data, 
          result, 
          response.status
        );
      }
      
      // Log successful response
      const duration = Date.now() - startTime;
      this.logResponse(requestId, response.status, duration, result);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const enhancedError = this.enhanceError(error, {
        endpoint,
        method,
        requestId,
        timestamp: new Date().toISOString(),
        userAgent: navigator?.userAgent,
        idempotencyKey
      });

      this.logError(requestId, enhancedError, duration);
      throw enhancedError;
    }
  }

  // ===== Request Building =====

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const baseUrl = getApiUrl(endpoint);
    
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }

  /**
   * Prepare request headers with authentication and idempotency
   */
  private async prepareHeaders(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestOptions = {},
    idempotencyKey?: string
  ): Promise<Headers> {
    const headers = new Headers(getDefaultHeaders());

    // Add idempotency key header for mutating requests
    if (idempotencyKey) {
      headers.set('Idempotency-Key', idempotencyKey);
    }

    // Add custom headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    // Add authentication headers
    const authHeaders = await this.authenticator.getAuthHeaders(method, endpoint, data);
    Object.entries(authHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return headers;
  }

  // ===== Request Execution =====

  /**
   * Make request with retry logic
   */
  private async makeRequestWithRetry(
    method: string,
    url: string,
    headers: Headers,
    data?: any,
    options: RequestOptions = {},
    requestId?: string
  ): Promise<Response> {
    const { retryConfig } = this.config;
    let lastError: Error | null = null;

    const maxAttempts = retryConfig?.enabled ? (retryConfig.maxAttempts || 3) : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = options.timeout || this.config.timeout || 30000;

        // Set timeout
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal
        };

        // Add body for non-GET requests
        if (data && method !== 'GET') {
          requestOptions.body = JSON.stringify(data);
        }

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Check if response indicates we should retry
        if (this.shouldRetry(response, attempt, maxAttempts)) {
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          await this.delay(this.getRetryDelay(attempt, lastError));
          continue;
        }

        return response;

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (!this.shouldRetryOnError(error as Error, attempt, maxAttempts)) {
          throw error;
        }

        if (attempt < maxAttempts) {
          await this.delay(this.getRetryDelay(attempt, lastError));
        }
      }
    }

    throw lastError || new Error('Max retry attempts exceeded');
  }

  /**
   * Check if response indicates retry is needed
   */
  private shouldRetry(response: Response, attempt: number, maxAttempts: number): boolean {
    if (attempt >= maxAttempts) return false;
    
    // Retry on server errors (5xx) and rate limiting (429)
    return response.status >= 500 || response.status === 429;
  }

  /**
   * Check if error indicates retry is appropriate
   */
  private shouldRetryOnError(error: Error, attempt: number, maxAttempts: number): boolean {
    if (attempt >= maxAttempts) return false;
    
    // Retry on network errors, timeouts, but not on auth errors
    return error.name === 'TypeError' || error.name === 'AbortError';
  }

  /**
   * Calculate retry delay with enhanced error-aware backoff
   */
  private getRetryDelay(attempt: number, error?: any): number {
    // If we have an enhanced error, use its specific retry delay
    if (error && error.code) {
      const enhancedError = DfnsErrorEnhancer.enhance(error);
      const errorDelay = DfnsErrorEnhancer.getRetryDelay(enhancedError, attempt);
      if (errorDelay > 0) {
        return errorDelay;
      }
    }

    // Fallback to default retry configuration
    const { retryConfig } = this.config;
    if (!retryConfig) return 1000;

    const baseDelay = 1000;
    const backoffFactor = retryConfig.backoffFactor || 2;
    const maxDelay = retryConfig.maxDelay || 10000;

    const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Delay execution
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== Response Processing =====

  /**
   * Process API response
   */
  private async processResponse<T>(response: Response, requestId?: string): Promise<DfnsResponse<T>> {
    const contentType = response.headers.get('content-type') || '';
    
    try {
      // Handle different content types
      let responseData: any;
      
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType.includes('text/')) {
        responseData = await response.text();
      } else {
        responseData = await response.blob();
      }

      // Handle HTTP errors
      if (!response.ok) {
        const error: DfnsError = {
          code: `HTTP_${response.status}`,
          message: responseData?.message || response.statusText,
          details: responseData
        };

        return {
          kind: 'error',
          error
        };
      }

      // Handle DFNS API error responses
      if (responseData && responseData.kind === 'error') {
        return responseData as DfnsResponse<T>;
      }

      // Return successful response
      return {
        kind: 'success',
        data: responseData
      };

    } catch (error) {
      const dfnsError: DfnsError = {
        code: 'RESPONSE_PARSE_ERROR',
        message: 'Failed to parse response',
        details: { originalError: (error as Error).message }
      };

      return {
        kind: 'error',
        error: dfnsError
      };
    }
  }

  // ===== Error Handling =====

  /**
   * Enhance error with additional context and DFNS-specific metadata
   */
  private enhanceError(error: any, context: DfnsErrorContext): DfnsEnhancedError {
    // Use the enhanced error system
    const enhanced = DfnsErrorEnhancer.enhance(error, context);
    
    // Add additional context
    enhanced.context = context;
    
    return enhanced;
  }

  /**
   * Check if error is retryable using enhanced error system
   */
  private isRetryableError(error: any): boolean {
    // If it's already an enhanced error, use its retryable flag
    if (error.retryable !== undefined) {
      return error.retryable;
    }

    // Use the enhanced error system for classification
    const enhanced = DfnsErrorEnhancer.enhance(error);
    return enhanced.retryable || false;
  }

  // ===== Logging =====

  /**
   * Log idempotency cache hit
   */
  private logIdempotencyHit(
    requestId: string,
    idempotencyKey: string,
    stored: IdempotentRequest
  ): void {
    if (!this.config.logging?.enabled) return;

    console.log('[DFNS Idempotency Hit]', {
      requestId,
      idempotencyKey,
      originalTimestamp: new Date(stored.timestamp).toISOString(),
      cacheAge: `${Date.now() - stored.timestamp}ms`,
      method: stored.method,
      endpoint: stored.endpoint
    });
  }

  /**
   * Log outgoing request
   */
  private logRequest(
    requestId: string,
    method: string,
    url: string,
    headers: Headers,
    data?: any
  ): void {
    if (!this.config.logging?.enabled) return;

    const logData: any = {
      requestId,
      method,
      url,
      timestamp: new Date().toISOString()
    };

    if (this.config.logging.includeRequestBody && data) {
      logData.body = data;
    }

    console.log('[DFNS Request]', logData);
  }

  /**
   * Log successful response
   */
  private logResponse(
    requestId: string,
    status: number,
    duration: number,
    response?: any
  ): void {
    if (!this.config.logging?.enabled) return;

    const logData: any = {
      requestId,
      status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    if (this.config.logging.includeResponseBody && response) {
      logData.response = response;
    }

    console.log('[DFNS Response]', logData);
  }

  /**
   * Log error
   */
  private logError(
    requestId: string,
    error: DfnsEnhancedError,
    duration: number
  ): void {
    if (!this.config.logging?.enabled) return;

    console.error('[DFNS Error]', {
      requestId,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        retryable: error.retryable
      },
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }

  // ===== Utility Methods =====

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `dfns_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client configuration
   */
  getConfig(): DfnsClientConfig {
    return { ...this.config };
  }

  /**
   * Update client configuration
   */
  updateConfig(updates: Partial<DfnsClientConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Check if client is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.appId && this.config.baseUrl);
  }
}

// ===== Request Options Interface =====

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  skipAuth?: boolean;
  retries?: number;
  idempotencyKey?: string; // Custom idempotency key
  skipIdempotency?: boolean; // Skip idempotency for this request
}

// ===== Default Export =====

export default DfnsApiClient;
