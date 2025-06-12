/**
 * Validation Utilities
 * 
 * Utility functions for token validation, field validation, and error handling
 */

import { TokenStandard } from '@/types/core/centralModels';
import { TokenFormData } from '../types';
import { ValidationResult, FieldValidationResult, ValidationContext } from './types';

// Import validation functions for each standard
import { validateERC20Token } from './schemas/erc20';
import { validateERC721Token } from './schemas/erc721';
import { validateERC1155Token } from './schemas/erc1155';
import { validateERC1400Token } from './schemas/erc1400';
import { validateERC3525Token } from './schemas/erc3525';
import { validateERC4626Token } from './schemas/erc4626';

/**
 * Validate token form data based on standard and configuration mode
 */
export function validateTokenForm(
  data: TokenFormData, 
  standard?: TokenStandard, 
  configMode: 'min' | 'max' = 'min'
): ValidationResult {
  const tokenStandard = standard || data.standard;
  
  switch (tokenStandard) {
    case TokenStandard.ERC20:
      return validateERC20Token(data, configMode);
    case TokenStandard.ERC721:
      return validateERC721Token(data, configMode);
    case TokenStandard.ERC1155:
      return validateERC1155Token(data, configMode);
    case TokenStandard.ERC1400:
      return validateERC1400Token(data, configMode);
    case TokenStandard.ERC3525:
      return validateERC3525Token(data, configMode);
    case TokenStandard.ERC4626:
      return validateERC4626Token(data, configMode);
    default:
      return {
        isValid: false,
        errors: { standard: ['Unsupported token standard'] },
        warnings: {}
      };
  }
}

/**
 * Validate a specific field in isolation
 */
export function validateTokenField(
  field: string, 
  value: any, 
  standard: TokenStandard, 
  configMode: 'min' | 'max' = 'min'
): string[] {
  try {
    // Create a minimal form data object for validation
    const mockData: Partial<TokenFormData> = {
      [field]: value,
      standard,
      name: 'Test Token',
      symbol: 'TEST'
    };
    
    const result = validateTokenForm(mockData as TokenFormData, standard, configMode);
    
    // Return errors specific to this field
    return result.errors[field] || [];
  } catch (error) {
    return [error instanceof Error ? error.message : 'Field validation failed'];
  }
}

/**
 * Validate standard-specific data separately from base token data
 */
export function validateStandardSpecificData(
  data: Record<string, any>,
  standard: TokenStandard,
  configMode: 'min' | 'max' = 'min'
): ValidationResult {
  try {
    // Create a complete form data object for validation
    const formData: TokenFormData = {
      name: 'Validation Token',
      symbol: 'VAL',
      decimals: standard === TokenStandard.ERC721 || standard === TokenStandard.ERC1155 ? 0 : 18,
      standard,
      ...data
    };
    
    return validateTokenForm(formData, standard, configMode);
  } catch (error) {
    return {
      isValid: false,
      errors: { general: [error instanceof Error ? error.message : 'Validation failed'] },
      warnings: {}
    };
  }
}

/**
 * Create a validation schema for a specific token standard and configuration mode
 */
export function createValidationSchema(standard: TokenStandard, configMode: 'min' | 'max' = 'min') {
  return {
    validate: (data: TokenFormData) => validateTokenForm(data, standard, configMode),
    validateField: (field: string, value: any) => validateTokenField(field, value, standard, configMode)
  };
}

/**
 * Extract and format validation errors into a user-friendly format
 */
