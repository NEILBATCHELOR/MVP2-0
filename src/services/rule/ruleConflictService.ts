import { PolicyRule } from '@/types/domain/policy/rules';

/**
 * Type definition for rule conflicts
 */
export interface RuleConflict {
  rules: [PolicyRule, PolicyRule];
  type: string;
  message: string;
  severity: 'warning' | 'error';
  resolution?: string;
}

/**
 * Detect conflicts between rules
 * @param rules Array of rules to check for conflicts
 * @returns Array of detected conflicts
 */
export function detectRuleConflicts(rules: PolicyRule[]): RuleConflict[] {
  const conflicts: RuleConflict[] = [];

  // Skip conflict detection if less than 2 rules
  if (rules.length < 2) {
    return conflicts;
  }

  // Check each pair of rules for conflicts
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const rule1 = rules[i];
      const rule2 = rules[j];

      // Check for specific conflict types
      checkTransferLimitConflict(rule1, rule2, conflicts);
      checkVelocityLimitConflict(rule1, rule2, conflicts);
      checkLockUpPeriodConflict(rule1, rule2, conflicts);
      checkWhitelistBlacklistConflict(rule1, rule2, conflicts);
      checkKYCVerificationConflict(rule1, rule2, conflicts);
      checkRedemptionRuleConflict(rule1, rule2, conflicts);
      checkInvestorLimitConflict(rule1, rule2, conflicts);
      checkConflictingActions(rule1, rule2, conflicts);
    }
  }

  return conflicts;
}

/**
 * Check for transfer limit conflicts
 */
function checkTransferLimitConflict(rule1: PolicyRule, rule2: PolicyRule, conflicts: RuleConflict[]): void {
  // Only check if both are transfer limit rules
  if (rule1.type !== 'transfer_limit' || rule2.type !== 'transfer_limit') {
    return;
  }

  const transferLimit1 = rule1 as any;
  const transferLimit2 = rule2 as any;

  // Check if both rules have the same currency
  if (transferLimit1.currency && transferLimit2.currency && 
      transferLimit1.currency === transferLimit2.currency) {
    
    // Different transfer limits for the same currency
    conflicts.push({
      rules: [rule1, rule2],
      type: 'transfer_limit_conflict',
      message: `Conflicting transfer limits: ${transferLimit1.transferAmount} ${transferLimit1.currency} vs ${transferLimit2.transferAmount} ${transferLimit2.currency}`,
      severity: 'error',
      resolution: 'Keep only the more restrictive limit or use different currencies'
    });
  }
}

/**
 * Check for velocity limit conflicts
 */
function checkVelocityLimitConflict(rule1: PolicyRule, rule2: PolicyRule, conflicts: RuleConflict[]): void {
  // Only check if both are velocity limit rules
  if (rule1.type !== 'velocity_limit' || rule2.type !== 'velocity_limit') {
    return;
  }

  const velocity1 = rule1 as any;
  const velocity2 = rule2 as any;

  // Check if both rules have the same currency and time frame
  if (velocity1.currency && velocity2.currency && 
      velocity1.currency === velocity2.currency &&
      velocity1.timeFrame === velocity2.timeFrame) {
    
    // If they have overlapping tiers, that's a conflict
    const hasOverlappingTiers = 
      !velocity1.applicableTiers || 
      !velocity2.applicableTiers ||
      velocity1.applicableTiers.some((tier: string) => 
        !velocity2.applicableTiers || velocity2.applicableTiers.includes(tier)
      );
    
    if (hasOverlappingTiers) {
      conflicts.push({
        rules: [rule1, rule2],
        type: 'velocity_limit_conflict',
        message: `Conflicting velocity limits (${velocity1.timeFrame}): ${velocity1.maxAmount} ${velocity1.currency} vs ${velocity2.maxAmount} ${velocity2.currency}`,
        severity: 'error',
        resolution: 'Use different time frames, currencies, or ensure tiers do not overlap'
      });
    }
  }
}

