/**
 * DFNS Type Mappers - Functions to convert between database and domain types
 * 
 * These mappers handle the conversion between snake_case database types and
 * camelCase domain types, following the project's type system architecture.
 */

import type {
  DfnsApplicationsTable,
  DfnsUsersTable,
  DfnsCredentialsTable,
  DfnsWalletsTable,
  DfnsSigningKeysTable,
  DfnsWalletBalancesTable,
  DfnsTransactionHistoryTable,
  DfnsTransfersTable,
  DfnsSignaturesTable,
  DfnsPermissionsTable,
  DfnsPermissionAssignmentsTable,
  DfnsPoliciesTable,
  DfnsPolicyApprovalsTable,
  DfnsWebhooksTable,
  DfnsWebhookDeliveriesTable,
  DfnsExchangeIntegrationsTable,
  DfnsStakingIntegrationsTable,
  DfnsFeeSponorsTable,
  DfnsValidatorsTable,
  DfnsActivityLogsTable
} from './database';

import type {
  Application,
  User,
  Credential,
  Wallet,
  SigningKey,
  WalletBalance,
  TransactionHistory,
  TransferRequest,
  TransferResponse,
  SignatureRequest,
  SignatureResponse,
  Permission,
  PermissionAssignment,
  Policy,
  PolicyApproval,
  Webhook,
  WebhookDelivery,
  ExchangeIntegration,
  StakingIntegration,
  FeeSponsor,
  Validator,
  DfnsActivityLog,
  Asset,
  AuthenticatorInfo
} from './domain';

import type {
  DfnsApplicationKind,
  DfnsApplicationStatus,
  DfnsUserStatus,
  DfnsUserKind,
  DfnsCredentialKind,
  DfnsCredentialStatus,
  DfnsNetwork,
  DfnsCurve,
  DfnsScheme,
  DfnsWalletStatus,
  DfnsKeyStatus,
  DfnsTransferStatus,
  DfnsSignatureStatus,
  DfnsPermissionEffect,
  DfnsPermissionStatus,
  DfnsPolicyStatus,
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

// ===== Application Mappers =====

/**
 * Convert database application to domain application
 */
export function mapApplicationToDomain(dbApp: DfnsApplicationsTable): Application {
  return {
    id: dbApp.id,
    appId: dbApp.app_id,
    name: dbApp.name,
    description: dbApp.description,
    kind: dbApp.kind as DfnsApplicationKind,
    origin: dbApp.origin,
    relyingParty: dbApp.relying_party,
    status: dbApp.status as DfnsApplicationStatus,
    externalId: dbApp.external_id,
    logoUrl: dbApp.logo_url,
    termsOfServiceUrl: dbApp.terms_of_service_url,
    privacyPolicyUrl: dbApp.privacy_policy_url,
    createdAt: dbApp.created_at,
    updatedAt: dbApp.updated_at
  };
}

/**
 * Convert domain application to database application
 */
export function mapApplicationToDatabase(domainApp: Application): Omit<DfnsApplicationsTable, 'created_at' | 'updated_at'> {
  return {
    id: domainApp.id,
    app_id: domainApp.appId,
    name: domainApp.name,
    description: domainApp.description,
    kind: domainApp.kind,
    origin: domainApp.origin,
    relying_party: domainApp.relyingParty,
    status: domainApp.status,
    external_id: domainApp.externalId,
    logo_url: domainApp.logoUrl,
    terms_of_service_url: domainApp.termsOfServiceUrl,
    privacy_policy_url: domainApp.privacyPolicyUrl
  };
}

// ===== User Mappers =====

/**
 * Convert database user to domain user
 */
export function mapUserToDomain(dbUser: DfnsUsersTable): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    status: dbUser.status as DfnsUserStatus,
    kind: dbUser.kind as DfnsUserKind,
    externalId: dbUser.external_id,
    publicKey: dbUser.public_key,
    recoverySetup: dbUser.recovery_setup,
    mfaEnabled: dbUser.mfa_enabled,
    lastLoginAt: dbUser.last_login_at,
    registeredAt: dbUser.registered_at,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at
  };
}

/**
 * Convert domain user to database user
 */
