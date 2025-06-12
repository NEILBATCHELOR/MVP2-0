import { supabase } from "@/infrastructure/database/client";
import { v4 as uuidv4 } from "uuid";
import type { Json } from "@/types/core/supabase";
import type { Database } from "@/types/core/supabase";

export interface DocumentMetadata {
  id: string;
  name: string;
  status: string;
  dateUpdated: string;
  description?: string;
  rejectionReason?: string;
  fileUrl?: string;
  filePath?: string;
  fileType?: string;
  fileSize?: number;
  userId?: string;
  organizationId?: string;
  required?: boolean;
  // Add fields from Supabase schema
  entity_id?: string;
  entity_type?: string;
  type?: string;
  category?: string;
  project_id?: string;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
  // Map Supabase fields to our fields
  file_url?: string;
  file_path?: string;
  metadata?: any;
  organization_id?: string; // Added missing field
}

// Empty document storage array - all documents will be stored in Supabase
let documents: DocumentMetadata[] = [];

export const uploadDocument = async (
  file: File,
  metadata: Partial<DocumentMetadata>,
  userId: string = "default-user",
  organizationId: string = "default-org",
): Promise<DocumentMetadata> => {
  try {
    // Generate a mock file URL
    const fileUrl = `https://example.com/mock-${file.name}`;

    // Create document metadata
    const documentMetadata: DocumentMetadata = {
      id: metadata.id || uuidv4(),
      name: metadata.name || file.name,
      status: "pending",
      dateUpdated: new Date().toISOString(),
      description: metadata.description || "",
      fileUrl,
      filePath: `mock-path/${file.name}`,
      fileType: file.type,
      fileSize: file.size,
      userId,
      organizationId,
      ...metadata,
    };

    // We'll only use Supabase for document storage, no local caching

    // Try to use Supabase if available, but don't fail if it's not
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${organizationId}/${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (!uploadError) {
        // Get the public URL for the file
        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);

        documentMetadata.fileUrl = urlData.publicUrl;
        documentMetadata.filePath = filePath;

        // Store metadata in Supabase Database
        await supabase
          .from("documents")
          .insert({
            id: documentMetadata.id,
            name: documentMetadata.name,
            status: documentMetadata.status,
            updated_at: documentMetadata.dateUpdated,
            entity_id: documentMetadata.entity_id || userId,
            entity_type: documentMetadata.entity_type || "user",
            type: documentMetadata.type || "document",
            file_url: documentMetadata.fileUrl,
            file_path: documentMetadata.filePath,
            metadata: {
              fileType: documentMetadata.fileType,
              fileSize: documentMetadata.fileSize,
              required: documentMetadata.required,
              rejectionReason: documentMetadata.rejectionReason,
              description: documentMetadata.description,
            },
            project_id: documentMetadata.project_id || organizationId,
            uploaded_by: documentMetadata.uploaded_by || userId,
            category: documentMetadata.category || "general",
          })
          .select();
      }
    } catch (e) {
      console.warn("Using mock document storage", e);
    }

    return documentMetadata;
  } catch (error) {
    console.error("Document upload failed:", error);
    throw error;
  }
};

export const getDocuments = async (
  userId: string = "default-user",
  organizationId: string = "default-org",
): Promise<DocumentMetadata[]> => {
  try {
    // Try to use Supabase if available
    try {
      let query = supabase
        .from("documents")
        .select("*");
      
      query = (query as any).eq("organization_id", organizationId).order("date_updated", { ascending: false });
      
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        // Transform data to match our interface
        return data.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          status: doc.status,
          dateUpdated: doc.updated_at,
          description: doc.description,
          entity_id: doc.entity_id,
          entity_type: doc.entity_type,
          type: doc.type,
          fileUrl: doc.file_url,
          filePath: doc.file_path,
          category: doc.category,
          project_id: doc.project_id,
          uploaded_by: doc.uploaded_by,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          ...(doc.metadata || {}),
        }));
      }
    } catch (e) {
      console.warn("Using mock document storage", e);
    }

    // Return empty array if Supabase fetch fails
    return [];
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return []; // Return empty array instead of mock data
  }
};

