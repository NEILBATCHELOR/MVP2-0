import { lazy } from 'react';
import { PolicyRule, BaseRule, validateRule } from '@/types/domain/policy/rules';

// Lazy-loaded rule components with comprehensive coverage
const RuleComponents = {
  // Transfer rules
  transfer_limit: lazy(() => import('@/components/rules/TransferLimitRule')),
  velocity_limit: lazy(() => import('@/components/rules/VelocityLimitRule')),
  whitelist_transfer: lazy(() => import('@/components/rules/WhitelistTransferRule')),
  
  // Compliance rules
  kyc_verification: lazy(() => import('@/components/rules/KYCVerificationRule')),
  aml_sanctions: lazy(() => import('@/components/rules/AMLSanctionsRule')),
  lock_up_period: lazy(() => import('@/components/rules/LockUpPeriodRule')),
  
  // Supply and volume rules
  volume_supply_limit: lazy(() => import('@/components/rules/VolumeSupplyLimitRule')),
  investor_position_limit: lazy(() => import('@/components/rules/InvestorPositionLimitRule')),
  investor_transaction_limit: lazy(() => import('@/components/rules/InvestorTransactionLimitRule')),
  
  // Risk and investor qualification rules
  risk_profile: lazy(() => import('@/components/rules/RiskProfileRule')),
  accredited_investor: lazy(() => import('@/components/rules/AccreditedInvestorRule')),
  
  // Fund-specific rules
  tokenized_fund: lazy(() => import('@/components/rules/TokenizedFundRule')),
  redemption: lazy(() => import('@/components/rules/RedemptionRule')),
  standard_redemption: lazy(() => import('@/components/rules/StandardRedemptionRule')),
  interval_fund_redemption: lazy(() => import('@/components/rules/IntervalFundRedemptionRule')),
};

// Type safety for the rule components map
type RuleComponentKeys = keyof typeof RuleComponents;

/**
 * Get a rule component by type
 * @param type Rule type
 * @returns The corresponding React component for the rule
 */
export function getRuleComponent(type: string) {
  console.log(`Attempting to load rule component for type: ${type}`);
  
  if (type in RuleComponents) {
    console.log(`Found component for rule type: ${type}`);
    return RuleComponents[type as RuleComponentKeys];
  }
  
  // Default fallback for unknown rule types
  console.warn(`No component found for rule type: ${type}, using default fallback`);
  return RuleComponents.transfer_limit;
}

/**
 * Create a new rule instance with default values
 * @param type Rule type
 * @returns A new rule instance with default values
 */
export function createEmptyRule(type: string): BaseRule {
  const ruleDefaults: Record<string, any> = {
    transfer_limit: {
      type: 'transfer_limit',
      transferAmount: 10000,
      currency: 'USD',
    },
    velocity_limit: {
      type: 'velocity_limit',
      maxAmount: 100000,
      timeFrame: 'daily',
      currency: 'USD',
      applicableTiers: [],
    },
    whitelist_transfer: {
      type: 'whitelist_transfer',
      addresses: [],
      allowOutbound: true,
      allowInbound: true,
    },
    kyc_verification: {
      type: 'kyc_verification',
      requiredLevel: 'intermediate',
      requiredDocuments: ['government_id', 'proof_of_address'],
      gracePeriodDays: 14,
    },
    aml_sanctions: {
      type: 'aml_sanctions',
      sanctionLists: ['OFAC', 'UN'],
      checkFrequency: 'transaction',
      actions: ['block', 'notify'],
    },
    lock_up_period: {
      type: 'lock_up_period',
      durationDays: 90,
      applicableGroups: [],
      gracePeriodDays: 0,
      exemptAddresses: [],
    },
    volume_supply_limit: {
      type: 'volume_supply_limit',
      maxSupply: 1000000,
      currentSupply: 0,
      isHardCap: true,
    },
    investor_position_limit: {
      type: 'investor_position_limit',
      maxPositionValue: 100000,
      currency: 'USD',
      applicableTiers: [],
      exemptAddresses: [],
    },
    investor_transaction_limit: {
      type: 'investor_transaction_limit',
      maxTransactionValue: 25000,
      currency: 'USD',
      applicableTiers: [],
    },
    risk_profile: {
      type: 'risk_profile',
      riskTolerance: 5,
      maxExposure: { 'high_risk': 20, 'medium_risk': 50, 'low_risk': 100 },
      requireDiversification: true,
    },
    accredited_investor: {
      type: 'accredited_investor',
      netWorthThreshold: 1000000,
      incomeThreshold: 200000,
      requiredDocuments: ['income_proof', 'asset_statement'],
      exemptAddresses: [],
    },
    tokenized_fund: {
      type: 'tokenized_fund',
      fundType: 'closed',
      minimumInvestment: 10000,
      maximumInvestment: 1000000,
      currency: 'USD',
      lockupPeriodDays: 365,
      redemptionFrequency: 'quarterly',
      redemptionNoticeDays: 30,
    },
    redemption: {
      type: 'redemption',
      noticePeriodDays: 30,
      processingFrequency: 'monthly',
      minimumAmount: 1000,
      maximumAmount: 100000,
      currency: 'USD',
    },
    standard_redemption: {
      type: 'standard_redemption',
      noticePeriodDays: 30,
      processingFrequency: 'monthly',
      minimumAmount: 1000,
      maximumAmount: 100000,
      currency: 'USD',
    },
    interval_fund_redemption: {
      type: 'interval_fund_redemption',
      intervalMonths: 3,
      redemptionWindowDays: 14,
      maximumPercentage: 25,
      proRatingEnabled: true,
    },
  };

  // Base rule properties
  const baseRule: BaseRule = {
    id: '',
    name: `New ${type.replace('_', ' ')} Rule`,
    type: type,
    description: `Default ${type.replace('_', ' ')} rule`,
    enabled: true,
    priority: 'medium',
    isTemplate: false,
  };

  // Get type-specific defaults or empty object if type not recognized
  const typeDefaults = ruleDefaults[type] || { type };

  // Merge base rule with type-specific defaults
  return { ...baseRule, ...typeDefaults };
}

