import express from 'express';
import DeploymentController from '../controllers/DeploymentController';

// Mock middleware functions for auth until the actual implementation is available
// These will be replaced with the real middleware when it's available
const authenticateUser = (req: any, res: any, next: any) => {
  // Mock implementation - would normally validate JWT token
  console.log('Mock authenticateUser middleware called');
  next(); // Always proceed in mock implementation
};

const requireProjectAccess = (req: any, res: any, next: any) => {
  // Mock implementation - would normally check if user has access to the project
  console.log('Mock requireProjectAccess middleware called');
  next(); // Always proceed in mock implementation
};

const router = express.Router();

/**
 * @route   POST /api/deployment/initialize
 * @desc    Initialize a new token deployment
 * @access  Private (requires authentication)
 */
router.post(
  '/initialize',
  authenticateUser,
  requireProjectAccess,
  DeploymentController.initializeDeployment
);

/**
 * @route   POST /api/deployment/execute
 * @desc    Execute a token deployment
 * @access  Private (requires authentication)
 */
router.post(
  '/execute',
  authenticateUser,
  requireProjectAccess,
  DeploymentController.executeDeployment
);

/**
 * @route   GET /api/deployment/status/:tokenId
 * @desc    Get deployment status for a token
 * @access  Private (requires authentication)
 */
router.get(
  '/status/:tokenId',
  authenticateUser,
  DeploymentController.getDeploymentStatus
);

/**
 * @route   GET /api/deployment/history/:tokenId
 * @desc    Get deployment history for a token
 * @access  Private (requires authentication)
 */
router.get(
  '/history/:tokenId',
  authenticateUser,
  DeploymentController.getDeploymentHistory
);

/**
 * @route   POST /api/deployment/verify
 * @desc    Verify contract on block explorer
 * @access  Private (requires authentication)
 */
router.post(
  '/verify',
  authenticateUser,
  requireProjectAccess,
  DeploymentController.verifyContract
);

/**
 * @route   GET /api/deployment/verify/status/:verificationId
 * @desc    Check verification status
 * @access  Private (requires authentication)
 */
router.get(
  '/verify/status/:verificationId',
  authenticateUser,
  DeploymentController.checkVerificationStatus
);

export default router;