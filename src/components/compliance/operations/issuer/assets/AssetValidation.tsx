import React, { useState } from 'react';
import type { ComplianceCheck } from '../../types';

interface AssetValidationProps {
  issuerId: string;
  assetId: string;
  assetType: 'REAL_ESTATE' | 'SECURITY' | 'FUND' | 'OTHER';
  assetDetails: {
    name: string;
    description: string;
    location?: string;
    identifier?: string;
  };
  onComplete: (result: ComplianceCheck) => void;
  onError: (error: Error) => void;
}

interface ValidationResult {
  status: 'VERIFIED' | 'FAILED' | 'PENDING';
  details: {
    ownership: boolean;
    value: boolean;
    restrictions: boolean;
    location?: boolean;
    additionalChecks: Record<string, boolean>;
  };
  messages: string[];
}

export const AssetValidation: React.FC<AssetValidationProps> = ({
  issuerId,
  assetId,
  assetType,
  assetDetails,
  onComplete,
  onError,
}) => {
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateAsset = async () => {
    try {
      setValidating(true);

      // TODO: Integrate with Cube3 API for asset validation
      // Mock validation for now
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result: ValidationResult = {
        status: 'VERIFIED',
        details: {
          ownership: true,
          value: true,
          restrictions: true,
          location: assetType === 'REAL_ESTATE' ? true : undefined,
          additionalChecks: {
            legalStatus: true,
            regulatoryCompliance: true,
          },
        },
        messages: [
          'Asset ownership verified through public records',
          'No legal restrictions found',
          'Asset valuation within expected range',
        ],
      };

      setValidationResult(result);

      const check: ComplianceCheck = {
        id: crypto.randomUUID(),
        type: 'ASSET',
        status: 'COMPLETED',
        result: result.status === 'VERIFIED' ? 'PASS' : 'FAIL',
        details: {
          assetId,
          assetType,
          validationResult: result,
          validationDate: new Date(),
        },
        createdAt: new Date(),
        completedAt: new Date(),
      };

      onComplete(check);
    } catch (error) {
      onError(error as Error);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Asset Validation
          </h3>

          <div className="mt-5 border-t border-gray-200">
            <dl className="divide-y divide-gray-200">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Asset Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {assetDetails.name}
                </dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Asset Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {assetType.replace('_', ' ')}
                </dd>
              </div>

              {assetDetails.location && (
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {assetDetails.location}
                  </dd>
                </div>
              )}

              {assetDetails.identifier && (
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Identifier</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {assetDetails.identifier}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {validationResult && (
            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Validation Results</h4>
              
              <div className="rounded-md bg-gray-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    {validationResult.status === 'VERIFIED' ? (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Status: {validationResult.status}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <ul className="list-disc pl-5 space-y-1">
                        {validationResult.messages.map((message, index) => (
                          <li key={index}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(validationResult.details).map(([check, passed]) => (
                  typeof passed === 'boolean' && (
                    <div key={check} className="flex items-center space-x-3">
                      {passed ? (
                        <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-sm text-gray-900">
                        {check.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <button
              type="button"
              onClick={validateAsset}
              disabled={validating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {validating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Validating...
                </>
              ) : (
                'Validate Asset'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};