export function mapUserToDatabase(domainUser: User): Omit<DfnsUsersTable, 'created_at' | 'updated_at'> {
  return {
    id: domainUser.id,
    username: domainUser.username,
    email: domainUser.email,
    status: domainUser.status,
    kind: domainUser.kind,
    external_id: domainUser.externalId,
    public_key: domainUser.publicKey,
    recovery_setup: domainUser.recoverySetup,
    mfa_enabled: domainUser.mfaEnabled,
    last_login_at: domainUser.lastLoginAt,
    registered_at: domainUser.registeredAt
  };
}

// ===== Credential Mappers =====

/**
 * Convert database credential to domain credential
 */
export function mapCredentialToDomain(dbCredential: DfnsCredentialsTable): Credential {
  return {
    id: dbCredential.id,
    credentialId: dbCredential.credential_id,
    name: dbCredential.name,
    kind: dbCredential.kind as DfnsCredentialKind,
    status: dbCredential.status as DfnsCredentialStatus,
    publicKey: dbCredential.public_key,
    algorithm: dbCredential.algorithm,
    attestationType: dbCredential.attestation_type,
    authenticatorInfo: dbCredential.authenticator_info as unknown as AuthenticatorInfo,
    enrolledAt: dbCredential.enrolled_at,
    lastUsedAt: dbCredential.last_used_at,
    createdAt: dbCredential.created_at,
    updatedAt: dbCredential.updated_at
  };
}

/**
 * Convert domain credential to database credential
 */
export function mapCredentialToDatabase(domainCredential: Credential): Omit<DfnsCredentialsTable, 'created_at' | 'updated_at'> {
  return {
    id: domainCredential.id,
    credential_id: domainCredential.credentialId,
    user_id: '', // This should be provided separately
    name: domainCredential.name,
    kind: domainCredential.kind,
    status: domainCredential.status,
    public_key: domainCredential.publicKey,
    algorithm: domainCredential.algorithm,
    attestation_type: domainCredential.attestationType,
    authenticator_info: domainCredential.authenticatorInfo as any,
    enrolled_at: domainCredential.enrolledAt,
    last_used_at: domainCredential.lastUsedAt
  };
}

// ===== Wallet Mappers =====

/**
 * Convert database wallet to domain wallet
 */
export function mapWalletToDomain(dbWallet: DfnsWalletsTable): Wallet {
  return {
    id: dbWallet.id,
    walletId: dbWallet.wallet_id,
    network: dbWallet.network as DfnsNetwork,
    name: dbWallet.name,
    address: dbWallet.address,
    signingKey: {
      id: dbWallet.signing_key_id,
      keyId: dbWallet.signing_key_id,
      publicKey: '', // This would need to be joined from signing_keys table
      network: dbWallet.network as DfnsNetwork,
      curve: 'secp256k1' as DfnsCurve, // Default, should come from join
      scheme: 'ECDSA' as DfnsScheme, // Default, should come from join
      status: 'Active' as DfnsKeyStatus, // Default, should come from join
      imported: false, // Default, should come from join
      exported: false, // Default, should come from join
      createdAt: dbWallet.created_at,
      updatedAt: dbWallet.updated_at
    },
    custodial: dbWallet.custodial,
    imported: dbWallet.imported,
    exported: dbWallet.exported,
    dateExported: dbWallet.date_exported,
    externalId: dbWallet.external_id,
    tags: dbWallet.tags,
    status: dbWallet.status as DfnsWalletStatus,
    delegated: dbWallet.delegated,
    delegatedTo: dbWallet.delegated_to,
    createdAt: dbWallet.created_at,
    updatedAt: dbWallet.updated_at
  };
}

/**
 * Convert domain wallet to database wallet
 */
export function mapWalletToDatabase(domainWallet: Wallet): Omit<DfnsWalletsTable, 'created_at' | 'updated_at'> {
  return {
    id: domainWallet.id,
    wallet_id: domainWallet.walletId,
    network: domainWallet.network,
    name: domainWallet.name,
    address: domainWallet.address,
    signing_key_id: domainWallet.signingKey.keyId,
    custodial: domainWallet.custodial,
    imported: domainWallet.imported,
    exported: domainWallet.exported,
    date_exported: domainWallet.dateExported,
    external_id: domainWallet.externalId,
    tags: domainWallet.tags,
    status: domainWallet.status,
    delegated: domainWallet.delegated,
    delegated_to: domainWallet.delegatedTo,
    dfns_wallet_id: domainWallet.walletId // Use walletId as DFNS ID
  };
}

// ===== Signing Key Mappers =====

/**
 * Convert database signing key to domain signing key
 */
