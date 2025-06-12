# Fix: RAMP Webhook Events TypeScript Errors

## Problem Summary
The `ramp-webhooks.ts` file had TypeScript errors because it was trying to use a table called `ramp_webhook_events` that exists in the database but was missing from the generated Supabase types.

## Root Cause
- Table `ramp_webhook_events` exists in the database (confirmed via SQL query)
- Table definition missing from `src/types/core/supabase.ts` (generated file)
- Code in `src/routes/api/ramp-webhooks.ts` was referencing the missing table type

## Errors Fixed
1. `Type '"ramp_webhook_events"' does not satisfy the constraint` (multiple instances)
2. `Type instantiation is excessively deep and possibly infinite` 
3. `No overload matches this call` for database queries
4. `Property 'event_id' does not exist on type 'unknown'` (multiple properties)

## Solution Applied

### 1. Added Missing Table Types
**File:** `/src/types/core/database.ts`

Added complete type definitions for the `ramp_webhook_events` table:
```typescript
export interface RampWebhookEventTable {
  id: string;
  event_id: string;
  event_type: string;
  flow_type: string;
  payload: any; // jsonb
  processing_status: string;
  error_message?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export type RampWebhookEventInsert = Omit<RampWebhookEventTable, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RampWebhookEventUpdate = Partial<Omit<RampWebhookEventTable, 'id' | 'event_id' | 'created_at'>>;
```

### 2. Created Helper Type System
Enhanced the `Tables`, `InsertTables`, and `UpdateTables` helper types to support both existing Supabase tables and custom table definitions:

```typescript
type TablesHelper = {
  ramp_webhook_events: {
    Row: RampWebhookEventTable;
    Insert: RampWebhookEventInsert;
    Update: RampWebhookEventUpdate;
  };
};

export type Tables<T extends keyof (Database["public"]["Tables"] & TablesHelper)> =
  T extends keyof Database["public"]["Tables"] 
    ? Database["public"]["Tables"][T]["Row"]
    : T extends keyof TablesHelper
    ? TablesHelper[T]["Row"]
    : never;
```

### 3. Fixed Import and Usage
**File:** `/src/routes/api/ramp-webhooks.ts`

Updated imports and type aliases:
```typescript
import type { RampWebhookEventTable, RampWebhookEventInsert } from '@/types/core/database';

type RampWebhookEventRow = RampWebhookEventTable;
type RampWebhookEventInsertData = RampWebhookEventInsert;
```

## Database Schema
The actual table structure (verified from database):
```sql
Column              Type                     Nullable  Default
id                  uuid                     NO        gen_random_uuid()
event_id            text                     NO        
event_type          text                     NO        
flow_type           text                     NO        
payload             jsonb                    NO        
processing_status   text                     NO        'pending'::text
error_message       text                     YES       
processed_at        timestamp with time zone YES       
created_at          timestamp with time zone NO        now()
updated_at          timestamp with time zone NO        now()
```

## Next Steps
1. **Regenerate Supabase Types:** Run your Supabase type generation command to include the `ramp_webhook_events` table in the official types
2. **Remove Helper Types:** Once Supabase types include this table, remove the `TablesHelper` and revert to the standard type system
3. **Update Documentation:** Update any API documentation that references this webhook system

## Files Changed
- `/src/types/core/database.ts` - Added missing table types and helper system
- `/src/routes/api/ramp-webhooks.ts` - Fixed imports and type usage

## Status
✅ **RESOLVED** - All TypeScript errors in ramp-webhooks.ts have been fixed
⚠️ **TEMPORARY SOLUTION** - Requires Supabase type regeneration for permanent fix

## Verification
The fix can be verified by:
1. Running TypeScript compilation - no errors should occur
2. Testing the webhook endpoints with proper type safety
3. Confirming database operations work correctly

## Related Files
- Existing RAMP types: `/src/types/dfns/fiat.ts`
- Database schema: `/src/types/core/full_schema.sql`
- Webhook implementation: `/src/routes/api/ramp-webhooks.ts`
