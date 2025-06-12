# Project Yield and Duration Feature Implementation

## Overview
This update adds two new fields to projects:
1. **Estimated Yield Percentage**: A numeric field representing the expected yield percentage for the project
2. **Duration**: An enum field indicating the time period of the project (1, 3, 6, 9, 12, or >12 months)

## Implementation Details

### Database Changes
The SQL migration script `migration_project_yield_duration.sql` includes:
- Addition of a numeric column `estimated_yield_percentage` to the projects table
- Creation of a new enum type `project_duration` with values:
  - 1_month
  - 3_months
  - 6_months
  - 9_months
  - 12_months
  - over_12_months
- Addition of a new column `duration` using the enum type
- Updated RLS policy for the new columns
- Documentation comments for both columns

### TypeScript Type Updates
Updated the following type definitions:
- Added `estimatedYieldPercentage` and `duration` fields to the `Project` interface
- Created a new enum `ProjectDuration` to define possible duration values
- Updated the `ProjectUI` interface to include the new fields
- Updated the `ProjectFormValues` type for form handling

### UI Component Updates
1. **ProjectCard.tsx**:
   - Updated to display the estimated yield percentage and duration
   - Added appropriate icons and formatting

2. **ProjectDialog.tsx**:
   - Added form fields for estimated yield percentage and duration in the Financial Details tab
   - The estimated yield is a numeric input with step 0.1
   - The duration field is a dropdown with the enum values

3. **ProjectDetailsPage.tsx**:
   - Added display of the new fields in the project details section

## Usage
1. After applying the database migration, users can set the estimated yield percentage and duration when creating or editing a project
2. The values will be displayed on the project card and detail pages
3. The project list will now show this information for each project

## How to Apply
1. Run the SQL migration script `migration_project_yield_duration.sql` on your Supabase database
2. Update the generated supabase.ts file with the new types
3. Deploy the code changes

## Completed Tasks
- [x] Created SQL migration script
- [x] Updated Project and ProjectUI interfaces
- [x] Added ProjectDuration enum
- [x] Updated ProjectDialog form
- [x] Updated ProjectCard display
- [x] Updated ProjectDetailsPage display

## Remaining Tasks
- [ ] Apply the SQL migration to the database
- [ ] Update supabase.ts with the generated types
- [ ] Test the form validation and submission
- [ ] Add filtering capability by yield range and duration