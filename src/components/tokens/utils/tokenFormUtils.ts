import { TokenStandard, TokenStatus } from "@/types/core/centralModels";
// import { getDefaultTokenForm } from "../templates/tokenTemplate"; // TODO: Create this function

// Temporary fallback function
function getDefaultTokenForm() {
  return {
    name: '',
    symbol: '',
    decimals: 18,
    standard: 'ERC-20',
    totalSupply: 1000000,
    configMode: 'min',
    blocks: {},
    metadata: {}
  };
}

/**
 * Prepare token form data for database operations
 * This transforms the UI form state into the structure expected by the database
 */
export function prepareTokenDataForDB(formData: any, projectId: string) {
  // Extract standard string and prepare for DB
  const standardStr = formData.standard;
  const standardForDB = standardStr.includes("ERC-1400") ? 
    "ERC20" : standardStr.replace(/-/g, "");
  
  // Extract properties that might be at the root level
  const rootLevelData = extractRootLevelData(formData);
  
  // Create enhanced metadata
  let enhancedMetadata = {
    ...formData.metadata,
    standardKey: standardStr,
    description: formData.metadata?.description || "",
    isERC1400: standardStr.includes("ERC-1400") || standardStr.includes("ERC1400"),
    // Include essential mode data if available
    ...rootLevelData,
    // Add standard-specific data
    standardData: {
      standard: standardForDB,
      displayStandard: standardStr,
      totalSupply: formData.totalSupply || rootLevelData.initialSupply || 0,
      features: formData.blocks?.features || [],
      compliance: formData.blocks?.compliance || []
    }
  };
  
  // Handle special standards
  if (standardStr.includes("ERC-1400") || standardStr.includes("ERC1400")) {
    enhancedMetadata = createERC1400Metadata(formData, enhancedMetadata, rootLevelData);
  }

  return {
    name: formData.name,
    symbol: formData.symbol,
    decimals: formData.decimals,
    standard: standardForDB,
    project_id: projectId,
    blocks: {
      ...formData.blocks,
      name: formData.name,
      symbol: formData.symbol,
      is_mintable: rootLevelData.isMintable ?? formData.isMintable ?? formData.blocks?.is_mintable ?? false,
      is_burnable: rootLevelData.isBurnable ?? formData.isBurnable ?? formData.blocks?.is_burnable ?? false,
      is_pausable: rootLevelData.isPausable ?? formData.isPausable ?? formData.blocks?.is_pausable ?? false
    },
    metadata: enhancedMetadata,
    status: formData.status || TokenStatus.DRAFT,
  };
}

/**
 * Enhanced extraction of properties that might be at the root level in essential mode
 * Supports all new fields from Phase 1 & 2 field mapping improvements
 */
