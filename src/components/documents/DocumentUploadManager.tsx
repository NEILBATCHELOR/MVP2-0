import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileUp,
  Loader2,
  File,
  X,
  Download,
  Trash2,
  RotateCw,
} from "lucide-react";
import { IssuerDocumentType } from "@/types/core/centralModels";
import { supabase } from "@/infrastructure/database/client";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";

interface DocumentUploadManagerProps {
  projectId: string;
  showTitle?: boolean;
}

interface Document {
  id: string;
  project_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  uploaded_at: string;
  status: string;
}

const DocumentUploadManager = ({
  projectId,
  showTitle = true,
}: DocumentUploadManagerProps) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState<string>("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  // Load documents on mount and when projectId changes
  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("issuer_detail_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.split(".")[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName || !documentType) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `projects/${projectId}/documents/${Date.now()}_${documentName}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Save document metadata to database
      const { data, error } = await supabase
        .from("issuer_detail_documents")
        .insert({
          project_id: projectId,
          document_type: documentType,
          document_name: documentName,
          document_url: urlData?.publicUrl,
          uploaded_at: new Date().toISOString(),
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local documents list
      if (data) {
        setDocuments([data, ...documents]);
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      // Reset form
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentName("");
      setDocumentType("");
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      // Extract file path from URL
      const url = new URL(documentToDelete.document_url);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];
      const storageFilePath = `projects/${projectId}/documents/${fileName}`;

      // Delete from database
      const { error: dbError } = await supabase
        .from("issuer_detail_documents")
        .delete()
        .eq("id", documentToDelete.id);

      if (dbError) throw dbError;

      // Delete from storage
      await supabase.storage.from("documents").remove([storageFilePath]);

      // Update local state
      setDocuments(documents.filter((doc) => doc.id !== documentToDelete.id));

      toast({
        title: "Deleted",
        description: "Document has been deleted",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your document",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const getDocumentTypeLabel = (type: string): string => {
    return Object.entries(IssuerDocumentType).find(
      ([_, value]) => value === type
    )?.[0].replace(/_/g, " ") || type;
  };

  const documentTypeOptions = Object.entries(IssuerDocumentType).map(
    ([key, value]) => ({
      label: key.replace(/_/g, " "),
      value,
    })
  );

  // We don't need to filter documents anymore since there are no tabs
  // Show all documents always
  const filteredDocuments = documents;

  return (
    <>
      <Card className="w-full">
        {showTitle && (
          <CardHeader>
            <CardTitle>Issuer Documents</CardTitle>
            <CardDescription>
              Upload and manage documents related to this project's issuance
            </CardDescription>
          </CardHeader>
        )}

        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Documents</h3>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FileUp className="mr-2 h-4 w-4" /> Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Upload a document related to this project
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="documentName">Document Name</Label>
                    <Input
                      id="documentName"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Enter document name"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="documentType">Document Type</Label>
                    <Select
                      value={documentType}
                      onValueChange={setDocumentType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="file">File</Label>
                    <div className="border border-input rounded-md p-2">
                      <Input
                        id="file"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Label
                        htmlFor="file"
                        className="cursor-pointer flex items-center justify-center p-4 gap-2 text-sm text-muted-foreground"
                      >
                        {selectedFile ? (
                          <>
                            <File className="h-5 w-5" />
                            <span className="font-medium">{selectedFile.name}</span>
                            <span className="text-xs">
                              ({Math.round(selectedFile.size / 1024)} KB)
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-2"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedFile(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <FileUp className="h-5 w-5" />
                            <span>Click to upload or drag and drop</span>
                          </>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 border rounded-md bg-muted/20">
              <File className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium mb-1">No documents yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload documents to provide more information about this project
              </p>
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(true)}
              >
                <FileUp className="mr-2 h-4 w-4" /> Upload First Document
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={fetchDocuments}>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          <p className="text-muted-foreground">No documents found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.document_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getDocumentTypeLabel(doc.document_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDocumentToDelete(doc);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentUploadManager;