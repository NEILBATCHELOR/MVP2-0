/**
 * ERC1400 Property Mapper
 * Comprehensive implementation for ERC1400 security token properties mapping
 */

import { BaseMapper, ValidationResult } from '../shared/baseMapper';
import { PropertyTableMapper } from '../database/schemaMapper';
import { JsonbConfigMapper, TransferConfig, WhitelistConfig, ComplianceConfig } from '../config/jsonbConfigMapper';

/**
 * Advanced JSONB configurations specific to ERC1400
 */
export interface KycSettings {
  enabled: boolean;
  requiredLevel?: 'basic' | 'enhanced' | 'institutional';
  autoVerification?: boolean;
  documentsRequired?: string[];
  expirationPeriod?: number; // days
}

export interface ComplianceSettings {
  automationLevel: 'manual' | 'semi-automatic' | 'fully-automatic';
  ruleEngine?: 'internal' | 'external';
  externalProviders?: string[];
  monitoringEnabled?: boolean;
  alertThresholds?: Record<string, any>;
}

export interface CustomFeatures {
  advancedReporting?: boolean;
  institutionalGrade?: boolean;
  multiJurisdiction?: boolean;
  enterpriseFeatures?: boolean;
  customIntegrations?: string[];
}

export interface GeographicRestrictions {
  restrictedCountries: string[];
  allowedCountries?: string[];
  treatyBenefits?: boolean;
  passportRegime?: boolean;
  taxOptimization?: boolean;
}

export interface TransactionMonitoringRule {
  id: string;
  name: string;
  ruleType: 'amount_threshold' | 'frequency' | 'pattern' | 'location' | 'identity';
  threshold?: string;
  timeframe?: number;
  action: 'flag' | 'block' | 'require_approval';
  enabled: boolean;
}

export interface QuorumRequirement {
  proposalType: string;
  minimumQuorum: string; // percentage
  votingPeriod: number; // hours
  executionDelay?: number; // hours
}

export interface ConcentrationLimit {
  entityType: 'individual' | 'institution' | 'fund';
  maxPercentage: string;
  exemptions?: string[];
}

export interface ForeignOwnershipRestriction {
  jurisdiction: string;
  maxPercentage: string;
  exemptions?: string[];
  treatyBenefits?: boolean;
}

export interface PriceDiscoveryMechanism {
  type: 'auction' | 'market_maker' | 'fixed_price' | 'formula_based';
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface InvestorLimits {
  maxInvestors?: number;
  accreditedOnly?: boolean;
  institutionalMinimum?: string;
  geographicRestrictions?: string[];
}

export interface JurisdictionRestriction {
  jurisdiction: string;
  allowed: boolean;
  requiredDocuments?: string[];
  additionalCompliance?: string[];
}

/**
 * Database schema for ERC1400 properties
 */
export interface TokenERC1400PropertiesDB {
  id: string;
  token_id: string;
  initial_supply?: string;
  cap?: string;
  is_mintable?: boolean;
  is_burnable?: boolean;
  is_pausable?: boolean;
  document_uri?: string;
  document_hash?: string;
  controller_address?: string;
  require_kyc?: boolean;
  security_type?: string;
  issuing_jurisdiction?: string;
  issuing_entity_name?: string;
  issuing_entity_lei?: string;
  transfer_restrictions?: any; // JSONB
  kyc_settings?: any; // JSONB
  compliance_settings?: any; // JSONB
  forced_transfers?: boolean;
  issuance_modules?: boolean;
  document_management?: boolean;
  recovery_mechanism?: boolean;
  regulation_type?: string;
  is_multi_class?: boolean;
  tranche_transferability?: boolean;
  decimals?: number;
  token_details?: string;
  legal_terms?: string;
  prospectus?: string;
  enforce_kyc?: boolean;
  forced_redemption_enabled?: boolean;
  whitelist_enabled?: boolean;
  holding_period?: number;
  max_investor_count?: number;
  investor_accreditation?: boolean;
  auto_compliance?: boolean;
  manual_approvals?: boolean;
  compliance_module?: string;
  is_issuable?: boolean;
  granular_control?: boolean;
  dividend_distribution?: boolean;
  corporate_actions?: boolean;
  custom_features?: any; // JSONB
  geographic_restrictions?: any; // JSONB
  compliance_automation_level?: string;
  whitelist_config?: any; // JSONB
  investor_whitelist_enabled?: boolean;
  accredited_investor_only?: boolean;
  jurisdiction_restrictions?: any; // JSONB
  investor_limits?: any; // JSONB
  use_geographic_restrictions?: boolean;
  default_restriction_policy?: string;
  institutional_grade?: boolean;
  custody_integration_enabled?: boolean;
  prime_brokerage_support?: boolean;
  settlement_integration?: string;
  clearing_house_integration?: boolean;
  central_securities_depository_integration?: boolean;
  third_party_custody_addresses?: string[];
  institutional_wallet_support?: boolean;
  real_time_compliance_monitoring?: boolean;
  automated_sanctions_screening?: boolean;
  pep_screening_enabled?: boolean;
  aml_monitoring_enabled?: boolean;
  transaction_monitoring_rules?: any; // JSONB
  suspicious_activity_reporting?: boolean;
  compliance_officer_notifications?: boolean;
  regulatory_reporting_automation?: boolean;
  advanced_corporate_actions?: boolean;
  stock_splits_enabled?: boolean;
  stock_dividends_enabled?: boolean;
  rights_offerings_enabled?: boolean;
  spin_offs_enabled?: boolean;
  mergers_acquisitions_support?: boolean;
  treasury_management_enabled?: boolean;
  buyback_programs_enabled?: boolean;
  share_repurchase_automation?: boolean;
  advanced_governance_enabled?: boolean;
  proxy_voting_enabled?: boolean;
  cumulative_voting_enabled?: boolean;
  weighted_voting_by_class?: boolean;
  quorum_requirements?: any; // JSONB
  voting_delegation_enabled?: boolean;
  institutional_voting_services?: boolean;
  board_election_support?: boolean;
  cross_border_trading_enabled?: boolean;
  multi_jurisdiction_compliance?: boolean;
  passport_regime_support?: boolean;
  treaty_benefits_enabled?: boolean;
  withholding_tax_automation?: boolean;
  currency_hedging_enabled?: boolean;
  foreign_ownership_restrictions?: any; // JSONB
  regulatory_equivalence_mapping?: any; // JSONB
  enhanced_reporting_enabled?: boolean;
  real_time_shareholder_registry?: boolean;
  beneficial_ownership_tracking?: boolean;
  position_reconciliation_enabled?: boolean;
  regulatory_filing_automation?: boolean;
  audit_trail_comprehensive?: boolean;
  performance_analytics_enabled?: boolean;
  esg_reporting_enabled?: boolean;
  traditional_finance_integration?: boolean;
  swift_integration_enabled?: boolean;
  iso20022_messaging_support?: boolean;
  financial_data_vendor_integration?: boolean;
  market_data_feeds_enabled?: boolean;
  price_discovery_mechanisms?: any; // JSONB
  cross_chain_bridge_support?: boolean;
  layer2_scaling_support?: boolean;
  advanced_risk_management?: boolean;
  position_limits_enabled?: boolean;
  concentration_limits?: any; // JSONB
  stress_testing_enabled?: boolean;
  margin_requirements_dynamic?: boolean;
  collateral_management_enabled?: boolean;
  insurance_coverage_enabled?: boolean;
  disaster_recovery_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Domain model for ERC1400 properties
 */
export interface TokenERC1400Properties {
  id: string;
  tokenId: string;
  initialSupply?: string;
  cap?: string;
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  documentUri?: string;
  documentHash?: string;
  controllerAddress?: string;
  requireKyc?: boolean;
  securityType?: string;
  issuingJurisdiction?: string;
  issuingEntityName?: string;
  issuingEntityLei?: string;
  transferRestrictions?: TransferConfig;
  kycSettings?: KycSettings;
  complianceSettings?: ComplianceSettings;
  forcedTransfers?: boolean;
  issuanceModules?: boolean;
  documentManagement?: boolean;
  recoveryMechanism?: boolean;
  regulationType?: string;
  isMultiClass?: boolean;
  trancheTransferability?: boolean;
  decimals?: number;
  tokenDetails?: string;
  legalTerms?: string;
  prospectus?: string;
  enforceKyc?: boolean;
  forcedRedemptionEnabled?: boolean;
  whitelistEnabled?: boolean;
  holdingPeriod?: number;
  maxInvestorCount?: number;
  investorAccreditation?: boolean;
  autoCompliance?: boolean;
  manualApprovals?: boolean;
  complianceModule?: string;
  isIssuable?: boolean;
  granularControl?: boolean;
  dividendDistribution?: boolean;
  corporateActions?: boolean;
  customFeatures?: CustomFeatures;
  geographicRestrictions?: GeographicRestrictions;
  complianceAutomationLevel?: string;
  whitelistConfig?: WhitelistConfig;
  investorWhitelistEnabled?: boolean;
  accreditedInvestorOnly?: boolean;
  jurisdictionRestrictions?: JurisdictionRestriction[];
  investorLimits?: InvestorLimits;
  useGeographicRestrictions?: boolean;
  defaultRestrictionPolicy?: string;
  institutionalGrade?: boolean;
  custodyIntegrationEnabled?: boolean;
  primeBrokerageSupport?: boolean;
  settlementIntegration?: string;
  clearingHouseIntegration?: boolean;
  centralSecuritiesDepositoryIntegration?: boolean;
  thirdPartyCustodyAddresses?: string[];
  institutionalWalletSupport?: boolean;
  realTimeComplianceMonitoring?: boolean;
  automatedSanctionsScreening?: boolean;
  pepScreeningEnabled?: boolean;
  amlMonitoringEnabled?: boolean;
  transactionMonitoringRules?: TransactionMonitoringRule[];
  suspiciousActivityReporting?: boolean;
  complianceOfficerNotifications?: boolean;
  regulatoryReportingAutomation?: boolean;
  advancedCorporateActions?: boolean;
  stockSplitsEnabled?: boolean;
  stockDividendsEnabled?: boolean;
  rightsOfferingsEnabled?: boolean;
  spinOffsEnabled?: boolean;
  mergersAcquisitionsSupport?: boolean;
  treasuryManagementEnabled?: boolean;
  buybackProgramsEnabled?: boolean;
  shareRepurchaseAutomation?: boolean;
  advancedGovernanceEnabled?: boolean;
  proxyVotingEnabled?: boolean;
  cumulativeVotingEnabled?: boolean;
  weightedVotingByClass?: boolean;
  quorumRequirements?: QuorumRequirement[];
  votingDelegationEnabled?: boolean;
  institutionalVotingServices?: boolean;
  boardElectionSupport?: boolean;
  crossBorderTradingEnabled?: boolean;
  multiJurisdictionCompliance?: boolean;
  passportRegimeSupport?: boolean;
  treatyBenefitsEnabled?: boolean;
  withholdingTaxAutomation?: boolean;
  currencyHedgingEnabled?: boolean;
  foreignOwnershipRestrictions?: ForeignOwnershipRestriction[];
  regulatoryEquivalenceMapping?: Record<string, any>;
  enhancedReportingEnabled?: boolean;
  realTimeShareholderRegistry?: boolean;
  beneficialOwnershipTracking?: boolean;
  positionReconciliationEnabled?: boolean;
  regulatoryFilingAutomation?: boolean;
  auditTrailComprehensive?: boolean;
  performanceAnalyticsEnabled?: boolean;
  esgReportingEnabled?: boolean;
  traditionalFinanceIntegration?: boolean;
  swiftIntegrationEnabled?: boolean;
  iso20022MessagingSupport?: boolean;
  financialDataVendorIntegration?: boolean;
  marketDataFeedsEnabled?: boolean;
  priceDiscoveryMechanisms?: PriceDiscoveryMechanism[];
  crossChainBridgeSupport?: boolean;
  layer2ScalingSupport?: boolean;
  advancedRiskManagement?: boolean;
  positionLimitsEnabled?: boolean;
  concentrationLimits?: ConcentrationLimit[];
  stressTestingEnabled?: boolean;
  marginRequirementsDynamic?: boolean;
  collateralManagementEnabled?: boolean;
  insuranceCoverageEnabled?: boolean;
  disasterRecoveryEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Form data interface for ERC1400
 */
export interface ERC1400FormData {
  // Basic security token properties
  initialSupply?: string;
  cap?: string;
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  decimals?: number;
  
