import { DocumentType } from '@/types/core/database';

export interface FileTypeConfig {
  mimeTypes: string[];
  maxSize: number;
  allowedExtensions: string[];
  transformations: TransformationOptions[];
  previewOptions: PreviewOptions;
}

export type ResizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
};

export type CompressOptions = {
  quality: 'low' | 'medium' | 'high';
};

export type ConvertOptions = {
  format: string;
};

export type WatermarkOptions = {
  text: string;
  opacity?: number;
};

export type RotateOptions = {
  angle: number;
};

export type CropOptions = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type TransformationOptions = {
  type: 'resize' | 'compress' | 'convert' | 'watermark' | 'rotate' | 'crop';
  options: ResizeOptions | CompressOptions | ConvertOptions | WatermarkOptions | RotateOptions | CropOptions;
};

export interface PreviewOptions {
  generateThumbnail: boolean;
  thumbnailSize?: { width: number; height: number };
  previewSize?: { width: number; height: number };
  allowFullscreen?: boolean;
  showMetadata?: boolean;
}

// Define file type configurations for each document type
export const documentTypeConfigs: Record<DocumentType, FileTypeConfig> = {
  commercial_register: {
    mimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.doc', '.docx'],
    transformations: [
      { type: 'compress', options: { quality: 'high' } },
      { type: 'convert', options: { format: 'pdf' } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  },
  certificate_incorporation: {
    mimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ],
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.tiff'],
    transformations: [
      { type: 'compress', options: { quality: 'high' } },
      { type: 'convert', options: { format: 'pdf' } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  },
  memorandum_articles: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    transformations: [
      { type: 'convert', options: { format: 'pdf' } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  },
  director_list: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    transformations: [
      { type: 'convert', options: { format: 'pdf' } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  },
  shareholder_register: {
    mimeTypes: [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedExtensions: ['.pdf', '.xls', '.xlsx'],
    transformations: [
      { type: 'convert', options: { format: 'pdf' } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  },
  financial_statements: {
    mimeTypes: [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxSize: 30 * 1024 * 1024, // 30MB
    allowedExtensions: ['.pdf', '.xls', '.xlsx'],
    transformations: [
      { type: 'convert', options: { format: 'pdf' } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  },
  regulatory_status: {
    mimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    transformations: [
      { type: 'compress', options: { quality: 'high' } },
      { type: 'convert', options: { format: 'pdf' } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  },
  qualification_summary: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    transformations: [
      { type: 'convert', options: { format: 'pdf' } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  },
  business_description: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    transformations: [
      { type: 'convert', options: { format: 'pdf' } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  },
  organizational_chart: {
    mimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'application/vnd.visio',
      'application/vnd.ms-visio.drawing'
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.svg', '.vsd', '.vsdx'],
    transformations: [
      { type: 'convert', options: { format: 'pdf' } },
      { type: 'resize', options: { maxWidth: 2000, maxHeight: 2000 } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  },
  key_people_cv: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    transformations: [
      { type: 'convert', options: { format: 'pdf' } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  },
  aml_kyc_description: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    transformations: [
      { type: 'convert', options: { format: 'pdf' } }
    ],
    previewOptions: {
      generateThumbnail: true,
      thumbnailSize: { width: 200, height: 200 },
      previewSize: { width: 800, height: 1200 },
      allowFullscreen: true,
      showMetadata: true
    }
  }
};