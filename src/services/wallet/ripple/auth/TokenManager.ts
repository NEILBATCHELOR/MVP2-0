/**
 * Advanced token management for Ripple authentication
 * Provides caching, automatic refresh, and persistence capabilities
 */

import type { 
  StoredRippleToken, 
  RippleAuthState,
  ServiceResult 
} from '../types';
import { RippleAuthService } from './RippleAuthService';
import { RippleErrorHandler } from '../utils/ErrorHandler';

export interface TokenManagerConfig {
  refreshThreshold?: number; // Minutes before expiry to refresh (default: 5)
  maxRetries?: number; // Max refresh retries (default: 3)
  persistTokens?: boolean; // Store tokens in localStorage (default: false)
  onTokenRefresh?: (token: StoredRippleToken) => void;
  onTokenExpired?: () => void;
  onAuthError?: (error: any) => void;
}

export class RippleTokenManager {
  private authService: RippleAuthService;
  private config: Required<TokenManagerConfig>;
  private refreshTimer: NodeJS.Timeout | null = null;
  private state: RippleAuthState = {
    isAuthenticated: false,
    token: null,
    isRefreshing: false,
    lastError: null
  };
  private listeners: Array<(state: RippleAuthState) => void> = [];

  constructor(
    authService: RippleAuthService,
    config: TokenManagerConfig = {}
  ) {
    this.authService = authService;
    this.config = {
      refreshThreshold: config.refreshThreshold || 5,
      maxRetries: config.maxRetries || 3,
      persistTokens: config.persistTokens || false,
      onTokenRefresh: config.onTokenRefresh || (() => {}),
      onTokenExpired: config.onTokenExpired || (() => {}),
      onAuthError: config.onAuthError || (() => {})
    };

    // Load persisted token if enabled
    if (this.config.persistTokens) {
      this.loadPersistedToken();
    }
  }

