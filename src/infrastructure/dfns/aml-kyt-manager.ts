/**
 * DFNS AML/KYT Integration - Chainalysis compliance integration for DFNS
 * 
 * This service integrates DFNS with Chainalysis for:
 * - Real-time transaction screening and monitoring
 * - Inbound and outbound transaction analysis
 * - Risk assessment and sanctions screening
 * - Compliance policy automation
 * - KYT alerts and reporting
 */

import type { DfnsClientConfig } from '@/types/dfns';
import { DfnsAuthenticator } from './auth';
import { DfnsPolicyManager, PolicyRule, PolicyRuleKind, RiskLevel } from './policy-manager';

// Re-export types for external use
export { RiskLevel } from './policy-manager';
import { DFNS_CONFIG, DFNS_ENDPOINTS } from './config';

// ===== AML/KYT Types =====

export interface AmlScreeningResult {
  id: string;
  transactionId: string;
  walletId: string;
  status: ScreeningStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  alerts: AmlAlert[];
  sanctions: SanctionsCheck;
  addressAnalysis: AddressAnalysis;
  metadata: ScreeningMetadata;
  dateCreated: string;
  dateCompleted?: string;
}

export interface AmlAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  category: string;
  description: string;
  entities: AlertEntity[];
  recommendedAction: RecommendedAction;
  falsePositiveRisk: number;
  dateDetected: string;
}

export interface AlertEntity {
  id: string;
  type: EntityType;
  name?: string;
  addresses: string[];
  tags: string[];
  riskScore: number;
  jurisdiction?: string;
}

export interface SanctionsCheck {
  isSanctioned: boolean;
  sanctions: SanctionMatch[];
  lists: string[];
  jurisdiction: string[];
  checkDate: string;
}

export interface SanctionMatch {
  listName: string;
  entityName: string;
  matchStrength: number;
  details: Record<string, any>;
}

export interface AddressAnalysis {
  address: string;
  network: string;
  category: AddressCategory;
  owner?: string;
  tags: string[];
  riskIndicators: RiskIndicator[];
  transactionHistory: {
    totalTransactions: number;
    volume: string;
    firstSeen: string;
    lastSeen: string;
  };
  directExposure: ExposureAnalysis;
  indirectExposure: ExposureAnalysis;
}

export interface ExposureAnalysis {
  sanctionedEntities: number;
  darknetMarkets: number;
  exchanges: number;
  gambling: number;
  illicitServices: number;
  mixers: number;
  ransomware: number;
  totalRiskScore: number;
}

export interface RiskIndicator {
  type: RiskIndicatorType;
  severity: AlertSeverity;
  description: string;
  confidence: number;
}

export interface ScreeningMetadata {
  provider: 'Chainalysis';
  version: string;
  screeningType: ScreeningType;
  configuration: ScreeningConfiguration;
  processingTime: number;
  dataTimestamp: string;
}

export interface ScreeningConfiguration {
  riskThreshold: number;
  categories: string[];
  enableSanctionsScreening: boolean;
  enableAmlScreening: boolean;
  includeIndirectExposure: boolean;
  maxDepth: number;
}

export interface ComplianceReport {
  id: string;
  organizationId: string;
  reportType: ReportType;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  summary: ComplianceSummary;
  screenings: AmlScreeningResult[];
  alerts: AmlAlert[];
  statistics: ComplianceStatistics;
  dateGenerated: string;
}

export interface ComplianceSummary {
  totalTransactions: number;
  screenedTransactions: number;
  flaggedTransactions: number;
  blockedTransactions: number;
  falsePositives: number;
  avgRiskScore: number;
  complianceRate: number;
}

export interface ComplianceStatistics {
  riskDistribution: Record<RiskLevel, number>;
  alertsByCategory: Record<string, number>;
  sanctionsHits: number;
  topRiskCountries: Array<{ country: string; count: number }>;
  topRiskCategories: Array<{ category: string; count: number }>;
  trends: {
    dailyScreenings: Array<{ date: string; count: number }>;
    riskTrends: Array<{ date: string; avgRisk: number }>;
  };
}

export enum ScreeningStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
  Skipped = 'Skipped'
}

export enum AlertType {
  Sanctions = 'Sanctions',
  HighRisk = 'HighRisk',
  Suspicious = 'Suspicious',
  Geographic = 'Geographic',
  Volume = 'Volume',
  Velocity = 'Velocity',
  NewAddress = 'NewAddress',
  Mixer = 'Mixer',
  DarkNet = 'DarkNet',
  Ransomware = 'Ransomware'
}

export enum AlertSeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum EntityType {
  Individual = 'Individual',
  Organization = 'Organization',
  Exchange = 'Exchange',
  Service = 'Service',
  Address = 'Address'
}

