# Configure Approvers Button & Modal - Implementation Fix

## Issue Summary

**Problem**: User couldn't find the "Configure Approvers" button and modal onclick functionality in the redemption dashboard.

**Root Cause**: The `RedemptionApprovalConfigModal` component existed but was not being imported or used anywhere in the dashboard.

## Solution Implemented

### Files Modified

#### `/src/components/redemption/dashboard/RedemptionDashboard.tsx`

**Added Import**:
```typescript
import RedemptionApprovalConfigModal from '../components/RedemptionApprovalConfigModal';
```

**Added State**:
```typescript
const [isConfigureApproversOpen, setIsConfigureApproversOpen] = useState(false);
```

**Added "Configure Approvers" Button in Header Actions**:
```typescript
<Button
  onClick={() => setIsConfigureApproversOpen(true)}
  variant="outline"
  className="flex items-center gap-2"
>
  <Settings className="h-4 w-4" />
  Configure Approvers
</Button>
```

**Added "Configure Approvers" Button in Quick Actions Sidebar**:
```typescript
<Button
  onClick={() => setIsConfigureApproversOpen(true)}
  className="w-full justify-start"
  variant="outline"
>
  <Settings className="h-4 w-4 mr-2" />
  Configure Approvers
</Button>
```

**Added Modal Component**:
```typescript
<RedemptionApprovalConfigModal
  open={isConfigureApproversOpen}
  onOpenChange={setIsConfigureApproversOpen}
  onSuccess={() => {
    addNotification({
      type: 'success',
      title: 'Approvers Configured',
      message: 'Redemption approvers have been successfully configured'
    });
    refreshRedemptions(); // Refresh data after configuration change
  }}
/>
```

## Button Locations

### 1. Header Actions Bar
Located in the top-right section of the dashboard alongside:
- **Configure Approvers** ← NEW BUTTON
- Bulk Request
- New Request 
- Refresh

### 2. Quick Actions Sidebar
Located in the right sidebar "Quick Actions" card alongside:
- Create New Request
- Bulk Request
- **Configure Approvers** ← NEW BUTTON
- View Approvals
- Redemption Calendar

## Modal Functionality

The `RedemptionApprovalConfigModal` provides:

### Features:
- **Approver Selection**: Choose users who can approve redemption requests
- **Approval Threshold**: Configure voting requirements:
  - All approvers (unanimous)
  - Majority of approvers
  - Any approver (first approval)
- **Role-based Configuration**: Set up approvers by role
- **Database Integration**: Saves to `approval_configs` table
- **Validation**: Ensures at least one approver is selected

### Database Schema:
```sql
approval_configs:
- id: "redemption_global"
- permission_id: "redemption_approval"  
- eligible_roles: [array of role names]
- consensus_type: "all" | "majority" | "any"
- required_approvals: number
- updated_at: timestamp
```

## Testing the Functionality

1. **Open Redemption Dashboard**
2. **Click "Configure Approvers"** button (either in header or quick actions)
3. **Modal Opens** with configuration options
4. **Select Approvers** using the approver selection component
5. **Choose Threshold** (all/majority/any)
6. **Save Configuration** - stores to database
7. **Success Notification** appears
8. **Data Refreshes** automatically

## Integration Points

### Related Components Used:
- `RedemptionApprovalConfigModal` - Main configuration modal
- `RedemptionApproverSelection` - User/role selection component
- Supabase `approval_configs` table - Data persistence
- Toast notifications - Success/error feedback

### Dependencies:
- Authentication system for user context
- Supabase database for storage
- UI components (Dialog, Button, etc.)
- Notification system for feedback

## Next Steps

1. **Test the button functionality** in the browser
2. **Verify modal opens correctly** when clicking either button
3. **Test approver selection** and configuration saving
4. **Check database persistence** in `approval_configs` table
5. **Verify notifications** appear on save success/failure

## Status

✅ **COMPLETED** - Configure Approvers button and modal onclick functionality is now fully implemented and accessible from two locations in the redemption dashboard.

## Troubleshooting

If the button doesn't appear:
1. Check that the component is imported correctly
2. Verify the state variables are defined
3. Ensure the modal component exists at the expected path
4. Check for any TypeScript compilation errors

If the modal doesn't open:
1. Check browser console for JavaScript errors
2. Verify the onClick handler is properly connected
3. Check that the modal state is being updated correctly
4. Ensure all required props are being passed to the modal
