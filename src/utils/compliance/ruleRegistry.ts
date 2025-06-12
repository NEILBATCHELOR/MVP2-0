/**
 * Central registry for rule configurations and metadata
 * This provides a single source of truth for all rule types in the system
 */

export interface RuleTypeConfig {
  type: string;
  name: string;
  description: string;
  category: 'transaction' | 'investor' | 'asset' | 'compliance' | 'fund';
  icon: string;
  color: string;
  defaultPriority: 'high' | 'medium' | 'low';
  fields: string[];
  documentation?: string;
  examples?: any[];
}

/**
 * Registry of all rule types available in the system
 */
export const ruleTypeRegistry: Record<string, RuleTypeConfig> = {
  'transfer_limit': {
    type: 'transfer_limit',
    name: 'Transfer Limit',
    description: 'Limit the maximum amount that can be transferred in a single transaction',
    category: 'transaction',
    icon: 'arrow-up-down',
    color: 'blue',
    defaultPriority: 'high',
    fields: ['transferAmount', 'currency'],
    documentation: 'Transfer limits set the maximum amount that can be transferred in a single transaction. This helps control transaction size and reduce risk exposure.'
  },
  
  'velocity_limit': {
    type: 'velocity_limit',
    name: 'Velocity Limit',
    description: 'Limit the total transaction volume within a specific time frame',
    category: 'transaction',
    icon: 'timer',
    color: 'purple',
    defaultPriority: 'high',
    fields: ['maxAmount', 'timeFrame', 'currency', 'applicableTiers'],
    documentation: 'Velocity limits control the total volume of transactions that can occur within a specific time frame, such as hourly, daily, or weekly limits.'
  },
  
  'whitelist_transfer': {
    type: 'whitelist_transfer',
    name: 'Whitelist Transfer',
    description: 'Restrict transfers to pre-approved addresses',
    category: 'transaction',
    icon: 'check-circle',
    color: 'green',
    defaultPriority: 'high',
    fields: ['addresses', 'allowOutbound', 'allowInbound'],
    documentation: 'Whitelist transfers restrict transactions to a pre-approved list of addresses, enhancing security and compliance.'
  },
  
  'kyc_verification': {
    type: 'kyc_verification',
    name: 'KYC Verification',
    description: 'Require KYC verification before transactions',
    category: 'compliance',
    icon: 'user-check',
    color: 'amber',
    defaultPriority: 'high',
    fields: ['requiredLevel', 'requiredDocuments', 'gracePeriodDays'],
    documentation: 'KYC verification rules ensure users have completed the Know Your Customer process at the specified level before allowing transactions.'
  },
  
  'aml_sanctions': {
    type: 'aml_sanctions',
    name: 'AML/Sanctions Screening',
    description: 'Screen transactions against AML and sanctions lists',
    category: 'compliance',
    icon: 'shield',
    color: 'red',
    defaultPriority: 'high',
    fields: ['sanctionLists', 'checkFrequency', 'actions'],
    documentation: 'AML/Sanctions screening rules check users and transactions against Anti-Money Laundering and sanctions lists to ensure compliance with regulations.'
  },
  
  'lock_up_period': {
    type: 'lock_up_period',
    name: 'Lock-Up Period',
    description: 'Prevent transfers for a specified time period',
    category: 'asset',
    icon: 'lock',
    color: 'indigo',
    defaultPriority: 'high',
    fields: ['durationDays', 'applicableGroups', 'gracePeriodDays', 'exemptAddresses'],
    documentation: 'Lock-up period rules prevent asset transfers for a specified time period, commonly used for vesting schedules or new token issuances.'
  },
  
  'volume_supply_limit': {
    type: 'volume_supply_limit',
    name: 'Volume/Supply Limit',
    description: 'Set maximum supply or trading volume limits',
    category: 'asset',
    icon: 'trending-up',
    color: 'emerald',
    defaultPriority: 'high',
    fields: ['maxSupply', 'currentSupply', 'isHardCap'],
    documentation: 'Volume/Supply limit rules set maximum supply or trading volume limits, controlling the total available supply of an asset.'
  },
  
  'investor_position_limit': {
    type: 'investor_position_limit',
    name: 'Investor Position Limit',
    description: 'Limit maximum position size per investor',
    category: 'investor',
    icon: 'wallet',
    color: 'amber',
    defaultPriority: 'high',
    fields: ['maxPositionValue', 'currency', 'applicableTiers', 'exemptAddresses'],
    documentation: 'Investor position limit rules set the maximum value that an investor can hold, controlling exposure per investor.'
  },
  
  'investor_transaction_limit': {
    type: 'investor_transaction_limit',
    name: 'Investor Transaction Limit',
    description: 'Limit transaction size based on investor tier',
    category: 'investor',
    icon: 'layers',
    color: 'cyan',
    defaultPriority: 'high',
    fields: ['maxTransactionValue', 'currency', 'applicableTiers'],
    documentation: 'Investor transaction limit rules set the maximum transaction size based on investor tier, allowing for differentiated transaction limits.'
  },
  
  'accredited_investor': {
    type: 'accredited_investor',
    name: 'Accredited Investor',
    description: 'Require accredited investor status',
    category: 'compliance',
    icon: 'award',
    color: 'blue',
    defaultPriority: 'high',
    fields: ['netWorthThreshold', 'incomeThreshold', 'requiredDocuments', 'exemptAddresses'],
    documentation: 'Accredited investor rules ensure that only qualified investors meeting specific net worth or income thresholds can participate.'
  },
  
  'tokenized_fund': {
    type: 'tokenized_fund',
    name: 'Tokenized Fund',
    description: 'Configure tokenized fund parameters',
    category: 'fund',
    icon: 'briefcase',
    color: 'violet',
    defaultPriority: 'high',
    fields: ['fundType', 'minimumInvestment', 'maximumInvestment', 'currency', 'lockupPeriodDays', 'redemptionFrequency'],
    documentation: 'Tokenized fund rules configure the parameters for tokenized fund operations, including investment limits and redemption settings.'
  },
  
  'standard_redemption': {
    type: 'standard_redemption',
    name: 'Standard Redemption',
    description: 'Configure standard redemption parameters',
    category: 'fund',
    icon: 'repeat',
    color: 'emerald',
    defaultPriority: 'high',
    fields: ['noticePeriodDays', 'processingFrequency', 'minimumAmount', 'maximumAmount', 'currency'],
    documentation: 'Standard redemption rules configure the parameters for redemption operations, including notice periods and processing frequency.'
  },
  
  'interval_fund_redemption': {
    type: 'interval_fund_redemption',
    name: 'Interval Fund Redemption',
    description: 'Configure interval fund redemption parameters',
    category: 'fund',
    icon: 'calendar',
    color: 'cyan',
    defaultPriority: 'high',
    fields: ['intervalMonths', 'redemptionWindowDays', 'maximumPercentage', 'proRatingEnabled'],
    documentation: 'Interval fund redemption rules configure the parameters for interval fund redemption operations, including redemption windows and pro-rating.'
  },
};

