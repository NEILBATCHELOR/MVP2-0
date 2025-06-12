# Role Management Dashboard

This directory contains components for the role management dashboard, which is the central interface for managing roles and permissions in the system.

## Components

### RoleManagementDashboard.tsx

The main dashboard component for managing roles and user-role assignments. Features:

- Displays a list of system roles (built-in) and custom roles
- Shows users with their assigned roles
- Provides interfaces to add, edit, and manage roles
- Tabbed interface for switching between roles and users views
- Integration with data tables for sortable, filterable displays

### AddRoleModal.tsx

Modal component for creating new roles with these features:

- Form validation using Zod and React Hook Form
- Fields for role name, description, and priority level
- Duplicate role name checking
- Success/error notifications

### EditRoleModal.tsx

Modal component for editing existing roles:

- Pre-populates form with existing role data
- Special warning display for system roles
- Prevents duplicate role names
- Updates role metadata (name, description, priority)

### PermissionsMatrixModal.tsx

Modal component for managing role permissions:

- Displays permissions organized by category
- Toggle switches for enabling/disabling specific permissions
- "Select All" functionality for each permission category
- Special handling for Super Admin role (automatically has all permissions)
- Efficient permission updates using differential changes

## Implementation Details

- Uses a simplified database schema with one-to-many relationship between roles and permissions
- Permission names follow the `resource.action` naming convention
- System roles are identified by name matching rather than a database flag
- Permission changes are tracked and only modified permissions are updated
- Permission data is loaded only when the modal is opened

## Usage

The dashboard is typically accessed from the main navigation and provides the primary interface for administrators to configure the permission system. The workflow is:

1. View existing roles and their assigned users
2. Create or edit roles as needed
3. Configure permissions for each role
4. Assign roles to users through the user management interface