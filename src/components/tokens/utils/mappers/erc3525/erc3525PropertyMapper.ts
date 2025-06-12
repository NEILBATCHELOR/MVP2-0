/**
 * ERC3525 Property Mapper
 * Comprehensive implementation for ERC3525 semi-fungible token properties mapping
 */

import { BaseMapper, ValidationResult } from '../shared/baseMapper';
import { PropertyTableMapper } from '../database/schemaMapper';
import { JsonbConfigMapper, TransferConfig, WhitelistConfig, ComplianceConfig } from '../config/jsonbConfigMapper';

/**
 * Advanced JSONB configurations specific to ERC3525
 */
export interface SlotConfiguration {
  slotId: string;
  name: string;
  description?: string;
  categoryType: 'financial_instrument' | 'real_estate' | 'intellectual_property' | 'commodity' | 'custom';
  valueDecimals: number;
  isTransferable: boolean;
  maxUnitsPerSlot?: string;
  minimumValue?: string;
  metadata?: Record<string, any>;
}

export interface FinancialInstrument {
  instrumentType: 'bond' | 'loan' | 'derivative' | 'structured_product' | 'insurance' | 'other';
  issuanceDate: string;
  maturityDate?: string;
  principal?: string;
  interestRate?: string;
  paymentFrequency?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  creditRating?: string;
  underwriter?: string;
  cusip?: string;
  isin?: string;
  bloomberg?: string;
  terms?: Record<string, any>;
}

export interface DerivativeTerms {
  underlyingAsset: string;
  contractType: 'option' | 'future' | 'swap' | 'forward' | 'cfd';
  strikePrice?: string;
  expirationDate?: string;
  exerciseStyle?: 'american' | 'european' | 'bermudan';
  settlementType?: 'cash' | 'physical';
  notionalAmount?: string;
  marginRequirement?: string;
  markToMarket?: boolean;
}

export interface ValueAllocation {
  allocationId: string;
  slotId: string;
  holderAddress: string;
  allocatedValue: string;
  lockedUntil?: string;
  restrictions?: string[];
  metadata?: Record<string, any>;
}

export interface PaymentSchedule {
  scheduleId: string;
  paymentType: 'interest' | 'principal' | 'dividend' | 'coupon' | 'fee';
  amount: string;
  dueDate: string;
  frequency?: 'one_time' | 'recurring';
  recurringPeriod?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  recipients: Array<{
    slotId: string;
    percentage: string;
  }>;
  status: 'pending' | 'processed' | 'overdue' | 'cancelled';
}

export interface ValueAdjustment {
  adjustmentId: string;
  adjustmentType: 'revaluation' | 'impairment' | 'appreciation' | 'accrual' | 'amortization';
  amount: string;
  reason: string;
  effectiveDate: string;
  affectedSlots: string[];
  approvedBy?: string;
  auditTrail?: Record<string, any>;
}

export interface SlotApproval {
  approvalId: string;
  fromSlot: string;
  toSlot: string;
  maxValue: string;
  expiryDate?: string;
  conditions?: string[];
  autoRenew?: boolean;
}

export interface RealEstateProperty {
  propertyId: string;
  propertyType: 'residential' | 'commercial' | 'industrial' | 'land' | 'mixed_use';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  legalDescription?: string;
  areaSize?: string;
  yearBuilt?: number;
  appraisedValue?: string;
  lastAppraisalDate?: string;
  rentRoll?: Array<{
    unitId: string;
    monthlyRent: string;
    leaseEndDate: string;
    tenantType: string;
  }>;
}

export interface IntellectualProperty {
  ipType: 'patent' | 'trademark' | 'copyright' | 'trade_secret' | 'domain';
  registrationNumber?: string;
  applicationDate?: string;
  registrationDate?: string;
  expirationDate?: string;
  jurisdiction: string;
  description: string;
  assignee?: string;
  inventors?: string[];
  licenseAgreements?: Array<{
    licenseeId: string;
    royaltyRate: string;
    territory: string;
    exclusivity: 'exclusive' | 'non_exclusive';
  }>;
}

export interface CommodityDetails {
  commodityType: 'precious_metals' | 'energy' | 'agriculture' | 'industrial_metals' | 'carbon_credits';
  grade?: string;
  quantity?: string;
  unit?: string;
  storageLocation?: string;
  certificateNumber?: string;
  assayReport?: string;
  deliveryTerms?: string;
  qualitySpecs?: Record<string, any>;
}

/**
 * Database schema for ERC3525 properties
 */
