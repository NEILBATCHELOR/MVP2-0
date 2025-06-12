# `/src/components/dashboard` — READMEnew.md

This folder contains all dashboard components, dialogs, utilities, and types for the main investor/admin dashboard, including compliance, KYC, document management, notifications, wallet integration, and workflow visualization. Intended for developers building or maintaining platform dashboards and investor management UIs.

---

## File-by-File Breakdown

### Core Dashboard Structure
- **Dashboard.tsx**
  - Main dashboard layout and logic for investors/admins.
  - Aggregates summary stats, renders tabs, and orchestrates subcomponents.
  - Handles routing, tab switching, and global dashboard state.
  - Dependencies: `DashboardHeader`, `DashboardTabs`, `StatusSummary`, `InvestorGrid`, `ComplianceSection`, `WalletSection`, `DocumentSection`, `NotificationSection`, `WorkflowVisualization`.

- **DashboardHeader.tsx**
  - Renders dashboard title, breadcrumbs, and user context info.
  - Integrates with notification and status summary.

- **DashboardTabs.tsx**
  - Tabbed navigation for dashboard sections (investors, compliance, docs, wallets, etc).
  - Handles tab switching and conditional rendering.

### Investor Management & KYC
- **InvestorGrid.tsx**
  - Displays all investors in a data grid with sorting, filtering, and bulk actions.
  - Integrates with KYC/AML status, wallet, and compliance checks.
  - Used by admins for onboarding, review, and bulk updates.
- **InvestorTypes.ts**
  - TypeScript interfaces for investor objects, KYC status, and roles.
- **KYCStatusCell.tsx**
  - Renders KYC/AML status badges in investor grid.
  - Uses Radix UI/shadcn/ui for badge styling.
- **BatchScreeningDialog.tsx**
  - Dialog for bulk screening of investors for compliance/KYC.
  - Allows selection, status update, and progress tracking.
- **ScreeningDialog.tsx**
  - Dialog for running compliance or KYC screening on a single investor.
- **IdentifyVerificationDialog.tsx**
  - Dialog for verifying investor identity, integrating with Onfido.
- **OnfidoVerificationDialog.tsx**
  - Handles Onfido SDK KYC verification for investors.

### Compliance, Documents, and Notifications
- **ComplianceSection.tsx**
  - Displays compliance status, outstanding actions, and alerts for investors.
  - Aggregates KYC, AML, and other compliance checks.
- **DocumentSection.tsx**
  - Manages investor document uploads, verification, and status.
  - Integrates with document service and shows progress/errors.
- **NotificationSection.tsx**
  - Renders notifications and alerts for dashboard users (compliance, onboarding, etc).

### Wallet Integration
- **WalletSection.tsx**
  - Displays wallet setup/status for investors.
  - Integrates with wallet onboarding flows and status checks.

### Workflow Visualization & Utilities
- **WorkflowVisualization.tsx**
  - Visualizes onboarding/compliance workflow stages for investors.
  - Interactive navigation through workflow stages with progress indicators.
- **StatusSummary.tsx**
  - Shows summary cards for key metrics (investors onboarded, pending, failed, etc).
- **GridToolbar.tsx**
  - Toolbar for grid actions: search, filter, export, bulk actions.

### Types & Config
- **tsconfig.json**
  - TypeScript config for dashboard folder.
- **README.md**
  - Legacy documentation (superseded by this READMEnew.md).

---

## Usage
- Use these components to build investor/admin dashboards, compliance review, and onboarding flows.
- Integrate with platform services for investors, compliance, documents, and wallets.
- Extend dialogs and sections for new business requirements.

## Developer Notes
- All UI follows Radix UI/shadcn/ui conventions for accessibility and consistency.
- Use provided type definitions for investor and compliance data.
- All data access via service layers; do not query Supabase directly in components.
- Extend workflow and notification logic as business needs evolve.

---

### Download Link
- [Download /src/components/dashboard/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/dashboard/READMEnew.md)
