/**
 * Validation Summary Component
 * Shows validation results, errors, and warnings in a consolidated view
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

interface ValidationSummaryProps {
  validationResult: ValidationResult | null;
  errors: Record<string, string>;
  warnings: string[];
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  validationResult,
  errors,
  warnings
}) => {
  // Combine validation errors with field errors
  const allErrors = [
    ...Object.values(errors),
    ...(validationResult?.errors || [])
  ].filter(Boolean);

  const allWarnings = [
    ...warnings,
    ...(validationResult?.warnings || [])
  ].filter(Boolean);

  const hasErrors = allErrors.length > 0;
  const hasWarnings = allWarnings.length > 0;
  const isValid = !hasErrors && validationResult?.valid !== false;

  // Don't render if no validation has occurred yet
  if (!validationResult && Object.keys(errors).length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <Card className={cn(
      "border-l-4",
      hasErrors ? "border-l-red-500 bg-red-50" : 
      hasWarnings ? "border-l-yellow-500 bg-yellow-50" : 
      "border-l-green-500 bg-green-50"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {hasErrors ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : hasWarnings ? (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          Validation Status
          <Badge 
            variant={hasErrors ? "destructive" : hasWarnings ? "secondary" : "default"}
            className={cn(
              !hasErrors && !hasWarnings && "bg-green-500 hover:bg-green-600"
            )}
          >
            {hasErrors ? "Invalid" : hasWarnings ? "Valid with Warnings" : "Valid"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {hasErrors ? (
            "Please fix the errors below before proceeding"
          ) : hasWarnings ? (
            "Form is valid but please review the warnings below"
          ) : (
            "All validation checks passed successfully"
          )}
        </CardDescription>
      </CardHeader>
      
      {(hasErrors || hasWarnings) && (
        <CardContent className="space-y-4">
          {/* Errors */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                Validation Errors 
                <Badge variant="destructive">{allErrors.length}</Badge>
              </AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  {allErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="flex items-center gap-2 text-yellow-800">
                Warnings
                <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                  {allWarnings.length}
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-yellow-700">
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  {allWarnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Additional validation info */}
          {!hasErrors && !hasWarnings && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">All Checks Passed</AlertTitle>
              <AlertDescription className="text-green-700">
                Your token configuration is valid and ready to be saved.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}

      {/* Quick status summary */}
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">
                {isValid ? "Valid" : "Invalid"}
              </span>
            </div>
            {hasErrors && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-600">
                  {allErrors.length} error{allErrors.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {hasWarnings && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-600">
                  {allWarnings.length} warning{allWarnings.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          
          {validationResult && (
            <div className="text-muted-foreground">
              Last validated: {new Date().toLocaleTimeString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationSummary;
