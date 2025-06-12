import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Download,
  Trash2,
  FileText,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { IssuerDocumentType } from "@/types/core/centralModels";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/infrastructure/database/client";
import {
  IssuerCreditworthinessUpload,
  ProjectSecurityTypeUpload,
  OfferingDetailsUpload,
  TermSheetUpload,
  SpecialRightsUpload,
  UnderwritersUpload,
  UseProceedsUpload,
  FinancialHighlightsUpload,
  TimingUpload,
  RiskFactorsUpload,
  LegalRegulatoryComplianceUpload
} from "./IssuerDocumentUpload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

interface IssuerDocumentListProps {
  projectId: string;
  preFilteredType?: string;
  compact?: boolean;
}

interface IssuerDocument {
  id: string;
  project_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  uploaded_at: string;
  status: string;
  is_public?: boolean;
  metadata?: any;
  updated_at?: string;
  uploaded_by?: string;
}

const IssuerDocumentList = ({ projectId, preFilteredType, compact = false }: IssuerDocumentListProps) => {
  const [documents, setDocuments] = useState<IssuerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(preFilteredType || "all");
  const [documentToDelete, setDocumentToDelete] = useState<IssuerDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  // Fetch documents for this project
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching documents for project: ${projectId}`);
      const { data, error } = await supabase
        .from("issuer_detail_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      
      setDocuments(data || []);
      console.log(`Successfully loaded ${data?.length || 0} documents`);
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      setError(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  // Load documents on mount and when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchDocuments();
    } else {
      setError("No project ID provided");
      setLoading(false);
    }
  }, [projectId]);

  // Update active tab when preFilteredType changes
  useEffect(() => {
    if (preFilteredType) {
      setActiveTab(preFilteredType);
    }
  }, [preFilteredType]);

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Extract storage path from URL
      const url = new URL(documentToDelete.document_url);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/project-documents\/(.+)/);
      const storagePath = pathMatch ? pathMatch[1] : null;
      
      // Delete from the database
      const { error: dbError } = await supabase
        .from("issuer_detail_documents")
        .delete()
        .eq("id", documentToDelete.id);
        
      if (dbError) throw dbError;
      
      // Delete from storage if we have the path
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from("project-documents")
          .remove([storagePath]);
          
        if (storageError) console.error("Storage delete error:", storageError);
      }
      
      // Update local state
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
    } catch (err: any) {
      console.error("Error deleting document:", err);
      setError(err.message || "Failed to delete document");
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
    }
  };

  // Handle toggling document visibility
  const toggleDocumentVisibility = async (document: IssuerDocument) => {
    setIsTogglingVisibility(true);
    setError(null);
    
    try {
      const newVisibility = !document.is_public;
      
      // Update in the database
      const { error: updateError } = await supabase
        .from("issuer_detail_documents")
        .update({ is_public: newVisibility })
        .eq("id", document.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setDocuments(documents.map(doc => 
        doc.id === document.id ? { ...doc, is_public: newVisibility } : doc
      ));
      
    } catch (err: any) {
      console.error("Error toggling document visibility:", err);
      setError(err.message || "Failed to update document visibility");
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  // Filter documents based on active tab
  const filteredDocuments = activeTab === "all" 
    ? documents 
    : documents.filter(doc => doc.document_type === activeTab);

  // Generating tabs from document types enum
  const documentTypeOptions = Object.entries(IssuerDocumentType).map(([key, value]) => ({
    value,
    label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
  }));

  // Format document type for display
  const formatDocumentType = (type: string) => {
    const found = documentTypeOptions.find(option => option.value === type);
    return found ? found.label : type;
  };

  // Helper to map document types to upload components
  const getUploadComponent = (type: IssuerDocumentType) => {
    const props = { projectId, onDocumentUploaded: fetchDocuments };
    
    switch (type) {
      case IssuerDocumentType.ISSUER_CREDITWORTHINESS:
        return <IssuerCreditworthinessUpload {...props} />;
      case IssuerDocumentType.PROJECT_SECURITY_TYPE:
        return <ProjectSecurityTypeUpload {...props} />;
      case IssuerDocumentType.OFFERING_DETAILS:
        return <OfferingDetailsUpload {...props} />;
      case IssuerDocumentType.TERM_SHEET:
        return <TermSheetUpload {...props} />;
      case IssuerDocumentType.SPECIAL_RIGHTS:
        return <SpecialRightsUpload {...props} />;
      case IssuerDocumentType.UNDERWRITERS:
        return <UnderwritersUpload {...props} />;
      case IssuerDocumentType.USE_OF_PROCEEDS:
        return <UseProceedsUpload {...props} />;
      case IssuerDocumentType.FINANCIAL_HIGHLIGHTS:
        return <FinancialHighlightsUpload {...props} />;
      case IssuerDocumentType.TIMING:
        return <TimingUpload {...props} />;
      case IssuerDocumentType.RISK_FACTORS:
        return <RiskFactorsUpload {...props} />;
      case IssuerDocumentType.LEGAL_REGULATORY_COMPLIANCE:
        return <LegalRegulatoryComplianceUpload {...props} />;
      default:
        return null;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Card className="border-border/40">
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
          <RotateCw className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-center text-muted-foreground">Loading documents...</p>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="border-border/40">
        <CardContent className="pt-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => fetchDocuments()}
              className="mt-2"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${compact ? 'border-0 shadow-none' : ''}`}>
      {!compact && (
        <CardHeader>
          <CardTitle>Issuer Documents</CardTitle>
          <CardDescription>
            Manage documents related to this project's issuance
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className={compact ? 'p-0' : ''}>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!preFilteredType && (
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList className="grid grid-flow-col auto-cols-max gap-1">
                <TabsTrigger value="all">All</TabsTrigger>
                {documentTypeOptions.map((type) => (
                  <TabsTrigger key={type.value} value={type.value}>
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loading}>
                <RotateCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <TabsContent value="all" className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <RotateCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                        Loading documents...
                      </TableCell>
                    </TableRow>
                  ) : filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-2">No documents found</p>
                        <p className="text-sm text-muted-foreground">
                          Upload a document to get started
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.document_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatDocumentType(doc.document_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={doc.is_public ? "default" : "outline"}>
                            {doc.is_public ? 'Public' : 'Private'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => toggleDocumentVisibility(doc)}
                              disabled={isTogglingVisibility}
                              title={doc.is_public ? "Make Private" : "Make Public"}
                            >
                              <Eye className={doc.is_public ? "h-4 w-4 text-primary" : "h-4 w-4"} />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              asChild
                              title="Download Document"
                            >
                              <a href={doc.document_url} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-destructive"
                                  title="Delete Document"
                                  onClick={() => setDocumentToDelete(doc)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this document? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={handleDeleteDocument}
                                    disabled={isDeleting}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {documentTypeOptions.map((type) => (
              <TabsContent key={type.value} value={type.value} className="pt-4">
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{type.label}</h3>
                    <p className="text-muted-foreground text-sm">
                      {getDocumentTypeDescription(type.value as IssuerDocumentType)}
                    </p>
                  </div>
                  {getUploadComponent(type.value as IssuerDocumentType)}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <RotateCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                          Loading documents...
                        </TableCell>
                      </TableRow>
                    ) : filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground mb-2">No documents found</p>
                          <p className="text-sm text-muted-foreground">
                            Upload a document to get started
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.document_name}</TableCell>
                          <TableCell>
                            {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={doc.is_public ? "default" : "outline"}>
                              {doc.is_public ? 'Public' : 'Private'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleDocumentVisibility(doc)}
                                disabled={isTogglingVisibility}
                                title={doc.is_public ? "Make Private" : "Make Public"}
                              >
                                <Eye className={doc.is_public ? "h-4 w-4 text-primary" : "h-4 w-4"} />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                asChild
                                title="Download Document"
                              >
                                <a href={doc.document_url} download>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-destructive"
                                    title="Delete Document"
                                    onClick={() => setDocumentToDelete(doc)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this document? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={handleDeleteDocument}
                                      disabled={isDeleting}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {isDeleting ? 'Deleting...' : 'Delete'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        )}
        
        {preFilteredType && (
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loading} className={compact ? 'h-8 px-3 text-xs' : ''}>
              <RotateCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}

        <Table className={compact ? 'text-sm' : ''}>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {!preFilteredType && <TableHead>Type</TableHead>}
              <TableHead>Uploaded</TableHead>
              <TableHead>Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={preFilteredType ? 4 : 5} className="text-center py-8">
                  <RotateCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading documents...
                </TableCell>
              </TableRow>
            ) : filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={preFilteredType ? 4 : 5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center w-full gap-4 py-12">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                    <p className="text-muted-foreground text-lg">No documents found</p>
                    <div>
                      {getUploadComponent(activeTab as IssuerDocumentType)}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {doc.document_name}
                  </TableCell>
                  {!preFilteredType && (
                    <TableCell>
                      <Badge variant="outline">{formatDocumentType(doc.document_type)}</Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                  {format(new Date(doc.uploaded_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                          <Badge variant={doc.is_public ? "default" : "outline"}>
                            {doc.is_public ? 'Public' : 'Private'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                    <div className="flex space-x-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleDocumentVisibility(doc)}
                        disabled={isTogglingVisibility}
                        title={doc.is_public ? "Make Private" : "Make Public"}
                        className={compact ? "h-8 w-8" : ""}
                      >
                        <Eye className={`${doc.is_public ? "text-primary" : ""} ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.document_url;
                          link.download = doc.document_name;
                          link.click();
                        }}
                        title="Download Document"
                        className={compact ? "h-8 w-8" : ""}
                      >
                        <Download className={compact ? "h-4 w-4" : "h-5 w-5"} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDocumentToDelete(doc)}
                            title="Delete Document"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{doc.document_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                setDocumentToDelete(doc);
                                handleDeleteDocument();
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {isDeleting && documentToDelete?.id === doc.id ? (
                                <RotateCw className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {documents.length} document{documents.length !== 1 ? 's' : ''} total
        </div>
      </CardFooter>
    </Card>
  );
};

// Helper function to get document type descriptions
function getDocumentTypeDescription(type: IssuerDocumentType): string {
  switch (type) {
    case IssuerDocumentType.ISSUER_CREDITWORTHINESS:
      return "Documents related to issuer's credit rating, financial position and reputation";
    case IssuerDocumentType.PROJECT_SECURITY_TYPE:
      return "Details about the type of security being offered";
    case IssuerDocumentType.OFFERING_DETAILS:
      return "Prospectus and detailed information about the offering";
    case IssuerDocumentType.TERM_SHEET:
      return "Term sheet outlining the key terms of the investment";
    case IssuerDocumentType.SPECIAL_RIGHTS:
      return "Documents detailing any special rights or privileges for investors";
    case IssuerDocumentType.UNDERWRITERS:
      return "Information about underwriters or placement agents";
    case IssuerDocumentType.USE_OF_PROCEEDS:
      return "Documentation on how the raised funds will be used";
    case IssuerDocumentType.FINANCIAL_HIGHLIGHTS:
      return "Key financial information and projections";
    case IssuerDocumentType.TIMING:
      return "Timeline details for the offering and important dates";
    case IssuerDocumentType.RISK_FACTORS:
      return "Information about potential risks associated with the investment";
    case IssuerDocumentType.LEGAL_REGULATORY_COMPLIANCE:
      return "Documents pertaining to legal and regulatory compliance agreements and requirements";
    default:
      return "Project documentation";
  }
}

export default IssuerDocumentList;