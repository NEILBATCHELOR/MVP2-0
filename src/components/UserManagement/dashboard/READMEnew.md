# /src/components/UserManagement/dashboard — READMEnew.md

This folder contains UI components for role and permission management dashboards within the user management system. These components enable admins to view, add, edit, and manage roles, as well as configure permission matrices for users and roles.

## Files

### AddRoleModal.tsx
- **Purpose:** Modal dialog for adding new roles to the system.
- **Key Features:**
  - Form validation (name, description, priority) using Zod and React Hook Form.
  - Checks for duplicate role names via Supabase.
  - Submits new roles to the backend and provides toast notifications.

### EditRoleModal.tsx
- **Purpose:** Modal dialog for editing existing roles.
- **Key Features:**
  - Allows updating role details (name, description, priority).
  - Integrates with backend for role updates and provides feedback.

### PermissionMatrix.tsx / PermissionsMatrixModal.tsx
- **Purpose:** UI for visualizing and editing the permission matrix for roles and functions.
- **Key Features:**
  - Table-based interface for toggling permissions per role/function.
  - Modal version for editing permissions for a specific role.
  - Integrates with audit logging and persists changes.

### RoleManagementDashboard.tsx
- **Purpose:** Main dashboard component for managing roles and user-role assignments.
- **Key Features:**
  - Tabbed interface for switching between roles and users.
  - Displays system and custom roles, and allows adding/editing roles.
  - Shows users with their assigned roles and provides management actions (invite, edit, delete, reset password).
  - Integrates AddRoleModal, EditRoleModal, and PermissionsMatrixModal for full admin workflow.

## Usage
- Import these components in admin dashboards or user management pages where role/permission management is required.
- Use RoleManagementDashboard as the entry point; modals and matrices are used for specific actions.

## Developer Notes
- Keep dashboard logic modular and in sync with backend (Supabase) and audit logging.
- Extend as new role/permission features or requirements are introduced.

---

### Download Link
- [Download /src/components/UserManagement/dashboard/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/UserManagement/dashboard/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/components/UserManagement/dashboard/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/UserManagement/dashboard/READMEnew.md)