/**
 * Check for lock-up period conflicts
 */
function checkLockUpPeriodConflict(rule1: PolicyRule, rule2: PolicyRule, conflicts: RuleConflict[]): void {
  // Only check if both are lock-up period rules
  if (rule1.type !== 'lock_up_period' || rule2.type !== 'lock_up_period') {
    return;
  }

  const lockup1 = rule1 as any;
  const lockup2 = rule2 as any;

  // Check if they have overlapping applicable groups
  const hasOverlappingGroups = 
    !lockup1.applicableGroups || 
    !lockup2.applicableGroups ||
    lockup1.applicableGroups.some((group: string) => 
      !lockup2.applicableGroups || lockup2.applicableGroups.includes(group)
    );
  
  if (hasOverlappingGroups && lockup1.durationDays !== lockup2.durationDays) {
    conflicts.push({
      rules: [rule1, rule2],
      type: 'lock_up_period_conflict',
      message: `Conflicting lock-up periods: ${lockup1.durationDays} days vs ${lockup2.durationDays} days`,
      severity: 'error',
      resolution: 'Ensure each investor group has only one lock-up period rule'
    });
  }
}

/**
 * Check for whitelist/blacklist conflicts
 */
function checkWhitelistBlacklistConflict(rule1: PolicyRule, rule2: PolicyRule, conflicts: RuleConflict[]): void {
  // Only check if both are whitelist rules
  if (rule1.type !== 'whitelist_transfer' || rule2.type !== 'whitelist_transfer') {
    return;
  }

  const whitelist1 = rule1 as any;
  const whitelist2 = rule2 as any;

  // Check for conflicting directionality
  if (whitelist1.allowInbound !== whitelist2.allowInbound || 
      whitelist1.allowOutbound !== whitelist2.allowOutbound) {
    // This is just a warning as it might be intentional
    conflicts.push({
      rules: [rule1, rule2],
      type: 'whitelist_direction_conflict',
      message: 'Whitelist rules have different directional settings (inbound/outbound)',
      severity: 'warning',
      resolution: 'Ensure whitelist direction settings are consistent unless intentionally different'
    });
  }

  // Check for overlapping addresses with different permissions
  const commonAddresses = (whitelist1.addresses || []).filter((addr: string) => 
    (whitelist2.addresses || []).includes(addr)
  );

  if (commonAddresses.length > 0 && 
      (whitelist1.allowInbound !== whitelist2.allowInbound || whitelist1.allowOutbound !== whitelist2.allowOutbound)) {
    conflicts.push({
      rules: [rule1, rule2],
      type: 'whitelist_address_conflict',
      message: `${commonAddresses.length} addresses have conflicting whitelist permissions`,
      severity: 'error',
      resolution: 'Remove duplicate addresses or align permissions'
    });
  }
}

/**
 * Check for KYC verification conflicts
 */
function checkKYCVerificationConflict(rule1: PolicyRule, rule2: PolicyRule, conflicts: RuleConflict[]): void {
  // Only check if both are KYC verification rules
  if (rule1.type !== 'kyc_verification' || rule2.type !== 'kyc_verification') {
    return;
  }

  const kyc1 = rule1 as any;
  const kyc2 = rule2 as any;

  // Different required levels is a conflict
  if (kyc1.requiredLevel !== kyc2.requiredLevel) {
    conflicts.push({
      rules: [rule1, rule2],
      type: 'kyc_level_conflict',
      message: `Conflicting KYC verification levels: ${kyc1.requiredLevel} vs ${kyc2.requiredLevel}`,
      severity: 'error',
      resolution: 'Keep only one KYC verification rule or ensure consistent levels'
    });
  }

  // Check for different document requirements
  const docsOnly1 = (kyc1.requiredDocuments || []).filter((doc: string) => 
    !(kyc2.requiredDocuments || []).includes(doc)
  );
  
  const docsOnly2 = (kyc2.requiredDocuments || []).filter((doc: string) => 
    !(kyc1.requiredDocuments || []).includes(doc)
  );

  if (docsOnly1.length > 0 || docsOnly2.length > 0) {
    conflicts.push({
      rules: [rule1, rule2],
      type: 'kyc_document_conflict',
      message: 'KYC rules require different document sets',
      severity: 'warning',
      resolution: 'Consolidate document requirements into a single rule'
    });
  }
}

