# `/src/components/tests` — READMEnew.md

This folder contains utility and diagnostic React components for testing core platform features, such as permissions and role-based access control. These components are intended for use by developers and administrators during development, QA, and troubleshooting.

---

## Files

### PermissionsTest.tsx
- **Purpose:**  
  Provides a UI for testing user permissions, role checks, and approver logic.
- **Features:**  
  - Uses `usePermissions` and `useApprovers` hooks to check if the current user can approve policy rules.
  - Displays a list of users with the required roles (e.g., admin, compliance officer).
  - Shows cached permissions, user roles, and dynamic permission checks.
  - Uses Radix UI/shadcn/ui primitives for cards, buttons, and icons.
  - Designed for manual QA, debugging, and verifying RBAC logic.
- **Dependencies:**  
  - `@/hooks/usePermissions`, `@/hooks/useApprovers`
  - `@/contexts/AuthProvider`
  - UI primitives from `@/components/ui`
  - `lucide-react` for icons

---

## Developer Notes

- Intended for internal use only; do not include in production builds.
- Extend with additional test utilities as needed for new platform features.
- Ensure all test components are isolated from business logic and do not leak test data or state.

---

### Download Link

- [Download /src/components/tests/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/tests/READMEnew.md)
- [Download /memory-bank/components/tests/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/tests/READMEnew.md)

