/**
 * Central Models - Core Type Definitions
 * 
 * This file contains all the core type definitions for the application.
 * It serves as the source of truth for data structures used across the app.
 * 
 * When adding new models:
 * 1. Keep interfaces focused on one entity
 * 2. Use composition over inheritance where possible
 * 3. Document complex properties with JSDoc comments
 * 4. Maintain consistency with the database schema
 */

import type { Database } from "../core/database";
import type { 
  UsersTable, 
  RolesTable, 
  SubscriptionsTable, 
  RedemptionRequestsTable, 
  RedemptionApproversTable, 
  OrganizationsTable, 
  InvestorsTable, 
  InvestorApprovalsTable, 
  DistributionsTable, 
  DistributionRedemptionsTable, 
  TokensTable, 
  TokenVersionsTable, 
  TokenDeploymentsTable,
  TokenDesignsTable,
  TokenTemplatesTable,
  TokenOperationsTable,
  TokenAllocationsTable,
  IssuerDocumentsTable,
  // Token standard-specific table types
  TokenErc20PropertiesTable,
  TokenErc721PropertiesTable,
  TokenErc721AttributesTable,
  TokenErc1155PropertiesTable,
  TokenErc1155TypesTable,
  TokenErc1155BalancesTable,
  TokenErc1155UriMappingsTable,
  TokenErc1400PropertiesTable,
  TokenErc1400ControllersTable,
  TokenErc1400PartitionsTable,
  TokenErc3525PropertiesTable,
  TokenErc3525SlotsTable,
  TokenErc3525AllocationsTable,
  TokenErc4626PropertiesTable,
  TokenErc4626StrategyParamsTable,
  TokenErc4626AssetAllocationsTable
} from "../core/database";

// Base Models (DB-Aligned)
// --------------------------------------------------

/**
 * Base model for any entity that has an ID and timestamps
 */
export interface BaseModel {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * User model representing a system user
 */
export interface User extends BaseModel {
  email: string;
  name?: string;
  role: UserRole;
  status: UserStatus;
  publicKey?: string;
  encryptedPrivateKey?: string;
  mfaEnabled?: boolean;
  lastLoginAt?: string;
  preferences?: Record<string, any>;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  INVESTOR = 'investor'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

/**
 * Project model representing an investment project
 */
export interface Project extends BaseModel {
  name: string;
  description?: string;
  status: ProjectStatus;
  projectType: ProjectType;
  tokenSymbol?: string;
  tokenPrice?: number;
  totalTokenSupply?: number;
  fundingGoal?: number;
  totalNotional?: number;
  raisedAmount?: number;
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  ownerId?: string;
  visibility?: 'public' | 'private' | 'invite_only';
  customFields?: Record<string, any>;
  tags?: string[];
  image?: string;
  title?: string;
  totalInvestors?: number;
  totalAllocation?: number;
  authorizedShares?: number;
  sharePrice?: number;
  companyValuation?: number;
  legalEntity?: string;
  jurisdiction?: string;
  taxId?: string;
  isPrimary?: boolean;
  investmentStatus?: InvestmentStatus;
  issuerDocuments?: IssuerDocument[];
  estimatedYieldPercentage?: number;
  duration?: ProjectDuration;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  transactionStartDate?: string;
  maturityDate?: string;
  minimumInvestment?: number;
  currency?: string;
}

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  FUNDED = 'funded',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

export enum InvestmentStatus {
  OPEN = 'Open',
  CLOSED = 'Closed'
}

// Enum for project types
export enum ProjectType {
  EQUITY = "equity",
  TOKEN = "token",
  HYBRID = "hybrid",
  RECEIVABLES = "receivables"
}

// Enum for project duration
export enum ProjectDuration {
  ONE_MONTH = "1_month",
  THREE_MONTHS = "3_months",
  SIX_MONTHS = "6_months",
  NINE_MONTHS = "9_months",
  TWELVE_MONTHS = "12_months",
  OVER_TWELVE_MONTHS = "over_12_months"
}

/**
 * Organization model representing an issuer
 */
export interface Organization extends BaseModel {
  name: string;
  legalName?: string;
  registrationNumber?: string;
  registrationDate?: string;
  taxId?: string;
  jurisdiction?: string;
  businessType?: string;
  status?: OrganizationStatus;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: Address;
  legalRepresentatives?: LegalRepresentative[];
  complianceStatus?: ComplianceStatusType;
  onboardingCompleted?: boolean;
}

export enum OrganizationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
}

export interface LegalRepresentative {
  name: string;
  role: string;
  email: string;
  phone?: string;
  isPrimary?: boolean;
}

export enum ComplianceStatusType {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING_REVIEW = 'pending_review'
}

/**
 * Investor model representing an individual or institutional investor
 */
export interface Investor extends BaseModel {
  userId?: string;
  name: string;
  email: string;
  company?: string;
  type: InvestorEntityType;
  kycStatus?: KycStatus;
  kycVerifiedAt?: string;
  kycExpiryDate?: string;
  accreditationStatus?: AccreditationStatus;
  accreditationType?: string;
  accreditationVerifiedAt?: string;
  accreditationExpiresAt?: string;
  walletAddress?: string;
  riskScore?: number;
  riskFactors?: Record<string, any>;
  investorStatus?: InvestorStatus;
  onboardingCompleted?: boolean;
  riskAssessment?: RiskAssessment;
  profileData?: Record<string, any>;
  taxResidency?: string;
  taxIdNumber?: string;
  investmentPreferences?: InvestmentPreferences;
  lastComplianceCheck?: string;
}

export interface RiskAssessment {
  score: number;
  factors: string[];
  lastUpdated: string;
  recommendedAction?: string;
}

export interface InvestmentPreferences {
  preferredAssetClasses?: string[];
  riskTolerance?: 'low' | 'medium' | 'high';
  investmentHorizon?: 'short' | 'medium' | 'long';
  preferredRegions?: string[];
  targetReturn?: number;
  preferredCurrency?: string;
  investmentGoals?: string[];
}

export enum InvestorEntityType {
  INDIVIDUAL = 'individual',
  INSTITUTIONAL = 'institutional',
  SYNDICATE = 'syndicate'
}

export enum KycStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  FAILED = 'failed',
  NOT_STARTED = 'not_started',
  EXPIRED = 'expired'
}

export enum AccreditationStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected',
  NOT_STARTED = 'not_started',
  EXPIRED = 'expired'
}

export enum InvestorStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

/**
 * InvestorApproval model for managing investor approval processes
 */
export interface InvestorApproval extends BaseModel {
  investorId: string;
  reviewerId?: string;
  status: ApprovalStatus;
  rejectionReason?: string;
  approvalDate?: string;
  submissionDate: string;
  approvalType: ApprovalType;
  requiredDocuments?: DocumentRequirement[];
  reviewNotes?: string;
  metadata?: Record<string, any>;
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_REVIEW = 'in_review',
  DEFERRED = 'deferred'
}

export enum ApprovalType {
  KYC = 'kyc',
  ACCREDITATION = 'accreditation',
  WALLET = 'wallet',
  GENERAL = 'general'
}

export interface DocumentRequirement {
  documentType: string;
  description: string;
  isRequired: boolean;
  status?: string;
}

