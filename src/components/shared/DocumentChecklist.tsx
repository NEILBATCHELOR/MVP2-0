import React from "react";
import { CheckCircle, AlertCircle, Clock, FileUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface DocumentItem {
  id: string;
  name: string;
  status: "verified" | "rejected" | "pending" | "not_uploaded";
  required: boolean;
  description?: string;
  message?: string;
}

interface DocumentChecklistProps {
  documents: DocumentItem[];
  userType: "issuer" | "investor";
  onSelectDocument?: (documentId: string) => void;
  selectedDocumentId?: string | null;
}

const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  documents,
  userType,
  onSelectDocument,
  selectedDocumentId,
}) => {
  // Calculate completion percentage
  const requiredDocuments = documents.filter((doc) => doc.required);
  const uploadedRequiredDocuments = requiredDocuments.filter(
    (doc) => doc.status !== "not_uploaded",
  );
  const completionPercentage = requiredDocuments.length
    ? Math.round(
        (uploadedRequiredDocuments.length / requiredDocuments.length) * 100,
      )
    : 0;

  // Check if all required documents are uploaded
  const allRequiredUploaded = requiredDocuments.every(
    (doc) => doc.status !== "not_uploaded",
  );

  const getStatusIcon = (status: DocumentItem["status"]) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "not_uploaded":
        return <FileUp className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: DocumentItem["status"]) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "rejected":
        return "Rejected - Please reupload";
      case "pending":
        return "Pending verification";
      case "not_uploaded":
        return "Not uploaded";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">
          {userType === "issuer" ? "Issuer" : "Investor"} Document Checklist
        </h3>
        <Badge
          className={`${
            completionPercentage === 100
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {completionPercentage}% Complete
        </Badge>
      </div>

      <Progress value={completionPercentage} className="h-2 mb-4" />

      {!allRequiredUploaded && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please upload all required documents to proceed.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`border rounded-md p-4 cursor-pointer transition-colors ${
              selectedDocumentId === doc.id
                ? "border-primary bg-primary/5"
                : "hover:bg-gray-50"
            }`}
            onClick={() => onSelectDocument && onSelectDocument(doc.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(doc.status)}
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-sm text-gray-500">
                    {getStatusText(doc.status)}
                  </p>
                  {doc.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
              {doc.required && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Required
                </span>
              )}
            </div>
            {doc.status === "rejected" && doc.message && (
              <div className="mt-2 p-2 bg-red-50 text-sm text-red-700 rounded">
                {doc.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentChecklist;
