/**
 * DFNS Database Types - Database table definitions for DFNS integration
 * 
 * These types represent the database tables for storing DFNS-related data,
 * following the project's snake_case database convention.
 */

import type { Json } from '../core/database';

// ===== Base Database Interface =====

/**
 * Base interface for all DFNS database tables
 */
export interface DfnsBaseTable {
  id: string;
  created_at: string;
  updated_at: string;
}

// ===== Application & Authentication Tables =====

/**
 * DFNS applications table
 */
export interface DfnsApplicationsTable extends DfnsBaseTable {
  app_id: string;
  name: string;
  description?: string;
  kind: 'ClientSide' | 'ServerSide';
  origin?: string;
  relying_party?: string;
  status: 'Active' | 'Inactive' | 'Archived';
  external_id?: string;
  logo_url?: string;
  terms_of_service_url?: string;
  privacy_policy_url?: string;
  organization_id?: string;
}

/**
 * DFNS users table
 */
export interface DfnsUsersTable extends DfnsBaseTable {
  username: string;
  email?: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  kind: 'EndUser' | 'Employee' | 'PatientUser';
  external_id?: string;
  public_key?: string;
  recovery_setup?: boolean;
  mfa_enabled?: boolean;
  last_login_at?: string;
  registered_at: string;
  organization_id?: string;
  dfns_user_id?: string; // DFNS internal user ID
}

/**
 * DFNS credentials table
 */
export interface DfnsCredentialsTable extends DfnsBaseTable {
  credential_id: string;
  user_id: string;
  name?: string;
  kind: 'Fido2' | 'Key' | 'Password' | 'RecoveryKey';
  status: 'Active' | 'Inactive';
  public_key: string;
  algorithm: string;
  attestation_type?: string;
  authenticator_info?: Json;
  enrolled_at: string;
  last_used_at?: string;
  dfns_credential_id?: string; // DFNS internal credential ID
}

/**
 * DFNS service accounts table
 */
export interface DfnsServiceAccountsTable extends DfnsBaseTable {
  name: string;
  status: 'Active' | 'Inactive';
  external_id?: string;
  public_key?: string;
  permission_assignments?: Json;
  organization_id?: string;
  dfns_service_account_id?: string; // DFNS internal service account ID
}

/**
 * DFNS personal access tokens table
 */
export interface DfnsPersonalAccessTokensTable extends DfnsBaseTable {
  name: string;
  status: 'Active' | 'Inactive' | 'Expired';
  expires_at?: string;
  last_used_at?: string;
  permission_assignments?: Json;
  user_id: string;
  dfns_token_id?: string; // DFNS internal token ID
}

// ===== Wallet & Key Tables =====

/**
 * DFNS wallets table
 */
export interface DfnsWalletsTable extends DfnsBaseTable {
  wallet_id: string;
  network: string;
  name?: string;
  address: string;
  signing_key_id: string;
  custodial: boolean;
  imported: boolean;
  exported: boolean;
  date_exported?: string;
  external_id?: string;
  tags?: string[];
  status: 'Active' | 'Inactive';
  delegated?: boolean;
  delegated_to?: string;
  organization_id?: string;
  project_id?: string;
  investor_id?: string;
  dfns_wallet_id: string; // DFNS internal wallet ID
}

/**
 * DFNS signing keys table
 */
export interface DfnsSigningKeysTable extends DfnsBaseTable {
  key_id: string;
  public_key: string;
  network: string;
  curve: 'ed25519' | 'secp256k1' | 'secp256r1';
  scheme: 'EdDSA' | 'ECDSA';
  status: 'Active' | 'Inactive';
  delegated?: boolean;
  delegated_to?: string;
  external_id?: string;
  tags?: string[];
  imported: boolean;
  exported: boolean;
  date_exported?: string;
  organization_id?: string;
  dfns_key_id: string; // DFNS internal key ID
}

/**
 * DFNS wallet balances table (for caching)
 */
