/**
 * useTokenForm Hook
 * 
 * React hook for managing token form state, validation, and submission.
 * Provides form utilities and integrates with validation schemas.
 */

import { useState, useCallback, useEffect } from 'react';
import { UseTokenFormOptions, TokenFormHookResult } from './types';
import { TokenFormData, EnhancedTokenData } from '../types';
import { TokenStandard } from '@/types/core/centralModels';
import { useTokenValidation } from './useTokenValidation';
import { createToken, updateToken } from '../services/tokenService';

// Default form data
const getDefaultFormData = (standard: TokenStandard = TokenStandard.ERC20): TokenFormData => ({
  name: '',
  symbol: '',
  description: '',
  decimals: 18,
  standard,
  blocks: {},
  metadata: {}
});

export function useTokenForm(options: UseTokenFormOptions = {}): TokenFormHookResult {
  const {
    initialData,
    validationMode = 'onChange',
    standard = TokenStandard.ERC20,
    configMode = 'min',
    enabled = true,
    onError,
    onSuccess
  } = options;

  // Initialize form data
  const [formData, setFormData] = useState<TokenFormData>(() => ({
    ...getDefaultFormData(standard),
    ...initialData
  }));

  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use validation hook
  const {
    validate,
    validateField,
    isValid: isFormValid,
    errors,
    clearErrors
  } = useTokenValidation({
    standard: formData.standard,
    configMode,
    validateOnChange: validationMode === 'onChange',
    enabled
  });

  // Handle input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Mark as dirty if value has changed
      if (prev[field as keyof TokenFormData] !== value) {
        setIsDirty(true);
      }

      // Validate field if onChange validation is enabled
      if (validationMode === 'onChange') {
        validateField(field, value);
      }

      return updated;
    });
  }, [validationMode, validateField]);

  // Handle nested field changes (e.g., "governanceFeatures.enabled")
  const handleNestedChange = useCallback((path: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev };
      const pathParts = path.split('.');
      
      // Navigate to the nested object
      let current: any = updated;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      
      // Set the final value
      const finalKey = pathParts[pathParts.length - 1];
      current[finalKey] = value;
      
      setIsDirty(true);

      // Validate field if onChange validation is enabled
      if (validationMode === 'onChange') {
        validateField(path, value);
      }

      return updated;
    });
  }, [validationMode, validateField]);

  // Reset form to initial state
  const reset = useCallback(() => {
    setFormData({
      ...getDefaultFormData(standard),
      ...initialData
    });
    setIsDirty(false);
    clearErrors();
  }, [standard, initialData, clearErrors]);

  // Submit form
  const submit = useCallback(async (projectId?: string, tokenId?: string): Promise<EnhancedTokenData> => {
    setIsSubmitting(true);

    try {
      // Always validate before submission
      const validationResult = validate(formData);
      
      if (!validationResult.isValid) {
        throw new Error('Form validation failed');
      }

      let result: EnhancedTokenData;

      if (tokenId) {
        // Update existing token
        const updateResult = await updateToken(tokenId, formData);
        result = {
          ...updateResult,
          standard: updateResult.standard as TokenStandard,
          blocks: (updateResult.blocks as Record<string, any>) || {},
          metadata: (updateResult.metadata as Record<string, any>) || {}
        };
      } else if (projectId) {
        // Create new token
        const createResult = await createToken(projectId, formData);
        result = {
          ...createResult,
          standard: createResult.standard as TokenStandard,
          blocks: (createResult.blocks as Record<string, any>) || {},
          metadata: (createResult.metadata as Record<string, any>) || {}
        };
      } else {
        throw new Error('Either projectId (for creation) or tokenId (for update) is required');
      }

      // Mark as clean after successful submission
      setIsDirty(false);
      clearErrors();

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Form submission failed');
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate, clearErrors, onSuccess, onError]);

  // Update form data when standard changes
  useEffect(() => {
    if (formData.standard !== standard) {
      setFormData(prev => ({
        ...prev,
        standard,
        // Reset standard-specific properties when standard changes
        blocks: {},
        metadata: {}
      }));
    }
  }, [standard, formData.standard]);

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData && !isDirty) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData, isDirty]);

  return {
    formData,
    setFormData,
    handleInputChange,
    handleNestedChange,
    reset,
    isDirty,
    isValid: isFormValid(formData) && !isSubmitting,
    errors,
    submit
  };
}
