# Investment Status and Document Visibility Features

This document explains the implementation of two new features:

1. **Project Investment Status** - A flag to indicate whether a project is "Open" or "Closed" for investment
2. **Document Visibility Control** - A flag to allow issuers to make documents publicly visible to investors in the Investor Portal

## Database Changes

A migration script `20240825000001_add_investment_status_and_document_visibility.sql` was created that adds:

1. An `investment_status` column to the `projects` table with options "Open" and "Closed" (default "Open")
2. An `is_public` boolean column to the `issuer_detail_documents` table to control investor visibility (default FALSE)
3. Updated RLS policies to ensure proper access control

## TypeScript Changes

The following TypeScript type files were updated:

1. **src/types/database.ts**
   - Added the `is_public` field to the `IssuerDetailDocumentTable` interface

2. **src/types/centralModels.ts**
   - Added the `InvestmentStatus` enum with "Open" and "Closed" options
   - Added the `investmentStatus` field to the `Project` interface
   - Added the `isPublic` field to the `IssuerDocument` interface

3. **src/utils/typeMappers.ts**
   - Updated mappers to include the new fields

## UI Changes

1. **src/components/projects/ProjectDialog.tsx**
   - Added a select dropdown for the investment status in the project creation/edit form
   - Updated form validation schema and default values

2. **src/lib/projects.ts**
   - Updated the `ProjectFormData` interface to include the `investmentStatus` field
   - Updated create and update functions to handle the new field

3. **src/components/documents/IssuerDocumentUpload.tsx**
   - Added a toggle switch for controlling document visibility to investors
   - Updated form schema and handlers to include the new field

4. **src/components/documents/IssuerDocumentList.tsx**
   - Added a "Visibility" column to the document tables to show public/private status
   - Updated the colSpans for loading and empty states

## Usage

### Setting Project Investment Status

When creating or editing a project, issuers can now set the investment status to either "Open" or "Closed". This value is stored in the `investment_status` column of the `projects` table.

### Controlling Document Visibility

When uploading documents, issuers can now toggle the "Investor Visibility" switch to make documents visible to investors in the Investor Portal. This setting is stored in the `is_public` column of the `issuer_detail_documents` table.

The document list shows a "Public" or "Private" badge to indicate the visibility status of each document.

## Security

Row-level security policies ensure that investors can only see documents marked as public, while issuers can see all documents for their projects.