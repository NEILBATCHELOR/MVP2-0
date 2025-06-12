/**
 * DFNS Configuration - Core configuration for DFNS integration
 * 
 * This file contains the configuration settings for the DFNS client,
 * including authentication, API endpoints, and client options.
 */

import type { DfnsClientConfig, DfnsRetryConfig, DfnsLoggingConfig } from '@/types/dfns';

// ===== Environment Variables =====

/**
 * Get environment variable with fallback
 */
function getEnvVar(name: string, fallback?: string): string {
  const value = import.meta.env[name] || process.env[name];
  if (!value && fallback === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || fallback || '';
}

// ===== DFNS Environment Configuration =====

export const DFNS_CONFIG = {
  // API Configuration
  baseUrl: getEnvVar('VITE_DFNS_BASE_URL', 'https://api.dfns.ninja'),
  appId: getEnvVar('VITE_DFNS_APP_ID'),
  
  // Authentication
  privateKey: getEnvVar('VITE_DFNS_PRIVATE_KEY'),
  credentialId: getEnvVar('VITE_DFNS_CREDENTIAL_ID'),
  
  // Optional Configuration
  orgId: getEnvVar('VITE_DFNS_ORG_ID', ''),
  
  // Environment Settings
  environment: getEnvVar('VITE_DFNS_ENVIRONMENT', 'sandbox'), // sandbox | production
  
  // Service Account (for server-side operations)
  serviceAccountId: getEnvVar('VITE_DFNS_SERVICE_ACCOUNT_ID', ''),
  serviceAccountPrivateKey: getEnvVar('VITE_DFNS_SERVICE_ACCOUNT_PRIVATE_KEY', ''),
  
  // Webhook Configuration
  webhookSecret: getEnvVar('VITE_DFNS_WEBHOOK_SECRET', ''),
  webhookUrl: getEnvVar('VITE_DFNS_WEBHOOK_URL', ''),
  
  // Client Settings
  timeout: parseInt(getEnvVar('VITE_DFNS_TIMEOUT', '30000')), // 30 seconds
  maxRetries: parseInt(getEnvVar('VITE_DFNS_MAX_RETRIES', '3')),
  
  // Feature Flags
  enableWebhooks: getEnvVar('VITE_DFNS_ENABLE_WEBHOOKS', 'true') === 'true',
  enablePolicyEngine: getEnvVar('VITE_DFNS_ENABLE_POLICY_ENGINE', 'true') === 'true',
  enableStaking: getEnvVar('VITE_DFNS_ENABLE_STAKING', 'true') === 'true',
  enableExchangeIntegration: getEnvVar('VITE_DFNS_ENABLE_EXCHANGE_INTEGRATION', 'false') === 'true',
  
  // Development Settings
  enableDebugLogging: getEnvVar('VITE_DFNS_ENABLE_DEBUG_LOGGING', 'false') === 'true',
  enableRequestLogging: getEnvVar('VITE_DFNS_ENABLE_REQUEST_LOGGING', 'false') === 'true'
} as const;

// ===== Retry Configuration =====

export const DEFAULT_RETRY_CONFIG: DfnsRetryConfig = {
  enabled: true,
  maxAttempts: DFNS_CONFIG.maxRetries,
  backoffFactor: 2,
  maxDelay: 10000 // 10 seconds
};

// ===== Logging Configuration =====

export const DEFAULT_LOGGING_CONFIG: DfnsLoggingConfig = {
  enabled: DFNS_CONFIG.enableDebugLogging,
  level: DFNS_CONFIG.environment === 'production' ? 'error' : 'debug',
  includeRequestBody: DFNS_CONFIG.enableRequestLogging,
  includeResponseBody: DFNS_CONFIG.enableRequestLogging
};

// ===== Client Configuration =====

export const DEFAULT_CLIENT_CONFIG: DfnsClientConfig = {
  baseUrl: DFNS_CONFIG.baseUrl,
  appId: DFNS_CONFIG.appId,
  timeout: DFNS_CONFIG.timeout,
  retryConfig: DEFAULT_RETRY_CONFIG,
  logging: DEFAULT_LOGGING_CONFIG
};

// ===== Network Configuration =====

/**
 * Default networks to enable for wallet creation
 */
export const DEFAULT_NETWORKS = [
  'Ethereum',
  'Polygon',
  'Arbitrum',
  'Optimism',
  'Avalanche',
  'Bitcoin',
  'Solana'
] as const;

/**
 * Testnet networks for development
 */
export const TESTNET_NETWORKS = [
  'EthereumSepolia',
  'PolygonMumbai',
  'ArbitrumSepolia',
  'OptimismSepolia',
  'AvalancheFuji',
  'BitcoinTestnet3',
  'SolanaDevnet'
] as const;

/**
 * Get appropriate networks based on environment
 */
export function getEnabledNetworks(): readonly string[] {
  return DFNS_CONFIG.environment === 'production' ? DEFAULT_NETWORKS : TESTNET_NETWORKS;
}

// ===== API Endpoints =====

export const DFNS_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    delegatedLogin: '/auth/delegated/login',
    delegatedRegistration: '/auth/delegated/registration'
  },
  
  // Users
  users: {
    list: '/users',
    create: '/users',
    get: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    activate: (id: string) => `/users/${id}/activate`,
    deactivate: (id: string) => `/users/${id}/deactivate`
  },
  
  // Credentials
  credentials: {
    list: (userId: string) => `/users/${userId}/credentials`,
    create: (userId: string) => `/users/${userId}/credentials`,
    get: (userId: string, credId: string) => `/users/${userId}/credentials/${credId}`,
    activate: (userId: string, credId: string) => `/users/${userId}/credentials/${credId}/activate`,
    deactivate: (userId: string, credId: string) => `/users/${userId}/credentials/${credId}/deactivate`
  },
  
  // Wallets
  wallets: {
    list: '/wallets',
    create: '/wallets',
    get: (id: string) => `/wallets/${id}`,
    update: (id: string) => `/wallets/${id}`,
    delegate: (id: string) => `/wallets/${id}/delegate`,
    export: (id: string) => `/wallets/${id}/export`,
    import: '/wallets/import',
    assets: (id: string) => `/wallets/${id}/assets`,
    nfts: (id: string) => `/wallets/${id}/nfts`,
    history: (id: string) => `/wallets/${id}/history`,
    transfer: (id: string) => `/wallets/${id}/transfers`,
    broadcast: (id: string) => `/wallets/${id}/transactions`
  },
  
  // Keys
  keys: {
    list: '/keys',
    create: '/keys',
    get: (id: string) => `/keys/${id}`,
    update: (id: string) => `/keys/${id}`,
    delegate: (id: string) => `/keys/${id}/delegate`,
    export: (id: string) => `/keys/${id}/export`,
    import: '/keys/import',
    sign: (id: string) => `/keys/${id}/signatures`
  },
  
  // Policies
  policies: {
    list: '/policies',
    create: '/policies',
    get: (id: string) => `/policies/${id}`,
    update: (id: string) => `/policies/${id}`,
    archive: (id: string) => `/policies/${id}/archive`,
    approvals: '/policies/approvals',
    approval: (id: string) => `/policies/approvals/${id}`,
    decision: (id: string) => `/policies/approvals/${id}/decision`
  },
  
  // Permissions
  permissions: {
    list: '/permissions',
    create: '/permissions',
    get: (id: string) => `/permissions/${id}`,
    update: (id: string) => `/permissions/${id}`,
    archive: (id: string) => `/permissions/${id}/archive`,
    assign: '/permissions/assignments',
    revoke: (id: string) => `/permissions/assignments/${id}`,
    assignments: '/permissions/assignments'
  },
  
  // Webhooks
  webhooks: {
    list: '/webhooks',
    create: '/webhooks',
    get: (id: string) => `/webhooks/${id}`,
    update: (id: string) => `/webhooks/${id}`,
    delete: (id: string) => `/webhooks/${id}`,
    ping: (id: string) => `/webhooks/${id}/ping`,
    events: '/webhooks/events',
    event: (id: string) => `/webhooks/events/${id}`
  },
  
  // Exchanges
  exchanges: {
    list: '/exchanges',
    create: '/exchanges',
    get: (id: string) => `/exchanges/${id}`,
    delete: (id: string) => `/exchanges/${id}`,
    accounts: (id: string) => `/exchanges/${id}/accounts`,
    assets: (id: string, accountId: string) => `/exchanges/${id}/accounts/${accountId}/assets`,
    deposit: (id: string) => `/exchanges/${id}/deposits`,
    withdraw: (id: string) => `/exchanges/${id}/withdrawals`
  },
  
  // Staking
  staking: {
    stakes: '/staking/stakes',
    create: '/staking/stakes',
    actions: '/staking/actions',
    createAction: '/staking/actions',
    rewards: '/staking/rewards'
  },
  
  // Fee Sponsors
  feeSponsors: {
    list: '/fee-sponsors',
    create: '/fee-sponsors',
    get: (id: string) => `/fee-sponsors/${id}`,
    activate: (id: string) => `/fee-sponsors/${id}/activate`,
    deactivate: (id: string) => `/fee-sponsors/${id}/deactivate`,
    delete: (id: string) => `/fee-sponsors/${id}`,
    fees: '/fee-sponsors/fees'
  },
  
  // Networks
  networks: {
    fees: '/networks/fees',
    read: '/networks/read',
    validators: '/networks/validators',
    createValidator: '/networks/validators'
  }
} as const;

