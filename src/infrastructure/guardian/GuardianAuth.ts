import { ed25519 } from '@noble/curves/ed25519';
import GuardianConfigService from './GuardianConfig';
import { createUUID } from '@/utils/guardian/uuidUtils';

export interface GuardianAuthHeaders {
  'x-api-key': string;
  'x-api-signature': string;
  'x-api-timestamp': string;
  'x-api-nonce': string;
  'Content-Type'?: string;
  'Accept'?: string;
}

/**
 * Helper class for generating Guardian API authentication headers
 * Uses the CONFIRMED WORKING signature format from successful tests
 */
export class GuardianAuth {
  private privateKey: Uint8Array;
  private apiKey: string;

  constructor(privateKey: string, apiKey: string) {
    this.privateKey = Buffer.from(privateKey, 'hex');
    this.apiKey = apiKey;
  }

  /**
   * Generate UUID v4 for nonce (also used as operation ID)
   */
  private generateUUID(): string {
    return createUUID();
  }

  /**
   * Sort JSON object keys alphabetically (recursive)
   * CRITICAL for Guardian API signature consistency
   */
  private sortJsonKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortJsonKeys(item));
    }
    
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: any = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortJsonKeys(obj[key]);
    }
    
    return sortedObj;
  }

  /**
   * Get authentication headers for API requests
   * 
   * Returns headers required by Guardian API:
   * - x-api-key: Provided by Guardian Labs
   * - x-api-signature: Ed25519 signature (BASE64 format)
   * - x-api-timestamp: Request timestamp (as string)
   * - x-api-nonce: UUID v4 (required by Guardian)
   */
  async getAuthHeaders(method: string, url: string, body?: string): Promise<GuardianAuthHeaders> {
    const timestamp = Date.now();
    const nonce = this.generateUUID();
    
    let bodyString = '';
    
    if (method.toUpperCase() === 'GET') {
      // 🎯 BREAKTHROUGH: GET requests MUST use empty object {} in signature
      bodyString = '{}';
    } else if (body) {
      // POST requests use actual body content with sorted JSON keys
      try {
        const bodyObj = JSON.parse(body);
        const sortedObj = this.sortJsonKeys(bodyObj);
        bodyString = JSON.stringify(sortedObj);
      } catch (error) {
        bodyString = body; // Use as-is if not valid JSON
      }
    }
    
    // Create signature payload: Method + URL + Body + Timestamp + Nonce
    const payload = `${method.toUpperCase()}${url}${bodyString}${timestamp}${nonce}`;
    
    try {
      // Sign with Ed25519 (direct payload, no hashing)
      const payloadBytes = Buffer.from(payload, 'utf8');
      const signature = ed25519.sign(payloadBytes, this.privateKey);
      
      // 🎯 CONFIRMED WORKING: BASE64 signature format
      const signatureBase64 = Buffer.from(signature).toString('base64');
      
      const headers: GuardianAuthHeaders = {
        'x-api-key': this.apiKey,
        'x-api-signature': signatureBase64,
        'x-api-timestamp': timestamp.toString(),
        'x-api-nonce': nonce,
        'Accept': 'application/json'
      };
      
      // Only add Content-Type for POST requests (not GET)
      if (method.toUpperCase() === 'POST') {
        headers['Content-Type'] = 'application/json';
      }
      
      return headers;
    } catch (error) {
      throw new Error(`Failed to generate auth headers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign API request using Ed25519
   * 
   * Creates signature payload following Guardian API specification:
   * - METHOD + URL + BODY + TIMESTAMP + NONCE (no separators)
   * - Ed25519 signature of payload (direct, no hashing)
   * - Returns BASE64 signature
   */
  async signRequest(method: string, url: string, body?: string): Promise<string> {
    const timestamp = Date.now();
    const nonce = this.generateUUID();
    
    // Sort JSON keys if body is provided
    let bodyString = '';
    if (body) {
      try {
        const bodyObj = JSON.parse(body);
        const sortedObj = this.sortJsonKeys(bodyObj);
        bodyString = JSON.stringify(sortedObj);
      } catch (error) {
        bodyString = body; // Use as-is if not valid JSON
      }
    }
    
    // Create signature payload: METHOD + URL + BODY + TIMESTAMP + NONCE (no separators)
    const payload = `${method.toUpperCase()}${url}${bodyString}${timestamp}${nonce}`;
    
    try {
      // Sign with Ed25519 directly (no hashing)
      const payloadBytes = Buffer.from(payload, 'utf8');
      const signature = ed25519.sign(payloadBytes, this.privateKey);
      return Buffer.from(signature).toString('base64'); // BASE64 format
    } catch (error) {
      throw new Error(`Failed to sign request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Lightweight functional version using the confirmed working format
 * Fixed to handle GET requests properly
 */
export async function signGuardianRequest(
  method: 'GET' | 'POST',
  pathWithQuery: string,
  body?: object
): Promise<{ url: string; headers: Record<string, string> }> {
  const config = GuardianConfigService.getInstance().getConfig();

  const timestamp = Date.now();
  const nonce = createUUID();
  const url = `${config.baseUrl}${pathWithQuery}`;
  
  // 🎯 DIFFERENT BODY HANDLING FOR GET vs POST
  let bodyStr = '';
  if (method.toUpperCase() === 'GET') {
    // Try different approaches for GET requests
    // Approach 1: Empty object (as suggested by class-based auth)
    bodyStr = '{}';
  } else if (body) {
    // POST requests: use actual body with sorted keys (confirmed working)
    bodyStr = JSON.stringify(sortKeys(body));
  }
  
  // Signature payload: METHOD + URL + BODY + TIMESTAMP + NONCE (no separators)
  const payload = `${method.toUpperCase()}${url}${bodyStr}${timestamp}${nonce}`;

  try {
    const privateKeyBytes = Buffer.from(config.privateKey, 'hex');
    const payloadBytes = Buffer.from(payload, 'utf8');
    const signature = ed25519.sign(payloadBytes, privateKeyBytes);

    const headers: Record<string, string> = {
      'x-api-key': config.apiKey,
      'x-api-signature': Buffer.from(signature).toString('base64'), // BASE64 format
      'x-api-nonce': nonce,
      'x-api-timestamp': timestamp.toString(),
      'Accept': 'application/json'
    };
    
    // 🎯 Only add Content-Type for POST requests (not GET)
    if (method.toUpperCase() === 'POST') {
      headers['Content-Type'] = 'application/json';
    }
    
    // Add webhook URL only if available
    if (config.webhookUrl) {
      headers['x-webhook-url'] = config.webhookUrl;
    }

    return { url, headers };
  } catch (error) {
    throw new Error(`Failed to sign Guardian request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function sortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((res, k) => {
      res[k] = sortKeys(obj[k]);
      return res;
    }, {} as any);
  }
  return obj;
}
