import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Interface for the wallet address message received from WebSocket
 */
export interface WalletAddressMessage {
  address: string;
  network: string; // ethereum, polygon, etc.
  createdAt: string;
  metadata?: Record<string, any>;
}

/**
 * Class handling WebSocket connection for real-time wallet addresses across blockchains
 */
export class WalletAddressReceiver {
  private websocket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // 2 seconds
  private onNewAddressCallback: ((address: WalletAddressMessage) => void) | null = null;
  private onConnectedCallback: (() => void) | null = null;
  private onErrorCallback: ((error: Error | Event) => void) | null = null;
  private isDevelopmentUrl: boolean;
  private isDisabled: boolean = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private subscribedTopics: Set<string> = new Set(['wallet-addresses']);
  private clientId: string | null = null;

  constructor(url: string, options?: { networks?: string[] }) {
    this.url = url;
    // Check if this is a development/example URL that doesn't actually exist
    this.isDevelopmentUrl = url.includes('localhost') || 
                           url.includes('127.0.0.1') || 
                           url.includes('example.com');
    
    // Disable WebSocket in development if VITE_ENABLE_WS is not set to true
    this.isDisabled = this.isDevelopmentUrl && 
                     import.meta.env.VITE_ENABLE_WS !== 'true';
    
    // Add network-specific topics if provided
    if (options?.networks) {
      options.networks.forEach(network => {
        this.subscribedTopics.add(`wallet-addresses-${network}`);
      });
    }
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    // Don't attempt connection if disabled
    if (this.isDisabled) {
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error('WebSocket disabled in development'));
      }
      return;
    }

    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      this.websocket = new WebSocket(this.url);
      
      this.websocket.onopen = () => {
        if (!this.isDisabled) {
          console.log('WebSocket connection established');
          this.reconnectAttempts = 0;
          
          // Subscribe to wallet address topics
          this.subscribe([...this.subscribedTopics]);
          
          // Start ping interval to keep connection alive
          this.startPingInterval();
          
          if (this.onConnectedCallback) {
            this.onConnectedCallback();
          }
        }
      };

      this.websocket.onmessage = (event) => {
        if (this.isDisabled) return;
        
        try {
          const response = JSON.parse(event.data);
          
          // Handle different message types
          switch (response.type) {
            case 'connection':
              this.clientId = response.data.clientId;
              console.log(`Connected with client ID: ${this.clientId}`);
              break;
              
            case 'wallet-address':
              if (response.data && this.onNewAddressCallback) {
                this.onNewAddressCallback(response.data);
              }
              break;
              
            case 'subscribe-confirm':
              console.log(`Subscribed to topics: ${response.data.topics.join(', ')}`);
              break;
              
            case 'pong':
              // Ping-pong for keeping connection alive, no action needed
              break;
              
            case 'error':
              console.error('WebSocket error:', response.data.message);
              if (this.onErrorCallback) {
                this.onErrorCallback(new Error(response.data.message));
              }
              break;
          }
        } catch (error) {
          if (!this.isDevelopmentUrl) {
            console.error('Error parsing WebSocket message:', error);
          }
        }
      };

      this.websocket.onerror = (error) => {
        if (this.isDisabled) return;
        
        if (!this.isDevelopmentUrl) {
          console.error('WebSocket error:', error);
        }
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      };

      this.websocket.onclose = () => {
        if (this.isDisabled) return;
        
        if (!this.isDevelopmentUrl) {
          console.log('WebSocket connection closed');
        }
        
        // Clear ping interval
        this.clearPingInterval();
        
        this.attemptReconnect();
      };
    } catch (error) {
      if (this.isDisabled) return;
      
      if (!this.isDevelopmentUrl) {
        console.error('Failed to establish WebSocket connection:', error);
      }
      this.attemptReconnect();
    }
  }

  /**
   * Subscribe to specific topics
   */
  private subscribe(topics: string[]): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.websocket.send(JSON.stringify({
      type: 'subscribe',
      data: {
        topics
      }
    }));
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.clearPingInterval();
    
    this.pingInterval = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'ping',
          data: {
            timestamp: Date.now()
          }
        }));
      }
    }, 30000); // 30 seconds
  }

  /**
   * Clear ping interval
   */
  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.isDisabled) return;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      if (!this.isDevelopmentUrl) {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      }
      
      setTimeout(() => {
        if (!this.isDisabled) {
          this.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else if (!this.isDevelopmentUrl) {
      console.error('Maximum reconnection attempts reached.');
    }
  }

  /**
   * Submit a wallet address to the WebSocket server
   * @param address Wallet address
   * @param network Blockchain network
   * @param metadata Additional metadata
   */
  public submitWalletAddress(address: string, network: string, metadata?: Record<string, any>): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.websocket.send(JSON.stringify({
      type: 'wallet-address',
      data: {
        address,
        network,
        metadata
      }
    }));
  }

  /**
   * Subscribe to additional wallet address topics
   * @param networks Array of blockchain networks to subscribe to
   */
  public subscribeToNetworks(networks: string[]): void {
    const newTopics: string[] = [];
    
    networks.forEach(network => {
      const topic = `wallet-addresses-${network}`;
      if (!this.subscribedTopics.has(topic)) {
        this.subscribedTopics.add(topic);
        newTopics.push(topic);
      }
    });
    
    if (newTopics.length > 0) {
      this.subscribe(newTopics);
    }
  }

  /**
   * Set callback for when a new address is received
   */
  public onNewAddress(callback: (address: WalletAddressMessage) => void): void {
    this.onNewAddressCallback = callback;
  }

  /**
   * Set callback for when connection is established
   */
  public onConnected(callback: () => void): void {
    this.onConnectedCallback = callback;
  }

  /**
   * Set callback for when an error occurs
   */
  public onError(callback: (error: Error | Event) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.clearPingInterval();
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
}

/**
 * React hook for using the wallet address receiver
 */
export function useWalletAddressReceiver(wsUrl: string, options?: { networks?: string[] }) {
  const [isConnected, setIsConnected] = useState(false);
  const [addresses, setAddresses] = useState<WalletAddressMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const receiverRef = useRef<WalletAddressReceiver | null>(null);

  // Initialize the receiver
  useEffect(() => {
    const addressReceiver = new WalletAddressReceiver(wsUrl, options);
    receiverRef.current = addressReceiver;
    
    addressReceiver.onConnected(() => {
      setIsConnected(true);
      setError(null);
    });
    
    addressReceiver.onNewAddress((address) => {
      setAddresses(prev => [...prev, address]);
    });
    
    addressReceiver.onError((err) => {
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'WebSocket connection error');
    });
    
    addressReceiver.connect();
    
    return () => {
      addressReceiver.disconnect();
    };
  }, [wsUrl, options]);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    if (receiverRef.current) {
      receiverRef.current.disconnect();
      receiverRef.current.connect();
    }
  }, []);

  // Function to submit a wallet address
  const submitAddress = useCallback((address: string, network: string, metadata?: Record<string, any>) => {
    if (receiverRef.current) {
      receiverRef.current.submitWalletAddress(address, network, metadata);
    }
  }, []);

  // Function to subscribe to additional networks
  const subscribeToNetworks = useCallback((networks: string[]) => {
    if (receiverRef.current) {
      receiverRef.current.subscribeToNetworks(networks);
    }
  }, []);

  return {
    isConnected,
    addresses,
    error,
    reconnect,
    clearAddresses: () => setAddresses([]),
    submitAddress,
    subscribeToNetworks
  };
}