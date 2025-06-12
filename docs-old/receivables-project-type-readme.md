# Receivables Project Type

This document outlines the addition of "Receivables" as a project type in the system.

## Changes Made

1. Added "RECEIVABLES" to the `ProjectType` enum in `src/types/centralModels.ts`
2. Added "Receivables" as an option in the project type dropdown in `src/components/projects/ProjectDialog.tsx`
3. Updated the `getCapTableProjectType` function in `src/components/home.tsx` to handle the new RECEIVABLES type

## Usage

### Creating a Receivables Project

1. Navigate to the Projects page
2. Click "Create New Project"
3. In the Project Type dropdown, select "Receivables"
4. Fill in the rest of the project details
5. Click "Create Project"

### Editing a Project to be Receivables Type

1. Navigate to the Projects page
2. Find the project you want to edit
3. Click the "Edit" button
4. In the Project Type dropdown, select "Receivables"
5. Click "Save" to update the project

## Implementation Details

- The RECEIVABLES enum value is mapped to "receivables" string in the database
- In the CapTableView, receivables projects are treated as hybrid projects for compatibility
- The UI displays "Receivables" in the project type dropdown and on project details pages

## Next Steps

Potential future enhancements for Receivables projects:

1. Create specialized views for Receivables projects with relevant fields and metrics
2. Add receivables-specific reporting capabilities
3. Implement custom document templates for Receivables projects
4. Develop receivables-specific workflow automations 