/**
 * MoonPay Compliance Service
 * Advanced compliance monitoring, AML screening, and regulatory compliance management
 */

export interface ComplianceProfile {
  customerId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  kycStatus: 'not_started' | 'pending' | 'passed' | 'failed' | 'expired' | 'under_review';
  amlStatus: 'clear' | 'flagged' | 'under_review' | 'blocked';
  sanctionsCheck: {
    status: 'clear' | 'match' | 'potential_match' | 'error';
    lastChecked: string;
    source: string;
    details?: {
      matchType: 'exact' | 'fuzzy' | 'alias';
      confidence: number;
      listName: string;
      matchedName: string;
    };
  };
  pepCheck: {
    status: 'clear' | 'match' | 'potential_match' | 'error';
    lastChecked: string;
    details?: {
      position: string;
      country: string;
      confidence: number;
    };
  };
  watchlistScreening: {
    status: 'clear' | 'flagged' | 'pending';
    lastScreened: string;
    lists: string[];
    matches: Array<{
      listName: string;
      matchType: string;
      confidence: number;
      entity: string;
    }>;
  };
  transactionMonitoring: {
    totalVolume: number;
    suspiciousActivityFlags: number;
    lastAlert: string;
    patterns: string[];
  };
  documentVerification: {
    status: 'pending' | 'verified' | 'rejected' | 'expired';
    documents: Array<{
      type: string;
      status: string;
      verifiedAt?: string;
      expiryDate?: string;
      rejectionReason?: string;
    }>;
  };
  complianceHistory: Array<{
    date: string;
    action: string;
    result: string;
    details: string;
    reviewer?: string;
  }>;
  nextReview: string;
  lastUpdated: string;
}

