# `/src/components/reports` — READMEnew.md

This folder contains React components for generating, displaying, and exporting platform-level reports. These reports cover project status, investor metrics, and compliance summaries, providing insights for administrators and compliance officers.

---

## Files

### ReportsDashboard.tsx
- **Purpose:**  
  Central dashboard for visualizing key metrics across projects, investors, and compliance.
- **Features:**  
  - Fetches project and investor data from Supabase via service layer.
  - Calculates and displays:
    - Project status distribution (active, draft, completed, archived)
    - Investor metrics (total investors, average investment, KYC completion)
    - Compliance metrics (approved, pending, failed, and percentages)
  - Renders charts and summary cards using Radix UI/shadcn/ui primitives.
  - Displays compliance alerts (e.g., expiring KYC, failed verification).
  - Provides a button to generate compliance reports.
  - Handles loading and error states with toasts and UI feedback.
- **Dependencies:**  
  - `@/services/project/projectService` for projects
  - `@/services/investor/investors` for investors
  - `@/components/ui` for all UI elements
  - `lucide-react` for icons
- **Usage:**  
  Used by admin/compliance users to monitor platform health and generate reports.

### README.md
- Legacy or less-detailed documentation. Superseded by this READMEnew.md.

---

## Developer Notes
- Extend the dashboard with new metrics or charts as business needs evolve.
- Ensure all data fetching is secure and paginated for performance.
- All UI follows Radix UI/shadcn/ui conventions for consistency and accessibility.
- Use the provided service layer for all data access; do not query Supabase directly in components.

---

### Download Link
- [Download /src/components/reports/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/reports/READMEnew.md)
- [Download /memory-bank/components/reports/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/reports/READMEnew.md)
