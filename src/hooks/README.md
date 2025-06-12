# Hooks Directory

This directory contains React custom hooks that encapsulate reusable stateful logic for components. These hooks provide a clean interface to access and manipulate application state, handle API calls, and manage complex UI interactions.

## Key Files

### useRules.ts
Manages rule-related state and operations:
- Loading, creating, updating, and deleting rules
- Managing rule templates
- Converting between UI and database rule formats
- Creating logical rule groups
- Template versioning
- Error handling for rule operations

Provides functions such as:
- `loadRules()` - Load all rules
- `createNewRule()` - Create a new rule
- `updateExistingRule()` - Update a rule
- `deleteExistingRule()` - Delete a rule
- `createNewRuleTemplate()` - Create a rule template
- `applyTemplate()` - Apply a template to create a rule

### usePolicyTemplates.ts
Manages policy template state and operations:
- Loading, creating, updating policy templates
- Template versioning and application
- Template categories and tags
- Error and loading state management

### useApprovers.ts / useApprovers.optimized.ts
Handles policy approval workflow state:
- Managing approver assignments
- Tracking approval status
- Notification management
- Optimized version with improved performance

### useEnhancedRules.ts
Provides extended rule management capabilities:
- Rule conflict detection
- Rule impact analysis
- Advanced rule filtering and sorting
- Rule grouping and categorization

### usePermissions.ts / usePermissions.tsx
Manages user permissions and access control:
- Role-based permission checking
- Feature access control
- Permission-based UI adaptation
- Permission caching for performance

### useAuth.ts / useAuth.tsx
Handles authentication state and operations:
- User authentication status
- Login, logout, and registration
- Session management
- User profile access

### usePolicies.ts
Manages policy-related state and operations:
- Policy loading and filtering
- Policy creation and updating
- Policy status tracking
- Policy versioning

### useRealtimeStatus.ts
Handles real-time connection state:
- Connection status monitoring
- Reconnection logic
- Subscription management
- Event handling

### useNotificationPermission.ts
Manages browser notification permissions:
- Permission status checking
- Permission requesting
- Notification display configuration
- User preferences for notifications

## Dependencies

These hooks primarily depend on:
- React hooks (useState, useEffect, useCallback, useMemo)
- Service functions from the `services` directory
- Context providers
- TypeScript types from the `types` directory

## Best Practices

1. Keep hooks focused on a specific domain or feature
2. Implement proper loading and error states
3. Use TypeScript for better type safety
4. Handle side effects correctly with useEffect
5. Memoize callbacks and complex calculations
6. Provide a clean, consistent API to components
7. Add JSDoc comments for hook functions
8. Follow the naming convention of 'useXxx'