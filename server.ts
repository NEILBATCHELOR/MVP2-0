import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRouter from './src/routes/api';
import http from 'http';
import { WebSocketServer } from 'ws';
import { setupWebSocketServer } from './src/services/websocketService';

// Create the express app
const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Setup WebSocket server with handlers
setupWebSocketServer(wss);

// Middleware
app.use(cors());
app.use(express.json());

// Mount the API router
app.use('/api', apiRouter);

// Start the server
server.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

// Handle errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    status: 500
  });
});