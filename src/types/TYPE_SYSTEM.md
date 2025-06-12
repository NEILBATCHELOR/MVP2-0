# TypeScript Type System Architecture

This document explains our type system architecture and the workflow for maintaining alignment between database schema and application models.

## Type System Structure

Our type system follows a three-layer architecture:

1. **supabase.ts** - Auto-generated from the Supabase database schema
   - Contains raw database types with snake_case naming
   - Should never be modified manually
   - Generated using `npm run types:supabase`

2. **database.ts** - Re-exports and extends types from supabase.ts
   - Provides convenient type aliases for database tables and operations
   - Adds custom database-related types not in the Supabase schema
   - Maintains snake_case naming to match database conventions

3. **centralModels.ts** - Business interfaces that normalize database types
   - Provides application-level interfaces with camelCase naming
   - Adds business logic, constraints, and documentation
   - Serves as the source of truth for the application's domain model

## Type Mapper System

To bridge the gap between database types and application models, we use mapper functions:

- **Type Mappers** (`src/utils/formatting/typeMappers.ts`)
  - Convert between snake_case database types and camelCase domain models
  - Handle data transformations and normalization
  - Provide type safety for database operations

## Workflow for Maintaining Alignment

When the database schema changes, follow these steps to maintain alignment:

1. **Update supabase.ts**
   ```bash
   npm run types:supabase
   ```

2. **Validate alignment**
   ```bash
   npm run types:validate
   ```
   This will check for:
   - Missing table types in database.ts
   - Missing interfaces in centralModels.ts
   - Inconsistent naming patterns
   - Missing type mappers

3. **Fix inconsistencies automatically**
   ```bash
   npm run types:fix-inconsistencies
   # Or use the non-interactive script:
   ./scripts/fix-type-inconsistencies-runner.sh
   ```
   This will:
   - Fix inconsistent naming patterns in database.ts
   - Add missing Insert and Update types
   - Generate commands for creating type mappers

4. **Update database.ts manually if needed**
   ```bash
   npm run types:update-db
   ```
   This will suggest additions to database.ts based on new tables in supabase.ts.

5. **Generate interface suggestions for centralModels.ts**
   ```bash
   npm run types:suggest-models -- --table=new_table_name
   ```
   This will suggest a new interface for centralModels.ts based on the table structure.

6. **Generate type mappers individually**
   ```bash
   npm run types:generate-mapper -- --table=new_table_name --domain=NewDomainType
   ```
   This will generate mapper functions for converting between database and domain types.

7. **Generate all missing type mappers at once**
   ```bash
   ./scripts/generate-all-mappers.sh
   ```
   This will generate mapper functions for all missing types identified by the validation script.

## Automated Scripts

We have several scripts to help maintain type consistency:

1. **fix-type-inconsistencies.ts**
   - Identifies and fixes inconsistent type names in database.ts
   - Adds missing Insert and Update types
   - Generates commands for creating type mappers

2. **fix-type-inconsistencies-runner.sh**
   - Non-interactive wrapper for fix-type-inconsistencies.ts
   - Automatically accepts all suggested changes

3. **validate-types.ts**
   - Validates alignment between supabase.ts, database.ts, and centralModels.ts
   - Reports issues that need to be fixed

4. **generate-all-mappers.sh**
   - Batch generates type mappers for all domain models
   - Helps ensure complete coverage of type mapping

5. **generate-type-mappers.ts**
   - Creates individual type mapper functions
   - Handles conversion between snake_case and camelCase

## Best Practices

1. **Never modify supabase.ts directly**
   - Always regenerate it using the Supabase CLI

2. **Keep database.ts aligned with supabase.ts**
   - Use `npm run types:update-db` to add new table types
   - Use `npm run types:fix-inconsistencies` to fix naming inconsistencies
   - Maintain snake_case naming for consistency with the database

3. **Design centralModels.ts for application needs**
   - Use camelCase naming for properties
   - Add documentation, constraints, and business logic
   - Design interfaces for optimal use in the application, not just as database mirrors

4. **Always create type mappers for new types**
   - Ensure proper conversion between database and domain models
   - Handle edge cases and data transformations
   - Use the batch script to generate multiple mappers at once

5. **Validate the type system regularly**
   - Run `npm run types:validate` after schema changes
   - Fix any alignment issues promptly

## Common Type Issues

1. **Naming inconsistencies**
   - Database tables use plural snake_case (e.g., `users`)
   - TypeScript types should match this pattern (e.g., `UsersTable`)
   - Fix with `npm run types:fix-inconsistencies`

2. **Missing Insert/Update types**
   - Each table should have corresponding Insert and Update types
   - Fix with `npm run types:fix-inconsistencies`

3. **Missing type mappers**
   - Each domain model should have mappers to/from database types
   - Generate with `./scripts/generate-all-mappers.sh`

## Troubleshooting

If you encounter issues with the type system:

1. **Validation errors**
   - Check the output of `npm run types:validate` for specific issues
   - Use `npm run types:fix-inconsistencies` to fix common issues automatically
   - Address each remaining issue one by one, starting with database.ts

2. **Type mapping errors**
   - Ensure mappers correctly handle all properties
   - Check for missing or incorrect transformations

3. **Missing types**
   - Regenerate supabase.ts if database tables are missing
   - Run update scripts to add missing types to database.ts and centralModels.ts

4. **Inconsistent naming**
   - Use `npm run types:fix-inconsistencies` to fix naming inconsistencies automatically
   - Ensure database.ts uses snake_case to match the database
   - Ensure centralModels.ts uses camelCase for application consistency