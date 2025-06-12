# How to Fix the ERC3525 Properties Issue

This document provides step-by-step instructions to fix the error:
```
Error updating ERC3525 properties: Error: Failed to update ERC3525 properties: Could not find the 'metadata' column of 'token_erc3525_properties' in the schema cache
```

## Issue Overview

The error occurs because the application code is trying to save data to a `metadata` column in the `token_erc3525_properties` table, but this column doesn't exist in the database schema.

## Solution Steps

### 1. Apply the Database Migration

#### Option A: Using Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `token_erc3525_properties_fix.sql` 
4. Paste into the editor and run the SQL

#### Option B: Using the Apply Script

If you have direct access to the database:

1. Install dependencies:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Set environment variables:
   ```bash
   export SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_KEY="your-service-key"
   ```

3. Make the script executable:
   ```bash
   chmod +x apply-migration.js
   ```

4. Run the migration:
   ```bash
   node apply-migration.js token_erc3525_properties_fix.sql
   ```

### 2. Deploy the Code Changes

The code changes have already been made to the following files:

1. `/src/types/database.ts`: Updated the `TokenErc3525PropertiesTable` type to match the actual database schema
2. `/src/components/tokens/services/erc3525Service.ts`: Modified the mapper functions to not use the non-existent `metadata` column
3. `/src/components/tokens/forms/ERC3525EditForm.tsx`: Updated the allocation processing to handle linked tokens correctly

Deploy these changes to your production environment.

### 3. Verify the Fix

After applying both the database migration and code changes:

1. Try creating or updating an ERC3525 token
2. Verify that allocations with linked tokens work correctly
3. Check that no database errors occur during save operations

## Testing the Changes Locally

To test the changes in your local development environment:

1. Apply the database migration to your local database
2. Run the application with the updated code
3. Try creating an ERC3525 token with slots and allocations
4. Verify that everything works as expected

## Contact for Help

If you encounter any issues or need assistance, please contact the development team.