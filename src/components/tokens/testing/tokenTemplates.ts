/**
 * Token Templates
 * 
 * Provides template data for different token standards in both basic and advanced modes
 */
import { TokenStandard } from '@/types/core/centralModels';

// Configuration modes
type ConfigMode = 'min' | 'max';

/**
 * Get a template for the specified token standard and configuration mode
 */
export function getTemplateForStandard(standard: TokenStandard, mode: ConfigMode = 'min') {
  switch (standard) {
    case TokenStandard.ERC20:
      return mode === 'min' ? erc20BasicTemplate : erc20AdvancedTemplate;
    case TokenStandard.ERC721:
      return mode === 'min' ? erc721BasicTemplate : erc721AdvancedTemplate;
    case TokenStandard.ERC1155:
      return mode === 'min' ? erc1155BasicTemplate : erc1155AdvancedTemplate;
    case TokenStandard.ERC1400:
      return mode === 'min' ? erc1400BasicTemplate : erc1400AdvancedTemplate;
    case TokenStandard.ERC3525:
      return mode === 'min' ? erc3525BasicTemplate : erc3525AdvancedTemplate;
    case TokenStandard.ERC4626:
      return mode === 'min' ? erc4626BasicTemplate : erc4626AdvancedTemplate;
    default:
      return erc20BasicTemplate;
  }
}

// ERC-20 Templates
const erc20BasicTemplate = {
  name: "My ERC-20 Token",
  symbol: "MET",
  standard: TokenStandard.ERC20,
  decimals: 18,
  description: "A basic ERC-20 fungible token",
  initialSupply: "1000000",
  config_mode: "min",
  blocks: {
    name: "My ERC-20 Token",
    symbol: "MET",
    initial_supply: "1000000"
  }
};

const erc20AdvancedTemplate = {
  name: "Advanced ERC-20 Token",
  symbol: "AET",
  standard: TokenStandard.ERC20,
  decimals: 18,
  description: "An advanced ERC-20 fungible token with additional features",
  initialSupply: "1000000",
  cap: "10000000",
  isMintable: true,
  isBurnable: true,
  isPausable: true,
  tokenType: "utility",
  accessControl: "roles",
  allowanceManagement: true,
  permit: true,
  snapshot: true,
  feeOnTransfer: {
    enabled: true,
    fee: "2.5",
    recipient: "0x0000000000000000000000000000000000000000",
    feeType: "percentage"
  },
  rebasing: {
    enabled: false,
    mode: "automatic",
    targetSupply: "2000000"
  },
  governanceFeatures: {
    enabled: false,
    votingPeriod: 7,
    proposalThreshold: "1000",
    quorumPercentage: "4"
  },
  metadata: {
    website: "https://example.com",
    whitepaper: "https://example.com/whitepaper",
    social: {
      twitter: "https://twitter.com/example",
      telegram: "https://t.me/example"
    }
  },
  config_mode: "max",
  blocks: {
    name: "Advanced ERC-20 Token",
    symbol: "AET",
    initial_supply: "1000000",
    cap: "10000000",
    is_mintable: true,
    is_burnable: true,
    is_pausable: true,
    token_type: "utility",
    access_control: "roles",
    allow_management: true,
    permit: true,
    snapshot: true,
    fee_on_transfer: {
      enabled: true,
      fee: "2.5",
      recipient: "0x0000000000000000000000000000000000000000",
      feeType: "percentage"
    },
    rebasing: {
      enabled: false,
      mode: "automatic",
      targetSupply: "2000000"
    },
    governance_features: {
      enabled: false,
      votingPeriod: 7,
      proposalThreshold: "1000",
      quorumPercentage: "4"
    }
  }
};

// ERC-721 Templates
const erc721BasicTemplate = {
  name: "My NFT Collection",
  symbol: "MNFT",
  standard: TokenStandard.ERC721,
  description: "A basic NFT collection",
  baseUri: "https://api.example.com/metadata/",
  config_mode: "min",
  metadataStorage: "ipfs",
  blocks: {
    name: "My NFT Collection",
    symbol: "MNFT",
    base_uri: "https://api.example.com/metadata/"
  }
};

