/**
 * Validation Types
 * 
 * TypeScript interfaces and types for token validation functionality
 */

import { z } from 'zod';
import { TokenStandard } from '@/types/core/centralModels';

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  data?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Schema validation options
export interface SchemaValidationOptions {
  standard: TokenStandard;
  configMode: 'min' | 'max';
  skipOptionalFields?: boolean;
  allowUnknownFields?: boolean;
  transformData?: boolean;
}

// Field validation options
export interface FieldValidationOptions {
  standard: TokenStandard;
  configMode: 'min' | 'max';
  fieldPath: string;
  context?: Record<string, any>;
}

// Validation schema types
export type TokenValidationSchema = z.ZodSchema<any>;

export interface ValidationSchemaConfig {
  baseSchema: TokenValidationSchema;
  minSchema: TokenValidationSchema;
  maxSchema: TokenValidationSchema;
}

// Standard-specific validation schemas
export interface StandardValidationSchemas {
  [TokenStandard.ERC20]: ValidationSchemaConfig;
  [TokenStandard.ERC721]: ValidationSchemaConfig;
  [TokenStandard.ERC1155]: ValidationSchemaConfig;
  [TokenStandard.ERC1400]: ValidationSchemaConfig;
  [TokenStandard.ERC3525]: ValidationSchemaConfig;
  [TokenStandard.ERC4626]: ValidationSchemaConfig;
}

// Validation context for complex validations
export interface ValidationContext {
  standard: TokenStandard;
  configMode: 'min' | 'max';
  projectId?: string;
  existingTokens?: any[];
  databaseConstraints?: Record<string, any>;
  blockchainLimits?: Record<string, any>;
}

// Custom validation functions
export type CustomValidationFunction = (
  value: any,
  context: ValidationContext
) => FieldValidationResult;

export interface CustomValidationRule {
  field: string;
  validator: CustomValidationFunction;
  message?: string;
  severity: 'error' | 'warning';
}

// Validation pipeline configuration
export interface ValidationPipelineConfig {
  schemas: ValidationSchemaConfig;
  customRules: CustomValidationRule[];
  businessRules: BusinessRule[];
  databaseConstraints: DatabaseConstraint[];
}

// Business rule types
export interface BusinessRule {
  name: string;
  description: string;
  validator: (data: any, context: ValidationContext) => ValidationResult;
  applicableStandards: TokenStandard[];
  configModes: ('min' | 'max')[];
}

// Database constraint types
export interface DatabaseConstraint {
  field: string;
  constraint: 'unique' | 'foreign_key' | 'check' | 'not_null' | 'length';
  parameters?: Record<string, any>;
  message?: string;
}

// Real-time validation options
export interface RealTimeValidationOptions {
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showWarnings?: boolean;
  highlightErrors?: boolean;
}

// Validation state for forms
export interface ValidationState {
  isValidating: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  touchedFields: Set<string>;
  validatedFields: Set<string>;
}

// Async validation types for complex checks
export interface AsyncValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  isLoading: boolean;
}

export type AsyncValidationFunction = (
  value: any,
  context: ValidationContext
) => Promise<AsyncValidationResult>;