export enum RecommendedAction {
  Approve = 'Approve',
  Review = 'Review',
  Block = 'Block',
  Flag = 'Flag',
  Monitor = 'Monitor'
}

export enum AddressCategory {
  Unknown = 'Unknown',
  Exchange = 'Exchange',
  Wallet = 'Wallet',
  Mixer = 'Mixer',
  DarknetMarket = 'DarknetMarket',
  Ransomware = 'Ransomware',
  Scam = 'Scam',
  Gambling = 'Gambling',
  IllicitService = 'IllicitService',
  Sanctions = 'Sanctions'
}

export enum RiskIndicatorType {
  DirectSanctions = 'DirectSanctions',
  IndirectSanctions = 'IndirectSanctions',
  HighRiskJurisdiction = 'HighRiskJurisdiction',
  MixerExposure = 'MixerExposure',
  DarknetExposure = 'DarknetExposure',
  RansomwareExposure = 'RansomwareExposure',
  UnusualPatterns = 'UnusualPatterns',
  NewAddress = 'NewAddress'
}

export enum ScreeningType {
  Prescreening = 'Prescreening',
  Postscreening = 'Postscreening',
  Manual = 'Manual',
  Batch = 'Batch'
}

export enum ReportType {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  Custom = 'Custom'
}

export interface ReportPeriod {
  start: string;
  end: string;
  timezone: string;
}

// ===== DFNS AML/KYT Manager Class =====

export class DfnsAmlKytManager {
  private config: DfnsClientConfig;
  private authenticator: DfnsAuthenticator;
  private policyManager: DfnsPolicyManager;

  constructor(config: DfnsClientConfig, authenticator?: DfnsAuthenticator) {
    this.config = config;
    this.authenticator = authenticator || new DfnsAuthenticator(config);
    this.policyManager = new DfnsPolicyManager(config, this.authenticator);
  }

  // ===== Transaction Screening =====

