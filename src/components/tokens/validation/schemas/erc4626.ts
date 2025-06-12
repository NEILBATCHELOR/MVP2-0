/**
 * ERC-4626 Token Validation Schemas
 * 
 * Validation schemas for ERC-4626 tokenized vaults
 */

import { z } from 'zod';
import { tokenBaseSchema, decimalsSchema, booleanFlagsSchema, ethereumAddressSchema, percentageSchema } from './base';
import { ValidationResult } from '../types';
import { TokenFormData } from '../../types';

// Asset allocation schema
const assetAllocationSchema = z.object({
  asset: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  percentage: percentageSchema,
  description: z.string().optional(),
  protocol: z.string().optional(),
  expectedApy: percentageSchema.optional()
});

// Strategy parameter schema
const strategyParamSchema = z.object({
  name: z.string().min(1, 'Parameter name is required'),
  value: z.string(),
  description: z.string().optional(),
  paramType: z.enum(['string', 'number', 'boolean', 'address']).default('string'),
  isRequired: z.boolean().default(false)
});

// Fee structure schema
const feeStructureSchema = z.object({
  enabled: z.boolean().default(false),
  managementFee: percentageSchema.optional(),
  performanceFee: percentageSchema.optional(),
  depositFee: percentageSchema.optional(),
  withdrawalFee: percentageSchema.optional(),
  feeRecipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format').optional()
}).refine((data) => {
  if (data.enabled) {
    return data.feeRecipient;
  }
  return true;
}, {
  message: 'Fee recipient is required when fees are enabled',
  path: ['feeRecipient']
});

// Base ERC-4626 properties
const erc4626PropertiesBaseSchema = z.object({
  assetAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  assetName: z.string().min(1, 'Asset name is required'),
  assetSymbol: z.string().min(1, 'Asset symbol is required'),
  assetDecimals: decimalsSchema.default(18),
  vaultType: z.enum(['yield', 'fund', 'staking', 'lending']).default('yield'),
  isMintable: z.boolean().default(false),
  isBurnable: z.boolean().default(false),
  isPausable: z.boolean().default(false),
  vaultStrategy: z.string().optional(),
  customStrategy: z.boolean().default(false),
  strategyController: ethereumAddressSchema,
  accessControl: z.enum(['ownable', 'roles', 'none']).default('ownable'),
  flashLoans: z.boolean().default(false),
  emergencyShutdown: z.boolean().default(false),
  performanceMetrics: z.boolean().default(false)
});

// ERC-4626 Min Schema
export const erc4626MinSchema = tokenBaseSchema.extend({
  decimals: decimalsSchema.default(18),
  erc4626Properties: erc4626PropertiesBaseSchema.partial().optional(),
  
  // Backward compatibility
  assetAddress: ethereumAddressSchema.optional(),
  assetName: z.string().optional(),
  assetSymbol: z.string().optional(),
  vaultType: z.enum(['yield', 'fund', 'staking', 'lending']).optional(),
  isMintable: z.boolean().default(false),
  isBurnable: z.boolean().default(false),
  isPausable: z.boolean().default(false)
});

// ERC-4626 Max Schema
export const erc4626MaxSchema = erc4626MinSchema.extend({
  erc4626Properties: erc4626PropertiesBaseSchema.optional(),
  erc4626StrategyParams: z.array(strategyParamSchema).optional(),
  erc4626AssetAllocations: z.array(assetAllocationSchema).optional(),
  feeStructure: feeStructureSchema.optional(),
  rebalancingRules: z.record(z.any()).optional(),
  yieldOptimizationEnabled: z.boolean().default(false),
  automatedRebalancing: z.boolean().default(false),
  depositLimit: z.string().regex(/^\d+$/, 'Deposit limit must be a number').optional(),
  withdrawalLimit: z.string().regex(/^\d+$/, 'Withdrawal limit must be a number').optional()
});

export function validateERC4626Token(data: TokenFormData, configMode: 'min' | 'max' = 'min'): ValidationResult {
  try {
    const schema = configMode === 'max' ? erc4626MaxSchema : erc4626MinSchema;
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
    
    // Validate asset allocations sum to 100%
    const warnings: Record<string, string[]> = {};
    if (data.erc4626AssetAllocations && data.erc4626AssetAllocations.length > 0) {
      const totalAllocation = data.erc4626AssetAllocations.reduce((sum, allocation) => {
        // Use correct property name based on assetAllocationSchema - it expects 'percentage', not 'percentageValue'
        const allocPercentage = typeof allocation === 'object' && allocation !== null ? 
          (allocation as any).percentage || '0' : '0';
        return sum + parseFloat(allocPercentage);
      }, 0);
      
      if (Math.abs(totalAllocation - 100) > 0.01) {
        warnings.assetAllocations = ['Asset allocations should sum to 100%'];
      }
    }
    
    return { isValid: true, errors: {}, warnings, data: result.data };
  } catch (error) {
    return {
      isValid: false,
      errors: { general: [error instanceof Error ? error.message : 'Validation failed'] },
      warnings: {}
    };
  }
}
