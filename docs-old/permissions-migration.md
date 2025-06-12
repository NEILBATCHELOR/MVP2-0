# Permissions System Simplification

## Overview

This document describes the changes made to simplify the permissions system by moving away from the dual-permissions model (UUID-based `permissions` table + string-based `role_permissions` table) to a single simplified permission system using only the `role_permissions` table.

## Problem Statement

The previous permissions system had several issues:

1. **Dual Permission Systems**: There were two separate systems for permissions:
   - UUID-based permissions in the `permissions` table with separate resource/action fields
   - String-based permission IDs in the `role_permissions` table (e.g., `policy_rules.approve`)

2. **Role Name Inconsistencies**: The `roles` table has different formats for role names compared to the `users` table, causing mismatches when checking permissions.

3. **No User-to-Role Direct Mapping**: The `user_roles` table wasn't properly mapping user roles to the `roles` table.

## Solution

We've simplified the system by:

1. Moving all permission checks to use the `role_permissions` table with string format permission IDs.
2. Creating database functions to handle permission checks and retrieve users with specific permissions.
3. Renaming the `permissions` table to `permissions_deprecated` to preserve data but indicate it's no longer in use.
4. Fixing role mappings between users and roles tables.

## Migration Steps

The migration is performed in the following steps:

1. Run the SQL migration script `20240403_simplify_permissions.sql` to:
   - Add missing permissions to roles
   - Create database functions for permission checks
   - Fix user-to-role mappings
   - Rename the `permissions` table to `permissions_deprecated`

2. Update the `usePermissions` hook to:
   - Use the new `check_user_permission` function
   - Format permission IDs as `resource.action` strings
   - Handle role name variations consistently

3. Update the `useApprovers` hook to use the `get_users_with_permission` function to retrieve eligible approvers.

## New Database Functions

### `get_users_with_permission(p_permission_id TEXT)`

This function returns a list of user IDs that have a specific permission. It handles both:
- Direct role assignments through the `user_roles` table
- Legacy role assignments based on the `role` field in the `users` table

### `check_user_permission(p_user_id UUID, p_permission_id TEXT)`

This function checks if a specific user has a specific permission, returning a boolean result.

## Testing the Migration

1. Run the test script to verify the new permission system:
   ```
   npm run ts-node src/tests/testPermissions.ts
   ```

2. Verify that policy approval workflows continue to work correctly.

## Rollback Plan

If issues are encountered, the following steps can be taken:

1. Rename `permissions_deprecated` back to `permissions`
2. Revert the code changes in `usePermissions` and `useApprovers` hooks
3. Drop the new database functions

## Long-term Improvements

For future improvements:

1. Standardize all role names to follow a consistent format
2. Update the `users` table to use a `role_id` foreign key to the `roles` table instead of a string `role` field
3. Consider adding a caching layer for permission checks to improve performance 