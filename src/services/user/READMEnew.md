# `/src/services/user` — READMEnew.md

This folder provides user management logic, including roles, user profiles, and service-layer utilities for handling user data. It supports both live and mock user data, role assignments, and user-centric business logic for the application.

---

## Files

- **roles.ts**
  - Defines the `UserRole` interface and role normalization logic.
  - Provides functions to fetch, add, and remove user roles via Supabase.
  - Ensures role data is consistent and backwards compatible.

- **userService.ts**
  - Service-layer logic for user management, including fetching users, updating profiles, and handling user-specific workflows.
  - Integrates with Supabase for persistent user data.

- **users.ts**
  - Mock user data and utility functions for development/testing.
  - Supports filtering, sorting, and pagination of user lists.

---

## Usage
- Use these services for all user-related data access, role management, and profile updates.
- Extend with additional user-centric business logic as needed.

## Developer Notes
- All types are TypeScript-typed for safety and maintainability.
- Prefer using `userService.ts` for real user data; use `users.ts` for mock/testing scenarios.
- Keep documentation (`READMEnew.md`) up to date as user logic evolves.

---

### Download Link
- [Download /src/services/user/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/services/user/READMEnew.md)
