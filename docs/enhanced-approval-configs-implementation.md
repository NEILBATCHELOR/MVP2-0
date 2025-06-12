# Enhanced Approval Configs Schema Implementation

## Overview

This implementation expands the `approval_configs` schema to properly reference users and user_roles for displaying saved 'configured approvers' in the RedemptionApprovalConfigModal.tsx component.

## What Was Enhanced

### Database Schema Changes

1. **New Tables Created:**
   - `approval_config_approvers` - Junction table linking approval configs to specific users or roles
   - `approval_config_history` - Audit trail for changes to approval configurations
   - `redemption_approver_assignments` - Tracks approver assignments for specific redemption requests

2. **Enhanced approval_configs Table:**
   - Added `config_name` and `config_description` for better organization
   - Added `approval_mode` ('role_based', 'user_specific', 'mixed') for flexible configuration
   - Added `requires_all_approvers` for strict unanimous approval requirements
   - Added `auto_approve_threshold` for automatic approval of small amounts
   - Added `escalation_config` and `notification_config` for advanced workflows
   - Added audit fields (`created_by`, `last_modified_by`)

3. **Database Views:**
   - `approval_configs_with_approvers` - Consolidated view of configs with their approvers
   - `redemption_approval_status` - Real-time status of redemption request approvals

4. **Helper Functions:**
   - `get_users_by_role_for_approval()` - Gets users by role for approval configuration
   - `assign_redemption_approvers()` - Assigns approvers to redemption requests based on config
   - `log_approval_config_changes()` - Audit trigger for configuration changes

### TypeScript Types

1. **New Type Definitions:**
   - Complete type definitions in `/src/types/core/approval-configs.ts`
   - Database table types, view types, insert/update types
   - Domain types for UI components
   - Enhanced RedemptionApprover interface

2. **Enhanced Component Types:**
   - Support for both user-specific and role-based approvers
   - Configurable approval modes and consensus types
   - Order priority and required/optional approver settings

### Enhanced UI Component

1. **RedemptionApprovalConfigModal Enhancements:**
   - Support for mixed approver types (users + roles)
   - Visual distinction between user and role approvers
   - Configurable approval modes and consensus types
   - Real-time validation and configuration management
   - Enhanced UI with tabs for user/role selection
   - Required/optional approver toggle functionality

## Key Features

### Flexible Approver Configuration
- **User-specific approvers**: Add individual users as approvers
- **Role-based approvers**: Add entire roles as approvers (all users with that role)
- **Mixed mode**: Combine both user-specific and role-based approvers

### Advanced Approval Logic
- **Consensus types**: All, majority, or any approver
- **Required approvals**: Specify minimum number of approvals needed
- **Auto-approval threshold**: Automatic approval for amounts below threshold
- **Required vs optional approvers**: Fine-grained control over approval requirements

### Audit Trail
- Complete history of configuration changes
- Track who made changes and when
- Log approver additions/removals

### Real-time Status Tracking
- View current approval status for any redemption request
- See which approvers have approved/rejected/are pending
- Overall status calculation based on consensus rules

## Database Migration

The migration script creates all necessary tables, views, functions, and triggers:

```sql
-- Run the migration script provided in the artifacts
-- This will create all enhanced approval config tables and functions
```

## Usage Examples

### Loading Existing Configuration

```typescript
const { data } = await supabase
  .from("approval_configs_with_approvers")
  .select("*")
  .eq("id", configId)
  .single();

// Access configured approvers
const approvers = data.configured_approvers;
```

### Adding User-Specific Approver

```typescript
await supabase
  .from("approval_config_approvers")
  .insert({
    approval_config_id: configId,
    approver_type: 'user',
    approver_user_id: userId,
    is_required: true,
    order_priority: 0
  });
```

### Adding Role-Based Approver

```typescript
await supabase
  .from("approval_config_approvers")
  .insert({
    approval_config_id: configId,
    approver_type: 'role',
    approver_role_id: roleId,
    is_required: true,
    order_priority: 1
  });
```

### Assigning Approvers to Redemption Request

```typescript
const success = await supabase
  .rpc('assign_redemption_approvers', {
    p_redemption_request_id: requestId,
    p_approval_config_id: configId
  });
```

### Checking Approval Status

```typescript
const { data } = await supabase
  .from("redemption_approval_status")
  .select("*")
  .eq("redemption_request_id", requestId)
  .single();

// Check overall status
console.log(data.overall_status); // 'pending', 'approved', or 'rejected'
```

## Integration Points

### With RedemptionApproverSelection Component
The enhanced modal works seamlessly with the existing RedemptionApproverSelection component, providing a unified approver management experience.

### With useApprovers Hook
The new schema is compatible with the existing useApprovers hook, with enhanced functionality for mixed approver types.

### With Audit System
All configuration changes are automatically logged to the audit trail for compliance and troubleshooting.

## Benefits

1. **Flexibility**: Support for both individual users and role-based approval workflows
2. **Scalability**: Easy to add new approver types or approval logic
3. **Auditability**: Complete trail of configuration changes
4. **User Experience**: Enhanced UI for managing complex approval workflows
5. **Backward Compatibility**: Existing role-based configurations continue to work
6. **Real-time Status**: Live tracking of approval progress

## Next Steps

1. **Apply the migration**: Run the SQL migration script against your database
2. **Update imports**: Import the new types from `/src/types/core/approval-configs.ts`
3. **Test the enhanced modal**: Use the new RedemptionApprovalConfigModal component
4. **Configure approvers**: Set up your approval workflows using the enhanced UI

## Files Modified/Created

1. **Database Migration**: SQL script for schema enhancement
2. **Types**: `/src/types/core/approval-configs.ts` - New type definitions
3. **Component**: Enhanced `RedemptionApprovalConfigModal.tsx`
4. **Documentation**: This README file

## Backward Compatibility

The enhancement maintains full backward compatibility:
- Existing `approval_configs` records continue to work
- Legacy `eligible_roles` array is preserved
- Existing UI components can still access role-based configurations
- Migration script preserves all existing data

The enhanced system provides a superset of functionality while maintaining all existing capabilities.
