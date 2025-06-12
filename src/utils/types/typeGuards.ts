/**
 * Type Guards
 * 
 * This utility file provides type guard functions for runtime type checking
 * to help TypeScript narrow types correctly. They validate API response data
 * and ensure type safety when working with unknown data.
 */

import type { 
  Investor, 
  Organization, 
  InvestorApproval,
  Distribution,
  DistributionRedemption,
  User,
  Project,
  BaseSubscription,
  BaseRedemptionRequest,
  BaseTokenAllocation,
  RedemptionWindow,
  ActivityLog,
  Wallet,
  Transaction,
  MultiSigTransaction,
  Token,
  TokenERC20Properties,
  TokenERC721Properties,
  TokenERC721Attribute,
  TokenERC1155Properties,
  TokenERC1155Type,
  TokenERC1155Balance,
  TokenERC1155UriMapping,
  TokenERC1400Properties,
  TokenERC1400Partition,
  TokenERC1400Controller,
  TokenERC3525Properties,
  TokenERC3525Slot,
  TokenERC3525Allocation,
  TokenERC4626Properties,
  TokenERC4626StrategyParam,
  TokenERC4626AssetAllocation,
  TokenVersion,
  TokenDeployment,
  TokenOperation,
  TokenTemplate,
  TokenDesign,
  IssuerDocument
} from '@/types/core/centralModels';

import {
  InvestorEntityType,
  KycStatus,
  AccreditationStatus,
  InvestorStatus,
  OrganizationStatus,
  ComplianceStatusType,
  UserRole,
  UserStatus,
  ProjectStatus,
  ProjectType,
  ApprovalStatus,
  ApprovalType,
  TokenStatus,
  TokenStandard,
  TokenDeploymentStatus,
  TokenOperationStatus,
  WalletType,
  TokenType,
  IssuerDocumentType
} from '@/types/core/centralModels';

/**
 * Check if a value is a valid UUID
 */
export const isUuid = (id: any): boolean => {
  if (typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Check if a value is a valid date string
 */
export const isDateString = (date: any): boolean => {
  if (typeof date !== 'string') return false;
  return !isNaN(Date.parse(date));
};

/**
 * Type guard for User
 */
export const isUser = (obj: any): obj is User => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    typeof obj.email === 'string' &&
    (
      obj.role === UserRole.ADMIN ||
      obj.role === UserRole.USER ||
      obj.role === UserRole.INVESTOR
    ) &&
    (
      obj.status === UserStatus.ACTIVE ||
      obj.status === UserStatus.INACTIVE ||
      obj.status === UserStatus.PENDING ||
      obj.status === UserStatus.SUSPENDED
    ) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for Project
 */
export const isProject = (obj: any): obj is Project => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    typeof obj.name === 'string' &&
    (
      obj.status === ProjectStatus.DRAFT ||
      obj.status === ProjectStatus.ACTIVE ||
      obj.status === ProjectStatus.FUNDED ||
      obj.status === ProjectStatus.CLOSED ||
      obj.status === ProjectStatus.CANCELLED
    ) &&
    (
      obj.projectType === ProjectType.EQUITY ||
      obj.projectType === ProjectType.TOKEN ||
      obj.projectType === ProjectType.HYBRID ||
      obj.projectType === ProjectType.RECEIVABLES
    ) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for Investor
 */
export const isInvestor = (obj: any): obj is Investor => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    (
      obj.type === InvestorEntityType.INDIVIDUAL ||
      obj.type === InvestorEntityType.INSTITUTIONAL ||
      obj.type === InvestorEntityType.SYNDICATE
    ) &&
    (
      obj.kycStatus === undefined ||
      Object.values(KycStatus).includes(obj.kycStatus)
    ) &&
    (
      obj.accreditationStatus === undefined ||
      Object.values(AccreditationStatus).includes(obj.accreditationStatus)
    ) &&
    (
      obj.investorStatus === undefined ||
      Object.values(InvestorStatus).includes(obj.investorStatus)
    ) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for Organization
 */
export const isOrganization = (obj: any): obj is Organization => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    typeof obj.name === 'string' &&
    (
      obj.status === undefined ||
      Object.values(OrganizationStatus).includes(obj.status)
    ) &&
    (
      obj.complianceStatus === undefined ||
      Object.values(ComplianceStatusType).includes(obj.complianceStatus)
    ) &&
    (
      obj.onboardingCompleted === undefined ||
      typeof obj.onboardingCompleted === 'boolean'
    ) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for InvestorApproval
 */
export const isInvestorApproval = (obj: any): obj is InvestorApproval => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.investorId) &&
    (obj.reviewerId === undefined || isUuid(obj.reviewerId)) &&
    Object.values(ApprovalStatus).includes(obj.status) &&
    Object.values(ApprovalType).includes(obj.approvalType) &&
    typeof obj.submissionDate === 'string' &&
    (
      obj.approvalDate === undefined ||
      isDateString(obj.approvalDate)
    ) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for BaseSubscription
 */
export const isBaseSubscription = (obj: any): obj is BaseSubscription => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.investorId) &&
    isUuid(obj.projectId) &&
    typeof obj.amount === 'number' &&
    ['pending', 'approved', 'rejected', 'completed'].includes(obj.status) &&
    (
      obj.paymentStatus === undefined || 
      ['pending', 'processing', 'completed', 'failed'].includes(obj.paymentStatus)
    ) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for BaseRedemptionRequest
 */
