# Database Type Structure Changes

## Overview

The project had two Supabase type definition files:
- `/src/lib/supabaseTypes.ts` - A comprehensive generated file that wasn't being used
- `/src/types/supabase.ts` - A manually maintained file that was actively being used

## Issue

The `/src/lib/supabaseTypes.ts` file contained type definitions for tables that were required by the application, but were missing in the actively used `/src/types/supabase.ts` file. This caused TypeScript errors during build related to missing tables:

- `token_allocations`
- `subscriptions` 
- `redemption_requests`
- `users`
- `user_roles`
- `permissions`

The `.cursorrules` file explicitly stated: "Never import from ../lib/supabaseTypes"

Additionally, there were errors related to missing type exports from `/src/types/database.ts`:

```
error TS2305: Module '"@/types/database"' has no exported member 'Tables'.
```

## Solution

1. We merged the necessary type definitions from the unused `/src/lib/supabaseTypes.ts` into the actively used `/src/types/supabase.ts`
2. Added the following tables to `/src/types/supabase.ts`:
   - `users`
   - `user_roles`
   - `permissions`
   - `token_allocations`
   - `subscriptions`
   - `redemption_requests`
3. Added helper type utilities that were missing:
   ```typescript
   export type Tables<T extends keyof Database["public"]["Tables"]> =
     Database["public"]["Tables"][T]["Row"];
   export type InsertTables<T extends keyof Database["public"]["Tables"]> =
     Database["public"]["Tables"][T]["Insert"];
   export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
     Database["public"]["Tables"][T]["Update"];
   ```

4. Added these same helper types to `/src/types/database.ts` by importing and re-exporting from `/src/types/supabase.ts`:
   ```typescript
   import { Database } from './supabase';
   
   // Helper types for Supabase - Re-exported from supabase.ts
   export type Tables<T extends keyof Database["public"]["Tables"]> =
     Database["public"]["Tables"][T]["Row"];
   export type InsertTables<T extends keyof Database["public"]["Tables"]> =
     Database["public"]["Tables"][T]["Insert"];
   export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
     Database["public"]["Tables"][T]["Update"];
   ```

5. Removed the unused `/src/lib/supabaseTypes.ts` file since it's no longer needed

## Going Forward

- All Supabase database type definitions should be kept in `/src/types/supabase.ts`
- `/src/types/database.ts` should re-export relevant types from `/src/types/supabase.ts` for consistent type use
- Follow the rules in `.cursorrules` for type imports:
  - Import database types from `@/types/database.ts`
  - Import supabase types from `@/types/supbase.ts`
- If you generate new type definitions, they should be merged into `/src/types/supabase.ts`
- Do not create or import from separate type definition files for Supabase