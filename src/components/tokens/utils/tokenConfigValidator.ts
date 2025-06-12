/**
 * Token Configuration Validator
 * 
 * Provides comprehensive validation for token configurations to ensure security and prevent deployment issues.
 * Validates configuration parameters based on token standard and mode.
 */
import { ethers } from 'ethers';
import { z } from 'zod';
import { TokenStandard, TokenConfigMode } from '@/types/core/centralModels';

// Define validation schemas for different token standards
const baseTokenSchema = z.object({
  name: z.string().min(1, 'Token name is required'),
  symbol: z.string().min(1, 'Token symbol is required').max(11, 'Symbol must be 11 characters or less'),
  description: z.string().optional(),
  configurationLevel: z.enum(['min', 'max']).optional().default('min')
});

// ERC-20 token validation schema
export const erc20ValidationSchema = baseTokenSchema.extend({
  decimals: z.number().int().min(0).max(18).default(18),
  initialSupply: z.string().refine(
    (val) => {
      try {
        // Validate the number format and ensure it's not negative
        const bigNum = ethers.parseUnits(val, 0);
        return bigNum >= 0n;
      } catch {
        return false;
      }
    },
    {
      message: 'Initial supply must be a valid non-negative number',
    }
  ),
  cap: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      try {
        const bigNum = ethers.parseUnits(val, 0);
        return bigNum > 0n;
      } catch {
        return false;
      }
    },
    {
      message: 'Cap must be a valid positive number',
    }
  ),
  isMintable: z.boolean().default(true),
  isBurnable: z.boolean().default(true),
  isPausable: z.boolean().default(false),
  accessControl: z.enum(['owner', 'roles']).default('owner'),
  allowanceManagement: z.boolean().default(false),
  permit: z.boolean().default(false),
  snapshot: z.boolean().default(false),
  feeOnTransfer: z.boolean().default(false),
  feePercentage: z.number().min(0).max(100).optional(),
  feeRecipient: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return ethers.isAddress(val);
    },
    {
      message: 'Fee recipient must be a valid Ethereum address',
    }
  ),
  rebasing: z.boolean().default(false),
  rebasingMode: z.enum(['manual', 'automatic']).optional(),
  targetSupply: z.string().optional()
});

// ERC-721 token validation schema
export const erc721ValidationSchema = baseTokenSchema.extend({
  baseURI: z.string().optional(),
  isMintable: z.boolean().default(true),
  isBurnable: z.boolean().default(true),
  isPausable: z.boolean().default(false),
  accessControl: z.enum(['owner', 'roles']).default('owner'),
  dynamicUris: z.boolean().default(true),
  batchMinting: z.boolean().default(false),
  batchTransfers: z.boolean().default(false),
  royaltyRecipient: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return ethers.isAddress(val);
    },
    {
      message: 'Royalty recipient must be a valid Ethereum address',
    }
  ),
  royaltyPercentage: z.number().min(0).max(100).optional()
});

// ERC-1155 token validation schema
export const erc1155ValidationSchema = baseTokenSchema.extend({
  uri: z.string().optional(),
  isMintable: z.boolean().default(true),
  isBurnable: z.boolean().default(true),
  isPausable: z.boolean().default(false),
  accessControl: z.enum(['owner', 'roles']).default('owner'),
  dynamicUris: z.boolean().default(true),
  batchMinting: z.boolean().default(true),
  batchTransfers: z.boolean().default(true),
  transferRestrictions: z.boolean().default(false),
  royaltyRecipient: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return ethers.isAddress(val);
    },
    {
      message: 'Royalty recipient must be a valid Ethereum address',
    }
  ),
  royaltyPercentage: z.number().min(0).max(100).optional()
});

// ERC-3525 token validation schema
export const erc3525ValidationSchema = baseTokenSchema.extend({
  valueDecimals: z.number().int().min(0).max(18).default(0),
  isMintable: z.boolean().default(true),
  isBurnable: z.boolean().default(true),
  accessControl: z.enum(['owner', 'roles']).default('owner'),
  feeStructure: z.object({
    transferFee: z.number().min(0).max(100).optional(),
    mintFee: z.number().min(0).max(100).optional(),
    slotCreationFee: z.number().min(0).max(100).optional()
  }).optional(),
  royaltyRecipient: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return ethers.isAddress(val);
    },
    {
      message: 'Royalty recipient must be a valid Ethereum address',
    }
  ),
  royaltyPercentage: z.number().min(0).max(100).optional()
});