export const updateDocumentStatus = async (
  documentId: string,
  status: DocumentMetadata["status"],
  rejectionReason?: string,
): Promise<DocumentMetadata | null> => {
  try {
    const updateData: Partial<DocumentMetadata> = {
      status,
      dateUpdated: new Date().toISOString(),
    };

    if (rejectionReason && status === "rejected") {
      updateData.rejectionReason = rejectionReason;
    }

    try {
      // Create a metadata object for the update
      const metadataUpdate = rejectionReason ? { rejectionReason } : undefined;

      const { data, error } = await supabase
        .from("documents")
        .update({
          status: updateData.status,
          updated_at: updateData.dateUpdated,
          metadata: metadataUpdate,
        })
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;

      // Type casting to access object properties safely
      type DocMetadata = {
        description?: string;
        rejectionReason?: string;
        fileType?: string;
        fileSize?: number;
        required?: boolean;
      };

      // Transform the data to match our DocumentMetadata interface
      const transformedData: DocumentMetadata = {
        id: data.id,
        name: data.name,
        status: data.status,
        dateUpdated: data.updated_at,
        entity_id: data.entity_id,
        entity_type: data.entity_type,
        type: data.type,
        fileUrl: data.file_url,
        filePath: data.file_path,
        file_url: data.file_url,
        file_path: data.file_path,
        category: data.category,
        project_id: data.project_id,
        uploaded_by: data.uploaded_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
        metadata: data.metadata,
      };

      // Safely extract properties from JSON metadata
      const metadataObj = data.metadata as DocMetadata;
      if (metadataObj) {
        transformedData.description = metadataObj.description;
        transformedData.rejectionReason = metadataObj.rejectionReason;
        transformedData.fileType = metadataObj.fileType;
        transformedData.fileSize = metadataObj.fileSize;
        transformedData.required = metadataObj.required;
      }

      return transformedData;
    } catch (e) {
      console.error("Error updating document status:", e);
    }

    return null;
  } catch (error) {
    console.error("Failed to update document status:", error);
    return null;
  }
};

export const deleteDocument = async (documentId: string): Promise<boolean> => {
  try {
    try {
      // First get the document to get the file path
      const { data: document, error: fetchError } = await supabase
        .from("documents")
        .select("file_path")
        .eq("id", documentId)
        .single();

      if (fetchError) throw fetchError;

      // Remove the file from storage if it exists
      if (document?.file_path) {
        await supabase.storage.from("documents").remove([document.file_path]);
      }

      // Delete the document record
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Error deleting document:", e);
      return false;
    }
  } catch (error) {
    console.error("Failed to delete document:", error);
    return false;
  }
};