/**
 * Extended investor with investment details
 */
export interface InvestorWithDetails extends Investor {
  totalInvested?: number;
  projectCount?: number;
  lastActivityDate?: string;
  tags?: string[];
  notes?: string;
}

/**
 * Base Subscription model representing an investment subscription
 */
export interface BaseSubscription extends BaseModel {
  investorId: string;
  projectId: string;
  amount: number;
  tokenAmount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  paymentStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod?: string;
  paymentDate?: string;
  currency?: string;
  exchangeRate?: number;
}

/**
 * Base RedemptionRequest model for token redemption
 */
export interface BaseRedemptionRequest extends BaseModel {
  requestDate: string | Date;
  tokenAmount: number;
  tokenType: string;
  redemptionType: string;
  status: "Pending" | "Approved" | "Processing" | "Completed" | "Rejected";
  sourceWalletAddress: string;
  destinationWalletAddress: string;
  conversionRate: number;
  investorName?: string;
  investorId?: string;
  isBulkRedemption?: boolean;
  investorCount?: number;
  approvers: Approver[];
  requiredApprovals: number;
  windowId?: string;
  processedAmount?: number;
  processedDate?: string;
  notes?: string;
}

/**
 * Base TokenAllocation model
 */
export interface BaseTokenAllocation extends BaseModel {
  investorId: string;
  investorName: string;
  projectId: string;
  tokenType: string;
  subscribedAmount: number;
  allocatedAmount: number;
  confirmed: boolean;
  allocationConfirmed: boolean;
  allocationDate?: string;
  status: string;
  email?: string;
  company?: string;
  investorEmail?: string;
  subscriptionId?: string;
  currency?: string;
  fiatAmount?: number;
  walletAddress?: string;
}

/**
 * Approver interface for redemption approvals
 */
export interface Approver {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  approved: boolean;
  timestamp?: string;
}

/**
 * RedemptionWindow for token redemption periods
 */
export interface RedemptionWindow extends BaseModel {
  projectId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'closed';
  totalTokensAvailable?: number;
  tokenPrice?: number;
  maxRedemptionPerInvestor?: number;
  terms?: string;
}

/**
 * Activity log for auditing
 */
export interface ActivityLog extends BaseModel {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  projectId?: string;
  details?: any;
  status?: 'success' | 'error' | 'pending';
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Wallet model for blockchain wallets
 */
export interface Wallet extends BaseModel {
  name: string;
  type: WalletType;
  address: string;
  contractAddress?: string;
  userId?: string;
  signers?: string[];
  requiredConfirmations?: number;
  blockchain?: string;
  chainId?: number;
  isDefault?: boolean;
  encryptedPrivateKey?: string;
  // Guardian-specific fields
  guardianWalletId?: string;
  guardianMetadata?: Record<string, any>;
  isGuardianManaged?: boolean;
}

export enum WalletType {
  INDIVIDUAL = 'individual',
  MULTISIG = 'multisig',
  CUSTODIAL = 'custodial',
  EOA = 'EOA',
  SMART = 'SMART',
  GUARDIAN = 'guardian'
}

export enum TokenType {
  NATIVE = 'native',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  ERC1400 = 'erc1400',
  ERC3525 = 'erc3525',
  ERC4626 = 'erc4626',
}

/**
 * TokenBalance for displaying asset balances
 */
export interface TokenBalance {
  tokenAddress: string;
  tokenType: TokenType;
  name: string;
  symbol: string;
  balance: string;
  formattedBalance: string;
  decimals: number;
}

/**
 * Transaction model for blockchain transactions
 */
export interface Transaction extends BaseModel {
  walletId: string;
  to: string;
  value: string;
  data?: string;
  nonce?: number;
  description?: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  blockNumber?: number;
  blockHash?: string;
  from?: string;
  gasLimit?: string;
  gasPrice?: string;
  chainId?: number;
  hash?: string;
  timestamp?: string;
  // Additional properties needed by components
  type?: string;
  metadata?: Record<string, any>;
  blockchain?: string;
}

/**
 * MultiSig transaction extension
 */
export interface MultiSigTransaction extends Transaction {
  confirmations: number;
  required: number;
  executed: boolean;
  createdBy?: string;
}

/**
 * UI representation of a project
 */
export interface ProjectUI {
  id: string;
  name: string;
  title?: string;
  description?: string;
  status: string;
  projectType?: ProjectType;
  tokenSymbol?: string;
  totalTokenSupply?: number;
  tokenPrice?: number;
  sharePrice?: number;
  fundingGoal?: number;
  totalNotional?: number;
  raisedAmount?: number;
  startDate?: string;
  endDate?: string;
  progress?: number;
  remainingDays?: number;
  investorCount?: number;
  totalInvestors?: number;
  companyValuation?: number;
  legalEntity?: string;
  authorizedShares?: number;
  image?: string;
  tags?: string[];
  createdAt?: string;
  subscription?: Subscription | SubscriptionUI;
  estimatedYieldPercentage?: number;
  duration?: ProjectDuration;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  transactionStartDate?: string;
  maturityDate?: string;
  minimumInvestment?: number;
  currency?: string;
}

/**
 * Subscription UI representation
 */
export interface SubscriptionUI {
  id: string;
  status: "active" | "canceled" | "expired" | "trial";
  planName: string;
  planId: string;
  startDate: string;
  endDate?: string;
  billingCycle?: "monthly" | "yearly" | "one-time";
  price: number;
  paymentMethod?: {
    type: "credit_card" | "bank_transfer" | "crypto";
    last4?: string;
    expiryDate?: string;
    cardType?: string;
  };
  investorId?: string;
  projectId?: string;
  amount?: number;
  tokenAmount?: number;
  investorName?: string;
  projectName?: string;
  formattedAmount?: string;
  formattedDate?: string;
}

/**
 * Invoice model for billing
 */
export interface Invoice extends BaseModel {
  subscriptionId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  items?: InvoiceItem[];
  notes?: string;
  termsAndConditions?: string;
}

/**
 * Invoice line item 
 */
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

/**
 * Props for Empty State components
 */
export interface EmptyStateProps {
  title: string;
  description: string;
  onAction?: () => void;
  actionLabel?: string;
  action?: React.ReactNode;
}

/**
 * Workflow stage representation
 */
export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  status: string;
  completionPercentage?: number;
}

// Type mappings from database to application models
export type Subscription = SubscriptionsTable & {
  investor_name?: string;
  investor_email?: string;
  project_name?: string;
  token_amount?: number;
  status?: string;
} & Partial<BaseSubscription>;

export type TokenAllocation = TokenAllocationsTable & Partial<BaseTokenAllocation> & {
  // Token-specific allocation properties
  tokenId?: string;
  minted: boolean;
  mintingDate?: string;
  mintingTxHash?: string;
  distributed: boolean;
  distributionDate?: string;
  distributionTxHash?: string;
};

export type RedemptionRequest = Omit<RedemptionRequestsTable, 
  'created_at' | 'investor_id' | 'investor_name' | 'is_bulk_redemption' | 'investor_count' | 'token_amount' | 'token_type' | 'redemption_type' | 'status' | 'source_wallet_address' | 'destination_wallet_address' | 'conversion_rate' | 'notes'
