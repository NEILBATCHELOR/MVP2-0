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
import { supabase } from "@/infrastructure/database/client";

// Define interfaces that were missing from identifyService
export interface IdentifyCompany {
  name: string;
  registration_number: string;
  country: string;
  address?: {
    building_number?: string;
    street: string;
    town: string;
    postcode: string;
    country: string;
  };
}

export interface IdentifyDocument {
  type: DocumentType;
  file_data: string;
  file_name: string;
}

export type DocumentType = 
  "passport" | "national_identity_card" | "driving_licence" | "other";

export type ReportType = 
  "kyb_verification" | "aml_screening" | "document_verification" | 
  "company_report" | "lost_stolen_check";

// Mock service functions that were missing
const createCompanyVerification = async (companyData: IdentifyCompany) => {
  console.log("Creating company verification with:", companyData);
  return { success: true, data: { companyId: `company-${Date.now()}` }, error: undefined };
};

const uploadDocument = async (entityId: string, document: IdentifyDocument) => {
  console.log("Uploading document for entity:", entityId, document);
  return { success: true, data: { documentId: `doc-${Date.now()}` }, error: undefined };
};

const createVerificationCheck = async (checkData: any) => {
  console.log("Creating verification check:", checkData);
  return { success: true, data: { checkId: `check-${Date.now()}` }, error: undefined };
};

const generateSdkToken = async (
  entityId: string,
  type: "individual" | "company",
  redirectUrl: string
) => {
  console.log("Generating SDK token for:", entityId, type, redirectUrl);
  return { success: true, data: { token: `token-${Date.now()}` }, error: undefined };
};

const updateVerificationStatus = async (
  investorId: string,
  status: string,
  checkId: string,
  entityId: string,
  details: string
) => {
  console.log("Updating verification status:", investorId, status, checkId, entityId, details);
  return { success: true, error: undefined };
};

// Mock Identify SDK for development
let Identify: any = {
  init: (options: any) => {
    console.log("Identify SDK initialized with options:", options);
    // Mock implementation that would call onComplete after a delay
    setTimeout(() => {
      if (options.onComplete) options.onComplete();
    }, 3000);

    return {
      tearDown: () => console.log("Identify SDK torn down"),
    };
  },
};

interface FormData {
  verificationType: "individual" | "company";
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

interface IdentifyVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: Investor | null;
  onVerificationComplete: (status: string) => void;
}

