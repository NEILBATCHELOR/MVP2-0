import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  Plus,
  File,
  Image as FileImage,
  FileText as FilePdf,
  Table as FileSpreadsheet,
  Code as FileCode,
  Loader2,
  Share2,
  Eye,
} from "lucide-react";
import { supabase } from "@/infrastructure/database/client";

interface Document {
  id: string;
  name: string;
  description?: string;
  category: string;
  file_path: string;
  file_url?: string;
  entity_id?: string;
  entity_type?: string;
  type?: string;
  metadata?: any;
  status: string;
  created_at?: string;
  updated_at?: string;
  uploaded_by: string;
  project_id: string;
  
  // Additional fields used in the UI
  file_type?: string;
  file_size?: number;
  uploaded_at?: string;
  investor_id?: string;
  tags?: string[];
}

interface DocumentManagerProps {
  projectId: string;
  investorId?: string;
}

const DocumentManager = ({ projectId, investorId }: DocumentManagerProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [documentCategory, setDocumentCategory] = useState("legal");
  const [documentTags, setDocumentTags] = useState("");
  const { toast } = useToast();

  // Fetch documents when component mounts
  useEffect(() => {
    fetchDocuments();
  }, [projectId, investorId, categoryFilter]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId);

      if (investorId) {
        query = (query as any).eq("investor_id", investorId);
      }

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query.order("updated_at", {
        ascending: false,
      });

      if (error) throw error;

      // Transform data to match our interface
      const transformedData = data.map((doc) => {
        // Use proper type assertion and null checking
        const metadata = doc.metadata as Record<string, any> | null;
        
        // Create a new document object with proper type safety
        const newDocument: Document = {
          id: doc.id,
          name: doc.name,
          description: metadata && typeof metadata.description === 'string' ? metadata.description : '',
          file_path: doc.file_path,
          file_url: doc.file_url || '',
          file_type: metadata && typeof metadata.fileType === 'string' ? metadata.fileType : '',
          file_size: metadata && typeof metadata.fileSize === 'number' ? metadata.fileSize : 0,
          category: doc.type || 'general',
          status: doc.status || 'active',
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          uploaded_by: doc.uploaded_by,
          entity_type: doc.entity_type,
          entity_id: doc.entity_id,
          project_id: doc.project_id,
          tags: metadata && Array.isArray(metadata.tags) 
            ? metadata.tags
            : metadata && typeof metadata.tags === 'string'
              ? metadata.tags.split(',').map(tag => tag.trim())
              : []
        };
        
        return newDocument;
      });

      setDocuments(transformedData);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      // Use file name as default document name if not set
      if (!documentName) {
        setDocumentName(file.name.split(".")[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // 1. Upload file to Supabase Storage
      const fileExt = uploadFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      // 2. Create document record in the database
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .insert({
          name: documentName || uploadFile.name,
          category: documentCategory,
          file_path: filePath,
          entity_id: investorId || "user",
          entity_type: investorId ? "investor" : "user",
          type: "document",
          project_id: projectId,
          status: "pending",
          uploaded_by: "current_user",
          metadata: {
            description: documentDescription,
            fileType: uploadFile.type,
            fileSize: uploadFile.size,
            tags: documentTags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          } as any
        })
        .select()
        .single();

      if (documentError) throw documentError;

      // 3. Transform the returned data to match our interface
      const newDocument: Document = {
        id: documentData.id,
        name: documentData.name,
        description: documentDescription,
        category: documentData.category || 'general',
        file_path: documentData.file_path,
        file_url: documentData.file_url || '',
        entity_id: documentData.entity_id,
        entity_type: documentData.entity_type,
        type: documentData.type || 'document',
        metadata: documentData.metadata,
        status: documentData.status || 'pending',
        created_at: documentData.created_at,
        updated_at: documentData.updated_at,
        uploaded_by: documentData.uploaded_by,
        project_id: documentData.project_id,
        file_type: uploadFile.type,
        file_size: uploadFile.size,
        uploaded_at: documentData.updated_at,
        investor_id: investorId,
        tags: documentTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      // 4. Update the UI
      setDocuments([newDocument, ...documents]);

      // 5. Reset form and close dialog
      setUploadFile(null);
      setDocumentName("");
      setDocumentDescription("");
      setDocumentCategory("legal");
      setDocumentTags("");
      setIsUploadDialogOpen(false);

      toast({
        title: "Success",
        description: "Document uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (error) throw error;

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.name;
      window.document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Document downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      // Find the document to get its file path
      const document = documents.find((doc) => doc.id === documentId);
      if (!document) return;

      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete the document record
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (dbError) throw dbError;

      // Update the UI
      setDocuments(documents.filter((doc) => doc.id !== documentId));

      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description &&
        doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.tags &&
        doc.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        )),
  );

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return <FileImage className="h-6 w-6" />;
    if (fileType.includes("pdf")) return <FilePdf className="h-6 w-6" />;
    if (fileType.includes("spreadsheet") || fileType.includes("excel"))
      return <FileSpreadsheet className="h-6 w-6" />;
    if (fileType.includes("code") || fileType.includes("json"))
      return <FileCode className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-muted-foreground">
            Manage project documents and investor agreements
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsUploadDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="legal">Legal Documents</SelectItem>
              <SelectItem value="financial">Financial Documents</SelectItem>
              <SelectItem value="agreement">Agreements</SelectItem>
              <SelectItem value="kyc">KYC Documents</SelectItem>
              <SelectItem value="other">Other Documents</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Export All</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="overflow-hidden">
              <div className="bg-muted/50 p-4 flex items-center justify-center h-32">
                {getFileIcon(document.file_type || "")}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg truncate">
                  {document.name}
                </CardTitle>
                <CardDescription className="truncate">
                  {document.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{document.category}</span>
                  <span>{formatFileSize(document.file_size || 0)}</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Uploaded on {formatDate(document.uploaded_at || "")}
                </div>
                {document.tags && document.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {document.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View</span>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDelete(document.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Documents Found</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-2 mb-4">
            {searchQuery
              ? "No documents match your search criteria. Try a different search term."
              : "Upload project documents such as term sheets, subscription agreements, and other legal documents."}
          </p>
          <Button
            onClick={() => setIsUploadDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        </div>
      )}

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document to the project repository.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">
                File
              </Label>
              <div className="col-span-3">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {uploadFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="col-span-3"
                placeholder="Document name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={documentCategory}
                onValueChange={setDocumentCategory}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legal">Legal Documents</SelectItem>
                  <SelectItem value="financial">Financial Documents</SelectItem>
                  <SelectItem value="agreement">Agreements</SelectItem>
                  <SelectItem value="kyc">KYC Documents</SelectItem>
                  <SelectItem value="other">Other Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                className="col-span-3"
                placeholder="Brief description of the document"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                Tags
              </Label>
              <Input
                id="tags"
                value={documentTags}
                onChange={(e) => setDocumentTags(e.target.value)}
                className="col-span-3"
                placeholder="Comma-separated tags (e.g., important, draft, final)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!uploadFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentManager;
