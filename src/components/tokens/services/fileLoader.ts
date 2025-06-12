/**
 * File Loader Service
 * 
 * Provides utilities for loading JSON files from the file system
 */

// Base paths for product JSON files (now in public folder)
const BASE_PATH = '/JSON_Products';

// Known directory structure for JSON products
const KNOWN_CATEGORIES = {
  PRIMARY: 'Primary',
  ALTERNATIVE: 'Alternative'
};

// Known product types based on directory structure
const KNOWN_PRODUCT_TYPES = [
  'Bonds',
  'Carbon Credits',
  'Commodities',
  'Digital Tokenized Fund',
  'Energy',
  'Equity',
  'Funds, ETFs, ETPs',
  'Infrastructure',
  'Private Debt',
  'Private Equity',
  'Quantitative Strategies',
  'Real Estate',
  'Structured Products',
  'Asset Backed or Invoice Receivables',
  'Collectibles & Other Assets',
  'Solar and Wind Energy, Climate Receivables'
];

/**
 * Check if a file exists by making a HEAD request
 * @param filePath Path to check
 * @returns Promise that resolves to true if file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const response = await fetch(filePath, { method: 'HEAD' });
    return response.ok && !response.headers.get('content-type')?.includes('text/html');
  } catch (error) {
    return false;
  }
}

/**
 * Load a JSON file from the specified path
 * @param filePath Path to the JSON file
 * @param forceRawText If true, return the raw text content without parsing
 * @returns The parsed JSON content or raw text if forceRawText is true
 */
export async function loadJsonFile(filePath: string, forceRawText: boolean = false): Promise<any> {
  try {
    console.log(`Loading JSON file: ${filePath}`);
    
    // First check if the file exists
    const exists = await fileExists(filePath);
    if (!exists) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    // Ensure the path starts with a slash for fetch
    const fetchPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    
    // Attempt to fetch the actual JSON file
    const response = await fetch(fetchPath);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    // Check if the response is HTML (which would indicate a 404 page or similar)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(`Received HTML instead of JSON for file: ${filePath}`);
    }
    
    // Get the text content
    const textContent = await response.text();
    
    // If raw text is requested, return the content as is
    if (forceRawText) {
      return textContent;
    }
    
    // Otherwise try to parse as JSON
    try {
      return JSON.parse(textContent);
    } catch (parseError) {
      throw new Error(`Failed to parse JSON from file: ${filePath}. Error: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error loading JSON file:', error);
    throw new Error(`Failed to load JSON file: ${filePath}. Error: ${error.message}`);
  }
}

/**
 * Extract token standard from file path
 * @param filePath The file path
 * @returns The token standard (e.g., 'ERC20', 'ERC721', etc.) or undefined if not found
 */
export function extractTokenStandardFromPath(filePath: string): string | undefined {
  const tokenStandards = ['ERC20', 'ERC721', 'ERC1155', 'ERC1400', 'ERC3525', 'ERC4626'];
  
  for (const standard of tokenStandards) {
    if (filePath.includes(standard)) {
      return standard;
    }
  }
  
  return undefined;
}

/**
 * Extract config mode from file path
 * @param filePath The file path
 * @returns The config mode ('min' or 'max') or undefined if not found
 */
export function extractConfigModeFromPath(filePath: string): 'min' | 'max' | undefined {
  if (filePath.toLowerCase().includes('min')) {
    return 'min';
  } else if (filePath.toLowerCase().includes('max')) {
    return 'max';
  } else {
    // Default to max if not specified
    return 'max';
  }
}

/**
 * Get all available categories
 * @returns Array of category names
 */
export function getCategories(): string[] {
  return Object.values(KNOWN_CATEGORIES);
}

/**
 * Get all product types from the file system
 * @returns Array of product type names
 */
export function getProductTypes(): string[] {
  return KNOWN_PRODUCT_TYPES;
}