/**
 * Check for redemption rule conflicts
 */
function checkRedemptionRuleConflict(rule1: PolicyRule, rule2: PolicyRule, conflicts: RuleConflict[]): void {
  // Check if both are redemption-related rules
  const isRedemptionRule1 = rule1.type === 'standard_redemption' || rule1.type === 'interval_fund_redemption';
  const isRedemptionRule2 = rule2.type === 'standard_redemption' || rule2.type === 'interval_fund_redemption';

  if (!isRedemptionRule1 || !isRedemptionRule2) {
    return;
  }

  // Different redemption types is a conflict
  if (rule1.type !== rule2.type) {
    conflicts.push({
      rules: [rule1, rule2],
      type: 'redemption_type_conflict',
      message: `Conflicting redemption rule types: ${rule1.type} vs ${rule2.type}`,
      severity: 'error',
      resolution: 'Only one type of redemption rule should be active at a time'
    });
    return;
  }

  // If both are standard redemption rules
  if (rule1.type === 'standard_redemption' && rule2.type === 'standard_redemption') {
    const redemption1 = rule1 as any;
    const redemption2 = rule2 as any;

    if (redemption1.processingFrequency !== redemption2.processingFrequency) {
      conflicts.push({
        rules: [rule1, rule2],
        type: 'redemption_frequency_conflict',
        message: `Conflicting redemption frequencies: ${redemption1.processingFrequency} vs ${redemption2.processingFrequency}`,
        severity: 'error',
        resolution: 'Standardize on a single redemption frequency'
      });
    }

    if (redemption1.noticePeriodDays !== redemption2.noticePeriodDays) {
      conflicts.push({
        rules: [rule1, rule2],
        type: 'redemption_notice_conflict',
        message: `Conflicting redemption notice periods: ${redemption1.noticePeriodDays} days vs ${redemption2.noticePeriodDays} days`,
        severity: 'error',
        resolution: 'Standardize on a single notice period'
      });
    }
  }

  // If both are interval fund redemption rules
  if (rule1.type === 'interval_fund_redemption' && rule2.type === 'interval_fund_redemption') {
    const redemption1 = rule1 as any;
    const redemption2 = rule2 as any;

    if (redemption1.intervalMonths !== redemption2.intervalMonths) {
      conflicts.push({
        rules: [rule1, rule2],
        type: 'interval_conflict',
        message: `Conflicting interval periods: ${redemption1.intervalMonths} months vs ${redemption2.intervalMonths} months`,
        severity: 'error',
        resolution: 'Use a single interval fund redemption rule'
      });
    }
  }
}

/**
 * Check for investor limit conflicts
 */
