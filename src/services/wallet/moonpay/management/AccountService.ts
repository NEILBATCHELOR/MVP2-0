/**
 * MoonPay Account Management Service
 * Handles account details, verification status, and account-level operations
 */

export interface MoonpayAccount {
  id: string;
  email: string;
  isEmailVerified: boolean;
  identityStatus: 'not_started' | 'pending' | 'under_review' | 'passed' | 'failed';
  documentStatus: 'not_started' | 'pending' | 'under_review' | 'passed' | 'failed';
  kycStatus: 'not_started' | 'pending' | 'under_review' | 'passed' | 'failed';
  country: string;
  defaultCurrencyId: string;
  createdAt: string;
  updatedAt: string;
  limits: {
    dailyLimit: number;
    weeklyLimit: number;
    monthlyLimit: number;
    perTransactionLimit: number;
  };
  fees: {
    buyFeePercentage: number;
    sellFeePercentage: number;
    swapFeePercentage: number;
  };
  features: {
    buyEnabled: boolean;
    sellEnabled: boolean;
    swapEnabled: boolean;
    nftEnabled: boolean;
  };
  complianceLevel: 'basic' | 'enhanced' | 'premium';
  riskScore: number;
  lastLoginAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface MoonpayAccountVerification {
  identityCheck: {
    status: string;
    reason?: string;
    submittedAt?: string;
    reviewedAt?: string;
  };
  documentCheck: {
    status: string;
    documents: Array<{
      type: 'passport' | 'drivers_license' | 'national_id' | 'proof_of_address';
      status: string;
      reason?: string;
      submittedAt?: string;
    }>;
  };
  addressCheck: {
    status: string;
    reason?: string;
    submittedAt?: string;
  };
  phoneCheck: {
    status: string;
    phoneNumber?: string;
    verifiedAt?: string;
  };
}

export interface MoonpayAccountLimits {
  buy: {
    daily: { limit: number; used: number; remaining: number };
    weekly: { limit: number; used: number; remaining: number };
    monthly: { limit: number; used: number; remaining: number };
  };
  sell: {
    daily: { limit: number; used: number; remaining: number };
    weekly: { limit: number; used: number; remaining: number };
    monthly: { limit: number; used: number; remaining: number };
  };
  currency: string;
  nextResetAt: {
    daily: string;
    weekly: string;
    monthly: string;
  };
}

export interface MoonpayAccountSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    transactionUpdates: boolean;
    marketingEmails: boolean;
    securityAlerts: boolean;
  };
  preferences: {
    defaultCurrency: string;
    defaultPaymentMethod: string;
    autoApproveTransactions: boolean;
    enableTwoFactorAuth: boolean;
    sessionTimeout: number;
  };
  privacy: {
    shareDataWithPartners: boolean;
    enableAnalytics: boolean;
    marketingConsent: boolean;
  };
}

export interface MoonpayAccountActivity {
  id: string;
  type: 'login' | 'transaction' | 'verification' | 'settings_change' | 'api_access';
  description: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  metadata?: Record<string, any>;
  timestamp: string;
  riskScore?: number;
  flagged: boolean;
}

/**
 * Enhanced Account Management Service for MoonPay
 */
