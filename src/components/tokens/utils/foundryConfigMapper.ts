/**
 * Configuration Mapper for Foundry Deployment
 * 
 * Maps existing token configurations to Foundry-compatible configurations
 */

import { 
  FoundryERC20Config, 
  FoundryERC721Config, 
  FoundryERC1155Config, 
  FoundryERC4626Config,
  FoundryERC3525Config,
  FoundryERC3525SlotInfo,
  FoundryERC3525AllocationInfo,
  FoundryTokenConfig 
} from '../interfaces/TokenInterfaces';
import { TokenStandard } from '@/types/core/centralModels';

/**
 * Maps legacy token configuration to Foundry ERC20 configuration
 */
export function mapToFoundryERC20Config(
  tokenData: any,
  ownerAddress: string
): FoundryERC20Config {
  const blocks = tokenData.blocks || {};
  const erc20Properties = tokenData.erc20Properties || {};
  
  return {
    name: tokenData.name || 'Unnamed Token',
    symbol: tokenData.symbol || 'UNK',
    decimals: parseInt(blocks.decimals || erc20Properties.decimals || '18'),
    initialSupply: blocks.initialSupply || erc20Properties.initialSupply || '0',
    maxSupply: blocks.maxSupply || erc20Properties.maxSupply || '0',
    transfersPaused: Boolean(blocks.transfersPaused || erc20Properties.transfersPaused),
    mintingEnabled: Boolean(blocks.mintingEnabled ?? erc20Properties.mintingEnabled ?? true),
    burningEnabled: Boolean(blocks.burningEnabled ?? erc20Properties.burningEnabled ?? true),
    votingEnabled: Boolean(blocks.votingEnabled || erc20Properties.votingEnabled),
    initialOwner: ownerAddress
  };
}

/**
 * Maps legacy token configuration to Foundry ERC721 configuration
 */
export function mapToFoundryERC721Config(
  tokenData: any,
  ownerAddress: string
): FoundryERC721Config {
  const blocks = tokenData.blocks || {};
  const erc721Properties = tokenData.erc721Properties || {};
  
  return {
    name: tokenData.name || 'Unnamed NFT',
    symbol: tokenData.symbol || 'UNK',
    baseURI: blocks.baseURI || erc721Properties.baseURI || '',
    maxSupply: parseInt(blocks.maxSupply || erc721Properties.maxSupply || '0'),
    mintPrice: blocks.mintPrice || erc721Properties.mintPrice || '0',
    transfersPaused: Boolean(blocks.transfersPaused || erc721Properties.transfersPaused),
    mintingEnabled: Boolean(blocks.mintingEnabled ?? erc721Properties.mintingEnabled ?? true),
    burningEnabled: Boolean(blocks.burningEnabled ?? erc721Properties.burningEnabled ?? true),
    publicMinting: Boolean(blocks.publicMinting ?? erc721Properties.publicMinting ?? true),
    initialOwner: ownerAddress
  };
}

/**
 * Maps legacy token configuration to Foundry ERC1155 configuration
 */
export function mapToFoundryERC1155Config(
  tokenData: any,
  ownerAddress: string
): FoundryERC1155Config {
  const blocks = tokenData.blocks || {};
  const erc1155Properties = tokenData.erc1155Properties || {};
  
  return {
    name: tokenData.name || 'Unnamed Multi-Token',
    symbol: tokenData.symbol || 'UNK',
    baseURI: blocks.baseURI || erc1155Properties.baseURI || '',
    transfersPaused: Boolean(blocks.transfersPaused || erc1155Properties.transfersPaused),
    mintingEnabled: Boolean(blocks.mintingEnabled ?? erc1155Properties.mintingEnabled ?? true),
    burningEnabled: Boolean(blocks.burningEnabled ?? erc1155Properties.burningEnabled ?? true),
    publicMinting: Boolean(blocks.publicMinting ?? erc1155Properties.publicMinting ?? true),
    initialOwner: ownerAddress
  };
}

/**
 * Maps legacy token configuration to Foundry ERC4626 configuration
 */
