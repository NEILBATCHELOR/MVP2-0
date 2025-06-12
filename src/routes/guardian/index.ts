import express from 'express';
import webhookRoutes from './webhooks';
import walletRoutes from './wallets';

const router: express.Router = express.Router();

/**
 * Guardian Medex API Routes
 * 
 * Mount all Guardian-related API endpoints
 */

// Mount webhook routes
router.use('/', webhookRoutes);

// Mount wallet management routes  
router.use('/', walletRoutes);

export default router;
