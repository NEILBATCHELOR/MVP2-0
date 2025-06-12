import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, File, FileText, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DocumentVerification as DocumentVerificationType } from '../../types';

interface DocumentVerificationProps {
  investorId: string;
  onVerificationUpdate: (verification: DocumentVerificationType) => void;
  existingDocuments?: DocumentVerificationType[];
}

type DocumentType = 'passport' | 'driving_license' | 'national_id' | 'utility_bill' | 'bank_statement' | 'proof_of_address' | 'other';

interface DocumentUpload {
  id: string;
  file: File;
  documentType: DocumentType;
  description: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'verified' | 'rejected';
  errorMessage?: string;
}

export const DocumentVerification: React.FC<DocumentVerificationProps> = ({
  investorId,
  onVerificationUpdate,
  existingDocuments = []
}) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [documentType, setDocumentType] = useState<DocumentType>('passport');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) return;

    const newUpload: DocumentUpload = {
      id: crypto.randomUUID(),
      file: selectedFile,
      documentType,
      description,
      uploadProgress: 0,
      status: 'uploading'
    };

    setUploads(prev => [...prev, newUpload]);
    setIsUploading(true);

    // Simulate upload progress
    const intervalId = setInterval(() => {
      setUploads(prev => {
        const updatedUploads = [...prev];
        const uploadIndex = updatedUploads.findIndex(u => u.id === newUpload.id);
        
        if (uploadIndex !== -1) {
          const upload = updatedUploads[uploadIndex];
          if (upload.uploadProgress < 100) {
            updatedUploads[uploadIndex] = {
              ...upload,
              uploadProgress: upload.uploadProgress + 10
            };
          } else {
            clearInterval(intervalId);
            updatedUploads[uploadIndex] = {
              ...upload,
              status: 'uploaded'
            };
            setIsUploading(false);
            
            // Create a document verification object
            const verification: DocumentVerificationType = {
              id: newUpload.id,
              documentType: newUpload.documentType,
              status: 'PENDING',
              verificationMethod: 'AUTOMATED',
              verificationDate: new Date()
            };
            
            onVerificationUpdate(verification);
          }
        }
        return updatedUploads;
      });
    }, 300);

    // Reset form
    setSelectedFile(null);
    setDescription('');
    setDocumentType('passport');
    
    // In a real implementation, you would upload the file to a server
    // and then update the database with the document information
    
    // const formData = new FormData();
    // formData.append('file', selectedFile);
    // formData.append('documentType', documentType);
    // formData.append('description', description);
    // formData.append('investorId', investorId);
    
    // const response = await fetch('/api/documents/upload', {
    //   method: 'POST',
    //   body: formData
    // });
    
    // const data = await response.json();
    // if (response.ok) {
    //   // Handle success
    // } else {
    //   // Handle error
    // }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Verification</CardTitle>
        <CardDescription>
          Upload and manage required identity and financial documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
            <TabsTrigger value="status">Verification Status</TabsTrigger>
            <TabsTrigger value="history">Document History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="document-type">Document Type</Label>
                <select 
                  id="document-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                >
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driver's License</option>
                  <option value="national_id">National ID Card</option>
                  <option value="utility_bill">Utility Bill</option>
                  <option value="bank_statement">Bank Statement</option>
                  <option value="proof_of_address">Proof of Address</option>
                  <option value="other">Other Document</option>
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter a description for this document"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="document-file">Upload Document</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="document-file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                  />
                  <Button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || isUploading}
                    size="sm"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>
              
              {uploads.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-medium">Recent Uploads</h4>
                  
                  <div className="space-y-2">
                    {uploads.map((upload) => (
                      <div key={upload.id} className="flex items-center p-2 border rounded-md">
                        <div className="mr-4">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {upload.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {upload.documentType.replace('_', ' ')} - {upload.description}
                          </p>
                          
                          {upload.status === 'uploading' && (
                            <div className="w-full mt-2">
                              <Progress value={upload.uploadProgress} className="h-1 w-full" />
                              <p className="text-xs text-muted-foreground mt-1">
                                Uploading: {upload.uploadProgress}%
                              </p>
                            </div>
                          )}
                          
                          {upload.status === 'uploaded' && (
                            <p className="text-xs text-green-600 mt-1 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Uploaded successfully - pending verification
                            </p>
                          )}
                          
                          {upload.status === 'rejected' && (
                            <p className="text-xs text-red-600 mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {upload.errorMessage || 'Upload failed'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="space-y-4">
            <div className="rounded-md border">
              <div className="p-4">
                <h3 className="text-lg font-medium">Document Requirements</h3>
                <p className="text-sm text-muted-foreground">
                  The following documents are required for compliance verification
                </p>
              </div>
              
              <div className="border-t divide-y">
                <DocumentStatusItem
                  title="Government ID"
                  description="Passport, Driver's License or National ID"
                  required={true}
                  status={existingDocuments.some(d => 
                    ['passport', 'driving_license', 'national_id'].includes(d.documentType) && 
                    d.status === 'VERIFIED'
                  ) ? 'verified' : 
                    existingDocuments.some(d => 
                      ['passport', 'driving_license', 'national_id'].includes(d.documentType) && 
                      d.status === 'PENDING'
                    ) ? 'pending' : 'required'}
                />
                
                <DocumentStatusItem
                  title="Proof of Address"
                  description="Utility bill or bank statement (less than 3 months old)"
                  required={true}
                  status={existingDocuments.some(d => 
                    ['utility_bill', 'bank_statement', 'proof_of_address'].includes(d.documentType) && 
                    d.status === 'VERIFIED'
                  ) ? 'verified' : 
                    existingDocuments.some(d => 
                      ['utility_bill', 'bank_statement', 'proof_of_address'].includes(d.documentType) && 
                      d.status === 'PENDING'
                    ) ? 'pending' : 'required'}
                />
                
                <DocumentStatusItem
                  title="Additional Documentation"
                  description="May be required based on investor profile"
                  required={false}
                  status={existingDocuments.some(d => 
                    d.documentType === 'other' && d.status === 'VERIFIED'
                  ) ? 'verified' : 
                    existingDocuments.some(d => 
                      d.documentType === 'other' && d.status === 'PENDING'
                    ) ? 'pending' : 'optional'}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <div className="rounded-md border">
              {existingDocuments.length > 0 ? (
                <div className="divide-y">
                  {existingDocuments.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-start space-x-4">
                      <div className="bg-muted rounded-md p-2">
                        <File className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {doc.documentType.replace('_', ' ')}
                          </p>
                          <DocumentStatusBadge status={doc.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {doc.verificationDate?.toLocaleDateString()}
                        </p>
                        {doc.verifiedBy && (
                          <p className="text-xs text-muted-foreground">
                            Verified by: {doc.verifiedBy}
                          </p>
                        )}
                        {doc.rejectionReason && (
                          <p className="text-xs text-red-600">
                            Reason: {doc.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <File className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-sm font-semibold">No documents uploaded</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload your documents to begin the verification process.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => setActiveTab('upload')}
                  >
                    Upload Documents
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface DocumentStatusItemProps {
  title: string;
  description: string;
  required: boolean;
  status: 'required' | 'pending' | 'verified' | 'rejected' | 'optional';
}

const DocumentStatusItem: React.FC<DocumentStatusItemProps> = ({
  title,
  description,
  required,
  status
}) => {
  return (
    <div className="flex items-start justify-between p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium flex items-center">
          {title}
          {required && (
            <span className="ml-2 text-xs text-red-600">Required</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <DocumentStatusBadge status={status} />
    </div>
  );
};

const DocumentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusDetails = () => {
    switch (status) {
      case 'PENDING':
      case 'pending':
        return {
          label: 'Pending Review',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'VERIFIED':
      case 'verified':
        return {
          label: 'Verified',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'REJECTED':
      case 'rejected':
        return {
          label: 'Rejected',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'required':
        return {
          label: 'Required',
          className: 'bg-red-50 text-red-700 border-red-100'
        };
      case 'optional':
        return {
          label: 'Optional',
          className: 'bg-gray-100 text-gray-700 border-gray-200'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-700 border-gray-200'
        };
    }
  };

  const { label, className } = getStatusDetails();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
};

export default DocumentVerification; 