function extractRootLevelData(formData: any) {
  // Enhanced field list with all new fields from Phase 1 & 2
  const enhancedProps = [
    // Common fields for all standards
    'isMintable', 'isBurnable', 'isPausable', 
    'initialSupply', 'cap', 'transferRestrictions',
    'hasRoyalty', 'royaltyPercentage', 'royaltyReceiver',
    'baseUri', 'metadataStorage', 'accessControl', 'tokenType',
    
    // ERC-721 specific fields
    'autoIncrementIds', 'mintingMethod', 'uriStorage', 
    'updatableUris', 'supplyValidationEnabled',
    
    // ERC-1155 specific fields
    'batchMintingEnabled', 'containerEnabled', 'supplyTracking',
    'enableApprovalForAll', 'dynamicUris',
    
    // ERC-1400 specific fields
    'enforceKYC', 'forcedTransfersEnabled', 'forcedRedemptionEnabled',
    'autoCompliance', 'manualApprovals', 'whitelistEnabled',
    'investorAccreditation', 'holdingPeriod', 'maxInvestorCount',
    'isIssuable', 'granularControl', 'dividendDistribution',
    'corporateActions', 'geographicRestrictions', 'complianceAutomationLevel',
    'issuingJurisdiction', 'issuingEntityName', 'issuingEntityLei',
    'documentUri', 'documentHash', 'controllerAddress',
    'requireKyc', 'securityType', 'transferable',
    
    // ERC-3525 specific fields
    'valueDecimals', 'slotType', 'slotApprovals', 'valueApprovals',
    'updatableSlots', 'valueTransfersEnabled', 'slotTransferValidation',
    'dynamicMetadata', 'allowsSlotEnumeration', 'valueAggregation',
    'permissioningEnabled', 'updatableValues', 'fractionalOwnershipEnabled',
    'slotTransferable', 'mergable', 'splittable',
    
    // ERC-4626 specific fields
    'assetAddress', 'assetName', 'assetSymbol', 'assetDecimals',
    'vaultType', 'vaultStrategy', 'customStrategy', 'strategyController',
    'flashLoans', 'emergencyShutdown', 'feeStructure', 'rebalancingRules',
    'performanceMetrics', 'yieldSource', 'strategyDocumentation',
    'rebalanceThreshold', 'liquidityReserve', 'maxSlippage',
    'depositLimit', 'withdrawalLimit', 'minDeposit', 'maxDeposit',
    'minWithdrawal', 'maxWithdrawal', 'performanceTracking',
    'depositFee', 'withdrawalFee', 'managementFee', 'performanceFee',
    'feeRecipient', 'withdrawalRules', 'yieldOptimizationEnabled',
    'automatedRebalancing'
  ];
  
  const extractedData: Record<string, any> = {};
  
  // Check if any properties exist at the root level
  for (const prop of enhancedProps) {
    if (formData[prop] !== undefined) {
      extractedData[prop] = formData[prop];
    }
  }
  
  // Enhanced array data extraction
  const arrayFields = ['partitions', 'slots', 'allocations', 'controllers', 'documents', 'tokenTypes'];
  for (const arrayField of arrayFields) {
    if (Array.isArray(formData[arrayField])) {
      extractedData[arrayField] = formData[arrayField];
    }
  }
  
  // Enhanced JSONB configuration extraction
  const jsonbFields = [
    'salesConfig', 'whitelistConfig', 'permissionConfig',
    'transferConfig', 'gasConfig', 'complianceConfig',
    'batchMintingConfig', 'containerConfig', 'dynamicUriConfig',
    'kycSettings', 'complianceSettings'
  ];
  for (const jsonbField of jsonbFields) {
    if (formData[jsonbField] && typeof formData[jsonbField] === 'object') {
      extractedData[jsonbField] = formData[jsonbField];
    }
  }
  
  return extractedData;
}

/**
 * Create ERC-1400 specific metadata
 */
function createERC1400Metadata(formData: any, baseMetadata: any, rootLevelData: any) {
  return {
    ...baseMetadata,
    multiplePartitions: baseMetadata.multiplePartitions || false,
    transferRestrictions: baseMetadata.transferRestrictions || rootLevelData.transferRestrictions || false,
    restrictedJurisdictions: baseMetadata.restrictedJurisdictions || [],
    partitions: baseMetadata.partitions || [],
    isERC1400: true,
    securityType: baseMetadata.securityType || "",
    issuerName: baseMetadata.issuerName || "",
  };
}

/**
 * Convert database token to form state
 */
