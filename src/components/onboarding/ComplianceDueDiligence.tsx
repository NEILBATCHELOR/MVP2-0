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
import {
  FileUp,
  AlertCircle,
  Shield,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OwnerInfo {
  id: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: string;
  documentUploaded: boolean;
}

const ComplianceDueDiligence = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("owners");
  const [riskScore, setRiskScore] = useState<"low" | "medium" | "high">(
    "medium",
  );

  const [owners, setOwners] = useState<OwnerInfo[]>([
    {
      id: "1",
      fullName: "John Smith",
      dateOfBirth: "1980-05-15",
      nationality: "United States",
      documentType: "passport",
      documentUploaded: true,
    },
  ]);

  const [newOwner, setNewOwner] = useState<
    Omit<OwnerInfo, "id" | "documentUploaded">
  >({
    fullName: "",
    dateOfBirth: "",
    nationality: "",
    documentType: "passport",
  });

  const [formData, setFormData] = useState({
    jurisdiction: "",
    riskDisclosure: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
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

  const handleNewOwnerChange = (
    field: keyof typeof newOwner,
    value: string,
  ) => {
    setNewOwner({ ...newOwner, [field]: value });
  };

  const handleAddOwner = () => {
    if (!newOwner.fullName || !newOwner.dateOfBirth || !newOwner.nationality) {
      setErrors({
        ...errors,
        newOwner: "Please fill in all owner information fields",
      });
      return;
    }

    const newId = (owners.length + 1).toString();
    setOwners([...owners, { ...newOwner, id: newId, documentUploaded: false }]);

    // Reset form
    setNewOwner({
      fullName: "",
      dateOfBirth: "",
      nationality: "",
      documentType: "passport",
    });

    setErrors({ ...errors, newOwner: "" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleOwnerSelect = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
  };

  const handleFileUpload = () => {
    if (!selectedFile || !selectedOwnerId) return;

    // Mock file upload
    const updatedOwners = owners.map((owner) => {
      if (owner.id === selectedOwnerId) {
        return { ...owner, documentUploaded: true };
      }
      return owner;
    });

    setOwners(updatedOwners);
    setSelectedFile(null);
    setSelectedOwnerId(null);

    // Reset file input
    const fileInput = document.getElementById(
      "document-upload",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.jurisdiction) {
      newErrors.jurisdiction = "Jurisdiction is required";
    }

    // Check if all owners have documents uploaded
    const missingDocuments = owners.some((owner) => !owner.documentUploaded);
    if (missingDocuments) {
      newErrors.documents =
        "Please upload identification documents for all owners";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Proceed to next step
      navigate("/onboarding/wallet-setup");
    }
  };

  // Dynamically calculate risk score based on form data
  React.useEffect(() => {
    // This is a simplified risk calculation logic
    // In a real application, this would be more complex
    let calculatedRisk: "low" | "medium" | "high" = "low";

    // High-risk jurisdictions
    const highRiskJurisdictions = [
      "cayman_islands",
      "british_virgin_islands",
      "bahamas",
    ];
    if (highRiskJurisdictions.includes(formData.jurisdiction)) {
      calculatedRisk = "high";
    }

    // Medium-risk factors
    if (owners.length > 3 || formData.riskDisclosure.length < 50) {
      calculatedRisk = calculatedRisk === "high" ? "high" : "medium";
    }

    setRiskScore(calculatedRisk);
  }, [formData, owners]);

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={6}
      title="Compliance & Due Diligence"
      description="Provide regulatory compliance information and complete due diligence requirements"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="owners">Business Owners & UBO</TabsTrigger>
            <TabsTrigger value="regulatory">Regulatory Information</TabsTrigger>
          </TabsList>

          <TabsContent value="owners" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Business Owners & Ultimate Beneficial Owners
              </h3>

              {errors.documents && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.documents}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 mb-6">
                {owners.map((owner) => (
                  <div
                    key={owner.id}
                    className={`border rounded-md p-4 cursor-pointer transition-colors ${selectedOwnerId === owner.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}
                    onClick={() => handleOwnerSelect(owner.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{owner.fullName}</p>
                        <div className="grid grid-cols-2 gap-x-4 text-sm text-gray-500 mt-1">
                          <p>DOB: {owner.dateOfBirth}</p>
                          <p>Nationality: {owner.nationality}</p>
                          <p>
                            Document:{" "}
                            {owner.documentType.charAt(0).toUpperCase() +
                              owner.documentType.slice(1)}
                          </p>
                          <p>
                            Status:{" "}
                            {owner.documentUploaded ? (
                              <span className="text-green-600 font-medium">
                                Uploaded
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium">
                                Not Uploaded
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {owner.documentUploaded ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add New Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={newOwner.fullName}
                        onChange={(e) =>
                          handleNewOwnerChange("fullName", e.target.value)
                        }
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newOwner.dateOfBirth}
                        onChange={(e) =>
                          handleNewOwnerChange("dateOfBirth", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="nationality">Nationality</Label>
                      <Select
                        value={newOwner.nationality}
                        onValueChange={(value) =>
                          handleNewOwnerChange("nationality", value)
                        }
                      >
                        <SelectTrigger id="nationality">
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="United States">
                            United States
                          </SelectItem>
                          <SelectItem value="United Kingdom">
                            United Kingdom
                          </SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="Singapore">Singapore</SelectItem>
                          <SelectItem value="Switzerland">
                            Switzerland
                          </SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="documentType">ID Document Type</Label>
                      <Select
                        value={newOwner.documentType}
                        onValueChange={(value) =>
                          handleNewOwnerChange("documentType", value)
                        }
                      >
                        <SelectTrigger id="documentType">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="drivers_license">
                            Driver's License
                          </SelectItem>
                          <SelectItem value="national_id">
                            National ID
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {errors.newOwner && (
                    <p className="text-red-500 text-sm mt-3">
                      {errors.newOwner}
                    </p>
                  )}

                  <Button
                    type="button"
                    onClick={handleAddOwner}
                    className="w-full mt-4"
                  >
                    Add Owner
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4">
                    <FileUp className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedOwnerId
                        ? `Upload ID document for: ${owners.find((o) => o.id === selectedOwnerId)?.fullName}`
                        : "Select an owner first"}
                    </p>
                    <Input
                      id="document-upload"
                      type="file"
                      onChange={handleFileChange}
                      className="max-w-xs"
                      disabled={!selectedOwnerId}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Accepted formats: PDF, JPG, PNG
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={!selectedFile || !selectedOwnerId}
                    className="w-full"
                  >
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="regulatory" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Regulatory Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label htmlFor="jurisdiction">Regulatory Jurisdiction</Label>
                  <Select
                    value={formData.jurisdiction}
                    onValueChange={(value) =>
                      handleSelectChange("jurisdiction", value)
                    }
                  >
                    <SelectTrigger
                      id="jurisdiction"
                      className={errors.jurisdiction ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="united_states">
                        United States
                      </SelectItem>
                      <SelectItem value="united_kingdom">
                        United Kingdom
                      </SelectItem>
                      <SelectItem value="european_union">
                        European Union
                      </SelectItem>
                      <SelectItem value="singapore">Singapore</SelectItem>
                      <SelectItem value="hong_kong">Hong Kong</SelectItem>
                      <SelectItem value="cayman_islands">
                        Cayman Islands
                      </SelectItem>
                      <SelectItem value="british_virgin_islands">
                        British Virgin Islands
                      </SelectItem>
                      <SelectItem value="bahamas">Bahamas</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.jurisdiction && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.jurisdiction}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <Card className="w-full h-full flex flex-col justify-center p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${riskScore === "low" ? "bg-green-100" : riskScore === "medium" ? "bg-yellow-100" : "bg-red-100"}`}
                      >
                        <Shield
                          className={`h-6 w-6 ${riskScore === "low" ? "text-green-600" : riskScore === "medium" ? "text-yellow-600" : "text-red-600"}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">
                          Issuer Risk Classification
                        </p>
                        <p
                          className={`text-sm font-semibold ${riskScore === "low" ? "text-green-600" : riskScore === "medium" ? "text-yellow-600" : "text-red-600"}`}
                        >
                          {riskScore === "low"
                            ? "Low Risk"
                            : riskScore === "medium"
                              ? "Medium Risk"
                              : "High Risk"}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {riskScore === "high" && (
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your issuer has been classified as high risk. Additional
                    compliance documentation and multi-signature approval will
                    be required.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="riskDisclosure">
                    SPV Risk Disclosure Statement
                  </Label>
                  <Textarea
                    id="riskDisclosure"
                    name="riskDisclosure"
                    value={formData.riskDisclosure}
                    onChange={handleChange}
                    placeholder="Provide a comprehensive risk disclosure statement for your SPV..."
                    rows={6}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Provide a detailed statement outlining the risks associated
                    with your SPV. This will be shared with potential investors.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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

export default ComplianceDueDiligence;