const erc721AdvancedTemplate = {
  name: "Advanced NFT Collection",
  symbol: "ANFT",
  standard: TokenStandard.ERC721,
  description: "An advanced NFT collection with additional features",
  baseUri: "https://api.example.com/metadata/",
  metadataStorage: "ipfs",
  maxSupply: "10000",
  hasRoyalty: true,
  royaltyPercentage: "2.5",
  royaltyReceiver: "0x0000000000000000000000000000000000000000",
  isBurnable: true,
  isPausable: true,
  assetType: "unique_asset",
  mintingMethod: "whitelist",
  autoIncrementIds: true,
  enumerable: true,
  uriStorage: "tokenId",
  accessControl: "roles",
  updatableUris: true,
  contractUri: "https://api.example.com/collection-metadata.json",
  dynamicMetadata: false,
  revealable: true,
  preRevealUri: "https://api.example.com/pre-reveal/hidden.json",
  reservedTokens: "100",
  maxMintsPerTx: "5",
  maxMintsPerWallet: "10",
  mintingPrice: "0.08",
  useSafeTransfer: true,
  enableFractionalOwnership: false,
  provenanceTracking: true,
  standardArrays: {
    tokenAttributes: [
      {
        trait_type: "Color",
        values: ["Red", "Blue", "Green"]
      },
      {
        trait_type: "Size",
        values: ["Small", "Medium", "Large"]
      }
    ]
  },
  metadata: {
    website: "https://example.com",
    collection: "My Collection",
    creator: "Example Artist"
  },
  config_mode: "max",
  blocks: {
    name: "Advanced NFT Collection",
    symbol: "ANFT",
    base_uri: "https://api.example.com/metadata/",
    metadata_storage: "ipfs",
    max_supply: "10000",
    has_royalty: true,
    royalty_percentage: "2.5",
    royalty_receiver: "0x0000000000000000000000000000000000000000",
    is_burnable: true,
    is_pausable: true
  }
};

// ERC-1155 Templates
const erc1155BasicTemplate = {
  name: "My Multi-Token",
  symbol: "MMT",
  standard: TokenStandard.ERC1155,
  description: "A basic ERC-1155 multi-token",
  uri: "https://api.example.com/metadata/{id}",
  config_mode: "min",
  blocks: {
    name: "My Multi-Token",
    symbol: "MMT",
    base_uri: "https://api.example.com/metadata/{id}"
  }
};

const erc1155AdvancedTemplate = {
  name: "Advanced Multi-Token",
  symbol: "AMT",
  standard: TokenStandard.ERC1155,
  description: "An advanced ERC-1155 multi-token with additional features",
  baseUri: "https://api.example.com/metadata/{id}",
  metadataStorage: "ipfs",
  hasRoyalty: true,
  royaltyPercentage: "2.5",
  royaltyReceiver: "0x0000000000000000000000000000000000000000",
  isBurnable: true,
  isPausable: true,
  accessControl: "roles",
  updatableUris: true,
  supplyTracking: true,
  enableApprovalForAll: true,
  dynamicUris: false,
  batchMinting: true,
  batchTransfers: true,
  transferRestrictions: false,
  whitelist: false,
  blacklist: false,
  mintingRoles: false,
  containerEnabled: false,
  standardArrays: {
    types: [
      {
        type_id: "1",
        name: "Gold Coin",
        supply: "1000",
        description: "A rare gold coin",
        fungible: true,
        maxSupply: "5000",
        metadataUri: ""
      },
      {
        type_id: "2",
        name: "Silver Coin",
        supply: "5000",
        description: "A common silver coin",
        fungible: true,
        maxSupply: "20000",
        metadataUri: ""
      },
      {
        type_id: "3",
        name: "Bronze Coin",
        supply: "10000",
        description: "A very common bronze coin",
        fungible: true,
        maxSupply: "50000",
        metadataUri: ""
      }
    ]
  },
  metadata: {
    website: "https://example.com",
    collection: "My Game Assets"
  },
  config_mode: "max",
  blocks: {
    name: "Advanced Multi-Token",
    symbol: "AMT",
    base_uri: "https://api.example.com/metadata/{id}",
    metadata_storage: "ipfs",
    has_royalty: true,
    royalty_percentage: "2.5",
    royalty_receiver: "0x0000000000000000000000000000000000000000",
    is_burnable: true,
    is_pausable: true
  }
};