export function mapToFoundryERC4626Config(
  tokenData: any,
  ownerAddress: string
): FoundryERC4626Config {
  const blocks = tokenData.blocks || {};
  const erc4626Properties = tokenData.erc4626Properties || {};
  
  return {
    name: tokenData.name || 'Unnamed Vault',
    symbol: tokenData.symbol || 'UNK',
    decimals: parseInt(blocks.decimals || erc4626Properties.decimals || '18'),
    asset: blocks.asset || erc4626Properties.asset || '',
    managementFee: parseInt(blocks.managementFee || erc4626Properties.managementFee || '0'),
    performanceFee: parseInt(blocks.performanceFee || erc4626Properties.performanceFee || '0'),
    depositLimit: blocks.depositLimit || erc4626Properties.depositLimit || '0',
    minDeposit: blocks.minDeposit || erc4626Properties.minDeposit || '0',
    depositsEnabled: Boolean(blocks.depositsEnabled ?? erc4626Properties.depositsEnabled ?? true),
    withdrawalsEnabled: Boolean(blocks.withdrawalsEnabled ?? erc4626Properties.withdrawalsEnabled ?? true),
    transfersPaused: Boolean(blocks.transfersPaused || erc4626Properties.transfersPaused),
    initialOwner: ownerAddress
  };
}

/**
 * Maps legacy token configuration to Foundry ERC3525 configuration
 */
export function mapToFoundryERC3525Config(
  tokenData: any,
  ownerAddress: string
): FoundryERC3525Config {
  const blocks = tokenData.blocks || {};
  const erc3525Properties = tokenData.erc3525Properties || {};
  const erc3525Slots = tokenData.erc3525Slots || [];
  const erc3525Allocations = tokenData.erc3525Allocations || [];
  
  // Map slots from legacy format
  const initialSlots: FoundryERC3525SlotInfo[] = erc3525Slots.map((slot: any) => ({
    name: slot.name || 'Unnamed Slot',
    description: slot.description || '',
    isActive: Boolean(slot.isActive ?? true),
    maxSupply: parseInt(slot.maxSupply || '0'),
    metadata: slot.metadata || '0x'
  }));
  
  // Map allocations from legacy format
  const allocations: FoundryERC3525AllocationInfo[] = erc3525Allocations.map((allocation: any) => ({
    slot: parseInt(allocation.slot || '1'),
    recipient: allocation.recipient || ownerAddress,
    value: allocation.value || '0',
    description: allocation.description || ''
  }));
  
  return {
    name: tokenData.name || 'Unnamed SFT',
    symbol: tokenData.symbol || 'UNK',
    valueDecimals: parseInt(blocks.valueDecimals || erc3525Properties.valueDecimals || '18'),
    mintingEnabled: Boolean(blocks.mintingEnabled ?? erc3525Properties.mintingEnabled ?? true),
    burningEnabled: Boolean(blocks.burningEnabled ?? erc3525Properties.burningEnabled ?? true),
    transfersPaused: Boolean(blocks.transfersPaused || erc3525Properties.transfersPaused),
    initialOwner: ownerAddress,
    initialSlots,
    allocations,
    royaltyFraction: parseInt(blocks.royaltyFraction || erc3525Properties.royaltyFraction || '0'),
    royaltyRecipient: blocks.royaltyRecipient || erc3525Properties.royaltyRecipient || ownerAddress
  };
}

/**
 * Main mapping function that routes to appropriate mapper based on token standard
 */
export function mapTokenToFoundryConfig(
  tokenData: any,
  standard: TokenStandard,
  ownerAddress: string
): FoundryTokenConfig {
  switch (standard) {
    case 'ERC-20':
      return mapToFoundryERC20Config(tokenData, ownerAddress);
    
    case 'ERC-721':
      return mapToFoundryERC721Config(tokenData, ownerAddress);
    
    case 'ERC-1155':
      return mapToFoundryERC1155Config(tokenData, ownerAddress);
    
    case 'ERC-4626':
      return mapToFoundryERC4626Config(tokenData, ownerAddress);
    
    case 'ERC-3525':
      return mapToFoundryERC3525Config(tokenData, ownerAddress);
    
    default:
      throw new Error(`Unsupported token standard for Foundry deployment: ${standard}`);
  }
}

/**
 * Validates that a Foundry configuration is complete and valid
 */
