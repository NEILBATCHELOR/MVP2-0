import React, { useState } from "react";
import { useIssuerOnboarding } from "./IssuerOnboardingContext";
import { COUNTRIES, JURISDICTIONS } from "@/utils/compliance/constants/constants";

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// Import Lucide icons
import { 
  User as PersonIcon, 
  Shield as SecurityIcon, 
  Scale as GavelIcon, 
  CheckCircle as CheckCircleIcon,
  AlertTriangle as WarningIcon,
  Info as InfoIcon, 
  ShieldCheck as ShieldIcon 
} from "lucide-react";

interface TabPanelProps {
  children?: React.ReactNode;
  value: string;
  activeValue: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, activeValue } = props;

  return (
    <div
      role="tabpanel"
      hidden={activeValue !== value}
      id={`compliance-tabpanel-${value}`}
      aria-labelledby={`compliance-tab-${value}`}
    >
      {activeValue === value && <div className="py-6">{children}</div>}
    </div>
  );
}

const ComplianceDueDiligence: React.FC = () => {
  const { state, updateCompliance, nextStep, prevStep } = useIssuerOnboarding();
  const [tabValue, setTabValue] = useState("owners");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTabChange = (value: string) => {
    setTabValue(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateCompliance({ [name]: value });
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    updateCompliance({ [name]: value });
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    updateCompliance({ [name]: checked });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Form validation
    const newErrors: Record<string, string> = {};
    
    if (!state.compliance.jurisdiction) {
      newErrors.jurisdiction = "Regulatory jurisdiction is required";
    }
    
    if (!state.compliance.riskDisclosureStatement) {
      newErrors.riskDisclosureStatement = "Risk disclosure statement is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTabValue("regulatory"); // Switch to the tab with errors
      return;
    }
    
    // If validation passes, proceed to next step
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h2 className="text-xl font-semibold mb-2">
        Compliance & Due Diligence
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Provide regulatory compliance information and complete due diligence requirements
      </p>

      <div className="bg-white rounded-md border mb-8">
        <Tabs value={tabValue} onValueChange={handleTabChange}>
          <TabsList className="w-full border-b">
            <TabsTrigger value="owners" className="flex items-center gap-2 py-4 px-6 flex-1">
              <PersonIcon className="w-4 h-4" />
              Business Owners & UBO
            </TabsTrigger>
            <TabsTrigger value="regulatory" className="flex items-center gap-2 py-4 px-6 flex-1">
              <GavelIcon className="w-4 h-4" />
              Regulatory Information
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owners" className="p-4">
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-4">
                Business Owners & Ultimate Beneficial Owners
              </h3>
              
              <Card className="mb-6">
                <CardContent className="flex flex-row items-center p-4">
                  <div>
                    <h4 className="text-base font-semibold">
                      John Smith
                    </h4>
                    <p className="text-gray-500 text-sm">
                      DOB: 1980-05-15
                    </p>
                    <p className="text-gray-500 text-sm">
                      Document: Passport
                    </p>
                  </div>
                  <div className="ml-auto flex flex-col items-end">
                    <p className="text-gray-500 text-sm">
                      Nationality: United States
                    </p>
                    <p className="text-gray-500 text-sm flex items-center">
                      Status: 
                      <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                        <CheckCircleIcon className="w-3 h-3 mr-1" /> Uploaded
                      </Badge>
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mb-6 p-6 border">
                <h4 className="text-base font-semibold mb-4">
                  Add New Owner
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="font-medium mb-1.5">Full Name</Label>
                    <Input 
                      placeholder="Enter full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="font-medium mb-1.5">Date of Birth</Label>
                    <Input 
                      type="date" 
                      defaultValue="2025-04-04"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="font-medium mb-1.5">Nationality</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-medium mb-1.5">ID Document Type</Label>
                    <Select defaultValue="Passport">
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="National ID">National ID</SelectItem>
                        <SelectItem value="Driver's License">Driver's License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button
                  className="w-full mt-6"
                >
                  Add Owner
                </Button>
              </Card>
              
              <div className="mt-8 p-6 border border-dashed rounded-md text-center">
                <p className="text-sm mb-2">
                  Select an owner first
                </p>
                <p className="text-gray-500 text-sm">
                  No file selected
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Accepted formats: PDF, JPG, PNG
                </p>
                
                <Button
                  variant="default"
                  disabled
                  className="mt-2"
                >
                  Upload Document
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="regulatory" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold mb-4">
                    Regulatory Jurisdiction
                  </h3>
                  <Select
                    value={state.compliance.jurisdiction}
                    onValueChange={(value) => handleSelectChange("jurisdiction", value)}
                  >
                    <SelectTrigger 
                      className={`${errors.jurisdiction ? 'border-red-500 ring-red-200' : ''}`}
                    >
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      {JURISDICTIONS.map((jurisdiction) => (
                        <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                          {jurisdiction.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.jurisdiction && (
                    <p className="text-red-500 text-xs mt-1">{errors.jurisdiction}</p>
                  )}
                </div>
                
                <div className="mt-6">
                  <div className="flex items-center mb-4">
                    <ShieldIcon className="text-amber-500 w-5 h-5 mr-2" />
                    <h3 className="text-base font-semibold">
                      Issuer Risk Classification
                    </h3>
                  </div>
                  
                  <Card className="border">
                    <CardContent className="p-4">
                      <h4 className="text-base font-semibold text-amber-600">
                        Medium Risk
                      </h4>
                      <p className="text-gray-500 text-sm">
                        Based on the information provided and our automated risk assessment.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div>
                <h3 className="text-base font-semibold mb-2">
                  SPV Risk Disclosure Statement
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Provide a detailed statement outlining the risks associated with your SPV. This will be shared with potential investors.
                </p>
                <Textarea
                  id="riskDisclosureStatement"
                  name="riskDisclosureStatement"
                  placeholder="Provide a comprehensive risk disclosure statement for your SPV..."
                  value={state.compliance.riskDisclosureStatement}
                  onChange={handleChange}
                  className={`min-h-[150px] ${errors.riskDisclosureStatement ? 'border-red-500 ring-red-200' : ''}`}
                />
                {errors.riskDisclosureStatement ? (
                  <p className="text-red-500 text-xs mt-1">{errors.riskDisclosureStatement}</p>
                ) : (
                  <p className="text-gray-500 text-xs mt-1">
                    Provide a detailed statement outlining the risks associated with your SPV. This will be shared with potential investors.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          className="py-6 px-8"
        >
          Save & Exit
        </Button>
        <Button
          type="submit"
          variant="default"
          className="py-6 px-8 font-semibold"
        >
          Continue
        </Button>
      </div>
    </form>
  );
};

export default ComplianceDueDiligence;