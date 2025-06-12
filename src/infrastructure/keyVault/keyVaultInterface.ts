/**
 * KeyVault Interface Definitions
 * 
 * This file contains type definitions for the keyVaultClient service.
 */

/**
 * Interface for key data returned from the KeyVault
 */
export interface KeyData {
  privateKey: string;
  address: string;
}

/**
 * Return type for the getKey method
 * Can either return a string (privateKey only) or a KeyData object (privateKey and address)
 */
export type KeyResult = string | KeyData;

/**
 * Interface for key pair generation result
 */
export interface KeyPairResult {
  keyId: string;
  publicKey: string;
}

/**
 * Interface for key vault client
 */
export interface IKeyVaultClient {
  connect(credentials: any): Promise<void>;
  disconnect(): Promise<void>;
  getKey(keyId: string): Promise<KeyResult>;
  storeKey(key: string): Promise<string>;
  generateKeyPair(): Promise<KeyPairResult>;
  signData(keyId: string, data: string): Promise<string>;
  deleteKey(keyId: string): Promise<{ success: boolean }>;
  verifySignature(publicKey: string, data: string, signature: string): Promise<boolean>;
}