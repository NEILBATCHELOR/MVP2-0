/**
 * Token Types - Exports for token-related type definitions
 * 
 * This file exports token-related types from centralModels.ts and tokenTypes.ts
 * for easy import in other files.
 */

// Import Json type from supabase.ts
import type { Json } from '@/types/core/supabase';

// Import domain model types (camelCase) from centralModels.ts
import type { 
  Token,
  TokenVersion,
  TokenDeployment,
  TokenOperation,
  TokenTemplate,
  TokenDesign
} from '@/types/core/centralModels';

// Import enums from centralModels.ts
import { 
  TokenStatus,
  TokenStandard,
  TokenDeploymentStatus,
  TokenOperationStatus,
  TokenDesignStatus
} from '@/types/core/centralModels';

// Define token-specific data types
export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  contractAddress?: string;
  [key: string]: any;
}

export interface ERC20TokenData extends TokenMetadata {
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  cap?: string;
}

export interface ERC721TokenData extends TokenMetadata {
  baseUri?: string;
  maxSupply?: string;
  royaltyReceiver?: string;
  royaltyPercentage?: string;
}

export interface ERC1155TokenData extends TokenMetadata {
  baseUri?: string;
  tokenTypes?: { id: string; supply: string }[];
}

export interface ERC1400TokenData extends TokenMetadata {
  controllers?: string[];
  partitions?: { name: string; amount: string }[];
  transferRestrictions?: boolean;
}

export interface ERC3525TokenData extends TokenMetadata {
  slots?: { id: string; name: string }[];
  decimals: number;
}

export interface ERC4626TokenData extends TokenMetadata {
  assetToken: string;
  fee?: { managementFee?: string; performanceFee?: string };
}

export interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  errorMessage?: string;
}

export interface TokenOperationOptions {
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
  value?: string;
}

export interface TokenOperationResult {
  success: boolean;
  transactionHash?: string;
  errorMessage?: string;
}

// Import database types (snake_case) from database.ts
import type {
  TokensTable,
  TokenInsert,
  TokenUpdate,
  TokenVersionsTable,
  TokenVersionInsert,
  TokenVersionUpdate,
  TokenDeploymentsTable,
  TokenDeploymentInsert,
  TokenDeploymentUpdate,
  TokenOperationsTable,
  TokenOperationInsert,
  TokenOperationUpdate,
  TokenDesignsTable,
  TokenDesignInsert,
  TokenDesignUpdate,
  TokenTemplatesTable,
  TokenTemplateInsert,
  TokenTemplateUpdate
} from '@/types/core/database';

// Re-export domain model types (camelCase) from centralModels.ts
export type {
  Token,
  TokenVersion,
  TokenDeployment,
  TokenOperation,
  TokenTemplate,
  TokenDesign
};

// Re-export enums from centralModels.ts
export {
  TokenStatus,
  TokenStandard,
  TokenDeploymentStatus,
  TokenOperationStatus,
  TokenDesignStatus
};

// Re-export database types (snake_case) from database.ts
export type {
  TokensTable,
  TokenInsert,
  TokenUpdate,
  TokenVersionsTable,
  TokenVersionInsert,
  TokenVersionUpdate,
  TokenDeploymentsTable,
  TokenDeploymentInsert,
  TokenDeploymentUpdate,
  TokenOperationsTable,
  TokenOperationInsert,
  TokenOperationUpdate,
  TokenDesignsTable,
  TokenDesignInsert,
  TokenDesignUpdate,
  TokenTemplatesTable,
  TokenTemplateInsert,
  TokenTemplateUpdate
};

// Token-specific data types are defined above

// Re-export Json type
export type { Json };

// Helper to safely convert Json to Record<string, any>
const jsonToRecord = (json: Json | null): Record<string, any> => {
  if (!json || typeof json === 'string' || typeof json === 'number' || typeof json === 'boolean') {
    return {};
  }
  return json as Record<string, any>;
};

// Type mapping helpers
export const mapTokenDbToDomain = (dbToken: TokensTable): Token => ({
  id: dbToken.id,
  projectId: dbToken.project_id,
  name: dbToken.name,
  symbol: dbToken.symbol,
  decimals: dbToken.decimals,
  standard: dbToken.standard as unknown as TokenStandard,
  blocks: jsonToRecord(dbToken.blocks),
  metadata: jsonToRecord(dbToken.metadata),
  status: dbToken.status as unknown as TokenStatus,
  reviewers: dbToken.reviewers,
  approvals: dbToken.approvals,
  contractPreview: dbToken.contract_preview,
  totalSupply: dbToken.total_supply,
  createdAt: dbToken.created_at,
  updatedAt: dbToken.updated_at
});

