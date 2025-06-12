# Token Data Validation

This document outlines the token data validation system implemented to ensure data integrity and prevent errors during token operations.

## Overview

The validation system uses Zod schemas to provide comprehensive checks for:

- Basic token data (name, symbol, standard)
- Standard-specific requirements (e.g., decimals for fungible tokens)
- Type correctness and format validation
- Batch validation for multiple tokens

## Key Features

### 1. Schema-Based Validation

The validation system uses Zod schemas for:

- **Type Safety**: Full TypeScript integration with inferred types
- **Composable Schemas**: Building complex validation rules from simple components
- **Comprehensive Validations**: Automatic validation of data structure and content

### 2. Multi-Level Validation

Validation occurs at multiple levels:

- **Base Schema**: Common fields required for all token types
- **Token-Specific Schemas**: Validations unique to each token standard
- **Discriminated Union**: Handling different configuration modes (min/max)

### 3. Detailed Error Reporting

Each validation error provides:

- Field name with exact path (including nested properties)
- Human-readable error message
- Grouped by validation type for better organization

### 4. Batch Validation

Supports validating multiple tokens at once:

- Pre-validates entire batch before processing
- Aggregates validation errors by token
- Provides summary statistics (valid/invalid counts)

### 5. Service Integration

The validation system is integrated with:

- Token creation services
- Batch operations
- Token updates
- Form hooks for React components

## Schema Structure

### Base Schema

The base schema validates common fields across all token standards:

```typescript
// Common validation schema for all token types
export const baseTokenSchema = z.object({
  name: z.string().min(1, 'Token name is required').max(100, 'Token name is too long'),
  symbol: z.string().min(1, 'Token symbol is required').max(10, 'Token symbol is too long'),
  description: z.string().optional(),
  standard: z.nativeEnum(TokenStandard, {
    errorMap: () => ({ message: 'Invalid token standard' })
  }),
  config_mode: z.enum(['min', 'max', 'basic', 'advanced']).optional(),
});
```

### Token-Specific Schemas

Each token standard has its own schema with specific validations:

- **ERC-20**: Validates decimals, cap, supply, etc.
- **ERC-721**: Validates URI formats, royalty settings, etc.
- **ERC-1155**: Validates token types, URI format, etc.
- **ERC-1400**: Validates compliance settings, partitions, etc.
- **ERC-3525**: Validates slot decimals, slot configuration, etc.
- **ERC-4626**: Validates asset address, vault settings, etc.

### Configuration Modes

Each token standard supports different configuration modes (min/max):

```typescript
// Create a union type to handle both min and max configurations
export const erc20Schema = z.discriminatedUnion('config_mode', [
  erc20MinSchema,
  erc20MaxSchema
]);
```

## Usage

### Single Token Validation

```typescript
import { validateTokenData } from '@/components/tokens/services/tokenDataValidation';

// Validate a single token
const tokenData: Partial<TokenFormData> = {
  name: 'My Token',
  symbol: 'MTK',
  standard: TokenStandard.ERC20,
  decimals: 18
};

const validation = validateTokenData(tokenData);

if (validation.valid) {
  console.log('Token data is valid!');
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Batch Validation

```typescript
import { 
  validateBatchTokenData, 
  getBatchValidationSummary 
} from '@/components/tokens/services/tokenDataValidation';

// Validate multiple tokens
const tokensData: Partial<TokenFormData>[] = [
  { /* token 1 data */ },
  { /* token 2 data */ },
  { /* token 3 data */ }
];

const batchValidation = validateBatchTokenData(tokensData);
const summary = getBatchValidationSummary(batchValidation);

console.log(`Valid tokens: ${summary.validCount}`);
console.log(`Invalid tokens: ${summary.invalidCount}`);

if (!summary.valid) {
  console.error('Invalid tokens:', summary.errors);
}
```

### Direct Schema Usage

You can also use the schemas directly for more control:

```typescript
import { erc20Schema } from '@/components/tokens/validation/schemas';
import { validateForm } from '@/components/tokens/validation/formErrorParser';

const { success, errors } = validateForm(erc20Schema, tokenData);

if (!success) {
  console.error('Validation errors:', errors);
}
```

## Schema Adapters

The validation system includes adapters to convert between database and form formats:

```typescript
import { TokenMapperFactory } from '@/components/tokens/utils/mappers';
import { adaptERC20Properties } from '@/components/tokens/validation/schemaAdapters';

// Convert database record to form data
const formData = adaptERC20Properties(databaseRecord);

// Convert form data back to database format
const databaseData = TokenMapperFactory.toDatabaseRecord(
  TokenStandard.ERC20,
  'max',
  formData,
  projectId
);
```

## Error Handling

Validation errors are automatically:

1. Logged to the console for debugging
2. Returned as structured data for UI display
3. Summarized for batch operations
4. Thrown as exceptions when used in services to prevent invalid data from being processed 