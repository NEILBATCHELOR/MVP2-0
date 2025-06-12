import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStorageService } from '@/types/core/supabaseStorage';
import { ThumbnailService } from './thumbnailService';

export interface PreviewOptions {
  maxPreviewSize?: number;
  preferredFormat?: 'pdf' | 'image' | 'text';
  page?: number;
  width?: number;
  height?: number;
}

export interface PreviewResult {
  type: 'image' | 'pdf' | 'text' | 'other';
  url?: string;
  content?: string;
  thumbnail?: string;
  metadata: {
    mimeType: string;
    size: number;
    pages?: number;
    width?: number;
    height?: number;
  };
}

export class FilePreviewService {
  private storageService: SupabaseStorageService;
  private thumbnailService: ThumbnailService;

  constructor(private supabase: SupabaseClient) {
    this.storageService = new SupabaseStorageService(supabase);
    this.thumbnailService = new ThumbnailService(supabase);
  }

  /**
   * Generate a preview for a file
   */
  async generatePreview(
    filePath: string,
    options: PreviewOptions = {}
  ): Promise<PreviewResult> {
    const {
      maxPreviewSize = 5 * 1024 * 1024, // 5MB
      preferredFormat,
      page = 1,
      width = 800,
      height = 600
    } = options;

    // Get file metadata
    const { data: fileData } = await this.supabase.storage
      .from(this.storageService['config'].bucketName)
      .download(filePath);

    if (!fileData) {
      throw new Error('File not found');
    }

    const mimeType = fileData.type;
    const size = fileData.size;

    // Generate preview based on file type
    if (this.isImage(mimeType)) {
      return this.handleImagePreview(filePath, {
        width,
        height,
        size,
        mimeType
      });
    }

    if (this.isPDF(mimeType)) {
      return this.handlePDFPreview(filePath, {
        page,
        width,
        height,
        size,
        mimeType
      });
    }

    if (this.isText(mimeType) && size <= maxPreviewSize) {
      return this.handleTextPreview(filePath, {
        size,
        mimeType
      });
    }

    // For other file types, just return metadata and thumbnail
    return this.handleOtherPreview(filePath, {
      size,
      mimeType
    });
  }

  /**
   * Handle image preview generation
   */
  private async handleImagePreview(
    filePath: string,
    metadata: { width: number; height: number; size: number; mimeType: string }
  ): Promise<PreviewResult> {
    // Use Supabase's image transformation API
    // Due to type constraints, we must use 'origin' as format, so we'll work around this
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.storageService['config'].bucketName)
      .getPublicUrl(filePath, {
        transform: {
          width: metadata.width,
          height: metadata.height,
          // Using allowed values only
          format: 'origin',
          quality: 80
        }
      });

    // Generate thumbnail
    const thumbnail = await this.thumbnailService.generateThumbnail(filePath);

    return {
      type: 'image',
      url: publicUrl,
      thumbnail,
      metadata: {
        mimeType: metadata.mimeType,
        size: metadata.size,
        width: metadata.width,
        height: metadata.height
      }
    };
  }

  /**
   * Handle PDF preview generation
   */
  private async handlePDFPreview(
    filePath: string,
    metadata: { 
      page: number;
      width: number;
      height: number;
      size: number;
      mimeType: string;
    }
  ): Promise<PreviewResult> {
    // Use Supabase's URL for PDF without transform since 'page' is not supported
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.storageService['config'].bucketName)
      .getPublicUrl(filePath);

    // Append a query parameter to indicate page (this would only work if backend supports it)
    const urlWithPage = `${publicUrl}#page=${metadata.page}`;

    // Generate thumbnail of first page
    const thumbnail = await this.thumbnailService.generatePDFThumbnail(filePath);

    return {
      type: 'pdf',
      url: urlWithPage,
      thumbnail,
      metadata: {
        mimeType: metadata.mimeType,
        size: metadata.size,
        pages: await this.getPDFPageCount(filePath)
      }
    };
  }

  /**
   * Handle text file preview
   */
  private async handleTextPreview(
    filePath: string,
    metadata: { size: number; mimeType: string }
  ): Promise<PreviewResult> {
    const { data } = await this.supabase.storage
      .from(this.storageService['config'].bucketName)
      .download(filePath);

    const content = await data.text();

    return {
      type: 'text',
      content,
      metadata: {
        mimeType: metadata.mimeType,
        size: metadata.size
      }
    };
  }

  /**
   * Handle preview for other file types
   */
  private async handleOtherPreview(
    filePath: string,
    metadata: { size: number; mimeType: string }
  ): Promise<PreviewResult> {
    // For non-previewable files, just return metadata
    return {
      type: 'other',
      metadata: {
        mimeType: metadata.mimeType,
        size: metadata.size
      }
    };
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private isPDF(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  private isText(mimeType: string): boolean {
    return mimeType.startsWith('text/') || 
           mimeType === 'application/json' ||
           mimeType === 'application/xml';
  }

  private async getPDFPageCount(filePath: string): Promise<number> {
    // This would typically use a PDF parsing library
    // For now, return a placeholder
    return 1;
  }
}