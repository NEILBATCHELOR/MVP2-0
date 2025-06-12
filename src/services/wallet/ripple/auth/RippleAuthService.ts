/**
 * Ripple OAuth2 Authentication Service
 * Handles client credentials flow for Ripple Payments Direct API v4
 */

import type { 
  RippleAuthConfig,
  RippleTokenRequest,
  RippleTokenResponse,
  RippleTokenIntrospection,
  StoredRippleToken,
  RippleEnvironment,
  ServiceResult
} from '../types';
import { 
  buildAuthUrl, 
  buildAudience, 
  getEnvironmentVariables,
  getEnvironmentTimeouts 
} from '../config';
import { createRippleApiClient, RippleApiClient } from '../utils/ApiClient';
import { RippleErrorHandler } from '../utils/ErrorHandler';

export class RippleAuthService {
  private config: RippleAuthConfig;
  private apiClient: RippleApiClient;
  private currentToken: StoredRippleToken | null = null;
  private tokenRefreshPromise: Promise<StoredRippleToken | null> | null = null;

  constructor(config?: Partial<RippleAuthConfig>) {
    const envVars = getEnvironmentVariables();
    
    this.config = {
      clientId: config?.clientId || envVars.clientId,
      clientSecret: config?.clientSecret || envVars.clientSecret,
      tenantId: config?.tenantId || envVars.tenantId,
      environment: config?.environment || envVars.environment,
      authBaseUrl: buildAuthUrl('', config?.environment)
    };

    // Validate required configuration
    this.validateConfig();

    // Create API client for auth requests (no token required)
    this.apiClient = createRippleApiClient({
      environment: this.config.environment,
      baseUrl: this.config.authBaseUrl,
      timeout: getEnvironmentTimeouts(this.config.environment).authTimeout
    });
  }

  /**
   * Get current access token, refreshing if necessary
   */
  async getAccessToken(): Promise<StoredRippleToken | null> {
    // Return current token if valid
    if (this.currentToken && this.isTokenValid(this.currentToken)) {
      return this.currentToken;
    }

    // If already refreshing, wait for that promise
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    // Start token refresh
    this.tokenRefreshPromise = this.refreshToken();
    
    try {
      const token = await this.tokenRefreshPromise;
      return token;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  /**
   * Request a new access token using client credentials flow
   */
  async requestToken(): Promise<ServiceResult<StoredRippleToken>> {
    try {
      const tokenRequest: RippleTokenRequest = {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        audience: buildAudience(this.config.tenantId, this.config.environment)
      };

      const result = await this.apiClient.post<RippleTokenResponse>(
        '/oauth/token',
        tokenRequest,
        { requiresAuth: false }
      );

      if (!result.success || !result.data) {
        return RippleErrorHandler.createFailureResult(
          result.error || new Error('Failed to get token response')
        );
      }

      const tokenResponse = result.data;
      const storedToken = this.createStoredToken(tokenResponse);
      
      // Cache the token
      this.currentToken = storedToken;

      return RippleErrorHandler.createSuccessResult(storedToken);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Introspect an access token to check validity and get metadata
   */
  async introspectToken(token?: string): Promise<ServiceResult<RippleTokenIntrospection>> {
    const accessToken = token || this.currentToken?.accessToken;
    
    if (!accessToken) {
      return RippleErrorHandler.createFailureResult(
        new Error('No access token available for introspection')
      );
    }

    try {
      const result = await this.apiClient.post<RippleTokenIntrospection>(
        '/oauth/introspect',
        { token: accessToken },
        { requiresAuth: false }
      );

      return result;
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Revoke the current access token
   */
  async revokeToken(token?: string): Promise<ServiceResult<void>> {
    const accessToken = token || this.currentToken?.accessToken;
    
    if (!accessToken) {
      return RippleErrorHandler.createSuccessResult(undefined);
    }

    try {
      // Note: Ripple may not have a revoke endpoint, but we clear our token
      this.currentToken = null;
      
      return RippleErrorHandler.createSuccessResult(undefined);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Check if the current token is valid and not expired
   */
  isAuthenticated(): boolean {
    return this.currentToken !== null && this.isTokenValid(this.currentToken);
  }

  /**
   * Get token provider function for use with API clients
   */
  getTokenProvider(): () => Promise<StoredRippleToken | null> {
    return () => this.getAccessToken();
  }

  /**
   * Clear cached token (force re-authentication)
   */
  clearToken(): void {
    this.currentToken = null;
    this.tokenRefreshPromise = null;
  }

  /**
   * Get current token information (without sensitive data)
   */
  getTokenInfo(): {
    isAuthenticated: boolean;
    expiresAt?: Date;
    scope?: string;
    timeUntilExpiry?: number;
  } {
    if (!this.currentToken) {
      return { isAuthenticated: false };
    }

    const timeUntilExpiry = this.currentToken.expiresAt.getTime() - Date.now();

    return {
      isAuthenticated: this.isTokenValid(this.currentToken),
      expiresAt: this.currentToken.expiresAt,
      scope: this.currentToken.scope,
      timeUntilExpiry: Math.max(0, timeUntilExpiry)
    };
  }

  /**
   * Update authentication configuration
   */
  updateConfig(newConfig: Partial<RippleAuthConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateConfig();
    
    // Clear token if credentials changed
    if (newConfig.clientId || newConfig.clientSecret || newConfig.tenantId) {
      this.clearToken();
    }
  }

  // Private methods

  /**
   * Refresh the current token
   */
  private async refreshToken(): Promise<StoredRippleToken | null> {
    const result = await this.requestToken();
    
    if (result.success && result.data) {
      return result.data;
    }

    // Log error but don't throw
    if (result.error) {
      RippleErrorHandler.logError(result.error, 'Token Refresh');
    }

    return null;
  }

  /**
   * Check if a token is valid and not expired
   */
  private isTokenValid(token: StoredRippleToken): boolean {
    const now = new Date();
    const bufferTime = 60000; // 1 minute buffer before expiry
    
    return token.expiresAt.getTime() > now.getTime() + bufferTime;
  }

  /**
   * Create a StoredRippleToken from the API response
   */
  private createStoredToken(response: RippleTokenResponse): StoredRippleToken {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (response.expires_in * 1000));

    return {
      accessToken: response.access_token,
      tokenType: response.token_type,
      expiresAt,
      scope: response.scope,
      createdAt: now
    };
  }

  /**
   * Validate authentication configuration
   */
  private validateConfig(): void {
    const required = ['clientId', 'clientSecret', 'tenantId'];
    const missing = required.filter(key => !this.config[key as keyof RippleAuthConfig]);
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required authentication configuration: ${missing.join(', ')}`
      );
    }
  }
}

// Factory function for creating auth service
export const createRippleAuthService = (
  config?: Partial<RippleAuthConfig>
): RippleAuthService => {
  return new RippleAuthService(config);
};

// Singleton instance for default usage
let defaultAuthService: RippleAuthService | null = null;

/**
 * Get the default authentication service instance
 */
export const getDefaultAuthService = (): RippleAuthService => {
  if (!defaultAuthService) {
    defaultAuthService = new RippleAuthService();
  }
  return defaultAuthService;
};

/**
 * Initialize authentication with custom config
 */
export const initializeAuth = (config: Partial<RippleAuthConfig>): RippleAuthService => {
  defaultAuthService = new RippleAuthService(config);
  return defaultAuthService;
};