// ===== Validation =====

/**
 * Validate DFNS configuration
 */
export function validateDfnsConfig(): void {
  const requiredVars = ['baseUrl', 'appId'];
  const missingVars = requiredVars.filter(key => !DFNS_CONFIG[key as keyof typeof DFNS_CONFIG]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required DFNS configuration: ${missingVars.join(', ')}`);
  }
  
  // Validate URL format
  try {
    new URL(DFNS_CONFIG.baseUrl);
  } catch {
    throw new Error('Invalid DFNS base URL format');
  }
  
  // Validate environment
  if (!['sandbox', 'production'].includes(DFNS_CONFIG.environment)) {
    throw new Error('DFNS environment must be either "sandbox" or "production"');
  }
}

// ===== Utility Functions =====

/**
 * Get full API URL for endpoint
 */
export function getApiUrl(endpoint: string): string {
  return `${DFNS_CONFIG.baseUrl}${endpoint}`;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return DFNS_CONFIG.environment === 'production';
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof DFNS_CONFIG): boolean {
  return Boolean(DFNS_CONFIG[feature]);
}

/**
 * Get default request headers
 */
export function getDefaultHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-DFNS-APPID': DFNS_CONFIG.appId,
    'X-DFNS-VERSION': '1.0.0'
  };
}

// Validate configuration on import
validateDfnsConfig();
