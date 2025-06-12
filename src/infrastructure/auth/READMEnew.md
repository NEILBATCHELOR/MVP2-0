# infrastructure/auth — READMEnew.md

This folder provides authentication and authorization utilities, tightly integrated with Supabase Auth and the application's user table. It exposes both low-level wrappers around Supabase's auth API and higher-level utilities for role/permission checks.

## Files

### auth.ts
- **getCurrentUserRole()**: Fetches the current user's role (using the `status` field in the `users` table as a role substitute).
- **getCurrentUserId()**: Returns the authenticated user's ID from the Supabase session.
- **hasRole(role: string)**: Checks if the current user has a specific role.
- **canPerformAction(action: string)**: Checks if the current user has permission to perform a given action. Permissions are expected as an array or JSON string in the `users` table.
- **Dependencies**: Relies on `supabase` from `@/infrastructure/supabase` and `Tables` from `@/types/database`.

### authClient.ts
- **signUp(params)**: Registers a new user via Supabase Auth.
- **signInWithPassword(params)**: Authenticates a user with email/password.
- **signOut()**: Signs out the current user.
- **getSession()**: Retrieves the current auth session.
- **getUser()**: Gets the current authenticated user details.
- **resetPasswordForEmail(email, options)**: Initiates a password reset for the given email.
- **updateUser(attributes)**: Updates user profile attributes in Supabase Auth.
- **onAuthStateChange(callback)**: Registers a callback for auth state changes.
- **Dependencies**: All methods are thin wrappers around `supabase.auth` API.

### index.ts
- Barrel export for all utilities in this folder (`auth.ts` and `authClient.ts`).

## Usage
- Use `getCurrentUserRole` and `hasRole` for role-based access control.
- Use `canPerformAction` for fine-grained, permission-based checks.
- Use `authClient.ts` exports for direct interaction with Supabase Auth (sign-up, sign-in, session management, etc).

## Developer Notes
- The `status` field in the `users` table is used as a proxy for roles; update if schema changes.
- Permission checks expect a `permissions` property (array or JSON string) on the user record.
- All methods are async and return Promises.
- All errors are logged to the console for debugging.

---

### Download Link
- [Download /src/infrastructure/auth/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/auth/READMEnew.md)
