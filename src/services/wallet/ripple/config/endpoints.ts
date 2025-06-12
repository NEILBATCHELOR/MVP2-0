/**
 * API endpoint definitions for all Ripple services
 * Organized by service domain with consistent naming
 */

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  TOKEN: '/oauth/token',
  INTROSPECT: '/oauth/introspect'
} as const;

// Payments Direct API v4 endpoints
export const PAYMENTS_ENDPOINTS = {
  // Core payments
  LIST_PAYMENTS: '/payments',
  CREATE_PAYMENT: '/payments',
  GET_PAYMENT: '/payments/{id}',
  UPDATE_PAYMENT: '/payments/{id}',
  CANCEL_PAYMENT: '/payments/{id}/cancel',
  
  // Orchestration payments
  CREATE_ORCHESTRATION_PAYMENT: '/orchestration/payment',
  GET_ORCHESTRATION_PAYMENT: '/orchestration/payment/{id}',
  LIST_ORCHESTRATION_NOTIFICATIONS: '/orchestration/payment/notification',
  POST_ORCHESTRATION_ACTION: '/orchestration/payment/{id}/action',
  
  // Quotes
  CREATE_QUOTE_COLLECTION: '/quote_collections',
  GET_QUOTE_COLLECTION: '/quote_collections/{id}',
  ACCEPT_QUOTE: '/payments/{id}/accept',
  
  // Payment methods and corridors
  LIST_CORRIDORS: '/corridors',
  GET_CORRIDOR: '/corridors/{id}',
  LIST_PAYMENT_METHODS: '/payment_methods',
  
  // Fees and rates
  GET_FEES: '/fees',
  GET_EXCHANGE_RATES: '/rates'
} as const;

// ODL (On-Demand Liquidity) endpoints
export const ODL_ENDPOINTS = {
  LIST_PROVIDERS: '/odl/providers',
  GET_PROVIDER: '/odl/providers/{id}',
  GET_LIQUIDITY: '/odl/liquidity/{provider}',
  CREATE_ODL_PAYMENT: '/odl/payments',
  GET_ODL_PAYMENT: '/odl/payments/{id}',
  LIST_ODL_PAYMENTS: '/odl/payments',
  GET_ODL_RATES: '/odl/rates'
} as const;

// Identity Management endpoints
export const IDENTITY_ENDPOINTS = {
  LIST_IDENTITIES: '/identities',
  CREATE_IDENTITY: '/identities',
  GET_IDENTITY: '/identities/{id}',
  UPDATE_IDENTITY: '/identities/{id}',
  DELETE_IDENTITY: '/identities/{id}',
  VERIFY_IDENTITY: '/identities/{id}/verify',
  
  // KYC and compliance
  SUBMIT_KYC: '/identities/{id}/kyc',
  GET_KYC_STATUS: '/identities/{id}/kyc/status',
  UPLOAD_DOCUMENT: '/identities/{id}/documents',
  GET_DOCUMENT: '/identities/{id}/documents/{documentId}',
  
  // Compliance checks
  RUN_COMPLIANCE_CHECK: '/identities/{id}/compliance/check',
  GET_COMPLIANCE_RESULTS: '/identities/{id}/compliance/results'
} as const;

// Custody endpoints
export const CUSTODY_ENDPOINTS = {
  // Wallets
  LIST_WALLETS: '/custody/wallets',
  CREATE_WALLET: '/custody/wallets',
  GET_WALLET: '/custody/wallets/{id}',
  UPDATE_WALLET: '/custody/wallets/{id}',
  DELETE_WALLET: '/custody/wallets/{id}',
  
  // Assets
  LIST_ASSETS: '/custody/assets',
  GET_ASSET: '/custody/assets/{id}',
  TRANSFER_ASSET: '/custody/assets/{id}/transfer',
  
  // Security and keys
  GENERATE_KEYS: '/custody/keys/generate',
  LIST_KEYS: '/custody/keys',
  GET_KEY: '/custody/keys/{id}',
  ROTATE_KEY: '/custody/keys/{id}/rotate',
  
  // Multi-signature
  CREATE_MULTISIG: '/custody/multisig',
  SIGN_TRANSACTION: '/custody/multisig/{id}/sign',
  GET_SIGNATURES: '/custody/multisig/{id}/signatures'
} as const;

