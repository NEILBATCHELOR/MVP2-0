# `/src/components/documents` — READMEnew.md

This folder contains React components for managing and uploading issuer documents within the platform. These components are used in issuer onboarding, compliance, and project management workflows.

---

## Files

### DocumentUploadManager.tsx
- **Purpose:**  
  Provides a complete UI and logic for managing issuer document uploads for a given project.
- **Features:**  
  - Lists all documents for a project, showing type, name, upload date, and status.
  - Allows uploading new documents (with type selection, file input, and metadata).
  - Supports downloading, deleting, and replacing documents.
  - Shows upload progress, error handling, and user feedback via toast notifications.
  - Integrates with Supabase for storage and metadata.
  - Uses Radix UI/shadcn/ui for all UI primitives (Dialog, Table, Badge, etc).
- **Props:**  
  - `projectId` (string): The ID of the project for which to manage documents.
  - `showTitle` (boolean, optional): Whether to display the title header.
- **Dependencies:**  
  - `@/infrastructure/supabase` for backend.
  - `@/types/centralModels` for document type enums.
  - UI primitives from `@/components/ui`.
  - `date-fns` for formatting.
- **Usage:**  
  Used in issuer onboarding, compliance, and project management pages.

---

### IssuerDocumentList.tsx
- **Purpose:**  
  Displays a list of uploaded documents for an issuer or project.
- **Features:**  
  - Renders document metadata in a table or list format.
  - Provides download links and status indicators.
  - Used as a read-only view for compliance and reporting.

---

### IssuerDocumentUpload.tsx
- **Purpose:**  
  Provides a reusable upload form for different issuer document types.
- **Features:**  
  - Accepts props for document type, title, and description.
  - Handles file selection, validation, and upload via Supabase.
  - Displays upload progress and error messages.
  - Exports specialized wrappers for each document type (e.g., ProspectusUpload, FinancialHighlightsUpload).
- **Dependencies:**  
  - `@/types/centralModels` for document types.
  - UI primitives from `@/components/ui`.
- **Usage:**  
  Used by onboarding and compliance flows to upload specific document types with contextual titles and descriptions.

---

## Developer Notes

- All document upload and listing logic is centralized here for maintainability.
- Extend `IssuerDocumentUpload` for new document types as needed.
- Ensure Supabase storage rules and metadata schemas are kept in sync with usage here.
- UI follows Radix/shadcn/ui conventions for consistency and accessibility.

---

### Download Link

- [Download /src/components/documents/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/documents/READMEnew.md)
- [Download /memory-bank/components/documents/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/documents/READMEnew.md)