export interface TokenERC3525PropertiesDB {
  id: string;
  token_id: string;
  decimals?: number;
  initial_supply?: string;
  is_mintable?: boolean;
  is_burnable?: boolean;
  is_pausable?: boolean;
  is_transferable?: boolean;
  slot_transferable?: boolean;
  value_transferable?: boolean;
  approval_enabled?: boolean;
  operator_enabled?: boolean;
  slot_configurations?: any; // JSONB
  financial_instruments?: any; // JSONB
  derivative_terms?: any; // JSONB
  value_allocations?: any; // JSONB
  payment_schedules?: any; // JSONB
  value_adjustments?: any; // JSONB
  slot_approvals?: any; // JSONB
  real_estate_properties?: any; // JSONB
  intellectual_properties?: any; // JSONB
  commodity_details?: any; // JSONB
  transfer_restrictions?: any; // JSONB
  compliance_config?: any; // JSONB
  whitelist_config?: any; // JSONB
  metadata_uri?: string;
  base_uri?: string;
  contract_uri?: string;
  royalty_enabled?: boolean;
  royalty_percentage?: string;
  royalty_recipient?: string;
  opensea_compatible?: boolean;
  enumerable_enabled?: boolean;
  admin_controls?: boolean;
  upgrade_enabled?: boolean;
  proxy_registry?: string;
  market_enabled?: boolean;
  auction_enabled?: boolean;
  fractional_enabled?: boolean;
  bundle_enabled?: boolean;
  batch_enabled?: boolean;
  governance_enabled?: boolean;
  staking_enabled?: boolean;
  farming_enabled?: boolean;
  insurance_enabled?: boolean;
  oracle_enabled?: boolean;
  chainlink_feeds?: any; // JSONB
  price_discovery?: any; // JSONB
  liquidity_pools?: any; // JSONB
  yield_farming?: any; // JSONB
  cross_chain_enabled?: boolean;
  bridge_contracts?: any; // JSONB
  layer2_optimized?: boolean;
  gas_optimization?: any; // JSONB
  created_at?: string;
  updated_at?: string;
}

/**
 * Domain model for ERC3525 properties
 */
export interface TokenERC3525Properties {
  id: string;
  tokenId: string;
  decimals?: number;
  initialSupply?: string;
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  isTransferable?: boolean;
  slotTransferable?: boolean;
  valueTransferable?: boolean;
  approvalEnabled?: boolean;
  operatorEnabled?: boolean;
  slotConfigurations?: SlotConfiguration[];
  financialInstruments?: FinancialInstrument[];
  derivativeTerms?: DerivativeTerms[];
  valueAllocations?: ValueAllocation[];
  paymentSchedules?: PaymentSchedule[];
  valueAdjustments?: ValueAdjustment[];
  slotApprovals?: SlotApproval[];
  realEstateProperties?: RealEstateProperty[];
  intellectualProperties?: IntellectualProperty[];
  commodityDetails?: CommodityDetails[];
  transferRestrictions?: TransferConfig;
  complianceConfig?: ComplianceConfig;
  whitelistConfig?: WhitelistConfig;
  metadataUri?: string;
  baseUri?: string;
  contractUri?: string;
  royaltyEnabled?: boolean;
  royaltyPercentage?: string;
  royaltyRecipient?: string;
  openseaCompatible?: boolean;
  enumerableEnabled?: boolean;
  adminControls?: boolean;
  upgradeEnabled?: boolean;
  proxyRegistry?: string;
  marketEnabled?: boolean;
  auctionEnabled?: boolean;
  fractionalEnabled?: boolean;
  bundleEnabled?: boolean;
  batchEnabled?: boolean;
  governanceEnabled?: boolean;
  stakingEnabled?: boolean;
  farmingEnabled?: boolean;
  insuranceEnabled?: boolean;
  oracleEnabled?: boolean;
  chainlinkFeeds?: Record<string, any>;
  priceDiscovery?: Record<string, any>;
  liquidityPools?: Record<string, any>;
  yieldFarming?: Record<string, any>;
  crossChainEnabled?: boolean;
  bridgeContracts?: Record<string, any>;
  layer2Optimized?: boolean;
  gasOptimization?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Form data interface for ERC3525
 */
export interface ERC3525FormData {
  // System fields
  id?: string;
  tokenId?: string;

  // Basic token properties
  decimals?: number;
  initialSupply?: string;
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;

  // Transfer capabilities
  isTransferable?: boolean;
  slotTransferable?: boolean;
  valueTransferable?: boolean;
  approvalEnabled?: boolean;
  operatorEnabled?: boolean;