const IdentifyVerificationDialog = ({
  open,
  onOpenChange,
  investor,
  onVerificationComplete,
}: IdentifyVerificationDialogProps) => {
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
  const [entityId, setEntityId] = useState<string | null>(null);
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
      setEntityId(null);
      setCheckId(null);
      setVerificationStatus("not_started");
      setVerificationDetails("");
      setProgress(0);
    }
  }, [open, investor]);

  // Initialize Identify SDK when token is available
  useEffect(() => {
    if (sdkToken && currentStep === "document" && Identify) {
      const identifyContainer = document.getElementById("identify-mount");
      if (identifyContainer) {
        try {
          const identifyInstance = Identify.init({
            token: sdkToken,
            containerId: "identify-mount",
            steps: [
              {
                type: "welcome",
                options: {
                  title: formData.verificationType === "company" 
                    ? "Verify your company" 
                    : "Verify your identity",
                }
              },
              "document",
              formData.verificationType === "individual" ? "face" : null,
              {
                type: "complete",
                options: {
                  message: "Verification complete!"
                }
              }
            ].filter(Boolean),
            onComplete: handleIdentifyComplete,
            onError: handleIdentifyError,
          });

          return () => {
            identifyInstance.tearDown();
          };
        } catch (error) {
          console.error("Error initializing Identify SDK:", error);
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
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.verificationType === "individual") {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    } else {
      if (!formData.companyName) newErrors.companyName = "Company name is required";
      if (!formData.companyRegistrationNumber) newErrors.companyRegistrationNumber = "Registration number is required";
      if (!formData.companyCountry) newErrors.companyCountry = "Country is required";
    }

    if (!formData.consentToTerms) {
      newErrors.consentToTerms = "You must agree to the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm() || !investor) return;

    setIsLoading(true);
    setProgress(10);

    try {
      let id: string;

      if (formData.verificationType === "company") {
        // Create company verification
        const companyData: IdentifyCompany = {
          name: formData.companyName,
          registration_number: formData.companyRegistrationNumber,
          country: formData.companyCountry,
          address: formData.address.street ? {
            building_number: formData.address.buildingNumber,
            street: formData.address.street,
            town: formData.address.town,
            postcode: formData.address.postcode,
            country: formData.address.country,
          } : undefined,
        };

        const response = await createCompanyVerification(companyData);
        if (!response.success) throw new Error(response.error);
        id = response.data!.companyId;
      } else {
        // For individual verification, we'll use the investor ID
        id = investor.id;
      }

      setEntityId(id);
      setProgress(30);

      // Generate SDK token
      const tokenResponse = await generateSdkToken(
        id,
        formData.verificationType,
        window.location.origin
      );

      if (!tokenResponse.success) throw new Error(tokenResponse.error);

      setSdkToken(tokenResponse.data!.token);
      setProgress(50);
      setCurrentStep("document");
    } catch (error: any) {
      console.error("Error starting verification:", error);
      setErrors({
        submit: error.message || "Failed to start verification process",
      });
      setIsLoading(false);
    }
  };

  // Handle Identify SDK completion
  const handleIdentifyComplete = async () => {
    if (!investor || !entityId) return;

    setCurrentStep("processing");
    setProgress(70);

    try {
      // Create verification check
      const checkResponse = await createVerificationCheck({
        [formData.verificationType === "company" ? "company_id" : "individual_id"]: entityId,
        report_types: [
          formData.verificationType === "company" ? "kyb_verification" : "aml_screening",
          "document_verification",
          formData.verificationType === "company" ? "company_report" : "lost_stolen_check",
        ],
      });

      if (!checkResponse.success) throw new Error(checkResponse.error);

      setCheckId(checkResponse.data!.checkId);
      setProgress(90);
      setVerificationStatus("pending");
      setVerificationDetails("Verification in progress");

      // Update investor status
      await updateVerificationStatus(
        investor.id,
        "pending",
        checkResponse.data!.checkId,
        entityId,
        "Verification in progress"
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
    } catch (error: any) {
      console.error("Error completing verification:", error);
      setErrors({
        submit: error.message || "Failed to complete verification process",
      });
      setVerificationStatus("failed");
      setCurrentStep("result");
    }
  };

  // Handle Identify SDK errors
  const handleIdentifyError = (error: any) => {
    console.error("Identify SDK error:", error);
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
    field: string
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
    field: string
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {currentStep === "form" && "Start Verification"}
            {currentStep === "document" && "Upload Documents"}
            {currentStep === "processing" && "Processing Verification"}
            {currentStep === "result" && "Verification Result"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === "form" &&
              "Please provide the required information to start the verification process."}
            {currentStep === "document" &&
              "Follow the instructions to upload your documents."}
            {currentStep === "processing" && "Please wait while we verify your information."}
            {currentStep === "result" &&
              verificationStatus === "approved" &&
              "Your verification has been completed successfully."}
            {currentStep === "result" &&
              verificationStatus === "failed" &&
              "There was an issue with your verification."}
          </DialogDescription>
        </DialogHeader>

        {currentStep === "form" && (
          <div className="space-y-6">
            <RadioGroup
              value={formData.verificationType}
              onValueChange={(value: "individual" | "company") =>
                setFormData((prev) => ({ ...prev, verificationType: value }))
              }
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="individual"
                  id="individual"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="individual"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <User className="mb-2 h-6 w-6" />
                  Individual
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="company"
                  id="company"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="company"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Building2 className="mb-2 h-6 w-6" />
                  Company
                </Label>
              </div>
            </RadioGroup>

            {formData.verificationType === "individual" ? (
              <div className="space-y-4">
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
                      <p className="text-sm text-destructive">{errors.firstName}</p>
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
                      <p className="text-sm text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange(e, "email")}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange(e, "dateOfBirth")}
                    className={errors.dateOfBirth ? "border-red-500" : ""}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange(e, "companyName")}
                    className={errors.companyName ? "border-red-500" : ""}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">{errors.companyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyRegistrationNumber">
                    Registration Number
                  </Label>
                  <Input
                    id="companyRegistrationNumber"
                    value={formData.companyRegistrationNumber}
                    onChange={(e) =>
                      handleInputChange(e, "companyRegistrationNumber")
                    }
                    className={errors.companyRegistrationNumber ? "border-red-500" : ""}
                  />
                  {errors.companyRegistrationNumber && (
                    <p className="text-sm text-destructive">{errors.companyRegistrationNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyCountry">Country</Label>
                  <Input
                    id="companyCountry"
                    value={formData.companyCountry}
                    onChange={(e) => handleInputChange(e, "companyCountry")}
                    className={errors.companyCountry ? "border-red-500" : ""}
                  />
                  {errors.companyCountry && (
                    <p className="text-sm text-destructive">{errors.companyCountry}</p>
                  )}
                </div>
              </div>
            )}

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
                <Label htmlFor="consentToTerms">
                  I agree to the terms and conditions
                </Label>
              </div>
              {errors.consentToTerms && (
                <p className="text-sm text-destructive">{errors.consentToTerms}</p>
              )}
            </div>

            {errors.submit && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {currentStep === "document" && (
          <div className="space-y-4">
            <div id="identify-mount" className="min-h-[400px]" />
          </div>
        )}

        {currentStep === "processing" && (
          <div className="space-y-6">
            <Progress value={progress} />
            <p className="text-center text-sm text-muted-foreground">
              {verificationDetails}
            </p>
          </div>
        )}

        {currentStep === "result" && (
          <div className="space-y-6">
            {verificationStatus === "approved" ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{verificationDetails}</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Verification Failed</AlertTitle>
                <AlertDescription>{verificationDetails}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          {currentStep === "form" && (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Verification
            </Button>
          )}
          {currentStep === "result" && (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IdentifyVerificationDialog;