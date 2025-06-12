import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import type { PreviewOptions } from '../services/fileTypes';

interface FilePreviewProps {
  file: File | { url: string; mimeType: string };
  previewOptions: PreviewOptions;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  previewOptions,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [metadata, setMetadata] = useState<any>(null);

  const fileUrl = file instanceof File ? URL.createObjectURL(file) : file.url;
  const mimeType = file instanceof File ? file.type : file.mimeType;

  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const loadMetadata = async () => {
    if (file instanceof File) {
      const meta: any = {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleString()
      };
      setMetadata(meta);
    }
  };

  React.useEffect(() => {
    if (previewOptions.showMetadata) {
      loadMetadata();
    }
  }, [file, previewOptions.showMetadata]);

  const renderPreview = () => {
    if (isPDF) {
      return (
        <Document
          file={fileUrl}
          onLoadSuccess={handleLoadSuccess}
          className="pdf-document"
        >
          <Page
            pageNumber={currentPage}
            width={previewOptions.previewSize?.width || 800}
          />
          {numPages && numPages > 1 && (
            <div className="flex items-center justify-center mt-4 space-x-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm bg-gray-100 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {numPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage >= numPages}
                className="px-3 py-1 text-sm bg-gray-100 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </Document>
      );
    }

    if (isImage) {
      return (
        <div className="relative">
          <img
            src={fileUrl}
            alt="Preview"
            width={previewOptions.previewSize?.width || 800}
            height={previewOptions.previewSize?.height || 800}
            className="object-contain"
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        No preview available for this file type
      </div>
    );
  };

  const renderMetadata = () => {
    if (!previewOptions.showMetadata || !metadata) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-900">File Information</h3>
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key}>
              <dt className="text-sm font-medium text-gray-500">{key}</dt>
              <dd className="text-sm text-gray-900">{value as string}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  };

  const preview = (
    <div className={`relative ${className}`}>
      {previewOptions.allowFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 p-1 bg-white rounded-md shadow-sm hover:bg-gray-50 z-10"
        >
          <ArrowsPointingOutIcon className="w-5 h-5 text-gray-500" />
        </button>
      )}
      {renderPreview()}
      {renderMetadata()}
    </div>
  );

  if (!isFullscreen) return preview;

  return (
    <Dialog
      open={isFullscreen}
      onClose={() => setIsFullscreen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-6xl w-full bg-white rounded-lg shadow-xl">
          <div className="relative">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-2 right-2 p-1 bg-white rounded-md shadow-sm hover:bg-gray-50 z-10"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
            <div className="p-4">
              {renderPreview()}
              {renderMetadata()}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};