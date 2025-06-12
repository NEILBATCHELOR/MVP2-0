# /src/components/admin — READMEnew.md

This folder contains utility UI components for administrative operations and database maintenance within the application. It is intended for super-admins and developers to perform advanced or emergency actions, such as running SQL fixes, inspecting environment details, or bypassing authentication for troubleshooting.

## Files

### AdminUtilityModal.tsx
- **Purpose:** Modal dialog providing a suite of admin utilities for database and environment management.
- **Key Features:**
  - Tabs for running SQL migrations/fixes (e.g., UUID casting, policy approver functions) and viewing environment diagnostics.
  - Executes predefined SQL scripts for database repair and migration.
  - Displays database and authentication status, environment metadata, and last sync time.
  - Uses Radix UI Dialog, Tabs, Badge, Textarea, and Lucide icons.

## Usage
- Import `AdminUtilityModal` in admin dashboards or developer tools where advanced database or environment actions are required.
- Restrict access to super-admins or trusted developers only.

## Developer Notes
- Keep SQL scripts and environment diagnostics up to date with production requirements and schema changes.
- Use with caution—these utilities can affect critical system state.
- Extend as new admin/maintenance features are needed.

---

### Download Link
- [Download /src/components/admin/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/admin/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/components/admin/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/admin/READMEnew.md)
