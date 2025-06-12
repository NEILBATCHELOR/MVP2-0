# /src/components/UserManagement/policies — READMEnew.md

This folder contains UI components for managing user, role, and policy permissions within the application. These components enable granular access control, permission matrix editing, and consensus/approver rule configuration for sensitive actions.

## Files

### PermissionMatrix.tsx
- **Purpose:** Interactive table and card UI for visualizing and editing the permission matrix for various roles and functions.
- **Key Features:**
  - Displays each function and its description, with columns for each role (superAdmin, owner, complianceManager, agent, complianceOfficer).
  - Allows toggling, limiting, or disabling permissions per role/function.
  - Supports saving changes to local storage and logging updates to audit logs.
  - Provides tooltips, icons, and switch controls for clear UX.
- **Dependencies:** Uses design system components (Table, Card, Button, Tooltip, Switch) and Lucide icons.

### PolicyRules.tsx
- **Purpose:** UI for configuring policy rules, consensus options, and eligible signers/approvers for multi-sig or consensus-based actions.
- **Key Features:**
  - Allows selection of consensus type, eligible roles, required approvals, and specific signers.
  - Displays eligible signers with avatars, emails, and selection state.
  - Validates selection count and provides feedback on current/required approvers.
  - Handles saving changes and updating parent state/config.
- **Dependencies:** Uses Card, Button, and other UI primitives; integrates with user/role data.

## Usage
- Import these components in admin or user management dashboards where permission or policy configuration is required.
- Use PermissionMatrix for role/function permission editing; use PolicyRules for consensus/approver rule setup.

## Developer Notes
- Keep permission and consensus logic in sync with backend and audit logging.
- Extend these components as new roles, functions, or policy types are introduced.

---

### Download Link
- [Download /src/components/UserManagement/policies/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/UserManagement/policies/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/components/UserManagement/policies/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/UserManagement/policies/READMEnew.md)
