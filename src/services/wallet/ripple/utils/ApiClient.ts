/**
 * Base API client for Ripple services
 * Provides common functionality for HTTP requests, authentication, and error handling
 */

import type { 
  RippleApiResponse, 
  ServiceResult, 
  RippleEnvironment,
  StoredRippleToken
} from '../types';
import { 
  getRippleConfig, 
  buildApiUrl, 
  getEnvironmentTimeouts,
  getEnvironmentFeatures 
} from '../config';
import { RippleErrorHandler } from './ErrorHandler';

export interface ApiClientConfig {
  environment?: RippleEnvironment;
  timeout?: number;
  retries?: number;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  requiresAuth?: boolean;
}

export class RippleApiClient {
  private config: Required<ApiClientConfig>;
  private tokenProvider?: () => Promise<StoredRippleToken | null>;

  constructor(
    config: ApiClientConfig = {},
    tokenProvider?: () => Promise<StoredRippleToken | null>
  ) {
    const envConfig = getRippleConfig(config.environment);
    const timeouts = getEnvironmentTimeouts(config.environment);
    
    this.config = {
      environment: config.environment || 'test',
      timeout: config.timeout || timeouts.apiTimeout,
      retries: config.retries || 3,
      baseUrl: config.baseUrl || envConfig.apiV4BaseUrl,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Chain-Capital-Ripple-Client/1.0',
        ...config.defaultHeaders
      }
    };

    this.tokenProvider = tokenProvider;
  }

  /**
   * Make an authenticated API request
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ServiceResult<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.config.timeout,
      retries = this.config.retries,
      requiresAuth = true
    } = config;

    let lastError: any;

    // Retry logic
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.makeRequest<T>(
          endpoint,
          {
            method,
            headers: {
              ...this.config.defaultHeaders,
              ...headers,
              ...(requiresAuth ? await this.getAuthHeaders() : {})
            },
            body,
            timeout
          }
        );

        return RippleErrorHandler.createSuccessResult(response);
      } catch (error) {
        lastError = error;
        
        const serviceError = RippleErrorHandler.parseApiError(error);
        
        // Log error for debugging
        if (this.shouldLogError(serviceError, attempt)) {
          RippleErrorHandler.logError(serviceError, `Attempt ${attempt}/${retries}`);
        }

        // Don't retry if error is not retryable or it's the last attempt
        if (!RippleErrorHandler.isRetryable(serviceError) || attempt === retries) {
          break;
        }

        // Wait before retrying
        const delay = RippleErrorHandler.getRetryDelay(serviceError, attempt);
        await this.sleep(delay);
      }
    }

    return RippleErrorHandler.createFailureResult(lastError);
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    endpoint: string,
    queryParams?: Record<string, any>,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ServiceResult<T>> {
    const url = this.buildUrl(endpoint, queryParams);
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<ServiceResult<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<ServiceResult<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<ServiceResult<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ServiceResult<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest<T>(
    endpoint: string,
    config: {
      method: string;
      headers: Record<string, string>;
      body?: string;
      timeout: number;
    }
  ): Promise<T> {
    const url = this.buildFullUrl(endpoint);
    const controller = new AbortController();
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeout);

    try {
      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          }
        };
      }

      // Parse successful response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      
      // Handle non-JSON responses (e.g., file downloads)
      return await response.text() as unknown as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort/timeout
      if (error.name === 'AbortError') {
        throw { code: 'TIMEOUT', name: 'TimeoutError' };
      }
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw { code: 'NETWORK_ERROR', name: 'NetworkError' };
      }
      
      throw error;
    }
  }

  /**
   * Parse error response body
   */
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      return { error: 'unknown_error', error_description: await response.text() };
    } catch {
      return { error: 'parse_error', error_description: 'Failed to parse error response' };
    }
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.tokenProvider) {
      return {};
    }

    const token = await this.tokenProvider();
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Check if token is expired
    if (new Date() >= token.expiresAt) {
      throw new Error('Authentication token has expired');
    }

    return {
      'Authorization': `${token.tokenType} ${token.accessToken}`
    };
  }

  /**
   * Build full URL with base URL
   */
  private buildFullUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    const baseUrl = this.config.baseUrl.endsWith('/') 
      ? this.config.baseUrl.slice(0, -1) 
      : this.config.baseUrl;
    
    const normalizedEndpoint = endpoint.startsWith('/') 
      ? endpoint 
      : `/${endpoint}`;

    return `${baseUrl}${normalizedEndpoint}`;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, queryParams?: Record<string, any>): string {
    if (!queryParams) {
      return endpoint;
    }

    const url = new URL(endpoint, 'http://localhost'); // Base URL for parsing
    
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return `${url.pathname}${url.search}`;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Determine if error should be logged
   */
  private shouldLogError(error: any, attempt: number): boolean {
    const features = getEnvironmentFeatures(this.config.environment);
    
    // Always log in debug mode
    if (features.debugMode) {
      return true;
    }

    // Log on final attempt
    if (attempt === this.config.retries) {
      return true;
    }

    // Log critical errors immediately
    return ['authentication', 'authorization', 'server'].includes(error.category);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Set token provider
   */
  setTokenProvider(provider: () => Promise<StoredRippleToken | null>): void {
    this.tokenProvider = provider;
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }
}

// Factory function for creating API clients
export const createRippleApiClient = (
  config?: ApiClientConfig,
  tokenProvider?: () => Promise<StoredRippleToken | null>
): RippleApiClient => {
  return new RippleApiClient(config, tokenProvider);
};
