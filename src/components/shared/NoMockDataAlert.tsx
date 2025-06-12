import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoMockDataAlertProps {
  title?: string;
  description?: string;
  entityName: string;
  onCreateData?: () => void;
}

const NoMockDataAlert: React.FC<NoMockDataAlertProps> = ({
  title,
  description,
  entityName,
  onCreateData,
}) => {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title || `No ${entityName} Data Found`}</AlertTitle>
      <AlertDescription className="mt-2">
        {description ||
          `There are no ${entityName.toLowerCase()} records in the database yet.`}
        {onCreateData && (
          <div className="mt-4">
            <Button onClick={onCreateData} size="sm">
              Create {entityName}
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default NoMockDataAlert;
