import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Define the interface for clients with additional metadata
interface WebSocketClient extends WebSocket {
  id: string;
  isAlive: boolean;
  subscriptions: Set<string>;
  chainId?: string;
  clientType?: string;
}

// Message types for client-server communication
export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface WalletAddressMessage {
  address: string;
  network: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

// Map to store connected clients
const clients = new Map<string, WebSocketClient>();

// Map to store topic subscribers
const topics = new Map<string, Set<string>>();

/**
 * Setup the WebSocket server with event handlers
 * @param wss WebSocketServer instance
 */
export function setupWebSocketServer(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket) => {
    // Initialize client metadata
    const client = ws as WebSocketClient;
    const clientId = uuidv4();
    client.id = clientId;
    client.isAlive = true;
    client.subscriptions = new Set();

    // Add client to connected clients map
    clients.set(clientId, client);

    console.log(`Client connected: ${clientId}`);

    // Setup ping-pong heartbeat
    client.on('pong', () => {
      client.isAlive = true;
    });

    // Handle incoming messages
    client.on('message', (message: string) => {
      try {
        const parsedMessage = JSON.parse(message) as WebSocketMessage;
        handleClientMessage(client, parsedMessage);
      } catch (error) {
        console.error('Error parsing message:', error);
        sendErrorToClient(client, 'Invalid message format');
      }
    });

    // Handle client disconnection
    client.on('close', () => {
      handleClientDisconnection(clientId);
    });

    // Send welcome message
    sendToClient(client, {
      type: 'connection',
      data: {
        clientId,
        message: 'Connected to WebSocket server',
        timestamp: new Date().toISOString()
      }
    });
  });

  // Setup heartbeat interval to detect dead clients
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as WebSocketClient;
      if (client.isAlive === false) {
        handleClientDisconnection(client.id);
        return client.terminate();
      }

      client.isAlive = false;
      client.ping();
    });
  }, 30000); // 30 seconds

  // Clean up interval on server close
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });
}

/**
 * Handle client message based on its type
 * @param client WebSocketClient instance
 * @param message Parsed message from client
 */
function handleClientMessage(client: WebSocketClient, message: WebSocketMessage): void {
  switch (message.type) {
    case 'subscribe':
      handleSubscription(client, message.data.topics);
      break;
    case 'unsubscribe':
      handleUnsubscription(client, message.data.topics);
      break;
    case 'wallet-address':
      handleWalletAddress(client, message.data);
      break;
    case 'ping':
      sendToClient(client, { type: 'pong', data: { timestamp: Date.now() } });
      break;
    case 'register':
      handleClientRegistration(client, message.data);
      break;
    default:
      sendErrorToClient(client, `Unknown message type: ${message.type}`);
  }
}

/**
 * Register client with additional metadata
 * @param client WebSocketClient instance
 * @param data Registration data
 */
function handleClientRegistration(client: WebSocketClient, data: any): void {
  if (data.chainId) {
    client.chainId = data.chainId;
  }
  if (data.clientType) {
    client.clientType = data.clientType;
  }

  sendToClient(client, {
    type: 'register-confirm',
    data: {
      clientId: client.id,
      chainId: client.chainId,
      clientType: client.clientType
    }
  });
}

/**
 * Handle subscription request to topics
 * @param client WebSocketClient instance
 * @param topicsList List of topics to subscribe to
 */
function handleSubscription(client: WebSocketClient, topicsList: string[]): void {
  if (!Array.isArray(topicsList)) {
    return sendErrorToClient(client, 'Topics must be an array');
  }

  const subscribedTopics: string[] = [];

  topicsList.forEach(topic => {
    // Add client to topic subscribers
    if (!topics.has(topic)) {
      topics.set(topic, new Set([client.id]));
    } else {
      topics.get(topic)?.add(client.id);
    }

    // Add topic to client subscriptions
    client.subscriptions.add(topic);
    subscribedTopics.push(topic);
  });

  sendToClient(client, {
    type: 'subscribe-confirm',
    data: {
      topics: subscribedTopics,
      message: `Successfully subscribed to ${subscribedTopics.length} topics`
    }
  });
}

/**
 * Handle unsubscription request from topics
 * @param client WebSocketClient instance
 * @param topicsList List of topics to unsubscribe from
 */
function handleUnsubscription(client: WebSocketClient, topicsList: string[]): void {
  if (!Array.isArray(topicsList)) {
    return sendErrorToClient(client, 'Topics must be an array');
  }

  const unsubscribedTopics: string[] = [];

  topicsList.forEach(topic => {
    // Remove client from topic subscribers
    const topicSubscribers = topics.get(topic);
    if (topicSubscribers) {
      topicSubscribers.delete(client.id);
      if (topicSubscribers.size === 0) {
        topics.delete(topic);
      }
    }

    // Remove topic from client subscriptions
    client.subscriptions.delete(topic);
    unsubscribedTopics.push(topic);
  });

  sendToClient(client, {
    type: 'unsubscribe-confirm',
    data: {
      topics: unsubscribedTopics,
      message: `Successfully unsubscribed from ${unsubscribedTopics.length} topics`
    }
  });
}