> & {
  requestDate: string | null;
  tokenAmount: number;
  tokenType: string;
  redemptionType: string;
  status: string;
  sourceWalletAddress: string;
  destinationWalletAddress: string;
  conversionRate: number;
  investorId: string;
  investorName: string;
  isBulkRedemption: boolean;
  investorCount: number;
  approvers: any[];
  requiredApprovals: number;
  windowId: string;
  processedAmount: number;
  processedDate: string;
  notes: string;
  createdAt: string;
} & Partial<BaseRedemptionRequest>;

export type ToastVariant = "error" | "success" | "default" | "warning";

// Token related types
export interface Token extends BaseModel {
  name: string;
  symbol: string;
  decimals: number;
  standard: TokenStandard;
  projectId: string;
  blocks: Record<string, any>;
  metadata?: Record<string, any>;
  status: TokenStatus;
  reviewers?: string[];
  approvals?: string[];
  contractPreview?: string;
  totalSupply?: string;
  configMode?: TokenConfigMode;
}

// Token standard-specific interfaces

/**
 * ERC20 Properties for standard token functionality
 */
export interface TokenERC20Properties extends BaseModel {
  tokenId: string;
  initialSupply: string;
  cap?: string;
  decimals?: number;
  isMintable?: boolean;
  isBurnable: boolean;
  isPausable: boolean;
  tokenType?: string;
  accessControl?: string;
  allowManagement?: boolean;
  feeOnTransfer?: Record<string, any>;
  governanceFeatures?: Record<string, any>;
  permit?: boolean;
  snapshot?: boolean;
  rebasing?: Record<string, any>;
  upgradeable?: boolean;
  permitSupport?: boolean;
  votesSupport?: boolean;
  flashMinting?: boolean;
  snapshots?: boolean;
  transferHooks?: boolean;
  // Advanced JSONB configuration objects
  transferConfig?: Record<string, any>;
  gasConfig?: Record<string, any>;
  complianceConfig?: Record<string, any>;
  whitelistConfig?: Record<string, any>;
}

/**
 * ERC721 Properties for NFT functionality
 */
export interface TokenERC721Properties extends BaseModel {
  tokenId: string;
  baseUri?: string;
  metadataStorage?: string;
  maxSupply?: string; // Matches max_supply in database
  hasRoyalty: boolean;
  royaltyPercentage?: string;
  royaltyReceiver?: string;
  isMintable: boolean; // Exists in database
  isBurnable: boolean;
  isPausable: boolean;
  assetType?: string;
  mintingMethod?: string;
  autoIncrementIds?: boolean;
  // enumerable is the database column name, supportsEnumeration is the frontend property name
  enumerable?: boolean;
  supportsEnumeration?: boolean; // Maps to enumerable in database
  uriStorage?: string;
  accessControl?: string;
  updatableUris?: boolean;
  // This property doesn't exist in the database schema
  // supportsApprovalForAll?: boolean;
  salesConfig?: Record<string, any>;
  whitelistConfig?: Record<string, any>;
  permissionConfig?: Record<string, any>;
}

/**
 * ERC721 Attributes for NFT metadata
 */
export interface TokenERC721Attribute extends BaseModel {
  tokenId: string;
  traitType: string;
  values: string[];
}

/**
 * ERC1155 Properties for multi-token functionality
 * Aligned with token_erc1155_properties database table
 */
export interface TokenERC1155Properties extends BaseModel {
  tokenId: string;
  
  // Metadata Management - Direct mappings from database columns
  baseUri?: string; // Matches base_uri in database
  metadataStorage?: string; // Matches metadata_storage in database
  dynamicUris?: boolean; // Matches dynamic_uris in database
  dynamicUriConfig?: Record<string, any>; // Matches dynamic_uri_config in database
  updatableUris?: boolean; // Matches updatable_uris in database
  
  // Royalty Standard (EIP-2981)
  hasRoyalty: boolean; // Matches has_royalty in database
  royaltyPercentage?: string; // Matches royalty_percentage in database
  royaltyReceiver?: string; // Matches royalty_receiver in database
  
  // Access Control
  accessControl?: string; // Matches access_control in database
  
  // Batch Operations
  batchMintingEnabled?: boolean; // Matches batch_minting_enabled in database
  batchMintingConfig?: Record<string, any>; // Matches batch_minting_config in database
  batchTransferLimits?: Record<string, any>; // Matches batch_transfer_limits in database
  
  // Container Support
  containerEnabled?: boolean; // Matches container_enabled in database
  containerConfig?: Record<string, any>; // Matches container_config in database
  
  // Compliance & Restrictions
  transferRestrictions?: boolean | Record<string, any>; // Matches transfer_restrictions in database
  whitelistConfig?: Record<string, any>; // Matches whitelist_config in database
  
  // Supply Management
  supplyTracking?: boolean; // Matches supply_tracking in database
  isBurnable: boolean; // Matches is_burnable in database
  
  // Advanced Features
  isPausable: boolean; // Matches is_pausable in database
  enableApprovalForAll?: boolean; // Matches enable_approval_for_all in database
  
  // Sales Configuration
  salesConfig?: Record<string, any>; // Matches sales_config in database
}

/**
 * ERC1155 Token Type definitions
 * Aligned with token_erc1155_types database table
 */
export interface TokenERC1155Type {
  id: string;
  tokenId: string; // Matches token_id in database
  tokenTypeId: string; // Matches token_type_id in database
  name?: string; // Matches name in database
  description?: string; // Matches description in database
  maxSupply?: string; // Matches max_supply in database
  fungibilityType?: 'fungible' | 'non-fungible' | 'semi-fungible'; // Matches fungibility_type in database
  metadata?: Record<string, any>; // Matches metadata in database
  createdAt: string; // Matches created_at in database
}

/**
 * ERC1155 Token Balances
 */
export interface TokenERC1155Balance extends BaseModel {
  tokenId: string;
  tokenTypeId: string;
  address: string;
  amount: string;
}

/**
 * ERC1155 URI Mappings
 */
export interface TokenERC1155UriMapping extends BaseModel {
  tokenId: string;
  tokenTypeId: string;
  uri: string;
}

/**
 * ERC1400 Properties for security token functionality
 */
export interface TokenERC1400Properties extends BaseModel {
  tokenId: string;
  
  // Core Token Details
  initialSupply?: string;
  cap?: string;
  decimals?: number;
  
  // Token Type
  securityType?: string; // equity, debt, derivative, fund, reit, other
  tokenDetails?: string;
  
  // Document Management
  documentUri?: string;
  documentHash?: string;
  legalTerms?: string;
  prospectus?: string;
  documentManagement?: boolean;
  
  // Controller Operations
  controllerAddress?: string;
  enforceKYC?: boolean;
  enforceKyc?: boolean; // Backward compatibility alias for enforceKYC
  requireKyc?: boolean;
  forcedTransfers?: boolean;
  forcedRedemptionEnabled?: boolean;
  
  // Issuer Details
  issuingJurisdiction?: string;
  issuingEntityName?: string;
  issuingEntityLei?: string;
  
