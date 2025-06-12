/**
 * Authentication types for Ripple Payments Direct API v4
 * Based on OAuth2 client credentials flow
 */

export interface RippleAuthConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  environment: RippleEnvironment;
  authBaseUrl: string;
}

export type RippleEnvironment = 'test' | 'production';

export interface RippleTokenRequest {
  grant_type: 'client_credentials';
  client_id: string;
  client_secret: string;
  audience: string;
}

export interface RippleTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // seconds
  scope: string;
}

export interface RippleTokenIntrospection {
  active: boolean;
  exp?: number; // Unix timestamp
  scope?: string;
  client_id?: string;
  token_type?: 'Bearer';
}

export interface StoredRippleToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: Date;
  scope: string;
  createdAt: Date;
}

export interface RippleAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

// Environment-specific configuration
export interface RippleEnvironmentConfig {
  environment: RippleEnvironment;
  authBaseUrl: string;
  apiBaseUrl: string;
  apiV4BaseUrl: string;
  audiencePrefix: string;
}

// Scopes available in Ripple Payments Direct API
export type RippleScope = 
  | 'identities:create'
  | 'identities:read' 
  | 'identities:write'
  | 'quote_collections:write'
  | 'payments:accept'
  | 'payments:read'
  | 'payments:write'
  | 'routing_table:lookup'
  | 'reports:read'
  | 'reports:write';

export interface RippleAuthState {
  isAuthenticated: boolean;
  token: StoredRippleToken | null;
  isRefreshing: boolean;
  lastError: string | null;
}
