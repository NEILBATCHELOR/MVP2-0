import React, { useState, useEffect } from 'react';
import type { ComplianceCheck } from '../../types';

interface KYBVerificationProps {
  issuerId: string;
  onComplete: (result: ComplianceCheck) => void;
  onError: (error: Error) => void;
}

interface CompanyDetails {
  name: string;
  registrationNumber: string;
  registrationCountry: string;
  registrationDate: string;
  status: string;
  directors: Array<{
    name: string;
    position: string;
    appointmentDate: string;
  }>;
  shareholders: Array<{
    name: string;
    ownershipPercentage: number;
  }>;
}

export const KYBVerification: React.FC<KYBVerificationProps> = ({
  issuerId,
  onComplete,
  onError,
}) => {
  const [status, setStatus] = useState<ComplianceCheck['status']>('PENDING');
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  useEffect(() => {
    const initializeVerification = async () => {
      try {
        setStatus('IN_PROGRESS');
        // TODO: Initialize actual KYB verification service
        // Mock company details for now
        setCompanyDetails({
          name: "Example Corp",
          registrationNumber: "12345678",
          registrationCountry: "GB",
          registrationDate: "2020-01-01",
          status: "Active",
          directors: [
            {
              name: "John Doe",
              position: "Director",
              appointmentDate: "2020-01-01"
            }
          ],
          shareholders: [
            {
              name: "John Doe",
              ownershipPercentage: 100
            }
          ]
        });
      } catch (error) {
        onError(error as Error);
      }
    };

    initializeVerification();
  }, [issuerId]);

  const handleVerification = async () => {
    try {
      setVerificationInProgress(true);

      // TODO: Implement actual verification logic
      await new Promise(resolve => setTimeout(resolve, 2000));

      const check: ComplianceCheck = {
        id: crypto.randomUUID(),
        type: 'KYB',
        status: 'COMPLETED',
        result: 'PASS',
        details: {
          companyDetails,
          verificationDate: new Date(),
          verificationProvider: 'Mock Provider'
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
            Business Verification
          </h3>
          
          {companyDetails && (
            <div className="mt-5 border-t border-gray-200">
              <dl className="divide-y divide-gray-200">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {companyDetails.name}
                  </dd>
                </div>
                
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {companyDetails.registrationNumber}
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Registration Country</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {companyDetails.registrationCountry}
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {companyDetails.status}
                    </span>
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Directors</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <ul className="divide-y divide-gray-200">
                      {companyDetails.directors.map((director, index) => (
                        <li key={index} className="py-2">
                          <div className="flex justify-between">
                            <span>{director.name}</span>
                            <span className="text-gray-500">{director.position}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Appointed: {director.appointmentDate}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Shareholders</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <ul className="divide-y divide-gray-200">
                      {companyDetails.shareholders.map((shareholder, index) => (
                        <li key={index} className="py-2">
                          <div className="flex justify-between">
                            <span>{shareholder.name}</span>
                            <span className="text-gray-500">
                              {shareholder.ownershipPercentage}%
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
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