// ERC-4626 token validation schema
export const erc4626ValidationSchema = baseTokenSchema.extend({
  assetAddress: z.string().refine(
    (val) => ethers.isAddress(val),
    {
      message: 'Asset address must be a valid Ethereum address',
    }
  ),
  assetDecimals: z.number().int().min(0).max(18).default(18),
  isPausable: z.boolean().default(false),
  accessControl: z.enum(['owner', 'roles']).default('owner'),
  fees: z.object({
    depositFee: z.number().min(0).max(100).optional(),
    withdrawalFee: z.number().min(0).max(100).optional(),
    recipient: z.string().optional().refine(
      (val) => {
        if (!val) return true;
        return ethers.isAddress(val);
      },
      {
        message: 'Fee recipient must be a valid Ethereum address',
      }
    )
  }).optional(),
  strategy: z.object({
    allocation: z.number().min(0).max(100).optional()
  }).optional(),
  withdrawalLimits: z.object({
    maxAmount: z.string().optional(),
    periodLength: z.number().min(0).optional()
  }).optional()
});

// ERC-1400 token validation schema
export const erc1400ValidationSchema = baseTokenSchema.extend({
  decimals: z.number().int().min(0).max(18).default(18),
  initialSupply: z.string().refine(
    (val) => {
      try {
        // Validate the number format and ensure it's not negative
        const bigNum = ethers.parseUnits(val, 0);
        return bigNum >= 0n;
      } catch {
        return false;
      }
    },
    {
      message: 'Initial supply must be a valid non-negative number',
    }
  ),
  isPausable: z.boolean().default(false),
  accessControl: z.enum(['owner', 'roles']).default('owner'),
  isIssuable: z.boolean().default(true),
  isRedeemable: z.boolean().default(true),
  isForceTransferable: z.boolean().default(false),
  hasPartitions: z.boolean().default(true),
  hasDocuments: z.boolean().default(true),
  hasControllers: z.boolean().default(true),
  hasComplianceEngine: z.boolean().default(false),
  controllers: z.array(z.string().refine(
    (val) => ethers.isAddress(val),
    {
      message: 'Controller address must be a valid Ethereum address',
    }
  )).optional(),
  partitions: z.array(z.string()).optional()
});

/**
 * Validate token configuration based on token standard
 * @param config Token configuration data
 * @param standard Token standard
 * @returns Validation result with success flag, validated data and errors
 */
export function validateTokenConfiguration(config: any, standard: TokenStandard): {
  success: boolean;
  data?: any;
  errors?: { path: string; message: string }[];
} {
  try {
    let validationSchema;
    
    switch (standard) {
      case 'ERC-20':
        validationSchema = erc20ValidationSchema;
        break;
      case 'ERC-721':
        validationSchema = erc721ValidationSchema;
        break;
      case 'ERC-1155':
        validationSchema = erc1155ValidationSchema;
        break;
      case 'ERC-3525':
        validationSchema = erc3525ValidationSchema;
        break;
      case 'ERC-4626':
        validationSchema = erc4626ValidationSchema;
        break;
      case 'ERC-1400':
        validationSchema = erc1400ValidationSchema;
        break;
      default:
        return {
          success: false,
          errors: [{ path: 'standard', message: `Unsupported token standard: ${standard}` }]
        };
    }
    
    // Validate the configuration against the schema
    const validatedData = validationSchema.parse(config);
    
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod errors into a more usable structure
      const errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      return {
        success: false,
        errors
      };
    }
    
    // Handle other types of errors
    return {
      success: false,
      errors: [{ path: 'unknown', message: 'An unexpected error occurred during validation' }]
    };
  }
}

/**
 * Check if a token configuration has any security vulnerabilities
 * @param config Token configuration data
 * @param standard Token standard
 * @returns Security validation result with findings
 */
