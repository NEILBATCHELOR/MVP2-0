# `/src/components` — READMEnew.md

This folder contains all top-level UI components and feature modules for the application. Each subfolder represents a major domain area or feature, while atomic components and shared utilities are organized for reusability and consistency across the app.

---

## Top-Level Files
- **Spinner.tsx**: Accessible, theme-aware loading spinner component used throughout the UI.
- **home.tsx**: Main landing page and dashboard for managing projects, cap tables, and subscriptions. Integrates project, cap table, and subscription management UIs.

## Key Subfolders
- **UserManagement/**: User roles, permissions, and admin controls.
- **activity/**: User and system activity feeds, logs, and notifications.
- **admin/**: Admin dashboards and settings.
- **auth/**: Authentication, login, registration, and password flows.
- **captable/**: Cap table management, share issuance, and investor management.
- **compliance/**: Compliance checks, KYC/AML, and regulatory flows.
- **dashboard/**: General dashboards for user and admin overviews.
- **documents/**: Document upload, storage, and management UIs.
- **factoring/**: Invoice factoring and related components.
- **investors/**: Investor onboarding, management, and views.
- **layout/**: Layout wrappers, navigation, and responsive containers.
- **onboarding/**: User onboarding flows and checklists.
- **projects/**: Project creation, listing, and management.
- **redemption/**: Token redemption and withdrawal flows.
- **reports/**: Reporting and analytics UIs.
- **rules/**: Business rules, eligibility, and workflow logic.
- **shared/**: Shared atomic components, utilities, and hooks.
- **subscriptions/**: Subscription management and billing.
- **tests/**: Component and integration tests.
- **tokens/**: Token-related UIs, selectors, and management.
- **ui/**: Design system atoms/molecules (Radix UI, shadcn/ui), theme, icons, and base controls.
- **verification/**: Identity and KYC verification UIs.
- **wallet/**: Wallet management, transaction, and risk components (see wallet/READMEnew.md for details).

---

## Usage
- Import atomic and shared components from `shared/` or `ui/` for consistency.
- Integrate feature modules (e.g., wallet, captable, projects) in pages and flows as needed.
- Extend subfolders with new domain features as the app grows.

## Developer Notes
- All components follow Radix UI/shadcn/ui conventions for accessibility and design consistency.
- Subfolders are organized by domain for scalability and maintainability.
- Avoid duplication by centralizing atomic components and utilities in `shared/` and `ui/`.
- Keep documentation (`READMEnew.md`) up to date as new features and components are added.

---

### Download Link
- [Download /src/components/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/READMEnew.md)
