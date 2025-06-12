import React, { useState, useRef } from "react";
import { useIssuerOnboarding } from "./IssuerOnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils";
import { FileText, Upload, Check } from "lucide-react";
import { regionCountries } from "@/utils/compliance/countries";

const BUSINESS_TYPES = [
  { value: "corporation", label: "Corporation" },
  { value: "llc", label: "Limited Liability Company (LLC)" },
  { value: "partnership", label: "Partnership" },
  { value: "trust", label: "Trust" },
  { value: "foundation", label: "Foundation" },
];

const ENTITY_STRUCTURES = [
  { value: "single_entity", label: "Single Entity" },
  { value: "holding_company", label: "Holding Company" },
  { value: "subsidiary", label: "Subsidiary" },
  { value: "spv", label: "Special Purpose Vehicle (SPV)" },
  { value: "joint_venture", label: "Joint Venture" },
];

const REGULATORY_STATUSES = [
  { value: "regulated", label: "Regulated" },
  { value: "unregulated", label: "Unregulated" },
  { value: "exempt", label: "Exempt" },
  { value: "pending", label: "Pending Approval" },
];

const ISSUER_TYPES = [
  { value: "corporate", label: "Corporate Issuer" },
  { value: "government", label: "Government/Municipal" },
  { value: "fund", label: "Investment Fund" },
  { value: "spv", label: "Special Purpose Vehicle" },
  { value: "reit", label: "Real Estate Investment Trust" },
];

const GOVERNANCE_MODELS = [
  { value: "board", label: "Board of Directors" },
  { value: "manager_managed", label: "Manager Managed" },
  { value: "member_managed", label: "Member Managed" },
  { value: "trustee", label: "Trustee" },
];

