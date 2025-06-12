import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingContextType {
  currentStep: number;
  formData: Record<string, any>;
  updateFormData: (data: Record<string, any>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  isDevelopmentMode: boolean;
}

const defaultContextValue: OnboardingContextType = {
  currentStep: 0,
  formData: {},
  updateFormData: () => {},
  nextStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
  isDevelopmentMode: false,
};

const OnboardingContext = createContext<OnboardingContextType>(defaultContextValue);

interface OnboardingProviderProps {
  children: ReactNode;
  initialStep?: number;
  initialData?: Record<string, any>;
  totalSteps?: number;
  isDevelopmentMode?: boolean;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
  initialStep = 0,
  initialData = {},
  totalSteps = 5,
  isDevelopmentMode = false,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  const updateFormData = (data: Record<string, any>) => {
    setFormData(prevData => ({
      ...prevData,
      ...data,
    }));
  };

  const nextStep = () => {
    setCurrentStep(prev => (prev < totalSteps - 1 ? prev + 1 : prev));
  };

  const prevStep = () => {
    setCurrentStep(prev => (prev > 0 ? prev - 1 : prev));
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        formData,
        updateFormData,
        nextStep,
        prevStep,
        goToStep,
        isDevelopmentMode,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};