  // Transfer Restrictions
  transferRestrictions?: boolean | Record<string, any>;
  whitelistEnabled?: boolean;
  holdingPeriod?: number;
  maxInvestorCount?: number;
  investorAccreditation?: boolean;
  
  // Geographic Restrictions
  geographicRestrictions?: string[] | Record<string, any>;
  
  // Compliance
  autoCompliance?: boolean;
  manualApprovals?: boolean;
  complianceModule?: string;
  complianceSettings?: Record<string, any>;
  complianceAutomationLevel?: string;
  kycSettings?: Record<string, any>;
  
  // Advanced Features
  isIssuable?: boolean;
  isMintable: boolean;
  isBurnable: boolean;
  isPausable: boolean;
  granularControl?: boolean;
  dividendDistribution?: boolean;
  corporateActions?: boolean;
  issuanceModules?: boolean;
  recoveryMechanism?: boolean;
  
  // Custom Features
  customFeatures?: string | Record<string, any>;
  
  // Multi-class Support
  isMultiClass?: boolean;
  
  // New fields for enhanced schema
  trancheTransferability?: boolean;
  regulationType?: string;
}

/**
 * ERC-1400 Partition interface representing a security token partition
 */
export interface TokenERC1400Partition extends BaseModel {
  tokenId: string;
  name: string;
  partitionId: string;
  amount?: string;
  isLockable?: boolean;
  totalSupply?: string;  // Add total supply tracking
  partitionType?: 'equity' | 'debt' | 'preferred' | 'common'; // Add explicit partitionType
  metadata?: Record<string, any>;
}

// Add new models for partition balances
export interface TokenERC1400PartitionBalance extends BaseModel {
  partitionId: string;
  holderAddress: string;
  balance: string;
  lastUpdated: string;
  metadata?: Record<string, any>;
}

// Add new model for partition transfers
export interface TokenERC1400PartitionTransfer extends BaseModel {
  partitionId: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  operatorAddress?: string;
  timestamp: string;
  transactionHash?: string;
  metadata?: Record<string, any>;
}

// Add new model for partition operators
export interface TokenERC1400PartitionOperator extends BaseModel {
  partitionId: string;
  holderAddress: string;
  operatorAddress: string;
  authorized: boolean;
  lastUpdated: string;
  metadata?: Record<string, any>;
}

/**
 * ERC1400 Controllers
 */
export interface TokenERC1400Controller extends BaseModel {
  tokenId: string;
  address: string;
  permissions: string[];
}

/**
 * ERC3525 Properties for semi-fungible token functionality
 */
export interface TokenERC3525Properties extends BaseModel {
  tokenId: string;
  
  // Core Token Details
  name?: string;
  symbol?: string;
  description?: string;
  valueDecimals?: number;
  
  // Metadata Management
  baseUri?: string;
  metadataStorage?: string; // ipfs, centralized, onchain
  dynamicMetadata?: boolean;
  updatableUris?: boolean;
  
  // Slot Configuration
  slotType?: string;
  allowsSlotEnumeration?: boolean;
  slotTransferability?: boolean;
  slotTransferValidation?: Record<string, any>;
  
  // Access Control
  accessControl?: string; // ownable, roles, none
  
  // Enumeration & Extensions
  supportsEnumeration?: boolean;
  fractionalTransfers?: boolean;
  supportsApprovalForAll?: boolean;
  valueTransfersEnabled?: boolean; // Renamed to match database column
  
  // Royalty Configuration
  hasRoyalty: boolean;
  royaltyPercentage?: string;
  royaltyReceiver?: string;
  
  // Advanced Features
  isMintable?: boolean;
  isBurnable: boolean;
  isPausable: boolean;
  updatableValues?: boolean;
  supplyTracking?: boolean;
  
  // Compliance & Restrictions
  fractionalization?: Record<string, any>;
  transferRestrictions?: Record<string, any>;
  
  // Custom Extensions
  customExtensions?: string;
  permissioningEnabled?: boolean;
  valueAggregation?: boolean;
  slotApprovals?: boolean;
  valueApprovals?: boolean;
  updatableSlots?: boolean;
  mergable?: boolean;
  splittable?: boolean;
  
  // Financial instrument properties
  financialInstrument?: 'derivative' | 'structured_product' | 'fractional_ownership' | 'multi_class_share';
  derivativeTerms?: Record<string, any>;
  
  // Sales and Transfer Configuration
  salesConfig?: Record<string, any>;
  fractionalOwnershipEnabled?: boolean;
  fractionalizable?: boolean;
  
  // Add metadata field to match the database structure
  metadata?: Record<string, any>;
}

/**
 * ERC3525 Slots
 */
export interface TokenERC3525Slot extends BaseModel {
  tokenId: string;
  slotId: string;
  name: string;
  description?: string;
  valueUnits?: string;
  slotTransferable?: boolean;
  metadata?: Record<string, any>;
}

/**
 * ERC3525 Allocations
 */
export interface TokenERC3525Allocation extends BaseModel {
  tokenId: string;
  tokenUnitId: string;
  tokenIdWithinSlot?: string; // Alternative field name for UI compatibility, maps to token_id_within_slot in DB
  slotId: string;
  recipient: string;
  value: string;
  linkedTokenId?: string; // Link to another token
}

/**
 * ERC4626 Properties for vault token functionality
 */
export interface TokenERC4626Properties extends BaseModel {
  tokenId: string;
  
  // Core Token Details
  name?: string;
  symbol?: string;
  description?: string;
  decimals?: number;
  
  // Asset Configuration
  assetTokenAddress?: string;
  assetTokenType?: string; // ERC20, other
  assetName?: string;
  assetSymbol?: string;
  assetDecimals?: number;
  vaultShareDecimals?: number;
  initialExchangeRate?: string;
  
  // Deposit/Withdrawal Limits
  depositLimit?: string;
  withdrawalLimit?: string;
  minimumDeposit?: string;
  maximumDeposit?: string;
  maximumWithdrawal?: string;
  maximumRedemption?: string;
  
  // Fee Structure
  enableFees?: boolean;
  feePercentage?: string;
  feeRecipient?: string;
  depositFee?: boolean;
  withdrawalFee?: boolean;
  performanceFee?: boolean;
  managementFee?: string;
  performanceFeePercentage?: string;
  depositFeePercentage?: string;
  withdrawalFeePercentage?: string;
  
  // Strategy Configuration
  strategyParams?: Record<string, any>;
  strategyType?: string;
  strategyDescription?: string;
  yieldStrategy?: string | Record<string, any>;
  expectedAPY?: string;
  rebalancingFrequency?: string; // daily, weekly, monthly
  
  // Protocol Integrations
  compoundIntegration?: boolean;
  aaveIntegration?: boolean;
  uniswapIntegration?: boolean;
  curveIntegration?: boolean;
  
  // Access Control
  accessControl?: string;
  accessControlModel?: string;
  enableAllowlist?: boolean;
  
  // Advanced Features
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  customHooks?: boolean;
  autoReporting?: boolean;
  previewFunctions?: boolean;
  limitFunctions?: boolean;
  
  // Additional properties for form compatibility
  hasDepositFee?: boolean;
  hasWithdrawalFee?: boolean;
  hasPerformanceFee?: boolean;
  hasCustomStrategy?: boolean;
  
