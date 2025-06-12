# Policy Management Components

This directory contains components for managing policies, permissions, and rules within the system.

## Components

### PolicyRules.tsx

Component for configuring approval policies:

- Sets up consensus requirements (e.g., 2-of-3, 3-of-5) for various actions
- Manages approver selection based on permission
- Defines approval thresholds for different operation types
- Includes configuration for auto-approval under certain conditions

### PermissionMatrix.tsx

Basic permission management component that:

- Displays available permissions in a matrix format
- Allows toggling permissions for different roles
- Provides a simple interface for permission configuration
- Groups permissions by functional area

## Implementation Details

- Works with the simplified permission system using resource.action naming
- Aligns with the database schema for roles and permissions
- Uses the same permission categories as displayed in the PermissionsMatrixModal
- Permissions are organized into logical groups based on functionality
- Each permission has a unique identifier following the resource.action pattern

## Permission Naming Convention

Permissions follow a standardized naming convention:

- Format: `resource.action`
- Examples:
  - `users.view` - View user profiles
  - `policies.approve` - Approve policies
  - `token_lifecycle.mint` - Mint tokens

## Permission Categories

The components organize permissions into the following categories:

- System: System-wide permissions
- Users: User management permissions
- Roles: Role management permissions
- Projects: Project-related permissions
- Policies: Policy management permissions
- Rules: Rule configuration permissions
- Token Design: Token template and design permissions
- Token Lifecycle: Token operational permissions
- Investor: Investor management permissions
- Subscriptions: Subscription-related permissions
- Token Allocations: Allocation management permissions
- Wallets: Wallet management permissions
- Transactions: Transaction-related permissions
- Redemptions: Redemption management permissions
- Compliance KYC/KYB: Compliance-related permissions

## Usage

These components are typically used by administrators to:

1. Configure approval policies for sensitive operations
2. Set up role-based permissions across the system
3. Define which roles have access to which operations
4. Manage complex permission relationships and dependencies