export interface DfnsWalletBalancesTable extends DfnsBaseTable {
  wallet_id: string;
  asset_symbol: string;
  asset_name?: string;
  contract_address?: string;
  balance: string;
  value_in_usd?: string;
  decimals: number;
  verified: boolean;
  native_asset?: boolean;
  last_updated: string;
}

/**
 * DFNS wallet NFTs table (for caching)
 */
export interface DfnsWalletNftsTable extends DfnsBaseTable {
  wallet_id: string;
  contract: string;
  token_id: string;
  collection?: string;
  name?: string;
  description?: string;
  image_url?: string;
  external_url?: string;
  attributes?: Json;
  last_updated: string;
}

/**
 * DFNS transaction history table (for caching)
 */
export interface DfnsTransactionHistoryTable extends DfnsBaseTable {
  wallet_id: string;
  tx_hash: string;
  direction: 'Incoming' | 'Outgoing';
  status: 'Pending' | 'Confirmed' | 'Failed' | 'Cancelled';
  asset_symbol: string;
  asset_name?: string;
  contract_address?: string;
  amount: string;
  fee?: string;
  to_address?: string;
  from_address?: string;
  block_number?: number;
  block_hash?: string;
  timestamp: string;
  metadata?: Json;
  last_updated: string;
}

// ===== Transfer & Transaction Tables =====

/**
 * DFNS transfers table
 */
export interface DfnsTransfersTable extends DfnsBaseTable {
  transfer_id: string;
  wallet_id: string;
  to_address: string;
  amount: string;
  asset?: string;
  memo?: string;
  external_id?: string;
  nonce?: number;
  gas_limit?: string;
  gas_price?: string;
  max_fee_per_gas?: string;
  max_priority_fee_per_gas?: string;
  status: 'Pending' | 'Broadcasted' | 'Confirmed' | 'Failed' | 'Cancelled';
  tx_hash?: string;
  fee?: string;
  date_created: string;
  date_broadcast?: string;
  date_confirmed?: string;
  estimated_confirmation_time?: string;
  error_message?: string;
  dfns_transfer_id: string; // DFNS internal transfer ID
}

/**
 * DFNS signatures table
 */
export interface DfnsSignaturesTable extends DfnsBaseTable {
  signature_id: string;
  key_id: string;
  kind: string;
  message: string;
  external_id?: string;
  status: 'Pending' | 'Signed' | 'Failed' | 'Cancelled';
  signature?: string;
  public_key: string;
  date_created: string;
  date_completed?: string;
  error_message?: string;
  dfns_signature_id: string; // DFNS internal signature ID
}

/**
 * DFNS broadcast transactions table
 */
export interface DfnsBroadcastTransactionsTable extends DfnsBaseTable {
  broadcast_id: string;
  wallet_id: string;
  kind: string;
  transaction: string; // Serialized transaction
  external_id?: string;
  status: 'Pending' | 'Broadcasted' | 'Confirmed' | 'Failed' | 'Cancelled';
  tx_hash?: string;
  date_created: string;
  date_broadcast?: string;
  date_confirmed?: string;
  error_message?: string;
  dfns_broadcast_id: string; // DFNS internal broadcast ID
}

// ===== Permission & Policy Tables =====

/**
 * DFNS permissions table
 */
export interface DfnsPermissionsTable extends DfnsBaseTable {
  permission_id: string;
  name: string;
  resources: string[];
  operations: string[];
  effect: 'Allow' | 'Deny';
  condition?: Json;
  status: 'Active' | 'Inactive';
  description?: string;
  category?: string;
  organization_id?: string;
  dfns_permission_id?: string; // DFNS internal permission ID
}

/**
 * DFNS permission assignments table
 */
export interface DfnsPermissionAssignmentsTable extends DfnsBaseTable {
  permission_id: string;
  identity_id: string;
  identity_kind: 'User' | 'ServiceAccount' | 'PersonalAccessToken';
  assigned_by: string;
  assigned_at: string;
  organization_id?: string;
}

/**
 * DFNS policies table
 */
