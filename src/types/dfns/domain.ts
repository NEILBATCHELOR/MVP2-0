/**
 * DFNS Domain Types - Business domain models for DFNS integration
 * 
 * These types represent the application-level domain models that map to DFNS API responses.
 * They follow the project's camelCase convention for domain models.
 */

import type { BaseModel } from '../core/centralModels';
import type {
  DfnsNetwork,
  DfnsCurve,
  DfnsScheme,
  DfnsApplicationKind,
  DfnsApplicationStatus,
  DfnsUserStatus,
  DfnsUserKind,
  DfnsCredentialKind,
  DfnsCredentialStatus,
  DfnsWalletStatus,
  DfnsKeyStatus,
  DfnsTransactionStatus,
  DfnsTransferStatus,
  DfnsSignatureStatus,
  DfnsPermissionEffect,
  DfnsPermissionStatus,
  DfnsPolicyStatus,
  DfnsActivityKind,
  DfnsPolicyApprovalStatus,
  DfnsWebhookEvent,
  DfnsWebhookStatus,
  DfnsWebhookDeliveryStatus,
  DfnsExchangeKind,
  DfnsIntegrationStatus,
  DfnsStakingStatus,
  DfnsFeeSponsorStatus,
  DfnsValidatorStatus
} from './core';

// ===== Domain Application Types =====

/**
 * Application domain model - camelCase version for UI
 */
export interface Application extends BaseModel {
  appId: string;
  name: string;
  description?: string;
  kind: DfnsApplicationKind;
  origin?: string;
  relyingParty?: string;
  status: DfnsApplicationStatus;
  externalId?: string;
  logoUrl?: string;
  termsOfServiceUrl?: string;
  privacyPolicyUrl?: string;
}

/**
 * User domain model - camelCase version for UI
 */
export interface User extends BaseModel {
  username: string;
  email?: string;
  status: DfnsUserStatus;
  kind: DfnsUserKind;
  externalId?: string;
  publicKey?: string;
  recoverySetup?: boolean;
  mfaEnabled?: boolean;
  lastLoginAt?: string;
  registeredAt: string;
}

/**
 * Credential domain model - camelCase version for UI
 */
export interface Credential extends BaseModel {
  credentialId: string;
  name?: string;
  kind: DfnsCredentialKind;
  status: DfnsCredentialStatus;
  publicKey: string;
  algorithm: string;
  attestationType?: string;
  authenticatorInfo?: AuthenticatorInfo;
  enrolledAt: string;
  lastUsedAt?: string;
}

export interface AuthenticatorInfo {
  aaguid: string;
  credentialPublicKey: string;
  counter: number;
  credentialBackedUp?: boolean;
  credentialDeviceType?: string;
  transports?: string[];
}

// ===== Domain Wallet Types =====

/**
 * Wallet domain model - camelCase version for UI
 */
export interface Wallet extends BaseModel {
  walletId: string;
  network: DfnsNetwork;
  name?: string;
  address: string;
  signingKey: SigningKey;
  custodial: boolean;
  imported: boolean;
  exported: boolean;
  dateExported?: string;
  externalId?: string;
  tags?: string[];
  status: DfnsWalletStatus;
  delegated?: boolean;
  delegatedTo?: string;
  // Extended properties for UI
  balance?: WalletBalance[];
  nfts?: NFT[];
  recentTransactions?: TransactionHistory[];
}

/**
 * Signing Key domain model - camelCase version for UI
 */
export interface SigningKey extends BaseModel {
  keyId: string;
  publicKey: string;
  network: DfnsNetwork;
  curve: DfnsCurve;
  scheme: DfnsScheme;
  status: DfnsKeyStatus;
  delegated?: boolean;
  delegatedTo?: string;
  externalId?: string;
  tags?: string[];
  imported: boolean;
  exported: boolean;
  dateExported?: string;
}

/**
 * Asset domain model - camelCase version for UI
 */
export interface Asset {
  symbol: string;
  decimals: number;
  verified: boolean;
  name?: string;
  logoUrl?: string;
  contractAddress?: string;
  nativeAsset?: boolean;
}

