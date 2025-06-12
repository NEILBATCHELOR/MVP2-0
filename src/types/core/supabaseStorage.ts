/**
 * Supabase Storage Types
 * Types for Supabase Storage API operations
 */

export interface StorageFileApi {
  upload(
    path: string,
    fileBody: ArrayBuffer | ArrayBufferView | Blob | File | FormData | ReadableStream | URLSearchParams | string,
    fileOptions?: FileOptions
  ): Promise<{ data: FileObject | null; error: StorageError | null }>
  
  download(path: string): Promise<{ data: Blob | null; error: StorageError | null }>
  
  remove(paths: string[]): Promise<{ data: FileObject[] | null; error: StorageError | null }>
  
  update(
    path: string,
    fileBody: ArrayBuffer | ArrayBufferView | Blob | File | FormData | ReadableStream | URLSearchParams | string,
    fileOptions?: FileOptions
  ): Promise<{ data: FileObject | null; error: StorageError | null }>
  
  list(path?: string, options?: SearchOptions): Promise<{ data: FileObject[] | null; error: StorageError | null }>
  
  move(fromPath: string, toPath: string): Promise<{ data: { message: string } | null; error: StorageError | null }>
  
  copy(fromPath: string, toPath: string): Promise<{ data: { path: string } | null; error: StorageError | null }>
  
  createSignedUrl(path: string, expiresIn: number): Promise<{ data: { signedUrl: string } | null; error: StorageError | null }>
  
  createSignedUrls(paths: string[], expiresIn: number): Promise<{ data: SignedUrlObject[] | null; error: StorageError | null }>
  
  getPublicUrl(path: string): { data: { publicUrl: string } }
}

export interface FileObject {
  name: string
  bucket_id?: string
  owner?: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: Record<string, any>
  buckets?: Bucket
}

export interface FileOptions {
  cacheControl?: string
  contentType?: string
  upsert?: boolean
  duplex?: string
}

export interface SearchOptions {
  limit?: number
  offset?: number
  sortBy?: {
    column: 'name' | 'updated_at' | 'created_at' | 'last_accessed_at'
    order: 'asc' | 'desc'
  }
}

export interface SignedUrlObject {
  error: string | null
  path: string | null
  signedUrl: string
}

export interface Bucket {
  id: string
  name: string
  owner?: string
  created_at?: string
  updated_at?: string
  public?: boolean
  avif_autodetection?: boolean
  file_size_limit?: number
  allowed_mime_types?: string[]
}

export interface StorageError {
  message: string
  statusCode?: string
}

export interface UploadResponse {
  data: FileObject | null
  error: StorageError | null
}

export interface DownloadResponse {
  data: Blob | null
  error: StorageError | null
}

export interface RemoveResponse {
  data: FileObject[] | null
  error: StorageError | null
}

export interface ListResponse {
  data: FileObject[] | null
  error: StorageError | null
}

export interface SignedUrlResponse {
  data: { signedUrl: string } | null
  error: StorageError | null
}

export interface PublicUrlResponse {
  data: { publicUrl: string }
}

// Document storage specific types
export interface DocumentStorageMetadata {
  documentId: string
  documentType: string
  uploadedBy: string
  uploadedAt: string
  fileSize: number
  mimeType: string
  originalName: string
  checksum?: string
  version?: number
  isPublic?: boolean
  expiresAt?: string
}

export interface PreviewOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'png' | 'jpg' | 'jpeg' | 'webp'
}

export interface ThumbnailOptions {
  size: number
  quality?: number
  format?: 'png' | 'jpg' | 'jpeg' | 'webp'
}

// Storage service configuration
export interface StorageConfig {
  bucketName: string
  maxFileSize: number
  allowedMimeTypes: string[]
  autoOptimize: boolean
  generateThumbnails: boolean
}

/**
 * Supabase Storage Service Implementation
 */
export class SupabaseStorageService {
  private client: any;
  private bucketName: string;

  constructor(supabaseClient: any, bucketName: string = 'documents') {
    this.client = supabaseClient;
    this.bucketName = bucketName;
  }

  /**
   * Initialize the storage bucket
   */
  async initializeBucket(isPublic: boolean = false): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets } = await this.client.storage.listBuckets();
      const bucketExists = buckets?.some((bucket: any) => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        await this.client.storage.createBucket(this.bucketName, {
          public: isPublic,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB
          allowedMimeTypes: ['image/*', 'application/pdf', 'text/*']
        });
      }
    } catch (error) {
      console.error('Failed to initialize bucket:', error);
      throw error;
    }
  }

  /**
   * Generate a file path
   */
  generatePath(fileName: string, documentType: string, issuerId: string): string {
    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
    return `${issuerId}/${documentType}/${timestamp}_${baseName}.${extension}`;
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(file: File, filePath: string, options: FileOptions = {}): Promise<UploadResponse> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .upload(filePath, file, options);
        
      return { data, error };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(filePath: string): string {
    const { data } = this.client.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * Get signed URL for a file
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);
    
    if (error) throw error;
    return data.signedUrl;
  }

  /**
   * Delete files from storage
   */
  async deleteFiles(filePaths: string[]): Promise<RemoveResponse> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .remove(filePaths);
        
      return { data, error };
    } catch (error) {
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string = '', options: SearchOptions = {}): Promise<ListResponse> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .list(path, options);
        
      return { data, error };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download a file
   */
  async downloadFile(filePath: string): Promise<DownloadResponse> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .download(filePath);
        
      return { data, error };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Move a file
   */
  async moveFile(fromPath: string, toPath: string): Promise<{ data: { message: string } | null; error: StorageError | null }> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .move(fromPath, toPath);
        
      return { data, error };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Copy a file
   */
  async copyFile(fromPath: string, toPath: string): Promise<{ data: { path: string } | null; error: StorageError | null }> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .copy(fromPath, toPath);
        
      return { data, error };
    } catch (error) {
      throw error;
    }
  }
}
