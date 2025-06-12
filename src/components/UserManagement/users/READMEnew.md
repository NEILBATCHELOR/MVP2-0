# /src/components/UserManagement/users — READMEnew.md

This folder contains UI components for user CRUD (create, read, update, delete), profile management, and user detail views within the user management system. These components enable admins to add, edit, reset passwords, and manage users and their roles.

## Files

### AddUserModal.tsx
- **Purpose:** Modal dialog for adding new users to the system.
- **Key Features:**
  - Form validation (email, name, role, password) using Zod and React Hook Form.
  - Fetches roles for assignment and supports auto-generating passwords and sending invite emails.
  - Submits new users to backend and provides toast notifications.

### EditUserModal.tsx
- **Purpose:** Modal dialog for editing existing user details.
- **Key Features:**
  - Allows updating user profile information and assigned role.
  - Integrates with backend for updates and provides feedback.

### ResetPasswordModal.tsx
- **Purpose:** Modal dialog for resetting a user's password.
- **Key Features:**
  - Allows admins to trigger password reset workflows for users.
  - Integrates with backend and provides feedback.

### UserTable.tsx
- **Purpose:** Table UI for displaying and managing users.
- **Key Features:**
  - Lists users with profile info, roles, and available actions (edit, reset password, delete).
  - Integrates AddUserModal, EditUserModal, and ResetPasswordModal for full management workflow.
  - Supports permissions for which actions are available to the admin.

## Usage
- Import these components in admin dashboards or user management pages where user CRUD and management is required.
- Use UserTable as the entry point; modals are used for specific actions.

## Developer Notes
- Keep user management logic modular and in sync with backend and role/permission models.
- Extend as new user management features or requirements are introduced.

---

### Download Link
- [Download /src/components/UserManagement/users/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/UserManagement/users/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/components/UserManagement/users/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/UserManagement/users/READMEnew.md)
