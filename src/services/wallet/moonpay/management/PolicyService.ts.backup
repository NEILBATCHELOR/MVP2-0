/**
 * MoonPay Policy Management Service
 * Handles compliance policies, KYC rules, and business logic policies
 */

export interface MoonpayPolicy {
  id: string;
  name: string;
  description?: string;
  type: 'kyc' | 'transaction' | 'compliance' | 'risk' | 'geographic' | 'payment_method';
  chain?: string;
  evaluationMethod: 'all' | 'any' | 'threshold';
  minimumRulesRequired?: number;
  isActive: boolean;
  priority: number;
  rules: MoonpayPolicyRule[];
  createdAt: string;
  updatedAt: string;
  appliedToCustomers: number;
  violationCount: number;
  lastTriggered?: string;
}

export interface MoonpayPolicyRule {
  id: string;
  type: 'amount_limit' | 'geographic_restriction' | 'document_verification' | 'risk_score' | 'payment_method' | 'time_restriction' | 'custom';
  condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains' | 'regex';
  field: string;
  value: any;
  action: 'allow' | 'deny' | 'review' | 'require_additional_verification' | 'apply_fee' | 'reduce_limit';
  parameters?: Record<string, any>;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'starter' | 'standard' | 'premium' | 'enterprise';
  rules: Omit<MoonpayPolicyRule, 'id' | 'createdAt'>[];
  recommendedFor: string[];
  complianceLevel: 'basic' | 'enhanced' | 'strict';
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  policyName: string;
  customerId: string;
  transactionId?: string;
  ruleId: string;
  ruleType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewed' | 'resolved' | 'escalated';
  violationData: {
    field: string;
    actualValue: any;
    expectedValue: any;
    condition: string;
  };
  actionTaken: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyPerformanceMetrics {
  policyId: string;
  policyName: string;
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    totalEvaluations: number;
    violationsDetected: number;
    falsePositives: number;
    truePositives: number;
    accuracy: number;
    averageProcessingTime: number;
    customersAffected: number;
    revenueImpact: number;
  };
  trends: {
    violationTrend: 'increasing' | 'decreasing' | 'stable';
    accuracyTrend: 'improving' | 'degrading' | 'stable';
    performanceTrend: 'faster' | 'slower' | 'stable';
  };
}

/**
 * Policy Management Service for MoonPay
 */