export function getValidationErrors(result: ValidationResult): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];
  
  Object.entries(result.errors).forEach(([field, messages]) => {
    messages.forEach(message => {
      errors.push({ field, message });
    });
  });
  
  return errors;
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(results: ValidationResult[]): ValidationResult {
  const combinedErrors: Record<string, string[]> = {};
  const combinedWarnings: Record<string, string[]> = {};
  let isValid = true;
  
  results.forEach(result => {
    if (!result.isValid) {
      isValid = false;
    }
    
    // Merge errors
    Object.entries(result.errors).forEach(([field, messages]) => {
      if (!combinedErrors[field]) {
        combinedErrors[field] = [];
      }
      combinedErrors[field].push(...messages);
    });
    
    // Merge warnings
    Object.entries(result.warnings).forEach(([field, messages]) => {
      if (!combinedWarnings[field]) {
        combinedWarnings[field] = [];
      }
      combinedWarnings[field].push(...messages);
    });
  });
  
  return {
    isValid,
    errors: combinedErrors,
    warnings: combinedWarnings
  };
}

/**
 * Validate required fields based on token standard
 */
export function validateRequiredFields(data: TokenFormData, standard: TokenStandard): ValidationResult {
  const errors: Record<string, string[]> = {};
  
  // Base required fields for all standards
  if (!data.name) {
    errors.name = ['Token name is required'];
  }
  
  if (!data.symbol) {
    errors.symbol = ['Token symbol is required'];
  }
  
  // Standard-specific required fields
  switch (standard) {
    case TokenStandard.ERC20:
      if (typeof data.decimals !== 'number') {
        errors.decimals = ['Decimals is required for ERC-20 tokens'];
      }
      break;
      
    case TokenStandard.ERC721:
      if (!data.baseUri && !data.erc721Properties?.baseUri) {
        errors.baseUri = ['Base URI is required for ERC-721 tokens'];
      }
      break;
      
    case TokenStandard.ERC1155:
      if (!data.baseUri && !data.erc1155Properties?.baseUri) {
        errors.baseUri = ['Base URI is required for ERC-1155 tokens'];
      }
      break;
      
    case TokenStandard.ERC1400:
      if (!data.initialSupply && !data.erc1400Properties?.initialSupply) {
        errors.initialSupply = ['Initial supply is required for ERC-1400 tokens'];
      }
      break;
      
    case TokenStandard.ERC3525:
      if (!data.baseUri && !data.erc3525Properties?.baseUri) {
        errors.baseUri = ['Base URI is required for ERC-3525 tokens'];
      }
      break;
      
    case TokenStandard.ERC4626:
      if (!data.assetAddress && !data.erc4626Properties?.assetAddress) {
        errors.assetAddress = ['Asset address is required for ERC-4626 tokens'];
      }
      break;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: {}
  };
}

/**
 * Validate business rules (cross-field validation)
 */
export function validateBusinessRules(data: TokenFormData, context?: ValidationContext): ValidationResult {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  
  // Check for conflicting configurations
  if (data.isMintable && data.cap && data.initialSupply) {
    const initialSupply = BigInt(data.initialSupply);
    const cap = BigInt(data.cap);
    
    if (initialSupply >= cap) {
      errors.cap = ['Cap must be greater than initial supply for mintable tokens'];
    }
  }
  
  // Check royalty configuration
  if (data.hasRoyalty) {
    if (!data.royaltyPercentage) {
      errors.royaltyPercentage = ['Royalty percentage is required when royalties are enabled'];
    } else {
      const percentage = parseFloat(data.royaltyPercentage);
      if (percentage > 10) {
        warnings.royaltyPercentage = ['Royalty percentage above 10% may reduce marketplace adoption'];
      }
    }
    
    if (!data.royaltyReceiver) {
      errors.royaltyReceiver = ['Royalty receiver address is required when royalties are enabled'];
    }
  }
  
  // Check governance configuration
  if (data.governanceFeatures?.enabled) {
    if (!data.snapshot) {
      warnings.snapshot = ['Snapshot functionality is recommended for governance tokens'];
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Debounced validation for real-time form validation
 */
export function createDebouncedValidator(
  validator: (data: TokenFormData) => ValidationResult,
  delayMs: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (data: TokenFormData): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        const result = validator(data);
        resolve(result);
      }, delayMs);
    });
  };
}
