/**
 * MoonPay Geolocation & Compliance Service
 * Handles IP address validation, country restrictions, and geolocation compliance
 */

export interface IPAddressInfo {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  city: string;
  timezone: string;
  latitude: number;
  longitude: number;
  isAllowed: boolean;
  isMoonPaySupported: boolean;
  restrictionReason?: string;
  complianceLevel: 'basic' | 'enhanced' | 'strict';
  riskScore: number;
  vpnDetected: boolean;
  proxyDetected: boolean;
  torDetected: boolean;
  botDetected: boolean;
  threatScore: number;
  lastUpdated: string;
}

export interface CountryInfo {
  code: string;
  name: string;
  isSupported: boolean;
  supportLevel: 'full' | 'limited' | 'restricted' | 'banned';
  supportedCurrencies: string[];
  supportedPaymentMethods: string[];
  kycLevel: 'none' | 'basic' | 'enhanced' | 'premium';
  restrictions: {
    buy: boolean;
    sell: boolean;
    swap: boolean;
    nft: boolean;
    maxTransactionAmount?: number;
    dailyLimit?: number;
    monthlyLimit?: number;
  };
  regulatoryInfo: {
    license?: string;
    regulator?: string;
    complianceNotes?: string;
    lastUpdated: string;
  };
  localInfo: {
    currency: string;
    language: string;
    timeFormat: '12h' | '24h';
    dateFormat: string;
    numberFormat: string;
  };
}

export interface GeolocationCompliance {
  userId?: string;
  ipAddress: string;
  detectedCountry: string;
  declaredCountry?: string;
  countryMatch: boolean;
  complianceStatus: 'compliant' | 'non_compliant' | 'review_required' | 'blocked';
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    factors: {
      geolocationMismatch: number;
      vpnUsage: number;
      sanctionedCountry: number;
      restrictedRegion: number;
      fraudIndicators: number;
    };
    recommendations: string[];
  };
  allowedOperations: {
    canBuy: boolean;
    canSell: boolean;
    canSwap: boolean;
    canAccessNFT: boolean;
    canCreateAccount: boolean;
  };
  requiredActions: string[];
  lastChecked: string;
}

export interface IndustryInfo {
  id: string;
  name: string;
  category: 'financial' | 'technology' | 'gaming' | 'ecommerce' | 'healthcare' | 'education' | 'government' | 'other';
  riskLevel: 'low' | 'medium' | 'high';
  complianceRequirements: {
    kycLevel: 'basic' | 'enhanced' | 'premium';
    amlChecks: boolean;
    sanctionScreening: boolean;
    ongoingMonitoring: boolean;
    additionalDocuments: string[];
  };
  supportedRegions: string[];
  restrictedRegions: string[];
  regulatoryNotes: string;
  isActive: boolean;
}

export interface ComplianceAlert {
  id: string;
  type: 'geolocation_mismatch' | 'vpn_detected' | 'sanctioned_country' | 'high_risk_region' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  countryCode: string;
  description: string;
  detectedAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  metadata: Record<string, any>;
}

/**
 * Geolocation & Compliance Service for MoonPay
 */
