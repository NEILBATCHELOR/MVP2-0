import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { FileTypeConfig } from '../services/fileTypes';
import { FileTransformationService } from '../services/fileTransformationService';

interface FileUploadProps {
  fileTypeConfig: FileTypeConfig;
  onFileSelect: (file: File) => void;
  onError: (error: string) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  fileTypeConfig,
  onFileSelect,
  onError,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!fileTypeConfig.mimeTypes.includes(file.type)) {
      return 'File type not supported';
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!fileTypeConfig.allowedExtensions.includes(extension)) {
      return 'File extension not supported';
    }

    if (file.size > fileTypeConfig.maxSize) {
      return `File size exceeds maximum limit of ${fileTypeConfig.maxSize / 1024 / 1024}MB`;
    }

    return null;
  };

  const processFile = async (file: File): Promise<File> => {
    const transformationService = FileTransformationService.getInstance();
    const buffer = await file.arrayBuffer();
    
    const transformedBuffer = await transformationService.applyTransformations(
      Buffer.from(buffer),
      file.type,
      fileTypeConfig.transformations
    );

    return new File([transformedBuffer], file.name, { type: file.type });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const error = validateFile(file);

    if (error) {
      onError(error);
      return;
    }

    setIsProcessing(true);
    try {
      const processedFile = await processFile(file);
      setSelectedFile(processedFile);
      onFileSelect(processedFile);
    } catch (err) {
      onError('Error processing file');
      console.error('File processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [fileTypeConfig, onFileSelect, onError]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    accept: fileTypeConfig.mimeTypes.reduce((acc, type) => {
      acc[type] = fileTypeConfig.allowedExtensions;
      return acc;
    }, {} as Record<string, string[]>),
    multiple: false
  });

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className={`${className}`}>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-6 
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${selectedFile ? 'bg-gray-50' : 'bg-white'}
          transition-colors duration-150 ease-in-out`}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Processing file...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex items-start space-x-3">
            <DocumentIcon className="h-8 w-8 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4 flex text-sm text-gray-600">
              <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                <span>Upload a file</span>
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {fileTypeConfig.allowedExtensions.join(', ')} up to{' '}
              {fileTypeConfig.maxSize / 1024 / 1024}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};