export const isBaseRedemptionRequest = (obj: any): obj is BaseRedemptionRequest => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    (isDateString(obj.requestDate) || obj.requestDate instanceof Date) &&
    typeof obj.tokenAmount === 'number' &&
    typeof obj.tokenType === 'string' &&
    typeof obj.redemptionType === 'string' &&
    ["Pending", "Approved", "Processing", "Completed", "Rejected"].includes(obj.status) &&
    typeof obj.sourceWalletAddress === 'string' &&
    typeof obj.destinationWalletAddress === 'string' &&
    typeof obj.conversionRate === 'number' &&
    typeof obj.requiredApprovals === 'number' &&
    Array.isArray(obj.approvers) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for BaseTokenAllocation
 */
export const isBaseTokenAllocation = (obj: any): obj is BaseTokenAllocation => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.investorId) &&
    typeof obj.investorName === 'string' &&
    isUuid(obj.projectId) &&
    typeof obj.tokenType === 'string' &&
    typeof obj.subscribedAmount === 'number' &&
    typeof obj.allocatedAmount === 'number' &&
    typeof obj.confirmed === 'boolean' &&
    typeof obj.allocationConfirmed === 'boolean' &&
    typeof obj.status === 'string' &&
    (
      obj.allocationDate === undefined ||
      isDateString(obj.allocationDate)
    ) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for RedemptionWindow
 */
export const isRedemptionWindow = (obj: any): obj is RedemptionWindow => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.projectId) &&
    isDateString(obj.startDate) &&
    isDateString(obj.endDate) &&
    ['upcoming', 'active', 'closed'].includes(obj.status) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for ActivityLog
 */
export const isActivityLog = (obj: any): obj is ActivityLog => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    typeof obj.action === 'string' &&
    (obj.userId === undefined || isUuid(obj.userId)) &&
    (obj.entityId === undefined || typeof obj.entityId === 'string') &&
    (obj.entityType === undefined || typeof obj.entityType === 'string') &&
    (obj.projectId === undefined || isUuid(obj.projectId)) &&
    (
      obj.status === undefined || 
      ['success', 'error', 'pending'].includes(obj.status)
    ) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for Wallet
 */
export const isWallet = (obj: any): obj is Wallet => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    typeof obj.name === 'string' &&
    typeof obj.address === 'string' &&
    Object.values(WalletType).includes(obj.type) &&
    (obj.userId === undefined || isUuid(obj.userId)) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for Transaction
 */
export const isTransaction = (obj: any): obj is Transaction => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.walletId) &&
    typeof obj.to === 'string' &&
    typeof obj.value === 'string' &&
    ['pending', 'confirmed', 'failed'].includes(obj.status) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for MultiSigTransaction
 */
