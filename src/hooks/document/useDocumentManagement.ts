/**
 * useDocumentManagement Hook
 * 
 * Custom React hook for document management operations across the application
 */
import { useState, useCallback } from 'react';
import * as documentService from '@/services/document/documentService';
import { DocumentEntityType, DocumentStatus } from '@/services/document/documentService';

interface UseDocumentManagementReturn {
  documents: any[];
  document: any | null;
  documentVersions: any[];
  documentApprovals: any[];
  loading: boolean;
  error: string | null;
  uploadDocument: (
    file: File,
    entityId: string,
    entityType: DocumentEntityType,
    documentType: string,
    name?: string,
    metadata?: Record<string, any>
  ) => Promise<any | null>;
  getDocuments: (entityId: string, entityType: DocumentEntityType) => Promise<void>;
  getDocument: (id: string) => Promise<any | null>;
  updateDocument: (id: string, updates: documentService.DocumentUpdate) => Promise<any | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  createDocumentVersion: (documentId: string, file: File, metadata?: Record<string, any>) => Promise<any | null>;
  getDocumentVersions: (documentId: string) => Promise<void>;
  createApproval: (documentId: string, approverId: string, comments?: string) => Promise<any | null>;
  getDocumentApprovals: (documentId: string) => Promise<void>;
  updateApprovalStatus: (approvalId: string, status: 'approved' | 'rejected', comments?: string) => Promise<any | null>;
  createWorkflow: (documentId: string, workflowData: Record<string, any>) => Promise<any | null>;
  resetState: () => void;
}

export const useDocumentManagement = (): UseDocumentManagementReturn => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [document, setDocument] = useState<any | null>(null);
  const [documentVersions, setDocumentVersions] = useState<any[]>([]);
  const [documentApprovals, setDocumentApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setDocuments([]);
    setDocument(null);
    setDocumentVersions([]);
    setDocumentApprovals([]);
    setError(null);
    setLoading(false);
  }, []);

  const uploadDocument = useCallback(async (
    file: File,
    entityId: string,
    entityType: DocumentEntityType,
    documentType: string,
    name?: string,
    metadata?: Record<string, any>
  ): Promise<any | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Upload file to storage
      const storagePath = `${entityType}/${entityId}`;
      const fileUrl = await documentService.uploadFile(file, storagePath);
      
      if (!fileUrl) {
        setError('Failed to upload file');
        return null;
      }
      
      // Create document record
      const documentData: documentService.DocumentCreate = {
        name: name || file.name,
        type: documentType,
        status: DocumentStatus.PENDING,
        file_url: fileUrl,
        file_path: `${storagePath}/${file.name}`,
        entity_id: entityId,
        entity_type: entityType,
        metadata: metadata || {}
      };
      
      const newDocument = await documentService.createDocument(documentData);
      if (!newDocument) {
        setError('Failed to create document record');
        return null;
      }
      
      setDocument(newDocument);
      return newDocument;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error uploading document: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocuments = useCallback(async (entityId: string, entityType: DocumentEntityType): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const docs = await documentService.getDocumentsByEntity(entityId, entityType);
      setDocuments(docs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error fetching documents: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocument = useCallback(async (id: string): Promise<any | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const doc = await documentService.getDocumentById(id);
      if (!doc) {
        setError('Document not found');
        return null;
      }
      
      setDocument(doc);
      return doc;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error fetching document: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocument = useCallback(async (id: string, updates: documentService.DocumentUpdate): Promise<any | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedDoc = await documentService.updateDocument(id, updates);
      if (!updatedDoc) {
        setError('Failed to update document');
        return null;
      }
      
      setDocument(updatedDoc);
      return updatedDoc;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error updating document: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await documentService.deleteDocument(id);
      if (!success) {
        setError('Failed to delete document');
        return false;
      }
      
      setDocument(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error deleting document: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const createDocumentVersion = useCallback(async (
    documentId: string, 
    file: File, 
    metadata?: Record<string, any>
  ): Promise<any | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get document first
      const doc = await documentService.getDocumentById(documentId);
      if (!doc) {
        setError('Document not found');
        return null;
      }
      
      // Upload file to storage
      const storagePath = `${doc.entity_type}/${doc.entity_id}/versions`;
      const fileUrl = await documentService.uploadFile(file, storagePath);
      
      if (!fileUrl) {
        setError('Failed to upload file');
        return null;
      }
      
      // Calculate next version number
      const versions = await documentService.getDocumentVersions(documentId);
      const nextVersion = versions.length > 0 
        ? Math.max(...versions.map(v => v.version)) + 1 
        : 1;
      
      // Create document version
      const version = await documentService.createDocumentVersion(
        documentId, 
        nextVersion, 
        `${storagePath}/${file.name}`,
        metadata
      );
      
      if (!version) {
        setError('Failed to create document version');
        return null;
      }
      
      // Update document with new file URL
      await documentService.updateDocument(documentId, {
        file_url: fileUrl,
        version: nextVersion,
        status: DocumentStatus.PENDING
      });
      
      return version;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error creating document version: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumentVersions = useCallback(async (documentId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const versions = await documentService.getDocumentVersions(documentId);
      setDocumentVersions(versions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error fetching document versions: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createApproval = useCallback(async (
    documentId: string, 
    approverId: string, 
    comments?: string
  ): Promise<any | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const approval: documentService.DocumentApprovalCreate = {
        document_id: documentId,
        approver_id: approverId,
        status: 'pending',
        comments
      };
      
      const newApproval = await documentService.createDocumentApproval(approval);
      if (!newApproval) {
        setError('Failed to create document approval');
        return null;
      }
      
      return newApproval;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error creating document approval: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumentApprovals = useCallback(async (documentId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const approvals = await documentService.getDocumentApprovals(documentId);
      setDocumentApprovals(approvals);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error fetching document approvals: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateApprovalStatus = useCallback(async (
    approvalId: string, 
    status: 'approved' | 'rejected', 
    comments?: string
  ): Promise<any | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedApproval = await documentService.updateDocumentApprovalStatus(
        approvalId, 
        status, 
        comments
      );
      
      if (!updatedApproval) {
        setError('Failed to update approval status');
        return null;
      }
      
      return updatedApproval;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error updating approval status: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkflow = useCallback(async (
    documentId: string, 
    workflowData: Record<string, any>
  ): Promise<any | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const workflow = await documentService.createDocumentWorkflow(documentId, workflowData);
      if (!workflow) {
        setError('Failed to create document workflow');
        return null;
      }
      
      return workflow;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error creating document workflow: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    documents,
    document,
    documentVersions,
    documentApprovals,
    loading,
    error,
    uploadDocument,
    getDocuments,
    getDocument,
    updateDocument,
    deleteDocument,
    createDocumentVersion,
    getDocumentVersions,
    createApproval,
    getDocumentApprovals,
    updateApprovalStatus,
    createWorkflow,
    resetState
  };
};