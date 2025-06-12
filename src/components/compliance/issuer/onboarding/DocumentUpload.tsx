import React, { useState, useRef } from "react";
import { useIssuerOnboarding } from "./IssuerOnboardingContext";

// Import Shadcn/UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// Import Lucide icons to replace MUI icons
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  CloudUpload 
} from "lucide-react";

const DocumentUpload: React.FC = () => {
  const { state, uploadDocument, nextStep, prevStep } = useIssuerOnboarding();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && selectedDocumentId) {
      uploadDocument(selectedDocumentId, files[0]);
      setSelectedDocumentId(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploaded":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Uploaded
          </Badge>
        );
      case "pending_review":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Pending Review
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Verified
          </Badge>
        );
      default:
        return <Badge variant="outline">Not Uploaded</Badge>;
    }
  };

  const requiredDocsUploaded = state.documents
    .filter(doc => doc.required)
    .every(doc => doc.status !== "not_uploaded");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Document Upload</h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Provide essential information about your organization and upload required documents
        </p>

        {!requiredDocsUploaded && (
          <Alert variant="default" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please upload all required documents to proceed.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="h-full">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Certificate of Incorporation</h3>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="destructive" className="font-normal">Required</Badge>
              {getStatusBadge(state.documents.find(d => d.id === "cert-incorp")?.status || "not_uploaded")}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Official document confirming the company's legal formation
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleDocumentSelect("cert-incorp")}
            >
              <CloudUpload className="h-4 w-4 mr-2" />
              {state.documents.find(d => d.id === "cert-incorp")?.status === "not_uploaded" ? "Upload Document" : "Replace Document"}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Articles of Association</h3>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="destructive" className="font-normal">Required</Badge>
              {getStatusBadge(state.documents.find(d => d.id === "articles")?.status || "not_uploaded")}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Document outlining the company's rules and regulations
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleDocumentSelect("articles")}
            >
              <CloudUpload className="h-4 w-4 mr-2" />
              {state.documents.find(d => d.id === "articles")?.status === "not_uploaded" ? "Upload Document" : "Replace Document"}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">List of Directors</h3>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="destructive" className="font-normal">Required</Badge>
              {getStatusBadge(state.documents.find(d => d.id === "directors")?.status || "not_uploaded")}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Official register of all company directors
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleDocumentSelect("directors")}
            >
              <CloudUpload className="h-4 w-4 mr-2" />
              {state.documents.find(d => d.id === "directors")?.status === "not_uploaded" ? "Upload Document" : "Replace Document"}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Shareholder Register</h3>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="destructive" className="font-normal">Required</Badge>
              {getStatusBadge(state.documents.find(d => d.id === "shareholders")?.status || "not_uploaded")}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Official register of all company shareholders
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleDocumentSelect("shareholders")}
            >
              <CloudUpload className="h-4 w-4 mr-2" />
              {state.documents.find(d => d.id === "shareholders")?.status === "not_uploaded" ? "Upload Document" : "Replace Document"}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Latest Financial Statements</h3>
            <div className="flex items-center gap-2 mb-3">
              {getStatusBadge(state.documents.find(d => d.id === "financial")?.status || "not_uploaded")}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Recent financial reports (balance sheet, income statement, etc.)
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleDocumentSelect("financial")}
            >
              <CloudUpload className="h-4 w-4 mr-2" />
              {state.documents.find(d => d.id === "financial")?.status === "not_uploaded" ? "Upload Document" : "Replace Document"}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Regulatory Status Documentation</h3>
            <div className="flex items-center gap-2 mb-3">
              {getStatusBadge(state.documents.find(d => d.id === "regulatory")?.status || "not_uploaded")}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Documentation confirming regulatory status or exemptions
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleDocumentSelect("regulatory")}
            >
              <CloudUpload className="h-4 w-4 mr-2" />
              {state.documents.find(d => d.id === "regulatory")?.status === "not_uploaded" ? "Upload Document" : "Replace Document"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gray-50 p-6 rounded-md mt-8">
        <div className="flex items-center mb-3">
          <Upload className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold">Document Upload Area</h3>
        </div>
        
        <p className="text-sm text-gray-500 mb-3">
          Select a document type first
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center bg-white">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.png"
          />
          <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-base mb-1">No file selected</p>
          <p className="text-sm text-gray-500">
            Accepted formats: PDF, JPG, PNG
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          className="py-6 px-8"
        >
          Save & Exit
        </Button>
        <Button
          onClick={nextStep}
          disabled={!requiredDocsUploaded}
          className="py-6 px-8 font-semibold"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default DocumentUpload;