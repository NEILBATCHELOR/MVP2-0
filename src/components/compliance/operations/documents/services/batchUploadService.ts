import { SupabaseClient } from '@supabase/supabase-js';
import { DocumentType } from '@/types/core/database';
import { DocumentStorageService, DocumentUploadResult, UploadOptions } from '@/components/compliance/issuer/services/documentStorage';

export interface BatchUploadOptions extends UploadOptions {
  concurrentUploads?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface BatchUploadItem {
  file: File;
  documentType: DocumentType;
  metadata?: Record<string, any>;
}

export interface BatchUploadProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  results: Array<{
    file: File;
    status: 'completed' | 'failed' | 'pending';
    result?: DocumentUploadResult;
    error?: Error;
  }>;
}

export class BatchUploadService {
  private documentStorage: DocumentStorageService;

  constructor(private supabase: SupabaseClient) {
    this.documentStorage = new DocumentStorageService(supabase);
  }

  /**
   * Upload multiple documents in batch
   */
  async uploadBatch(
    issuerId: string,
    items: BatchUploadItem[],
    options: BatchUploadOptions = {},
    onProgress?: (progress: BatchUploadProgress) => void
  ): Promise<BatchUploadProgress> {
    const {
      concurrentUploads = 3,
      retryAttempts = 3,
      retryDelay = 1000,
      ...uploadOptions
    } = options;

    const progress: BatchUploadProgress = {
      total: items.length,
      completed: 0,
      failed: 0,
      inProgress: 0,
      results: items.map(item => ({
        file: item.file,
        status: 'pending'
      }))
    };

    // Create upload chunks based on concurrentUploads
    const chunks = this.chunkArray(items, concurrentUploads);

    for (const chunk of chunks) {
      // Process each chunk concurrently
      const chunkPromises = chunk.map(async (item, index) => {
        const resultIndex = chunks.indexOf(chunk) * concurrentUploads + index;
        progress.inProgress++;
        this.updateProgress(progress, onProgress);

        try {
          // Attempt upload with retries
          const result = await this.uploadWithRetry(
            item,
            issuerId,
            uploadOptions,
            retryAttempts,
            retryDelay
          );

          progress.completed++;
          progress.inProgress--;
          progress.results[resultIndex] = {
            file: item.file,
            status: 'completed',
            result
          };
        } catch (error) {
          progress.failed++;
          progress.inProgress--;
          progress.results[resultIndex] = {
            file: item.file,
            status: 'failed',
            error: error instanceof Error ? error : new Error(String(error))
          };
        }

        this.updateProgress(progress, onProgress);
      });

      // Wait for current chunk to complete before processing next chunk
      await Promise.all(chunkPromises);
    }

    return progress;
  }

  /**
   * Upload a single item with retry logic
   */
  private async uploadWithRetry(
    item: BatchUploadItem,
    issuerId: string,
    options: UploadOptions,
    retryAttempts: number,
    retryDelay: number
  ): Promise<DocumentUploadResult> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        return await this.documentStorage.uploadDocument(
          item.file,
          item.documentType,
          issuerId,
          {
            ...options,
            metadata: {
              ...options.metadata,
              ...item.metadata,
              uploadAttempt: attempt + 1
            }
          }
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < retryAttempts - 1) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }
      }
    }

    throw lastError || new Error('Upload failed after retries');
  }

  /**
   * Validate all files in a batch
   */
  async validateBatch(
    items: BatchUploadItem[],
    options: UploadOptions = {}
  ): Promise<void> {
    const errors: Error[] = [];

    for (const item of items) {
      try {
        await this.documentStorage['validateFile'](item.file, options);
      } catch (error) {
        errors.push(error instanceof Error 
          ? error 
          : new Error(`Validation failed for ${item.file.name}`)
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(
        'Batch validation failed:\n' + 
        errors.map(e => e.message).join('\n')
      );
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private updateProgress(
    progress: BatchUploadProgress,
    callback?: (progress: BatchUploadProgress) => void
  ): void {
    if (callback) {
      callback({ ...progress });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}