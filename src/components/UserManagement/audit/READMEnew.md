# /src/components/UserManagement/audit — READMEnew.md

This folder contains UI components for displaying and managing audit logs within the user management and security system. These components are intended for use by admins and compliance officers to review, verify, and export audit trails of sensitive actions.

## Files

### AuditLogs.tsx
- **Purpose:** Card/table UI for displaying a list of audit logs, including details of sensitive actions, user, status, and cryptographic verification.
- **Key Features:**
  - Fetches audit logs from backend or uses provided logs as props.
  - Displays action, user, details, status, and cryptographic signature verification (if present).
  - Allows filtering/searching and refresh of logs.
  - Supports exporting logs as CSV or JSON for compliance/auditing purposes.
  - Uses design system components (Card, Table, Badge, Button, Input, Select) and Lucide icons.

## Usage
- Import `AuditLogs` in admin dashboards, compliance panels, or audit review workflows.
- Use for monitoring, verifying, and exporting audit trails of sensitive user/role/policy actions.

## Developer Notes
- Ensure audit log fetching and export logic is in sync with backend and cryptographic verification utilities.
- Extend as new audit log fields or compliance requirements are introduced.

---

### Download Link
- [Download /src/components/UserManagement/audit/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/UserManagement/audit/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/components/UserManagement/audit/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/UserManagement/audit/READMEnew.md)
