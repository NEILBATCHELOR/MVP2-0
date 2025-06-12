/**
 * Token Data Validation Service
 * Provides validation functions for token data to ensure integrity
 * Uses Zod schemas for validation
 */
import { TokenFormData } from '../types';
import { TokenStandard } from '@/types/core/centralModels';
import {
  tokenBaseSchema,
  erc20Schema,
  erc721Schema,
  erc1155Schema,
  erc1400Schema,
  erc3525Schema,
  erc4626Schema
} from '../validation/schemas';
import { validateForm, parseValidationErrors } from '../validation/formErrorParser';
import { standardToEnum } from '../validation/schemaAdapters';

// Re-export the validation result interface to maintain API compatibility
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Re-export the validation error interface to maintain API compatibility
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Get the appropriate schema for a token standard
 * @param standard Token standard
 * @returns Zod schema for the token standard
 */
function getSchemaForStandard(standard: TokenStandard) {
  switch (standard) {
    case TokenStandard.ERC20:
      return erc20Schema;
    case TokenStandard.ERC721:
      return erc721Schema;
    case TokenStandard.ERC1155:
      return erc1155Schema;
    case TokenStandard.ERC1400:
      return erc1400Schema;
    case TokenStandard.ERC3525:
      return erc3525Schema;
    case TokenStandard.ERC4626:
      return erc4626Schema;
    default:
      return tokenBaseSchema;
  }
}

/**
 * Convert validation result to our ValidationResult format
 * @param validationResult Result from validateForm function
 * @returns ValidationResult with formatted errors
 */
function validationResultToValidationResult(validationResult: any): ValidationResult {
  if (validationResult.valid) {
    return { valid: true, errors: [] };
  }
  
  const validationErrors: ValidationError[] = validationResult.errors.map((errorMessage: string) => {
    // Parse field name from error message format "field.path: message"
    const parts = errorMessage.split(': ');
    if (parts.length >= 2) {
      return {
        field: parts[0],
        message: parts.slice(1).join(': ')
      };
    }
    
    return {
      field: 'general',
      message: errorMessage
    };
  });
  
  return {
    valid: false,
    errors: validationErrors
  };
}

/**
 * Validate token data using the appropriate schema
 * @param data Token data to validate
 * @param skipValidation Optional flag to skip validation (used during JSON upload)
 * @returns Validation result
 */
export function validateTokenData(
  data: Partial<TokenFormData>,
  skipValidation: boolean = false
): ValidationResult {
  // Basic validation first
  // If skipValidation is true, return valid immediately
  if (skipValidation) {
    return { valid: true, errors: [] };
  }
  
  // If data or standard is not defined, mark as invalid
  if (!data || !data.standard) {
    return { 
      valid: false, 
      errors: [{ field: 'standard', message: 'Token standard is required' }] 
    };
  }
  
  // Normalize standard format if needed
  if (typeof data.standard === 'string') {
    const standardMap = {
      'ERC20': TokenStandard.ERC20,
      'ERC-20': TokenStandard.ERC20,
      'ERC721': TokenStandard.ERC721,
      'ERC-721': TokenStandard.ERC721,
      'ERC1155': TokenStandard.ERC1155,
      'ERC-1155': TokenStandard.ERC1155,
      'ERC1400': TokenStandard.ERC1400,
      'ERC-1400': TokenStandard.ERC1400,
      'ERC3525': TokenStandard.ERC3525,
      'ERC-3525': TokenStandard.ERC3525,
      'ERC4626': TokenStandard.ERC4626,
      'ERC-4626': TokenStandard.ERC4626
    };
    
    // Try to map to a known standard
    const standardKey = data.standard as keyof typeof standardMap;
    if (standardMap[standardKey]) {
      data.standard = standardMap[standardKey];
    } else {
      // Standard might be already in the correct form
      // Check if it's a valid enum value
      if (!Object.values(TokenStandard).includes(data.standard as TokenStandard)) {
        return {
          valid: false,
          errors: [{ field: 'standard', message: `Invalid token standard: ${data.standard}` }]
        };
      }
    }
  }
  
  // Get the appropriate schema for this token standard
  const schema = getSchemaForStandard(data.standard as TokenStandard);
  
  // Pre-process data for validation
  // Map config_mode values to schema-compatible ones
  let configMode = 'max';
  if (data.config_mode) {
    // Map UI values to database values
    if (data.config_mode === 'basic') {
      configMode = 'min';
    } else if (data.config_mode === 'advanced') {
      configMode = 'max';
    } else if (data.config_mode === 'min' || data.config_mode === 'max') {
      configMode = data.config_mode;
    }
  }
  
  // Add config_mode if not present to satisfy discriminated union
  const processedData = {
    ...data,
    config_mode: configMode
  };
  
  // Perform validation using the Zod schema
  const validationResult = validateForm(schema, processedData);
  
  // Convert validation result to our ValidationResult format
  return validationResultToValidationResult(validationResult);
}

/**
 * Validate batch token data
 * @param tokensData Array of token data to validate
 * @returns Array of validation results with index
 */
export function validateBatchTokenData(
  tokensData: Partial<TokenFormData>[]
): { index: number; tokenData: Partial<TokenFormData>; validation: ValidationResult }[] {
  return tokensData.map((tokenData, index) => ({
    index,
    tokenData,
    validation: validateTokenData(tokenData)
  }));
}

/**
 * Get error summary for batch validation
 * @param validationResults Array of validation results
 * @returns Summary of validation errors
 */
export function getBatchValidationSummary(
  validationResults: { index: number; tokenData: Partial<TokenFormData>; validation: ValidationResult }[]
): { valid: boolean; invalidCount: number; validCount: number; errors: any[] } {
  const invalidResults = validationResults.filter(result => !result.validation.valid);
  
  return {
    valid: invalidResults.length === 0,
    invalidCount: invalidResults.length,
    validCount: validationResults.length - invalidResults.length,
    errors: invalidResults.map(result => ({
      index: result.index,
      tokenName: result.tokenData.name || `Token ${result.index}`,
      errors: result.validation.errors
    }))
  };
} 