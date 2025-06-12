import React from "react";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Step {
  id: string;
  name: string;
  status: "completed" | "current" | "upcoming" | "error";
}

interface OnboardingStepsProps {
  steps: Step[];
  currentStepId: string;
}

const OnboardingSteps = ({ steps, currentStepId }: OnboardingStepsProps) => {
  const getStepIcon = (status: Step["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "current":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-300" />;
    }
  };

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between">
        {/* Connector line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />

        {steps.map((step, index) => (
          <div
            key={step.id}
            className="relative z-10 flex flex-col items-center"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${step.status === "completed" ? "bg-green-100" : step.status === "current" ? "bg-blue-100" : step.status === "error" ? "bg-red-100" : "bg-gray-100"}`}
            >
              {getStepIcon(step.status)}
            </div>
            <span className="mt-2 text-xs font-medium text-center">
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingSteps;
