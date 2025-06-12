# User Management Module

This module provides comprehensive user management functionality including user administration, role-based permissions, security features, audit logging, and policy enforcement.

## Directory Structure

```
UserManagement/
├── audit/            - Audit logging components
├── dashboard/        - Management dashboards
├── policies/         - Permission policies and rules
├── security/         - Security-related components
├── users/            - User administration components
└── README.md         - This documentation file
```

## Component Overview

### Audit Components (`/audit`)

- **AuditLogs.tsx**: Component for displaying and filtering audit logs for user activities and system events.

### Dashboard Components (`/dashboard`)

- **RoleManagementDashboard.tsx**: Central dashboard for managing user roles and permissions, coordinating between different user management modules.
- **AddRoleModal.tsx**: Modal for creating new custom roles with description and priority.
- **EditRoleModal.tsx**: Modal for editing existing role details with special handling for system roles.
- **PermissionsMatrixModal.tsx**: Modal for assigning permissions to roles in a matrix format, organized by permission category.

### Policy Components (`/policies`)

- **PolicyRules.tsx**: Configures consensus requirements for transaction approvals (2of3, 3of4, etc.) and manages approver selection. - paused
- **PermissionMatrix.tsx**: Configures and displays role-based permissions in a matrix format.

### Security Components (`/security`)

- **MultiSigModal.tsx**: Implements multi-signature approval workflows for sensitive operations, requiring multiple users to approve actions. - paused
- **UserMFAControls.tsx**: Controls for Multi-Factor Authentication settings and enforcement. - paused

### User Management Components (`/users`)

- **UserTable.tsx**: Displays users with their details, roles, and statuses. Provides actions for editing, deleting, and password reset.
- **AddUserModal.tsx**: Modal form for adding new users with role assignment using Zod validation.
- **EditUserModal.tsx**: Modal form for editing user details, roles, and status using React Hook Form.
- **ResetPasswordModal.tsx**: Modal for resetting user passwords with options for direct change or email reset links.

## Key Features

- **Simplified Role-Based Access Control**: 
  - Each user has exactly one assigned role
  - Granular permissions organized by resource and action
  - Standard system roles with predefined permissions
  - Custom role creation with priority levels

- **Standard System Roles**:
  - Super Admin: Full system access with all permissions
  - Owner: Platform owner with management rights
  - Compliance Manager: Manages compliance policies
  - Compliance Officer: Reviews compliance items
  - Agent: Handles day-to-day operations
  - Viewer: Read-only access to resources

- **Permission Categories**:
  - System: Access and configuration permissions
  - Users: User management
  - Roles: Role management
  - Projects: Project operations
  - Policies: Policy management
  - Rules: Rule management
  - Token Design: Token template and design operations
  - Token Lifecycle: Token operations (mint, burn, etc.)
  - Investor Management: Investor creation and management
  - Subscriptions: Subscription operations
  - Token Allocations: Allocation operations
  - Wallets: Wallet management
  - Transactions: Transaction operations
  - Redemptions: Redemption management
  - Compliance: KYC/KYB and compliance operations

- **Multi-Signature Approval**: Configurable consensus for sensitive operations
- **Audit Logging**: Comprehensive activity tracking
- **User Administration**: Complete lifecycle management of users
- **Security Enforcement**: MFA controls and security policies

## Authentication Architecture

The system uses a clean authentication architecture:

1. **UI Components**: Visual elements for user management
2. **AuthService**: Centralized service for all user operations
3. **Hooks**: 
   - `useAuth`: Manages authentication state and operations
   - `usePermissions`: Provides permission checking capabilities
4. **Types**: Comprehensive type definitions for users, roles, and permissions

## Implementation Notes

- Built using React + TypeScript
- Integrates with Supabase for data storage
- Database structure:
  - `users`: User profiles with authentication details
  - `roles`: Role definitions with descriptions and priorities
  - `permissions`: Named permissions with descriptions
  - `user_roles`: User-role assignments (one role per user)
  - `role_permissions`: Role-permission assignments
  - `user_permissions_view`: Convenience view for user permissions
- Uses utility functions in `roleUtils.ts` for consistent role handling
- Permission names follow a consistent `resource.action` format
- Form validation uses Zod schema validation with React Hook Form
- Role-based authorization controls visibility and access to features
- Password security with comprehensive validation requirements