export interface DfnsPoliciesTable extends DfnsBaseTable {
  policy_id: string;
  name: string;
  description?: string;
  rule: Json;
  activity_kind: string;
  status: 'Active' | 'Inactive';
  external_id?: string;
  organization_id?: string;
  dfns_policy_id?: string; // DFNS internal policy ID
}

/**
 * DFNS policy approvals table
 */
export interface DfnsPolicyApprovalsTable extends DfnsBaseTable {
  approval_id: string;
  activity_id: string;
  policy_id: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Failed';
  reason?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  metadata?: Json;
  organization_id?: string;
  dfns_approval_id?: string; // DFNS internal approval ID
}

// ===== Webhook Tables =====

/**
 * DFNS webhooks table
 */
export interface DfnsWebhooksTable extends DfnsBaseTable {
  webhook_id: string;
  name: string;
  url: string;
  description?: string;
  events: string[];
  status: 'Active' | 'Inactive';
  secret?: string;
  headers?: Json;
  external_id?: string;
  organization_id?: string;
  dfns_webhook_id?: string; // DFNS internal webhook ID
}

/**
 * DFNS webhook deliveries table
 */
export interface DfnsWebhookDeliveriesTable extends DfnsBaseTable {
  delivery_id: string;
  webhook_id: string;
  event: string;
  payload: Json;
  status: 'Pending' | 'Delivered' | 'Failed' | 'Retrying';
  response_code?: number;
  response_body?: string;
  attempts: number;
  next_retry_at?: string;
  delivered_at?: string;
  error_message?: string;
}

// ===== Integration Tables =====

/**
 * DFNS exchange integrations table
 */
export interface DfnsExchangeIntegrationsTable extends DfnsBaseTable {
  integration_id: string;
  name: string;
  exchange_kind: 'Kraken' | 'Binance' | 'CoinbasePrime';
  credentials: Json; // Encrypted credentials
  status: 'Active' | 'Inactive' | 'Error';
  config?: Json;
  last_sync_at?: string;
  organization_id?: string;
  dfns_exchange_id?: string; // DFNS internal exchange ID
}

/**
 * DFNS exchange accounts table (for caching)
 */
export interface DfnsExchangeAccountsTable extends DfnsBaseTable {
  account_id: string;
  exchange_integration_id: string;
  account_type: string;
  trading_enabled: boolean;
  withdrawal_enabled: boolean;
  last_updated: string;
  dfns_account_id?: string; // DFNS internal account ID
}

/**
 * DFNS exchange balances table (for caching)
 */
export interface DfnsExchangeBalancesTable extends DfnsBaseTable {
  account_id: string;
  asset: string;
  total: string;
  available: string;
  locked: string;
  last_updated: string;
}

/**
 * DFNS staking integrations table
 */
export interface DfnsStakingIntegrationsTable extends DfnsBaseTable {
  staking_id: string;
  wallet_id: string;
  network: string;
  validator_address?: string;
  delegation_amount: string;
  status: 'Delegated' | 'Undelegating' | 'Undelegated' | 'Slashed';
  total_rewards: string;
  pending_rewards: string;
  claimed_rewards: string;
  last_reward_at?: string;
  last_claim_at?: string;
  apr?: string;
  unstaking_period?: string;
  dfns_staking_id?: string; // DFNS internal staking ID
}

// ===== Fee Sponsor Tables =====

/**
 * DFNS fee sponsors table
 */
export interface DfnsFeeSponorsTable extends DfnsBaseTable {
  sponsor_id: string;
  name: string;
  sponsor_address: string;
  network: string;
  status: 'Active' | 'Inactive' | 'Depleted';
  balance: string;
  spent_amount: string;
  transaction_count: number;
  external_id?: string;
  organization_id?: string;
  dfns_sponsor_id?: string; // DFNS internal sponsor ID
}

/**
 * DFNS sponsored fees table
 */
export interface DfnsSponsoredFeesTable extends DfnsBaseTable {
  sponsored_fee_id: string;
  fee_sponsor_id: string;
  wallet_id: string;
  tx_hash: string;
  amount: string;
  asset: string;
  status: 'Pending' | 'Sponsored' | 'Failed';
  sponsored_at: string;
  error_message?: string;
}

