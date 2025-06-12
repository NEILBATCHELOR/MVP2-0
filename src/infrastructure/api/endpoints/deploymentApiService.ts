import { supabase } from '@/infrastructure/database/client';
import { deploymentService } from '@/infrastructure/web3/services/DeploymentService';
import { DeploymentStatus, DeploymentResult } from '@/types/deployment/deployment';
import { NetworkEnvironment, providerManager } from '@/infrastructure/web3/ProviderManager';
import { TokenType } from '@/types/core/centralModels';
import { TokenDeploymentParams } from '@/components/tokens/interfaces/TokenInterfaces';
import type { SupportedChain } from '@/infrastructure/web3/adapters/IBlockchainAdapter';

/**
 * API service for token deployment operations
 */
export class DeploymentApiService {
  /**
   * Initialize a deployment process
   * @param projectId Project ID
   * @param tokenId Token ID
   * @param blockchain Target blockchain
   * @param environment Network environment (MAINNET or TESTNET)
   * @param keyId Key ID for signing transactions
   * @returns Promise with deployment initialization result
   */
  public static async initializeDeployment(
    projectId: string,
    tokenId: string,
    blockchain: SupportedChain,
    environment: NetworkEnvironment,
    keyId: string
  ): Promise<{
    success: boolean;
    deploymentId?: string;
    status?: DeploymentStatus;
    message?: string;
    error?: string;
  }> {
    try {
      // Check if provider is available by attempting to get provider
      // The blockchain parameter is already typed as SupportedChain
      const provider = providerManager.getProvider(blockchain);
      const isAvailable = !!provider;
      
      if (!isAvailable) {
        return {
          success: false,
          message: `Provider for ${blockchain} ${environment} is not available`
        };
      }

      // Get current timestamp to use as deployment ID
      const deploymentId = `${tokenId}-${Date.now()}`;

      // Create deployment history record
      const { error: historyError } = await supabase
        .from('token_deployment_history')
        .insert({
          id: deploymentId,
          token_id: tokenId,
          project_id: projectId,
          status: DeploymentStatus.PENDING,
          blockchain,
          environment,
          timestamp: new Date().toISOString()
        });

      if (historyError) {
        console.error('Error creating deployment history:', historyError);
        return {
          success: false,
          error: `Failed to initialize deployment: ${historyError.message}`
        };
      }

      // Update token status
      const { error: updateError } = await supabase
        .from('tokens')
        .update({
          deployment_status: DeploymentStatus.PENDING,
          deployment_environment: environment
        })
        .eq('id', tokenId);

      if (updateError) {
        console.error('Error updating token status:', updateError);
        return {
          success: false,
          error: `Failed to update token status: ${updateError.message}`
        };
      }

      return {
        success: true,
        deploymentId,
        status: DeploymentStatus.PENDING,
        message: 'Deployment initialized successfully'
      };
    } catch (error: any) {
      console.error('Error initializing deployment:', error);
      return {
        success: false,
        error: `Failed to initialize deployment: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Execute a token deployment
   * @param projectId Project ID
   * @param tokenId Token ID
   * @param blockchain Target blockchain
   * @param environment Network environment
   * @param keyId Key ID for signing transactions
   * @returns Promise with deployment result
   */
  public static async executeDeployment(
    projectId: string,
    tokenId: string,
    blockchain: SupportedChain,
    environment: NetworkEnvironment,
    keyId: string
  ): Promise<{
    success: boolean;
    result?: Partial<DeploymentResult>;
    error?: string;
  }> {
    try {
      // Execute deployment using deployment service
      const deploymentResult = await deploymentService.deployToken(
        projectId,
        tokenId,
        blockchain, // Now properly typed as SupportedChain
        environment,
        keyId
      );

      // Create a properly formatted result object with consistent types
      const result: Partial<DeploymentResult> = {
        status: deploymentResult.status,
        tokenAddress: deploymentResult.tokenAddress,
        transactionHash: deploymentResult.transactionHash,
        error: deploymentResult.error,
        blockNumber: deploymentResult.blockNumber,
        explorerUrl: deploymentResult.explorerUrl,
        gasUsed: deploymentResult.gasUsed,
        effectiveGasPrice: deploymentResult.effectiveGasPrice
      };
      
      // Ensure timestamp is a string as required by DeploymentResult interface
      if (deploymentResult.timestamp) {
        result.timestamp = typeof deploymentResult.timestamp === 'number' 
          ? new Date(deploymentResult.timestamp).toISOString() 
          : deploymentResult.timestamp;
      }

      return {
        success: true,
        result
      };
    } catch (error: any) {
      console.error('Error executing deployment:', error);
      
      // Update token status to failed
      await this.updateDeploymentStatus(tokenId, DeploymentStatus.FAILED, error.message);
      
      return {
        success: false,
        error: `Deployment failed: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Get deployment status
   * @param tokenId Token ID
   * @returns Promise with deployment status
   */
  public static async getDeploymentStatus(
    tokenId: string
  ): Promise<{
    success: boolean;
    status?: DeploymentStatus;
    details?: any;
    error?: string;
  }> {
    try {
      // Get token deployment status from database
      let tokenData;
      let status: DeploymentStatus = DeploymentStatus.PENDING;
      
      try {
        const { data, error } = await supabase
          .from('tokens')
          .select('*')
          .eq('id', tokenId)
          .single();
        
        if (!error && data) {
          tokenData = data;
          // Convert the status to the correct enum type
          status = this.normalizeDeploymentStatus(data.deployment_status);
        } else {
          return {
            success: false,
            error: error ? error.message : 'Token not found'
          };
        }
      } catch (dbError: any) {
        console.error('Error fetching token data:', dbError);
        return {
          success: false,
          error: `Database error: ${dbError.message || 'Unknown error'}`
        };
      }
      
      if (!tokenData) {
        return {
          success: false,
          error: 'Token not found'
        };
      }

      // Basic response for non-deploying statuses
      if (status !== DeploymentStatus.DEPLOYING && status !== DeploymentStatus.PENDING) {
        return {
          success: true,
          status,
          details: {
            status
          }
        };
      }

      // For deploying or pending status, get more details from transaction monitor
      let transactionDetails = null;
      if (status === DeploymentStatus.DEPLOYING && tokenData.deployment_transaction) {
        const providerKey = `${tokenData.blockchain || 'ethereum'}-${tokenData.deployment_environment || 'testnet'}`;
        transactionDetails = await deploymentService.getDeploymentTransactionDetails(
          tokenData.deployment_transaction,
          tokenData.blockchain || 'ethereum',
          tokenData.deployment_environment || NetworkEnvironment.TESTNET
        );
      }

      return {
        success: true,
        status,
        details: {
          status,
          tokenAddress: tokenData.address,
          blockchain: tokenData.blockchain,
          transactionHash: tokenData.deployment_transaction,
          blockNumber: tokenData.deployment_block,
          timestamp: tokenData.deployment_timestamp,
          transactionDetails
        }
      };
    } catch (error: any) {
      console.error('Error getting deployment status:', error);
      return {
        success: false,
        error: `Failed to get deployment status: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Get deployment history
   * @param tokenId Token ID
   * @param limit Max number of history items to retrieve
   * @param offset Offset for pagination
   * @returns Promise with deployment history
   */
  public static async getDeploymentHistory(
    tokenId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    success: boolean;
    history?: any[];
    error?: string;
    totalCount?: number;
  }> {
    try {
      const { data, error, count } = await supabase
        .from('token_deployment_history')
        .select('*', { count: 'exact' })
        .eq('token_id', tokenId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        history: data || [],
        totalCount: count
      };
    } catch (error: any) {
      console.error('Error getting deployment history:', error);
      return {
        success: false,
        error: `Failed to get deployment history: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Verify contract on block explorer
   * @param tokenId Token ID
   * @param blockchain Target blockchain
   * @param contractAddress Contract address
   * @returns Promise with verification result
   */
  public static async verifyContract(
    tokenId: string,
    blockchain: string,
    contractAddress: string
  ): Promise<{
    success: boolean;
    verificationId?: string;
    message?: string;
    error?: string;
  }> {
    try {
      // Get token details
      const { data: tokenData, error: tokenError } = await supabase
        .from('tokens')
        .select(`
          id,
          standard,
          name,
          symbol,
          address
        `)
        .eq('id', tokenId)
        .single();
      
      if (tokenError) {
        throw tokenError;
      }
      
      // Verify that the contract address matches
      if (tokenData.address && tokenData.address.toLowerCase() !== contractAddress.toLowerCase()) {
        return {
          success: false,
          error: 'Contract address does not match token address in database'
        };
      }
      
      // Implement verification logic based on blockchain
      // Currently we'll just return a success message for demonstration
      // In a real implementation, this would call the appropriate blockchain explorer API
      
      // Generate a unique verification ID
      const verificationId = `${tokenId}-verification-${Date.now()}`;
      
      return {
        success: true,
        verificationId,
        message: `Contract verification for ${tokenData.name} (${tokenData.symbol}) initiated. This process may take a few minutes.`
      };
    } catch (error: any) {
      console.error('Error verifying contract:', error);
      return {
        success: false,
        error: `Failed to verify contract: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Check verification status
   * @param verificationId Verification ID
   * @returns Promise with verification status
   */
  public static async checkVerificationStatus(
    verificationId: string
  ): Promise<{
    success: boolean;
    status?: 'pending' | 'verified' | 'failed';
    message?: string;
    error?: string;
  }> {
    try {
      // In a real implementation, this would check the status with the blockchain explorer API
      // For now, we'll just return a mock status
      return {
        success: true,
        status: 'pending',
        message: 'Verification in progress. Please check back in a few minutes.'
      };
    } catch (error: any) {
      console.error('Error checking verification status:', error);
      return {
        success: false,
        error: `Failed to check verification status: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Update deployment status
   * @param tokenId Token ID
   * @param status New status
   * @param error Optional error message (for failed deployments)
   * @returns Promise resolving to success boolean
   */
  private static async updateDeploymentStatus(
    tokenId: string,
    status: DeploymentStatus,
    error?: string
  ): Promise<boolean> {
    try {
      // Update token status in database
      const { error: updateError } = await supabase
        .from('tokens')
        .update({
          deployment_status: status,
          deployment_error: error
        })
        .eq('id', tokenId);
      
      if (updateError) {
        console.error('Error updating token deployment status:', updateError);
        return false;
      }
      
      // Record deployment history
      const timestamp = new Date().toISOString();
      
      // Get token data to get project_id, blockchain, etc.
      const { data: tokenData, error: tokenError } = await supabase
        .from('tokens')
        .select('project_id, blockchain, deployment_environment')
        .eq('id', tokenId)
        .single();
      
      if (tokenError || !tokenData) {
        console.error('Error fetching token data for history:', tokenError);
        return false;
      }
      
      // Add history record
      const { error: historyError } = await supabase
        .from('token_deployment_history')
        .insert({
          token_id: tokenId,
          project_id: tokenData.project_id,
          blockchain: tokenData.blockchain || 'ethereum',
          environment: tokenData.deployment_environment || 'testnet',
          status: status.toString(),
          error: error,
          timestamp: timestamp
        });
      
      if (historyError) {
        console.error('Error adding deployment history:', historyError);
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateDeploymentStatus:', error);
      return false;
    }
  }

  // Helper function to convert between DeploymentStatus types if needed
  private static normalizeDeploymentStatus(status: any): DeploymentStatus {
    // If status is already the correct enum type, return it
    if (Object.values(DeploymentStatus).includes(status)) {
      return status;
    }
    
    // If it's a string, convert to the correct enum value
    if (typeof status === 'string') {
      const statusUpperCase = status.toUpperCase();
      if (Object.values(DeploymentStatus).includes(statusUpperCase as DeploymentStatus)) {
        return statusUpperCase as DeploymentStatus;
      }
      
      // Map common variations
      const statusMap: Record<string, DeploymentStatus> = {
        'pending': DeploymentStatus.PENDING,
        'deploying': DeploymentStatus.DEPLOYING,
        'success': DeploymentStatus.SUCCESS,
        'failed': DeploymentStatus.FAILED,
        'aborted': DeploymentStatus.ABORTED,
        'verifying': DeploymentStatus.VERIFYING,
        'verified': DeploymentStatus.VERIFIED,
        'verification_failed': DeploymentStatus.VERIFICATION_FAILED,
      };
      
      return statusMap[status.toLowerCase()] || DeploymentStatus.PENDING;
    }
    
    // Default fallback
    return DeploymentStatus.PENDING;
  }
}

export default DeploymentApiService;