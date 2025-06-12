import React, { Suspense } from 'react';
import { useOnboarding } from '../context/OnboardingContext';

export function OnboardingFlow() {
  const { state } = useOnboarding();
  const currentStepData = state.steps[state.currentStep - 1];

  if (!currentStepData) {
    return null;
  }

  const StepComponent = currentStepData.component;

  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        <span className="ml-2">Loading step...</span>
      </div>
    }>
      <StepComponent />
    </Suspense>
  );
} 