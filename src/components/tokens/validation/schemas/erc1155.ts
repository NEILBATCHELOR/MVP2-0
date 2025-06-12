/**
 * ERC-1155 Token Validation Schemas
 * 
 * Validation schemas for ERC-1155 multi-token standard
 */

import { z } from 'zod';
import { tokenBaseSchema, booleanFlagsSchema, urlSchema, percentageSchema, ethereumAddressSchema } from './base';
import { ValidationResult } from '../types';
import { TokenFormData } from '../../types';

// Token type schema for ERC-1155
const tokenTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Token type name is required'),
  supply: z.string().regex(/^\d+$/, 'Supply must be a number'),
  fungible: z.boolean().default(false),
  rarityLevel: z.enum(['common', 'uncommon', 'rare', 'legendary']).optional()
});

// Base ERC-1155 properties
const erc1155PropertiesBaseSchema = z.object({
  baseUri: urlSchema,
  metadataStorage: z.enum(['ipfs', 'arweave', 'centralized']).default('ipfs'),
  batchMinting: z.boolean().default(true),
  hasRoyalty: z.boolean().default(false),
  royaltyPercentage: percentageSchema.optional(),
  royaltyReceiver: ethereumAddressSchema,
  supplyTracking: z.boolean().default(true),
  isBurnable: z.boolean().default(false),
  isPausable: z.boolean().default(false),
  enableApprovalForAll: z.boolean().default(true),
  updatableUris: z.boolean().default(false),
  dynamicUris: z.boolean().default(false),
  accessControl: z.enum(['ownable', 'roles', 'none']).default('ownable')
});

// ERC-1155 Min Schema
export const erc1155MinSchema = tokenBaseSchema.extend({
  decimals: z.literal(0).default(0),
  erc1155Properties: erc1155PropertiesBaseSchema.partial().optional(),
  tokenTypes: z.array(tokenTypeSchema).min(1, 'At least one token type is required').optional(),
  
  // Backward compatibility
  baseUri: urlSchema,
  hasRoyalty: z.boolean().default(false),
  supplyTracking: z.boolean().default(true)
});

// ERC-1155 Max Schema
export const erc1155MaxSchema = erc1155MinSchema.extend({
  erc1155Properties: erc1155PropertiesBaseSchema.optional(),
  erc1155Types: z.array(tokenTypeSchema).optional(),
  containerEnabled: z.boolean().default(false),
  batchMintingConfig: z.record(z.any()).optional(),
  transferRestrictions: z.record(z.any()).optional()
});

export function validateERC1155Token(data: TokenFormData, configMode: 'min' | 'max' = 'min'): ValidationResult {
  try {
    const schema = configMode === 'max' ? erc1155MaxSchema : erc1155MinSchema;
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.errors.forEach(error => {
        const path = error.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(error.message);
      });
      return { isValid: false, errors, warnings: {} };
    }
    
    return { isValid: true, errors: {}, warnings: {}, data: result.data };
  } catch (error) {
    return {
      isValid: false,
      errors: { general: [error instanceof Error ? error.message : 'Validation failed'] },
      warnings: {}
    };
  }
}
