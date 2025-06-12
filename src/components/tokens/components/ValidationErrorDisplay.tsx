import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ValidationErrorDisplayProps {
  errors: string[] | Record<string, string[]>;
  title?: string;
}

/**
 * Component to display validation errors in a user-friendly format
 * Can accept either an array of error strings or a record of field-to-errors mapping
 */
const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  errors,
  title = 'Validation Issues'
}) => {
  if (!errors || (Array.isArray(errors) && errors.length === 0) || 
      (!Array.isArray(errors) && Object.keys(errors).length === 0)) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ScrollArea className="max-h-[200px] pr-4">
          {Array.isArray(errors) ? (
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-3 mt-2">
              {Object.entries(errors).map(([field, fieldErrors]) => (
                <div key={field}>
                  <Badge variant="outline" className="mb-1">
                    {field}
                  </Badge>
                  <ul className="list-disc pl-5 space-y-1">
                    {fieldErrors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </AlertDescription>
    </Alert>
  );
};

export default ValidationErrorDisplay;