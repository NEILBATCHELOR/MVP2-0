# `/src/components/captable` — READMEnew.md

This folder contains all components, dialogs, utilities, and types for cap table management, token allocation, investor onboarding, compliance, reporting, and scenario planning. It is intended for developers building or maintaining cap table workflows, investor management, and token distribution logic.

---

## File-by-File Breakdown

### Core Cap Table Management
- **CapTableDashboard.tsx**
  - Main dashboard for managing and visualizing the cap table.
  - Fetches investor/project/token data, aggregates metrics, and renders summary cards/charts.
  - Uses Radix UI/shadcn/ui for layout and charts.
  - Dependencies: `@/services/captable/capTableService`, `@/components/ui`, `lucide-react`.
- **CapTableManager.tsx** / **CapTableManagerNew.tsx**
  - Core logic and UI for managing cap table entries, allocations, and investor records.
  - Handles CRUD operations, batch updates, and compliance checks.
  - Integrates with `CapTableSummary`, `InvestorTable`, and `TokenAllocationManager`.
- **CapTableNavigation.tsx**
  - Navigation menu for cap table workflows (dashboard, reports, allocations, etc).
  - Uses Radix UI navigation primitives.
- **CapTableSummary.tsx**
  - Displays summary stats: total investors, allocation, token distribution, compliance.
  - Used in dashboards and reports.
- **CapTableView.tsx**
  - Table view for all cap table entries, allocations, and investor data.
  - Supports sorting, filtering, and inline editing.

### Investor Management
- **InvestorDialog.tsx**
  - Dialog for viewing and editing investor details.
  - Used in onboarding and compliance flows.
- **InvestorImportDialog.tsx**
  - Handles CSV/bulk import of investor data.
  - Validates and maps imported fields to investor model.
- **InvestorTable.tsx**
  - Renders a table of all investors, showing KYC, allocation, and status.
  - Integrates with filtering, search, and bulk actions.

### Token Allocation & Distribution
- **TokenAllocationManager.tsx**
  - Core logic for managing token allocations to investors.
  - Handles allocation calculations, confirmations, and compliance checks.
- **TokenAllocationForm.tsx**
  - Form for creating or editing token allocations.
  - Validates input, supports dynamic fields.
- **TokenAllocationTable.tsx**
  - Table view of all token allocations, sortable and filterable.
- **TokenAllocationExportDialog.tsx**
  - Export allocations to CSV/Excel for external reporting.
- **TokenAllocationUploadDialog.tsx**
  - Upload and map allocation data in bulk.
- **TokenDistributionManager.tsx**
  - Orchestrates the distribution of tokens to investors after allocation.
- **TokenDistributionDialog.tsx**
  - Dialog for confirming and executing token distributions.

### Subscription Management
- **SubscriptionManager.tsx**
  - Manages investor subscriptions to offerings.
  - Handles compliance checks, allocation, and approval flows.
- **SubscriptionDialog.tsx** / **SubscriptionConfirmationDialog.tsx** / **SubscriptionExportDialog.tsx** / **SubscriptionUploadDialog.tsx**
  - Dialogs for subscribing, confirming, exporting, and uploading subscription data.

### Compliance & Document Management
- **CompliancePanel.tsx**
  - Displays compliance status and outstanding actions for cap table participants.
- **DocumentManager.tsx**
  - Manages investor and project document uploads, verification, and status.

### Scenario Planning & Reporting
- **ScenarioPlanner.tsx**
  - Interactive tool for modeling exit scenarios and cap table changes.
  - Calculates returns, dilution, and waterfall distributions.
- **WaterfallModel.tsx**
  - Visualizes distribution of exit proceeds among investors.
  - Includes tabular and chart views, export functionality.
- **CapTableReports.tsx** / **CapTableReportExport.tsx**
  - Generates and exports cap table and allocation reports.

### Dialogs & Utility Components
- **AllocationConfirmationDialog.tsx**
  - Confirms allocation actions with users.
- **BulkOperationsMenu.tsx**
  - Menu for bulk editing, status updates, and allocation actions.
- **BulkStatusUpdateDialog.tsx**
  - Dialog for updating status of multiple entries.
- **ProjectSelector.tsx**
  - UI for selecting and assigning projects to investors or allocations.
- **TagsDialog.tsx**
  - Manage tags/labels for investors or allocations.
- **TokenMintingManager.tsx** / **TokenMintingDialog.tsx** / **TokenMintingPanel.tsx**
  - Components for minting new tokens for investors or pools.

### Types & Config
- **types.ts**
  - TypeScript interfaces for all major models (e.g., `ExtendedTokenAllocation`).
- **tsconfig.json**
  - TypeScript configuration for cap table folder.

### Legacy/Supporting Files
- **READMEcont.md**, **READMEnew.md**
  - Documentation (this file supersedes others).

---

## Usage
- Use these components to build complete cap table, allocation, and investor onboarding flows.
- Integrate with compliance, reporting, and tokenization modules as needed.
- Extend dialogs and managers for new business requirements.

## Developer Notes
- All UI follows Radix UI/shadcn/ui conventions for accessibility and consistency.
- All data access is via service layers; do not query Supabase directly in components.
- Extend scenario planning and reporting logic as business needs evolve.
- Ensure all bulk actions are validated and auditable.

---

### Download Link
- [Download /src/components/captable/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/captable/READMEnew.md)
