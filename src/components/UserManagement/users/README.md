# User Management Components

This directory contains components for managing users, their profiles, and roles within the system.

## Components

### UserTable.tsx

The main user management interface that:

- Displays a table of all users with filterable columns
- Shows user details including name, email, assigned role, and status
- Provides action buttons for editing, deleting, and resetting passwords
- Uses the auth service to handle user operations
- Respects user permissions for different actions

### AddUserModal.tsx

Modal for adding new users to the system:

- Email input with validation using Zod schema
- Name input with validation
- Role selection dropdown (shows available roles from the database)
- Password options (auto-generate or manual entry)
- Email invitation settings
- Form validation using React Hook Form and Zod

### EditUserModal.tsx

Modal for editing existing user details:

- Update user name and email
- Change user role assignment
- Modify user status (active, inactive, pending, blocked)
- Uses React Hook Form with Zod validation
- Leverages the auth service for user updates

### ResetPasswordModal.tsx

Modal for resetting user passwords:

- Password entry with strength validation
- Option to send email reset link instead of direct password change
- Comprehensive password requirements (uppercase, lowercase, numbers, special chars)
- Security confirmation step

## Implementation Details

- Each user is assigned a role from the roles table
- User permissions are determined by their assigned role
- Role selection dropdowns are populated from the database
- Badge indicators for different user statuses
- Integration with the auth service for all user operations
- Consistent form validation using Zod schema validation
- Responsive design with shadcn/ui components

## Architecture

The user management system follows a clean architecture:

1. **UI Components** - The visual elements in this directory
2. **Service Layer** - The `authService.ts` handles all user operations
3. **Hooks** - `useAuth` and `usePermissions` provide authentication and authorization
4. **Types** - Type definitions in `types/user.ts` ensure type safety

## Authentication Flow

1. Users can be created via the AddUserModal
2. Passwords can be auto-generated or manually set
3. Optional email invitations for new users
4. Password resets via direct change or email link

## Authorization System

The system uses a role-based access control model:
- Each user has one primary role
- Roles contain permissions
- The `usePermissions` hook checks if a user has specific permissions
- UI elements are conditionally rendered based on permissions

## Recent Updates

- Completely revamped user management with React Hook Form
- Added comprehensive form validation using Zod
- Improved role selection with proper key attributes
- Enhanced user status management with visual indicators
- Implemented secure password handling with validation
- Consolidated user operations in the auth service