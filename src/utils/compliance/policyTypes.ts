/**
 * Policy Type Constants
 * 
 * This file defines the standard policy types used throughout the application.
 * Use these constants to ensure consistency between UI and database.
 */

// Policy Types
export const POLICY_TYPES = {
  TRANSFER_LIMIT: 'transfer_limit',
  KYC_VERIFICATION: 'kyc_verification',
  RESTRICTED_ASSETS: 'restricted_assets',
  DORMANT_ACCOUNT: 'dormant_account',
  RISK_ASSESSMENT: 'risk_assessment',
  TRANSACTION_MONITORING: 'transaction_monitoring',
  ACCREDITED_INVESTOR: 'accredited_investor',
  VOLUME_SUPPLY_LIMIT: 'volume_supply_limit',
  INVESTOR_POSITION_LIMIT: 'investor_position_limit',
  INVESTOR_TRANSACTION_LIMIT: 'investor_transaction_limit',
  LOCK_UP_PERIOD: 'lock_up_period',
  VELOCITY_LIMIT: 'velocity_limit',
  WHITELIST_TRANSFER: 'whitelist_transfer',
  AML_SANCTIONS: 'aml_sanctions',
  REDEMPTION: 'redemption',
  TOKENIZED_FUND: 'tokenized_fund',
  RISK_PROFILE: 'risk_profile',
  STANDARD_REDEMPTION: 'standard_redemption',
  INTERVAL_FUND_REDEMPTION: 'interval_fund_redemption',
  CUSTOM: 'custom',
} as const;

// Rule Types
export const RULE_TYPES = {
  TRANSACTION: 'transaction',
  WALLET: 'wallet',
  ASSET: 'asset',
  USER: 'user',
  TIME: 'time',
  POLICY_METADATA: 'policy_metadata',
} as const;

// Policy Status
export const POLICY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  PENDING: 'pending',
} as const;

// Jurisdictions
export const JURISDICTIONS = {
  GLOBAL: 'global',
  US: 'us',
  EU: 'eu',
  UK: 'uk',
  ASIA_PACIFIC: 'asia_pacific',
  CUSTOM: 'custom',
} as const;

// Review Frequencies
export const REVIEW_FREQUENCIES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  BIANNUALLY: 'biannually',
  ANNUALLY: 'annually',
  CUSTOM: 'custom',
} as const;

