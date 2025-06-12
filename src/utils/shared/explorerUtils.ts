/**
 * Blockchain explorer utilities for generating links to transactions, addresses, and blocks
 */

// Explorer URLs for different blockchain networks
const EXPLORER_URLS: Record<string, { base: string; transaction: string; address: string; block: string }> = {
  ethereum: {
    base: 'https://etherscan.io',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  'ethereum-goerli': {
    base: 'https://goerli.etherscan.io',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  'ethereum-sepolia': {
    base: 'https://sepolia.etherscan.io',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  polygon: {
    base: 'https://polygonscan.com',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  'polygon-mumbai': {
    base: 'https://mumbai.polygonscan.com',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  'polygon-amoy': {
    base: 'https://amoy.polygonscan.com',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  arbitrum: {
    base: 'https://arbiscan.io',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  'arbitrum-goerli': {
    base: 'https://goerli.arbiscan.io',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  optimism: {
    base: 'https://optimistic.etherscan.io',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  'optimism-goerli': {
    base: 'https://goerli-optimism.etherscan.io',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  base: {
    base: 'https://basescan.org',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  'base-goerli': {
    base: 'https://goerli.basescan.org',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  avalanche: {
    base: 'https://snowtrace.io',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  'avalanche-fuji': {
    base: 'https://testnet.snowtrace.io',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  bsc: {
    base: 'https://bscscan.com',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  'bsc-testnet': {
    base: 'https://testnet.bscscan.com',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  solana: {
    base: 'https://explorer.solana.com',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  'solana-devnet': {
    base: 'https://explorer.solana.com',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  bitcoin: {
    base: 'https://blockstream.info',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  },
  'bitcoin-testnet': {
    base: 'https://blockstream.info/testnet',
    transaction: '/tx/',
    address: '/address/',
    block: '/block/'
  }
};

/**
 * Get the explorer URL for a blockchain item (transaction, address, or block)
 * @param blockchain The blockchain network
 * @param hash The transaction hash, address, or block hash/number
 * @param type The type of item ('transaction', 'address', or 'block')
 * @returns The full explorer URL
 */
export function getExplorerUrl(blockchain: string, hash: string, type: 'transaction' | 'address' | 'block' = 'transaction'): string {
  if (!hash) return '';
  
  const normalizedBlockchain = blockchain.toLowerCase();
  const explorerConfig = EXPLORER_URLS[normalizedBlockchain];
  
  if (!explorerConfig) {
    console.warn(`Explorer URL not configured for blockchain: ${blockchain}`);
    return '';
  }
  
  let path: string;
  switch (type) {
    case 'address':
      path = explorerConfig.address;
      break;
    case 'block':
      path = explorerConfig.block;
      break;
    case 'transaction':
    default:
      path = explorerConfig.transaction;
      break;
  }
  
  // Handle Solana explorer URLs which need cluster parameter
  if (normalizedBlockchain.startsWith('solana')) {
    const cluster = normalizedBlockchain === 'solana' ? '' : '?cluster=devnet';
    return `${explorerConfig.base}${path}${hash}${cluster}`;
  }
  
  return `${explorerConfig.base}${path}${hash}`;
}

/**
 * Get the base explorer URL for a blockchain
 * @param blockchain The blockchain network
 * @returns The base explorer URL
 */
export function getExplorerBaseUrl(blockchain: string): string {
  const normalizedBlockchain = blockchain.toLowerCase();
  const explorerConfig = EXPLORER_URLS[normalizedBlockchain];
  
  if (!explorerConfig) {
    console.warn(`Explorer URL not configured for blockchain: ${blockchain}`);
    return '';
  }
  
  return explorerConfig.base;
}

/**
 * Check if explorer URL is available for a blockchain
 * @param blockchain The blockchain network
 * @returns True if explorer URL is configured
 */
export function hasExplorerSupport(blockchain: string): boolean {
  const normalizedBlockchain = blockchain.toLowerCase();
  return normalizedBlockchain in EXPLORER_URLS;
}

/**
 * Get all supported blockchains for explorer URLs
 * @returns Array of supported blockchain names
 */
export function getSupportedExplorers(): string[] {
  return Object.keys(EXPLORER_URLS);
}
