# Token CRUD Operations Guide

This guide documents the token CRUD (Create, Read, Update, Delete) operations implementation in the application, focusing on the various ERC token standards and their specific properties and relationships.

## Overview

The token module supports multiple ERC token standards:

- ERC-20 (Fungible Tokens)
- ERC-721 (Non-Fungible Tokens)
- ERC-1155 (Multi Tokens)
- ERC-1400 (Security Tokens)
- ERC-3525 (Semi-Fungible Tokens)
- ERC-4626 (Tokenized Vaults)

Each token standard has:
1. Specific database tables to store its properties
2. Corresponding TypeScript interfaces in the centralModels.ts
3. Edit forms that allow users to modify token properties
4. Service functions to handle database operations

## Database Structure

The token data is stored in multiple related tables:

- `tokens`: Core table containing basic token information
- `token_versions`: Token version history
- `token_operations`: History of operations performed on tokens
- `token_deployments`: Deployment information for deployed tokens

Additionally, each token standard has its own set of specialized tables:

### ERC-20
- `token_erc20_properties`: Properties specific to ERC-20 tokens

### ERC-721
- `token_erc721_properties`: Properties specific to ERC-721 tokens
- `token_erc721_attributes`: Attributes/traits for ERC-721 tokens

### ERC-1155
- `token_erc1155_properties`: Properties specific to ERC-1155 tokens
- `token_erc1155_types`: Type definitions for ERC-1155 tokens
- `token_erc1155_balances`: Token balances for each type
- `token_erc1155_uri_mappings`: URI mappings for token types

### ERC-1400
- `token_erc1400_properties`: Properties specific to ERC-1400 tokens
- `token_erc1400_partitions`: Partition definitions for ERC-1400 tokens
- `token_erc1400_controllers`: Controller addresses and permissions

### ERC-3525
- `token_erc3525_properties`: Properties specific to ERC-3525 tokens
- `token_erc3525_slots`: Slot definitions for ERC-3525 tokens
- `token_erc3525_allocations`: Token allocations by slot

### ERC-4626
- `token_erc4626_properties`: Properties specific to ERC-4626 tokens
- `token_erc4626_strategy_params`: Strategy parameters for yield strategies
- `token_erc4626_asset_allocations`: Asset allocations in the vault

## TypeScript Types

The types system is organized in three main files:

1. `supabase.ts`: Generated from Supabase database schema, contains the base types
2. `database.ts`: Re-exports and extends types from supabase.ts
3. `centralModels.ts`: Defines business-level interfaces with camelCase properties

When adding new properties or tables:
- First update the database schema
- Run type generation for `supabase.ts`
- Add any additional types or extensions in `database.ts` 
- Update business models in `centralModels.ts`

## Edit Forms

Each token standard has its own edit form component:

- `ERC20EditForm.tsx`
- `ERC721EditForm.tsx`
- `ERC1155EditForm.tsx`
- `ERC1400EditForm.tsx`
- `ERC3525EditForm.tsx`
- `ERC4626EditForm.tsx`

The forms follow a consistent pattern:
1. Load token data including standard-specific properties
2. Use React Hook Form with Zod validation
3. Transform form data to match database column names
4. Pass the data to the token update service

## Update Service

The `tokenUpdateService.ts` provides functions for updating tokens and their properties:

- `updateToken`: Updates basic token info and calls standard-specific functions
- `updateERC20Properties`: Updates ERC-20 specific properties
- `updateERC721Properties`: Updates ERC-721 specific properties
- `updateERC721Attributes`: Updates ERC-721 attributes
- `updateERC1155Properties`: Updates ERC-1155 specific properties
- `updateERC1155Types`: Updates ERC-1155 token types
- `updateERC1400Properties`: Updates ERC-1400 specific properties
- `updateERC1400Partitions`: Updates ERC-1400 partitions
- `updateERC1400Controllers`: Updates ERC-1400 controllers
- `updateERC3525Properties`: Updates ERC-3525 specific properties
- `updateERC3525Slots`: Updates ERC-3525 slots
- `updateERC4626Properties`: Updates ERC-4626 specific properties

## Edit Form Implementation Guidelines

When implementing or updating token edit forms:

1. **Field Naming**:
   - Use camelCase for form field names (matching centralModels.ts)
   - Map to snake_case for database columns (matching database.ts)

2. **Property Conversion**:
   - Handle type conversions (number, boolean, JSON)
   - Use appropriate default values for optional fields

3. **Form Structure**:
   - Group related fields in logical sections
   - Use Card components for visual grouping
   - Show/hide sections based on configuration mode

4. **Validation**:
   - Use Zod schemas for form validation
   - Include appropriate field requirements and constraints

5. **Nested Data**:
   - Handle nested objects with appropriate form controls
   - Support arrays of related entities (types, attributes, etc.)

## Database Operations Guidelines

When updating database operations:

1. **Error Handling**:
   - Check for existing records before update/insert
   - Log errors with descriptive messages
   - Return appropriate error responses

2. **Transaction Handling**:
   - Use transactions for multi-table operations
   - Handle rollback on errors

3. **Relation Management**:
   - Handle creation, update, and deletion of related records
   - Maintain referential integrity

4. **Type Safety**:
   - Use TypeScript interfaces for data transformations
   - Validate data before database operations

## Best Practices

1. **Consistency**:
   - Maintain consistent naming conventions
   - Follow the established patterns for form structure
   - Use consistent error handling

2. **Data Validation**:
   - Always validate user input before database operations
   - Use Zod schemas for form validation
   - Add additional validation in service functions

3. **Performance**:
   - Minimize database queries with efficient operations
   - Batch operations when possible

4. **Error Handling**:
   - Log errors with descriptive messages
   - Provide meaningful error messages to users
   - Handle edge cases gracefully

5. **Testing**:
   - Test all CRUD operations for each token standard
   - Verify data integrity after operations
   - Test error conditions and edge cases

## Troubleshooting Common Issues

1. **Field Mapping Issues**:
   - Check that form field names match centralModels.ts
   - Verify database column names in supabase.ts
   - Check for typos in field names

2. **Type Errors**:
   - Verify that field types match in all layers
   - Check for missing or incorrect type conversions
   - Ensure optional fields have appropriate defaults

3. **Data Not Persisting**:
   - Check for errors in update service functions
   - Verify that token ID is correctly passed
   - Check database permissions

4. **Form Validation Errors**:
   - Review Zod schema definitions
   - Check required vs. optional fields
   - Verify error messages are clear and helpful

## Extensions and Future Improvements

1. **Reusable Form Components**:
   - Create reusable components for common form patterns
   - Reduce duplication across token edit forms

2. **Advanced Validation**:
   - Add cross-field validation
   - Validate against blockchain constraints

3. **Optimistic Updates**:
   - Implement optimistic UI updates
   - Improve user experience during save operations

4. **Batch Operations**:
   - Support batch updates for multiple tokens
   - Optimize performance for large datasets

5. **Version History**:
   - Enhance version tracking
   - Add diff visualization for version comparison
