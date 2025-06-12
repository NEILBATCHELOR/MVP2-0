import { Router } from 'express';
import settlementsRouter from './settlements';

// Create redemption router
const redemptionRouter = Router();

// Mount settlements router
redemptionRouter.use('/settlements', settlementsRouter);

// Export the router
export default redemptionRouter;
