# Type System Documentation

## Overview

This project uses a three-layer type system:

1. **supabase.ts** - Auto-generated from the Supabase database schema
2. **database.ts** - Re-exports and extends types from supabase.ts
3. **centralModels.ts** - Business interfaces that normalize database types

## Type System Architecture

```
┌─────────────────────┐
│  centralModels.ts   │
│  (Business Models)  │
└─────────┬───────────┘
          │
          │ Type Mappers
          │
┌─────────▼───────────┐
│    database.ts      │
│  (Database Types)   │
└─────────┬───────────┘
          │
          │ Re-exports
          │
┌─────────▼───────────┐
│    supabase.ts      │
│ (Generated Schema)  │
└─────────────────────┘
```

### File Purposes

- **supabase.ts**: Generated from Supabase database schema. Contains complete database type definitions for tables, views, functions, enums, row types for insert/update operations, and relationship definitions. Should not be modified manually.

- **database.ts**: Extends and re-exports types from `supabase.ts`. Provides convenient type aliases for database tables and views, adds custom database-related types not in Supabase schema.

- **centralModels.ts**: Defines application-level business interfaces, providing normalized versions of database types. Contains base model interfaces, entity interfaces, business logic enums, and UI-specific interfaces.

- **typeGuards.ts**: Provides type guard functions for runtime type checking, which helps TypeScript narrow types correctly. Validates API response data and ensures type safety with unknown data.

- **typeMappers.ts**: Maps between database and business model types. Handles snake_case to camelCase conversion, date formatting, nested object transformation, and data normalization.

## Naming Conventions

1. **Database Types** (snake_case)
   - Table types: `users_table`, `investor_table`
   - Field names: `first_name`, `last_login_at`
   - Enum values: `KYC_PENDING`, `PAYMENT_COMPLETED`

2. **Domain Types** (camelCase)
   - Interface names: `User`, `InvestorProfile`
   - Property names: `firstName`, `lastLoginAt`
   - Method names: `getUserById`, `updateProfile`

## Type Fixes Applied

We've implemented several fixes to ensure type consistency:

1. **Duplicate Type Removal**: Removed duplicate type declarations from database.ts
   - Script: `remove-duplicate-types.sh`

2. **Interface Fixes**: Fixed specific interfaces like IssuerDetailDocumentsTable
   - Script: `fix-database-ts-final.sh`

3. **Type Reference Updates**: Updated references to use plural table names consistently
   - Script: `fix-type-references.sh`

4. **Validation Script Improvements**: Enhanced the validation script to correctly identify table definitions
   - Script: `fix-validation-script.sh`

5. **Comprehensive Fix**: Combined all fixes into a single workflow
   - Script: `complete-type-fix.sh`

## Type Validation

Run the validation script to check for any remaining issues:

```bash
npm run types:validate
```

This will check for:
- Missing table types in database.ts
- Incomplete type groups (missing Insert and Update types)
- Misalignments between centralModels.ts and database.ts
- Missing type mappers and type guards

## Type Generators

We've created scripts to help generate type mappers and type guards:

### Generate Type Mapper

```bash
npm run types:generate-mapper -- --table=user --domain=User
```

This will generate mapper functions between database types and domain types.

### Generate Type Guard

```bash
npm run types:generate-guard -- --domain=User
```

This will generate a type guard function for a domain type.

## Remaining Tasks

1. Create missing Insert/Update types for tables that need them
2. Generate missing type mappers in src/utils/formatting/typeMappers.ts
3. Add type guards in src/utils/types/typeGuards.ts

## Best Practices

1. Always import database types from @/types/database.ts
2. Always import business models from @/types/centralModels.ts
3. Use type mappers when converting between database and domain types
4. Use type guards for runtime type checking
5. Follow naming conventions consistently