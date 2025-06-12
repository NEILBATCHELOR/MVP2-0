import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, AlertCircle, Loader2 } from "lucide-react";
import { IssuerDocumentType } from "@/types/core/centralModels";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/infrastructure/database/client";

// Form schema for document upload
const documentUploadSchema = z.object({
  documentName: z.string().min(1, { message: "Document name is required" }),
  documentType: z.string().min(1, { message: "Document type is required" }),
  isPublic: z.boolean().default(false),
  file: z.custom<File>((val) => val instanceof File, { message: "File is required" })
    .refine(
      (file) => file instanceof File && file.size <= 10 * 1024 * 1024, // 10MB limit
      {
        message: "File must be less than 10MB",
      }
    ),
});

type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>;

interface IssuerDocumentUploadProps {
  projectId: string;
  onDocumentUploaded?: () => void;
  documentType?: IssuerDocumentType;
  title?: string;
  description?: string;
}

const IssuerDocumentUpload = ({
  projectId,
  onDocumentUploaded,
  documentType,
  title = "Upload Document",
  description = "Upload a document related to this project",
}: IssuerDocumentUploadProps) => {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      documentName: "",
      documentType: documentType || "",
      isPublic: false,
    },
  });

  // Handle file upload to Supabase Storage
  const handleFileUpload = async (formData: DocumentUploadFormValues) => {
    setIsUploading(true);
    setError(null);

    try {
      const file = formData.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}_${formData.documentType}_${Date.now()}.${fileExt}`;
      const filePath = `projects/${projectId}/documents/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);

      // Create record in issuer_detail_documents table
      const { error: dbError } = await supabase
        .from('issuer_detail_documents')
        .insert({
          project_id: projectId,
          document_type: formData.documentType,
          document_name: formData.documentName,
          document_url: urlData.publicUrl,
          status: 'active',
          is_public: formData.isPublic,
          metadata: { original_filename: file.name }
        });

      if (dbError) throw dbError;

      // Success - close dialog and notify parent
      setOpen(false);
      if (onDocumentUploaded) onDocumentUploaded();
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
      console.error("Document upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Map document types from enum to display options
  const documentTypes = Object.entries(IssuerDocumentType).map(([key, value]) => ({
    value,
    label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span>Upload Document</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFileUpload)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="documentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter document name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for the document
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Investor Visibility</FormLabel>
                    <FormDescription>
                      Make this document visible to investors in the investor portal
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!documentType}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>

                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of document being uploaded
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      {...field}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onChange(file);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a file (PDF, Word document, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default IssuerDocumentUpload;

// Pre-configured document upload buttons for specific document types
export const IssuerCreditworthinessUpload = (props: Omit<IssuerDocumentUploadProps, 'documentType' | 'title' | 'description'>) => (
  <IssuerDocumentUpload
    {...props}
    documentType={IssuerDocumentType.ISSUER_CREDITWORTHINESS}
    title="Upload Issuer Creditworthiness"
    description="Upload documents related to the issuer's creditworthiness, such as credit ratings from agencies like Moody's, S&P, or Fitch."
  />
);

export const ProjectSecurityTypeUpload = (props: Omit<IssuerDocumentUploadProps, 'documentType' | 'title' | 'description'>) => (
  <IssuerDocumentUpload
    {...props}
    documentType={IssuerDocumentType.PROJECT_SECURITY_TYPE}
    title="Upload Project/Security Type"
    description="Upload documents related to the project or security type (e.g., bond type, stock class)."
  />
);

export const OfferingDetailsUpload = (props: Omit<IssuerDocumentUploadProps, 'documentType' | 'title' | 'description'>) => (
  <IssuerDocumentUpload
    {...props}
    documentType={IssuerDocumentType.OFFERING_DETAILS}
    title="Upload Prospectus Details"
    description="Upload prospectus and detailed information about the offering."
  />
);

export const TermSheetUpload = (props: Omit<IssuerDocumentUploadProps, 'documentType' | 'title' | 'description'>) => (
  <IssuerDocumentUpload
    {...props}
    documentType={IssuerDocumentType.TERM_SHEET}
    title="Upload Term Sheet"
    description="Upload the term sheet for this project."
  />
);

export const SpecialRightsUpload = (props: Omit<IssuerDocumentUploadProps, 'documentType' | 'title' | 'description'>) => (
  <IssuerDocumentUpload
    {...props}
    documentType={IssuerDocumentType.SPECIAL_RIGHTS}
    title="Upload Special Rights"
    description="Upload documents related to special rights, such as voting rights or dividend preferences."
  />
);

export const UnderwritersUpload = (props: Omit<IssuerDocumentUploadProps, 'documentType' | 'title' | 'description'>) => (
  <IssuerDocumentUpload
    {...props}
    documentType={IssuerDocumentType.UNDERWRITERS}
    title="Upload Underwriters"
    description="Upload documents related to the financial institutions or investment banks managing the issuance."
  />
);

export const UseProceedsUpload = (props: Omit<IssuerDocumentUploadProps, 'documentType' | 'title' | 'description'>) => (
  <IssuerDocumentUpload
    {...props}
    documentType={IssuerDocumentType.USE_OF_PROCEEDS}
    title="Upload Use of Proceeds"
    description="Upload documents describing how the issuer intends to use the funds from this offering."
  />
);

export const FinancialHighlightsUpload = (props: Omit<IssuerDocumentUploadProps, 'documentType' | 'title' | 'description'>) => (
  <IssuerDocumentUpload
    {...props}
    documentType={IssuerDocumentType.FINANCIAL_HIGHLIGHTS}
    title="Upload Financial Highlights"
    description="Upload documents related to key financial data, such as historical revenue, earnings, and growth projections."
  />
);

export const TimingUpload = (props: Omit<IssuerDocumentUploadProps, 'documentType' | 'title' | 'description'>) => (
  <IssuerDocumentUpload
    {...props}
    documentType={IssuerDocumentType.TIMING}
    title="Upload Timing Documents"
    description="Upload documents related to critical dates such as the launch date, redemption windows, and settlement date."
  />
);

export const RiskFactorsUpload = (props: Omit<IssuerDocumentUploadProps, 'documentType' | 'title' | 'description'>) => (
  <IssuerDocumentUpload
    {...props}
    documentType={IssuerDocumentType.RISK_FACTORS}
    title="Upload Risk Factors"
    description="Upload documents related to significant risks for the issuer or security."
  />
);

export const LegalRegulatoryComplianceUpload = (props: Omit<IssuerDocumentUploadProps, 'documentType' | 'title' | 'description'>) => (
  <IssuerDocumentUpload
    {...props}
    documentType={IssuerDocumentType.LEGAL_REGULATORY_COMPLIANCE}
    title="Upload Legal and Regulatory Compliance Documents"
    description="Upload documents pertaining to legal and regulatory compliance agreements and requirements."
  />
);