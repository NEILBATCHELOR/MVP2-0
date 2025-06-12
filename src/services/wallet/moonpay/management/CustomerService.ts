/**
 * MoonPay Customer Service
 * Handles customer management, KYC, verification, and account operations
 */

export interface CustomerProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    subStreet?: string;
    town: string;
    postCode: string;
    state?: string;
    country: string;
  };
  identityVerificationStatus?: 'pending' | 'completed' | 'failed';
  kycVerificationStatus?: 'pending' | 'completed' | 'failed';
  kycLevel: 'none' | 'basic' | 'enhanced' | 'premium';
  externalCustomerId?: string;
  verificationDocuments?: Array<{
    type: 'passport' | 'drivers_license' | 'national_id' | 'proof_of_address';
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
  }>;
  transactionLimits: {
    daily: { min: number; max: number };
    weekly: { min: number; max: number };
    monthly: { min: number; max: number };
  };
  preferredPaymentMethods: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerBadges {
  isKycVerified: boolean;
  isIdVerified: boolean;
  hasPreviousTransactions: boolean;
  trustScore: number;
  badges: Array<{
    type: 'kyc_verified' | 'id_verified' | 'returning_customer' | 'trusted_user';
    displayText: string;
    priority: number;
  }>;
}

export interface IdentityVerificationSession {
  id: string;
  sessionUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  verificationType: 'basic' | 'enhanced';
  requiredDocuments: string[];
  expiresAt: string;
  createdAt: string;
}

/**
 * Customer Service for MoonPay customer management
 */
export class CustomerService {
  private apiBaseUrl: string;
  private apiKey: string;
  private secretKey: string;
  private testMode: boolean;

