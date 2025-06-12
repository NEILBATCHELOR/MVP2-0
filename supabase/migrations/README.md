# Supabase Migrations

This folder contains SQL migrations that need to be applied to your Supabase database to enable the enhanced RBAC (Role-Based Access Control) system.

## Running the Migrations

You can run the migrations in one of the following ways:

### Option 1: Supabase CLI (Recommended)

If you have the Supabase CLI installed:

```bash
# Navigate to the project root
cd /path/to/your/project

# Run migrations
npx supabase migration up
```

### Option 2: Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Open each SQL file in this directory
4. Run them in the following order:
   - `20240401_add_enhanced_rbac_tables.sql`
   - `20240402_add_permission_functions.sql`

## Migration Files

### 20240401_add_enhanced_rbac_tables.sql

Creates the following tables:
- `roles` - Role definitions
- `permissions` - Permission definitions
- `role_permissions` - Mapping between roles and permissions
- `approval_configs` - Configuration for approval workflows
- `approval_requests` - Approval request tracking
- `audit_logs` - Enhanced audit logging

Also adds default roles and permissions.

### 20240402_add_permission_functions.sql

Adds the following SQL functions:
- `check_permission` - Checks if a role has a specific permission
- `log_audit` - Logs an audit entry

## Troubleshooting

If you encounter issues with the migrations:

1. Check that your Supabase project has the necessary permissions to create tables and functions
2. Verify that you're running the migrations in the correct order
3. If a migration partially completed, you may need to drop the affected tables and run again

## Manual Testing

You can test if the migrations worked correctly by running:

```sql
-- Check if roles table exists and has data
SELECT * FROM roles;

-- Test the check_permission function
SELECT check_permission('super_admin', 'system', 'view_audit_logs');
```

# Database Migrations

This directory contains SQL migrations for the Supabase database.

## Recent Migrations

### Token Distributions System

Migrations `20231201000006`, `20231201000007`, and `20231201000008` implement a comprehensive token distribution tracking system:

1. **Distributions Table** (`20231201000006_create_distributions_table.sql`)
   - Records confirmed token distributions with blockchain transaction data
   - Links to token_allocations, investors, subscriptions, and projects
   - Stores blockchain details like transaction hash, wallet information, and token details

2. **Distribution Trigger** (`20231201000007_create_distribution_trigger.sql`)
   - Automatically populates the distributions table when a token_allocation is marked as distributed
   - Links with transaction_proposals to gather blockchain details
   - Creates a complete distribution record with all necessary information

3. **Distribution-Redemption Relationship** (`20231201000008_create_distribution_redemption_relationship.sql`)
   - Creates a junction table to link distributions to redemption_requests
   - Tracks how much of each distribution has been redeemed
   - Maintains a remaining_amount on distributions to track available tokens
   - Updates distribution status when fully redeemed

### Bug Fixes and Enhancements

Migrations `20231201000009` to `20231201000011` address issues with token distribution functionality:

1. **Token Allocations Permissions** (`20231201000009_fix_token_allocations_permissions.sql`)
   - Ensures proper RLS (Row-Level Security) policies for token_allocations table
   - Fixes permission issues that could cause 404 errors when updating token allocations
   - Adds policies for distributions table

2. **Transaction Signatures Table** (`20231201000010_create_transaction_signatures_table.sql`)
   - Creates the transaction_signatures table if it doesn't exist
   - Supports proper linking between transactions and their signatures
   - Enables the distribution trigger to find transaction details

3. **Updated Distribution Trigger** (`20231201000011_update_distribution_trigger.sql`)
   - Updates the trigger function to correctly find transaction details
   - Includes transaction_signatures integration
   - Handles missing data more robustly

### Purpose

This system provides complete tracking of token distributions from allocation through distribution and redemption. It allows:

- Confirmation that tokens were actually distributed on the blockchain
- Tracking which distributed tokens are available for redemption
- Maintaining an audit trail of token distribution and redemption
- Supporting redemption workflows with accurate token availability information

### Usage

The system is designed to work automatically once a token_allocation is marked as distributed:

1. Update a token_allocation record setting `distributed = true`
2. The trigger automatically creates a corresponding distribution record
3. When creating redemption requests, use the distributions table to find available tokens
4. Link redemptions to specific distributions using the distribution_redemptions table

### Related Types

The TypeScript type definitions for these tables are available in:
- `src/types/database.ts` - Database types
- `src/types/centralModels.ts` - Domain model types
- `src/utils/typeMappers.ts` - Conversion functions
- `src/utils/typeGuards.ts` - Type validation