/**
 * Ripple environment configuration for different deployment environments
 * Supports test and production environments with proper API endpoints
 */

import type { RippleEnvironmentConfig, RippleEnvironment } from '../types';

// Environment configurations
export const RIPPLE_ENVIRONMENTS: Record<RippleEnvironment, RippleEnvironmentConfig> = {
  test: {
    environment: 'test',
    authBaseUrl: 'https://auth.rnc.ripplenet.com',
    apiBaseUrl: 'https://api.sandbox.ripple.com/v1',
    apiV4BaseUrl: 'https://aperture.test.rnc.ripplenet.com/v4',
    audiencePrefix: 'urn:ripplexcurrent-test'
  },
  production: {
    environment: 'production',
    authBaseUrl: 'https://auth.rnc.ripplenet.com',
    apiBaseUrl: 'https://api.ripple.com/v1',
    apiV4BaseUrl: 'https://aperture.rnc.ripplenet.com/v4',
    audiencePrefix: 'urn:ripplexcurrent-prod'
  }
};

// Default environment based on Vite environment
export const getDefaultEnvironment = (): RippleEnvironment => {
  const env = import.meta.env.VITE_RIPPLE_ENVIRONMENT as RippleEnvironment;
  return env === 'production' ? 'production' : 'test';
};

// Get configuration for current environment
export const getRippleConfig = (environment?: RippleEnvironment): RippleEnvironmentConfig => {
  const env = environment || getDefaultEnvironment();
  return RIPPLE_ENVIRONMENTS[env];
};

// Environment validation
export const isValidEnvironment = (env: string): env is RippleEnvironment => {
  return env === 'test' || env === 'production';
};

// API endpoint builders
export const buildApiUrl = (
  endpoint: string, 
  environment?: RippleEnvironment,
  version: 'v1' | 'v4' = 'v4'
): string => {
  const config = getRippleConfig(environment);
  const baseUrl = version === 'v4' ? config.apiV4BaseUrl : config.apiBaseUrl;
  
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${normalizedEndpoint}`;
};

export const buildAuthUrl = (endpoint: string, environment?: RippleEnvironment): string => {
  const config = getRippleConfig(environment);
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${config.authBaseUrl}${normalizedEndpoint}`;
};

// Audience string builder for OAuth
export const buildAudience = (tenantId: string, environment?: RippleEnvironment): string => {
  const config = getRippleConfig(environment);
  return `${config.audiencePrefix}:${tenantId}`;
};

// Feature flags for different environments
export const ENVIRONMENT_FEATURES = {
  test: {
    debugMode: true,
    mockResponses: false,
    extendedLogging: true,
    rateLimitBypass: true,
    webhookRetries: 3
  },
  production: {
    debugMode: false,
    mockResponses: false,
    extendedLogging: false,
    rateLimitBypass: false,
    webhookRetries: 5
  }
} as const;

// Get feature flags for environment
export const getEnvironmentFeatures = (environment?: RippleEnvironment) => {
  const env = environment || getDefaultEnvironment();
  return ENVIRONMENT_FEATURES[env];
};

// Timeout configurations by environment
export const ENVIRONMENT_TIMEOUTS = {
  test: {
    authTimeout: 10000, // 10 seconds
    apiTimeout: 30000, // 30 seconds
    webhookTimeout: 5000, // 5 seconds
    healthCheckTimeout: 5000 // 5 seconds
  },
  production: {
    authTimeout: 15000, // 15 seconds
    apiTimeout: 60000, // 60 seconds
    webhookTimeout: 10000, // 10 seconds
    healthCheckTimeout: 10000 // 10 seconds
  }
} as const;

// Get timeout configuration for environment
export const getEnvironmentTimeouts = (environment?: RippleEnvironment) => {
  const env = environment || getDefaultEnvironment();
  return ENVIRONMENT_TIMEOUTS[env];
};

// Rate limit configurations
export const ENVIRONMENT_RATE_LIMITS = {
  test: {
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 20
  },
  production: {
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    burstLimit: 50
  }
} as const;

// Get rate limit configuration for environment
export const getEnvironmentRateLimits = (environment?: RippleEnvironment) => {
  const env = environment || getDefaultEnvironment();
  return ENVIRONMENT_RATE_LIMITS[env];
};

// Validate environment variables
export const validateEnvironmentVariables = (): { isValid: boolean; missing: string[] } => {
  const required = [
    'VITE_RIPPLE_CLIENT_ID',
    'VITE_RIPPLE_CLIENT_SECRET',
    'VITE_RIPPLE_TENANT_ID'
  ];
  
  const missing: string[] = [];
  
  for (const envVar of required) {
    if (!import.meta.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

// Get environment variables with defaults
export const getEnvironmentVariables = () => {
  return {
    clientId: import.meta.env.VITE_RIPPLE_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_RIPPLE_CLIENT_SECRET || '',
    tenantId: import.meta.env.VITE_RIPPLE_TENANT_ID || '',
    environment: getDefaultEnvironment(),
    odlEnabled: import.meta.env.VITE_RIPPLE_ODL_ENABLED === 'true',
    custodyEnabled: import.meta.env.VITE_RIPPLE_CUSTODY_ENABLED === 'true',
    stablecoinEnabled: import.meta.env.VITE_RIPPLE_STABLECOIN_ENABLED === 'true'
  };
};
