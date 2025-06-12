import { z } from "zod";

/**
 * Base Rule Schema - Common fields for all rule types
 */
export const BaseRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  policyId: z.string().optional(),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
  isTemplate: z.boolean().optional().default(false),
  validationSchema: z.function().optional(),
});

export type BaseRule = z.infer<typeof BaseRuleSchema>;

/**
 * Transfer Limit Rule Schema
 */
export const TransferLimitRuleSchema = BaseRuleSchema.extend({
  type: z.literal("transfer_limit"),
  transferAmount: z.number().positive(),
  currency: z.string(),
});

export type TransferLimitRule = z.infer<typeof TransferLimitRuleSchema>;

/**
 * Velocity Limit Rule Schema
 */
export const VelocityLimitRuleSchema = BaseRuleSchema.extend({
  type: z.literal("velocity_limit"),
  maxAmount: z.number().positive(),
  timeFrame: z.enum(["hourly", "daily", "weekly", "monthly"]),
  currency: z.string(),
  applicableTiers: z.array(z.string()).optional(),
});

export type VelocityLimitRule = z.infer<typeof VelocityLimitRuleSchema>;

/**
 * Whitelist Transfer Rule Schema
 */
export const WhitelistTransferRuleSchema = BaseRuleSchema.extend({
  type: z.literal("whitelist_transfer"),
  addresses: z.array(z.string()),
  allowOutbound: z.boolean().default(true),
  allowInbound: z.boolean().default(true),
});

export type WhitelistTransferRule = z.infer<typeof WhitelistTransferRuleSchema>;

/**
 * KYC Verification Rule Schema
 */
export const KYCVerificationRuleSchema = BaseRuleSchema.extend({
  type: z.literal("kyc_verification"),
  requiredLevel: z.enum(["basic", "intermediate", "advanced"]),
  requiredDocuments: z.array(z.string()),
  gracePeriodDays: z.number().int().nonnegative().optional(),
});

export type KYCVerificationRule = z.infer<typeof KYCVerificationRuleSchema>;

/**
 * AML Sanctions Rule Schema
 */
export const AMLSanctionsRuleSchema = BaseRuleSchema.extend({
  type: z.literal("aml_sanctions"),
  sanctionLists: z.array(z.string()),
  checkFrequency: z.enum(["transaction", "daily", "weekly", "monthly"]),
  actions: z.array(z.enum(["block", "flag", "notify"]))
});

export type AMLSanctionsRule = z.infer<typeof AMLSanctionsRuleSchema>;

/**
 * Lock-Up Period Rule Schema
 */
export const LockUpPeriodRuleSchema = BaseRuleSchema.extend({
  type: z.literal("lock_up_period"),
  durationDays: z.number().int().positive(),
  applicableGroups: z.array(z.string()).optional(),
  gracePeriodDays: z.number().int().nonnegative().optional(),
  exemptAddresses: z.array(z.string()).optional(),
});

export type LockUpPeriodRule = z.infer<typeof LockUpPeriodRuleSchema>;

/**
 * Volume Supply Limit Rule Schema
 */
export const VolumeSupplyLimitRuleSchema = BaseRuleSchema.extend({
  type: z.literal("volume_supply_limit"),
  maxSupply: z.number().positive(),
  currentSupply: z.number().nonnegative().optional(),
  isHardCap: z.boolean().default(true),
});

export type VolumeSupplyLimitRule = z.infer<typeof VolumeSupplyLimitRuleSchema>;

/**
 * Investor Position Limit Rule Schema
 */
export const InvestorPositionLimitRuleSchema = BaseRuleSchema.extend({
  type: z.literal("investor_position_limit"),
  maxPositionValue: z.number().positive(),
  currency: z.string(),
  applicableTiers: z.array(z.string()).optional(),
  exemptAddresses: z.array(z.string()).optional(),
});

export type InvestorPositionLimitRule = z.infer<typeof InvestorPositionLimitRuleSchema>;

/**
 * Investor Transaction Limit Rule Schema
 */
export const InvestorTransactionLimitRuleSchema = BaseRuleSchema.extend({
  type: z.literal("investor_transaction_limit"),
  maxTransactionValue: z.number().positive(),
  currency: z.string(),
  applicableTiers: z.array(z.string()).optional(),
});

export type InvestorTransactionLimitRule = z.infer<typeof InvestorTransactionLimitRuleSchema>;

/**
 * Risk Profile Rule Schema
 */
export const RiskProfileRuleSchema = BaseRuleSchema.extend({
  type: z.literal("risk_profile"),
  riskTolerance: z.number().min(1).max(10),
  maxExposure: z.record(z.string(), z.number()),
  requireDiversification: z.boolean().default(false),
});

export type RiskProfileRule = z.infer<typeof RiskProfileRuleSchema>;

/**
 * Accredited Investor Rule Schema
 */
export const AccreditedInvestorRuleSchema = BaseRuleSchema.extend({
  type: z.literal("accredited_investor"),
  netWorthThreshold: z.number().positive().optional(),
  incomeThreshold: z.number().positive().optional(),
  requiredDocuments: z.array(z.string()).optional(),
  exemptAddresses: z.array(z.string()).optional(),
});

export type AccreditedInvestorRule = z.infer<typeof AccreditedInvestorRuleSchema>;

/**
 * Tokenized Fund Rule Schema
 */
