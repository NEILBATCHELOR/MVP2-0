import React, { useState, useEffect } from 'react';
import { useCompliance } from '../../context/ComplianceContext';
import type { RiskAssessment as RiskAssessmentType } from '../../types';

interface RiskAssessmentProps {
  investorId: string;
  investorType: string;
  countryId: string;
  onAssessmentComplete: (assessment: RiskAssessmentType) => void;
  onError: (error: Error) => void;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({
  investorId,
  investorType,
  countryId,
  onAssessmentComplete,
  onError,
}) => {
  const { getRiskLevel } = useCompliance();
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Record<string, number>>({});

  useEffect(() => {
    const assessRisk = async () => {
      try {
        setLoading(true);

        // TODO: Implement actual risk assessment logic
        // This is a mock implementation
        const riskFactors = {
          countryRisk: await calculateCountryRisk(countryId),
          investorTypeRisk: await calculateInvestorTypeRisk(investorType),
          transactionRisk: await calculateTransactionRisk(investorId),
          documentRisk: await calculateDocumentRisk(investorId),
        };

        setFactors(riskFactors);

        const assessment: RiskAssessmentType = {
          id: crypto.randomUUID(),
          entityId: investorId,
          entityType: 'INVESTOR',
          riskLevel: getRiskLevel(riskFactors),
          factors: Object.entries(riskFactors).map(([factor, score]) => ({
            factor,
            weight: 1, // TODO: Implement proper weight calculation
            score,
          })),
          totalScore: Object.values(riskFactors).reduce((a, b) => a + b, 0),
          assessedBy: 'system', // TODO: Get from auth context if manual assessment
          assessmentDate: new Date(),
          nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        };

        onAssessmentComplete(assessment);
      } catch (error) {
        onError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    assessRisk();
  }, [investorId, investorType, countryId]);

  // Mock risk calculation functions
  const calculateCountryRisk = async (countryId: string): Promise<number> => {
    // TODO: Implement actual country risk calculation
    return Math.random() * 100;
  };

  const calculateInvestorTypeRisk = async (type: string): Promise<number> => {
    // TODO: Implement actual investor type risk calculation
    return Math.random() * 100;
  };

  const calculateTransactionRisk = async (investorId: string): Promise<number> => {
    // TODO: Implement actual transaction risk calculation
    return Math.random() * 100;
  };

  const calculateDocumentRisk = async (investorId: string): Promise<number> => {
    // TODO: Implement actual document risk calculation
    return Math.random() * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Risk Assessment Factors
        </h3>
        <div className="mt-4 space-y-4">
          {Object.entries(factors).map(([factor, score]) => (
            <div key={factor} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {factor.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-sm text-gray-500">{Math.round(score)}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    score >= 75
                      ? 'bg-red-600'
                      : score >= 40
                      ? 'bg-yellow-400'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900">Risk Level</h4>
          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                getRiskLevel(factors) === 'HIGH'
                  ? 'bg-red-100 text-red-800'
                  : getRiskLevel(factors) === 'MEDIUM'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {getRiskLevel(factors)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};