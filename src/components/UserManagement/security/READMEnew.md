# /src/components/UserManagement/security — READMEnew.md

This folder contains user security-related UI components for multi-signature (multi-sig) approvals and multi-factor authentication (MFA) controls. These components are intended for use in admin/user management dashboards, policy enforcement, and user security settings.

## Files

### MultiSigModal.tsx
- **Purpose:** Modal dialog for multi-signature (multi-sig) approval workflows, supporting consensus-based actions that require multiple approvers.
- **Key Features:**
  - Fetches eligible approvers and consensus configuration (roles, required approvals) from local storage or backend.
  - Displays list of approvers, their avatars, roles, and approval status.
  - Shows progress bar for required approvals and time remaining.
  - Handles approve/reject actions and communicates results to parent component.
  - Used for sensitive actions requiring multi-party sign-off (e.g., policy changes, critical admin actions).
- **Dependencies:** Uses Radix UI Dialog, Progress, Avatar components, and Supabase for user/role data.

### UserMFAControls.tsx
- **Purpose:** UI controls for enabling/disabling multi-factor authentication (MFA) for users.
- **Key Features:**
  - Displays current MFA status (enabled/disabled) with badge and icon.
  - Allows admin to enable or disable MFA for a user, with confirmation dialog and reason input.
  - Handles dialog state, reason capture, and confirmation actions.
  - Integrates with backend to update MFA status (implementation may be in parent/service).
- **Dependencies:** Uses Radix UI Dialog, Badge, Button, Label, and Textarea components.

## Usage
- Import these components in user management dashboards, security policy pages, or admin panels where multi-sig approval or MFA controls are needed.
- MultiSigModal is typically used for actions requiring consensus/approval; UserMFAControls for user-level security settings.

## Developer Notes
- Keep logic for consensus config and MFA status updates in sync with backend and policy rules.
- Extend these components as new security features or requirements are introduced.

---

### Download Link
- [Download /src/components/UserManagement/security/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/UserManagement/security/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/components/UserManagement/security/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/UserManagement/security/READMEnew.md)
