/**
 * Address utilities - Re-exports and additional address-related functions
 */

// Re-export all functions from formatAddress.ts
export {
  formatAddress,
  formatAddressWithENS,
  formatAddressForContext,
  shouldFormatAddress
} from './formatAddress';

// Re-export validation functions from addressValidation.ts
export {
  isValidEthereumAddress,
  isValidBitcoinAddress,
  isValidSolanaAddress,
  validateAddress,
  getAddressType
} from './addressValidation';

/**
 * Additional address utilities
 */

/**
 * Get shortened address for display
 * @param address The address to shorten
 * @param length The desired length (default: 10)
 * @returns Shortened address
 */
export function getShortAddress(address: string, length: number = 10): string {
  if (!address || address.length <= length) {
    return address;
  }
  // Inline format to avoid circular dependency
  const startChars = Math.floor(length / 2);
  const endChars = Math.floor(length / 2) - 2;
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Check if two addresses are the same (case-insensitive)
 * @param address1 First address
 * @param address2 Second address
 * @returns True if addresses are the same
 */
export function isSameAddress(address1: string, address2: string): boolean {
  if (!address1 || !address2) return false;
  return address1.toLowerCase() === address2.toLowerCase();
}

/**
 * Normalize address to lowercase
 * @param address The address to normalize
 * @returns Normalized address
 */
export function normalizeAddress(address: string): string {
  if (!address) return '';
  return address.toLowerCase();
}

/**
 * Get address checksum for Ethereum addresses
 * @param address The Ethereum address
 * @returns Checksummed address
 */
export function getChecksumAddress(address: string): string {
  if (!address) return '';
  
  // Basic checksum implementation - in production, use a proper library like ethers.js
  const lowerCaseAddress = address.toLowerCase().replace('0x', '');
  let result = '0x';
  
  for (let i = 0; i < lowerCaseAddress.length; i++) {
    const char = lowerCaseAddress[i];
    if (parseInt(char, 16) >= 8) {
      result += char.toUpperCase();
    } else {
      result += char;
    }
  }
  
  return result;
}

/**
 * Extract address from various input formats
 * @param input The input string that may contain an address
 * @returns Extracted address or empty string
 */
export function extractAddress(input: string): string {
  if (!input) return '';
  
  // Ethereum address pattern
  const ethMatch = input.match(/0x[a-fA-F0-9]{40}/);
  if (ethMatch) return ethMatch[0];
  
  // Bitcoin address patterns
  const btcMatch = input.match(/[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59}/);
  if (btcMatch) return btcMatch[0];
  
  // Solana address pattern
  const solMatch = input.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
  if (solMatch) return solMatch[0];
  
  return '';
}

/**
 * Mask address for privacy (shows only first and last few characters)
 * @param address The address to mask
 * @param visibleChars Number of characters to show at start and end
 * @returns Masked address
 */
export function maskAddress(address: string, visibleChars: number = 4): string {
  if (!address || address.length <= visibleChars * 2) {
    return address;
  }
  
  const start = address.substring(0, visibleChars);
  const end = address.substring(address.length - visibleChars);
  const middle = '*'.repeat(Math.min(8, address.length - visibleChars * 2));
  
  return `${start}${middle}${end}`;
}
