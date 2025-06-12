# `/src/services` — READMEnew.md

This folder contains all business logic, service modules, and integration layers for the application. Each subfolder encapsulates a specific domain or feature area, providing clean APIs for use by pages and components. Services handle data fetching, transformation, orchestration, and external integrations.

---

## Key Subfolders
- **audit/**: Audit event logging and compliance tracking services.
- **auth/**: Authentication, authorization, and user session management logic.
- **captable/**: Cap table management, share issuance, and investor record services.
- **compliance/**: Compliance checks, KYC/AML, and regulatory rule enforcement.
- **dashboard/**: Aggregation and analytics for dashboard views.
- **document/**: Document upload, storage, and retrieval services.
- **integrations/**: Third-party service connectors and adapters.
- **investor/**: Investor onboarding, management, and reporting logic.
- **policy/**: Policy management, eligibility, and workflow logic.
- **project/**: Project creation, listing, and management services.
- **realtime/**: Real-time event, notification, and websocket services.
- **redemption/**: Redemption and withdrawal workflows.
- **rule/**: Business rule engines and eligibility checks.
- **token/**: Token template, issuance, and management logic (see token/READMEnew.md).
- **user/**: User management, roles, and profile services (see user/READMEnew.md).
- **wallet/**: Wallet creation, pools, contracts, ABI, v4, and generator logic (see wallet/READMEnew.md).
- **workflow/**: Workflow orchestration and automation services.

---

## Usage
- Import and use service modules for business logic, data orchestration, and external integrations.
- Extend subfolders as new domains or features are added.
- Keep business logic out of pages/components for maintainability.

## Developer Notes
- All services are TypeScript-typed and designed for modular import.
- Follow domain-driven folder structure for scalability and clarity.
- Keep documentation (`READMEnew.md`) up to date as new services are added or updated.

---

### Download Link
- [Download /src/services/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/services/READMEnew.md)
