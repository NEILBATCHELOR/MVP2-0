/**
 * MoonPay Partner Account Management Service
 * Handles partner onboarding, account management, and business operations
 */

export interface PartnerAccount {
  id: string;
  companyName: string;
  businessType: 'startup' | 'small_business' | 'enterprise' | 'financial_institution' | 'exchange' | 'wallet' | 'marketplace';
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'active';
  kybStatus: 'not_started' | 'pending' | 'under_review' | 'approved' | 'rejected';
  apiKeys: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    environment: 'sandbox' | 'production';
  };
  domains: string[];
  integrationLevel: 'basic' | 'standard' | 'premium' | 'enterprise';
  permissions: {
    buy: boolean;
    sell: boolean;
    swap: boolean;
    nft: boolean;
    webhooks: boolean;
    analytics: boolean;
    partnerApi: boolean;
  };
  limits: {
    dailyVolume: number;
    monthlyVolume: number;
    transactionCount: number;
    userCount: number;
  };
  fees: {
    buyFeePercentage: number;
    sellFeePercentage: number;
    swapFeePercentage: number;
    revenueShare: number;
  };
  compliance: {
    riskLevel: 'low' | 'medium' | 'high';
    kycRequired: boolean;
    amlMonitoring: boolean;
    sanctionScreening: boolean;
    reportingRequired: boolean;
  };
  contactInfo: {
    primaryContact: {
      name: string;
      email: string;
      phone: string;
      role: string;
    };
    technicalContact: {
      name: string;
      email: string;
      phone: string;
      role: string;
    };
    complianceContact?: {
      name: string;
      email: string;
      phone: string;
      role: string;
    };
  };
  businessInfo: {
    registrationNumber: string;
    taxId: string;
    incorporationCountry: string;
    businessAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    website: string;
    description: string;
    expectedVolume: number;
    targetMarkets: string[];
  };
  kybDocuments: {
    certificateOfIncorporation: string;
    memorandumOfAssociation: string;
    proofOfAddress: string;
    directorsList: string;
    shareholdersList: string;
    bankStatement: string;
    additionalDocuments: string[];
  };
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  lastLoginAt?: string;
}

export interface PartnerOnboarding {
  id: string;
  companyName: string;
  businessType: string;
  contactEmail: string;
  step: 'business_info' | 'kyb_documents' | 'compliance_review' | 'technical_setup' | 'go_live';
  progress: number; // 0-100
  completedSteps: string[];
  requiredActions: Array<{
    type: 'document_upload' | 'information_review' | 'compliance_approval' | 'technical_integration';
    description: string;
    dueDate?: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  kybLink?: string;
  kybStatus: string;
  estimatedApprovalDate?: string;
  assignedManager?: {
    name: string;
    email: string;
    phone: string;
  };
  notes: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
    isInternal: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerMetrics {
  partnerId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  metrics: {
    totalVolume: number;
    totalTransactions: number;
    totalUsers: number;
    totalRevenue: number;
    conversionRate: number;
    averageTransactionSize: number;
    chargeback: number;
    fraudRate: number;
  };
  trends: {
    volumeGrowth: number;
    transactionGrowth: number;
    userGrowth: number;
    revenueGrowth: number;
  };
  breakdown: {
    byCountry: Array<{ country: string; volume: number; transactions: number }>;
    byCurrency: Array<{ currency: string; volume: number; transactions: number }>;
    byPaymentMethod: Array<{ method: string; volume: number; transactions: number }>;
  };
  benchmarks: {
    industryAverage: number;
    topPerformers: number;
    rank: number;
    percentile: number;
  };
}

export interface PartnerIntegration {
  partnerId: string;
  integrationType: 'widget' | 'api' | 'sdk' | 'webhook';
  status: 'not_started' | 'in_progress' | 'testing' | 'live' | 'issues';
  configuration: {
    environment: 'sandbox' | 'production';
    features: string[];
    customization: {
      branding: boolean;
      colors: string[];
      logo: string;
      styling: Record<string, any>;
    };
    webhookEndpoints: Array<{
      url: string;
      events: string[];
      isActive: boolean;
    }>;
  };
  testResults: Array<{
    testType: 'unit' | 'integration' | 'e2e' | 'security';
    status: 'passed' | 'failed' | 'pending';
    results: string;
    timestamp: string;
  }>;
  goLiveChecklist: Array<{
    item: string;
    completed: boolean;
    notes?: string;
  }>;
  technicalContact: {
    name: string;
    email: string;
    phone: string;
  };
  lastUpdated: string;
}

export interface DomainManagement {
  partnerId: string;
  domains: Array<{
    domain: string;
    environment: 'sandbox' | 'production';
    status: 'pending' | 'verified' | 'failed' | 'expired';
    verificationMethod: 'dns' | 'file' | 'meta_tag';
    verificationToken: string;
    addedAt: string;
    verifiedAt?: string;
    lastChecked: string;
  }>;
  wildcardDomains: string[];
  ipWhitelist: string[];
  corsSettings: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
  };
}

/**
 * Partner Account Management Service for MoonPay
 */
export class PartnerService {
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
   * Create a new partner account
   */
  async createPartnerAccount(accountData: {
    companyName: string;
    businessType: string;
    contactEmail: string;
    contactName: string;
    contactPhone: string;
    website: string;
    expectedVolume: number;
    description: string;
  }): Promise<{ 
    accountId: string; 
    kybLink: string; 
    onboardingId: string;
    estimatedApprovalTime: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(accountData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create partner account API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating partner account:', error);
      throw new Error(`Failed to create partner account: ${error.message}`);
    }
  }