  // Metadata
  metadataUri?: string;
  baseUri?: string;
  contractUri?: string;

  // Royalties
  royaltyEnabled?: boolean;
  royaltyPercentage?: string;
  royaltyRecipient?: string;

  // Marketplace features
  openseaCompatible?: boolean;
  marketEnabled?: boolean;
  auctionEnabled?: boolean;
  fractionalEnabled?: boolean;
  bundleEnabled?: boolean;

  // Advanced features
  enumerableEnabled?: boolean;
  adminControls?: boolean;
  upgradeEnabled?: boolean;
  proxyRegistry?: string;
  batchEnabled?: boolean;

  // DeFi features
  governanceEnabled?: boolean;
  stakingEnabled?: boolean;
  farmingEnabled?: boolean;
  insuranceEnabled?: boolean;
  oracleEnabled?: boolean;

  // Cross-chain features
  crossChainEnabled?: boolean;
  layer2Optimized?: boolean;

  // JSONB configurations
  slotConfigurations?: SlotConfiguration[];
  financialInstruments?: FinancialInstrument[];
  derivativeTerms?: DerivativeTerms[];
  valueAllocations?: ValueAllocation[];
  paymentSchedules?: PaymentSchedule[];
  valueAdjustments?: ValueAdjustment[];
  slotApprovals?: SlotApproval[];
  realEstateProperties?: RealEstateProperty[];
  intellectualProperties?: IntellectualProperty[];
  commodityDetails?: CommodityDetails[];
  transferRestrictions?: TransferConfig;
  complianceConfig?: ComplianceConfig;
  whitelistConfig?: WhitelistConfig;
  chainlinkFeeds?: Record<string, any>;
  priceDiscovery?: Record<string, any>;
  liquidityPools?: Record<string, any>;
  yieldFarming?: Record<string, any>;
  bridgeContracts?: Record<string, any>;
  gasOptimization?: Record<string, any>;
}

/**
 * ERC3525 Property Mapper
 */
export class ERC3525PropertyMapper extends PropertyTableMapper<TokenERC3525Properties, TokenERC3525PropertiesDB> {
  
  protected getTableName(): string {
    return 'token_erc3525_properties';
  }

  protected getRequiredFields(): string[] {
    return ['token_id'];
  }

