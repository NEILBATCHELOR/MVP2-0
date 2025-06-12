# /src/utils/supabase — READMEnew.md

This folder contains utility functions for working with Supabase responses and error handling. These helpers standardize error logging, error message extraction, and response normalization for all Supabase-based service calls throughout the application.

## Files

### supabaseHelpers.ts
- **Purpose:** Provides reusable helpers for error handling, logging, and response normalization when interacting with Supabase.
- **Key Exports:**
  - `getErrorMessage(error)`: Extracts a human-readable error message from a Supabase error object.
  - `logSupabaseError(error, context)`: Logs Supabase errors to the console with contextual information.
  - `handleSupabaseError(error, context)`: Logs an error and returns a user-facing error message string.
  - `generateUniqueId()`: Generates a unique string ID (timestamp + random component) for use in client-side logic.
  - `handleSupabaseResponse<T>(promise, context)`: Awaits a Supabase promise, logs/throws on error, and always returns an array of results (even if single or null).
  - `handleSupabaseSingleResponse<T>(promise, context)`: Awaits a Supabase promise, logs/throws on error, and returns a single result or null.
- **Usage:** Use these helpers in all Supabase service calls, especially in services, hooks, and data loaders, to ensure consistent error handling and reduce boilerplate.
- **Dependencies:** Imports the configured Supabase client from `@/infrastructure/supabase`.

## Developer Notes
- Always use these helpers for error handling and response normalization to ensure consistent user and developer experience.
- Add new helpers here as Supabase integration patterns evolve.

---

### Download Link
- [Download /src/utils/supabase/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/utils/supabase/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/utils/supabase/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/utils/supabase/READMEnew.md)
