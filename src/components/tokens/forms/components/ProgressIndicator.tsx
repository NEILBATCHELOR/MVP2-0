/**
 * Progress Indicator Component
 * Shows multi-step form progress with clickable steps
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isComplete: boolean;
  hasErrors: boolean;
}

interface ProgressIndicatorProps {
  steps: FormStep[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick
}) => {
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return steps[stepIndex].hasErrors ? 'error' : 'complete';
    } else if (stepIndex === currentStep) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  const getStepIcon = (step: FormStep, stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    
    switch (status) {
      case 'complete':
        return step.hasErrors ? (
          <AlertCircle className="h-5 w-5 text-red-500" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-500" />
        );
      case 'current':
        return (
          <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
        );
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepColor = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    
    switch (status) {
      case 'complete':
        return steps[stepIndex].hasErrors ? 'text-red-600' : 'text-green-600';
      case 'current':
        return 'text-blue-600';
      default:
        return 'text-gray-500';
    }
  };

  const isStepClickable = (stepIndex: number) => {
    // Allow clicking on completed steps and current step
    return stepIndex <= currentStep;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center space-y-2 flex-1">
                <Button
                  variant="ghost"
                  className={cn(
                    "h-auto p-2 rounded-full",
                    isStepClickable(index) && "hover:bg-gray-100 cursor-pointer",
                    !isStepClickable(index) && "cursor-not-allowed opacity-50"
                  )}
                  onClick={() => isStepClickable(index) && onStepClick(index)}
                  disabled={!isStepClickable(index)}
                >
                  {getStepIcon(step, index)}
                </Button>
                
                <div className="text-center space-y-1">
                  <div className={cn("text-sm font-medium", getStepColor(index))}>
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground max-w-24">
                    {step.description}
                  </div>
                  
                  {/* Status badges */}
                  {getStepStatus(index) === 'complete' && step.hasErrors && (
                    <Badge variant="destructive" className="text-xs">
                      Has Errors
                    </Badge>
                  )}
                  {getStepStatus(index) === 'complete' && !step.hasErrors && (
                    <Badge variant="default" className="text-xs bg-green-500">
                      Complete
                    </Badge>
                  )}
                  {getStepStatus(index) === 'current' && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-gray-200 mx-4 mt-4">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      index < currentStep ? "bg-green-500" : "bg-gray-200"
                    )}
                    style={{
                      width: index < currentStep ? '100%' : '0%'
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Current step details */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            {steps[currentStep].icon}
            <div>
              <div className="font-medium text-blue-900">
                Step {currentStep + 1}: {steps[currentStep].title}
              </div>
              <div className="text-sm text-blue-700">
                {steps[currentStep].description}
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Progress: {currentStep + 1} of {steps.length} steps
          </div>
          <div>
            {steps.filter(step => step.isComplete && !step.hasErrors).length} completed successfully
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressIndicator;