  toDomain(dbRecord: TokenERC3525PropertiesDB): TokenERC3525Properties {
    return {
      id: dbRecord.id,
      tokenId: dbRecord.token_id,
      decimals: dbRecord.decimals,
      initialSupply: dbRecord.initial_supply,
      isMintable: dbRecord.is_mintable,
      isBurnable: dbRecord.is_burnable,
      isPausable: dbRecord.is_pausable,
      isTransferable: dbRecord.is_transferable,
      slotTransferable: dbRecord.slot_transferable,
      valueTransferable: dbRecord.value_transferable,
      approvalEnabled: dbRecord.approval_enabled,
      operatorEnabled: dbRecord.operator_enabled,
      slotConfigurations: this.mapSlotConfigurations(dbRecord.slot_configurations),
      financialInstruments: this.mapFinancialInstruments(dbRecord.financial_instruments),
      derivativeTerms: this.mapDerivativeTerms(dbRecord.derivative_terms),
      valueAllocations: this.mapValueAllocations(dbRecord.value_allocations),
      paymentSchedules: this.mapPaymentSchedules(dbRecord.payment_schedules),
      valueAdjustments: this.mapValueAdjustments(dbRecord.value_adjustments),
      slotApprovals: this.mapSlotApprovals(dbRecord.slot_approvals),
      realEstateProperties: this.mapRealEstateProperties(dbRecord.real_estate_properties),
      intellectualProperties: this.mapIntellectualProperties(dbRecord.intellectual_properties),
      commodityDetails: this.mapCommodityDetails(dbRecord.commodity_details),
      transferRestrictions: JsonbConfigMapper.mapTransferConfig(dbRecord.transfer_restrictions),
      complianceConfig: JsonbConfigMapper.mapComplianceConfig(dbRecord.compliance_config),
      whitelistConfig: JsonbConfigMapper.mapWhitelistConfig(dbRecord.whitelist_config),
      metadataUri: dbRecord.metadata_uri,
      baseUri: dbRecord.base_uri,
      contractUri: dbRecord.contract_uri,
      royaltyEnabled: dbRecord.royalty_enabled,
      royaltyPercentage: dbRecord.royalty_percentage,
      royaltyRecipient: dbRecord.royalty_recipient,
      openseaCompatible: dbRecord.opensea_compatible,
      enumerableEnabled: dbRecord.enumerable_enabled,
      adminControls: dbRecord.admin_controls,
      upgradeEnabled: dbRecord.upgrade_enabled,
      proxyRegistry: dbRecord.proxy_registry,
      marketEnabled: dbRecord.market_enabled,
      auctionEnabled: dbRecord.auction_enabled,
      fractionalEnabled: dbRecord.fractional_enabled,
      bundleEnabled: dbRecord.bundle_enabled,
      batchEnabled: dbRecord.batch_enabled,
      governanceEnabled: dbRecord.governance_enabled,
      stakingEnabled: dbRecord.staking_enabled,
      farmingEnabled: dbRecord.farming_enabled,
      insuranceEnabled: dbRecord.insurance_enabled,
      oracleEnabled: dbRecord.oracle_enabled,
      chainlinkFeeds: this.handleJsonbField(dbRecord.chainlink_feeds),
      priceDiscovery: this.handleJsonbField(dbRecord.price_discovery),
      liquidityPools: this.handleJsonbField(dbRecord.liquidity_pools),
      yieldFarming: this.handleJsonbField(dbRecord.yield_farming),
      crossChainEnabled: dbRecord.cross_chain_enabled,
      bridgeContracts: this.handleJsonbField(dbRecord.bridge_contracts),
      layer2Optimized: dbRecord.layer2_optimized,
      gasOptimization: this.handleJsonbField(dbRecord.gas_optimization),
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  toDatabase(domainObject: TokenERC3525Properties): TokenERC3525PropertiesDB {
    return this.cleanUndefined({
      id: domainObject.id,
      token_id: domainObject.tokenId,
      decimals: domainObject.decimals,
      initial_supply: domainObject.initialSupply,
      is_mintable: domainObject.isMintable,
      is_burnable: domainObject.isBurnable,
      is_pausable: domainObject.isPausable,
      is_transferable: domainObject.isTransferable,
      slot_transferable: domainObject.slotTransferable,
      value_transferable: domainObject.valueTransferable,
      approval_enabled: domainObject.approvalEnabled,
      operator_enabled: domainObject.operatorEnabled,
      slot_configurations: this.prepareJsonbField(domainObject.slotConfigurations),
      financial_instruments: this.prepareJsonbField(domainObject.financialInstruments),
      derivative_terms: this.prepareJsonbField(domainObject.derivativeTerms),
      value_allocations: this.prepareJsonbField(domainObject.valueAllocations),
      payment_schedules: this.prepareJsonbField(domainObject.paymentSchedules),
      value_adjustments: this.prepareJsonbField(domainObject.valueAdjustments),
      slot_approvals: this.prepareJsonbField(domainObject.slotApprovals),
      real_estate_properties: this.prepareJsonbField(domainObject.realEstateProperties),
      intellectual_properties: this.prepareJsonbField(domainObject.intellectualProperties),
      commodity_details: this.prepareJsonbField(domainObject.commodityDetails),
      transfer_restrictions: this.prepareJsonbField(domainObject.transferRestrictions),
      compliance_config: this.prepareJsonbField(domainObject.complianceConfig),
      whitelist_config: this.prepareJsonbField(domainObject.whitelistConfig),
      metadata_uri: domainObject.metadataUri,
      base_uri: domainObject.baseUri,
      contract_uri: domainObject.contractUri,
      royalty_enabled: domainObject.royaltyEnabled,
      royalty_percentage: domainObject.royaltyPercentage,
      royalty_recipient: domainObject.royaltyRecipient,
      opensea_compatible: domainObject.openseaCompatible,
      enumerable_enabled: domainObject.enumerableEnabled,
      admin_controls: domainObject.adminControls,
      upgrade_enabled: domainObject.upgradeEnabled,
      proxy_registry: domainObject.proxyRegistry,
      market_enabled: domainObject.marketEnabled,
      auction_enabled: domainObject.auctionEnabled,
      fractional_enabled: domainObject.fractionalEnabled,
      bundle_enabled: domainObject.bundleEnabled,
      batch_enabled: domainObject.batchEnabled,
      governance_enabled: domainObject.governanceEnabled,
      staking_enabled: domainObject.stakingEnabled,
      farming_enabled: domainObject.farmingEnabled,
      insurance_enabled: domainObject.insuranceEnabled,
      oracle_enabled: domainObject.oracleEnabled,
      chainlink_feeds: this.prepareJsonbField(domainObject.chainlinkFeeds),
      price_discovery: this.prepareJsonbField(domainObject.priceDiscovery),
      liquidity_pools: this.prepareJsonbField(domainObject.liquidityPools),
      yield_farming: this.prepareJsonbField(domainObject.yieldFarming),
      cross_chain_enabled: domainObject.crossChainEnabled,
      bridge_contracts: this.prepareJsonbField(domainObject.bridgeContracts),
      layer2_optimized: domainObject.layer2Optimized,
      gas_optimization: this.prepareJsonbField(domainObject.gasOptimization),
      created_at: domainObject.createdAt,
      updated_at: domainObject.updatedAt,
    }) as TokenERC3525PropertiesDB;
  }

  fromForm(formData: ERC3525FormData): TokenERC3525PropertiesDB {
    return this.cleanUndefined({
      id: formData.id || this.generateId(),
      token_id: formData.tokenId || '',
      decimals: formData.decimals || 18,
      initial_supply: formData.initialSupply,
      is_mintable: formData.isMintable || false,
      is_burnable: formData.isBurnable || false,
      is_pausable: formData.isPausable || false,
      is_transferable: formData.isTransferable !== false, // Default to true
      slot_transferable: formData.slotTransferable !== false, // Default to true
      value_transferable: formData.valueTransferable !== false, // Default to true
      approval_enabled: formData.approvalEnabled !== false, // Default to true
      operator_enabled: formData.operatorEnabled || false,
      metadata_uri: formData.metadataUri,
      base_uri: formData.baseUri,
      contract_uri: formData.contractUri,
      royalty_enabled: formData.royaltyEnabled || false,
      royalty_percentage: formData.royaltyPercentage,
      royalty_recipient: formData.royaltyRecipient,
      opensea_compatible: formData.openseaCompatible !== false, // Default to true
      enumerable_enabled: formData.enumerableEnabled || false,
      admin_controls: formData.adminControls || false,
      upgrade_enabled: formData.upgradeEnabled || false,
      proxy_registry: formData.proxyRegistry,
      market_enabled: formData.marketEnabled || false,
      auction_enabled: formData.auctionEnabled || false,
      fractional_enabled: formData.fractionalEnabled || false,
      bundle_enabled: formData.bundleEnabled || false,
      batch_enabled: formData.batchEnabled || false,
      governance_enabled: formData.governanceEnabled || false,
      staking_enabled: formData.stakingEnabled || false,
      farming_enabled: formData.farmingEnabled || false,
      insurance_enabled: formData.insuranceEnabled || false,
      oracle_enabled: formData.oracleEnabled || false,
      cross_chain_enabled: formData.crossChainEnabled || false,
      layer2_optimized: formData.layer2Optimized || false,
      slot_configurations: this.prepareJsonbField(formData.slotConfigurations),
      financial_instruments: this.prepareJsonbField(formData.financialInstruments),
      derivative_terms: this.prepareJsonbField(formData.derivativeTerms),
      value_allocations: this.prepareJsonbField(formData.valueAllocations),
      payment_schedules: this.prepareJsonbField(formData.paymentSchedules),
      value_adjustments: this.prepareJsonbField(formData.valueAdjustments),
      slot_approvals: this.prepareJsonbField(formData.slotApprovals),
      real_estate_properties: this.prepareJsonbField(formData.realEstateProperties),
      intellectual_properties: this.prepareJsonbField(formData.intellectualProperties),
      commodity_details: this.prepareJsonbField(formData.commodityDetails),
      transfer_restrictions: this.prepareJsonbField(formData.transferRestrictions),
      compliance_config: this.prepareJsonbField(formData.complianceConfig),
      whitelist_config: this.prepareJsonbField(formData.whitelistConfig),
      chainlink_feeds: this.prepareJsonbField(formData.chainlinkFeeds),
      price_discovery: this.prepareJsonbField(formData.priceDiscovery),
      liquidity_pools: this.prepareJsonbField(formData.liquidityPools),
      yield_farming: this.prepareJsonbField(formData.yieldFarming),
      bridge_contracts: this.prepareJsonbField(formData.bridgeContracts),
      gas_optimization: this.prepareJsonbField(formData.gasOptimization),
    }) as TokenERC3525PropertiesDB;
  }

  toForm(domainObject: TokenERC3525Properties): ERC3525FormData {
    return {
      decimals: domainObject.decimals,
      initialSupply: domainObject.initialSupply,
      isMintable: domainObject.isMintable,
      isBurnable: domainObject.isBurnable,
      isPausable: domainObject.isPausable,
      isTransferable: domainObject.isTransferable,
      slotTransferable: domainObject.slotTransferable,
      valueTransferable: domainObject.valueTransferable,
      approvalEnabled: domainObject.approvalEnabled,
      operatorEnabled: domainObject.operatorEnabled,
      metadataUri: domainObject.metadataUri,
      baseUri: domainObject.baseUri,
      contractUri: domainObject.contractUri,
      royaltyEnabled: domainObject.royaltyEnabled,
      royaltyPercentage: domainObject.royaltyPercentage,
      royaltyRecipient: domainObject.royaltyRecipient,
      openseaCompatible: domainObject.openseaCompatible,
      enumerableEnabled: domainObject.enumerableEnabled,
      adminControls: domainObject.adminControls,
      upgradeEnabled: domainObject.upgradeEnabled,
      proxyRegistry: domainObject.proxyRegistry,
      marketEnabled: domainObject.marketEnabled,
      auctionEnabled: domainObject.auctionEnabled,
      fractionalEnabled: domainObject.fractionalEnabled,
      bundleEnabled: domainObject.bundleEnabled,
      batchEnabled: domainObject.batchEnabled,
      governanceEnabled: domainObject.governanceEnabled,
      stakingEnabled: domainObject.stakingEnabled,
      farmingEnabled: domainObject.farmingEnabled,
      insuranceEnabled: domainObject.insuranceEnabled,
      oracleEnabled: domainObject.oracleEnabled,
      crossChainEnabled: domainObject.crossChainEnabled,
      layer2Optimized: domainObject.layer2Optimized,
      slotConfigurations: domainObject.slotConfigurations,
      financialInstruments: domainObject.financialInstruments,
      derivativeTerms: domainObject.derivativeTerms,
      valueAllocations: domainObject.valueAllocations,
      paymentSchedules: domainObject.paymentSchedules,
      valueAdjustments: domainObject.valueAdjustments,
      slotApprovals: domainObject.slotApprovals,
      realEstateProperties: domainObject.realEstateProperties,
      intellectualProperties: domainObject.intellectualProperties,
      commodityDetails: domainObject.commodityDetails,
      transferRestrictions: domainObject.transferRestrictions,
      complianceConfig: domainObject.complianceConfig,
      whitelistConfig: domainObject.whitelistConfig,
      chainlinkFeeds: domainObject.chainlinkFeeds,
      priceDiscovery: domainObject.priceDiscovery,
      liquidityPools: domainObject.liquidityPools,
      yieldFarming: domainObject.yieldFarming,
      bridgeContracts: domainObject.bridgeContracts,
      gasOptimization: domainObject.gasOptimization,
    };
  }

  /**
   * Map Slot Configurations
   */
  private mapSlotConfigurations(data: any): SlotConfiguration[] {
    if (!data) return [];
    
    try {
      const slots = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(slots) ? slots.map(slot => ({
        slotId: slot.slotId || crypto.randomUUID(),
        name: slot.name || '',
        description: slot.description,
        categoryType: slot.categoryType || 'custom',
        valueDecimals: Number(slot.valueDecimals) || 18,
        isTransferable: Boolean(slot.isTransferable),
        maxUnitsPerSlot: slot.maxUnitsPerSlot,
        minimumValue: slot.minimumValue,
        metadata: slot.metadata || {},
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Financial Instruments
   */
  private mapFinancialInstruments(data: any): FinancialInstrument[] {
    if (!data) return [];
    
    try {
      const instruments = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(instruments) ? instruments.map(instrument => ({
        instrumentType: instrument.instrumentType || 'other',
        issuanceDate: instrument.issuanceDate || new Date().toISOString(),
        maturityDate: instrument.maturityDate,
        principal: instrument.principal,
        interestRate: instrument.interestRate,
        paymentFrequency: instrument.paymentFrequency,
        creditRating: instrument.creditRating,
        underwriter: instrument.underwriter,
        cusip: instrument.cusip,
        isin: instrument.isin,
        bloomberg: instrument.bloomberg,
        terms: instrument.terms || {},
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Derivative Terms
   */
  private mapDerivativeTerms(data: any): DerivativeTerms[] {
    if (!data) return [];
    
    try {
      const terms = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(terms) ? terms.map(term => ({
        underlyingAsset: term.underlyingAsset || '',
        contractType: term.contractType || 'option',
        strikePrice: term.strikePrice,
        expirationDate: term.expirationDate,
        exerciseStyle: term.exerciseStyle,
        settlementType: term.settlementType,
        notionalAmount: term.notionalAmount,
        marginRequirement: term.marginRequirement,
        markToMarket: Boolean(term.markToMarket),
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Value Allocations
   */
  private mapValueAllocations(data: any): ValueAllocation[] {
    if (!data) return [];
    
    try {
      const allocations = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(allocations) ? allocations.map(allocation => ({
        allocationId: allocation.allocationId || crypto.randomUUID(),
        slotId: allocation.slotId || '',
        holderAddress: allocation.holderAddress || '',
        allocatedValue: allocation.allocatedValue || '0',
        lockedUntil: allocation.lockedUntil,
        restrictions: Array.isArray(allocation.restrictions) ? allocation.restrictions : [],
        metadata: allocation.metadata || {},
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Payment Schedules
   */
  private mapPaymentSchedules(data: any): PaymentSchedule[] {
    if (!data) return [];
    
    try {
      const schedules = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(schedules) ? schedules.map(schedule => ({
        scheduleId: schedule.scheduleId || crypto.randomUUID(),
        paymentType: schedule.paymentType || 'interest',
        amount: schedule.amount || '0',
        dueDate: schedule.dueDate || new Date().toISOString(),
        frequency: schedule.frequency,
        recurringPeriod: schedule.recurringPeriod,
        recipients: Array.isArray(schedule.recipients) ? schedule.recipients : [],
        status: schedule.status || 'pending',
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Value Adjustments
   */
  private mapValueAdjustments(data: any): ValueAdjustment[] {
    if (!data) return [];
    
    try {
      const adjustments = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(adjustments) ? adjustments.map(adjustment => ({
        adjustmentId: adjustment.adjustmentId || crypto.randomUUID(),
        adjustmentType: adjustment.adjustmentType || 'revaluation',
        amount: adjustment.amount || '0',
        reason: adjustment.reason || '',
        effectiveDate: adjustment.effectiveDate || new Date().toISOString(),
        affectedSlots: Array.isArray(adjustment.affectedSlots) ? adjustment.affectedSlots : [],
        approvedBy: adjustment.approvedBy,
        auditTrail: adjustment.auditTrail || {},
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Slot Approvals
   */
  private mapSlotApprovals(data: any): SlotApproval[] {
    if (!data) return [];
    
    try {
      const approvals = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(approvals) ? approvals.map(approval => ({
        approvalId: approval.approvalId || crypto.randomUUID(),
        fromSlot: approval.fromSlot || '',
        toSlot: approval.toSlot || '',
        maxValue: approval.maxValue || '0',
        expiryDate: approval.expiryDate,
        conditions: Array.isArray(approval.conditions) ? approval.conditions : [],
        autoRenew: Boolean(approval.autoRenew),
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Real Estate Properties
   */
  private mapRealEstateProperties(data: any): RealEstateProperty[] {
    if (!data) return [];
    
    try {
      const properties = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(properties) ? properties.map(property => ({
        propertyId: property.propertyId || crypto.randomUUID(),
        propertyType: property.propertyType || 'residential',
        address: property.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
        },
        legalDescription: property.legalDescription,
        areaSize: property.areaSize,
        yearBuilt: Number(property.yearBuilt),
        appraisedValue: property.appraisedValue,
        lastAppraisalDate: property.lastAppraisalDate,
        rentRoll: Array.isArray(property.rentRoll) ? property.rentRoll : [],
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Intellectual Properties
   */
  private mapIntellectualProperties(data: any): IntellectualProperty[] {
    if (!data) return [];
    
    try {
      const properties = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(properties) ? properties.map(property => ({
        ipType: property.ipType || 'patent',
        registrationNumber: property.registrationNumber,
        applicationDate: property.applicationDate,
        registrationDate: property.registrationDate,
        expirationDate: property.expirationDate,
        jurisdiction: property.jurisdiction || '',
        description: property.description || '',
        assignee: property.assignee,
        inventors: Array.isArray(property.inventors) ? property.inventors : [],
        licenseAgreements: Array.isArray(property.licenseAgreements) ? property.licenseAgreements : [],
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Commodity Details
   */
  private mapCommodityDetails(data: any): CommodityDetails[] {
    if (!data) return [];
    
    try {
      const commodities = typeof data === 'string' ? JSON.parse(data) : data;
      
      return Array.isArray(commodities) ? commodities.map(commodity => ({
        commodityType: commodity.commodityType || 'precious_metals',
        grade: commodity.grade,
        quantity: commodity.quantity,
        unit: commodity.unit,
        storageLocation: commodity.storageLocation,
        certificateNumber: commodity.certificateNumber,
        assayReport: commodity.assayReport,
        deliveryTerms: commodity.deliveryTerms,
        qualitySpecs: commodity.qualitySpecs || {},
      })) : [];
    } catch {
      return [];
    }
  }

  /**
   * Advanced validation for ERC3525 properties
   */
  validate(data: ERC3525FormData): ValidationResult {
    const baseValidation = super.validate(data);
    if (!baseValidation.valid) return baseValidation;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate decimals
    if (data.decimals && (data.decimals < 0 || data.decimals > 18)) {
      errors.push('Decimals must be between 0 and 18');
    }

    // Validate royalty settings
    if (data.royaltyEnabled) {
      if (!data.royaltyPercentage) {
        errors.push('Royalty percentage required when royalties are enabled');
      } else {
        const percentage = parseFloat(data.royaltyPercentage);
        if (percentage < 0 || percentage > 10) {
          errors.push('Royalty percentage must be between 0 and 10');
        }
      }

      if (!data.royaltyRecipient || !/^0x[a-fA-F0-9]{40}$/.test(data.royaltyRecipient)) {
        errors.push('Valid royalty recipient address required when royalties are enabled');
      }
    }

    // Validate slot configurations
    if (data.slotConfigurations) {
      for (const slot of data.slotConfigurations) {
        if (!slot.name || slot.name.trim().length === 0) {
          errors.push('Slot configuration name cannot be empty');
        }
        if (slot.valueDecimals < 0 || slot.valueDecimals > 18) {
          errors.push('Slot value decimals must be between 0 and 18');
        }
        if (slot.minimumValue && parseFloat(slot.minimumValue) < 0) {
          errors.push('Slot minimum value must be non-negative');
        }
      }
    }

    // Validate financial instruments
    if (data.financialInstruments) {
      for (const instrument of data.financialInstruments) {
        if (!instrument.issuanceDate) {
          errors.push('Financial instrument issuance date is required');
        }
        if (instrument.interestRate && parseFloat(instrument.interestRate) < 0) {
          errors.push('Interest rate must be non-negative');
        }
        if (instrument.principal && parseFloat(instrument.principal) <= 0) {
          errors.push('Principal amount must be positive');
        }
      }
    }

    // Validate value allocations
    if (data.valueAllocations) {
      for (const allocation of data.valueAllocations) {
        if (!allocation.holderAddress || !/^0x[a-fA-F0-9]{40}$/.test(allocation.holderAddress)) {
          errors.push('Valid holder address required for value allocation');
        }
        if (parseFloat(allocation.allocatedValue) <= 0) {
          errors.push('Allocated value must be positive');
        }
      }
    }

    // Business logic warnings
    if (data.marketEnabled && !data.openseaCompatible) {
      warnings.push('Market enabled but OpenSea compatibility disabled - may limit market reach');
    }

    if (data.fractionalEnabled && !data.governanceEnabled) {
      warnings.push('Fractional ownership enabled without governance - consider adding governance features');
    }

    if (data.crossChainEnabled && !data.layer2Optimized) {
      warnings.push('Cross-chain enabled without L2 optimization - may result in higher gas costs');
    }

    if (data.stakingEnabled && !data.oracleEnabled) {
      warnings.push('Staking enabled without oracle support - consider adding price feeds');
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
   * Create default ERC3525 properties
   */
  static createDefaults(tokenId: string): ERC3525FormData {
    return {
      decimals: 18,
      isMintable: false,
      isBurnable: false,
      isPausable: false,
      isTransferable: true,
      slotTransferable: true,
      valueTransferable: true,
      approvalEnabled: true,
      operatorEnabled: false,
      royaltyEnabled: false,
      openseaCompatible: true,
      enumerableEnabled: false,
      adminControls: false,
      upgradeEnabled: false,
      marketEnabled: false,
      auctionEnabled: false,
      fractionalEnabled: false,
      bundleEnabled: false,
      batchEnabled: false,
      governanceEnabled: false,
      stakingEnabled: false,
      farmingEnabled: false,
      insuranceEnabled: false,
      oracleEnabled: false,
      crossChainEnabled: false,
      layer2Optimized: false,
      slotConfigurations: [],
      financialInstruments: [],
      derivativeTerms: [],
      valueAllocations: [],
      paymentSchedules: [],
      valueAdjustments: [],
      slotApprovals: [],
      realEstateProperties: [],
      intellectualProperties: [],
      commodityDetails: [],
      transferRestrictions: JsonbConfigMapper.createDefaultTransferConfig(),
      whitelistConfig: JsonbConfigMapper.createDefaultWhitelistConfig(),
    };
  }
}
