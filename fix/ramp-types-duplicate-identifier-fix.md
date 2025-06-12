# RAMP Types Duplicate Identifier Fix

## Issue
TypeScript compilation error due to duplicate identifier `RampWebhookEventRecord` defined in both:
- `/src/types/ramp/events.ts` (line 35)  
- `/src/types/ramp/database.ts` (line 73)

Both were being exported in `/src/types/ramp/index.ts`, causing the conflict.

## Root Cause
The `RampWebhookEventRecord` type was defined independently in two modules:
1. **events.ts**: Defined locally for convenience 
2. **database.ts**: Defined as the authoritative database record type

When both modules exported the same type name through the index file, TypeScript flagged it as a duplicate identifier.

## Solution
Applied the principle that **database record types belong in the database module**:

### Changes Made

#### 1. `/src/types/ramp/events.ts`
- **Removed**: Local definition of `RampWebhookEventRecord` and `RampTransactionEventRecord`
- **Added**: Import of `RampWebhookType` from `./core`
- **Added**: Re-export of database types from `./database` to maintain API compatibility
- **Removed**: Duplicate `RampWebhookType` definition (already exists in core.ts)

```typescript
// Before: Local definitions
export interface RampWebhookEventRecord { ... }
export interface RampTransactionEventRecord { ... }

// After: Import from database module
export type { RampWebhookEventRecord, RampTransactionEvent as RampTransactionEventRecord } from './database';
```

#### 2. `/src/types/ramp/index.ts`  
- **Removed**: `RampWebhookEventRecord` from events module exports
- **Kept**: `RampWebhookEventRecord` export from database module only

This ensures a single source of truth for database record types.

## Files Modified
- `/src/types/ramp/events.ts`
- `/src/types/ramp/index.ts`

## Verification
- TypeScript compilation now passes without duplicate identifier errors
- All imports and exports maintain backward compatibility
- Type hierarchy follows consistent patterns (database types in database.ts, event types in events.ts)

## Prevention
- Database record types should only be defined in `database.ts`
- Other modules should import database types rather than redefining them
- Index files should carefully manage exports to avoid conflicts
- Follow the established naming conventions and type organization patterns
