/**
 * Enhanced Token Deployment Service
 * 
 * Provides an enhanced API for token deployment with rate limiting, security validation,
 * and Foundry integration for modern smart contract deployment
 */

import { deploymentService } from '@/services/deployment/DeploymentService';
import { foundryDeploymentService } from './foundryDeploymentService';
import { supabase } from '@/infrastructure/database/client';
import { TokenDeploymentParams } from '@/components/tokens/interfaces/TokenInterfaces';
import { validateTokenConfiguration, checkTokenSecurityVulnerabilities } from '../utils/tokenConfigValidator';
import { mapTokenToFoundryConfig, validateFoundryConfig, tokenStandardToFoundryType } from '../utils/foundryConfigMapper';
import { TokenStandard } from '@/types/core/centralModels';
import { NetworkEnvironment } from '@/infrastructure/web3/ProviderManager';
import { DeploymentStatus, DeploymentResult } from '@/types/deployment/TokenDeploymentTypes';

// Rate limit configuration
const RATE_LIMIT = {
  MAX_DEPLOYMENTS_PER_HOUR: 5,
  MAX_DEPLOYMENTS_PER_DAY: 20
};

// Deployment strategy configuration
const DEPLOYMENT_STRATEGY = {
  USE_FOUNDRY_FOR_NEW_DEPLOYMENTS: true,
  FALLBACK_TO_LEGACY: true,
  SUPPORTED_FOUNDRY_STANDARDS: ['ERC-20', 'ERC-721', 'ERC-1155', 'ERC-4626', 'ERC-3525']
};

/**
 * Interface for security validation result
 */
export interface SecurityValidationResult {
  hasIssues: boolean;
  findings: Array<{
    severity: 'high' | 'medium' | 'low';
    issue: string;
    recommendation: string;
  }>;
}

/**
 * Enhanced token deployment service with Foundry integration
 */
