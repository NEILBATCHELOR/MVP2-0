/**
 * RPC Configuration
 * 
 * This file provides RPC endpoints for various blockchain networks.
 * Used as a fallback when environment variables are not available.
 */

// Get API keys from environment variables with fallbacks
const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY || 'Z3UXs7SblJNf-xGhHBc63iDRi9xqWCYP';
const QUICKNODE_API_KEY = import.meta.env.VITE_QUICKNODE_API_KEY || '5dc455368b6e13a2f7885bd651641ef622fe2151';

// RPC endpoint configuration - matching the user's .env variables
export const RPC_CONFIG = {
  // Ethereum Networks
  ethereum: {
    mainnet: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    testnet: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  },
  
  // Polygon Networks
  polygon: {
    mainnet: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    testnet: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  },
  
  // Optimism Networks
  optimism: {
    mainnet: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    testnet: `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  },
  
  // Arbitrum Networks
  arbitrum: {
    mainnet: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    testnet: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  },
  
  // Base Networks
  base: {
    mainnet: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    testnet: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  },
  
  // zkSync Networks
  zksync: {
    mainnet: `https://zksync-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    testnet: `https://zksync-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  },
  
  // Solana Networks
  solana: {
    mainnet: `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    testnet: `https://solana-devnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  },
  
  // Bitcoin Networks
  bitcoin: {
    mainnet: `https://proud-skilled-fog.blast-mainnet.quiknode.pro/${QUICKNODE_API_KEY}`,
    testnet: `https://proud-skilled-fog.btc-testnet.quiknode.pro/${QUICKNODE_API_KEY}`
  },
  
  // Aptos Networks
  aptos: {
    mainnet: `https://proud-skilled-fog.aptos-mainnet.quiknode.pro/${QUICKNODE_API_KEY}`,
    testnet: `https://proud-skilled-fog.aptos-testnet.quiknode.pro/${QUICKNODE_API_KEY}`
  },
  
  // Sui Networks
  sui: {
    mainnet: `https://proud-skilled-fog.sui-mainnet.quiknode.pro/${QUICKNODE_API_KEY}`,
    testnet: `https://proud-skilled-fog.sui-testnet.quiknode.pro/${QUICKNODE_API_KEY}`
  },
  
  // NEAR Networks
  near: {
    mainnet: `https://proud-skilled-fog.near-mainnet.quiknode.pro/${QUICKNODE_API_KEY}`,
    testnet: `https://proud-skilled-fog.near-testnet.quiknode.pro/${QUICKNODE_API_KEY}`
  },
  
  // Avalanche Networks
  avalanche: {
    mainnet: `https://proud-skilled-fog.avalanche-mainnet.quiknode.pro/${QUICKNODE_API_KEY}/ext/bc/C/rpc/`,
    testnet: `https://proud-skilled-fog.avalanche-testnet.quiknode.pro/${QUICKNODE_API_KEY}/ext/bc/C/rpc/`
  },
  
  // Mantle Networks
  mantle: {
    mainnet: `https://mantle-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    testnet: `https://mantle-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  },
  
  // Hedera Networks - Add placeholder URLs
  hedera: {
    mainnet: "https://mainnet.hashio.io/api",
    testnet: "https://testnet.hashio.io/api"
  }
};

// Factory Addresses (placeholders based on user's env - actual values are hidden)
export const FACTORY_ADDRESSES = {
  ethereum: {
    mainnet: import.meta.env.VITE_MAINNET_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000",
    testnet: import.meta.env.VITE_GOERLI_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000"
  },
  polygon: {
    mainnet: import.meta.env.VITE_POLYGON_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000",
    testnet: import.meta.env.VITE_MUMBAI_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000"
  }
};

/**
 * Get RPC URL from environment variables or fallback to default
 */
export const getRpcUrl = (blockchain: string, isTestnet: boolean = true): string => {
  const environment = isTestnet ? 'testnet' : 'mainnet';
  
  // Try to get URL from environment variables first
  let envUrl: string | undefined;
  
  if (isTestnet) {
    // Map of blockchain names to testnet env variable names
    const testnetEnvMap: Record<string, string> = {
      ethereum: 'VITE_SEPOLIA_RPC_URL',
      polygon: 'VITE_AMOY_RPC_URL',
      optimism: 'VITE_OPTIMISM_SEPOLIA_RPC_URL',
      arbitrum: 'VITE_ARBITRUM_SEPOLIA_RPC_URL',
      base: 'VITE_BASE_SEPOLIA_RPC_URL',
      zksync: 'VITE_ZKSYNC_SEPOLIA_RPC_URL',
      solana: 'VITE_SOLANA_DEVNET_RPC_URL',
      bitcoin: 'VITE_BITCOIN_TESTNET_RPC_URL',
      aptos: 'VITE_APTOS_TESTNET_RPC_URL',
      near: 'VITE_NEAR_TESTNET_RPC_URL',
      avalanche: 'VITE_AVALANCHE_TESTNET_RPC_URL',
      mantle: 'VITE_MANTLE_TESTNET_RPC_URL',
      holesky: 'VITE_HOLEKSY_RPC_URL'
    };
    
    const envKey = testnetEnvMap[blockchain];
    if (envKey) {
      envUrl = import.meta.env[envKey];
    }
    
    // If not found in the map, try the standardized naming pattern
    if (!envUrl) {
      const testnetKey = `VITE_${blockchain.toUpperCase()}_TESTNET_RPC_URL`;
      envUrl = import.meta.env[testnetKey];
    }
  } else {
    // Mainnet URLs
    const mainnetEnvMap: Record<string, string> = {
      ethereum: 'VITE_MAINNET_RPC_URL',
      polygon: 'VITE_POLYGON_RPC_URL',
      optimism: 'VITE_OPTIMISM_RPC_URL',
      arbitrum: 'VITE_ARBITRUM_RPC_URL',
      base: 'VITE_BASE_RPC_URL',
      zksync: 'VITE_ZKSYNC_RPC_URL',
      solana: 'VITE_SOLANA_RPC_URL',
      bitcoin: 'VITE_BITCOIN_RPC_URL',
      aptos: 'VITE_APTOS_RPC_URL',
      sui: 'VITE_SUI_RPC_URL',
      near: 'VITE_NEAR_RPC_URL',
      avalanche: 'VITE_AVALANCHE_RPC_URL'
    };
    
    const envKey = mainnetEnvMap[blockchain];
    if (envKey) {
      envUrl = import.meta.env[envKey];
    }
    
    // If not found in the map, try the standardized naming pattern
    if (!envUrl) {
      const mainnetKey = `VITE_${blockchain.toUpperCase()}_RPC_URL`;
      envUrl = import.meta.env[mainnetKey];
    }
  }
  
  // Return env URL if available, otherwise fallback to config
  if (envUrl) return envUrl;
  
  // Fallback to hardcoded config
  return RPC_CONFIG[blockchain]?.[environment] || '';
};

export default RPC_CONFIG;