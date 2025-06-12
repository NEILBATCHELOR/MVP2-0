import express, { Router } from 'express';
import policyApiRouter from './api/index.js';
import guardianRouter from './guardian/index.js';
import redemptionRouter from './redemptions/index.js';
import { getConnectedClientsCount, getActiveTopicsCount, broadcastSystemMessage } from '@/services/realtime/websocketService';

// Create the main API router
const apiRouter = Router();

// Apply API versioning
apiRouter.use('/v1', policyApiRouter);

// Mount Guardian API routes
apiRouter.use('/guardian', guardianRouter);

// Mount Redemption API routes
apiRouter.use('/redemptions', redemptionRouter);

// Add a health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// WebSocket status endpoint
apiRouter.get('/ws/status', (req, res) => {
  res.json({
    connectedClients: getConnectedClientsCount(),
    activeTopics: getActiveTopicsCount(),
    serverTime: new Date().toISOString()
  });
});

// Broadcast system message to all WebSocket clients
apiRouter.post('/ws/broadcast', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({
      status: 'error',
      message: 'Message is required'
    });
  }
  
  broadcastSystemMessage(message);
  
  res.json({
    status: 'success',
    message: 'Broadcast message sent',
    timestamp: new Date().toISOString()
  });
});

// Default handler for unknown routes
apiRouter.use((req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    status: 404
  });
});

// Export the API router
export default apiRouter; 