  // Asset Allocations
  assetAllocations?: TokenERC4626AssetAllocation[];
  
  // Enhanced Asset Configuration
  assetAddress?: string; // Alternative name for assetTokenAddress
}

/**
 * ERC4626 Strategy Parameters
 */
export interface TokenERC4626StrategyParam extends BaseModel {
  tokenId: string;
  name: string;
  value: string;
}

/**
 * ERC4626 Asset Allocations
 */
export interface TokenERC4626AssetAllocation extends BaseModel {
  tokenId: string;
  assetAddress: string;
  allocation: string;
  strategy?: string;
  description?: string;
  protocol?: string;
  expectedApy?: string;
}

export interface TokenVersion extends BaseModel {
  tokenId: string;
  version: number;
  blocks?: Record<string, any>;
  metadata?: Record<string, any>;
  data: Record<string, any>;
  changes?: Record<string, any>;
  createdBy?: string;
  name?: string;
  symbol?: string;
  standard?: TokenStandard;
  decimals?: number;
  notes?: string;
}

/**
 * Version comparison diff result
 */
export interface VersionDiff {
  fromVersion: {
    id: string;
    version: number;
    createdAt: string;
  };
  toVersion: {
    id: string;
    version: number;
    createdAt: string;
  };
  changes: Record<string, any>;
}

export interface TokenDeployment extends BaseModel {
  tokenId: string;
  network: string;
  contractAddress: string;
  transactionHash: string;
  deployedBy: string;
  deployedAt?: string;
  status: TokenDeploymentStatus;
  deploymentData?: Record<string, any>;
  errorMessage?: string;
}

export interface TokenOperation extends BaseModel {
  tokenId: string;
  operationType: string;
  operator: string;
  amount?: number;
  recipient?: string;
  sender?: string;
  targetAddress?: string;
  nftTokenId?: string;
  tokenTypeId?: string;
  slotId?: string;
  value?: number;
  partition?: string;
  assetTokenAddress?: string;
  lockDuration?: number;
  lockReason?: string;
  unlockTime?: string;
  lockId?: string;
  transactionHash?: string;
  timestamp?: string;
  status: TokenOperationStatus;
  errorMessage?: string;
  blocks?: Record<string, any>;
}

export interface TokenTemplate extends BaseModel {
  name: string;
  description?: string;
  projectId: string;
  standard: TokenStandard;
  blocks: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TokenDesign extends BaseModel {
  name: string;
  type: TokenStandard;
  status: TokenDesignStatus;
  totalSupply: number;
  contractAddress?: string;
  deploymentDate?: string;
}

export enum TokenStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'UNDER REVIEW',
  UNDER_REVIEW = 'UNDER REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  READY_TO_MINT = 'READY TO MINT',
  MINTED = 'MINTED',
  DEPLOYED = 'DEPLOYED',
  PAUSED = 'PAUSED',
  DISTRIBUTED = 'DISTRIBUTED'
}

export enum TokenStandard {
  ERC20 = 'ERC-20',
  ERC721 = 'ERC-721',
  ERC1155 = 'ERC-1155',
  ERC1400 = 'ERC-1400',
  ERC3525 = 'ERC-3525',
  ERC4626 = 'ERC-4626'
}

export enum TokenConfigMode {
  MIN = 'min',
  MAX = 'max',
  BASIC = 'basic',
  ADVANCED = 'advanced'
}

export enum TokenDeploymentStatus {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED'
}

export enum TokenOperationStatus {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED'
}

export enum TokenDesignStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  READY_TO_MINT = 'ready to mint',
  MINTED = 'minted',
  PAUSED = 'paused',
  DISTRIBUTED = 'distributed'
}

export interface TokenDocument {
  id: string;
  tokenId: string;
  name: string;
  description?: string;
  documentUrl: string;
  documentType: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum InvestorDocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  REQUIRES_UPDATE = 'REQUIRES_UPDATE'
}

