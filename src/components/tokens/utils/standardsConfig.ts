/**
 * Token Standards Configuration
 * Defines available token standards with descriptions and features
 */

export interface TokenStandard {
  value: string;
  label: string;
  description: string;
  shortDescription?: string;
  status?: 'stable' | 'new' | 'beta';
  features?: string[];
}

/**
 * Available token standards
 */
export const TOKEN_STANDARDS: TokenStandard[] = [
  {
    value: 'ERC-20',
    label: 'ERC-20',
    description: 'Standard fungible token for cryptocurrencies and utility tokens',
    shortDescription: 'Fungible tokens for currencies and utilities',
    status: 'stable',
    features: [
      'Fungible tokens (like currencies)',
      'Transfer, approve and mint operations',
      'Simple integration with exchanges',
      'Minimal gas costs'
    ]
  },
  {
    value: 'ERC-721',
    label: 'ERC-721',
    description: 'Non-fungible token (NFT) standard for unique digital assets',
    shortDescription: 'Non-fungible tokens for unique assets',
    status: 'stable',
    features: [
      'Unique tokens (NFTs)',
      'Metadata support for rich assets',
      'Transfer and approval mechanisms',
      'Built-in ownership tracking'
    ]
  },
  {
    value: 'ERC-1155',
    label: 'ERC-1155',
    description: 'Multi-token standard for both fungible and non-fungible tokens',
    shortDescription: 'Multi-token standard for mixed collections',
    status: 'stable',
    features: [
      'Supports both fungible and non-fungible tokens',
      'Batch transfers for gas efficiency',
      'Single contract for multiple token types',
      'Shared metadata options'
    ]
  },
  {
    value: 'ERC-1400',
    label: 'ERC-1400',
    description: 'Security token standard with advanced compliance features',
    shortDescription: 'Security token with compliance features',
    status: 'stable',
    features: [
      'Partitioned balances for assets',
      'Compliance controls and document management',
      'Forced transfers for regulatory needs',
      'Specialized for securities and regulated assets'
    ]
  },
  {
    value: 'ERC-3525',
    label: 'ERC-3525',
    description: 'Semi-fungible token standard combining aspects of ERC-20 and ERC-721',
    shortDescription: 'Semi-fungible tokens with slot categorization',
    status: 'new',
    features: [
      'Slot-based categorization of tokens',
      'Value transfer between tokens in the same slot',
      'NFT properties with partial fungibility',
      'Ideal for tokenized assets with shared properties'
    ]
  },
  {
    value: 'ERC-4626',
    label: 'ERC-4626',
    description: 'Tokenized vault standard for yield-bearing tokens',
    shortDescription: 'Tokenized vaults for yield-bearing assets',
    status: 'new',
    features: [
      'Standardized yield-bearing vaults',
      'Compatible with other DeFi protocols',
      'Built-in deposit/withdraw logic',
      'Accounting for shares and assets'
    ]
  }
];

/**
 * Gets the formatted token standard display name from the internal standard value
 */
export const getFormattedStandard = (standard: string): string => {
  if (!standard) return '';
  
  // Handle various formats that might be coming from different parts of the app
  // First, remove any prefix "TokenStandard." that might be there
  const cleanStandard = standard.replace('TokenStandard.', '').trim();
  
  // Standardize format by removing any hyphens and converting to uppercase
  const normalized = cleanStandard.replace(/-/g, '').toUpperCase();
  
  // Map to proper display format with hyphen
  const stdMap: Record<string, string> = {
    'ERC20': 'ERC-20',
    'ERC721': 'ERC-721',
    'ERC1155': 'ERC-1155',
    'ERC1400': 'ERC-1400',
    'ERC3525': 'ERC-3525',
    'ERC4626': 'ERC-4626',
  };
  
  // Return the formatted standard or the original if not found
  return stdMap[normalized] || standard;
};

/**
 * Gets the internal standard value from the formatted display name
 */
export const getInternalStandard = (displayStandard: string): string => {
  if (!displayStandard) return '';
  
  const stdMap: Record<string, string> = {
    'ERC-20': 'ERC20',
    'ERC-721': 'ERC721',
    'ERC-1155': 'ERC1155',
    'ERC-1400': 'ERC1400',
    'ERC-3525': 'ERC3525',
    'ERC-4626': 'ERC4626'
  };
  
  return stdMap[displayStandard] || displayStandard;
};

/**
 * Product categories for token templates
 */