export class GeolocationService {
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
   * Check IP address information and compliance
   */
  async checkIPAddress(ipAddress?: string): Promise<IPAddressInfo> {
    try {
      const params = new URLSearchParams();
      if (ipAddress) {
        params.append('ipAddress', ipAddress);
      }

      const response = await fetch(`${this.apiBaseUrl}/v3/ip_address?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`IP address API error: ${response.status}`);
      }

      const ipData = await response.json();
      return this.mapIPAddressResponse(ipData);
    } catch (error) {
      console.error('Error checking IP address:', error);
      throw new Error(`Failed to check IP address: ${error.message}`);
    }
  }

  /**
   * Get supported countries information
   */
  async getSupportedCountries(
    operation?: 'buy' | 'sell' | 'all',
    paymentMethod?: string
  ): Promise<CountryInfo[]> {
    try {
      const params = new URLSearchParams();
      if (operation) params.append('operation', operation);
      if (paymentMethod) params.append('paymentMethod', paymentMethod);

      const response = await fetch(`${this.apiBaseUrl}/v3/countries?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Countries API error: ${response.status}`);
      }

      const countriesData = await response.json();
      return this.mapCountriesResponse(countriesData);
    } catch (error) {
      console.error('Error getting supported countries:', error);
      throw new Error(`Failed to get supported countries: ${error.message}`);
    }
  }

  /**
   * Get specific country information
   */
  async getCountryInfo(countryCode: string): Promise<CountryInfo> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/countries/${countryCode}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Country info API error: ${response.status}`);
      }

      const countryData = await response.json();
      return this.mapCountryResponse(countryData);
    } catch (error) {
      console.error('Error getting country info:', error);
      throw new Error(`Failed to get country info: ${error.message}`);
    }
  }

  /**
   * Perform comprehensive geolocation compliance check
   */
  async performComplianceCheck(
    userId?: string,
    ipAddress?: string,
    declaredCountry?: string
  ): Promise<GeolocationCompliance> {
    try {
      const body = {
        ...(userId && { userId }),
        ...(ipAddress && { ipAddress }),
        ...(declaredCountry && { declaredCountry })
      };

      const response = await fetch(`${this.apiBaseUrl}/v3/compliance/geolocation`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Compliance check API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing compliance check:', error);
      throw new Error(`Failed to perform compliance check: ${error.message}`);
    }
  }

  /**
   * Get supported industries
   */
  async getSupportedIndustries(): Promise<IndustryInfo[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/industries`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Industries API error: ${response.status}`);
      }

      const industriesData = await response.json();
      return this.mapIndustriesResponse(industriesData);
    } catch (error) {
      console.error('Error getting supported industries:', error);
      // Return default industries if API fails
      return this.getDefaultIndustries();
    }
  }

  /**
   * Get compliance alerts
   */
  async getComplianceAlerts(
    severity?: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ alerts: ComplianceAlert[]; total: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(severity && { severity }),
        ...(status && { status })
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/compliance/alerts?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Compliance alerts API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        alerts: data.alerts || [],
        total: data.total || 0,
        hasMore: data.hasMore || false
      };
    } catch (error) {
      console.error('Error getting compliance alerts:', error);
      throw new Error(`Failed to get compliance alerts: ${error.message}`);
    }
  }

  /**
   * Create compliance alert
   */
  async createComplianceAlert(alertData: Omit<ComplianceAlert, 'id' | 'detectedAt' | 'status'>): Promise<ComplianceAlert> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/compliance/alerts`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...alertData,
          detectedAt: new Date().toISOString(),
          status: 'open'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create alert API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating compliance alert:', error);
      throw new Error(`Failed to create compliance alert: ${error.message}`);
    }
  }

  /**
   * Update compliance alert status
   */
  async updateComplianceAlert(
    alertId: string,
    update: {
      status?: 'open' | 'investigating' | 'resolved' | 'false_positive';
      assignedTo?: string;
      resolution?: string;
    }
  ): Promise<ComplianceAlert> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/compliance/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...update,
          ...(update.status === 'resolved' && { resolvedAt: new Date().toISOString() })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Update alert API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating compliance alert:', error);
      throw new Error(`Failed to update compliance alert: ${error.message}`);
    }
  }

  /**
   * Validate user's declared country against IP geolocation
   */
  async validateUserLocation(
    userId: string,
    declaredCountry: string,
    ipAddress?: string
  ): Promise<{
    isValid: boolean;
    confidence: number;
    riskScore: number;
    recommendations: string[];
    requiredActions: string[];
  }> {
    try {
      const body = {
        userId,
        declaredCountry,
        ...(ipAddress && { ipAddress })
      };

      const response = await fetch(`${this.apiBaseUrl}/v3/compliance/validate-location`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Location validation API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating user location:', error);
      throw new Error(`Failed to validate user location: ${error.message}`);
    }
  }

  /**
   * Get geofencing rules for specific regions
   */
  async getGeofencingRules(countryCode?: string): Promise<Array<{
    region: string;
    rules: Array<{
      operation: string;
      allowed: boolean;
      restrictions: string[];
      requirements: string[];
    }>;
    lastUpdated: string;
  }>> {
    try {
      const params = new URLSearchParams();
      if (countryCode) params.append('countryCode', countryCode);

      const response = await fetch(`${this.apiBaseUrl}/v3/compliance/geofencing?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Geofencing API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting geofencing rules:', error);
      throw new Error(`Failed to get geofencing rules: ${error.message}`);
    }
  }

  // Private helper methods

  private mapIPAddressResponse(ipData: any): IPAddressInfo {
    return {
      ip: ipData.ip || '',
      country: ipData.country || '',
      countryCode: ipData.countryCode || '',
      region: ipData.region || '',
      regionCode: ipData.regionCode || '',
      city: ipData.city || '',
      timezone: ipData.timezone || '',
      latitude: ipData.latitude || 0,
      longitude: ipData.longitude || 0,
      isAllowed: ipData.isAllowed ?? true,
      isMoonPaySupported: ipData.isMoonPaySupported ?? true,
      restrictionReason: ipData.restrictionReason,
      complianceLevel: ipData.complianceLevel || 'basic',
      riskScore: ipData.riskScore || 0,
      vpnDetected: ipData.vpnDetected || false,
      proxyDetected: ipData.proxyDetected || false,
      torDetected: ipData.torDetected || false,
      botDetected: ipData.botDetected || false,
      threatScore: ipData.threatScore || 0,
      lastUpdated: ipData.lastUpdated || new Date().toISOString()
    };
  }

  private mapCountriesResponse(countriesData: any): CountryInfo[] {
    if (!countriesData || !Array.isArray(countriesData)) {
      return [];
    }

    return countriesData.map(country => this.mapCountryResponse(country));
  }

  private mapCountryResponse(countryData: any): CountryInfo {
    return {
      code: countryData.code || '',
      name: countryData.name || '',
      isSupported: countryData.isSupported ?? true,
      supportLevel: countryData.supportLevel || 'full',
      supportedCurrencies: countryData.supportedCurrencies || [],
      supportedPaymentMethods: countryData.supportedPaymentMethods || [],
      kycLevel: countryData.kycLevel || 'basic',
      restrictions: {
        buy: countryData.restrictions?.buy ?? true,
        sell: countryData.restrictions?.sell ?? true,
        swap: countryData.restrictions?.swap ?? true,
        nft: countryData.restrictions?.nft ?? true,
        maxTransactionAmount: countryData.restrictions?.maxTransactionAmount,
        dailyLimit: countryData.restrictions?.dailyLimit,
        monthlyLimit: countryData.restrictions?.monthlyLimit
      },
      regulatoryInfo: {
        license: countryData.regulatoryInfo?.license,
        regulator: countryData.regulatoryInfo?.regulator,
        complianceNotes: countryData.regulatoryInfo?.complianceNotes,
        lastUpdated: countryData.regulatoryInfo?.lastUpdated || new Date().toISOString()
      },
      localInfo: {
        currency: countryData.localInfo?.currency || 'USD',
        language: countryData.localInfo?.language || 'en',
        timeFormat: countryData.localInfo?.timeFormat || '24h',
        dateFormat: countryData.localInfo?.dateFormat || 'YYYY-MM-DD',
        numberFormat: countryData.localInfo?.numberFormat || '1,000.00'
      }
    };
  }

  private mapIndustriesResponse(industriesData: any): IndustryInfo[] {
    if (!industriesData || !Array.isArray(industriesData)) {
      return this.getDefaultIndustries();
    }

    return industriesData.map(industry => ({
      id: industry.id || '',
      name: industry.name || '',
      category: industry.category || 'other',
      riskLevel: industry.riskLevel || 'medium',
      complianceRequirements: {
        kycLevel: industry.complianceRequirements?.kycLevel || 'basic',
        amlChecks: industry.complianceRequirements?.amlChecks ?? true,
        sanctionScreening: industry.complianceRequirements?.sanctionScreening ?? true,
        ongoingMonitoring: industry.complianceRequirements?.ongoingMonitoring ?? false,
        additionalDocuments: industry.complianceRequirements?.additionalDocuments || []
      },
      supportedRegions: industry.supportedRegions || [],
      restrictedRegions: industry.restrictedRegions || [],
      regulatoryNotes: industry.regulatoryNotes || '',
      isActive: industry.isActive ?? true
    }));
  }

  private getDefaultIndustries(): IndustryInfo[] {
    return [
      {
        id: 'financial-services',
        name: 'Financial Services',
        category: 'financial',
        riskLevel: 'high',
        complianceRequirements: {
          kycLevel: 'premium',
          amlChecks: true,
          sanctionScreening: true,
          ongoingMonitoring: true,
          additionalDocuments: ['business_license', 'regulatory_registration']
        },
        supportedRegions: ['US', 'EU', 'UK'],
        restrictedRegions: [],
        regulatoryNotes: 'Requires full regulatory compliance and ongoing monitoring',
        isActive: true
      },
      {
        id: 'technology',
        name: 'Technology',
        category: 'technology',
        riskLevel: 'medium',
        complianceRequirements: {
          kycLevel: 'enhanced',
          amlChecks: true,
          sanctionScreening: true,
          ongoingMonitoring: false,
          additionalDocuments: ['business_registration']
        },
        supportedRegions: ['GLOBAL'],
        restrictedRegions: [],
        regulatoryNotes: 'Standard compliance requirements for technology companies',
        isActive: true
      },
      {
        id: 'gaming',
        name: 'Gaming & Entertainment',
        category: 'gaming',
        riskLevel: 'medium',
        complianceRequirements: {
          kycLevel: 'enhanced',
          amlChecks: true,
          sanctionScreening: true,
          ongoingMonitoring: false,
          additionalDocuments: ['gaming_license']
        },
        supportedRegions: ['US', 'EU', 'UK', 'APAC'],
        restrictedRegions: [],
        regulatoryNotes: 'May require gaming-specific licenses in certain jurisdictions',
        isActive: true
      }
    ];
  }
}

export const geolocationService = new GeolocationService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