export const enhancedTokenDeploymentService = {
  /**
   * Deploy a token with enhanced validation and rate limiting
   * @param tokenId ID of the token to deploy
   * @param userId ID of the user deploying the token
   * @param projectId ID of the project
   * @param useFoundry Whether to use Foundry contracts (optional, defaults to auto-detect)
   * @returns Promise with deployment result
   */
  async deployToken(
    tokenId: string,
    userId: string,
    projectId: string,
    useFoundry?: boolean
  ): Promise<DeploymentResult> {
    try {
      // Check rate limits before proceeding
      const rateLimitResult = await this.checkRateLimits(userId, projectId);
      
      if (!rateLimitResult.allowed) {
        return {
          status: DeploymentStatus.FAILED,
          error: rateLimitResult.reason
        };
      }
      
      // Get token details from the database
      const { data: token, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('id', tokenId)
        .single();
      
      if (error || !token) {
        return {
          status: DeploymentStatus.FAILED,
          error: error ? error.message : 'Token not found'
        };
      }
      
      // Parse token configuration from blocks
      const tokenConfig = token.blocks || {};
      const tokenStandard = token.standard as TokenStandard;
      
      // Validate token configuration
      const validationResult = validateTokenConfiguration(tokenConfig, tokenStandard);
      
      if (!validationResult.success) {
        const errorMessages = validationResult.errors?.map(err => `${err.path}: ${err.message}`).join(', ');
        return {
          status: DeploymentStatus.FAILED,
          error: `Invalid token configuration: ${errorMessages}`
        };
      }
      
      // Record deployment attempt for rate limiting
      await this.recordDeploymentAttempt(userId, projectId, tokenId);
      
      // Get deployment parameters from the token
      const blockchain = token.blockchain || 'ethereum';
      const environment = token.deployment_environment as NetworkEnvironment || NetworkEnvironment.TESTNET;
      const deploymentEnv = environment === NetworkEnvironment.MAINNET ? 'mainnet' : 'testnet';
      
      // Determine deployment strategy
      const shouldUseFoundry = useFoundry ?? this.shouldUseFoundryDeployment(tokenStandard);
      
      // Create token event for deployment start
      await supabase.from('token_events').insert({
        token_id: tokenId,
        event_type: 'deployment',
        severity: 'info',
        message: `Starting ${shouldUseFoundry ? 'Foundry' : 'legacy'} deployment of ${token.name} token to ${blockchain} ${environment}`,
        data: {
          tokenId,
          projectId,
          standard: tokenStandard,
          deploymentStrategy: shouldUseFoundry ? 'foundry' : 'legacy',
          timestamp: new Date().toISOString()
        }
      });
      
      let result: DeploymentResult;
      
      if (shouldUseFoundry) {
        // Use Foundry deployment
        result = await this.deployWithFoundry(token, tokenStandard, blockchain, deploymentEnv, userId);
      } else {
        // Use legacy deployment
        result = await this.deployWithLegacy(projectId, tokenId, blockchain, environment, userId);
      }
      
      // Update token record with deployment information if successful
      if (result.status === DeploymentStatus.SUCCESS) {
        await supabase
          .from('tokens')
          .update({
            address: result.tokenAddress,
            blockchain: blockchain,
            deployment_status: DeploymentStatus.SUCCESS,
            deployment_timestamp: new Date().toISOString(),
            deployment_transaction: result.transactionHash,
            deployment_environment: environment,
            deployment_strategy: shouldUseFoundry ? 'foundry' : 'legacy'
          })
          .eq('id', tokenId);
      }
      
      // Create token event for deployment result
      await supabase.from('token_events').insert({
        token_id: tokenId,
        event_type: 'deployment',
        severity: result.status === DeploymentStatus.SUCCESS ? 'info' : 'high',
        message: result.status === DeploymentStatus.SUCCESS 
          ? `Successfully deployed ${token.name} token to ${blockchain} ${environment}` 
          : `Failed to deploy ${token.name} token: ${result.error}`,
        data: {
          tokenId,
          projectId,
          standard: tokenStandard,
          status: result.status,
          address: result.tokenAddress,
          transactionHash: result.transactionHash,
          deploymentStrategy: shouldUseFoundry ? 'foundry' : 'legacy',
          timestamp: new Date().toISOString()
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error in enhanced token deployment service:', error);
      
      return {
        status: DeploymentStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error during token deployment'
      };
    }
  },

  /**
   * Deploy token using Foundry contracts
   */
  async deployWithFoundry(
    token: any,
    tokenStandard: TokenStandard,
    blockchain: string,
    environment: 'mainnet' | 'testnet',
    userId: string
  ): Promise<DeploymentResult> {
    try {
      // Map legacy token configuration to Foundry configuration
      const foundryConfig = mapTokenToFoundryConfig(token, tokenStandard, userId);
      const foundryType = tokenStandardToFoundryType(tokenStandard);
      
      // Validate Foundry configuration
      const validation = validateFoundryConfig(foundryConfig, foundryType);
      if (!validation.valid) {
        throw new Error(`Invalid Foundry configuration: ${validation.errors.join(', ')}`);
      }
      
      // Create deployment parameters
      const deploymentParams = {
        tokenType: foundryType as any,
        config: foundryConfig,
        blockchain,
        environment
      };
      
      // Deploy using Foundry service
      return await foundryDeploymentService.deployToken(deploymentParams, userId, userId);
    } catch (error) {
      console.error('Foundry deployment failed:', error);
      
      // If Foundry deployment fails and fallback is enabled, try legacy deployment
      if (DEPLOYMENT_STRATEGY.FALLBACK_TO_LEGACY) {
        console.log('Falling back to legacy deployment...');
        const environment = blockchain === 'mainnet' ? NetworkEnvironment.MAINNET : NetworkEnvironment.TESTNET;
        return await this.deployWithLegacy(token.project_id || '', token.id, blockchain, environment, userId);
      }
      
      throw error;
    }
  },

  /**
   * Deploy token using legacy deployment service
   */
  async deployWithLegacy(
    projectId: string,
    tokenId: string,
    blockchain: string,
    environment: NetworkEnvironment,
    userId: string
  ): Promise<DeploymentResult> {
    // Call the legacy deployment service
    return await deploymentService.deployToken(
      projectId,
      tokenId,
      blockchain,
      environment,
      userId
    );
  },

  /**
   * Determine if Foundry deployment should be used for a token standard
   */
  shouldUseFoundryDeployment(tokenStandard: TokenStandard): boolean {
    return DEPLOYMENT_STRATEGY.USE_FOUNDRY_FOR_NEW_DEPLOYMENTS &&
           DEPLOYMENT_STRATEGY.SUPPORTED_FOUNDRY_STANDARDS.includes(tokenStandard);
  },
  
  /**
   * Check if a token is ready for deployment by validating its configuration
   * @param tokenId ID of the token to validate
   * @returns Validation result with security findings
   */
  async validateTokenForDeployment(tokenId: string): Promise<SecurityValidationResult> {
    try {
      // Get token details from the database
      const { data: token, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('id', tokenId)
        .single();
      
      if (error || !token) {
        throw new Error(error ? error.message : 'Token not found');
      }
      
      // Parse token configuration from blocks
      const tokenConfig = token.blocks || {};
      const tokenStandard = token.standard as TokenStandard;
      
      // Validate token configuration
      const validationResult = validateTokenConfiguration(tokenConfig, tokenStandard);
      
      if (!validationResult.success) {
        // Return security findings with validation errors
        return {
          hasIssues: true,
          findings: validationResult.errors?.map(err => ({
            severity: 'high',
            issue: `Invalid configuration: ${err.path}`,
            recommendation: err.message
          })) || []
        };
      }
      
      // Check for security vulnerabilities
      const securityCheck = checkTokenSecurityVulnerabilities(tokenConfig, tokenStandard);
      
      // If using Foundry, also validate Foundry configuration
      const shouldUseFoundry = this.shouldUseFoundryDeployment(tokenStandard);
      if (shouldUseFoundry) {
        try {
          const foundryConfig = mapTokenToFoundryConfig(token, tokenStandard, 'temp-address');
          const foundryType = tokenStandardToFoundryType(tokenStandard);
          const foundryValidation = validateFoundryConfig(foundryConfig, foundryType);
          
          if (!foundryValidation.valid) {
            securityCheck.findings.push(...foundryValidation.errors.map(error => ({
              severity: 'medium' as const,
              issue: 'Foundry configuration issue',
              recommendation: error
            })));
          }
        } catch (foundryError) {
          securityCheck.findings.push({
            severity: 'medium',
            issue: 'Foundry mapping error',
            recommendation: foundryError instanceof Error ? foundryError.message : 'Unknown Foundry mapping error'
          });
        }
      }
      
      return {
        hasIssues: securityCheck.hasVulnerabilities || securityCheck.findings.length > 0,
        findings: securityCheck.findings
      };
    } catch (error) {
      console.error('Error validating token for deployment:', error);
      
      return {
        hasIssues: true,
        findings: [{
          severity: 'high',
          issue: 'Validation error',
          recommendation: error instanceof Error ? error.message : 'An unknown error occurred during validation'
        }]
      };
    }
  },
  
  /**
   * Check rate limits for token deployments
   * @param userId User ID
   * @param projectId Project ID
   * @returns Whether deployment is allowed
   */
  async checkRateLimits(userId: string, projectId: string): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  }> {
    try {
      // Get hourly deployment count
      const hourAgo = new Date();
      hourAgo.setHours(hourAgo.getHours() - 1);
      
      const { count: hourlyCount, error: hourlyError } = await supabase
        .from('deployment_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .gte('started_at', hourAgo.toISOString());
      
      if (hourlyError) {
        console.error('Error checking hourly rate limit:', hourlyError);
        return { allowed: true }; // Fail open
      }
      
      if ((hourlyCount || 0) >= RATE_LIMIT.MAX_DEPLOYMENTS_PER_HOUR) {
        return {
          allowed: false,
          reason: `You have reached the limit of ${RATE_LIMIT.MAX_DEPLOYMENTS_PER_HOUR} deployments per hour`,
          retryAfter: 3600 // 1 hour in seconds
        };
      }
      
      // Get daily deployment count
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      
      const { count: dailyCount, error: dailyError } = await supabase
        .from('deployment_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .gte('started_at', dayAgo.toISOString());
      
      if (dailyError) {
        console.error('Error checking daily rate limit:', dailyError);
        return { allowed: true }; // Fail open
      }
      
      if ((dailyCount || 0) >= RATE_LIMIT.MAX_DEPLOYMENTS_PER_DAY) {
        return {
          allowed: false,
          reason: `You have reached the limit of ${RATE_LIMIT.MAX_DEPLOYMENTS_PER_DAY} deployments per day`,
          retryAfter: 86400 // 24 hours in seconds
        };
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('Error checking rate limits:', error);
      return { allowed: true }; // Fail open
    }
  },
  
  /**
   * Record a deployment attempt for rate limiting
   * @param userId User ID
   * @param projectId Project ID
   * @param tokenId Token ID
   */
  async recordDeploymentAttempt(userId: string, projectId: string, tokenId: string): Promise<void> {
    try {
      await supabase.from('deployment_rate_limits').insert({
        user_id: userId,
        project_id: projectId,
        token_id: tokenId,
        started_at: new Date().toISOString(),
        status: 'started'
      });
    } catch (error) {
      console.error('Error recording deployment attempt:', error);
    }
  },
  
  /**
   * Verify a token contract on the blockchain
   * @param tokenId ID of the token to verify
   * @param contractAddress Address of the deployed contract
   * @param userId ID of the user initiating verification
   * @returns Verification result
   */
  async verifyTokenContract(
    tokenId: string,
    contractAddress: string,
    userId: string
  ): Promise<{ success: boolean; message: string; verificationId?: string }> {
    try {
      // Get token details for blockchain and environment
      let blockchain = 'ethereum';
      let environment = NetworkEnvironment.TESTNET;
      let deploymentStrategy = 'legacy';
      
      try {
        // Try to get deployment details from database
        const { data, error } = await supabase
          .from('tokens')
          .select('*')
          .eq('id', tokenId)
          .single();
          
        if (error) {
          console.warn('Error fetching token data:', error);
          // Continue with defaults
        } else if (data) {
          // Extract values if data exists
          blockchain = data.blockchain || blockchain;
          environment = (data.deployment_environment as NetworkEnvironment) || environment;
          
          // Check if metadata contains deployment strategy information
          if (data.metadata && typeof data.metadata === 'object') {
            deploymentStrategy = (data.metadata as any).deployment_strategy || deploymentStrategy;
          }
        }
      } catch (dbError) {
        console.warn('Database error when fetching token:', dbError);
        // Continue with defaults
      }
      
      // Create token event for verification start
      await supabase.from('token_events').insert({
        token_id: tokenId,
        event_type: 'verification',
        severity: 'info',
        message: `Starting verification of ${deploymentStrategy} contract at ${contractAddress}`,
        data: {
          tokenId,
          contractAddress,
          deploymentStrategy,
          timestamp: new Date().toISOString()
        }
      });
      
      let result: { success: boolean; message: string; verificationId?: string };
      
      if (deploymentStrategy === 'foundry') {
        // Use Foundry verification service
        const envString = environment === NetworkEnvironment.MAINNET ? 'mainnet' : 'testnet';
        result = await foundryDeploymentService.verifyContract(contractAddress, blockchain, envString, 'unknown');
      } else {
        // Use legacy verification service
        result = await deploymentService.verifyContract(
          tokenId,
          contractAddress,
          blockchain,
          environment
        );
      }
      
      // Create token event for verification result
      await supabase.from('token_events').insert({
        token_id: tokenId,
        event_type: 'verification',
        severity: result.success ? 'info' : 'medium',
        message: result.success 
          ? `Successfully submitted verification for contract at ${contractAddress}` 
          : `Failed to verify contract at ${contractAddress}: ${result.message}`,
        data: {
          tokenId,
          contractAddress,
          success: result.success,
          verificationId: result.verificationId,
          deploymentStrategy,
          timestamp: new Date().toISOString()
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error verifying token contract:', error);
      
      // Create token event for verification error
      await supabase.from('token_events').insert({
        token_id: tokenId,
        event_type: 'verification',
        severity: 'high',
        message: `Error during contract verification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: {
          tokenId,
          contractAddress,
          timestamp: new Date().toISOString()
        }
      });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during contract verification'
      };
    }
  },

  /**
   * Configure deployment strategy settings
   */
  configureDeploymentStrategy: {
    setUseFoundry: (enabled: boolean) => {
      DEPLOYMENT_STRATEGY.USE_FOUNDRY_FOR_NEW_DEPLOYMENTS = enabled;
    },
    
    setFallbackToLegacy: (enabled: boolean) => {
      DEPLOYMENT_STRATEGY.FALLBACK_TO_LEGACY = enabled;
    },
    
    addSupportedFoundryStandard: (standard: string) => {
      if (!DEPLOYMENT_STRATEGY.SUPPORTED_FOUNDRY_STANDARDS.includes(standard)) {
        DEPLOYMENT_STRATEGY.SUPPORTED_FOUNDRY_STANDARDS.push(standard);
      }
    },
    
    getConfiguration: () => ({ ...DEPLOYMENT_STRATEGY })
  }
};

export default enhancedTokenDeploymentService;

// Also export the legacy service for backward compatibility
export { enhancedTokenDeploymentService as tokenDeploymentService };
