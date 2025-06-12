# Database Migrations for Policy System

This directory contains SQL migrations for the policy management system.

## Current Migrations

### `fix_policy_template_approvers_constraint.sql`

**Purpose:** This migration fixes the foreign key constraint issues between policy templates and their approvers.

**Problem:** The original database design caused race conditions and foreign key constraint violations when trying to create templates and approvers in a single transaction.

**Solution:** The migration makes the foreign key constraint deferrable, which means it's only checked at the end of a transaction. This allows templates and approvers to be created in the same transaction without violating constraints.

**Changes:**
1. Drops the existing foreign key constraint
2. Creates a new deferrable constraint with cascade delete
3. Cleans up any orphaned approver records
4. Adds an index for performance

## How to Apply Migrations

These migrations should be applied to your Supabase database using the Supabase SQL Editor:

1. Log in to the Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file
4. Paste into the SQL Editor
5. Run the SQL script
6. Verify the migration was successful by checking the constraints in the database

## Verifying Migration Success

After applying the migration, you can verify it worked by running:

```sql
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'policy_template_approvers'
AND tc.constraint_name = 'policy_template_approvers_template_id_fkey';
```

This should show the constraint with `is_deferrable` as 'YES' and `initially_deferred` as 'YES'.