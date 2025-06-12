# Token System Type Implementation

## Summary

We've implemented a comprehensive token type system based on the SQL schema provided. This implementation includes database table types, domain model interfaces, and utility functions to work with tokens, token versions, token deployments, token operations, token designs, and token templates.

## Files Created/Updated

1. **src/types/database.ts**
   - Added types for token-related database tables
   - Added insert and update types for all token tables

2. **src/types/centralModels.ts**
   - Added and updated token-related domain model interfaces
   - Updated enums for token standards, status, and operations
   - Added new enums for token deployment status and token design status

3. **src/types/tokens/index.ts**
   - Created a central export file for all token-related types
   - Implemented type mapping functions to convert between database and domain models

4. **src/types/tokens/README.md**
   - Comprehensive documentation of the token type system
   - Details on all interfaces, enums, and relationships

5. **src/migrations/token_system_tables.sql**
   - Migration script to ensure all token-related tables exist in the database
   - Includes constraints, indexes, and triggers as defined in the original schema

## New Types Added

### Database Types
- `TokenTable`, `TokenInsert`, `TokenUpdate`
- `TokenVersionTable`, `TokenVersionInsert`, `TokenVersionUpdate`
- `TokenDeploymentTable`, `TokenDeploymentInsert`, `TokenDeploymentUpdate`
- `TokenOperationTable`, `TokenOperationInsert`, `TokenOperationUpdate`
- `TokenDesignTable`, `TokenDesignInsert`, `TokenDesignUpdate`
- `TokenTemplateTable`, `TokenTemplateInsert`, `TokenTemplateUpdate`

### Domain Model Types
- `Token`
- `TokenVersion`
- `TokenDeployment`
- `TokenOperation`
- `TokenDesign`
- `TokenTemplate`

### Enums
- `TokenStandard` - Extended to include ERC-1400, ERC-3525, ERC-4626
- `TokenStatus` - Token workflow states
- `TokenDeploymentStatus` - Status of token deployments
- `TokenOperationStatus` - Status of token operations
- `TokenDesignStatus` - Status of token designs

## Mapping Functions

- `mapTokenDbToDomain` - Maps from database token to domain token
- `mapTokenDomainToDb` - Maps from domain token to database token update
- `mapTokenVersionDbToDomain` - Maps from database token version to domain token version
- `mapTokenDeploymentDbToDomain` - Maps from database deployment to domain deployment
- `mapTokenOperationDbToDomain` - Maps from database operation to domain operation
- `mapTokenTemplateDbToDomain` - Maps from database template to domain template
- `mapTokenDesignDbToDomain` - Maps from database design to domain design

## Usage

To use the token types in your code:

```typescript
// Import domain model types (camelCase)
import { Token, TokenStandard, TokenStatus } from '@/types/tokens';

// Import database types (snake_case)
import { TokenTable, TokenInsert } from '@/types/tokens';

// Import mapping functions
import { mapTokenDbToDomain, mapTokenDomainToDb } from '@/types/tokens';

// Example: Creating a new token
const newToken: TokenInsert = {
  project_id: projectId,
  name: "My Token",
  symbol: "TKN",
  decimals: 18,
  standard: TokenStandard.ERC20,
  blocks: { /* token configuration */ },
  status: TokenStatus.DRAFT
};

// Example: Converting from database to domain model
const dbToken: TokenTable = await supabase.from('tokens').select().eq('id', tokenId).single();
const token: Token = mapTokenDbToDomain(dbToken);

// Example: Converting from domain to database model
const tokenUpdate = mapTokenDomainToDb(token);
await supabase.from('tokens').update(tokenUpdate).eq('id', token.id);
```

## Next Steps

1. Create utility functions for common token operations
2. Add validation functions for token data
3. Implement example components for token management
4. Add test cases for type mapping functions 