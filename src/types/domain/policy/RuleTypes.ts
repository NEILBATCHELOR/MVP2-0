/**
 * Rule Types for compliance and transaction rules
 */

export enum ComplianceCheckType {
  BASIC = "basic",
  STANDARD = "standard",
  ENHANCED = "enhanced"
}

export enum VerificationMethod {
  AUTOMATIC = "automatic",
  MANUAL = "manual"
}

export enum TransactionType {
  TRANSFER = "transfer",
  SUBSCRIBE = "subscribe",
  REDEEM = "redeem",
  BOTH = "both"
}

export enum RuleType {
  TRANSFER_LIMIT = "transfer_limit",
  VELOCITY_LIMIT = "velocity_limit",
  WHITELIST_TRANSFER = "whitelist_transfer",
  KYC_VERIFICATION = "kyc_verification",
  AML_SANCTIONS = "aml_sanctions",
  LOCK_UP_PERIOD = "lock_up_period",
  VOLUME_SUPPLY_LIMIT = "volume_supply_limit",
  INVESTOR_POSITION_LIMIT = "investor_position_limit",
  INVESTOR_TRANSACTION_LIMIT = "investor_transaction_limit",
  RISK_PROFILE = "risk_profile",
  ACCREDITED_INVESTOR = "accredited_investor",
  TOKENIZED_FUND = "tokenized_fund",
  REDEMPTION = "redemption"
}

export enum TimePeriod {
  PER_DAY = "per_day",
  PER_WEEK = "per_week",
  PER_MONTH = "per_month",
  PER_QUARTER = "per_quarter",
  PER_YEAR = "per_year"
}

export enum RulePriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low"
}

export enum Currency {
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP"
}