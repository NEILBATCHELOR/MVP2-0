# KYC Field Migration Guide

This document provides information about the KYC field migration that standardizes the data types for the `kyc_status`, `kyc_expiry_date`, and `verification_details` columns in the investors table.

## Migration Overview

The migration script `20250601000001_update_kyc_fields.sql` makes the following changes:

1. Creates a backup of the investors table before modifications
2. Establishes a proper enum type for `kyc_status` with values:
   - approved
   - pending
   - failed
   - not_started
   - expired
3. Updates the `kyc_expiry_date` column to use TIMESTAMP WITH TIME ZONE
4. Ensures `verification_details` is properly typed as JSONB
5. Adds an index on the `kyc_status` column for better query performance

## Implementation Details

### KYC Status Enum

The migration creates a PostgreSQL enum type for `kyc_status` ensuring only valid values can be stored. This provides several benefits:

- Database-level validation for KYC status values
- Improved query performance compared to string comparisons
- Better support for status-based filtering in the UI
- Clear documentation of valid status options

### Expiry Date Handling

The `kyc_expiry_date` column is updated to use TIMESTAMP WITH TIME ZONE, which:

- Ensures proper date handling across different timezones
- Maintains consistency with other timestamp fields in the database
- Allows for more accurate expiration calculations

### Verification Details

The `verification_details` column is set as JSONB type to:

- Store structured verification data in a flexible format
- Enable powerful query capabilities against nested JSON data
- Maintain data integrity for complex verification information

## Migration Safety

The migration includes several safety measures:

1. Creates a backup table (`investors_backup_pre_kyc_update`) before any modifications
2. Validates existing data before conversion
3. Handles NULL values and empty strings appropriately
4. Uses conditional execution to prevent duplicate operations
5. Provides detailed notices during the migration process

## Usage Guidelines

### Querying KYC Status

When querying the KYC status after migration:

```sql
-- Find all approved investors
SELECT * FROM investors WHERE kyc_status = 'approved';

-- Find investors with expired or failed KYC
SELECT * FROM investors WHERE kyc_status IN ('expired', 'failed');

-- Count investors by KYC status
SELECT kyc_status, COUNT(*) 
FROM investors 
GROUP BY kyc_status;
```

### Working with Verification Details

The JSONB type allows for powerful querying of nested data:

```sql
-- Find investors with specific verification provider
SELECT * FROM investors 
WHERE verification_details->>'provider' = 'onfido';

-- Find investors with high risk score
SELECT * FROM investors 
WHERE (verification_details->>'risk_score')::numeric > 80;

-- Check if verification includes specific document type
SELECT * FROM investors 
WHERE verification_details->'documents' @> '[{"type": "passport"}]';
```

## TypeScript Integration

The updated fields are reflected in the TypeScript interface:

```typescript
interface Investor {
  // ...existing fields
  kyc_status: 'approved' | 'pending' | 'failed' | 'not_started' | 'expired';
  kyc_expiry_date: string | null; // ISO timestamp string
  verification_details: {
    provider?: string;
    reference_id?: string;
    completed_at?: string;
    documents?: Array<{
      type: string;
      status: string;
      id: string;
    }>;
    checks?: Array<{
      type: string;
      status: string;
      id: string;
      result: string;
    }>;
    // Additional provider-specific fields
    [key: string]: any;
  } | null;
}
```

## Deployment Instructions

1. Run the migration in the development environment first:
   ```
   cd supabase
   npx supabase db push
   ```

2. Verify that all KYC fields have the correct types:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = 'investors' 
   AND column_name IN ('kyc_status', 'kyc_expiry_date', 'verification_details');
   ```

3. Test KYC-related functionality to ensure it works with the updated schema

4. Run the migration in the production environment:
   ```
   cd supabase
   SUPABASE_ACCESS_TOKEN=<your-token> npx supabase db push -p
   ```

## Rollback Plan

If issues occur after deployment, you can revert to the previous state using the backup table:

```sql
-- Disable triggers temporarily
ALTER TABLE investors DISABLE TRIGGER ALL;

-- Delete all rows from the current table
DELETE FROM investors;

-- Restore data from backup
INSERT INTO investors SELECT * FROM investors_backup_pre_kyc_update;

-- Re-enable triggers
ALTER TABLE investors ENABLE TRIGGER ALL;
```

## Additional Notes

- The migration is designed to be idempotent, meaning it can be run multiple times without causing issues
- Invalid KYC status values are automatically converted to 'not_started'
- The index on `kyc_status` improves query performance for status-based filtering
- Empty verification details are stored as empty JSON objects ({}) rather than NULL for consistency