  /**
   * Initialize token manager and ensure authentication
   */
  async initialize(): Promise<ServiceResult<StoredRippleToken>> {
    try {
      this.updateState({ isRefreshing: true, lastError: null });

      const token = await this.ensureValidToken();
      
      if (token) {
        this.updateState({
          isAuthenticated: true,
          token,
          isRefreshing: false
        });
        
        this.scheduleRefresh(token);
        return RippleErrorHandler.createSuccessResult(token);
      } else {
        this.updateState({
          isAuthenticated: false,
          token: null,
          isRefreshing: false,
          lastError: 'Failed to obtain access token'
        });
        
        return RippleErrorHandler.createFailureResult(
          new Error('Failed to initialize authentication')
        );
      }
    } catch (error) {
      this.updateState({
        isAuthenticated: false,
        token: null,
        isRefreshing: false,
        lastError: error.message
      });
      
      this.config.onAuthError(error);
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get current valid token, refreshing if necessary
   */
  async getValidToken(): Promise<StoredRippleToken | null> {
    // If currently refreshing, wait for it to complete
    if (this.state.isRefreshing) {
      return this.waitForRefresh();
    }

    return this.ensureValidToken();
  }

  /**
   * Force token refresh
   */
  async refreshToken(): Promise<ServiceResult<StoredRippleToken>> {
    if (this.state.isRefreshing) {
      const token = await this.waitForRefresh();
      return token 
        ? RippleErrorHandler.createSuccessResult(token)
        : RippleErrorHandler.createFailureResult(new Error('Token refresh failed'));
    }

    this.updateState({ isRefreshing: true, lastError: null });

    try {
      const result = await this.authService.requestToken();
      
      if (result.success && result.data) {
        const token = result.data;
        
        this.updateState({
          isAuthenticated: true,
          token,
          isRefreshing: false
        });
        
        this.persistToken(token);
        this.scheduleRefresh(token);
        this.config.onTokenRefresh(token);
        
        return result;
      } else {
        this.updateState({
          isAuthenticated: false,
          token: null,
          isRefreshing: false,
          lastError: result.error?.message || 'Token refresh failed'
        });
        
        this.config.onAuthError(result.error);
        return result;
      }
    } catch (error) {
      this.updateState({
        isAuthenticated: false,
        token: null,
        isRefreshing: false,
        lastError: error.message
      });
      
      this.config.onAuthError(error);
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Revoke current token and clear state
   */
  async revokeToken(): Promise<void> {
    this.clearRefreshTimer();
    
    if (this.state.token) {
      await this.authService.revokeToken(this.state.token.accessToken);
    }
    
    this.updateState({
      isAuthenticated: false,
      token: null,
      isRefreshing: false,
      lastError: null
    });
    
    this.clearPersistedToken();
  }

  /**
   * Get current authentication state
   */
  getState(): RippleAuthState {
    return { ...this.state };
  }

  /**
   * Subscribe to authentication state changes
   */
  subscribe(listener: (state: RippleAuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get token provider function for API clients
   */
  getTokenProvider(): () => Promise<StoredRippleToken | null> {
    return () => this.getValidToken();
  }

  /**
   * Check if token needs refresh based on threshold
   */
  needsRefresh(token: StoredRippleToken): boolean {
    const thresholdMs = this.config.refreshThreshold * 60 * 1000;
    const expiryTime = token.expiresAt.getTime();
    const refreshTime = expiryTime - thresholdMs;
    
    return Date.now() >= refreshTime;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: StoredRippleToken): boolean {
    return Date.now() >= token.expiresAt.getTime();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearRefreshTimer();
    this.listeners.length = 0;
  }

  // Private methods

  /**
   * Ensure we have a valid token, refreshing if necessary
   */
  private async ensureValidToken(): Promise<StoredRippleToken | null> {
    const currentToken = this.state.token;
    
    // No token, request new one
    if (!currentToken) {
      const result = await this.refreshToken();
      return result.success ? result.data || null : null;
    }
    
    // Token expired, refresh
    if (this.isTokenExpired(currentToken)) {
      this.config.onTokenExpired();
      const result = await this.refreshToken();
      return result.success ? result.data || null : null;
    }
    
    // Token needs refresh (proactive)
    if (this.needsRefresh(currentToken)) {
      // Fire and forget refresh, return current token
      this.refreshToken();
    }
    
    return currentToken;
  }

  /**
   * Wait for ongoing refresh to complete
   */
  private async waitForRefresh(): Promise<StoredRippleToken | null> {
    return new Promise((resolve) => {
      const checkRefresh = () => {
        if (!this.state.isRefreshing) {
          resolve(this.state.token);
        } else {
          setTimeout(checkRefresh, 100);
        }
      };
      
      checkRefresh();
    });
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleRefresh(token: StoredRippleToken): void {
    this.clearRefreshTimer();
    
    const thresholdMs = this.config.refreshThreshold * 60 * 1000;
    const refreshTime = token.expiresAt.getTime() - thresholdMs;
    const delay = Math.max(0, refreshTime - Date.now());
    
    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, delay);
  }

  /**
   * Clear refresh timer
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Update authentication state and notify listeners
   */
  private updateState(updates: Partial<RippleAuthState>): void {
    this.state = { ...this.state, ...updates };
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Persist token to localStorage if enabled
   */
  private persistToken(token: StoredRippleToken): void {
    if (!this.config.persistTokens || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const tokenData = {
        accessToken: token.accessToken,
        tokenType: token.tokenType,
        expiresAt: token.expiresAt.toISOString(),
        scope: token.scope,
        createdAt: token.createdAt.toISOString()
      };
      
      localStorage.setItem('ripple_auth_token', JSON.stringify(tokenData));
    } catch (error) {
      console.warn('Failed to persist auth token:', error);
    }
  }

  /**
   * Load persisted token from localStorage
   */
  private loadPersistedToken(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const tokenData = localStorage.getItem('ripple_auth_token');
      if (!tokenData) {
        return;
      }
      
      const parsed = JSON.parse(tokenData);
      const token: StoredRippleToken = {
        accessToken: parsed.accessToken,
        tokenType: parsed.tokenType,
        expiresAt: new Date(parsed.expiresAt),
        scope: parsed.scope,
        createdAt: new Date(parsed.createdAt)
      };
      
      // Only use if not expired
      if (!this.isTokenExpired(token)) {
        this.updateState({
          isAuthenticated: true,
          token
        });
        
        this.scheduleRefresh(token);
      } else {
        this.clearPersistedToken();
      }
    } catch (error) {
      console.warn('Failed to load persisted auth token:', error);
      this.clearPersistedToken();
    }
  }

  /**
   * Clear persisted token from localStorage
   */
  private clearPersistedToken(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('ripple_auth_token');
      } catch (error) {
        console.warn('Failed to clear persisted auth token:', error);
      }
    }
  }
}

// Factory function for creating token manager
export const createRippleTokenManager = (
  authService: RippleAuthService,
  config?: TokenManagerConfig
): RippleTokenManager => {
  return new RippleTokenManager(authService, config);
};