// Stablecoin (RLUSD) endpoints
export const STABLECOIN_ENDPOINTS = {
  // RLUSD operations
  GET_BALANCE: '/stablecoin/balance/{address}',
  TRANSFER: '/stablecoin/transfer',
  MINT: '/stablecoin/mint',
  BURN: '/stablecoin/burn',
  
  // Trust lines (XRP Ledger)
  CREATE_TRUSTLINE: '/stablecoin/trustline',
  GET_TRUSTLINES: '/stablecoin/trustlines/{address}',
  
  // Ethereum operations
  GET_ETH_BALANCE: '/stablecoin/ethereum/balance/{address}',
  ETH_TRANSFER: '/stablecoin/ethereum/transfer',
  GET_ETH_ALLOWANCE: '/stablecoin/ethereum/allowance',
  ETH_APPROVE: '/stablecoin/ethereum/approve',
  
  // Conversion and bridging
  BRIDGE_TOKENS: '/stablecoin/bridge',
  GET_BRIDGE_STATUS: '/stablecoin/bridge/{id}',
  
  // Redemption
  REQUEST_REDEMPTION: '/stablecoin/redeem',
  GET_REDEMPTION_STATUS: '/stablecoin/redeem/{id}'
} as const;

// Reporting endpoints
export const REPORTING_ENDPOINTS = {
  LIST_REPORTS: '/reports',
  CREATE_REPORT: '/reports',
  GET_REPORT: '/reports/{id}',
  DELETE_REPORT: '/reports/{id}',
  DOWNLOAD_REPORT: '/reports/download/{id}',
  
  // Pre-defined reports
  TRANSACTION_REPORT: '/reports/transactions',
  COMPLIANCE_REPORT: '/reports/compliance',
  SETTLEMENT_REPORT: '/reports/settlements',
  FEE_REPORT: '/reports/fees',
  
  // Analytics
  GET_ANALYTICS: '/analytics',
  GET_METRICS: '/analytics/metrics',
  GET_TRENDS: '/analytics/trends'
} as const;

// Webhook endpoints
export const WEBHOOK_ENDPOINTS = {
  LIST_SUBSCRIPTIONS: '/webhooks/subscriptions',
  CREATE_SUBSCRIPTION: '/webhooks/subscriptions',
  GET_SUBSCRIPTION: '/webhooks/subscriptions/{id}',
  UPDATE_SUBSCRIPTION: '/webhooks/subscriptions/{id}',
  DELETE_SUBSCRIPTION: '/webhooks/subscriptions/{id}',
  
  // Webhook management
  TEST_WEBHOOK: '/webhooks/test',
  GET_WEBHOOK_EVENTS: '/webhooks/events',
  RETRY_WEBHOOK: '/webhooks/{id}/retry',
  
  // Webhook logs
  GET_WEBHOOK_LOGS: '/webhooks/logs',
  GET_WEBHOOK_LOG: '/webhooks/logs/{id}'
} as const;

// System and health endpoints
export const SYSTEM_ENDPOINTS = {
  HEALTH: '/health',
  STATUS: '/status',
  VERSION: '/version',
  PING: '/ping'
} as const;

// Helper function to replace path parameters
export const buildEndpointPath = (
  endpoint: string, 
  params: Record<string, string | number>
): string => {
  let path = endpoint;
  
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, String(value));
  }
  
  return path;
};

// Helper function to add query parameters
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  }
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Complete endpoint builder
export const buildFullEndpoint = (
  endpoint: string,
  pathParams?: Record<string, string | number>,
  queryParams?: Record<string, any>
): string => {
  let path = endpoint;
  
  // Replace path parameters
  if (pathParams) {
    path = buildEndpointPath(path, pathParams);
  }
  
  // Add query parameters
  if (queryParams) {
    path += buildQueryString(queryParams);
  }
  
  return path;
};

// Export all endpoints grouped by service
export const RIPPLE_ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  PAYMENTS: PAYMENTS_ENDPOINTS,
  ODL: ODL_ENDPOINTS,
  IDENTITY: IDENTITY_ENDPOINTS,
  CUSTODY: CUSTODY_ENDPOINTS,
  STABLECOIN: STABLECOIN_ENDPOINTS,
  REPORTING: REPORTING_ENDPOINTS,
  WEBHOOKS: WEBHOOK_ENDPOINTS,
  SYSTEM: SYSTEM_ENDPOINTS
} as const;

// Endpoint validation
export const isValidEndpoint = (service: string, endpoint: string): boolean => {
  const serviceEndpoints = RIPPLE_ENDPOINTS[service as keyof typeof RIPPLE_ENDPOINTS];
  if (!serviceEndpoints) return false;
  
  return Object.values(serviceEndpoints).includes(endpoint as any);
};