export interface InvestorDocument {
  id: string;
  investorId: string;
  name: string;
  description?: string;
  documentUrl: string;
  documentType: string;
  status: InvestorDocumentStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Type maps with database integration
export type TokenData = TokensTable & Partial<Token>;
export type TokenVersionData = TokenVersionsTable & Partial<TokenVersion>;
export type TokenDeploymentData = TokenDeploymentsTable & Partial<TokenDeployment>;
export type TokenDesignData = TokenDesignsTable & Partial<TokenDesign>; 
export type TokenTemplateData = TokenTemplatesTable & Partial<TokenTemplate>;
export type TokenOperationData = TokenOperationsTable & Partial<TokenOperation>;
export type TokenAllocationData = TokenAllocationsTable & Partial<TokenAllocation>;
export type OrganizationData = OrganizationsTable & Partial<Organization>;
export type InvestorData = InvestorsTable & Partial<Investor>;
export type InvestorApprovalData = InvestorApprovalsTable & Partial<InvestorApproval>;
export type DistributionData = DistributionsTable & Partial<Distribution>;
export type DistributionRedemptionData = DistributionRedemptionsTable & Partial<DistributionRedemption>;

/**
 * Issuer Document interface for project document uploads
 */
export interface IssuerDocument extends BaseModel {
  projectId: string;
  documentType: IssuerDocumentType;
  documentUrl: string;
  documentName: string;
  uploadedAt: string;
  updatedAt?: string;
  uploadedBy?: string;
  status: 'active' | 'archived' | 'pending_review';
  metadata?: Record<string, any>;
  isPublic?: boolean;
}

export enum IssuerDocumentType {
  ISSUER_CREDITWORTHINESS = 'issuer_creditworthiness',
  PROJECT_SECURITY_TYPE = 'project_security_type',
  OFFERING_DETAILS = 'offering_details',
  TERM_SHEET = 'term_sheet',
  SPECIAL_RIGHTS = 'special_rights',
  UNDERWRITERS = 'underwriters',
  USE_OF_PROCEEDS = 'use_of_proceeds',
  FINANCIAL_HIGHLIGHTS = 'financial_highlights',
  TIMING = 'timing',
  RISK_FACTORS = 'risk_factors',
  LEGAL_REGULATORY_COMPLIANCE = 'legal_regulatory_compliance'
}

/**
 * Distribution interface representing a confirmed token distribution with blockchain data
 */
export interface Distribution {
  id: string;
  tokenAllocationId: string;
  investorId: string;
  subscriptionId: string;
  projectId?: string;
  tokenType: string;
  tokenAmount: number;
  distributionDate: string;
  distributionTxHash: string;
  walletId?: string;
  blockchain: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  toAddress: string;
  walletAddress?: string;
  status: 'confirmed';
  notes?: string;
  remainingAmount: number;
  fullyRedeemed: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * DistributionRedemption interface representing the relationship between distributions and redemption requests
 */
export interface DistributionRedemption {
  id: string;
  distributionId: string;
  redemptionRequestId: string;
  amountRedeemed: number;
  createdAt: string;
  updatedAt?: string;
}

// Add the TokenERC1400Document interface
export interface TokenERC1400Document extends BaseModel {
  tokenId: string;
  name: string;
  documentUri: string;
  documentType: string;
  documentHash?: string;
}

// ========================================
// ENHANCED SERVICES & MAPPERS TYPES
// ========================================

/**
 * Service Architecture Types
 * Used by enhanced services for standardized responses
 */

/**
 * Standardized service result pattern
 */
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

/**
 * Validation context for comprehensive validation
 */
export interface ValidationContext {
  standard: string;
  configMode: 'min' | 'max' | 'basic' | 'advanced';
  operation: 'create' | 'update' | 'delete' | 'validate';
  existingData?: any;
  userId?: string;
  projectId?: string;
  additionalContext?: Record<string, any>;
}

/**
 * Validation result pattern
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
  fieldValidations?: Record<string, { valid: boolean; errors: string[]; warnings: string[] }>;
}

/**
 * Enhanced Service Result Types
 * For token creation, updates, and complex operations
 */

// Base domain token interface
export interface DomainTokenBase {
  id: string;
  name: string;
  symbol: string;
  standard: TokenStandard;
  decimals?: number;
  projectId: string;
  status: TokenStatus;
  configMode?: TokenConfigMode;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

// ERC20 Enhanced Types
export interface ERC20CreationResult {
  token: DomainTokenBase;
  properties: TokenERC20Properties;
  standardInsertionResults?: Record<string, any>;
}

export interface ERC20TokenWithProperties extends DomainTokenBase {
  properties?: TokenERC20Properties;
}

// ERC721 Enhanced Types
export interface ERC721CreationResult {
  token: DomainTokenBase;
  properties: TokenERC721Properties;
  attributes?: TokenERC721Attribute[];
  standardInsertionResults?: Record<string, any>;
}

export interface ERC721TokenWithProperties extends DomainTokenBase {
  properties?: TokenERC721Properties;
  attributes?: TokenERC721Attribute[];
}

// ERC1155 Enhanced Types
export interface ERC1155CreationResult {
  token: DomainTokenBase;
  properties: TokenERC1155Properties;
  tokenTypes?: TokenERC1155Type[];
  standardInsertionResults?: Record<string, any>;
}

export interface ERC1155TokenWithProperties extends DomainTokenBase {
  properties?: TokenERC1155Properties;
  tokenTypes?: TokenERC1155Type[];
}

// ERC1400 Enhanced Types
export interface ERC1400CreationResult {
  token: DomainTokenBase;
  properties: TokenERC1400Properties;
  partitions?: TokenERC1400Partition[];
  controllers?: TokenERC1400Controller[];
  documents?: TokenERC1400Document[];
  standardInsertionResults?: Record<string, any>;
}

export interface ERC1400TokenWithProperties extends DomainTokenBase {
  properties?: TokenERC1400Properties;
  partitions?: TokenERC1400Partition[];
  controllers?: TokenERC1400Controller[];
  documents?: TokenERC1400Document[];
}

// ERC3525 Enhanced Types
export interface ERC3525CreationResult {
  token: DomainTokenBase;
  properties: TokenERC3525Properties;
  slots?: TokenERC3525Slot[];
  allocations?: TokenERC3525Allocation[];
  standardInsertionResults?: Record<string, any>;
}

export interface ERC3525TokenWithProperties extends DomainTokenBase {
  properties?: TokenERC3525Properties;
  slots?: TokenERC3525Slot[];
  allocations?: TokenERC3525Allocation[];
}

// ERC4626 Enhanced Types
export interface ERC4626CreationResult {
  token: DomainTokenBase;
  properties: TokenERC4626Properties;
  strategyParams?: TokenERC4626StrategyParam[];
  assetAllocations?: TokenERC4626AssetAllocation[];
  standardInsertionResults?: Record<string, any>;
}

export interface ERC4626TokenWithProperties extends DomainTokenBase {
  properties?: TokenERC4626Properties;
  strategyParams?: TokenERC4626StrategyParam[];
  assetAllocations?: TokenERC4626AssetAllocation[];
}

/**
 * Batch Operation Types
 */
export interface BatchOperationResult<T> {
  successful: T[];
  failed: Array<{ index: number; error: string; data: any }>;
  summary: { total: number; success: number; failed: number };
}

export interface BatchCreateTokensRequest {
  tokens: Array<{ token: any; properties: any }>;
  userId?: string;
  validateOnly?: boolean;
}

/**
 * Statistics and Analytics Types
 */
export interface TokenStatistics {
  total: number;
  configModeDistribution: Record<string, number>;
  featureDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  standardDistribution: Record<string, number>;
  deploymentStats?: {
    deployed: number;
    pending: number;
    failed: number;
  };
}

export interface ProjectTokenStatistics extends TokenStatistics {
  projectId: string;
  projectName: string;
  averageTokenValue?: number;
  totalTokenValue?: number;
}

/**
 * Enhanced JSONB Configuration Types
 * Complex configuration objects for advanced token features
 */

/**
 * Transfer configuration for token transfers
 */
export interface TransferConfig {
  enabled?: boolean;
  maxTransferAmount?: string;
  cooldownPeriod?: number;
  whitelistOnly?: boolean;
  requireApproval?: boolean;
  transferFee?: string;
  feeRecipient?: string;
  dailyLimit?: string;
  monthlyLimit?: string;
  restrictions?: {
    minHoldingPeriod?: number;
    maxWalletPercentage?: number;
    blacklistedAddresses?: string[];
  };
}

/**
 * Gas configuration for blockchain operations
 */
export interface GasConfig {
  enabled?: boolean;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasOptimization?: boolean;
  dynamicPricing?: boolean;
  estimationSettings?: {
    bufferPercentage?: number;
    maxRetries?: number;
    escalationFactor?: number;
  };
}

/**
 * Compliance configuration for regulatory requirements
 */
export interface ComplianceConfig {
  enabled?: boolean;
  kycRequired?: boolean;
  accreditationRequired?: boolean;
  geographicRestrictions?: string[];
  investorLimits?: {
    maxInvestors?: number;
    maxInvestmentPerInvestor?: string;
    minimumInvestment?: string;
  };
  autoCompliance?: boolean;
  complianceProvider?: string;
  additionalChecks?: string[];
  exemptions?: {
    addressWhitelist?: string[];
    roleExemptions?: string[];
  };
}

/**
 * Whitelist configuration for address-based access control
 */
export interface WhitelistConfig {
  enabled?: boolean;
  addresses?: string[];
  whitelistType?: 'permissive' | 'restrictive';
  autoApproval?: boolean;
  expirationPeriod?: number;
  requiresApproval?: boolean;
  metadata?: Record<string, any>;
  categories?: {
    investors?: string[];
    institutions?: string[];
    exchanges?: string[];
    custodians?: string[];
  };
}

/**
 * Governance configuration for DAO functionality
 */
export interface GovernanceConfig {
  enabled?: boolean;
  governanceToken?: string;
  votingPower?: 'token' | 'equal' | 'weighted';
  quorumPercentage?: number;
  proposalThreshold?: string;
  votingDelay?: number;
  votingPeriod?: number;
  executionDelay?: number;
  vetoRights?: string[];
  proposalTypes?: string[];
  delegationEnabled?: boolean;
}

/**
 * Vesting configuration for token release schedules
 */
export interface VestingConfig {
  enabled?: boolean;
  schedules?: Array<{
    beneficiary: string;
    amount: string;
    startDate: string;
    cliffPeriod: number;
    vestingPeriod: number;
    releaseFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    revocable?: boolean;
  }>;
  defaultCliff?: number;
  defaultVesting?: number;
  earlyRelease?: {
    enabled?: boolean;
    conditions?: string[];
    penalty?: number;
  };
}

/**
 * Fee structure configuration
 */
export interface FeeConfig {
  enabled?: boolean;
  transferFee?: {
    enabled?: boolean;
    percentage?: number;
    fixedAmount?: string;
    recipient?: string;
  };
  deploymentFee?: {
    amount?: string;
    recipient?: string;
  };
  managementFee?: {
    annualPercentage?: number;
    collectionFrequency?: 'monthly' | 'quarterly' | 'annually';
    recipient?: string;
  };
  performanceFee?: {
    percentage?: number;
    highWaterMark?: boolean;
    recipient?: string;
  };
}

/**
 * Mapper Base Types
 * For enhanced mapper implementations
 */

/**
 * Base mapper interface
 */
export interface BaseMapper<DomainType, DatabaseType> {
  toDomain(dbRecord: DatabaseType): DomainType;
  toDatabase(domainObject: DomainType): DatabaseType;
  validate(data: any): ValidationResult;
}

/**
 * Property table mapper interface
 */
export interface PropertyTableMapper<DomainType, DatabaseType> extends BaseMapper<DomainType, DatabaseType> {
  fromForm(formData: any): DatabaseType;
  toForm(domainObject: DomainType): any;
  getTableName(): string;
  getRequiredFields(): string[];
}

/**
 * Query and Filtering Types
 */
export interface DatabaseQueryOptions {
  filters?: Record<string, any>;
  pagination?: {
    page: number;
    limit: number;
    offset?: number;
  };
  sorting?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  include?: string[];
  search?: {
    query: string;
    fields: string[];
  };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

/**
 * Audit and Relationship Types
 */
export interface AuditTrail {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  timestamp: string;
  oldData?: any;
  newData?: any;
  metadata?: Record<string, any>;
}

export interface RelationshipInfo {
  id: string;
  fromEntityType: string;
  fromEntityId: string;
  toEntityType: string;
  toEntityId: string;
  relationshipType: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Form Data Types
 * Separate interfaces for form handling
 */
export interface BaseFormData {
  id?: string;
  tokenId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// These will be extended by specific mapper implementations
export interface ERC20FormData extends BaseFormData {
  // Will be defined in the mapper files
  [key: string]: any;
}

export interface ERC721FormData extends BaseFormData {
  // Will be defined in the mapper files
  [key: string]: any;
}

export interface ERC1155FormData extends BaseFormData {
  // Will be defined in the mapper files
  [key: string]: any;
}

export interface ERC1400FormData extends BaseFormData {
  // Will be defined in the mapper files
  [key: string]: any;
}

export interface ERC3525FormData extends BaseFormData {
  // Will be defined in the mapper files
  [key: string]: any;
}

export interface ERC4626FormData extends BaseFormData {
  // Will be defined in the mapper files
  [key: string]: any;
}

// ========================================
// ENHANCED SERVICE ARCHITECTURE TYPES  
// ========================================

/**
 * Enhanced Service Error Types
 */
export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  timestamp: string;
}

/**
 * Enhanced Service Success Types
 */
export interface ServiceSuccess<T = any> {
  data: T;
  message?: string;
  metadata?: {
    executionTime?: number;
    cacheHit?: boolean;
    version?: string;
    source?: string;
  };
}

/**
 * Service Operation Context
 */
export interface ServiceOperationContext {
  userId?: string;
  projectId?: string;
  organizationId?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  operation: string;
  environment: 'development' | 'staging' | 'production';
}

/**
 * Enhanced Validation Context with Dependencies
 */
export interface EnhancedValidationContext extends ValidationContext {
  dependencies?: {
    relatedTokens?: string[];
    requiredServices?: string[];
    externalDependencies?: string[];
  };
  constraints?: {
    gasLimit?: string;
    blockGasLimit?: string;
    maxComplexity?: number;
  };
  environment?: {
    network?: string;
    chainId?: number;
    blockNumber?: number;
  };
}

/**
 * Service Health Status
 */
export interface ServiceHealthStatus {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    duration: number;
    message?: string;
  }>;
  dependencies: Array<{
    name: string;
    status: 'available' | 'unavailable' | 'degraded';
    latency?: number;
  }>;
  metadata: {
    version: string;
    uptime: number;
    lastHealthCheck: string;
  };
}

// ========================================
// ENHANCED ADVANCED FEATURES TYPES
// ========================================

/**
 * Advanced DeFi Features for ERC20 Tokens
 */
export interface AdvancedDeFiFeatures {
  // Governance Features
  governanceEnabled?: boolean;
  quorumPercentage?: string;
  proposalThreshold?: string;
  votingDelay?: number;
  votingPeriod?: number;
  timelockDelay?: number;
  
