# ERC Token Standards Implementation

## Overview

This module implements a comprehensive system for managing tokens following various ERC standards (ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, ERC-4626). It provides form components, validation, and mapping utilities to transform data between the UI, business models, and database formats.

## Directory Structure

- `/forms`: Form components for creating and editing tokens
- `/utils/mappers`: Mapper utilities for translating between UI and database formats
- `/services`: Service functions for token operations
- `/validation`: Validation schemas for each token standard
- `/types`: TypeScript type definitions specific to token functionality
- `/hooks`: Custom React hooks for token-related functionality

## Key Improvements

### 1. Standardized Mapper Structure
- Implemented a comprehensive `TokenMapperFactory` in `mapperFactory.ts` that handles all token standards consistently
- Fixed import references to ensure proper usage of factory services
- Applied consistent mapping patterns across all standards

### 2. Fixed Type Compatibility Issues
- ERC-20: Standardized property access and naming conventions
- ERC-721: Implemented proper handling for the `enumerable` property
- ERC-1155: Fixed token types structure to match the expected format
- ERC-4626: Added proper type assertions for the `strategyController` property

### 3. Enhanced Code Organization
- Ensured proper separation between direct mappers and min/max mappers
- Improved mapper factory to support both configuration modes across all standards
- Established consistent property mapping strategies

## Usage Examples

### Creating a Token Using the Factory

```typescript
import { TokenMapperFactory, ConfigMode } from './utils/mappers/mapperFactory';
import { TokenStandard } from '@/types/centralModels';

// Create an empty token form with default values
const emptyToken = TokenMapperFactory.createEmptyToken(TokenStandard.ERC20, ConfigMode.MIN);

// Map form data to database format
const { tokenRecord, blocks, metadata } = TokenMapperFactory.toDatabaseRecord(
  TokenStandard.ERC20,
  ConfigMode.MIN,
  formData,
  projectId
);
```

### Using Direct Mappers

```typescript
import { 
  mapERC20FormToDatabase,
  mapDatabaseToERC20Form 
} from './utils/mappers/erc20Direct/erc20Mapper';

// Map form to database format
const dbProperties = mapERC20FormToDatabase(formData);

// Map database to form format
const formData = mapDatabaseToERC20Form(dbRecord);
```

## Token Standards Support

| Standard | Basic Mode | Advanced Mode | Direct Mapper |
|----------|------------|---------------|--------------|
| ERC-20   | ✅         | ✅           | ✅           |
| ERC-721  | ✅         | ✅           | ✅           |
| ERC-1155 | ✅         | ✅           | ✅           |
| ERC-1400 | ✅         | ✅           | ⚠️ Partial    |
| ERC-3525 | ✅         | ✅           | ⚠️ Partial    |
| ERC-4626 | ✅         | ✅           | ⚠️ Partial    |

## Next Steps

1. Complete implementation of direct mappers for ERC-1400, ERC-3525, and ERC-4626
2. Add comprehensive unit tests for all mappers
3. Improve documentation with more detailed examples
4. Consider refactoring to further reduce code duplication through common base mappers

## Recent Fixes

1. Fixed import path in `tokenBatchService.ts` to use the proper mapper factory
2. Corrected ERC1155 token types mapping to match expected interface structure
3. Fixed ERC721 enumerable property handling in minMapper
4. Added proper type assertion for strategyController in ERC4626 properties
