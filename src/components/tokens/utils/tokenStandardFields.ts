/**
 * Token Standard Fields Registry
 * Defines the complex fields and structures for each token standard
 * Used to ensure proper handling during template operations
 */

export interface ComplexFieldMetadata {
  path: string;  // Dot notation path to the field
  type: 'array' | 'object' | 'arrayOfObjects';  // Type of complex field
  description: string; // Description of the field
}

export interface TokenStandardDefinition {
  simpleFields: string[];  // List of simple fields (strings, numbers, booleans)
  complexFields: ComplexFieldMetadata[];  // Complex fields that need special handling
}

// Registry of token standard definitions
export const TOKEN_STANDARD_FIELDS: Record<string, TokenStandardDefinition> = {
  'ERC-20': {
    simpleFields: [
      'name', 'symbol', 'description', 'decimals', 'initialSupply', 
      'cap', 'isMintable', 'isBurnable', 'isPausable', 'accessControl',
      'allowanceManagement', 'permit', 'snapshot'
    ],
    complexFields: [
      {
        path: 'feeOnTransfer',
        type: 'object',
        description: 'Fee on transfer configuration'
      },
      {
        path: 'rebasing',
        type: 'object',
        description: 'Rebasing configuration'
      }
    ]
  },
  'ERC-721': {
    simpleFields: [
      'name', 'symbol', 'description', 'baseUri', 'maxSupply',
      'hasRoyalty', 'royaltyPercentage', 'metadataStorage'
    ],
    complexFields: [
      {
        path: 'attributes',
        type: 'arrayOfObjects',
        description: 'NFT attributes definition'
      }
    ]
  },
  'ERC-1155': {
    simpleFields: [
      'name', 'symbol', 'description', 'baseUri', 'batchMinting',
      'metadataStorage'
    ],
    complexFields: [
      {
        path: 'tokenTypes',
        type: 'arrayOfObjects',
        description: 'Token types configuration'
      }
    ]
  },
  'ERC-1400': {
    simpleFields: [
      'name', 'symbol', 'description', 'decimals', 'initialSupply', 
      'cap', 'securityType', 'tokenDetails', 'isMultiClass',
      'legalTerms', 'prospectus', 'enforceKYC', 'forcedTransfersEnabled',
      'forcedRedemptionEnabled', 'transferRestrictions', 'whitelistEnabled',
      'investorAccreditation', 'holdingPeriod', 'maxInvestorCount',
      'autoCompliance', 'manualApprovals', 'complianceModule', 'isIssuable',
      'isPausable', 'granularControl', 'dividendDistribution',
      'corporateActions', 'customFeatures', 'trancheTransferability'
    ],
    complexFields: [
      {
        path: 'partitions',
        type: 'arrayOfObjects',
        description: 'Token partitions'
      },
      {
        path: 'controllers',
        type: 'array',
        description: 'Token controllers'
      },
      {
        path: 'documents',
        type: 'arrayOfObjects',
        description: 'Legal documents'
      },
      {
        path: 'geographicRestrictions',
        type: 'array',
        description: 'Geographic restrictions'
      }
    ]
  },
  'ERC-3525': {
    simpleFields: [
      'name', 'symbol', 'description', 'decimals', 'metadataStorage'
    ],
    complexFields: [
      {
        path: 'slots',
        type: 'arrayOfObjects',
        description: 'Token slots configuration'
      }
    ]
  },
  'ERC-4626': {
    simpleFields: [
      'name', 'symbol', 'description', 'assetAddress', 'assetDecimals',
      'fee', 'pausable', 'minDeposit', 'maxDeposit'
    ],
    complexFields: [
      {
        path: 'feeStructure',
        type: 'object',
        description: 'Fee structure configuration'
      },
      {
        path: 'redemptionPeriods',
        type: 'arrayOfObjects',
        description: 'Redemption period configuration'
      }
    ]
  }
};

/**
 * Get all complex field paths for a given token standard
 */
export function getComplexFieldPaths(standard: string): string[] {
  const standardDef = TOKEN_STANDARD_FIELDS[standard];
  if (!standardDef) return [];
  
  return standardDef.complexFields.map(field => field.path);
}

/**
 * Get all complex field paths for multiple standards
 */
export function getAllComplexFieldPaths(standards: string[]): string[] {
  const paths: string[] = [];
  
  for (const standard of standards) {
    paths.push(...getComplexFieldPaths(standard));
  }
  
  return [...new Set(paths)]; // Remove duplicates
} 