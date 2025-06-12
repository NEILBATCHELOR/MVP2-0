# Document Operations Services

This directory contains services related to document operations.

## Services

- `documentVerificationService.ts` - Document verification workflow
- `documentStorage.ts` - Document storage management
- `fileTransformationService.ts` - File transformation operations
- `filePreviewService.ts` - File preview generation
- `batchUploadService.ts` - Batch document upload handling
- `thumbnailService.ts` - Thumbnail generation
- `supabaseStorage.ts` - Supabase storage integration
- `fileTypes.ts` - Document type definitions

## Usage

Import services using:
```typescript
import { 
  documentVerificationService,
  documentStorage,
  // ... other services
} from '@/operations/documents/services';
```