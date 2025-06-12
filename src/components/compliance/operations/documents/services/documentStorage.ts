import { SupabaseClient } from '@supabase/supabase-js';
import { DocumentType, IssuerDocumentsTable } from '@/types/core/database';
import { SupabaseStorageService } from '@/types/core/supabaseStorage';
import { ThumbnailService } from './thumbnailService';
import { FilePreviewService, PreviewOptions, PreviewResult } from './filePreviewService';
import { BatchUploadService, BatchUploadItem, BatchUploadProgress } from './batchUploadService';

export interface UploadOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  generateThumbnail?: boolean;
  isPublic?: boolean;
  previewOptions?: {
    width?: number;
    height?: number;
    format?: 'webp' | 'jpeg';
    quality?: number;
  };
}

export interface DocumentUploadResult {
  document: IssuerDocumentsTable;
  publicUrl: string;
  thumbnailUrl?: string;
  preview?: PreviewResult;
}

export class DocumentStorageService {
  private storageService: SupabaseStorageService;
  private thumbnailService: ThumbnailService;
  private previewService: FilePreviewService;
  private batchService: BatchUploadService;

  constructor(private supabase: SupabaseClient) {
    this.storageService = new SupabaseStorageService(supabase);
    this.thumbnailService = new ThumbnailService(supabase);
    this.previewService = new FilePreviewService(supabase);
    this.batchService = new BatchUploadService(supabase);
  }

  /**
   * Initialize all required services
   */
  async initialize(options: { isPublic?: boolean } = {}): Promise<void> {
    const { isPublic = false } = options;
    
    // Initialize the storage bucket and permissions
    await this.storageService.initializeBucket(isPublic);
  }

  /**
   * Upload a document with preview and thumbnail
   */
  async uploadDocument(
    file: File,
    documentType: DocumentType,
    issuerId: string,
    options: UploadOptions = {}
  ): Promise<DocumentUploadResult> {
    // Generate file path
    const filePath = this.storageService.generatePath(
      file.name,
      documentType,
      issuerId
    );
    
    try {
      // Upload to storage
      await this.storageService.uploadFile(file, filePath, {
        cacheControl: '3600',
        upsert: false
      });

      // Get URL based on access type
      const fileUrl = options.isPublic
        ? this.storageService.getPublicUrl(filePath)
        : await this.storageService.getSignedUrl(filePath, 3600);

      // Generate thumbnail if needed
      let thumbnailUrl: string | undefined;
      if (options.generateThumbnail) {
        thumbnailUrl = await this.thumbnailService.generateThumbnail(
          filePath,
          options.previewOptions
        );
      }

      // Generate preview
      const preview = await this.previewService.generatePreview(filePath, {
        width: options.previewOptions?.width,
        height: options.previewOptions?.height
      });

      // Create database record
      const { data: document, error: dbError } = await this.supabase
        .from('issuer_documents')
        .insert({
          issuer_id: issuerId,
          document_type: documentType,
          file_url: filePath,
          status: 'pending',
          version: 1,
          metadata: {
            originalName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            thumbnailUrl,
            preview: preview.type !== 'other' ? preview : undefined,
            isPublic: options.isPublic
          },
          created_by: (await this.supabase.auth.getUser()).data.user?.id,
          updated_by: (await this.supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        document,
        publicUrl: fileUrl,
        thumbnailUrl,
        preview
      };
    } catch (error) {
      // Cleanup on failure
      await this.storageService.deleteFiles([filePath]);
      throw error;
    }
  }

  /**
   * Upload multiple documents in batch
   */
  async uploadBatch(
    issuerId: string,
    items: BatchUploadItem[],
    options: UploadOptions = {},
    onProgress?: (progress: BatchUploadProgress) => void
  ): Promise<BatchUploadProgress> {
    return this.batchService.uploadBatch(
      issuerId,
      items,
      options,
      onProgress
    );
  }

  /**
   * Update an existing document
   */
  async updateDocument(
    documentId: string,
    file: File,
    options: UploadOptions = {}
  ): Promise<DocumentUploadResult> {
    const { data: existingDoc, error: fetchError } = await this.supabase
      .from('issuer_documents')
      .select()
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!existingDoc) throw new Error('Document not found');

    // Upload new version
    const result = await this.uploadDocument(
      file,
      existingDoc.document_type,
      existingDoc.issuer_id,
      options
    );

    // Update version number and metadata
    const { error: updateError } = await this.supabase
      .from('issuer_documents')
      .update({
        version: existingDoc.version + 1,
        updated_by: (await this.supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) throw updateError;

    // Delete old file
    await this.storageService.deleteFiles([existingDoc.file_url]);

    return result;
  }

  /**
   * Delete a document and its associated files
   */
  async deleteDocument(documentId: string): Promise<void> {
    const { data: document, error: fetchError } = await this.supabase
      .from('issuer_documents')
      .select()
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!document) throw new Error('Document not found');

    // Delete all associated files
    const filesToDelete = [
      document.file_url,
      document.metadata?.thumbnailUrl,
      document.metadata?.preview?.url
    ].filter(Boolean) as string[];

    await this.storageService.deleteFiles(filesToDelete);

    // Delete database record
    const { error: dbError } = await this.supabase
      .from('issuer_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;
  }

  /**
   * Get download URL for a document
   */
  async getDownloadUrl(documentId: string): Promise<string> {
    const { data: document, error: fetchError } = await this.supabase
      .from('issuer_documents')
      .select()
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!document) throw new Error('Document not found');

    return document.metadata?.isPublic
      ? this.storageService.getPublicUrl(document.file_url)
      : await this.storageService.getSignedUrl(document.file_url, 3600);
  }

  /**
   * Get preview for a document
   */
  async getPreview(
    documentId: string,
    options: PreviewOptions = {}
  ): Promise<PreviewResult> {
    const { data: document, error: fetchError } = await this.supabase
      .from('issuer_documents')
      .select()
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!document) throw new Error('Document not found');

    return this.previewService.generatePreview(
      document.file_url,
      options
    );
  }
}