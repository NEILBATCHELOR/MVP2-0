/**
 * Stablecoin service types for RLUSD (Ripple USD) operations
 * Covers XRP Ledger and Ethereum implementations
 */

// Core Stablecoin Types
export interface RLUSDToken {
  id: string;
  network: StablecoinNetwork;
  contractAddress?: string; // For Ethereum
  issuerAddress?: string; // For XRP Ledger
  symbol: 'RLUSD';
  name: 'Ripple USD';
  decimals: number;
  totalSupply: string;
  isActive: boolean;
  lastUpdated: string;
}

export type StablecoinNetwork = 'xrp_ledger' | 'ethereum' | 'polygon' | 'bsc';

// XRP Ledger Specific Types
export interface XRPLTrustLine {
  account: string;
  currency: string;
  issuer: string;
  limit: string;
  balance: string;
  qualityIn: number;
  qualityOut: number;
  noRipple: boolean;
  frozen: boolean;
  peerFrozen: boolean;
  authorized: boolean;
  createdAt: string;
}

export interface CreateTrustLineRequest {
  account: string;
  currency: 'RLUSD';
  issuer: string;
  limit: string;
  qualityIn?: number;
  qualityOut?: number;
  flags?: TrustLineFlags;
}

export interface TrustLineFlags {
  noRipple?: boolean;
  clearNoRipple?: boolean;
  setFreeze?: boolean;
  clearFreeze?: boolean;
}

// Ethereum Specific Types
export interface ERC20TokenInfo {
  contractAddress: string;
  proxyAddress?: string; // For proxy pattern
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  owner: string;
  isPaused: boolean;
  version: string;
}

export interface ERC20Allowance {
  owner: string;
  spender: string;
  amount: string;
  expiresAt?: string;
}

export interface ERC20TransferEvent {
  from: string;
  to: string;
  value: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  timestamp: string;
}

// Cross-Network Bridge Types
export interface BridgeTransaction {
  id: string;
  sourceNetwork: StablecoinNetwork;
  destinationNetwork: StablecoinNetwork;
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  status: BridgeStatus;
  sourceTxHash?: string;
  destinationTxHash?: string;
  bridgeFee: string;
  networkFee: string;
  estimatedTime: string; // seconds
  actualTime?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
}

export type BridgeStatus = 
  | 'pending'
  | 'locked'
  | 'validating'
  | 'minting'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'refunded';

export interface BridgeQuote {
  sourceNetwork: StablecoinNetwork;
  destinationNetwork: StablecoinNetwork;
  amount: string;
  bridgeFee: string;
  networkFee: string;
  exchangeRate: string; // Should be 1:1 for RLUSD
  estimatedTime: string;
  minimumAmount: string;
  maximumAmount: string;
  expiresAt: string;
}

// Transaction Types
export interface StablecoinTransaction {
  id: string;
  network: StablecoinNetwork;
  type: StablecoinTransactionType;
  status: StablecoinTransactionStatus;
  fromAddress: string;
  toAddress: string;
  amount: string;
  fee: string;
  txHash?: string;
  blockNumber?: number;
  confirmations: number;
  requiredConfirmations: number;
  memo?: string;
  createdAt: string;
  submittedAt?: string;
  confirmedAt?: string;
  metadata?: Record<string, any>;
}

export type StablecoinTransactionType = 
  | 'transfer'
  | 'mint'
  | 'burn'
  | 'approve'
  | 'bridge_lock'
  | 'bridge_unlock'
  | 'trustline_create'
  | 'trustline_update';

export type StablecoinTransactionStatus = 
  | 'pending'
  | 'submitted'
  | 'confirmed'
  | 'failed'
  | 'cancelled';

// Balance and Account Types
export interface StablecoinBalance {
  network: StablecoinNetwork;
  address: string;
  balance: string;
  availableBalance: string;
  frozenBalance: string;
  allowances?: ERC20Allowance[];
  trustLines?: XRPLTrustLine[];
  lastUpdated: string;
}

export interface StablecoinAccount {
  address: string;
  networks: StablecoinBalance[];
  totalBalance: string; // USD value across all networks
  isVerified: boolean;
  riskLevel: AccountRiskLevel;
  createdAt: string;
  lastActivity?: string;
}

export type AccountRiskLevel = 'low' | 'medium' | 'high' | 'blocked';

// Minting and Burning Types (For authorized issuers)
export interface MintRequest {
  network: StablecoinNetwork;
  toAddress: string;
  amount: string;
  reference: string; // Bank wire reference
  memo?: string;
  requiresApproval?: boolean;
}

export interface BurnRequest {
  network: StablecoinNetwork;
  fromAddress: string;
  amount: string;
  bankAccount: BankAccountInfo;
  memo?: string;
  requiresApproval?: boolean;
}

export interface BankAccountInfo {
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  bankAddress: string;
  swiftCode?: string;
  iban?: string;
}

// Redemption Types
export interface RedemptionRequest {
  id: string;
  network: StablecoinNetwork;
  fromAddress: string;
  amount: string;
  status: RedemptionStatus;
  bankAccount: BankAccountInfo;
  referenceId: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  txHash?: string;
  wireTransferDetails?: WireTransferDetails;
}