export class AccountService {
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
   * Get detailed account information
   */
  async getAccountDetails(): Promise<MoonpayAccount> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/accounts/me`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Account API error: ${response.status}`);
      }

      const accountData = await response.json();
      return this.mapAccountResponse(accountData);
    } catch (error) {
      console.error('Error getting account details:', error);
      throw new Error(`Failed to get account details: ${error.message}`);
    }
  }

  /**
   * Get account verification status
   */
  async getVerificationStatus(): Promise<MoonpayAccountVerification> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/accounts/me/verification`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Verification API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting verification status:', error);
      throw new Error(`Failed to get verification status: ${error.message}`);
    }
  }

  /**
   * Get current account limits and usage
   */
  async getAccountLimits(): Promise<MoonpayAccountLimits> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/accounts/me/limits`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Limits API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting account limits:', error);
      throw new Error(`Failed to get account limits: ${error.message}`);
    }
  }

  /**
   * Update account settings
   */
  async updateAccountSettings(settings: Partial<MoonpayAccountSettings>): Promise<MoonpayAccountSettings> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/accounts/me/settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Update settings API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating account settings:', error);
      throw new Error(`Failed to update account settings: ${error.message}`);
    }
  }

  /**
   * Get account activity history
   */
  async getAccountActivity(
    limit: number = 50,
    offset: number = 0,
    type?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ activities: MoonpayAccountActivity[]; total: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(type && { type }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/accounts/me/activity?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Activity API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        activities: data.activities || [],
        total: data.total || 0,
        hasMore: data.hasMore || false
      };
    } catch (error) {
      console.error('Error getting account activity:', error);
      throw new Error(`Failed to get account activity: ${error.message}`);
    }
  }

  /**
   * Request account verification upgrade
   */
  async requestVerificationUpgrade(level: 'enhanced' | 'premium'): Promise<{ verificationUrl: string; sessionId: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/accounts/me/verification/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          level,
          returnUrl: `${window.location.origin}/wallet?tab=moonpay&verification=complete`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Verification upgrade API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting verification upgrade:', error);
      throw new Error(`Failed to request verification upgrade: ${error.message}`);
    }
  }

  /**
   * Enable/disable two-factor authentication
   */
  async configureTwoFactorAuth(enable: boolean, phoneNumber?: string): Promise<{ 
    enabled: boolean; 
    backupCodes?: string[]; 
    qrCode?: string 
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/accounts/me/2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enable, phoneNumber })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`2FA API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error configuring 2FA:', error);
      throw new Error(`Failed to configure 2FA: ${error.message}`);
    }
  }

  /**
   * Download account data (GDPR compliance)
   */
  async downloadAccountData(): Promise<{ downloadUrl: string; expiresAt: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/accounts/me/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Export API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error downloading account data:', error);
      throw new Error(`Failed to download account data: ${error.message}`);
    }
  }

  /**
   * Request account deletion (GDPR compliance)
   */
  async requestAccountDeletion(reason: string): Promise<{ deletionRequestId: string; scheduledAt: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/accounts/me/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Delete API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw new Error(`Failed to request account deletion: ${error.message}`);
    }
  }

  /**
   * Get account compliance information
   */
  async getComplianceInfo(): Promise<{
    riskScore: number;
    complianceLevel: string;
    restrictions: string[];
    nextReviewDate: string;
    amlStatus: string;
    sanctions: boolean;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/accounts/me/compliance`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Compliance API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting compliance info:', error);
      throw new Error(`Failed to get compliance info: ${error.message}`);
    }
  }

  // Private helper methods

  private mapAccountResponse(accountData: any): MoonpayAccount {
    return {
      id: accountData.id,
      email: accountData.email || '',
      isEmailVerified: accountData.isEmailVerified || false,
      identityStatus: accountData.identityStatus || 'not_started',
      documentStatus: accountData.documentStatus || 'not_started',
      kycStatus: accountData.kycStatus || 'not_started',
      country: accountData.country || '',
      defaultCurrencyId: accountData.defaultCurrencyId || 'usd',
      createdAt: accountData.createdAt || new Date().toISOString(),
      updatedAt: accountData.updatedAt || new Date().toISOString(),
      limits: {
        dailyLimit: accountData.limits?.dailyLimit || 2000,
        weeklyLimit: accountData.limits?.weeklyLimit || 10000,
        monthlyLimit: accountData.limits?.monthlyLimit || 50000,
        perTransactionLimit: accountData.limits?.perTransactionLimit || 20000
      },
      fees: {
        buyFeePercentage: accountData.fees?.buyFeePercentage || 4.5,
        sellFeePercentage: accountData.fees?.sellFeePercentage || 4.5,
        swapFeePercentage: accountData.fees?.swapFeePercentage || 1.0
      },
      features: {
        buyEnabled: accountData.features?.buyEnabled ?? true,
        sellEnabled: accountData.features?.sellEnabled ?? true,
        swapEnabled: accountData.features?.swapEnabled ?? true,
        nftEnabled: accountData.features?.nftEnabled ?? true
      },
      complianceLevel: accountData.complianceLevel || 'basic',
      riskScore: accountData.riskScore || 0,
      lastLoginAt: accountData.lastLoginAt,
      ipAddress: accountData.ipAddress,
      userAgent: accountData.userAgent
    };
  }
}

export const accountService = new AccountService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
