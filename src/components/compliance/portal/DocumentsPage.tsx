import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/infrastructure/database/client";
import { useAuth } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileText, UploadCloud, CheckCircle, AlertCircle, X, Download, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { InvestorDocument } from "@/types/core/centralModels";

// Helper function that wraps Supabase calls without generic typing to avoid deep type instantiation
const safeSupabaseQuery = {
  async getInvestorId(userId: string | undefined) {
    if (!userId) return null;
    
    // @ts-ignore - deliberately ignoring types to avoid deep instantiation
    const result = await supabase
      .from("investors")
      .select("investor_id")
      .eq("user_id", userId)
      .single();
      
    return { data: result.data, error: result.error };
  },
  
  async getDocuments(entityId: string) {
    // @ts-ignore - deliberately ignoring types to avoid deep instantiation
    const result = await supabase
      .from("documents")
      .select("*")
      .eq("entity_id", entityId)
      .eq("entity_type", "investor");
      
    return { data: result.data, error: result.error };
  },
  
  async uploadFile(bucket: string, path: string, file: File) {
    // @ts-ignore - deliberately ignoring types to avoid deep instantiation
    const result = await supabase.storage
      .from(bucket)
      .upload(path, file);
      
    return { data: result.data, error: result.error };
  },
  
  getPublicUrl(bucket: string, path: string) {
    // @ts-ignore - deliberately ignoring types to avoid deep instantiation
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
      
    return data;
  },
  
  async insertDocument(document: any) {
    // @ts-ignore - deliberately ignoring types to avoid deep instantiation
    const result = await supabase.from("documents").insert(document);
    return { data: result.data, error: result.error };
  }
};

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<InvestorDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [investorId, setInvestorId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Document categories
  const documentTypes = [
    { id: "identification", name: "Government-Issued ID", description: "Passport, driver's license, or national ID card" },
    { id: "address", name: "Proof of Address", description: "Utility bill, bank statement (less than 3 months old)" },
    { id: "accreditation", name: "Accreditation Proof", description: "Documentation proving accredited investor status" },
    { id: "source_of_wealth", name: "Source of Wealth Statement", description: "Documentation explaining source of investment funds" },
    { id: "tax", name: "Tax Documents", description: "W-8BEN, W-9, or equivalent tax forms" },
  ];

  useEffect(() => {
    if (user?.id) {
      fetchInvestorData();
    }
  }, [user?.id]);

  const fetchInvestorData = async () => {
    setIsLoading(true);
    try {
      // First fetch the investor ID using our safe wrapper
      const { data: investorData, error: investorError } = await safeSupabaseQuery.getInvestorId(user?.id);

      if (investorError) {
        throw investorError;
      }

      if (!investorData) {
        throw new Error("No investor data found");
      }

      setInvestorId(investorData.investor_id);

      // Then fetch documents using our safe wrapper
      const { data: documentData, error: documentError } = await safeSupabaseQuery.getDocuments(investorData.investor_id);

      if (documentError) {
        throw documentError;
      }

      if (!documentData) {
        setDocuments([]);
        return;
      }

      // Transform document data
      const mappedDocuments = documentData.map((doc) => ({
        id: doc.id,
        investorId: doc.entity_id,
        name: doc.name,
        description: doc.metadata && typeof doc.metadata === 'object' && 'description' in doc.metadata ? 
          doc.metadata.description as string : undefined,
        documentUrl: doc.file_url,
        documentType: doc.type,
        status: doc.status,
        rejectionReason: doc.metadata && typeof doc.metadata === 'object' && 'rejection_reason' in doc.metadata ? 
          doc.metadata.rejection_reason as string : undefined,
        reviewedBy: doc.metadata && typeof doc.metadata === 'object' && 'reviewed_by' in doc.metadata ? 
          doc.metadata.reviewed_by as string : undefined,
        reviewedAt: doc.metadata && typeof doc.metadata === 'object' && 'reviewed_at' in doc.metadata ? 
          new Date(doc.metadata.reviewed_at as string) : undefined,
        expiresAt: doc.expiry_date ? new Date(doc.expiry_date) : undefined,
        metadata: doc.metadata,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at)
      })) as InvestorDocument[];

      setDocuments(mappedDocuments);
    } catch (error) {
      console.error("Error fetching investor data:", error);
      toast({
        title: "Error",
        description: "Failed to load your documents. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = (documentType: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-document-type', documentType);
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !investorId) {
      return;
    }

    const file = files[0];
    const documentType = fileInputRef.current?.getAttribute('data-document-type') || 'other';
    
    try {
      setIsUploading(true);
      setUploadProgress(10);
      
      // Upload file to storage
      const fileName = `${investorId}/${documentType}/${Math.random().toString(36).substring(2)}_${file.name}`;
      
      setUploadProgress(30);
      
      // Use our safe wrapper for file upload
      const { data: fileData, error: fileError } = await safeSupabaseQuery.uploadFile(
        "investor-documents", 
        fileName, 
        file
      );

      if (fileError) throw fileError;
      
      setUploadProgress(70);

      // Get public URL for the file using our safe wrapper
      const urlData = safeSupabaseQuery.getPublicUrl("investor-documents", fileName);

      // Insert document record using our safe wrapper
      const { error: docError } = await safeSupabaseQuery.insertDocument({
        name: file.name,
        type: documentType,
        status: "pending",
        file_path: fileName,
        file_url: urlData.publicUrl,
        entity_id: investorId,
        entity_type: "investor",
        metadata: {
          original_name: file.name,
          size: file.size,
          content_type: file.type,
          description: `Uploaded ${documentType} document`,
          upload_date: new Date().toISOString(),
        },
      });

      if (docError) throw docError;
      
      setUploadProgress(100);

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded and is pending review.",
      });

      // Refresh document list
      fetchInvestorData();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Filter documents by type
  const getDocumentsByType = (type: string) => {
    return documents.filter(doc => 
      doc.documentType === type || 
      doc.documentType.includes(type)
    );
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED':
        return "bg-green-100 text-green-800";
      case 'PENDING':
        return "bg-blue-100 text-blue-800";
      case 'REJECTED':
        return "bg-red-100 text-red-800";
      case 'EXPIRED':
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'REJECTED':
        return <X className="h-4 w-4 text-red-600" />;
      case 'EXPIRED':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-2">
            Manage your KYC, financial, and compliance documents
          </p>
        </div>
        <Button 
          onClick={() => fetchInvestorData()} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Hidden file input for document upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-muted rounded-lg p-1">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="identification">Government-Issued ID</TabsTrigger>
            <TabsTrigger value="address">Proof of Address</TabsTrigger>
            <TabsTrigger value="accreditation">Accreditation Proof</TabsTrigger>
            <TabsTrigger value="source_of_wealth">Source of Wealth</TabsTrigger>
            <TabsTrigger value="tax">Tax Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documentTypes.map(type => (
                <Card key={type.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>{type.name}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getDocumentsByType(type.id).length > 0 ? (
                      <ul className="space-y-2">
                        {getDocumentsByType(type.id).map(doc => (
                          <li key={doc.id} className="flex items-start gap-3 border rounded-md p-3">
                            <div className="mt-1">{getStatusIcon(doc.status)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.name}</p>
                              <div className="flex items-center mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(doc.status)}`}>
                                  {doc.status}
                                </span>
                                <span className="ml-2 text-xs text-muted-foreground">
                                  Uploaded {formatDistanceToNow(doc.createdAt, { addSuffix: true })}
                                </span>
                              </div>
                              {doc.rejectionReason && (
                                <p className="mt-1 text-xs text-red-600">
                                  Reason: {doc.rejectionReason}
                                </p>
                              )}
                            </div>
                            <a 
                              href={doc.documentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                            >
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6 border rounded-md border-dashed">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No {type.name.toLowerCase()} documents uploaded</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUploadClick(type.id)}
                      disabled={isUploading}
                    >
                      {isUploading && fileInputRef.current?.getAttribute('data-document-type') === type.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading ({uploadProgress}%)
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4 mr-2" />
                          Upload {type.name} Document
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {documentTypes.map(type => (
            <TabsContent key={type.id} value={type.id} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{type.name} Documents</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {getDocumentsByType(type.id).length > 0 ? (
                    <ul className="space-y-3">
                      {getDocumentsByType(type.id).map(doc => (
                        <li key={doc.id} className="flex items-start gap-3 border rounded-md p-4">
                          <div className="mt-1">{getStatusIcon(doc.status)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{doc.name}</p>
                            <div className="flex items-center mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(doc.status)}`}>
                                {doc.status}
                              </span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                Uploaded {formatDistanceToNow(doc.createdAt, { addSuffix: true })}
                              </span>
                            </div>
                            {doc.rejectionReason && (
                              <p className="mt-2 text-sm text-red-600">
                                Reason: {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                          <a 
                            href={doc.documentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 border rounded-md border-dashed">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No {type.name.toLowerCase()} documents uploaded</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload your {type.name.toLowerCase()} documents to proceed with verification
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUploadClick(type.id)}
                    disabled={isUploading}
                  >
                    {isUploading && fileInputRef.current?.getAttribute('data-document-type') === type.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading ({uploadProgress}%)
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4 mr-2" />
                        Upload {type.name} Document
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default DocumentsPage; 