  // Security token documentation
  documentUri?: string;
  documentHash?: string;
  tokenDetails?: string;
  legalTerms?: string;
  prospectus?: string;
  
  // Security classification
  securityType?: string;
  regulationType?: string;
  issuingJurisdiction?: string;
  issuingEntityName?: string;
  issuingEntityLei?: string;
  
  // Controller configuration
  controllerAddress?: string;
  forcedTransfers?: boolean;
  forcedRedemptionEnabled?: boolean;
  recoveryMechanism?: boolean;
  
  // KYC and compliance
  requireKyc?: boolean;
  enforceKyc?: boolean;
  investorAccreditation?: boolean;
  accreditedInvestorOnly?: boolean;
  autoCompliance?: boolean;
  manualApprovals?: boolean;
  complianceModule?: string;
  complianceAutomationLevel?: string;
  
  // Investor management
  whitelistEnabled?: boolean;
  investorWhitelistEnabled?: boolean;
  holdingPeriod?: number;
  maxInvestorCount?: number;
  
  // Token features
  isIssuable?: boolean;
  granularControl?: boolean;
  dividendDistribution?: boolean;
  corporateActions?: boolean;
  issuanceModules?: boolean;
  documentManagement?: boolean;
  isMultiClass?: boolean;
  trancheTransferability?: boolean;
  
  // Compliance restrictions
  useGeographicRestrictions?: boolean;
  defaultRestrictionPolicy?: string;
  
  // Institutional features
  institutionalGrade?: boolean;
  custodyIntegrationEnabled?: boolean;
  primeBrokerageSupport?: boolean;
  settlementIntegration?: string;
  clearingHouseIntegration?: boolean;
  centralSecuritiesDepositoryIntegration?: boolean;
  thirdPartyCustodyAddresses?: string[];
  institutionalWalletSupport?: boolean;
  
  // Monitoring and screening
  realTimeComplianceMonitoring?: boolean;
  automatedSanctionsScreening?: boolean;
  pepScreeningEnabled?: boolean;
  amlMonitoringEnabled?: boolean;
  suspiciousActivityReporting?: boolean;
  complianceOfficerNotifications?: boolean;
  regulatoryReportingAutomation?: boolean;
  
  // Corporate actions
  advancedCorporateActions?: boolean;
  stockSplitsEnabled?: boolean;
  stockDividendsEnabled?: boolean;
  rightsOfferingsEnabled?: boolean;
  spinOffsEnabled?: boolean;
  mergersAcquisitionsSupport?: boolean;
  treasuryManagementEnabled?: boolean;
  buybackProgramsEnabled?: boolean;
  shareRepurchaseAutomation?: boolean;
  
  // Governance features
  advancedGovernanceEnabled?: boolean;
  proxyVotingEnabled?: boolean;
  cumulativeVotingEnabled?: boolean;
  weightedVotingByClass?: boolean;
  votingDelegationEnabled?: boolean;
  institutionalVotingServices?: boolean;
  boardElectionSupport?: boolean;
  
