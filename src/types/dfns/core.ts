/**
 * DFNS Core Types - Core type definitions for DFNS wallet-as-a-service integration
 * 
 * This file contains the fundamental type definitions for DFNS API integration,
 * following the project's type system architecture patterns.
 */

import type { BaseModel } from '../core/centralModels';

// ===== Core DFNS Base Types =====

/**
 * Base DFNS response wrapper
 */
export interface DfnsResponse<T = any> {
  kind: string;
  data?: T;
  error?: DfnsError;
}

/**
 * DFNS error structure
 */
export interface DfnsError {
  code: string;
  message: string;
  path?: string;
  details?: Record<string, any>;
}

/**
 * DFNS pagination metadata
 */
export interface DfnsPagination {
  nextPageToken?: string;
  prevPageToken?: string;
  limit?: number;
  total?: number;
}

/**
 * Paginated DFNS response
 */
export interface DfnsPaginatedResponse<T> extends DfnsResponse<T[]> {
  pagination?: DfnsPagination;
}

// ===== Authentication Types =====

/**
 * DFNS Application configuration
 */
export interface DfnsApplication extends BaseModel {
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

export enum DfnsApplicationKind {
  ClientSide = 'ClientSide',
  ServerSide = 'ServerSide'
}

export enum DfnsApplicationStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Archived = 'Archived'
}

/**
 * DFNS User information
 */
export interface DfnsUser extends BaseModel {
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

export enum DfnsUserStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending',
  Suspended = 'Suspended'
}

export enum DfnsUserKind {
  EndUser = 'EndUser',
  Employee = 'Employee',
  PatientUser = 'PatientUser'
}

/**
 * DFNS Authentication credentials
 */
export interface DfnsCredential extends BaseModel {
  credentialId: string;
  name?: string;
  kind: DfnsCredentialKind;
  status: DfnsCredentialStatus;
  publicKey: string;
  algorithm: string;
  attestationType?: string;
  authenticatorInfo?: DfnsAuthenticatorInfo;
  enrolledAt: string;
  lastUsedAt?: string;
}

export interface DfnsAuthenticatorInfo {
  aaguid: string;
  credentialPublicKey: string;
  counter: number;
  credentialBackedUp?: boolean;
  credentialDeviceType?: string;
  transports?: string[];
}

export enum DfnsCredentialKind {
  Fido2 = 'Fido2',
  Key = 'Key',
  Password = 'Password',
  RecoveryKey = 'RecoveryKey'
}

export enum DfnsCredentialStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}

/**
 * Service Account for server-side authentication
 */
export interface DfnsServiceAccount extends BaseModel {
  name: string;
  status: DfnsServiceAccountStatus;
  externalId?: string;
  publicKey?: string;
  permissionAssignments?: DfnsPermissionAssignment[];
}

export enum DfnsServiceAccountStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}

/**
 * Personal Access Token
 */
export interface DfnsPersonalAccessToken extends BaseModel {
  name: string;
  status: DfnsPersonalAccessTokenStatus;
  expiresAt?: string;
  lastUsedAt?: string;
  permissionAssignments?: DfnsPermissionAssignment[];
}

export enum DfnsPersonalAccessTokenStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Expired = 'Expired'
}

// ===== Wallet Types =====

/**
 * DFNS Wallet
 */
export interface DfnsWallet extends BaseModel {
  walletId: string;
  network: DfnsNetwork;
  name?: string;
  address: string;
  signingKey: DfnsSigningKey;
  custodial: boolean;
  imported: boolean;
  exported: boolean;
  dateExported?: string;
  externalId?: string;
  tags?: string[];
  status: DfnsWalletStatus;
  delegated?: boolean;
  delegatedTo?: string;
}

export enum DfnsWalletStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}

/**
 * DFNS Signing Key
 */
export interface DfnsSigningKey extends BaseModel {
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

export enum DfnsKeyStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}

/**
 * Supported Networks
 */