// ERC-1400 Templates
const erc1400BasicTemplate = {
  name: "My Security Token",
  symbol: "MST",
  standard: TokenStandard.ERC1400,
  description: "A basic ERC-1400 security token",
  decimals: 18,
  initialSupply: "1000000",
  securityType: "equity", // must be one of: 'equity', 'debt', 'preferred', 'bond', 'option'
  isIssuable: true,
  config_mode: "min",
  blocks: {
    name: "My Security Token",
    symbol: "MST",
    initial_supply: "1000000",
    security_type: "equity",
    is_issuable: true,
    decimals: 18
  }
};

const erc1400AdvancedTemplate = {
  name: "Advanced Security Token",
  symbol: "AST",
  standard: TokenStandard.ERC1400,
  description: "An advanced ERC-1400 security token with additional features",
  decimals: 18,
  initialSupply: "1000000",
  cap: "10000000",
  isMintable: true,
  isBurnable: true,
  isPausable: true,
  documentUri: "https://example.com/legal",
  documentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
  controllerAddress: "0x0000000000000000000000000000000000000000",
  requireKyc: true,
  securityType: "equity", // must be one of: 'equity', 'debt', 'preferred', 'bond', 'option'
  isIssuable: true,
  issuingJurisdiction: "US",
  issuingEntityName: "Example Inc.",
  issuingEntityLei: "123456789ABCDEFGHIJK",
  transferRestrictions: {
    maxBalance: "100000",
    maxTransfer: "10000"
  },
  forcedTransfers: true,
  issuanceModules: true,
  documentManagement: true,
  recoveryMechanism: false,
  standardArrays: {
    partitions: [
      {
        name: "Class A",
        partitionId: "PARTITION-A",
        amount: "500000"
      },
      {
        name: "Class B",
        partitionId: "PARTITION-B",
        amount: "500000"
      }
    ],
    controllers: [
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002"
    ]
  },
  metadata: {
    website: "https://example.com",
    legalDocuments: "https://example.com/legal"
  },
  config_mode: "max",
  blocks: {
    name: "Advanced Security Token",
    symbol: "AST",
    initial_supply: "1000000",
    cap: "10000000",
    is_mintable: true,
    is_burnable: true,
    is_pausable: true,
    document_uri: "https://example.com/legal",
    document_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    controller_address: "0x0000000000000000000000000000000000000000",
    require_kyc: true,
    security_type: "equity"
  }
};

// ERC-3525 Templates
const erc3525BasicTemplate = {
  name: "My Semi-Fungible Token",
  symbol: "MSFT",
  standard: TokenStandard.ERC3525,
  description: "A basic ERC-3525 semi-fungible token",
  valueDecimals: 0,
  config_mode: "min",
  slots: [
    {
      id: "1",
      name: "Default Slot",
      description: "Default slot for basic token setup"
    }
  ],
  blocks: {
    name: "My Semi-Fungible Token",
    symbol: "MSFT",
    value_decimals: 0
  }
};

const erc3525AdvancedTemplate = {
  name: "Advanced Semi-Fungible Token",
  symbol: "ASFT",
  standard: TokenStandard.ERC3525,
  description: "An advanced ERC-3525 semi-fungible token with additional features",
  valueDecimals: 6,
  baseUri: "https://api.example.com/metadata/",
  metadataStorage: "ipfs",
  slotType: "property",
  isBurnable: true,
  isPausable: true,
  hasRoyalty: true,
  royaltyPercentage: "2.5",
  royaltyReceiver: "0x0000000000000000000000000000000000000000",
  slotApprovals: true,
  valueApprovals: true,
  accessControl: "roles",
  updatableUris: true,
  updatableSlots: true,
  valueTransfersEnabled: true,
  mergable: true,
  splittable: true,
  dynamicMetadata: false,
  supportsEnumeration: true,
  fractionalTransfers: true,
  slotTransferability: true,
  transferRestrictions: false,
  dynamicAttributes: false,
  autoUnitCalculation: true,
  customSlotProperties: false,
  slots: [
    {
      id: "1",
      name: "Land Plot A",
      description: "A premium land plot in district A"
    },
    {
      id: "2",
      name: "Land Plot B",
      description: "A standard land plot in district B"
    },
    {
      id: "3",
      name: "Land Plot C",
      description: "An economy land plot in district C"
    }
  ],
  standardArrays: {
    slots: [
      {
        id: "1",
        name: "Land Plot A",
        description: "A premium land plot in district A",
        properties: [
          {
            name: "size",
            value: "large"
          },
          {
            name: "location",
            value: "downtown"
          }
        ]
      },
      {
        id: "2",
        name: "Land Plot B",
        description: "A standard land plot in district B",
        properties: [
          {
            name: "size",
            value: "medium"
          },
          {
            name: "location",
            value: "suburb"
          }
        ]
      },
      {
        id: "3",
        name: "Land Plot C",
        description: "An economy land plot in district C",
        properties: [
          {
            name: "size",
            value: "small"
          },
          {
            name: "location",
            value: "outskirts"
          }
        ]
      }
    ]
  },
  metadata: {
    website: "https://example.com",
    gameWorld: "Meta Universe"
  },
  config_mode: "max",
  blocks: {
    name: "Advanced Semi-Fungible Token",
    symbol: "ASFT",
    value_decimals: 6,
    base_uri: "https://api.example.com/metadata/",
    metadata_storage: "ipfs",
    slot_type: "property",
    is_burnable: true,
    is_pausable: true,
    has_royalty: true,
    royalty_percentage: "2.5",
    royalty_receiver: "0x0000000000000000000000000000000000000000"
  }
};