export function mapSigningKeyToDomain(dbKey: DfnsSigningKeysTable): SigningKey {
  return {
    id: dbKey.id,
    keyId: dbKey.key_id,
    publicKey: dbKey.public_key,
    network: dbKey.network as DfnsNetwork,
    curve: dbKey.curve as DfnsCurve,
    scheme: dbKey.scheme as DfnsScheme,
    status: dbKey.status as DfnsKeyStatus,
    delegated: dbKey.delegated,
    delegatedTo: dbKey.delegated_to,
    externalId: dbKey.external_id,
    tags: dbKey.tags,
    imported: dbKey.imported,
    exported: dbKey.exported,
    dateExported: dbKey.date_exported,
    createdAt: dbKey.created_at,
    updatedAt: dbKey.updated_at
  };
}

/**
 * Convert domain signing key to database signing key
 */
export function mapSigningKeyToDatabase(domainKey: SigningKey): Omit<DfnsSigningKeysTable, 'created_at' | 'updated_at'> {
  return {
    id: domainKey.id,
    key_id: domainKey.keyId,
    public_key: domainKey.publicKey,
    network: domainKey.network,
    curve: domainKey.curve,
    scheme: domainKey.scheme,
    status: domainKey.status,
    delegated: domainKey.delegated,
    delegated_to: domainKey.delegatedTo,
    external_id: domainKey.externalId,
    tags: domainKey.tags,
    imported: domainKey.imported,
    exported: domainKey.exported,
    date_exported: domainKey.dateExported,
    dfns_key_id: domainKey.keyId // Use keyId as DFNS ID
  };
}

// ===== Balance Mappers =====

/**
 * Convert database wallet balance to domain wallet balance
 */
export function mapWalletBalanceToDomain(dbBalance: DfnsWalletBalancesTable): WalletBalance {
  const asset: Asset = {
    symbol: dbBalance.asset_symbol,
    decimals: dbBalance.decimals,
    verified: dbBalance.verified,
    name: dbBalance.asset_name,
    contractAddress: dbBalance.contract_address,
    nativeAsset: dbBalance.native_asset
  };

  return {
    asset,
    balance: dbBalance.balance,
    valueInUSD: dbBalance.value_in_usd,
    formattedBalance: formatBalance(dbBalance.balance, dbBalance.decimals)
  };
}

/**
 * Convert domain wallet balance to database wallet balance
 */
export function mapWalletBalanceToDatabase(
  walletId: string,
  domainBalance: WalletBalance
): Omit<DfnsWalletBalancesTable, 'id' | 'created_at' | 'updated_at'> {
  return {
    wallet_id: walletId,
    asset_symbol: domainBalance.asset.symbol,
    asset_name: domainBalance.asset.name,
    contract_address: domainBalance.asset.contractAddress,
    balance: domainBalance.balance,
    value_in_usd: domainBalance.valueInUSD,
    decimals: domainBalance.asset.decimals,
    verified: domainBalance.asset.verified,
    native_asset: domainBalance.asset.nativeAsset,
    last_updated: new Date().toISOString()
  };
}

// ===== Transaction History Mappers =====

/**
 * Convert database transaction history to domain transaction history
 */
export function mapTransactionHistoryToDomain(dbTx: DfnsTransactionHistoryTable): TransactionHistory {
  const asset: Asset = {
    symbol: dbTx.asset_symbol,
    decimals: 18, // Default, should be stored in asset table
    verified: true, // Default, should be stored in asset table
    name: dbTx.asset_name,
    contractAddress: dbTx.contract_address
  };

  return {
    txHash: dbTx.tx_hash,
    direction: dbTx.direction,
    status: dbTx.status as any,
    asset,
    amount: dbTx.amount,
    formattedAmount: formatBalance(dbTx.amount, asset.decimals),
    fee: dbTx.fee,
    formattedFee: dbTx.fee ? formatBalance(dbTx.fee, asset.decimals) : undefined,
    to: dbTx.to_address,
    from: dbTx.from_address,
    blockNumber: dbTx.block_number,
    blockHash: dbTx.block_hash,
    timestamp: dbTx.timestamp,
    formattedTimestamp: formatTimestamp(dbTx.timestamp),
    metadata: dbTx.metadata as Record<string, any>
  };
}

// ===== Transfer Mappers =====

/**
 * Convert database transfer to domain transfer response
 */
