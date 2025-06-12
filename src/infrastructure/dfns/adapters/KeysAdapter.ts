/**
 * DFNS Keys Adapter - Cryptographic key management functionality
 * 
 * This adapter provides functionality for DFNS key operations including:
 * - Key creation and management
 * - Signature generation
 * - Key delegation
 * - Key import/export
 */

import type {
  DfnsResponse,
  DfnsPaginatedResponse,
  SigningKey,
  SignatureRequest,
  SignatureResponse,
  KeyCreationRequest,
  DfnsNetwork,
  DfnsCurve,
  DfnsScheme
} from '@/types/dfns';
import { DfnsApiClient } from '../client';
import { DFNS_ENDPOINTS } from '../config';
import { getCurveForNetwork, getSchemeForCurve } from '@/types/dfns';

// ===== Keys Adapter =====

export class DfnsKeysAdapter {
  private client: DfnsApiClient;

  constructor(client: DfnsApiClient) {
    this.client = client;
  }

  // ===== Key Management =====

  /**
   * Create a new signing key
   */
  async createKey(request: KeyCreationRequest): Promise<DfnsResponse<SigningKey>> {
    try {
      const curve = request.curve || getCurveForNetwork(request.network);
      const scheme = getSchemeForCurve(curve);

      const payload = {
        network: request.network,
        curve,
        scheme,
        name: request.name,
        externalId: request.externalId,
        tags: request.tags
      };

      const response = await this.client.post<any>(
        DFNS_ENDPOINTS.keys.create,
        payload
      );

      if (response.error) {
        return response;
      }

      const signingKey: SigningKey = {
        id: response.data.id,
        keyId: response.data.keyId,
        publicKey: response.data.publicKey,
        network: response.data.network,
        curve: response.data.curve,
        scheme: response.data.scheme,
        status: response.data.status || 'Active',
        delegated: response.data.delegated || false,
        delegatedTo: response.data.delegatedTo,
        externalId: response.data.externalId,
        tags: response.data.tags || [],
        imported: response.data.imported || false,
        exported: response.data.exported || false,
        dateExported: response.data.dateExported,
        createdAt: response.data.dateCreated || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        kind: 'success',
        data: signingKey
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'KEY_CREATION_FAILED',
          message: `Failed to create key: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Get key by ID
   */
  async getKey(keyId: string): Promise<DfnsResponse<SigningKey>> {
    try {
      const response = await this.client.get<any>(
        DFNS_ENDPOINTS.keys.get(keyId)
      );

      if (response.error) {
        return response;
      }

      const signingKey: SigningKey = {
        id: response.data.id,
        keyId: response.data.keyId,
        publicKey: response.data.publicKey,
        network: response.data.network,
        curve: response.data.curve,
        scheme: response.data.scheme,
        status: response.data.status,
        delegated: response.data.delegated,
        delegatedTo: response.data.delegatedTo,
        externalId: response.data.externalId,
        tags: response.data.tags || [],
        imported: response.data.imported,
        exported: response.data.exported,
        dateExported: response.data.dateExported,
        createdAt: response.data.dateCreated,
        updatedAt: response.data.dateModified || response.data.dateCreated
      };

      return {
        kind: 'success',
        data: signingKey
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'KEY_FETCH_FAILED',
          message: `Failed to fetch key: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * List keys with pagination
   */
  async listKeys(params?: {
    limit?: number;
    paginationToken?: string;
    network?: DfnsNetwork;
    status?: string;
    curve?: DfnsCurve;
  }): Promise<DfnsPaginatedResponse<SigningKey>> {
    try {
      const response = await this.client.get<{ items: any[]; nextPageToken?: string }>(
        DFNS_ENDPOINTS.keys.list,
        params
      );

      if (response.error) {
        return {
          kind: 'error',
          error: response.error,
          data: [],
          pagination: {}
        };
      }

      const keys = response.data!.items.map(item => ({
        id: item.id,
        keyId: item.keyId,
        publicKey: item.publicKey,
        network: item.network,
        curve: item.curve,
        scheme: item.scheme,
        status: item.status,
        delegated: item.delegated,
        delegatedTo: item.delegatedTo,
        externalId: item.externalId,
        tags: item.tags || [],
        imported: item.imported,
        exported: item.exported,
        dateExported: item.dateExported,
        createdAt: item.dateCreated,
        updatedAt: item.dateModified || item.dateCreated
      }));

      return {
        kind: 'success',
        data: keys,
        pagination: {
          nextPageToken: response.data!.nextPageToken,
          limit: params?.limit
        }
      } as DfnsPaginatedResponse<SigningKey>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'KEYS_LIST_FAILED',
          message: `Failed to list keys: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Update key
   */
  async updateKey(
    keyId: string,
    updates: {
      name?: string;
      tags?: string[];
    }
  ): Promise<DfnsResponse<SigningKey>> {
    try {
      const response = await this.client.put<any>(
        DFNS_ENDPOINTS.keys.update(keyId),
        updates
      );

      if (response.error) {
        return response;
      }

      const signingKey: SigningKey = {
        id: response.data.id,
        keyId: response.data.keyId,
        publicKey: response.data.publicKey,
        network: response.data.network,
        curve: response.data.curve,
        scheme: response.data.scheme,
        status: response.data.status,
        delegated: response.data.delegated,
        delegatedTo: response.data.delegatedTo,
        externalId: response.data.externalId,
        tags: response.data.tags || [],
        imported: response.data.imported,
        exported: response.data.exported,
        dateExported: response.data.dateExported,
        createdAt: response.data.dateCreated,
        updatedAt: response.data.dateModified || new Date().toISOString()
      };

      return {
        kind: 'success',
        data: signingKey
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'KEY_UPDATE_FAILED',
          message: `Failed to update key: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Delegate key to an end user
   */
  async delegateKey(
    keyId: string,
    userId: string
  ): Promise<DfnsResponse<SigningKey>> {
    try {
      const response = await this.client.post<any>(
        DFNS_ENDPOINTS.keys.delegate(keyId),
        { userId }
      );

      if (response.error) {
        return response;
      }

      const signingKey: SigningKey = {
        id: response.data.id,
        keyId: response.data.keyId,
        publicKey: response.data.publicKey,
        network: response.data.network,
        curve: response.data.curve,
        scheme: response.data.scheme,
        status: response.data.status,
        delegated: true,
        delegatedTo: userId,
        externalId: response.data.externalId,
        tags: response.data.tags || [],
        imported: response.data.imported,
        exported: response.data.exported,
        dateExported: response.data.dateExported,
        createdAt: response.data.dateCreated,
        updatedAt: new Date().toISOString()
      };

      return {
        kind: 'success',
        data: signingKey
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'KEY_DELEGATION_FAILED',
          message: `Failed to delegate key: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Signature Operations =====

  /**
   * Generate signature for a message
   */
  async generateSignature(
    keyId: string,
    request: SignatureRequest
  ): Promise<DfnsResponse<SignatureResponse>> {
    try {
      const payload = {
        message: request.message,
        externalId: request.externalId
      };

      const response = await this.client.post<any>(
        DFNS_ENDPOINTS.keys.sign(keyId),
        payload
      );

      if (response.error) {
        return response;
      }

      const signatureResponse: SignatureResponse = {
        id: response.data.id,
        status: response.data.status,
        signature: response.data.signature,
        publicKey: response.data.publicKey,
        dateCreated: response.data.dateCreated,
        dateCompleted: response.data.dateCompleted,
        description: request.description
      };

      return {
        kind: 'success',
        data: signatureResponse
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'SIGNATURE_GENERATION_FAILED',
          message: `Failed to generate signature: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Generate blockchain-specific signature
   */
  async generateBlockchainSignature(
    keyId: string,
    request: {
      kind: string; // 'Evm', 'Bitcoin', 'Solana', etc.
      message: string;
      externalId?: string;
    }
  ): Promise<DfnsResponse<SignatureResponse>> {
    try {
      const payload = {
        kind: request.kind,
        message: request.message,
        externalId: request.externalId
      };

      const response = await this.client.post<any>(
        DFNS_ENDPOINTS.keys.sign(keyId),
        payload
      );

      if (response.error) {
        return response;
      }

      const signatureResponse: SignatureResponse = {
        id: response.data.id,
        status: response.data.status,
        signature: response.data.signature,
        publicKey: response.data.publicKey,
        dateCreated: response.data.dateCreated,
        dateCompleted: response.data.dateCompleted
      };

      return {
        kind: 'success',
        data: signatureResponse
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'BLOCKCHAIN_SIGNATURE_FAILED',
          message: `Failed to generate blockchain signature: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Get signature request by ID
   */
  async getSignature(
    keyId: string,
    signatureId: string
  ): Promise<DfnsResponse<SignatureResponse>> {
    try {
      const response = await this.client.get<any>(
        `${DFNS_ENDPOINTS.keys.sign(keyId)}/${signatureId}`
      );

      if (response.error) {
        return response;
      }

      const signatureResponse: SignatureResponse = {
        id: response.data.id,
        status: response.data.status,
        signature: response.data.signature,
        publicKey: response.data.publicKey,
        dateCreated: response.data.dateCreated,
        dateCompleted: response.data.dateCompleted
      };

      return {
        kind: 'success',
        data: signatureResponse
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'SIGNATURE_FETCH_FAILED',
          message: `Failed to fetch signature: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * List signature requests for a key
   */
  async listSignatures(
    keyId: string,
    params?: {
      limit?: number;
      paginationToken?: string;
      status?: string;
    }
  ): Promise<DfnsPaginatedResponse<SignatureResponse>> {
    try {
      const response = await this.client.get<{ items: any[]; nextPageToken?: string }>(
        DFNS_ENDPOINTS.keys.sign(keyId),
        params
      );

      if (response.error) {
        return {
          kind: 'error',
          error: response.error,
          data: [],
          pagination: {}
        };
      }

      const signatures = response.data!.items.map(item => ({
        id: item.id,
        status: item.status,
        signature: item.signature,
        publicKey: item.publicKey,
        dateCreated: item.dateCreated,
        dateCompleted: item.dateCompleted
      }));

      return {
        kind: 'success',
        data: signatures,
        pagination: {
          nextPageToken: response.data!.nextPageToken,
          limit: params?.limit
        }
      } as DfnsPaginatedResponse<SignatureResponse>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'SIGNATURES_LIST_FAILED',
          message: `Failed to list signatures: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Advanced Operations =====

  /**
   * Export key (if supported)
   */
  async exportKey(keyId: string): Promise<DfnsResponse<{ exportedData: string }>> {
    try {
      const response = await this.client.post<any>(
        DFNS_ENDPOINTS.keys.export(keyId),
        {}
      );

      if (response.error) {
        return response;
      }

      return {
        kind: 'success',
        data: {
          exportedData: response.data.exportedData
        }
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'KEY_EXPORT_FAILED',
          message: `Failed to export key: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Import key
   */
  async importKey(
    network: DfnsNetwork,
    importData: {
      privateKey: string;
      curve?: DfnsCurve;
    },
    options?: {
      name?: string;
      externalId?: string;
      tags?: string[];
    }
  ): Promise<DfnsResponse<SigningKey>> {
    try {
      const curve = importData.curve || getCurveForNetwork(network);
      const scheme = getSchemeForCurve(curve);

      const payload = {
        network,
        curve,
        scheme,
        privateKey: importData.privateKey,
        ...options
      };

      const response = await this.client.post<any>(
        DFNS_ENDPOINTS.keys.import,
        payload
      );

      if (response.error) {
        return response;
      }

      const signingKey: SigningKey = {
        id: response.data.id,
        keyId: response.data.keyId,
        publicKey: response.data.publicKey,
        network: response.data.network,
        curve: response.data.curve,
        scheme: response.data.scheme,
        status: response.data.status || 'Active',
        delegated: response.data.delegated || false,
        delegatedTo: response.data.delegatedTo,
        externalId: response.data.externalId,
        tags: response.data.tags || [],
        imported: true,
        exported: false,
        createdAt: response.data.dateCreated || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        kind: 'success',
        data: signingKey
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'KEY_IMPORT_FAILED',
          message: `Failed to import key: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Utility Methods =====

  /**
   * Validate signature format for network
   */
  validateSignature(signature: string, network: DfnsNetwork): boolean {
    // Simplified validation - in reality would use proper signature validation
    const networkPatterns: Record<string, RegExp> = {
      'Ethereum': /^0x[a-fA-F0-9]{130}$/, // 65 bytes hex
      'Bitcoin': /^[a-fA-F0-9]{128,144}$/, // DER format
      'Solana': /^[a-fA-F0-9]{128}$/ // 64 bytes hex
    };

    const pattern = networkPatterns[network];
    return pattern ? pattern.test(signature) : true;
  }

  /**
   * Get recommended curve for network
   */
  getRecommendedCurve(network: DfnsNetwork): DfnsCurve {
    return getCurveForNetwork(network);
  }

  /**
   * Get supported signature schemes for curve
   */
  getSupportedSchemes(curve: DfnsCurve): DfnsScheme[] {
    switch (curve) {
      case 'ed25519':
        return ['EdDSA' as DfnsScheme];
      case 'secp256k1':
      case 'secp256r1':
        return ['ECDSA' as DfnsScheme];
      default:
        return ['ECDSA' as DfnsScheme];
    }
  }

  /**
   * Estimate signature time
   */
  async estimateSignatureTime(keyId: string): Promise<DfnsResponse<{ estimatedTimeMs: number }>> {
    try {
      // This would typically call an estimation endpoint
      // For now, return a mock estimation
      const mockEstimation = {
        estimatedTimeMs: 2000 // 2 seconds
      };

      return {
        kind: 'success',
        data: mockEstimation
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'SIGNATURE_TIME_ESTIMATION_FAILED',
          message: `Failed to estimate signature time: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Generate deterministic key derivation
   */
  async deriveKey(
    parentKeyId: string,
    derivationPath: string
  ): Promise<DfnsResponse<SigningKey>> {
    try {
      const payload = {
        parentKeyId,
        derivationPath
      };

      const response = await this.client.post<any>(
        '/keys/derive', // Assuming this endpoint exists
        payload
      );

      if (response.error) {
        return response;
      }

      const signingKey: SigningKey = {
        id: response.data.id,
        keyId: response.data.keyId,
        publicKey: response.data.publicKey,
        network: response.data.network,
        curve: response.data.curve,
        scheme: response.data.scheme,
        status: response.data.status || 'Active',
        delegated: response.data.delegated || false,
        delegatedTo: response.data.delegatedTo,
        externalId: response.data.externalId,
        tags: response.data.tags || [],
        imported: false,
        exported: false,
        createdAt: response.data.dateCreated || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        kind: 'success',
        data: signingKey
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'KEY_DERIVATION_FAILED',
          message: `Failed to derive key: ${(error as Error).message}`
        }
      };
    }
  }
}

// ===== Export =====

export default DfnsKeysAdapter;
