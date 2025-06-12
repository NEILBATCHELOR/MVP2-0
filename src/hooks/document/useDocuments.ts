import { useState, useEffect } from "react";
import {
  DocumentMetadata,
  getDocuments,
  uploadDocument,
  updateDocumentStatus,
  deleteDocument,
} from "@/services/document/documentStorage";
import { verifyDocument, rejectDocument } from "@/infrastructure/api";

export function useDocuments(
  userId: string = "default-user",
  organizationId: string = "default-org",
) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, [userId, organizationId]);

  // Load documents from the API
  const loadDocuments = async () => {
    setLoading(true);
    try {
      const fetchedDocs = await getDocuments(userId, organizationId);
      setDocuments(fetchedDocs);
      setError(null);
    } catch (err) {
      console.error("Error loading documents:", err);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  // Upload a new document
  const uploadNewDocument = async (
    file: File,
    metadata: Partial<DocumentMetadata>,
  ) => {
    setLoading(true);
    try {
      const uploadedDoc = await uploadDocument(
        file,
        metadata,
        userId,
        organizationId,
      );
      setDocuments((prevDocs) => {
        const newDocs = [...prevDocs];
        const index = newDocs.findIndex((doc) => doc.id === uploadedDoc.id);
        if (index !== -1) {
          newDocs[index] = uploadedDoc;
        } else {
          newDocs.push(uploadedDoc);
        }
        return newDocs;
      });
      setError(null);
      return uploadedDoc;
    } catch (err) {
      console.error("Error uploading document:", err);
      setError("Failed to upload document");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify a document (approve it)
  const verifyDocumentById = async (documentId: string) => {
    setLoading(true);
    try {
      const response = await verifyDocument(documentId);
      if (response.error) {
        throw new Error(response.error);
      }

      setDocuments((prevDocs) => {
        return prevDocs.map((doc) => {
          if (doc.id === documentId) {
            return {
              ...doc,
              status: "approved",
              dateUpdated: new Date().toISOString(),
            };
          }
          return doc;
        });
      });

      setError(null);
      return response.data;
    } catch (err) {
      console.error("Error verifying document:", err);
      setError("Failed to verify document");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reject a document
  const rejectDocumentById = async (documentId: string, reason: string) => {
    setLoading(true);
    try {
      const response = await rejectDocument(documentId, reason);
      if (response.error) {
        throw new Error(response.error);
      }

      setDocuments((prevDocs) => {
        return prevDocs.map((doc) => {
          if (doc.id === documentId) {
            return {
              ...doc,
              status: "rejected",
              rejectionReason: reason,
              dateUpdated: new Date().toISOString(),
            };
          }
          return doc;
        });
      });

      setError(null);
      return response.data;
    } catch (err) {
      console.error("Error rejecting document:", err);
      setError("Failed to reject document");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a document
  const deleteDocumentById = async (documentId: string) => {
    setLoading(true);
    try {
      const success = await deleteDocument(documentId);
      if (success) {
        setDocuments((prevDocs) =>
          prevDocs.filter((doc) => doc.id !== documentId),
        );
        setError(null);
      } else {
        throw new Error("Failed to delete document");
      }
      return success;
    } catch (err) {
      console.error("Error deleting document:", err);
      setError("Failed to delete document");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    documents,
    loading,
    error,
    loadDocuments,
    uploadDocument: uploadNewDocument,
    verifyDocument: verifyDocumentById,
    rejectDocument: rejectDocumentById,
    deleteDocument: deleteDocumentById,
  };
}
