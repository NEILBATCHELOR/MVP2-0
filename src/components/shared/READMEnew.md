# `/src/components/shared` — READMEnew.md

This folder contains shared, atomic UI components and utilities for use across the application. These components provide common UX patterns such as connection testing, country selection, loading and error states, and document checklists.

---

## Files

### ConnectionTest.tsx
- **Purpose:**  
  UI card to test the application's connection to Supabase, helping diagnose backend/API issues.
- **Features:**  
  - Executes a simple Supabase query and displays success/error.
  - Uses Radix UI/shadcn/ui primitives for card and alerts.
  - Useful for debugging 502 errors and platform health checks.

### CountrySelector.tsx
- **Purpose:**  
  Component for selecting a country from a dropdown (details not shown here).
- **Features:**  
  - Typically used in forms for address or KYC flows.
  - Integrates with shadcn/ui Select primitives.

### DocumentChecklist.tsx
- **Purpose:**  
  Renders a checklist of required or suggested documents (details not shown here).
- **Features:**  
  - Used in onboarding, compliance, or upload flows.

### EmptyState.tsx
- **Purpose:**  
  Displays a placeholder state when no data is available (details not shown here).
- **Features:**  
  - Used in dashboards, tables, or lists to improve UX.

### LoadingState.tsx
- **Purpose:**  
  Displays a loading spinner and optional message/title/description.
- **Features:**  
  - Uses Lucide icons for spinner.
  - Highly customizable for different loading scenarios.

### NoMockDataAlert.tsx
- **Purpose:**  
  Alert banner for when no mock/test data exists for a given entity.
- **Features:**  
  - Prompts user to create data if a callback is provided.
  - Used in development, onboarding, or demo environments.

---

## Subfolders

### ErrorBoundary/
- **Purpose:**  
  Contains error boundary component(s) for catching and displaying React errors (details not shown here).

### ErrorState/
- **Purpose:**  
  Contains components for rendering various error or empty states (details not shown here).

---

## Developer Notes

- All components use Radix UI and shadcn/ui primitives for consistency and accessibility.
- These shared components are intended for reuse across multiple domains and features.
- Extend with new atomic components as common UX needs arise.

---

### Download Link

- [Download /src/components/shared/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/shared/READMEnew.md)
- [Download /memory-bank/components/shared/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/shared/READMEnew.md)