  // Anti-whale Protection
  antiWhaleEnabled?: boolean;
  maxWalletAmount?: string;
  cooldownPeriod?: number;
  maxTransactionAmount?: string;
  
  // Economic Features
  deflationEnabled?: boolean;
  deflationRate?: string;
  stakingEnabled?: boolean;
  stakingRewardsRate?: string;
  liquidityMining?: boolean;
  
  // Fee Structure
  buyFeeEnabled?: boolean;
  sellFeeEnabled?: boolean;
  liquidityFeePercentage?: string;
  marketingFeePercentage?: string;
  charityFeePercentage?: string;
  burnFeePercentage?: string;
  
  // Flash Loan Protection
  flashLoanProtection?: boolean;
  maxFlashLoanAmount?: string;
  flashLoanFee?: string;
  
  // MEV Protection
  mevProtection?: boolean;
  maxSlippage?: string;
  frontRunningProtection?: boolean;
}

/**
 * Advanced NFT Features for ERC721 Tokens
 */
export interface AdvancedNFTFeatures {
  // Metadata Management
  dynamicMetadata?: boolean;
  metadataFreezing?: boolean;
  metadataVersioning?: boolean;
  ipfsGateway?: string;
  
  // Royalty Management
  royaltyStandard?: 'EIP2981' | 'custom';
  royaltyDistribution?: Array<{
    recipient: string;
    percentage: number;
  }>;
  
  // Fractional Ownership
  fractionalOwnership?: boolean;
  fractionTokenStandard?: 'ERC20' | 'ERC1155';
  
  // Staking and Rewards
  stakingEnabled?: boolean;
  stakingRewards?: {
    rewardToken?: string;
    rewardRate?: string;
    lockPeriod?: number;
  };
  
  // Utility Features
  utilityEnabled?: boolean;
  utilityConfig?: {
    gameIntegration?: boolean;
    physicalRedemption?: boolean;
    accessRights?: string[];
  };
}

/**
 * Enhanced Supply Management
 */
export interface SupplyManagement {
  supplyModel?: 'fixed' | 'elastic' | 'deflationary' | 'inflationary';
  maxSupply?: string;
  circulatingSupply?: string;
  lockedSupply?: string;
  burnedSupply?: string;
  
