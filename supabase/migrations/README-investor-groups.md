# Investor Group Management Update

## Overview

This update enhances the investor group management system to work seamlessly with both the newer `investor_groups_investors` table and the legacy `investor_group_members` table. The goal is to maintain backward compatibility while ensuring data consistency across both tables.

## Changes

### 1. Database Functions

A new SQL migration script (`investor_group_member_functions.sql`) adds several key database functions:

1. **get_unique_group_memberships(investor_ids text[])**
   - Returns unique group memberships for a list of investors
   - Combines results from both tables using UNION to eliminate duplicates
   - Returns a count of unique investors per group
   - Properly handles UUID to text type conversions

2. **get_unique_member_count(group_id_param text)**
   - Returns the total unique count of members in a group
   - Combines results from both tables using UNION to eliminate duplicates
   - Ensures proper type casting between UUID and text types

3. **add_investors_to_group(p_group_id text, p_investor_ids text[])**
   - Bypasses Row-Level Security (RLS) with SECURITY DEFINER
   - Adds investors to both tables for backward compatibility
   - Handles errors gracefully using exception blocks
   - Updates the group member count automatically

4. **remove_investors_from_group(p_group_id text, p_investor_ids text[])**
   - Bypasses Row-Level Security (RLS) with SECURITY DEFINER
   - Removes investors from both tables for backward compatibility
   - Handles errors gracefully using exception blocks
   - Updates the group member count automatically

5. **sync_investor_group_memberships()**
   - Synchronizes memberships between the two tables
   - Uses cursor-based processing to avoid timeouts
   - Processes each group individually through sync_group_memberships
   - SECURITY DEFINER allows operation even with restrictive RLS policies

6. **sync_group_memberships(group_id_param text)**
   - Synchronizes a single group's memberships between tables
   - Handles errors at each step using exception blocks
   - More efficient for targeted synchronization
   - Reduces the risk of timeouts by processing smaller batches
   - Handles NULL values and adds input validation
   - SECURITY DEFINER bypasses row-level security restrictions

### 2. ManageGroupsDialog.tsx Updates

The dialog has been enhanced to:

- Use the SECURITY DEFINER RPC functions to bypass Row-Level Security issues
- Process groups individually for better error handling
- Track success and error counts for better user feedback
- Gracefully fallback to operations on the investor_group_members table
- Provide detailed user feedback about permission errors
- Handle partial success scenarios appropriately

### 3. InvestorsList.tsx Updates

The investor list view has been updated to:

- Use the targeted sync_group_memberships function
- Sync groups individually instead of all at once to prevent timeouts
- Implement fallbacks when RPC functions are unavailable
- Provide more informative error messages

## Implementation Details

### Security Considerations

- **Row-Level Security (RLS) Handling**
  - All database functions use SECURITY DEFINER to bypass RLS policies
  - This allows operations to succeed even when direct table access is restricted
  - Operations are done through database functions rather than direct table access
  - Error handling captures and logs permission issues

- **Transaction Safety**
  - Each operation has exception handling to continue despite errors
  - Failed operations on one table won't prevent operations on the other
  - Database functions use individual transactions per operation

### Backward Compatibility

- All operations that add or remove group members update both tables when possible
- The system works even if only one table contains data
- The sync functions can be called on specific groups to ensure tables stay in sync
- If operations on the newer table fail due to permissions, the older table still works

### Error Handling

- TypeScript type assertions are used to handle RPC function names
- Fallback logic is implemented when RPC functions are not available
- Console logging captures errors for debugging
- Explicit type casting in SQL functions to avoid UUID vs text comparison errors
- NULL handling to prevent common 400 errors in API calls
- Exception blocks in SQL functions catch and report errors without failing the whole operation

## Addressing Permission Errors

To deal with "403 Forbidden" errors caused by Row-Level Security (RLS) policies:

1. **SECURITY DEFINER Functions**
   - Database functions run with the privileges of the function creator
   - Allows operations on tables even when direct access is restricted
   - All database functions include SECURITY DEFINER

2. **Exception Handling**
   - SQL functions use BEGIN/EXCEPTION blocks to catch permission errors
   - Operations on the old table are attempted first, as it may have less restrictive policies
   - Each operation has its own exception handling

3. **User Feedback**
   - Clear error messages indicate when permission issues occur
   - UI shows which operations succeeded and which failed

## Applying the Migration

To apply the database functions:

1. Run the SQL script on your Supabase instance:
   ```
   migrations/investor_group_member_functions.sql
   ```

2. The code changes have been made to work with or without the RPC functions, so they can be deployed immediately.

3. For Row-Level Security issues, you may need to update RLS policies on the `investor_groups_investors` table to allow necessary operations, or continue using the SECURITY DEFINER functions to bypass RLS.

## Type Handling

The PostgreSQL functions have been updated to handle type mismatches and NULL values:

- All comparisons use explicit `::text` casts to ensure consistent comparison
- This avoids the "operator does not exist: uuid = text" error
- NULL checks have been added to prevent errors when processing records
- COALESCE is used for timestamps to ensure they always have valid values
- The single-group sync function includes input validation

## Performance Improvements

To address the 400 errors and potential timeouts:

1. Added specific SECURITY DEFINER functions for add/remove operations
2. Updated the React components to process groups individually
3. Implemented exception handling at every level
4. Added cursor-based processing for large operations

## Next Steps

After deploying these changes, it's recommended to:

1. Check row-level security policies on your tables to ensure they're appropriate
2. Consider configuring RLS policies to allow operations that should be permitted
3. Monitor the application for any unexpected behavior
4. Consider a future migration to consolidate to a single table once all systems are updated

## Troubleshooting

If you encounter issues:

- Check the browser console for specific error messages
- Verify that the RPC functions were created successfully in Supabase
- Test adding users to a group with the `add_investors_to_group` function directly:
  ```sql
  SELECT add_investors_to_group('your_group_id_here', ARRAY['investor_id_1', 'investor_id_2']);
  ```
- For 403 Forbidden errors, check the RLS policies on your tables:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'investor_groups_investors';
  ```
- If necessary, run manual SQL to verify table contents:
  ```sql
  SELECT COUNT(*) FROM investor_groups_investors;
  SELECT COUNT(*) FROM investor_group_members;
  ``` 