export enum DfnsNetwork {
  // EVM Networks
  Ethereum = 'Ethereum',
  EthereumGoerli = 'EthereumGoerli',
  EthereumSepolia = 'EthereumSepolia',
  Polygon = 'Polygon',
  PolygonMumbai = 'PolygonMumbai',
  BinanceSmartChain = 'BinanceSmartChain',
  BinanceSmartChainTestnet = 'BinanceSmartChainTestnet',
  Arbitrum = 'Arbitrum',
  ArbitrumGoerli = 'ArbitrumGoerli',
  ArbitrumSepolia = 'ArbitrumSepolia',
  Optimism = 'Optimism',
  OptimismGoerli = 'OptimismGoerli',
  OptimismSepolia = 'OptimismSepolia',
  Avalanche = 'Avalanche',
  AvalancheFuji = 'AvalancheFuji',
  // Non-EVM Networks
  Bitcoin = 'Bitcoin',
  BitcoinTestnet3 = 'BitcoinTestnet3',
  Solana = 'Solana',
  SolanaDevnet = 'SolanaDevnet',
  Stellar = 'Stellar',
  StellarTestnet = 'StellarTestnet',
  Algorand = 'Algorand',
  AlgorandTestnet = 'AlgorandTestnet',
  Tezos = 'Tezos',
  TezosTestnet = 'TezosTestnet',
  Cardano = 'Cardano',
  CardanoTestnet = 'CardanoTestnet',
  XrpLedger = 'XrpLedger',
  XrpLedgerTestnet = 'XrpLedgerTestnet',
  Tron = 'Tron',
  TronTestnet = 'TronTestnet',
  Near = 'Near',
  NearTestnet = 'NearTestnet',
  Aptos = 'Aptos',
  AptosTestnet = 'AptosTestnet'
}

/**
 * Cryptographic curves supported by DFNS
 */
export enum DfnsCurve {
  Ed25519 = 'ed25519',
  Secp256k1 = 'secp256k1',
  Secp256r1 = 'secp256r1'
}

/**
 * Signature schemes
 */
export enum DfnsScheme {
  EdDSA = 'EdDSA',
  ECDSA = 'ECDSA'
}

/**
 * Asset information
 */
export interface DfnsAsset {
  symbol: string;
  decimals: number;
  verified: boolean;
  name?: string;
  logoUrl?: string;
  contractAddress?: string;
  nativeAsset?: boolean;
}

/**
 * Wallet balance
 */
export interface DfnsWalletBalance {
  asset: DfnsAsset;
  balance: string;
  valueInUSD?: string;
}

/**
 * NFT information
 */