export type RedemptionStatus = 
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface WireTransferDetails {
  wireId: string;
  amount: string;
  currency: 'USD';
  sentAt: string;
  estimatedArrival: string;
  trackingReference: string;
}

// Compliance and Monitoring Types
export interface ComplianceCheck {
  id: string;
  address: string;
  network: StablecoinNetwork;
  checkType: ComplianceCheckType;
  status: ComplianceStatus;
  score?: number;
  flags: ComplianceFlag[];
  checkedAt: string;
  expiresAt?: string;
}

export type ComplianceCheckType = 
  | 'sanctions_screening'
  | 'aml_check'
  | 'pep_check'
  | 'address_analysis'
  | 'transaction_monitoring';

export type ComplianceStatus = 
  | 'passed'
  | 'failed'
  | 'manual_review'
  | 'pending';

export interface ComplianceFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details?: Record<string, any>;
}

// Price and Oracle Types
export interface StablecoinPrice {
  network: StablecoinNetwork;
  price: string; // Should be ~1.00 USD
  lastUpdated: string;
  source: string;
  confidence: number; // 0-1
}

export interface PriceOracle {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  weight: number;
  lastPrice: string;
  lastUpdated: string;
  reliability: number; // 0-1
}

// Request Types
export interface TransferRequest {
  network: StablecoinNetwork;
  fromAddress: string;
  toAddress: string;
  amount: string;
  memo?: string;
  gasLimit?: string;
  gasPrice?: string;
  priority?: TransactionPriority;
}

export type TransactionPriority = 'low' | 'medium' | 'high';

export interface ApproveRequest {
  network: 'ethereum' | 'polygon' | 'bsc';
  ownerAddress: string;
  spenderAddress: string;
  amount: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface BridgeRequest {
  sourceNetwork: StablecoinNetwork;
  destinationNetwork: StablecoinNetwork;
  fromAddress: string;
  toAddress: string;
  amount: string;
  slippage?: string; // Should be minimal for stablecoin
}

// Response Types
export interface TransactionListResponse {
  transactions: StablecoinTransaction[];
  totalCount: number;
  page: number;
  size: number;
  totalValue: string;
}

export interface BalanceResponse {
  balances: StablecoinBalance[];
  totalBalance: string;
  networks: string[];
}

export interface BridgeQuoteResponse {
  quote: BridgeQuote;
  routes: BridgeRoute[];
  recommendations: string[];
}

export interface BridgeRoute {
  sourceNetwork: StablecoinNetwork;
  destinationNetwork: StablecoinNetwork;
  bridgeProtocol: string;
  estimatedTime: string;
  fee: string;
  reliability: number;
}

// Configuration Types
export interface StablecoinConfig {
  networks: NetworkConfig[];
  bridgeConfig: BridgeConfig;
  complianceConfig: ComplianceConfig;
  redemptionConfig: RedemptionConfig;
}

export interface NetworkConfig {
  network: StablecoinNetwork;
  isEnabled: boolean;
  contractAddress?: string;
  issuerAddress?: string;
  rpcUrl: string;
  explorerUrl: string;
  confirmationsRequired: number;
  gasLimits: GasLimits;
}

export interface GasLimits {
  transfer: string;
  approve: string;
  mint?: string;
  burn?: string;
}

export interface BridgeConfig {
  isEnabled: boolean;
  supportedRoutes: BridgeRoute[];
  minimumAmount: string;
  maximumAmount: string;
  defaultSlippage: string;
  timeoutMinutes: number;
}

export interface ComplianceConfig {
  isEnabled: boolean;
  requiredChecks: ComplianceCheckType[];
  autoBlock: boolean;
  manualReviewThreshold: number;
  sanctionsLists: string[];
}

export interface RedemptionConfig {
  isEnabled: boolean;
  minimumAmount: string;
  maximumAmount: string;
  dailyLimit: string;
  processingTimeHours: number;
  supportedCountries: string[];
  requiredDocuments: string[];
}

// Error Types
export interface StablecoinError {
  code: string;
  message: string;
  network?: StablecoinNetwork;
  address?: string;
  txHash?: string;
  details?: Record<string, any>;
}

// Filter Types
export interface TransactionFilters {
  network?: StablecoinNetwork[];
  type?: StablecoinTransactionType[];
  status?: StablecoinTransactionStatus[];
  address?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
}

export interface BridgeFilters {
  sourceNetwork?: StablecoinNetwork[];
  destinationNetwork?: StablecoinNetwork[];
  status?: BridgeStatus[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
}

// Analytics Types
export interface StablecoinAnalytics {
  network: StablecoinNetwork;
  totalSupply: string;
  circulatingSupply: string;
  holders: number;
  transactions24h: number;
  volume24h: string;
  averagePrice: string;
  priceStability: number; // How close to $1.00
  lastUpdated: string;
}

export interface NetworkAnalytics {
  network: StablecoinNetwork;
  activeAddresses: number;
  transactionCount: number;
  totalVolume: string;
  averageFee: string;
  medianConfirmationTime: string;
  utilization: number; // 0-1
}
