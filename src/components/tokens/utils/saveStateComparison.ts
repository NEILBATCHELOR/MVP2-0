/**
 * Utility functions for comparing token states before and after saving
 * Used to identify fields that didn't save successfully
 */

import { EnhancedTokenData } from '../types';
import { TokenStandard } from '@/types/core/centralModels';

/**
 * Represents a field that failed to save properly
 */
export interface FailedSaveField {
  fieldName: string;
  displayName: string;
  oldValue: any;
  newValue: any;
  path: string;
}

/**
 * Compare two token objects to find differences that indicate failed saves
 * @param originalToken The token before save attempt
 * @param updatedToken The token after save attempt
 * @param formData The form data that was submitted
 * @returns Array of fields that failed to save properly
 */
export function compareTokenStates(
  originalToken: EnhancedTokenData,
  updatedToken: EnhancedTokenData,
  formData: any
): FailedSaveField[] {
  const failedFields: FailedSaveField[] = [];
  
  // Check basic token properties
  checkBasicProperties(originalToken, updatedToken, formData, failedFields);
  
  // Check standard-specific properties
  switch (originalToken.standard) {
    case TokenStandard.ERC20:
      checkERC20Properties(originalToken, updatedToken, formData, failedFields);
      break;
    case TokenStandard.ERC721:
      checkERC721Properties(originalToken, updatedToken, formData, failedFields);
      break;
    case TokenStandard.ERC1155:
      checkERC1155Properties(originalToken, updatedToken, formData, failedFields);
      break;
    case TokenStandard.ERC3525:
      checkERC3525Properties(originalToken, updatedToken, formData, failedFields);
      break;
    case TokenStandard.ERC4626:
      checkERC4626Properties(originalToken, updatedToken, formData, failedFields);
      break;
    case TokenStandard.ERC1400:
      checkERC1400Properties(originalToken, updatedToken, formData, failedFields);
      break;
  }
  
  return failedFields;
}

/**
 * Check basic token properties for differences
 */
function checkBasicProperties(
  originalToken: EnhancedTokenData,
  updatedToken: EnhancedTokenData,
  formData: any,
  failedFields: FailedSaveField[]
): void {
  // Check name
  if (formData.name && formData.name !== updatedToken.name) {
    failedFields.push({
      fieldName: 'name',
      displayName: 'Token Name',
      oldValue: originalToken.name,
      newValue: formData.name,
      path: 'name'
    });
  }
  
  // Check symbol
  if (formData.symbol && formData.symbol !== updatedToken.symbol) {
    failedFields.push({
      fieldName: 'symbol',
      displayName: 'Token Symbol',
      oldValue: originalToken.symbol,
      newValue: formData.symbol,
      path: 'symbol'
    });
  }
  
  // Check decimals
  if (formData.decimals !== undefined && formData.decimals !== updatedToken.decimals) {
    failedFields.push({
      fieldName: 'decimals',
      displayName: 'Decimals',
      oldValue: originalToken.decimals,
      newValue: formData.decimals,
      path: 'decimals'
    });
  }
  
  // Check description
  if (formData.description !== undefined) {
    const originalDescription = originalToken.description || originalToken.metadata?.description;
    const updatedDescription = updatedToken.description || updatedToken.metadata?.description;
    
    if (formData.description !== updatedDescription) {
      failedFields.push({
        fieldName: 'description',
        displayName: 'Description',
        oldValue: originalDescription,
        newValue: formData.description,
        path: 'metadata.description'
      });
    }
  }
}

/**
 * Check ERC20-specific properties for differences
 */