export interface DfnsNFT {
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
 * Transaction history entry
 */
export interface DfnsTransactionHistory {
  txHash: string;
  direction: 'Incoming' | 'Outgoing';
  status: DfnsTransactionStatus;
  asset: DfnsAsset;
  amount: string;
  fee?: string;
  to?: string;
  from?: string;
  blockNumber?: number;
  blockHash?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export enum DfnsTransactionStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Failed = 'Failed',
  Cancelled = 'Cancelled'
}

// ===== Transfer & Transaction Types =====

/**
 * Transfer request
 */
export interface DfnsTransferRequest {
  to: string;
  amount: string;
  asset?: string; // For token transfers
  memo?: string;
  externalId?: string;
  nonce?: number;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * Transfer response
 */
export interface DfnsTransferResponse {
  id: string;
  status: DfnsTransferStatus;
  txHash?: string;
  fee?: string;
  dateCreated: string;
  dateBroadcast?: string;
  dateConfirmed?: string;
  estimatedConfirmationTime?: string;
}

export enum DfnsTransferStatus {
  Pending = 'Pending',
  Broadcasted = 'Broadcasted',
  Confirmed = 'Confirmed',
  Failed = 'Failed',
  Cancelled = 'Cancelled'
}

/**
 * Generic transaction broadcast request
 */
export interface DfnsBroadcastRequest {
  kind: DfnsTransactionKind;
  transaction: string; // Serialized transaction
  externalId?: string;
}

export enum DfnsTransactionKind {
  Evm = 'Evm',
  Bitcoin = 'Bitcoin',
  Solana = 'Solana',
  Stellar = 'Stellar',
  Algorand = 'Algorand',
  Tezos = 'Tezos',
  Cardano = 'Cardano',
  XrpLedger = 'XrpLedger',
  Tron = 'Tron',
  Near = 'Near',
  Aptos = 'Aptos'
}

// ===== Signature Types =====

/**
 * Signature request
 */
export interface DfnsSignatureRequest {
  kind: DfnsSignatureKind;
  message: string;
  externalId?: string;
}

export enum DfnsSignatureKind {
  Evm = 'Evm',
  Bitcoin = 'Bitcoin',
  Solana = 'Solana',
  Stellar = 'Stellar',
  Algorand = 'Algorand',
  Tezos = 'Tezos',
  Cardano = 'Cardano',
  XrpLedger = 'XrpLedger',
  Tron = 'Tron',
  Near = 'Near',
  Aptos = 'Aptos',
  Message = 'Message',
  Hash = 'Hash'
}

/**
 * Signature response
 */
export interface DfnsSignatureResponse {
  id: string;
  status: DfnsSignatureStatus;
  signature?: string;
  publicKey: string;
  dateCreated: string;
  dateCompleted?: string;
}

export enum DfnsSignatureStatus {
  Pending = 'Pending',
  Signed = 'Signed',
  Failed = 'Failed',
  Cancelled = 'Cancelled'
}

// ===== Permission & Policy Types =====

/**
 * DFNS Permission
 */
export interface DfnsPermission extends BaseModel {
  name: string;
  resources: string[];
  operations: string[];
  effect: DfnsPermissionEffect;
  condition?: Record<string, any>;
  status: DfnsPermissionStatus;
}

export enum DfnsPermissionEffect {
  Allow = 'Allow',
  Deny = 'Deny'
}

export enum DfnsPermissionStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}

/**
 * Permission assignment
 */
export interface DfnsPermissionAssignment extends BaseModel {
  permissionId: string;
  identityId: string;
  identityKind: DfnsIdentityKind;
  assignedBy: string;
  assignedAt: string;
}

export enum DfnsIdentityKind {
  User = 'User',
  ServiceAccount = 'ServiceAccount',
  PersonalAccessToken = 'PersonalAccessToken'
}

/**
 * DFNS Policy
 */
export interface DfnsPolicy extends BaseModel {
  name: string;
  description?: string;
  rule: DfnsPolicyRule;
  activityKind: DfnsActivityKind;
  status: DfnsPolicyStatus;
  externalId?: string;
}

export enum DfnsPolicyStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}

/**
 * Policy rule structure
 */
export interface DfnsPolicyRule {
  kind: DfnsPolicyRuleKind;
  configuration: Record<string, any>;
}

export enum DfnsPolicyRuleKind {
  AlwaysActivated = 'AlwaysActivated',
  TransactionAmountLimit = 'TransactionAmountLimit',
  TransactionAmountVelocity = 'TransactionAmountVelocity',
  TransactionCountVelocity = 'TransactionCountVelocity',
  TransactionRecipientWhitelist = 'TransactionRecipientWhitelist',
  ChainalysisTransactionPrescreening = 'ChainalysisTransactionPrescreening',
  ChainalysisTransactionScreening = 'ChainalysisTransactionScreening'
}

/**
 * Activity kinds that policies can be applied to
 */
export enum DfnsActivityKind {
  WalletCreation = 'Wallets:Create',
  WalletReading = 'Wallets:Read',
  WalletUpdate = 'Wallets:Update',
  WalletDelegate = 'Wallets:Delegate',
  WalletExport = 'Wallets:Export',
  WalletImport = 'Wallets:Import',
  TransferAsset = 'Wallets:TransferAsset',
  BroadcastTransaction = 'Wallets:BroadcastTransaction',
  KeyCreation = 'Keys:Create',
  KeyReading = 'Keys:Read',
  KeyDelegate = 'Keys:Delegate',
  KeyExport = 'Keys:Export',
  KeyImport = 'Keys:Import',
  KeyGenerateSignature = 'Keys:GenerateSignature'
}

