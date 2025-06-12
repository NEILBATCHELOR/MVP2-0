import { TokenStatus, TokenStandard } from "@/types/core/centralModels";
import { getFormattedStandard } from "./standardsConfig";

type BadgeVariant = "default" | "destructive" | "outline" | "secondary";

/**
 * Format token status for display
 */
export function formatTokenStatus(status: string | TokenStatus): string {
  if (!status) return "Unknown";
  
  // Convert to title case for display
  const statusStr = String(status);
  
  switch (statusStr.toUpperCase()) {
    case TokenStatus.DRAFT: return "Draft";
    case TokenStatus.REVIEW: return "Under Review";
    case TokenStatus.APPROVED: return "Approved";
    case TokenStatus.READY_TO_MINT: return "Ready to Mint";
    case TokenStatus.MINTED: return "Minted";
    case TokenStatus.DEPLOYED: return "Deployed";
    case TokenStatus.PAUSED: return "Paused";
    case TokenStatus.DISTRIBUTED: return "Distributed";
    case TokenStatus.REJECTED: return "Rejected";
    default: return statusStr;
  }
}

/**
 * Get the appropriate variant for status badges
 */
export function getStatusVariant(status: string | TokenStatus): BadgeVariant {
  switch (String(status).toUpperCase()) {
    case TokenStatus.DRAFT: return "outline";
    case TokenStatus.REVIEW: return "secondary";
    case TokenStatus.APPROVED: return "default";
    case TokenStatus.READY_TO_MINT: return "secondary";
    case TokenStatus.MINTED: return "default";
    case TokenStatus.DEPLOYED: return "default";
    case TokenStatus.PAUSED: return "outline";
    case TokenStatus.DISTRIBUTED: return "default";
    case TokenStatus.REJECTED: return "destructive";
    default: return "outline";
  }
}

/**
 * Format standard name for display (e.g., "ERC20" -> "ERC-20")
 */
export function formatStandardName(standard: string): string {
  if (!standard) return "Unknown";
  
  // Use the centralized formatter from standardsConfig
  return getFormattedStandard(standard);
}

/**
 * Format token type for display in Title Case
 */
export function formatTokenType(tokenType: string): string {
  if (!tokenType) return "Unassigned";
  
  // Convert to Title Case (capitalize first letter of each word)
  return tokenType
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a number with commas for better readability
 * @param value The number or string to format
 * @returns Formatted string with commas
 */
export function formatNumber(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') {
    return '0';
  }
  
  // Convert to string if it's a number
  const strValue = typeof value === 'number' ? value.toString() : value;
  
  // Check if it's a valid number
  if (!/^-?\d*\.?\d*$/.test(strValue)) {
    return strValue;
  }

  // Handle decimal numbers
  const parts = strValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
}

/**
 * Get a display label for a token's standard
 */
export function getStandardLabel(token: any): string {
  // For grouped templates, return the concatenated standards
  if (token.isGroup && token.standards) {
    return token.standards.map((s: any) => getFormattedStandard(s.standard)).join(', ');
  }
  
  // Try to get standard from metadata if it exists
  if (token.metadata && token.metadata.product) {
    return token.metadata.product;
  }
  
  // Check for specific standardKey in metadata
  if (token.metadata && token.metadata.standardKey) {
    return getFormattedStandard(token.metadata.standardKey);
  }
  
  // Special case for the table view - if token standard is just "721", "1155", etc.
  if (token.standard && /^\d+$/.test(token.standard)) {
    return getFormattedStandard(token.standard);
  }
  
  // Fallback to standard property with proper formatting
  return getFormattedStandard(token.standard) || "Unknown";
}