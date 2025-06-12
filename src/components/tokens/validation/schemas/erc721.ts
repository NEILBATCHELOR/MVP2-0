/**
 * ERC-721 Token Validation Schemas
 * 
 * Validation schemas for ERC-721 (NFT) tokens in both min and max configurations
 */

import { z } from 'zod';
import { 
  tokenBaseSchema,
  booleanFlagsSchema,
  urlSchema,
  percentageSchema,
  ethereumAddressSchema,
  optionalSupplySchema
} from './base';
import { ValidationResult } from '../types';
import { TokenFormData } from '../../types';

// NFT attribute schema
const nftAttributeSchema = z.object({
  trait_type: z.string().min(1, 'Trait type is required'),
  value: z.union([z.string(), z.number(), z.boolean()]),
  display_type: z.enum(['number', 'boost_number', 'boost_percentage', 'date']).optional(),
  max_value: z.number().optional()
});

// NFT metadata schema (extends base)
const nftMetadataSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  image: urlSchema,
  external_url: urlSchema,
  animation_url: urlSchema,
  attributes: z.array(nftAttributeSchema).optional(),
  background_color: z.string().regex(/^[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  youtube_url: urlSchema
}).optional();

// Base ERC-721 properties (without refine for partial compatibility)
const erc721PropertiesCore = z.object({
  // Metadata configuration
  baseUri: z.string().url('Invalid base URI').optional(),
  metadataStorage: z.enum(['ipfs', 'arweave', 'centralized']).default('ipfs'),
  
  // Supply configuration
  maxSupply: optionalSupplySchema,
  
  // Royalty configuration
  hasRoyalty: z.boolean().default(false),
  royaltyPercentage: percentageSchema.optional(),
  royaltyReceiver: ethereumAddressSchema,
  
  // Standard boolean flags
  isMintable: z.boolean().default(true),
  isBurnable: z.boolean().default(false),
  isPausable: z.boolean().default(false),
  
  // NFT-specific features
  assetType: z.enum(['unique_asset', 'real_estate', 'ip_rights', 'financial_instrument', 'collectible']).default('unique_asset'),
  mintingMethod: z.enum(['open', 'whitelist', 'auction', 'lazy']).default('open'),
  autoIncrementIds: z.boolean().default(true),
  enumerable: z.boolean().default(true),
  uriStorage: z.enum(['tokenId', 'sequential', 'custom']).default('tokenId'),
  accessControl: z.enum(['ownable', 'roles', 'none']).default('ownable'),
  updatableUris: z.boolean().default(false)
});

// Base ERC-721 properties with validation
const erc721PropertiesBaseSchema = erc721PropertiesCore.refine((data) => {
  if (data.hasRoyalty) {
    return data.royaltyPercentage && data.royaltyReceiver;
  }
  return true;
}, {
  message: 'Royalty percentage and receiver are required when royalties are enabled',
  path: ['royalty']
});

// Token attributes configuration (for max config)
const tokenAttributesSchema = z.array(z.object({
  name: z.string().min(1, 'Attribute name is required'),
  type: z.enum(['string', 'number', 'boolean', 'date']).default('string'),
  required: z.boolean().default(false),
  description: z.string().optional(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional()
  }).optional()
})).optional();

// Sales configuration (for max config)
const salesConfigSchema = z.object({
  enabled: z.boolean().default(false),
  publicSale: z.object({
    enabled: z.boolean().default(false),
    price: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid price format').optional(),
    maxPerWallet: z.number().min(1).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional()
  }).optional(),
  whitelistSale: z.object({
    enabled: z.boolean().default(false),
    price: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid price format').optional(),
    maxPerWallet: z.number().min(1).optional(),
    merkleRoot: z.string().optional()
  }).optional(),
  dutchAuction: z.object({
    enabled: z.boolean().default(false),
    startPrice: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid price format').optional(),
    endPrice: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid price format').optional(),
    duration: z.number().min(1).optional()
  }).optional()
}).optional();

// Whitelist configuration (for max config)
const whitelistConfigSchema = z.object({
  enabled: z.boolean().default(false),
  type: z.enum(['merkle', 'signature', 'simple']).optional(),
  addresses: z.array(ethereumAddressSchema).optional(),
  maxMints: z.number().min(1).optional(),
  proof: z.string().optional()
}).optional();

