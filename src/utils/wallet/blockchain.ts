/**
 * Utility functions for blockchain operations
 */

import { NetworkEnvironment } from '@/infrastructure/web3/ProviderManager';

/**
 * Get the appropriate blockchain explorer URL for a given chain and data
 * @param blockchain The blockchain identifier (e.g., 'ethereum', 'polygon')
 * @param data The data to view (address, transaction hash, etc.)
 * @param type The type of data ('address', 'transaction', 'token', 'block')
 * @param environment Optional network environment (MAINNET or TESTNET)
 * @returns The explorer URL
 */
export const getExplorerUrl = (
  blockchain: string,
  data: string,
  type: 'address' | 'transaction' | 'token' | 'block',
  environment: NetworkEnvironment = NetworkEnvironment.MAINNET
): string => {
  // Normalize blockchain name to lowercase
  const chain = blockchain.toLowerCase();
  
  // Base explorer URLs for different chains
  const explorers: Record<string, { main: string, test: string }> = {
    ethereum: {
      main: 'https://etherscan.io',
      test: 'https://goerli.etherscan.io' // Using Goerli as default testnet
    },
    polygon: {
      main: 'https://polygonscan.com',
      test: 'https://mumbai.polygonscan.com'
    },
    arbitrum: {
      main: 'https://arbiscan.io',
      test: 'https://goerli.arbiscan.io'
    },
    optimism: {
      main: 'https://optimistic.etherscan.io',
      test: 'https://goerli-optimism.etherscan.io'
    },
    base: {
      main: 'https://basescan.org',
      test: 'https://goerli.basescan.org'
    },
    zksync: {
      main: 'https://explorer.zksync.io',
      test: 'https://goerli.explorer.zksync.io'
    },
    avalanche: {
      main: 'https://snowtrace.io',
      test: 'https://testnet.snowtrace.io'
    },
    bsc: {
      main: 'https://bscscan.com',
      test: 'https://testnet.bscscan.com'
    },
    solana: {
      main: 'https://solscan.io',
      test: 'https://solscan.io'
    },
    near: {
      main: 'https://explorer.near.org',
      test: 'https://explorer.testnet.near.org'
    },
    aptos: {
      main: 'https://explorer.aptoslabs.com',
      test: 'https://explorer.aptoslabs.com/testnet'
    },
    sui: {
      main: 'https://explorer.sui.io',
      test: 'https://explorer.sui.io/testnet'
    }
  };
  
  // Default to Ethereum if chain not found
  const explorerBase = explorers[chain] || explorers.ethereum;
  const baseUrl = environment === NetworkEnvironment.MAINNET ? explorerBase.main : explorerBase.test;
  
  // Construct URL based on data type
  // For non-EVM chains, adjust the URL pattern as needed
  if (chain === 'solana') {
    switch (type) {
      case 'address':
        return `${baseUrl}/account/${data}`;
      case 'transaction':
        return `${baseUrl}/tx/${data}`;
      case 'token':
        return `${baseUrl}/token/${data}`;
      case 'block':
        return `${baseUrl}/block/${data}`;
    }
  } else if (chain === 'near') {
    const networkPath = environment === NetworkEnvironment.MAINNET ? '' : '/testnet';
    switch (type) {
      case 'address':
        return `${baseUrl}${networkPath}/address/${data}`;
      case 'transaction':
        return `${baseUrl}${networkPath}/transactions/${data}`;
      case 'token':
        return `${baseUrl}${networkPath}/token/${data}`;
      case 'block':
        return `${baseUrl}${networkPath}/blocks/${data}`;
    }
  } else if (chain === 'aptos' || chain === 'sui') {
    switch (type) {
      case 'address':
        return `${baseUrl}/account/${data}`;
      case 'transaction':
        return `${baseUrl}/txn/${data}`;
      case 'token':
        return `${baseUrl}/coin/${data}`;
      case 'block':
        return `${baseUrl}/block/${data}`;
    }
  } else {
    // Standard EVM-compatible chains
    switch (type) {
      case 'address':
        return `${baseUrl}/address/${data}`;
      case 'transaction':
        return `${baseUrl}/tx/${data}`;
      case 'token':
        return `${baseUrl}/token/${data}`;
      case 'block':
        return `${baseUrl}/block/${data}`;
    }
  }
  
  return baseUrl;
};

/**
 * Format an address for display (e.g., 0x1234...5678)
 * @param address The blockchain address
 * @param prefixLength Number of characters to show at the start
 * @param suffixLength Number of characters to show at the end
 * @returns Formatted address string
 */
export const formatAddress = (
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string => {
  if (!address) return '';
  if (address.length <= prefixLength + suffixLength) return address;
  
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
};

/**
 * Check if an address is valid for a specific blockchain
 * @param address The address to validate
 * @param blockchain The blockchain to validate against
 * @returns Whether the address is valid
 */
export const isValidAddress = (address: string, blockchain: string = 'ethereum'): boolean => {
  if (!address) return false;
  
  const chain = blockchain.toLowerCase();
  
  // EVM-compatible address validation
  if (['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc', 'avalanche'].includes(chain)) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  
  // Solana address validation
  if (chain === 'solana') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
  
  // For other chains, perform basic validation
  return address.length > 10;
};

/**
 * Format a token amount with proper decimals
 * @param amount The token amount as a string or number
 * @param decimals The number of decimals for the token
 * @returns Formatted amount string
 */
export const formatTokenAmount = (amount: string | number, decimals: number = 18): string => {
  if (!amount) return '0';
  
  try {
    const value = typeof amount === 'string' ? amount : amount.toString();
    const parsedValue = parseFloat(value);
    
    if (isNaN(parsedValue)) return '0';
    
    // Format large numbers with commas
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: decimals
    }).format(parsedValue);
  } catch (e) {
    console.error('Error formatting token amount:', e);
    return amount.toString();
  }
};