/**
 * Wallet balance domain model - camelCase version for UI
 */
export interface WalletBalance {
  asset: Asset;
  balance: string;
  valueInUSD?: string;
  formattedBalance?: string;
  percentageOfTotal?: number;
  // Additional fields for compatibility
  assetSymbol?: string;
  valueInUsd?: string; // Alternative naming for compatibility
}

/**
 * NFT domain model - camelCase version for UI
 */
export interface NFT {
  contract: string;
  tokenId: string;
  collection?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  externalUrl?: string;
  attributes?: Array<{
    traitType: string;
    value: string;
  }>;
}

/**
 * Transaction history domain model - camelCase version for UI
 */
export interface TransactionHistory {
  txHash: string;
  direction: 'Incoming' | 'Outgoing';
  status: DfnsTransactionStatus;
  asset: Asset;
  amount: string;
  formattedAmount?: string;
  fee?: string;
  formattedFee?: string;
  to?: string;
  from?: string;
  blockNumber?: number;
  blockHash?: string;
  timestamp: string;
  formattedTimestamp?: string;
  metadata?: Record<string, any>;
}

// ===== Domain Transaction Types =====

/**
 * Transfer request domain model - camelCase version for UI
 */
export interface TransferRequest {
  to: string;
  amount: string;
  asset?: string;
  memo?: string;
  externalId?: string;
  nonce?: number;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  // UI helper properties
  formattedAmount?: string;
  estimatedFee?: string;
  confirmationsRequired?: number;
}

/**
 * Transfer response domain model - camelCase version for UI
 */
export interface TransferResponse {
  id: string;
  status: DfnsTransferStatus;
  txHash?: string;
  fee?: string;
  formattedFee?: string;
  dateCreated: string;
  dateBroadcast?: string;
  dateConfirmed?: string;
  estimatedConfirmationTime?: string;
  progress?: number; // 0-100 percentage
}

/**
 * Signature request domain model - camelCase version for UI
 */
export interface SignatureRequest {
  message: string;
  externalId?: string;
  description?: string;
  requiresApproval?: boolean;
}

/**
 * Signature response domain model - camelCase version for UI
 */
export interface SignatureResponse {
  id: string;
  status: DfnsSignatureStatus;
  signature?: string;
  publicKey: string;
  dateCreated: string;
  dateCompleted?: string;
  description?: string;
}

// ===== Domain Permission & Policy Types =====

/**
 * Permission domain model - camelCase version for UI
 */
export interface Permission extends BaseModel {
  name: string;
  resources: string[];
  operations: string[];
  effect: DfnsPermissionEffect;
  condition?: Record<string, any>;
  status: DfnsPermissionStatus;
  description?: string;
  category?: string;
}

/**
 * Permission assignment domain model - camelCase version for UI
 */
export interface PermissionAssignment extends BaseModel {
  permissionId: string;
  identityId: string;
  identityKind: string;
  assignedBy: string;
  assignedAt: string;
  // UI helper properties
  permissionName?: string;
  identityName?: string;
  assignedByName?: string;
}

/**
 * Policy domain model - camelCase version for UI
 */
export interface Policy extends BaseModel {
  name: string;
  description?: string;
  rule: PolicyRule;
  activityKind: DfnsActivityKind;
  status: DfnsPolicyStatus;
  externalId?: string;
  // UI helper properties
  applicableWallets?: string[];
  lastTriggered?: string;
  triggerCount?: number;
  // Compatibility field
  policyId?: string;
}

/**
 * Policy rule domain model - camelCase version for UI
 */
export interface PolicyRule {
  kind: string;
  configuration: Record<string, any>;
  description?: string;
  priority?: number;
}

/**
 * Policy approval domain model - camelCase version for UI
 */
export interface PolicyApproval extends BaseModel {
  activityId: string;
  policyId: string;
  status: DfnsPolicyApprovalStatus;
  reason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  metadata?: Record<string, any>;
  // UI helper properties
  policyName?: string;
  activityDescription?: string;
  timeElapsed?: string;
  canApprove?: boolean;
  canReject?: boolean;
  // Compatibility field
  approvalId?: string;
}

