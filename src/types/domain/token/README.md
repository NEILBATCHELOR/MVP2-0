# Token System Type Definitions

This document outlines the type definitions for the token system, explaining how they are structured and how they should be used for CRUD operations.

## Overview

The token system consists of several interconnected tables and models:

1. **Core Token Table** - The main `tokens` table stores basic token information
2. **Token Deployments** - Records of token deployments to blockchain networks
3. **Token Operations** - Individual operations performed on tokens
4. **Token Versions** - Version history of tokens
5. **Token Designs** - Design specifications for tokens
6. **Token Templates** - Reusable templates for token creation
7. **Token Allocations** - Allocations of tokens to investors

## Database Types (from database.ts)

These types directly map to the database schema:

```typescript
// Table types
export type TokenTable = Tables<'tokens'>;
export type TokenVersionTable = Tables<'token_versions'>;
export type TokenDeploymentTable = Tables<'token_deployments'>;
export type TokenOperationTable = Tables<'token_operations'>;
export type TokenDesignTable = Tables<'token_designs'>;
export type TokenTemplateTable = Tables<'token_templates'>;
export type TokenAllocationTable = Tables<'token_allocations'>;

// Insert types
export type TokenInsert = InsertTables<'tokens'>;
export type TokenVersionInsert = InsertTables<'token_versions'>;
export type TokenDeploymentInsert = InsertTables<'token_deployments'>;
export type TokenOperationInsert = InsertTables<'token_operations'>;
export type TokenDesignInsert = InsertTables<'token_designs'>;
export type TokenTemplateInsert = InsertTables<'token_templates'>;
export type TokenAllocationInsert = InsertTables<'token_allocations'>;

// Update types
export type TokenUpdate = UpdateTables<'tokens'>;
export type TokenVersionUpdate = UpdateTables<'token_versions'>;
export type TokenDeploymentUpdate = UpdateTables<'token_deployments'>;
export type TokenOperationUpdate = UpdateTables<'token_operations'>;
export type TokenDesignUpdate = UpdateTables<'token_designs'>;
export type TokenTemplateUpdate = UpdateTables<'token_templates'>;
export type TokenAllocationUpdate = UpdateTables<'token_allocations'>;
```

## Business Model Types (from centralModels.ts)

These types represent the application domain models with camelCase property names:

```typescript
export interface Token extends BaseModel {
  name: string;
  symbol: string;
  decimals: number;
  standard: TokenStandard;
  projectId: string;
  blocks: Record<string, any>;
  metadata?: Record<string, any>;
  status: TokenStatus;
  // Other token properties
}

export interface TokenDeployment extends BaseModel {
  tokenId: string;
  network: string;
  contractAddress: string;
  transactionHash: string;
  deployedBy: string;
  // Other deployment properties
}

// And similar interfaces for TokenVersion, TokenOperation, TokenDesign, etc.
```

## Enums

Important enums for token operations:

```typescript
export enum TokenStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  READY_TO_MINT = 'READY_TO_MINT',
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

export enum TokenDeploymentStatus {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED'
}
```

## Mapper Types

The mapper types connect database and business models:

```typescript
export type TokenData = TokenTable & Partial<Token>;
export type TokenVersionData = TokenVersionTable & Partial<TokenVersion>;
export type TokenDeploymentData = TokenDeploymentTable & Partial<TokenDeployment>;
export type TokenDesignData = TokenDesignTable & Partial<TokenDesign>; 
export type TokenTemplateData = TokenTemplateTable & Partial<TokenTemplate>;
export type TokenOperationData = TokenOperationTable & Partial<TokenOperation>;
export type TokenAllocationData = TokenAllocationTable & Partial<TokenAllocation>;
```

## CRUD Operations Guide

### Creating a Token

```typescript
import { TokenInsert } from "@/types/database";

// Create a new token
const newToken: TokenInsert = {
  name: "My Token",
  symbol: "TKN",
  project_id: projectId,
  standard: "ERC-20",
  decimals: 18,
  status: "DRAFT",
  blocks: {
    is_mintable: true,
    is_burnable: false,
    is_pausable: true
  },
  metadata: {
    description: "My token description",
    total_supply: "1000000"
  }
};

// Insert into database
const { data, error } = await supabase
  .from('tokens')
  .insert(newToken)
  .select()
  .single();
```

### Reading Tokens

```typescript
import { TokenTable } from "@/types/database";
import { Token } from "@/types/centralModels";

// Get a token by ID
const { data, error } = await supabase
  .from('tokens')
  .select('*')
  .eq('id', tokenId)
  .single();

// Convert to domain model
const token: Token = {
  id: data.id,
  name: data.name,
  symbol: data.symbol,
  decimals: data.decimals,
  projectId: data.project_id,
  standard: data.standard,
  status: data.status,
  blocks: data.blocks || {},
  metadata: data.metadata || {},
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  approvals: data.approvals,
  reviewers: data.reviewers,
  contractPreview: data.contract_preview,
  totalSupply: data.total_supply
};
```

### Updating a Token

```typescript
import { TokenUpdate } from "@/types/database";

// Update a token
const updates: TokenUpdate = {
  status: "REVIEW",
  metadata: {
    ...existingToken.metadata,
    description: "Updated description"
  }
};

// Update in database
const { data, error } = await supabase
  .from('tokens')
  .update(updates)
  .eq('id', tokenId)
  .select()
  .single();
```

### Deleting a Token

```typescript
// Delete a token
const { error } = await supabase
  .from('tokens')
  .delete()
  .eq('id', tokenId);
```

## Token Related Operations

### Creating a Token Deployment

```typescript
import { TokenDeploymentInsert } from "@/types/database";

const deployment: TokenDeploymentInsert = {
  token_id: tokenId,
  network: "ethereum",
  contract_address: "0x...",
  transaction_hash: "0x...",
  deployed_by: userId,
  status: "SUCCESSFUL",
  deployment_data: {
    gas_used: 1500000,
    block_number: 12345678
  }
};

await supabase.from('token_deployments').insert(deployment);
```

### Recording a Token Operation

```typescript
import { TokenOperationInsert } from "@/types/database";

const operation: TokenOperationInsert = {
  token_id: tokenId,
  operation_type: "TRANSFER",
  operator: userId,
  recipient: "0x...",
  sender: "0x...",
  amount: 100,
  transaction_hash: "0x...",
  status: "SUCCESSFUL"
};

await supabase.from('token_operations').insert(operation);
```

## Important Notes

1. The `blocks` field in the tokens table stores token functionality configurations
2. The `metadata` field stores additional descriptive information
3. Token standards must match the values in `tokens_standard_check` constraint
4. Token deployments reference the token via `token_id` foreign key
5. Token operations also reference the token via `token_id` foreign key

Always ensure your token data follows the database constraints defined in `token_system_tables.sql`.