/**
 * Form Error Parser
 * Provides validation functions for token forms
 */

import { ValidationResult } from './types';

/**
 * Validate form data against a Zod schema
 */
export function validateForm(schema: any, data: any): ValidationResult & { success: boolean } {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return {
        isValid: true,
        success: true,
        errors: {},
        warnings: {},
        data: result.data
      };
    } else {
      // Convert Zod errors to the expected format
      const errors: Record<string, string[]> = {};
      
      result.error.issues.forEach((issue: any) => {
        const fieldPath = issue.path.join('.');
        if (!errors[fieldPath]) {
          errors[fieldPath] = [];
        }
        errors[fieldPath].push(issue.message);
      });
      
      return {
        isValid: false,
        success: false,
        errors,
        warnings: {}
      };
    }
  } catch (error) {
    return {
      isValid: false,
      success: false,
      errors: {
        general: [error instanceof Error ? error.message : 'Validation failed']
      },
      warnings: {}
    };
  }
}

/**
 * Parse validation errors into a user-friendly format
 */
export function parseValidationErrors(errors: any[]): string[] {
  return errors.map(error => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.path && error.message) {
      return `${error.path.join('.')}: ${error.message}`;
    }
    
    return error.message || 'Unknown validation error';
  });
}

/**
 * Check if form data is valid
 */
export function isFormValid(schema: any, data: any): boolean {
  try {
    const result = schema.safeParse(data);
    return result.success;
  } catch {
    return false;
  }
}