export const isMultiSigTransaction = (obj: any): obj is MultiSigTransaction => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.walletId) &&
    typeof obj.to === 'string' &&
    typeof obj.value === 'string' &&
    ['pending', 'confirmed', 'failed'].includes(obj.status) &&
    typeof obj.confirmations === 'number' &&
    typeof obj.required === 'number' &&
    typeof obj.executed === 'boolean' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for Token
 */
export const isToken = (obj: any): obj is Token => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    typeof obj.name === 'string' &&
    typeof obj.symbol === 'string' &&
    typeof obj.decimals === 'number' &&
    Object.values(TokenStandard).includes(obj.standard) &&
    isUuid(obj.projectId) &&
    typeof obj.blocks === 'object' &&
    Object.values(TokenStatus).includes(obj.status) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC20Properties
 */
export const isTokenERC20Properties = (obj: any): obj is TokenERC20Properties => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.initialSupply === 'string' &&
    typeof obj.isBurnable === 'boolean' &&
    typeof obj.isPausable === 'boolean' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC721Properties
 */
export const isTokenERC721Properties = (obj: any): obj is TokenERC721Properties => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.hasRoyalty === 'boolean' &&
    typeof obj.isMintable === 'boolean' &&
    typeof obj.isBurnable === 'boolean' &&
    typeof obj.isPausable === 'boolean' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC721Attribute
 */
export const isTokenERC721Attribute = (obj: any): obj is TokenERC721Attribute => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.traitType === 'string' &&
    Array.isArray(obj.values) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC1155Properties
 */
export const isTokenERC1155Properties = (obj: any): obj is TokenERC1155Properties => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.hasRoyalty === 'boolean' &&
    typeof obj.isBurnable === 'boolean' &&
    typeof obj.isPausable === 'boolean' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC1155Type
 */
export const isTokenERC1155Type = (obj: any): obj is TokenERC1155Type => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.tokenTypeId === 'string' &&
    typeof obj.name === 'string' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC1155Balance
 */
export const isTokenERC1155Balance = (obj: any): obj is TokenERC1155Balance => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.tokenTypeId === 'string' &&
    typeof obj.address === 'string' &&
    typeof obj.amount === 'string' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC1155UriMapping
 */
export const isTokenERC1155UriMapping = (obj: any): obj is TokenERC1155UriMapping => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.tokenTypeId === 'string' &&
    typeof obj.uri === 'string' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC1400Properties
 */
export const isTokenERC1400Properties = (obj: any): obj is TokenERC1400Properties => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.isMintable === 'boolean' &&
    typeof obj.isBurnable === 'boolean' &&
    typeof obj.isPausable === 'boolean' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC1400Partition
 */
export const isTokenERC1400Partition = (obj: any): obj is TokenERC1400Partition => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.name === 'string' &&
    typeof obj.partitionId === 'string' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC1400Controller
 */
export const isTokenERC1400Controller = (obj: any): obj is TokenERC1400Controller => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.address === 'string' &&
    Array.isArray(obj.permissions) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC3525Properties
 */
export const isTokenERC3525Properties = (obj: any): obj is TokenERC3525Properties => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.hasRoyalty === 'boolean' &&
    typeof obj.isBurnable === 'boolean' &&
    typeof obj.isPausable === 'boolean' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC3525Slot
 */
export const isTokenERC3525Slot = (obj: any): obj is TokenERC3525Slot => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.slotId === 'string' &&
    typeof obj.name === 'string' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC3525Allocation
 */
export const isTokenERC3525Allocation = (obj: any): obj is TokenERC3525Allocation => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.tokenUnitId === 'string' &&
    typeof obj.slotId === 'string' &&
    typeof obj.recipient === 'string' &&
    typeof obj.value === 'string' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC4626Properties
 */
export const isTokenERC4626Properties = (obj: any): obj is TokenERC4626Properties => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC4626StrategyParam
 */