  // Elastic Supply Mechanics
  rebaseEnabled?: boolean;
  rebaseFrequency?: 'daily' | 'weekly' | 'monthly';
  targetPrice?: string;
  priceOracle?: string;
  
  // Deflationary Mechanics
  burnRate?: string;
  burnTriggers?: string[];
  autoBurn?: boolean;
  
  // Inflationary Mechanics
  inflationRate?: string;
  inflationSchedule?: Array<{
    date: string;
    rate: string;
  }>;
}

/**
 * Cross-Chain Configuration
 */
export interface CrossChainConfig {
  enabled?: boolean;
  supportedChains?: string[];
  bridgeProtocol?: 'native' | 'layerzero' | 'axelar' | 'wormhole';
  bridgeConfig?: {
    feeToken?: string;
    gasLimit?: string;
    confirmations?: number;
  };
  
  // Multi-chain deployment
  multiChainDeployment?: boolean;
  primaryChain?: string;
  secondaryChains?: string[];
  
  // Cross-chain messaging
  messagingEnabled?: boolean;
  messagingProtocol?: string;
}

/**
 * Advanced Compliance Features
 */
export interface AdvancedComplianceFeatures {
  // Regulatory Framework
  regulatoryFramework?: 'MiFID' | 'SEC' | 'MAS' | 'FCA' | 'custom';
  jurisdiction?: string[];
  
  // KYC/AML Integration
  kycProvider?: 'chainalysis' | 'elliptic' | 'jumio' | 'custom';
  amlProvider?: string;
  sanctionsScreening?: boolean;
  
  // Tax Compliance
  taxReporting?: boolean;
  taxJurisdictions?: string[];
  automaticReporting?: boolean;
  
  // Audit Features
  auditTrail?: boolean;
  complianceReporting?: boolean;
  regulatoryReporting?: boolean;
  
  // Privacy Features
  privacyLevel?: 'public' | 'private' | 'confidential';
  zeroKnowledgeProofs?: boolean;
  confidentialTransactions?: boolean;
}

/**
 * Oracle Integration Configuration
 */
export interface OracleIntegration {
  enabled?: boolean;
  priceOracles?: Array<{
    provider: string;
    address: string;
    asset: string;
    weight: number;
  }>;
  
  // Chainlink specific
  chainlinkFeeds?: string[];
  chainlinkVRF?: boolean;
  chainlinkAutomation?: boolean;
  
  // Custom oracles
  customOracles?: Array<{
    name: string;
    address: string;
    abi: any[];
    updateFrequency: number;
  }>;
}

/**
 * Enhanced Template and Cloning Types
 */
export interface TokenTemplate {
  id: string;
  name: string;
  description?: string;
  standard: TokenStandard;
  category: 'defi' | 'nft' | 'security' | 'utility' | 'governance';
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
  features: string[];
  
  // Template configuration
  baseConfig: Record<string, any>;
  customizableFields: string[];
  requiredFields: string[];
  
  // Deployment info
  gasEstimate?: string;
  deploymentTime?: string;
  auditStatus?: 'pending' | 'audited' | 'verified';
  
  // Usage statistics
  usageCount?: number;
  successRate?: number;
  averageGasCost?: string;
  
  // Visibility and access control
  isPublic?: boolean;
  tags?: string[];
  
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Token Cloning Configuration
 */
export interface TokenCloningConfig {
  sourceTokenId: string;
  cloneType: 'exact' | 'modified' | 'template';
  
  // Customizations for the clone
  nameChanges?: Record<string, string>;
  symbolChanges?: Record<string, string>;
  configOverrides?: Record<string, any>;
  
  // Deployment settings
  targetNetwork?: string;
  deploymentParams?: Record<string, any>;
  
  // Validation
  validateBeforeClone?: boolean;
  includeTestData?: boolean;
}

/**
 * Enhanced Audit and Performance Types
 */
export interface AuditConfiguration {
  enabled?: boolean;
  auditProvider?: 'consensys' | 'openzeppelin' | 'certik' | 'quantstamp';
  auditType?: 'manual' | 'automated' | 'hybrid';
  
  // Audit scope
  auditScope?: string[];
  excludeFromAudit?: string[];
  
  // Results tracking
  auditResults?: Array<{
    date: string;
    provider: string;
    status: 'pass' | 'fail' | 'conditional';
    findings: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reportUrl?: string;
  }>;
}

/**
 * Performance Monitoring Configuration
 */
export interface PerformanceMonitoring {
  enabled?: boolean;
  
  // Gas optimization
  gasOptimization?: boolean;
  gasThresholds?: {
    warning: string;
    critical: string;
  };
  
  // Transaction monitoring
  txMonitoring?: boolean;
  maxConfirmationTime?: number;
  
  // Error tracking
  errorTracking?: boolean;
  errorThresholds?: {
    dailyLimit: number;
    weeklyLimit: number;
  };
  
  // Performance metrics
  performanceMetrics?: {
    trackTPS?: boolean;
    trackLatency?: boolean;
    trackErrorRate?: boolean;
  };
}

/**
 * Enhanced Multi-Signature Configuration
 */
export interface MultiSigConfiguration {
  enabled?: boolean;
  signers?: string[];
  threshold?: number;
  
  // Operation-specific thresholds
  operationThresholds?: {
    mint?: number;
    burn?: number;
    pause?: number;
    upgrade?: number;
    transfer?: number;
  };
  
  // Time locks
  timeLocks?: {
    enabled?: boolean;
    delays?: Record<string, number>;
  };
  
  // Emergency features
  emergencyPause?: {
    enabled?: boolean;
    signers?: string[];
    threshold?: number;
  };
}

/**
 * Enhanced Integration Types
 */
export interface DeFiIntegrations {
  // AMM Integrations
  uniswapV3?: boolean;
  sushiswap?: boolean;
  balancer?: boolean;
  curve?: boolean;
  
  // Lending Protocols
  aave?: boolean;
  compound?: boolean;
  maker?: boolean;
  
  // Yield Farming
  yieldFarming?: boolean;
  liquidityMining?: boolean;
  stakingPools?: boolean;
  
  // Insurance
  insuranceEnabled?: boolean;
  insuranceProviders?: string[];
}

/**
 * Social and Community Features
 */
export interface SocialFeatures {
  // Community governance
  communityGovernance?: boolean;
  proposalThreshold?: string;
  votingPower?: 'token' | 'nft' | 'hybrid';
  
  // Social tokens
  socialTokenFeatures?: boolean;
  creatorRoyalties?: boolean;
  fanEngagement?: boolean;
  
  // Reputation system
  reputationSystem?: boolean;
  reputationMetrics?: string[];
}

/**
 * AI and Machine Learning Integration
 */
export interface AIIntegration {
  enabled?: boolean;
  
  // Price prediction
  pricePrediction?: boolean;
  predictionModel?: string;
  
  // Risk assessment
  riskAssessment?: boolean;
  riskFactors?: string[];
  
  // Automated trading
  automatedTrading?: boolean;
  tradingStrategies?: string[];
  
  // Anomaly detection
  anomalyDetection?: boolean;
  anomalyThresholds?: Record<string, number>;
}