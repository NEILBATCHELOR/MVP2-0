import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { KycDocumentType } from '@/types/domain/compliance/compliance';

interface DocumentUploaderProps {
  investorId: string;
  documentType: KycDocumentType;
  allowedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  onUploadComplete: (result: {
    success: boolean;
    documentId?: string;
    fileUrl?: string;
    error?: string;
  }) => void;
  onError: (error: Error) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  investorId,
  documentType,
  allowedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  onUploadComplete,
  onError,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    documentId?: string;
    fileUrl?: string;
    error?: string;
  } | null>(null);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    setProgress(0);
    
    const file = acceptedFiles[0];
    
    // Validate file size
    if (file.size > maxFileSize) {
      setUploadResult({
        success: false,
        error: `File is too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB.`
      });
      setUploading(false);
      return;
    }
    
    try {
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('investorId', investorId);
      formData.append('documentType', documentType);
      
      // Set up XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });
      
      // Create a promise to handle the upload
      const uploadPromise = new Promise<{
        success: boolean;
        documentId?: string;
        fileUrl?: string;
        error?: string;
      }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({
                success: true,
                documentId: response.documentId,
                fileUrl: response.fileUrl
              });
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || 'Upload failed'));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };
        
        xhr.onabort = () => {
          reject(new Error('Upload aborted'));
        };
      });
      
      // Start the upload
      xhr.open('POST', '/api/compliance/document-upload', true);
      xhr.send(formData);
      
      // Wait for the upload to complete
      const result = await uploadPromise;
      
      setUploadResult(result);
      onUploadComplete(result);
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during upload'
      });
      onError(error instanceof Error ? error : new Error('Unknown error during upload'));
    } finally {
      setUploading(false);
    }
  }, [investorId, documentType, maxFileSize, onUploadComplete, onError]);
  
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: allowedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: 1,
  });
  
  const documentTypeTitle = documentType
    .replace('_', ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload {documentTypeTitle}</CardTitle>
        <CardDescription>
          Please upload a clear, unaltered copy of your document
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(!uploading && !uploadResult) && (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-10 w-10 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-sm">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Drag & drop or click to upload</p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: {allowedFileTypes.join(', ')} (Max size: {maxFileSize / (1024 * 1024)}MB)
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        
        {fileRejections.length > 0 && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {fileRejections[0].errors[0].message}
            </p>
          </div>
        )}
        
        {uploading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Spinner size="lg" />
            <div className="w-full space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">Uploading... {progress}%</p>
            </div>
          </div>
        )}
        
        {uploadResult && (
          <div className="flex flex-col items-center gap-4 py-8">
            {uploadResult.success ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div className="text-center">
                  <p className="text-lg font-medium">Upload Successful</p>
                  <p className="text-sm text-muted-foreground">
                    Your document has been uploaded and is being processed
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <div className="text-center">
                  <p className="text-lg font-medium">Upload Failed</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadResult.error || 'An error occurred during upload. Please try again.'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {uploadResult && (
          <Button
            variant={uploadResult.success ? "outline" : "default"}
            onClick={() => {
              setUploadResult(null);
              setProgress(0);
            }}
          >
            {uploadResult.success ? 'Upload Another Document' : 'Try Again'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default DocumentUploader;