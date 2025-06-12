# Services Directory

This directory contains service modules that encapsulate the business logic of the application. Services act as an intermediary layer between the UI components and the data layer, handling data processing, API calls, and complex business operations.

## Key Files

### ruleService.ts
Manages rule-related operations including:
- Creating, updating, and deleting rules
- Retrieving rules from the database
- Converting between UI and database rule formats

Functions:
- `getAllRules()` - Retrieve all rules
- `getRuleTemplates()` - Retrieve rule templates
- `createRuleTemplate()` - Create a new rule template
- `getRuleById()` - Get a single rule by ID
- `createRule()` - Create a new rule
- `updateRule()` - Update an existing rule
- `deleteRule()` - Delete a rule
- `deactivateRule()` - Soft delete a rule
- `convertToDatabaseRule()` - Convert UI rule to database format
- `convertToUIRule()` - Convert database rule to UI format

### ruleTemplateService.ts
Handles rule template management:
- Creating and retrieving templates
- Applying templates to create new rules
- Template versioning and metadata

### authService.ts
Handles authentication-related operations:
- User authentication and session management
- Password reset and recovery processes
- Multi-factor authentication
- User profile management

### policyService.ts
Manages policy-related operations:
- Creating, updating, and retrieving policies
- Policy approval workflows
- Policy versioning

### policyTemplateService.ts
Handles policy template operations:
- Template creation and management
- Template application to create policies
- Template categories and recommendations

### policyVersionService.ts
Manages versioning of policies:
- Creating new policy versions
- Tracking version history
- Version comparison

### policyApproverService.ts
Handles policy approval workflow:
- Assigning approvers to policies
- Tracking approval status
- Notification management for approvals

### enhancedPolicyService.ts
Advanced policy management features:
- Policy analytics and insights
- Compliance tracking
- Policy effectiveness measurements

### enhancedRuleService.ts
Extended rule management features:
- Rule impact analysis
- Rule application simulation
- Conflict detection

### ruleConflictService.ts
Detects and manages conflicts between rules:
- Identifying rule conflicts
- Resolving conflicting rules
- Prioritizing rules

### auditLogService.ts
Manages audit logging:
- Recording system actions
- Retrieval of audit history
- Audit report generation

### realtimeService.ts
Handles real-time updates using Supabase realtime:
- Subscription management
- Event handling
- Real-time notifications

### ruleFactory.ts / ruleFactory.fixed.ts
Factory for creating different types of rules:
- Rule type registration
- Rule instance creation
- Rule validation

## Dependencies

The services in this directory primarily depend on:
- Supabase client from `@/lib/supabase`
- Database types from `@/types/database`
- Business model types from `@/types/centralModels`

## Best Practices

1. Services should be stateless and focused on specific domains
2. Use proper error handling with try/catch blocks
3. Validate inputs before performing operations
4. Document exported functions with JSDoc comments
5. Use TypeScript types for parameters and return values
6. Handle asynchronous operations with proper Promise chains
7. Separate UI logic from data manipulation logic