  /**
   * Screen outbound transaction before broadcasting
   */
  async screenOutboundTransaction(request: {
    walletId: string;
    toAddress: string;
    amount: string;
    asset: string;
    network: string;
    metadata?: Record<string, any>;
  }): Promise<AmlScreeningResult> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required for transaction screening');
      }

      const screeningRequest = {
        type: ScreeningType.Prescreening,
        walletId: request.walletId,
        transactionData: {
          to: request.toAddress,
          amount: request.amount,
          asset: request.asset,
          network: request.network
        },
        configuration: this.getDefaultScreeningConfig(),
        metadata: request.metadata
      };

      const response = await fetch(`${this.config.baseUrl}/aml-kyt/screen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        },
        body: JSON.stringify(screeningRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Screening failed: ${errorData.message || response.statusText}`);
      }

      const screeningData = await response.json();
      return this.mapChainalysisToScreeningResult(screeningData);
    } catch (error) {
      throw new Error(`Failed to screen outbound transaction: ${(error as Error).message}`);
    }
  }

  /**
   * Screen inbound transaction after detection
   */
  async screenInboundTransaction(request: {
    walletId: string;
    fromAddress: string;
    amount: string;
    asset: string;
    network: string;
    txHash: string;
    blockHeight?: number;
  }): Promise<AmlScreeningResult> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required for transaction screening');
      }

      const screeningRequest = {
        type: ScreeningType.Postscreening,
        walletId: request.walletId,
        transactionData: {
          from: request.fromAddress,
          amount: request.amount,
          asset: request.asset,
          network: request.network,
          txHash: request.txHash,
          blockHeight: request.blockHeight
        },
        configuration: this.getDefaultScreeningConfig()
      };

      const response = await fetch(`${this.config.baseUrl}/aml-kyt/screen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        },
        body: JSON.stringify(screeningRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Screening failed: ${errorData.message || response.statusText}`);
      }

      const screeningData = await response.json();
      return this.mapChainalysisToScreeningResult(screeningData);
    } catch (error) {
      throw new Error(`Failed to screen inbound transaction: ${(error as Error).message}`);
    }
  }

  /**
   * Get screening result details
   */
  async getScreeningResult(screeningId: string): Promise<AmlScreeningResult> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get screening result');
      }

      const response = await fetch(`${this.config.baseUrl}/aml-kyt/screenings/${screeningId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get screening result: ${response.statusText}`);
      }

      const screeningData = await response.json();
      return this.mapChainalysisToScreeningResult(screeningData);
    } catch (error) {
      throw new Error(`Failed to get screening result: ${(error as Error).message}`);
    }
  }

  // ===== Address Analysis =====

  /**
   * Analyze address risk and associations
   */
  async analyzeAddress(
    address: string,
    network: string,
    options: {
      includeIndirectExposure?: boolean;
      maxDepth?: number;
    } = {}
  ): Promise<AddressAnalysis> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required for address analysis');
      }

      const analysisRequest = {
        address,
        network,
        includeIndirectExposure: options.includeIndirectExposure || true,
        maxDepth: options.maxDepth || 3
      };

      const response = await fetch(`${this.config.baseUrl}/aml-kyt/analyze-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        },
        body: JSON.stringify(analysisRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Address analysis failed: ${errorData.message || response.statusText}`);
      }

      const analysisData = await response.json();
      return this.mapChainalysisToAddressAnalysis(analysisData);
    } catch (error) {
      throw new Error(`Failed to analyze address: ${(error as Error).message}`);
    }
  }

  /**
   * Batch analyze multiple addresses
   */
  async analyzeAddressBatch(
    addresses: Array<{ address: string; network: string }>,
    options: {
      includeIndirectExposure?: boolean;
      maxDepth?: number;
    } = {}
  ): Promise<AddressAnalysis[]> {
    try {
      const analysisPromises = addresses.map(({ address, network }) =>
        this.analyzeAddress(address, network, options)
      );

      return await Promise.all(analysisPromises);
    } catch (error) {
      throw new Error(`Failed to analyze addresses: ${(error as Error).message}`);
    }
  }

  // ===== Policy Integration =====

  /**
   * Create AML screening policy
   */
  async createAmlScreeningPolicy(config: {
    name: string;
    description?: string;
    riskThreshold: RiskLevel;
    sanctionsScreening: boolean;
    categories: string[];
    autoBlock: boolean;
    alertNotifications: boolean;
  }): Promise<any> {
    try {
      const policyRule: PolicyRule = {
        kind: PolicyRuleKind.ChainalysisTransactionScreening,
        configuration: {
          enabled: true,
          riskLevel: config.riskThreshold,
          sanctionsScreening: config.sanctionsScreening,
          amlChecking: true,
          categoryFilters: config.categories
        }
      };

      return await this.policyManager.createPolicy({
        name: config.name,
        description: config.description || 'Automated AML/KYT screening policy',
        rule: policyRule,
        activityKind: 'Wallets:TransferAsset' as any,
        status: 'Active' as any
      });
    } catch (error) {
      throw new Error(`Failed to create AML screening policy: ${(error as Error).message}`);
    }
  }

  /**
   * Create sanctions screening policy
   */
  async createSanctionsPolicy(config: {
    name: string;
    description?: string;
    lists: string[];
    autoBlock: boolean;
    alertNotifications: boolean;
  }): Promise<any> {
    try {
      const policyRule: PolicyRule = {
        kind: PolicyRuleKind.ChainalysisTransactionPrescreening,
        configuration: {
          enabled: true,
          sanctionsScreening: true,
          amlChecking: false,
          categoryFilters: config.lists
        }
      };

      return await this.policyManager.createPolicy({
        name: config.name,
        description: config.description || 'Automated sanctions screening policy',
        rule: policyRule,
        activityKind: 'Wallets:TransferAsset' as any,
        status: 'Active' as any
      });
    } catch (error) {
      throw new Error(`Failed to create sanctions policy: ${(error as Error).message}`);
    }
  }

  // ===== Reporting & Analytics =====

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    organizationId: string,
    period: ReportPeriod,
    reportType: ReportType
  ): Promise<ComplianceReport> {
    try {
      const reportRequest = {
        organizationId,
        reportType,
        period,
        includeStatistics: true,
        includeAlerts: true,
        includeScreenings: true
      };

      const response = await fetch(`${this.config.baseUrl}/aml-kyt/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        },
        body: JSON.stringify(reportRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Report generation failed: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to generate compliance report: ${(error as Error).message}`);
    }
  }

  /**
   * Get compliance statistics
   */
  async getComplianceStatistics(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<ComplianceStatistics> {
    try {
      const queryParams = new URLSearchParams({
        organizationId,
        startDate,
        endDate
      });

      const response = await fetch(`${this.config.baseUrl}/aml-kyt/statistics?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get compliance statistics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get compliance statistics: ${(error as Error).message}`);
    }
  }

  // ===== Alert Management =====

  /**
   * List AML alerts
   */
  async listAlerts(filters: {
    organizationId?: string;
    walletId?: string;
    severity?: AlertSeverity;
    type?: AlertType;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ alerts: AmlAlert[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`${this.config.baseUrl}/aml-kyt/alerts?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list alerts: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        alerts: data.alerts || [],
        total: data.total || 0
      };
    } catch (error) {
      throw new Error(`Failed to list alerts: ${(error as Error).message}`);
    }
  }

  /**
   * Update alert status
   */
  async updateAlert(
    alertId: string,
    updates: {
      status?: string;
      notes?: string;
      falsePositive?: boolean;
      assignee?: string;
    }
  ): Promise<AmlAlert> {
    try {
      const response = await fetch(`${this.config.baseUrl}/aml-kyt/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Alert update failed: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update alert: ${(error as Error).message}`);
    }
  }

  // ===== Utility Methods =====

  /**
   * Get default screening configuration
   */
  private getDefaultScreeningConfig(): ScreeningConfiguration {
    return {
      riskThreshold: 50,
      categories: [
        'sanctions',
        'darknet_markets',
        'child_abuse',
        'ransomware',
        'terrorism_financing',
        'stolen_coins',
        'mixer',
        'gambling'
      ],
      enableSanctionsScreening: true,
      enableAmlScreening: true,
      includeIndirectExposure: true,
      maxDepth: 3
    };
  }

  /**
   * Map Chainalysis response to screening result
   */
  private mapChainalysisToScreeningResult(data: any): AmlScreeningResult {
    return {
      id: data.id || `screening_${Date.now()}`,
      transactionId: data.transactionId || '',
      walletId: data.walletId || '',
      status: data.status as ScreeningStatus || ScreeningStatus.Completed,
      riskLevel: this.mapRiskScore(data.riskScore || 0),
      riskScore: data.riskScore || 0,
      alerts: (data.alerts || []).map((alert: any) => this.mapAlert(alert)),
      sanctions: data.sanctions || { isSanctioned: false, sanctions: [], lists: [], jurisdiction: [], checkDate: new Date().toISOString() },
      addressAnalysis: data.addressAnalysis || this.createEmptyAddressAnalysis(data.address || ''),
      metadata: {
        provider: 'Chainalysis',
        version: '1.0',
        screeningType: data.screeningType || ScreeningType.Manual,
        configuration: this.getDefaultScreeningConfig(),
        processingTime: data.processingTime || 0,
        dataTimestamp: new Date().toISOString()
      },
      dateCreated: data.dateCreated || new Date().toISOString(),
      dateCompleted: data.dateCompleted
    };
  }

  /**
   * Map Chainalysis address analysis
   */
  private mapChainalysisToAddressAnalysis(data: any): AddressAnalysis {
    return {
      address: data.address,
      network: data.network,
      category: data.category as AddressCategory || AddressCategory.Unknown,
      owner: data.owner,
      tags: data.tags || [],
      riskIndicators: (data.riskIndicators || []).map((indicator: any) => ({
        type: indicator.type as RiskIndicatorType,
        severity: indicator.severity as AlertSeverity,
        description: indicator.description,
        confidence: indicator.confidence || 0
      })),
      transactionHistory: data.transactionHistory || {
        totalTransactions: 0,
        volume: '0',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      },
      directExposure: data.directExposure || this.createEmptyExposureAnalysis(),
      indirectExposure: data.indirectExposure || this.createEmptyExposureAnalysis()
    };
  }

  /**
   * Map alert data
   */
  private mapAlert(data: any): AmlAlert {
    return {
      id: data.id || `alert_${Date.now()}`,
      type: data.type as AlertType || AlertType.HighRisk,
      severity: data.severity as AlertSeverity || AlertSeverity.Medium,
      category: data.category || 'Unknown',
      description: data.description || '',
      entities: data.entities || [],
      recommendedAction: data.recommendedAction as RecommendedAction || RecommendedAction.Review,
      falsePositiveRisk: data.falsePositiveRisk || 0,
      dateDetected: data.dateDetected || new Date().toISOString()
    };
  }

  /**
   * Map risk score to risk level
   */
  private mapRiskScore(score: number): RiskLevel {
    if (score >= 75) return RiskLevel.High;
    if (score >= 50) return RiskLevel.Medium;
    return RiskLevel.Low;
  }

  /**
   * Create empty address analysis
   */
  private createEmptyAddressAnalysis(address: string): AddressAnalysis {
    return {
      address,
      network: 'Ethereum',
      category: AddressCategory.Unknown,
      tags: [],
      riskIndicators: [],
      transactionHistory: {
        totalTransactions: 0,
        volume: '0',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      },
      directExposure: this.createEmptyExposureAnalysis(),
      indirectExposure: this.createEmptyExposureAnalysis()
    };
  }

  /**
   * Create empty exposure analysis
   */
  private createEmptyExposureAnalysis(): ExposureAnalysis {
    return {
      sanctionedEntities: 0,
      darknetMarkets: 0,
      exchanges: 0,
      gambling: 0,
      illicitServices: 0,
      mixers: 0,
      ransomware: 0,
      totalRiskScore: 0
    };
  }
}

// ===== Export =====

export default DfnsAmlKytManager;