/**
 * Create a rule validator function for a given rule
 * @param rule The rule to validate
 * @returns A function that returns validation errors if any
 */
export function createRuleValidator(rule: PolicyRule) {
  return (): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    // Basic validation
    if (!rule.name?.trim()) {
      errors.name = 'Rule name is required';
    }
    
    if (!rule.type) {
      errors.type = 'Rule type is required';
    }
    
    // Type-specific validation
    switch (rule.type) {
      case 'transfer_limit':
        if (!rule.transferAmount || rule.transferAmount <= 0) {
          errors.transferAmount = 'Transfer amount must be greater than zero';
        }
        if (!rule.currency) {
          errors.currency = 'Currency is required';
        }
        break;
        
      case 'velocity_limit':
        if (!rule.maxAmount || rule.maxAmount <= 0) {
          errors.maxAmount = 'Maximum amount must be greater than zero';
        }
        if (!rule.timeFrame) {
          errors.timeFrame = 'Time frame is required';
        }
        if (!rule.currency) {
          errors.currency = 'Currency is required';
        }
        break;
        
      // Add validation for other rule types as needed
    }
    
    return errors;
  };
}

/**
 * Convert a database rule to a frontend rule
 * @param dbRule The database rule
 * @returns A typed frontend rule
 */
export function convertDatabaseRuleToFrontend(dbRule: any): PolicyRule {
  // Start with the rule_details, which contains the rule data
  const ruleData = dbRule.rule_details || {};
  
  // Merge with the database metadata
  const frontendRule = {
    ...ruleData,
    id: dbRule.rule_id,
    name: dbRule.rule_name || ruleData.name || 'Unnamed Rule',
    type: dbRule.rule_type || ruleData.type || 'unknown',
    enabled: dbRule.status === 'active',
    isTemplate: dbRule.is_template || false,
    createdAt: dbRule.created_at,
    modifiedAt: dbRule.updated_at,
  };
  
  // Validate the rule
  const isValid = validateRule(frontendRule);
  if (!isValid) {
    console.warn('Rule validation failed, using rule as-is:', frontendRule);
  }
  
  return frontendRule as PolicyRule;
}

/**
 * Convert a frontend rule to a database rule
 * @param frontendRule The frontend rule
 * @param createdBy User ID of creator
 * @returns A database-ready rule
 */
export function convertFrontendRuleToDatabase(frontendRule: PolicyRule, createdBy: string) {
  return {
    rule_id: frontendRule.id,
    rule_name: frontendRule.name,
    rule_type: frontendRule.type,
    rule_details: frontendRule,
    created_by: createdBy,
    status: frontendRule.enabled ? 'active' : 'inactive',
    is_template: frontendRule.isTemplate || false,
  };
}