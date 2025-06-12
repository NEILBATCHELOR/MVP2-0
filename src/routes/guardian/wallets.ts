import * as express from 'express';
import { GuardianWalletService } from '@/infrastructure/guardian';
import { 
  type GuardianWalletRequest,
  type GuardianTransactionRequest
} from '@/types/guardian/guardian';

const router: any = express.Router();

/**
 * Guardian Wallet API Routes
 * 
 * RESTful API endpoints for Guardian wallet management
 * Integrates with Guardian Medex API while maintaining Chain Capital's patterns
 */

// Lazy initialization of Guardian service to avoid startup failures
let guardianWalletService: GuardianWalletService | null = null;
let initializationError: Error | null = null;

/**
 * Get or create Guardian Wallet Service instance
 * Uses lazy initialization to handle crypto setup properly
 */
function getGuardianService(): GuardianWalletService {
  if (initializationError) {
    throw initializationError;
  }
  
  if (!guardianWalletService) {
    try {
      guardianWalletService = new GuardianWalletService();
      console.log('Guardian Wallet Service initialized successfully');
    } catch (error) {
      initializationError = error instanceof Error ? error : new Error('Failed to initialize Guardian service');
      console.error('Failed to initialize Guardian Wallet Service:', error);
      throw initializationError;
    }
  }
  
  return guardianWalletService;
}

/**
 * GET /api/guardian/wallets
 * 
 * List all Guardian wallets for the authenticated user
 */
router.get('/wallets', (async (req: any, res: any) => {
  try {
    const service = getGuardianService();
    const userId = req.query.userId as string;
    
    if (!userId) {
      res.status(400).json({
        error: 'Missing userId',
        message: 'userId query parameter is required'
      });
      return;
    }

    const wallets = await service.listUserGuardianWallets(userId);
    
    res.json({
      success: true,
      data: wallets,
      count: wallets.length
    });

  } catch (error) {
    console.error('Error listing Guardian wallets:', error);
    
    // Provide helpful error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('etc.sha512Sync not set')) {
        res.status(503).json({
          error: 'Guardian service initialization failed',
          message: 'Crypto environment not properly configured. Please check server setup.'
        });
        return;
      }
      
      if (error.message.includes('Guardian configuration missing')) {
        res.status(503).json({
          error: 'Guardian configuration missing',
          message: 'Guardian API credentials not configured. Please check environment variables.'
        });
        return;
      }
    }
    
    res.status(500).json({
      error: 'Failed to list wallets',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as any);

/**
 * POST /api/guardian/wallets
 * 
 * Create a new Guardian wallet
 */
router.post('/wallets', (async (req: any, res: any) => {
  try {
    const service = getGuardianService();
    
    // Simple validation of required fields
    const { name, type, blockchain, userId, metadata } = req.body;
    if (!name || !type || !blockchain) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'name, type, and blockchain are required',
        details: { required: ['name', 'type', 'blockchain'] }
      });
      return;
    }

    const walletRequest: GuardianWalletRequest & { userId: string } = {
      name,
      type,
      blockchain,
      userId,
      metadata
    };
    
    if (!walletRequest.userId) {
      res.status(400).json({
        error: 'Missing userId',
        message: 'userId is required for wallet creation'
      });
      return;
    }

    const wallet = await service.createGuardianWallet({
      name: walletRequest.name,
      type: walletRequest.type,
      userId: walletRequest.userId,
      blockchain: walletRequest.blockchain,
      metadata: walletRequest.metadata
    });

    res.status(201).json({
      success: true,
      data: wallet,
      message: 'Guardian wallet created successfully'
    });

  } catch (error) {
    console.error('Error creating Guardian wallet:', error);
    res.status(500).json({
      error: 'Failed to create wallet',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as any);

/**
 * GET /api/guardian/wallets/:walletId
 * 
 * Get specific Guardian wallet by ID
 */
router.get('/wallets/:walletId', async (req, res) => {
  try {
    const service = getGuardianService();
    const { walletId } = req.params;
    
    const wallet = await service.getGuardianWallet(walletId);
    
    res.json({
      success: true,
      data: wallet
    });

  } catch (error) {
    console.error('Error getting Guardian wallet:', error);
    
    if (error instanceof Error && error.message.includes('404')) {
      res.status(404).json({
        error: 'Wallet not found',
        message: `Guardian wallet ${req.params.walletId} not found`
      });
    } else {
      res.status(500).json({
        error: 'Failed to get wallet',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * PUT /api/guardian/wallets/:walletId
 * 
 * Update Guardian wallet
 */
router.put('/wallets/:walletId', async (req, res) => {
  try {
    const service = getGuardianService();
    const { walletId } = req.params;
    const updates = req.body;
    
    const wallet = await service.updateGuardianWallet(walletId, updates);
    
    res.json({
      success: true,
      data: wallet,
      message: 'Guardian wallet updated successfully'
    });

  } catch (error) {
    console.error('Error updating Guardian wallet:', error);
    res.status(500).json({
      error: 'Failed to update wallet',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/guardian/wallets/:walletId
 * 
 * Delete Guardian wallet
 */
router.delete('/wallets/:walletId', async (req, res) => {
  try {
    const service = getGuardianService();
    const { walletId } = req.params;
    
    await service.deleteGuardianWallet(walletId);
    
    res.json({
      success: true,
      message: 'Guardian wallet deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Guardian wallet:', error);
    res.status(500).json({
      error: 'Failed to delete wallet',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/guardian/wallets/:walletId/transactions
 * 
 * Send transaction from Guardian wallet
 */
router.post('/wallets/:walletId/transactions', (async (req: any, res: any) => {
  try {
    const service = getGuardianService();
    const { walletId } = req.params;
    
    // Simple validation of required fields
    const { to, value } = req.body;
    if (!to || !value) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'to and value are required for transactions',
        details: { required: ['to', 'value'] }
      });
      return;
    }

    const transactionRequest: GuardianTransactionRequest = {
      walletId,
      to: req.body.to,
      value: req.body.value,
      data: req.body.data,
      gasLimit: req.body.gasLimit,
      gasPrice: req.body.gasPrice,
      nonce: req.body.nonce
    };
    
    const transaction = await service.sendTransaction(transactionRequest);
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction sent successfully'
    });

  } catch (error) {
    console.error('Error sending Guardian transaction:', error);
    res.status(500).json({
      error: 'Failed to send transaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as any);

/**
 * GET /api/guardian/wallets/:walletId/transactions
 * 
 * Get transaction history for Guardian wallet
 */
router.get('/wallets/:walletId/transactions', async (req, res) => {
  try {
    const service = getGuardianService();
    const { walletId } = req.params;
    
    const transactions = await service.getWalletTransactions(walletId);
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });

  } catch (error) {
    console.error('Error getting Guardian wallet transactions:', error);
    res.status(500).json({
      error: 'Failed to get transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/guardian/status
 * 
 * Get Guardian integration status
 */
router.get('/status', async (req, res) => {
  try {
    const service = getGuardianService();
    const status = service.getStatus();
    const healthCheck = await service.healthCheck();
    
    res.json({
      success: true,
      data: {
        ...status,
        healthy: healthCheck,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting Guardian status:', error);
    
    // Return status info even if service failed to initialize
    res.status(200).json({
      success: false,
      data: {
        configured: false,
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
