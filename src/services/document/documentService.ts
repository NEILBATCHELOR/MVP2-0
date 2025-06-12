/**
 * Document Service
 * 
 * Provides functionality for document management across the application,
 * including document uploads, approvals, versions, and workflows.
 */
import { supabase } from '@/infrastructure/database/client';
import { v4 as uuidv4 } from 'uuid';
import type { Json } from '@/types/core/database';

/**
 * Document entity types
 */
export enum DocumentEntityType {
  ORGANIZATION = 'organization',
  INVESTOR = 'investor',
  PROJECT = 'project',
  TOKEN = 'token'
}

/**
 * Document status types
 */
export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

/**
 * Interface for document creation
 */
export interface DocumentCreate {
  name: string;
  type: string;
  status?: string;
  file_path?: string;
  file_url?: string;
  entity_id: string;
  entity_type: string;
  metadata?: Json;
  category?: string;
  project_id?: string;
  workflow_stage_id?: string;
}

/**
 * Interface for document update
 */
export interface DocumentUpdate {
  name?: string;
  type?: string;
  status?: string;
  file_path?: string;
  file_url?: string;
  metadata?: Json;
  category?: string;
  project_id?: string;
  workflow_stage_id?: string;
  version?: number;
  expiry_date?: string;
}

/**
 * Interface for document approval creation
 */
export interface DocumentApprovalCreate {
  document_id: string;
  approver_id: string;
  status: string;
  comments?: string;
}

/**
 * Create a new document
 * @param document - The document data to create
 * @returns The created document or null if creation failed
 */
export const createDocument = async (document: DocumentCreate): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating document:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error creating document:', error);
    return null;
  }
};

/**
 * Get a document by ID
 * @param id - The document ID
 * @returns The document or null if not found
 */
export const getDocumentById = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching document:', error);
    return null;
  }
};

/**
 * Get documents by entity
 * @param entityId - The entity ID
 * @param entityType - The entity type
 * @returns Array of documents for the entity
 */
export const getDocumentsByEntity = async (
  entityId: string, 
  entityType: DocumentEntityType
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType);
    
    if (error) {
      console.error('Error fetching documents by entity:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching documents by entity:', error);
    return [];
  }
};

/**
 * Update an existing document
 * @param id - The document ID
 * @param updates - The fields to update
 * @returns The updated document or null if update failed
 */
export const updateDocument = async (id: string, updates: DocumentUpdate): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating document:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error updating document:', error);
    return null;
  }
};

/**
 * Delete a document
 * @param id - The document ID
 * @returns True if deletion was successful, false otherwise
 */
export const deleteDocument = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error deleting document:', error);
    return false;
  }
};

/**
 * Create a document version
 * @param documentId - The document ID
 * @param version - Version number
 * @param filePath - Path to the file in storage
 * @param metadata - Optional metadata
 * @returns The created document version or null if creation failed
 */
export const createDocumentVersion = async (
  documentId: string,
  version: number,
  filePath: string,
  metadata?: Record<string, any>
): Promise<any> => {
  try {
    const versionData = {
      document_id: documentId,
      version_number: version,
      file_path: filePath,
      metadata: metadata || {}
    };
    
    const { data, error } = await supabase
      .from('document_versions')
      .insert(versionData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating document version:', error);
      return null;
    }
    
    // Update the document with the new version number
    await updateDocument(documentId, { version });
    
    return data;
  } catch (error) {
    console.error('Unexpected error creating document version:', error);
    return null;
  }
};

/**
 * Get document versions
 * @param documentId - The document ID
 * @returns Array of document versions
 */
export const getDocumentVersions = async (documentId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version', { ascending: false });
    
    if (error) {
      console.error('Error fetching document versions:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching document versions:', error);
    return [];
  }
};

/**
 * Create a document approval
 * @param approval - The approval data
 * @returns The created approval or null if creation failed
 */
export const createDocumentApproval = async (approval: DocumentApprovalCreate): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('document_approvals')
      .insert(approval)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating document approval:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error creating document approval:', error);
    return null;
  }
};

/**
 * Get document approvals
 * @param documentId - The document ID
 * @returns Array of document approvals
 */
export const getDocumentApprovals = async (documentId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('document_approvals')
      .select('*, users:approver_id(id, name, email)')
      .eq('document_id', documentId);
    
    if (error) {
      console.error('Error fetching document approvals:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching document approvals:', error);
    return [];
  }
};

/**
 * Update a document approval status
 * @param id - The approval ID
 * @param status - The new status
 * @param comments - Optional comments
 * @returns The updated approval or null if update failed
 */
export const updateDocumentApprovalStatus = async (
  id: string,
  status: 'approved' | 'rejected',
  comments?: string
): Promise<any> => {
  try {
    const updates: any = { status };
    if (comments) {
      updates.comments = comments;
    }
    
    const { data, error } = await supabase
      .from('document_approvals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating document approval status:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error updating document approval status:', error);
    return null;
  }
};

/**
 * Upload a file to storage
 * @param file - The file to upload
 * @param path - The storage path
 * @returns The file URL or null if upload failed
 */
export const uploadFile = async (file: File, path: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file);
    
    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);
    
    return publicUrl;
  } catch (error) {
    console.error('Unexpected error uploading file:', error);
    return null;
  }
};

/**
 * Create a document workflow
 * @param documentId - The document ID
 * @param workflowData - The workflow data
 * @returns The created workflow or null if creation failed
 */
export const createDocumentWorkflow = async (
  documentId: string,
  workflowData: Record<string, any>
): Promise<any> => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      console.error('No authenticated user found');
      return null;
    }
    
    const data = {
      document_id: documentId,
      metadata: workflowData as Json,
      status: 'pending' as 'pending' | 'completed' | 'rejected',
      created_by: userId,
      updated_by: userId,
      required_signers: [] as string[]
    };
    
    const { data: workflow, error } = await supabase
      .from('document_workflows')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating document workflow:', error);
      return null;
    }
    
    return workflow;
  } catch (error) {
    console.error('Unexpected error creating document workflow:', error);
    return null;
  }
};

/**
 * Get document workflow
 * @param documentId - The document ID
 * @returns The document workflow or null if not found
 */
export const getDocumentWorkflow = async (documentId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('document_workflows')
      .select('*')
      .eq('document_id', documentId)
      .single();
    
    if (error) {
      console.error('Error fetching document workflow:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching document workflow:', error);
    return null;
  }
};

/**
 * Update document workflow status
 * @param id - The workflow ID
 * @param status - The new status
 * @param workflowData - Optional updated workflow data
 * @returns The updated workflow or null if update failed
 */
export const updateDocumentWorkflowStatus = async (
  id: string,
  status: 'pending' | 'completed' | 'rejected',
  workflowData?: Record<string, any>
): Promise<any> => {
  try {
    const updates: any = { status };
    if (workflowData) {
      updates.workflow_data = workflowData;
    }
    
    const { data, error } = await supabase
      .from('document_workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating document workflow status:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error updating document workflow status:', error);
    return null;
  }
};