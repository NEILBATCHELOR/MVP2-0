# /src/tests — READMEnew.md

This folder contains integration and system-level test scripts for validating core business logic, especially around permissions and access control in the application. These tests are designed to be run manually or as part of the CI pipeline to ensure correct behavior of the Supabase-based permissions system and related database functions.

## Files

### testPermissions.ts
- **Purpose:** Integration test script for the new permissions system, verifying role-based access, permission grants, and database RPCs.
- **Key Features:**
  - Tests the `get_users_with_permission` RPC to fetch users with a specific permission.
  - Directly queries the `role_permissions` table to validate role-permission assignments.
  - Fetches and prints all users and their roles for inspection.
  - Tests the `check_user_permission` RPC to verify if a user has a specific permission.
  - Uses type assertions for strict TypeScript safety.
- **Dependencies:**
  - Supabase client and types (`@/infrastructure/supabase`, `@/types/supabase`)
  - Database schema must include `users`, `roles`, `role_permissions`, and the relevant RPCs.
- **Usage:**
  - Run with: `npm run ts-node src/tests/testPermissions.ts`
  - Used by devs and QA to validate permission changes, role assignments, and Supabase function integration.

## Developer Notes
- Keep these tests up to date with changes to the permissions system or database schema.
- Add new test scripts here for other system-level features as needed (e.g., audit logging, workflow automation, etc).
- Consider integrating with automated CI for regression testing.

---

### Download Link
- [Download /src/tests/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/tests/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/tests/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/tests/READMEnew.md)
