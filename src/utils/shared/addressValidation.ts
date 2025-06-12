/**
 * Address validation utilities for blockchain addresses
 */

/**
 * Validate an Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address) return false;
  
  // Basic format check
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegex.test(address);
}

/**
 * Validate a Bitcoin address (simplified)
 */
export function isValidBitcoinAddress(address: string): boolean {
  if (!address) return false;
  
  // Basic format checks for different Bitcoin address types
  const legacyRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const segwitRegex = /^bc1[a-z0-9]{39,59}$/;
  const segwitP2SH = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  
  return legacyRegex.test(address) || segwitRegex.test(address) || segwitP2SH.test(address);
}

/**
 * Validate an address based on network
 */
export function validateAddressForNetwork(address: string, network: string): boolean {
  if (!address || !network) return false;
  
  const lowerNetwork = network.toLowerCase();
  
  // Ethereum-based networks
  if (lowerNetwork.includes('ethereum') || 
      lowerNetwork.includes('polygon') || 
      lowerNetwork.includes('arbitrum') || 
      lowerNetwork.includes('optimism') ||
      lowerNetwork.includes('avalanche') ||
      lowerNetwork.includes('binance')) {
    return isValidEthereumAddress(address);
  }
  
  // Bitcoin networks
  if (lowerNetwork.includes('bitcoin')) {
    return isValidBitcoinAddress(address);
  }
  
  // For other networks, do basic non-empty check
  return address.length > 0;
}

/**
 * Get address type for Ethereum addresses
 */
export function getEthereumAddressType(address: string): 'contract' | 'eoa' | 'invalid' {
  if (!isValidEthereumAddress(address)) {
    return 'invalid';
  }
  
  // This is a simplified check - in practice you'd query the blockchain
  // For now, assume it's an EOA (Externally Owned Account)
  return 'eoa';
}

/**
 * Validate a Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address) return false;
  
  // Basic format check for Solana addresses (base58, 44 characters)
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaAddressRegex.test(address) && address.length >= 32 && address.length <= 44;
}

/**
 * Generic address validation function
 */
export function validateAddress(address: string, network?: string): boolean {
  if (!address) return false;
  
  if (network) {
    return validateAddressForNetwork(address, network);
  }
  
  // Try different address formats if no network specified
  return isValidEthereumAddress(address) || 
         isValidBitcoinAddress(address) || 
         isValidSolanaAddress(address);
}

/**
 * Get the type of address based on its format
 */
export function getAddressType(address: string): 'ethereum' | 'bitcoin' | 'solana' | 'unknown' {
  if (!address) return 'unknown';
  
  if (isValidEthereumAddress(address)) {
    return 'ethereum';
  }
  
  if (isValidBitcoinAddress(address)) {
    return 'bitcoin';
  }
  
  if (isValidSolanaAddress(address)) {
    return 'solana';
  }
  
  return 'unknown';
}

/**
 * Normalize address format
 */
export function normalizeAddress(address: string, network?: string): string {
  if (!address) return '';
  
  // For Ethereum-based networks, ensure lowercase (except checksum)
  if (!network || network.toLowerCase().includes('ethereum') || 
      network.toLowerCase().includes('polygon') || 
      network.toLowerCase().includes('arbitrum')) {
    return address.toLowerCase();
  }
  
  return address;
}
