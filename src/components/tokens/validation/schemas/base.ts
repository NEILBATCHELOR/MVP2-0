/**
 * Base Token Validation Schemas
 * 
 * Common validation schemas used across all token standards
 */

import { z } from 'zod';
import { TokenStandard } from '@/types/core/centralModels';

// Ethereum address validation
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
  .optional();

// Token name validation
export const tokenNameSchema = z
  .string()
  .min(1, 'Token name is required')
  .max(100, 'Token name must be 100 characters or less')
  .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Token name contains invalid characters');

// Token symbol validation
export const tokenSymbolSchema = z
  .string()
  .min(1, 'Token symbol is required')
  .max(10, 'Token symbol must be 10 characters or less')
  .regex(/^[A-Z0-9]+$/, 'Token symbol must be uppercase letters and numbers only');

// Token description validation
export const tokenDescriptionSchema = z
  .string()
  .max(1000, 'Description must be 1000 characters or less')
  .optional();

// Decimals validation (for applicable standards)
export const decimalsSchema = z
  .number()
  .int('Decimals must be an integer')
  .min(0, 'Decimals cannot be negative')
  .max(18, 'Decimals cannot exceed 18');

// Supply validation (string to handle large numbers)
export const supplySchema = z
  .string()
  .regex(/^\d+$/, 'Supply must be a positive number')
  .refine((val) => BigInt(val) > 0, 'Supply must be greater than 0');

// Optional supply schema
export const optionalSupplySchema = z
  .string()
  .regex(/^\d+$/, 'Supply must be a positive number')
  .optional()
  .or(z.literal(''));

// Percentage validation (0-100)
export const percentageSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'Must be a valid percentage')
  .refine((val) => {
    const num = parseFloat(val);
    return num >= 0 && num <= 100;
  }, 'Percentage must be between 0 and 100');

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .optional()
  .or(z.literal(''));

// IPFS hash validation
export const ipfsHashSchema = z
  .string()
  .regex(/^Qm[a-zA-Z0-9]{44}$/, 'Invalid IPFS hash format')
  .optional();

// Base token metadata schema
export const tokenMetadataSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  external_url: z.string().optional(),
  animation_url: z.string().optional(),
  attributes: z.array(z.object({
    trait_type: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
    display_type: z.string().optional()
  })).optional(),
  background_color: z.string().optional(),
  youtube_url: z.string().optional()
}).optional();

// Blockchain configuration schema
export const blockchainConfigSchema = z.object({
  network: z.enum(['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism']).optional(),
  gasLimit: z.number().positive().optional(),
  gasPrice: z.string().optional(),
  deployer: ethereumAddressSchema,
  constructorArgs: z.array(z.any()).optional()
}).optional();

// Base token schema (common to all standards)
export const tokenBaseSchema = z.object({
  // Core required fields
  name: tokenNameSchema,
  symbol: tokenSymbolSchema,
  description: tokenDescriptionSchema,
  standard: z.nativeEnum(TokenStandard),
  
  // Optional metadata
  metadata: tokenMetadataSchema,
  blocks: z.record(z.any()).optional(),
  
  // Project association
  projectId: z.string().uuid('Invalid project ID').optional(),
  
  // Status and configuration
  status: z.enum(['draft', 'under_review', 'approved', 'deployed', 'paused']).optional(),
  configMode: z.enum(['min', 'max']).optional()
});

// Fee configuration schema (used by multiple standards)
export const feeConfigSchema = z.object({
  enabled: z.boolean().default(false),
  fee: percentageSchema.optional(),
  recipient: ethereumAddressSchema,
  type: z.enum(['flat', 'percentage']).optional()
}).optional();

// Access control schema
export const accessControlSchema = z.object({
  type: z.enum(['ownable', 'roles', 'none']).default('ownable'),
  owner: ethereumAddressSchema,
  admins: z.array(ethereumAddressSchema).optional(),
  roles: z.array(z.object({
    name: z.string(),
    addresses: z.array(ethereumAddressSchema)
  })).optional()
}).optional();

// Compliance configuration schema
export const complianceConfigSchema = z.object({
  enabled: z.boolean().default(false),
  kycRequired: z.boolean().optional(),
  amlChecks: z.boolean().optional(),
  geographicRestrictions: z.array(z.string()).optional(),
  reportingRequirements: z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually']).optional(),
    jurisdictions: z.array(z.string()).optional()
  }).optional()
}).optional();

// Common boolean flags schema
export const booleanFlagsSchema = z.object({
  isMintable: z.boolean().default(false),
  isBurnable: z.boolean().default(false),
  isPausable: z.boolean().default(false)
});

// Financial instrument configuration (for ERC3525, ERC1400, etc.)
export const financialInstrumentSchema = z.object({
  type: z.enum(['equity', 'debt', 'derivative', 'fund', 'commodity']).optional(),
  issuanceDate: z.string().optional(),
  maturityDate: z.string().optional(),
  interestRate: percentageSchema.optional(),
  currency: z.string().optional(),
  jurisdiction: z.string().optional()
}).optional();
