/**
 * Custody service types for Ripple digital asset custody
 * Covers wallet management, asset custody, and security operations
 */

// Core Custody Types
export interface CustodyWallet {
  id: string;
  name: string;
  type: WalletType;
  network: CustodyNetwork;
  address: string;
  balance: AssetBalance[];
  status: WalletStatus;
  securityLevel: SecurityLevel;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export type WalletType = 
  | 'hot'
  | 'warm'
  | 'cold'
  | 'multisig'
  | 'hardware'
  | 'smart_contract';

export type CustodyNetwork = 
  | 'xrp_ledger'
  | 'ethereum'
  | 'bitcoin'
  | 'polygon'
  | 'bsc'
  | 'avalanche';

export type WalletStatus = 
  | 'active'
  | 'inactive'
  | 'locked'
  | 'recovery'
  | 'archived';

export type SecurityLevel = 
  | 'standard'
  | 'enhanced'
  | 'institutional'
  | 'enterprise';

export type RiskLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

// Asset Management Types
export interface CustodyAsset {
  id: string;
  walletId: string;
  assetType: AssetType;
  symbol: string;
  name: string;
  contractAddress?: string;
  balance: string;
  availableBalance: string;
  lockedBalance: string;
  network: CustodyNetwork;
  decimals: number;
  isNative: boolean;
  lastUpdated: string;
}

export type AssetType = 
  | 'native'
  | 'token'
  | 'nft'
  | 'stablecoin';

export interface AssetBalance {
  assetId: string;
  symbol: string;
  balance: string;
  availableBalance: string;
  lockedBalance: string;
  usdValue?: string;
}

// Transaction Types
export interface CustodyTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  status: TransactionStatus;
  fromAddress: string;
  toAddress: string;
  assetId: string;
  amount: string;
  fee?: string;
  txHash?: string;
  blockNumber?: number;
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
  submittedAt?: string;
  confirmedAt?: string;
  metadata?: Record<string, any>;
}

export type TransactionType = 
  | 'send'
  | 'receive'
  | 'internal_transfer'
  | 'sweep'
  | 'consolidation'
  | 'contract_call';

export type TransactionStatus = 
  | 'pending_approval'
  | 'pending_signature'
  | 'pending_broadcast'
  | 'broadcast'
  | 'confirmed'
  | 'failed'
  | 'cancelled';

// Multi-signature Types
export interface MultiSigWallet {
  id: string;
  name: string;
  network: CustodyNetwork;
  address: string;
  threshold: number;
  signers: MultiSigSigner[];
  status: WalletStatus;
  createdAt: string;
  lastActivity?: string;
}

export interface MultiSigSigner {
  id: string;
  address: string;
  name?: string;
  role: SignerRole;
  isActive: boolean;
  addedAt: string;
  lastSigned?: string;
}

export type SignerRole = 
  | 'owner'
  | 'approver'
  | 'executor'
  | 'viewer';

export interface MultiSigProposal {
  id: string;
  walletId: string;
  type: ProposalType;
  title: string;
  description?: string;
  proposer: string;
  status: ProposalStatus;
  threshold: number;
  signatures: ProposalSignature[];
  expiresAt?: string;
  createdAt: string;
  executedAt?: string;
  transactionData?: any;
}

export type ProposalType = 
  | 'transaction'
  | 'add_signer'
  | 'remove_signer'
  | 'change_threshold'
  | 'upgrade_contract';

export type ProposalStatus = 
  | 'pending'
  | 'approved'
  | 'executed'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface ProposalSignature {
  signerId: string;
  signerAddress: string;
  signature: string;
  signedAt: string;
  approved: boolean;
}

