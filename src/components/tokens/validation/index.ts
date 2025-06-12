/**
 * Token Validation - Exports all validation schemas and functions
 * 
 * This file provides comprehensive validation for all token standards
 * using Zod schemas that align with the database schema and form structures.
 */

// Base validation schemas
export { tokenBaseSchema, tokenMetadataSchema, blockchainConfigSchema } from './schemas/base';

// Standard-specific validation schemas
export { erc20MinSchema, erc20MaxSchema, validateERC20Token } from './schemas/erc20';
export { erc721MinSchema, erc721MaxSchema, validateERC721Token } from './schemas/erc721';
export { erc1155MinSchema, erc1155MaxSchema, validateERC1155Token } from './schemas/erc1155';
export { erc1400MinSchema, erc1400MaxSchema, validateERC1400Token } from './schemas/erc1400';
export { erc3525MinSchema, erc3525MaxSchema, validateERC3525Token } from './schemas/erc3525';
export { erc4626MinSchema, erc4626MaxSchema, validateERC4626Token } from './schemas/erc4626';

// Validation utilities
export { 
  validateTokenField,
  validateTokenForm,
  validateStandardSpecificData,
  createValidationSchema,
  getValidationErrors
} from './utils';

// Types for validation results
export type { 
  ValidationResult,
  ValidationError,
  FieldValidationResult,
  SchemaValidationOptions
} from './types';