// Helper functions
export const getPolicyTypeName = (type: string): string => {
  switch (type) {
    case POLICY_TYPES.TRANSFER_LIMIT: return 'Transfer Limit';
    case POLICY_TYPES.KYC_VERIFICATION: return 'KYC Verification';
    case POLICY_TYPES.RESTRICTED_ASSETS: return 'Restricted Assets';
    case POLICY_TYPES.DORMANT_ACCOUNT: return 'Dormant Account';
    case POLICY_TYPES.RISK_ASSESSMENT: return 'Risk Assessment';
    case POLICY_TYPES.TRANSACTION_MONITORING: return 'Transaction Monitoring';
    case POLICY_TYPES.ACCREDITED_INVESTOR: return 'Accredited Investor';
    case POLICY_TYPES.VOLUME_SUPPLY_LIMIT: return 'Volume/Supply Limit';
    case POLICY_TYPES.INVESTOR_POSITION_LIMIT: return 'Investor Position Limit';
    case POLICY_TYPES.INVESTOR_TRANSACTION_LIMIT: return 'Investor Transaction Limit';
    case POLICY_TYPES.LOCK_UP_PERIOD: return 'Lock-Up Period';
    case POLICY_TYPES.VELOCITY_LIMIT: return 'Velocity Limit';
    case POLICY_TYPES.WHITELIST_TRANSFER: return 'Whitelist Transfer';
    case POLICY_TYPES.AML_SANCTIONS: return 'AML/Sanctions';
    case POLICY_TYPES.REDEMPTION: return 'Redemption';
    case POLICY_TYPES.TOKENIZED_FUND: return 'Tokenized Fund';
    case POLICY_TYPES.RISK_PROFILE: return 'Risk Profile';
    case POLICY_TYPES.STANDARD_REDEMPTION: return 'Standard Redemption';
    case POLICY_TYPES.INTERVAL_FUND_REDEMPTION: return 'Interval Fund Redemption';
    case POLICY_TYPES.CUSTOM: return 'Custom Policy';
    default: return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
};

export const getJurisdictionName = (jurisdiction: string): string => {
  switch (jurisdiction) {
    case JURISDICTIONS.GLOBAL: return 'Global';
    case JURISDICTIONS.US: return 'United States';
    case JURISDICTIONS.EU: return 'European Union';
    case JURISDICTIONS.UK: return 'United Kingdom';
    case JURISDICTIONS.ASIA_PACIFIC: return 'Asia Pacific';
    case JURISDICTIONS.CUSTOM: return 'Custom Jurisdiction';
    default: return jurisdiction.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
};

export const getReviewFrequencyName = (frequency: string): string => {
  switch (frequency) {
    case REVIEW_FREQUENCIES.MONTHLY: return 'Monthly';
    case REVIEW_FREQUENCIES.QUARTERLY: return 'Quarterly';
    case REVIEW_FREQUENCIES.BIANNUALLY: return 'Bi-annually';
    case REVIEW_FREQUENCIES.ANNUALLY: return 'Annually';
    case REVIEW_FREQUENCIES.CUSTOM: return 'Custom Schedule';
    default: return frequency.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
};

export const getPoliciesForDashboard = () => {
  return [
    { value: POLICY_TYPES.TRANSFER_LIMIT, label: 'Transfer Limit' },
    { value: POLICY_TYPES.VELOCITY_LIMIT, label: 'Velocity Limit' },
    { value: POLICY_TYPES.WHITELIST_TRANSFER, label: 'Whitelist Transfer' },
    { value: POLICY_TYPES.KYC_VERIFICATION, label: 'KYC Verification' },
    { value: POLICY_TYPES.AML_SANCTIONS, label: 'AML/Sanctions' },
    { value: POLICY_TYPES.LOCK_UP_PERIOD, label: 'Lock-Up Period' },
    { value: POLICY_TYPES.VOLUME_SUPPLY_LIMIT, label: 'Volume/Supply Limit' },
    { value: POLICY_TYPES.INVESTOR_POSITION_LIMIT, label: 'Investor Position Limit' },
    { value: POLICY_TYPES.INVESTOR_TRANSACTION_LIMIT, label: 'Investor Transaction Limit' },
    { value: POLICY_TYPES.RISK_ASSESSMENT, label: 'Risk Assessment' },
    { value: POLICY_TYPES.ACCREDITED_INVESTOR, label: 'Accredited Investor' },
    { value: POLICY_TYPES.TOKENIZED_FUND, label: 'Tokenized Fund' },
    { value: POLICY_TYPES.RISK_PROFILE, label: 'Risk Profile' },
    { value: POLICY_TYPES.STANDARD_REDEMPTION, label: 'Standard Redemption' },
    { value: POLICY_TYPES.INTERVAL_FUND_REDEMPTION, label: 'Interval Fund Redemption' },
  ];
};

export const getJurisdictionsForDashboard = () => {
  return [
    { value: JURISDICTIONS.GLOBAL, label: 'Global' },
    { value: JURISDICTIONS.US, label: 'United States' },
    { value: JURISDICTIONS.EU, label: 'European Union' },
    { value: JURISDICTIONS.UK, label: 'United Kingdom' },
    { value: JURISDICTIONS.ASIA_PACIFIC, label: 'Asia Pacific' },
    { value: JURISDICTIONS.CUSTOM, label: 'Custom Jurisdiction' },
  ];
};

export const getReviewFrequenciesForDashboard = () => {
  return [
    { value: REVIEW_FREQUENCIES.MONTHLY, label: 'Monthly' },
    { value: REVIEW_FREQUENCIES.QUARTERLY, label: 'Quarterly' },
    { value: REVIEW_FREQUENCIES.BIANNUALLY, label: 'Bi-annually' },
    { value: REVIEW_FREQUENCIES.ANNUALLY, label: 'Annually' },
    { value: REVIEW_FREQUENCIES.CUSTOM, label: 'Custom Schedule' },
  ];
};