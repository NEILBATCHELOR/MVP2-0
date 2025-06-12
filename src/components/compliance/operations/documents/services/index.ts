// Services
export { DocumentVerificationService } from './documentVerificationService';
export { DocumentStorageService } from './documentStorage';
export { FileTransformationService } from './fileTransformationService';
export { FilePreviewService } from './filePreviewService';
export { BatchUploadService } from './batchUploadService';
export { ThumbnailService } from './thumbnailService';

// Types from services (using aliases to avoid conflicts)
export type { 
  PreviewOptions as FileServicePreviewOptions,
  PreviewResult 
} from './filePreviewService';

export type { 
  ThumbnailOptions as ServiceThumbnailOptions 
} from './thumbnailService';

// Storage service and types
export { 
  SupabaseStorageService,
  type StorageFileApi,
  type FileObject,
  type FileOptions,
  type SearchOptions,
  type SignedUrlObject,
  type Bucket,
  type StorageError,
  type UploadResponse,
  type DownloadResponse,
  type RemoveResponse,
  type ListResponse,
  type SignedUrlResponse,
  type PublicUrlResponse,
  type DocumentStorageMetadata,
  type PreviewOptions,
  type ThumbnailOptions,
  type StorageConfig
} from '@/types/core/supabaseStorage';

// File types
export type {
  FileTypeConfig,
  ResizeOptions,
  CompressOptions,
  ConvertOptions,
  WatermarkOptions, 
  RotateOptions,
  CropOptions,
  TransformationOptions
} from './fileTypes';

// Additional interfaces from other services
export type { UploadOptions, DocumentUploadResult } from './documentStorage';
export type { BatchUploadItem, BatchUploadProgress } from './batchUploadService';