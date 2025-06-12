import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Trash2,
  Download,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "../ui/tooltip";
import {
  uploadDocument,
  getDocuments,
  updateDocumentStatus,
  deleteDocument,
  DocumentMetadata,
} from "@/services/document/documentStorage";
import { useToast } from "../ui/use-toast";

interface DocumentSectionProps {
  documents?: DocumentMetadata[];
  userId?: string;
  organizationId?: string;
}

const DocumentSection = ({
  documents: initialDocuments = [],
  userId = "default-user",
  organizationId = "default-org",
}: DocumentSectionProps) => {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentMetadata | null>(null);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  // Load documents from Supabase on component mount
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        const fetchedDocs = await getDocuments(userId, organizationId);
        setDocuments(fetchedDocs.length > 0 ? fetchedDocs : initialDocuments);
      } catch (error) {
        console.error("Error loading documents:", error);
        toast({
          title: "Error loading documents",
          description:
            "There was a problem loading your documents. Please try again.",
          variant: "destructive",
        });
        // Fall back to initial documents if provided
        if (initialDocuments.length > 0) {
          setDocuments(initialDocuments);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, [userId, organizationId, initialDocuments, toast]);

  const filteredDocuments =
    activeTab === "all"
      ? documents
      : documents.filter((doc) => {
          if (activeTab === "pending") return doc.status === "pending";
          if (activeTab === "approved") return doc.status === "approved";
          if (activeTab === "rejected") return doc.status === "rejected";
          if (activeTab === "not_submitted")
            return doc.status === "not_submitted";
          return true;
        });

  const getStatusBadge = (status: DocumentMetadata["status"]) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-black">
            Pending Review
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "not_submitted":
        return <Badge variant="outline">Not Submitted</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: DocumentMetadata["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "not_submitted":
        return <FileText className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const handleUploadClick = (doc: DocumentMetadata) => {
    setSelectedDocument(doc);
    setNotes("");
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleSubmitDocument = async () => {
    if (!selectedDocument || !selectedFile) return;

    setIsUploading(true);
    try {
      // Upload the document to Supabase
      const updatedDoc = await uploadDocument(
        selectedFile,
        {
          id: selectedDocument.id,
          name: selectedDocument.name,
          description: selectedDocument.description,
          status: "pending",
          rejectionReason: notes.length > 0 ? notes : undefined,
        },
        userId,
        organizationId,
      );

      // Update the documents list
      setDocuments((prevDocs) => {
        const newDocs = [...prevDocs];
        const index = newDocs.findIndex((doc) => doc.id === updatedDoc.id);
        if (index !== -1) {
          newDocs[index] = updatedDoc;
        } else {
          newDocs.push(updatedDoc);
        }
        return newDocs;
      });

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded and is pending review.",
      });

      // Close the dialog
      setSelectedDocument(null);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description:
          "There was a problem uploading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const success = await deleteDocument(documentId);
      if (success) {
        setDocuments((prevDocs) =>
          prevDocs.filter((doc) => doc.id !== documentId),
        );
        toast({
          title: "Document deleted",
          description: "The document has been successfully deleted.",
        });
      } else {
        throw new Error("Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Delete failed",
        description:
          "There was a problem deleting the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = (fileUrl?: string) => {
    if (!fileUrl) {
      toast({
        title: "Download failed",
        description: "Document URL is not available.",
        variant: "destructive",
      });
      return;
    }

    // Open the file URL in a new tab
    window.open(fileUrl, "_blank");
  };

  return (
    <div className="w-full h-full bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Document Management</h2>
          <p className="text-gray-500">
            Upload and manage required documents for your SPV setup
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload New Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
              <DialogDescription>
                Upload a new document to your SPV setup
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="new-doc-name" className="text-sm font-medium">
                  Document Name
                </label>
                <Input id="new-doc-name" placeholder="Enter document name" />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="new-doc-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <Input
                  id="new-doc-description"
                  placeholder="Enter document description"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="new-doc-file" className="text-sm font-medium">
                  Document File
                </label>
                <Input id="new-doc-file" type="file" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Upload Document</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading documents...</span>
        </div>
      ) : (
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="not_submitted">Not Submitted</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No documents found
                </h3>
                <p className="text-sm text-gray-500">
                  {activeTab === "all"
                    ? "Upload your first document to get started"
                    : `No documents with status "${activeTab}" found`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <Card key={doc.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{doc.name}</CardTitle>
                        {getStatusIcon(doc.status)}
                      </div>
                      <CardDescription className="mt-1">
                        {doc.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Status:</span>
                          {getStatusBadge(doc.status)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">
                            Last Updated:
                          </span>
                          <span className="text-sm">{doc.dateUpdated}</span>
                        </div>
                        {doc.status === "rejected" && doc.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">
                              <span className="font-semibold">Reason: </span>
                              {doc.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant={
                              doc.status === "rejected" ||
                              doc.status === "not_submitted"
                                ? "default"
                                : "outline"
                            }
                            className="flex-1 mr-2"
                            onClick={() => handleUploadClick(doc)}
                          >
                            {doc.status === "rejected" ||
                            doc.status === "not_submitted"
                              ? "Upload Document"
                              : "View Document"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {doc.status === "rejected" ||
                              doc.status === "not_submitted"
                                ? "Upload Document"
                                : "Document Details"}
                            </DialogTitle>
                            <DialogDescription>
                              {doc.status === "rejected" ||
                              doc.status === "not_submitted"
                                ? "Upload a new version of this document for review."
                                : `View details for ${doc.name}`}
                            </DialogDescription>
                          </DialogHeader>

                          {doc.status === "rejected" ||
                          doc.status === "not_submitted" ? (
                            <div className="grid gap-4 py-4">
                              <div className="flex flex-col gap-2">
                                <label
                                  htmlFor="file"
                                  className="text-sm font-medium"
                                >
                                  Document File
                                </label>
                                <Input
                                  id="file"
                                  type="file"
                                  onChange={handleFileChange}
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <label
                                  htmlFor="notes"
                                  className="text-sm font-medium"
                                >
                                  Additional Notes (Optional)
                                </label>
                                <textarea
                                  id="notes"
                                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Add any notes about this document..."
                                  value={notes}
                                  onChange={handleNotesChange}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="py-4">
                              {doc.fileUrl ? (
                                <div className="border rounded-md p-4 flex flex-col items-center justify-center h-[200px] bg-gray-50">
                                  {doc.fileType?.includes("image") ? (
                                    <img
                                      src={doc.fileUrl}
                                      alt={doc.name}
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  ) : (
                                    <>
                                      <FileText className="h-16 w-16 text-gray-400 mb-2" />
                                      <p className="text-gray-500">
                                        {doc.fileType || "Document"} -{" "}
                                        {doc.fileSize
                                          ? (
                                              doc.fileSize /
                                              1024 /
                                              1024
                                            ).toFixed(2)
                                          : "Unknown"}{" "}
                                        MB
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() =>
                                          handleDownloadDocument(doc.fileUrl)
                                        }
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="border rounded-md p-4 flex items-center justify-center h-[200px] bg-gray-50">
                                  <FileText className="h-16 w-16 text-gray-400" />
                                  <p className="ml-4 text-gray-500">
                                    Document preview not available
                                  </p>
                                </div>
                              )}
                              <div className="mt-4">
                                <p className="text-sm font-medium">
                                  Document Information
                                </p>
                                <div className="mt-2 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">
                                      Uploaded On:
                                    </span>
                                    <span className="text-sm">
                                      {new Date(
                                        doc.dateUpdated,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">
                                      Status:
                                    </span>
                                    {getStatusBadge(doc.status)}
                                  </div>
                                  {doc.fileType && (
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500">
                                        File Type:
                                      </span>
                                      <span className="text-sm">
                                        {doc.fileType}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <DialogFooter>
                            {doc.status === "rejected" ||
                            doc.status === "not_submitted" ? (
                              <Button
                                type="button"
                                onClick={handleSubmitDocument}
                                disabled={!selectedFile || isUploading}
                              >
                                {isUploading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  "Submit for Review"
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleDownloadDocument(doc.fileUrl)
                                }
                                disabled={!doc.fileUrl}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default DocumentSection;
