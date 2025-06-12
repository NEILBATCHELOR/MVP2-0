import { initCube3Service, enableDebugLogging, getSupportedNetworks } from "@/services/integrations/cube3Service";

export interface Cube3Config {
  apiKey: string;
  apiUrl?: string;
  debug?: boolean;
  defaultChainId?: number;
  onInitSuccess?: () => void;
  onInitError?: (error: Error) => void;
}

// Initialize the CUBE3 service with the API key from environment variables
// This should be called early in your application's lifecycle, such as in _app.tsx
export const initializeCube3 = (customConfig?: Partial<Cube3Config>): boolean => {
  // Get configuration from environment variables, overridden by custom config if provided
  const config: Cube3Config = {
    apiKey: customConfig?.apiKey ?? process.env.NEXT_PUBLIC_CUBE3_API_KEY ?? '',
    apiUrl: customConfig?.apiUrl ?? process.env.NEXT_PUBLIC_CUBE3_API_URL,
    debug: customConfig?.debug ?? (process.env.NEXT_PUBLIC_CUBE3_DEBUG === 'true'),
    defaultChainId: customConfig?.defaultChainId ?? Number(process.env.NEXT_PUBLIC_CUBE3_DEFAULT_CHAIN_ID || '1'),
    onInitSuccess: customConfig?.onInitSuccess,
    onInitError: customConfig?.onInitError,
  };
  
  if (!config.apiKey) {
    console.warn("CUBE3 API key not found in environment variables or custom config. Wallet risk assessment will not work.");
    config.onInitError?.(new Error("CUBE3 API key not provided"));
    return false;
  }
  
  try {
    // Enable debug mode if specified
    if (config.debug) {
      enableDebugLogging(true);
    }
    
    // Initialize the service
    const initialized = initCube3Service(config.apiKey, config.apiUrl);
    
    if (initialized) {
      console.log(`CUBE3 service initialized successfully (defaultChainId: ${config.defaultChainId})`);
      
      // Load supported networks in the background for reference
      getSupportedNetworks().then(result => {
        if (result.success && result.data) {
          console.log(`CUBE3 supports ${result.data.length} networks`);
        }
      }).catch(err => {
        console.warn("Failed to fetch supported networks:", err);
      });
      
      // Call success callback if provided
      config.onInitSuccess?.();
      return true;
    } else {
      throw new Error("Service initialization returned false");
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error during CUBE3 initialization");
    console.error("Failed to initialize CUBE3 service:", err);
    config.onInitError?.(err);
    return false;
  }
};

// Check if CUBE3 service is available
export const isCube3Available = (): boolean => {
  return !!process.env.NEXT_PUBLIC_CUBE3_API_KEY;
};

// Get default supported configuration
export const getDefaultCube3Config = (): Partial<Cube3Config> => {
  return {
    apiKey: process.env.NEXT_PUBLIC_CUBE3_API_KEY ?? '',
    apiUrl: process.env.NEXT_PUBLIC_CUBE3_API_URL,
    debug: process.env.NEXT_PUBLIC_CUBE3_DEBUG === 'true',
    defaultChainId: Number(process.env.NEXT_PUBLIC_CUBE3_DEFAULT_CHAIN_ID || '1'),
  };
}; 