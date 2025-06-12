import { Request, Response } from 'express';
import DeploymentApiService from '../endpoints/deploymentApiService';
import { NetworkEnvironment } from '@/infrastructure/web3/ProviderManager';
import { validateDeploymentRequest } from '@/infrastructure/validation/deploymentValidation';

/**
 * Controller for handling token deployment API endpoints
 */
export class DeploymentController {
  /**
   * Initialize a new token deployment
   * @param req Express request object
   * @param res Express response object
   */
  public static async initializeDeployment(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, tokenId, blockchain, environment, keyId } = req.body;

      // Validate request
      const validationError = validateDeploymentRequest(req.body);
      if (validationError) {
        res.status(400).json({ 
          success: false, 
          error: validationError 
        });
        return;
      }

      // Initialize deployment
      const result = await DeploymentApiService.initializeDeployment(
        projectId,
        tokenId,
        blockchain,
        environment as NetworkEnvironment,
        keyId
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Error initializing deployment:', error);
      res.status(500).json({
        success: false,
        error: `Server error: ${error.message || 'Unknown error'}`
      });
    }
  }

  /**
   * Execute a token deployment
   * @param req Express request object
   * @param res Express response object
   */
  public static async executeDeployment(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, tokenId, blockchain, environment, keyId } = req.body;

      // Validate request
      const validationError = validateDeploymentRequest(req.body);
      if (validationError) {
        res.status(400).json({ 
          success: false, 
          error: validationError 
        });
        return;
      }

      // Execute deployment
      const result = await DeploymentApiService.executeDeployment(
        projectId,
        tokenId,
        blockchain,
        environment as NetworkEnvironment,
        keyId
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Error executing deployment:', error);
      res.status(500).json({
        success: false,
        error: `Server error: ${error.message || 'Unknown error'}`
      });
    }
  }

  /**
   * Get deployment status for a token
   * @param req Express request object
   * @param res Express response object
   */
  public static async getDeploymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { tokenId } = req.params;

      if (!tokenId) {
        res.status(400).json({
          success: false,
          error: 'Token ID is required'
        });
        return;
      }

      // Get deployment status
      const result = await DeploymentApiService.getDeploymentStatus(tokenId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error: any) {
      console.error('Error getting deployment status:', error);
      res.status(500).json({
        success: false,
        error: `Server error: ${error.message || 'Unknown error'}`
      });
    }
  }

  /**
   * Get deployment history for a token
   * @param req Express request object
   * @param res Express response object
   */
  public static async getDeploymentHistory(req: Request, res: Response): Promise<void> {
    try {
      const { tokenId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      if (!tokenId) {
        res.status(400).json({
          success: false,
          error: 'Token ID is required'
        });
        return;
      }

      // Get deployment history
      const result = await DeploymentApiService.getDeploymentHistory(tokenId, limit, offset);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error: any) {
      console.error('Error getting deployment history:', error);
      res.status(500).json({
        success: false,
        error: `Server error: ${error.message || 'Unknown error'}`
      });
    }
  }

  /**
   * Verify contract on block explorer
   * @param req Express request object
   * @param res Express response object
   */
  public static async verifyContract(req: Request, res: Response): Promise<void> {
    try {
      const { tokenId, blockchain, contractAddress } = req.body;

      if (!tokenId || !blockchain || !contractAddress) {
        res.status(400).json({
          success: false,
          error: 'Token ID, blockchain, and contract address are required'
        });
        return;
      }

      // Verify contract
      const result = await DeploymentApiService.verifyContract(
        tokenId,
        blockchain,
        contractAddress
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Error verifying contract:', error);
      res.status(500).json({
        success: false,
        error: `Server error: ${error.message || 'Unknown error'}`
      });
    }
  }

  /**
   * Check verification status
   * @param req Express request object
   * @param res Express response object
   */
  public static async checkVerificationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { verificationId } = req.params;

      if (!verificationId) {
        res.status(400).json({
          success: false,
          error: 'Verification ID is required'
        });
        return;
      }

      // Check verification status
      const result = await DeploymentApiService.checkVerificationStatus(verificationId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error: any) {
      console.error('Error checking verification status:', error);
      res.status(500).json({
        success: false,
        error: `Server error: ${error.message || 'Unknown error'}`
      });
    }
  }
}

export default DeploymentController;