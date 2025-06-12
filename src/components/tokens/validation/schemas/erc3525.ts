/**
 * ERC-3525 Token Validation Schemas
 * 
 * Validation schemas for ERC-3525 semi-fungible tokens
 */

import { z } from 'zod';
import { tokenBaseSchema, decimalsSchema, urlSchema, booleanFlagsSchema } from './base';
import { ValidationResult } from '../types';
import { TokenFormData } from '../../types';

// Slot schema
const slotSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Slot name is required'),
  description: z.string().optional(),
  valueUnits: z.string().optional()
});

// Allocation schema
const allocationSchema = z.object({
  slotId: z.string(),
  tokenId: z.string(),
  value: z.string().regex(/^\d+$/, 'Value must be a number'),
  recipient: z.string().optional()
});

// Base ERC-3525 properties
const erc3525PropertiesBaseSchema = z.object({
  valueDecimals: decimalsSchema.default(0),
  baseUri: urlSchema,
  metadataStorage: z.enum(['ipfs', 'arweave', 'centralized']).default('ipfs'),
  slotType: z.enum(['generic', 'time', 'category', 'financial']).default('generic'),
  isBurnable: z.boolean().default(false),
  isPausable: z.boolean().default(false),
  slotApprovals: z.boolean().default(true),
  valueApprovals: z.boolean().default(true),
  accessControl: z.enum(['ownable', 'roles', 'none']).default('ownable'),
  updatableUris: z.boolean().default(false),
  updatableSlots: z.boolean().default(false),
  valueTransfersEnabled: z.boolean().default(true),
  mergable: z.boolean().default(false),
  splittable: z.boolean().default(false)
});

// ERC-3525 Min Schema
export const erc3525MinSchema = tokenBaseSchema.extend({
  decimals: decimalsSchema.default(0),
  erc3525Properties: erc3525PropertiesBaseSchema.partial().optional(),
  slots: z.array(slotSchema).min(1, 'At least one slot is required').optional(),
  
  // Backward compatibility
  baseUri: urlSchema,
  valueDecimals: decimalsSchema.default(0)
});

// ERC-3525 Max Schema
export const erc3525MaxSchema = erc3525MinSchema.extend({
  erc3525Properties: erc3525PropertiesBaseSchema.optional(),
  erc3525Slots: z.array(slotSchema).optional(),
  erc3525Allocations: z.array(allocationSchema).optional(),
  financialInstrument: z.enum(['derivative', 'structured_product', 'fractional_ownership', 'multi_class_share']).optional(),
  derivativeTerms: z.object({
    expiryDate: z.string().optional(),
    strikePrice: z.string().optional(),
    underlyingAsset: z.string().optional()
  }).optional()
});

export function validateERC3525Token(data: TokenFormData, configMode: 'min' | 'max' = 'min'): ValidationResult {
  try {
    const schema = configMode === 'max' ? erc3525MaxSchema : erc3525MinSchema;
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
