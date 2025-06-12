import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface Rule {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

interface RuleConflictDetectorProps {
  rules: Rule[];
}

const RuleConflictDetector: React.FC<RuleConflictDetectorProps> = ({
  rules,
}) => {
  const conflicts = detectRuleConflicts(rules);

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {conflicts.map((conflict, index) => (
        <Alert
          key={index}
          variant="destructive"
          className="bg-amber-50 text-amber-800 border-amber-200"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-amber-800 font-medium">
            Potential Rule Conflict Detected
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            {conflict.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

interface Conflict {
  rules: [Rule, Rule];
  type: string;
  message: string;
}

export function detectRuleConflicts(rules: Rule[]): Conflict[] {
  const conflicts: Conflict[] = [];

  // Skip if there are less than 2 rules
  if (rules.length < 2) {
    return conflicts;
  }

  // Check each pair of rules for conflicts
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const rule1 = rules[i];
      const rule2 = rules[j];

      // Check for transfer limit conflicts
      if (hasTransferLimitConflict(rule1, rule2)) {
        conflicts.push({
          rules: [rule1, rule2],
          type: "transfer_limit_conflict",
          message: `"${rule1.name}" and "${rule2.name}" have conflicting transfer limits. This may cause confusion about which limit applies.`,
        });
      }

      // Check for lock-up period overlaps
      if (hasLockUpPeriodConflict(rule1, rule2)) {
        conflicts.push({
          rules: [rule1, rule2],
          type: "lock_up_period_conflict",
          message: `"${rule1.name}" and "${rule2.name}" have overlapping lock-up periods which may cause conflicts in transfer restrictions.`,
        });
      }

      // Check for whitelist vs. blacklist conflicts
      if (hasWhitelistBlacklistConflict(rule1, rule2)) {
        conflicts.push({
          rules: [rule1, rule2],
          type: "whitelist_blacklist_conflict",
          message: `"${rule1.name}" and "${rule2.name}" have conflicting whitelist/blacklist rules that may prevent intended transfers.`,
        });
      }

      // Check for conflicting actions on the same condition
      if (hasSameConditionConflictingActions(rule1, rule2)) {
        conflicts.push({
          rules: [rule1, rule2],
          type: "action_conflict",
          message: `"${rule1.name}" and "${rule2.name}" have similar conditions but different actions, which may lead to unpredictable behavior.`,
        });
      }

      // Check for KYC verification conflicts with other rules
      if (hasKYCVerificationConflict(rule1, rule2)) {
        conflicts.push({
          rules: [rule1, rule2],
          type: "kyc_verification_conflict",
          message: `"${rule1.name}" requires KYC verification but "${rule2.name}" may allow transactions without verification.`,
        });
      }
    }
  }

  return conflicts;
}

// Helper functions to detect specific types of conflicts
function hasTransferLimitConflict(rule1: Rule, rule2: Rule): boolean {
  // Check if both rules are transfer limit types
  const isTransferLimit1 =
    rule1.type === "transfer_limit" ||
    rule1.type === "investor_transaction_limit";
  const isTransferLimit2 =
    rule2.type === "transfer_limit" ||
    rule2.type === "investor_transaction_limit";

  if (isTransferLimit1 && isTransferLimit2) {
    // Check if they apply to the same transaction type
    const sameTransactionType =
      !rule1.transactionType ||
      !rule2.transactionType ||
      rule1.transactionType === rule2.transactionType ||
      rule1.transactionType === "both" ||
      rule2.transactionType === "both";

    // Check if they have different limit amounts
    const differentLimits =
      (rule1.transferAmount !== undefined &&
        rule2.transferAmount !== undefined &&
        rule1.transferAmount !== rule2.transferAmount) ||
      (rule1.limitAmount !== undefined &&
        rule2.limitAmount !== undefined &&
        rule1.limitAmount !== rule2.limitAmount);

    // Check if they use the same currency/unit
    const sameCurrency =
      (rule1.currency && rule2.currency && rule1.currency === rule2.currency) ||
      (rule1.unit && rule2.unit && rule1.unit === rule2.unit);

    return sameTransactionType && differentLimits && sameCurrency;
  }

  return false;
}

function hasLockUpPeriodConflict(rule1: Rule, rule2: Rule): boolean {
  // Check if both rules are lock-up period types
  if (rule1.type === "lock_up_period" && rule2.type === "lock_up_period") {
    // Check if the periods overlap
    if (
      !rule1.startDate ||
      !rule1.endDate ||
      !rule2.startDate ||
      !rule2.endDate
    ) {
      return false;
    }

    const start1 = new Date(rule1.startDate).getTime();
    const end1 = new Date(rule1.endDate).getTime();
    const start2 = new Date(rule2.startDate).getTime();
    const end2 = new Date(rule2.endDate).getTime();

    // Check for overlap
    return start1 <= end2 && start2 <= end1;
  }

  return false;
}

function hasWhitelistBlacklistConflict(rule1: Rule, rule2: Rule): boolean {
  // Check if one rule is whitelist and the other is blacklist
  const isWhitelist1 = rule1.type === "whitelist_transfer";
  const isBlacklist1 = rule1.type === "blacklist_transfer";
  const isWhitelist2 = rule2.type === "whitelist_transfer";
  const isBlacklist2 = rule2.type === "blacklist_transfer";

  // If one is whitelist and one is blacklist
  if ((isWhitelist1 && isBlacklist2) || (isBlacklist1 && isWhitelist2)) {
    // Check if they have overlapping addresses
    const addresses1 = rule1.addresses || [];
    const addresses2 = rule2.addresses || [];

    // Check for any common addresses
    return addresses1.some((addr: string) => addresses2.includes(addr));
  }

  return false;
}

function hasSameConditionConflictingActions(rule1: Rule, rule2: Rule): boolean {
  // Check if rules have similar conditions but different actions
  if (rule1.condition && rule2.condition && rule1.action && rule2.action) {
    const similarConditions =
      rule1.condition.field === rule2.condition.field &&
      rule1.condition.operator === rule2.condition.operator;

    // Check if the values are close (for numeric values)
    let similarValues = false;
    if (rule1.condition.value && rule2.condition.value) {
      if (
        isNaN(Number(rule1.condition.value)) ||
        isNaN(Number(rule2.condition.value))
      ) {
        // For non-numeric values, check exact match
        similarValues = rule1.condition.value === rule2.condition.value;
      } else {
        // For numeric values, check if they're within 10% of each other
        const val1 = Number(rule1.condition.value);
        const val2 = Number(rule2.condition.value);
        const diff = Math.abs(val1 - val2);
        const avg = (val1 + val2) / 2;
        similarValues = diff / avg < 0.1; // Within 10%
      }
    }

    // Check if actions are different
    const differentActions = rule1.action.type !== rule2.action.type;

    return similarConditions && similarValues && differentActions;
  }

  return false;
}

function hasKYCVerificationConflict(rule1: Rule, rule2: Rule): boolean {
  // Check if one rule is KYC verification and the other might bypass it
  const isKYC1 = rule1.type === "kyc_verification";
  const isKYC2 = rule2.type === "kyc_verification";

  if (isKYC1 && !isKYC2) {
    // Check if rule2 might allow transactions without KYC
    return (
      rule2.type === "whitelist_transfer" ||
      (rule2.type === "transfer_limit" &&
        rule2.transferAmount &&
        Number(rule2.transferAmount) > 0)
    );
  }

  if (!isKYC1 && isKYC2) {
    // Check if rule1 might allow transactions without KYC
    return (
      rule1.type === "whitelist_transfer" ||
      (rule1.type === "transfer_limit" &&
        rule1.transferAmount &&
        Number(rule1.transferAmount) > 0)
    );
  }

  return false;
}

export default RuleConflictDetector;