function checkERC20Properties(
  originalToken: EnhancedTokenData,
  updatedToken: EnhancedTokenData,
  formData: any,
  failedFields: FailedSaveField[]
): void {
  const originalProps: Record<string, any> = originalToken.erc20Properties || {};
  const updatedProps: Record<string, any> = updatedToken.erc20Properties || {};
  
  // Check initial supply
  if (formData.initialSupply !== undefined && formData.initialSupply !== updatedProps.initialSupply) {
    failedFields.push({
      fieldName: 'initialSupply',
      displayName: 'Initial Supply',
      oldValue: originalProps.initialSupply,
      newValue: formData.initialSupply,
      path: 'erc20Properties.initialSupply'
    });
  }
  
  // Check cap
  if (formData.cap !== undefined && formData.cap !== updatedProps.cap) {
    failedFields.push({
      fieldName: 'cap',
      displayName: 'Maximum Supply Cap',
      oldValue: originalProps.cap,
      newValue: formData.cap,
      path: 'erc20Properties.cap'
    });
  }
  
  // Check boolean properties
  checkBooleanProperty(originalProps, updatedProps, formData, 'isMintable', 'Mintable', failedFields, 'erc20Properties.isMintable');
  checkBooleanProperty(originalProps, updatedProps, formData, 'isBurnable', 'Burnable', failedFields, 'erc20Properties.isBurnable');
  checkBooleanProperty(originalProps, updatedProps, formData, 'isPausable', 'Pausable', failedFields, 'erc20Properties.isPausable');
  
  // Check advanced properties if in max config mode
  if (formData.config_mode === 'max') {
    checkStringProperty(originalProps, updatedProps, formData, 'tokenType', 'Token Type', failedFields, 'erc20Properties.tokenType');
    checkStringProperty(originalProps, updatedProps, formData, 'accessControl', 'Access Control', failedFields, 'erc20Properties.accessControl');
    checkBooleanProperty(originalProps, updatedProps, formData, 'allowanceManagement', 'Allowance Management', failedFields, 'erc20Properties.allowManagement');
    checkBooleanProperty(originalProps, updatedProps, formData, 'permit', 'Permit', failedFields, 'erc20Properties.permit');
    checkBooleanProperty(originalProps, updatedProps, formData, 'snapshot', 'Snapshot', failedFields, 'erc20Properties.snapshot');
  }
}

/**
 * Check ERC721-specific properties for differences
 */
function checkERC721Properties(
  originalToken: EnhancedTokenData,
  updatedToken: EnhancedTokenData,
  formData: any,
  failedFields: FailedSaveField[]
): void {
  const originalProps: Record<string, any> = originalToken.erc721Properties || {};
  const updatedProps: Record<string, any> = updatedToken.erc721Properties || {};
  
  // Check base URI
  checkStringProperty(originalProps, updatedProps, formData, 'baseUri', 'Base URI', failedFields, 'erc721Properties.baseUri');
  
  // Check metadata storage
  checkStringProperty(originalProps, updatedProps, formData, 'metadataStorage', 'Metadata Storage', failedFields, 'erc721Properties.metadataStorage');
  
  // Check max supply
  if (formData.maxSupply !== undefined && formData.maxSupply !== updatedProps.maxSupply) {
    failedFields.push({
      fieldName: 'maxSupply',
      displayName: 'Maximum Supply',
      oldValue: originalProps.maxSupply,
      newValue: formData.maxSupply,
      path: 'erc721Properties.maxSupply'
    });
  }
  
  // Check royalty settings
  checkBooleanProperty(originalProps, updatedProps, formData, 'hasRoyalty', 'Enable Royalties', failedFields, 'erc721Properties.hasRoyalty');
  
  if (formData.hasRoyalty) {
    checkStringProperty(originalProps, updatedProps, formData, 'royaltyPercentage', 'Royalty Percentage', failedFields, 'erc721Properties.royaltyPercentage');
    checkStringProperty(originalProps, updatedProps, formData, 'royaltyReceiver', 'Royalty Receiver', failedFields, 'erc721Properties.royaltyReceiver');
  }
  
  // Check boolean properties
  checkBooleanProperty(originalProps, updatedProps, formData, 'isBurnable', 'Burnable', failedFields, 'erc721Properties.isBurnable');
  checkBooleanProperty(originalProps, updatedProps, formData, 'isPausable', 'Pausable', failedFields, 'erc721Properties.isPausable');
  
  // Check advanced properties if in max config mode
  if (formData.config_mode === 'max') {
    checkStringProperty(originalProps, updatedProps, formData, 'assetType', 'Asset Type', failedFields, 'erc721Properties.assetType');
    checkStringProperty(originalProps, updatedProps, formData, 'mintingMethod', 'Minting Method', failedFields, 'erc721Properties.mintingMethod');
    checkBooleanProperty(originalProps, updatedProps, formData, 'autoIncrementIds', 'Auto-increment Token IDs', failedFields, 'erc721Properties.autoIncrementIds');
    checkBooleanProperty(originalProps, updatedProps, formData, 'enumerable', 'Enumerable', failedFields, 'erc721Properties.enumerable');
    checkStringProperty(originalProps, updatedProps, formData, 'uriStorage', 'URI Storage Method', failedFields, 'erc721Properties.uriStorage');
    checkStringProperty(originalProps, updatedProps, formData, 'accessControl', 'Access Control', failedFields, 'erc721Properties.accessControl');
    checkBooleanProperty(originalProps, updatedProps, formData, 'updatableUris', 'Updatable URIs', failedFields, 'erc721Properties.updatableUris');
  }
}

