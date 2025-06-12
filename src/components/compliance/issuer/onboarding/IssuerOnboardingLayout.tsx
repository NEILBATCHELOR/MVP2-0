import React from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/utils";
import { IssuerOnboardingProvider, useIssuerOnboarding } from "./IssuerOnboardingContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface IssuerOnboardingLayoutProps {
  children: React.ReactNode;
}

const IssuerOnboardingContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { state, isDevelopmentMode, toggleDevelopmentMode } = useIssuerOnboarding();
  
  const steps = [
    { label: "Account Setup", path: "/registration" },
    { label: "Organization Details", path: "/organization-details" },
    { label: "Wallet Configuration", path: "/wallet-setup" },
    { label: "Final Review", path: "/review" },
  ];

  const getCurrentStep = () => {
    const currentPath = location.pathname.split('/').pop();
    return steps.findIndex(step => step.path.includes(currentPath || ""));
  };

  const currentStep = getCurrentStep();
  const stepNumber = currentStep + 1;
  const totalSteps = steps.length;
  const progress = (currentStep / (totalSteps - 1)) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 bg-white shadow-sm rounded-lg">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {currentStep === 0 && "Register as an Issuer"}
                {currentStep === 1 && "Organization Details & Legal Setup"}
                {currentStep === 2 && "Issuer Wallet Setup"}
                {currentStep === 3 && "Final Review & Submission"}
              </h2>
              <p className="text-gray-600">
                {currentStep === 0 && "Create your account to start setting up your SPV"}
                {currentStep === 1 && "Provide essential information about your organization and upload required documents"}
                {currentStep === 2 && "Set up your issuance wallet and configure smart contract roles"}
                {currentStep === 3 && "Review all information before submitting for approval"}
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-2 md:mt-0">
              <div className="flex items-center space-x-2">
                <Switch
                  id="development-mode"
                  checked={isDevelopmentMode}
                  onCheckedChange={toggleDevelopmentMode}
                />
                <Label htmlFor="development-mode">Development Mode</Label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Step {stepNumber} of {totalSteps}</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          
          <Progress value={progress} className="w-full h-1 bg-gray-200" />
        </div>
        
        {isDevelopmentMode && (
          <Alert className="mb-6 border-amber-500 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              Development mode is enabled. Form validation will be bypassed for quicker navigation.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mb-6">
          {children}
        </div>
      </Card>
    </div>
  );
};

const IssuerOnboardingLayout: React.FC<IssuerOnboardingLayoutProps> = ({ children }) => {
  return (
    <IssuerOnboardingProvider>
      <IssuerOnboardingContent>
        {children}
      </IssuerOnboardingContent>
    </IssuerOnboardingProvider>
  );
};

export default IssuerOnboardingLayout;