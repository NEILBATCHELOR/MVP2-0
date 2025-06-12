import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Investor, KycStatus } from "@/types/core/centralModels";
import { CheckCircle, Clock } from "lucide-react";

interface OnboardingProgressSectionProps {
  investor: Investor;
  progress: number;
}

const OnboardingProgressSection: React.FC<OnboardingProgressSectionProps> = ({
  investor,
  progress,
}) => {
  // Define the onboarding steps
  const steps = [
    {
      id: "registration",
      title: "Registration",
      status: "Completed", // Registration is always completed if we have investor data
      isCompleted: true,
    },
    {
      id: "verification",
      title: "Verification",
      status: investor.kycVerifiedAt ? "Completed" : "Pending",
      isCompleted: !!investor.kycVerifiedAt,
    },
    {
      id: "kyc-aml",
      title: "KYC/AML",
      status: investor.kycStatus === KycStatus.APPROVED
        ? "Completed" 
        : investor.kycStatus === KycStatus.PENDING
          ? "In Progress" 
          : "Pending",
      isCompleted: investor.kycStatus === KycStatus.APPROVED,
      isInProgress: investor.kycStatus === KycStatus.PENDING,
    },
    {
      id: "wallet-setup",
      title: "Wallet Setup",
      status: investor.walletAddress ? "Completed" : "Pending",
      isCompleted: !!investor.walletAddress,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding Progress</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track your investor onboarding and compliance progress
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Completion</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {steps.map((step) => (
              <div key={step.id} className="border rounded-lg p-4 flex flex-col items-center text-center">
                {step.isCompleted ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
                ) : step.isInProgress ? (
                  <Clock className="h-6 w-6 text-blue-500 mb-2" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-400 mb-2" />
                )}
                <p className="font-medium">{step.title}</p>
                <p className={`text-xs ${
                  step.isCompleted 
                    ? "text-green-500" 
                    : step.isInProgress 
                      ? "text-blue-500" 
                      : "text-muted-foreground"
                }`}>
                  {step.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingProgressSection; 