// Get document templates based on user type
export const getDocumentTemplates = (
  userType: "issuer" | "investor",
): DocumentMetadata[] => {
  const commonDocuments: DocumentMetadata[] = [
    {
      id: "proof_identity",
      name: "Government-Issued ID",
      description: "Passport, driver's license, or national ID card",
      status: "not_uploaded",
      dateUpdated: new Date().toISOString(),
      required: true,
    },
    {
      id: "proof_address",
      name: "Proof of Address",
      description: "Utility bill, bank statement (less than 3 months old)",
      status: "not_uploaded",
      dateUpdated: new Date().toISOString(),
      required: true,
    },
  ];

  const issuerDocuments: DocumentMetadata[] = [
    {
      id: "certificate_incorporation",
      name: "Certificate of Incorporation",
      description: "Official document proving company registration",
      status: "not_uploaded",
      dateUpdated: new Date().toISOString(),
      required: true,
    },
    {
      id: "articles_association",
      name: "Articles of Association",
      description: "Company bylaws and operating rules",
      status: "not_uploaded",
      dateUpdated: new Date().toISOString(),
      required: true,
    },
    {
      id: "shareholder_register",
      name: "Shareholder Register",
      description: "List of all shareholders and their ownership percentages",
      status: "not_uploaded",
      dateUpdated: new Date().toISOString(),
      required: true,
    },
    {
      id: "director_list",
      name: "List of Directors",
      description: "Official list of company directors",
      status: "not_uploaded",
      dateUpdated: new Date().toISOString(),
      required: true,
    },
    {
      id: "financial_statements",
      name: "Financial Statements",
      description: "Recent audited financial statements",
      status: "not_uploaded",
      dateUpdated: new Date().toISOString(),
      required: false,
    },
    {
      id: "regulatory_licenses",
      name: "Regulatory Licenses",
      description: "Any financial or business licenses held",
      status: "not_uploaded",
      dateUpdated: new Date().toISOString(),
      required: false,
    },
  ];

  const investorDocuments: DocumentMetadata[] = [
    {
      id: "accreditation_proof",
      name: "Accreditation Proof",
      description: "Documentation proving accredited investor status",
      status: "not_uploaded",
      dateUpdated: new Date().toISOString(),
      required: true,
    },
    {
      id: "source_wealth",
      name: "Source of Wealth Statement",
      description: "Documentation explaining source of investment funds",
      status: "not_uploaded",
      dateUpdated: new Date().toISOString(),
      required: true,
    },
    {
      id: "tax_documents",
      name: "Tax Documents",
      description: "W-8BEN, W-9, or equivalent tax forms",
      status: "not_uploaded",
      dateUpdated: new Date().toISOString(),
      required: true,
    },
  ];

  // Return documents based on user type
  if (userType === "issuer") {
    return [...commonDocuments, ...issuerDocuments];
  } else {
    return [...commonDocuments, ...investorDocuments];
  }
};

// Type-safe version of the updateJsonMetadata function
export const updateJsonMetadata = async (
  tableName: string,
  id: string,
  jsonField: string,
  path: string[],
  value: any,
): Promise<any> => {
  try {
    // List of strongly typed tables
    type TableNames = keyof Database["public"]["Tables"];
    
    // Validate the table name is one we support
    const validTables = [
      "documents", "system_settings", "users", "projects", 
      "investors", "subscriptions", "token_allocations"
    ];
    
    if (!validTables.includes(tableName)) {
      throw new Error(`Unsupported table: ${tableName}`);
    }
    
    // Type assertion - we've validated the table name
    const typedTableName = tableName as TableNames;

    // Instead of using rpc for jsonb_set, we'll fetch the record, update the JSON, and save it back
    let query = supabase
      .from(typedTableName)
      .select(`id, ${jsonField}`);
    
    query = (query as any).eq("id", id).single();
    
    const { data: record, error: fetchError } = await query;

    if (fetchError) {
      console.error(`Error fetching record from ${tableName}:`, fetchError);
      throw fetchError;
    }

    // If record doesn't exist or doesn't have the JSON field
    if (!record || !record[jsonField]) {
      throw new Error(`Record not found or ${jsonField} field doesn't exist`);
    }

    // Create deep clone of the JSON data
    const jsonData = JSON.parse(JSON.stringify(record[jsonField]));

    // Navigate to the path and update the value
    let target = jsonData;
    for (let i = 0; i < path.length - 1; i++) {
      if (!target[path[i]]) {
        target[path[i]] = {};
      }
      target = target[path[i]];
    }
    target[path[path.length - 1]] = value;

    // Update the record with the modified JSON
    let updateQuery = supabase
      .from(typedTableName)
      .update({ [jsonField]: jsonData });
      
    updateQuery = (updateQuery as any).eq("id", id).select().single();
    
    const { data, error } = await updateQuery;

    if (error) {
      console.error(`Error updating JSON in ${tableName}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to update JSON metadata:", error);
    throw error;
  }
};