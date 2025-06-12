import { useState, useEffect } from "react";
import { ComplianceData } from "@/services/dashboard/dashboardDataService";
import { 
  verifyKyc, 
  checkAccreditationStatus, 
  getJurisdictionRules, 
  validateJurisdictionCompliance, 
  calculateRiskScore 
} from "@/services/compliance/complianceService";

export function useCompliance(organizationId: string = "default-org") {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(
    null,
  );

  // Verify KYC for a user
  const verifyUserKyc = async (userId: string) => {
    setLoading(true);
    try {
      const response = await verifyKyc(userId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (err) {
      setError(err.message || "Failed to verify KYC");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check accreditation status for a user
  const checkUserAccreditation = async (userId: string) => {
    setLoading(true);
    try {
      const response = await checkAccreditationStatus(userId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (err) {
      setError(err.message || "Failed to check accreditation status");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get rules for a specific jurisdiction
  const getJurisdictionRulesForLocation = async (jurisdiction: string) => {
    setLoading(true);
    try {
      const response = await getJurisdictionRules(jurisdiction);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (err) {
      setError(err.message || "Failed to get jurisdiction rules");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Validate compliance with jurisdiction rules
  const validateCompliance = async (
    jurisdiction: string,
    investorCount: number,
    minimumInvestment: number,
  ) => {
    setLoading(true);
    try {
      const response = await validateJurisdictionCompliance(
        jurisdiction,
        investorCount,
        minimumInvestment,
      );
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (err) {
      setError(err.message || "Failed to validate compliance");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calculate risk score for a user
  const calculateUserRiskScore = async (
    userId: string,
    jurisdiction: string,
    investmentAmount: number,
  ) => {
    setLoading(true);
    try {
      const response = await calculateRiskScore(
        userId,
        jurisdiction,
        investmentAmount,
      );
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (err) {
      setError(err.message || "Failed to calculate risk score");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    complianceData,
    verifyUserKyc,
    checkUserAccreditation,
    getJurisdictionRulesForLocation,
    validateCompliance,
    calculateUserRiskScore,
  };
}