  // Cross-border features
  crossBorderTradingEnabled?: boolean;
  multiJurisdictionCompliance?: boolean;
  passportRegimeSupport?: boolean;
  treatyBenefitsEnabled?: boolean;
  withholdingTaxAutomation?: boolean;
  currencyHedgingEnabled?: boolean;
  
  // Reporting and analytics
  enhancedReportingEnabled?: boolean;
  realTimeShareholderRegistry?: boolean;
  beneficialOwnershipTracking?: boolean;
  positionReconciliationEnabled?: boolean;
  regulatoryFilingAutomation?: boolean;
  auditTrailComprehensive?: boolean;
  performanceAnalyticsEnabled?: boolean;
  esgReportingEnabled?: boolean;
  
  // Traditional finance integration
  traditionalFinanceIntegration?: boolean;
  swiftIntegrationEnabled?: boolean;
  iso20022MessagingSupport?: boolean;
  financialDataVendorIntegration?: boolean;
  marketDataFeedsEnabled?: boolean;
  
  // Blockchain features
  crossChainBridgeSupport?: boolean;
  layer2ScalingSupport?: boolean;
  
  // Risk management
  advancedRiskManagement?: boolean;
  positionLimitsEnabled?: boolean;
  stressTestingEnabled?: boolean;
  marginRequirementsDynamic?: boolean;
  collateralManagementEnabled?: boolean;
  insuranceCoverageEnabled?: boolean;
  disasterRecoveryEnabled?: boolean;
  
  // JSONB configurations
  transferRestrictions?: TransferConfig;
  kycSettings?: KycSettings;
  complianceSettings?: ComplianceSettings;
  customFeatures?: CustomFeatures;
  geographicRestrictions?: GeographicRestrictions;
  whitelistConfig?: WhitelistConfig;
  jurisdictionRestrictions?: JurisdictionRestriction[];
  investorLimits?: InvestorLimits;
  transactionMonitoringRules?: TransactionMonitoringRule[];
  quorumRequirements?: QuorumRequirement[];
  concentrationLimits?: ConcentrationLimit[];
  foreignOwnershipRestrictions?: ForeignOwnershipRestriction[];
  regulatoryEquivalenceMapping?: Record<string, any>;
  priceDiscoveryMechanisms?: PriceDiscoveryMechanism[];
}

/**
 * ERC1400 Property Mapper
 */
export class ERC1400PropertyMapper extends PropertyTableMapper<TokenERC1400Properties, TokenERC1400PropertiesDB> {
  
  protected getTableName(): string {
    return 'token_erc1400_properties';
  }

  protected getRequiredFields(): string[] {
    return ['token_id'];
  }