export function mapTransferToDomain(dbTransfer: DfnsTransfersTable): TransferResponse {
  return {
    id: dbTransfer.transfer_id,
    status: dbTransfer.status as DfnsTransferStatus,
    txHash: dbTransfer.tx_hash,
    fee: dbTransfer.fee,
    formattedFee: dbTransfer.fee ? formatBalance(dbTransfer.fee, 18) : undefined,
    dateCreated: dbTransfer.date_created,
    dateBroadcast: dbTransfer.date_broadcast,
    dateConfirmed: dbTransfer.date_confirmed,
    estimatedConfirmationTime: dbTransfer.estimated_confirmation_time,
    progress: calculateTransferProgress(dbTransfer.status)
  };
}

/**
 * Convert domain transfer request to database transfer
 */
export function mapTransferRequestToDatabase(
  walletId: string,
  transferId: string,
  request: TransferRequest
): Omit<DfnsTransfersTable, 'id' | 'created_at' | 'updated_at'> {
  return {
    transfer_id: transferId,
    wallet_id: walletId,
    to_address: request.to,
    amount: request.amount,
    asset: request.asset,
    memo: request.memo,
    external_id: request.externalId,
    nonce: request.nonce,
    gas_limit: request.gasLimit,
    gas_price: request.gasPrice,
    max_fee_per_gas: request.maxFeePerGas,
    max_priority_fee_per_gas: request.maxPriorityFeePerGas,
    status: 'Pending',
    date_created: new Date().toISOString(),
    dfns_transfer_id: transferId
  };
}

// ===== Signature Mappers =====

/**
 * Convert database signature to domain signature response
 */
export function mapSignatureToDomain(dbSignature: DfnsSignaturesTable): SignatureResponse {
  return {
    id: dbSignature.signature_id,
    status: dbSignature.status as DfnsSignatureStatus,
    signature: dbSignature.signature,
    publicKey: dbSignature.public_key,
    dateCreated: dbSignature.date_created,
    dateCompleted: dbSignature.date_completed
  };
}

// ===== Permission Mappers =====

/**
 * Convert database permission to domain permission
 */
export function mapPermissionToDomain(dbPermission: DfnsPermissionsTable): Permission {
  return {
    id: dbPermission.id,
    name: dbPermission.name,
    resources: dbPermission.resources,
    operations: dbPermission.operations,
    effect: dbPermission.effect as DfnsPermissionEffect,
    condition: dbPermission.condition as Record<string, any>,
    status: dbPermission.status as DfnsPermissionStatus,
    description: dbPermission.description,
    category: dbPermission.category,
    createdAt: dbPermission.created_at,
    updatedAt: dbPermission.updated_at
  };
}

// ===== Policy Mappers =====

/**
 * Convert database policy to domain policy
 */
export function mapPolicyToDomain(dbPolicy: DfnsPoliciesTable): Policy {
  return {
    id: dbPolicy.id,
    name: dbPolicy.name,
    description: dbPolicy.description,
    rule: dbPolicy.rule as any,
    activityKind: dbPolicy.activity_kind as any,
    status: dbPolicy.status as DfnsPolicyStatus,
    externalId: dbPolicy.external_id,
    createdAt: dbPolicy.created_at,
    updatedAt: dbPolicy.updated_at
  };
}

// ===== Webhook Mappers =====

/**
 * Convert database webhook to domain webhook
 */
export function mapWebhookToDomain(dbWebhook: DfnsWebhooksTable): Webhook {
  return {
    id: dbWebhook.id,
    name: dbWebhook.name,
    url: dbWebhook.url,
    description: dbWebhook.description,
    events: dbWebhook.events as DfnsWebhookEvent[],
    status: dbWebhook.status as DfnsWebhookStatus,
    secret: dbWebhook.secret,
    headers: dbWebhook.headers as Record<string, string>,
    externalId: dbWebhook.external_id,
    createdAt: dbWebhook.created_at,
    updatedAt: dbWebhook.updated_at
  };
}

// ===== Activity Log Mappers =====

/**
 * Convert database activity log to domain activity log
 */
export function mapActivityLogToDomain(dbLog: DfnsActivityLogsTable): DfnsActivityLog {
  return {
    id: dbLog.id,
    activityType: dbLog.activity_type,
    entityId: dbLog.entity_id,
    entityType: dbLog.entity_type,
    description: dbLog.description,
    userId: dbLog.user_id,
    status: dbLog.status,
    metadata: dbLog.metadata as Record<string, any>,
    ipAddress: dbLog.ip_address,
    userAgent: dbLog.user_agent,
    createdAt: dbLog.created_at,
    updatedAt: dbLog.updated_at
  };
}

