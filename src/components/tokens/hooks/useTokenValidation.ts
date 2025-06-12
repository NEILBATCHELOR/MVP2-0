/**
 * useTokenValidation Hook
 * 
 * React hook for token form validation using Zod schemas.
 * Provides real-time validation and error handling.
 */

import { useState, useCallback, useEffect } from 'react';
import { UseTokenValidationOptions, TokenValidationHookResult, ValidationResult } from './types';
import { TokenFormData } from '../types';
import { 
  validateERC20Token,
  validateERC721Token,
  validateERC1155Token,
  validateERC1400Token,
  validateERC3525Token,
  validateERC4626Token,
  validateTokenField
} from '../validation';
import { TokenStandard } from '@/types/core/centralModels';

export function useTokenValidation(options: UseTokenValidationOptions): TokenValidationHookResult {
  const {
    standard,
    configMode = 'min',
    validateOnChange = true,
    enabled = true
  } = options;

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Get the appropriate validator function based on standard
  const getValidator = useCallback((tokenStandard: TokenStandard) => {
    switch (tokenStandard) {
      case TokenStandard.ERC20:
        return validateERC20Token;
      case TokenStandard.ERC721:
        return validateERC721Token;
      case TokenStandard.ERC1155:
        return validateERC1155Token;
      case TokenStandard.ERC1400:
        return validateERC1400Token;
      case TokenStandard.ERC3525:
        return validateERC3525Token;
      case TokenStandard.ERC4626:
        return validateERC4626Token;
      default:
        return validateERC20Token; // Fallback to ERC20
    }
  }, []);

  // Validate entire form
  const validate = useCallback((data: TokenFormData): ValidationResult => {
    if (!enabled) {
      return { isValid: true, errors: {}, warnings: {} };
    }

    try {
      const validator = getValidator(data.standard);
      const result = validator(data, configMode);
      
      if (validateOnChange) {
        setErrors(result.errors);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      const validationErrors = { general: [errorMessage] };
      
      if (validateOnChange) {
        setErrors(validationErrors);
      }
      
      return {
        isValid: false,
        errors: validationErrors,
        warnings: {}
      };
    }
  }, [enabled, getValidator, configMode, validateOnChange]);

  // Validate single field
  const validateField = useCallback((field: string, value: any): string[] => {
    if (!enabled) return [];

    try {
      const fieldErrors = validateTokenField(field, value, standard, configMode);
      
      if (validateOnChange) {
        setErrors(prev => ({
          ...prev,
          [field]: fieldErrors
        }));
      }
      
      return fieldErrors;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Field validation failed';
      const fieldErrors = [errorMessage];
      
      if (validateOnChange) {
        setErrors(prev => ({
          ...prev,
          [field]: fieldErrors
        }));
      }
      
      return fieldErrors;
    }
  }, [enabled, standard, configMode, validateOnChange]);

  // Check if form data is valid
  const isValid = useCallback((data: TokenFormData): boolean => {
    const result = validate(data);
    return result.isValid;
  }, [validate]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Clear errors for specific field
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);

  // Clear errors when standard changes
  useEffect(() => {
    clearErrors();
  }, [standard, clearErrors]);

  return {
    validate,
    validateField,
    isValid,
    errors,
    clearErrors,
    clearFieldError
  };
}
