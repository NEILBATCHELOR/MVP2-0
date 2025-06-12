# `/src/components/layout` — READMEnew.md

This folder contains the main layout, header, and sidebar components for the application. These components orchestrate the overall page structure, navigation, and user context display across all authenticated and guest flows. Intended for developers implementing or modifying the platform's structural UI.

---

## File-by-File Breakdown

### Main Layout
- **MainLayout.tsx**
  - The root layout component for all authenticated routes (except `/login`).
  - Uses React Router's `Outlet` to render nested routes.
  - Conditionally displays the sidebar except on the login page.
  - Wraps all content in a flex layout for responsive design.
  - Integrates `Sidebar` and `Header` components.
  - Ensures sticky header and persistent sidebar.
  - Dependency: `react-router-dom`, `Sidebar`, `Header`.

### Header
- **Header.tsx**
  - Displays the application title, user welcome message, and user role.
  - Fetches user info and role from `AuthProvider` context and Supabase (`user_roles` table).
  - Uses `getRoleDisplayName` utility to normalize role names.
  - Responsive to authentication state (shows name/email or guest).
  - Sticky at the top of the viewport for persistent navigation.
  - Dependency: `@/contexts/AuthProvider`, `@/infrastructure/supabase`, `@/utils/roleNormalizer`.

### Sidebar
- **Sidebar.tsx**
  - Main navigation menu for the application.
  - Displays navigation links, user avatar, and quick actions.
  - Fetches user info for avatar and name/email display.
  - Includes a logout button that clears local/session storage, signs out from Supabase, clears DB sessions, and redirects to `/`.
  - Responsive and collapsible; hidden on login page.
  - Dependency: `@/contexts/AuthProvider`, `@/infrastructure/supabase`, `@/utils/sessionManager`, `lucide-react` for icons.

### Documentation
- **README.md**
  - Legacy documentation (superseded by this READMEnew.md).

---

## Usage
- Use `MainLayout` as the top-level wrapper for all authenticated routes.
- Place all page content inside the `Outlet` so it inherits the layout structure.
- Extend `Sidebar` with new navigation links or user actions as needed.
- Update `Header` to reflect new user context or branding changes.

## Developer Notes
- All UI follows Radix UI/shadcn/ui and platform design conventions.
- Always use context providers for user/session state.
- Ensure logout clears all session data for security.
- Sidebar and header should remain accessible and keyboard-navigable.

---

### Download Link
- [Download /src/components/layout/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/layout/READMEnew.md)
