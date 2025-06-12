// Token type theme utilities for consistent styling across the application

// Token type color themes mapping
export const getTokenTypeTheme = (tokenType: string, tokenStandard?: string) => {
  // Normalize the input to remove hyphens and make uppercase
  const normalizedType = tokenType.toUpperCase().replace(/-/g, '');
  
  // Direct standard mapping with normalized keys
  const standardMap: Record<string, { bg: string, border: string, text: string, badge: string }> = {
    // Format: { bg: "background", border: "border", text: "text color", badge: "badge background" }
    "ERC20": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-800" },
    "ERC721": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", badge: "bg-purple-100 text-purple-800" },
    "ERC1155": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-100 text-amber-800" },
    "ERC1400": { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", badge: "bg-green-100 text-green-800" },
    "ERC3525": { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-800", badge: "bg-pink-100 text-pink-800" },
    "ERC4626": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-800", badge: "bg-cyan-100 text-cyan-800" },
    "FACTORING": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-800" },
    "default": { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", badge: "bg-gray-100 text-gray-800" }
  };

  // Also add entries with hyphens for direct DB values (ERC-20)
  standardMap["ERC-20"] = standardMap["ERC20"];
  standardMap["ERC-721"] = standardMap["ERC721"];
  standardMap["ERC-1155"] = standardMap["ERC1155"];
  standardMap["ERC-1400"] = standardMap["ERC1400"];
  standardMap["ERC-3525"] = standardMap["ERC3525"];
  standardMap["ERC-4626"] = standardMap["ERC4626"];

  // Direct check for known standards
  if (standardMap[normalizedType]) {
    return standardMap[normalizedType];
  }
  
  // Also try the non-normalized type (might be from DB with hyphens)
  if (standardMap[tokenType]) {
    return standardMap[tokenType];
  }
  
  // If we don't have a direct match, extract the standard
  const extractedStandard = extractStandard(tokenType);
  if (extractedStandard && standardMap[extractedStandard]) {
    return standardMap[extractedStandard];
  }
  
  // If tokenStandard is directly provided, try that
  if (tokenStandard) {
    const normalizedStandard = tokenStandard.toUpperCase().replace(/-/g, '');
    if (standardMap[normalizedStandard]) {
      return standardMap[normalizedStandard];
    }
  }
  
  // Special case for factoring
  if (tokenType.toUpperCase().includes('FACTORING')) {
    return standardMap.FACTORING;
  }
  
  // Special case for equity
  if (tokenType.toLowerCase().includes('equity')) {
    return standardMap.ERC20;
  }
  
  // Special case for NFTs
  if (tokenType.toLowerCase().includes('nft')) {
    return standardMap.ERC721;
  }
  
  // Return the default if nothing matches
  return standardMap.default;
};

// Extract standard from token type
export const extractStandard = (tokenType: string): string => {
  if (!tokenType) return "";
  
  // IMMEDIATE CHECK: Is this a specific known standard with or without hyphens?
  const standardsMap = {
    "ERC20": "ERC20", "ERC-20": "ERC20",
    "ERC721": "ERC721", "ERC-721": "ERC721",
    "ERC1155": "ERC1155", "ERC-1155": "ERC1155",
    "ERC1400": "ERC1400", "ERC-1400": "ERC1400",
    "ERC3525": "ERC3525", "ERC-3525": "ERC3525",
    "ERC4626": "ERC4626", "ERC-4626": "ERC4626"
  };
  
  if (standardsMap[tokenType]) {
    return standardsMap[tokenType];
  }
  
  // Check if tokenType is already just a standard with numbers (ERC followed by numbers)
  if (/^ERC[-]?[0-9]+$/i.test(tokenType)) {
    const standardOnly = tokenType.replace(/-/g, '').toUpperCase();
    return standardOnly;
  }
  
  // Pattern 1: Name (Symbol) - Standard
  let matches = tokenType.match(/ - (ERC[-]?[0-9]+)/i);
  
  // Pattern 2: Standard in the name part
  if (!matches) {
    matches = tokenType.match(/(ERC[-]?[0-9]+)/i);
  }
  
  if (matches) {
    const standard = matches[1].replace(/-/g, '').toUpperCase();
    return standard;
  }
  
  // Special case handling for non-standard types
  if (tokenType.toLowerCase().includes('equity')) {
    return "ERC20";
  }
  
  if (tokenType.toLowerCase().includes('factoring')) {
    return "FACTORING";
  }
  
  if (tokenType.toLowerCase().includes('nft')) {
    return "ERC721";
  }
  
  return "";
};

// Generate a proper UUID v4 format string for transaction hashes
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Format number with proper separators
export const formatNumber = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format token type for display
export const formatTokenType = (type: string): string => {
  if (!type) return "Unknown";
  
  // Special case for factoring - always display in all caps
  if (type.toLowerCase().includes('factoring')) {
    return "FACTORING";
  }
  
  // Handle standards with or without hyphens
  const standardMatch = type.match(/(ERC[-]?[0-9]+)/i);
  if (standardMatch) {
    const normalized = standardMatch[1].toUpperCase().replace(/-/g, '-');
    // Insert hyphen if not present
    if (!normalized.includes('-')) {
      return normalized.replace(/^(ERC)(\d+)$/, '$1-$2');
    }
    return normalized;
  }
  
  return type;
}; 