# `/src/components/factoring` — READMEnew.md

This folder contains all React components, hooks, types, and utilities for the invoice factoring and tokenized distribution flows. It supports dashboards, batch operations, token management, pool and invoice ingestion, and advanced analytics for digital asset-backed factoring.

---

## Main Components

- **FactoringDashboard.tsx**  
  Central dashboard for viewing pools, invoices, and tokenization status. Integrates charts, tables, and summary widgets.

- **FactoringManager.tsx**  
  Orchestrates core factoring flows: pool creation, invoice assignment, and status management.

- **FactoringNavigation.tsx**  
  Navigation bar or tab set for the factoring section, enabling access to pools, invoices, and analytics.

- **BulkEditAllocations.tsx**  
  Dialog/modal for batch editing or deleting token allocations. Handles error states, permission checks, and integrates with Supabase.

- **BulkEditInvoices.tsx**  
  Tool for batch editing invoice records, including validation and error handling.

- **InvoiceIngestionManager.tsx**  
  Handles CSV import, validation, and ingestion of invoice data.

- **PoolManager.tsx**  
  UI for creating and managing invoice pools, including pool type selection and invoice assignment.

- **TokenizationManager.tsx**  
  Orchestrates token creation, minting, and assignment for pools. Handles blockchain and Supabase integration.

---

## Token Distribution Suite

- **TokenDistributionManager.tsx**  
  Central controller for distributing tokens to investors. Handles allocation, validation, and progress tracking.

- **TokenDistributionDialogs.tsx**  
  Dialogs for confirming, editing, or viewing token distributions.

- **TokenDistributionTables.tsx**  
  Tables for viewing and editing token allocations.

- **TokenDistributionHelpers.tsx**  
  Helper functions for allocation calculations, validation, and formatting.

- **TokenDistributionHooks.ts**  
  Custom React hooks for managing allocation state and side effects.

- **TokenDistributionTypes.ts**  
  TypeScript types for all distribution-related data structures.

- **TokenDistributionUtils.ts**  
  Utility functions for distribution logic.

---

## Charts

- **charts/**  
  Contains analytic and visualization components:
  - `InvoiceMetricsChart.tsx`: Invoice KPIs over time.
  - `PoolValueChart.tsx`: Pool value evolution.
  - `TVLChart.tsx`: Total value locked.
  - `TokenAllocationChart.tsx`, `TokenDistributionChart.tsx`: Allocation/distribution breakdowns.

---

## Types

- **types.ts**  
  Centralizes all form, table, and API types for pools, invoices, and tokens. Ensures type safety across forms, ingestion, and distribution.

---

## Utilities

- **utils/**  
  - `auditLogger.ts`: Tracks user/system actions for compliance.
  - `formPersistence.ts`: Persists form state to local/session storage.
  - `performance.ts`: Performance measurement utilities.

---

## Additional Documentation

- `README-*.md` files:  
  These document specific enhancements, bug fixes, sorting, YTM (Yield to Maturity), and UI improvements. See each for historical context and migration notes.

---

## Developer Notes

- All components use Radix UI and shadcn/ui primitives for consistent UI/UX.
- Supabase is used for backend data operations.
- Types are strictly enforced for all forms and API interactions.
- Extend charts and dialogs as new analytics or batch operations are required.
- See utility and type files for reusable logic and form schemas.

---

### Download Link

- [Download /src/components/factoring/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/factoring/READMEnew.md)
- [Download /memory-bank/components/factoring/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/factoring/READMEnew.md)