export const mapTokenDomainToDb = (token: Token): TokenUpdate => ({
  project_id: token.projectId,
  name: token.name,
  symbol: token.symbol,
  decimals: token.decimals,
  standard: token.standard,
  blocks: token.blocks as Json,
  metadata: token.metadata as Json,
  status: token.status as "DRAFT" | "UNDER REVIEW" | "APPROVED" | "READY TO MINT" | "MINTED" | "DEPLOYED" | "PAUSED" | "DISTRIBUTED" | "REJECTED",
  reviewers: token.reviewers,
  approvals: token.approvals,
  contract_preview: token.contractPreview,
  total_supply: token.totalSupply
});

export const mapTokenVersionDbToDomain = (dbVersion: TokenVersionsTable): TokenVersion => ({
  id: dbVersion.id,
  tokenId: dbVersion.token_id,
  version: dbVersion.version,
  data: jsonToRecord(dbVersion.data),
  createdAt: dbVersion.created_at,
  createdBy: dbVersion.created_by,
  blocks: dbVersion.blocks ? jsonToRecord(dbVersion.blocks) : undefined,
  metadata: dbVersion.metadata ? jsonToRecord(dbVersion.metadata) : undefined,
  name: dbVersion.name,
  symbol: dbVersion.symbol,
  standard: dbVersion.standard as unknown as TokenStandard,
  decimals: dbVersion.decimals,
  notes: dbVersion.notes
});

export const mapTokenDeploymentDbToDomain = (dbDeployment: TokenDeploymentsTable): TokenDeployment => ({
  id: dbDeployment.id,
  tokenId: dbDeployment.token_id,
  network: dbDeployment.network,
  contractAddress: dbDeployment.contract_address,
  transactionHash: dbDeployment.transaction_hash,
  deployedAt: dbDeployment.deployed_at,
  deployedBy: dbDeployment.deployed_by,
  status: dbDeployment.status as unknown as TokenDeploymentStatus,
  deploymentData: dbDeployment.deployment_data ? jsonToRecord(dbDeployment.deployment_data) : undefined,
  createdAt: dbDeployment.deployed_at || new Date().toISOString(),
  updatedAt: undefined
});

export const mapTokenOperationDbToDomain = (dbOperation: TokenOperationsTable): TokenOperation => ({
  id: dbOperation.id,
  tokenId: dbOperation.token_id,
  operationType: dbOperation.operation_type,
  operator: dbOperation.operator,
  amount: dbOperation.amount,
  recipient: dbOperation.recipient,
  sender: dbOperation.sender,
  targetAddress: dbOperation.target_address,
  nftTokenId: dbOperation.nft_token_id,
  tokenTypeId: dbOperation.token_type_id,
  slotId: dbOperation.slot_id,
  value: dbOperation.value,
  partition: dbOperation.partition,
  assetTokenAddress: dbOperation.asset_token_address,
  lockDuration: dbOperation.lock_duration,
  lockReason: dbOperation.lock_reason,
  unlockTime: dbOperation.unlock_time,
  lockId: dbOperation.lock_id,
  transactionHash: dbOperation.transaction_hash,
  timestamp: dbOperation.timestamp,
  status: dbOperation.status as unknown as TokenOperationStatus,
  errorMessage: dbOperation.error_message,
  blocks: dbOperation.blocks ? jsonToRecord(dbOperation.blocks) : undefined,
  createdAt: dbOperation.timestamp || new Date().toISOString(),
  updatedAt: undefined
});

export const mapTokenTemplateDbToDomain = (dbTemplate: TokenTemplatesTable): TokenTemplate => ({
  id: dbTemplate.id,
  projectId: dbTemplate.project_id,
  name: dbTemplate.name,
  description: dbTemplate.description,
  standard: dbTemplate.standard as unknown as TokenStandard,
  blocks: jsonToRecord(dbTemplate.blocks),
  metadata: dbTemplate.metadata ? jsonToRecord(dbTemplate.metadata) : undefined,
  createdAt: dbTemplate.created_at,
  updatedAt: dbTemplate.updated_at,
  // Add missing required properties for TokenTemplate
  category: 'utility', // Changed from 'custom' to valid enum value
  complexity: 'basic', // Changed from 'beginner' to valid enum value
  features: [], // Default empty features array
  baseConfig: {}, // Default empty base config
  customizableFields: [], // Required by TokenTemplate interface
  requiredFields: [], // Required by TokenTemplate interface
  isPublic: false // Default private template
});

export const mapTokenDesignDbToDomain = (dbDesign: TokenDesignsTable): TokenDesign => ({
  id: dbDesign.id,
  name: dbDesign.name,
  type: dbDesign.type as unknown as TokenStandard,
  status: dbDesign.status as unknown as TokenDesignStatus,
  totalSupply: dbDesign.total_supply,
  contractAddress: dbDesign.contract_address,
  deploymentDate: dbDesign.deployment_date,
  createdAt: dbDesign.created_at,
  updatedAt: undefined
}); 