export const isTokenERC4626StrategyParam = (obj: any): obj is TokenERC4626StrategyParam => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.name === 'string' &&
    typeof obj.value === 'string' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenERC4626AssetAllocation
 */
export const isTokenERC4626AssetAllocation = (obj: any): obj is TokenERC4626AssetAllocation => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.assetAddress === 'string' &&
    typeof obj.allocation === 'string' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenVersion
 */
export const isTokenVersion = (obj: any): obj is TokenVersion => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.version === 'number' &&
    typeof obj.data === 'object' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenDeployment
 */
export const isTokenDeployment = (obj: any): obj is TokenDeployment => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.network === 'string' &&
    typeof obj.contractAddress === 'string' &&
    typeof obj.transactionHash === 'string' &&
    typeof obj.deployedBy === 'string' &&
    Object.values(TokenDeploymentStatus).includes(obj.status) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenOperation
 */
export const isTokenOperation = (obj: any): obj is TokenOperation => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.tokenId) &&
    typeof obj.operationType === 'string' &&
    typeof obj.operator === 'string' &&
    Object.values(TokenOperationStatus).includes(obj.status) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenTemplate
 */
export const isTokenTemplate = (obj: any): obj is TokenTemplate => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    typeof obj.name === 'string' &&
    isUuid(obj.projectId) &&
    Object.values(TokenStandard).includes(obj.standard) &&
    typeof obj.blocks === 'object' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for TokenDesign
 */
export const isTokenDesign = (obj: any): obj is TokenDesign => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    typeof obj.name === 'string' &&
    Object.values(TokenStandard).includes(obj.type) &&
    typeof obj.status === 'string' &&
    typeof obj.totalSupply === 'number' &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for IssuerDocument
 */
export const isIssuerDocument = (obj: any): obj is IssuerDocument => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUuid(obj.id) &&
    isUuid(obj.projectId) &&
    Object.values(IssuerDocumentType).includes(obj.documentType) &&
    typeof obj.documentUrl === 'string' &&
    typeof obj.documentName === 'string' &&
    isDateString(obj.uploadedAt) &&
    ['active', 'archived', 'pending_review'].includes(obj.status) &&
    (
      obj.createdAt === undefined ||
      isDateString(obj.createdAt)
    )
  );
};

/**
 * Type guard for array of Investors
 */
export const areInvestors = (arr: any[]): arr is Investor[] => {
  return arr.every(isInvestor);
};

/**
 * Type guard for array of Organizations
 */
export const areOrganizations = (arr: any[]): arr is Organization[] => {
  return arr.every(isOrganization);
};

/**
 * Type guard for array of InvestorApprovals
 */
export const areInvestorApprovals = (arr: any[]): arr is InvestorApproval[] => {
  return arr.every(isInvestorApproval);
};

/**
 * Type guard to check if a value is a Distribution
 * @param value The value to check
 * @returns Whether the value is a Distribution
 */
export function isDistribution(value: unknown): value is Distribution {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.tokenAllocationId === 'string' &&
    typeof obj.investorId === 'string' &&
    typeof obj.subscriptionId === 'string' &&
    typeof obj.tokenType === 'string' &&
    typeof obj.tokenAmount === 'number' &&
    typeof obj.distributionDate === 'string' &&
    typeof obj.distributionTxHash === 'string' &&
    typeof obj.toAddress === 'string' &&
    typeof obj.blockchain === 'string' &&
    typeof obj.remainingAmount === 'number' &&
    typeof obj.fullyRedeemed === 'boolean' &&
    typeof obj.createdAt === 'string'
  );
}

/**
 * Type guard to check if a value is a DistributionRedemption
 * @param value The value to check
 * @returns Whether the value is a DistributionRedemption
 */
export function isDistributionRedemption(value: unknown): value is DistributionRedemption {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.distributionId === 'string' &&
    typeof obj.redemptionRequestId === 'string' &&
    typeof obj.amountRedeemed === 'number' &&
    typeof obj.createdAt === 'string'
  );
}