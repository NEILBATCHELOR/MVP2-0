import React, { useState, useEffect } from 'react';
import { KYCVerification } from './kyc/KYCVerification';
import { DocumentVerification } from './documents/DocumentVerification';
import { RiskAssessment } from './risk/RiskAssessment';
import { ApprovalWorkflow } from './approval/ApprovalWorkflow';
import type {
  ComplianceCheck,
  DocumentVerification as DocumentVerificationType,
  RiskAssessment as RiskAssessmentType,
  ApprovalWorkflow as ApprovalWorkflowType,
  InvestorCompliance as InvestorComplianceType,
} from '../types';

interface InvestorComplianceProps {
  investorId: string;
  investorType: string;
  countryId: string;
  onComplete: (compliance: InvestorComplianceType) => void;
  onError: (error: Error) => void;
}

export const InvestorCompliance: React.FC<InvestorComplianceProps> = ({
  investorId,
  investorType,
  countryId,
  onComplete,
  onError,
}) => {
  const [compliance, setCompliance] = useState<InvestorComplianceType>({
    investorId,
    status: 'PENDING',
    kycStatus: 'NOT_STARTED',
    amlStatus: 'NOT_STARTED',
    documents: [],
    checks: [],
    updatedAt: new Date(),
  });

  const handleKYCComplete = (check: ComplianceCheck) => {
    setCompliance((prev) => ({
      ...prev,
      kycStatus: check.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
      checks: [...prev.checks, check],
      updatedAt: new Date(),
    }));
  };

  const handleDocumentVerified = (doc: DocumentVerificationType) => {
    setCompliance((prev) => ({
      ...prev,
      documents: [...prev.documents, doc],
      updatedAt: new Date(),
    }));
  };

  const handleRiskAssessmentComplete = (assessment: RiskAssessmentType) => {
    setCompliance((prev) => ({
      ...prev,
      riskAssessment: assessment,
      updatedAt: new Date(),
    }));
  };

  const handleApprovalComplete = (workflow: ApprovalWorkflowType) => {
    setCompliance((prev) => ({
      ...prev,
      approvalWorkflow: workflow,
      status: workflow.status as InvestorComplianceType['status'],
      updatedAt: new Date(),
    }));

    if (workflow.status === 'APPROVED' || workflow.status === 'REJECTED') {
      onComplete({
        ...compliance,
        approvalWorkflow: workflow,
        status: workflow.status as InvestorComplianceType['status'],
        updatedAt: new Date(),
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-gray-900">KYC Verification</h2>
        <div className="mt-4">
          <KYCVerification
            investorId={investorId}
            onComplete={handleKYCComplete}
            onError={onError}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900">Document Verification</h2>
        <div className="mt-4">
          <DocumentVerification
            investorId={investorId}
            investorType={investorType}
            onDocumentVerified={handleDocumentVerified}
            onError={onError}
          />
        </div>
      </div>

      {compliance.kycStatus === 'COMPLETED' && compliance.documents.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900">Risk Assessment</h2>
          <div className="mt-4">
            <RiskAssessment
              investorId={investorId}
              investorType={investorType}
              countryId={countryId}
              onAssessmentComplete={handleRiskAssessmentComplete}
              onError={onError}
            />
          </div>
        </div>
      )}

      {compliance.riskAssessment && (
        <div>
          <h2 className="text-lg font-medium text-gray-900">Approval Workflow</h2>
          <div className="mt-4">
            <ApprovalWorkflow
              investorId={investorId}
              riskLevel={compliance.riskAssessment.riskLevel}
              onApprovalComplete={handleApprovalComplete}
              onError={onError}
            />
          </div>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Compliance Status
          </h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Overall Status
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  compliance.status === 'APPROVED'
                    ? 'bg-green-100 text-green-800'
                    : compliance.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {compliance.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">KYC Status</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  compliance.kycStatus === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : compliance.kycStatus === 'FAILED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {compliance.kycStatus}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Documents Verified
              </span>
              <span className="text-sm text-gray-900">
                {compliance.documents.length}
              </span>
            </div>

            {compliance.riskAssessment && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Risk Level
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    compliance.riskAssessment.riskLevel === 'HIGH'
                      ? 'bg-red-100 text-red-800'
                      : compliance.riskAssessment.riskLevel === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {compliance.riskAssessment.riskLevel}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};