export function tokenToFormState(token: any) {
  if (!token) return getDefaultTokenForm();
  
  // Determine display standard
  const displayStandard = determineDisplayStandard(token);
  
  // Extract metadata with fallbacks
  const metadata = token.metadata || {};
  const standardData = metadata.standardData || {};
  const configuration = metadata.configuration || {};
  
  // Create a complete form by merging all available data
  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol || metadata.symbol || "",
    decimals: token.decimals || metadata.decimals || 18,
    standard: displayStandard,
    internalStandard: token.standard,
    totalSupply: token.total_supply || standardData.totalSupply || metadata.totalSupply || 1000000,
    configMode: token.config_mode || metadata.configMode || 'min',
    
    // Ensure blocks are properly loaded
    blocks: {
      compliance: standardData.compliance || [],
      features: standardData.features || [],
      governance: standardData.governance || [],
      ...(token.blocks || {}),
      name: token.name,
      symbol: token.symbol || metadata.symbol || "",
      is_mintable: metadata.mintable || metadata.is_mintable || false,
      is_burnable: metadata.burnable || metadata.is_burnable || false,
      is_pausable: metadata.pausable || metadata.is_pausable || false,
    },
    
    // Ensure all metadata is properly loaded
    metadata: {
      // Base metadata
      description: token.description || metadata.description || "",
      category: metadata.category || "",
      product: metadata.product || "",
      
      // ERC-1400 specific fields
      multiplePartitions: configuration.isMultiClass || metadata.multiplePartitions || false,
      transferRestrictions: configuration.transferRestrictions || metadata.transferRestrictions || false,
      restrictedJurisdictions: configuration.restrictedJurisdictions || metadata.restrictedJurisdictions || [],
      partitions: metadata.partitions || [],
      securityType: metadata.securityType || "",
      issuerName: metadata.issuerName || "",
      
      // ERC-3525 specific fields
      isERC3525: displayStandard === "ERC-3525",
      slots: metadata.slots || [],
      slotTransferability: metadata.slotTransferability || false,
      slotEnumerable: metadata.slotEnumerable || false,
      slotApprovable: metadata.slotApprovable || false,
      
      // ERC-4626 specific fields
      isERC4626: displayStandard === "ERC-4626",
      assetAddress: metadata.assetAddress || "",
      assetDecimals: metadata.assetDecimals || 18,
      vaultFee: metadata.vaultFee || metadata.fee || 0,
      minDeposit: metadata.minDeposit || "",
      maxDeposit: metadata.maxDeposit || "",
      strategyType: metadata.strategyType || "",
      underlyingAsset: metadata.underlyingAsset || "",
      
      // Store flags to easily identify special token types
      isERC1400: displayStandard === "ERC-1400",
      
      // Include all other metadata fields
      ...metadata,
      
      // Make sure standardKey is preserved or set to the display standard
      standardKey: metadata.standardKey || displayStandard,
    },
    
    // Ensure project ID is set
    projectId: token.project_id,
  };
}

/**
 * Determine the display standard format for a token
 */
function determineDisplayStandard(token: any): string {
  if (!token) return "";
  
  // First check if standardKey is explicitly set in metadata
  const tokenMetadata = token.metadata || {};
  if (tokenMetadata.standardKey) {
    return tokenMetadata.standardKey;
  }
  
  // Check for specific token standard indicators
  if ((token.standard === TokenStandard.ERC20 || 
      (typeof token.standard === 'string' && token.standard.includes("ERC20"))) && 
      (tokenMetadata.isERC1400 === true || 
       token.name.includes("ERC-1400") || 
       token.name.includes("ERC1400") || 
       (tokenMetadata.configuration && tokenMetadata.configuration.isMultiClass) ||
       tokenMetadata.multiplePartitions === true)) {
    return "ERC-1400";
  }
  
  // Check for ERC-3525 specific indicators
  if ((tokenMetadata.isERC3525 === true || 
        token.name.includes("ERC-3525") || 
        token.name.includes("ERC3525") ||
        tokenMetadata.slots !== undefined)) {
    return "ERC-3525";
  }
  
  // Check for ERC-4626 specific indicators
  if ((tokenMetadata.isERC4626 === true || 
        token.name.includes("ERC-4626") || 
        token.name.includes("ERC4626") ||
        tokenMetadata.assetAddress !== undefined || 
        tokenMetadata.underlyingAsset !== undefined)) {
    return "ERC-4626";
  }
  
  // Determine based on token's standard
  if (typeof token.standard === 'number') {
    switch (token.standard) {
      case TokenStandard.ERC20: return "ERC-20";
      case TokenStandard.ERC721: return "ERC-721";
      case TokenStandard.ERC1155: return "ERC-1155";
      default: return "ERC-20";
    }
  } else if (typeof token.standard === 'string') {
    // Handle string standards
    if (token.standard.includes("ERC20") || token.standard.includes("ERC-20")) return "ERC-20";
    if (token.standard.includes("ERC721") || token.standard.includes("ERC-721")) return "ERC-721";
    if (token.standard.includes("ERC1155") || token.standard.includes("ERC-1155")) return "ERC-1155";
    if (token.standard.includes("ERC1400") || token.standard.includes("ERC-1400")) return "ERC-1400";
    if (token.standard.includes("ERC3525") || token.standard.includes("ERC-3525")) return "ERC-3525";
    if (token.standard.includes("ERC4626") || token.standard.includes("ERC-4626")) return "ERC-4626";
    return "ERC-20";
  }
  
  return "ERC-20"; // Default
}