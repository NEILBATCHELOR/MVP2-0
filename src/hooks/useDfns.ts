/**
 * DFNS Client Hook
 * 
 * Provides a React hook for accessing the DFNS client instance
 * and managing DFNS-related state and operations.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Types
interface DfnsClientConfig {
  appId: string;
  authToken: string;
  baseUrl: string;
}

interface DfnsClientInstance {
  getConfig(): DfnsClientConfig;
  isInitialized(): boolean;
  getEndpoint(): string;
  getHeaders(): Record<string, string>;
}

interface UseDfnsResult {
  client: DfnsClientInstance | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  reinitialize: () => Promise<void>;
}

interface DfnsConfig {
  appId: string;
  appOrigin: string;
  baseUrl: string;
  authToken?: string;
}

// Mock DFNS client implementation for development
class MockDfnsClient implements DfnsClientInstance {
  private config: DfnsClientConfig;
  private initialized = false;

  constructor(config: DfnsConfig) {
    this.config = {
      appId: config.appId,
      authToken: config.authToken || '',
      baseUrl: config.baseUrl || 'https://api.dfns.ninja',
      // Add other required config properties
    };
    this.initialized = true;
  }

  getConfig(): DfnsClientConfig {
    return this.config;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getEndpoint(): string {
    return this.config.baseUrl || 'https://api.dfns.ninja';
  }

  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.authToken || ''}`,
      'X-DFNS-APPID': this.config.appId || '',
    };
  }
}

// Default configuration from environment variables
const getDefaultConfig = (): DfnsConfig => ({
  appId: import.meta.env.VITE_DFNS_APP_ID || 'chain-capital-app',
  appOrigin: import.meta.env.VITE_DFNS_APP_ORIGIN || window.location.origin,
  baseUrl: import.meta.env.VITE_DFNS_BASE_URL || 'https://api.dfns.ninja',
  authToken: import.meta.env.VITE_DFNS_AUTH_TOKEN,
});

/**
 * Hook for managing DFNS client instance
 */
export function useDfns(config?: Partial<DfnsConfig>): UseDfnsResult {
  const [client, setClient] = useState<DfnsClientInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Merge default config with provided config
  const finalConfig = useMemo(() => ({
    ...getDefaultConfig(),
    ...config,
  }), [config]);

  // Initialize DFNS client
  const initializeClient = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate required configuration
      if (!finalConfig.appId) {
        throw new Error('DFNS App ID is required');
      }

      // Create client instance
      const clientInstance = new MockDfnsClient(finalConfig);
      
      // Verify client is working
      if (!clientInstance.isInitialized()) {
        throw new Error('Failed to initialize DFNS client');
      }

      setClient(clientInstance);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize DFNS client';
      setError(errorMessage);
      setClient(null);
    } finally {
      setIsLoading(false);
    }
  }, [finalConfig]);

  // Reinitialize client
  const reinitialize = useCallback(async () => {
    await initializeClient();
  }, [initializeClient]);

  // Initialize on mount and when config changes
  useEffect(() => {
    initializeClient();
  }, [initializeClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setClient(null);
      setError(null);
    };
  }, []);

  return {
    client,
    isLoading,
    error,
    isInitialized: client?.isInitialized() ?? false,
    reinitialize,
  };
}

/**
 * Hook for DFNS client status
 */
export function useDfnsStatus() {
  const { client, isLoading, error, isInitialized } = useDfns();

  return {
    isConnected: isInitialized && !error,
    isLoading,
    error,
    status: isLoading 
      ? 'connecting' 
      : error 
        ? 'error' 
        : isInitialized 
          ? 'connected' 
          : 'disconnected',
  };
}

export default useDfns;