// ===== Domain Webhook Types =====

/**
 * Webhook domain model - camelCase version for UI
 */
export interface Webhook extends BaseModel {
  name: string;
  url: string;
  description?: string;
  events: DfnsWebhookEvent[];
  status: DfnsWebhookStatus;
  secret?: string;
  headers?: Record<string, string>;
  externalId?: string;
  // UI helper properties
  lastDelivery?: string;
  successRate?: number;
  totalDeliveries?: number;
}

/**
 * Webhook delivery domain model - camelCase version for UI
 */
export interface WebhookDelivery extends BaseModel {
  webhookId: string;
  event: DfnsWebhookEvent;
  payload: Record<string, any>;
  status: DfnsWebhookDeliveryStatus;
  responseCode?: number;
  responseBody?: string;
  attempts: number;
  nextRetryAt?: string;
  deliveredAt?: string;
  // UI helper properties
  eventDescription?: string;
  duration?: number;
  payloadSize?: number;
}

// ===== Domain Integration Types =====

/**
 * Exchange integration domain model - camelCase version for UI
 */
export interface ExchangeIntegration extends BaseModel {
  name: string;
  exchangeKind: DfnsExchangeKind;
  credentials: Record<string, any>;
  status: DfnsIntegrationStatus;
  config?: Record<string, any>;
  lastSyncAt?: string;
  // UI helper properties
  exchangeDisplayName?: string;
  logoUrl?: string;
  supportedFeatures?: string[];
  accounts?: ExchangeAccount[];
}

/**
 * Exchange account domain model - camelCase version for UI
 */