/**
 * Policy approval
 */
export interface DfnsPolicyApproval extends BaseModel {
  activityId: string;
  policyId: string;
  status: DfnsPolicyApprovalStatus;
  reason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  metadata?: Record<string, any>;
}

export enum DfnsPolicyApprovalStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Failed = 'Failed'
}

// ===== Webhook Types =====

/**
 * DFNS Webhook configuration
 */
export interface DfnsWebhook extends BaseModel {
  name: string;
  url: string;
  description?: string;
  events: DfnsWebhookEvent[];
  status: DfnsWebhookStatus;
  secret?: string;
  headers?: Record<string, string>;
  externalId?: string;
}

export enum DfnsWebhookStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}

/**
 * Webhook event types
 */
export enum DfnsWebhookEvent {
  // Wallet events
  WalletCreated = 'wallet.created',
  WalletUpdated = 'wallet.updated',
  WalletDelegated = 'wallet.delegated',
  WalletExported = 'wallet.exported',
  WalletImported = 'wallet.imported',
  
  // Transfer events
  TransferInitiated = 'transfer.initiated',
  TransferBroadcasted = 'transfer.broadcasted',
  TransferConfirmed = 'transfer.confirmed',
  TransferFailed = 'transfer.failed',
  
  // Transaction events
  TransactionBroadcasted = 'transaction.broadcasted',
  TransactionConfirmed = 'transaction.confirmed',
  TransactionFailed = 'transaction.failed',
  
  // Signature events
  SignatureInitiated = 'signature.initiated',
  SignatureSigned = 'signature.signed',
  SignatureFailed = 'signature.failed',
  
  // Policy events
  PolicyApprovalPending = 'policy.approval.pending',
  PolicyApprovalApproved = 'policy.approval.approved',
  PolicyApprovalRejected = 'policy.approval.rejected',
  
  // User events
  UserRegistered = 'user.registered',
  UserActivated = 'user.activated',
  UserDeactivated = 'user.deactivated',
  
  // Key events
  KeyCreated = 'key.created',
  KeyDelegated = 'key.delegated',
  KeyExported = 'key.exported',
  KeyImported = 'key.imported'
}

/**
 * Webhook event delivery
 */
export interface DfnsWebhookDelivery extends BaseModel {
  webhookId: string;
  event: DfnsWebhookEvent;
  payload: Record<string, any>;
  status: DfnsWebhookDeliveryStatus;
  responseCode?: number;
  responseBody?: string;
  attempts: number;
  nextRetryAt?: string;
  deliveredAt?: string;
}

/**
 * Enhanced webhook event with additional properties
 */
export interface DfnsWebhookEventData extends BaseModel {
  type: DfnsWebhookEvent;
  source: string; // Source of the event
  data: Record<string, any>;
  processed: boolean; // Whether the event has been processed
  webhookCount: number; // Number of webhooks this event was sent to
  createdAt: string; // Event creation timestamp
}

export enum DfnsWebhookDeliveryStatus {
  Pending = 'Pending',
  Delivered = 'Delivered',
  Failed = 'Failed',
  Retrying = 'Retrying'
}

// ===== Integration Types =====

/**
 * Exchange integration
 */
export interface DfnsExchangeIntegration extends BaseModel {
  name: string;
  exchangeKind: DfnsExchangeKind;
  credentials: Record<string, any>;
  status: DfnsIntegrationStatus;
  config?: Record<string, any>;
  lastSyncAt?: string;
}

export enum DfnsExchangeKind {
  Kraken = 'Kraken',
  Binance = 'Binance',
  CoinbasePrime = 'CoinbasePrime'
}

export enum DfnsIntegrationStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Error = 'Error'
}

/**
 * Exchange account
 */
export interface DfnsExchangeAccount {
  id: string;
  exchangeId: string;
  accountType: string;
  type: string; // Exchange type identifier
  balances: DfnsExchangeBalance[];
  tradingEnabled: boolean;
  withdrawalEnabled: boolean;
  sandbox: boolean; // Whether this is a sandbox/test environment
  lastUpdated: string;
}

