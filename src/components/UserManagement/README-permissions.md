# Permissions System Simplification

## Overview

This project simplifies the permission system by eliminating the dual-system approach and standardizing on a single permissions model based on the `role_permissions` table.

## Files Changed

1. **Database Migration**:
   - `supabase/migrations/20240403_simplify_permissions.sql`: Database migration script

2. **Core Permission Hooks**:
   - `src/hooks/usePermissions.tsx`: Updated to use the new database functions
   - `src/hooks/useApprovers.ts`: Enhanced to work with the simplified system

3. **Test Files**:
   - `src/tests/testPermissions.ts`: Script to test database functions
   - `src/components/tests/PermissionsTest.tsx`: React component to test hooks
   - `scripts/check-permission.js`: Command-line tool to check permissions

4. **Documentation**:
   - `docs/permissions-migration.md`: Detailed documentation of changes
   - `README-permissions.md`: This file

## Key Changes

1. **Database**: 
   - Removed dependency on `permissions` table
   - Created database functions for permission checking
   - Fixed role mappings between users and roles tables

2. **Code**:
   - Updated hooks to use string-format permission IDs (`resource.action`)
   - Added better fallbacks and error handling
   - Created test utilities to verify functionality

## How to Use

### Testing the Migration

1. Apply the migration:
   ```
   cd supabase
   npx supabase db push
   ```

2. Run the database functions test:
   ```
   npm run ts-node src/tests/testPermissions.ts
   ```

3. Check specific permissions:
   ```
   node scripts/check-permission.js <user_id> policy_rules.approve
   ```

4. Test the UI component:
   - Import `PermissionsTest` into a page
   - Or create a new route: `/test-permissions`

### Using Permissions in Components

The API for developers remains the same:

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { hasPermission } = usePermissions();
  
  // For conditional rendering:
  if (hasPermission('edit', 'policies')) {
    return <EditButton />;
  }
  
  // For async operations:
  const handleAction = async () => {
    const canPerformAction = await can('delete', 'policies');
    if (canPerformAction) {
      // proceed
    }
  };
}
```

### Getting Users with a Permission

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function ApproverSelector() {
  const { getUsersWithPermission } = usePermissions();
  
  useEffect(() => {
    const loadApprovers = async () => {
      const userIds = await getUsersWithPermission('approve', 'policy_rules');
      // Fetch user details...
    };
    
    loadApprovers();
  }, []);
}
```

## Rollback Plan

In case of issues:

1. Rename `permissions_deprecated` back to `permissions`
2. Revert code changes in hooks
3. Drop the new database functions

See `docs/permissions-migration.md` for detailed rollback steps.