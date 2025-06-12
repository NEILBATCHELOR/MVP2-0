# Lib Directory

This directory contains core utility libraries, API clients, and service abstractions that form the foundation of the application's functionality. These libraries provide reusable functionality for interacting with external services, handling data, and implementing business logic.

## Key Files

### supabase.ts
Configures and exports the Supabase client with retry logic and utility functions:

- `supabase`: The main Supabase client instance with TypeScript typing
- `executeWithRetry()`: Function for executing Supabase queries with automatic retries
- `checkSupabaseConnection()`: Tests the Supabase connection
- `debugQuery()`: Enhanced debugging for Supabase queries
- Utility functions for file storage operations
- User role management functions

### api.ts
Defines a standardized API interface for common operations:

- `ApiResponse<T>` interface for consistent response handling
- Document verification functions: `verifyDocument()`, `rejectDocument()`
- KYC status management: `updateKycStatus()`
- Wallet operations: `activateWallet()`, `blockWallet()`
- Workflow management: `updateWorkflowStage()`
- Investor approval: `approveInvestor()`, `rejectInvestor()`
- Whitelist management: `addToWhitelist()`, `removeFromWhitelist()`
- Notification handling: `createNotification()`, `markNotificationAsRead()`

### users.ts
User management functionality:

- User registration and login
- User profile management
- Role and permission management
- User preferences handling
- Password management
- Multi-factor authentication

### roles.ts
Role management functionality:

- Role CRUD operations
- Permission assignments
- Role hierarchy
- User-role relationship management

### crypto.ts
Cryptographic utilities:

- Encryption and decryption functions
- Hashing utilities
- Secure key generation
- Digital signature verification

### auditLogger.ts
Comprehensive audit logging system:

- Event logging with structured data
- Audit trail generation
- User action recording
- Compliance-focused logging

### activityLogger.ts
User activity tracking:

- Activity recording
- User session tracking
- Usage analytics
- Activity aggregation

### investors.ts
Investor management functionality:

- Investor profile management
- KYC/AML verification
- Investment tracking
- Investor communication

### subscriptions.ts
Subscription management:

- Subscription creation and tracking
- Payment processing
- Subscription status updates
- Renewal management

### redemptions.ts
Redemption process management:

- Redemption request handling
- Approval workflows
- Processing status tracking
- Payment disbursement

### documentStorage.ts
Document management system:

- Document upload and storage
- Metadata handling
- Document categorization
- Access control

### capTable.ts
Capitalization table management:

- Equity tracking
- Ownership calculation
- Dilution modeling
- Cap table visualization

### Sub-directories

#### lib/services/
Service-specific implementations separated by domain

#### lib/utils/
Lower-level utility functions

#### lib/web3/
Blockchain and web3 integration utilities

#### lib/api/
API clients for external services

## Common Patterns

1. **Retry Logic**: Most API calls use `executeWithRetry()` to handle network issues
2. **Type Safety**: TypeScript interfaces for all data structures
3. **Error Handling**: Consistent error reporting and logging
4. **Abstraction**: Business logic separated from UI concerns
5. **Audit Logging**: Operations that modify data include audit logging

## Dependencies

- Supabase client for database and authentication
- TypeScript for type safety
- Web3 libraries for blockchain integration
- Cryptographic libraries for security functions

## Best Practices

1. Always use the typed Supabase client
2. Wrap Supabase calls in `executeWithRetry()`
3. Handle errors gracefully
4. Include proper typing for all functions
5. Document complex functions with JSDoc comments
6. Avoid direct database manipulation in components