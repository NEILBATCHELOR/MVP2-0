import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { FailedSaveField } from '../utils/saveStateComparison';

interface SaveErrorDisplayProps {
  failedFields: FailedSaveField[];
  onRetry?: () => void;
}

/**
 * Component to display fields that failed to save
 */
const SaveErrorDisplay: React.FC<SaveErrorDisplayProps> = ({ 
  failedFields,
  onRetry
}) => {
  if (!failedFields || failedFields.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="mb-2">Save Error</AlertTitle>
      <AlertDescription>
        <p className="mb-2">The following fields failed to save:</p>
        <ul className="list-disc pl-5 space-y-1">
          {failedFields.map((field, index) => (
            <li key={index} className="text-sm">
              <span className="font-medium">{field.displayName}:</span> 
              <span className="ml-1">Failed to update from "{field.oldValue}" to "{field.newValue}"</span>
            </li>
          ))}
        </ul>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm font-medium"
          >
            Retry Save
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default SaveErrorDisplay; 