/**
 * Handle wallet address message and broadcast to subscribers
 * @param client WebSocketClient instance
 * @param data Wallet address data
 */
function handleWalletAddress(client: WebSocketClient, data: WalletAddressMessage): void {
  if (!data.address) {
    return sendErrorToClient(client, 'Wallet address is required');
  }

  const walletAddressMessage: WalletAddressMessage = {
    address: data.address,
    network: data.network || 'unknown',
    createdAt: new Date().toISOString(),
    metadata: data.metadata || {}
  };

  // Broadcast to 'wallet-addresses' topic subscribers
  broadcastToTopic('wallet-addresses', {
    type: 'wallet-address',
    data: walletAddressMessage
  });

  // Also broadcast to network-specific topic if available
  if (data.network) {
    broadcastToTopic(`wallet-addresses-${data.network}`, {
      type: 'wallet-address',
      data: walletAddressMessage
    });
  }

  // Acknowledge the message to the sender
  sendToClient(client, {
    type: 'wallet-address-received',
    data: {
      message: 'Wallet address received and processed',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Broadcast message to all subscribers of a topic
 * @param topic Topic name
 * @param message Message to broadcast
 */
export function broadcastToTopic(topic: string, message: WebSocketMessage): void {
  const subscribers = topics.get(topic);
  if (!subscribers || subscribers.size === 0) {
    return;
  }

  subscribers.forEach(clientId => {
    const client = clients.get(clientId);
    if (client) {
      sendToClient(client, message);
    }
  });
}

/**
 * Send a message to a specific client
 * @param client Target client
 * @param message Message to send
 */
function sendToClient(client: WebSocketClient, message: WebSocketMessage): void {
  client.send(JSON.stringify(message));
}

/**
 * Send an error message to a client
 * @param client Target client
 * @param errorMessage Error message text
 */
function sendErrorToClient(client: WebSocketClient, errorMessage: string): void {
  sendToClient(client, {
    type: 'error',
    data: {
      message: errorMessage,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Handle client disconnection and clean up
 * @param clientId ID of disconnected client
 */
function handleClientDisconnection(clientId: string): void {
  const client = clients.get(clientId);
  if (!client) return;

  console.log(`Client disconnected: ${clientId}`);

  // Clean up subscriptions
  client.subscriptions.forEach(topic => {
    const topicSubscribers = topics.get(topic);
    if (topicSubscribers) {
      topicSubscribers.delete(clientId);
      if (topicSubscribers.size === 0) {
        topics.delete(topic);
      }
    }
  });

  // Remove client from map
  clients.delete(clientId);
}

/**
 * Get the count of currently connected clients
 * @returns Number of connected clients
 */
export function getConnectedClientsCount(): number {
  return clients.size;
}

/**
 * Get the count of active topics
 * @returns Number of active topics
 */
export function getActiveTopicsCount(): number {
  return topics.size;
}

/**
 * Broadcast a system message to all connected clients
 * @param message System message text
 */
export function broadcastSystemMessage(message: string): void {
  clients.forEach(client => {
    sendToClient(client, {
      type: 'system',
      data: {
        message,
        timestamp: new Date().toISOString()
      }
    });
  });
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandler: ((message: any) => void) | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Environment detection: use process.env for Node.js, import.meta.env for Vite
        const isVite = typeof import.meta !== 'undefined' && import.meta.env;
        const websocketUrl = (isVite ? import.meta.env.VITE_WEBSOCKET_URL : null) ||
                            process.env.WEBSOCKET_URL || 
                            process.env.VITE_WEBSOCKET_URL ||
                            'ws://localhost:3001';
        
        this.ws = new WebSocket(websocketUrl);
        this.ws.onopen = () => resolve();
        this.ws.onerror = (error) => reject(error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async send(message: any): Promise<void> {
    if (!this.ws) {
      throw new Error('WebSocket not connected');
    }
    this.ws.send(JSON.stringify(message));
  }

  onMessage(handler: (message: any) => void): void {
    this.messageHandler = handler;
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          let data: any;
          
          if (typeof event.data === 'string') {
            data = JSON.parse(event.data);
          } else if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const text = reader.result as string;
                data = JSON.parse(text);
                handler(data);
              } catch (error) {
                console.error('Failed to parse WebSocket blob message:', error);
              }
            };
            reader.readAsText(event.data);
            return;
          } else if (event.data instanceof ArrayBuffer) {
            const decoder = new TextDecoder();
            const text = decoder.decode(event.data);
            data = JSON.parse(text);
          } else {
            console.error('Unsupported WebSocket message type:', typeof event.data);
            return;
          }

          handler(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    }
  }
}

export const websocketService = new WebSocketService(); 