/**
 * Get rule type configuration
 * @param type Rule type
 * @returns Rule type configuration or undefined if not found
 */
export function getRuleTypeConfig(type: string): RuleTypeConfig | undefined {
  return ruleTypeRegistry[type];
}

/**
 * Get all rule types grouped by category
 * @returns Record of category to array of rule types
 */
export function getRuleTypesByCategory(): Record<string, RuleTypeConfig[]> {
  const categories: Record<string, RuleTypeConfig[]> = {};
  
  Object.values(ruleTypeRegistry).forEach(config => {
    if (!categories[config.category]) {
      categories[config.category] = [];
    }
    categories[config.category].push(config);
  });
  
  return categories;
}

/**
 * Get badge color class for rule type
 * @param type Rule type
 * @returns CSS class for badge color
 */
export function getRuleTypeBadgeColor(type: string): string {
  const config = getRuleTypeConfig(type);
  if (!config) return 'bg-gray-100 text-gray-800 border-gray-200';
  
  const colorMap: Record<string, string> = {
    'blue': 'bg-blue-100 text-blue-800 border-blue-200',
    'red': 'bg-red-100 text-red-800 border-red-200',
    'green': 'bg-green-100 text-green-800 border-green-200',
    'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'purple': 'bg-purple-100 text-purple-800 border-purple-200',
    'indigo': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'pink': 'bg-pink-100 text-pink-800 border-pink-200',
    'orange': 'bg-orange-100 text-orange-800 border-orange-200',
    'amber': 'bg-amber-100 text-amber-800 border-amber-200',
    'emerald': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'cyan': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'violet': 'bg-violet-100 text-violet-800 border-violet-200',
  };
  
  return colorMap[config.color] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Get display name for rule type
 * @param type Rule type
 * @returns Human-readable name
 */
export function getRuleTypeDisplayName(type: string): string {
  const config = getRuleTypeConfig(type);
  return config ? config.name : type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Get priority badge color
 * @param priority Rule priority
 * @returns CSS class for priority badge
 */
export function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}