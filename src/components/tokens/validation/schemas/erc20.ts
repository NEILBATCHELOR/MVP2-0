/**
 * ERC-20 Token Validation Schemas
 * 
 * Validation schemas for ERC-20 tokens in both min and max configurations
 */

import { z } from 'zod';
import { 
  tokenBaseSchema,
  decimalsSchema,
  supplySchema,
  optionalSupplySchema,
  booleanFlagsSchema,
  feeConfigSchema,
  accessControlSchema,
  complianceConfigSchema,
  ethereumAddressSchema,
  percentageSchema
} from './base';
import { ValidationResult } from '../types';
import { TokenFormData } from '../../types';

// ERC-20 specific schemas
const erc20PropertiesBaseSchema = z.object({
  // Supply management
  initialSupply: supplySchema,
  cap: optionalSupplySchema,
  
  // Token type classification
  tokenType: z.enum([
    'utility', 'security', 'governance', 'stablecoin', 
    'asset_backed', 'debt', 'share', 'commodity'
  ]).default('utility'),
  
  // Standard boolean flags
  ...booleanFlagsSchema.shape,
  
  // Access control
  accessControl: z.enum(['ownable', 'roles', 'none']).default('ownable'),
  
  // Advanced features
  allowanceManagement: z.boolean().default(false),
  permit: z.boolean().default(false),
  snapshot: z.boolean().default(false)
});

// Governance features schema
const governanceSchema = z.object({
  enabled: z.boolean().default(false),
  votingPeriod: z.string().regex(/^\d+$/, 'Must be a number').optional(),
  quorumPercentage: percentageSchema.optional(),
  proposalThreshold: z.string().regex(/^\d+$/, 'Must be a number').optional(),
  votingThreshold: z.string().regex(/^\d+$/, 'Must be a number').optional()
}).refine((data) => {
  if (data.enabled) {
    return data.votingPeriod && data.quorumPercentage;
  }
  return true;
}, {
  message: 'Voting period and quorum percentage are required when governance is enabled',
  path: ['governance']
});

// Fee on transfer schema
const feeOnTransferSchema = z.object({
  enabled: z.boolean().default(false),
  fee: percentageSchema.optional(),
  recipient: ethereumAddressSchema
}).refine((data) => {
  if (data.enabled) {
    return data.fee && data.recipient;
  }
  return true;
}, {
  message: 'Fee percentage and recipient are required when fee on transfer is enabled',
  path: ['feeOnTransfer']
});

// Rebasing schema
const rebasingSchema = z.object({
  enabled: z.boolean().default(false),
  mode: z.enum(['automatic', 'governance']).optional(),
  targetSupply: z.string().regex(/^\d+$/, 'Must be a number').optional()
}).refine((data) => {
  if (data.enabled) {
    return data.mode;
  }
  return true;
}, {
  message: 'Rebasing mode is required when rebasing is enabled',
  path: ['rebasing']
});

// Transfer configuration schema (for max config)
const transferConfigSchema = z.object({
  enabled: z.boolean().default(false),
  transferRestrictions: z.object({
    enabled: z.boolean().default(false),
    cooldownPeriod: z.number().min(0).optional(),
    maxTransferAmount: z.string().regex(/^\d+$/, 'Must be a number').optional(),
    maxTransfersPerDay: z.number().min(0).optional()
  }).optional(),
  blacklistEnabled: z.boolean().default(false),
  whitelistOnly: z.boolean().default(false),
  timeLocks: z.object({
    enabled: z.boolean().default(false),
    defaultLockPeriod: z.number().min(0).optional()
  }).optional()
}).optional();

// Gas configuration schema (for max config)
const gasConfigSchema = z.object({
  enabled: z.boolean().default(false),
  gasOptimization: z.object({
    enabled: z.boolean().default(false),
    batchTransactions: z.boolean().default(false),
    gasLimit: z.number().min(0).optional(),
    maxGasPrice: z.string().optional()
  }).optional(),
  gasDelegation: z.object({
    enabled: z.boolean().default(false),
    delegationAddress: ethereumAddressSchema,
    maxDelegatedGas: z.string().optional()
  }).optional()
}).optional();