  toDomain(dbRecord: TokenERC1400PropertiesDB): TokenERC1400Properties {
    return {
      id: dbRecord.id,
      tokenId: dbRecord.token_id,
      initialSupply: dbRecord.initial_supply,
      cap: dbRecord.cap,
      isMintable: dbRecord.is_mintable,
      isBurnable: dbRecord.is_burnable,
      isPausable: dbRecord.is_pausable,
      documentUri: dbRecord.document_uri,
      documentHash: dbRecord.document_hash,
      controllerAddress: dbRecord.controller_address,
      requireKyc: dbRecord.require_kyc,
      securityType: dbRecord.security_type,
      issuingJurisdiction: dbRecord.issuing_jurisdiction,
      issuingEntityName: dbRecord.issuing_entity_name,
      issuingEntityLei: dbRecord.issuing_entity_lei,
      transferRestrictions: JsonbConfigMapper.mapTransferConfig(dbRecord.transfer_restrictions),
      kycSettings: this.mapKycSettings(dbRecord.kyc_settings),
      complianceSettings: this.mapComplianceSettings(dbRecord.compliance_settings),
      forcedTransfers: dbRecord.forced_transfers,
      issuanceModules: dbRecord.issuance_modules,
      documentManagement: dbRecord.document_management,
      recoveryMechanism: dbRecord.recovery_mechanism,
      regulationType: dbRecord.regulation_type,
      isMultiClass: dbRecord.is_multi_class,
      trancheTransferability: dbRecord.tranche_transferability,
      decimals: dbRecord.decimals,
      tokenDetails: dbRecord.token_details,
      legalTerms: dbRecord.legal_terms,
      prospectus: dbRecord.prospectus,
      enforceKyc: dbRecord.enforce_kyc,
      forcedRedemptionEnabled: dbRecord.forced_redemption_enabled,
      whitelistEnabled: dbRecord.whitelist_enabled,
      holdingPeriod: dbRecord.holding_period,
      maxInvestorCount: dbRecord.max_investor_count,
      investorAccreditation: dbRecord.investor_accreditation,
      autoCompliance: dbRecord.auto_compliance,
      manualApprovals: dbRecord.manual_approvals,
      complianceModule: dbRecord.compliance_module,
      isIssuable: dbRecord.is_issuable,
      granularControl: dbRecord.granular_control,
      dividendDistribution: dbRecord.dividend_distribution,
      corporateActions: dbRecord.corporate_actions,
      customFeatures: this.mapCustomFeatures(dbRecord.custom_features),
      geographicRestrictions: this.mapGeographicRestrictions(dbRecord.geographic_restrictions),
      complianceAutomationLevel: dbRecord.compliance_automation_level,
      whitelistConfig: JsonbConfigMapper.mapWhitelistConfig(dbRecord.whitelist_config),
      investorWhitelistEnabled: dbRecord.investor_whitelist_enabled,
      accreditedInvestorOnly: dbRecord.accredited_investor_only,
      jurisdictionRestrictions: this.mapJurisdictionRestrictions(dbRecord.jurisdiction_restrictions),
      investorLimits: this.mapInvestorLimits(dbRecord.investor_limits),
      useGeographicRestrictions: dbRecord.use_geographic_restrictions,
      defaultRestrictionPolicy: dbRecord.default_restriction_policy,
      institutionalGrade: dbRecord.institutional_grade,
      custodyIntegrationEnabled: dbRecord.custody_integration_enabled,
      primeBrokerageSupport: dbRecord.prime_brokerage_support,
      settlementIntegration: dbRecord.settlement_integration,
      clearingHouseIntegration: dbRecord.clearing_house_integration,
      centralSecuritiesDepositoryIntegration: dbRecord.central_securities_depository_integration,
      thirdPartyCustodyAddresses: dbRecord.third_party_custody_addresses,
      institutionalWalletSupport: dbRecord.institutional_wallet_support,
      realTimeComplianceMonitoring: dbRecord.real_time_compliance_monitoring,
      automatedSanctionsScreening: dbRecord.automated_sanctions_screening,
      pepScreeningEnabled: dbRecord.pep_screening_enabled,
      amlMonitoringEnabled: dbRecord.aml_monitoring_enabled,
      transactionMonitoringRules: this.mapTransactionMonitoringRules(dbRecord.transaction_monitoring_rules),
      suspiciousActivityReporting: dbRecord.suspicious_activity_reporting,
      complianceOfficerNotifications: dbRecord.compliance_officer_notifications,
      regulatoryReportingAutomation: dbRecord.regulatory_reporting_automation,
      advancedCorporateActions: dbRecord.advanced_corporate_actions,
      stockSplitsEnabled: dbRecord.stock_splits_enabled,
      stockDividendsEnabled: dbRecord.stock_dividends_enabled,
      rightsOfferingsEnabled: dbRecord.rights_offerings_enabled,
      spinOffsEnabled: dbRecord.spin_offs_enabled,
      mergersAcquisitionsSupport: dbRecord.mergers_acquisitions_support,
      treasuryManagementEnabled: dbRecord.treasury_management_enabled,
      buybackProgramsEnabled: dbRecord.buyback_programs_enabled,
      shareRepurchaseAutomation: dbRecord.share_repurchase_automation,
      advancedGovernanceEnabled: dbRecord.advanced_governance_enabled,
      proxyVotingEnabled: dbRecord.proxy_voting_enabled,
      cumulativeVotingEnabled: dbRecord.cumulative_voting_enabled,
      weightedVotingByClass: dbRecord.weighted_voting_by_class,
      quorumRequirements: this.mapQuorumRequirements(dbRecord.quorum_requirements),
      votingDelegationEnabled: dbRecord.voting_delegation_enabled,
      institutionalVotingServices: dbRecord.institutional_voting_services,
      boardElectionSupport: dbRecord.board_election_support,
      crossBorderTradingEnabled: dbRecord.cross_border_trading_enabled,
      multiJurisdictionCompliance: dbRecord.multi_jurisdiction_compliance,
      passportRegimeSupport: dbRecord.passport_regime_support,
      treatyBenefitsEnabled: dbRecord.treaty_benefits_enabled,
      withholdingTaxAutomation: dbRecord.withholding_tax_automation,
      currencyHedgingEnabled: dbRecord.currency_hedging_enabled,
      foreignOwnershipRestrictions: this.mapForeignOwnershipRestrictions(dbRecord.foreign_ownership_restrictions),
      regulatoryEquivalenceMapping: this.handleJsonbField(dbRecord.regulatory_equivalence_mapping),
      enhancedReportingEnabled: dbRecord.enhanced_reporting_enabled,
      realTimeShareholderRegistry: dbRecord.real_time_shareholder_registry,
      beneficialOwnershipTracking: dbRecord.beneficial_ownership_tracking,
      positionReconciliationEnabled: dbRecord.position_reconciliation_enabled,
      regulatoryFilingAutomation: dbRecord.regulatory_filing_automation,
      auditTrailComprehensive: dbRecord.audit_trail_comprehensive,
      performanceAnalyticsEnabled: dbRecord.performance_analytics_enabled,
      esgReportingEnabled: dbRecord.esg_reporting_enabled,
      traditionalFinanceIntegration: dbRecord.traditional_finance_integration,
      swiftIntegrationEnabled: dbRecord.swift_integration_enabled,
      iso20022MessagingSupport: dbRecord.iso20022_messaging_support,
      financialDataVendorIntegration: dbRecord.financial_data_vendor_integration,
      marketDataFeedsEnabled: dbRecord.market_data_feeds_enabled,
      priceDiscoveryMechanisms: this.mapPriceDiscoveryMechanisms(dbRecord.price_discovery_mechanisms),
      crossChainBridgeSupport: dbRecord.cross_chain_bridge_support,
      layer2ScalingSupport: dbRecord.layer2_scaling_support,
      advancedRiskManagement: dbRecord.advanced_risk_management,
      positionLimitsEnabled: dbRecord.position_limits_enabled,
      concentrationLimits: this.mapConcentrationLimits(dbRecord.concentration_limits),
      stressTestingEnabled: dbRecord.stress_testing_enabled,
      marginRequirementsDynamic: dbRecord.margin_requirements_dynamic,
      collateralManagementEnabled: dbRecord.collateral_management_enabled,
      insuranceCoverageEnabled: dbRecord.insurance_coverage_enabled,
      disasterRecoveryEnabled: dbRecord.disaster_recovery_enabled,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  toDatabase(domainObject: TokenERC1400Properties): TokenERC1400PropertiesDB {
    return this.cleanUndefined({
      id: domainObject.id,
      token_id: domainObject.tokenId,
      initial_supply: domainObject.initialSupply,
      cap: domainObject.cap,
      is_mintable: domainObject.isMintable,
      is_burnable: domainObject.isBurnable,
      is_pausable: domainObject.isPausable,
      document_uri: domainObject.documentUri,
      document_hash: domainObject.documentHash,
      controller_address: domainObject.controllerAddress,
      require_kyc: domainObject.requireKyc,
      security_type: domainObject.securityType,
      issuing_jurisdiction: domainObject.issuingJurisdiction,
      issuing_entity_name: domainObject.issuingEntityName,
      issuing_entity_lei: domainObject.issuingEntityLei,
      transfer_restrictions: this.prepareJsonbField(domainObject.transferRestrictions),
      kyc_settings: this.prepareJsonbField(domainObject.kycSettings),
      compliance_settings: this.prepareJsonbField(domainObject.complianceSettings),
      forced_transfers: domainObject.forcedTransfers,
      issuance_modules: domainObject.issuanceModules,
      document_management: domainObject.documentManagement,
      recovery_mechanism: domainObject.recoveryMechanism,
      regulation_type: domainObject.regulationType,
      is_multi_class: domainObject.isMultiClass,
      tranche_transferability: domainObject.trancheTransferability,
      decimals: domainObject.decimals,
      token_details: domainObject.tokenDetails,
      legal_terms: domainObject.legalTerms,
      prospectus: domainObject.prospectus,
      enforce_kyc: domainObject.enforceKyc,
      forced_redemption_enabled: domainObject.forcedRedemptionEnabled,
      whitelist_enabled: domainObject.whitelistEnabled,
      holding_period: domainObject.holdingPeriod,
      max_investor_count: domainObject.maxInvestorCount,
      investor_accreditation: domainObject.investorAccreditation,
      auto_compliance: domainObject.autoCompliance,
      manual_approvals: domainObject.manualApprovals,
      compliance_module: domainObject.complianceModule,
      is_issuable: domainObject.isIssuable,
      granular_control: domainObject.granularControl,
      dividend_distribution: domainObject.dividendDistribution,
      corporate_actions: domainObject.corporateActions,
      custom_features: this.prepareJsonbField(domainObject.customFeatures),
      geographic_restrictions: this.prepareJsonbField(domainObject.geographicRestrictions),
      compliance_automation_level: domainObject.complianceAutomationLevel,
      whitelist_config: this.prepareJsonbField(domainObject.whitelistConfig),
      investor_whitelist_enabled: domainObject.investorWhitelistEnabled,
      accredited_investor_only: domainObject.accreditedInvestorOnly,
      jurisdiction_restrictions: this.prepareJsonbField(domainObject.jurisdictionRestrictions),
      investor_limits: this.prepareJsonbField(domainObject.investorLimits),
      use_geographic_restrictions: domainObject.useGeographicRestrictions,
      default_restriction_policy: domainObject.defaultRestrictionPolicy,
      institutional_grade: domainObject.institutionalGrade,
      custody_integration_enabled: domainObject.custodyIntegrationEnabled,
      prime_brokerage_support: domainObject.primeBrokerageSupport,
      settlement_integration: domainObject.settlementIntegration,
      clearing_house_integration: domainObject.clearingHouseIntegration,
      central_securities_depository_integration: domainObject.centralSecuritiesDepositoryIntegration,
      third_party_custody_addresses: domainObject.thirdPartyCustodyAddresses,
      institutional_wallet_support: domainObject.institutionalWalletSupport,
      real_time_compliance_monitoring: domainObject.realTimeComplianceMonitoring,
      automated_sanctions_screening: domainObject.automatedSanctionsScreening,
      pep_screening_enabled: domainObject.pepScreeningEnabled,
      aml_monitoring_enabled: domainObject.amlMonitoringEnabled,
      transaction_monitoring_rules: this.prepareJsonbField(domainObject.transactionMonitoringRules),
      suspicious_activity_reporting: domainObject.suspiciousActivityReporting,
      compliance_officer_notifications: domainObject.complianceOfficerNotifications,
      regulatory_reporting_automation: domainObject.regulatoryReportingAutomation,
      advanced_corporate_actions: domainObject.advancedCorporateActions,
      stock_splits_enabled: domainObject.stockSplitsEnabled,
      stock_dividends_enabled: domainObject.stockDividendsEnabled,
      rights_offerings_enabled: domainObject.rightsOfferingsEnabled,
      spin_offs_enabled: domainObject.spinOffsEnabled,
      mergers_acquisitions_support: domainObject.mergersAcquisitionsSupport,
      treasury_management_enabled: domainObject.treasuryManagementEnabled,
      buyback_programs_enabled: domainObject.buybackProgramsEnabled,
      share_repurchase_automation: domainObject.shareRepurchaseAutomation,
      advanced_governance_enabled: domainObject.advancedGovernanceEnabled,
      proxy_voting_enabled: domainObject.proxyVotingEnabled,
      cumulative_voting_enabled: domainObject.cumulativeVotingEnabled,
      weighted_voting_by_class: domainObject.weightedVotingByClass,
      quorum_requirements: this.prepareJsonbField(domainObject.quorumRequirements),
      voting_delegation_enabled: domainObject.votingDelegationEnabled,
      institutional_voting_services: domainObject.institutionalVotingServices,
      board_election_support: domainObject.boardElectionSupport,
      cross_border_trading_enabled: domainObject.crossBorderTradingEnabled,
      multi_jurisdiction_compliance: domainObject.multiJurisdictionCompliance,
      passport_regime_support: domainObject.passportRegimeSupport,
      treaty_benefits_enabled: domainObject.treatyBenefitsEnabled,
      withholding_tax_automation: domainObject.withholdingTaxAutomation,
      currency_hedging_enabled: domainObject.currencyHedgingEnabled,
      foreign_ownership_restrictions: this.prepareJsonbField(domainObject.foreignOwnershipRestrictions),
      regulatory_equivalence_mapping: this.prepareJsonbField(domainObject.regulatoryEquivalenceMapping),
      enhanced_reporting_enabled: domainObject.enhancedReportingEnabled,
      real_time_shareholder_registry: domainObject.realTimeShareholderRegistry,
      beneficial_ownership_tracking: domainObject.beneficialOwnershipTracking,
      position_reconciliation_enabled: domainObject.positionReconciliationEnabled,
      regulatory_filing_automation: domainObject.regulatoryFilingAutomation,
      audit_trail_comprehensive: domainObject.auditTrailComprehensive,
      performance_analytics_enabled: domainObject.performanceAnalyticsEnabled,
      esg_reporting_enabled: domainObject.esgReportingEnabled,
      traditional_finance_integration: domainObject.traditionalFinanceIntegration,
      swift_integration_enabled: domainObject.swiftIntegrationEnabled,
      iso20022_messaging_support: domainObject.iso20022MessagingSupport,
      financial_data_vendor_integration: domainObject.financialDataVendorIntegration,
      market_data_feeds_enabled: domainObject.marketDataFeedsEnabled,
      price_discovery_mechanisms: this.prepareJsonbField(domainObject.priceDiscoveryMechanisms),
      cross_chain_bridge_support: domainObject.crossChainBridgeSupport,
      layer2_scaling_support: domainObject.layer2ScalingSupport,
      advanced_risk_management: domainObject.advancedRiskManagement,
      position_limits_enabled: domainObject.positionLimitsEnabled,
      concentration_limits: this.prepareJsonbField(domainObject.concentrationLimits),
      stress_testing_enabled: domainObject.stressTestingEnabled,
      margin_requirements_dynamic: domainObject.marginRequirementsDynamic,
      collateral_management_enabled: domainObject.collateralManagementEnabled,
      insurance_coverage_enabled: domainObject.insuranceCoverageEnabled,
      disaster_recovery_enabled: domainObject.disasterRecoveryEnabled,
      created_at: domainObject.createdAt,
      updated_at: domainObject.updatedAt,
    }) as TokenERC1400PropertiesDB;
  }

  fromForm(formData: ERC1400FormData, tokenId?: string): TokenERC1400PropertiesDB {
    return this.cleanUndefined({
      id: this.generateId(),
      token_id: tokenId || '',
      initial_supply: formData.initialSupply,
      cap: formData.cap,
      is_mintable: formData.isMintable || false,
      is_burnable: formData.isBurnable || false,
      is_pausable: formData.isPausable || false,
      decimals: formData.decimals,
      document_uri: formData.documentUri,
      document_hash: formData.documentHash,
      token_details: formData.tokenDetails,
      legal_terms: formData.legalTerms,
      prospectus: formData.prospectus,
      security_type: formData.securityType || 'equity',
      regulation_type: formData.regulationType || 'reg-d',
      issuing_jurisdiction: formData.issuingJurisdiction,
      issuing_entity_name: formData.issuingEntityName,
      issuing_entity_lei: formData.issuingEntityLei,
      controller_address: formData.controllerAddress,
      forced_transfers: formData.forcedTransfers || false,
      forced_redemption_enabled: formData.forcedRedemptionEnabled || false,
      recovery_mechanism: formData.recoveryMechanism || false,
      require_kyc: formData.requireKyc || false,
      enforce_kyc: formData.enforceKyc || false,
      investor_accreditation: formData.investorAccreditation || false,
      accredited_investor_only: formData.accreditedInvestorOnly || false,
      auto_compliance: formData.autoCompliance || false,
      manual_approvals: formData.manualApprovals || false,
      compliance_module: formData.complianceModule,
      compliance_automation_level: formData.complianceAutomationLevel || 'manual',
      whitelist_enabled: formData.whitelistEnabled || false,
      investor_whitelist_enabled: formData.investorWhitelistEnabled || false,
      holding_period: formData.holdingPeriod,
      max_investor_count: formData.maxInvestorCount,
      is_issuable: formData.isIssuable || false,
      granular_control: formData.granularControl || false,
      dividend_distribution: formData.dividendDistribution || false,
      corporate_actions: formData.corporateActions || false,
      issuance_modules: formData.issuanceModules || false,
      document_management: formData.documentManagement || false,
      is_multi_class: formData.isMultiClass || false,
      tranche_transferability: formData.trancheTransferability || false,
      use_geographic_restrictions: formData.useGeographicRestrictions || false,
      default_restriction_policy: formData.defaultRestrictionPolicy || 'deny',
      institutional_grade: formData.institutionalGrade || false,
      custody_integration_enabled: formData.custodyIntegrationEnabled || false,
      prime_brokerage_support: formData.primeBrokerageSupport || false,
      settlement_integration: formData.settlementIntegration,
      clearing_house_integration: formData.clearingHouseIntegration || false,
      central_securities_depository_integration: formData.centralSecuritiesDepositoryIntegration || false,
      third_party_custody_addresses: formData.thirdPartyCustodyAddresses,
      institutional_wallet_support: formData.institutionalWalletSupport || false,
      real_time_compliance_monitoring: formData.realTimeComplianceMonitoring || false,
      automated_sanctions_screening: formData.automatedSanctionsScreening || false,
      pep_screening_enabled: formData.pepScreeningEnabled || false,
      aml_monitoring_enabled: formData.amlMonitoringEnabled || false,
      suspicious_activity_reporting: formData.suspiciousActivityReporting || false,
      compliance_officer_notifications: formData.complianceOfficerNotifications || false,
      regulatory_reporting_automation: formData.regulatoryReportingAutomation || false,
      advanced_corporate_actions: formData.advancedCorporateActions || false,
      stock_splits_enabled: formData.stockSplitsEnabled || false,
      stock_dividends_enabled: formData.stockDividendsEnabled || false,
      rights_offerings_enabled: formData.rightsOfferingsEnabled || false,
      spin_offs_enabled: formData.spinOffsEnabled || false,
      mergers_acquisitions_support: formData.mergersAcquisitionsSupport || false,
      treasury_management_enabled: formData.treasuryManagementEnabled || false,
      buyback_programs_enabled: formData.buybackProgramsEnabled || false,
      share_repurchase_automation: formData.shareRepurchaseAutomation || false,
      advanced_governance_enabled: formData.advancedGovernanceEnabled || false,
      proxy_voting_enabled: formData.proxyVotingEnabled || false,
      cumulative_voting_enabled: formData.cumulativeVotingEnabled || false,
      weighted_voting_by_class: formData.weightedVotingByClass || false,
      voting_delegation_enabled: formData.votingDelegationEnabled || false,
      institutional_voting_services: formData.institutionalVotingServices || false,
      board_election_support: formData.boardElectionSupport || false,
      cross_border_trading_enabled: formData.crossBorderTradingEnabled || false,
      multi_jurisdiction_compliance: formData.multiJurisdictionCompliance || false,
      passport_regime_support: formData.passportRegimeSupport || false,
      treaty_benefits_enabled: formData.treatyBenefitsEnabled || false,
      withholding_tax_automation: formData.withholdingTaxAutomation || false,
      currency_hedging_enabled: formData.currencyHedgingEnabled || false,
      enhanced_reporting_enabled: formData.enhancedReportingEnabled || false,
      real_time_shareholder_registry: formData.realTimeShareholderRegistry || false,
      beneficial_ownership_tracking: formData.beneficialOwnershipTracking || false,
      position_reconciliation_enabled: formData.positionReconciliationEnabled || false,
      regulatory_filing_automation: formData.regulatoryFilingAutomation || false,
      audit_trail_comprehensive: formData.auditTrailComprehensive || false,
      performance_analytics_enabled: formData.performanceAnalyticsEnabled || false,
      esg_reporting_enabled: formData.esgReportingEnabled || false,
      traditional_finance_integration: formData.traditionalFinanceIntegration || false,
      swift_integration_enabled: formData.swiftIntegrationEnabled || false,
      iso20022_messaging_support: formData.iso20022MessagingSupport || false,
      financial_data_vendor_integration: formData.financialDataVendorIntegration || false,
      market_data_feeds_enabled: formData.marketDataFeedsEnabled || false,
      cross_chain_bridge_support: formData.crossChainBridgeSupport || false,
      layer2_scaling_support: formData.layer2ScalingSupport || false,
      advanced_risk_management: formData.advancedRiskManagement || false,
      position_limits_enabled: formData.positionLimitsEnabled || false,
      stress_testing_enabled: formData.stressTestingEnabled || false,
      margin_requirements_dynamic: formData.marginRequirementsDynamic || false,
      collateral_management_enabled: formData.collateralManagementEnabled || false,
      insurance_coverage_enabled: formData.insuranceCoverageEnabled || false,
      disaster_recovery_enabled: formData.disasterRecoveryEnabled || false,
      transfer_restrictions: this.prepareJsonbField(formData.transferRestrictions),
      kyc_settings: this.prepareJsonbField(formData.kycSettings),
      compliance_settings: this.prepareJsonbField(formData.complianceSettings),
      custom_features: this.prepareJsonbField(formData.customFeatures),
      geographic_restrictions: this.prepareJsonbField(formData.geographicRestrictions),
      whitelist_config: this.prepareJsonbField(formData.whitelistConfig),
      jurisdiction_restrictions: this.prepareJsonbField(formData.jurisdictionRestrictions),
      investor_limits: this.prepareJsonbField(formData.investorLimits),
      transaction_monitoring_rules: this.prepareJsonbField(formData.transactionMonitoringRules),
      quorum_requirements: this.prepareJsonbField(formData.quorumRequirements),
      concentration_limits: this.prepareJsonbField(formData.concentrationLimits),
      foreign_ownership_restrictions: this.prepareJsonbField(formData.foreignOwnershipRestrictions),
      regulatory_equivalence_mapping: this.prepareJsonbField(formData.regulatoryEquivalenceMapping),
      price_discovery_mechanisms: this.prepareJsonbField(formData.priceDiscoveryMechanisms),
    }) as TokenERC1400PropertiesDB;
  }

  toForm(domainObject: TokenERC1400Properties): ERC1400FormData {
    return {
      initialSupply: domainObject.initialSupply,
      cap: domainObject.cap,
      isMintable: domainObject.isMintable,
      isBurnable: domainObject.isBurnable,
      isPausable: domainObject.isPausable,
      decimals: domainObject.decimals,
      documentUri: domainObject.documentUri,
      documentHash: domainObject.documentHash,
      tokenDetails: domainObject.tokenDetails,
      legalTerms: domainObject.legalTerms,
      prospectus: domainObject.prospectus,
      securityType: domainObject.securityType,
      regulationType: domainObject.regulationType,
      issuingJurisdiction: domainObject.issuingJurisdiction,
      issuingEntityName: domainObject.issuingEntityName,
      issuingEntityLei: domainObject.issuingEntityLei,
      controllerAddress: domainObject.controllerAddress,
      forcedTransfers: domainObject.forcedTransfers,
      forcedRedemptionEnabled: domainObject.forcedRedemptionEnabled,
      recoveryMechanism: domainObject.recoveryMechanism,
      requireKyc: domainObject.requireKyc,
      enforceKyc: domainObject.enforceKyc,
      investorAccreditation: domainObject.investorAccreditation,
      accreditedInvestorOnly: domainObject.accreditedInvestorOnly,
      autoCompliance: domainObject.autoCompliance,
      manualApprovals: domainObject.manualApprovals,
      complianceModule: domainObject.complianceModule,
      complianceAutomationLevel: domainObject.complianceAutomationLevel,
      whitelistEnabled: domainObject.whitelistEnabled,
      investorWhitelistEnabled: domainObject.investorWhitelistEnabled,
      holdingPeriod: domainObject.holdingPeriod,
      maxInvestorCount: domainObject.maxInvestorCount,
      isIssuable: domainObject.isIssuable,
      granularControl: domainObject.granularControl,
      dividendDistribution: domainObject.dividendDistribution,
      corporateActions: domainObject.corporateActions,
      issuanceModules: domainObject.issuanceModules,
      documentManagement: domainObject.documentManagement,
      isMultiClass: domainObject.isMultiClass,
      trancheTransferability: domainObject.trancheTransferability,
      useGeographicRestrictions: domainObject.useGeographicRestrictions,
      defaultRestrictionPolicy: domainObject.defaultRestrictionPolicy,
      institutionalGrade: domainObject.institutionalGrade,
      custodyIntegrationEnabled: domainObject.custodyIntegrationEnabled,
      primeBrokerageSupport: domainObject.primeBrokerageSupport,
      settlementIntegration: domainObject.settlementIntegration,
      clearingHouseIntegration: domainObject.clearingHouseIntegration,
      centralSecuritiesDepositoryIntegration: domainObject.centralSecuritiesDepositoryIntegration,
      thirdPartyCustodyAddresses: domainObject.thirdPartyCustodyAddresses,
      institutionalWalletSupport: domainObject.institutionalWalletSupport,
      realTimeComplianceMonitoring: domainObject.realTimeComplianceMonitoring,
      automatedSanctionsScreening: domainObject.automatedSanctionsScreening,
      pepScreeningEnabled: domainObject.pepScreeningEnabled,
      amlMonitoringEnabled: domainObject.amlMonitoringEnabled,
      suspiciousActivityReporting: domainObject.suspiciousActivityReporting,
      complianceOfficerNotifications: domainObject.complianceOfficerNotifications,
      regulatoryReportingAutomation: domainObject.regulatoryReportingAutomation,
      advancedCorporateActions: domainObject.advancedCorporateActions,
      stockSplitsEnabled: domainObject.stockSplitsEnabled,
      stockDividendsEnabled: domainObject.stockDividendsEnabled,
      rightsOfferingsEnabled: domainObject.rightsOfferingsEnabled,
      spinOffsEnabled: domainObject.spinOffsEnabled,
      mergersAcquisitionsSupport: domainObject.mergersAcquisitionsSupport,
      treasuryManagementEnabled: domainObject.treasuryManagementEnabled,
      buybackProgramsEnabled: domainObject.buybackProgramsEnabled,
      shareRepurchaseAutomation: domainObject.shareRepurchaseAutomation,
      advancedGovernanceEnabled: domainObject.advancedGovernanceEnabled,
      proxyVotingEnabled: domainObject.proxyVotingEnabled,
      cumulativeVotingEnabled: domainObject.cumulativeVotingEnabled,
      weightedVotingByClass: domainObject.weightedVotingByClass,
      votingDelegationEnabled: domainObject.votingDelegationEnabled,
      institutionalVotingServices: domainObject.institutionalVotingServices,
      boardElectionSupport: domainObject.boardElectionSupport,
      crossBorderTradingEnabled: domainObject.crossBorderTradingEnabled,
      multiJurisdictionCompliance: domainObject.multiJurisdictionCompliance,
      passportRegimeSupport: domainObject.passportRegimeSupport,
      treatyBenefitsEnabled: domainObject.treatyBenefitsEnabled,
      withholdingTaxAutomation: domainObject.withholdingTaxAutomation,
      currencyHedgingEnabled: domainObject.currencyHedgingEnabled,
      enhancedReportingEnabled: domainObject.enhancedReportingEnabled,
      realTimeShareholderRegistry: domainObject.realTimeShareholderRegistry,
      beneficialOwnershipTracking: domainObject.beneficialOwnershipTracking,
      positionReconciliationEnabled: domainObject.positionReconciliationEnabled,
      regulatoryFilingAutomation: domainObject.regulatoryFilingAutomation,
      auditTrailComprehensive: domainObject.auditTrailComprehensive,
      performanceAnalyticsEnabled: domainObject.performanceAnalyticsEnabled,
      esgReportingEnabled: domainObject.esgReportingEnabled,
      traditionalFinanceIntegration: domainObject.traditionalFinanceIntegration,
      swiftIntegrationEnabled: domainObject.swiftIntegrationEnabled,
      iso20022MessagingSupport: domainObject.iso20022MessagingSupport,
      financialDataVendorIntegration: domainObject.financialDataVendorIntegration,
      marketDataFeedsEnabled: domainObject.marketDataFeedsEnabled,
      crossChainBridgeSupport: domainObject.crossChainBridgeSupport,
      layer2ScalingSupport: domainObject.layer2ScalingSupport,
      advancedRiskManagement: domainObject.advancedRiskManagement,
      positionLimitsEnabled: domainObject.positionLimitsEnabled,
      stressTestingEnabled: domainObject.stressTestingEnabled,
      marginRequirementsDynamic: domainObject.marginRequirementsDynamic,
      collateralManagementEnabled: domainObject.collateralManagementEnabled,
      insuranceCoverageEnabled: domainObject.insuranceCoverageEnabled,
      disasterRecoveryEnabled: domainObject.disasterRecoveryEnabled,
      transferRestrictions: domainObject.transferRestrictions,
      kycSettings: domainObject.kycSettings,
      complianceSettings: domainObject.complianceSettings,
      customFeatures: domainObject.customFeatures,
      geographicRestrictions: domainObject.geographicRestrictions,
      whitelistConfig: domainObject.whitelistConfig,
      jurisdictionRestrictions: domainObject.jurisdictionRestrictions,
      investorLimits: domainObject.investorLimits,
      transactionMonitoringRules: domainObject.transactionMonitoringRules,
      quorumRequirements: domainObject.quorumRequirements,
      concentrationLimits: domainObject.concentrationLimits,
      foreignOwnershipRestrictions: domainObject.foreignOwnershipRestrictions,
      regulatoryEquivalenceMapping: domainObject.regulatoryEquivalenceMapping,
      priceDiscoveryMechanisms: domainObject.priceDiscoveryMechanisms,
    };
  }

  /**
   * Map KYC Settings
   */
  private mapKycSettings(data: any): KycSettings | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        enabled: Boolean(config.enabled),
        requiredLevel: config.requiredLevel || 'basic',
        autoVerification: Boolean(config.autoVerification),
        documentsRequired: Array.isArray(config.documentsRequired) ? config.documentsRequired : [],
        expirationPeriod: Number(config.expirationPeriod) || 365,
      };
    } catch {
      return null;
    }
  }

