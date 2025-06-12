# Projects Components

## Overview
The Projects components handle project creation, management, listing, and visualization. These components form the project management foundation of the application.

## Components

### Core Project Components
- **ProjectsList.tsx**: Main component for displaying a list of projects with filtering and sorting capabilities.
- **ProjectCard.tsx**: Card component for displaying project summary information with links to Investors and Design sections.
- **ProjectDialog.tsx**: Dialog for creating and editing project information.
- **DeleteConfirmationDialog.tsx**: Confirmation dialog for project deletion.

## Features
- Project creation with name, description, status, project type, and token symbol
- Filtering projects by status and type
- Search functionality for finding specific projects
- Direct navigation to Investors and Token Design sections from project cards

## User Interface
- Project cards display key information including:
  - Project name and status
  - Project type and token symbol
  - Description
  - Investor count and total raised amount
  - Creation and update dates
- Actions for each project:
  - Edit and delete project
  - Navigate to Investors section
  - Navigate to Token Design section

## Dependencies
- React
- React Router
- UI component library (shadcn/ui)
- Form validation (React Hook Form & Zod)
- Project data services (Supabase)
- Lucide React (for icons)

## Optimizations

The Projects component has been optimized to reduce database load and prevent timeout errors:

1. **Batch Queries**: Instead of making individual queries for each project's stats, we now fetch all subscriptions in a single query and process them client-side.

2. **Efficient Updates**: When editing a project, we now only send changed fields to the database, reducing the payload size and processing time.

3. **Database Functions**: 
   - `create_project_with_cap_table`: Creates a project and its associated cap table in a single transaction
   - `delete_project_cascade`: Deletes a project and all its related data in a single atomic operation

4. **Fallback Mechanisms**: If the optimized database functions aren't available, the code falls back to the traditional approach automatically.

5. **SQL Migrations**: The repository contains migration scripts to add these database functions:
   - `migration_create_project_with_cap_table.sql`
   - `migration_delete_project_cascade.sql`

## Usage

Use the component as follows:

```jsx
<ProjectsList 
  onViewProject={handleViewProject}
  onManageSubscription={handleManageSubscription}
/>
```