// Security and Key Management Types
export interface CustodyKey {
  id: string;
  walletId: string;
  type: KeyType;
  status: KeyStatus;
  algorithm: string;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export type KeyType = 
  | 'master'
  | 'signing'
  | 'encryption'
  | 'backup'
  | 'recovery';

export type KeyStatus = 
  | 'active'
  | 'inactive'
  | 'revoked'
  | 'expired'
  | 'compromised';

export interface KeyRotationPolicy {
  id: string;
  walletId: string;
  keyType: KeyType;
  rotationInterval: number; // days
  autoRotate: boolean;
  lastRotation?: string;
  nextRotation?: string;
  isActive: boolean;
}

// Request Types
export interface CreateWalletRequest {
  name: string;
  type: WalletType;
  network: CustodyNetwork;
  securityLevel: SecurityLevel;
  metadata?: Record<string, any>;
  multiSigConfig?: {
    threshold: number;
    signers: string[];
  };
}

export interface TransferRequest {
  fromWalletId: string;
  toAddress: string;
  assetId: string;
  amount: string;
  priority?: TransactionPriority;
  gasLimit?: string;
  gasPrice?: string;
  memo?: string;
  requiresApproval?: boolean;
}

export type TransactionPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SignTransactionRequest {
  transactionId: string;
  walletId: string;
  signerId: string;
  approve: boolean;
  signature?: string;
  comment?: string;
}

// Response Types
export interface WalletListResponse {
  wallets: CustodyWallet[];
  totalCount: number;
  page: number;
  size: number;
}

export interface AssetListResponse {
  assets: CustodyAsset[];
  totalValue: string;
  totalCount: number;
}

export interface TransactionListResponse {
  transactions: CustodyTransaction[];
  totalCount: number;
  page: number;
  size: number;
}

// Audit and Compliance Types
export interface CustodyAuditLog {
  id: string;
  walletId?: string;
  action: AuditAction;
  userId: string;
  userRole: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  risk: RiskLevel;
}

export type AuditAction = 
  | 'wallet_created'
  | 'wallet_updated'
  | 'wallet_deleted'
  | 'transaction_initiated'
  | 'transaction_signed'
  | 'transaction_approved'
  | 'key_generated'
  | 'key_rotated'
  | 'signer_added'
  | 'signer_removed'
  | 'threshold_changed'
  | 'policy_updated';

// Configuration Types
export interface CustodyConfig {
  defaultSecurityLevel: SecurityLevel;
  defaultWalletType: WalletType;
  requiredConfirmations: Record<CustodyNetwork, number>;
  transactionLimits: TransactionLimits;
  autoSweepConfig?: AutoSweepConfig;
  complianceRules: ComplianceRule[];
}

export interface TransactionLimits {
  dailyLimit: string;
  transactionLimit: string;
  monthlyLimit: string;
  approvalThreshold: string;
}

export interface AutoSweepConfig {
  enabled: boolean;
  threshold: string;
  targetWalletId: string;
  schedule: string; // cron expression
  networks: CustodyNetwork[];
}

export interface ComplianceRule {
  id: string;
  name: string;
  type: ComplianceRuleType;
  conditions: Record<string, any>;
  actions: ComplianceAction[];
  isActive: boolean;
}

export type ComplianceRuleType = 
  | 'transaction_monitoring'
  | 'address_screening'
  | 'amount_threshold'
  | 'geographic_restriction'
  | 'time_restriction';

export type ComplianceAction = 
  | 'require_approval'
  | 'block_transaction'
  | 'flag_for_review'
  | 'notify_compliance'
  | 'require_additional_auth';

// Error Types
export interface CustodyError {
  code: string;
  message: string;
  walletId?: string;
  transactionId?: string;
  details?: Record<string, any>;
}

// Filter and Search Types
export interface WalletFilters {
  type?: WalletType[];
  network?: CustodyNetwork[];
  status?: WalletStatus[];
  securityLevel?: SecurityLevel[];
  hasBalance?: boolean;
}

export interface TransactionFilters {
  walletId?: string;
  type?: TransactionType[];
  status?: TransactionStatus[];
  network?: CustodyNetwork[];
  assetId?: string[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
}