/**
 * Exchange balance
 */
export interface DfnsExchangeBalance {
  asset: string;
  total: string;
  available: string;
  locked: string;
  onHold: string; // Amount currently on hold
  usdValue: string; // USD value of the balance
}

/**
 * Staking integration
 */
export interface DfnsStakingIntegration extends BaseModel {
  walletId: string;
  network: DfnsNetwork;
  validatorAddress?: string;
  delegationAmount: string;
  status: DfnsStakingStatus;
  rewards?: DfnsStakingRewards;
  unstakingPeriod?: string;
  lastRewardAt?: string;
}

export enum DfnsStakingStatus {
  Delegated = 'Delegated',
  Undelegating = 'Undelegating',
  Undelegated = 'Undelegated',
  Slashed = 'Slashed'
}

/**
 * Staking rewards
 */
export interface DfnsStakingRewards {
  totalRewards: string;
  pendingRewards: string;
  claimedRewards: string;
  lastClaimAt?: string;
  apr?: string;
}

// ===== Fee Sponsor Types =====

/**
 * Fee sponsor configuration
 */
export interface DfnsFeeSponsor extends BaseModel {
  name: string;
  sponsorAddress: string;
  network: DfnsNetwork;
  status: DfnsFeeSponsorStatus;
  balance: string;
  spentAmount: string;
  transactionCount: number;
  externalId?: string;
}

export enum DfnsFeeSponsorStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Depleted = 'Depleted'
}

/**
 * Sponsored fee entry
 */
export interface DfnsSponsoredFee extends BaseModel {
  feeSponsorId: string;
  walletId: string;
  txHash: string;
  amount: string;
  asset: string;
  status: DfnsSponsoredFeeStatus;
  sponsoredAt: string;
}

export enum DfnsSponsoredFeeStatus {
  Pending = 'Pending',
  Sponsored = 'Sponsored',
  Failed = 'Failed'
}

// ===== Validator Types =====

/**
 * Network validator information
 */
export interface DfnsValidator {
  address: string;
  name?: string;
  commission: string;
  delegatedAmount: string;
  status: DfnsValidatorStatus;
  apr?: string;
  uptime?: string;
  network: DfnsNetwork;
}

export enum DfnsValidatorStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Jailed = 'Jailed'
}

// ===== Error Handling Types =====

/**
 * Comprehensive error context for debugging
 */
export interface DfnsErrorContext {
  endpoint: string;
  method: string;
  requestId?: string;
  timestamp: string;
  userAgent?: string;
  clientVersion?: string;
  idempotencyKey?: string; // Idempotency key for the request
}

/**
 * Enhanced error with context
 */
export interface DfnsEnhancedError extends DfnsError {
  context?: DfnsErrorContext;
  statusCode?: number;
  retryable?: boolean;
}

// ===== Configuration Types =====

/**
 * DFNS client configuration
 */
export interface DfnsClientConfig {
  baseUrl: string;
  appId: string;
  authToken?: string;
  timeout?: number;
  retryConfig?: DfnsRetryConfig;
  logging?: DfnsLoggingConfig;
  idempotency?: Partial<IdempotencyConfig>; // Idempotency configuration
}

/**
 * Idempotency configuration for request deduplication
 */
export interface IdempotencyConfig {
  enabled: boolean;
  storagePrefix: string;
  ttlMs: number; // Time to live for idempotency keys
  autoGenerate: boolean; // Auto-generate keys for mutating requests
}

/**
 * Stored idempotent request information
 */
export interface IdempotentRequest {
  key: string;
  method: string;
  endpoint: string;
  bodyHash: string;
  timestamp: number;
  response?: any;
  status?: number;
}

export interface DfnsRetryConfig {
  enabled: boolean;
  maxAttempts: number;
  backoffFactor: number;
  maxDelay: number;
}

export interface DfnsLoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

// ===== Enhanced Types for Components =====

/**
 * Enhanced exchange asset with additional properties
 */