export interface TransactionAlert {
  id: string;
  transactionId: string;
  customerId: string;
  alertType: 'velocity' | 'amount' | 'pattern' | 'geolocation' | 'sanctions' | 'manual_review';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'escalated' | 'resolved' | 'false_positive';
  description: string;
  details: {
    triggers: string[];
    thresholds: Record<string, number>;
    riskFactors: Record<string, any>;
    relatedTransactions: string[];
  };
  assignedTo?: string;
  investigation: {
    startedAt?: string;
    findings: Array<{
      timestamp: string;
      investigator: string;
      finding: string;
      evidence: string[];
    }>;
    conclusion?: string;
    actions: string[];
  };
  resolution?: {
    action: 'approve' | 'reject' | 'block_customer' | 'require_additional_info' | 'escalate';
    reason: string;
    resolvedBy: string;
    resolvedAt: string;
    notes: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  type: 'transaction_limit' | 'velocity_check' | 'pattern_detection' | 'geographic_restriction' | 'custom';
  description: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains' | 'regex';
    value: any;
    timeframe?: string;
  }>;
  actions: Array<{
    type: 'alert' | 'block' | 'review' | 'notify' | 'escalate';
    parameters: Record<string, any>;
  }>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  scope: {
    countries: string[];
    customerSegments: string[];
    transactionTypes: string[];
  };
  thresholds: {
    amount?: number;
    frequency?: number;
    volume?: number;
    timeWindow?: string;
  };
  whitelistExceptions: string[];
  metadata: {
    createdBy: string;
    approvedBy: string;
    regulatoryBasis: string;
    reviewFrequency: string;
    lastReview: string;
    nextReview: string;
  };
  performance: {
    triggerCount: number;
    falsePositiveRate: number;
    effectiveness: number;
    lastTriggered?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SARReport {
  id: string;
  filingType: 'SAR' | 'CTR' | 'FBAR' | 'Form_8300' | 'Other';
  status: 'draft' | 'pending_review' | 'submitted' | 'acknowledged' | 'rejected';
  customerId: string;
  reportingEntity: {
    name: string;
    identifier: string;
    contactInfo: Record<string, string>;
  };
  suspiciousActivity: {
    description: string;
    amountInvolved: number;
    dateRange: { start: string; end: string };
    transactionIds: string[];
    suspicionBasis: string[];
    narrativeSummary: string;
  };
  subjectInformation: {
    type: 'individual' | 'entity';
    identifiers: Record<string, string>;
    addresses: Array<{
      type: string;
      address: string;
      verified: boolean;
    }>;
    relationships: string[];
  };
  filingDeadlines: {
    initial: string;
    extended?: string;
    finalSubmission: string;
  };
  attachments: Array<{
    type: string;
    filename: string;
    size: number;
    uploadedAt: string;
  }>;
  workflow: {
    preparedBy: string;
    reviewedBy?: string;
    approvedBy?: string;
    submittedBy?: string;
    submittedAt?: string;
  };
  regulatoryResponse?: {
    acknowledgmentDate: string;
    referenceNumber: string;
    feedback?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceAudit {
  id: string;
  type: 'internal' | 'external' | 'regulatory';
  scope: 'full' | 'targeted' | 'follow_up';
  auditor: {
    name: string;
    organization: string;
    credentials: string[];
  };
  period: { start: string; end: string };
  status: 'planning' | 'in_progress' | 'completed' | 'follow_up_required';
  findings: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    evidence: string[];
    recommendation: string;
    managementResponse?: string;
    remediation: {
      action: string;
      responsible: string;
      dueDate: string;
      status: 'pending' | 'in_progress' | 'completed';
    };
  }>;
  complianceRating: {
    overall: 'excellent' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
    categories: Record<string, string>;
    score: number;
  };
  recommendations: string[];
  nextAuditDate: string;
  createdAt: string;
  completedAt?: string;
}

export interface RegulatoryReport {
  id: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'ad_hoc';
  regulatoryBody: string;
  reportingPeriod: { start: string; end: string };
  status: 'draft' | 'pending_approval' | 'submitted' | 'acknowledged';
  sections: Array<{
    title: string;
    content: Record<string, any>;
    attachments: string[];
  }>;
  metrics: {
    transactionVolume: number;
    customerCount: number;
    alertsGenerated: number;
    sarsFiled: number;
    complianceIncidents: number;
  };
  certifications: Array<{
    type: string;
    certifiedBy: string;
    date: string;
  }>;
  submissionDeadline: string;
  submittedAt?: string;
  acknowledgmentReceived?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Compliance Service for MoonPay
 */
export class ComplianceService {
  private apiBaseUrl: string;
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey: string, secretKey: string, testMode: boolean = true) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.apiBaseUrl = testMode 
      ? "https://api.moonpay.com" 
      : "https://api.moonpay.com";
  }

  /**
   * Get customer compliance profile
   */
  async getComplianceProfile(customerId: string): Promise<ComplianceProfile> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/customers/${customerId}/profile`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Compliance profile API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting compliance profile:', error);
      throw new Error(`Failed to get compliance profile: ${error.message}`);
    }
  }

  /**
   * Perform AML screening
   */
  async performAMLScreening(customerId: string, forceRescan: boolean = false): Promise<{
    screeningId: string;
    status: 'completed' | 'in_progress' | 'failed';
    results: {
      sanctionsCheck: any;
      pepCheck: any;
      watchlistScreening: any;
      riskScore: number;
      recommendations: string[];
    };
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/aml-screening`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customerId, forceRescan })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`AML screening API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing AML screening:', error);
      throw new Error(`Failed to perform AML screening: ${error.message}`);
    }
  }

  /**
   * Get transaction alerts
   */
  async getTransactionAlerts(
    status?: string,
    severity?: string,
    assignedTo?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ alerts: TransactionAlert[]; total: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(status && { status }),
        ...(severity && { severity }),
        ...(assignedTo && { assignedTo })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/alerts?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Transaction alerts API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        alerts: data.alerts || [],
        total: data.total || 0,
        hasMore: data.hasMore || false
      };
    } catch (error) {
      console.error('Error getting transaction alerts:', error);
      throw new Error(`Failed to get transaction alerts: ${error.message}`);
    }
  }

  /**
   * Update alert investigation
   */
  async updateAlertInvestigation(
    alertId: string,
    update: {
      status?: string;
      assignedTo?: string;
      findings?: Array<{
        finding: string;
        evidence: string[];
      }>;
      conclusion?: string;
      actions?: string[];
    }
  ): Promise<TransactionAlert> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/alerts/${alertId}/investigation`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(update)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Update alert API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating alert investigation:', error);
      throw new Error(`Failed to update alert investigation: ${error.message}`);
    }
  }

  /**
   * Resolve transaction alert
   */
  async resolveAlert(
    alertId: string,
    resolution: {
      action: 'approve' | 'reject' | 'block_customer' | 'require_additional_info' | 'escalate';
      reason: string;
      notes: string;
    }
  ): Promise<TransactionAlert> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resolution)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Resolve alert API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }
  }

  /**
   * Get compliance rules
   */
  async getComplianceRules(
    type?: string,
    isActive?: boolean,
    limit: number = 50
  ): Promise<ComplianceRule[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive: isActive.toString() })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/rules?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Compliance rules API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting compliance rules:', error);
      throw new Error(`Failed to get compliance rules: ${error.message}`);
    }
  }

  /**
   * Create compliance rule
   */
  async createComplianceRule(
    ruleData: Omit<ComplianceRule, 'id' | 'performance' | 'createdAt' | 'updatedAt'>
  ): Promise<ComplianceRule> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ruleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create rule API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating compliance rule:', error);
      throw new Error(`Failed to create compliance rule: ${error.message}`);
    }
  }

  /**
   * Test compliance rule
   */
  async testComplianceRule(
    ruleId: string,
    testData: {
      transactionData?: any;
      customerData?: any;
      historicalData?: any;
    }
  ): Promise<{
    wouldTrigger: boolean;
    matchedConditions: string[];
    actionsTaken: string[];
    riskScore: number;
    explanation: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/rules/${ruleId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Test rule API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing compliance rule:', error);
      throw new Error(`Failed to test compliance rule: ${error.message}`);
    }
  }

  /**
   * Create SAR report
   */
  async createSARReport(sarData: Omit<SARReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<SARReport> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/sar-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sarData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create SAR API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating SAR report:', error);
      throw new Error(`Failed to create SAR report: ${error.message}`);
    }
  }

  /**
   * Submit SAR report
   */
  async submitSARReport(sarId: string): Promise<{ 
    submitted: boolean; 
    submissionId: string; 
    acknowledgmentExpected: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/sar-reports/${sarId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Submit SAR API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting SAR report:', error);
      throw new Error(`Failed to submit SAR report: ${error.message}`);
    }
  }

  /**
   * Get compliance audit information
   */
  async getComplianceAudits(
    type?: string,
    status?: string,
    limit: number = 20
  ): Promise<ComplianceAudit[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(type && { type }),
        ...(status && { status })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/audits?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Compliance audits API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting compliance audits:', error);
      throw new Error(`Failed to get compliance audits: ${error.message}`);
    }
  }

  /**
   * Generate regulatory report
   */
  async generateRegulatoryReport(
    reportType: 'monthly' | 'quarterly' | 'annual' | 'ad_hoc',
    period: { start: string; end: string },
    regulatoryBody: string
  ): Promise<{ reportId: string; status: string; estimatedCompletion: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/regulatory-reports/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportType, period, regulatoryBody })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Generate report API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating regulatory report:', error);
      throw new Error(`Failed to generate regulatory report: ${error.message}`);
    }
  }

  /**
   * Get compliance dashboard metrics
   */
  async getComplianceDashboard(): Promise<{
    overview: {
      openAlerts: number;
      highRiskCustomers: number;
      pendingSARs: number;
      complianceScore: number;
    };
    recentActivity: Array<{
      type: string;
      description: string;
      timestamp: string;
      severity: string;
    }>;
    trends: {
      alertVolume: number[];
      riskScoreTrend: number[];
      falsePositiveRate: number[];
    };
    upcomingDeadlines: Array<{
      type: string;
      description: string;
      dueDate: string;
      priority: string;
    }>;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/compliance/dashboard`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Compliance dashboard API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting compliance dashboard:', error);
      throw new Error(`Failed to get compliance dashboard: ${error.message}`);
    }
  }
}

export const complianceService = new ComplianceService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