// ERC-4626 Templates
const erc4626BasicTemplate = {
  name: "My Vault Token",
  symbol: "MVT",
  standard: TokenStandard.ERC4626,
  decimals: 18,
  description: "A basic ERC-4626 tokenized vault",
  assetAddress: "0x0000000000000000000000000000000000000000",
  config_mode: "min",
  blocks: {
    name: "My Vault Token",
    symbol: "MVT",
    asset_address: "0x0000000000000000000000000000000000000000"
  }
};

const erc4626AdvancedTemplate = {
  name: "Advanced Vault Token",
  symbol: "AVT",
  standard: TokenStandard.ERC4626,
  decimals: 18,
  description: "An advanced ERC-4626 tokenized vault with additional features",
  assetAddress: "0x0000000000000000000000000000000000000000",
  assetName: "USD Coin",
  assetSymbol: "USDC",
  assetDecimals: 6,
  vaultType: "yield",
  isMintable: true,
  isBurnable: true,
  isPausable: true,
  vaultStrategy: "compound",
  customStrategy: false,
  strategyController: "0x0000000000000000000000000000000000000000",
  accessControl: "roles",
  permit: true,
  flashLoans: false,
  emergencyShutdown: true,
  yieldStrategy: "lending",
  strategyDetails: "Allocate funds to Compound and Aave protocols for optimal yield",
  expectedAPY: "5-8%",
  allowlist: false,
  customHooks: false,
  autoReporting: true,
  previewFunctions: true,
  limitFunctions: true,
  compoundIntegration: true,
  aaveIntegration: true,
  lidoIntegration: false,
  uniswapIntegration: false,
  curveIntegration: false,
  customIntegration: "",
  fee: {
    enabled: true,
    managementFee: "2.0",
    performanceFee: "20.0",
    depositFee: "0.1",
    withdrawalFee: "0.2"
  },
  limits: {
    minDeposit: "100",
    maxDeposit: "1000000",
    maxWithdraw: "500000",
    maxRedeem: "500000"
  },
  rebalancingRules: {
    minRebalanceInterval: 86400,
    slippageTolerance: "0.5"
  },
  performanceMetrics: true,
  standardArrays: {
    strategyParams: [
      {
        name: "protocol",
        value: "compound",
        description: "Primary yield protocol"
      },
      {
        name: "protocol",
        value: "aave",
        description: "Secondary yield protocol"
      },
      {
        name: "rebalancingFrequency",
        value: "daily",
        description: "How often to rebalance"
      }
    ],
    assetAllocations: [
      {
        asset: "Compound cUSDC",
        percentage: 60
      },
      {
        asset: "Aave aUSDC",
        percentage: 40
      }
    ]
  },
  metadata: {
    website: "https://example.com",
    riskRating: "Medium",
    expectedAPY: "5-8%"
  },
  config_mode: "max",
  blocks: {
    name: "Advanced Vault Token",
    symbol: "AVT",
    asset_address: "0x0000000000000000000000000000000000000000",
    asset_name: "USD Coin",
    asset_symbol: "USDC",
    asset_decimals: 6,
    vault_type: "yield",
    is_mintable: true,
    is_burnable: true,
    is_pausable: true,
    vault_strategy: "compound",
    custom_strategy: false,
    strategy_controller: "0x0000000000000000000000000000000000000000"
  }
};