export interface ExchangeAccount {
  id: string;
  exchangeId?: string;
  name: string; // Exchange account name
  type: string; // Exchange type (Kraken, Binance, etc.)
  exchangeType?: string; // Alternative naming for compatibility
  accountType?: string;
  status: string; // Account status (Active, Inactive, etc.)
  tradingEnabled: boolean;
  withdrawalEnabled?: boolean;
  sandbox: boolean; // Whether this is a sandbox/test environment
  balances?: ExchangeBalance[];
  lastUpdated?: string;
  // UI helper properties
  displayName?: string;
  totalValueUSD?: string;
  formattedLastUpdated?: string;
  // Additional compatibility properties
  credentials?: Record<string, any>;
  config?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Exchange balance domain model - camelCase version for UI
 */
export interface ExchangeBalance {
  asset: string;
  total: string;
  available: string;
  locked: string;
  onHold: string; // Amount currently on hold
  // UI helper properties
  formattedTotal?: string;
  formattedAvailable?: string;
  formattedLocked?: string;
  valueInUSD?: string;
}

/**
 * Enhanced exchange asset - re-export from core with compatibility
 */
export type { ExchangeAsset } from './core';

/**
 * Enhanced exchange deposit - re-export from core with compatibility
 */
export type { ExchangeDeposit } from './core';

/**
 * Staking integration domain model - camelCase version for UI
 */
export interface StakingIntegration extends BaseModel {
  walletId: string;
  network: DfnsNetwork;
  validatorAddress?: string;
  delegationAmount: string;
  status: DfnsStakingStatus;
  rewards?: StakingRewards;
  unstakingPeriod?: string;
  lastRewardAt?: string;
  // UI helper properties
  validatorName?: string;
  formattedDelegationAmount?: string;
  estimatedApr?: string;
  nextRewardDate?: string;
}

/**
 * Staking rewards domain model - camelCase version for UI
 */
export interface StakingRewards {
  totalRewards: string;
  pendingRewards: string;
  claimedRewards: string;
  lastClaimAt?: string;
  apr?: string;
  // UI helper properties
  formattedTotalRewards?: string;
  formattedPendingRewards?: string;
  formattedClaimedRewards?: string;
  rewardFrequency?: string;
}

// ===== Domain Fee Sponsor Types =====

/**
 * Fee sponsor domain model - camelCase version for UI
 */
export interface FeeSponsor extends BaseModel {
  name: string;
  sponsorAddress: string;
  network: DfnsNetwork;
  status: DfnsFeeSponsorStatus;
  balance: string;
  spentAmount: string;
  transactionCount: number;
  externalId?: string;
  // UI helper properties
  formattedBalance?: string;
  formattedSpentAmount?: string;
  utilizationPercentage?: number;
  estimatedTransactionsRemaining?: number;
}

/**
 * Sponsored fee domain model - camelCase version for UI
 */
export interface SponsoredFee extends BaseModel {
  feeSponsorId: string;
  walletId: string;
  txHash: string;
  amount: string;
  asset: string;
  status: string;
  sponsoredAt: string;
  // UI helper properties
  formattedAmount?: string;
  feeSponsorName?: string;
  walletName?: string;
}

// ===== Domain Validator Types =====

/**
 * Validator domain model - camelCase version for UI
 */
export interface Validator {
  address: string;
  name?: string;
  commission: string;
  delegatedAmount: string;
  status: DfnsValidatorStatus;
  apr?: string;
  uptime?: string;
  network: DfnsNetwork;
  // UI helper properties
  formattedCommission?: string;
  formattedDelegatedAmount?: string;
  formattedApr?: string;
  formattedUptime?: string;
  rank?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

// ===== Domain UI Helper Types =====

/**
 * Wallet creation request for UI
 */
export interface WalletCreationRequest {
  network: DfnsNetwork;
  name?: string;
  externalId?: string;
  tags?: string[];
  signingKeyId?: string; // Reuse existing key
  description?: string;
}

/**
 * DFNS Create Wallet Request
 */
export interface DfnsCreateWalletRequest {
  name: string;
  network: string;
  externalId?: string;
  tags?: string[];
  custodial?: boolean;
}

/**
 * DFNS Create Policy Request
 */
export interface DfnsCreatePolicyRequest {
  name: string;
  description?: string;
  rule: PolicyRule;
  activityKind: DfnsActivityKind;
  status?: DfnsPolicyStatus;
  externalId?: string;
}

/**
 * DFNS Create Transfer Request (alias for TransferRequest)
 */
export interface DfnsCreateTransferRequest extends TransferRequest {
  // Additional fields specific to creation
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * DFNS Transfer (alias for TransferResponse for backward compatibility)
 */
export interface DfnsTransfer extends TransferResponse {
  // Additional UI fields
  walletId?: string;
  networkDisplayName?: string;
}

/**
 * Key creation request for UI
 */
export interface KeyCreationRequest {
  network: DfnsNetwork;
  curve?: DfnsCurve;
  name?: string;
  externalId?: string;
  tags?: string[];
  description?: string;
}

/**
 * Dashboard metrics for DFNS overview
 */
export interface DfnsDashboardMetrics {
  totalWallets: number;
  totalKeys: number;
  totalTransactions: number;
  totalValue: string;
  activePolicies: number;
  pendingApprovals: number;
  recentActivity: TransactionHistory[];
  networkDistribution: Array<{
    network: DfnsNetwork;
    count: number;
    percentage: number;
  }>;
  monthlyTransactionVolume: Array<{
    month: string;
    volume: string;
    count: number;
  }>;
  // Enhanced metrics with new services
  totalStakingValue: string;
  totalExchangeAccounts: number;
  accountAbstractionEnabled: number;
  complianceScreenings: number;
}

/**
 * Activity log entry for DFNS operations
 */
export interface DfnsActivityLog extends BaseModel {
  activityType: string;
  entityId: string;
  entityType: string;
  description: string;
  userId?: string;
  userName?: string;
  status: 'success' | 'failed' | 'pending';
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Comprehensive wallet details for UI display
 */
export interface WalletDetails extends Wallet {
  balances: WalletBalance[];
  nfts: NFT[];
  transactions: TransactionHistory[];
  policies: Policy[];
  permissions: Permission[];
  stakingInfo?: StakingIntegration[];
  feeSponsor?: FeeSponsor;
  // Calculated fields
  totalValueUSD: string;
  transactionCount: number;
  lastActivityAt?: string;
  securityScore?: number;
}

// All types are already exported inline with their interface definitions above
