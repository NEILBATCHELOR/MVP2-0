/**
 * Configuration Mode Utilities
 * 
 * Provides helper functions for managing token configuration modes
 * consistently across different components.
 */

/**
 * Configuration mode types
 * - UI modes: 'basic' and 'advanced' (used in UI components)
 * - Storage modes: 'min' and 'max' (stored in database)
 */
export type UIConfigMode = 'basic' | 'advanced';
export type StorageConfigMode = 'min' | 'max';

/**
 * Convert UI configuration mode to storage configuration mode
 * @param uiMode UI configuration mode ('basic' or 'advanced')
 * @returns Storage configuration mode ('min' or 'max')
 */
export function uiModeToStorageMode(uiMode: UIConfigMode): StorageConfigMode {
  return uiMode === 'basic' ? 'min' : 'max';
}

/**
 * Convert storage configuration mode to UI configuration mode
 * @param storageMode Storage configuration mode ('min' or 'max')
 * @returns UI configuration mode ('basic' or 'advanced')
 */
export function storageModeToUIMode(storageMode: StorageConfigMode): UIConfigMode {
  return storageMode === 'min' ? 'basic' : 'advanced';
}

/**
 * Get the appropriate configuration component path based on the token standard and mode
 * @param standard Token standard (e.g., 'ERC20', 'ERC721')
 * @param mode Storage configuration mode ('min' or 'max')
 * @returns Path to the configuration component
 */
export function getConfigComponentPath(standard: string, mode: StorageConfigMode): string {
  return `@/components/tokens/config/${mode}/${standard}Config`;
}

/**
 * Determine if a token should use advanced configuration based on its properties
 * @param token Token data with properties
 * @returns Whether the token should use advanced configuration
 */
export function shouldUseAdvancedConfig(token: any): boolean {
  // If config_mode is explicitly set, use that
  if (token.config_mode) {
    return token.config_mode === 'max';
  }
  
  // Otherwise, check for advanced properties based on token standard
  const standard = token.standard?.toUpperCase()?.replace('-', '') || '';
  
  switch (standard) {
    case 'ERC20':
      return !!(
        token.feeOnTransfer?.enabled ||
        token.rebasing?.enabled ||
        token.governanceFeatures?.enabled ||
        token.permitSupport ||
        token.votesSupport ||
        token.flashMinting ||
        token.snapshots ||
        token.transferHooks ||
        token.upgradeable
      );
    case 'ERC721':
      return !!(
        token.royalties?.enabled ||
        token.soulbound ||
        token.upgradeable ||
        token.enumerable === false // Non-default value
      );
    case 'ERC1155':
      return !!(
        token.royalties?.enabled ||
        token.dynamicUris ||
        token.batchMinting ||
        token.batchTransfers ||
        token.transferRestrictions?.enabled
      );
    default:
      return false;
  }
}