  /**
   * Get partner account details
   */
  async getPartnerAccount(accountId?: string): Promise<PartnerAccount> {
    try {
      const endpoint = accountId 
        ? `${this.apiBaseUrl}/partner_onboarding/v1/accounts/${accountId}`
        : `${this.apiBaseUrl}/partner_onboarding/v1/accounts/me`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Partner account API error: ${response.status}`);
      }

      const accountData = await response.json();
      return this.mapPartnerAccountResponse(accountData);
    } catch (error) {
      console.error('Error getting partner account:', error);
      throw new Error(`Failed to get partner account: ${error.message}`);
    }
  }

  /**
   * Update partner account information
   */
  async updatePartnerAccount(
    accountId: string,
    updateData: Partial<PartnerAccount>
  ): Promise<PartnerAccount> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Update partner account API error: ${errorData.message || response.status}`);
      }

      const accountData = await response.json();
      return this.mapPartnerAccountResponse(accountData);
    } catch (error) {
      console.error('Error updating partner account:', error);
      throw new Error(`Failed to update partner account: ${error.message}`);
    }
  }

  /**
   * Get partner onboarding status
   */
  async getOnboardingStatus(onboardingId: string): Promise<PartnerOnboarding> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/onboarding/${onboardingId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Onboarding status API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      throw new Error(`Failed to get onboarding status: ${error.message}`);
    }
  }

  /**
   * Get partner metrics and analytics
   */
  async getPartnerMetrics(
    partnerId: string,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month',
    startDate?: string,
    endDate?: string
  ): Promise<PartnerMetrics> {
    try {
      const params = new URLSearchParams({
        period,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/partners/${partnerId}/metrics?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Partner metrics API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting partner metrics:', error);
      throw new Error(`Failed to get partner metrics: ${error.message}`);
    }
  }

  /**
   * Manage domains for partner account
   */
  async updateDomains(domains: string[]): Promise<{ success: boolean; domains: string[] }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/domains`, {
        method: 'PUT',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domains })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Update domains API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating domains:', error);
      throw new Error(`Failed to update domains: ${error.message}`);
    }
  }

  /**
   * Get domain management information
   */
  async getDomainManagement(partnerId: string): Promise<DomainManagement> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/partners/${partnerId}/domains`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Domain management API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting domain management:', error);
      throw new Error(`Failed to get domain management: ${error.message}`);
    }
  }

  /**
   * Verify domain ownership
   */
  async verifyDomain(domain: string, verificationMethod: 'dns' | 'file' | 'meta_tag'): Promise<{
    verified: boolean;
    verificationToken: string;
    instructions: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/domains/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain, verificationMethod })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Domain verification API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying domain:', error);
      throw new Error(`Failed to verify domain: ${error.message}`);
    }
  }

  /**
   * Get integration status and configuration
   */
  async getIntegrationStatus(partnerId: string): Promise<PartnerIntegration> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/partners/${partnerId}/integration`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Integration status API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting integration status:', error);
      throw new Error(`Failed to get integration status: ${error.message}`);
    }
  }

  /**
   * Update integration configuration
   */
  async updateIntegrationConfig(
    partnerId: string,
    config: Partial<PartnerIntegration['configuration']>
  ): Promise<PartnerIntegration> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/partners/${partnerId}/integration`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ configuration: config })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Update integration API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating integration config:', error);
      throw new Error(`Failed to update integration config: ${error.message}`);
    }
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests(
    partnerId: string,
    testTypes: Array<'unit' | 'integration' | 'e2e' | 'security'>
  ): Promise<{ testId: string; status: string; estimatedCompletion: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/partners/${partnerId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testTypes })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Integration test API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error running integration tests:', error);
      throw new Error(`Failed to run integration tests: ${error.message}`);
    }
  }

  /**
   * Request go-live approval
   */
  async requestGoLive(
    partnerId: string,
    readinessChecklist: Record<string, boolean>
  ): Promise<{ 
    requestId: string; 
    status: string; 
    estimatedApproval: string;
    requiredActions: string[];
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/partners/${partnerId}/go-live`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ readinessChecklist })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Go-live request API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting go-live:', error);
      throw new Error(`Failed to request go-live: ${error.message}`);
    }
  }

  /**
   * Generate new API keys
   */
  async regenerateApiKeys(
    partnerId: string,
    keyType: 'publishable' | 'secret' | 'webhook' | 'all'
  ): Promise<{ 
    publishableKey?: string; 
    secretKey?: string; 
    webhookSecret?: string;
    rotationId: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/partner_onboarding/v1/partners/${partnerId}/keys/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyType })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Regenerate keys API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error regenerating API keys:', error);
      throw new Error(`Failed to regenerate API keys: ${error.message}`);
    }
  }

  // Private helper methods

  private mapPartnerAccountResponse(accountData: any): PartnerAccount {
    return {
      id: accountData.id || '',
      companyName: accountData.companyName || '',
      businessType: accountData.businessType || 'startup',
      status: accountData.status || 'pending',
      kybStatus: accountData.kybStatus || 'not_started',
      apiKeys: {
        publishableKey: accountData.apiKeys?.publishableKey || '',
        secretKey: accountData.apiKeys?.secretKey || '',
        webhookSecret: accountData.apiKeys?.webhookSecret || '',
        environment: accountData.apiKeys?.environment || 'sandbox'
      },
      domains: accountData.domains || [],
      integrationLevel: accountData.integrationLevel || 'basic',
      permissions: {
        buy: accountData.permissions?.buy ?? true,
        sell: accountData.permissions?.sell ?? true,
        swap: accountData.permissions?.swap ?? true,
        nft: accountData.permissions?.nft ?? true,
        webhooks: accountData.permissions?.webhooks ?? true,
        analytics: accountData.permissions?.analytics ?? true,
        partnerApi: accountData.permissions?.partnerApi ?? false
      },
      limits: {
        dailyVolume: accountData.limits?.dailyVolume || 100000,
        monthlyVolume: accountData.limits?.monthlyVolume || 1000000,
        transactionCount: accountData.limits?.transactionCount || 1000,
        userCount: accountData.limits?.userCount || 1000
      },
      fees: {
        buyFeePercentage: accountData.fees?.buyFeePercentage || 4.5,
        sellFeePercentage: accountData.fees?.sellFeePercentage || 4.5,
        swapFeePercentage: accountData.fees?.swapFeePercentage || 1.0,
        revenueShare: accountData.fees?.revenueShare || 50
      },
      compliance: {
        riskLevel: accountData.compliance?.riskLevel || 'medium',
        kycRequired: accountData.compliance?.kycRequired ?? true,
        amlMonitoring: accountData.compliance?.amlMonitoring ?? true,
        sanctionScreening: accountData.compliance?.sanctionScreening ?? true,
        reportingRequired: accountData.compliance?.reportingRequired ?? false
      },
      contactInfo: accountData.contactInfo || {
        primaryContact: { name: '', email: '', phone: '', role: '' },
        technicalContact: { name: '', email: '', phone: '', role: '' }
      },
      businessInfo: accountData.businessInfo || {
        registrationNumber: '',
        taxId: '',
        incorporationCountry: '',
        businessAddress: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: ''
        },
        website: '',
        description: '',
        expectedVolume: 0,
        targetMarkets: []
      },
      kybDocuments: accountData.kybDocuments || {
        certificateOfIncorporation: '',
        memorandumOfAssociation: '',
        proofOfAddress: '',
        directorsList: '',
        shareholdersList: '',
        bankStatement: '',
        additionalDocuments: []
      },
      createdAt: accountData.createdAt || new Date().toISOString(),
      updatedAt: accountData.updatedAt || new Date().toISOString(),
      approvedAt: accountData.approvedAt,
      lastLoginAt: accountData.lastLoginAt
    };
  }
}

export const partnerService = new PartnerService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
