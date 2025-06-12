import React, { useState, useEffect } from 'react';
import type { ComplianceCheck } from '../../types';

interface KYCVerificationProps {
  investorId: string;
  onComplete: (result: ComplianceCheck) => void;
  onError: (error: Error) => void;
}

interface VerificationDetails {
  name: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  documentType: string;
  documentNumber: string;
  expiryDate: string;
  verificationStatus: string;
}

export const KYCVerification: React.FC<KYCVerificationProps> = ({
  investorId,
  onComplete,
  onError,
}) => {
  const [status, setStatus] = useState<ComplianceCheck['status']>('PENDING');
  const [verificationDetails, setVerificationDetails] = useState<VerificationDetails | null>(null);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  useEffect(() => {
    const fetchVerificationDetails = async () => {
      try {
        setStatus('IN_PROGRESS');
        // Mock verification details for demonstration
        setVerificationDetails({
          name: "Jane Smith",
          dateOfBirth: "1985-06-15",
          nationality: "United States",
          address: "123 Main St, New York, NY 10001",
          documentType: "Passport",
          documentNumber: "X1234567",
          expiryDate: "2028-06-14",
          verificationStatus: "Pending",
        });
      } catch (error) {
        onError(error as Error);
      }
    };

    fetchVerificationDetails();
  }, [investorId]);

  const handleVerification = async () => {
    try {
      setVerificationInProgress(true);

      // Mock verification process with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const check: ComplianceCheck = {
        id: crypto.randomUUID(),
        type: 'KYC',
        status: 'COMPLETED',
        result: 'PASS',
        details: {
          verificationTimestamp: new Date(),
          verificationMethod: "Document Verification",
          verificationProvider: "Mock KYC Provider",
          investorDetails: verificationDetails,
        },
        createdAt: new Date(),
        completedAt: new Date(),
      };

      onComplete(check);
    } catch (error) {
      onError(error as Error);
    } finally {
      setVerificationInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Identity Verification
          </h3>
          
          {verificationDetails && (
            <div className="mt-5 border-t border-gray-200">
              <dl className="divide-y divide-gray-200">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {verificationDetails.name}
                  </dd>
                </div>
                
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {verificationDetails.dateOfBirth}
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Nationality</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {verificationDetails.nationality}
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {verificationDetails.address}
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {verificationDetails.documentType}
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Document Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {verificationDetails.documentNumber}
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {verificationDetails.expiryDate}
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Verification Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {verificationDetails.verificationStatus}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-5">
            <button
              type="button"
              onClick={handleVerification}
              disabled={verificationInProgress}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {verificationInProgress ? (
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
                  Verifying...
                </>
              ) : (
                'Start Verification'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCVerification;