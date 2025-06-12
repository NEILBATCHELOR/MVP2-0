/**
 * Token Validation Helpers
 * 
 * Utility functions for validating token data before submission
 */

import { TokenStandard } from '@/types/core/centralModels';
import { TokenFormData } from '../types';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  fieldErrors?: Record<string, string[]>;
}

/**
 * Check for missing critical fields in token data
 * 
 * @param tokenData - Token form data to validate
 * @returns Array of missing field names
 */
export function checkMissingCriticalFields(tokenData: Partial<TokenFormData>): string[] {
  const missingFields: string[] = [];
  
  // Required fields for all token standards
  if (!tokenData.name?.trim()) {
    missingFields.push('name');
  }
  
  if (!tokenData.symbol?.trim()) {
    missingFields.push('symbol');
  }
  
  if (!tokenData.standard) {
    missingFields.push('standard');
  }
  
  // Standard-specific required fields
  if (tokenData.standard) {
    switch (tokenData.standard) {
      case TokenStandard.ERC20:
        if (!tokenData.initialSupply?.trim()) {
          missingFields.push('initialSupply');
        }
        break;
        
      case TokenStandard.ERC721:
        if (!tokenData.baseUri?.trim()) {
          missingFields.push('baseUri');
        }
        break;
        
      case TokenStandard.ERC1155:
        if (!tokenData.baseUri?.trim()) {
          missingFields.push('baseUri');
        }
        break;
        
      case TokenStandard.ERC1400:
        if (!tokenData.initialSupply?.trim()) {
          missingFields.push('initialSupply');
        }
        if (!tokenData.issuingJurisdiction?.trim()) {
          missingFields.push('issuingJurisdiction');
        }
        break;
        
      case TokenStandard.ERC3525:
        if (!tokenData.baseUri?.trim()) {
          missingFields.push('baseUri');
        }
        if (tokenData.valueDecimals === undefined || tokenData.valueDecimals < 0) {
          missingFields.push('valueDecimals');
        }
        break;
        
      case TokenStandard.ERC4626:
        if (!tokenData.assetAddress?.trim()) {
          missingFields.push('assetAddress');
        }
        if (!tokenData.assetName?.trim()) {
          missingFields.push('assetName');
        }
        if (!tokenData.assetSymbol?.trim()) {
          missingFields.push('assetSymbol');
        }
        break;
    }
  }
  
  return missingFields;
}

/**
 * Validate token data before submission
 * 
 * @param tokenData - Token form data to validate
 * @param configMode - Configuration mode ('min' or 'max')
 * @param context - Logging context
 * @returns Validation result
 */
export function validateTokenBeforeSubmission(
  tokenData: Partial<TokenFormData>,
  configMode: 'min' | 'max' | 'basic' | 'advanced',
  context: string = 'TokenValidation'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fieldErrors: Record<string, string[]> = {};
  
  try {
    // Check for missing critical fields
    const missingFields = checkMissingCriticalFields(tokenData);
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      missingFields.forEach(field => {
        fieldErrors[field] = ['This field is required'];
      });
    }
    
    // Validate name and symbol format
    if (tokenData.name) {
      if (tokenData.name.length < 2) {
        errors.push('Token name must be at least 2 characters long');
        fieldErrors['name'] = ['Must be at least 2 characters long'];
      }
      if (tokenData.name.length > 100) {
        errors.push('Token name must be less than 100 characters');
        fieldErrors['name'] = ['Must be less than 100 characters'];
      }
    }
    
    if (tokenData.symbol) {
      if (tokenData.symbol.length < 2) {
        errors.push('Token symbol must be at least 2 characters long');
        fieldErrors['symbol'] = ['Must be at least 2 characters long'];
      }
      if (tokenData.symbol.length > 20) {
        errors.push('Token symbol must be less than 20 characters');
        fieldErrors['symbol'] = ['Must be less than 20 characters'];
      }
      if (!/^[A-Z0-9]+$/.test(tokenData.symbol)) {
        warnings.push('Token symbol should contain only uppercase letters and numbers');
      }
    }
    
    // Validate decimals
    if (tokenData.decimals !== undefined) {
      if (tokenData.decimals < 0 || tokenData.decimals > 18) {
        errors.push('Decimals must be between 0 and 18');
        fieldErrors['decimals'] = ['Must be between 0 and 18'];
      }
    }
    
    // Standard-specific validation
    if (tokenData.standard) {
      const standardErrors = validateStandardSpecificFields(tokenData, configMode);
      errors.push(...standardErrors.errors);
      warnings.push(...(standardErrors.warnings || []));
      Object.entries(standardErrors.fieldErrors || {}).forEach(([field, fieldError]) => {
        fieldErrors[field] = fieldError;
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      fieldErrors
    };
  } catch (error) {
    console.error(`[ERROR][${context}] Validation error:`, error);
    return {
      valid: false,
      errors: ['An unexpected error occurred during validation'],
      warnings,
      fieldErrors
    };
  }
}

/**
 * Validate standard-specific fields
 * 
 * @param tokenData - Token form data
 * @param configMode - Configuration mode
 * @returns Validation result
 */
function validateStandardSpecificFields(
  tokenData: Partial<TokenFormData>,
  configMode: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fieldErrors: Record<string, string[]> = {};
  
  switch (tokenData.standard) {
    case TokenStandard.ERC20:
      // Validate initial supply
      if (tokenData.initialSupply) {
        try {
          const supply = parseFloat(tokenData.initialSupply);
          if (isNaN(supply) || supply <= 0) {
            errors.push('Initial supply must be a positive number');
            fieldErrors['initialSupply'] = ['Must be a positive number'];
          }
        } catch {
          errors.push('Initial supply must be a valid number');
          fieldErrors['initialSupply'] = ['Must be a valid number'];
        }
      }
      
      // Validate cap if provided
      if (tokenData.cap) {
        try {
          const cap = parseFloat(tokenData.cap);
          const supply = parseFloat(tokenData.initialSupply || '0');
          if (isNaN(cap) || cap <= 0) {
            errors.push('Cap must be a positive number');
            fieldErrors['cap'] = ['Must be a positive number'];
          } else if (cap < supply) {
            errors.push('Cap must be greater than or equal to initial supply');
            fieldErrors['cap'] = ['Must be greater than or equal to initial supply'];
          }
        } catch {
          errors.push('Cap must be a valid number');
          fieldErrors['cap'] = ['Must be a valid number'];
        }
      }
      break;
      
    case TokenStandard.ERC721:
      // Validate base URI
      if (tokenData.baseUri && !isValidURI(tokenData.baseUri)) {
        warnings.push('Base URI should be a valid URL');
      }
      
      // Validate max supply if provided
      if (tokenData.maxSupply) {
        try {
          const maxSupply = parseInt(tokenData.maxSupply);
          if (isNaN(maxSupply) || maxSupply <= 0) {
            errors.push('Max supply must be a positive integer');
            fieldErrors['maxSupply'] = ['Must be a positive integer'];
          }
        } catch {
          errors.push('Max supply must be a valid integer');
          fieldErrors['maxSupply'] = ['Must be a valid integer'];
        }
      }
      
      // Validate royalty percentage
      if (tokenData.royaltyPercentage) {
        try {
          const royalty = parseFloat(tokenData.royaltyPercentage);
          if (isNaN(royalty) || royalty < 0 || royalty > 100) {
            errors.push('Royalty percentage must be between 0 and 100');
            fieldErrors['royaltyPercentage'] = ['Must be between 0 and 100'];
          }
        } catch {
          errors.push('Royalty percentage must be a valid number');
          fieldErrors['royaltyPercentage'] = ['Must be a valid number'];
        }
      }
      break;
      
    case TokenStandard.ERC1155:
      // Validate base URI
      if (tokenData.baseUri && !isValidURI(tokenData.baseUri)) {
        warnings.push('Base URI should be a valid URL');
      }
      break;
      
    case TokenStandard.ERC1400:
      // Validate initial supply
      if (tokenData.initialSupply) {
        try {
          const supply = parseFloat(tokenData.initialSupply);
          if (isNaN(supply) || supply <= 0) {
            errors.push('Initial supply must be a positive number');
            fieldErrors['initialSupply'] = ['Must be a positive number'];
          }
        } catch {
          errors.push('Initial supply must be a valid number');
          fieldErrors['initialSupply'] = ['Must be a valid number'];
        }
      }
      
      // Validate partitions if provided
      if (tokenData.partitions && Array.isArray(tokenData.partitions)) {
        tokenData.partitions.forEach((partition, index) => {
          if (!partition.name?.trim()) {
            errors.push(`Partition ${index + 1} name is required`);
          }
          if (!partition.amount?.trim()) {
            errors.push(`Partition ${index + 1} amount is required`);
          }
        });
      }
      break;
      
    case TokenStandard.ERC3525:
      // Validate base URI
      if (tokenData.baseUri && !isValidURI(tokenData.baseUri)) {
        warnings.push('Base URI should be a valid URL');
      }
      
      // Validate value decimals
      if (tokenData.valueDecimals !== undefined) {
        if (tokenData.valueDecimals < 0 || tokenData.valueDecimals > 18) {
          errors.push('Value decimals must be between 0 and 18');
          fieldErrors['valueDecimals'] = ['Must be between 0 and 18'];
        }
      }
      
      // Validate slots if provided
      if (tokenData.slots && Array.isArray(tokenData.slots)) {
        tokenData.slots.forEach((slot, index) => {
          if (!slot.name?.trim()) {
            errors.push(`Slot ${index + 1} name is required`);
          }
          if (!slot.id?.trim()) {
            errors.push(`Slot ${index + 1} ID is required`);
          }
        });
      }
      break;
      
    case TokenStandard.ERC4626:
      // Validate asset address
      if (tokenData.assetAddress && !isValidAddress(tokenData.assetAddress)) {
        errors.push('Asset address must be a valid Ethereum address');
        fieldErrors['assetAddress'] = ['Must be a valid Ethereum address'];
      }
      
      // Validate asset decimals
      if (tokenData.assetDecimals !== undefined) {
        if (tokenData.assetDecimals < 0 || tokenData.assetDecimals > 18) {
          errors.push('Asset decimals must be between 0 and 18');
          fieldErrors['assetDecimals'] = ['Must be between 0 and 18'];
        }
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fieldErrors
  };
}

/**
 * Format validation errors for display
 * 
 * @param errors - Array of error strings
 * @returns Formatted error messages
 */
export function formatValidationErrors(errors: string[]): string[] {
  return errors.map(error => {
    // Capitalize first letter and ensure proper punctuation
    const formatted = error.charAt(0).toUpperCase() + error.slice(1);
    return formatted.endsWith('.') ? formatted : formatted + '.';
  });
}

/**
 * Format validation errors by field for detailed display
 * 
 * @param validationResult - Validation result with field errors
 * @returns Formatted errors grouped by field
 */
export function formatValidationErrorsByField(validationResult: ValidationResult): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};
  
  if (validationResult.fieldErrors) {
    Object.entries(validationResult.fieldErrors).forEach(([field, errors]) => {
      formattedErrors[field] = formatValidationErrors(errors);
    });
  }
  
  return formattedErrors;
}

/**
 * Check if a string is a valid URI
 * 
 * @param uri - String to validate
 * @returns True if valid URI
 */
function isValidURI(uri: string): boolean {
  try {
    new URL(uri);
    return true;
  } catch {
    // Also allow IPFS URIs
    return uri.startsWith('ipfs://') || uri.startsWith('ar://');
  }
}

/**
 * Check if a string is a valid Ethereum address
 * 
 * @param address - String to validate
 * @returns True if valid address
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