// ===== Helper Functions =====

/**
 * Format balance with proper decimal places
 */
function formatBalance(balance: string, decimals: number): string {
  const value = parseFloat(balance) / Math.pow(10, decimals);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(decimals, 8)
  });
}

/**
 * Format timestamp to human-readable format
 */
function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate transfer progress percentage
 */
function calculateTransferProgress(status: string): number {
  switch (status) {
    case 'Pending':
      return 25;
    case 'Broadcasted':
      return 75;
    case 'Confirmed':
      return 100;
    case 'Failed':
    case 'Cancelled':
      return 0;
    default:
      return 0;
  }
}

// ===== DFNS API Response Mappers =====

/**
 * Map DFNS API wallet response to domain wallet
 */
export function mapDfnsWalletResponseToDomain(dfnsWallet: any): Wallet {
  return {
    id: dfnsWallet.id || '',
    walletId: dfnsWallet.id,
    network: dfnsWallet.network,
    name: dfnsWallet.name,
    address: dfnsWallet.address,
    signingKey: {
      id: dfnsWallet.signingKey?.keyId || '',
      keyId: dfnsWallet.signingKey?.keyId || '',
      publicKey: dfnsWallet.signingKey?.publicKey || '',
      network: dfnsWallet.network,
      curve: dfnsWallet.signingKey?.curve || 'secp256k1',
      scheme: dfnsWallet.signingKey?.scheme || 'ECDSA',
      status: 'Active' as DfnsKeyStatus,
      imported: false,
      exported: false,
      createdAt: dfnsWallet.dateCreated || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    custodial: dfnsWallet.custodial || false,
    imported: dfnsWallet.imported || false,
    exported: dfnsWallet.exported || false,
    dateExported: dfnsWallet.dateExported,
    externalId: dfnsWallet.externalId,
    tags: dfnsWallet.tags || [],
    status: dfnsWallet.status || 'Active',
    delegated: dfnsWallet.delegated || false,
    delegatedTo: dfnsWallet.delegatedTo,
    createdAt: dfnsWallet.dateCreated || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Map DFNS API balance response to domain wallet balance
 */
export function mapDfnsBalanceResponseToDomain(dfnsBalance: any): WalletBalance {
  const asset: Asset = {
    symbol: dfnsBalance.asset.symbol,
    decimals: dfnsBalance.asset.decimals,
    verified: dfnsBalance.asset.verified || false,
    name: dfnsBalance.asset.name,
    contractAddress: dfnsBalance.asset.contractAddress,
    nativeAsset: dfnsBalance.asset.nativeAsset
  };

  return {
    asset,
    balance: dfnsBalance.balance,
    valueInUSD: dfnsBalance.valueInUSD,
    formattedBalance: formatBalance(dfnsBalance.balance, asset.decimals)
  };
}

/**
 * Map DFNS API transaction response to domain transaction history
 */
export function mapDfnsTransactionResponseToDomain(dfnsTransaction: any): TransactionHistory {
  const asset: Asset = {
    symbol: dfnsTransaction.asset?.symbol || 'ETH',
    decimals: dfnsTransaction.asset?.decimals || 18,
    verified: dfnsTransaction.asset?.verified || false,
    name: dfnsTransaction.asset?.name,
    contractAddress: dfnsTransaction.asset?.contractAddress
  };

  return {
    txHash: dfnsTransaction.txHash,
    direction: dfnsTransaction.direction,
    status: dfnsTransaction.status,
    asset,
    amount: dfnsTransaction.amount,
    formattedAmount: formatBalance(dfnsTransaction.amount, asset.decimals),
    fee: dfnsTransaction.fee,
    formattedFee: dfnsTransaction.fee ? formatBalance(dfnsTransaction.fee, asset.decimals) : undefined,
    to: dfnsTransaction.to,
    from: dfnsTransaction.from,
    blockNumber: dfnsTransaction.blockNumber,
    blockHash: dfnsTransaction.blockHash,
    timestamp: dfnsTransaction.timestamp,
    formattedTimestamp: formatTimestamp(dfnsTransaction.timestamp),
    metadata: dfnsTransaction.metadata
  };
}


