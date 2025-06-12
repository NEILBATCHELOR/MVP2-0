// Guardian Medex API Types
// Complete type definitions for Guardian API integration

// ===============================
// Configuration Types
// ===============================

export interface GuardianConfig {
  baseUrl: string;
  privateKey: string;
  publicKey: string;
  apiKey: string;
  webhookUrl: string;
  webhookAuthKey: string;
  eventsHandlerUrl: string;
}

// ===============================
// Authentication Types
// ===============================

export interface GuardianAuthHeaders {
  'x-api-key': string;
  'x-api-signature': string;
  'x-api-timestamp': string;
  'x-api-nonce': string;
  'Accept': string;
  'Content-Type'?: string; // Optional - only for POST requests
}

// ===============================
// Wallet Types
// ===============================

export interface GuardianWallet {
  id: string;
  externalId: string;
  accounts: {
    id: string;
    address: string;
    type: string;
    network: string;
  }[];
  status: string;
}

export interface GuardianWalletDetails {
  id: string;
  externalId: string;
  accounts: {
    id: string;
    address: string;
    type: string;
    network: string;
  }[];
  status: string;
  name?: string;
  type?: string;
  blockchain?: string;
  chainId?: number;
  createdAt?: string;
  metadata?: Record<string, any>;
}

export interface GuardianWalletRequest {
  name: string;
  type: 'EOA' | 'MULTISIG' | 'SMART';
  blockchain: 'polygon' | 'ethereum';
  userId?: string;
  metadata?: Record<string, any>;
}

export interface GuardianWalletResponse {
  id: string;
  address: string;
  name: string;
  type: string;
  blockchain: string;
  chainId: number;
  createdAt: string;
  publicKey?: string;
  metadata?: Record<string, any>;
}

// ===============================
// Operation Types
// ===============================

export interface GuardianOperationResponse {
  operationId: string;
  status: 'pending' | 'completed' | 'failed';
  walletAddress?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// ===============================
// Transaction Types
// ===============================

export interface GuardianTransactionRequest {
  walletId: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

export interface GuardianTransactionResponse {
  id: string;
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  walletId: string;
  to: string;
  value: string;
  gasUsed?: string;
  blockNumber?: number;
  timestamp: string;
}

// ===============================
// Policy Types
// ===============================

export interface GuardianPolicyRequest {
  name: string;
  rules: PolicyRule[];
  walletIds?: string[];
  metadata?: Record<string, any>;
}

export interface PolicyRule {
  type: string;
  conditions: Record<string, any>;
  actions: string[];
}

// ===============================
// Error Types
// ===============================

export interface GuardianApiError {
  error: string;
  message: string;
  code: number;
  details?: Record<string, any>;
}

// ===============================
// Extension Types for Integration
// ===============================

export interface GuardianWalletExtension {
  guardianWalletId?: string;
  guardianMetadata?: {
    operationId: string;
    status: string;
    createdVia: string;
    originalParams?: any;
    [key: string]: any;
  };
  isGuardianManaged?: boolean;
}

// ===============================
// Request/Response Types
// ===============================

export interface CreateWalletRequest {
  id: string;
}

export interface CreateWalletResponse {
  operationId: string;
}

// ===============================
// Webhook Types
// ===============================

export interface GuardianWebhookPayload {
  operationId: string;
  type: string;
  status: string;
  data: any;
  timestamp: string;
  // Additional properties referenced in the codebase
  eventType?: string;
  walletId?: string;
  transactionId?: string;
}

export interface GuardianWebhookHeaders {
  'x-guardian-signature': string;
  'x-guardian-timestamp': string;
}

// Schema definitions for validation
// Duplicate removed:
// export interface GuardianWalletRequestSchema {
//   name: string;
//   type: 'EOA' | 'MULTISIG' | 'SMART';
//   blockchain: 'polygon' | 'ethereum';
//   userId?: string;
//   metadata?: Record<string, any>;
// }

export interface GuardianWebhookPayloadSchema {
  operationId: string;
  type: string;
  status: string;
  data: any;
  timestamp: string;
  eventType?: string;
  walletId?: string;
  transactionId?: string;
}

// Signature payload for authentication
export interface GuardianSignaturePayload {
  method: string;
  url: string;
  body: string;
  timestamp: string;
  nonce: string;
}
