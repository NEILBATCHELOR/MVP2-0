import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Upload,
  Building2,
  User,
  FileText,
  Camera,
  Calendar,
  MapPin,
  Mail,
  Loader2,
} from "lucide-react";
import { Investor } from "./InvestorTypes";
import { OnfidoService } from "@/services/integrations/onfidoService";

// Define the missing types
export type VerificationType = 'individual' | 'business';

export interface VerificationRequest {
  investorId: string;
  type: VerificationType;
  applicantData: {
    first_name: string;
    last_name: string;
    email?: string;
    dob?: string;
    address?: {
      building_number?: string;
      street: string;
      town: string;
      postcode: string;
      country: string;
    };
  };
  companyData?: {
    name: string;
    registration_number: string;
    country: string;
  };
}

// Create service functions using the OnfidoService instance
const onfidoService = OnfidoService.getInstance();

export const generateSdkToken = async (applicantId: string) => {
  try {
    const data = await onfidoService.createSdkToken(applicantId, window.location.origin);
    return { success: true, data };
  } catch (error) {
    console.error('Error generating SDK token:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const startVerification = async (request: VerificationRequest) => {
  try {
    // Create the applicant first
    const applicantData = {
      firstName: request.applicantData.first_name,
      lastName: request.applicantData.last_name,
      email: request.applicantData.email,
      dob: request.applicantData.dob,
      address: request.applicantData.address
    };
    
    const applicant = await onfidoService.createApplicant(applicantData);
    
    // Then create a check for the applicant
    const check = await onfidoService.createCheck(applicant.id);
    
    return {
      success: true,
      data: {
        applicantId: applicant.id,
        checkId: check.id
      }
    };
  } catch (error) {
    console.error('Error starting verification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const updateInvestorVerificationStatus = async (
  investorId: string,
  status: 'pending' | 'approved' | 'rejected',
  checkId: string | null,
  applicantId: string | null,
  details: string
) => {
  try {
    await onfidoService.storeVerificationResult({
      investorId,
      verificationType: 'onfido',
      result: {
        checkId,
        applicantId,
        details
      },
      status
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating verification status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Mock Onfido SDK for development
let Onfido: any = {
  init: (options: any) => {
    console.log("Onfido SDK initialized with options:", options);
    // Mock implementation that would call onComplete after a delay
    setTimeout(() => {
      if (options.onComplete) options.onComplete();
    }, 3000);

    return {
      tearDown: () => console.log("Onfido SDK torn down"),
    };
  },
};

interface OnfidoVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: Investor | null;
  onVerificationComplete: (status: string) => void;
}

interface FormData {
  verificationType: VerificationType;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  address: {
    buildingNumber: string;
    street: string;
    town: string;
    postcode: string;
    country: string;
  };
  companyName: string;
  companyRegistrationNumber: string;
  companyCountry: string;
  consentToTerms: boolean;
}

const OnfidoVerificationDialog = ({
  open,
  onOpenChange,
  investor,
  onVerificationComplete,
}: OnfidoVerificationDialogProps) => {
  const [currentStep, setCurrentStep] = useState<
    "form" | "document" | "processing" | "result"
  >("form");
  const [formData, setFormData] = useState<FormData>({
    verificationType: "individual",
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    address: {
      buildingNumber: "",
      street: "",
      town: "",
      postcode: "",
      country: "",
    },
    companyName: "",
    companyRegistrationNumber: "",
    companyCountry: "",
    consentToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sdkToken, setSdkToken] = useState<string | null>(null);
  const [applicantId, setApplicantId] = useState<string | null>(null);
  const [checkId, setCheckId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "not_started" | "pending" | "approved" | "failed"
  >("not_started");
  const [verificationDetails, setVerificationDetails] = useState<string>("");
  const [progress, setProgress] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && investor) {
      setCurrentStep("form");
      setFormData({
        verificationType: "individual",
        firstName: investor.name.split(" ")[0] || "",
        lastName: investor.name.split(" ").slice(1).join(" ") || "",
        email: investor.email || "",
        dateOfBirth: "",
        address: {
          buildingNumber: "",
          street: "",
          town: "",
          postcode: "",
          country: "",
        },
        companyName: "",
        companyRegistrationNumber: "",
        companyCountry: "",
        consentToTerms: false,
      });
      setErrors({});
      setIsLoading(false);
      setSdkToken(null);
      setApplicantId(null);
      setCheckId(null);
      setVerificationStatus("not_started");
      setVerificationDetails("");
      setProgress(0);
    }
  }, [open, investor]);

  // Initialize Onfido SDK when token is available
  useEffect(() => {
    if (sdkToken && currentStep === "document" && Onfido) {
      const onfidoContainer = document.getElementById("onfido-mount");
      if (onfidoContainer) {
        try {
          const onfidoInstance = Onfido.init({
            token: sdkToken,
            containerId: "onfido-mount",
            steps: ["welcome", "document", "face"],
            onComplete: handleOnfidoComplete,
            onError: handleOnfidoError,
          });

          return () => {
            onfidoInstance.tearDown();
          };
        } catch (error) {
          console.error("Error initializing Onfido SDK:", error);
          setErrors({
            ...errors,
            sdk: "Failed to initialize verification SDK. Please try again.",
          });
          setCurrentStep("form");
        }
      }
    }
  }, [sdkToken, currentStep]);

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Individual-specific validations
    if (formData.verificationType === "individual") {
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required";
      }
    }

    // Business-specific validations
    if (formData.verificationType === "business") {
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
      if (!formData.companyRegistrationNumber.trim()) {
        newErrors.companyRegistrationNumber =
          "Company registration number is required";
      }
      if (!formData.companyCountry.trim()) {
        newErrors.companyCountry = "Company country is required";
      }
    }

    // Consent validation
    if (!formData.consentToTerms) {
      newErrors.consentToTerms = "You must consent to the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!investor) return;

    setIsLoading(true);
    setProgress(10);

    try {
      // Prepare verification request
      const request: VerificationRequest = {
        investorId: investor.id,
        type: formData.verificationType,
        applicantData: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          dob: formData.dateOfBirth,
          address: formData.address.street
            ? {
                building_number: formData.address.buildingNumber,
                street: formData.address.street,
                town: formData.address.town,
                postcode: formData.address.postcode,
                country: formData.address.country,
              }
            : undefined,
        },
      };

      // Add company data for business verification
      if (formData.verificationType === "business") {
        request.companyData = {
          name: formData.companyName,
          registration_number: formData.companyRegistrationNumber,
          country: formData.companyCountry,
        };
      }

      setProgress(30);

      // Start verification process
      const result = await startVerification(request);

      if (!result.success) {
        throw new Error(result.error || "Failed to start verification");
      }

      setProgress(50);
      
      // Safely extract applicantId and checkId from result
      const applicantId = result.data?.applicantId || null;
      const checkId = result.data?.checkId || null;
      
      setApplicantId(applicantId);
      setCheckId(checkId);

      // For individual verification, we need to generate an SDK token
      if (formData.verificationType === "individual" && applicantId) {
        const tokenResult = await generateSdkToken(applicantId);
        if (!tokenResult.success) {
          throw new Error(
            tokenResult.error || "Failed to generate verification token",
          );
        }

        // Safely extract token from tokenResult
        const token = tokenResult.data?.token || null;
        if (!token) {
          throw new Error("No token received from verification service");
        }

        setSdkToken(token);
        setProgress(70);
        setCurrentStep("document");
      } else {
        // For business verification, we move directly to processing
        setVerificationStatus("pending");
        setVerificationDetails("Business verification in progress");
        setProgress(100);
        setCurrentStep("processing");

        // Update investor status
        await updateInvestorVerificationStatus(
          investor.id,
          "pending",
          checkId,
          applicantId,
          "Business verification in progress",
        );

        // In a real app, you would poll for status updates or use webhooks
        // For demo purposes, we'll simulate a status update after a delay
        setTimeout(() => {
          setVerificationStatus("approved");
          setVerificationDetails(
            "Business verification completed successfully",
          );
          setCurrentStep("result");
          onVerificationComplete("approved");
        }, 5000);
      }
    } catch (error) {
      console.error("Error starting verification:", error);
      setErrors({
        ...errors,
        submit: error.message || "Failed to start verification process",
      });
      setIsLoading(false);
      setProgress(0);
    }
  };

  // Handle Onfido SDK completion
  const handleOnfidoComplete = async () => {
    if (!investor || !checkId) return;

    setCurrentStep("processing");
    setProgress(90);
    setVerificationStatus("pending");
    setVerificationDetails("Verification in progress");

    // Update investor status
    await updateInvestorVerificationStatus(
      investor.id,
      "pending",
      checkId,
      applicantId,
      "Verification in progress",
    );

    // In a real app, you would poll for status updates or use webhooks
    // For demo purposes, we'll simulate a status update after a delay
    setTimeout(() => {
      setProgress(100);
      setVerificationStatus("approved");
      setVerificationDetails("Verification completed successfully");
      setCurrentStep("result");
      onVerificationComplete("approved");
    }, 5000);
  };

  // Handle Onfido SDK errors
  const handleOnfidoError = (error: any) => {
    console.error("Onfido SDK error:", error);
    setErrors({
      ...errors,
      sdk: error.message || "An error occurred during verification",
    });
    setCurrentStep("form");
    setIsLoading(false);
    setProgress(0);
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle address input changes
  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  // Render form step
  const renderFormStep = () => {
    return (
      <div className="space-y-6">
        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Verification Type</Label>
          <RadioGroup
            value={formData.verificationType}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                verificationType: value as VerificationType,
              }))
            }
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-primary">
              <RadioGroupItem value="individual" id="individual" />
              <Label
                htmlFor="individual"
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4" />
                Individual
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-primary">
              <RadioGroupItem value="business" id="business" />
              <Label
                htmlFor="business"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Building2 className="h-4 w-4" />
                Business
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {formData.verificationType === "individual"
              ? "Personal Information"
              : "Representative Information"}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange(e, "firstName")}
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange(e, "lastName")}
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange(e, "email")}
                className={errors.email ? "border-red-500" : ""}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {formData.verificationType === "individual" && (
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange(e, "dateOfBirth")}
                  className={errors.dateOfBirth ? "border-red-500" : ""}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
              )}
            </div>
          )}

          {formData.verificationType === "individual" && (
            <div className="space-y-2">
              <Label htmlFor="proofOfAddress">Proof of Address</Label>
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                <Input
                  id="proofOfAddress"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a utility bill, bank statement, or other official
                document verifying your address
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              Address (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buildingNumber" className="text-sm">
                  Building Number
                </Label>
                <Input
                  id="buildingNumber"
                  value={formData.address.buildingNumber}
                  onChange={(e) => handleAddressChange(e, "buildingNumber")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm">
                  Street
                </Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => handleAddressChange(e, "street")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="town" className="text-sm">
                  Town/City
                </Label>
                <Input
                  id="town"
                  value={formData.address.town}
                  onChange={(e) => handleAddressChange(e, "town")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode" className="text-sm">
                  Postcode/ZIP
                </Label>
                <Input
                  id="postcode"
                  value={formData.address.postcode}
                  onChange={(e) => handleAddressChange(e, "postcode")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm">
                Country (ISO code, e.g., GBR, USA)
              </Label>
              <Input
                id="country"
                value={formData.address.country}
                onChange={(e) => handleAddressChange(e, "country")}
                placeholder="GBR"
              />
            </div>
          </div>
        </div>

        {formData.verificationType === "business" && (
          <>
            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company Information</h3>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange(e, "companyName")}
                    className={errors.companyName ? "border-red-500" : ""}
                  />
                </div>
                {errors.companyName && (
                  <p className="text-sm text-red-500">{errors.companyName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyRegistrationNumber">
                  Registration Number
                </Label>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="companyRegistrationNumber"
                    value={formData.companyRegistrationNumber}
                    onChange={(e) =>
                      handleInputChange(e, "companyRegistrationNumber")
                    }
                    className={
                      errors.companyRegistrationNumber ? "border-red-500" : ""
                    }
                  />
                </div>
                {errors.companyRegistrationNumber && (
                  <p className="text-sm text-red-500">
                    {errors.companyRegistrationNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / DUNS Number</Label>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="taxId"
                    placeholder="Enter business tax ID or DUNS number"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Additional business identifiers help enhance verification
                  accuracy
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyCountry">
                  Country of Incorporation (ISO code, e.g., GBR, USA)
                </Label>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="companyCountry"
                    value={formData.companyCountry}
                    onChange={(e) => handleInputChange(e, "companyCountry")}
                    placeholder="GBR"
                    className={errors.companyCountry ? "border-red-500" : ""}
                  />
                </div>
                {errors.companyCountry && (
                  <p className="text-sm text-red-500">
                    {errors.companyCountry}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessActivity">Business Activity</Label>
                <textarea
                  id="businessActivity"
                  className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Describe the nature of your business and its primary activities"
                ></textarea>
                <p className="text-xs text-muted-foreground">
                  Required for risk assessment and regulatory compliance
                </p>
              </div>

              <div className="space-y-2">
                <Label>Business Documents</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="incorporationDoc" className="text-xs">
                      Articles of Incorporation
                    </Label>
                    <Input
                      id="incorporationDoc"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="text-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="financialStatements" className="text-xs">
                      Financial Statements
                    </Label>
                    <Input
                      id="financialStatements"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="text-xs cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Source of Funds/Wealth</Label>
            <select className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Select source of funds</option>
              <option value="salary">Employment/Salary</option>
              <option value="business">Business Income</option>
              <option value="investments">Investment Returns</option>
              <option value="inheritance">Inheritance</option>
              <option value="savings">Personal Savings</option>
              <option value="property">Property Sale</option>
              <option value="other">Other (please specify)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Required for anti-money laundering (AML) compliance
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="consentToTerms"
                checked={formData.consentToTerms}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    consentToTerms: checked as boolean,
                  }))
                }
              />
              <Label
                htmlFor="consentToTerms"
                className={errors.consentToTerms ? "text-red-500" : ""}
              >
                I consent to the processing of my data for verification purposes
              </Label>
            </div>
            {errors.consentToTerms && (
              <p className="text-sm text-red-500">{errors.consentToTerms}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="enhancedDueDiligence" />
            <Label htmlFor="enhancedDueDiligence">
              I consent to enhanced due diligence checks (sanctions lists, PEP
              screening, adverse media)
            </Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Render document capture step
  const renderDocumentStep = () => {
    return (
      <div className="space-y-6">
        {errors.sdk && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errors.sdk}</AlertDescription>
          </Alert>
        )}

        <div id="onfido-mount" className="min-h-[400px]"></div>
      </div>
    );
  };

  // Render processing step
  const renderProcessingStep = () => {
    return (
      <div className="space-y-6 py-4 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Clock className="h-16 w-16 text-blue-500 animate-pulse" />
          <h3 className="text-xl font-semibold">Processing Verification</h3>
          <p className="text-muted-foreground">
            Please wait while we process your verification. This may take a few
            moments.
          </p>
        </div>

        <Progress value={progress} className="w-full" />

        <p className="text-sm text-muted-foreground">
          {verificationDetails || "Verification in progress..."}
        </p>
      </div>
    );
  };

  // Render result step
  const renderResultStep = () => {
    const statusConfig = {
      approved: {
        icon: CheckCircle2,
        title: "Verification Approved",
        description: "Your verification has been successfully completed.",
        color: "text-green-500",
      },
      pending: {
        icon: Clock,
        title: "Verification Pending",
        description: "Your verification is still being processed.",
        color: "text-yellow-500",
      },
      failed: {
        icon: XCircle,
        title: "Verification Failed",
        description:
          "Your verification could not be completed. Please try again.",
        color: "text-red-500",
      },
      not_started: {
        icon: AlertCircle,
        title: "Verification Not Started",
        description: "Your verification has not been started yet.",
        color: "text-gray-500",
      },
    };

    const config = statusConfig[verificationStatus];
    const StatusIcon = config.icon;

    return (
      <div className="space-y-6 py-4 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <StatusIcon className={`h-16 w-16 ${config.color}`} />
          <h3 className="text-xl font-semibold">{config.title}</h3>
          <p className="text-muted-foreground">{config.description}</p>
        </div>

        {verificationDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Verification Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{verificationDetails}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center pt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {currentStep === "form"
              ? "Verify Investor"
              : currentStep === "document"
                ? "Document Verification"
                : currentStep === "processing"
                  ? "Processing Verification"
                  : "Verification Result"}
          </DialogTitle>
          {currentStep === "form" && (
            <DialogDescription>
              Complete the form below to start the verification process for{" "}
              {investor?.name}.
            </DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto px-1">
          {currentStep === "form" && renderFormStep()}
          {currentStep === "document" && renderDocumentStep()}
          {currentStep === "processing" && renderProcessingStep()}
          {currentStep === "result" && renderResultStep()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OnfidoVerificationDialog;
