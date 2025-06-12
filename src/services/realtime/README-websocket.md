# WebSocket Service for Web3 Integration Framework

The WebSocket Service provides real-time communication capabilities for the Web3 Integration Framework, enabling applications to receive and send blockchain-related events in real time.

## Features

- Topic-based publish/subscribe system
- Real-time wallet address broadcasting
- Blockchain-specific event channels
- Heartbeat mechanism to maintain connections
- Automatic reconnection handling
- Client identification and tracking

## Server Setup

The WebSocket server is integrated with the Express application and runs on the same port. It's initialized in the `server.ts` file:

```typescript
import { WebSocketServer } from 'ws';
import { setupWebSocketServer } from './src/services/websocketService';

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Setup WebSocket server with handlers
setupWebSocketServer(wss);
```

## Client Usage

### Using WalletAddressReceiver

The `WalletAddressReceiver` class provides a convenient way to connect to the WebSocket server and receive wallet addresses:

```typescript
import { WalletAddressReceiver } from '@/services/wallet/WalletAddressReceiver';

// Create a receiver instance
const receiver = new WalletAddressReceiver('ws://localhost:3001');

// Set up event handlers
receiver.onConnected(() => {
  console.log('Connected to WebSocket server');
});

receiver.onNewAddress((address) => {
  console.log(`Received wallet address: ${address.address} on ${address.network}`);
});

receiver.onError((error) => {
  console.error('WebSocket error:', error);
});

// Connect to the server
receiver.connect();

// Subscribe to specific blockchain networks
receiver.subscribeToNetworks(['ethereum', 'solana', 'polygon']);

// Submit a wallet address (for services that collect addresses)
receiver.submitWalletAddress(
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  'ethereum',
  { source: 'user-input', timestamp: Date.now() }
);

// Disconnect when done
receiver.disconnect();
```

### Using the React Hook

For React applications, the `useWalletAddressReceiver` hook simplifies integration:

```tsx
import { useWalletAddressReceiver } from '@/services/wallet/WalletAddressReceiver';

function WalletAddressMonitor() {
  const wsUrl = import.meta.env.VITE_WALLET_WS_URL || 'ws://localhost:3001';
  
  const {
    isConnected,
    addresses,
    error,
    reconnect,
    clearAddresses,
    submitAddress,
    subscribeToNetworks
  } = useWalletAddressReceiver(wsUrl, {
    networks: ['ethereum', 'solana'] // Initial network subscriptions
  });
  
  // Example: Submit a new address
  const handleAddressSubmit = (address, network) => {
    submitAddress(address, network, { source: 'form-input' });
  };
  
  // Example: Subscribe to additional networks
  const handleNetworkAdd = (network) => {
    subscribeToNetworks([network]);
  };
  
  return (
    <div>
      <h2>Wallet Monitor</h2>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {error && <p className="error">{error}</p>}
      
      <button onClick={reconnect}>Reconnect</button>
      <button onClick={clearAddresses}>Clear</button>
      
      <h3>Addresses ({addresses.length})</h3>
      <ul>
        {addresses.map((addr, i) => (
          <li key={i}>
            {addr.address} ({addr.network}) - {new Date(addr.createdAt).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## WebSocket Message Protocol

The WebSocket service uses a JSON-based message protocol:

### Message Format

```typescript
interface WebSocketMessage {
  type: string;
  data: any;
}
```

### Client-to-Server Messages

| Message Type | Purpose | Data Structure |
|--------------|---------|----------------|
| `subscribe` | Subscribe to topics | `{ topics: string[] }` |
| `unsubscribe` | Unsubscribe from topics | `{ topics: string[] }` |
| `wallet-address` | Submit wallet address | `{ address: string, network: string, metadata?: object }` |
| `ping` | Keep connection alive | `{ timestamp: number }` |
| `register` | Register client with metadata | `{ chainId?: string, clientType?: string }` |

### Server-to-Client Messages

| Message Type | Purpose | Data Structure |
|--------------|---------|----------------|
| `connection` | Connection confirmation | `{ clientId: string, message: string, timestamp: string }` |
| `subscribe-confirm` | Subscription confirmation | `{ topics: string[], message: string }` |
| `unsubscribe-confirm` | Unsubscription confirmation | `{ topics: string[], message: string }` |
| `wallet-address` | Wallet address notification | `{ address: string, network: string, createdAt: string, metadata?: object }` |
| `pong` | Response to ping | `{ timestamp: number }` |
| `error` | Error notification | `{ message: string, timestamp: string }` |
| `system` | System-wide notifications | `{ message: string, timestamp: string }` |

## Topics

The WebSocket service uses a topic-based publish/subscribe system. Some standard topics include:

| Topic | Description |
|-------|-------------|
| `wallet-addresses` | All wallet addresses across chains |
| `wallet-addresses-ethereum` | Ethereum wallet addresses |
| `wallet-addresses-solana` | Solana wallet addresses |
| `wallet-addresses-polygon` | Polygon wallet addresses |

## Server-Side API

The WebSocket service exports these functions for server-side use:

```typescript
// Set up the WebSocket server
setupWebSocketServer(wss: WebSocketServer): void

// Broadcast a message to specific topic subscribers
broadcastToTopic(topic: string, message: WebSocketMessage): void

// Get count of connected clients
getConnectedClientsCount(): number

// Get count of active topics
getActiveTopicsCount(): number

// Broadcast a system message to all clients
broadcastSystemMessage(message: string): void
```

## Error Handling

The WebSocket service includes comprehensive error handling:

- Connection failures trigger automatic reconnection attempts
- Message parsing errors are caught and reported
- Heartbeat mechanism detects and cleans up dead connections
- Client-side timeouts and reconnection logic

## Development Mode

The `WalletAddressReceiver` includes special handling for development environments:

- Automatically detects development URLs (localhost, etc.)
- Can be disabled in development via `VITE_ENABLE_WS=true` environment variable
- Provides detailed logs during development 