export interface ExchangeAsset {
  symbol: string;
  name: string;
  balance: string;
  available: string;
  locked: string;
  onHold: string; // Amount currently on hold
  total: string; // Total balance (available + locked)
  usdValue?: string; // USD value of the balance
  precision: number;
  minimumWithdrawal: string;
  withdrawalFee: string;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
}

/**
 * Enhanced exchange account with all required properties
 */
export interface EnhancedExchangeAccount {
  id: string;
  exchangeType: string;
  name: string;
  type: string; // Exchange type identifier
  credentials: Record<string, any>;
  status: string;
  config: Record<string, any>;
  tradingEnabled: boolean; // Whether trading is enabled
  sandbox: boolean; // Whether this is a sandbox/test environment
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Enhanced exchange deposit with all required properties  
 */
export interface ExchangeDeposit {
  id: string;
  exchangeId: string; // ID of the exchange this deposit belongs to
  exchangeAccountId: string;
  asset: string;
  amount: string;
  address: string;
  txHash?: string;
  status: string;
  networkFee?: string;
  exchangeFee?: string;
  memo?: string;
  dateCreated: string;
  dateCompleted?: string;
}

/**
 * Enhanced stake position with all required properties
 */
export interface StakePosition {
  id: string;
  provider: string;
  providerStakeId: string;
  walletId: string;
  protocol: string;
  network: string;
  status: string;
  amount: string;
  asset: string;
  apr: string; // Annual Percentage Rate
  rewards: string; // Current reward amount
  validator?: string;
  delegator?: string;
  duration?: number;
  startDate: string;
  endDate?: string;
  estimatedRewards: string;
  actualRewards: string;
  annualPercentageRate: string;
  metadata?: Record<string, any>;
  dateCreated: string;
  dateUpdated: string;
}

/**
 * Enhanced validator info with all required properties
 */
export interface ValidatorInfo {
  id: string;
  network: string;
  address: string;
  name?: string;
  commission: string;
  totalStaked: string;
  delegatedAmount: string; // Total amount delegated to this validator
  delegatorCount: number;
  uptime: string;
  apr: string;
  status: string;
  metadata?: Record<string, any>;
}

/**
 * Enhanced staking reward with all required properties
 */
export interface StakingReward {
  id: string;
  stakeId: string;
  amount: string;
  asset: string;
  network: string; // Network where rewards were earned
  rewardType: string;
  periodStart: string;
  periodEnd: string;
  claimed: boolean;
  claimTxHash?: string;
  dateEarned: string;
  dateClaimed?: string;
}

/**
 * Enhanced staking strategy with all required properties
 */
export interface StakingStrategy {
  id: string;
  name: string;
  description: string;
  networks: string[];
  supportedNetworks: string[]; // Networks supported by this strategy
  minStakeAmount: string;
  expectedApr: string;
  annualizedReturn: string; // Expected annualized return
  riskLevel: string;
  riskScore: string; // Risk score (0-10)
  autoCompound: boolean;
  validators: string[];
  rebalanceFrequency: number;
  config: Record<string, any>;
}

/**
 * Enhanced webhook event with all required properties
 */
export interface WebhookEvent {
  id: string;
  type: string;
  source: string; // Source of the event
  timestamp: string;
  data: Record<string, any>;
  webhookIds: string[];
  processed: boolean; // Whether the event has been processed
  webhookCount: number; // Number of webhooks this event was sent to
  createdAt: string; // Event creation timestamp
  processingStatus: string;
}

/**
 * Enhanced dashboard metrics with all required properties
 */
export interface DfnsDashboardMetrics {
  totalWallets: number;
  totalTransactions: number;
  totalVolume: string;
  activeUsers: number;
  totalStakingValue: string; // Total value staked across all positions
  pendingTransactions: number;
  successRate: number;
  averageTransactionTime: number;
  networkDistribution: Record<string, number>;
  assetDistribution: Record<string, string>;
}

/**
 * Service account token with expiration
 */
export interface ServiceAccountToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string; // Token expiration timestamp
  scope?: string;
  refreshToken?: string;
}

// All types are already exported inline with their declarations above
