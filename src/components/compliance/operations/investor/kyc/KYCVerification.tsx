import React, { useState, useEffect } from 'react';
import type { ComplianceCheck } from '../../types';

interface KYCVerificationProps {
  investorId: string;
  onComplete: (result: ComplianceCheck) => void;
  onError: (error: Error) => void;
}

export const KYCVerification: React.FC<KYCVerificationProps> = ({
  investorId,
  onComplete,
  onError,
}) => {
  const [status, setStatus] = useState<ComplianceCheck['status']>('PENDING');
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  useEffect(() => {
    const initializeVerification = async () => {
      try {
        // TODO: Initialize Onfido SDK and create verification session
        setStatus('IN_PROGRESS');
        // Mock verification URL for now
        setVerificationUrl('https://api.onfido.com/verification');
      } catch (error) {
        onError(error as Error);
      }
    };

    initializeVerification();
  }, [investorId]);

  const handleVerificationComplete = async (result: any) => {
    try {
      const check: ComplianceCheck = {
        id: crypto.randomUUID(),
        type: 'KYC',
        status: 'COMPLETED',
        result: result.status === 'clear' ? 'PASS' : 'REVIEW_REQUIRED',
        details: result,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      onComplete(check);
    } catch (error) {
      onError(error as Error);
    }
  };

  if (!verificationUrl) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Identity Verification Required
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              We need to verify your identity to comply with regulatory requirements.
              This process is secure and typically takes less than 5 minutes.
            </p>
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                // TODO: Launch Onfido SDK
                console.log('Launching verification flow');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Start Verification
            </button>
          </div>
        </div>
      </div>

      {status === 'IN_PROGRESS' && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                Verification in progress. Please complete all required steps.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};