function checkInvestorLimitConflict(rule1: PolicyRule, rule2: PolicyRule, conflicts: RuleConflict[]): void {
  // Check if both are investor limit rules
  const isInvestorLimit1 = rule1.type === 'investor_position_limit' || rule1.type === 'investor_transaction_limit';
  const isInvestorLimit2 = rule2.type === 'investor_position_limit' || rule2.type === 'investor_transaction_limit';

  if (!isInvestorLimit1 || !isInvestorLimit2) {
    return;
  }

  // If both are the same type
  if (rule1.type === rule2.type) {
    const limit1 = rule1 as any;
    const limit2 = rule2 as any;

    // Check if same currency
    if (limit1.currency === limit2.currency) {
      // Check for overlapping tiers
      const hasOverlappingTiers = 
        !limit1.applicableTiers || 
        !limit2.applicableTiers ||
        limit1.applicableTiers.some((tier: string) => 
          !limit2.applicableTiers || limit2.applicableTiers.includes(tier)
        );
      
      if (hasOverlappingTiers) {
        const limitType = rule1.type === 'investor_position_limit' ? 'position' : 'transaction';
        
        conflicts.push({
          rules: [rule1, rule2],
          type: `investor_${limitType}_limit_conflict`,
          message: `Conflicting investor ${limitType} limits: ${limit1.maxPositionValue || limit1.maxTransactionValue} ${limit1.currency} vs ${limit2.maxPositionValue || limit2.maxTransactionValue} ${limit2.currency}`,
          severity: 'error',
          resolution: 'Ensure each investor tier has only one limit of each type'
        });
      }
    }
  }
}

/**
 * Check for rules with same conditions but conflicting actions
 */
function checkConflictingActions(rule1: PolicyRule, rule2: PolicyRule, conflicts: RuleConflict[]): void {
  // Skip if the rules don't have condition and action fields
  if (!('condition' in rule1) || !('action' in rule1) || 
      !('condition' in rule2) || !('action' in rule2)) {
    return;
  }

  const condition1 = (rule1 as any).condition;
  const condition2 = (rule2 as any).condition;
  const action1 = (rule1 as any).action;
  const action2 = (rule2 as any).action;

  // Check if conditions are "similar enough"
  const conditionsMatch = 
    condition1 && condition2 &&
    condition1.field === condition2.field &&
    condition1.operator === condition2.operator;
  
  // Check for potentially conflicting actions
  const actionsConflict = 
    action1 && action2 &&
    action1.type !== action2.type;
  
  if (conditionsMatch && actionsConflict) {
    conflicts.push({
      rules: [rule1, rule2],
      type: 'conflicting_actions',
      message: `Rules have similar conditions but different actions: ${action1.type} vs ${action2.type}`,
      severity: 'warning',
      resolution: 'Review rules to ensure actions are not contradictory for similar conditions'
    });
  }
}

/**
 * Get human-readable descriptions of conflicts
 * @param conflicts Array of conflicts
 * @returns Array of human-readable conflict descriptions
 */
export function getConflictDescriptions(conflicts: RuleConflict[]): string[] {
  return conflicts.map(conflict => {
    const rule1Name = conflict.rules[0].name;
    const rule2Name = conflict.rules[1].name;
    return `${conflict.message} between "${rule1Name}" and "${rule2Name}"`;
  });
}

/**
 * Get suggestions for resolving conflicts
 * @param conflicts Array of conflicts
 * @returns Object mapping conflict index to resolution suggestion
 */
export function getConflictResolutions(conflicts: RuleConflict[]): Record<number, string> {
  const resolutions: Record<number, string> = {};
  
  conflicts.forEach((conflict, index) => {
    if (conflict.resolution) {
      resolutions[index] = conflict.resolution;
    } else {
      // Default resolutions based on conflict type
      switch (conflict.type) {
        case 'transfer_limit_conflict':
          resolutions[index] = 'Keep only the lower limit for each currency';
          break;
        case 'velocity_limit_conflict':
          resolutions[index] = 'Adjust time frames or separate by investor tiers';
          break;
        case 'lock_up_period_conflict':
          resolutions[index] = 'Consolidate to a single lock-up period per group';
          break;
        case 'whitelist_conflict':
          resolutions[index] = 'Merge whitelist rules to have consistent permissions';
          break;
        case 'kyc_conflict':
          resolutions[index] = 'Standardize on the highest KYC level';
          break;
        case 'redemption_conflict':
          resolutions[index] = 'Choose one redemption rule type and remove others';
          break;
        default:
          resolutions[index] = 'Review and consolidate conflicting rules';
      }
    }
  });
  
  return resolutions;
}