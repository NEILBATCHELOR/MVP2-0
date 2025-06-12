import * as ed25519 from '@noble/ed25519';
import { keyVaultClient } from '../keyVault/keyVaultClient';
import type { GuardianConfig } from '@/types/guardian/guardian';

/**
 * Guardian Key Management Service
 * 
 * Manages Ed25519 keys for Guardian API integration
 * Provides secure storage options through existing keyVault infrastructure
 */
export class GuardianKeyManager {
  private static instance: GuardianKeyManager;

  private constructor() {}

  static getInstance(): GuardianKeyManager {
    if (!GuardianKeyManager.instance) {
      GuardianKeyManager.instance = new GuardianKeyManager();
    }
    return GuardianKeyManager.instance;
  }

  /**
   * Generate new Ed25519 key pair for Guardian API
   */
  async generateGuardianKeyPair(): Promise<{
    privateKeyHex: string;
    publicKeyHex: string;
    keyId?: string; // If stored in keyVault
  }> {
    try {
      // Generate Ed25519 key pair
      const privateKey = ed25519.utils.randomPrivateKey();
      const publicKey = await ed25519.getPublicKey(privateKey);

      // Convert to hex strings
      const privateKeyHex = Array.from(privateKey, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');
      
      const publicKeyHex = Array.from(publicKey, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');

      return {
        privateKeyHex,
        publicKeyHex
      };
    } catch (error) {
      throw new Error(`Failed to generate Guardian key pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store Guardian keys in keyVault (optional - for production)
   */
  async storeGuardianKeysInVault(
    privateKeyHex: string,
    credentials: any
  ): Promise<string> {
    try {
      await keyVaultClient.connect(credentials);
      
      // Store the private key in the vault
      const keyId = await keyVaultClient.storeKey(privateKeyHex);
      
      await keyVaultClient.disconnect();
      
      return keyId;
    } catch (error) {
      throw new Error(`Failed to store Guardian keys in vault: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve Guardian keys from keyVault
   */
  async getGuardianKeysFromVault(
    keyId: string,
    credentials: any
  ): Promise<{ privateKeyHex: string; publicKeyHex: string }> {
    try {
      await keyVaultClient.connect(credentials);
      
      const keyResult = await keyVaultClient.getKey(keyId);
      const privateKeyHex = typeof keyResult === 'string' ? keyResult : keyResult.privateKey;
      
      await keyVaultClient.disconnect();
      
      // Generate public key from private key
      const privateKeyBytes = new Uint8Array(
        privateKeyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      const publicKeyBytes = await ed25519.getPublicKey(privateKeyBytes);
      
      const publicKeyHex = Array.from(publicKeyBytes, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');

      return {
        privateKeyHex,
        publicKeyHex
      };
    } catch (error) {
      throw new Error(`Failed to retrieve Guardian keys from vault: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign data with Guardian Ed25519 key
   */
  async signWithGuardianKey(
    privateKeyHex: string,
    data: Uint8Array
  ): Promise<string> {
    try {
      const privateKeyBytes = new Uint8Array(
        privateKeyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      
      const signature = await ed25519.sign(data, privateKeyBytes);
      
      return Array.from(signature, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');
    } catch (error) {
      throw new Error(`Failed to sign with Guardian key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify Guardian Ed25519 signature
   */
  async verifyGuardianSignature(
    publicKeyHex: string,
    data: Uint8Array,
    signatureHex: string
  ): Promise<boolean> {
    try {
      const publicKeyBytes = new Uint8Array(
        publicKeyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      
      const signatureBytes = new Uint8Array(
        signatureHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      
      return await ed25519.verify(signatureBytes, data, publicKeyBytes);
    } catch (error) {
      console.error('Guardian signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get current Guardian configuration with security status
   */
  getCurrentConfig(): {
    configured: boolean;
    hasPrivateKey: boolean;
    hasApiKey: boolean;
    securityLevel: 'environment' | 'vault' | 'none';
  } {
    const hasEnvPrivateKey = Boolean(process.env.GUARDIAN_PRIVATE_KEY);
    const hasEnvApiKey = Boolean(process.env.GUARDIAN_API_KEY);
    
    return {
      configured: hasEnvPrivateKey && hasEnvApiKey,
      hasPrivateKey: hasEnvPrivateKey,
      hasApiKey: hasEnvApiKey,
      securityLevel: hasEnvPrivateKey ? 'environment' : 'none'
    };
  }

  /**
   * Generate environment variables content for .env.guardian
   */
  generateEnvContent(keys: {
    privateKeyHex: string;
    publicKeyHex: string;
    apiKey?: string;
    baseUrl?: string;
  }): string {
    return `# Guardian Medex API Environment Configuration
# Generated on ${new Date().toISOString()}

# Guardian API Configuration
GUARDIAN_API_BASE_URL=${keys.baseUrl || 'https://api.medex.guardian-dev.com'}
GUARDIAN_PRIVATE_KEY=${keys.privateKeyHex}
GUARDIAN_PUBLIC_KEY=${keys.publicKeyHex}
GUARDIAN_API_KEY=${keys.apiKey || 'your_api_key_from_guardian_labs'}

# Guardian Webhook Configuration (for production)
GUARDIAN_DEFAULT_WEBHOOK_URL=https://your-domain.com/api/guardian/webhooks
GUARDIAN_WEBHOOK_AUTH_KEY=your_webhook_auth_secret
GUARDIAN_EVENTS_HANDLER_URL=https://your-domain.com/api/guardian/events
`;
  }

  /**
   * Create email template for Guardian Labs with public key
   */
  generateGuardianLabsEmail(publicKeyHex: string): string {
    return `Subject: Guardian Medex API Integration - Public Key Submission

Hi Guardian Labs team,

Please find our Ed25519 public key for Guardian Medex API integration:

Public Key: ${publicKeyHex}

Additional Integration Details:
- Default Webhook URL: https://your-domain.com/api/guardian/webhooks
- Webhook Auth Key: your_webhook_auth_secret
- Events Handler URL: https://your-domain.com/api/guardian/events
- Development Environment: localhost (will use polling for development)

Please provide our API key once this public key is registered.

Best regards,
Chain Capital Development Team
`;
  }
}

export default GuardianKeyManager;