export function validateFoundryConfig(
  config: FoundryTokenConfig,
  tokenType: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Common validations
  if (!config.name || config.name.trim().length === 0) {
    errors.push('Token name is required');
  }
  
  if (!config.symbol || config.symbol.trim().length === 0) {
    errors.push('Token symbol is required');
  }
  
  if (!config.initialOwner || config.initialOwner === '0x0000000000000000000000000000000000000000') {
    errors.push('Initial owner address is required');
  }
  
  // Type-specific validations
  switch (tokenType) {
    case 'ERC20':
      const erc20Config = config as FoundryERC20Config;
      if (erc20Config.decimals < 0 || erc20Config.decimals > 18) {
        errors.push('Decimals must be between 0 and 18');
      }
      break;
      
    case 'ERC721':
      const erc721Config = config as FoundryERC721Config;
      if (erc721Config.maxSupply < 0) {
        errors.push('Max supply cannot be negative');
      }
      break;
      
    case 'ERC4626':
      const erc4626Config = config as FoundryERC4626Config;
      if (!erc4626Config.asset || erc4626Config.asset === '0x0000000000000000000000000000000000000000') {
        errors.push('Asset address is required for ERC4626 vault');
      }
      if (erc4626Config.managementFee > 10000) {
        errors.push('Management fee cannot exceed 100% (10000 basis points)');
      }
      if (erc4626Config.performanceFee > 10000) {
        errors.push('Performance fee cannot exceed 100% (10000 basis points)');
      }
      break;
      
    case 'ERC3525':
      const erc3525Config = config as FoundryERC3525Config;
      if (erc3525Config.valueDecimals < 0 || erc3525Config.valueDecimals > 18) {
        errors.push('Value decimals must be between 0 and 18');
      }
      if (erc3525Config.royaltyFraction > 10000) {
        errors.push('Royalty fraction cannot exceed 100% (10000 basis points)');
      }
      if (erc3525Config.initialSlots.length === 0) {
        errors.push('At least one initial slot is required for ERC3525');
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Converts token standard string to Foundry token type
 */
export function tokenStandardToFoundryType(standard: TokenStandard): string {
  switch (standard) {
    case 'ERC-20':
      return 'ERC20';
    case 'ERC-721':
      return 'ERC721';
    case 'ERC-1155':
      return 'ERC1155';
    case 'ERC-4626':
      return 'ERC4626';
    case 'ERC-3525':
      return 'ERC3525';
    default:
      throw new Error(`Unsupported token standard: ${standard}`);
  }
}

/**
 * Extracts deployment configuration from form data
 */
export function extractDeploymentConfig(
  formData: any,
  standard: TokenStandard,
  ownerAddress: string,
  blockchain: string,
  environment: 'mainnet' | 'testnet'
) {
  const foundryConfig = mapTokenToFoundryConfig(formData, standard, ownerAddress);
  const foundryType = tokenStandardToFoundryType(standard);
  
  const validation = validateFoundryConfig(foundryConfig, foundryType);
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }
  
  return {
    tokenType: foundryType,
    config: foundryConfig,
    blockchain,
    environment
  };
}

/**
 * Creates default configurations for each token type
 */
export const createDefaultFoundryConfig = {
  ERC20: (ownerAddress: string): FoundryERC20Config => ({
    name: 'New Token',
    symbol: 'NEW',
    decimals: 18,
    initialSupply: '1000000',
    maxSupply: '0',
    transfersPaused: false,
    mintingEnabled: true,
    burningEnabled: true,
    votingEnabled: false,
    initialOwner: ownerAddress
  }),
  
  ERC721: (ownerAddress: string): FoundryERC721Config => ({
    name: 'New NFT Collection',
    symbol: 'NNFT',
    baseURI: 'https://api.example.com/metadata/',
    maxSupply: 10000,
    mintPrice: '0.01',
    transfersPaused: false,
    mintingEnabled: true,
    burningEnabled: true,
    publicMinting: true,
    initialOwner: ownerAddress
  }),
  
  ERC1155: (ownerAddress: string): FoundryERC1155Config => ({
    name: 'New Multi-Token Collection',
    symbol: 'NMT',
    baseURI: 'https://api.example.com/metadata/{id}',
    transfersPaused: false,
    mintingEnabled: true,
    burningEnabled: true,
    publicMinting: true,
    initialOwner: ownerAddress
  }),
  
  ERC4626: (ownerAddress: string, assetAddress: string = ''): FoundryERC4626Config => ({
    name: 'New Vault',
    symbol: 'NVAULT',
    decimals: 18,
    asset: assetAddress,
    managementFee: 200, // 2%
    performanceFee: 1000, // 10%
    depositLimit: '0',
    minDeposit: '1',
    depositsEnabled: true,
    withdrawalsEnabled: true,
    transfersPaused: false,
    initialOwner: ownerAddress
  }),
  
  ERC3525: (ownerAddress: string): FoundryERC3525Config => ({
    name: 'New Semi-Fungible Token',
    symbol: 'NSFT',
    valueDecimals: 18,
    mintingEnabled: true,
    burningEnabled: true,
    transfersPaused: false,
    initialOwner: ownerAddress,
    initialSlots: [
      {
        name: 'Default Slot',
        description: 'Default slot for semi-fungible tokens',
        isActive: true,
        maxSupply: 0, // No cap
        metadata: '0x'
      }
    ],
    allocations: [],
    royaltyFraction: 0, // No royalty by default
    royaltyRecipient: ownerAddress
  })
};
