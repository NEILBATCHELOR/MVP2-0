// Database types - primary source for core database types
export * from './database';

// Supabase storage types - explicit exports to avoid conflicts with database types
export {
  SupabaseStorageService,
  type StorageFileApi,
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
} from './supabaseStorage';

// FileObject from storage (aliased to avoid conflict with database FileObject)
export type { FileObject as StorageFileObject } from './supabaseStorage';

// Supabase core types
export type { Database, Tables as SupabaseTables, TablesInsert, TablesUpdate } from './supabase';