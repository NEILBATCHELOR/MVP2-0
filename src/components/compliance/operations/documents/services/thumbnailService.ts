import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStorageService } from '@/types/core/supabaseStorage';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  format?: 'jpeg' | 'webp';
  quality?: number;
}

export class ThumbnailService {
  private storageService: SupabaseStorageService;
  private readonly THUMBNAIL_BUCKET = 'thumbnails';

  constructor(private supabase: SupabaseClient) {
    this.storageService = new SupabaseStorageService(supabase, this.THUMBNAIL_BUCKET);
  }

  /**
   * Initialize thumbnail storage
   */
  async initialize(): Promise<void> {
    await this.storageService.initializeBucket(true); // Public bucket for thumbnails
  }

  /**
   * Generate thumbnail for a file
   */
  async generateThumbnail(
    filePath: string,
    options: ThumbnailOptions = {}
  ): Promise<string> {
    const {
      width = 200,
      height = 200,
      quality = 80
    } = options;

    // Get the transform URL from Supabase Storage API
    // Note: format must be 'origin' to match the Supabase types
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.THUMBNAIL_BUCKET)
      .getPublicUrl(filePath, {
        transform: {
          width,
          height,
          format: 'origin',
          quality
        }
      });

    return publicUrl;
  }

  /**
   * Generate PDF preview thumbnail
   */
  async generatePDFThumbnail(
    filePath: string,
    options: ThumbnailOptions = {}
  ): Promise<string> {
    // Since Supabase doesn't support page parameter in transforms,
    // we'll get the standard URL and handle page selection client-side
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.THUMBNAIL_BUCKET)
      .getPublicUrl(filePath, {
        transform: {
          width: options.width,
          height: options.height,
          format: 'origin',
          quality: options.quality
        }
      });

    // Add page parameter as a URL fragment, client must handle it
    return `${publicUrl}#page=1`;
  }

  /**
   * Clean up old thumbnails
   */
  async cleanupThumbnails(olderThanDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data: files } = await this.supabase.storage
      .from(this.THUMBNAIL_BUCKET)
      .list();

    if (!files) return;

    const oldFiles = files.filter(file => 
      new Date(file.created_at) < cutoffDate
    );

    if (oldFiles.length > 0) {
      await this.storageService.deleteFiles(
        oldFiles.map(file => file.name)
      );
    }
  }
}