export const TokenizedFundRuleSchema = BaseRuleSchema.extend({
  type: z.literal("tokenized_fund"),
  fundType: z.enum(["open", "closed", "interval"]),
  minimumInvestment: z.number().positive(),
  maximumInvestment: z.number().positive().optional(),
  currency: z.string(),
  lockupPeriodDays: z.number().int().nonnegative().optional(),
  redemptionFrequency: z.enum(["daily", "weekly", "monthly", "quarterly", "annually"]).optional(),
  redemptionNoticeDays: z.number().int().nonnegative().optional(),
});

export type TokenizedFundRule = z.infer<typeof TokenizedFundRuleSchema>;

/**
 * Standard Redemption Rule Schema
 */
export const StandardRedemptionRuleSchema = BaseRuleSchema.extend({
  type: z.literal("standard_redemption"),
  noticePeriodDays: z.number().int().nonnegative(),
  processingFrequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  minimumAmount: z.number().positive().optional(),
  maximumAmount: z.number().positive().optional(),
  currency: z.string(),
});

export type StandardRedemptionRule = z.infer<typeof StandardRedemptionRuleSchema>;

/**
 * Interval Fund Redemption Rule Schema
 */
export const IntervalFundRedemptionRuleSchema = BaseRuleSchema.extend({
  type: z.literal("interval_fund_redemption"),
  intervalMonths: z.number().int().positive(),
  redemptionWindowDays: z.number().int().positive(),
  maximumPercentage: z.number().min(0).max(100),
  proRatingEnabled: z.boolean().default(true),
});

export type IntervalFundRedemptionRule = z.infer<typeof IntervalFundRedemptionRuleSchema>;

/**
 * Policy Rule Union Type - All possible rule types
 */
export type PolicyRule =
  | TransferLimitRule
  | VelocityLimitRule
  | WhitelistTransferRule
  | KYCVerificationRule
  | AMLSanctionsRule
  | LockUpPeriodRule
  | VolumeSupplyLimitRule
  | InvestorPositionLimitRule
  | InvestorTransactionLimitRule
  | RiskProfileRule
  | AccreditedInvestorRule
  | TokenizedFundRule
  | StandardRedemptionRule
  | IntervalFundRedemptionRule;

/**
 * Function to validate a rule based on its type
 * @param rule The rule to validate
 * @returns True if valid, false otherwise
 */
export function validateRule(rule: any): boolean {
  try {
    switch (rule.type) {
      case "transfer_limit":
        TransferLimitRuleSchema.parse(rule);
        break;
      case "velocity_limit":
        VelocityLimitRuleSchema.parse(rule);
        break;
      case "whitelist_transfer":
        WhitelistTransferRuleSchema.parse(rule);
        break;
      case "kyc_verification":
        KYCVerificationRuleSchema.parse(rule);
        break;
      case "aml_sanctions":
        AMLSanctionsRuleSchema.parse(rule);
        break;
      case "lock_up_period":
        LockUpPeriodRuleSchema.parse(rule);
        break;
      case "volume_supply_limit":
        VolumeSupplyLimitRuleSchema.parse(rule);
        break;
      case "investor_position_limit":
        InvestorPositionLimitRuleSchema.parse(rule);
        break;
      case "investor_transaction_limit":
        InvestorTransactionLimitRuleSchema.parse(rule);
        break;
      case "risk_profile":
        RiskProfileRuleSchema.parse(rule);
        break;
      case "accredited_investor":
        AccreditedInvestorRuleSchema.parse(rule);
        break;
      case "tokenized_fund":
        TokenizedFundRuleSchema.parse(rule);
        break;
      case "standard_redemption":
        StandardRedemptionRuleSchema.parse(rule);
        break;
      case "interval_fund_redemption":
        IntervalFundRedemptionRuleSchema.parse(rule);
        break;
      default:
        // For custom rule types, just validate against the base schema
        BaseRuleSchema.parse(rule);
    }
    return true;
  } catch (error) {
    console.error(`Rule validation failed for ${rule.type}:`, error);
    return false;
  }
}

/**
 * Get a schema for a specific rule type
 * @param type The rule type
 * @returns The corresponding schema
 */
export function getRuleSchema(type: string) {
  switch (type) {
    case "transfer_limit":
      return TransferLimitRuleSchema;
    case "velocity_limit":
      return VelocityLimitRuleSchema;
    case "whitelist_transfer":
      return WhitelistTransferRuleSchema;
    case "kyc_verification":
      return KYCVerificationRuleSchema;
    case "aml_sanctions":
      return AMLSanctionsRuleSchema;
    case "lock_up_period":
      return LockUpPeriodRuleSchema;
    case "volume_supply_limit":
      return VolumeSupplyLimitRuleSchema;
    case "investor_position_limit":
      return InvestorPositionLimitRuleSchema;
    case "investor_transaction_limit":
      return InvestorTransactionLimitRuleSchema;
    case "risk_profile":
      return RiskProfileRuleSchema;
    case "accredited_investor":
      return AccreditedInvestorRuleSchema;
    case "tokenized_fund":
      return TokenizedFundRuleSchema;
    case "standard_redemption":
      return StandardRedemptionRuleSchema;
    case "interval_fund_redemption":
      return IntervalFundRedemptionRuleSchema;
    default:
      return BaseRuleSchema;
  }
}