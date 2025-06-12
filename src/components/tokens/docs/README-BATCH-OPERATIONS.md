# Token Batch Operations

This document outlines the batch operations functionality for token management, enabling efficient handling of multiple tokens in a single operation.

## Overview

The batch operations system allows you to:

1. Create multiple tokens at once
2. Update multiple tokens at once
3. Delete multiple tokens at once
4. Import tokens from templates
5. Clone existing tokens with modifications
6. Update token statuses in bulk

These operations are particularly useful for:
- Managing token collections (NFT sets, multi-token standards)
- Bulk data imports and migrations
- Templated token creation
- Status updates for multiple tokens in a workflow

## Key Features

### 1. Optimized Sequential Processing

- All batch operations process tokens sequentially to ensure database consistency
- Detailed error tracking for each token in the batch
- Continues processing even if individual operations fail
- Comprehensive results reporting

### 2. Consistent Error Handling

- Each operation captures and reports detailed errors
- Failed tokens don't affect successful ones
- Error details available for debugging and user feedback

### 3. Project Validation

- All operations validate tokens against the project ID
- Prevents cross-project token manipulation
- Ensures security in multi-project environments

### 4. Comprehensive Results

- Success/failure count
- Individual token operation results
- Detailed error information
- Original request data for reference

## API Reference

### Creating Multiple Tokens

```typescript
import { createTokensBatch } from '@/components/tokens/services/tokenBatchService';

// Create multiple tokens in a single operation
const batchResult = await createTokensBatch(projectId, [
  {
    name: "Token A",
    symbol: "TKA",
    standard: TokenStandard.ERC20,
    // ...more properties
  },
  {
    name: "Token B",
    symbol: "TKB",
    standard: TokenStandard.ERC721,
    // ...more properties
  }
]);

console.log(`Created ${batchResult.succeeded} tokens successfully`);
console.log(`Failed to create ${batchResult.failed} tokens`);
```

### Updating Multiple Tokens

```typescript
import { updateTokensBatch } from '@/components/tokens/services/tokenBatchService';

// Update multiple tokens in a single operation
const batchResult = await updateTokensBatch(projectId, [
  {
    id: "token-id-1",
    data: {
      name: "Updated Token A",
      symbol: "UTKA"
    }
  },
  {
    id: "token-id-2",
    data: {
      name: "Updated Token B",
      symbol: "UTKB"
    }
  }
]);
```

### Deleting Multiple Tokens

```typescript
import { deleteTokensBatch } from '@/components/tokens/services/tokenBatchService';

// Delete multiple tokens in a single operation
const batchResult = await deleteTokensBatch(projectId, [
  "token-id-1",
  "token-id-2",
  "token-id-3"
]);
```

### Importing From Templates

```typescript
import { importTokensFromTemplates } from '@/components/tokens/services/tokenBatchService';

// Import tokens from templates with customizations
const batchResult = await importTokensFromTemplates(projectId, [
  {
    templateId: "template-id-1",
    overrides: {
      name: "Custom Template Token A",
      symbol: "CTTA"
    }
  },
  {
    templateId: "template-id-2"
  }
]);
```

### Cloning Existing Tokens

```typescript
import { cloneTokensBatch } from '@/components/tokens/services/tokenBatchService';

// Clone existing tokens with modifications
const batchResult = await cloneTokensBatch(projectId, [
  {
    sourceTokenId: "token-id-1",
    modifications: {
      name: "Clone of Token A",
      symbol: "CLNA"
    }
  },
  {
    sourceTokenId: "token-id-2"
  }
]);
```

### Batch Status Updates

```typescript
import { updateTokenStatusBatch } from '@/components/tokens/services/tokenBatchService';

// Update statuses for multiple tokens
const batchResult = await updateTokenStatusBatch(projectId, [
  { tokenId: "token-id-1", status: "APPROVED" },
  { tokenId: "token-id-2", status: "REJECTED" },
  { tokenId: "token-id-3", status: "UNDER REVIEW" }
]);
```

## Best Practices

1. **Batch Size**
   - Keep batch sizes reasonable (under 50 tokens per batch)
   - Consider using multiple smaller batches for very large operations

2. **Error Handling**
   - Always check the `success` flag and `failed` count
   - Examine individual errors for failed tokens
   - Consider retry logic for specific failure types

3. **Transaction Safety**
   - Each token operation is independent
   - The system doesn't use database transactions across tokens
   - Implementations should handle partial batch success gracefully

4. **UI Integration**
   - Use a progress indicator for batch operations
   - Show summary results (success/failure counts)
   - Provide detailed error information for failed items
   - Offer retry options for failed tokens 