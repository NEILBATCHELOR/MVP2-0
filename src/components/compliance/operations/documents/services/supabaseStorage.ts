import { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentType, FileObject } from '@/types/core/database';

export interface StorageConfig {
  bucketName: string;
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
}

export class SupabaseStorageService {
  private readonly defaultConfig: StorageConfig = {
    bucketName: 'issuer-documents',
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  };

  constructor(
    private supabase: SupabaseClient,
    private config: Partial<StorageConfig> = {}
  ) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Initialize storage bucket if it doesn't exist
   */
  async initializeBucket(isPublic: boolean = false): Promise<void> {
    const { data: buckets } = await this.supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === this.config.bucketName);

    if (!bucketExists) {
      const { error } = await this.supabase.storage.createBucket(
        this.config.bucketName,
        {
          public: isPublic,
          fileSizeLimit: this.config.maxSizeBytes,
          allowedMimeTypes: this.config.allowedMimeTypes
        }
      );
      if (error) throw error;
    }
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(
    file: File,
    path: string,
    options: {
      upsert?: boolean;
      cacheControl?: string;
    } = {}
  ): Promise<any> {
    await this.validateFile(file);

    const { data, error } = await this.supabase.storage
      .from(this.config.bucketName)
      .upload(path, file, {
        cacheControl: options.cacheControl || '3600',
        upsert: options.upsert || false,
      });

    if (error) throw error;
    return data;
  }

  /**
   * Download a file from storage
   */
  async downloadFile(path: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from(this.config.bucketName)
      .download(path);

    if (error) throw error;
    return data;
  }

  /**
   * Get a public URL for a file
   */
  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(this.config.bucketName)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Get a signed URL for temporary access
   */
  async getSignedUrl(
    path: string, 
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.config.bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }

  /**
   * List files in a directory
   */
  async listFiles(
    path?: string,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: string };
    } = {}
  ): Promise<FileObject[]> {
    const { data, error } = await this.supabase.storage
      .from(this.config.bucketName)
      .list(path, {
        limit: options.limit,
        offset: options.offset,
        sortBy: options.sortBy
      });

    if (error) throw error;
    return data;
  }

  /**
   * Move/rename a file
   */
  async moveFile(
    fromPath: string,
    toPath: string
  ): Promise<any> {
    const { data, error } = await this.supabase.storage
      .from(this.config.bucketName)
      .move(fromPath, toPath);

    if (error) throw error;
    return data;
  }

  /**
   * Copy a file
   */
  async copyFile(
    fromPath: string,
    toPath: string
  ): Promise<any> {
    const { data, error } = await this.supabase.storage
      .from(this.config.bucketName)
      .copy(fromPath, toPath);

    if (error) throw error;
    return data;
  }

  /**
   * Delete files
   */
  async deleteFiles(paths: string[]): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.config.bucketName)
      .remove(paths);

    if (error) throw error;
  }

  /**
   * Generate a path for a document
   */
  generatePath(
    fileName: string,
    documentType: DocumentType,
    issuerId: string
  ): string {
    const timestamp = new Date().getTime();
    const extension = fileName.split('.').pop();
    const uuid = crypto.randomUUID();
    return `${issuerId}/${documentType}/${timestamp}-${uuid}.${extension}`;
  }

  private async validateFile(file: File): Promise<void> {
    if (
      this.config.maxSizeBytes && 
      file.size > this.config.maxSizeBytes
    ) {
      throw new Error(
        `File size exceeds maximum allowed size of ${this.config.maxSizeBytes} bytes`
      );
    }

    if (
      this.config.allowedMimeTypes &&
      !this.config.allowedMimeTypes.includes(file.type)
    ) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
  }
}