/**
 * Address formatting utilities
 */

/**
 * Format an address for display by truncating the middle
 * @param address Wallet or contract address
 * @param startChars Number of characters to show at the start
 * @param endChars Number of characters to show at the end
 * @returns Truncated address (e.g. "0x1a2b...7g8h")
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Format address with ENS name if available
 */
export function formatAddressWithENS(address: string, ensName?: string): string {
  if (ensName) {
    return ensName;
  }
  return formatAddress(address);
}

/**
 * Format address for different contexts
 */
export function formatAddressForContext(address: string, context: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!address) return '';
  
  switch (context) {
    case 'short':
      return formatAddress(address, 4, 4);
    case 'medium':
      return formatAddress(address, 6, 4);
    case 'long':
      return formatAddress(address, 10, 6);
    default:
      return formatAddress(address);
  }
}

/**
 * Check if address needs formatting (is longer than typical display length)
 */
export function shouldFormatAddress(address: string, maxLength: number = 12): boolean {
  return address && address.length > maxLength;
}