// Whitelist configuration schema (for max config)
const whitelistConfigSchema = z.object({
  enabled: z.boolean().default(false),
  whitelistType: z.enum(['address', 'domain', 'country', 'mixed']).optional(),
  addresses: z.array(ethereumAddressSchema).optional(),
  domains: z.array(z.string()).optional(),
  allowedCountries: z.array(z.string()).optional(),
  blockedCountries: z.array(z.string()).optional(),
  tieredAccess: z.object({
    enabled: z.boolean().default(false),
    tiers: z.array(z.object({
      name: z.string(),
      limits: z.record(z.any())
    })).optional()
  }).optional(),
  temporaryAccess: z.object({
    enabled: z.boolean().default(false),
    defaultDuration: z.number().min(0).optional()
  }).optional()
}).optional();

// ERC-20 Min Configuration Schema
export const erc20MinSchema = tokenBaseSchema.extend({
  // Required decimals for ERC-20
  decimals: decimalsSchema.default(18),
  
  // Basic ERC-20 properties
  erc20Properties: erc20PropertiesBaseSchema.partial().optional(),
  
  // Simplified configuration fields (backward compatibility)
  initialSupply: supplySchema.optional(),
  isMintable: z.boolean().default(false),
  isBurnable: z.boolean().default(false),
  isPausable: z.boolean().default(false),
  cap: optionalSupplySchema,
  tokenType: z.string().optional()
});

// ERC-20 Max Configuration Schema  
export const erc20MaxSchema = tokenBaseSchema.extend({
  // Required decimals for ERC-20
  decimals: decimalsSchema.default(18),
  
  // Full ERC-20 properties
  erc20Properties: erc20PropertiesBaseSchema.optional(),
  
  // Advanced features
  governanceFeatures: governanceSchema.optional(),
  feeOnTransfer: feeOnTransferSchema.optional(),
  rebasing: rebasingSchema.optional(),
  
  // Advanced configurations
  transferConfig: transferConfigSchema,
  gasConfig: gasConfigSchema,
  complianceConfig: complianceConfigSchema,
  whitelistConfig: whitelistConfigSchema,
  
  // Simplified configuration fields (backward compatibility)
  initialSupply: supplySchema.optional(),
  isMintable: z.boolean().optional(),
  isBurnable: z.boolean().optional(),
  isPausable: z.boolean().optional(),
  cap: optionalSupplySchema,
  tokenType: z.string().optional(),
  allowanceManagement: z.boolean().optional(),
  permit: z.boolean().optional(),
  snapshot: z.boolean().optional(),
  accessControl: z.string().optional()
});

// Validation function for ERC-20 tokens
export function validateERC20Token(data: TokenFormData, configMode: 'min' | 'max' = 'min'): ValidationResult {
  try {
    const schema = configMode === 'max' ? erc20MaxSchema : erc20MinSchema;
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      
      result.error.errors.forEach(error => {
        const path = error.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(error.message);
      });
      
      return {
        isValid: false,
        errors,
        warnings: {}
      };
    }
    
    // Additional business logic validation
    const warnings: Record<string, string[]> = {};
    
    // Check for potential issues
    if (data.isMintable && !data.cap) {
      warnings.cap = ['Consider setting a cap for mintable tokens to prevent unlimited inflation'];
    }
    
    if (data.governanceFeatures?.enabled && !data.snapshot) {
      warnings.snapshot = ['Consider enabling snapshots for governance tokens'];
    }
    
    return {
      isValid: true,
      errors: {},
      warnings,
      data: result.data
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: {
        general: [error instanceof Error ? error.message : 'Validation failed']
      },
      warnings: {}
    };
  }
}
