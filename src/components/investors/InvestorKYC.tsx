import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, FileUp, CheckCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DocumentChecklist, {
  DocumentItem,
} from "@/components/shared/DocumentChecklist";
import { getDocumentTemplates, uploadDocument } from "@/services/document/documentStorage";
import { useToast } from "@/components/ui/use-toast";

const InvestorKYC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [sourceOfWealth, setSourceOfWealth] = useState("");
  const [sourceOfWealthDescription, setSourceOfWealthDescription] =
    useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [riskScore, setRiskScore] = useState<"low" | "medium" | "high">("low");

  // Load document templates on component mount
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would fetch documents from the API
        // For now, we'll use the templates
        const documentTemplates = getDocumentTemplates("investor");

        // Convert to DocumentItem format
        const documentItems: DocumentItem[] = documentTemplates.map((doc) => ({
          id: doc.id,
          name: doc.name,
          status:
            doc.status === "not_uploaded"
              ? "not_uploaded"
              : doc.status === "pending"
                ? "pending"
                : doc.status === "approved"
                  ? "verified"
                  : "rejected",
          required: doc.required,
          description: doc.description,
        }));

        setDocuments(documentItems);
      } catch (error) {
        console.error("Error loading documents:", error);
        toast({
          title: "Error loading documents",
          description:
            "There was a problem loading your documents. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedDocumentId) return;

    try {
      // In a real app, this would upload to Supabase storage
      // For now, we'll just update the local state
      const selectedDoc = documents.find(
        (doc) => doc.id === selectedDocumentId,
      );
      if (!selectedDoc) return;

      // Mock upload
      // In a real app, you would call uploadDocument from documentStorage.ts
      // const updatedDoc = await uploadDocument(selectedFile, {...}, userId, organizationId);

      // Update documents state
      const updatedDocuments = documents.map((doc) => {
        if (doc.id === selectedDocumentId) {
          return { ...doc, status: "pending" as const };
        }
        return doc;
      });

      setDocuments(updatedDocuments);
      setSelectedFile(null);
      setSelectedDocumentId(null);

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded and is pending review.",
      });

      // Reset file input
      const fileInput = document.getElementById(
        "document-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description:
          "There was a problem uploading your document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Check if required documents are uploaded
    const requiredDocuments = documents.filter((doc) => doc.required);
    const missingDocuments = requiredDocuments.filter(
      (doc) => doc.status === "not_uploaded",
    );

    if (missingDocuments.length > 0) {
      newErrors.documents = "Please upload all required documents";
    }

    if (!sourceOfWealth) {
      newErrors.sourceOfWealth = "Source of wealth is required";
    }

    if (!sourceOfWealthDescription) {
      newErrors.sourceOfWealthDescription =
        "Please provide a description of your source of wealth";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Proceed to next step (wallet setup)
      navigate("/investor/wallet-setup");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Guardian SPV</h1>
          </div>
          <div className="text-sm text-gray-500">
            Need help?{" "}
            <a href="#" className="text-primary">
              Contact support
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">KYC & AML Verification</h1>
            <span className="text-sm font-medium text-gray-500">
              Step 4 of 4
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Complete your Know Your Customer (KYC) and Anti-Money Laundering
            (AML) verification
          </p>
          <Progress value={100} className="h-2" />
        </div>

        <Card className="bg-white rounded-lg shadow-sm mb-6">
          <CardHeader>
            <CardTitle>Document Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.documents && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.documents}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <DocumentChecklist
                  documents={documents}
                  userType="investor"
                  onSelectDocument={handleDocumentSelect}
                  selectedDocumentId={selectedDocumentId}
                />
              )}

              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4">
                    <FileUp className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedDocumentId
                        ? `Upload document: ${documents.find((d) => d.id === selectedDocumentId)?.name}`
                        : "Select a document type first"}
                    </p>
                    <Input
                      id="document-upload"
                      type="file"
                      onChange={handleFileChange}
                      className="max-w-xs"
                      disabled={!selectedDocumentId}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Accepted formats: PDF, JPG, PNG
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={!selectedFile || !selectedDocumentId}
                    className="w-full"
                  >
                    Upload Document
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-medium">
                  Source of Wealth Declaration
                </h3>
                <div>
                  <Label htmlFor="sourceOfWealth">
                    Primary Source of Wealth
                  </Label>
                  <Select
                    value={sourceOfWealth}
                    onValueChange={setSourceOfWealth}
                  >
                    <SelectTrigger
                      id="sourceOfWealth"
                      className={errors.sourceOfWealth ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select source of wealth" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employment">
                        Employment Income
                      </SelectItem>
                      <SelectItem value="business">
                        Business Ownership
                      </SelectItem>
                      <SelectItem value="investments">
                        Investment Returns
                      </SelectItem>
                      <SelectItem value="inheritance">Inheritance</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sourceOfWealth && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.sourceOfWealth}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sourceOfWealthDescription">
                    Detailed Description
                  </Label>
                  <Textarea
                    id="sourceOfWealthDescription"
                    value={sourceOfWealthDescription}
                    onChange={(e) =>
                      setSourceOfWealthDescription(e.target.value)
                    }
                    placeholder="Please provide details about your source of wealth..."
                    rows={4}
                    className={
                      errors.sourceOfWealthDescription ? "border-red-500" : ""
                    }
                  />
                  {errors.sourceOfWealthDescription && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.sourceOfWealthDescription}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">
                      Investor Risk Scorecard
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Based on your profile and documentation, your investor
                      risk level is:{" "}
                      <span className="font-semibold">Low Risk</span>
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                      Your application will be automatically approved after
                      compliance review.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/investor/profile")}
                >
                  Back
                </Button>
                <Button type="submit" size="lg">
                  Submit for Verification
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Guardian SPV. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default InvestorKYC;
