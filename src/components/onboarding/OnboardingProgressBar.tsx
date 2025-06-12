import React from "react";
import { Progress } from "@/components/ui/progress";

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const OnboardingProgressBar = ({
  currentStep,
  totalSteps,
}: OnboardingProgressBarProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Onboarding Progress</span>
        <span className="text-sm font-medium">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default OnboardingProgressBar;
