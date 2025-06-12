import React, { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
}

const OnboardingLayout = ({
  children,
  currentStep,
  totalSteps,
  title,
  description,
}: OnboardingLayoutProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Chain Capital SPV</h1>
          </div>
          <div className="text-sm text-gray-500">
            Need help?{" "}
            <a href="#" className="text-primary">
              Contact support
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <span className="text-sm font-medium text-gray-500">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <p className="text-gray-600 mb-4">{description}</p>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">{children}</div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Chain Capital - Unlock Trapped
          Capital at Scale. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default OnboardingLayout;
