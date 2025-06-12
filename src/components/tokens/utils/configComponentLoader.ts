/**
 * Configuration Component Loader
 * 
 * This utility dynamically loads the appropriate configuration components
 * based on token standard and configuration mode (min/max).
 */
import React from 'react';
import { TokenStandard } from '@/types/core/centralModels';
import { StorageConfigMode } from './configModeUtils';

// Import all configuration components
// Min (Basic) Configuration Components
import ERC20SimpleConfig from '@/components/tokens/config/min/ERC20Config';
import ERC721SimpleConfig from '@/components/tokens/config/min/ERC721Config';
import ERC1155SimpleConfig from '@/components/tokens/config/min/ERC1155Config';
import ERC1400SimpleConfig from '@/components/tokens/config/min/ERC1400Config';
import ERC3525SimpleConfig from '@/components/tokens/config/min/ERC3525Config';
import ERC4626SimpleConfig from '@/components/tokens/config/min/ERC4626Config';

// Max (Advanced) Configuration Components
import ERC20AdvancedConfig from '@/components/tokens/config/max/ERC20Config';
import ERC721AdvancedConfig from '@/components/tokens/config/max/ERC721Config';
import ERC1155AdvancedConfig from '@/components/tokens/config/max/ERC1155Config';
import ERC1400AdvancedConfig from '@/components/tokens/config/max/ERC1400Config';
import ERC3525AdvancedConfig from '@/components/tokens/config/max/ERC3525Config';
import ERC4626AdvancedConfig from '@/components/tokens/config/max/ERC4626Config';

// Map of configuration components by standard and mode
const CONFIG_COMPONENTS = {
  min: {
    [TokenStandard.ERC20]: ERC20SimpleConfig,
    [TokenStandard.ERC721]: ERC721SimpleConfig,
    [TokenStandard.ERC1155]: ERC1155SimpleConfig,
    [TokenStandard.ERC1400]: ERC1400SimpleConfig,
    [TokenStandard.ERC3525]: ERC3525SimpleConfig,
    [TokenStandard.ERC4626]: ERC4626SimpleConfig,
  },
  max: {
    [TokenStandard.ERC20]: ERC20AdvancedConfig,
    [TokenStandard.ERC721]: ERC721AdvancedConfig,
    [TokenStandard.ERC1155]: ERC1155AdvancedConfig,
    [TokenStandard.ERC1400]: ERC1400AdvancedConfig,
    [TokenStandard.ERC3525]: ERC3525AdvancedConfig,
    [TokenStandard.ERC4626]: ERC4626AdvancedConfig,
  }
};

/**
 * Get the appropriate configuration component for a token standard and mode
 * @param standard Token standard
 * @param mode Configuration mode ('min' or 'max')
 * @returns The configuration component
 */
export function getConfigComponent(standard: TokenStandard, mode: StorageConfigMode): React.ComponentType<any> {
  if (!CONFIG_COMPONENTS[mode] || !CONFIG_COMPONENTS[mode][standard]) {
    console.warn(`No configuration component found for ${standard} in ${mode} mode`);
    return () => React.createElement('div', {}, `No configuration available for ${standard}`);
  }
  
  return CONFIG_COMPONENTS[mode][standard];
}

/**
 * Get field definitions for a specific token standard and configuration mode
 * @param standard Token standard
 * @param mode Configuration mode ('min' or 'max')
 * @returns Field definitions for the specified standard and mode
 */
export function getFieldDefinitions(standard: TokenStandard, mode: StorageConfigMode): Record<string, any> {
  // This would ideally extract field definitions from the configuration components
  // For now, we'll return a basic mapping of expected fields
  const baseFields = ['name', 'symbol', 'description'];
  
  switch (standard) {
    case TokenStandard.ERC20:
      return {
        min: [...baseFields, 'decimals', 'initialSupply', 'isMintable', 'isBurnable', 'isPausable'],
        max: [...baseFields, 'decimals', 'initialSupply', 'cap', 'isMintable', 'isBurnable', 'isPausable', 
              'accessControl', 'allowManagement', 'permitSupport', 'votesSupport', 'flashMinting', 
              'snapshots', 'transferHooks', 'upgradeable', 'feeOnTransfer', 'rebasing']
      }[mode];
      
    case TokenStandard.ERC721:
      return {
        min: [...baseFields, 'baseURI', 'isMintable', 'isBurnable', 'isPausable'],
        max: [...baseFields, 'baseURI', 'isMintable', 'isBurnable', 'isPausable', 
              'accessControl', 'enumerable', 'uriStorage', 'royalties', 'soulbound', 
              'upgradeable', 'batchMinting']
      }[mode];
      
    case TokenStandard.ERC1155:
      return {
        min: [...baseFields, 'baseURI', 'isMintable', 'isBurnable', 'isPausable'],
        max: [...baseFields, 'baseURI', 'isMintable', 'isBurnable', 'isPausable', 
              'accessControl', 'royalties', 'dynamicUris', 'batchMinting', 
              'batchTransfers', 'transferRestrictions', 'upgradeable']
      }[mode];
      
    case TokenStandard.ERC1400:
      return {
        min: [...baseFields, 'decimals', 'initialSupply', 'controllers', 'partitions'],
        max: [...baseFields, 'decimals', 'initialSupply', 'controllers', 'partitions', 
              'accessControl', 'transferRestrictions', 'documentManagement']
      }[mode];
      
    case TokenStandard.ERC3525:
      return {
        min: [...baseFields, 'decimals', 'baseURI', 'isMintable', 'isBurnable', 'isPausable'],
        max: [...baseFields, 'decimals', 'baseURI', 'isMintable', 'isBurnable', 'isPausable', 
              'accessControl', 'slotEnumerable', 'slotApprovable', 'upgradeable']
      }[mode];
      
    case TokenStandard.ERC4626:
      return {
        min: [...baseFields, 'decimals', 'asset', 'initialSupply'],
        max: [...baseFields, 'decimals', 'asset', 'initialSupply', 'accessControl', 
              'feeManagement', 'strategyManagement', 'upgradeable']
      }[mode];
      
    default:
      return baseFields;
  }
}

/**
 * Get default values for a specific token standard and configuration mode
 * @param standard Token standard
 * @param mode Configuration mode ('min' or 'max')
 * @returns Default values for the specified standard and mode
 */
export function getDefaultValues(standard: TokenStandard, mode: StorageConfigMode): Record<string, any> {
  const baseDefaults = {
    name: '',
    symbol: '',
    description: ''
  };
  
  switch (standard) {
    case TokenStandard.ERC20:
      return {
        min: {
          ...baseDefaults,
          decimals: 18,
          initialSupply: '1000000',
          isMintable: true,
          isBurnable: false,
          isPausable: false
        },
        max: {
          ...baseDefaults,
          decimals: 18,
          initialSupply: '1000000',
          cap: '',
          isMintable: true,
          isBurnable: false,
          isPausable: false,
          accessControl: 'ownable',
          allowManagement: false,
          permitSupport: false,
          votesSupport: false,
          flashMinting: false,
          snapshots: false,
          transferHooks: false,
          upgradeable: false,
          feeOnTransfer: { enabled: false, fee: '0.5', recipient: '' },
          rebasing: { enabled: false, mode: 'automatic', targetSupply: '' }
        }
      }[mode];
      
    // Add similar defaults for other token standards
    // ...
      
    default:
      return baseDefaults;
  }
}