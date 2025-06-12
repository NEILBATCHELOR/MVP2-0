/**
 * Utility functions for formatting values consistently across the application
 */

/**
 * Format a date string for display
 * @param dateString ISO date string
 * @returns Formatted date string (e.g. "Jun 15, 2023")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Format a token amount for display
 * @param amount Token amount
 * @param tokenType Type of token (ERC-20, ERC-721, etc.)
 * @returns Formatted token amount with appropriate precision
 */
export function formatTokenAmount(amount: number, tokenType: string): string {
  // For fungible tokens (ERC-20), format with comma separators and 2 decimal places
  if (tokenType.includes('ERC-20') || tokenType === 'Native') {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  // For non-fungible tokens, just use comma separators with no decimals
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Format a currency amount for display
 * @param amount Currency amount
 * @param currency Currency code (USD, EUR, etc.)
 * @returns Formatted currency amount with appropriate currency symbol
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

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
 * Format a percentage for display
 * @param value Decimal value (e.g. 0.15 for 15%)
 * @param decimalPlaces Number of decimal places to show
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimalPlaces: number = 2): string {
  return `${(value * 100).toFixed(decimalPlaces)}%`;
}

/**
 * Capitalize the first letter of each word in a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
export function capitalizeWords(str: string): string {
  if (!str) return '';
  
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a gas price from wei to gwei
 * @param weiValue Gas price in wei
 * @returns Formatted gas price in gwei
 */
export function formatGasPrice(weiValue: string | number): string {
  const value = Number(weiValue) / 1e9; // Convert wei to gwei
  return `${value.toFixed(2)} Gwei`;
}

/**
 * Format a role name for display
 * @param role Role name from database
 * @returns Formatted role name
 */
export function formatRoleForDisplay(role: string): string {
  if (!role) return 'Unknown Role';
  
  // Convert snake_case or UPPER_CASE to Title Case
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a balance amount for display
 * @param balance Balance amount as string
 * @param precision Number of decimal places to show
 * @returns Formatted balance string
 */
export function formatBalance(balance: string | number, precision: number = 6): string {
  const value = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (isNaN(value)) return '0';
  
  // For very small amounts, show more precision
  if (value < 0.001 && value > 0) {
    return value.toFixed(8);
  }
  
  // For normal amounts, use specified precision
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  });
} 