# `/src/components/projects` — READMEnew.md

This folder contains all components, dialogs, and utilities for project management, including project creation, editing, deletion, detail views, and project lists. Intended for developers implementing or maintaining token issuance project workflows and admin/project-owner UIs.

---

## File-by-File Breakdown

### Project Management
- **ProjectsList.tsx**
  - Main list and management UI for all projects.
  - Features:
    - Fetches and displays all projects with search, filter, and sort capabilities.
    - Integrates with `ProjectDialog` for add/edit, and `DeleteConfirmationDialog` for deletion.
    - Handles project selection, dialog state, and CRUD logic.
    - Responsive design with Radix UI/shadcn/ui components.
  - Dependencies: `ProjectDialog`, `DeleteConfirmationDialog`, `@/components/ui`, `lucide-react`.

- **ProjectDialog.tsx**
  - Dialog for creating or editing a project.
  - Features:
    - Form for project details: name, type, status, description, etc.
    - Validates input, supports default values for editing.
    - Calls submit handler for add/edit logic.
  - Dependencies: `@/components/ui/dialog`, `@/components/ui/input`, `@/components/ui/button`.

- **DeleteConfirmationDialog.tsx**
  - Dialog for confirming project deletion.
  - Features:
    - Shows warning, item name/type, and disables confirm button while processing.
    - Calls `onConfirm` handler for deletion logic.
  - Dependencies: `@/components/ui/alert-dialog`, `lucide-react`.

### Project Details & Cards
- **ProjectCard.tsx**
  - Card UI for displaying a single project's summary.
  - Features:
    - Shows project name, status, type, and key metrics.
    - Used in project lists and dashboards.
  - Dependencies: `@/components/ui/card`, `lucide-react`.

- **ProjectDetail.tsx**
  - Component for displaying full details of a single project.
  - Features:
    - Shows all project fields, compliance status, and related actions.
    - Integrates with edit/delete dialogs.
  - Dependencies: `@/components/ui`, `lucide-react`.

- **ProjectDetailsPage.tsx**
  - Page wrapper for project details, including navigation, tabs, and related resources.
  - Features:
    - Renders `ProjectDetail` and related sections (investors, allocations, compliance, etc).
    - Handles routing and tab state.
  - Dependencies: `react-router-dom`, `ProjectDetail`, `@/components/ui/tabs`.

### Legacy & Supporting Files
- **ProjectsList.tsx.bak**
  - Backup or legacy version of `ProjectsList.tsx` (not used in production).
- **README.md**
  - Legacy documentation (superseded by this READMEnew.md).
- **README_project_yield_duration.md**
  - Documentation on project yield/duration logic (reference only).
- **READMEnew.md**
  - This file.

---

## Usage
- Use these components to build project management UIs for admins and project owners.
- Integrate with token issuance, compliance, and investor management modules as needed.
- Extend dialogs and detail pages for new project fields or workflows.

## Developer Notes
- All UI follows Radix UI/shadcn/ui conventions for accessibility and consistency.
- Always use dialogs for destructive actions (delete, edit) with confirmation.
- Ensure project CRUD operations are secure and validated.
- Remove or archive `.bak` files as the codebase is refactored.

---

### Download Link
- [Download /src/components/projects/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/projects/READMEnew.md)