/**
 * Check ERC1155-specific properties for differences
 */
function checkERC1155Properties(
  originalToken: EnhancedTokenData,
  updatedToken: EnhancedTokenData,
  formData: any,
  failedFields: FailedSaveField[]
): void {
  const originalProps: Record<string, any> = originalToken.erc1155Properties || {};
  const updatedProps: Record<string, any> = updatedToken.erc1155Properties || {};
  
  // Check base URI and metadata storage
  checkStringProperty(originalProps, updatedProps, formData, 'baseUri', 'Base URI', failedFields, 'erc1155Properties.baseUri');
  checkStringProperty(originalProps, updatedProps, formData, 'metadataStorage', 'Metadata Storage', failedFields, 'erc1155Properties.metadataStorage');
  
  // Check royalty settings
  checkBooleanProperty(originalProps, updatedProps, formData, 'hasRoyalty', 'Enable Royalties', failedFields, 'erc1155Properties.hasRoyalty');
  
  if (formData.hasRoyalty) {
    checkStringProperty(originalProps, updatedProps, formData, 'royaltyPercentage', 'Royalty Percentage', failedFields, 'erc1155Properties.royaltyPercentage');
    checkStringProperty(originalProps, updatedProps, formData, 'royaltyReceiver', 'Royalty Receiver', failedFields, 'erc1155Properties.royaltyReceiver');
  }
  
  // Check boolean properties
  checkBooleanProperty(originalProps, updatedProps, formData, 'isBurnable', 'Burnable', failedFields, 'erc1155Properties.isBurnable');
  checkBooleanProperty(originalProps, updatedProps, formData, 'isPausable', 'Pausable', failedFields, 'erc1155Properties.isPausable');
  
  // Check advanced properties
  checkStringProperty(originalProps, updatedProps, formData, 'accessControl', 'Access Control', failedFields, 'erc1155Properties.accessControl');
  checkBooleanProperty(originalProps, updatedProps, formData, 'batchMinting', 'Batch Minting', failedFields, 'erc1155Properties.batchMinting');
  checkBooleanProperty(originalProps, updatedProps, formData, 'batchTransfers', 'Batch Transfers', failedFields, 'erc1155Properties.batchTransfers');
  checkBooleanProperty(originalProps, updatedProps, formData, 'dynamicUris', 'Dynamic URIs', failedFields, 'erc1155Properties.dynamicUris');
  checkBooleanProperty(originalProps, updatedProps, formData, 'updatableUris', 'Updatable URIs', failedFields, 'erc1155Properties.updatableUris');
  checkBooleanProperty(originalProps, updatedProps, formData, 'supplyTracking', 'Supply Tracking', failedFields, 'erc1155Properties.supplyTracking');
  checkBooleanProperty(originalProps, updatedProps, formData, 'enableApprovalForAll', 'Enable Approval For All', failedFields, 'erc1155Properties.enableApprovalForAll');
  checkBooleanProperty(originalProps, updatedProps, formData, 'containerEnabled', 'Container Enabled', failedFields, 'erc1155Properties.containerEnabled');
}

/**
 * Check ERC3525-specific properties for differences
 */
function checkERC3525Properties(
  originalToken: EnhancedTokenData,
  updatedToken: EnhancedTokenData,
  formData: any,
  failedFields: FailedSaveField[]
): void {
  const originalProps: Record<string, any> = originalToken.erc3525Properties || {};
  const updatedProps: Record<string, any> = updatedToken.erc3525Properties || {};
  
  // Check base URI and metadata storage
  checkStringProperty(originalProps, updatedProps, formData, 'baseUri', 'Base URI', failedFields, 'erc3525Properties.baseUri');
  checkStringProperty(originalProps, updatedProps, formData, 'metadataStorage', 'Metadata Storage', failedFields, 'erc3525Properties.metadataStorage');
  
  // Check value decimals
  if (formData.valueDecimals !== undefined && formData.valueDecimals !== updatedProps.valueDecimals) {
    failedFields.push({
      fieldName: 'valueDecimals',
      displayName: 'Value Decimals',
      oldValue: originalProps.valueDecimals,
      newValue: formData.valueDecimals,
      path: 'erc3525Properties.valueDecimals'
    });
  }
  
  // Check royalty settings
  checkBooleanProperty(originalProps, updatedProps, formData, 'hasRoyalty', 'Enable Royalties', failedFields, 'erc3525Properties.hasRoyalty');
  
  if (formData.hasRoyalty) {
    checkStringProperty(originalProps, updatedProps, formData, 'royaltyPercentage', 'Royalty Percentage', failedFields, 'erc3525Properties.royaltyPercentage');
    checkStringProperty(originalProps, updatedProps, formData, 'royaltyReceiver', 'Royalty Receiver', failedFields, 'erc3525Properties.royaltyReceiver');
  }
  
  // Check boolean properties
  checkBooleanProperty(originalProps, updatedProps, formData, 'isBurnable', 'Burnable', failedFields, 'erc3525Properties.isBurnable');
  checkBooleanProperty(originalProps, updatedProps, formData, 'isPausable', 'Pausable', failedFields, 'erc3525Properties.isPausable');
  
  // Check advanced properties
  checkStringProperty(originalProps, updatedProps, formData, 'slotType', 'Slot Type', failedFields, 'erc3525Properties.slotType');
  checkStringProperty(originalProps, updatedProps, formData, 'accessControl', 'Access Control', failedFields, 'erc3525Properties.accessControl');
  checkBooleanProperty(originalProps, updatedProps, formData, 'updatableUris', 'Updatable URIs', failedFields, 'erc3525Properties.updatableUris');
  checkBooleanProperty(originalProps, updatedProps, formData, 'allowsValueTransfer', 'Allows Value Transfer', failedFields, 'erc3525Properties.allowsValueTransfer');
}

/**
 * Check ERC4626-specific properties for differences
 */
function checkERC4626Properties(
  originalToken: EnhancedTokenData,
  updatedToken: EnhancedTokenData,
  formData: any,
  failedFields: FailedSaveField[]
): void {
  const originalProps: Record<string, any> = originalToken.erc4626Properties || {};
  const updatedProps: Record<string, any> = updatedToken.erc4626Properties || {};
  
  // Check asset configuration
  checkStringProperty(originalProps, updatedProps, formData, 'assetTokenAddress', 'Asset Token Address', failedFields, 'erc4626Properties.assetTokenAddress');
  checkStringProperty(originalProps, updatedProps, formData, 'assetName', 'Asset Name', failedFields, 'erc4626Properties.assetName');
  checkStringProperty(originalProps, updatedProps, formData, 'assetSymbol', 'Asset Symbol', failedFields, 'erc4626Properties.assetSymbol');
  
  if (formData.assetDecimals !== undefined && formData.assetDecimals !== updatedProps.assetDecimals) {
    failedFields.push({
      fieldName: 'assetDecimals',
      displayName: 'Asset Decimals',
      oldValue: originalProps.assetDecimals,
      newValue: formData.assetDecimals,
      path: 'erc4626Properties.assetDecimals'
    });
  }
  
  // Check vault configuration
  checkStringProperty(originalProps, updatedProps, formData, 'vaultType', 'Vault Type', failedFields, 'erc4626Properties.vaultType');
  
  // Check boolean properties
  checkBooleanProperty(originalProps, updatedProps, formData, 'isMintable', 'Mintable', failedFields, 'erc4626Properties.isMintable');
  checkBooleanProperty(originalProps, updatedProps, formData, 'isBurnable', 'Burnable', failedFields, 'erc4626Properties.isBurnable');
  checkBooleanProperty(originalProps, updatedProps, formData, 'isPausable', 'Pausable', failedFields, 'erc4626Properties.isPausable');
  
  // Check strategy configuration
  checkStringProperty(originalProps, updatedProps, formData, 'vaultStrategy', 'Vault Strategy', failedFields, 'erc4626Properties.vaultStrategy');
  checkBooleanProperty(originalProps, updatedProps, formData, 'customStrategy', 'Custom Strategy', failedFields, 'erc4626Properties.customStrategy');
}

/**
 * Check ERC1400-specific properties for differences
 */
function checkERC1400Properties(
  originalToken: EnhancedTokenData,
  updatedToken: EnhancedTokenData,
  formData: any,
  failedFields: FailedSaveField[]
): void {
  const originalProps: Record<string, any> = originalToken.erc1400Properties || {};
  const updatedProps: Record<string, any> = updatedToken.erc1400Properties || {};
  
  // Check issuance type
  checkStringProperty(originalProps, updatedProps, formData, 'issuanceType', 'Issuance Type', failedFields, 'erc1400Properties.issuanceType');
  
  // Check certificate activation
  checkBooleanProperty(originalProps, updatedProps, formData, 'certificateActivated', 'Certificate Activated', failedFields, 'erc1400Properties.certificateActivated');
  
  // Check granularity
  checkStringProperty(originalProps, updatedProps, formData, 'granularity', 'Granularity', failedFields, 'erc1400Properties.granularity');
  
  // Check boolean properties
  checkBooleanProperty(originalProps, updatedProps, formData, 'isMintable', 'Mintable', failedFields, 'erc1400Properties.isMintable');
  checkBooleanProperty(originalProps, updatedProps, formData, 'isBurnable', 'Burnable', failedFields, 'erc1400Properties.isBurnable');
  checkBooleanProperty(originalProps, updatedProps, formData, 'isPausable', 'Pausable', failedFields, 'erc1400Properties.isPausable');
  checkBooleanProperty(originalProps, updatedProps, formData, 'isControllable', 'Controllable', failedFields, 'erc1400Properties.isControllable');
}

/**
 * Helper function to check boolean properties
 */
function checkBooleanProperty(
  originalProps: Record<string, any>,
  updatedProps: Record<string, any>,
  formData: any,
  fieldName: string,
  displayName: string,
  failedFields: FailedSaveField[],
  path: string
): void {
  if (formData[fieldName] !== undefined && formData[fieldName] !== updatedProps[fieldName]) {
    failedFields.push({
      fieldName,
      displayName,
      oldValue: originalProps[fieldName],
      newValue: formData[fieldName],
      path
    });
  }
}

/**
 * Helper function to check string properties
 */
function checkStringProperty(
  originalProps: Record<string, any>,
  updatedProps: Record<string, any>,
  formData: any,
  fieldName: string,
  displayName: string,
  failedFields: FailedSaveField[],
  path: string
): void {
  if (formData[fieldName] !== undefined && formData[fieldName] !== updatedProps[fieldName]) {
    failedFields.push({
      fieldName,
      displayName,
      oldValue: originalProps[fieldName],
      newValue: formData[fieldName],
      path
    });
  }
} 