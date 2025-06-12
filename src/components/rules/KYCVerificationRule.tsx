import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Info, AlertCircle, Check, Upload } from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface KYCVerificationRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const KYCVerificationRule = ({
  onSave = () => {},
  initialData,
}: KYCVerificationRuleProps) => {
  const [complianceCheckType, setComplianceCheckType] = useState<string>(initialData?.complianceCheckType || "");
  const [requireDocuments, setRequireDocuments] = useState<boolean>(initialData?.requireDocuments || false);
  const [documentTypes, setDocumentTypes] = useState<string[]>(initialData?.documentTypes || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<string>(
    initialData?.verificationMethod || "automatic",
  );
  const [requiredLevel, setRequiredLevel] = useState<string>(
    initialData?.requiredLevel || "1"
  );

  // Initialize form data from initialData
  useEffect(() => {
    if (initialData) {
      setComplianceCheckType(initialData.complianceCheckType || "");
      setRequireDocuments(initialData.requireDocuments || false);
      setDocumentTypes(initialData.documentTypes || []);
    }
  }, [initialData]);

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [complianceCheckType, requireDocuments, documentTypes]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Document Types validation
    if (documentTypes.length === 0) {
      newErrors.documentTypes = "At least one document type is required";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "kyc_verification",
        complianceCheckType,
        documentTypes,
        verificationMethod,
        requiredLevel,
        description: `KYC verification required with ${documentTypes.length} document types and ${verificationMethod} verification`,
        conditions: [{
          field: "kyc_verification",
          operator: "validate",
          value: {
            documentTypes,
            verificationMethod,
            requiredLevel
          }
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: `KYC verification required: ${documentTypes.join(", ")}`
          }
        }]
      });
    }
  };

  const toggleDocumentType = (type: string) => {
    setDocumentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <Card className="w-full bg-white border-purple-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          KYC Verification Rule
          <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
            Compliance Rule
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Document Upload Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Required Document Types
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Select the document types required for verification.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="passport"
                checked={documentTypes.includes("passport")}
                onCheckedChange={() => toggleDocumentType("passport")}
              />
              <Label htmlFor="passport">Passport</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="national_id"
                checked={documentTypes.includes("national_id")}
                onCheckedChange={() => toggleDocumentType("national_id")}
              />
              <Label htmlFor="national_id">National ID</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="drivers_license"
                checked={documentTypes.includes("drivers_license")}
                onCheckedChange={() => toggleDocumentType("drivers_license")}
              />
              <Label htmlFor="drivers_license">Driver's License</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="proof_of_address"
                checked={documentTypes.includes("proof_of_address")}
                onCheckedChange={() => toggleDocumentType("proof_of_address")}
              />
              <Label htmlFor="proof_of_address">Proof of Address</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="tax_id"
                checked={documentTypes.includes("tax_id")}
                onCheckedChange={() => toggleDocumentType("tax_id")}
              />
              <Label htmlFor="tax_id">Tax ID/SSN</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="selfie"
                checked={documentTypes.includes("selfie")}
                onCheckedChange={() => toggleDocumentType("selfie")}
              />
              <Label htmlFor="selfie">Selfie/Photo Verification</Label>
            </div>
          </div>
          {errors.documentTypes && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.documentTypes}
            </p>
          )}
          <div className="bg-gray-50 p-3 rounded-md mt-2">
            <div className="flex items-center">
              <Upload className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">
                Document upload will be required during onboarding
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {documentTypes.length === 0
                ? "No document types selected. Please select at least one."
                : `Selected ${documentTypes.length} document type(s) for verification.`}
            </p>
          </div>
        </div>

        {/* Verification Method */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Verification Method</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Choose whether verification is done automatically via API or
                    manually by compliance officers.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <RadioGroup
            value={verificationMethod}
            onValueChange={setVerificationMethod}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="automatic" id="method-automatic" />
              <Label htmlFor="method-automatic">Automatic (via API)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="method-manual" />
              <Label htmlFor="method-manual">Manual Review</Label>
            </div>
          </RadioGroup>
          {verificationMethod === "automatic" && (
            <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-800 mt-2">
              <p>
                Automatic verification will be performed using third-party KYC
                providers (e.g., Onfido, Jumio).
              </p>
            </div>
          )}
          {verificationMethod === "manual" && (
            <div className="bg-amber-50 p-3 rounded-md text-xs text-amber-800 mt-2">
              <p>
                Manual verification requires review by compliance officers and
                may take 1-2 business days.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-purple-50 p-3 rounded-md space-y-2 text-sm text-purple-800">
            <p>
              This rule requires{" "}
              {complianceCheckType
                ? complianceCheckType.replace("_", " ").toUpperCase()
                : "compliance"}{" "}
              verification before allowing transfers.
            </p>
            <p>
              Users must submit{" "}
              {documentTypes.length > 0
                ? documentTypes.map((d) => d.replace("_", " ")).join(", ")
                : "required documents"}{" "}
              for verification.
            </p>
            <p>
              Verification will be performed{" "}
              {verificationMethod === "automatic"
                ? "automatically via API"
                : "manually by compliance officers"}
              .
            </p>
            <p className="text-xs text-purple-600">
              Note: Transfers will be blocked until verification is complete and
              approved.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className="w-full bg-[#0f172b] hover:bg-[#0f172b]/90"
          >
            <Check className="mr-2 h-4 w-4" />
            Save Rule
          </Button>
          {!isFormValid && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Please fill in all required fields to save this rule.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCVerificationRule;