// Permission configuration (for max config)
const permissionConfigSchema = z.object({
  minterRole: z.array(ethereumAddressSchema).optional(),
  burnerRole: z.array(ethereumAddressSchema).optional(),
  metadataRole: z.array(ethereumAddressSchema).optional(),
  pauserRole: z.array(ethereumAddressSchema).optional()
}).optional();

// Dynamic URI configuration (for max config)
const dynamicUriConfigSchema = z.object({
  enabled: z.boolean().default(false),
  baseUri: urlSchema,
  revealable: z.boolean().default(false),
  preRevealUri: urlSchema,
  revealTime: z.string().optional()
}).optional();

// Batch minting configuration (for max config)
const batchMintingConfigSchema = z.object({
  enabled: z.boolean().default(false),
  maxBatchSize: z.number().min(1).max(100).optional(),
  reservedTokens: z.number().min(0).optional(),
  batchPrice: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid price format').optional()
}).optional();

// Transfer restrictions (for max config)
const transferRestrictionsSchema = z.object({
  enabled: z.boolean().default(false),
  soulbound: z.boolean().default(false),
  transferCooldown: z.number().min(0).optional(),
  whitelistedOperators: z.array(ethereumAddressSchema).optional(),
  blockedOperators: z.array(ethereumAddressSchema).optional()
}).optional();

// ERC-721 Min Configuration Schema
export const erc721MinSchema = tokenBaseSchema.extend({
  // No decimals for NFTs (always 0)
  decimals: z.literal(0).default(0),
  
  // Basic ERC-721 properties
  erc721Properties: erc721PropertiesCore.partial().optional(),
  
  // Simplified configuration fields (backward compatibility)
  baseUri: urlSchema,
  metadataStorage: z.enum(['ipfs', 'arweave', 'centralized']).optional(),
  maxSupply: optionalSupplySchema,
  hasRoyalty: z.boolean().default(false),
  royaltyPercentage: percentageSchema.optional(),
  royaltyReceiver: ethereumAddressSchema,
  isMintable: z.boolean().default(true),
  isBurnable: z.boolean().default(false),
  isPausable: z.boolean().default(false),
  assetType: z.string().optional()
});

// ERC-721 Max Configuration Schema
export const erc721MaxSchema = tokenBaseSchema.extend({
  // No decimals for NFTs (always 0)
  decimals: z.literal(0).default(0),
  
  // Full ERC-721 properties
  erc721Properties: erc721PropertiesBaseSchema.optional(),
  
  // NFT attributes
  erc721Attributes: tokenAttributesSchema,
  
  // Advanced configurations
  salesConfig: salesConfigSchema,
  whitelistConfig: whitelistConfigSchema,
  permissionConfig: permissionConfigSchema,
  dynamicUriConfig: dynamicUriConfigSchema,
  batchMintingConfig: batchMintingConfigSchema,
  transferRestrictions: transferRestrictionsSchema,
  
  // Simplified configuration fields (backward compatibility)
  baseUri: urlSchema,
  metadataStorage: z.enum(['ipfs', 'arweave', 'centralized']).optional(),
  maxSupply: optionalSupplySchema,
  hasRoyalty: z.boolean().default(false),
  royaltyPercentage: percentageSchema.optional(),
  royaltyReceiver: ethereumAddressSchema,
  isMintable: z.boolean().optional(),
  isBurnable: z.boolean().optional(),
  isPausable: z.boolean().optional(),
  assetType: z.string().optional(),
  mintingMethod: z.string().optional(),
  autoIncrementIds: z.boolean().optional(),
  enumerable: z.boolean().optional(),
  uriStorage: z.string().optional(),
  accessControl: z.string().optional(),
  updatableUris: z.boolean().optional(),
  tokenAttributes: tokenAttributesSchema
});

// Validation function for ERC-721 tokens
export function validateERC721Token(data: TokenFormData, configMode: 'min' | 'max' = 'min'): ValidationResult {
  try {
    const schema = configMode === 'max' ? erc721MaxSchema : erc721MinSchema;
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
    if (!data.baseUri && configMode === 'min') {
      warnings.baseUri = ['Base URI is recommended for NFT metadata'];
    }
    
    if (data.maxSupply && parseInt(data.maxSupply) > 10000) {
      warnings.maxSupply = ['Consider if such a large supply is appropriate for your NFT collection'];
    }
    
    if (data.hasRoyalty && !data.royaltyPercentage) {
      warnings.royalty = ['Royalty percentage should be specified when royalties are enabled'];
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