export function checkTokenSecurityVulnerabilities(config: any, standard: TokenStandard): {
  hasVulnerabilities: boolean;
  findings: { severity: 'high' | 'medium' | 'low'; issue: string; recommendation: string }[];
} {
  const findings: { severity: 'high' | 'medium' | 'low'; issue: string; recommendation: string }[] = [];
  
  // Check common vulnerabilities
  if (config.accessControl === 'owner' && config.isMintable) {
    findings.push({
      severity: 'medium',
      issue: 'Centralized minting authority',
      recommendation: 'Consider using role-based access control for minting to distribute authority'
    });
  }
  
  // Standard-specific security checks
  switch (standard) {
    case 'ERC-20':
      // Check for fee-on-transfer vulnerabilities
      if (config.feeOnTransfer && (config.feePercentage > 10)) {
        findings.push({
          severity: 'high',
          issue: 'High transfer fee may lead to user confusion and economic attacks',
          recommendation: 'Consider reducing the transfer fee to less than 10%'
        });
      }
      
      // Check for rebasing vulnerabilities
      if (config.rebasing && config.rebasingMode === 'automatic') {
        findings.push({
          severity: 'medium',
          issue: 'Automatic rebasing can cause unexpected behavior in integrations',
          recommendation: 'Consider using manual rebasing or providing clear documentation for integrators'
        });
      }
      break;
      
    case 'ERC-721':
    case 'ERC-1155':
      // Check for royalty vulnerabilities
      if (config.royaltyPercentage > 15) {
        findings.push({
          severity: 'medium',
          issue: 'High royalty percentage may limit secondary market liquidity',
          recommendation: 'Consider reducing royalty percentage to less than 15%'
        });
      }
      break;
      
    case 'ERC-4626':
      // Check for vault vulnerabilities
      if (config.fees?.depositFee > 5 || config.fees?.withdrawalFee > 5) {
        findings.push({
          severity: 'medium',
          issue: 'High deposit/withdrawal fees may discourage users',
          recommendation: 'Consider reducing fees to improve user experience'
        });
      }
      break;
  }
  
  return {
    hasVulnerabilities: findings.length > 0,
    findings
  };
}

/**
 * Rate limit check for deployment operations
 * @param userId User ID
 * @param projectId Project ID
 * @returns Whether the operation is allowed or should be rate-limited
 */
export async function checkDeploymentRateLimit(userId: string, projectId: string): Promise<{
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}> {
  // In a real implementation, this would check a database or cache for recent deployments
  // For now, we'll simulate a check with localStorage (in real use, use server-side rate limiting)
  
  // Create a key for tracking deployments for this user and project
  const key = `deployment_rate_limit_${userId}_${projectId}`;
  
  try {
    // In a real implementation, this would be a database or Redis query
    const deploymentHistory = JSON.parse(localStorage.getItem(key) || '[]') as {
      timestamp: number;
      tokenId: string;
    }[];
    
    // Remove entries older than 1 hour
    const now = Date.now();
    const recentDeployments = deploymentHistory.filter(
      entry => (now - entry.timestamp) < 3600000 // 1 hour in milliseconds
    );
    
    // Check if user has exceeded rate limit (e.g., 5 deployments per hour)
    if (recentDeployments.length >= 5) {
      const oldestDeployment = recentDeployments[0];
      const resetTime = oldestDeployment.timestamp + 3600000;
      const retryAfter = Math.ceil((resetTime - now) / 1000); // seconds
      
      return {
        allowed: false,
        reason: 'Rate limit exceeded. You can deploy a maximum of 5 tokens per hour.',
        retryAfter
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Error checking deployment rate limit:', error);
    // In case of an error, we'll allow the operation to proceed
    return { allowed: true };
  }
}

/**
 * Add a deployment to the rate limit tracker
 * @param userId User ID
 * @param projectId Project ID
 * @param tokenId Token ID
 */
export function trackDeployment(userId: string, projectId: string, tokenId: string): void {
  const key = `deployment_rate_limit_${userId}_${projectId}`;
  
  try {
    // Get existing history
    const deploymentHistory = JSON.parse(localStorage.getItem(key) || '[]') as {
      timestamp: number;
      tokenId: string;
    }[];
    
    // Add new deployment
    deploymentHistory.push({
      timestamp: Date.now(),
      tokenId
    });
    
    // Remove entries older than 1 hour
    const now = Date.now();
    const recentDeployments = deploymentHistory.filter(
      entry => (now - entry.timestamp) < 3600000 // 1 hour in milliseconds
    );
    
    // Save updated history
    localStorage.setItem(key, JSON.stringify(recentDeployments));
  } catch (error) {
    console.error('Error tracking deployment:', error);
  }
}

export default {
  validateTokenConfiguration,
  checkTokenSecurityVulnerabilities,
  checkDeploymentRateLimit,
  trackDeployment
};