export const PRODUCT_CATEGORIES = [
  { value: "structured_products", label: "Structured Products" },
  { value: "equity", label: "Equity" },
  { value: "commodities", label: "Commodities" },
  { value: "funds", label: "Funds, ETFs, ETPs" },
  { value: "bonds", label: "Bonds" },
  { value: "quantitative", label: "Quantitative Investment Strategies" },
  { value: "private_equity", label: "Private Equity" },
  { value: "private_debt", label: "Private Debt" },
  { value: "real_estate", label: "Real Estate" },
  { value: "energy", label: "Energy" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "collectibles", label: "Collectibles & all other assets" },
  { value: "digital_fund", label: "Digital Tokenised Fund" },
  { value: "custom", label: "Custom Template" }
];

/**
 * Define the token standards that need to be configured for each product template
 */
export const TEMPLATE_STANDARDS_CONFIG: Record<string, Record<string, string[]>> = {
  "Structured Products": {
    primary: ["ERC-1400", "ERC-20"],
    alternative: ["ERC-1400", "ERC-3525", "ERC-20"],
  },
  "Equity": {
    primary: ["ERC-1400", "ERC-20"],
    alternative: ["ERC-1400", "ERC-3525", "ERC-20"],
  },
  "Commodities": {
    primary: ["ERC-1155", "ERC-20"],
    alternative: ["ERC-20"],
  },
  "Funds, ETFs, ETPs": {
    primary: ["ERC-1400", "ERC-4626", "ERC-20"],
    alternative: ["ERC-4626", "ERC-20"],
  },
  "Bonds": {
    primary: ["ERC-1400", "ERC-20"],
    alternative: ["ERC-1400", "ERC-3525", "ERC-20"],
  },
  "Quantitative Investment Strategies": {
    primary: ["ERC-1400", "ERC-4626"],
    alternative: ["ERC-4626"],
  },
  "Private Equity": {
    primary: ["ERC-1400", "ERC-20"],
    alternative: ["ERC-1400", "ERC-3525", "ERC-20"],
  },
  "Private Debt": {
    primary: ["ERC-1400", "ERC-20"],
    alternative: ["ERC-1400", "ERC-3525", "ERC-20"],
  },
  "Real Estate": {
    primary: ["ERC-1400", "ERC-3525", "ERC-20"],
    alternative: ["ERC-1400", "ERC-20"],
  },
  "Energy": {
    primary: ["ERC-1400", "ERC-1155", "ERC-20"],
    alternative: ["ERC-1400", "ERC-20"],
  },
  "Infrastructure": {
    primary: ["ERC-1400", "ERC-3525", "ERC-20"],
    alternative: ["ERC-1400", "ERC-20"],
  },
  "Collectibles & all other assets": {
    primary: ["ERC-721", "ERC-1155", "ERC-20"],
    alternative: ["ERC-721", "ERC-20"],
  },
  "Digital Tokenised Fund": {
    primary: ["ERC-1400", "ERC-4626", "ERC-20"],
    alternative: ["ERC-4626"],
  },
  "Custom Template": {
    primary: [
      "ERC-20",
      "ERC-721",
      "ERC-1155",
      "ERC-1400",
      "ERC-3525",
      "ERC-4626",
    ],
    alternative: [
      "ERC-20",
      "ERC-721",
      "ERC-1155",
      "ERC-1400",
      "ERC-3525",
      "ERC-4626",
    ],
  },
};

/**
 * Get the standards for a given product category and template type
 */
export function getProductStandards(productCategory: string, isAlternative: boolean): string[] {
  const templateType = isAlternative ? "alternative" : "primary";
  return TEMPLATE_STANDARDS_CONFIG[productCategory]?.[templateType] || [];
}

/**
 * Building blocks for token features
 */
export const BUILDING_BLOCKS = {
  features: [
    { id: "mintable", name: "Mintable", description: "Allow minting new tokens" },
    { id: "burnable", name: "Burnable", description: "Allow burning tokens" },
    { id: "pausable", name: "Pausable", description: "Allow pausing all transfers" },
    { id: "permit", name: "Permit", description: "EIP-2612 permit functionality" },
    { id: "voting", name: "Voting", description: "Snapshot voting support" },
    { id: "meta-transactions", name: "Meta Transactions", description: "Support for gas-less transactions" }
  ],
  compliance: [
    { id: "kyc", name: "KYC", description: "Know Your Customer verification" },
    { id: "whitelist", name: "Whitelist", description: "Transfer restriction by whitelist" },
    { id: "blacklist", name: "Blacklist", description: "Transfer restriction by blacklist" },
    { id: "transfer-rules", name: "Transfer Rules", description: "Custom transfer rules" },
    { id: "jurisdictions", name: "Jurisdictions", description: "Jurisdiction restrictions" }
  ],
  governance: [
    { id: "voting-power", name: "Voting Power", description: "Token voting power" },
    { id: "delegation", name: "Delegation", description: "Delegate voting power" },
    { id: "timelocks", name: "Timelocks", description: "Time-locked token releases" },
    { id: "vesting", name: "Vesting", description: "Token vesting schedules" }
  ]
};