// ===== Validator Tables =====

/**
 * DFNS validators table (for caching)
 */
export interface DfnsValidatorsTable extends DfnsBaseTable {
  validator_address: string;
  network: string;
  name?: string;
  commission: string;
  delegated_amount: string;
  status: 'Active' | 'Inactive' | 'Jailed';
  apr?: string;
  uptime?: string;
  rank?: number;
  last_updated: string;
}

// ===== Activity & Audit Tables =====

/**
 * DFNS activity logs table
 */
export interface DfnsActivityLogsTable extends DfnsBaseTable {
  activity_type: string;
  entity_id: string;
  entity_type: string;
  description: string;
  user_id?: string;
  status: 'success' | 'failed' | 'pending';
  metadata?: Json;
  ip_address?: string;
  user_agent?: string;
  organization_id?: string;
}

/**
 * DFNS API requests table (for debugging and monitoring)
 */
export interface DfnsApiRequestsTable extends DfnsBaseTable {
  endpoint: string;
  method: string;
  request_id?: string;
  request_body?: Json;
  response_body?: Json;
  status_code: number;
  response_time_ms: number;
  error_message?: string;
  user_id?: string;
  organization_id?: string;
}

/**
 * DFNS sync status table (for tracking sync operations)
 */
export interface DfnsSyncStatusTable extends DfnsBaseTable {
  entity_type: string; // wallets, transactions, balances, etc.
  entity_id?: string;
  last_sync_at: string;
  sync_status: 'success' | 'failed' | 'in_progress';
  error_message?: string;
  next_sync_at?: string;
  organization_id?: string;
}

// ===== Insert Types (for database operations) =====

export type DfnsApplicationInsert = Omit<DfnsApplicationsTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DfnsUserInsert = Omit<DfnsUsersTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DfnsCredentialInsert = Omit<DfnsCredentialsTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DfnsWalletInsert = Omit<DfnsWalletsTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DfnsSigningKeyInsert = Omit<DfnsSigningKeysTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DfnsTransferInsert = Omit<DfnsTransfersTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DfnsSignatureInsert = Omit<DfnsSignaturesTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DfnsPermissionInsert = Omit<DfnsPermissionsTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DfnsPolicyInsert = Omit<DfnsPoliciesTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DfnsWebhookInsert = Omit<DfnsWebhooksTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type DfnsActivityLogInsert = Omit<DfnsActivityLogsTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

// ===== Update Types (for database operations) =====

export type DfnsApplicationUpdate = Partial<Omit<DfnsApplicationsTable, 'id' | 'created_at' | 'updated_at'>>;
export type DfnsUserUpdate = Partial<Omit<DfnsUsersTable, 'id' | 'created_at' | 'updated_at'>>;
export type DfnsCredentialUpdate = Partial<Omit<DfnsCredentialsTable, 'id' | 'created_at' | 'updated_at'>>;
export type DfnsWalletUpdate = Partial<Omit<DfnsWalletsTable, 'id' | 'created_at' | 'updated_at'>>;
export type DfnsSigningKeyUpdate = Partial<Omit<DfnsSigningKeysTable, 'id' | 'created_at' | 'updated_at'>>;
export type DfnsTransferUpdate = Partial<Omit<DfnsTransfersTable, 'id' | 'created_at' | 'updated_at'>>;
export type DfnsSignatureUpdate = Partial<Omit<DfnsSignaturesTable, 'id' | 'created_at' | 'updated_at'>>;
export type DfnsPermissionUpdate = Partial<Omit<DfnsPermissionsTable, 'id' | 'created_at' | 'updated_at'>>;
export type DfnsPolicyUpdate = Partial<Omit<DfnsPoliciesTable, 'id' | 'created_at' | 'updated_at'>>;
export type DfnsWebhookUpdate = Partial<Omit<DfnsWebhooksTable, 'id' | 'created_at' | 'updated_at'>>;

// All types are already exported individually above with 'export interface' and 'export type' declarations