  constructor(apiKey: string, secretKey: string, testMode: boolean = true) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.testMode = testMode;
    this.apiBaseUrl = "https://api.moonpay.com";
  }

  /**
   * Get customer profile by ID
   */
  async getCustomer(customerId: string): Promise<CustomerProfile> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/customers/${customerId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get customer API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting customer:', error);
      throw new Error(`Failed to get customer: ${error.message}`);
    }
  }

  /**
   * Get customer profile by external ID
   */
  async getCustomerByExternalId(externalCustomerId: string): Promise<CustomerProfile> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/customers/ext/${externalCustomerId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get customer by external ID API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting customer by external ID:', error);
      throw new Error(`Failed to get customer by external ID: ${error.message}`);
    }
  }

  /**
   * Get customer badges for wallet address
   */
  async getCustomerBadges(walletAddress: string): Promise<CustomerBadges> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/customers/badges`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletAddress })
      });

      if (!response.ok) {
        throw new Error(`Customer badges API error: ${response.status}`);
      }

      const badgeData = await response.json();
      
      return {
        isKycVerified: badgeData.isKycVerified || false,
        isIdVerified: badgeData.isIdVerified || false,
        hasPreviousTransactions: badgeData.hasPreviousTransactions || false,
        trustScore: badgeData.trustScore || 0,
        badges: this.formatBadges(badgeData)
      };
    } catch (error) {
      console.error('Error getting customer badges:', error);
      // Return default badges on error
      return {
        isKycVerified: false,
        isIdVerified: false,
        hasPreviousTransactions: false,
        trustScore: 0,
        badges: []
      };
    }
  }

  /**
   * Initiate identity verification for customer
   */
  async initiateIdentityVerification(
    customerId: string,
    verificationType: 'basic' | 'enhanced' = 'basic',
    returnUrl?: string
  ): Promise<IdentityVerificationSession> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/identity-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          customerId,
          verificationType,
          returnUrl: returnUrl || `${window.location.origin}/wallet?tab=moonpay&verification=complete`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Identity verification API error: ${errorData.message || response.status}`);
      }

      const session = await response.json();
      
      return {
        id: session.id || session.sessionId,
        sessionUrl: session.verificationUrl || session.sessionUrl,
        status: session.status || 'pending',
        verificationType,
        requiredDocuments: session.requiredDocuments || ['id_document'],
        expiresAt: session.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: session.createdAt || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error initiating identity verification:', error);
      throw new Error(`Failed to initiate identity verification: ${error.message}`);
    }
  }

  /**
   * Get identity verification status
   */
  async getIdentityVerificationStatus(sessionId: string): Promise<IdentityVerificationSession> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/identity-check/${sessionId}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Identity verification status API error: ${response.status}`);
      }

      const session = await response.json();
      
      return {
        id: session.id,
        sessionUrl: session.sessionUrl,
        status: session.status,
        verificationType: session.verificationType,
        requiredDocuments: session.requiredDocuments || [],
        expiresAt: session.expiresAt,
        createdAt: session.createdAt
      };
    } catch (error) {
      console.error('Error getting identity verification status:', error);
      throw new Error(`Failed to get identity verification status: ${error.message}`);
    }
  }

  /**
   * Update customer profile
   */
  async updateCustomerProfile(customerId: string, updates: Partial<CustomerProfile>): Promise<CustomerProfile> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/customers/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Update customer API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating customer profile:', error);
      throw new Error(`Failed to update customer profile: ${error.message}`);
    }
  }

  /**
   * Get customer transaction limits
   */
  async getCustomerLimits(customerId: string): Promise<CustomerProfile['transactionLimits']> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/customers/${customerId}/limits`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Customer limits API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting customer limits:', error);
      // Return default limits
      return {
        daily: { min: 30, max: 2000 },
        weekly: { min: 30, max: 10000 },
        monthly: { min: 30, max: 50000 }
      };
    }
  }

  /**
   * Check if customer needs KYC upgrade
   */
  async checkKycUpgradeRequired(
    customerId: string, 
    transactionAmount: number, 
    currency: string
  ): Promise<{
    upgradeRequired: boolean;
    currentLevel: string;
    requiredLevel: string;
    reason?: string;
  }> {
    try {
      const customer = await this.getCustomer(customerId);
      const limits = await this.getCustomerLimits(customerId);

      // Check if transaction exceeds current limits
      if (transactionAmount > limits.daily.max) {
        return {
          upgradeRequired: true,
          currentLevel: customer.kycLevel,
          requiredLevel: 'enhanced',
          reason: 'Transaction amount exceeds daily limit'
        };
      }

      // Check if enhanced KYC is needed for high-value transactions
      if (transactionAmount > 10000 && customer.kycLevel === 'basic') {
        return {
          upgradeRequired: true,
          currentLevel: customer.kycLevel,
          requiredLevel: 'enhanced',
          reason: 'Enhanced KYC required for high-value transactions'
        };
      }

      return {
        upgradeRequired: false,
        currentLevel: customer.kycLevel,
        requiredLevel: customer.kycLevel
      };
    } catch (error) {
      console.error('Error checking KYC upgrade requirement:', error);
      return {
        upgradeRequired: false,
        currentLevel: 'unknown',
        requiredLevel: 'basic'
      };
    }
  }

  /**
   * Get customer transaction history summary
   */
  async getCustomerTransactionSummary(customerId: string): Promise<{
    totalTransactions: number;
    totalVolume: number;
    averageTransactionSize: number;
    lastTransactionDate?: string;
    preferredCurrencies: string[];
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/customers/${customerId}/transactions/summary`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Customer transaction summary API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting customer transaction summary:', error);
      return {
        totalTransactions: 0,
        totalVolume: 0,
        averageTransactionSize: 0,
        preferredCurrencies: []
      };
    }
  }

  // Private helper methods

  private formatBadges(badgeData: any): CustomerBadges['badges'] {
    const badges: CustomerBadges['badges'] = [];

    if (badgeData.isKycVerified) {
      badges.push({
        type: 'kyc_verified',
        displayText: 'ID Verified',
        priority: 1
      });
    }

    if (badgeData.hasPreviousTransactions) {
      badges.push({
        type: 'returning_customer',
        displayText: 'Previously Used',
        priority: 2
      });
    }

    if (badgeData.trustScore > 80) {
      badges.push({
        type: 'trusted_user',
        displayText: 'Trusted User',
        priority: 3
      });
    }

    return badges.sort((a, b) => a.priority - b.priority);
  }
}

export const customerService = new CustomerService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
