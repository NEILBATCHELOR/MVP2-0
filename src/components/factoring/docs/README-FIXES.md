# Factoring Code Fixes

This document outlines the fixes made to the factoring components to resolve type issues and linter errors.

## Fixed Issues

### 1. TokenizationManager.tsx

- **Type Mismatch**: Fixed type inconsistencies between string and number for pool IDs
  - Changed `poolId` in TokenizationFormData to use string type (was incorrectly using number)
  - Updated all pool ID comparisons to use proper string types
  - Ensured consistent string conversion when dealing with IDs from the database
  - Added proper string conversion for pool IDs in filtered invoice lists

### 2. InvoiceIngestionManager.tsx

- **Type Assertion**: Fixed type errors related to the 'toFixed' method
  - Added proper type assertions to numeric values in table cells
  - Used `as number` type assertion for netAmountDue values
  - Used `as number` type assertion for factoringDiscountRate values
  - Ensured computed discounted values can be properly formatted

## Implementation Notes

1. The fixes maintain consistency with the type definitions in `types.ts` where IDs are defined as strings:
   ```typescript
   export interface Pool extends BaseModel {
     id: string;
     // ...
   }
   
   export interface Invoice extends BaseModel {
     id: string;
     // ...
     poolId?: string;
     // ...
   }
   ```

2. When retrieving data from Supabase, we now consistently convert IDs to strings:
   ```typescript
   // Convert numeric IDs from database to strings
   id: String(item.invoice_id),
   poolId: item.pool_id ? String(item.pool_id) : undefined,
   ```

3. For table columns containing numeric values, we added type assertions to enable formatting:
   ```typescript
   value={`$${(row.getValue("netAmountDue") as number).toFixed(2)}`}
   ```

## Related Components

The following components were updated:
- **TokenizationManager.tsx** - For token creation and pool-to-token calculations
- **InvoiceIngestionManager.tsx** - For invoice ingestion and display

No changes were needed for:
- **PoolManager.tsx** - Already using correct string types for IDs
- **types.ts** - Already had the correct type definitions

## Validation

All linter errors have been resolved, and the components now correctly handle:
- Consistent ID types (string) throughout the application
- Proper type assertions for numeric formatting
- Correct type comparison operations 