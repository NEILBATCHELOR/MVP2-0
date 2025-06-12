# Simplified Roles and Permissions System

## Overview

The roles and permissions system has been redesigned to be simpler and more maintainable while still providing robust access control across the application.

## Database Structure

### Users

Each user is stored in the `public.users` table with basic information and credentials.

### Roles

Roles are defined in the `public.roles` table with the following structure:
- `id` - UUID primary key
- `name` - Unique role name
- `description` - Role description
- `priority` - Numeric priority (higher values have higher precedence)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Permissions

Permissions are defined in the `public.permissions` table with the following structure:
- `name` - Text primary key (format: `resource.action`)
- `description` - Permission description
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### User-Role Assignments

Each user is assigned a single role via the `public.user_roles` table:
- `user_id` - Primary key, references `auth.users(id)`
- `role_id` - References `public.roles(id)`
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Role-Permission Assignments

Permissions are assigned to roles via the `public.role_permissions` junction table:
- `role_id` - Part of composite primary key, references `public.roles(id)`
- `permission_name` - Part of composite primary key, references `public.permissions(name)`
- `created_at` - Creation timestamp

## Permission Naming Convention

Permissions follow a standardized naming convention: `resource.action`

Examples:
- `users.view` - View user profiles
- `policies.approve` - Approve policies
- `token_lifecycle.mint` - Mint tokens

## Database Functions

### check_user_permission

Checks if a user has a specific permission:

```sql
SELECT check_user_permission(user_id, permission_name);
```

Returns `true` if the user has the permission, `false` otherwise.

### get_users_with_permission

Gets all users who have a specific permission:

```sql
SELECT * FROM get_users_with_permission(permission_name);
```

Returns a table of users with the permission.

## Frontend Integration

### usePermissions Hook

The `usePermissions` hook provides an easy way to check permissions in React components:

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { hasPermission, can } = usePermissions();
  
  // Check permission from local cache
  if (hasPermission('policies.approve')) {
    // User has permission
  }
  
  // Check permission with server validation
  const checkPermission = async () => {
    if (await can('policies.approve')) {
      // User has permission (validated with server)
    }
  };
}
```

### useApprovers Hook

The `useApprovers` hook helps find users who can approve actions:

```typescript
import { useApprovers } from '@/hooks/useApprovers';

function MyComponent() {
  const { approvers, isLoading } = useApprovers('policies.approve');
  
  if (isLoading) {
    return <div>Loading approvers...</div>;
  }
  
  return (
    <div>
      <h2>Available Approvers:</h2>
      <ul>
        {approvers.map(approver => (
          <li key={approver.id}>{approver.name} ({approver.roleDisplay})</li>
        ))}
      </ul>
    </div>
  );
}
```

## Role Utilities

The `roleUtils.ts` module provides helper functions for working with roles:

- `getAllRoles()` - Get all available roles
- `getRoleById(id)` - Get a role by ID
- `getRoleByName(name)` - Get a role by name
- `assignRoleToUser(userId, roleId)` - Assign a role to a user
- `removeRoleFromUser(userId, roleId)` - Remove a role from a user
- `getUserRoles(userId)` - Get roles assigned to a user
- `formatRoleForDisplay(roleName)` - Format a role name for display

## Standard Roles

The system comes with predefined standard roles:

1. **Super Admin** - Full system access with all permissions
2. **Owner** - Platform owner with management rights
3. **Compliance Manager** - Manages compliance policies
4. **Compliance Officer** - Reviews compliance items
5. **Agent** - Handles day-to-day operations
6. **Viewer** - Read-only access

The Super Admin role automatically has access to all permissions in the system.