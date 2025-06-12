import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import OnboardingLayout from "./OnboardingLayout";
import { FileUp, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import CountrySelector from "@/components/shared/CountrySelector";

interface DocumentStatus {
  id: string;
  name: string;
  status: "pending" | "verified" | "rejected" | "not_uploaded";
  message?: string;
}

const OrganizationDetails = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    legalName: "",
    registrationNumber: "",
    businessType: "",
    regulatedStatus: "",
    entityStructure: "",
    issuerType: "",
    governanceModel: "",
    externalRepresentatives: "",
    country: "",
  });

  const [documents, setDocuments] = useState<DocumentStatus[]>([
    {
      id: "incorporation",
      name: "Certificate of Incorporation",
      status: "not_uploaded",
    },
    { id: "articles", name: "Articles of Association", status: "not_uploaded" },
    { id: "directors", name: "List of Directors", status: "not_uploaded" },
    {
      id: "shareholders",
      name: "Shareholder Register",
      status: "not_uploaded",
    },
    {
      id: "financial",
      name: "Latest Financial Statements",
      status: "not_uploaded",
    },
    {
      id: "regulatory",
      name: "Regulatory Status Documentation",
      status: "not_uploaded",
    },
  ]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });

    // Clear error when user selects
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
  };

  const handleFileUpload = () => {
    if (!selectedFile || !selectedDocumentId) return;

    // Mock file upload
    const updatedDocuments = documents.map((doc) => {
      if (doc.id === selectedDocumentId) {
        return { ...doc, status: "pending" as const };
      }
      return doc;
    });

    setDocuments(updatedDocuments);
    setSelectedFile(null);
    setSelectedDocumentId(null);

    // Reset file input
    const fileInput = document.getElementById(
      "document-upload",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.legalName.trim()) {
      newErrors.legalName = "Legal name is required";
    }

    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = "Registration number is required";
    }

    if (!formData.businessType) {
      newErrors.businessType = "Business type is required";
    }

    if (!formData.regulatedStatus) {
      newErrors.regulatedStatus = "Regulated status is required";
    }

    if (!formData.entityStructure) {
      newErrors.entityStructure = "Entity structure is required";
    }

    if (!formData.country) {
      newErrors.country = "Country of registration is required";
    }

    // Check if required documents are uploaded
    const requiredDocuments = ["incorporation", "articles", "directors"];
    const missingDocuments = requiredDocuments.filter((docId) => {
      const doc = documents.find((d) => d.id === docId);
      return doc && doc.status === "not_uploaded";
    });

    if (missingDocuments.length > 0) {
      newErrors.documents = "Please upload all required documents";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Proceed to next step
      navigate("/onboarding/compliance");
    }
  };

  const getDocumentStatusIcon = (status: DocumentStatus["status"]) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "not_uploaded":
        return <FileUp className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={6}
      title="Organization Details & Legal Setup"
      description="Provide essential information about your organization and upload required documents"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Organization Details Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Organization Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="legalName">Company Legal Name</Label>
              <Input
                id="legalName"
                name="legalName"
                value={formData.legalName}
                onChange={handleChange}
                placeholder="Enter legal name"
                className={errors.legalName ? "border-red-500" : ""}
              />
              {errors.legalName && (
                <p className="text-red-500 text-sm mt-1">{errors.legalName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="Enter registration number"
                className={errors.registrationNumber ? "border-red-500" : ""}
              />
              {errors.registrationNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.registrationNumber}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                value={formData.businessType}
                onValueChange={(value) =>
                  handleSelectChange("businessType", value)
                }
              >
                <SelectTrigger
                  id="businessType"
                  className={errors.businessType ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fund">Fund</SelectItem>
                  <SelectItem value="spv">SPV</SelectItem>
                  <SelectItem value="asset_manager">Asset Manager</SelectItem>
                  <SelectItem value="investment_manager">
                    Investment Manager
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.businessType && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.businessType}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="regulatedStatus">Regulatory Status</Label>
              <Select
                value={formData.regulatedStatus}
                onValueChange={(value) =>
                  handleSelectChange("regulatedStatus", value)
                }
              >
                <SelectTrigger
                  id="regulatedStatus"
                  className={errors.regulatedStatus ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select regulatory status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regulated">Regulated</SelectItem>
                  <SelectItem value="unregulated">Unregulated</SelectItem>
                </SelectContent>
              </Select>
              {errors.regulatedStatus && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.regulatedStatus}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="entityStructure">Legal Entity Structure</Label>
              <Select
                value={formData.entityStructure}
                onValueChange={(value) =>
                  handleSelectChange("entityStructure", value)
                }
              >
                <SelectTrigger
                  id="entityStructure"
                  className={errors.entityStructure ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select entity structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sole_proprietor">
                    Sole Proprietor
                  </SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="corporation">Corporation</SelectItem>
                  <SelectItem value="trust">Trust</SelectItem>
                  <SelectItem value="fund">Fund</SelectItem>
                </SelectContent>
              </Select>
              {errors.entityStructure && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.entityStructure}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="country">Country of Registration</Label>
              <CountrySelector
                id="country"
                value={formData.country}
                onValueChange={(value) => handleSelectChange("country", value)}
                error={errors.country}
                required
              />
            </div>

            <div>
              <Label htmlFor="issuerType">Issuer Type</Label>
              <Select
                value={formData.issuerType}
                onValueChange={(value) =>
                  handleSelectChange("issuerType", value)
                }
              >
                <SelectTrigger id="issuerType">
                  <SelectValue placeholder="Select issuer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">
                    Traditional Financial Entity
                  </SelectItem>
                  <SelectItem value="digital">Digital Asset Issuer</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="governanceModel">Governance Model</Label>
              <Select
                value={formData.governanceModel}
                onValueChange={(value) =>
                  handleSelectChange("governanceModel", value)
                }
              >
                <SelectTrigger id="governanceModel">
                  <SelectValue placeholder="Select governance model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="board">Board-Managed</SelectItem>
                  <SelectItem value="trustee">Trustee-Managed</SelectItem>
                  <SelectItem value="decentralized">
                    Decentralized Governance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="externalRepresentatives">
                External Trustees, Administrators, or Legal Representatives
              </Label>
              <Textarea
                id="externalRepresentatives"
                name="externalRepresentatives"
                value={formData.externalRepresentatives}
                onChange={handleChange}
                placeholder="List any external trustees, administrators, or legal representatives"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Document Upload Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Document Upload</h3>

          {errors.documents && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.documents}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`border rounded-md p-4 cursor-pointer transition-colors ${selectedDocumentId === doc.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}
                onClick={() => handleDocumentSelect(doc.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getDocumentStatusIcon(doc.status)}
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {doc.status === "verified" && "Verified"}
                        {doc.status === "rejected" &&
                          "Rejected - Please reupload"}
                        {doc.status === "pending" && "Pending verification"}
                        {doc.status === "not_uploaded" && "Not uploaded"}
                      </p>
                    </div>
                  </div>
                  {doc.id === "incorporation" ||
                  doc.id === "articles" ||
                  doc.id === "directors" ? (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Required
                    </span>
                  ) : null}
                </div>
                {doc.status === "rejected" && doc.message && (
                  <div className="mt-2 p-2 bg-red-50 text-sm text-red-700 rounded">
                    {doc.message}
                  </div>
                )}
              </div>
            ))}
          </div>

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
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button type="button" variant="outline">
            Save & Exit
          </Button>
          <Button type="submit" size="lg">
            Continue
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default OrganizationDetails;
