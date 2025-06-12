import React, { useState } from 'react';
import { useCompliance } from '../../context/ComplianceContext';
import type { DocumentVerification as DocumentVerificationType } from '../../types';

interface DocumentVerificationProps {
  investorId: string;
  investorType: string;
  onDocumentVerified: (document: DocumentVerificationType) => void;
  onError: (error: Error) => void;
}

export const DocumentVerification: React.FC<DocumentVerificationProps> = ({
  investorId,
  investorType,
  onDocumentVerified,
  onError,
}) => {
  const { getRequiredDocuments } = useCompliance();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const requiredDocuments = getRequiredDocuments(investorType);

  const handleFileUpload = async (
    documentType: string,
    file: File
  ): Promise<void> => {
    try {
      setUploadingDoc(documentType);

      // TODO: Implement actual file upload and document verification
      // This is a mock implementation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const verification: DocumentVerificationType = {
        id: crypto.randomUUID(),
        documentType,
        status: 'PENDING',
        verificationMethod: 'AUTOMATED',
        verificationDate: new Date(),
      };

      onDocumentVerified(verification);
    } catch (error) {
      onError(error as Error);
    } finally {
      setUploadingDoc(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Required Documents
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Please upload the following documents. All documents must be clear,
              legible, and unexpired.
            </p>
          </div>
          <div className="mt-5 space-y-4">
            {requiredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="border rounded-lg p-4 space-y-4 bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      {doc.name}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                      {doc.description}
                    </p>
                    {doc.validityPeriod && (
                      <p className="mt-1 text-sm text-gray-500">
                        Must be less than {doc.validityPeriod} months old
                      </p>
                    )}
                  </div>
                  {doc.required && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Required
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(doc.id, file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {uploadingDoc === doc.id && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Document Guidelines
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <ul className="list-disc pl-5 space-y-2">
              <li>All documents must be in PDF, JPG, or PNG format</li>
              <li>Maximum file size: 10MB per document</li>
              <li>Documents must be clear and legible</li>
              <li>No screenshots or photos of screens are accepted</li>
              <li>Documents must be in color (no black and white copies)</li>
              <li>All four corners of the document must be visible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};