  /**
   * Map Compliance Settings
   */
  private mapComplianceSettings(data: any): ComplianceSettings | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        automationLevel: config.automationLevel || 'manual',
        ruleEngine: config.ruleEngine || 'internal',
        externalProviders: Array.isArray(config.externalProviders) ? config.externalProviders : [],
        monitoringEnabled: Boolean(config.monitoringEnabled),
        alertThresholds: config.alertThresholds || {},
      };
    } catch {
      return null;
    }
  }

  /**
   * Map Custom Features
   */
  private mapCustomFeatures(data: any): CustomFeatures | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        advancedReporting: Boolean(config.advancedReporting),
        institutionalGrade: Boolean(config.institutionalGrade),
        multiJurisdiction: Boolean(config.multiJurisdiction),
        enterpriseFeatures: Boolean(config.enterpriseFeatures),
        customIntegrations: Array.isArray(config.customIntegrations) ? config.customIntegrations : [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Map Geographic Restrictions
   */
  private mapGeographicRestrictions(data: any): GeographicRestrictions | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        restrictedCountries: Array.isArray(config.restrictedCountries) ? config.restrictedCountries : [],
        allowedCountries: Array.isArray(config.allowedCountries) ? config.allowedCountries : undefined,
        treatyBenefits: Boolean(config.treatyBenefits),
        passportRegime: Boolean(config.passportRegime),
        taxOptimization: Boolean(config.taxOptimization),
      };
    } catch {
      return null;
    }
  }

  /**
   * Map Jurisdiction Restrictions
   */
  private mapJurisdictionRestrictions(data: any): JurisdictionRestriction[] {
    if (!data) return [];
    
    try {
      const restrictions = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(restrictions) ? restrictions.map(restriction => ({
        jurisdiction: restriction.jurisdiction || '',
        allowed: Boolean(restriction.allowed),
        requiredDocuments: Array.isArray(restriction.requiredDocuments) ? restriction.requiredDocuments : [],
        additionalCompliance: Array.isArray(restriction.additionalCompliance) ? restriction.additionalCompliance : [],
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Investor Limits
   */
  private mapInvestorLimits(data: any): InvestorLimits | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        maxInvestors: Number(config.maxInvestors),
        accreditedOnly: Boolean(config.accreditedOnly),
        institutionalMinimum: config.institutionalMinimum,
        geographicRestrictions: Array.isArray(config.geographicRestrictions) ? config.geographicRestrictions : [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Map Transaction Monitoring Rules
   */
  private mapTransactionMonitoringRules(data: any): TransactionMonitoringRule[] {
    if (!data) return [];
    
    try {
      const rules = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(rules) ? rules.map(rule => ({
        id: rule.id || crypto.randomUUID(),
        name: rule.name || '',
        ruleType: rule.ruleType || 'amount_threshold',
        threshold: rule.threshold,
        timeframe: Number(rule.timeframe),
        action: rule.action || 'flag',
        enabled: Boolean(rule.enabled),
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Quorum Requirements
   */
  private mapQuorumRequirements(data: any): QuorumRequirement[] {
    if (!data) return [];
    
    try {
      const requirements = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(requirements) ? requirements.map(req => ({
        proposalType: req.proposalType || '',
        minimumQuorum: req.minimumQuorum || '50',
        votingPeriod: Number(req.votingPeriod) || 168,
        executionDelay: Number(req.executionDelay),
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Concentration Limits
   */
  private mapConcentrationLimits(data: any): ConcentrationLimit[] {
    if (!data) return [];
    
    try {
      const limits = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(limits) ? limits.map(limit => ({
        entityType: limit.entityType || 'individual',
        maxPercentage: limit.maxPercentage || '5',
        exemptions: Array.isArray(limit.exemptions) ? limit.exemptions : [],
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Foreign Ownership Restrictions
   */
  private mapForeignOwnershipRestrictions(data: any): ForeignOwnershipRestriction[] {
    if (!data) return [];
    
    try {
      const restrictions = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(restrictions) ? restrictions.map(restriction => ({
        jurisdiction: restriction.jurisdiction || '',
        maxPercentage: restriction.maxPercentage || '25',
        exemptions: Array.isArray(restriction.exemptions) ? restriction.exemptions : [],
        treatyBenefits: Boolean(restriction.treatyBenefits),
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Price Discovery Mechanisms
   */
  private mapPriceDiscoveryMechanisms(data: any): PriceDiscoveryMechanism[] {
    if (!data) return [];
    
    try {
      const mechanisms = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(mechanisms) ? mechanisms.map(mechanism => ({
        type: mechanism.type || 'fixed_price',
        parameters: mechanism.parameters || {},
        enabled: Boolean(mechanism.enabled),
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Advanced validation for ERC1400 properties
   */
  validate(data: ERC1400FormData): ValidationResult {
    const baseValidation = super.validate(data);
    if (!baseValidation.valid) return baseValidation;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate controller address
    if (data.controllerAddress && !/^0x[a-fA-F0-9]{40}$/.test(data.controllerAddress)) {
      errors.push('Invalid controller address format');
    }

    // Validate issuing entity LEI
    if (data.issuingEntityLei && !/^[A-Z0-9]{18}[0-9]{2}$/.test(data.issuingEntityLei)) {
      errors.push('Invalid LEI format (should be 20 characters)');
    }

    // Validate holding period
    if (data.holdingPeriod && data.holdingPeriod < 0) {
      errors.push('Holding period must be non-negative');
    }

    // Validate investor limits
    if (data.maxInvestorCount && data.maxInvestorCount <= 0) {
      errors.push('Maximum investor count must be positive');
    }

    // Validate custody addresses
    if (data.thirdPartyCustodyAddresses) {
      for (const address of data.thirdPartyCustodyAddresses) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
          errors.push(`Invalid custody address: ${address}`);
        }
      }
    }

    // Validate transaction monitoring rules
    if (data.transactionMonitoringRules) {
      for (const rule of data.transactionMonitoringRules) {
        if (!rule.name || rule.name.trim().length === 0) {
          errors.push('Transaction monitoring rule name cannot be empty');
        }
        if (rule.threshold && parseFloat(rule.threshold) < 0) {
          errors.push('Transaction monitoring threshold must be non-negative');
        }
      }
    }

    // Validate quorum requirements
    if (data.quorumRequirements) {
      for (const req of data.quorumRequirements) {
        const quorum = parseFloat(req.minimumQuorum);
        if (quorum < 0 || quorum > 100) {
          errors.push('Quorum percentage must be between 0 and 100');
        }
        if (req.votingPeriod <= 0) {
          errors.push('Voting period must be positive');
        }
      }
    }

    // Validate concentration limits
    if (data.concentrationLimits) {
      for (const limit of data.concentrationLimits) {
        const percentage = parseFloat(limit.maxPercentage);
        if (percentage < 0 || percentage > 100) {
          errors.push('Concentration limit percentage must be between 0 and 100');
        }
      }
    }

    // Business logic warnings
    if (data.requireKyc && !data.enforceKyc) {
      warnings.push('KYC is required but not enforced - consider enabling enforcement');
    }

    if (data.accreditedInvestorOnly && !data.investorAccreditation) {
      warnings.push('Accredited investor only enabled but investor accreditation not required');
    }

    if (data.forcedTransfers && !data.controllerAddress) {
      warnings.push('Forced transfers enabled but no controller address specified');
    }

    if (data.institutionalGrade && !data.custodyIntegrationEnabled) {
      warnings.push('Institutional grade token without custody integration');
    }

    if (data.crossBorderTradingEnabled && !data.multiJurisdictionCompliance) {
      warnings.push('Cross-border trading enabled without multi-jurisdiction compliance');
    }

    if (data.realTimeComplianceMonitoring && !data.automatedSanctionsScreening) {
      warnings.push('Real-time compliance monitoring without sanctions screening');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate a new UUID for the property record
   */
  private generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Create default ERC1400 properties
   */
  static createDefaults(tokenId: string): ERC1400FormData {
    return {
      isMintable: false,
      isBurnable: false,
      isPausable: false,
      decimals: 18,
      securityType: 'equity',
      regulationType: 'reg-d',
      forcedTransfers: false,
      forcedRedemptionEnabled: false,
      recoveryMechanism: false,
      requireKyc: true,
      enforceKyc: true,
      investorAccreditation: true,
      accreditedInvestorOnly: false,
      autoCompliance: false,
      manualApprovals: true,
      complianceAutomationLevel: 'manual',
      whitelistEnabled: true,
      investorWhitelistEnabled: true,
      isIssuable: false,
      granularControl: true,
      dividendDistribution: false,
      corporateActions: false,
      issuanceModules: false,
      documentManagement: true,
      isMultiClass: false,
      trancheTransferability: false,
      useGeographicRestrictions: true,
      defaultRestrictionPolicy: 'deny',
      institutionalGrade: false,
      custodyIntegrationEnabled: false,
      primeBrokerageSupport: false,
      clearingHouseIntegration: false,
      centralSecuritiesDepositoryIntegration: false,
      institutionalWalletSupport: false,
      realTimeComplianceMonitoring: false,
      automatedSanctionsScreening: false,
      pepScreeningEnabled: false,
      amlMonitoringEnabled: false,
      suspiciousActivityReporting: false,
      complianceOfficerNotifications: false,
      regulatoryReportingAutomation: false,
      advancedCorporateActions: false,
      stockSplitsEnabled: false,
      stockDividendsEnabled: false,
      rightsOfferingsEnabled: false,
      spinOffsEnabled: false,
      mergersAcquisitionsSupport: false,
      treasuryManagementEnabled: false,
      buybackProgramsEnabled: false,
      shareRepurchaseAutomation: false,
      advancedGovernanceEnabled: false,
      proxyVotingEnabled: false,
      cumulativeVotingEnabled: false,
      weightedVotingByClass: false,
      votingDelegationEnabled: false,
      institutionalVotingServices: false,
      boardElectionSupport: false,
      crossBorderTradingEnabled: false,
      multiJurisdictionCompliance: false,
      passportRegimeSupport: false,
      treatyBenefitsEnabled: false,
      withholdingTaxAutomation: false,
      currencyHedgingEnabled: false,
      enhancedReportingEnabled: false,
      realTimeShareholderRegistry: false,
      beneficialOwnershipTracking: false,
      positionReconciliationEnabled: false,
      regulatoryFilingAutomation: false,
      auditTrailComprehensive: true,
      performanceAnalyticsEnabled: false,
      esgReportingEnabled: false,
      traditionalFinanceIntegration: false,
      swiftIntegrationEnabled: false,
      iso20022MessagingSupport: false,
      financialDataVendorIntegration: false,
      marketDataFeedsEnabled: false,
      crossChainBridgeSupport: false,
      layer2ScalingSupport: false,
      advancedRiskManagement: false,
      positionLimitsEnabled: false,
      stressTestingEnabled: false,
      marginRequirementsDynamic: false,
      collateralManagementEnabled: false,
      insuranceCoverageEnabled: false,
      disasterRecoveryEnabled: false,
      transferRestrictions: JsonbConfigMapper.createDefaultTransferConfig(),
      whitelistConfig: JsonbConfigMapper.createDefaultWhitelistConfig(),
      kycSettings: {
        enabled: true,
        requiredLevel: 'enhanced',
        autoVerification: false,
        documentsRequired: ['passport', 'proof_of_address', 'financial_statement'],
        expirationPeriod: 365,
      },
      complianceSettings: {
        automationLevel: 'manual',
        ruleEngine: 'internal',
        externalProviders: [],
        monitoringEnabled: false,
        alertThresholds: {},
      },
    };
  }
}
