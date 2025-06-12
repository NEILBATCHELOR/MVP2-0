import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children }) => {
  const {
    state,
    isDevelopmentMode,
    toggleDevelopmentMode,
    prevStep,
    nextStep
  } = useOnboarding();

  const currentStep = state.currentStep;
  const totalSteps = state.steps.length;
  const progress = (currentStep / totalSteps) * 100;

  const currentStepData = state.steps[currentStep - 1];

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{currentStepData?.title}</h2>
              <p className="text-gray-600">{currentStepData?.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="development-mode"
                checked={isDevelopmentMode}
                onCheckedChange={toggleDevelopmentMode}
              />
              <Label htmlFor="development-mode">Development Mode</Label>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {isDevelopmentMode && (
          <Alert className="mb-6">
            <AlertDescription>
              Development mode is enabled. Form validation will be bypassed for quicker navigation.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          {children}
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <Button
            onClick={nextStep}
            disabled={currentStep === totalSteps}
          >
            {currentStep === totalSteps ? 'Complete' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'verified':
      return 'text-green-600';
    case 'in_progress':
      return 'text-blue-600';
    case 'action_required':
      return 'text-yellow-600';
    case 'rejected':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default OnboardingLayout;