export class PolicyService {
  private apiBaseUrl: string;
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey: string, secretKey: string, testMode: boolean = true) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.apiBaseUrl = testMode 
      ? "https://api.ethpass.xyz" 
      : "https://api.ethpass.xyz";
  }

  /**
   * Get all policies
   */
  async getPolicies(
    type?: string,
    isActive?: boolean,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ policies: MoonpayPolicy[]; total: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive: isActive.toString() })
      });

      const response = await fetch(`${this.apiBaseUrl}/v0/policies?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get policies API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        policies: data.policies || [],
        total: data.total || 0,
        hasMore: data.hasMore || false
      };
    } catch (error) {
      console.error('Error getting policies:', error);
      throw new Error(`Failed to get policies: ${error.message}`);
    }
  }

  /**
   * Get specific policy by ID
   */
  async getPolicyById(policyId: string): Promise<MoonpayPolicy> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/policies/${policyId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get policy API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting policy:', error);
      throw new Error(`Failed to get policy: ${error.message}`);
    }
  }

  /**
   * Create a new policy
   */
  async createPolicy(policyData: Omit<MoonpayPolicy, 'id' | 'createdAt' | 'updatedAt' | 'appliedToCustomers' | 'violationCount'>): Promise<MoonpayPolicy> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/policies`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(policyData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create policy API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating policy:', error);
      throw new Error(`Failed to create policy: ${error.message}`);
    }
  }

  /**
   * Update an existing policy
   */
  async updatePolicy(policyId: string, updateData: Partial<MoonpayPolicy>): Promise<MoonpayPolicy> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/policies/${policyId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Update policy API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating policy:', error);
      throw new Error(`Failed to update policy: ${error.message}`);
    }
  }

  /**
   * Delete a policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/policies/${policyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Delete policy API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      throw new Error(`Failed to delete policy: ${error.message}`);
    }
  }

  /**
   * Verify policies against test data
   */
  async verifyPolicies(testData: {
    customerId?: string;
    transactionData?: any;
    customerData?: any;
    policyIds?: string[];
  }): Promise<{
    results: Array<{
      policyId: string;
      policyName: string;
      passed: boolean;
      violatedRules: string[];
      recommendedAction: string;
      riskScore: number;
    }>;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    recommendedActions: string[];
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/policies/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Verify policies API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying policies:', error);
      throw new Error(`Failed to verify policies: ${error.message}`);
    }
  }

  /**
   * Get policy templates
   */
  async getPolicyTemplates(category?: string): Promise<PolicyTemplate[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`${this.apiBaseUrl}/v0/policies/templates?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Policy templates API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting policy templates:', error);
      // Return default templates if API fails
      return this.getDefaultPolicyTemplates();
    }
  }

  /**
   * Create policy from template
   */
  async createPolicyFromTemplate(
    templateId: string, 
    customizations: {
      name: string;
      description?: string;
      parameters?: Record<string, any>;
    }
  ): Promise<MoonpayPolicy> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/policies/from-template`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          ...customizations
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create from template API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating policy from template:', error);
      throw new Error(`Failed to create policy from template: ${error.message}`);
    }
  }

  /**
   * Get policy violations
   */
  async getPolicyViolations(
    policyId?: string,
    severity?: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ violations: PolicyViolation[]; total: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(policyId && { policyId }),
        ...(severity && { severity }),
        ...(status && { status })
      });

      const response = await fetch(`${this.apiBaseUrl}/v0/policies/violations?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Violations API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        violations: data.violations || [],
        total: data.total || 0,
        hasMore: data.hasMore || false
      };
    } catch (error) {
      console.error('Error getting policy violations:', error);
      throw new Error(`Failed to get policy violations: ${error.message}`);
    }
  }

  /**
   * Resolve policy violation
   */
  async resolveViolation(
    violationId: string, 
    resolution: {
      action: 'approve' | 'deny' | 'escalate' | 'require_review';
      notes: string;
      reviewerId: string;
    }
  ): Promise<PolicyViolation> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/policies/violations/${violationId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resolution)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Resolve violation API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error resolving violation:', error);
      throw new Error(`Failed to resolve violation: ${error.message}`);
    }
  }

  /**
   * Get policy performance metrics
   */
  async getPolicyMetrics(
    policyId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<PolicyPerformanceMetrics> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/policies/${policyId}/metrics?period=${period}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Policy metrics API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting policy metrics:', error);
      throw new Error(`Failed to get policy metrics: ${error.message}`);
    }
  }

  /**
   * Bulk operations on policies
   */
  async bulkUpdatePolicies(
    policyIds: string[],
    updateData: { isActive?: boolean; priority?: number }
  ): Promise<{ updated: number; failed: number; errors: string[] }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v0/policies/bulk-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          policyIds,
          updateData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Bulk update API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error bulk updating policies:', error);
      throw new Error(`Failed to bulk update policies: ${error.message}`);
    }
  }

  // Private helper methods

  private getDefaultPolicyTemplates(): PolicyTemplate[] {
    return [
      {
        id: 'basic-kyc',
        name: 'Basic KYC Policy',
        description: 'Standard identity verification requirements',
        category: 'starter',
        complianceLevel: 'basic',
        recommendedFor: ['Small businesses', 'Startups'],
        rules: [
          {
            type: 'document_verification',
            condition: 'equals',
            field: 'identityStatus',
            value: 'passed',
            action: 'allow',
            description: 'Require valid identity document',
            isActive: true
          },
          {
            type: 'amount_limit',
            condition: 'greater_than',
            field: 'transactionAmount',
            value: 10000,
            action: 'review',
            description: 'Review transactions over $10,000',
            isActive: true
          }
        ]
      },
      {
        id: 'enhanced-compliance',
        name: 'Enhanced Compliance Policy',
        description: 'Strict compliance for financial institutions',
        category: 'enterprise',
        complianceLevel: 'strict',
        recommendedFor: ['Banks', 'Financial institutions', 'Large enterprises'],
        rules: [
          {
            type: 'risk_score',
            condition: 'greater_than',
            field: 'riskScore',
            value: 50,
            action: 'deny',
            description: 'Block high-risk customers',
            isActive: true
          },
          {
            type: 'geographic_restriction',
            condition: 'in',
            field: 'country',
            value: ['US', 'UK', 'EU'],
            action: 'allow',
            description: 'Only allow approved countries',
            isActive: true
          }
        ]
      }
    ];
  }
}

export const policyService = new PolicyService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
