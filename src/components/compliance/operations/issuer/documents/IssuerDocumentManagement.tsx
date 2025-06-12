import React, { useState } from 'react';
import type { DocumentVerification } from '../../types';

interface IssuerDocumentManagementProps {
  issuerId: string;
  isRegulated: boolean;
  onDocumentVerified: (document: DocumentVerification) => void;
  onError: (error: Error) => void;
}

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  documents: DocumentRequirement[];
}

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  validityPeriod?: number; // in months
  maxSize?: number; // in MB
  allowedFormats: string[];
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'company_documents',
    name: 'Company Documents',
    description: 'Core company registration and incorporation documents',
    required: true,
    documents: [
      {
        id: 'certificate_incorporation',
        name: 'Certificate of Incorporation',
        description: 'Official company registration document',
        required: true,
        allowedFormats: ['.pdf'],
      },
      {
        id: 'memorandum_articles',
        name: 'Memorandum & Articles of Association',
        description: 'Company constitution and rules',
        required: true,
        allowedFormats: ['.pdf'],
      },
      {
        id: 'company_register',
        name: 'Commercial Register Extract',
        description: 'Recent extract from commercial register',
        required: true,
        validityPeriod: 3,
        allowedFormats: ['.pdf'],
      },
    ],
  },
  {
    id: 'regulatory_documents',
    name: 'Regulatory Documents',
    description: 'Licenses and regulatory compliance documents',
    required: true,
    documents: [
      {
        id: 'regulatory_status',
        name: 'Regulatory Status Documentation',
        description: 'Proof of regulatory status or exemption',
        required: true,
        allowedFormats: ['.pdf'],
      },
      {
        id: 'licenses',
        name: 'Business Licenses',
        description: 'All relevant business licenses',
        required: true,
        allowedFormats: ['.pdf'],
      },
    ],
  },
  {
    id: 'governance_documents',
    name: 'Governance Documents',
    description: 'Management and ownership documentation',
    required: true,
    documents: [
      {
        id: 'director_list',
        name: 'List of Directors',
        description: 'Current board of directors',
        required: true,
        allowedFormats: ['.pdf', '.xlsx'],
      },
      {
        id: 'shareholder_register',
        name: 'Shareholder Register',
        description: 'Current shareholders with >10% ownership',
        required: true,
        allowedFormats: ['.pdf', '.xlsx'],
      },
    ],
  },
  {
    id: 'financial_documents',
    name: 'Financial Documents',
    description: 'Financial statements and reports',
    required: true,
    documents: [
      {
        id: 'financial_statements',
        name: 'Latest Financial Statements',
        description: 'Audited financial statements',
        required: true,
        validityPeriod: 12,
        allowedFormats: ['.pdf'],
      },
    ],
  },
  {
    id: 'identification_documents',
    name: 'Identification Documents',
    description: 'Personal identification for key individuals',
    required: true,
    documents: [
      {
        id: 'director_id',
        name: 'Director ID Documents',
        description: 'Passport copies for all directors',
        required: true,
        allowedFormats: ['.pdf', '.jpg', '.png'],
      },
      {
        id: 'director_proof_address',
        name: 'Director Proof of Address',
        description: 'Recent utility bills or bank statements',
        required: true,
        validityPeriod: 3,
        allowedFormats: ['.pdf', '.jpg', '.png'],
      },
      {
        id: 'shareholder_id',
        name: 'Major Shareholder ID Documents',
        description: 'Passport copies for shareholders >10%',
        required: true,
        allowedFormats: ['.pdf', '.jpg', '.png'],
      },
    ],
  },
];

const UNREGULATED_ADDITIONAL_DOCUMENTS: DocumentCategory[] = [
  {
    id: 'additional_documents',
    name: 'Additional Requirements',
    description: 'Additional documents required for unregulated entities',
    required: true,
    documents: [
      {
        id: 'qualification_summary',
        name: 'Qualification Summary',
        description: 'Written summary of qualifications and experience',
        required: true,
        allowedFormats: ['.pdf'],
      },
      {
        id: 'business_description',
        name: 'Business Description',
        description: 'Detailed description of company business',
        required: true,
        allowedFormats: ['.pdf'],
      },
      {
        id: 'org_chart',
        name: 'Organizational Chart',
        description: 'Current organizational structure',
        required: true,
        allowedFormats: ['.pdf', '.png'],
      },
      {
        id: 'key_personnel_cv',
        name: 'Key Personnel CVs',
        description: 'CVs for key people in org chart',
        required: true,
        allowedFormats: ['.pdf'],
      },
      {
        id: 'aml_kyc_process',
        name: 'AML/KYC Process Description',
        description: 'Description of AML/KYC functions',
        required: true,
        allowedFormats: ['.pdf'],
      },
    ],
  },
];

export const IssuerDocumentManagement: React.FC<IssuerDocumentManagementProps> = ({
  issuerId,
  isRegulated,
  onDocumentVerified,
  onError,
}) => {
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [verifiedDocs, setVerifiedDocs] = useState<Set<string>>(new Set());

  const documentCategories = [
    ...DOCUMENT_CATEGORIES,
    ...(isRegulated ? [] : UNREGULATED_ADDITIONAL_DOCUMENTS),
  ];

  const handleFileUpload = async (
    categoryId: string,
    docId: string,
    file: File
  ): Promise<void> => {
    try {
      setUploadingDoc(docId);

      // TODO: Implement actual file upload and verification
      await new Promise(resolve => setTimeout(resolve, 2000));

      const verification: DocumentVerification = {
        id: crypto.randomUUID(),
        documentType: docId,
        status: 'PENDING',
        verificationMethod: 'AUTOMATED',
        verificationDate: new Date(),
      };

      setVerifiedDocs(prev => new Set([...prev, docId]));
      onDocumentVerified(verification);
    } catch (error) {
      onError(error as Error);
    } finally {
      setUploadingDoc(null);
    }
  };

  return (
    <div className="space-y-6">
      {documentCategories.map((category) => (
        <div key={category.id} className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {category.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{category.description}</p>

            <div className="mt-6 space-y-6">
              {category.documents.map((doc) => (
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
                      <p className="mt-1 text-sm text-gray-500">
                        Accepted formats: {doc.allowedFormats.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.required && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                      {verifiedDocs.has(doc.id) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <input
                      type="file"
                      accept={doc.allowedFormats.join(',')}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(category.id, doc.id, file);
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
      ))}
    </div>
  );
};