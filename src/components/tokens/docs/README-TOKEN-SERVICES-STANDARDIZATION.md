# Token Services Standardization

## Overview

This document outlines the standardization of token services to ensure consistency in how they interact with mappers across all supported ERC token standards (ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, ERC-4626).

## Problem Statement

We identified an inconsistency in how token services use their respective direct mappers:

- **ERC-721 Service** and **ERC-1155 Service** were properly importing and using their direct mapper functions
- **ERC-20 Service** was implementing its own mapping functions and only partially using the direct mappers from `erc20Direct/erc20Mapper.ts`

This inconsistency made the codebase less maintainable and could lead to divergent implementations as the system evolves.

## Solution

We've standardized the approach by ensuring all token services use the direct mappers consistently:

1. **ERC-20 Service Updates**:
   - Updated import statements to use aliases for clarity
   - Replaced inline property mapping with calls to direct mapper functions
   - Made changes consistent with the pattern used in ERC-721 and ERC-1155 services

## Implementation Details

### Before:

```typescript
// Inconsistent imports
import { 
  enhanceTokenWithERC20Properties, 
  mapERC20PropertiesToDB, 
  mapERC20FormToDatabase,
  validateERC20TokenData
} from '../utils/mappers/erc20Direct/erc20Mapper';

// Custom mapping implementation duplicating mapper functionality
return {
  id: result.id,
  tokenId: result.token_id,
  initialSupply: result.initial_supply || '0',
  // ...other properties
};
```

### After:

```typescript
// Standardized imports with aliases for clarity
import {
  enhanceTokenWithERC20Properties,
  mapERC20PropertiesToDB as mapperPropertiesToDB,
  mapERC20PropertiesToModel as mapperPropertiesToModel,
  mapERC20FormToDatabase as mapperFormToDatabase,
  validateERC20TokenData
} from '../utils/mappers/erc20Direct/erc20Mapper';

// Delegating to direct mapper function
return mapperPropertiesToModel(result);
```

## Benefits

1. **Consistency**: All token services now follow the same pattern for using mappers
2. **Maintainability**: Reduces code duplication by leveraging the centralized mapper functions
3. **Type Safety**: Ensures consistent type handling across all token standard implementations
4. **Separation of Concerns**: Clearly separates database access from data transformation logic

## Next Steps

1. Continue standardizing the remaining token standard services (ERC-1400, ERC-3525, ERC-4626)
2. Add comprehensive testing for all standardized services
3. Consider further refactoring to extract common service patterns
4. Update technical documentation to reflect the standardized approach

## Completed Tasks

- [x] Standardize ERC-20 service to use direct mappers consistently
- [x] Ensure mapper function names have consistent aliases across services
- [x] Maintain backward compatibility with existing functionality
- [x] Document the standardization approach

## Remaining Tasks

- [ ] Apply similar standardization to ERC-1400, ERC-3525, and ERC-4626 services
- [ ] Add comprehensive tests for all standardized services
- [ ] Review for any missed inconsistencies in the token service implementations