import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnfidoVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: any;
  onComplete: (investorId: string, status: string, details: any) => void;
}

const OnfidoVerificationDialog = ({
  open,
  onOpenChange,
  investor,
  onComplete,
}: OnfidoVerificationDialogProps) => {
  const [step, setStep] = useState<
    "init" | "upload" | "processing" | "complete" | "error"
  >("init");
  const [progress, setProgress] = useState(0);
  const [isIndividual, setIsIndividual] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    companyName: "",
    registrationNumber: "",
    country: "US",
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  // Initialize form data from investor
  useEffect(() => {
    if (investor) {
      const nameParts = investor.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setIsIndividual(
        investor.type !== "company" && investor.type !== "institution",
      );
      setFormData({
        firstName,
        lastName,
        dateOfBirth: "",
        companyName: investor.company || "",
        registrationNumber: "",
        country: "US",
      });
    }
  }, [investor]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("init");
      setProgress(0);
      setUploadedFiles([]);
    }
  }, [open]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setStep("processing");
      setProgress(0);

      console.log("Starting verification process for investor:", investor);
      
      // Log form data for debugging
      console.log("Form data:", formData);
      console.log("Uploaded files:", uploadedFiles);

      // Simulate API calls with progress updates
      await simulateProgress();

      // In a real implementation, you would:
      // 1. Create an Onfido applicant
      // 2. Upload documents
      // 3. Create a check
      // 4. Generate an SDK token
      // 5. Wait for check completion or handle it via webhooks

      // For this demo, we'll simulate a successful verification
      const verificationDetails = {
        method: "onfido",
        applicant_id: `applicant-${Math.random().toString(36).substring(2, 10)}`,
        check_id: `check-${Math.random().toString(36).substring(2, 10)}`,
        documents: uploadedFiles.map((file) => file.name),
        verified_at: new Date().toISOString(),
        status: "complete",
      };

      // Log verification details
      console.log("Verification complete with details:", verificationDetails);

      setStep("complete");

      // Wait a moment before closing
      setTimeout(() => {
        const investorId = investor.investor_id || investor.id;
        console.log("Completing verification for investor ID:", investorId);
        onComplete(
          investorId,
          "approved",
          verificationDetails,
        );
      }, 1500);
    } catch (err) {
      console.error("Error during Onfido verification:", err);
      setStep("error");
      toast({
        title: "Verification Failed",
        description:
          "There was an error processing the verification. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Simulate progress for demo purposes
  const simulateProgress = async () => {
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(i * (100 / steps));
    }
  };

  // Render content based on current step
  const renderContent = () => {
    switch (step) {
      case "init":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Verification Type</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={isIndividual ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsIndividual(true)}
                >
                  Individual (KYC)
                </Button>
                <Button
                  type="button"
                  variant={!isIndividual ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsIndividual(false)}
                >
                  Business (KYB)
                </Button>
              </div>
            </div>

            {isIndividual ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    name="country"
                    className="w-full p-2 rounded-md border border-input bg-background"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">
                    Registration Number
                  </Label>
                  <Input
                    id="registrationNumber"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country of Incorporation</Label>
                  <select
                    id="country"
                    name="country"
                    className="w-full p-2 rounded-md border border-input bg-background"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        );

      case "upload":
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    Document Requirements
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {isIndividual
                      ? "Please upload a valid government-issued ID (passport, driver's license, or ID card)."
                      : "Please upload company registration documents and proof of address."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-upload">Upload Documents</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here, or click to select files
                </p>
                <Input
                  id="document-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("document-upload")?.click()
                  }
                >
                  Select Files
                </Button>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files</Label>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded-md border"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-700">
                            {file.name.split(".").pop()?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUploadedFiles((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "processing":
        return (
          <div className="space-y-6 py-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-medium mb-2">
                Processing Verification
              </h3>
              <p className="text-muted-foreground mb-4">
                Please wait while we process your verification. This may take a
                few moments.
              </p>
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {progress.toFixed(0)}% complete
                </p>
              </div>
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-6 py-4 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <div>
              <h3 className="text-lg font-medium mb-2">
                Verification Complete
              </h3>
              <p className="text-muted-foreground">
                The verification has been successfully processed. The investor's
                KYC status has been updated.
              </p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="space-y-6 py-4 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <h3 className="text-lg font-medium mb-2">Verification Failed</h3>
              <p className="text-muted-foreground mb-4">
                There was an error processing the verification. Please try again
                or contact support.
              </p>
              <Button variant="outline" onClick={() => setStep("init")}>
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render footer based on current step
  const renderFooter = () => {
    switch (step) {
      case "init":
        return (
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => setStep("upload")}
              disabled={
                isIndividual
                  ? !formData.firstName ||
                    !formData.lastName ||
                    !formData.dateOfBirth
                  : !formData.companyName || !formData.registrationNumber
              }
            >
              Continue
            </Button>
          </>
        );

      case "upload":
        return (
          <>
            <Button variant="outline" onClick={() => setStep("init")}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploadedFiles.length === 0}
            >
              Start Verification
            </Button>
          </>
        );

      case "processing":
        return (
          <Button disabled={true}>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </Button>
        );

      case "complete":
        return <Button onClick={() => onOpenChange(false)}>Close</Button>;

      case "error":
        return (
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => setStep("init")}>Try Again</Button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isIndividual
              ? "Individual Verification (KYC)"
              : "Business Verification (KYB)"}
          </DialogTitle>
          <DialogDescription>
            {isIndividual
              ? `Verify identity for ${investor?.name || "investor"}`
              : `Verify business information for ${investor?.company || "company"}`}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnfidoVerificationDialog;
