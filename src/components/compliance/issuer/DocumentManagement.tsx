import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@/hooks/shared/supabase/useSupabaseClient';
import type { DocumentType, IssuerDocument } from './types/documents';
import { DocumentStorageService, DocumentUploadResult } from '@/components/compliance/operations/documents/services/documentStorage';

interface DocumentManagementProps {
  issuerId: string;
}

export const DocumentManagement: React.FC<DocumentManagementProps> = ({ issuerId }) => {
  const supabase = useSupabaseClient();
  const [documents, setDocuments] = useState<IssuerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Initialize document storage service
  const documentStorage = new DocumentStorageService(supabase);

  useEffect(() => {
    loadDocuments();
  }, [issuerId]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('issuer_documents')
        .select('*')
        .eq('issuer_id', issuerId);

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (
    documentType: DocumentType,
    file: File
  ) => {
    try {
      setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

      const result = await documentStorage.uploadDocument(file, documentType, issuerId, {
        generateThumbnail: true,
        allowedMimeTypes: getAllowedMimeTypes(documentType),
      });

      setUploadProgress(prev => ({ ...prev, [documentType]: 100 }));
      await loadDocuments();

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
      setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));
    }
  };

  const handleDocumentUpdate = async (
    documentId: string,
    file: File
  ) => {
    try {
      await documentStorage.updateDocument(documentId, file, {
        generateThumbnail: true,
      });
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      await documentStorage.deleteDocument(documentId);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const url = await documentStorage.getDownloadUrl(documentId);
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Document Management</h2>
      
      <DocumentSection
        title="Legal Documents"
        documents={documents.filter(d => 
          ['commercial_register', 'certificate_incorporation', 'memorandum_articles'].includes(d.document_type)
        )}
        onUpload={handleDocumentUpload}
        onUpdate={handleDocumentUpdate}
        onDelete={handleDocumentDelete}
        onDownload={handleDownload}
        uploadProgress={uploadProgress}
      />

      <DocumentSection
        title="Corporate Structure"
        documents={documents.filter(d => 
          ['director_list', 'shareholder_register', 'organizational_chart'].includes(d.document_type)
        )}
        onUpload={handleDocumentUpload}
        onUpdate={handleDocumentUpdate}
        onDelete={handleDocumentDelete}
        onDownload={handleDownload}
        uploadProgress={uploadProgress}
      />

      <DocumentSection
        title="Financial & Regulatory"
        documents={documents.filter(d => 
          ['financial_statements', 'regulatory_status'].includes(d.document_type)
        )}
        onUpload={handleDocumentUpload}
        onUpdate={handleDocumentUpdate}
        onDelete={handleDocumentDelete}
        onDownload={handleDownload}
        uploadProgress={uploadProgress}
      />

      <DocumentSection
        title="Additional Information"
        documents={documents.filter(d => 
          ['qualification_summary', 'business_description', 'key_people_cv', 'aml_kyc_description'].includes(d.document_type)
        )}
        onUpload={handleDocumentUpload}
        onUpdate={handleDocumentUpdate}
        onDelete={handleDocumentDelete}
        onDownload={handleDownload}
        uploadProgress={uploadProgress}
      />
    </div>
  );
};

interface DocumentSectionProps {
  title: string;
  documents: IssuerDocument[];
  onUpload: (type: DocumentType, file: File) => Promise<DocumentUploadResult | undefined>;
  onUpdate: (id: string, file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDownload: (id: string) => Promise<void>;
  uploadProgress: Record<string, number>;
}

const DocumentSection: React.FC<DocumentSectionProps> = ({
  title,
  documents,
  onUpload,
  onUpdate,
  onDelete,
  onDownload,
  uploadProgress,
}) => {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-xl font-medium mb-4">{title}</h3>
      <div className="space-y-4">
        {documents.map((doc) => (
          <DocumentItem 
            key={doc.id} 
            document={doc}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onDownload={onDownload}
            uploadProgress={uploadProgress[doc.document_type]}
          />
        ))}
      </div>
    </div>
  );
};

interface DocumentItemProps {
  document: IssuerDocument;
  onUpdate: (id: string, file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDownload: (id: string) => Promise<void>;
  uploadProgress: number;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ 
  document, 
  onUpdate,
  onDelete,
  onDownload,
  uploadProgress 
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <div>
        <h4 className="font-medium">{formatDocumentType(document.document_type)}</h4>
        <p className="text-sm text-gray-600">
          Last updated: {new Date(document.uploaded_at).toLocaleDateString()}
        </p>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(document.status)}`}>
          {document.status}
        </span>
        <button
          onClick={() => onDownload(document.id)}
          className="text-blue-600 hover:text-blue-800"
        >
          Download
        </button>
        <button
          onClick={() => onDelete(document.id)}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

const formatDocumentType = (type: DocumentType): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getStatusColor = (status: string): string => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
  };
  return colors[status as keyof typeof colors] || colors.pending;
};

const getAllowedMimeTypes = (documentType: DocumentType): string[] => {
  const commonTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const imageTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  switch (documentType) {
    case 'organizational_chart':
      return [...commonTypes, ...imageTypes];
    case 'financial_statements':
      return [...commonTypes, 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    default:
      return commonTypes;
  }
};

export default DocumentManagement;