import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { FilePreview } from './FilePreview';
import type { DocumentType } from '@/types/core/database';
import { documentTypeConfigs } from '../services/fileTypes';
import { toast } from 'react-hot-toast';

interface FileManagerProps {
  documentType: DocumentType;
  onFileChange?: (file: File | null) => void;
  initialFile?: { url: string; mimeType: string };
  className?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({
  documentType,
  onFileChange,
  initialFile,
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileTypeConfig = documentTypeConfigs[documentType];

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    onFileChange?.(file);
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <FileUpload
        fileTypeConfig={fileTypeConfig}
        onFileSelect={handleFileSelect}
        onError={handleError}
      />
      
      {(selectedFile || initialFile) && (
        <FilePreview
          file={selectedFile || initialFile!}
          previewOptions={fileTypeConfig.previewOptions}
          className="mt-4"
        />
      )}
    </div>
  );
};