const OrganizationDetails: React.FC = () => {
  const { state, updateOrganization, uploadDocument, nextStep, prevStep, isDevelopmentMode } = useIssuerOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter regions and countries based on search query
  const filteredRegions = countrySearchQuery 
    ? regionCountries.map(region => ({
        ...region,
        countries: region.countries.filter(country => 
          country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()))
      })).filter(region => region.countries.length > 0)
    : regionCountries;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Skip validation in development mode
    if (isDevelopmentMode) {
      // Set default values if fields are empty
      const defaults = {
        legalName: state.organization.legalName || "Acme Capital SPV, LLC",
        registrationNumber: state.organization.registrationNumber || "LLC-12345-67890",
        businessType: state.organization.businessType || "llc",
        regulatoryStatus: state.organization.regulatoryStatus || "regulated",
        entityStructure: state.organization.entityStructure || "single_entity",
        countryJurisdiction: state.organization.countryJurisdiction || "us",
        issuerType: state.organization.issuerType || "spv",
        governanceModel: state.organization.governanceModel || "board",
        externalTrustees: state.organization.externalTrustees || "",
      };
      
      updateOrganization(defaults);
      nextStep();
      return;
    }
    
    // Regular form validation
    const newErrors: Record<string, string> = {};
    
    if (!state.organization.legalName) {
      newErrors.legalName = "Legal name is required";
    }
    
    if (!state.organization.registrationNumber) {
      newErrors.registrationNumber = "Registration number is required";
    }
    
    if (!state.organization.businessType) {
      newErrors.businessType = "Business type is required";
    }
    
    if (!state.organization.regulatoryStatus) {
      newErrors.regulatoryStatus = "Regulatory status is required";
    }
    
    if (!state.organization.entityStructure) {
      newErrors.entityStructure = "Entity structure is required";
    }
    
    if (!state.organization.countryJurisdiction) {
      newErrors.countryJurisdiction = "Country of registration is required";
    }
    
    if (!state.organization.issuerType) {
      newErrors.issuerType = "Issuer type is required";
    }
    
    if (!state.organization.governanceModel) {
      newErrors.governanceModel = "Governance model is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // If validation passes, proceed to next step
    nextStep();
  };

  const handleChange = (field: string, value: string) => {
    updateOrganization({ [field]: value });
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentType(documentId);
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && selectedDocumentType) {
      uploadDocument(selectedDocumentType, files[0]);
      setSelectedDocumentType(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Get document status for a given document type
  const getDocumentStatus = (documentId: string) => {
    const document = state.documents.find(doc => doc.id === documentId);
    return document?.status || "not_uploaded";
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Organization Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="legalName" className="block text-sm font-medium mb-1">
              Company Legal Name
            </Label>
            <Input
              id="legalName"
              value={state.organization.legalName || ""}
              onChange={(e) => handleChange("legalName", e.target.value)}
              placeholder="Enter legal name"
              className={cn("w-full", errors.legalName && "border-red-500")}
            />
            {errors.legalName && (
              <p className="text-red-500 text-sm mt-1">{errors.legalName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="registrationNumber" className="block text-sm font-medium mb-1">
              Registration Number
            </Label>
            <Input
              id="registrationNumber"
              value={state.organization.registrationNumber || ""}
              onChange={(e) => handleChange("registrationNumber", e.target.value)}
              placeholder="Enter registration number"
              className={cn("w-full", errors.registrationNumber && "border-red-500")}
            />
            {errors.registrationNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.registrationNumber}</p>
            )}
          </div>

          <div>
            <Label htmlFor="businessType" className="block text-sm font-medium mb-1">
              Business Type
            </Label>
            <Select
              value={state.organization.businessType || ""}
              onValueChange={(value) => handleChange("businessType", value)}
            >
              <SelectTrigger id="businessType" className={cn("w-full", errors.businessType && "border-red-500")}>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessType && (
              <p className="text-red-500 text-sm mt-1">{errors.businessType}</p>
            )}
          </div>

          <div>
            <Label htmlFor="regulatoryStatus" className="block text-sm font-medium mb-1">
              Regulatory Status
            </Label>
            <Select
              value={state.organization.regulatoryStatus || ""}
              onValueChange={(value) => handleChange("regulatoryStatus", value)}
            >
              <SelectTrigger id="regulatoryStatus" className={cn("w-full", errors.regulatoryStatus && "border-red-500")}>
                <SelectValue placeholder="Select regulatory status" />
              </SelectTrigger>
              <SelectContent>
                {REGULATORY_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.regulatoryStatus && (
              <p className="text-red-500 text-sm mt-1">{errors.regulatoryStatus}</p>
            )}
          </div>

          <div>
            <Label htmlFor="entityStructure" className="block text-sm font-medium mb-1">
              Legal Entity Structure
            </Label>
            <Select
              value={state.organization.entityStructure || ""}
              onValueChange={(value) => handleChange("entityStructure", value)}
            >
              <SelectTrigger id="entityStructure" className={cn("w-full", errors.entityStructure && "border-red-500")}>
                <SelectValue placeholder="Select entity structure" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_STRUCTURES.map((structure) => (
                  <SelectItem key={structure.value} value={structure.value}>
                    {structure.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.entityStructure && (
              <p className="text-red-500 text-sm mt-1">{errors.entityStructure}</p>
            )}
          </div>

          <div>
            <Label htmlFor="countryJurisdiction" className="block text-sm font-medium mb-1">
              Country of Registration
            </Label>
            <Select
              value={state.organization.countryJurisdiction || ""}
              onValueChange={(value) => handleChange("countryJurisdiction", value)}
            >
              <SelectTrigger id="countryJurisdiction" className={cn("w-full", errors.countryJurisdiction && "border-red-500")}>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <div className="p-2">
                  <Input
                    placeholder="Search countries..."
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    className="mb-2"
                  />
                </div>
                {filteredRegions.map((region) => (
                  region.countries.length > 0 && (
                    <SelectGroup key={region.id}>
                      <SelectLabel>{region.name}</SelectLabel>
                      {region.countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )
                ))}
              </SelectContent>
            </Select>
            {errors.countryJurisdiction && (
              <p className="text-red-500 text-sm mt-1">{errors.countryJurisdiction}</p>
            )}
          </div>

          <div>
            <Label htmlFor="issuerType" className="block text-sm font-medium mb-1">
              Issuer Type
            </Label>
            <Select
              value={state.organization.issuerType || ""}
              onValueChange={(value) => handleChange("issuerType", value)}
            >
              <SelectTrigger id="issuerType" className={cn("w-full", errors.issuerType && "border-red-500")}>
                <SelectValue placeholder="Select issuer type" />
              </SelectTrigger>
              <SelectContent>
                {ISSUER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.issuerType && (
              <p className="text-red-500 text-sm mt-1">{errors.issuerType}</p>
            )}
          </div>

          <div>
            <Label htmlFor="governanceModel" className="block text-sm font-medium mb-1">
              Governance Model
            </Label>
            <Select
              value={state.organization.governanceModel || ""}
              onValueChange={(value) => handleChange("governanceModel", value)}
            >
              <SelectTrigger id="governanceModel" className={cn("w-full", errors.governanceModel && "border-red-500")}>
                <SelectValue placeholder="Select governance model" />
              </SelectTrigger>
              <SelectContent>
                {GOVERNANCE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.governanceModel && (
              <p className="text-red-500 text-sm mt-1">{errors.governanceModel}</p>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor="externalTrustees" className="block text-sm font-medium mb-1">
            External Trustees, Administrators, or Legal Representatives
          </Label>
          <Input
            id="externalTrustees"
            value={state.organization.externalTrustees || ""}
            onChange={(e) => handleChange("externalTrustees", e.target.value)}
            placeholder="List any external trustees, administrators, or legal representatives"
            className="w-full"
          />
        </div>
        
        <h3 className="text-lg font-semibold mt-8">Document Upload</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="border rounded p-4 flex items-start space-x-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleDocumentSelect("cert-incorp")}
          >
            <div className="bg-gray-100 p-2 rounded">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Certificate of Incorporation</h4>
              <p className="text-xs text-gray-500 mb-2">
                {getDocumentStatus("cert-incorp") === "uploaded" ? "Uploaded" : "Not uploaded"}
              </p>
              {getDocumentStatus("cert-incorp") === "uploaded" ? (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center w-fit">
                  <Check className="h-3 w-3 mr-1" /> Complete
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Required</span>
              )}
            </div>
          </div>
          
          <div 
            className="border rounded p-4 flex items-start space-x-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleDocumentSelect("articles")}
          >
            <div className="bg-gray-100 p-2 rounded">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Articles of Association</h4>
              <p className="text-xs text-gray-500 mb-2">
                {getDocumentStatus("articles") === "uploaded" ? "Uploaded" : "Not uploaded"}
              </p>
              {getDocumentStatus("articles") === "uploaded" ? (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center w-fit">
                  <Check className="h-3 w-3 mr-1" /> Complete
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Required</span>
              )}
            </div>
          </div>
          
          <div 
            className="border rounded p-4 flex items-start space-x-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleDocumentSelect("directors")}
          >
            <div className="bg-gray-100 p-2 rounded">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">List of Directors</h4>
              <p className="text-xs text-gray-500 mb-2">
                {getDocumentStatus("directors") === "uploaded" ? "Uploaded" : "Not uploaded"}
              </p>
              {getDocumentStatus("directors") === "uploaded" ? (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center w-fit">
                  <Check className="h-3 w-3 mr-1" /> Complete
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Required</span>
              )}
            </div>
          </div>
          
          <div 
            className="border rounded p-4 flex items-start space-x-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleDocumentSelect("shareholders")}
          >
            <div className="bg-gray-100 p-2 rounded">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Shareholder Register</h4>
              <p className="text-xs text-gray-500 mb-2">
                {getDocumentStatus("shareholders") === "uploaded" ? "Uploaded" : "Not uploaded"}
              </p>
              {getDocumentStatus("shareholders") === "uploaded" ? (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center w-fit">
                  <Check className="h-3 w-3 mr-1" /> Complete
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Required</span>
              )}
            </div>
          </div>
          
          <div 
            className="border rounded p-4 flex items-start space-x-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleDocumentSelect("financial")}
          >
            <div className="bg-gray-100 p-2 rounded">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Latest Financial Statements</h4>
              <p className="text-xs text-gray-500 mb-2">
                {getDocumentStatus("financial") === "uploaded" ? "Uploaded" : "Not uploaded"}
              </p>
              {getDocumentStatus("financial") === "uploaded" && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center w-fit">
                  <Check className="h-3 w-3 mr-1" /> Complete
                </span>
              )}
            </div>
          </div>
          
          <div 
            className="border rounded p-4 flex items-start space-x-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleDocumentSelect("regulatory")}
          >
            <div className="bg-gray-100 p-2 rounded">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Regulatory Status Documentation</h4>
              <p className="text-xs text-gray-500 mb-2">
                {getDocumentStatus("regulatory") === "uploaded" ? "Uploaded" : "Not uploaded"}
              </p>
              {getDocumentStatus("regulatory") === "uploaded" && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center w-fit">
                  <Check className="h-3 w-3 mr-1" /> Complete
                </span>
              )}
            </div>
          </div>
          
          <div 
            className="border rounded p-4 flex items-start space-x-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleDocumentSelect("risk-disclosure")}
          >
            <div className="bg-gray-100 p-2 rounded">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Risk Disclosure Statement</h4>
              <p className="text-xs text-gray-500 mb-2">
                {getDocumentStatus("risk-disclosure") === "uploaded" ? "Uploaded" : "Not uploaded"}
              </p>
              {getDocumentStatus("risk-disclosure") === "uploaded" ? (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center w-fit">
                  <Check className="h-3 w-3 mr-1" /> Complete
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Required</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.png,.doc,.docx,.csv,.xls,.xlsx"
          />
          <div className="flex flex-col items-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium mb-1">
              {selectedDocumentType ? `Upload ${selectedDocumentType}` : "Select a document type first"}
            </p>
            <p className="text-xs text-gray-500">{file ? file.name : "no file selected"}</p>
            <p className="text-xs text-gray-500 mt-2">Accepted formats: PDF, JPG, PNG, DOC, DOCX, CSV, XLS, XLSX</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={prevStep} type="button" className="border border-gray-300">
          Save & Back
        </Button>
        <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white px-6">
          {isDevelopmentMode ? "Skip to Next Step" : "Continue"}
        </Button>
      </div>
    </form>
  );
};

export default OrganizationDetails;