# Database Migrations

This directory contains SQL migration scripts to update the database schema.

## Current Migrations

### `token_erc3525_properties_fix.sql`

This migration addresses the issue where the `token_erc3525_properties` table doesn't have all the necessary columns for storing ERC-3525 token properties.

**Problem:**
The application was trying to update a 'metadata' column in the 'token_erc3525_properties' table that doesn't exist in the database schema, resulting in the error:
```
Error updating ERC3525 properties: Error: Failed to update ERC3525 properties: Could not find the 'metadata' column of 'token_erc3525_properties' in the schema cache
```

**Solution:**
1. The migration script creates the `token_erc3525_properties` table if it doesn't exist
2. Adds missing boolean columns with proper default values:
   - `slot_approvals`
   - `value_approvals`  
   - `updatable_slots`
   - `value_transfers_enabled`
   - `mergable`
   - `splittable`
   - `updatable_values`
   
Note: There's no need to update the `token_erc3525_slots` and `token_erc3525_allocations` tables as they already have the correct schema with the `metadata` and `linked_token_id` columns respectively.

## How to Apply Migrations

To apply a migration:

1. Connect to your Supabase database using the SQL editor
2. Copy the contents of the migration file
3. Paste into the Supabase SQL editor
4. Run the script

Alternatively, you can use the Supabase CLI to apply migrations.

## Important Notes

- Always backup your database before applying migrations
- Test migrations in a development environment first
- If using Supabase CLI for migrations, make sure to follow their versioning guidelines