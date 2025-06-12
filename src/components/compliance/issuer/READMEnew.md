# /src/components/compliance/issuer — READMEnew.md

This folder contains UI components, onboarding flows, hooks, and services for issuer compliance, document management, and onboarding within the compliance module. It is intended for developers building or maintaining issuer-side compliance and onboarding features.

## Structure & Contents

- **components/**: File management (upload, preview), document workflows.
- **hooks/**: Custom hooks for issuer CRUD operations and logic reuse.
- **onboarding/**: Multi-step issuer onboarding flows, due diligence, document upload, wallet setup, and final review.
- **services/**: Service modules for backend integration (issuer API, document storage, file transformation).
- **ComplianceReport.tsx**: Component for issuer compliance reporting.
- **DocumentManagement.tsx**: UI for managing issuer documents.
- **SignOffWorkflow.tsx**: Workflow for sign-off and approvals.
- **types/**: Type definitions for issuer compliance domain.
- **index.ts**: Barrel file for exports.

## Usage
- Import these modules for issuer onboarding, compliance, or document management features.
- Compose onboarding flows using onboarding components, hooks, and services for stateful, multi-step processes.

## Developer Notes
- Keep issuer onboarding and compliance logic modular and decoupled from investor/admin flows.
- Extend as new issuer compliance requirements or onboarding steps are added.
- Document new flows, hooks, or services added to this folder.

---

### Download Link
- [Download /src/components/compliance/issuer/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/compliance/issuer/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/components/compliance/issuer/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/compliance/issuer/READMEnew.md)
